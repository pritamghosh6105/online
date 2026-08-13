import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { authAPI, examAPI, scheduleAPI, superAdminAPI } from '../api';
import { 
  ShieldCheck, 
  Building, 
  BookOpen, 
  CheckCircle2, 
  Plus, 
  Trash2, 
  RefreshCw, 
  UserCheck,
  Calendar,
  Mail,
  Eye,
  X,
  ExternalLink,
  Users
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const SuperAdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('schedules');
  const [pendingAdmins, setPendingAdmins] = useState([]);
  const [approvedAdmins, setApprovedAdmins] = useState([]);
  const [approvedInstitutions, setApprovedInstitutions] = useState([]);
  const [studentsList, setStudentsList] = useState([]);
  const [allExams, setAllExams] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [, setAnalytics] = useState(null);
  const [, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedInstitutionFilter, setSelectedInstitutionFilter] = useState('all');

  const allSchoolNames = [...new Set([
    ...approvedInstitutions,
    ...approvedAdmins.map(a => a.institution).filter(Boolean),
    ...studentsList.map(s => s.institution).filter(Boolean),
    ...allExams.map(e => e.institution).filter(Boolean)
  ])].filter(name => name && name.trim() !== '' && !['Global / SuperAdmin', 'Global', 'Super Admin', 'Super Admin Only', 'N/A'].includes(name.trim()));

  const filteredStudentsList = selectedInstitutionFilter === 'all'
    ? studentsList
    : studentsList.filter(s => (s.institution || 'General').toLowerCase() === selectedInstitutionFilter.toLowerCase());

  const filteredApprovedAdmins = selectedInstitutionFilter === 'all'
    ? approvedAdmins
    : approvedAdmins.filter(a => (a.institution || 'Global').toLowerCase() === selectedInstitutionFilter.toLowerCase());

  const filteredPendingAdmins = selectedInstitutionFilter === 'all'
    ? pendingAdmins
    : pendingAdmins.filter(a => (a.institution || '').toLowerCase() === selectedInstitutionFilter.toLowerCase());

  const filteredAllExams = selectedInstitutionFilter === 'all'
    ? allExams
    : allExams.filter(e => (e.institution || 'General').toLowerCase() === selectedInstitutionFilter.toLowerCase());

  const filteredSchedules = selectedInstitutionFilter === 'all'
    ? schedules
    : schedules.filter(s => (s.institution || '').toLowerCase() === selectedInstitutionFilter.toLowerCase());

  useEffect(() => {
    fetchSuperAdminData();
  }, []);

  const fetchSuperAdminData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [pendingRes, adminsRes, instRes, examsRes, schedulesRes, analyticsRes, auditRes, studentsRes] = await Promise.all([
        authAPI.getPendingAdmins().catch(() => ({ data: { pendingAdmins: [] } })),
        authAPI.getAdmins().catch(() => ({ data: { admins: [] } })),
        authAPI.getApprovedInstitutions().catch(() => ({ data: { institutions: [] } })),
        examAPI.getExams().catch(() => ({ data: { exams: [] } })),
        scheduleAPI.getSchedules().catch(() => ({ data: { schedules: [] } })),
        superAdminAPI.getAnalytics().catch(() => ({ data: { analytics: null } })),
        superAdminAPI.getAuditLogs().catch(() => ({ data: { logs: [] } })),
        superAdminAPI.getStudents().catch(() => ({ data: { students: [] } }))
      ]);

      setPendingAdmins(pendingRes.data.pendingAdmins || []);
      setApprovedAdmins(adminsRes.data.admins || []);
      setApprovedInstitutions(instRes.data.institutions || []);
      setAllExams(examsRes.data.exams || []);
      setSchedules(schedulesRes.data.schedules || []);
      setAnalytics(analyticsRes.data.analytics);
      setAuditLogs(auditRes.data.logs || []);
      setStudentsList(studentsRes.data.students || []);
    } catch (err) {
      console.error('Error loading superadmin data:', err);
      setError('Failed to load Super Admin dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async (studentId, name) => {
    if (!window.confirm(`Are you sure you want to delete student account for "${name}"?`)) return;
    try {
      setActionLoading(true);
      await superAdminAPI.deleteStudent(studentId);
      alert(`Student account "${name}" deleted successfully.`);
      fetchSuperAdminData();
    } catch (err) {
      console.error('Delete student error:', err);
      alert('Failed to delete student account.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResendStudentCredentials = async (studentId, email, name, currentStudentId) => {
    const defaultPass = 'Student@' + (currentStudentId ? currentStudentId.slice(-4) : '1234');
    const customPassPrompt = window.prompt(
      `Resend login credentials email to student "${name}" (${email})?\n\n• Student ID: ${currentStudentId || 'N/A'}\n\nEnter a password to set for this student (or leave blank to use default "${defaultPass}"):`,
      ''
    );

    if (customPassPrompt === null) return; // Cancelled

    try {
      setActionLoading(true);
      const res = await superAdminAPI.resendStudentCredentials(studentId, customPassPrompt.trim());
      alert(`✅ Credentials Email Dispatched!\n\n${res.data?.message || 'Credentials email sent to student.'}`);
      fetchSuperAdminData();
    } catch (err) {
      console.error('Resend credentials error:', err);
      alert('Failed to resend credentials email.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSchool = async (schoolName) => {
    if (!window.confirm(`Are you sure you want to delete approved school "${schoolName}"?\n\nThis will remove all associated admin accounts, schedules, and exams for this institution.`)) return;
    try {
      setActionLoading(true);
      await superAdminAPI.deleteInstitution(schoolName);
      alert(`Approved school "${schoolName}" deleted successfully.`);
      fetchSuperAdminData();
    } catch (err) {
      console.error('Delete school error:', err);
      alert('Failed to delete approved school.');
    } finally {
      setActionLoading(false);
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
      alert('Platform database backup JSON downloaded successfully!');
    } catch (err) {
      alert('Failed to download system backup');
    }
  };

  const handleUpdateScheduleStatus = async (id, status) => {
    try {
      const res = await scheduleAPI.updateStatus(id, status);
      const createdAdmin = res.data?.createdAdmin;
      
      if (createdAdmin) {
        alert(`Request Approved!\n\nAdmin Account Configured for ${createdAdmin.name}:\n• Institution: ${createdAdmin.institution}\n• Email: ${createdAdmin.email}\n• Admin ID: ${createdAdmin.adminId}\n• Password: ${createdAdmin.password}\n\nAdmin login credentials email dispatched to ${createdAdmin.email}!`);
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
        alert(`Institution "${institutionName}" & Admin approved successfully!`);
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
                <ShieldCheck size={16} /> SUPER ADMIN CONTROL CENTER
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

          {/* Stat 3: Approved Schools */}
          <div 
            onClick={() => setActiveTab('schools')}
            style={{
              backgroundColor: activeTab === 'schools' ? '#f0fdf4' : '#ffffff',
              border: activeTab === 'schools' ? '2px solid #059669' : '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'schools' ? '0 4px 12px rgba(5, 150, 105, 0.15)' : '0 2px 4px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.35rem 0' }}>
                  Approved Schools
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '800', color: '#059669', margin: 0 }}>
                  {allSchoolNames.length || approvedInstitutions.length}
                </p>
              </div>
              <div style={{ backgroundColor: '#dcfce7', padding: '0.75rem', borderRadius: '0.5rem', color: '#059669' }}>
                <Building size={24} />
              </div>
            </div>
          </div>

          {/* Stat 4: System Admins */}
          <div 
            onClick={() => setActiveTab('admins')}
            style={{
              backgroundColor: activeTab === 'admins' ? '#eff6ff' : '#ffffff',
              border: activeTab === 'admins' ? '2px solid #2563eb' : '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'admins' ? '0 4px 12px rgba(37, 99, 235, 0.15)' : '0 2px 4px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
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
                <ShieldCheck size={24} />
              </div>
            </div>
          </div>

          {/* Stat 5: Registered Students */}
          <div 
            onClick={() => setActiveTab('students')}
            style={{
              backgroundColor: activeTab === 'students' ? '#f0f9ff' : '#ffffff',
              border: activeTab === 'students' ? '2px solid #0284c7' : '1px solid #e2e8f0',
              borderRadius: '0.75rem',
              padding: '1.25rem',
              cursor: 'pointer',
              boxShadow: activeTab === 'students' ? '0 4px 12px rgba(2, 132, 199, 0.15)' : '0 2px 4px rgba(0,0,0,0.04)',
              transition: 'all 0.2s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: '700', textTransform: 'uppercase', margin: '0 0 0.35rem 0' }}>
                  Registered Students
                </p>
                <p style={{ fontSize: '2rem', fontWeight: '800', color: '#0284c7', margin: 0 }}>
                  {studentsList.length}
                </p>
              </div>
              <div style={{ backgroundColor: '#e0f2fe', padding: '0.75rem', borderRadius: '0.5rem', color: '#0284c7' }}>
                <UserCheck size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Institution Filter Bar for Super Admin Multi-Tenancy */}
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '0.75rem',
          padding: '1rem 1.25rem',
          marginBottom: '1.5rem',
          border: '1px solid #e2e8f0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Building style={{ color: '#2563eb', width: '22px', height: '22px' }} />
            <div>
              <span style={{ fontWeight: '800', fontSize: '0.95rem', color: '#0f172a', display: 'block' }}>
                Multi-Tenant Institution Selector
              </span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Filter Super Admin views for specific schools or global overview
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <select
              value={selectedInstitutionFilter}
              onChange={(e) => setSelectedInstitutionFilter(e.target.value)}
              style={{
                padding: '0.55rem 1rem',
                borderRadius: '0.5rem',
                border: '2px solid #2563eb',
                backgroundColor: '#eff6ff',
                color: '#1d4ed8',
                fontWeight: '700',
                fontSize: '0.9rem',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="all">🏢 All Institutions (Global Control)</option>
              {allSchoolNames.map((school) => (
                <option key={school} value={school}>
                  🏫 {school}
                </option>
              ))}
            </select>

            {selectedInstitutionFilter !== 'all' && (
              <button
                onClick={() => setSelectedInstitutionFilter('all')}
                style={{
                  backgroundColor: '#f1f5f9',
                  color: '#475569',
                  border: '1px solid #cbd5e1',
                  padding: '0.55rem 0.85rem',
                  borderRadius: '0.5rem',
                  fontSize: '0.8rem',
                  fontWeight: '700',
                  cursor: 'pointer'
                }}
              >
                Reset Filter
              </button>
            )}
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
            Scheduled Test Requests ({filteredSchedules.length})
          </button>

          <button
            onClick={() => setActiveTab('schools')}
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
              backgroundColor: activeTab === 'schools' ? '#ffffff' : 'transparent',
              color: activeTab === 'schools' ? '#059669' : '#64748b',
              borderBottom: activeTab === 'schools' ? '3px solid #059669' : 'none'
            }}
          >
            <Building size={18} />
            Approved Schools ({allSchoolNames.length || approvedInstitutions.length})
          </button>

          <button
            onClick={() => setActiveTab('admins')}
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
              backgroundColor: activeTab === 'admins' ? '#ffffff' : 'transparent',
              color: activeTab === 'admins' ? '#2563eb' : '#64748b',
              borderBottom: activeTab === 'admins' ? '3px solid #2563eb' : 'none'
            }}
          >
            <ShieldCheck size={18} />
            System Admins ({filteredApprovedAdmins.length})
          </button>

          <button
            onClick={() => setActiveTab('students')}
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
              backgroundColor: activeTab === 'students' ? '#ffffff' : 'transparent',
              color: activeTab === 'students' ? '#0284c7' : '#64748b',
              borderBottom: activeTab === 'students' ? '3px solid #0284c7' : 'none'
            }}
          >
            <UserCheck size={18} />
            Registered Students ({filteredStudentsList.length})
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
            All Platform Exams ({filteredAllExams.length})
          </button>
        </div>

        {/* Tab 0: Scheduled Test Requests */}
        {activeTab === 'schedules' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div>
                <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar style={{ color: '#7c3aed' }} /> Scheduled Test Requests ({schedules.length})
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.875rem', margin: '0.25rem 0 0 0' }}>
                  Test scheduling requests submitted from the landing page.
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
                            value={item.status === 'confirmed' || item.status === 'completed' ? 'approved' : (item.status || 'pending')}
                            onChange={(e) => handleUpdateScheduleStatus(item._id || item.id, e.target.value)}
                            style={{
                              padding: '0.35rem 0.65rem',
                              borderRadius: '0.375rem',
                              fontSize: '0.8rem',
                              fontWeight: '700',
                              border: '1px solid #cbd5e1',
                              cursor: 'pointer',
                              backgroundColor: (item.status === 'approved' || item.status === 'confirmed' || item.status === 'completed') ? '#dcfce7' : '#fef3c7',
                              color: (item.status === 'approved' || item.status === 'confirmed' || item.status === 'completed') ? '#166534' : '#92400e'
                            }}
                          >
                            <option value="pending">Pending</option>
                            <option value="approved">Approved</option>
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

        {/* Tab 2: Approved Schools Directory */}
        {activeTab === 'schools' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Building style={{ color: '#059669' }} /> Approved Schools & Connected Institutions Directory
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                  Click on any approved school to open and inspect connected students, exams, and admin details.
                </p>
              </div>
              <span style={{ backgroundColor: '#dcfce7', color: '#166534', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700' }}>
                {allSchoolNames.length || approvedInstitutions.length} Active Schools
              </span>
            </div>

            {allSchoolNames.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2.5rem 1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
                <Building size={36} color="#059669" style={{ marginBottom: '0.5rem', opacity: 0.7 }} />
                <p style={{ color: '#64748b', fontWeight: '600', margin: 0 }}>No approved schools registered yet.</p>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>Approved institutions will be listed here with quick access to their connected student & exam rosters.</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                {allSchoolNames.map((schoolName) => {
                  const schoolStudents = studentsList.filter(s => s.institution === schoolName);
                  const schoolExams = allExams.filter(e => e.institution === schoolName);
                  const schoolAdmins = approvedAdmins.filter(a => a.institution === schoolName);

                  return (
                    <div key={schoolName} style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                      padding: '1.25rem',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.03)',
                      display: 'flex',
                      flexDirection: 'column',
                      justify: 'space-between',
                      transition: 'all 0.2s',
                      position: 'relative'
                    }}>
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <div style={{ backgroundColor: '#dcfce7', color: '#059669', padding: '0.5rem', borderRadius: '0.5rem' }}>
                              <Building size={20} />
                            </div>
                            <div>
                              <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: '800', color: '#0f172a' }}>
                                {schoolName}
                              </h3>
                              <span style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                                <CheckCircle2 size={12} /> Approved Institution
                              </span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Students</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Users size={14} /> {schoolStudents.length}
                            </div>
                          </div>
                          <div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '600' }}>Exams</div>
                            <div style={{ fontSize: '1.1rem', fontWeight: '800', color: '#7c3aed', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <BookOpen size={14} /> {schoolExams.length}
                            </div>
                          </div>
                        </div>

                        {schoolAdmins.length > 0 && (
                          <p style={{ margin: '0 0 1rem 0', fontSize: '0.8rem', color: '#475569' }}>
                            <strong>Admin:</strong> {schoolAdmins[0].name} ({schoolAdmins[0].email})
                          </p>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedSchool(schoolName)}
                          style={{
                            flex: 1,
                            backgroundColor: '#059669',
                            color: '#ffffff',
                            border: 'none',
                            padding: '0.6rem 0.75rem',
                            borderRadius: '0.5rem',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.4rem',
                            boxShadow: '0 2px 4px rgba(5, 150, 105, 0.2)',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Eye size={16} /> Open Connected Details <ExternalLink size={14} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteSchool(schoolName)}
                          disabled={actionLoading}
                          title={`Delete approved school ${schoolName}`}
                          style={{
                            backgroundColor: '#fee2e2',
                            color: '#dc2626',
                            border: '1px solid #fca5a5',
                            padding: '0.6rem 0.85rem',
                            borderRadius: '0.5rem',
                            fontWeight: '700',
                            fontSize: '0.85rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.35rem',
                            transition: 'all 0.2s'
                          }}
                        >
                          <Trash2 size={16} /> Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: System Administrators Directory */}
        {activeTab === 'admins' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1f2937', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck style={{ color: '#2563eb' }} /> System Administrators Directory ({approvedAdmins.length})
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
                      <th style={{ padding: '0.75rem 1rem' }}>Institution</th>
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
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <div style={{ fontWeight: '500', color: '#1f2937' }}>{admin.email}</div>
                          <div style={{ fontSize: '0.8rem', color: '#6d28d9', fontWeight: '700', marginTop: '0.15rem' }}>
                            ID: {admin.studentId || (admin.email === 'admin@examin.com' ? '11111111111' : 'N/A')}
                          </div>
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{
                            backgroundColor: (admin.role === 'superadmin' || admin.email === 'admin@examin.com' || !admin.institution) ? '#ede9fe' : '#f1f5f9',
                            color: (admin.role === 'superadmin' || admin.email === 'admin@examin.com' || !admin.institution) ? '#6d28d9' : '#334155',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.8rem',
                            fontWeight: '700'
                          }}>
                            {(admin.role === 'superadmin' || admin.email === 'admin@examin.com' || !admin.institution) ? 'Super Admin Only' : admin.institution}
                          </span>
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

        {/* Tab: Registered Students */}
        {activeTab === 'students' && (
          <div style={{ backgroundColor: '#ffffff', borderRadius: '0.75rem', padding: '1.5rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1f2937', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <UserCheck style={{ color: '#0284c7' }} /> Registered Students & Institution Directory
                </h2>
                <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '0.25rem 0 0 0' }}>
                  View student IDs, accounts, and assigned institutions.
                </p>
              </div>
              <span style={{ backgroundColor: '#e0f2fe', color: '#0369a1', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8rem', fontWeight: '700' }}>
                Total Students: {filteredStudentsList.length}
              </span>
            </div>

            {filteredStudentsList.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', backgroundColor: '#f8fafc', borderRadius: '0.5rem', border: '1px dashed #cbd5e1' }}>
                <UserCheck size={36} color="#94a3b8" style={{ marginBottom: '0.5rem' }} />
                <p style={{ color: '#64748b', fontWeight: '600', margin: 0 }}>No student accounts found for this institution filter.</p>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem', marginTop: '0.25rem' }}>Students will appear here with their 11-digit Student ID and Institution once registered.</p>
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f8fafc', borderBottom: '2px solid #e2e8f0', color: '#475569' }}>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>Student ID</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>Student Name</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>Email Address</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>Institution / School</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: '700' }}>Registration Date</th>
                      <th style={{ padding: '0.75rem 1rem', fontWeight: '700', textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudentsList.map((st) => (
                      <tr key={st.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{
                            backgroundColor: '#0284c7',
                            color: '#ffffff',
                            padding: '0.25rem 0.65rem',
                            borderRadius: '0.375rem',
                            fontWeight: '800',
                            fontFamily: 'monospace',
                            fontSize: '0.85rem',
                            letterSpacing: '0.05em'
                          }}>
                            {st.studentId}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', fontWeight: '600', color: '#0f172a' }}>
                          {st.name}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#475569' }}>
                          {st.email}
                        </td>
                        <td style={{ padding: '0.875rem 1rem' }}>
                          <span style={{
                            backgroundColor: '#f1f5f9',
                            color: '#334155',
                            padding: '0.2rem 0.6rem',
                            borderRadius: '0.25rem',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            border: '1px solid #cbd5e1'
                          }}>
                            {st.institution || 'General'}
                          </span>
                        </td>
                        <td style={{ padding: '0.875rem 1rem', color: '#64748b', fontSize: '0.8rem' }}>
                          {new Date(st.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ padding: '0.875rem 1rem', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                            <button
                              onClick={() => handleResendStudentCredentials(st.id, st.email, st.name, st.studentId)}
                              disabled={actionLoading}
                              title="Resend account credentials email to student"
                              style={{
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                border: '1px solid #7dd3fc',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.3rem'
                              }}
                            >
                              <Mail size={13} /> Send Email Credentials
                            </button>

                            <button
                              onClick={() => handleDeleteStudent(st.id, st.name)}
                              disabled={actionLoading}
                              style={{
                                backgroundColor: '#fee2e2',
                                color: '#991b1b',
                                border: '1px solid #fca5a5',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '0.375rem',
                                cursor: 'pointer',
                                fontSize: '0.75rem',
                                fontWeight: '700',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem'
                              }}
                            >
                              <Trash2 size={13} /> Delete
                            </button>
                          </div>
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
                            {exam.institution}
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

        {/* Connected School Modal */}
        {selectedSchool && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '1rem'
          }}>
            <div style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '1.75rem'
            }}>
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #f1f5f9', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <div style={{ backgroundColor: '#dcfce7', color: '#059669', padding: '0.65rem', borderRadius: '0.65rem' }}>
                    <Building size={24} />
                  </div>
                  <div>
                    <h2 style={{ margin: 0, fontSize: '1.35rem', fontWeight: '800', color: '#0f172a' }}>
                      {selectedSchool}
                    </h2>
                    <span style={{ fontSize: '0.8rem', color: '#059669', fontWeight: '700', display: 'inline-flex', alignItems: 'center', gap: '0.25rem', marginTop: '0.15rem' }}>
                      <CheckCircle2 size={14} /> Connected Institution Portal & Roster
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedSchool(null)}
                  style={{
                    backgroundColor: '#f1f5f9',
                    border: 'none',
                    color: '#64748b',
                    padding: '0.5rem',
                    borderRadius: '9999px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              {(() => {
                const schoolStudents = studentsList.filter(s => s.institution === selectedSchool);
                const schoolExams = allExams.filter(e => e.institution === selectedSchool);
                const schoolAdmins = approvedAdmins.filter(a => a.institution === selectedSchool);

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {/* Summary Cards */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                      <div style={{ backgroundColor: '#eff6ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #bfdbfe' }}>
                        <div style={{ fontSize: '0.8rem', color: '#1e40af', fontWeight: '700' }}>Connected Students</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1d4ed8' }}>{schoolStudents.length}</div>
                      </div>
                      <div style={{ backgroundColor: '#f3e8ff', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #e9d5ff' }}>
                        <div style={{ fontSize: '0.8rem', color: '#6b21a8', fontWeight: '700' }}>Connected Exams</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#7e22ce' }}>{schoolExams.length}</div>
                      </div>
                      <div style={{ backgroundColor: '#ecfdf5', padding: '1rem', borderRadius: '0.5rem', border: '1px solid #a7f3d0' }}>
                        <div style={{ fontSize: '0.8rem', color: '#065f46', fontWeight: '700' }}>School Admins</div>
                        <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#047857' }}>{schoolAdmins.length}</div>
                      </div>
                    </div>

                    {/* Section 1: Connected Students */}
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <Users size={18} color="#0284c7" /> Registered Students ({schoolStudents.length})
                      </h3>
                      {schoolStudents.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No students registered under {selectedSchool} yet.</p>
                      ) : (
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left' }}>Student ID</th>
                                <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left' }}>Name</th>
                                <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left' }}>Email</th>
                                <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left' }}>Date</th>
                              </tr>
                            </thead>
                            <tbody>
                              {schoolStudents.map(st => (
                                <tr key={st.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.6rem 0.85rem' }}>
                                    <span style={{ backgroundColor: '#0284c7', color: '#ffffff', padding: '0.15rem 0.5rem', borderRadius: '0.25rem', fontFamily: 'monospace', fontWeight: '700', fontSize: '0.8rem' }}>
                                      {st.studentId}
                                    </span>
                                  </td>
                                  <td style={{ padding: '0.6rem 0.85rem', fontWeight: '600' }}>{st.name}</td>
                                  <td style={{ padding: '0.6rem 0.85rem', color: '#475569' }}>{st.email}</td>
                                  <td style={{ padding: '0.6rem 0.85rem', color: '#64748b' }}>
                                    {new Date(st.createdAt).toLocaleDateString()}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Section 2: Connected Exams */}
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <BookOpen size={18} color="#7c3aed" /> Exams Created ({schoolExams.length})
                      </h3>
                      {schoolExams.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>No exams created for {selectedSchool} yet.</p>
                      ) : (
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left' }}>Exam Title</th>
                                <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left' }}>Subject</th>
                                <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left' }}>Duration</th>
                                <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left' }}>Total Marks</th>
                              </tr>
                            </thead>
                            <tbody>
                              {schoolExams.map(ex => (
                                <tr key={ex._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.6rem 0.85rem', fontWeight: '700', color: '#0f172a' }}>{ex.title}</td>
                                  <td style={{ padding: '0.6rem 0.85rem', color: '#6d28d9', fontWeight: '600' }}>{ex.subject}</td>
                                  <td style={{ padding: '0.6rem 0.85rem', color: '#475569' }}>{ex.duration} mins</td>
                                  <td style={{ padding: '0.6rem 0.85rem', color: '#059669', fontWeight: '700' }}>{ex.totalMarks}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {/* Section 3: School Administrators */}
                    <div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <ShieldCheck size={18} color="#059669" /> School Administrator Accounts ({schoolAdmins.length})
                      </h3>
                      {schoolAdmins.length === 0 ? (
                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', fontStyle: 'italic', margin: 0 }}>Managed directly by Super Admin.</p>
                      ) : (
                        <div style={{ overflowX: 'auto', border: '1px solid #e2e8f0', borderRadius: '0.5rem' }}>
                          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                            <thead>
                              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569' }}>
                                <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left' }}>Admin Name</th>
                                <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left' }}>Email</th>
                                <th style={{ padding: '0.6rem 0.85rem', textAlign: 'left' }}>Admin ID</th>
                              </tr>
                            </thead>
                            <tbody>
                              {schoolAdmins.map(ad => (
                                <tr key={ad.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                  <td style={{ padding: '0.6rem 0.85rem', fontWeight: '600' }}>{ad.name}</td>
                                  <td style={{ padding: '0.6rem 0.85rem', color: '#2563eb' }}>{ad.email}</td>
                                  <td style={{ padding: '0.6rem 0.85rem', fontFamily: 'monospace', fontWeight: '700' }}>{ad.studentId || 'N/A'}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Modal Footer */}
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSchool(null)}
                  style={{
                    backgroundColor: '#1e293b',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.55rem 1.25rem',
                    borderRadius: '0.5rem',
                    fontWeight: '700',
                    fontSize: '0.875rem',
                    cursor: 'pointer'
                  }}
                >
                  Close Connected Window
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
