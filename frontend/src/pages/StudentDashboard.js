import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examAPI, submissionAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Clock, 
  Calendar, 
  Play, 
  Users, 
  CheckCircle, 
  Award,
  TrendingUp,
  Target,
  AlertCircle,
  Star,
  BarChart3,
  Timer,
  Trophy
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
      
      const examsData = examsResponse.data.exams;
      const submissionsData = submissionsResponse.data.submissions;
      
      setExams(examsData);
      setSubmissions(submissionsData);
      
      // Calculate statistics
      const completedExams = submissionsData.length;
      const averageScore = submissionsData.length > 0 
        ? (submissionsData.reduce((sum, sub) => sum + sub.percentage, 0) / submissionsData.length).toFixed(1)
        : 0;
      // Removed bestScore calculation
      const pendingExams = examsData.filter(exam => {
        const isSubmitted = submissionsData.some(sub => sub.exam && sub.exam._id === exam._id);
        const status = getExamStatus(exam);
        return !isSubmitted && (status.status === 'upcoming' || status.status === 'active');
      }).length;
      
      setStats({
        totalExams: examsData.length,
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
      
      const examsData = examsResponse.data.exams;
      const submissionsData = submissionsResponse.data.submissions;
      
      setExams(examsData);
      setSubmissions(submissionsData);
      
      // Calculate statistics
      const completedExams = submissionsData.length;
      const averageScore = submissionsData.length > 0 
        ? (submissionsData.reduce((sum, sub) => sum + sub.percentage, 0) / submissionsData.length).toFixed(1)
        : 0;
      // Removed bestScore calculation
      const pendingExams = examsData.filter(exam => {
        const isSubmitted = submissionsData.some(sub => sub.exam && sub.exam._id === exam._id);
        const status = getExamStatus(exam);
        return !isSubmitted && (status.status === 'upcoming' || status.status === 'active');
      }).length;
      
      setStats({
        totalExams: examsData.length,
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
        {/* Header */}
        <div style={{
          marginBottom: '1.5rem'
        }}>
          <h1 style={{
            fontSize: 'clamp(1.5rem, 5vw, 2rem)',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            Welcome back, {user?.name}!
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: 'clamp(0.875rem, 3vw, 1rem)'
          }}>
            Here are the available exams for you to attempt.
          </p>
        </div>

        {/* Enhanced Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          <div style={{
            backgroundColor: '#ffffff',
            padding: '1rem',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ flex: 1 }}>
                <p style={{
                  color: '#6b7280',
                  fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                  marginBottom: '0.5rem'
                }}>
                  Total Exams
                </p>
                <p style={{
                  fontSize: 'clamp(1.5rem, 5vw, 2rem)',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  {stats.totalExams || 0}
                </p>
              </div>
              <BookOpen style={{
                width: 'clamp(1.5rem, 5vw, 2rem)',
                height: 'clamp(1.5rem, 5vw, 2rem)',
                color: '#3b82f6',
                flexShrink: 0
              }} />
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  Pending
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  {stats.pendingExams || 0}
                </p>
              </div>
              <Timer style={{
                width: '2rem',
                height: '2rem',
                color: '#f59e0b'
              }} />
            </div>
          </div>

          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  Average Score
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: getGradeColor(stats.averageScore || 0)
                }}>
                  {stats.averageScore || 0}%
                </p>
              </div>
              <TrendingUp style={{
                width: '2rem',
                height: '2rem',
                color: '#8b5cf6'
              }} />
            </div>
          </div>

          {/* Removed Best Score card */}

          <div style={{
            backgroundColor: '#ffffff',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div>
                <p style={{
                  color: '#6b7280',
                  fontSize: '0.875rem',
                  marginBottom: '0.5rem'
                }}>
                  Current Grade
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: getGradeColor(stats.averageScore || 0)
                }}>
                  {stats.grade || 'N/A'}
                </p>
              </div>
              <Star style={{
                width: '2rem',
                height: '2rem',
                color: '#f59e0b'
              }} />
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
            const endDate = new Date(exam.endDate);
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
                    const endDate = new Date(exam.endDate);
                    
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
      </div>
    </>
  );
};

export default StudentDashboard;