import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { examAPI, submissionAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Plus, 
  Eye, 
  Trash2, 
  Calendar,
  Clock,
  Award,
  Key,
  X
} from 'lucide-react';
import { formatDate, formatDuration } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showAdminListModal, setShowAdminListModal] = useState(false);
  const [adminList, setAdminList] = useState([]);
  const [credentialsForm, setCredentialsForm] = useState({
    currentAdminId: '',
    currentPassword: '',
    newStudentId: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [addAdminForm, setAddAdminForm] = useState({
    name: '',
    adminId: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [credentialsError, setCredentialsError] = useState('');
  const [addAdminError, setAddAdminError] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [examsResponse, submissionsResponse] = await Promise.all([
        examAPI.getExams(),
        submissionAPI.getAllSubmissions()
      ]);
      setExams(examsResponse.data.exams);
      setSubmissions(submissionsResponse.data.submissions);
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAdmins = async () => {
    try {
      const response = await authAPI.getAdmins();
      setAdminList(response.data.admins || []);
    } catch (error) {
      console.error('Error fetching admins:', error);
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await authAPI.deleteAdmin(adminId);
        alert('Admin deleted successfully');
        fetchAdmins();
      } catch (error) {
        console.error('Error deleting admin:', error);
        alert(error.response?.data?.message || 'Failed to delete admin');
      }
    }
  };

  const handleDeleteExam = async (examId) => {
    if (window.confirm('Are you sure you want to delete this exam?')) {
      try {
        await examAPI.deleteExam(examId);
        setExams(exams.filter(exam => exam._id !== examId));
      } catch (error) {
        console.error('Error deleting exam:', error);
        alert('Failed to delete exam');
      }
    }
  };

  const handleCredentialsChange = async (e) => {
    e.preventDefault();
    setCredentialsError('');

    // Validation
    if (!credentialsForm.currentAdminId || credentialsForm.currentAdminId.length !== 11) {
      setCredentialsError('Current Admin ID must be 11 digits');
      return;
    }
    if (!credentialsForm.currentPassword) {
      setCredentialsError('Current password is required');
      return;
    }
    if (!credentialsForm.newStudentId || credentialsForm.newStudentId.length !== 11) {
      setCredentialsError('New Admin ID must be 11 digits');
      return;
    }
    if (!credentialsForm.newPassword || credentialsForm.newPassword.length < 6) {
      setCredentialsError('New password must be at least 6 characters');
      return;
    }
    if (credentialsForm.newPassword !== credentialsForm.confirmPassword) {
      setCredentialsError('Passwords do not match');
      return;
    }

    try {
      // API call to update credentials
      const response = await authAPI.changeCredentials({
        oldAdminId: credentialsForm.currentAdminId,
        currentPassword: credentialsForm.currentPassword,
        newStudentId: credentialsForm.newStudentId,
        newPassword: credentialsForm.newPassword
      });
      
      alert('Credentials updated successfully! Please login again with new credentials.');
      setShowCredentialsModal(false);
      setCredentialsForm({
        currentAdminId: '',
        currentPassword: '',
        newStudentId: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Optionally logout user so they can login with new credentials
      // logout();
    } catch (error) {
      setCredentialsError(error.response?.data?.message || 'Failed to update credentials');
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setAddAdminError('');

    // Validation
    if (!addAdminForm.name.trim()) {
      setAddAdminError('Name is required');
      return;
    }
    if (!addAdminForm.adminId || addAdminForm.adminId.length !== 11) {
      setAddAdminError('Admin ID must be 11 digits');
      return;
    }
    if (!addAdminForm.email.trim() || !addAdminForm.email.includes('@')) {
      setAddAdminError('Valid email is required');
      return;
    }
    if (!addAdminForm.password || addAdminForm.password.length < 6) {
      setAddAdminError('Password must be at least 6 characters');
      return;
    }
    if (addAdminForm.password !== addAdminForm.confirmPassword) {
      setAddAdminError('Passwords do not match');
      return;
    }

    try {
      // API call to create new admin
      const response = await authAPI.addAdmin({
        name: addAdminForm.name,
        adminId: addAdminForm.adminId,
        email: addAdminForm.email,
        password: addAdminForm.password
      });
      
      alert(`New admin created successfully!\nAdmin ID: ${addAdminForm.adminId}\nEmail: ${addAdminForm.email}`);
      setShowAddAdminModal(false);
      setAddAdminForm({
        name: '',
        adminId: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
    } catch (error) {
      setAddAdminError(error.response?.data?.message || 'Failed to create admin');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading admin dashboard..." />;
  }

  const totalStudents = [...new Set(submissions.map(sub => sub.student._id))].length;
  const isMainAdmin = user?.email === 'admin@examin.com';

  // Get unique students with their details
  const uniqueStudents = submissions.reduce((acc, sub) => {
    const studentId = sub.student._id;
    if (!acc.find(s => s._id === studentId)) {
      const studentSubmissions = submissions.filter(s => s.student._id === studentId);
      acc.push({
        _id: sub.student._id,
        name: sub.student.name,
        email: sub.student.email,
        totalSubmissions: studentSubmissions.length,
        bestScore: Math.max(...studentSubmissions.map(s => s.percentage))
      });
    }
    return acc;
  }, []);

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
            Admin Dashboard
          </h1>
          <p style={{
            color: '#6b7280',
            fontSize: '1rem'
          }}>
            Manage exams and monitor student submissions
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
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
                  {exams.length}
                </p>
              </div>
              <BookOpen style={{
                width: '2.5rem',
                height: '2.5rem',
                color: '#3b82f6'
              }} />
            </div>
          </div>

          <div 
            onClick={() => setShowStudentModal(true)}
            style={{
              backgroundColor: '#ffffff',
              padding: '1.5rem',
              borderRadius: '0.5rem',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e5e7eb',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.15)';
              e.currentTarget.style.borderColor = '#059669';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
              e.currentTarget.style.borderColor = '#e5e7eb';
            }}
          >
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
                  Total Students
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  {totalStudents}
                </p>
                <p style={{
                  color: '#059669',
                  fontSize: '0.75rem',
                  marginTop: '0.25rem',
                  fontWeight: '500'
                }}>
                  Click to view details
                </p>
              </div>
              <Users style={{
                width: '2.5rem',
                height: '2.5rem',
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
                  Total Submissions
                </p>
                <p style={{
                  fontSize: '2rem',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  {submissions.length}
                </p>
              </div>
              <FileText style={{
                width: '2.5rem',
                height: '2.5rem',
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
          marginBottom: '2rem'
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
              Quick Actions
            </h2>
          </div>
          <div style={{
            padding: '1.5rem',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem'
          }}>
            <Link
              to="/admin/create-exam"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#3b82f6',
                color: '#ffffff',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#2563eb'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#3b82f6'}
            >
              <Plus style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
              Create New Exam
            </Link>
            <Link
              to="/admin/submissions"
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '1rem',
                backgroundColor: '#059669',
                color: '#ffffff',
                borderRadius: '0.375rem',
                textDecoration: 'none',
                transition: 'background-color 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.backgroundColor = '#047857'}
              onMouseLeave={(e) => e.target.style.backgroundColor = '#059669'}
            >
              <Eye style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
              View Submissions
            </Link>
            
            {/* Only show these buttons to main admin */}
            {isMainAdmin && (
              <>
                <button
                  onClick={() => setShowCredentialsModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: '#8b5cf6',
                    color: '#ffffff',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#7c3aed'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#8b5cf6'}
                >
                  <Key style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                  Change Credentials
                </button>
                <button
                  onClick={() => setShowAddAdminModal(true)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: '#f59e0b',
                    color: '#ffffff',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#d97706'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#f59e0b'}
                >
                  <Plus style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                  Add Multiple Admin
                </button>
                <button
                  onClick={() => {
                    setShowAdminListModal(true);
                    fetchAdmins();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '1rem',
                    backgroundColor: '#ec4899',
                    color: '#ffffff',
                    borderRadius: '0.375rem',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = '#db2777'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = '#ec4899'}
                >
                  <Users style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem' }} />
                  View All Admins
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Exams */}
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
              Your Exams
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

            {exams.length === 0 ? (
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
                  No exams created yet
                </h3>
                <p style={{ marginBottom: '1rem' }}>
                  Create your first exam to get started.
                </p>
                <Link
                  to="/admin/create-exam"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: '#3b82f6',
                    color: '#ffffff',
                    padding: '0.75rem 1rem',
                    borderRadius: '0.375rem',
                    textDecoration: 'none',
                    fontSize: '0.875rem',
                    fontWeight: '500'
                  }}
                >
                  <Plus style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  Create Your First Exam
                </Link>
              </div>
            ) : (
              <div style={{
                display: 'grid',
                gap: '1rem'
              }}>
                {exams.map((exam) => (
                  <div 
                    key={exam._id}
                    style={{
                      border: '1px solid #e5e7eb',
                      borderRadius: '0.5rem',
                      padding: '1.5rem',
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
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ flex: 1 }}>
                        <p style={{
                          color: '#6b7280',
                          fontSize: '0.875rem',
                          marginBottom: '1rem'
                        }}>
                          Subject: {exam.subject}
                        </p>

                        <div style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          gap: '1rem',
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
                            <FileText style={{
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
                            <Award style={{
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
                          fontSize: '0.875rem'
                        }}>
                          <Calendar style={{
                            width: '1rem',
                            height: '1rem',
                            marginRight: '0.5rem'
                          }} />
                          Created: {formatDate(exam.createdAt)}
                        </div>
                      </div>

                      <div style={{
                        display: 'flex',
                        gap: '0.5rem'
                      }}>
                        <Link
                          to={`/admin/submissions?examId=${exam._id}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            textDecoration: 'none',
                            fontSize: '0.875rem'
                          }}
                          title="View Submissions"
                        >
                          <Eye style={{ width: '1rem', height: '1rem' }} />
                        </Link>
                        <button
                          onClick={() => handleDeleteExam(exam._id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            backgroundColor: '#dc2626',
                            color: '#ffffff',
                            padding: '0.5rem',
                            borderRadius: '0.375rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.875rem'
                          }}
                          title="Delete Exam"
                        >
                          <Trash2 style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Student Details Modal */}
        {showStudentModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={() => setShowStudentModal(false)}
          >
            <div 
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '0.5rem',
                maxWidth: '900px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                position: 'sticky',
                top: 0,
                backgroundColor: '#ffffff',
                zIndex: 10
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <h2 style={{
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <Users style={{ width: '1.5rem', height: '1.5rem', marginRight: '0.5rem', color: '#059669' }} />
                    Student Details ({uniqueStudents.length})
                  </h2>
                  <button
                    onClick={() => setShowStudentModal(false)}
                    style={{
                      backgroundColor: '#f3f4f6',
                      border: 'none',
                      borderRadius: '0.375rem',
                      padding: '0.5rem',
                      cursor: 'pointer',
                      fontSize: '1.25rem',
                      color: '#6b7280',
                      width: '2rem',
                      height: '2rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = '#e5e7eb'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = '#f3f4f6'}
                  >
                    ×
                  </button>
                </div>
              </div>

              <div style={{ padding: '1.5rem' }}>
                {uniqueStudents.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '3rem',
                    color: '#6b7280'
                  }}>
                    <Users style={{
                      width: '3rem',
                      height: '3rem',
                      margin: '0 auto 1rem',
                      color: '#d1d5db'
                    }} />
                    <p>No students have submitted exams yet.</p>
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
                          borderBottom: '2px solid #e5e7eb'
                        }}>
                          <th style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Student Name
                          </th>
                          <th style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Email
                          </th>
                          <th style={{
                            padding: '0.75rem',
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Submissions
                          </th>
                          <th style={{
                            padding: '0.75rem',
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Best Score
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {uniqueStudents.map((student) => (
                          <tr 
                            key={student._id}
                            style={{
                              borderBottom: '1px solid #e5e7eb'
                            }}
                          >
                            <td style={{
                              padding: '0.75rem'
                            }}>
                              <div style={{
                                fontWeight: '500',
                                color: '#1f2937',
                                fontSize: '0.875rem'
                              }}>
                                {student.name}
                              </div>
                            </td>
                            <td style={{
                              padding: '0.75rem'
                            }}>
                              <div style={{
                                color: '#6b7280',
                                fontSize: '0.875rem'
                              }}>
                                {student.email}
                              </div>
                            </td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center'
                            }}>
                              <span style={{
                                display: 'inline-block',
                                padding: '0.25rem 0.75rem',
                                borderRadius: '9999px',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                                backgroundColor: '#dbeafe',
                                color: '#1e40af'
                              }}>
                                {student.totalSubmissions}
                              </span>
                            </td>
                            <td style={{
                              padding: '0.75rem',
                              textAlign: 'center'
                            }}>
                              <div style={{
                                fontWeight: '600',
                                fontSize: '0.875rem',
                                color: '#059669'
                              }}>
                                {student.bestScore}%
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
        )}

        {/* Change Credentials Modal */}
        {showCredentialsModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    backgroundColor: '#f3e8ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Key style={{ width: '1.25rem', height: '1.25rem', color: '#8b5cf6' }} />
                  </div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    Change Admin Credentials
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowCredentialsModal(false);
                    setCredentialsError('');
                    setCredentialsForm({
                      currentAdminId: '',
                      currentPassword: '',
                      newStudentId: '',
                      newPassword: '',
                      confirmPassword: ''
                    });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    color: '#6b7280'
                  }}
                >
                  <X style={{ width: '1.5rem', height: '1.5rem' }} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleCredentialsChange} style={{ padding: '1.5rem' }}>
                {credentialsError && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.375rem',
                    padding: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#dc2626',
                      margin: 0
                    }}>
                      {credentialsError}
                    </p>
                  </div>
                )}

                {/* Current Admin ID */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Current Admin ID
                  </label>
                  <input
                    type="text"
                    value={credentialsForm.currentAdminId}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 11);
                      setCredentialsForm({ ...credentialsForm, currentAdminId: value });
                    }}
                    placeholder="Enter your current 11-digit Admin ID"
                    maxLength="11"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                  />
                </div>

                {/* Current Password */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={credentialsForm.currentPassword}
                    onChange={(e) => setCredentialsForm({...credentialsForm, currentPassword: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="Enter current password"
                  />
                </div>

                {/* New Student ID */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    New Admin ID (11 digits)
                  </label>
                  <input
                    type="text"
                    value={credentialsForm.newStudentId}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value.length <= 11) {
                        setCredentialsForm({...credentialsForm, newStudentId: value});
                      }
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="11"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="Enter new 11-digit admin ID"
                  />
                </div>

                {/* New Password */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    New Password
                  </label>
                  <input
                    type="password"
                    value={credentialsForm.newPassword}
                    onChange={(e) => setCredentialsForm({...credentialsForm, newPassword: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="Enter new password (min 6 characters)"
                  />
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    value={credentialsForm.confirmPassword}
                    onChange={(e) => setCredentialsForm({...credentialsForm, confirmPassword: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="Confirm new password"
                  />
                </div>

                {/* Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCredentialsModal(false);
                      setCredentialsError('');
                      setCredentialsForm({
                        currentAdminId: '',
                        currentPassword: '',
                        newStudentId: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    style={{
                      padding: '0.625rem 1.25rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.625rem 1.25rem',
                      backgroundColor: '#8b5cf6',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Update Credentials
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Add Multiple Admin Modal */}
        {showAddAdminModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              maxWidth: '500px',
              width: '100%',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)'
            }}>
              {/* Modal Header */}
              <div style={{
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    borderRadius: '50%',
                    backgroundColor: '#fef3c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Plus style={{ width: '1.25rem', height: '1.25rem', color: '#f59e0b' }} />
                  </div>
                  <h2 style={{
                    fontSize: '1.25rem',
                    fontWeight: 'bold',
                    color: '#1f2937',
                    margin: 0
                  }}>
                    Add Multiple Admin
                  </h2>
                </div>
                <button
                  onClick={() => {
                    setShowAddAdminModal(false);
                    setAddAdminError('');
                    setAddAdminForm({
                      name: '',
                      adminId: '',
                      email: '',
                      password: '',
                      confirmPassword: ''
                    });
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem',
                    color: '#6b7280'
                  }}
                >
                  <X style={{ width: '1.5rem', height: '1.5rem' }} />
                </button>
              </div>

              {/* Modal Body */}
              <form onSubmit={handleAddAdmin} style={{ padding: '1.5rem' }}>
                {addAdminError && (
                  <div style={{
                    backgroundColor: '#fee2e2',
                    border: '1px solid #fecaca',
                    borderRadius: '0.375rem',
                    padding: '0.75rem',
                    marginBottom: '1rem'
                  }}>
                    <p style={{
                      fontSize: '0.875rem',
                      color: '#dc2626',
                      margin: 0
                    }}>
                      {addAdminError}
                    </p>
                  </div>
                )}

                {/* Full Name */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={addAdminForm.name}
                    onChange={(e) => setAddAdminForm({...addAdminForm, name: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="Enter admin full name"
                  />
                </div>

                {/* Admin ID */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Admin ID (11 digits)
                  </label>
                  <input
                    type="text"
                    value={addAdminForm.adminId}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9]/g, '');
                      if (value.length <= 11) {
                        setAddAdminForm({...addAdminForm, adminId: value});
                      }
                    }}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength="11"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="Enter 11-digit admin ID"
                  />
                </div>

                {/* Email */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={addAdminForm.email}
                    onChange={(e) => setAddAdminForm({...addAdminForm, email: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="Enter admin email"
                  />
                </div>

                {/* Password */}
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={addAdminForm.password}
                    onChange={(e) => setAddAdminForm({...addAdminForm, password: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="Enter password (min 6 characters)"
                  />
                </div>

                {/* Confirm Password */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '0.5rem'
                  }}>
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={addAdminForm.confirmPassword}
                    onChange={(e) => setAddAdminForm({...addAdminForm, confirmPassword: e.target.value})}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '1px solid #d1d5db',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      outline: 'none'
                    }}
                    placeholder="Confirm password"
                  />
                </div>

                {/* Buttons */}
                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  justifyContent: 'flex-end'
                }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddAdminModal(false);
                      setAddAdminError('');
                      setAddAdminForm({
                        name: '',
                        adminId: '',
                        email: '',
                        password: '',
                        confirmPassword: ''
                      });
                    }}
                    style={{
                      padding: '0.625rem 1.25rem',
                      backgroundColor: '#f3f4f6',
                      color: '#374151',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{
                      padding: '0.625rem 1.25rem',
                      backgroundColor: '#f59e0b',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '0.375rem',
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      cursor: 'pointer'
                    }}
                  >
                    Create Admin
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Admin List Modal */}
        {showAdminListModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '0.5rem',
              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
              width: '100%',
              maxWidth: '800px',
              maxHeight: '90vh',
              overflow: 'auto'
            }}>
              {/* Modal Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.5rem',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '1.25rem',
                  fontWeight: 'bold',
                  color: '#1f2937'
                }}>
                  All Admins
                </h3>
                <button
                  onClick={() => setShowAdminListModal(false)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem',
                    color: '#6b7280'
                  }}
                >
                  <X style={{ width: '1.5rem', height: '1.5rem' }} />
                </button>
              </div>

              {/* Admin List */}
              <div style={{ padding: '1.5rem' }}>
                {adminList.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '2rem',
                    color: '#6b7280'
                  }}>
                    <Users style={{
                      width: '3rem',
                      height: '3rem',
                      margin: '0 auto 1rem',
                      color: '#d1d5db'
                    }} />
                    <p>No admins found</p>
                  </div>
                ) : (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{
                      width: '100%',
                      borderCollapse: 'collapse'
                    }}>
                      <thead>
                        <tr style={{
                          backgroundColor: '#f9fafb',
                          borderBottom: '2px solid #e5e7eb'
                        }}>
                          <th style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Name
                          </th>
                          <th style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Admin ID
                          </th>
                          <th style={{
                            padding: '0.75rem',
                            textAlign: 'left',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Email
                          </th>
                          <th style={{
                            padding: '0.75rem',
                            textAlign: 'center',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            color: '#374151'
                          }}>
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {adminList.map((admin) => {
                          const isMainAdmin = admin.email === 'admin@examin.com';
                          const isCurrentUser = admin.id === user?._id || admin.studentId === user?.studentId;
                          
                          return (
                            <tr 
                              key={admin.id}
                              style={{
                                borderBottom: '1px solid #e5e7eb'
                              }}
                            >
                              <td style={{
                                padding: '0.75rem'
                              }}>
                                <div style={{
                                  fontWeight: '500',
                                  color: '#1f2937',
                                  fontSize: '0.875rem'
                                }}>
                                  {admin.name}
                                  {isMainAdmin && (
                                    <span style={{
                                      marginLeft: '0.5rem',
                                      fontSize: '0.75rem',
                                      padding: '0.125rem 0.5rem',
                                      backgroundColor: '#fef3c7',
                                      color: '#92400e',
                                      borderRadius: '9999px',
                                      fontWeight: '600'
                                    }}>
                                      MAIN
                                    </span>
                                  )}
                                  {isCurrentUser && !isMainAdmin && (
                                    <span style={{
                                      marginLeft: '0.5rem',
                                      fontSize: '0.75rem',
                                      padding: '0.125rem 0.5rem',
                                      backgroundColor: '#dbeafe',
                                      color: '#1e40af',
                                      borderRadius: '9999px',
                                      fontWeight: '600'
                                    }}>
                                      YOU
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td style={{
                                padding: '0.75rem'
                              }}>
                                <div style={{
                                  color: '#6b7280',
                                  fontSize: '0.875rem',
                                  fontFamily: 'monospace'
                                }}>
                                  {admin.studentId}
                                </div>
                              </td>
                              <td style={{
                                padding: '0.75rem'
                              }}>
                                <div style={{
                                  color: '#6b7280',
                                  fontSize: '0.875rem'
                                }}>
                                  {admin.email}
                                </div>
                              </td>
                              <td style={{
                                padding: '0.75rem',
                                textAlign: 'center'
                              }}>
                                {!isMainAdmin && (
                                  <button
                                    onClick={() => handleDeleteAdmin(admin.id)}
                                    style={{
                                      padding: '0.375rem 0.75rem',
                                      backgroundColor: '#fef2f2',
                                      color: '#dc2626',
                                      border: '1px solid #fecaca',
                                      borderRadius: '0.375rem',
                                      fontSize: '0.75rem',
                                      fontWeight: '500',
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.25rem',
                                      transition: 'all 0.2s'
                                    }}
                                    onMouseEnter={(e) => {
                                      e.target.style.backgroundColor = '#dc2626';
                                      e.target.style.color = '#ffffff';
                                    }}
                                    onMouseLeave={(e) => {
                                      e.target.style.backgroundColor = '#fef2f2';
                                      e.target.style.color = '#dc2626';
                                    }}
                                  >
                                    <Trash2 style={{ width: '0.875rem', height: '0.875rem' }} />
                                    Delete
                                  </button>
                                )}
                                {isMainAdmin && (
                                  <span style={{
                                    fontSize: '0.75rem',
                                    color: '#9ca3af',
                                    fontStyle: 'italic'
                                  }}>
                                    Cannot delete
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;