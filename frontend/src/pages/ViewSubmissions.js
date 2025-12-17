import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { submissionAPI, examAPI } from '../api';
import { 
  FileText, 
  Users, 
  Award, 
  Calendar,
  Clock,
  Eye,
  Download,
  Filter,
  Search,
  Trash2
} from 'lucide-react';
import { formatDate, getGradeColor, getGradeLetter } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const ViewSubmissions = () => {
  const [searchParams] = useSearchParams();
  const examId = searchParams.get('examId');
  
  const [submissions, setSubmissions] = useState([]);
  const [exams, setExams] = useState([]);
  const [selectedExam, setSelectedExam] = useState(examId || '');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchData();
  }, [selectedExam]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [submissionsResponse, examsResponse] = await Promise.all([
        submissionAPI.getAllSubmissions(selectedExam),
        examAPI.getExams()
      ]);
      setSubmissions(submissionsResponse.data.submissions);
      setExams(examsResponse.data.exams);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      setError('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (submissionId, studentName) => {
    if (window.confirm(`Are you sure you want to delete ${studentName}'s submission? This action cannot be undone.`)) {
      try {
        await submissionAPI.deleteSubmission(submissionId);
        alert('Submission deleted successfully');
        fetchData(); // Refresh the list
      } catch (error) {
        console.error('Error deleting submission:', error);
        alert(error.response?.data?.message || 'Failed to delete submission');
      }
    }
  };

  const filteredSubmissions = submissions.filter(submission => {
    // Filter out submissions with null exam references first
    if (!submission.exam) return false;
    
    const studentName = submission.student.name.toLowerCase();
    const studentEmail = submission.student.email.toLowerCase();
    const examTitle = submission.exam.title.toLowerCase();
    const search = searchTerm.toLowerCase();
    
    return studentName.includes(search) || 
           studentEmail.includes(search) || 
           examTitle.includes(search);
  });

  if (loading) {
    return <LoadingSpinner text="Loading submissions..." />;
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
            View Submissions
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '1rem'
          }}>
            Monitor and analyze student exam submissions
          </p>
        </div>

        {/* Filters */}
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
              Filters
            </h2>
          </div>
          
          <div style={{
            padding: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
                Select Exam
              </label>
              <select
                value={selectedExam}
                onChange={(e) => setSelectedExam(e.target.value)}
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
                <option value="">All Exams</option>
                {exams.map(exam => (
                  <option key={exam._id} value={exam._id}>
                    {exam.title} - {exam.subject}
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
                Search Students
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
                  placeholder="Search by name, email, or exam"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Submissions List */}
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
              Submissions ({filteredSubmissions.length})
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
                marginBottom: '1rem'
              }}>
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
                  No submissions found
                </h3>
                <p>
                  {searchTerm ? 'Try adjusting your search criteria.' : 'No students have submitted exams yet.'}
                </p>
              </div>
            ) : (
              <div style={{
                overflowX: 'auto'
              }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse'
                }}>
                  <thead>
                    <tr style={{
                      backgroundColor: '#f8fafc',
                      borderBottom: '1px solid #e5e7eb'
                    }}>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Student
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'left',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Exam / Subject
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Score / Marks
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Grade
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Time Taken
                      </th>
                      <th style={{
                        padding: '0.75rem',
                        textAlign: 'center',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        color: '#374151'
                      }}>
                        Submitted
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSubmissions.map((submission) => (
                      <tr 
                        key={submission._id}
                        style={{
                          borderBottom: '1px solid #e5e7eb'
                        }}
                      >
                        <td style={{
                          padding: '0.75rem'
                        }}>
                          <div>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>
                              {submission.student.name}
                            </p>
                            <p style={{
                              fontSize: '0.75rem',
                              color: '#6b7280'
                            }}>
                              {submission.student.email}
                            </p>
                          </div>
                        </td>
                        <td style={{
                          padding: '0.75rem'
                        }}>
                          <div>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: '500',
                              color: '#1f2937'
                            }}>
                              {submission.exam.title}
                            </p>
                            <span style={{
                              display: 'inline-block',
                              marginTop: '0.25rem',
                              padding: '0.125rem 0.5rem',
                              backgroundColor: '#dbeafe',
                              color: '#1e40af',
                              borderRadius: '0.25rem',
                              fontSize: '0.75rem',
                              fontWeight: '500'
                            }}>
                              {submission.exam.subject}
                            </span>
                          </div>
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'center'
                        }}>
                          <div>
                            <p style={{
                              fontSize: '0.875rem',
                              fontWeight: 'bold',
                              color: '#1f2937'
                            }}>
                              {submission.totalScore}/{submission.totalMarks}
                            </p>
                            <p style={{
                              fontSize: '0.75rem',
                              fontWeight: 'bold',
                              color: getGradeColor(submission.percentage)
                            }}>
                              {submission.percentage}%
                            </p>
                          </div>
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'center'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.25rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: 'bold',
                            backgroundColor: submission.percentage >= 60 ? '#d1fae5' : '#fee2e2',
                            color: submission.percentage >= 60 ? '#065f46' : '#991b1b'
                          }}>
                            {getGradeLetter(submission.percentage)}
                          </span>
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'center'
                        }}>
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
                              marginRight: '0.25rem'
                            }} />
                            {submission.timeTaken}m
                          </div>
                        </td>
                        <td style={{
                          padding: '0.75rem',
                          textAlign: 'center'
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            color: '#6b7280'
                          }}>
                            <Calendar style={{
                              width: '1rem',
                              height: '1rem',
                              marginRight: '0.25rem'
                            }} />
                            {formatDate(submission.createdAt)}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewSubmissions;