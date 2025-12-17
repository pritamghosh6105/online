import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { examAPI, submissionAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight,
  Flag,
  Save,
  Send,
  Timer,
  FileText,
  User,
  Calendar
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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [examStartTime, setExamStartTime] = useState(null);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState('saved');

  // Fetch exam data
  useEffect(() => {
    fetchExam();
  }, [id]);

  // Timer effect
  useEffect(() => {
    if (exam && examStartTime && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [exam, examStartTime, timeRemaining]);

  // Auto-save answers
  useEffect(() => {
    if (Object.keys(answers).length > 0) {
      setAutoSaveStatus('saving');
      const saveTimer = setTimeout(() => {
        localStorage.setItem(`exam_${id}_answers`, JSON.stringify(answers));
        setAutoSaveStatus('saved');
      }, 1000);

      return () => clearTimeout(saveTimer);
    }
  }, [answers, id]);

  // Allow opening new tabs but warn on page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const message = 'Your exam is in progress. Your answers are saved.';
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

  const calculateScore = () => {
    let correctAnswers = 0;
    let totalMarks = 0;

    exam.questions.forEach(question => {
      totalMarks += question.marks || 1;
      const userAnswer = answers[question._id];
      if (userAnswer !== undefined) {
        // Since we don't have access to correct answers as a student,
        // we'll let the backend handle scoring
        // This is just for UI display purposes
      }
    });

    return {
      totalMarks,
      // We can't calculate exact score on frontend since correct answers are hidden
      answeredCount: Object.keys(answers).length
    };
  };

  const handleSubmit = async () => {
    try {
      setSubmitting(true);
      
      const endTime = new Date();
      
      // Validate that we have answers
      if (Object.keys(answers).length === 0) {
        toast.error('Please answer at least one question before submitting.');
        setSubmitting(false);
        return;
      }

      // Validate exam start time
      if (!examStartTime) {
        toast.error('Invalid exam session. Please refresh and try again.');
        setSubmitting(false);
        return;
      }

      const submissionData = {
        examId: exam._id,
        answers: Object.keys(answers).map(questionId => ({
          questionId: questionId,
          selectedOption: parseInt(answers[questionId])
        })),
        startTime: examStartTime.toISOString(),
        endTime: endTime.toISOString()
      };

      console.log('Submitting exam with data:', submissionData);
      console.log('Exam ID:', exam._id);
      console.log('Start time:', examStartTime);
      console.log('End time:', endTime);
      console.log('Answers count:', Object.keys(answers).length);
      
      const response = await submissionAPI.submitExam(submissionData);
      console.log('Submission response:', response);
      
      // Clear saved data
      localStorage.removeItem(`exam_${id}_answers`);
      localStorage.removeItem(`exam_${id}_startTime`);
      
      toast.success('Exam submitted successfully!');
      navigate('/results');
    } catch (error) {
      console.error('Error submitting exam:', error);
      console.error('Error response:', error.response?.data);
      
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
  }, [handleSubmit]);

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
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc'
    }}>
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

      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        padding: '2rem',
        display: 'grid',
        gridTemplateColumns: '1fr 300px',
        gap: '2rem'
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
          <div style={{
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
              {currentQuestion.options.map((option, index) => (
                <label
                  key={index}
                  style={{
                    display: 'block',
                    padding: '1rem',
                    border: '2px solid',
                    borderColor: answers[currentQuestion._id] === index ? '#3b82f6' : '#e5e7eb',
                    borderRadius: '0.5rem',
                    marginBottom: '0.75rem',
                    cursor: 'pointer',
                    backgroundColor: answers[currentQuestion._id] === index ? '#eff6ff' : '#ffffff',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    if (answers[currentQuestion._id] !== index) {
                      e.target.style.borderColor = '#d1d5db';
                      e.target.style.backgroundColor = '#f9fafb';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (answers[currentQuestion._id] !== index) {
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
                      value={index}
                      checked={answers[currentQuestion._id] === index}
                      onChange={() => handleAnswerChange(currentQuestion._id, index)}
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
              ))}
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