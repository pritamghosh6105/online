import React, { useState, useEffect, useCallback } from 'react';
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
  User
} from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const ExamAttempt = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [exam, setExam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [examStep, setExamStep] = useState('active'); // 'instructions', 'face-verify', 'active'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStartTime, setExamStartTime] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');

  // Level 1 & Level 3 Proctoring State
  const [tabSwitches, setTabSwitches] = useState(0);
  const [copyPasteAttempts, setCopyPasteAttempts] = useState(0);
  const [fullscreenViolations, setFullscreenViolations] = useState(0);
  const [multiMonitorDetected, setMultiMonitorDetected] = useState(false);
  const [audioViolations, setAudioViolations] = useState(0);
  const [devToolsAttempts, setDevToolsAttempts] = useState(0);
  const [faceVerified, setFaceVerified] = useState(true);

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

  const requestFullscreenMode = () => {
    const elem = document.documentElement;
    if (elem.requestFullscreen) {
      elem.requestFullscreen().catch(err => console.warn('Fullscreen request error:', err));
    }
  };

  // Fullscreen Change Monitor (Level 1)
  useEffect(() => {
    if (exam) {
      const handleFullscreenChange = () => {
        if (!document.fullscreenElement) {
          setFullscreenViolations(prev => {
            const updated = prev + 1;
            toast.warn(`⚠️ Fullscreen Warning: Fullscreen mode exited! (Violation ${updated}/3)`, { autoClose: 4000 });
            return updated;
          });
        }
      };

      document.addEventListener('fullscreenchange', handleFullscreenChange);
      return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }
  }, [exam]);

  // Multi-Monitor Detector (Level 3)
  useEffect(() => {
    if (exam) {
      const checkScreenExtension = () => {
        if (window.screen && (window.screen.isExtended || (window.screen.availWidth && window.screen.availWidth > window.screen.width * 1.5))) {
          setMultiMonitorDetected(true);
          toast.warn('⚠️ Proctor Warning: Extended display or multi-monitor setup detected!', { autoClose: 5000 });
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
                toast.warn('⚠️ Audio Warning: Background noise or speech detected!', { autoClose: 3500 });
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

  // DevTools Debugger Detector (Level 3)
  useEffect(() => {
    if (!exam) return;
    const devToolsTimer = setInterval(() => {
      const startTime = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const endTime = performance.now();
      if (endTime - startTime > 100) {
        setDevToolsAttempts(prev => {
          const updated = prev + 1;
          toast.error('🚫 Security Action: Developer Tools inspection detected!', { autoClose: 5000 });
          return updated;
        });
      }
    }, 3000);
    return () => clearInterval(devToolsTimer);
  }, [exam]);

  // Advanced Tab & Window Blur Switching Detection
  useEffect(() => {
    if (exam) {
      let lastSwitchTime = 0;

      const triggerViolation = (reason) => {
        const now = Date.now();
        if (now - lastSwitchTime < 1500) return; // Debounce 1.5s
        lastSwitchTime = now;

        setTabSwitches(prev => {
          const updated = prev + 1;
          toast.warn(`⚠️ Proctor Warning: ${reason}! (Violation ${updated}/3)`, { autoClose: 4000 });
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

      // 1. Selection Wiper: Immediately un-highlight any text (bypasses extension user-select CSS overrides)
      const handleSelectionChange = () => {
        const selection = window.getSelection();
        if (selection && selection.toString().trim().length > 0) {
          selection.removeAllRanges();
          setCopyPasteAttempts(prev => prev + 1);
          notifyViolation('🚫 Text selection is prohibited during proctored exams!');
        }
      };

      // 2. Clipboard Poisoning: If extension bypasses JS copy handlers, overwrite copied content
      const handleCopyHijack = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        
        if (e.clipboardData) {
          e.clipboardData.setData(
            'text/plain',
            '[SECURITY VIOLATION]: Question text copying is prohibited during proctored exams.'
          );
        }
        setCopyPasteAttempts(prev => prev + 1);
        notifyViolation('🚫 Copy attempt blocked & reported!');
        return false;
      };

      // 3. Capturing Phase Event Blockers (useCapture = true) - executes BEFORE extension content scripts
      const blockEventCapture = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        notifyViolation('🚫 Right-clicking and context menus are disabled during exams.');
        return false;
      };

      const handleKeyDown = (e) => {
        // Block PrintScreen / Screenshot attempts
        if (e.key === 'PrintScreen' || e.keyCode === 44) {
          e.preventDefault();
          setCopyPasteAttempts(prev => prev + 1);
          notifyViolation('🚫 Screen capture and screenshots are strictly prohibited!');
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
          notifyViolation('🚫 Security Action: Keyboard shortcuts & inspect tools are disabled.');
        }
      };

      document.addEventListener('selectionchange', handleSelectionChange);
      window.addEventListener('copy', handleCopyHijack, true);
      window.addEventListener('cut', handleCopyHijack, true);
      window.addEventListener('paste', handleCopyHijack, true);
      window.addEventListener('contextmenu', blockEventCapture, true);
      window.addEventListener('selectstart', blockEventCapture, true);
      window.addEventListener('keydown', handleKeyDown, true);

      return () => {
        document.removeEventListener('selectionchange', handleSelectionChange);
        window.removeEventListener('copy', handleCopyHijack, true);
        window.removeEventListener('cut', handleCopyHijack, true);
        window.removeEventListener('paste', handleCopyHijack, true);
        window.removeEventListener('contextmenu', blockEventCapture, true);
        window.removeEventListener('selectstart', blockEventCapture, true);
        window.removeEventListener('keydown', handleKeyDown, true);
      };
    }
  }, [exam]);



  // Auto-Submit on Proctoring Violation Limit Exceeded
  useEffect(() => {
    if (exam && !submitting) {
      if (tabSwitches >= 3 || fullscreenViolations >= 3 || devToolsAttempts >= 2) {
        toast.error('🚫 Security Termination: Maximum proctoring violations exceeded. Exam auto-submitting...', { autoClose: 6000 });
        handleSubmit(true);
      }
    }
  }, [tabSwitches, fullscreenViolations, devToolsAttempts, exam, submitting]);

  const handleSubmit = async (isTerminated = false) => {
    try {
      setSubmitting(true);
      
      const endTime = new Date();
      
      // Validate that we have answers (unless auto-terminated for cheating)
      if (!isTerminated && Object.keys(answers).length === 0) {
        toast.error('Please answer at least one question before submitting.');
        setSubmitting(false);
        return;
      }

      // Validate exam start time
      const startTimeISO = examStartTime ? examStartTime.toISOString() : new Date().toISOString();

      const submissionData = {
        examId: exam._id,
        answers: Object.keys(answers).map(questionId => ({
          questionId: questionId,
          selectedOption: parseInt(answers[questionId])
        })),
        startTime: startTimeISO,
        endTime: endTime.toISOString(),
        proctorLogs: {
          tabSwitches,
          copyPasteAttempts,
          fullscreenViolations,
          multiMonitorDetected,
          audioViolations,
          devToolsAttempts,
          isTerminatedForCheating: Boolean(isTerminated),
          faceVerified
        }
      };

      console.log('Submitting exam with data:', submissionData);
      
      const response = await submissionAPI.submitExam(submissionData);
      console.log('Submission response:', response);
      
      // Clear saved data
      localStorage.removeItem(`exam_${id}_answers`);
      localStorage.removeItem(`exam_${id}_startTime`);
      
      if (isTerminated) {
        toast.error('🚫 Exam terminated & submitted due to severe proctoring violations.');
      } else {
        toast.success('Exam submitted successfully!');
      }
      navigate('/results');
    } catch (error) {
      console.error('Error submitting exam:', error);
      
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
      } else {
        // Start new attempt
        const startTime = new Date();
        setExamStartTime(startTime);
        setTimeRemaining(duration);
        localStorage.setItem(`exam_${id}_startTime`, startTime.toISOString());
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

  const currentQuestion = exam.questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / exam.questions.length) * 100;

  return (
    <div
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onPaste={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
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
            {tabSwitches > 0 && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                backgroundColor: tabSwitches >= 3 ? '#fee2e2' : '#fef3c7',
                color: tabSwitches >= 3 ? '#dc2626' : '#b45309',
                padding: '0.35rem 0.75rem',
                borderRadius: '0.375rem',
                fontSize: '0.8rem',
                fontWeight: '700',
                border: `1px solid ${tabSwitches >= 3 ? '#fecaca' : '#fde68a'}`
              }}>
                <AlertTriangle style={{ width: '0.9rem', height: '0.9rem', marginRight: '0.35rem' }} />
                Tab Switches: {tabSwitches}/3
              </div>
            )}

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

          {/* Question Card */}
          <div className="question-card-container" style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            padding: '2rem'
          }}>
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
                onClick={handleSubmit}
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
    </div>
  );
};

export default ExamAttempt;