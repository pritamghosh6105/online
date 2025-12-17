import React, { useState, useEffect } from 'react';
import { calculateTimeRemaining } from '../utils/helpers';

const Timer = ({ duration, onTimeUp, examStartTime }) => {
  const [timeLeft, setTimeLeft] = useState(duration * 60); // Convert minutes to seconds
  
  useEffect(() => {
    if (examStartTime) {
      const elapsed = Math.floor((Date.now() - new Date(examStartTime).getTime()) / 1000);
      const remaining = Math.max(0, (duration * 60) - elapsed);
      setTimeLeft(remaining);
    }
  }, [duration, examStartTime]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          onTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimerColor = () => {
    const totalTime = duration * 60;
    const percentage = (timeLeft / totalTime) * 100;
    
    if (percentage <= 10) return '#dc2626'; // Red
    if (percentage <= 25) return '#f59e0b'; // Yellow
    return '#059669'; // Green
  };

  return (
    <div style={{
      position: 'fixed',
      top: '1rem',
      right: '1rem',
      backgroundColor: '#ffffff',
      padding: '1rem',
      borderRadius: '0.5rem',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      border: `2px solid ${getTimerColor()}`,
      zIndex: 1000
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem'
      }}>
        <div style={{
          width: '0.75rem',
          height: '0.75rem',
          borderRadius: '50%',
          backgroundColor: getTimerColor(),
          animation: timeLeft <= 60 ? 'pulse 1s infinite' : 'none'
        }}></div>
        <span style={{
          fontSize: '1.125rem',
          fontWeight: 'bold',
          color: getTimerColor(),
          fontFamily: 'monospace'
        }}>
          {formatTime(timeLeft)}
        </span>
      </div>
      <div style={{
        fontSize: '0.75rem',
        color: '#6b7280',
        marginTop: '0.25rem',
        textAlign: 'center'
      }}>
        Time Remaining
      </div>
      
      <style>
        {`
          @keyframes pulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
          }
        `}
      </style>
    </div>
  );
};

export default Timer;