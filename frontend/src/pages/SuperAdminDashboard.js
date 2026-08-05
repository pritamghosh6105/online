import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, examAPI, scheduleAPI, superAdminAPI } from '../api';
import { 
  ShieldCheck, 
  Building, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Plus, 
  Trash2, 
  RefreshCw, 
  UserCheck,
  AlertTriangle,
  Calendar,
  Mail,
  BarChart2,
  FileSpreadsheet,
  Download,
  Activity,
  Award
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('analytics');
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [approvedAdmins, setApprovedAdmins] = useState([]);
  const [approvedInstitutions, setApprovedInstitutions] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pendingRes, adminsRes, instRes, examsRes, schedulesRes, analyticsRes, auditRes] = await Promise.all([
        authAPI.getPendingAdmins().catch(() => ({ data: { pendingAdmins: [] } })),
        authAPI.getAdmins().catch(() => ({ data: { admins: [] } })),
        authAPI.getApprovedInstitutions().catch(() => ({ data: { institutions: [] } })),
        examAPI.getExams().catch(() => ({ data: { exams: [] } })),
        scheduleAPI.getSchedules().catch(() => ({ data: { schedules: [] } })),
        superAdminAPI.getAnalytics().catch(() => ({ data: { analytics: null } })),
        superAdminAPI.getAuditLogs().catch(() => ({ data: { logs: [] } }))
      ]);

      setPendingAdmins(pendingRes.data.pendingAdmins || []);
      setApprovedAdmins(adminsRes.data.admins || []);
      setApprovedInstitutions(instRes.data.institutions || []);
      setAllExams(examsRes.data.exams || []);
      setSchedules(schedulesRes.data.schedules || []);
      setAnalytics(analyticsRes.data.analytics);
      setAuditLogs(auditRes.data.logs || []);
    } catch (err) {
      console.error('Error loading superadmin data:', err);
      setError('Failed to load Super Admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadBackup = async () => {
    try {
      const res = await superAdminAPI.getBackup();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(res.data.backup, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `examin_system_backup_${new Date().toISOString().slice(0,10)}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      alert('✅ Platform database backup JSON downloaded successfully!');
    } catch (err) {
      alert('Failed to download system backup');
    }
  };

  const handleUpdateScheduleStatus = async (id, status) => {
    try {
      const res = await scheduleAPI.updateStatus(id, status);
      const createdAdmin = res.data?.createdAdmin;
      
      if (createdAdmin) {
        if (createdAdmin.isNew) {
          alert(`✅ Request marked as "${status}"!\n\n👑 Admin Account Created for ${createdAdmin.name}:\n• Institution: ${createdAdmin.institution}\n• Email: ${createdAdmin.email}\n• Admin ID: ${createdAdmin.adminId}\n• Password: ${createdAdmin.password}\n\n${createdAdmin.emailSent ? '📧 Admin login credentials email sent successfully!' : 'ℹ️ Admin credentials created. (Configure SMTP settings in .env to dispatch live emails).'}`);
        } else {
          alert(`✅ Request marked as "${status}"!\n\n👑 User "${createdAdmin.name}" (${createdAdmin.email}) is now an approved Admin for ${createdAdmin.institution}.`);
        }
      } else {
        alert(`Schedule status updated to "${status}".`);
      }
      fetchSuperAdminData();
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update scheduled test status');
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scheduled test request?')) return;
    try {
      await scheduleAPI.deleteSchedule(id);
      fetchSuperAdminData();
    } catch (err) {
      console.error('Error deleting schedule:', err);
      alert('Failed to delete scheduled test request');
    }
  };

  const handleApprove = async (adminId, institutionName) => {
    try {
      setActionLoading(true);
      const res = await authAPI.approveAdmin(adminId);
      if (res.data?.success) {
        alert(`✅ Institution "${institutionName}" & Admin approved successfully!`);
        fetchSuperAdminData();
      }
    } catch (err) {
      console.error('Approval error:', err);
      alert('Failed to approve admin account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAdmin = async (adminId, name) => {
    if (!window.confirm(`Are you sure you want to delete or reject admin "${name}"?`)) return;
    try {
      setActionLoading(true);
      await authAPI.deleteAdmin(adminId);
      alert(`Admin "${name}" removed successfully.`);
      fetchSuperAdminData();
    } catch (err) {
      console.error('Delete admin error:', err);
      alert('Failed to delete admin account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteExam = async (examId, title) => {
    if (!window.confirm(`Are you sure you want to delete exam "${title}"?`)) return;
    try {
      await examAPI.deleteExam(examId);
      alert('Exam deleted successfully.');
      fetchSuperAdminData();
    } catch (err) {
      console.error('Delete exam error:', err);
      alert('Failed to delete exam.');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Super Admin Command Center..." />;
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
        {/* Hero Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)',
          borderRadius: '1rem',
          padding: '2rem',
          color: '#ffffff',
          marginBottom: '2rem',
          boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.4)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                padding: '0.25rem 0.75rem',
                borderRadius: '9999px',
                fontSize: '0.75rem',
                fontWeight: '700',
                letterSpacing: '0.05em',
                marginBottom: '0.75rem',
                backdropFilter: 'blur(4px)',
                color: '#fef08a'
              }}>
                <ShieldCheck size={16} /> 👑 SUPER ADMIN CONTROL CENTER
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: '800', margin: 0, letterSpacing: '-0.025em' }}>
                System Governance & Institution Management
              </h1>
              <p style={{ color: '#c7d2fe', fontSize: '0.9rem', marginTop: '0.35rem', marginBottom: 0 }}>
                Approve school admins, manage multi-tenant institutions, and monitor all platform activity.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTab('schedules')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#7c3aed',
                  color: '#ffffff',
                  border: 'none',
                  padding: '0.55rem 1.1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 6px -1px rgba(124, 58, 237, 0.3)'
                }}
              >
                <Calendar size={18} /> Scheduled Test Requests ({schedules.length})
              </button>

              <button
                onClick={fetchSuperAdminData}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} /> Refresh Data
              </button>
              <Link
                to="/admin/create-exam"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  backgroundColor: '#ffffff',
                  color: '#1e1b4b',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                  fontWeight: '700',
                  textDecoration: 'none'
                }}
              >
                <Plus size={16} /> Create Exam
              </Link>
            </div>
          </div>
        </div>

        {/* System Overview Stat Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
          marginBottom: '2rem'
        }}>
          {/* Stat 1: Scheduled Test Requests */}
          <div 
            onClick={() => setActiveTab('schedules')}
            style={{
              backgroundColor: activeTab === 'schedules' ? '#f5f3ff' : '#ffffff',
              border: activeTab === 'schedules' ? '2px solid #7c3aed' : '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.35rem 0' }}>
                  Scheduled Requests
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '800', color: '#7c3aed', margin: 0 }}>
                  {schedules.length}
                </p>
              </div>
              <div style={{ backgroundColor: '#f3e8ff', padding: '0.75rem', borderRadius: '0.5rem', color: '#7c3aed' }}>
                <Calendar size={24} />
              </div>
            </div>
          </div>

          {/* Stat 2: Pending Approvals */}
          <div 
            onClick={() => setActiveTab('pending')}
            style={{
              backgroundColor: pendingAdmins.length > 0 ? '#fffbeb' : '#ffffff',
              border: pendingAdmins.length > 0 ? '2px solid #f59e0b' : '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.35rem 0' }}>
                  Pending Approvals
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '800', color: pendingAdmins.length > 0 ? '#d97706' : '#0f172a', margin: 0 }}>
                  {pendingAdmins.length}
                </p>
              </div>
              <div style={{
                backgroundColor: pendingAdmins.length > 0 ? '#fef3c7' : '#f1f5f9',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                color: pendingAdmins.length > 0 ? '#d97706' : '#64748b'
              }}>
                <AlertTriangle size={24} />
              </div>
            </div>
          </div>

          {/* Stat 3: Active Institutions */}
          <div 
            onClick={() => setActiveTab('approved')}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.35rem 0' }}>
                  Approved Schools
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '800', color: '#059669', margin: 0 }}>
                  {approvedInstitutions.length}
                </p>
              </div>
              <div style={{ backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', color: '#059669' }}>
                <Building size={24} />
              </div>
            </div>
          </div>

          {/* Stat 4: System Admins */}
          <div 
            onClick={() => setActiveTab('approved')}
            style={{
              backgroundColor: '#ffffff',
              border: '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              cursor: 'pointer',
              boxShadow: '0 2px 4px rgba(0,0,0,0.04)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.35rem 0' }}>
                  System Admins
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '800', color: '#2563eb', margin: 0 }}>
                  {approvedAdmins.length}
                </p>
              </div>
              <div style={{ backgroundColor: '#dbeafe', padding: '0.75rem', borderRadius: '0.5rem', color: '#2563eb' }}>
                <UserCheck size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-bar-scrollable" style={{
          display: 'flex',
          gap: '0.5rem',
          borderBottom: '2px solid #e2e8f0',
          marginBottom: '1.5rem',
          overflowX: 'auto',
          paddingBottom: '0.25rem'
        }}>
          <button
            onClick={() => setActiveTab('schedules')}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.5rem 0.5rem 0 0',
              fontWeight: '700',
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: activeTab === 'schedules' ? '#ffffff' : 'transparent',
              color: activeTab === 'schedules' ? '#7c3aed' : '#64748b',
              borderBottom: activeTab === 'schedules' ? '3px solid #7c3aed' : 'none'
            }}
          >
            <Calendar size={18} />
            Scheduled Test Requests ({schedules.length})
          </button>
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.5rem 0.5rem 0 0',
              fontWeight: '700',
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: activeTab === 'pending' ? '#ffffff' : 'transparent',
              color: activeTab === 'pending' ? '#d97706' : '#64748b',
              borderBottom: activeTab === 'pending' ? '3px solid #d97706' : 'none'
            }}
          >
            <AlertTriangle size={18} />
            Pending Approvals ({pendingAdmins.length})
          </button>

          <button
            onClick={() => setActiveTab('approved')}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.5rem 0.5rem 0 0',
              fontWeight: '700',
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: activeTab === 'approved' ? '#ffffff' : 'transparent',
              color: activeTab === 'approved' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'approved' ? '3px solid #2563eb' : 'none'
            }}
          >
            <Building size={18} />
            Approved Schools & Admins ({approvedAdmins.length})
          </button>

          <button
            onClick={() => setActiveTab('exams')}
            style={{
              padding: '0.75rem 1.25rem',
              borderRadius: '0.5rem 0.5rem 0 0',
              fontWeight: '700',
              fontSize: '0.9rem',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              backgroundColor: activeTab === 'exams' ? '#ffffff' : 'transparent',
              color: activeTab === 'exams' ? '#7c3aed' : '#64748b',
              borderBottom: activeTab === 'exams' ? '3px solid #7c3aed' : 'none'
            }}
          >
            <BookOpen size={18} />
            All Platform Exams ({allExams.length})
          </button>
        </div>

        {/* Tab 0: Scheduled Test Requests */}
        {activeTab === 'schedules' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar style={{ color: '#7c3aed' }} /> Scheduled Test Requests & Institutional Demos ({schedules.length})
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                  Institutional demo bookings & test scheduling requests submitted from the landing page.
                </p>
              </div>
            </div>

            {schedules.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <Calendar size={48} color="#7c3aed" style={{ marginBottom: '1rem', opacity: 0.5 }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>No Scheduled Test Requests Yet</h3>
                <p style={{ margin: 0 }}>When institution administrators request a scheduled demo from the homepage, their request will appear here.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>Applicant & Email</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>Institution</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>Preferred Date & Type</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '700' }}>Status</th>
                      <th style={{ padding: '0.85rem 1rem', fontWeight: '700', textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedules.map((item) => (
                      <tr key={item._id || item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.name}</div>
                          <div style={{ fontSize: '0.825rem', color: '#2563eb', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                            <Mail size={13} /> {item.email}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '600', color: '#334155', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                            <Building size={14} style={{ color: '#7c3aed' }} /> {item.institution}
                          </div>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <div style={{ fontWeight: '700', color: '#0f172a' }}>{item.date}</div>
                          <span style={{
                            fontSize: '0.725rem',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            backgroundColor: '#eff6ff',
                            color: '#2563eb',
                            fontWeight: '700',
                            textTransform: 'capitalize',
                            display: 'inline-block',
                            marginTop: '0.25rem'
                          }}>
                            {item.testType || 'University'}
                          </span>
                        </td>
                        <td style={{ padding: '1rem' }}>
                          <select
                            value={item.status || 'pending'}
                            onChange={(e) => handleUpdateScheduleStatus(item._id || item.id, e.target.value)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              border: '1px solid #cbd5e1',
                              cursor: 'pointer',
                              backgroundColor: 
                                item.status === 'confirmed' ? '#dcfce7' :
                                item.status === 'contacted' ? '#dbeafe' :
                                item.status === 'completed' ? '#f3e8ff' : '#fef3c7',
                              color: 
                                item.status === 'confirmed' ? '#166534' :
                                item.status === 'contacted' ? '#1e40af' :
                                item.status === 'completed' ? '#6b21a8' : '#92400e'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="contacted">Contacted</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        <td style={{ padding: '1rem', textAlign: 'center' }}>
                          <button
                            onClick={() => handleDeleteSchedule(item._id || item.id)}
                            style={{
                              backgroundColor: 'transparent',
                              color: '#ef4444',
                              border: '1px solid #fca5a5',
                              padding: '0.35rem 0.75rem',
                              borderRadius: '0.375rem',
                              cursor: 'pointer',
                              fontSize: '0.8rem',
                              fontWeight: '600',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.25rem'
                            }}
                          >
                            <Trash2 size={14} /> Remove
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Pending Approvals */}
        {activeTab === 'pending' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Clock style={{ color: '#d97706' }} /> Institution Sub-Admins Awaiting Approval
            </h2>

            {pendingAdmins.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b' }}>
                <CheckCircle2 size={48} color="#059669" style={{ marginBottom: '1rem' }} />
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>All Caught Up!</h3>
                <p style={{ margin: 0 }}>There are no pending institution admin requests at this time.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pendingAdmins.map((admin) => (
                  <div key={admin.id} style={{
                    border: '1px solid #fef3c7',
                    backgroundColor: '#fffbeb',
                    borderRadius: '0.5rem',
                    padding: '1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1f2937' }}>{admin.name}</span>
                        <span style={{ backgroundColor: '#fef3c7', color: '#b45309', padding: '0.15rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: '600' }}>
                          PENDING APPROVAL
                        </span>
                      </div>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#4b5563', fontSize: '0.875rem' }}>
                        <strong>Email:</strong> {admin.email} {admin.studentId ? `• ID: ${admin.studentId}` : ''}
                      </p>
                      <p style={{ margin: '0.25rem 0 0 0', color: '#1e40af', fontSize: '0.9rem', fontWeight: '600' }}>
                        🏫 Requested Institution / School: <span style={{ textDecoration: 'underline' }}>{admin.institution || 'Not specified'}</span>
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <button
                        disabled={actionLoading}
                        onClick={() => handleApprove(admin.id, admin.institution || admin.name)}
                        style={{
                          backgroundColor: '#059669',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.6rem 1.2rem',
                          borderRadius: '0.375rem',
                          fontWeight: '700',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <CheckCircle2 size={16} /> Approve Institution
                      </button>

                      <button
                        disabled={actionLoading}
                        onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                        style={{
                          backgroundColor: '#ef4444',
                          color: '#ffffff',
                          border: 'none',
                          padding: '0.6rem 1rem',
                          borderRadius: '0.375rem',
                          fontWeight: '600',
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <XCircle size={16} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Approved Institutions & Admins */}
        {activeTab === 'approved' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Building style={{ color: '#059669' }} /> Approved Institutions & System Admins
            </h2>

            {approvedAdmins.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>No active admin accounts found.</p>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '0.75rem 1rem' }}>Admin Name</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Email / Admin ID</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Role</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Status</th>
                      <th style={{ padding: '0.75rem 1rem' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedAdmins.map((admin) => (
                      <tr key={admin.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: '600', color: '#1f2937' }}>
                          {admin.name}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#4b5563' }}>
                          {admin.email} {admin.studentId ? `(${admin.studentId})` : ''}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{
                            backgroundColor: admin.role === 'superadmin' || admin.email === 'admin@examin.com' ? '#ede9fe' : '#dbeafe',
                            color: admin.role === 'superadmin' || admin.email === 'admin@examin.com' ? '#6d28d9' : '#1d4ed8',
                            padding: '0.15rem 0.5rem',
                            borderRadius: '9999px',
                            fontSize: '0.75rem',
                            fontWeight: '700',
                            textTransform: 'uppercase'
                          }}>
                            {admin.role === 'superadmin' || admin.email === 'admin@examin.com' ? 'Super Admin' : 'Sub Admin'}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{ color: '#059669', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={16} /> Active
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          {admin.email !== 'admin@examin.com' && (
                            <button
                              onClick={() => handleDeleteAdmin(admin.id, admin.name)}
                              style={{
                                backgroundColor: 'transparent',
                                color: '#ef4444',
                                border: '1px solid #fca5a5',
                                padding: '0.35rem 0.75rem',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.8rem',
                                fontWeight: '600',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: All Platform Exams */}
        {activeTab === 'exams' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen style={{ color: '#7c3aed' }} /> All Exams Across All Institutions
            </h2>

            {allExams.length === 0 ? (
              <p style={{ color: '#64748b', textAlign: 'center', padding: '2rem 0' }}>No exams created yet.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {allExams.map((exam) => (
                  <div key={exam._id} style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '0.5rem',
                    padding: '1rem 1.25rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '0.75rem'
                  }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '700', color: '#0f172a' }}>
                          {exam.title}
                        </h3>
                        <span style={{ backgroundColor: '#ede9fe', color: '#6d28d9', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>
                          {exam.subject}
                        </span>
                        {exam.institution && (
                          <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600' }}>
                            🏫 {exam.institution}
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0.35rem 0 0 0', color: '#64748b', fontSize: '0.85rem' }}>
                        Duration: {exam.duration} mins • Total Marks: {exam.totalMarks} • Created by: {exam.createdBy?.name || 'Admin'}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteExam(exam._id, exam.title)}
                      style={{
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        border: 'none',
                        padding: '0.4rem 0.85rem',
                        borderRadius: '0.375rem',
                        fontWeight: '600',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      <Trash2 size={14} /> Delete Exam
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
