import React, { useState, useEffect } from 'react';
import { submissionAPI, authAPI } from '../api';
import { Eye, CheckCircle, RefreshCw, AlertTriangle, UserCheck, Building, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import LoadingSpinner from '../components/LoadingSpinner';

const LiveMonitoring = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedInstitution, setSelectedInstitution] = useState('all');
  const [approvedInstitutions, setApprovedInstitutions] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isSuperAdmin = currentUser?.role === 'superadmin' || currentUser?.email === 'admin@examin.com';

  useEffect(() => {
    fetchInstitutions();
    fetchActiveAttempts();
    const interval = setInterval(fetchActiveAttempts, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, [selectedInstitution]);

  const fetchInstitutions = async () => {
    try {
      const res = await authAPI.getApprovedInstitutions();
      setApprovedInstitutions(res.data?.institutions || []);
    } catch (err) {
      console.error('Error fetching approved institutions:', err);
    }
  };

  const fetchActiveAttempts = async () => {
    try {
      const params = { limit: 100, onlyViolations: true };
      if (selectedInstitution && selectedInstitution !== 'all') {
        params.institution = selectedInstitution;
      }
      const response = await submissionAPI.getAllSubmissions(params);
      setSubmissions(response.data?.submissions || []);
    } catch (err) {
      console.error('Error fetching live proctor feed:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteViolationRecord = async (submissionId, studentName) => {
    if (!window.confirm(`Delete this violation record for "${studentName}"?`)) return;
    try {
      setActionLoading(true);
      await submissionAPI.deleteSubmission(submissionId);
      toast.success(`Violation record for "${studentName}" deleted successfully.`);
      fetchActiveAttempts();
    } catch (err) {
      console.error('Error deleting submission:', err);
      toast.error('Failed to delete violation record.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearAllViolations = async () => {
    if (violationSubmissions.length === 0) {
      toast.info('No violation records to delete.');
      return;
    }
    if (!window.confirm(`Are you sure you want to delete all ${violationSubmissions.length} reported violation records?`)) return;
    try {
      setActionLoading(true);
      for (const sub of violationSubmissions) {
        if (sub._id) {
          await submissionAPI.deleteSubmission(sub._id);
        }
      }
      toast.success(`Successfully deleted ${violationSubmissions.length} violation records.`);
      fetchActiveAttempts();
    } catch (err) {
      console.error('Error deleting all violations:', err);
      toast.error('Failed to delete violation records.');
    } finally {
      setActionLoading(false);
    }
  };

  // Filter submissions to strictly ONLY show candidates who violated instructions and got TERMINATED
  const violationSubmissions = submissions.filter((sub) => {
    const tabSwitches = sub.proctorLogs?.tabSwitches || 0;
    const fullscreenExits = sub.proctorLogs?.fullscreenViolations || 0;
    
    // Candidate must be officially terminated for cheating / instruction violations
    const isTerminated = Boolean(sub.proctorLogs?.isTerminatedForCheating) ||
      sub.status === 'terminated' ||
      sub.status === 'auto-terminated' ||
      tabSwitches >= 3 ||
      fullscreenExits >= 3;

    // Institution filter check (frontend fallback)
    if (selectedInstitution && selectedInstitution !== 'all') {
      const subInst = sub.student?.institution || sub.exam?.institution || '';
      if (subInst && subInst.toLowerCase() !== selectedInstitution.toLowerCase()) {
        return false;
      }
    }

    return isTerminated;
  });

  if (loading) {
    return <LoadingSpinner text="Loading Terminated Candidates & Proctoring Feed..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '20px auto', padding: '0 16px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
            <Eye style={{ color: '#ef4444', flexShrink: 0 }} /> Terminated Candidates Feed
          </h1>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.9rem', lineHeight: '1.4' }}>
            Real-time monitoring of students who violated exam instructions and were terminated.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', width: '100%' }}>
          {/* Institution Filter Dropdown */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid #cbd5e1',
            borderRadius: '8px',
            padding: '8px 12px',
            flex: '1 1 200px',
            minWidth: '180px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
          }}>
            <Building style={{ width: '18px', height: '18px', color: '#64748b', flexShrink: 0 }} />
            <select
              value={selectedInstitution}
              onChange={(e) => setSelectedInstitution(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                outline: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#334155',
                cursor: 'pointer',
                width: '100%'
              }}
            >
              <option value="all">🏢 All Institutions</option>
              {approvedInstitutions.map((inst) => (
                <option key={inst} value={inst}>{inst}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleClearAllViolations}
            disabled={actionLoading}
            title="Delete all violation feed records"
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '10px 18px',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 6px rgba(220,38,38,0.25)',
              flex: '1 1 auto'
            }}
          >
            <Trash2 style={{ width: '16px', height: '16px', flexShrink: 0 }} /> Delete Violation Feed
          </button>
        </div>
      </div>

      {/* Violation Feed Cards */}
      {violationSubmissions.length === 0 ? (
        <div style={{
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          padding: '60px 20px',
          textAlign: 'center',
          border: '1px solid #e2e8f0',
          boxShadow: '0 4px 15px rgba(0,0,0,0.03)'
        }}>
          <CheckCircle style={{ width: '56px', height: '56px', color: '#10b981', margin: '0 auto 16px' }} />
          <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: '#0f172a' }}>No Violations Reported</h3>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.95rem' }}>
            {selectedInstitution !== 'all' 
              ? `No active cheating or proctoring flags detected for "${selectedInstitution}".`
              : 'All monitored test-takers are adhering to rules. No cheating or proctoring flags detected across candidates.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {violationSubmissions.map((sub, idx) => {
            const tabSwitches = sub.proctorLogs?.tabSwitches || 0;
            const copyPaste = sub.proctorLogs?.copyPasteAttempts || 0;
            const fullscreenExits = sub.proctorLogs?.fullscreenViolations || 0;
            const devTools = sub.proctorLogs?.devToolsAttempts || 0;
            const audioViolations = sub.proctorLogs?.audioViolations || 0;
            const multiMonitor = sub.proctorLogs?.multiMonitorDetected || false;
            const isTerminated = Boolean(sub.proctorLogs?.isTerminatedForCheating) || sub.status === 'terminated' || sub.status === 'auto-terminated';

            let violationReason = 'Rule Violation';
            if (fullscreenExits >= 3) {
              violationReason = '3 Fullscreen Exits';
            } else if (tabSwitches >= 3) {
              violationReason = '3 Tab Switches';
            } else if (copyPaste >= 5) {
              violationReason = '5 Copy/Paste Attempts';
            } else if (devTools >= 2) {
              violationReason = 'DevTools Violation';
            } else if (audioViolations >= 5) {
              violationReason = '5 Audio Violations';
            } else if (fullscreenExits > 0) {
              violationReason = `${fullscreenExits} Fullscreen Exit${fullscreenExits > 1 ? 's' : ''}`;
            } else if (tabSwitches > 0) {
              violationReason = `${tabSwitches} Tab Switch${tabSwitches > 1 ? 'es' : ''}`;
            }

            const studentId = sub.student?.studentId || sub.student?._id?.slice(-8) || 'N/A';
            const studentName = sub.student?.name || 'Candidate Student';
            const studentEmail = sub.student?.email || '';
            const institutionName = sub.student?.institution || sub.exam?.institution || 'General Institution';

            return (
              <div key={sub._id || idx} style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                overflow: 'hidden',
                boxShadow: '0 4px 15px rgba(0,0,0,0.06)',
                border: isTerminated ? '2px solid #7f1d1d' : '2px solid #ef4444'
              }}>
                {/* Camera Feed Header */}
                <div style={{
                  height: '160px',
                  backgroundColor: '#0f172a',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#64748b'
                }}>
                  <div style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    backgroundColor: '#1e293b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#94a3b8'
                  }}>
                    <UserCheck style={{ width: '32px', height: '32px' }} />
                  </div>

                  <span style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    color: '#10b981',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    ● LIVE STREAM
                  </span>

                  {isTerminated ? (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-end',
                      gap: '3px'
                    }}>
                      <span style={{
                        backgroundColor: '#7f1d1d',
                        color: '#ffffff',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '4px'
                      }}>
                        TERMINATED
                      </span>
                      <span style={{
                        backgroundColor: '#fee2e2',
                        color: '#991b1b',
                        fontSize: '0.65rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid #fca5a5'
                      }}>
                        Reason: {violationReason}
                      </span>
                    </div>
                  ) : (
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      right: '10px',
                      backgroundColor: '#ef4444',
                      color: '#ffffff',
                      fontSize: '0.7rem',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <AlertTriangle style={{ width: '12px', height: '12px' }} /> FLAG SUSPICIOUS
                    </span>
                  )}
                </div>

                {/* Candidate Information Body */}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div>
                      <h4 style={{ margin: '0 0 2px', fontSize: '1.05rem', color: '#0f172a', fontWeight: 700 }}>
                        {studentName}
                      </h4>
                      {studentEmail && (
                        <p style={{ margin: '0 0 4px', fontSize: '0.78rem', color: '#64748b' }}>
                          {studentEmail}
                        </p>
                      )}
                    </div>

                    {/* Student ID Badge */}
                    <span style={{
                      backgroundColor: '#eff6ff',
                      color: '#2563eb',
                      border: '1px solid #bfdbfe',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '6px',
                      fontFamily: 'monospace'
                    }}>
                      ID: {studentId}
                    </span>
                  </div>

                  {/* Institution & Exam Info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Building style={{ width: '13px', height: '13px', color: '#64748b' }} />
                      <span>{institutionName}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.83rem', color: '#64748b', fontWeight: 500 }}>
                      Exam: <strong>{sub.exam?.title || 'Active Exam'}</strong>
                    </p>
                  </div>

                  {/* Violation Metrics */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Tab Switches: <strong style={{ color: tabSwitches > 0 ? '#ef4444' : '#10b981' }}>{tabSwitches}</strong></span>
                      <span>Copy/Paste: <strong style={{ color: copyPaste > 0 ? '#ef4444' : '#10b981' }}>{copyPaste}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Fullscreen Exits: <strong style={{ color: fullscreenExits > 0 ? '#ef4444' : '#10b981' }}>{fullscreenExits}</strong></span>
                      <span>DevTools: <strong style={{ color: devTools > 0 ? '#ef4444' : '#10b981' }}>{devTools}</strong></span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span>Audio Noise: <strong style={{ color: audioViolations > 0 ? '#f59e0b' : '#10b981' }}>{audioViolations}</strong></span>
                      <span>Multi-Monitor: <strong style={{ color: multiMonitor ? '#ef4444' : '#10b981' }}>{multiMonitor ? 'YES' : 'NO'}</strong></span>
                    </div>

                    {/* Card Actions */}
                    <div style={{ marginTop: '10px', paddingTop: '8px', borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        onClick={() => handleDeleteViolationRecord(sub._id, studentName)}
                        disabled={actionLoading}
                        title="Delete this violation submission record"
                        style={{
                          backgroundColor: '#fee2e2',
                          color: '#dc2626',
                          border: '1px solid #fca5a5',
                          padding: '5px 10px',
                          borderRadius: '6px',
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Trash2 style={{ width: '13px', height: '13px' }} /> Delete Record
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LiveMonitoring;

