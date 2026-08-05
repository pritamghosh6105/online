import React from 'react';
import { Award, Download, CheckCircle, ShieldCheck, X } from 'lucide-react';

const CertificateModal = ({ certificate, onClose }) => {
  if (!certificate) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div className="modal-content certificate-modal" style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        maxWidth: '800px',
        width: '100%',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        overflow: 'hidden',
        position: 'relative'
      }}>
        {/* Header bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '16px 24px',
          backgroundColor: '#0f172a',
          color: '#ffffff'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Award style={{ color: '#f59e0b', width: '24px', height: '24px' }} />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>Official Certificate of Completion</h3>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button 
              onClick={handlePrint} 
              style={{
                backgroundColor: '#2563eb',
                color: '#ffffff',
                border: 'none',
                padding: '8px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.9rem',
                fontWeight: 600
              }}
            >
              <Download style={{ width: '16px', height: '16px' }} /> Print / PDF
            </button>
            <button 
              onClick={onClose} 
              style={{
                backgroundColor: 'transparent',
                color: '#94a3b8',
                border: 'none',
                cursor: 'pointer',
                padding: '4px'
              }}
            >
              <X style={{ width: '24px', height: '24px' }} />
            </button>
          </div>
        </div>

        {/* Certificate Frame */}
        <div className="printable-certificate" style={{
          padding: '40px',
          background: 'linear-gradient(135deg, #f8fafc 0%, #edf2f7 100%)',
          border: '12px solid #1e293b',
          margin: '20px',
          borderRadius: '8px',
          textAlign: 'center',
          position: 'relative'
        }}>
          {/* Watermark Seal */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            opacity: 0.04,
            pointerEvents: 'none'
          }}>
            <ShieldCheck style={{ width: '350px', height: '350px', color: '#0f172a' }} />
          </div>

          <div style={{ color: '#64748b', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 700, marginBottom: '8px' }}>
            {certificate.institution || 'Examin Examination Authority'}
          </div>

          <h1 style={{
            fontFamily: 'serif',
            fontSize: '2.5rem',
            color: '#0f172a',
            margin: '10px 0 20px',
            fontWeight: 800
          }}>
            CERTIFICATE OF EXCELLENCE
          </h1>

          <p style={{ color: '#475569', fontSize: '1rem', margin: '0 0 16px' }}>
            This is to certify that
          </p>

          <h2 style={{
            fontSize: '2rem',
            color: '#1e40af',
            borderBottom: '2px solid #cbd5e1',
            display: 'inline-block',
            paddingBottom: '6px',
            marginBottom: '16px',
            fontWeight: 700
          }}>
            {certificate.studentName}
          </h2>

          <p style={{ color: '#475569', fontSize: '1rem', maxWidth: '600px', margin: '0 auto 24px', lineHeight: 1.6 }}>
            has successfully passed the online examination for <strong>"{certificate.examTitle}"</strong> ({certificate.subject}) with an outstanding score of <strong>{certificate.score}/{certificate.totalMarks} ({certificate.percentage}%)</strong>.
          </p>

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            marginTop: '40px',
            paddingTop: '20px',
            borderTop: '1px dashed #cbd5e1'
          }}>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Date Issued</div>
              <div style={{ fontSize: '0.95rem', fontWeight: 600, color: '#0f172a' }}>
                {new Date(certificate.issueDate).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                ID: {certificate.certificateId}
              </div>
            </div>

            {/* QR Code Verification badge */}
            <div style={{ textAlign: 'center', backgroundColor: '#ffffff', padding: '10px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=90x90&data=${encodeURIComponent(window.location.origin + '/verify-certificate/' + certificate.certificateId)}`} 
                alt="Verification QR" 
                style={{ width: '80px', height: '80px', display: 'block', margin: '0 auto 4px' }}
              />
              <span style={{ fontSize: '0.65rem', color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                <CheckCircle style={{ width: '10px', height: '10px' }} /> Verified Valid
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: 'cursive', fontSize: '1.3rem', color: '#0f172a', marginBottom: '2px' }}>
                Examin Board
              </div>
              <div style={{ fontSize: '0.8rem', color: '#64748b', borderTop: '1px solid #94a3b8', paddingTop: '4px' }}>
                Authorized Signature
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CertificateModal;
