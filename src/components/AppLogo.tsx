import React from 'react';

interface AppLogoProps {
  className?: string;
  size?: number | string;
  withBackground?: boolean;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  className = 'w-9 h-9',
  withBackground = true,
}) => {
  if (!withBackground) {
    return (
      <svg
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
      >
        {/* Anneau circulaire noir */}
        <circle cx="256" cy="256" r="176" stroke="currentColor" strokeWidth="42" />
        {/* Aiguille boussole losange */}
        <path
          d="M 334 172 L 310 276 L 178 340 L 202 236 Z"
          stroke="currentColor"
          strokeWidth="42"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Fond Squircle orange ambré officiel de l'application */}
      <rect width="512" height="512" rx="118" fill="#F7941D" />
      {/* Anneau circulaire noir audacieux */}
      <circle cx="256" cy="256" r="176" stroke="#050505" strokeWidth="42" />
      {/* Aiguille boussole losange orientée */}
      <path
        d="M 334 172 L 310 276 L 178 340 L 202 236 Z"
        stroke="#050505"
        strokeWidth="42"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
};
