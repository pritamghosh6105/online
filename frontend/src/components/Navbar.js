import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ExaminLogo from './ExaminLogo';
import { User, LogOut, BookOpen, Menu, X, Award, PlusCircle, FileText, ShieldAlert } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const isAdminUser = user?.role === 'admin' || user?.role === 'superadmin' || user?.email === 'admin@examin.com';

  return (
    <nav style={{
      backgroundColor: '#1f2937',
      padding: '0.875rem 1rem',
      boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
      position: 'sticky',
      top: 0,
      zIndex: 50
    }}>
      <div style={{
        maxWidth: '1400px',
        width: '100%',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '1rem'
      }}>
        {/* Logo */}
        <ExaminLogo size={28} to="/dashboard" textColor="#ffffff" showSubtext={false} />

        {/* Desktop Navigation Links */}
        <div className="desktop-nav" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          whiteSpace: 'nowrap'
        }}>
          <Link
            to="/dashboard"
            style={{
              color: '#d1d5db',
              textDecoration: 'none',
              padding: '0.5rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.925rem',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = '#d1d5db'}
          >
            Dashboard
          </Link>



          {user?.role === 'student' && (
            <>
              <Link
                to="/question-bank"
                style={{
                  color: '#10b981',
                  textDecoration: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.925rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                  transition: 'all 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                onMouseEnter={(e) => e.target.style.color = '#34d399'}
                onMouseLeave={(e) => e.target.style.color = '#10b981'}
              >
                Question Bank
              </Link>
              <Link
                to="/results"
                style={{
                  color: '#d1d5db',
                  textDecoration: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.925rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                onMouseLeave={(e) => e.target.style.color = '#d1d5db'}
              >
                My Results
              </Link>
            </>
          )}

          {isAdminUser && (
            <>
              <Link
                to="/admin/question-bank"
                style={{
                  color: '#d1d5db',
                  textDecoration: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.925rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                onMouseLeave={(e) => e.target.style.color = '#d1d5db'}
              >
                Question Bank
              </Link>

              <Link
                to="/admin/live-monitoring"
                style={{
                  color: '#ef4444',
                  textDecoration: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.925rem',
                  fontWeight: '600',
                  whiteSpace: 'nowrap',
                  outline: 'none'
                }}
              >
                Violation Reported
              </Link>

              <Link
                to="/admin/create-exam"
                style={{
                  color: '#d1d5db',
                  textDecoration: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.925rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                onMouseLeave={(e) => e.target.style.color = '#d1d5db'}
              >
                Create Exam
              </Link>

              <Link
                to="/admin/submissions"
                style={{
                  color: '#d1d5db',
                  textDecoration: 'none',
                  padding: '0.5rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.925rem',
                  fontWeight: '500',
                  whiteSpace: 'nowrap',
                  outline: 'none',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                onMouseLeave={(e) => e.target.style.color = '#d1d5db'}
              >
                Submissions
              </Link>
            </>
          )}
        </div>

        {/* Desktop User Menu */}
        <div className="desktop-user-menu" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: '#d1d5db',
            fontSize: '0.875rem',
            whiteSpace: 'nowrap'
          }}>
            <User style={{ width: '1.1rem', height: '1.1rem', marginRight: '0.375rem' }} />
            <span style={{ fontWeight: '500', whiteSpace: 'nowrap' }}>{user?.name}</span>
            <span style={{
              backgroundColor: (user?.role === 'superadmin' || user?.email === 'admin@examin.com') ? '#7c3aed' : user?.role === 'admin' ? '#dc2626' : '#059669',
              color: '#ffffff',
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '600',
              marginLeft: '0.5rem',
              textTransform: 'uppercase',
              whiteSpace: 'nowrap'
            }}>
              {(user?.role === 'superadmin' || user?.email === 'admin@examin.com') ? 'SUPER ADMIN' : user?.role}
            </span>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '0.45rem 0.875rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: '500',
              whiteSpace: 'nowrap',
              outline: 'none',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
          >
            <LogOut style={{ width: '1rem', height: '1rem', marginRight: '0.375rem' }} />
            Logout
          </button>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          className="mobile-hamburger-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle navigation menu"
          style={{
            display: 'none',
            background: 'none',
            border: 'none',
            color: '#ffffff',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '0.375rem'
          }}
        >
          {isMobileMenuOpen ? <X style={{ width: '1.5rem', height: '1.5rem' }} /> : <Menu style={{ width: '1.5rem', height: '1.5rem' }} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="mobile-menu-drawer" style={{
          backgroundColor: '#111827',
          marginTop: '0.75rem',
          padding: '1rem',
          borderRadius: '0.5rem',
          border: '1px solid #374151',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.75rem'
        }}>
          {/* User badge */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingBottom: '0.75rem',
            borderBottom: '1px solid #374151'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', color: '#f3f4f6' }}>
              <User style={{ width: '1.25rem', height: '1.25rem', marginRight: '0.5rem', color: '#3b82f6' }} />
              <div>
                <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{user?.name}</div>
                <div style={{ fontSize: '0.75rem', color: '#9ca3af' }}>{user?.email || user?.studentId}</div>
              </div>
            </div>
            <span style={{
              backgroundColor: (user?.role === 'superadmin' || user?.email === 'admin@examin.com') ? '#7c3aed' : user?.role === 'admin' ? '#dc2626' : '#059669',
              color: '#ffffff',
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: '600',
              textTransform: 'uppercase'
            }}>
              {(user?.role === 'superadmin' || user?.email === 'admin@examin.com') ? 'SUPER ADMIN' : user?.role}
            </span>
          </div>

          {/* Links */}
          <Link
            to="/dashboard"
            onClick={closeMobileMenu}
            style={{
              color: '#f3f4f6',
              textDecoration: 'none',
              padding: '0.6rem 0.75rem',
              borderRadius: '0.375rem',
              fontSize: '0.95rem',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#1f2937'
            }}
          >
            <BookOpen style={{ width: '1.1rem', height: '1.1rem', marginRight: '0.6rem' }} />
            Dashboard
          </Link>



          {user?.role === 'student' && (
            <>
              <Link
                to="/question-bank"
                onClick={closeMobileMenu}
                style={{
                  color: '#10b981',
                  textDecoration: 'none',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.95rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#1f2937'
                }}
              >
                <BookOpen style={{ width: '1.1rem', height: '1.1rem', marginRight: '0.6rem' }} />
                Question Bank
              </Link>
              <Link
                to="/results"
                onClick={closeMobileMenu}
                style={{
                  color: '#f3f4f6',
                  textDecoration: 'none',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#1f2937'
                }}
              >
                <Award style={{ width: '1.1rem', height: '1.1rem', marginRight: '0.6rem' }} />
                My Results
              </Link>
            </>
          )}

          {isAdminUser && (
            <>
              <Link
                to="/admin/question-bank"
                onClick={closeMobileMenu}
                style={{
                  color: '#f3f4f6',
                  textDecoration: 'none',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#1f2937'
                }}
              >
                <BookOpen style={{ width: '1.1rem', height: '1.1rem', marginRight: '0.6rem' }} />
                Question Bank
              </Link>

              <Link
                to="/admin/live-monitoring"
                onClick={closeMobileMenu}
                style={{
                  color: '#ef4444',
                  textDecoration: 'none',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#1f2937'
                }}
              >
                <ShieldAlert style={{ width: '1.1rem', height: '1.1rem', marginRight: '0.6rem' }} />
                Violation Reported
              </Link>

              <Link
                to="/admin/create-exam"
                onClick={closeMobileMenu}
                style={{
                  color: '#f3f4f6',
                  textDecoration: 'none',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#1f2937'
                }}
              >
                <PlusCircle style={{ width: '1.1rem', height: '1.1rem', marginRight: '0.6rem' }} />
                Create Exam
              </Link>

              <Link
                to="/admin/submissions"
                onClick={closeMobileMenu}
                style={{
                  color: '#f3f4f6',
                  textDecoration: 'none',
                  padding: '0.6rem 0.75rem',
                  borderRadius: '0.375rem',
                  fontSize: '0.95rem',
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: '#1f2937'
                }}
              >
                <FileText style={{ width: '1.1rem', height: '1.1rem', marginRight: '0.6rem' }} />
                View Submissions
              </Link>
            </>
          )}

          {/* Logout button in mobile menu */}
          <button
            onClick={() => {
              closeMobileMenu();
              handleLogout();
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: 'none',
              padding: '0.65rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.95rem',
              fontWeight: '600',
              marginTop: '0.25rem'
            }}
          >
            <LogOut style={{ width: '1.1rem', height: '1.1rem', marginRight: '0.5rem' }} />
            Logout
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;