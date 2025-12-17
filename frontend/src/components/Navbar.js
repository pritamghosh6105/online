import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, LogOut, BookOpen } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav style={{
      backgroundColor: '#1f2937',
      padding: '1rem',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        {/* Logo */}
        <Link 
          to="/dashboard" 
          style={{
            display: 'flex',
            alignItems: 'center',
            textDecoration: 'none',
            color: '#ffffff',
            fontSize: '1.5rem',
            fontWeight: 'bold'
          }}
        >
          <BookOpen style={{ marginRight: '0.5rem' }} />
          Examin
        </Link>

        {/* Navigation Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link 
            to="/dashboard" 
            style={{
              color: '#d1d5db',
              textDecoration: 'none',
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.color = '#ffffff'}
            onMouseLeave={(e) => e.target.style.color = '#d1d5db'}
          >
            Dashboard
          </Link>
          
          {user?.role === 'student' && (
            <Link 
              to="/results" 
              style={{
                color: '#d1d5db',
                textDecoration: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.color = '#ffffff'}
              onMouseLeave={(e) => e.target.style.color = '#d1d5db'}
            >
              My Results
            </Link>
          )}
          
          {user?.role === 'admin' && (
            <>
              <Link 
                to="/admin/create-exam" 
                style={{
                  color: '#d1d5db',
                  textDecoration: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
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
                  padding: '0.5rem 1rem',
                  borderRadius: '0.375rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ffffff'}
                onMouseLeave={(e) => e.target.style.color = '#d1d5db'}
              >
                View Submissions
              </Link>
            </>
          )}
        </div>

        {/* User Menu */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            color: '#d1d5db',
            fontSize: '0.875rem'
          }}>
            <User style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            <span>{user?.name}</span>
            <span style={{
              backgroundColor: user?.role === 'admin' ? '#dc2626' : '#059669',
              color: '#ffffff',
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              marginLeft: '0.5rem'
            }}>
              {user?.role}
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
              padding: '0.5rem 1rem',
              borderRadius: '0.375rem',
              cursor: 'pointer',
              fontSize: '0.875rem',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#b91c1c'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#dc2626'}
          >
            <LogOut style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;