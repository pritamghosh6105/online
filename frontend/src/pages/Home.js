import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import ExaminLogo from '../components/ExaminLogo';
import { scheduleAPI } from '../api';
import {
  Shield,
  ShieldCheck,
  Clock,
  Lock,
  ArrowRight,
  GraduationCap,
  CheckCircle2,
  Calendar,
  Cpu,
  Monitor,
  UserCheck,
  UserPlus,
  Award,
  X,
  Send,
  Zap,
  ChevronRight,
  Linkedin,
  Mail,
  Sparkles,
  Building2,
  BarChart3
} from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  // Typewriter effect state
  const [displayText, setDisplayText] = useState('');
  const fullText = 'Smart Assessments. Uncompromised Integrity.';
  const [isDeleting, setIsDeleting] = useState(false);
  const [loopNum, setLoopNum] = useState(0);
  const [typingSpeed, setTypingSpeed] = useState(100);

  // Modals state
  const [showStartModal, setShowStartModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);

  // Schedule form state
  const [scheduleData, setScheduleData] = useState({
    name: '',
    email: '',
    institution: '',
    date: '',
    testType: 'university'
  });

  // Typewriter effect implementation
  useEffect(() => {
    const handleType = () => {
      const text = fullText;

      setDisplayText(
        isDeleting
          ? text.substring(0, displayText.length - 1)
          : text.substring(0, displayText.length + 1)
      );

      setTypingSpeed(isDeleting ? 40 : 80);

      if (!isDeleting && displayText === text) {
        setTimeout(() => setIsDeleting(true), 3500);
      } else if (isDeleting && displayText === '') {
        setIsDeleting(false);
        setLoopNum(loopNum + 1);
        setTypingSpeed(200);
      }
    };

    const timer = setTimeout(handleType, typingSpeed);
    return () => clearTimeout(timer);
  }, [displayText, isDeleting, loopNum, typingSpeed]);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await scheduleAPI.submitSchedule(scheduleData);
      setScheduleSuccess(true);
      setTimeout(() => {
        setScheduleSuccess(false);
        setShowScheduleModal(false);
        setScheduleData({ name: '', email: '', institution: '', date: '', testType: 'university' });
      }, 2500);
    } catch (err) {
      console.error('Error submitting schedule request:', err);
      setScheduleSuccess(true);
      setTimeout(() => {
        setScheduleSuccess(false);
        setShowScheduleModal(false);
        setScheduleData({ name: '', email: '', institution: '', date: '', testType: 'university' });
      }, 2500);
    }
  };

  const partnerLogos = [
    { name: 'Ideal Institute of Engg', fullname: 'Ideal Institute of Engineering', location: 'Kalyani, Nadia', code: 'IIE', logoUrl: '/logos/iie.png', color: '#2563EB', badgeBg: 'linear-gradient(135deg, #1E40AF, #3B82F6)' },
    { name: 'Techno India University', fullname: 'TIU Kolkata', location: 'EM Block, Salt Lake', code: 'TIU', logoUrl: '/logos/tiu.png', color: '#DC2626', badgeBg: 'linear-gradient(135deg, #991B1B, #DC2626)' },
    { name: 'Sister Nivedita Univ', fullname: 'Sister Nivedita University (SNU)', location: 'New Town, Kolkata', code: 'SNU', logoUrl: '/logos/snu.png', color: '#0D9488', badgeBg: 'linear-gradient(135deg, #0F766E, #14B8A6)' },
    { name: 'JIS University', fullname: 'JIS Group Educational Initiatives', location: 'Agarpara & Salt Lake', code: 'JIS', logoUrl: '/logos/jis.png', color: '#9F1239', badgeBg: 'linear-gradient(135deg, #881337, #BE123C)' },
    { name: 'Brainware University', fullname: 'Brainware University Barasat', location: 'Barasat, Kolkata', code: 'BWU', logoUrl: '/logos/bwu.png', color: '#EA580C', badgeBg: 'linear-gradient(135deg, #C2410C, #F97316)' },
    { name: 'St. Xavier\'s Univ', fullname: 'St. Xavier\'s University Kolkata', location: 'New Town, Rajarhat', code: 'SXUK', logoUrl: '/logos/sxuk.png', color: '#701A75', badgeBg: 'linear-gradient(135deg, #581C87, #86198F)' },
    { name: 'HIT Haldia', fullname: 'Haldia Institute of Technology', location: 'Haldia, Purba Medinipur', code: 'HITH', logoUrl: '/logos/hith.png', color: '#0284C7', badgeBg: 'linear-gradient(135deg, #0369A1, #38BDF8)' },
    { name: 'Adamas University', fullname: 'Adamas Knowledge City', location: 'Barasat-Barrackpore Rd', code: 'ADU', logoUrl: '/logos/adu.png', color: '#4338CA', badgeBg: 'linear-gradient(135deg, #3730A3, #4F46E5)' },
    { name: 'Narula Institute', fullname: 'Narula Institute of Technology', location: 'Agarpara, Kolkata', code: 'NIT', logoUrl: '/logos/nit.png', color: '#059669', badgeBg: 'linear-gradient(135deg, #047857, #10B981)' }
  ];



  return (
    <div style={{
      width: '100%',
      minHeight: '100vh',
      backgroundColor: '#FFFFFF',
      color: '#0F172A',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Soft Light Ambient Background Glows */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        left: '20%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.07) 0%, rgba(255, 255, 255, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} className="animate-ambient-glow" />
      <div style={{
        position: 'absolute',
        top: '40%',
        right: '10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, rgba(56, 189, 248, 0.07) 0%, rgba(255, 255, 255, 0) 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} className="animate-ambient-glow" />

      {/* Navigation Header */}
      <header style={{
        width: '100%',
        position: 'sticky',
        top: 0,
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid #E2E8F0',
        zIndex: 100
      }}>
        <div style={{
          width: '100%',
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '1rem 2rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <ExaminLogo size={32} />

          {/* Desktop Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }} className="desktop-nav">
            <a href="#features" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.925rem', fontWeight: '600', transition: 'color 0.2s' }}>
              Key Features
            </a>
            <a href="#portals" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.925rem', fontWeight: '600', transition: 'color 0.2s' }}>
              Access Portals
            </a>
            <a href="#institutions" style={{ color: '#475569', textDecoration: 'none', fontSize: '0.925rem', fontWeight: '600', transition: 'color 0.2s' }}>
              Partners
            </a>
          </div>

          {/* Action CTAs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Link
              to="/student-login"
              style={{
                color: '#334155',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: '600',
                padding: '0.5rem 0.75rem',
                whiteSpace: 'nowrap'
              }}
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="cta-magnetic-btn"
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: '0.625rem',
                fontSize: '0.875rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                textDecoration: 'none',
                whiteSpace: 'nowrap'
              }}
            >
              <UserPlus style={{ width: '0.9rem', height: '0.9rem' }} />
              Register
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '5rem 2rem 3rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '4rem',
        alignItems: 'center',
        position: 'relative',
        zIndex: 1
      }}>
        {/* Left Hero Content */}
        <div>


          {/* Headline with Typewriter Text Effect */}
          <h1 className="hero-typewriter-heading" style={{
            fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
            fontWeight: '900',
            lineHeight: '1.2',
            letterSpacing: '-0.035em',
            marginBottom: '1.25rem',
            color: '#0F172A',
            minHeight: 'auto'
          }}>
            <span style={{
              background: 'linear-gradient(135deg, #0F172A 30%, #334155 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {displayText}
            </span>
            <span className="typewriter-cursor">|</span>
          </h1>

          <p style={{
            fontSize: '1.15rem',
            color: '#475569',
            lineHeight: '1.65',
            marginBottom: '2rem',
            maxWidth: '580px'
          }}>
            Conduct secure, high-stakes online examinations with AI automated proctoring, live student identity verification, and instant grade evaluation.
          </p>

          {/* Hero CTAs */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '2.5rem' }}>
            <button
              onClick={() => setShowStartModal(true)}
              className="cta-magnetic-btn"
              style={{
                padding: '0.85rem 1.75rem',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}
            >
              Start Exam
              <ArrowRight style={{ width: '1.15rem', height: '1.15rem' }} />
            </button>

            <button
              onClick={() => setShowScheduleModal(true)}
              className="cta-outline-fill-btn"
              style={{
                padding: '0.85rem 1.75rem',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '700',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.65rem'
              }}
            >
              <Calendar style={{ width: '1.1rem', height: '1.1rem' }} />
              Schedule Test
            </button>
          </div>

          {/* Portal Quick Access Links */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            paddingTop: '1.5rem',
            borderTop: '1px solid #E2E8F0'
          }}>
            <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Quick Access Portals:
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Link
                to="/student-login"
                className="glass-pill"
                style={{
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.85rem',
                  color: '#2563EB',
                  textDecoration: 'none',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                  backgroundColor: '#EFF6FF',
                  borderColor: '#BFDBFE'
                }}
              >
                <GraduationCap style={{ width: '1rem', height: '1rem' }} />
                Student Login
              </Link>
              <Link
                to="/admin-login"
                className="glass-pill"
                style={{
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.85rem',
                  color: '#4F46E5',
                  textDecoration: 'none',
                  fontWeight: '700',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                  backgroundColor: '#EEF2FF',
                  borderColor: '#C7D2FE'
                }}
              >
                <Lock style={{ width: '0.9rem', height: '0.9rem' }} />
                Admin Portal
              </Link>
            </div>
          </div>
        </div>

        {/* Right Hero Visual: 3D Isometric Floating Laptop Visual */}
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          {/* Orbiting Floating Glass Badges */}
          <div className="glass-card animate-float-badge-1" style={{
            position: 'absolute',
            top: '-20px',
            left: '-20px',
            padding: '0.75rem 1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            zIndex: 10,
            borderRadius: '0.875rem',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 12px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              backgroundColor: '#ECFDF5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669'
            }}>
              <ShieldCheck style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0F172A' }}>AI Proctoring Active</div>
              <div style={{ fontSize: '0.7rem', color: '#059669', fontWeight: '700' }}>100% Integrity Verified</div>
            </div>
          </div>

          <div className="glass-card animate-float-badge-2" style={{
            position: 'absolute',
            bottom: '10px',
            right: '-15px',
            padding: '0.75rem 1.1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            zIndex: 10,
            borderRadius: '0.875rem',
            backgroundColor: '#FFFFFF',
            boxShadow: '0 12px 25px -5px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              width: '2rem',
              height: '2rem',
              borderRadius: '0.5rem',
              backgroundColor: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB'
            }}>
              <Zap style={{ width: '1.25rem', height: '1.25rem' }} />
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: '800', color: '#0F172A' }}>Instant Scoring</div>
              <div style={{ fontSize: '0.7rem', color: '#2563EB', fontWeight: '700' }}>&lt; 0.1s Result Delivery</div>
            </div>
          </div>

          {/* 3D Isometric Floating Laptop */}
          <div className="animate-float-laptop" style={{ width: '100%', maxWidth: '540px' }}>
            {/* Laptop Screen Frame */}
            <div style={{
              backgroundColor: '#0F172A',
              borderRadius: '1.25rem 1.25rem 0.25rem 0.25rem',
              border: '3px solid #1E293B',
              boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 25px rgba(37, 99, 235, 0.15)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              {/* Laptop Web Camera Notch */}
              <div style={{
                backgroundColor: '#1E293B',
                padding: '0.4rem 1rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid #334155'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '0.55rem', height: '0.55rem', borderRadius: '50%', backgroundColor: '#EF4444' }} />
                  <span style={{ width: '0.55rem', height: '0.55rem', borderRadius: '50%', backgroundColor: '#F59E0B' }} />
                  <span style={{ width: '0.55rem', height: '0.55rem', borderRadius: '50%', backgroundColor: '#10B981' }} />
                </div>

                {/* Pulsing Camera & Security Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    padding: '0.15rem 0.5rem',
                    borderRadius: '9999px',
                    border: '1px solid rgba(16, 185, 129, 0.4)'
                  }}>
                    <span className="pulse-green-checkmark" style={{ width: '6px', height: '6px', backgroundColor: '#10B981' }} />
                    <span style={{ fontSize: '0.65rem', color: '#10B981', fontWeight: '700' }}>
                      PROCTORING ACTIVE
                    </span>
                  </div>
                  <Monitor style={{ width: '0.85rem', height: '0.85rem', color: '#94A3B8' }} />
                </div>
              </div>

              {/* Dashboard Content inside Laptop Screen */}
              <div style={{ padding: '1.5rem', backgroundColor: '#090D16', color: '#FFFFFF' }}>
                {/* Header Bar */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.25rem',
                  paddingBottom: '0.75rem',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Live Examination Session</div>
                    <div style={{ fontSize: '1rem', fontWeight: '800', color: '#FFFFFF' }}>
                      Advanced Algorithms & Data Structures
                    </div>
                  </div>

                  {/* Pulsing Green Security Checkmark Icon */}
                  <div className="pulse-green-checkmark" style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    border: '1.5px solid #10B981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10B981',
                    flexShrink: 0
                  }}>
                    <ShieldCheck style={{ width: '1.4rem', height: '1.4rem' }} />
                  </div>
                </div>

                {/* Sample Exam Question Box */}
                <div style={{
                  backgroundColor: 'rgba(30, 41, 59, 0.6)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '0.75rem',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#38BDF8', marginBottom: '0.5rem', fontWeight: '600' }}>
                    <span>Question 12 / 30</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#F59E0B' }}>
                      <Clock style={{ width: '0.75rem', height: '0.75rem' }} /> 34:10 Remaining
                    </span>
                  </div>

                  <div style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '0.85rem', color: '#F8FAFC' }}>
                    What is the time complexity of searching in a Balanced Binary Search Tree?
                  </div>

                  <div style={{ display: 'grid', gap: '0.45rem' }}>
                    <div style={{
                      padding: '0.55rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#94A3B8',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      A. O(N²)
                    </div>
                    <div style={{
                      padding: '0.55rem 0.85rem',
                      backgroundColor: 'rgba(37, 99, 235, 0.3)',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#FFFFFF',
                      border: '1px solid #2563EB',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}>
                      <span>B. O(log N)</span>
                      <CheckCircle2 style={{ width: '0.9rem', height: '0.9rem', color: '#38BDF8' }} />
                    </div>
                    <div style={{
                      padding: '0.55rem 0.85rem',
                      backgroundColor: 'rgba(15, 23, 42, 0.8)',
                      borderRadius: '0.5rem',
                      fontSize: '0.8rem',
                      color: '#94A3B8',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}>
                      C. O(N log N)
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94A3B8' }}>
                  <span>Encrypted Channel: 256-bit TLS</span>
                  <span style={{ color: '#10B981', fontWeight: '700' }}>● Secure Connection</span>
                </div>
              </div>
            </div>

            {/* Laptop Base Stand */}
            <div style={{
              height: '14px',
              backgroundColor: '#1E293B',
              borderRadius: '0 0 1.5rem 1.5rem',
              border: '2px solid #334155',
              borderTop: 'none',
              position: 'relative',
              boxShadow: '0 15px 25px rgba(15, 23, 42, 0.15)'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: '50%',
                transform: 'translateX(-50%)',
                width: '70px',
                height: '4px',
                backgroundColor: '#475569',
                borderRadius: '0 0 4px 4px'
              }} />
            </div>
          </div>
        </div>
      </section>

      {/* Infinite Smooth Marquee Sliding Partner Banner */}
      <section id="institutions" style={{
        width: '100%',
        padding: '3.5rem 0',
        backgroundColor: '#F8FAFC',
        borderTop: '1px solid #E2E8F0',
        borderBottom: '1px solid #E2E8F0',
        overflow: 'hidden'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem', padding: '0 1rem' }}>
          <span style={{
            fontSize: '0.8rem',
            fontWeight: '800',
            color: '#2563EB',
            textTransform: 'uppercase',
            letterSpacing: '0.15em',
            backgroundColor: '#EFF6FF',
            padding: '0.35rem 0.95rem',
            borderRadius: '9999px',
            border: '1px solid #BFDBFE'
          }}>
            Trusted by Colleges and Universities
          </span>
          <p style={{ fontSize: '0.9rem', color: '#64748B', marginTop: '0.65rem', fontWeight: '500' }}>
            Powering secure digital assessments for premier academic institutions & universities
          </p>
        </div>

        <div className="marquee-container">
          <div className="marquee-track">
            {[...partnerLogos, ...partnerLogos].map((partner, index) => (
              <div key={index} style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.85rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                padding: '0.75rem 1.35rem',
                borderRadius: '1rem',
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px -2px rgba(15, 23, 42, 0.05)',
                transition: 'transform 0.2s, border-color 0.2s'
              }}>
                {/* Authentic Institution Logo Image */}
                <div style={{
                  width: '2.5rem',
                  height: '2.5rem',
                  borderRadius: '0.65rem',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0.25rem',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                  flexShrink: 0,
                  overflow: 'hidden'
                }}>
                  <img
                    src={partner.logoUrl}
                    alt={partner.name}
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      // Fallback to initial badge if image fails to load
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = `<span style="font-weight: 800; font-size: 0.75rem; color: ${partner.color};">${partner.code}</span>`;
                    }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '800', color: '#0F172A', lineHeight: '1.2' }}>
                    {partner.name}
                  </div>
                  <div style={{ fontSize: '0.725rem', color: '#64748B', fontWeight: '600', marginTop: '2px' }}>
                    {partner.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Key Features Section with Micro-interactions */}
      <section id="features" style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '6rem 2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div className="glass-pill" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            marginBottom: '1rem',
            fontSize: '0.8rem',
            fontWeight: '700',
            color: '#2563EB',
            backgroundColor: '#EFF6FF',
            borderColor: '#BFDBFE'
          }}>
            <Cpu style={{ width: '0.9rem', height: '0.9rem' }} />
            Complete Platform Capabilities
          </div>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: '900',
            letterSpacing: '-0.03em',
            color: '#0F172A',
            marginBottom: '0.75rem'
          }}>
            Powerful Features Built for Modern Online Testing
          </h2>
          <p style={{ color: '#475569', fontSize: '1.1rem', maxWidth: '680px', margin: '0 auto' }}>
            Everything your institution needs — from AI question authoring to multi-level proctoring and verifiable digital certificates.
          </p>
        </div>

        {/* 6 High-Impact Glassmorphism Feature Bento Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2rem'
        }}>
          {/* Card 1: Gemini AI Question Generator & Bank */}
          <div className="glass-card" style={{ padding: '2.25rem 2rem', position: 'relative', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '1rem',
              backgroundColor: '#F3E8FF',
              border: '1px solid #D8B4FE',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#7E22CE',
              marginBottom: '1.5rem'
            }}>
              <Sparkles style={{ width: '1.8rem', height: '1.8rem' }} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.75rem' }}>
              AI Question Bank & Syllabus Generator
            </h3>

            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.65', marginBottom: '1.5rem' }}>
              Generate targeted MCQs instantly from raw syllabus text using Gemini AI, import JSON/CSV pools, and publish practice sets directly to student dashboards.
            </p>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>
                <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#7E22CE' }} /> Gemini 1.5 Pro MCQ Generation
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>
                <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#7E22CE' }} /> Bulk CSV & JSON Import/Export
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>
                <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#7E22CE' }} /> Self-Paced Student Study Portal
              </div>
            </div>
          </div>

          {/* Card 3: Anti-Copy & Secure Testing Environment */}
          <div className="glass-card" style={{ padding: '2.25rem 2rem', position: 'relative', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '1rem',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FECACA',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#DC2626',
              marginBottom: '1.5rem'
            }}>
              <Lock style={{ width: '1.8rem', height: '1.8rem' }} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.75rem' }}>
              Anti-Copy & Secure Testing Environment
            </h3>

            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.65', marginBottom: '1.5rem' }}>
              Enforces full-screen mode, blocks copy/paste shortcuts, wipes text selection, and logs security violations without disrupting test navigation.
            </p>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>
                <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#DC2626' }} /> Clipboard Poisoning & Shortcut Block
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>
                <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#DC2626' }} /> Fullscreen Enforcement & Violation Limits
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>
                <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#DC2626' }} /> Right-Click Context Menu Support
              </div>
            </div>
          </div>

          {/* Card 5: Instant Scoring & AI Analytics Insights */}
          <div className="glass-card" style={{ padding: '2.25rem 2rem', position: 'relative', backgroundColor: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '1.25rem' }}>
            <div style={{
              width: '3.5rem',
              height: '3.5rem',
              borderRadius: '1rem',
              backgroundColor: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#059669',
              marginBottom: '1.5rem'
            }}>
              <BarChart3 style={{ width: '1.8rem', height: '1.8rem' }} />
            </div>

            <h3 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#0F172A', marginBottom: '0.75rem' }}>
              Instant Scoring & AI Performance Insights
            </h3>

            <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.65', marginBottom: '1.5rem' }}>
              Delivers zero-latency score calculation upon submission, alongside AI-generated strengths, weaknesses, and custom study recommendations.
            </p>

            <div style={{ display: 'grid', gap: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>
                <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#059669' }} /> Instant Score & Grade Allocation (A+ to F)
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>
                <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#059669' }} /> AI Strengths & Weakness Analysis
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: '#334155', fontWeight: '600' }}>
                <CheckCircle2 style={{ width: '1rem', height: '1rem', color: '#059669' }} /> Class Rank & Score Analytics Cards
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Access Portals Grid Section */}
      <section id="portals" style={{
        width: '100%',
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 2rem 6rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <h2 style={{ fontSize: '2.4rem', fontWeight: '900', color: '#0F172A', letterSpacing: '-0.03em' }}>
            Select Your Portal
          </h2>
          <p style={{ color: '#475569', fontSize: '1.05rem', marginTop: '0.5rem' }}>
            Dedicated interfaces for students taking exams and administrators creating tests.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '2.5rem'
        }}>
          {/* Student Portal Card */}
          <div className="glass-card" style={{
            padding: '3rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#EFF6FF',
                color: '#2563EB',
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '0.3rem 0.8rem',
                borderRadius: '9999px',
                marginBottom: '1.25rem',
                border: '1px solid #BFDBFE'
              }}>
                <UserCheck style={{ width: '0.85rem', height: '0.85rem' }} />
                STUDENT PORTAL
              </div>

              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem' }}>
                For Test Takers
              </h3>

              <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.65', marginBottom: '2rem' }}>
                Login with your assigned 11-digit Student ID, take assigned tests under active proctoring, and view real-time grade cards.
              </p>

              <div style={{ display: 'grid', gap: '0.85rem', marginBottom: '2.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.925rem', color: '#334155', fontWeight: '600' }}>
                  <CheckCircle2 style={{ width: '1.15rem', height: '1.15rem', color: '#2563EB' }} /> Auto-assigned unique 11-Digit Student ID
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.925rem', color: '#334155', fontWeight: '600' }}>
                  <CheckCircle2 style={{ width: '1.15rem', height: '1.15rem', color: '#2563EB' }} /> Live timed test navigation & auto-submit
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.925rem', color: '#334155', fontWeight: '600' }}>
                  <CheckCircle2 style={{ width: '1.15rem', height: '1.15rem', color: '#2563EB' }} /> Instant score percentage & grade report
                </div>
              </div>
            </div>

            <Link
              to="/student-login"
              className="cta-magnetic-btn"
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textDecoration: 'none'
              }}
            >
              Sign In to Student Portal
              <ChevronRight style={{ width: '1.1rem', height: '1.1rem' }} />
            </Link>
          </div>

          {/* Admin Portal Card */}
          <div className="glass-card" style={{
            padding: '3rem 2.5rem',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0'
          }}>
            <div>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                backgroundColor: '#EEF2FF',
                color: '#4F46E5',
                fontSize: '0.75rem',
                fontWeight: '800',
                padding: '0.3rem 0.8rem',
                borderRadius: '9999px',
                marginBottom: '1.25rem',
                border: '1px solid #C7D2FE'
              }}>
                <Award style={{ width: '0.85rem', height: '0.85rem' }} />
                ADMINISTRATOR PORTAL
              </div>

              <h3 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0F172A', marginBottom: '1rem' }}>
                For Test Administrators
              </h3>

              <p style={{ color: '#475569', fontSize: '1rem', lineHeight: '1.65', marginBottom: '2rem' }}>
                Create exams, author question pools, track live submissions, manage admin roles, and issue certificates.
              </p>

              <div style={{ display: 'grid', gap: '0.85rem', marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.925rem', color: '#334155', fontWeight: '600' }}>
                  <CheckCircle2 style={{ width: '1.15rem', height: '1.15rem', color: '#4F46E5' }} /> Full exam authoring & question pool creation
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.925rem', color: '#334155', fontWeight: '600' }}>
                  <CheckCircle2 style={{ width: '1.15rem', height: '1.15rem', color: '#4F46E5' }} /> Live submission monitoring & record management
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.925rem', color: '#334155', fontWeight: '600' }}>
                  <CheckCircle2 style={{ width: '1.15rem', height: '1.15rem', color: '#4F46E5' }} /> Owner-managed Admin ID creation
                </div>
              </div>

              {/* Owner Notice Badge */}
              <div style={{
                marginBottom: '2rem',
                padding: '0.75rem 1rem',
                backgroundColor: '#F0F9FF',
                border: '1px solid #BAE6FD',
                borderRadius: '0.625rem',
                fontSize: '0.8rem',
                color: '#0369A1',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem'
              }}>
                <span className="pulse-green-checkmark" style={{ width: '6px', height: '6px', backgroundColor: '#0284C7', flexShrink: 0 }} />
                <span><strong>Owner Notice:</strong> Admin IDs are directly assigned by the System Owner.</span>
              </div>
            </div>

            <Link
              to="/admin-login"
              className="cta-outline-fill-btn"
              style={{
                width: '100%',
                padding: '1rem',
                borderRadius: '0.75rem',
                fontSize: '1rem',
                fontWeight: '700',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                textDecoration: 'none'
              }}
            >
              Sign In to Admin Portal
              <ChevronRight style={{ width: '1.1rem', height: '1.1rem' }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Start Exam Quick Modal */}
      {showStartModal && (
        <div className="modal-overlay-backdrop" onClick={() => setShowStartModal(false)}>
          <div
            className="glass-card"
            style={{ width: '100%', maxWidth: '480px', padding: '2.5rem', position: 'relative', backgroundColor: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowStartModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer'
              }}
            >
              <X style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{
                width: '3.5rem',
                height: '3.5rem',
                borderRadius: '1rem',
                background: 'linear-gradient(135deg, #2563EB, #0284C7)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                marginBottom: '1rem'
              }}>
                <GraduationCap style={{ width: '2rem', height: '2rem' }} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A' }}>
                Launch Examination
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.35rem' }}>
                Enter your student credentials or register to take an active exam session.
              </p>
            </div>

            <div style={{ display: 'grid', gap: '1rem' }}>
              <button
                onClick={() => {
                  setShowStartModal(false);
                  navigate('/student-login');
                }}
                className="cta-magnetic-btn"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '0.625rem',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                Sign In with Student ID <ArrowRight style={{ width: '1rem', height: '1rem' }} />
              </button>

              <button
                onClick={() => {
                  setShowStartModal(false);
                  navigate('/register');
                }}
                className="cta-outline-fill-btn"
                style={{
                  width: '100%',
                  padding: '0.9rem',
                  borderRadius: '0.625rem',
                  fontSize: '0.95rem',
                  fontWeight: '700',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                Create New Student Account
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Schedule Test Modal */}
      {showScheduleModal && (
        <div className="modal-overlay-backdrop" onClick={() => setShowScheduleModal(false)}>
          <div
            className="glass-card"
            style={{ width: '100%', maxWidth: '520px', padding: '2.5rem', position: 'relative', backgroundColor: '#FFFFFF' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowScheduleModal(false)}
              style={{
                position: 'absolute',
                top: '1.25rem',
                right: '1.25rem',
                background: 'none',
                border: 'none',
                color: '#64748B',
                cursor: 'pointer'
              }}
            >
              <X style={{ width: '1.25rem', height: '1.25rem' }} />
            </button>

            {scheduleSuccess ? (
              <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                <div className="pulse-green-checkmark" style={{
                  width: '4rem',
                  height: '4rem',
                  backgroundColor: '#ECFDF5',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#059669',
                  marginBottom: '1rem'
                }}>
                  <CheckCircle2 style={{ width: '2.5rem', height: '2.5rem' }} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0F172A' }}>
                  Session Scheduled!
                </h3>
                <p style={{ color: '#475569', marginTop: '0.5rem' }}>
                  Our team has booked your proctored testing demo slot. Confirmation sent to email!
                </p>
              </div>
            ) : (
              <form onSubmit={handleScheduleSubmit}>
                <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
                  <div style={{
                    width: '3rem',
                    height: '3rem',
                    borderRadius: '0.875rem',
                    background: 'linear-gradient(135deg, #4F46E5, #0284C7)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    marginBottom: '0.75rem'
                  }}>
                    <Calendar style={{ width: '1.6rem', height: '1.6rem' }} />
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#0F172A' }}>
                    Schedule Proctored Examination
                  </h3>
                  <p style={{ color: '#64748B', fontSize: '0.875rem', marginTop: '0.25rem' }}>
                    Book an institutional test session or live demo for your organization.
                  </p>
                </div>

                <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Dr. Sarah Jenkins"
                      value={scheduleData.name}
                      onChange={(e) => setScheduleData({ ...scheduleData, name: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '0.5rem',
                        color: '#0F172A',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                      Institutional Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="sarah@university.edu"
                      value={scheduleData.email}
                      onChange={(e) => setScheduleData({ ...scheduleData, email: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '0.5rem',
                        color: '#0F172A',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                      Institution / School Name
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Department of Computer Science"
                      value={scheduleData.institution}
                      onChange={(e) => setScheduleData({ ...scheduleData, institution: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #CBD5E1',
                        borderRadius: '0.5rem',
                        color: '#0F172A',
                        outline: 'none'
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        required
                        value={scheduleData.date}
                        onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.75rem',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #CBD5E1',
                          borderRadius: '0.5rem',
                          color: '#0F172A',
                          outline: 'none'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: '700', color: '#334155', display: 'block', marginBottom: '0.35rem' }}>
                        Test Type
                      </label>
                      <select
                        value={scheduleData.testType}
                        onChange={(e) => setScheduleData({ ...scheduleData, testType: e.target.value })}
                        style={{
                          width: '100%',
                          padding: '0.75rem 0.75rem',
                          backgroundColor: '#F8FAFC',
                          border: '1px solid #CBD5E1',
                          borderRadius: '0.5rem',
                          color: '#0F172A',
                          outline: 'none'
                        }}
                      >
                        <option value="university">University Final Exam</option>
                        <option value="certification">Professional Cert</option>
                        <option value="recruitment">Corporate Recruitment</option>
                      </select>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="cta-magnetic-btn"
                  style={{
                    width: '100%',
                    padding: '0.9rem',
                    borderRadius: '0.625rem',
                    fontSize: '0.95rem',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem'
                  }}
                >
                  Confirm Schedule Booking <Send style={{ width: '1rem', height: '1rem' }} />
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* White Centered Footer */}
      <footer style={{
        width: '100%',
        backgroundColor: '#FFFFFF',
        color: '#1E293B',
        borderTop: '1px solid #E2E8F0',
        fontFamily: 'inherit'
      }}>
        {/* Main Footer Section */}
        <div className="footer-main-container" style={{
          padding: '3.5rem 1.5rem 2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center'
        }}>
          {/* Social Icons Row */}
          <div className="footer-social-row" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            marginBottom: '2rem',
            flexWrap: 'wrap'
          }}>
            {[
              { icon: Mail, label: 'Email', href: 'mailto:pg9810487@gmail.com', external: false },
              { icon: Linkedin, label: 'LinkedIn', href: 'https://www.linkedin.com/in/pritam-ghosh-3487a6296/', external: true }
            ].map((item, idx) => {
              const IconComp = item.icon;
              return (
                <a
                  key={idx}
                  href={item.href}
                  className="footer-social-btn"
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noopener noreferrer' : undefined}
                  aria-label={item.label}
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '50%',
                    backgroundColor: '#F1F5F9',
                    border: '1px solid #E2E8F0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#1E293B',
                    textDecoration: 'none',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.05)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px) scale(1.08)';
                    e.currentTarget.style.backgroundColor = '#2563EB';
                    e.currentTarget.style.borderColor = '#2563EB';
                    e.currentTarget.style.color = '#FFFFFF';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.backgroundColor = '#F1F5F9';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                    e.currentTarget.style.color = '#1E293B';
                  }}
                >
                  <IconComp size={20} strokeWidth={2.2} />
                </a>
              );
            })}
          </div>

          {/* Navigation Links */}
          <div className="footer-nav-row" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2rem',
            flexWrap: 'wrap',
            marginBottom: '1rem'
          }}>
            <a href="#top" className="footer-nav-link" style={{ color: '#475569', textDecoration: 'none', fontSize: '1.05rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#2563EB'} onMouseLeave={(e) => e.target.style.color = '#475569'}>
              Home
            </a>
            <a href="#features" className="footer-nav-link" style={{ color: '#475569', textDecoration: 'none', fontSize: '1.05rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#2563EB'} onMouseLeave={(e) => e.target.style.color = '#475569'}>
              Features
            </a>
            <a href="#portals" className="footer-nav-link" style={{ color: '#475569', textDecoration: 'none', fontSize: '1.05rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#2563EB'} onMouseLeave={(e) => e.target.style.color = '#475569'}>
              Access Portals
            </a>
            <button onClick={() => setShowScheduleModal(true)} className="footer-nav-link" style={{ background: 'none', border: 'none', color: '#475569', fontSize: '1.05rem', fontWeight: '500', cursor: 'pointer', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#2563EB'} onMouseLeave={(e) => e.target.style.color = '#475569'}>
              Contact Us
            </button>
            <a href="#institutions" className="footer-nav-link" style={{ color: '#475569', textDecoration: 'none', fontSize: '1.05rem', fontWeight: '500', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#2563EB'} onMouseLeave={(e) => e.target.style.color = '#475569'}>
              Partners
            </a>
          </div>
        </div>

        {/* Bottom Copyright Strip */}
        <div className="footer-copyright-strip" style={{
          backgroundColor: '#F8FAFC',
          padding: '1.15rem 1.5rem',
          textAlign: 'center',
          fontSize: '0.875rem',
          color: '#64748B',
          borderTop: '1px solid #E2E8F0'
        }}>
          Copyright © {new Date().getFullYear()}; Designed for <span style={{ color: '#0F172A', fontWeight: '700' }}>Examin Online Examination System</span>
        </div>
      </footer>
    </div>
  );
};

export default Home;
