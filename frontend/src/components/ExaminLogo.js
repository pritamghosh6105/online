import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';

const ExaminLogo = ({ size = 32, showSubtext = true, to = '/', textColor = '#0F172A' }) => {
  return (
    <Link to={to} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.65rem', textDecoration: 'none' }}>
      <BookOpen 
        size={size} 
        color="#2563eb" 
        strokeWidth={2.6}
        style={{ flexShrink: 0 }}
      />
      <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
        <span style={{ 
          fontSize: `${size * 0.72}px`, 
          fontWeight: '800', 
          color: textColor, 
          letterSpacing: '-0.03em' 
        }}>
          Examin
        </span>
        {showSubtext && (
          <span style={{ 
            fontSize: '0.625rem', 
            color: '#2563eb', 
            fontWeight: '700', 
            letterSpacing: '0.14em',
            marginTop: '3px'
          }}>
            PROCTOR PLATFORM
          </span>
        )}
      </div>
    </Link>
  );
};

export default ExaminLogo;
