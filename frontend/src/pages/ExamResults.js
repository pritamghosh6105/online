import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { submissionAPI, examAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  Award, 
  Calendar, 
  Clock, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  BarChart3,
  Filter,
  Search,
  Download,
  Eye,
  Target,
  Trophy,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { formatDate, getGradeColor, getGradeLetter } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const ExamResults = () => {
  const [submissions, setSubmissions] = useState([]);
  const [filteredSubmissions, setFilteredSubmissions] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortSubmissions();
  }, [submissions, searchTerm, selectedSubject, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [submissionsResponse, examsResponse] = await Promise.all([
        submissionAPI.getMySubmissions(),
        examAPI.getExams()
      ]);
      setSubmissions(submissionsResponse.data.submissions);
      setExams(examsResponse.data.exams);
    } catch (error) {
      console.error('Error fetching results:', error);
      setError('Failed to load your results');
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortSubmissions = () => {
    let filtered = [...submissions];

    // Filter out submissions with null exam references
    filtered = filtered.filter(submission => submission.exam);

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(submission =>
        submission.exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.exam.subject.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by subject
    if (selectedSubject) {
      filtered = filtered.filter(submission =>
        submission.exam.subject === selectedSubject
      );
    }

    // Sort submissions
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'date':
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
          break;
        case 'score':
          aValue = a.percentage;
          bValue = b.percentage;
          break;
        case 'exam':
          aValue = a.exam.title.toLowerCase();
          bValue = b.exam.title.toLowerCase();
          break;
        case 'subject':
          aValue = a.exam.subject.toLowerCase();
          bValue = b.exam.subject.toLowerCase();
          break;
        default:
          aValue = new Date(a.createdAt);
          bValue = new Date(b.createdAt);
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredSubmissions(filtered);
  };

  const calculateStats = () => {
    // Filter out submissions with null exam references
    const validSubmissions = submissions.filter(sub => sub.exam);
    
    if (validSubmissions.length === 0) {
      return {
        totalExams: 0,
        averageScore: 0,
        bestScore: 0,
        worstScore: 0,
        passRate: 0,
        improvementTrend: 'neutral'
      };
    }

    const scores = validSubmissions.map(sub => sub.percentage);
    const passCount = scores.filter(score => score >= 60).length;
    
    // Calculate improvement trend (last 3 vs previous 3)
    let improvementTrend = 'neutral';
    if (validSubmissions.length >= 6) {
      const recent = validSubmissions.slice(0, 3).reduce((sum, sub) => sum + sub.percentage, 0) / 3;
      const previous = validSubmissions.slice(3, 6).reduce((sum, sub) => sum + sub.percentage, 0) / 3;
      improvementTrend = recent > previous ? 'improving' : recent < previous ? 'declining' : 'stable';
    }

    return {
      totalExams: validSubmissions.length,
      averageScore: (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1),
      bestScore: Math.max(...scores),
      worstScore: Math.min(...scores),
      passRate: ((passCount / validSubmissions.length) * 100).toFixed(1),
      improvementTrend
    };
  };

  const stats = calculateStats();
  const subjects = [...new Set(exams.map(exam => exam.subject))];

  if (loading) {
    return <LoadingSpinner text="Loading your results..." />;
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      padding: '2rem 1rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        {/* Header */}
        <div style={{
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '0.5rem'
          }}>
            My Exam Results
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '1rem'
          }}>
            Track your academic performance and progress over time
          </p>
        </div>

        {/* Statistics Overview */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem'
        }}>
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
                  Total Exams
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  {stats.totalExams}
                </p>
              </div>
              <FileText style={{
                width: '2rem',
                height: '2rem',
                color: '#3b82f6'
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
                  color: getGradeColor(stats.averageScore)
                }}>
                  {stats.averageScore}%
                </p>
              </div>
              <BarChart3 style={{
                width: '2rem',
                height: '2rem',
                color: '#059669'
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
                  Best Score
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: getGradeColor(stats.bestScore)
                }}>
                  {stats.bestScore || 0}%
                </p>
              </div>
              <Trophy style={{
                width: '2rem',
                height: '2rem',
                color: '#eab308'
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
                  Pass Rate
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: stats.passRate >= 70 ? '#059669' : '#dc2626'
                }}>
                  {stats.passRate}%
                </p>
              </div>
              <Target style={{
                width: '2rem',
                height: '2rem',
                color: '#8b5cf6'
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
                  Trend
                </p>
                <p style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: stats.improvementTrend === 'improving' ? '#059669' : 
                        stats.improvementTrend === 'declining' ? '#dc2626' : '#6b7280'
                }}>
                  {stats.improvementTrend === 'improving' ? 'Improving' :
                   stats.improvementTrend === 'declining' ? 'Declining' : 'Stable'}
                </p>
              </div>
              {stats.improvementTrend === 'improving' ? (
                <TrendingUp style={{
                  width: '2rem',
                  height: '2rem',
                  color: '#059669'
                }} />
              ) : stats.improvementTrend === 'declining' ? (
                <TrendingDown style={{
                  width: '2rem',
                  height: '2rem',
                  color: '#dc2626'
                }} />
              ) : (
                <BarChart3 style={{
                  width: '2rem',
                  height: '2rem',
                  color: '#6b7280'
                }} />
              )}
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          marginBottom: '2rem'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937',
              display: 'flex',
              alignItems: 'center'
            }}>
              <Filter style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
              Filter & Search
            </h2>
          </div>
          
          <div style={{
            padding: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Search Exams
              </label>
              <div style={{ position: 'relative' }}>
                <Search style={{
                  position: 'absolute',
                  left: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '1rem',
                  height: '1rem',
                  color: '#9ca3af'
                }} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 0.75rem 0.75rem 2.5rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    outline: 'none'
                  }}
                  placeholder="Search by exam title or subject"
                />
              </div>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Filter by Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Sort by
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="date">Date</option>
                <option value="score">Score</option>
                <option value="exam">Exam Name</option>
                <option value="subject">Subject</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                fontSize: '0.875rem',
                fontWeight: '500',
                color: '#374151',
                marginBottom: '0.5rem'
              }}>
                Order
              </label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #d1d5db',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: '#ffffff'
                }}
              >
                <option value="desc">Descending</option>
                <option value="asc">Ascending</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.5rem',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <div style={{
            padding: '1.5rem',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: '#1f2937'
            }}>
              Exam Results ({filteredSubmissions.length})
            </h2>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '1rem',
                borderRadius: '0.375rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center'
              }}>
                <AlertCircle style={{
                  width: '1.25rem',
                  height: '1.25rem',
                  marginRight: '0.5rem'
                }} />
                {error}
              </div>
            )}

            {filteredSubmissions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#6b7280'
              }}>
                <FileText style={{
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
                  No results found
                </h3>
                <p>
                  {searchTerm || selectedSubject ? 'Try adjusting your search criteria.' : 'You haven\'t completed any exams yet.'}
                </p>
                {!searchTerm && !selectedSubject && (
                  <Link
                    to="/dashboard"
                    style={{
                      display: 'inline-block',
                      marginTop: '1rem',
                      backgroundColor: '#3b82f6',
                      color: '#ffffff',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '0.375rem',
                      textDecoration: 'none',
                      fontSize: '0.875rem',
                      fontWeight: '500'
                    }}
                  >
                    Browse Available Exams
                  </Link>
                )}
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {filteredSubmissions.map((submission) => (
                  <div
                    key={submission._id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
                      backgroundColor: '#f8fafc',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.target.style.backgroundColor = '#f1f5f9';
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.target.style.backgroundColor = '#f8fafc';
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                      gap: '1rem',
                      alignItems: 'center'
                    }}>
                      <div>
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: '#1f2937',
                          marginBottom: '0.5rem'
                        }}>
                          {submission.exam.title}
                        </h3>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          marginBottom: '0.25rem'
                        }}>
                          <FileText style={{
                            width: '1rem',
                            height: '1rem',
                            marginRight: '0.5rem'
                          }} />
                          {submission.exam.subject}
                        </div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          fontSize: '0.875rem',
                          color: '#6b7280'
                        }}>
                          <Calendar style={{
                            width: '1rem',
                            height: '1rem',
                            marginRight: '0.5rem'
                          }} />
                          {formatDate(submission.createdAt)}
                        </div>
                      </div>

                      <div style={{
                        textAlign: 'center'
                      }}>
                        <div style={{
                          fontSize: '2rem',
                          fontWeight: 'bold',
                          color: getGradeColor(submission.percentage),
                          marginBottom: '0.25rem'
                        }}>
                          {submission.percentage}%
                        </div>
                        <div style={{
                          fontSize: '0.875rem',
                          color: '#6b7280',
                          marginBottom: '0.5rem'
                        }}>
                          {submission.totalScore}/{submission.totalMarks} points
                        </div>
                        <span style={{
                          display: 'inline-block',
                          padding: '0.25rem 0.75rem',
                          borderRadius: '9999px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          backgroundColor: submission.percentage >= 60 ? '#d1fae5' : '#fee2e2',
                          color: submission.percentage >= 60 ? '#065f46' : '#991b1b'
                        }}>
                          Grade: {getGradeLetter(submission.percentage)}
                        </span>
                      </div>

                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.875rem',
                        color: '#6b7280'
                      }}>
                        <Clock style={{
                          width: '1rem',
                          height: '1rem',
                          marginRight: '0.5rem'
                        }} />
                        Time: {submission.timeTaken}min
                      </div>

                      <div style={{
                        display: 'flex',
                        justifyContent: 'center'
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          backgroundColor: submission.percentage >= 60 ? '#d1fae5' : '#fee2e2',
                          color: submission.percentage >= 60 ? '#065f46' : '#991b1b',
                          padding: '0.5rem 1rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.875rem',
                          fontWeight: '500'
                        }}>
                          {submission.percentage >= 60 ? (
                            <CheckCircle style={{
                              width: '1rem',
                              height: '1rem',
                              marginRight: '0.5rem'
                            }} />
                          ) : (
                            <AlertCircle style={{
                              width: '1rem',
                              height: '1rem',
                              marginRight: '0.5rem'
                            }} />
                          )}
                          {submission.percentage >= 60 ? 'Passed' : 'Failed'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Back to Dashboard */}
        <div style={{
          textAlign: 'center',
          marginTop: '2rem'
        }}>
          <Link
            to="/dashboard"
            style={{
              display: 'inline-block',
              backgroundColor: '#3b82f6',
              color: '#ffffff',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.375rem',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: '500'
            }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ExamResults;