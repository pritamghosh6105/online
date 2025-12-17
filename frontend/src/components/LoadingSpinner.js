import React from 'react';

const LoadingSpinner = ({ size = 'large', text = 'Loading...' }) => {
  const spinnerSize = size === 'small' ? '2rem' : '3rem';
  
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      backgroundColor: '#f8fafc'
    }}>
      <div style={{
        width: spinnerSize,
        height: spinnerSize,
        border: '4px solid #e5e7eb',
        borderTop: '4px solid #3b82f6',
        borderRadius: '50%',
        animation: 'spin 1s linear infinite'
      }}></div>
      <p style={{
        marginTop: '1rem',
        color: '#6b7280',
        fontSize: '1rem'
      }}>
        {text}
      </p>
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default LoadingSpinner;