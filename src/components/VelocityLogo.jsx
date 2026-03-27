import React from 'react';

export default function VelocityLogo({ size = 32, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="vv-grad-main" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id="vv-grad-accent" x1="0" y1="24" x2="48" y2="24" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#a78bfa" />
        </linearGradient>
      </defs>

      {/* Background rounded square */}
      <rect x="2" y="2" width="44" height="44" rx="12" fill="url(#vv-grad-main)" opacity="0.15" />
      <rect x="2" y="2" width="44" height="44" rx="12" stroke="url(#vv-grad-main)" strokeWidth="1.5" fill="none" opacity="0.4" />

      {/* Stylized V — two converging data flow lines */}
      <path
        d="M12 12 L24 36 L36 12"
        stroke="url(#vv-grad-main)"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />

      {/* Speed lines (velocity streaks) — three horizontal dashes on the right */}
      <line x1="30" y1="18" x2="40" y2="18" stroke="url(#vv-grad-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <line x1="32" y1="23" x2="42" y2="23" stroke="url(#vv-grad-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <line x1="30" y1="28" x2="38" y2="28" stroke="url(#vv-grad-accent)" strokeWidth="2" strokeLinecap="round" opacity="0.3" />

      {/* Data node dots — small circles at key points */}
      <circle cx="12" cy="12" r="2.5" fill="#06b6d4" />
      <circle cx="36" cy="12" r="2.5" fill="#ec4899" />
      <circle cx="24" cy="36" r="3" fill="#8b5cf6" />
    </svg>
  );
}
