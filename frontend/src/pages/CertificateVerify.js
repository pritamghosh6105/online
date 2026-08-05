import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { certificateAPI } from '../api';
import { ShieldCheck, XCircle, Award, Calendar, CheckCircle2, ArrowLeft } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const CertificateVerify = () => {
  const { certId } = useParams();
  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [certificate, setCertificate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (certId) {
      verifyCert();
    }
  }, [certId]);

  const verifyCert = async () => {
    try {
      setLoading(true);
      const res = await certificateAPI.verifyCertificate(certId);
      if (res.data.verified) {
        setVerified(true);
        setCertificate(res.data.certificate);
      } else {
        setVerified(false);
        setError('Certificate not found or invalid.');
      }
    } catch (err) {
      setVerified(false);
      setError('Unable to verify certificate. Please check the Certificate ID.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Verifying Certificate Credential..." />;
  }

  return (
    <div style={{ maxWidth: '650px', margin: '60px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '20px' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#2563eb', textDecoration: 'none', fontWeight: 600 }}>
          <ArrowLeft style={{ width: '16px', height: '16px' }} /> Return to Home
        </Link>
      </div>

      <div style={{
        backgroundColor: '#ffffff',
        borderRadius: '16px',
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)',
        padding: '36px',
        textAlign: 'center',
        border: verified ? '2px solid #10b981' : '2px solid #ef4444'
      }}>
        {verified ? (
          <>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#d1fae5',
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <CheckCircle2 style={{ width: '40px', height: '40px' }} />
            </div>

            <span style={{ backgroundColor: '#ecfdf5', color: '#047857', padding: '6px 16px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              Authentic Certificate Verified
            </span>

            <h2 style={{ color: '#0f172a', margin: '16px 0 8px', fontSize: '1.8rem' }}>
              {certificate.studentName}
            </h2>

            <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '24px' }}>
              has successfully earned a certified score in <strong>{certificate.examTitle}</strong> ({certificate.subject}).
            </p>

            <div style={{
              backgroundColor: '#f8fafc',
              borderRadius: '12px',
              padding: '20px',
              textAlign: 'left',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '16px',
              marginBottom: '24px'
            }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Certificate ID</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{certificate.certificateId}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Institution</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{certificate.institution}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Score Obtained</div>
                <div style={{ fontWeight: 700, color: '#2563eb' }}>{certificate.score}/{certificate.totalMarks} ({certificate.percentage}%)</div>
              </div>
              <div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Issue Date</div>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{new Date(certificate.issueDate).toLocaleDateString()}</div>
              </div>
            </div>

            <div style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
              <ShieldCheck style={{ width: '16px', height: '16px' }} /> Digitally signed by Examin Security Infrastructure
            </div>
          </>
        ) : (
          <>
            <div style={{
              width: '72px',
              height: '72px',
              borderRadius: '50%',
              backgroundColor: '#fee2e2',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px'
            }}>
              <XCircle style={{ width: '40px', height: '40px' }} />
            </div>

            <h2 style={{ color: '#0f172a', margin: '0 0 10px' }}>Verification Failed</h2>
            <p style={{ color: '#64748b', fontSize: '1rem', marginBottom: '20px' }}>
              {error || 'The requested Certificate ID could not be validated in our records.'}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CertificateVerify;
