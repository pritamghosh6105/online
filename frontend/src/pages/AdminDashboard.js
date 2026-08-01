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
  X,
  Building
} from 'lucide-react';
import { formatDate, formatDuration } from '../utils/helpers';
import LoadingSpinner from '../components/LoadingSpinner';

const AdminDashboard = () => {
  const [exams, setExams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [stats, setStats] = useState({ examsCount: 0, submissionsCount: 0 });
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
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchData();
    fetchPendingAdmins();
  }, []);

  const fetchPendingAdmins = async () => {
    try {
      const res = await authAPI.getPendingAdmins();
      if (res.data?.success) {
        setPendingAdmins(res.data.pendingAdmins || []);
      }
    } catch (err) {
      console.error('Error fetching pending admins:', err);
    }
  };

  const handleApproveAdmin = async (adminId) => {
    try {
      const res = await authAPI.approveAdmin(adminId);
      if (res.data?.success) {
        alert(res.data.message || 'Admin approved successfully!');
        fetchPendingAdmins();
      }
    } catch (err) {
      console.error('Error approving admin:', err);
      alert('Failed to approve admin');
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch stats only for initial load (much faster)
      const [examsStatsResponse, submissionsStatsResponse] = await Promise.all([
        examAPI.getExams({ statsOnly: true }),
        submissionAPI.getAllSubmissions({ statsOnly: true })
      ]);
      
      setStats({
        examsCount: examsStatsResponse.data.count || 0,
        submissionsCount: submissionsStatsResponse.data.count || 0
      });

      // Fetch limited recent exams for display (only first page)
      const examsResponse = await examAPI.getExams({ page: 1, limit: 10 });
      setExams(examsResponse.data.exams || []);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentData = async () => {
    try {
      // Fetch submissions only when student modal is opened
      const submissionsResponse = await submissionAPI.getAllSubmissions({ page: 1, limit: 100 });
      setSubmissions(submissionsResponse.data.submissions || []);
    } catch (error) {
      console.error('Error fetching student data:', error);
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
      await authAPI.changeCredentials({
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
      await authAPI.addAdmin({
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
        {/* Hero Header Banner */}
        <div className="admin-hero-banner">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div className="hero-badge" style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.15)', padding: '0.2rem 0.6rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600', marginBottom: '0.5rem', backdropFilter: 'blur(4px)' }}>
                ✨ ADMIN CONTROL CENTER
              </div>
              <h1 style={{ fontSize: '1.65rem', fontWeight: '800', margin: 0, letterSpacing: '-0.025em' }}>
                Welcome back, {user?.name || 'Admin'}
              </h1>
              <p style={{ color: '#c7d2fe', fontSize: '0.875rem', marginTop: '0.25rem', marginBottom: 0 }}>
                Manage examinations, monitor real-time submissions, and manage system admins.
              </p>
            </div>
            <div>
              <Link
                to="/admin/create-exam"
                className="admin-action-btn"
                style={{ backgroundColor: '#ffffff', color: '#1e1b4b', padding: '0.5rem 1rem', fontSize: '0.875rem' }}
              >
                <Plus style={{ width: '1.1rem', height: '1.1rem' }} />
                Create Exam
              </Link>
            </div>
          </div>
        </div>

        {/* Pending Sub-Admin Approvals Banner (Super Admin view) */}
        {pendingAdmins.length > 0 && (
          <div style={{
            backgroundColor: '#fffbeb',
            border: '1px solid #fef3c7',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
          }}>
            <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#92400e', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building size={18} /> Pending Institution / School Admin Approvals ({pendingAdmins.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingAdmins.map((admin) => (
                <div key={admin.id} style={{
                  backgroundColor: '#ffffff',
                  padding: '0.75rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}>
                  <div>
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{admin.name}</span>
                    <span style={{ color: '#6b7280', fontSize: '0.85rem', marginLeft: '0.5rem' }}>({admin.email})</span>
                    <div style={{ fontSize: '0.8rem', color: '#2563eb', fontWeight: '500', marginTop: '0.2rem' }}>
                      🏫 Institution: <strong>{admin.institution || 'Not specified'}</strong>
                    </div>
                  </div>
                  <button
                    onClick={() => handleApproveAdmin(admin.id)}
                    style={{
                      backgroundColor: '#16a34a',
                      color: '#ffffff',
                      border: 'none',
                      padding: '0.4rem 0.85rem',
                      borderRadius: '0.375rem',
                      fontWeight: '600',
                      fontSize: '0.8rem',
                      cursor: 'pointer'
                    }}
                  >
                    Approve Institution Admin
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats Cards Grid */}
        <div className="responsive-grid" style={{ marginBottom: '2rem' }}>
          {/* Card 1: Total Exams */}
          <div className="admin-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                  Total Exams
                </p>
                <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {stats.examsCount}
                </p>
              </div>
              <div style={{ width: '3.25rem', height: '3.25rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                <BookOpen style={{ width: '1.75rem', height: '1.75rem' }} />
              </div>
            </div>
          </div>

          {/* Card 2: Total Students */}
          <div 
            className="admin-stat-card"
            onClick={() => {
              setShowStudentModal(true);
              if (submissions.length === 0) {
                fetchStudentData();
              }
            }}
            style={{ cursor: 'pointer' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                  Total Students
                </p>
                <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {totalStudents}
                </p>
                <p style={{ color: '#059669', fontSize: '0.775rem', marginTop: '0.375rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <span>Click to view breakdown</span> →
                </p>
              </div>
              <div style={{ width: '3.25rem', height: '3.25rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#059669' }}>
                <Users style={{ width: '1.75rem', height: '1.75rem' }} />
              </div>
            </div>
          </div>

          {/* Card 3: Total Submissions */}
          <div className="admin-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.375rem' }}>
                  Total Submissions
                </p>
                <p style={{ fontSize: '2.25rem', fontWeight: '800', color: '#0f172a', margin: 0 }}>
                  {stats.submissionsCount}
                </p>
              </div>
              <div style={{ width: '3.25rem', height: '3.25rem', borderRadius: '0.75rem', background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}>
                <FileText style={{ width: '1.75rem', height: '1.75rem' }} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="admin-table-card" style={{ marginBottom: '2rem' }}>
          <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#0f172a', margin: 0 }}>
              ⚡ Quick Actions
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>Admin Shortcuts</span>
          </div>
          <div style={{ padding: '1.5rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <Link
              to="/admin/create-exam"
              className="admin-action-btn"
              style={{ backgroundColor: '#2563eb', color: '#ffffff' }}
            >
              <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
              Create New Exam
            </Link>
            <Link
              to="/admin/submissions"
              className="admin-action-btn"
              style={{ backgroundColor: '#059669', color: '#ffffff' }}
            >
              <Eye style={{ width: '1.25rem', height: '1.25rem' }} />
              View Submissions
            </Link>
            
            {/* Main Admin Only Tools */}
            {isMainAdmin && (
              <>
                <button
                  onClick={() => setShowCredentialsModal(true)}
                  className="admin-action-btn"
                  style={{ backgroundColor: '#7c3aed', color: '#ffffff' }}
                >
                  <Key style={{ width: '1.25rem', height: '1.25rem' }} />
                  Change Credentials
                </button>
                <button
                  onClick={() => setShowAddAdminModal(true)}
                  className="admin-action-btn"
                  style={{ backgroundColor: '#d97706', color: '#ffffff' }}
                >
                  <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
                  Add New Admin
                </button>
                <button
                  onClick={() => {
                    setShowAdminListModal(true);
                    fetchAdmins();
                  }}
                  className="admin-action-btn"
                  style={{ backgroundColor: '#db2777', color: '#ffffff' }}
                >
                  <Users style={{ width: '1.25rem', height: '1.25rem' }} />
                  View All Admins
                </button>
              </>
            )}
          </div>
        </div>

        {/* Recent Exams */}
        <div className="admin-table-card">
          <div style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid #f1f5f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.5rem',
            flexWrap: 'nowrap'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', minWidth: 0 }}>
              <div style={{
                width: '2.25rem',
                height: '2.25rem',
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#2563eb',
                flexShrink: 0
              }}>
                <BookOpen style={{ width: '1.25rem', height: '1.25rem' }} />
              </div>
              <h2 style={{
                fontSize: '1.1rem',
                fontWeight: '700',
                color: '#0f172a',
                margin: 0,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                Managed Exams
              </h2>
            </div>
            <span style={{
              fontSize: '0.75rem',
              color: '#475569',
              fontWeight: '600',
              backgroundColor: '#f1f5f9',
              padding: '0.3rem 0.75rem',
              borderRadius: '9999px',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              Showing {exams.length} exam(s)
            </span>
          </div>

          <div style={{ padding: '1.5rem' }}>
            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                padding: '1rem',
                borderRadius: '0.5rem',
                marginBottom: '1rem'
              }}>
                {error}
              </div>
            )}

            {exams.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '3.5rem 1.5rem',
                backgroundColor: '#f8fafc',
                borderRadius: '0.75rem',
                border: '2px dashed #e2e8f0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <div style={{
                  width: '4.5rem',
                  height: '4.5rem',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563eb',
                  marginBottom: '1.25rem',
                  boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.15)'
                }}>
                  <BookOpen style={{ width: '2.25rem', height: '2.25rem' }} />
                </div>
                <h3 style={{
                  fontSize: '1.2rem',
                  fontWeight: '700',
                  color: '#0f172a',
                  marginBottom: '0.5rem'
                }}>
                  No exams created yet
                </h3>
                <p style={{
                  color: '#64748b',
                  fontSize: '0.925rem',
                  maxWidth: '320px',
                  lineHeight: '1.5',
                  marginBottom: '1.5rem'
                }}>
                  Create your first exam to publish questions and monitor student progress.
                </p>
                <Link
                  to="/admin/create-exam"
                  className="admin-action-btn"
                  style={{
                    backgroundColor: '#2563eb',
                    color: '#ffffff',
                    padding: '0.75rem 1.5rem',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
                  }}
                >
                  <Plus style={{ width: '1.25rem', height: '1.25rem' }} />
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