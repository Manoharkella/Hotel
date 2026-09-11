import React from 'react';

export default function HotelLogo({ light = false, size = 'default', className = '' }) {
  const isSmall = size === 'small';
  const isLarge = size === 'large';
  const iconSize = isSmall ? 28 : isLarge ? 42 : 34;
  const textSize = isSmall ? '1.25rem' : isLarge ? '2.1rem' : '1.65rem';

  return (
    <div className={`hotel-logo-wrap ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: isSmall ? 8 : 10, userSelect: 'none' }}>
      {/* Stylized coral/orange Hotel Building Icon */}
      <svg 
        width={iconSize} 
        height={iconSize} 
        viewBox="0 0 48 48" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(217, 119, 6, 0.25))', flexShrink: 0 }}
      >
        <defs>
          <linearGradient id="hotelRoofGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#EA580C" />
            <stop offset="100%" stopColor="#C2410C" />
          </linearGradient>
          <linearGradient id="hotelBodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FB923C" />
            <stop offset="100%" stopColor="#EA580C" />
          </linearGradient>
        </defs>

        {/* Roof / Pediment */}
        <path d="M6 18L24 6L42 18H6Z" fill="url(#hotelRoofGrad)" />
        {/* Roof Border / Overhang */}
        <path d="M4 18H44V21H4V18Z" fill="#C2410C" />

        {/* Main Hotel Structure */}
        <rect x="8" y="21" width="32" height="23" rx="2" fill="#FFFFFF" stroke="#EA580C" strokeWidth="2.5" />
        
        {/* Architectural Pillars / Windows */}
        <rect x="13" y="24" width="5" height="6" rx="1" fill="url(#hotelBodyGrad)" />
        <rect x="21.5" y="24" width="5" height="6" rx="1" fill="url(#hotelBodyGrad)" />
        <rect x="30" y="24" width="5" height="6" rx="1" fill="url(#hotelBodyGrad)" />

        <rect x="13" y="32" width="5" height="6" rx="1" fill="url(#hotelBodyGrad)" />
        {/* Entrance Doorway */}
        <path d="M21 44V33C21 31.8954 21.8954 31 23 31H25C26.1046 31 27 31.8954 27 33V44H21Z" fill="#C2410C" />
        <rect x="30" y="32" width="5" height="6" rx="1" fill="url(#hotelBodyGrad)" />

        {/* Foundation Base Line */}
        <rect x="4" y="44" width="40" height="3" rx="1" fill="#EA580C" />
      </svg>

      {/* Brand Text */}
      <span style={{ 
        fontFamily: "'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", 
        fontWeight: 800, 
        fontSize: textSize, 
        letterSpacing: '-0.02em',
        lineHeight: 1,
        color: light ? '#FFFFFF' : '#0F172A',
        display: 'inline-flex',
        alignItems: 'baseline'
      }}>
        Hotel<span style={{ 
          color: '#EA580C', 
          fontStyle: 'italic',
          fontFamily: "'Playfair Display', serif",
          fontWeight: 700,
          marginLeft: 1
        }}>IQ</span>
      </span>
    </div>
  );
}
