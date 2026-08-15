import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examAPI, submissionAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Save,
  Send,
  Timer,
  FileText,
  User,
  Award,
  CheckCircle,
  ShieldAlert,
  Maximize2,
  Shield
} from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';
import ActiveExamWatermark from '../components/ActiveExamWatermark';

const ExamAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [activeExamSession, setActiveExamSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examStep, setExamStep] = useState('instructions'); // 'instructions', 'active'
  const [agreedToRules, setAgreedToRules] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStartTime, setExamStartTime] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');

  const submittingRef = useRef(false);

  // Level 1 & Level 3 Proctoring State
  const [tabSwitches, setTabSwitches] = useState(0);
  const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);
  const [fullscreenViolations, setFullscreenViolations] = useState(0);
  const [multiMonitorDetected, setMultiMonitorDetected] = useState(false);
  const [audioViolations, setAudioViolations] = useState(0);
  const [devToolsAttempts, setDevToolsAttempts] = useState(0);
  const [faceVerified, setFaceVerified] = useState(true);

  // Synchronous Ref to prevent React async state batching lags during auto-submission
  const proctorLogsRef = useRef({
    tabSwitches: 0,
    copyPasteAttempts: 0,
    fullscreenViolations: 0,
    multiMonitorDetected: false,
    audioViolations: 0,
    devToolsAttempts: 0,
    faceVerified: true
  });

  // Helper for Fisher-Yates array shuffling
  const shuffleArray = (arr) => {
    if (!Array.isArray(arr)) return arr;
    const array = [...arr];
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  // Cross-browser Fullscreen Element Helper
  const getFullscreenElement = () => {
    return (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.webkitIsFullScreen ||
      document.mozFullScreenElement ||
      document.msFullscreenElement ||
      null
    );
  };

  const requestFullscreenMode = () => {
    const elem = document.documentElement;
    try {
      if (elem.requestFullscreen) {
        elem.requestFullscreen().catch(err => console.warn('Fullscreen request error:', err));
      } else if (elem.webkitRequestFullscreen) {
        elem.webkitRequestFullscreen();
      } else if (elem.mozRequestFullScreen) {
        elem.mozRequestFullScreen();
      } else if (elem.msRequestFullscreen) {
        elem.msRequestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen mode error:', e);
    }
  };

  // Fullscreen Change & Violation Monitor (Level 1)
  useEffect(() => {
    if (!exam || examStep !== 'active') return;

    let debounceTimer = null;

    const handleFullscreenChange = () => {
      if (submittingRef.current) return;

      const fsElement = getFullscreenElement();
      const isFsActive = Boolean(fsElement);

      if (!isFsActive) {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          setFullscreenViolations(prev => {
            const updated = prev + 1;
            proctorLogsRef.current.fullscreenViolations = updated;
            if (updated >= 3) {
              toast.error('❌ Security Termination: 3 Fullscreen violations reached. Auto-terminating exam NOW!', { autoClose: 7000 });
              terminatedTriggeredRef.current = true;
              handleSubmit(true);
            } else {
              toast.error(`🚨 Fullscreen Warning: Fullscreen mode exited! (Violation ${updated}/3)`, { autoClose: 5000 });
            }
            return updated;
          });
        }, 250);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [exam, examStep]);

  // Multi-Monitor Detector (Level 3)
  useEffect(() => {
    if (exam) {
      const checkScreenExtension = () => {
        if (window.screen && (window.screen.isExtended || (window.screen.availWidth && window.screen.availWidth > window.screen.width * 1.5))) {
          setMultiMonitorDetected(true);
          toast.warn('Proctor Warning: Extended display or multi-monitor setup detected!', { autoClose: 5000 });
        }
      };
      checkScreenExtension();
    }
  }, [exam]);

  // Audio / Speech Noise Monitor (Level 3)
  useEffect(() => {
    if (!exam) return;
    let audioCtx = null;
    let stream = null;
    let intervalId = null;

    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then(s => {
          stream = s;
          audioCtx = new (window.AudioContext || window.webkitAudioContext)();
          const analyser = audioCtx.createAnalyser();
          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);
          analyser.fftSize = 256;
          const dataArray = new Uint8Array(analyser.frequencyBinCount);

          let highVolCount = 0;
          intervalId = setInterval(() => {
            analyser.getByteFrequencyData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
            const avg = sum / dataArray.length;

            if (avg > 45) { // Sound volume threshold
              highVolCount++;
              if (highVolCount >= 3) {
                setAudioViolations(prev => prev + 1);
                toast.warn('Audio Warning: Background noise or speech detected!', { autoClose: 3500 });
                highVolCount = 0;
              }
            } else {
              highVolCount = Math.max(0, highVolCount - 1);
            }
          }, 1500);
        })
        .catch(err => {
          console.warn('Proctor audio monitor skipped (mic permission omitted):', err);
        });
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
      if (stream) stream.getTracks().forEach(t => t.stop());
      if (audioCtx) audioCtx.close();
    };
  }, [exam]);

  // DevTools Monitoring (Disabled debugger loop to prevent false positive terminations)
  useEffect(() => {
    if (!exam) return;
  }, [exam]);

  // Advanced Tab & Window Blur Switching Detection
  useEffect(() => {
    if (exam) {
      let lastSwitchTime = 0;

      const triggerViolation = (reason) => {
        if (submittingRef.current) return;
        const now = Date.now();
        if (now - lastSwitchTime < 1500) return; // Debounce 1.5s
        lastSwitchTime = now;

        setTabSwitches(prev => {
          const updated = prev + 1;
          proctorLogsRef.current.tabSwitches = updated;
          toast.warn(`Proctor Warning: ${reason}! (Violation ${updated}/3)`, { autoClose: 4000 });
          return updated;
        });
      };

      const handleVisibilityChange = () => {
        if (document.hidden) {
          triggerViolation('Tab switch detected');
        }
      };

      const handleWindowBlur = () => {
        triggerViolation('Window blur / App switch detected');
      };

      document.addEventListener('visibilitychange', handleVisibilityChange);
      window.addEventListener('blur', handleWindowBlur);

      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleWindowBlur);
      };
    }
  }, [exam]);

  // Advanced Anti-Extension & Anti-Copy Protection
  useEffect(() => {
    if (exam) {
      let lastToastTime = 0;

      const notifyViolation = (msg) => {
        const now = Date.now();
        if (now - lastToastTime > 1500) {
          toast.error(msg);
          lastToastTime = now;
        }
      };

      // Selection Wiper: Prevents text highlighting with mouse or keyboard
      const handleSelectionChange = () => {
        if (submittingRef.current) return;
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          selection.removeAllRanges();
        }
      };

      // Clipboard Hijack: Prevent copying and pasting exam content
      const handleCopyHijack = (e) => {
        if (submittingRef.current) return;
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();

        if (e.clipboardData) {
          e.clipboardData.setData(
            'text/plain',
            '[SECURITY VIOLATION]: Copying/Pasting exam content is strictly prohibited.'
          );
        }
        setCopyPasteAttempts(prev => prev + 1);
        notifyViolation('Copy/Paste attempt blocked & reported!');
        return false;
      };

      const handleKeyDown = (e) => {
        if (submittingRef.current) return;
        // Block PrintScreen / Screenshot attempts
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
          e.preventDefault();
          setCopyPasteAttempts(prev => prev + 1);
          notifyViolation('Screen capture and screenshots are strictly prohibited!');
        }

        // Block F12, Ctrl+P, Ctrl+U, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A, Ctrl+S, Ctrl+Shift+I/J/C
        const isCtrlOrMeta = e.ctrlKey || e.metaKey;
        const key = e.key ? e.key.toLowerCase() : '';

        if (
          e.key === 'F12' ||
          (isCtrlOrMeta && ['c', 'v', 'x', 'a', 'p', 'u', 's'].includes(key)) ||
          (isCtrlOrMeta && e.shiftKey && ['i', 'j', 'c'].includes(key))
        ) {
          e.preventDefault();
          setCopyPasteAttempts(prev => prev + 1);
          notifyViolation('Copy/Paste shortcuts & inspect tools are disabled during exams.');
        }
      };

      document.addEventListener('selectionchange', handleSelectionChange);
      window.addEventListener('copy', handleCopyHijack, true);
      window.addEventListener('cut', handleCopyHijack, true);
      window.addEventListener('paste', handleCopyHijack, true);
      window.addEventListener('keydown', handleKeyDown, true);

      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
        window.removeEventListener('copy', handleCopyHijack, true);
        window.removeEventListener('cut', handleCopyHijack, true);
        window.removeEventListener('paste', handleCopyHijack, true);
        window.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [exam]);



  const terminatedTriggeredRef = useRef(false);

  // Auto-Submit on Proctoring Violation Limit Exceeded
  useEffect(() => {
    if (exam && !terminatedTriggeredRef.current) {
      const isViolationLimitExceeded = (
        tabSwitches >= 3 ||
        fullscreenViolations >= 3 ||
        devToolsAttempts >= 2 ||
        copyPasteAttempts >= 5 ||
        audioViolations >= 5
      );

      if (isViolationLimitExceeded) {
        terminatedTriggeredRef.current = true;
        toast.error('Security Termination: Maximum proctoring violations exceeded. Exam auto-submitting...', { autoClose: 6000 });
        handleSubmit(true);
      }
    }
  }, [tabSwitches, fullscreenViolations, devToolsAttempts, copyPasteAttempts, audioViolations, exam]);

  const handleSubmit = async (isTerminated = false) => {
    const refLogs = proctorLogsRef.current;
    const currentTabSwitches = Math.max(tabSwitches, refLogs.tabSwitches);
    const currentFsViolations = Math.max(fullscreenViolations, refLogs.fullscreenViolations);
    const currentCopyPaste = Math.max(copyPasteAttempts, refLogs.copyPasteAttempts);
    const currentAudio = Math.max(audioViolations, refLogs.audioViolations);
    const currentDevTools = Math.max(devToolsAttempts, refLogs.devToolsAttempts);

    const isViolationLimitExceeded = (
      currentTabSwitches >= 3 ||
      currentFsViolations >= 3 ||
      currentDevTools >= 2 ||
      currentCopyPaste >= 5 ||
      currentAudio >= 5
    );

    const isTerminatedBool = isTerminated === true || isViolationLimitExceeded;
    if (submittingRef.current && !isTerminatedBool) return;
    submittingRef.current = true;
    setSubmitting(true);

    try {
      const endTime = new Date();

      // Warn if no answers selected (unless auto-terminated for cheating)
      if (!isTerminatedBool && Object.keys(answers).length === 0) {
        const confirmZero = window.confirm('You have not selected any answers. Are you sure you want to submit your exam now?');
        if (!confirmZero) {
          submittingRef.current = false;
          setSubmitting(false);
          return;
        }
      }

      // Validate exam start time
      const startTimeISO = examStartTime ? examStartTime.toISOString() : new Date().toISOString();

      // If terminated for cheating, ensure metrics reflect the minimum threshold (3)
      const finalTabSwitches = isTerminatedBool ? Math.max(3, currentTabSwitches) : currentTabSwitches;
      const finalFsViolations = isTerminatedBool ? Math.max(3, currentFsViolations) : currentFsViolations;

      const submissionData = {
        examId: exam._id,
        answers: Object.keys(answers).map(questionId => ({
          questionId: questionId,
          selectedOption: parseInt(answers[questionId])
        })),
        startTime: startTimeISO,
        endTime: endTime.toISOString(),
        proctorLogs: {
          tabSwitches: finalTabSwitches,
          copyPasteAttempts: currentCopyPaste,
          fullscreenViolations: finalFsViolations,
          multiMonitorDetected: multiMonitorDetected || refLogs.multiMonitorDetected,
          audioViolations: currentAudio,
          devToolsAttempts: currentDevTools,
          isTerminatedForCheating: isTerminatedBool,
          faceVerified
        }
      };

      console.log('Submitting exam with data:', submissionData);

      const response = await submissionAPI.submitExam(submissionData);
      console.log('Submission response:', response);

      // Clear saved data
      localStorage.removeItem(`exam_${id}_answers`);
      localStorage.removeItem(`exam_${id}_startTime`);

      if (isTerminatedBool) {
        toast.error('Exam terminated & submitted due to severe proctoring violations.');
      } else {
        toast.success('Exam submitted successfully!');
      }

      if (document.fullscreenElement) {
        try {
          await document.exitFullscreen();
        } catch (e) {
          // ignore
        }
      }
      navigate('/results');
    } catch (error) {
      console.error('Error submitting exam:', error);
      submittingRef.current = false;

      let errorMessage = 'Failed to submit exam. Please try again.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.errors) {
        errorMessage = error.response.data.errors.map(err => err.msg).join(', ');
      }

      toast.error(errorMessage);
      setSubmitting(false);
    }
  };

  const handleAutoSubmit = useCallback(async () => {
    await handleSubmit();
    toast.warning('Time is up! Your exam has been automatically submitted.');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch exam data
  useEffect(() => {
    fetchExam();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // Live Real-Time Timer Countdown Effect
  useEffect(() => {
    if (exam && examStartTime) {
      const updateTimer = () => {
        const durationSeconds = (exam.duration || 60) * 60; // Exam duration in seconds
        const now = new Date();
        const start = new Date(examStartTime);
        const elapsedSeconds = Math.floor((now - start) / 1000);
        const remaining = Math.max(0, durationSeconds - elapsedSeconds);

        setTimeRemaining(remaining);

        if (remaining <= 0) {
          handleAutoSubmit();
        }
      };

      updateTimer();
      const timer = setInterval(updateTimer, 1000);
      return () => clearInterval(timer);
    }
  }, [exam, examStartTime, handleAutoSubmit]);

  // Auto-save answers to localStorage
  useEffect(() => {
    if (Object.keys(answers).length > 0 && exam) {
      setAutoSaveStatus('saving');
      const saveTimer = setTimeout(() => {
        localStorage.setItem(`exam_${id}_answers`, JSON.stringify(answers));
        setAutoSaveStatus('saved');
      }, 800);

      return () => clearTimeout(saveTimer);
    }
  }, [answers, id, exam]);

  // Allow opening new tabs but warn on page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const message = 'Your exam is in progress. Your answers are auto-saved.';
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const fetchExam = async () => {
    try {
      setLoading(true);
      const response = await examAPI.getExam(id);
      const examData = response.data.exam;

      if (response.data.activeExamSession) {
        setActiveExamSession(response.data.activeExamSession);
      }

      // Check if exam is active
      const now = new Date();
      const startTime = new Date(examData.startDate);
      const endTime = new Date(examData.endDate);

      if (now < startTime) {
        setError('This exam has not started yet.');
        return;
      }

      if (now > endTime) {
        setError('This exam has already ended.');
        return;
      }

      // Shuffle questions and options per student session (Level 1 Anti-Cheat)
      if (examData.questions && Array.isArray(examData.questions)) {
        const shuffledQuestions = shuffleArray(examData.questions).map(q => ({
          ...q,
          options: shuffleArray(q.options.map((opt, idx) => (typeof opt === 'object' ? { ...opt, originalIndex: idx } : { text: opt, originalIndex: idx })))
        }));
        examData.questions = shuffledQuestions;
      }

      setExam(examData);

      // Initialize timer
      const duration = examData.duration * 60; // Convert minutes to seconds
      const savedStartTime = localStorage.getItem(`exam_${id}_startTime`);

      if (savedStartTime) {
        // Resume existing attempt
        const startTime = new Date(savedStartTime);
        const elapsed = Math.floor((now - startTime) / 1000);
        const remaining = Math.max(0, duration - elapsed);
        setTimeRemaining(remaining);
        setExamStartTime(startTime);
        setExamStep('active');
      } else {
        // New attempt: show instructions screen first
        setTimeRemaining(duration);
        setExamStep('instructions');
      }

      // Load saved answers
      const savedAnswers = localStorage.getItem(`exam_${id}_answers`);
      if (savedAnswers) {
        setAnswers(JSON.parse(savedAnswers));
      }
    } catch (error) {
      console.error('Error fetching exam:', error);
      setError('Failed to load exam. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId, optionIndex) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < exam.questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleQuestionNavigation = (index) => {
    setCurrentQuestionIndex(index);
  };



  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAnsweredCount = () => {
    return Object.keys(answers).length;
  };

  if (loading) {
    return <LoadingSpinner text="Loading exam..." />;
  }

  if (error) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem'
      }}>
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.5rem',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          padding: '2rem',
          textAlign: 'center',
          maxWidth: '400px'
        }}>
          <AlertTriangle style={{
            width: '3rem',
            height: '3rem',
            color: '#dc2626',
            margin: '0 auto 1rem'
          }} />
          <h2 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '1rem'
          }}>
            Cannot Start Exam
          </h2>
          <p style={{
            color: '#6b7280',
            marginBottom: '2rem'
          }}>
            {error}
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              border: 'none',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (!exam) return null;

  const startActualExam = () => {
    if (!agreedToRules) {
      toast.error('Please accept the exam guidelines and agreement before starting.');
      return;
    }
    const startTime = new Date();
    setExamStartTime(startTime);
    setTimeRemaining((exam.duration || 60) * 60);
    localStorage.setItem(`exam_${id}_startTime`, startTime.toISOString());
    requestFullscreenMode();
    setExamStep('active');
  };

  // Pre-Exam Instructions & Guidelines Screen
  if (examStep === 'instructions') {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '40px 20px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          maxWidth: '800px',
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.08)',
          border: '1px solid #e2e8f0',
          padding: '36px',
          overflow: 'hidden'
        }}>
          {/* Header */}
          <div style={{
            borderBottom: '2px solid #f1f5f9',
            paddingBottom: '20px',
            marginBottom: '24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            gap: '16px'
          }}>
            <div>
              <span style={{
                backgroundColor: '#e0e7ff',
                color: '#3730a3',
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '4px 12px',
                borderRadius: '9999px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Pre-Exam Instructions
              </span>
              <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: '#0f172a', margin: '8px 0 4px' }}>
                {exam.title}
              </h1>
              <p style={{ color: '#64748b', margin: 0, fontSize: '0.95rem' }}>
                Subject: <strong>{exam.subject}</strong> {exam.institution ? `• ${exam.institution}` : ''}
              </p>
            </div>

            <button
              onClick={() => navigate('/dashboard')}
              style={{
                backgroundColor: '#f1f5f9',
                color: '#475569',
                border: '1px solid #cbd5e1',
                padding: '8px 16px',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft style={{ width: '16px', height: '16px' }} /> Cancel & Back
            </button>
          </div>

          {/* Exam Quick Specs Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '16px',
            marginBottom: '28px'
          }}>
            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <Timer style={{ width: '22px', height: '22px', color: '#2563eb', margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Duration</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{exam.duration} Minutes</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <FileText style={{ width: '22px', height: '22px', color: '#059669', margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Questions</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{exam.questions.length} MCQs</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <Award style={{ width: '22px', height: '22px', color: '#7c3aed', margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Total Marks</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{exam.totalMarks || exam.questions.length} Marks</div>
            </div>

            <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '12px', border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <CheckCircle style={{ width: '22px', height: '22px', color: '#d97706', margin: '0 auto 6px' }} />
              <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Passing Criteria</div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0f172a', marginTop: '2px' }}>{exam.passingMarks || 40}%</div>
            </div>
          </div>

          {/* Instructions List */}
          <div style={{ marginBottom: '28px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0f172a', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldAlert style={{ width: '20px', height: '20px', color: '#2563eb' }} /> Important Exam Rules & Anti-Cheating Guidelines
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: '#eff6ff', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bfdbfe' }}>
                <CheckCircle style={{ width: '18px', height: '18px', color: '#2563eb', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.9rem', color: '#1e3a8a', lineHeight: '1.4' }}>
                  <strong>Timer & Auto-Submit:</strong> The examination timer starts immediately once you click "I Understand & Start Exam". The system automatically submits your answers when the timer reaches zero.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: '#fef2f2', padding: '12px 16px', borderRadius: '10px', border: '1px solid #fecaca' }}>
                <AlertTriangle style={{ width: '18px', height: '18px', color: '#dc2626', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.9rem', color: '#991b1b', lineHeight: '1.4' }}>
                  <strong>Proctoring Enforcement:</strong> Fullscreen mode is required. Switching tabs, minimizing windows, text copying, developer tools, or multi-monitor extension will trigger proctoring violations and auto-terminate your attempt.
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: '#f0fdf4', padding: '12px 16px', borderRadius: '10px', border: '1px solid #bbf7d0' }}>
                <CheckCircle style={{ width: '18px', height: '18px', color: '#166534', flexShrink: 0, marginTop: '2px' }} />
                <div style={{ fontSize: '0.9rem', color: '#14532d', lineHeight: '1.4' }}>
                  <strong>Auto-Saving Progress:</strong> Your selected answers are continuously auto-saved. You can navigate back and forth between questions using the Question Palette or Next/Previous buttons.
                </div>
              </div>
            </div>
          </div>

          {/* Student Declaration & Start Button */}
          <div style={{ borderTop: '2px solid #f1f5f9', paddingTop: '24px' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              cursor: 'pointer',
              fontSize: '0.925rem',
              color: '#334155',
              fontWeight: 600,
              marginBottom: '20px',
              backgroundColor: '#f8fafc',
              padding: '12px 16px',
              borderRadius: '10px',
              border: '1px solid #e2e8f0'
            }}>
              <input
                type="checkbox"
                checked={agreedToRules}
                onChange={(e) => setAgreedToRules(e.target.checked)}
                style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: '#2563eb' }}
              />
              <span>I have read all instructions and agree to abide by the proctoring guidelines.</span>
            </label>

            <button
              onClick={startActualExam}
              disabled={!agreedToRules}
              style={{
                width: '100%',
                backgroundColor: agreedToRules ? '#059669' : '#94a3b8',
                color: '#ffffff',
                border: 'none',
                padding: '16px',
                borderRadius: '10px',
                fontWeight: 800,
                fontSize: '1.1rem',
                cursor: agreedToRules ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '10px',
                boxShadow: agreedToRules ? '0 4px 14px rgba(5, 150, 105, 0.3)' : 'none',
                transition: 'all 0.2s'
              }}
            >
              <Send style={{ width: '20px', height: '20px' }} /> I Understand & Start Exam
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

  return (
    <div
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onSelectStart={(e) => e.preventDefault()}
      onDragStart={(e) => e.preventDefault()}
      style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Header */}
      <div style={{
        backgroundColor: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        padding: '1rem 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 50
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <h1 style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '0.25rem'
            }}>
              {exam.title}
            </h1>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <FileText style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                {exam.subject}
              </span>
              <span style={{ display: 'flex', alignItems: 'center' }}>
                <User style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
                {user?.name}
              </span>
            </div>
          </div>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            {/* Header Tab Switches Counter Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: tabSwitches >= 3 ? '#fee2e2' : tabSwitches > 0 ? '#fef3c7' : '#f8fafc',
              color: tabSwitches >= 3 ? '#dc2626' : tabSwitches > 0 ? '#92400e' : '#475569',
              padding: '0.35rem 0.65rem',
              borderRadius: '0.375rem',
              fontSize: '0.78rem',
              fontWeight: '700',
              border: `1px solid ${tabSwitches >= 3 ? '#fecaca' : tabSwitches > 0 ? '#fde68a' : '#e2e8f0'}`
            }}>
              <AlertTriangle style={{ width: '0.85rem', height: '0.85rem', marginRight: '0.3rem', color: tabSwitches > 0 ? 'inherit' : '#94a3b8' }} />
              Tab Switches: {tabSwitches}/3
            </div>

            {/* Header Fullscreen Exits Counter Badge */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: fullscreenViolations >= 3 ? '#fee2e2' : fullscreenViolations > 0 ? '#fef3c7' : '#f8fafc',
              color: fullscreenViolations >= 3 ? '#dc2626' : fullscreenViolations > 0 ? '#92400e' : '#475569',
              padding: '0.35rem 0.65rem',
              borderRadius: '0.375rem',
              fontSize: '0.78rem',
              fontWeight: '700',
              border: `1px solid ${fullscreenViolations >= 3 ? '#fecaca' : fullscreenViolations > 0 ? '#fde68a' : '#e2e8f0'}`
            }}>
              <Maximize2 style={{ width: '0.85rem', height: '0.85rem', marginRight: '0.3rem', color: fullscreenViolations > 0 ? 'inherit' : '#94a3b8' }} />
              Fullscreen Exits: {fullscreenViolations}/3
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              <Save style={{ width: '1rem', height: '1rem', marginRight: '0.25rem' }} />
              {autoSaveStatus === 'saving' ? 'Saving...' : 'Auto-saved'}
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: timeRemaining < 300 ? '#fee2e2' : '#f0f9ff',
              color: timeRemaining < 300 ? '#dc2626' : '#0369a1',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              fontSize: '1.125rem',
              fontWeight: 'bold'
            }}>
              <Timer style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
              {formatTime(timeRemaining)}
            </div>
          </div>
        </div>
      </div>

      <div className="exam-question-layout" style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '1rem',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '1.5rem'
      }}>
        {/* Main Content */}
        <div>
          {/* Progress Bar */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '1rem'
            }}>
              <span style={{
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151'
              }}>
                Question {currentQuestionIndex + 1} of {exam.questions.length}
              </span>
              <span style={{
                fontSize: '0.875rem',
                color: '#6b7280'
              }}>
                {getAnsweredCount()} answered
              </span>
            </div>
            <div style={{
              width: '100%',
              backgroundColor: '#e5e7eb',
              borderRadius: '9999px',
              height: '0.5rem'
            }}>
              <div style={{
                width: `${progress}%`,
                backgroundColor: '#3b82f6',
                borderRadius: '9999px',
                height: '100%',
                transition: 'width 0.3s ease'
              }} />
            </div>
          </div>

          {/* Machine-Readable Active Exam Watermark Container */}
          <ActiveExamWatermark
            isExamActive={activeExamSession?.isExamActive !== false}
            examCode={activeExamSession?.examCode || exam?.examCode || 'EXAM-ACTIVE'}
            sessionToken={activeExamSession?.sessionToken || 'SESS-ACTIVE'}
            examTitle={exam?.title || 'Active Examination'}
            subject={exam?.subject || ''}
          >
            {/* Question Card */}
            <div className="question-card-container">
              <div style={{
                marginBottom: '2rem'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: '1rem'
                }}>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: '600',
                    color: '#1f2937',
                    lineHeight: '1.6'
                  }}>
                    {currentQuestion.question}
                  </h2>
                  <span style={{
                    backgroundColor: '#f3f4f6',
                    color: '#374151',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.75rem',
                    fontWeight: '500'
                  }}>
                    {currentQuestion.marks || 1} {(currentQuestion.marks || 1) === 1 ? 'mark' : 'marks'}
                  </span>
                </div>
              </div>

              <div style={{ marginBottom: '2rem' }}>
                {currentQuestion.options.map((option, index) => {
                  const optIndex = option.originalIndex !== undefined ? option.originalIndex : index;
                  const isSelected = answers[currentQuestion._id] === optIndex;
                  return (
                    <label
                      key={index}
                      style={{
                        display: 'block',
                        padding: '1rem',
                        border: '2px solid',
                        borderColor: isSelected ? '#3b82f6' : '#e5e7eb',
                        borderRadius: '0.5rem',
                        marginBottom: '0.75rem',
                        cursor: 'pointer',
                        backgroundColor: isSelected ? '#eff6ff' : '#ffffff',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={(e) => {
                        if (!isSelected) {
                          e.target.style.borderColor = '#d1d5db';
                          e.target.style.backgroundColor = '#f9fafb';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isSelected) {
                          e.target.style.borderColor = '#e5e7eb';
                          e.target.style.backgroundColor = '#ffffff';
                        }
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center'
                      }}>
                        <input
                          type="radio"
                          name={currentQuestion._id}
                          value={optIndex}
                          checked={isSelected}
                          onChange={() => handleAnswerChange(currentQuestion._id, optIndex)}
                          style={{
                            marginRight: '0.75rem',
                            width: '1.25rem',
                            height: '1.25rem'
                          }}
                        />
                        <span style={{
                          fontSize: '1rem',
                          color: '#374151',
                          lineHeight: '1.5'
                        }}>
                          {option.text || option}
                        </span>
                      </div>
                    </label>
                  );
                })}
              </div>

              {/* Navigation Buttons */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <button
                  onClick={handlePreviousQuestion}
                  disabled={currentQuestionIndex === 0}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: currentQuestionIndex === 0 ? '#f3f4f6' : '#6b7280',
                    color: currentQuestionIndex === 0 ? '#9ca3af' : '#ffffff',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: currentQuestionIndex === 0 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <ArrowLeft style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  Previous
                </button>

                <button
                  onClick={handleNextQuestion}
                  disabled={currentQuestionIndex === exam.questions.length - 1}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    backgroundColor: currentQuestionIndex === exam.questions.length - 1 ? '#f3f4f6' : '#3b82f6',
                    color: currentQuestionIndex === exam.questions.length - 1 ? '#9ca3af' : '#ffffff',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: currentQuestionIndex === exam.questions.length - 1 ? 'not-allowed' : 'pointer',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  Next
                  <ArrowRight style={{ width: '1rem', height: '1rem', marginLeft: '0.5rem' }} />
                </button>
              </div>
            </div>
          </ActiveExamWatermark>
        </div>

        {/* Sidebar */}
        <div>
          {/* Question Navigation */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Questions
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(5, 1fr)',
              gap: '0.5rem'
            }}>
              {exam.questions.map((_, index) => (
                <button
                  key={index}
                  onClick={() => handleQuestionNavigation(index)}
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '0.375rem',
                    border: '2px solid',
                    borderColor: index === currentQuestionIndex ? '#3b82f6' :
                      answers[exam.questions[index]._id] !== undefined ? '#059669' : '#e5e7eb',
                    backgroundColor: index === currentQuestionIndex ? '#3b82f6' :
                      answers[exam.questions[index]._id] !== undefined ? '#059669' : '#ffffff',
                    color: index === currentQuestionIndex || answers[exam.questions[index]._id] !== undefined ?
                      '#ffffff' : '#6b7280',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {index + 1}
                </button>
              ))}
            </div>
            <div style={{
              marginTop: '1rem',
              fontSize: '0.75rem',
              color: '#6b7280'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div style={{
                  width: '0.75rem',
                  height: '0.75rem',
                  backgroundColor: '#059669',
                  borderRadius: '0.25rem',
                  marginRight: '0.5rem'
                }} />
                Answered
              </div>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.25rem' }}>
                <div style={{
                  width: '0.75rem',
                  height: '0.75rem',
                  backgroundColor: '#3b82f6',
                  borderRadius: '0.25rem',
                  marginRight: '0.5rem'
                }} />
                Current
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{
                  width: '0.75rem',
                  height: '0.75rem',
                  backgroundColor: '#e5e7eb',
                  borderRadius: '0.25rem',
                  marginRight: '0.5rem'
                }} />
                Not answered
              </div>
            </div>
          </div>

          {/* Submit Section */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem'
          }}>
            <h3 style={{
              fontSize: '1.125rem',
              fontWeight: '600',
              color: '#1f2937',
              marginBottom: '1rem'
            }}>
              Exam Summary
            </h3>
            <div style={{
              marginBottom: '1rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              <div style={{ marginBottom: '0.5rem' }}>
                Total Questions: {exam.questions.length}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                Answered: {getAnsweredCount()}
              </div>
              <div>
                Remaining: {exam.questions.length - getAnsweredCount()}
              </div>
            </div>

            <button
              onClick={() => setShowSubmitConfirm(true)}
              disabled={submitting}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#059669',
                color: '#ffffff',
                padding: '0.75rem',
                borderRadius: '0.375rem',
                border: 'none',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '0.875rem',
                fontWeight: '500',
                opacity: submitting ? 0.6 : 1
              }}
            >
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  Submit Exam
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Modal */}
      {showSubmitConfirm && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.25)',
            padding: '2rem',
            maxWidth: '400px',
            width: '90%'
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '1.5rem'
            }}>
              <AlertTriangle style={{
                width: '3rem',
                height: '3rem',
                color: '#f59e0b',
                margin: '0 auto 1rem'
              }} />
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '0.5rem'
              }}>
                Submit Exam?
              </h3>
              <p style={{
                color: '#6b7280',
                fontSize: '0.875rem'
              }}>
                Are you sure you want to submit your exam? You have answered {getAnsweredCount()} out of {exam.questions.length} questions. This action cannot be undone.
              </p>
            </div>

            <div style={{
              display: 'flex',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => setShowSubmitConfirm(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleSubmit(false)}
                disabled={submitting}
                style={{
                  flex: 1,
                  backgroundColor: '#059669',
                  color: '#ffffff',
                  padding: '0.75rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  opacity: submitting ? 0.6 : 1
                }}
              >
                {submitting ? 'Submitting...' : 'Yes, Submit'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Mode Re-entry Overlay Modal - Modern Clean Redesign */}
      {examStep === 'active' && !getFullscreenElement() && !submitting && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(30, 41, 59, 0.82)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '2.5rem 2.25rem 1.75rem 2.25rem',
            borderRadius: '1.25rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            maxWidth: '560px',
            width: '100%',
            textAlign: 'center',
            border: '1px solid #e2e8f0',
            animation: 'fadeIn 0.2s ease-out'
          }}>
            {/* Top Red-Tinted Icon Badge */}
            <div style={{
              width: '90px',
              height: '90px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="13" rx="2" />
                <path d="M8 21h8" />
                <path d="M12 16v5" />
                <circle cx="18" cy="15" r="3.5" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.8" />
                <path d="M18 13.4v1.8" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                <circle cx="18" cy="16.4" r="0.4" fill="#ef4444" stroke="none" />
              </svg>
            </div>

            {/* Title */}
            <h2 style={{
              fontSize: '1.75rem',
              fontWeight: '700',
              color: '#0f172a',
              margin: '0 0 0.5rem 0',
              letterSpacing: '-0.02em'
            }}>
              Fullscreen Mode Required
            </h2>

            {/* Accent Line */}
            <div style={{
              width: '28px',
              height: '3px',
              backgroundColor: '#2563eb',
              borderRadius: '2px',
              margin: '0.2rem auto 1.25rem auto'
            }} />

            {/* Subtitle / Paragraph */}
            <p style={{
              color: '#475569',
              fontSize: '0.925rem',
              lineHeight: '1.55',
              margin: '0 auto 1.75rem auto',
              maxWidth: '460px',
              fontWeight: '400'
            }}>
              You have exited full-screen mode or window focus.<br />
              Exiting full-screen mode registers an automatic proctoring violation.<br />
              Return to full-screen immediately to continue your exam.
            </p>

            {/* Primary Blue Button */}
            <button
              onClick={requestFullscreenMode}
              style={{
                width: '100%',
                backgroundColor: '#1d4ed8',
                color: '#ffffff',
                border: 'none',
                padding: '0.85rem 1.5rem',
                borderRadius: '0.6rem',
                fontWeight: '600',
                fontSize: '0.975rem',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(29, 78, 216, 0.25)',
                transition: 'all 0.15s ease-in-out',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#1e40af';
                e.currentTarget.style.boxShadow = '0 6px 16px rgba(29, 78, 216, 0.35)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#1d4ed8';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(29, 78, 216, 0.25)';
              }}
            >
              <Maximize2 size={18} />
              <span>Return to Fullscreen Mode</span>
            </button>

            {/* Footer Divider & Mandatory Notice */}
            <div style={{
              marginTop: '1.75rem',
              paddingTop: '1rem',
              borderTop: '1px solid #f1f5f9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.4rem',
              fontSize: '0.8rem',
              color: '#64748b'
            }}>
              <Shield size={15} style={{ color: '#2563eb' }} />
              <span>This action is mandatory to ensure a fair and secure examination environment.</span>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ExamAttempt;