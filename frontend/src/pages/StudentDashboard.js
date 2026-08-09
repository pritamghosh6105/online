import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, examAPI, submissionAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  Play, 
  Users, 
  Award,
  TrendingUp,
  Target,
  BarChart3,
  Timer,
  Lock,
  KeyRound,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { formatDate, formatDuration, getExamStatus, getGradeColor, getGradeLetter } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const StudentDashboard = () => {
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!passwordForm.currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }
    if (!passwordForm.newPassword) {
      setPasswordError('Please enter a new password.');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }

    try {
      setPasswordLoading(true);
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      setPasswordSuccess('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => {
        setShowChangePasswordModal(false);
        setPasswordSuccess('');
      }, 1800);
    } catch (err) {
      console.error('Change password error:', err);
      setPasswordError(err.response?.data?.message || 'Failed to change password. Please verify your current password.');
    } finally {
      setPasswordLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every minute to update exam availability
    const intervalId = setInterval(() => {
      fetchDataSilently();
    }, 60000); // 60 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, []); // Empty dependency array - only run once on mount

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [examsResponse, submissionsResponse] = await Promise.all([
        examAPI.getExams(),
        submissionAPI.getMySubmissions()
      ]);
      
      const examsData = examsResponse.data.exams || [];
      const submissionsData = submissionsResponse.data.submissions || [];
      
      setExams(examsData);
      setSubmissions(submissionsData);
      
      // Calculate statistics with O(1) Set lookup
      const completedExams = submissionsData.length;
      const averageScore = submissionsData.length > 0 
        ? (submissionsData.reduce((sum, sub) => sum + sub.percentage, 0) / submissionsData.length).toFixed(1)
        : 0;

      const submittedExamIds = new Set(
        submissionsData.map(sub => (sub.exam?._id || sub.exam)?.toString()).filter(Boolean)
      );

      const pendingExams = examsData.filter(exam => {
        const isSubmitted = submittedExamIds.has(exam._id?.toString());
        const status = getExamStatus(exam);
        return !isSubmitted && status.status !== 'completed';
      }).length;
      
      const totalExams = Math.max(examsData.length, completedExams + pendingExams);

      setStats({
        totalExams,
        completedExams,
        pendingExams,
        averageScore,
        grade: getGradeLetter(averageScore)
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Silent refresh in background without showing loading state
  const fetchDataSilently = async () => {
    try {
      const [examsResponse, submissionsResponse] = await Promise.all([
        examAPI.getExams(),
        submissionAPI.getMySubmissions()
      ]);
      
      const examsData = examsResponse.data.exams || [];
      const submissionsData = submissionsResponse.data.submissions || [];
      
      setExams(examsData);
      setSubmissions(submissionsData);
      
      // Calculate statistics
      const completedExams = submissionsData.length;
      const averageScore = submissionsData.length > 0 
        ? (submissionsData.reduce((sum, sub) => sum + sub.percentage, 0) / submissionsData.length).toFixed(1)
        : 0;

      const pendingExams = examsData.filter(exam => {
        const isSubmitted = submissionsData.some(sub => {
          const subExamId = sub.exam?._id || sub.exam;
          return subExamId && exam?._id && subExamId.toString() === exam._id.toString();
        });
        const status = getExamStatus(exam);
        return !isSubmitted && status.status !== 'completed';
      }).length;

      const totalExams = Math.max(examsData.length, completedExams + pendingExams);
      
      setStats({
        totalExams,
        completedExams,
        pendingExams,
        averageScore,
        grade: getGradeLetter(averageScore)
      });
      setError(null);
    } catch (error) {
      console.error('Silent refresh error:', error);
      // Don't set error state for silent refresh failures
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading your dashboard..." />;
  }

  return (
    <>
      <style>{`
        @media (max-width: 640px) {
          .stat-card {
            padding: 0.75rem !important;
          }
          .stat-icon {
            width: 1.5rem !important;
            height: 1.5rem !important;
          }
          .exam-card {
            padding: 1rem !important;
          }
          .action-link {
            padding: 0.5rem 0.75rem !important;
            font-size: 0.75rem !important;
          }
        }
      `}</style>
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#f8fafc',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
        {/* Hero Header Banner */}
        <div className="student-hero-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', backdropFilter: 'blur(4px)' }}>
                STUDENT PORTAL
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: '800', margin: 0, letterSpacing: '-0.025em' }}>
                Welcome back, {user?.name || 'Student'}!
              </h1>
              <p style={{ color: '#93c5fd', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
                {user?.studentId ? `Student ID: ${user.studentId} • ` : ''}
                {user?.institution ? `School: ${user.institution} • ` : ''}
                View upcoming exams & check results.
              </p>
            </div>
            <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <Link
                to="/results"
                className="student-action-btn"
                style={{ backgroundColor: '#ffffff', color: '#0f172a', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                <Award style={{ width: '1.1rem', height: '1.1rem', color: '#2563eb' }} />
                My Results
              </Link>
              <button
                type="button"
                onClick={() => setShowChangePasswordModal(true)}
                className="student-action-btn"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  padding: '0.5rem 1rem',
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  borderRadius: '0.5rem',
                  fontWeight: '600',
                  backdropFilter: 'blur(4px)'
                }}
              >
                <Lock style={{ width: '1rem', height: '1rem' }} />
                Change Password
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Stats Cards Grid */}
        <div className="responsive-grid" style={{ marginBottom: '2rem' }}>
          {/* Total Exams */}
          <div className="student-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                  Total Exams
                </p>
                <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {stats.totalExams || 0}
                </p>
              </div>
              <div style={{ width: '3.25rem', height: '3.25rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <BookOpen style={{ width: '1.75rem', height: '1.75rem' }} />
              </div>
            </div>
          </div>

          {/* Pending Exams */}
          <div className="student-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                  Pending Exams
                </p>
                <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {stats.pendingExams || 0}
                </p>
              </div>
              <div style={{ width: '3.25rem', height: '3.25rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <Timer style={{ width: '1.75rem', height: '1.75rem' }} />
              </div>
            </div>
          </div>

          {/* Average Score */}
          <div className="student-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.85rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                  Average Score
                </p>
                <p style={{ fontSize: '2.25rem', fontWeight: '800', color: getGradeColor(stats.averageScore || 0), margin: 0 }}>
                  {stats.averageScore || 0}%
                </p>
              </div>
              <div style={{ width: '3.25rem', height: '3.25rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9333ea' }}>
                <TrendingUp style={{ width: '1.75rem', height: '1.75rem' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: 'clamp(1rem, 4vw, 1.25rem)',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              Quick Actions
            </h2>
          </div>
          <div style={{
            padding: '1rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem'
          }}>
            <Link
              to="/results"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                border: '1px solid #e5e7eb',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#f1f5f9';
                e.target.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#f8fafc';
                e.target.style.transform = 'translateY(0)';
              }}
            >
              <BarChart3 style={{
                width: '1.5rem',
                height: '1.5rem',
                color: '#3b82f6',
                marginRight: '0.75rem'
              }} />
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  color: '#1f2937',
                  marginBottom: '0.25rem'
                }}>
                  View My Results
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#6b7280'
                }}>
                  Check your exam scores and performance
                </p>
              </div>
            </Link>

            <Link
              to="/question-bank"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#f0fdf4',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                border: '1px solid #bbf7d0',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#d1fae5';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#f0fdf4';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <BookOpen style={{
                width: '1.5rem',
                height: '1.5rem',
                color: '#059669',
                marginRight: '0.75rem'
              }} />
              <div>
                <p style={{
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  color: '#065f46',
                  marginBottom: '0.25rem'
                }}>
                  Question Bank
                </p>
                <p style={{
                  fontSize: '0.75rem',
                  color: '#047857'
                }}>
                  Practice MCQs with answer explanations
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Results Summary */}
        {submissions.length > 0 && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              padding: '1rem',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h2 style={{
                fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                fontWeight: 'bold',
                color: '#1f2937'
              }}>
                Recent Results
              </h2>
            </div>
            <div style={{
              padding: '1rem'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '0.75rem'
              }}>
                {submissions.slice(0, 3).filter(submission => submission.exam).map((submission) => (
                  <div
                    key={submission._id}
                    style={{
                      padding: '1rem',
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.375rem',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '0.75rem'
                    }}>
                      <div>
                        <h3 style={{
                          fontSize: '0.875rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '0.25rem'
                        }}>
                          {submission.exam.title}
                        </h3>
                        <p style={{
                          fontSize: '0.75rem',
                          color: '#6b7280'
                        }}>
                          {submission.exam.subject}
                        </p>
                      </div>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold',
                        backgroundColor: submission.percentage >= 60 ? '#d1fae5' : '#fee2e2',
                        color: submission.percentage >= 60 ? '#065f46' : '#991b1b'
                      }}>
                        {getGradeLetter(submission.percentage)}
                      </span>
                    </div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{
                        fontSize: '0.75rem',
                        color: '#6b7280'
                      }}>
                        Score: {submission.totalScore}/{submission.totalMarks}
                      </div>
                      <div style={{
                        fontSize: '0.875rem',
                        fontWeight: 'bold',
                        color: getGradeColor(submission.percentage)
                      }}>
                        {submission.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {submissions.length > 3 && (
                <div style={{
                  textAlign: 'center',
                  marginTop: '1rem'
                }}>
                  <Link
                    to="/results"
                    style={{
                      color: '#3b82f6',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    View All Results →
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Upcoming Exams Section */}
        {(() => {
          const now = new Date();
          const upcomingExams = exams.filter(exam => {
            const startDate = new Date(exam.startDate);
            const isSubmitted = submissions.some(sub => sub.exam && sub.exam._id === exam._id);
            return !isSubmitted && startDate > now && exam.isActive;
          }).sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

          return upcomingExams.length > 0 ? (
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                padding: '1rem',
                borderBottom: '1px solid #e5e7eb',
                backgroundColor: '#eff6ff'
              }}>
                <h2 style={{
                  fontSize: 'clamp(1rem, 4vw, 1.25rem)',
                  fontWeight: 'bold',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <Calendar style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                  Upcoming Scheduled Exams
                </h2>
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {upcomingExams.map((exam) => {
                    const startDate = new Date(exam.startDate);
                    
                    // Calculate days until exam by comparing calendar dates
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const examDay = new Date(startDate);
                    examDay.setHours(0, 0, 0, 0);
                    const daysUntil = Math.round((examDay - today) / (1000 * 60 * 60 * 24));
                    
                    return (
                      <div 
                        key={exam._id}
                        style={{
                          border: '2px solid #dbeafe',
                          borderRadius: '0.5rem',
                          padding: '1rem',
                          backgroundColor: '#f0f9ff'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          flexWrap: 'wrap',
                          gap: '0.5rem'
                        }}>
                          <div style={{ flex: '1', minWidth: '200px' }}>
                            <h3 style={{
                              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                              fontWeight: 'bold',
                              color: '#1f2937',
                              marginBottom: '0.25rem'
                            }}>
                              {exam.title}
                            </h3>
                            <p style={{
                              fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                              color: '#6b7280',
                              marginBottom: '0.5rem'
                            }}>
                              {exam.subject}
                            </p>
                            <div style={{
                              display: 'flex',
                              flexWrap: 'wrap',
                              gap: '0.75rem',
                              fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                              color: '#374151'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Calendar style={{ width: '1rem', height: '1rem', marginRight: '0.25rem', color: '#3b82f6' }} />
                                <span><strong>Start:</strong> {formatDate(exam.startDate)}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Clock style={{ width: '1rem', height: '1rem', marginRight: '0.25rem', color: '#3b82f6' }} />
                                <span><strong>End:</strong> {formatDate(exam.endDate)}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Timer style={{ width: '1rem', height: '1rem', marginRight: '0.25rem', color: '#3b82f6' }} />
                                <span><strong>Duration:</strong> {exam.duration} min</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Target style={{ width: '1rem', height: '1rem', marginRight: '0.25rem', color: '#3b82f6' }} />
                                <span><strong>Total Marks:</strong> {exam.totalMarks}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            gap: '0.5rem'
                          }}>
                            <span style={{
                              padding: '0.375rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              whiteSpace: 'nowrap'
                            }}>
                              {daysUntil === 0 ? 'Today' : daysUntil === 1 ? 'Tomorrow' : `In ${daysUntil} days`}
                            </span>
                            <span style={{
                              fontSize: '0.75rem',
                              color: '#6b7280',
                              whiteSpace: 'nowrap'
                            }}>
                              {exam.questions?.length || 0} Questions
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ) : null;
        })()}

        {/* Exams List */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            padding: '1rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: 'clamp(1rem, 4vw, 1.25rem)',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              Available Exams
            </h2>
          </div>

          <div style={{ padding: '1rem' }}>
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '1rem',
                borderRadius: '0.375rem',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            {(() => {
              const now = new Date();
              const availableExams = exams.filter(exam => {
                const isSubmitted = submissions.some(sub => sub.exam && sub.exam._id === exam._id);
                const startDate = new Date(exam.startDate);
                const endDate = new Date(exam.endDate);
                // Exam is available if: not submitted, currently active (between start and end date), and isActive
                return !isSubmitted && now >= startDate && now <= endDate && exam.isActive;
              });
              
              return availableExams.length === 0 ? (
                <div style={{
                  textAlign: 'center',
                  padding: '3rem',
                  color: '#6b7280'
                }}>
                  <BookOpen style={{
                    width: '3rem',
                    height: '3rem',
                    margin: '0 auto 1rem',
                    color: '#d1d5db'
                  }} />
                  <h3 style={{
                    fontSize: '1.125rem',
                    fontWeight: '500',
                    marginBottom: '0.5rem'
                  }}>
                    No exams available
                  </h3>
                  <p>
                    {exams.length === 0 
                      ? 'There are currently no exams available for you to attempt.'
                      : 'You have completed all available exams. Check your results to see your performance!'
                    }
                  </p>
                </div>
              ) : (
                <div style={{
                  display: 'grid',
                  gap: '1rem'
                }}>
                  {availableExams.map((exam) => (
                  <div 
                    key={exam._id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.1)';
                      e.currentTarget.style.borderColor = '#3b82f6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.borderColor = '#e5e7eb';
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{
                          fontSize: 'clamp(1rem, 4vw, 1.125rem)',
                          fontWeight: 'bold',
                          color: '#1f2937',
                          marginBottom: '0.5rem'
                        }}>
                          {exam.title}
                        </h3>
                        <p style={{
                          color: '#6b7280',
                          fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                          marginBottom: '1rem'
                        }}>
                          Subject: {exam.subject}
                        </p>

                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                          marginBottom: '1rem'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: '#6b7280',
                            fontSize: '0.875rem'
                          }}>
                            <Clock style={{
                              width: '1rem',
                              height: '1rem',
                              marginRight: '0.5rem'
                            }} />
                            Duration: {formatDuration(exam.duration)}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: '#6b7280',
                            fontSize: '0.875rem'
                          }}>
                            <Users style={{
                              width: '1rem',
                              height: '1rem',
                              marginRight: '0.5rem'
                            }} />
                            Questions: {exam.questions?.length || 0}
                          </div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            color: '#6b7280',
                            fontSize: '0.875rem'
                          }}>
                            <BookOpen style={{
                              width: '1rem',
                              height: '1rem',
                              marginRight: '0.5rem'
                            }} />
                            Total Marks: {exam.totalMarks}
                          </div>
                        </div>

                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          color: '#6b7280',
                          fontSize: '0.875rem',
                          marginBottom: '1rem'
                        }}>
                          <Calendar style={{
                            width: '1rem',
                            height: '1rem',
                            marginRight: '0.5rem'
                          }} />
                          Available until: {formatDate(exam.endDate)}
                        </div>
                      </div>

                      <Link
                        to={`/exam/${exam._id}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          backgroundColor: '#3b82f6',
                          color: '#ffffff',
                          padding: '0.75rem 1rem',
                          borderRadius: '0.375rem',
                          textDecoration: 'none',
                          fontSize: 'clamp(0.75rem, 3vw, 0.875rem)',
                          fontWeight: '500',
                          transition: 'background-color 0.2s',
                          width: '100%'
                        }}
                        onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
                        onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
                      >
                        <Play style={{
                          width: '1rem',
                          height: '1rem',
                          marginRight: '0.5rem'
                        }} />
                        Start Exam
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
              );
            })()}
          </div>
        </div>
        </div>
        {/* Change Password Modal */}
        {showChangePasswordModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.75rem',
              padding: '2rem',
              maxWidth: '440px',
              width: '100%',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
              position: 'relative'
            }}>
              <button
                type="button"
                onClick={() => {
                  setShowChangePasswordModal(false);
                  setPasswordError('');
                  setPasswordSuccess('');
                }}
                style={{
                  position: 'absolute',
                  top: '1rem', right: '1rem',
                  border: 'none', background: 'none',
                  cursor: 'pointer', color: '#64748b'
                }}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <div style={{ backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.65rem', borderRadius: '0.5rem' }}>
                  <KeyRound size={22} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '800', color: '#0f172a' }}>
                    Change Password
                  </h3>
                  <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#64748b' }}>
                    Update your account password securely
                  </p>
                </div>
              </div>

              {passwordError && (
                <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <AlertCircle size={16} /> {passwordError}
                </div>
              )}

              {passwordSuccess && (
                <div style={{ backgroundColor: '#f0fdf4', border: '1px solid #86efac', color: '#166534', padding: '0.75rem', borderRadius: '0.5rem', fontSize: '0.85rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <CheckCircle size={16} /> {passwordSuccess}
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Enter current password"
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    placeholder="At least 6 characters"
                    required
                    minLength={6}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '700', color: '#334155', marginBottom: '0.35rem' }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    placeholder="Re-enter new password"
                    required
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #cbd5e1',
                      borderRadius: '0.5rem',
                      fontSize: '0.9rem',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePasswordModal(false);
                      setPasswordError('');
                      setPasswordSuccess('');
                    }}
                    style={{
                      flex: 1,
                      padding: '0.65rem',
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '700',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={passwordLoading}
                    style={{
                      flex: 1.5,
                      padding: '0.65rem',
                      backgroundColor: '#2563eb',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.5rem',
                      fontWeight: '700',
                      cursor: passwordLoading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 2px 4px rgba(37, 99, 235, 0.2)'
                    }}
                  >
                    {passwordLoading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default StudentDashboard;