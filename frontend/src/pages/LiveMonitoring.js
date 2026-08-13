import React, { useState, useEffect } from 'react';
import { submissionAPI } from '../api';
import { Eye, ShieldAlert, CheckCircle, RefreshCw, AlertTriangle, UserCheck } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const LiveMonitoring = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveAttempts();
    const interval = setInterval(fetchActiveAttempts, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchActiveAttempts = async () => {
    try {
      const res = await submissionAPI.getAllSubmissions({ limit: 20 });
      setSubmissions(res.data.submissions || []);
    } catch (err) {
      console.error('Error fetching live proctor feed:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Loading Violation Reports & Proctoring Feed..." />;
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '30px auto', padding: '0 20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.8rem', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Eye style={{ color: '#ef4444' }} /> Violation Reported & Proctoring Feed
          </h1>
          <p style={{ margin: '4px 0 0', color: '#64748b' }}>
            Real-time monitoring of test-taker webcam streams, tab switching violations, and proctor flags.
          </p>
        </div>

        <button
          onClick={fetchActiveAttempts}
          style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '8px 16px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
        >
          <RefreshCw style={{ width: '16px', height: '16px' }} /> Refresh Feed
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {submissions.map((sub, idx) => {
          const tabSwitches = sub.proctorLogs?.tabSwitches || 0;
          const copyPaste = sub.proctorLogs?.copyPasteAttempts || 0;
          const fullscreenExits = sub.proctorLogs?.fullscreenViolations || 0;
          const devTools = sub.proctorLogs?.devToolsAttempts || 0;
          const audioViolations = sub.proctorLogs?.audioViolations || 0;
          const multiMonitor = sub.proctorLogs?.multiMonitorDetected || false;
          const isTerminated = Boolean(sub.proctorLogs?.isTerminatedForCheating) && (tabSwitches >= 3 || fullscreenExits >= 3 || devTools >= 2 || copyPaste >= 5);

          const hasViolations = tabSwitches > 1 || copyPaste > 0 || fullscreenExits > 0 || devTools > 0 || audioViolations > 0 || multiMonitor || isTerminated;

          return (
            <div key={sub._id || idx} style={{
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
              border: isTerminated ? '2px solid #7f1d1d' : hasViolations ? '2px solid #ef4444' : '1px solid #e2e8f0'
            }}>
              {/* Camera Feed Container */}
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
                  <span style={{
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: '#7f1d1d',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: '4px'
                  }}>
                    TERMINATED
                  </span>
                ) : hasViolations && (
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

              {/* Information Body */}
              <div style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 4px', fontSize: '1rem', color: '#0f172a' }}>
                  {sub.student?.name || 'Student Candidate'}
                </h4>
                <p style={{ margin: '0 0 12px', fontSize: '0.85rem', color: '#64748b' }}>
                  {sub.exam?.title || 'Active Exam'}
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.78rem', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Tab Switches: <strong style={{ color: tabSwitches > 1 ? '#ef4444' : '#10b981' }}>{tabSwitches}</strong></span>
                    <span>Copy/Paste: <strong style={{ color: copyPaste > 0 ? '#ef4444' : '#10b981' }}>{copyPaste}</strong></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Fullscreen Exits: <strong style={{ color: fullscreenExits > 0 ? '#ef4444' : '#10b981' }}>{fullscreenExits}</strong></span>
                    <span>DevTools: <strong style={{ color: devTools > 0 ? '#ef4444' : '#10b981' }}>{devTools}</strong></span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Audio Noise: <strong style={{ color: audioViolations > 0 ? '#f59e0b' : '#10b981' }}>{audioViolations}</strong></span>
                    <span>Multi-Monitor: <strong style={{ color: multiMonitor ? '#ef4444' : '#10b981' }}>{multiMonitor ? 'YES' : 'NO'}</strong></span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LiveMonitoring;
