interface LogoProps {
  size?: number;
  className?: string;
  variant?: 'default' | 'white' | 'dark';
}

export function Logo({ size = 48, className = '', variant = 'default' }: LogoProps) {
  const gradientId = `logo-gradient-${Math.random().toString(36).substr(2, 9)}`;
  const glowId = `logo-glow-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        {/* Cartoon-style gradients */}
        <radialGradient id={`${gradientId}-skin`} cx="40%" cy="30%">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="50%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </radialGradient>

        <radialGradient id={`${gradientId}-highlight`} cx="35%" cy="25%">
          <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
          <stop offset="40%" stopColor="#EFF6FF" stopOpacity="0.6" />
          <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0" />
        </radialGradient>

        <linearGradient id={`${gradientId}-bowtie`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="50%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#FB7185" />
        </linearGradient>

        <filter id={glowId}>
          <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>

        <filter id={`${glowId}-shadow`}>
          <feGaussianBlur in="SourceAlpha" stdDeviation="6"/>
          <feOffset dx="0" dy="4"/>
          <feComponentTransfer>
            <feFuncA type="linear" slope="0.2"/>
          </feComponentTransfer>
          <feMerge>
            <feMergeNode/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      {/* Soft background circle */}
      <circle
        cx="100"
        cy="100"
        r="85"
        fill={`url(#${gradientId}-skin)`}
        opacity="0.15"
      />

      <g transform="translate(100, 100)" filter={`url(#${glowId}-shadow)`}>
        {/* Tech headband */}
        <g filter={`url(#${glowId})`}>
          <path
            d="M -45 -50 Q 0 -58 45 -50"
            stroke="#8B5CF6"
            strokeWidth="6"
            fill="none"
            strokeLinecap="round"
            opacity="0.8"
          />
          <circle cx="0" cy="-60" r="8" fill="#A78BFA" />
          <circle cx="0" cy="-60" r="4" fill="#FFFFFF" opacity="0.8" />
        </g>

        {/* Head - big and round (cartoon proportions) */}
        <ellipse cx="0" cy="-20" rx="55" ry="58" fill={`url(#${gradientId}-skin)`} />
        <ellipse cx="0" cy="-20" rx="55" ry="58" fill={`url(#${gradientId}-highlight)`} />
        
        {/* Strong 3D highlight */}
        <ellipse cx="-15" cy="-35" rx="28" ry="32" fill="#FFFFFF" opacity="0.5" />
        <ellipse cx="-20" cy="-40" rx="18" ry="22" fill="#FFFFFF" opacity="0.3" />

        {/* Eyebrows */}
        <path 
          d="M -30 -30 Q -20 -33 -10 -31" 
          stroke="#4F46E5" 
          strokeWidth="4" 
          strokeLinecap="round"
          opacity="0.7"
        />
        <path 
          d="M 10 -31 Q 20 -33 30 -30" 
          stroke="#4F46E5" 
          strokeWidth="4" 
          strokeLinecap="round"
          opacity="0.7"
        />

        {/* Eyes - big cartoon eyes */}
        <g filter={`url(#${glowId})`}>
          {/* Left eye */}
          <ellipse cx="-20" cy="-15" rx="16" ry="17" fill="#1E3A8A" opacity="0.9" />
          <circle cx="-20" cy="-15" r="12" fill="#3B82F6" />
          <circle cx="-22" cy="-18" r="6" fill="#60A5FA" />
          <circle cx="-24" cy="-20" r="4" fill="#FFFFFF" />
          <circle cx="-18" cy="-12" r="2.5" fill="#FFFFFF" opacity="0.7" />

          {/* Right eye */}
          <ellipse cx="20" cy="-15" rx="16" ry="17" fill="#1E3A8A" opacity="0.9" />
          <circle cx="20" cy="-15" r="12" fill="#3B82F6" />
          <circle cx="18" cy="-18" r="6" fill="#60A5FA" />
          <circle cx="16" cy="-20" r="4" fill="#FFFFFF" />
          <circle cx="22" cy="-12" r="2.5" fill="#FFFFFF" opacity="0.7" />
        </g>

        {/* Nose */}
        <ellipse cx="0" cy="0" rx="4" ry="6" fill="#93C5FD" opacity="0.4" />

        {/* Cheeks */}
        <ellipse cx="-40" cy="5" rx="16" ry="12" fill="#F9A8D4" opacity="0.25" />
        <ellipse cx="40" cy="5" rx="16" ry="12" fill="#F9A8D4" opacity="0.25" />

        {/* Mouth - happy smile */}
        <path 
          d="M -18 8 Q 0 18 18 8" 
          stroke="#818CF8" 
          strokeWidth="3.5" 
          fill="none" 
          strokeLinecap="round"
          opacity="0.8"
        />

        {/* Neck */}
        <path
          d="M -15 35 Q -14 45 -15 50 L 15 50 Q 16 45 15 35 Z"
          fill={`url(#${gradientId}-skin)`}
        />
        <ellipse cx="0" cy="42" rx="12" ry="8" fill={`url(#${gradientId}-highlight)`} opacity="0.6" />

        {/* Bow Tie - prominent and cute */}
        <g transform="translate(0, 58)" filter={`url(#${glowId})`}>
          {/* Left bow */}
          <path
            d="M -30 0 Q -18 0 -14 -8 Q -18 -16 -30 -16 L -20 -8 Z"
            fill={`url(#${gradientId}-bowtie)`}
          />
          <ellipse cx="-23" cy="-8" rx="10" ry="7" fill="#FFF1F2" opacity="0.5" />
          
          {/* Center knot */}
          <ellipse cx="0" cy="-8" rx="10" ry="12" fill="#BE185D" />
          <ellipse cx="0" cy="-8" rx="10" ry="12" fill={`url(#${gradientId}-highlight)`} opacity="0.4" />
          
          {/* Right bow */}
          <path
            d="M 30 0 Q 18 0 14 -8 Q 18 -16 30 -16 L 20 -8 Z"
            fill={`url(#${gradientId}-bowtie)`}
          />
          <ellipse cx="23" cy="-8" rx="10" ry="7" fill="#FFF1F2" opacity="0.5" />
        </g>

        {/* Shoulders hint */}
        <ellipse cx="-35" cy="65" rx="18" ry="20" fill={`url(#${gradientId}-skin)`} opacity="0.7" />
        <ellipse cx="35" cy="65" rx="18" ry="20" fill={`url(#${gradientId}-skin)`} opacity="0.7" />
        <ellipse cx="-35" cy="65" rx="18" ry="20" fill={`url(#${gradientId}-highlight)`} opacity="0.5" />
        <ellipse cx="35" cy="65" rx="18" ry="20" fill={`url(#${gradientId}-highlight)`} opacity="0.5" />
      </g>

      {/* Floating particles for life */}
      <circle cx="30" cy="50" r="4" fill="#60A5FA" opacity="0.4">
        <animate
          attributeName="cy"
          values="50;45;50"
          dur="3s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="165" cy="65" r="3.5" fill="#A78BFA" opacity="0.4">
        <animate
          attributeName="cy"
          values="65;60;65"
          dur="4s"
          repeatCount="indefinite"
        />
      </circle>
      <circle cx="50" cy="150" r="4.5" fill="#EC4899" opacity="0.4">
        <animate
          attributeName="cy"
          values="150;145;150"
          dur="3.5s"
          repeatCount="indefinite"
        />
      </circle>
    </svg>
  );
}

