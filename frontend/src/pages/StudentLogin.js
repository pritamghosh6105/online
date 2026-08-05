import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { BookOpen, User, Lock, Eye, EyeOff, X } from 'lucide-react';

const StudentLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'email') {
      const numericValue = value.replace(/\D/g, '').slice(0, 11);
      setFormData(prev => ({
        ...prev,
        [name]: numericValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = '11-digit Student ID is required';
    } else if (formData.email.length !== 11) {
      newErrors.email = 'Student ID must be exactly 11 digits';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    const result = await login(formData);

    if (result.success) {
      navigate('/dashboard');
    }
    setLoading(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f8fafc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
      position: 'relative',
      fontFamily: 'Inter, system-ui, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '12px',
        padding: '2.25rem 2rem 2rem 2rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        width: '100%',
        maxWidth: '400px',
        position: 'relative'
      }}>
        {/* Cross Close Button to Back Home */}
        <Link
          to="/"
          title="Back to Home"
          aria-label="Back to Home"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '2.1rem',
            height: '2.1rem',
            borderRadius: '50%',
            backgroundColor: '#f1f5f9',
            color: '#64748b',
            textDecoration: 'none',
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#e2e8f0';
            e.currentTarget.style.color = '#0f172a';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#f1f5f9';
            e.currentTarget.style.color = '#64748b';
          }}
        >
          <X size={18} />
        </Link>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: '0.875rem'
          }}>
            <BookOpen size={42} color="#2563eb" strokeWidth={2.6} />
          </div>
          <h1 style={{
            fontSize: '1.5rem',
            fontWeight: '700',
            color: '#1e293b',
            marginBottom: '0.35rem'
          }}>
            Student Login
          </h1>
          <p style={{
            color: '#64748b',
            fontSize: '0.875rem',
            margin: 0
          }}>
            Sign in with your 11-digit Student ID
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Student ID Field */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#334155',
              marginBottom: '0.375rem'
            }}>
              Student ID (11 Digits)
            </label>
            <div style={{ position: 'relative' }}>
              <User className="input-icon-left" style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1.1rem',
                height: '1.1rem',
                color: '#94a3b8',
                pointerEvents: 'none',
                zIndex: 5
              }} />
              <input
                type="text"
                name="email"
                className="input-with-left-icon"
                value={formData.email}
                onChange={handleChange}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength="11"
                style={{
                  width: '100%',
                  paddingLeft: '3rem',
                  paddingRight: '0.75rem',
                  paddingTop: '0.65rem',
                  paddingBottom: '0.65rem',
                  border: `1px solid ${errors.email ? '#ef4444' : '#cbd5e1'}`,
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
                placeholder="Enter 11-digit Student ID"
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = errors.email ? '#ef4444' : '#cbd5e1'}
              />
            </div>
            {errors.email && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              display: 'block',
              fontSize: '0.875rem',
              fontWeight: '600',
              color: '#334155',
              marginBottom: '0.375rem'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <Lock className="input-icon-left" style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                width: '1.1rem',
                height: '1.1rem',
                color: '#94a3b8',
                pointerEvents: 'none',
                zIndex: 5
              }} />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                className="input-with-both-icons"
                value={formData.password}
                onChange={handleChange}
                style={{
                  width: '100%',
                  paddingLeft: '3rem',
                  paddingRight: '3rem',
                  paddingTop: '0.65rem',
                  paddingBottom: '0.65rem',
                  border: `1px solid ${errors.password ? '#ef4444' : '#cbd5e1'}`,
                  borderRadius: '6px',
                  fontSize: '0.875rem',
                  outline: 'none',
                  backgroundColor: '#ffffff',
                  color: '#0f172a'
                }}
                placeholder="Enter password"
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = errors.password ? '#ef4444' : '#cbd5e1'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.75rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  color: '#94a3b8'
                }}
              >
                {showPassword ? <EyeOff style={{ width: '1rem', height: '1rem' }} /> : <Eye style={{ width: '1rem', height: '1rem' }} />}
              </button>
            </div>
            {errors.password && (
              <p style={{ color: '#ef4444', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                {errors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}

            style={{
              width: '100%',
              padding: '0.625rem 1rem',
              backgroundColor: loading ? '#93c5fd' : '#2563eb',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '0.875rem',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? 'Logging in...' : 'Login as Student'}
          </button>
        </form>

        {/* Footer Navigation */}
        <div style={{
          marginTop: '1.5rem',
          paddingTop: '1rem',
          borderTop: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.875rem',
          color: '#64748b'
        }}>
          <Link
            to="/register"
            style={{
              color: '#2563eb',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Register Account
          </Link>

          <Link
            to="/admin-login"
            style={{
              color: '#475569',
              textDecoration: 'none',
              fontWeight: '600'
            }}
          >
            Admin Login →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