// Icon-only version - simple robot face
export function LogoIcon({ size = 32, className = '' }: { size?: number; className?: string }) {
  const gradientId = `logo-icon-gradient-${Math.random().toString(36).substr(2, 9)}`;
  
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <radialGradient id={`${gradientId}-skin`} cx="40%" cy="30%">
          <stop offset="0%" stopColor="#DBEAFE" />
          <stop offset="50%" stopColor="#93C5FD" />
          <stop offset="100%" stopColor="#60A5FA" />
        </radialGradient>

        <linearGradient id={`${gradientId}-bowtie`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="50%" stopColor="#F472B6" />
          <stop offset="100%" stopColor="#FB7185" />
        </linearGradient>
      </defs>

      <g transform="translate(60, 60)">
        {/* Headband */}
        <path d="M -28 -32 Q 0 -36 28 -32" stroke="#8B5CF6" strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.8" />
        <circle cx="0" cy="-37" r="5" fill="#A78BFA" />
        <circle cx="0" cy="-37" r="2.5" fill="white" opacity="0.8" />

        {/* Head */}
        <ellipse cx="0" cy="-10" rx="32" ry="34" fill={`url(#${gradientId}-skin)`} />
        <ellipse cx="-10" cy="-20" rx="16" ry="18" fill="white" opacity="0.5" />

        {/* Eyes */}
        <ellipse cx="-12" cy="-8" rx="9" ry="10" fill="#1E3A8A" opacity="0.9" />
        <circle cx="-12" cy="-8" r="7" fill="#3B82F6" />
        <circle cx="-14" cy="-10" r="3.5" fill="#60A5FA" />
        <circle cx="-15" cy="-12" r="2.5" fill="white" />

        <ellipse cx="12" cy="-8" rx="9" ry="10" fill="#1E3A8A" opacity="0.9" />
        <circle cx="12" cy="-8" r="7" fill="#3B82F6" />
        <circle cx="10" cy="-10" r="3.5" fill="#60A5FA" />
        <circle cx="9" cy="-12" r="2.5" fill="white" />

        {/* Smile */}
        <path d="M -10 5 Q 0 11 10 5" stroke="#818CF8" strokeWidth="2.5" fill="none" strokeLinecap="round" />

        {/* Neck */}
        <path d="M -8 20 L -8 28 L 8 28 L 8 20 Z" fill={`url(#${gradientId}-skin)`} />

        {/* Bow tie */}
        <g transform="translate(0, 34)">
          <path d="M -18 0 Q -10 0 -8 -5 Q -10 -10 -18 -10 L -12 -5 Z" fill={`url(#${gradientId}-bowtie)`} />
          <ellipse cx="0" cy="-5" rx="6" ry="7" fill="#BE185D" />
          <path d="M 18 0 Q 10 0 8 -5 Q 10 -10 18 -10 L 12 -5 Z" fill={`url(#${gradientId}-bowtie)`} />
        </g>
      </g>
    </svg>
  );
}
