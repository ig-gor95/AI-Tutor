import { useEffect, useState } from 'react';

interface Props {
  isListening?: boolean;
  isSpeaking?: boolean;
}

export function AIAvatar({ isListening = false, isSpeaking = false }: Props) {
  const [floatOffset, setFloatOffset] = useState(0);
  const [headTilt, setHeadTilt] = useState(0);
  const [blinkState, setBlinkState] = useState(false);
  const [eyePosition, setEyePosition] = useState({ x: 0, y: 0 });
  const [breathScale, setBreathScale] = useState(1);

  // Smooth floating and head movement
  useEffect(() => {
    const interval = setInterval(() => {
      const time = Date.now() * 0.001;
      setFloatOffset(Math.sin(time * 0.2) * 4);
      setHeadTilt(Math.sin(time * 0.15) * 1);
      setBreathScale(1 + Math.sin(time * 0.4) * 0.008);
      setEyePosition({
        x: Math.sin(time * 0.2) * 1.5,
        y: Math.cos(time * 0.15) * 1
      });
    }, 150);
    return () => clearInterval(interval);
  }, []);

  // Natural blinking
  useEffect(() => {
    let timeoutId: NodeJS.Timeout | null = null;
    
    const blinkInterval = setInterval(() => {
      setBlinkState(true);
      timeoutId = setTimeout(() => setBlinkState(false), 150);
    }, 3000 + Math.random() * 2000);
    
    return () => {
      clearInterval(blinkInterval);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="w-full h-full relative overflow-hidden bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      {/* Soft ambient background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-blue-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-1/3 right-1/3 w-[500px] h-[500px] bg-purple-200/30 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
      </div>

      {/* Sound waves when active */}
      {(isListening || isSpeaking) && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute w-[550px] h-[550px] border-2 border-blue-400/40 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping" />
          <div className="absolute w-[650px] h-[650px] border border-purple-400/30 rounded-full -translate-x-1/2 -translate-y-1/2 animate-ping" 
            style={{ animationDelay: '0.5s' }}
          />
        </div>
      )}

      {/* Main Character */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          style={{ 
            transform: `translateY(${floatOffset}px) scale(${breathScale})`
          }}
        >
          <svg viewBox="0 0 600 700" className="w-[550px] h-[650px]" style={{ filter: 'drop-shadow(0 25px 50px rgba(99, 102, 241, 0.2))' }}>
            <defs>
              {/* Cartoon-style gradients with more vibrant colors */}
              <radialGradient id="skinGrad" cx="40%" cy="30%">
                <stop offset="0%" stopColor="#DBEAFE" />
                <stop offset="50%" stopColor="#93C5FD" />
                <stop offset="100%" stopColor="#60A5FA" />
              </radialGradient>

              <radialGradient id="highlight3D" cx="35%" cy="25%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="40%" stopColor="#EFF6FF" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#DBEAFE" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="bowTie" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#EC4899" />
                <stop offset="50%" stopColor="#F472B6" />
                <stop offset="100%" stopColor="#FB7185" />
              </linearGradient>

              <linearGradient id="shirtGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#F1F5F9" />
              </linearGradient>

              <radialGradient id="deskGrad" cx="50%" cy="0%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="100%" stopColor="#6366F1" />
              </radialGradient>

              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              <filter id="strongGlow">
                <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>

              <filter id="cartoonShadow">
                <feGaussianBlur in="SourceAlpha" stdDeviation="10"/>
                <feOffset dx="0" dy="8"/>
                <feComponentTransfer>
                  <feFuncA type="linear" slope="0.2"/>
                </feComponentTransfer>
                <feMerge>
                  <feMergeNode/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Character body parts (behind desk) */}
            <g 
              transform={`translate(300, 300) rotate(${headTilt}) translate(-300, -300)`}
              style={{ transformOrigin: '300px 300px' }}
            >
              {/* Body/Torso - rounded cartoon style */}
              <g filter="url(#cartoonShadow)">
                {/* Shirt/Body */}
                <path
                  d="M 200 380 
                     Q 195 400 195 430
                     L 195 520
                     Q 195 550 210 570
                     L 390 570
                     Q 405 550 405 520
                     L 405 430
                     Q 405 400 400 380
                     Q 395 360 380 350
                     L 220 350
                     Q 205 360 200 380 Z"
                  fill="url(#shirtGrad)"
                />
                
                {/* 3D highlight on shirt */}
                <ellipse cx="280" cy="430" rx="70" ry="90" fill="url(#highlight3D)" opacity="0.6" />
                
                {/* Collar */}
                <path d="M 250 355 L 270 380 L 300 365 L 330 380 L 350 355" 
                  stroke="#E0E7FF" 
                  strokeWidth="4" 
                  fill="none" 
                  strokeLinecap="round"
                />
              </g>

              {/* Bow Tie - prominent and cute */}
              <g filter="url(#glow)">
                {/* Left bow */}
                <path
                  d="M 265 375 Q 245 375 235 390 Q 245 405 265 405 L 285 390 Z"
                  fill="url(#bowTie)"
                />
                <ellipse cx="260" cy="390" rx="18" ry="12" fill="#FFF1F2" opacity="0.5" />
                
                {/* Center knot */}
                <ellipse cx="300" cy="390" rx="15" ry="18" fill="#BE185D" />
                <ellipse cx="300" cy="390" rx="15" ry="18" fill="url(#highlight3D)" opacity="0.4" />
                
                {/* Right bow */}
                <path
                  d="M 335 375 Q 355 375 365 390 Q 355 405 335 405 L 315 390 Z"
                  fill="url(#bowTie)"
                />
                <ellipse cx="340" cy="390" rx="18" ry="12" fill="#FFF1F2" opacity="0.5" />
              </g>

              {/* Shoulders - rounded 3D */}
              <g filter="url(#cartoonShadow)">
                <circle cx="190" cy="370" r="50" fill="url(#skinGrad)" />
                <circle cx="190" cy="370" r="50" fill="url(#highlight3D)" />
                <ellipse cx="175" cy="355" rx="28" ry="32" fill="#FFFFFF" opacity="0.4" />
                
                <circle cx="410" cy="370" r="50" fill="url(#skinGrad)" />
                <circle cx="410" cy="370" r="50" fill="url(#highlight3D)" />
                <ellipse cx="425" cy="355" rx="28" ry="32" fill="#FFFFFF" opacity="0.4" />
              </g>

              {/* Arms - smooth rounded */}
              <g filter="url(#cartoonShadow)">
                {/* Left arm */}
                <path
                  d="M 190 375 Q 160 410 150 460 Q 145 500 155 535"
                  stroke="url(#skinGrad)"
                  strokeWidth="50"
                  strokeLinecap="round"
                  fill="none"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="0 190 375; 5 190 375; 0 190 375"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                </path>
                <path
                  d="M 192 380 Q 165 415 158 455"
                  stroke="url(#highlight3D)"
                  strokeWidth="24"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="0 190 375; 5 190 375; 0 190 375"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                </path>

                {/* Right arm */}
                <path
                  d="M 410 375 Q 440 410 450 460 Q 455 500 445 535"
                  stroke="url(#skinGrad)"
                  strokeWidth="50"
                  strokeLinecap="round"
                  fill="none"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="0 410 375; -5 410 375; 0 410 375"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                </path>
                <path
                  d="M 408 380 Q 435 415 442 455"
                  stroke="url(#highlight3D)"
                  strokeWidth="24"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.7"
                >
                  <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="0 410 375; -5 410 375; 0 410 375"
                    dur="5s"
                    repeatCount="indefinite"
                  />
                </path>
              </g>

              {/* Hands - cartoon style */}
              <g filter="url(#cartoonShadow)">
                <ellipse cx="155" cy="545" rx="28" ry="35" fill="url(#skinGrad)" />
                <ellipse cx="155" cy="545" rx="28" ry="35" fill="url(#highlight3D)" />
                <ellipse cx="148" cy="535" rx="15" ry="20" fill="#FFFFFF" opacity="0.4" />
                
                <ellipse cx="445" cy="545" rx="28" ry="35" fill="url(#skinGrad)" />
                <ellipse cx="445" cy="545" rx="28" ry="35" fill="url(#highlight3D)" />
                <ellipse cx="452" cy="535" rx="15" ry="20" fill="#FFFFFF" opacity="0.4" />
              </g>
            </g>

            {/* Desk/Table - in front of body */}
            <g filter="url(#cartoonShadow)">
              {/* Desk surface */}
              <ellipse cx="300" cy="620" rx="280" ry="60" fill="url(#deskGrad)" opacity="0.9" />
              <ellipse cx="300" cy="620" rx="280" ry="60" fill="url(#highlight3D)" opacity="0.4" />
              
              {/* Desk edge highlight */}
              <ellipse cx="300" cy="605" rx="260" ry="15" fill="#A78BFA" opacity="0.7" />
              
              {/* Desk front */}
              <path
                d="M 80 620 Q 80 650 100 665 L 500 665 Q 520 650 520 620 Z"
                fill="#6366F1"
                opacity="0.85"
              />
              <path
                d="M 80 620 Q 80 650 100 665 L 500 665 Q 520 650 520 620 Z"
                fill="url(#highlight3D)"
                opacity="0.3"
              />
            </g>

            {/* Character head and upper body (in front of desk) */}
            <g 
              transform={`translate(300, 300) rotate(${headTilt}) translate(-300, -300)`}
              style={{ transformOrigin: '300px 300px' }}
            >
              {/* Neck - short and cartoon */}
              <g filter="url(#cartoonShadow)">
                <path
                  d="M 270 330 Q 268 345 270 355 L 330 355 Q 332 345 330 330 Z"
                  fill="url(#skinGrad)"
                />
                <ellipse cx="300" cy="340" rx="22" ry="14" fill="url(#highlight3D)" opacity="0.6" />
              </g>

              {/* Head - big and round (cartoon proportions) */}
              <g filter="url(#cartoonShadow)">
                <ellipse cx="300" cy="230" rx="95" ry="100" fill="url(#skinGrad)" />
                <ellipse cx="300" cy="230" rx="95" ry="100" fill="url(#highlight3D)" />
                
                {/* Strong 3D highlight */}
                <ellipse cx="265" cy="200" rx="50" ry="60" fill="#FFFFFF" opacity="0.5" />
                <ellipse cx="255" cy="190" rx="35" ry="40" fill="#FFFFFF" opacity="0.3" />
              </g>

              {/* Tech headband - futuristic touch */}
              <g filter="url(#glow)">
                <path
                  d="M 210 200 Q 300 185 390 200"
                  stroke="#8B5CF6"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  opacity="0.8"
                />
                <circle cx="300" cy="188" r="12" fill="#A78BFA">
                  <animate attributeName="opacity" values="0.7;1;0.7" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx="300" cy="188" r="6" fill="#FFFFFF" opacity="0.8" />
              </g>

              {/* Eyebrows - expressive cartoon style */}
              <g>
                <path 
                  d="M 245 210 Q 260 205 275 208" 
                  stroke="#4F46E5" 
                  strokeWidth="7" 
                  strokeLinecap="round"
                  opacity="0.8"
                />
                <path 
                  d="M 325 208 Q 340 205 355 210" 
                  stroke="#4F46E5" 
                  strokeWidth="7" 
                  strokeLinecap="round"
                  opacity="0.8"
                />
              </g>

              {/* Eyes - big cartoon eyes with sparkle */}
              <g filter="url(#glow)">
                {/* Left eye */}
                <ellipse 
                  cx={260 + eyePosition.x} 
                  cy={235 + eyePosition.y} 
                  rx="28" 
                  ry={blinkState ? 4 : 30}
                  fill="#1E3A8A"
                  opacity="0.9"
                />
                <circle 
                  cx={260 + eyePosition.x} 
                  cy={235 + eyePosition.y} 
                  r={blinkState ? 0 : 20} 
                  fill="#3B82F6"
                >
                  {isSpeaking && !blinkState && (
                    <animate attributeName="r" values="20;23;20" dur="0.8s" repeatCount="indefinite" />
                  )}
                </circle>
                <circle 
                  cx={255 + eyePosition.x} 
                  cy={230 + eyePosition.y} 
                  r={blinkState ? 0 : 11} 
                  fill="#60A5FA"
                />
                <circle 
                  cx={252 + eyePosition.x} 
                  cy={227 + eyePosition.y} 
                  r={blinkState ? 0 : 7} 
                  fill="#FFFFFF"
                />
                <circle 
                  cx={265 + eyePosition.x} 
                  cy={240 + eyePosition.y} 
                  r={blinkState ? 0 : 4} 
                  fill="#FFFFFF"
                  opacity="0.7"
                />

                {/* Right eye */}
                <ellipse 
                  cx={340 + eyePosition.x} 
                  cy={235 + eyePosition.y} 
                  rx="28" 
                  ry={blinkState ? 4 : 30}
                  fill="#1E3A8A"
                  opacity="0.9"
                />
                <circle 
                  cx={340 + eyePosition.x} 
                  cy={235 + eyePosition.y} 
                  r={blinkState ? 0 : 20} 
                  fill="#3B82F6"
                >
                  {isSpeaking && !blinkState && (
                    <animate attributeName="r" values="20;23;20" dur="0.8s" repeatCount="indefinite" />
                  )}
                </circle>
                <circle 
                  cx={335 + eyePosition.x} 
                  cy={230 + eyePosition.y} 
                  r={blinkState ? 0 : 11} 
                  fill="#60A5FA"
                />
                <circle 
                  cx={332 + eyePosition.x} 
                  cy={227 + eyePosition.y} 
                  r={blinkState ? 0 : 7} 
                  fill="#FFFFFF"
                />
                <circle 
                  cx={345 + eyePosition.x} 
                  cy={240 + eyePosition.y} 
                  r={blinkState ? 0 : 4} 
                  fill="#FFFFFF"
                  opacity="0.7"
                />
              </g>

              {/* Nose - simple cartoon */}
              <ellipse cx="300" cy="260" rx="8" ry="12" fill="#93C5FD" opacity="0.4" />

              {/* Cheeks - rosy cartoon blush */}
              <ellipse cx="220" cy="265" rx="30" ry="22" fill="#F9A8D4" opacity="0.25" />
              <ellipse cx="380" cy="265" rx="30" ry="22" fill="#F9A8D4" opacity="0.25" />

              {/* Mouth - expressive */}
              {isSpeaking ? (
                <g filter="url(#glow)">
                  <ellipse cx="300" cy="290" rx="35" ry="25" fill="#3B82F6" opacity="0.15" />
                  <path 
                    d="M 265 290 Q 300 310 335 290" 
                    stroke="#60A5FA" 
                    strokeWidth="6" 
                    fill="none" 
                    strokeLinecap="round"
                  />
                  {/* Animated sound bars */}
                  <rect x="285" y="288" width="7" height="14" fill="#8B5CF6" rx="3.5">
                    <animate attributeName="height" values="12;26;12" dur="0.5s" repeatCount="indefinite" />
                    <animate attributeName="y" values="292;278;292" dur="0.5s" repeatCount="indefinite" />
                  </rect>
                  <rect x="297" y="288" width="7" height="14" fill="#8B5CF6" rx="3.5">
                    <animate attributeName="height" values="16;30;16" dur="0.5s" begin="0.1s" repeatCount="indefinite" />
                    <animate attributeName="y" values="288;272;288" dur="0.5s" begin="0.1s" repeatCount="indefinite" />
                  </rect>
                  <rect x="309" y="288" width="7" height="14" fill="#8B5CF6" rx="3.5">
                    <animate attributeName="height" values="14;28;14" dur="0.5s" begin="0.2s" repeatCount="indefinite" />
                    <animate attributeName="y" values="290;276;290" dur="0.5s" begin="0.2s" repeatCount="indefinite" />
                  </rect>
                </g>
              ) : isListening ? (
                <g filter="url(#glow)">
                  <path 
                    d="M 265 290 Q 300 305 335 290" 
                    stroke="#818CF8" 
                    strokeWidth="6" 
                    fill="none" 
                    strokeLinecap="round"
                  />
                  <circle cx="275" cy="295" r="6" fill="#10B981">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="300" cy="303" r="6" fill="#10B981">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin="0.4s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="325" cy="295" r="6" fill="#10B981">
                    <animate attributeName="opacity" values="0.4;1;0.4" dur="1.5s" begin="0.8s" repeatCount="indefinite" />
                  </circle>
                </g>
              ) : (
                <path 
                  d="M 270 290 Q 300 303 330 290" 
                  stroke="#818CF8" 
                  strokeWidth="5" 
                  fill="none" 
                  strokeLinecap="round"
                  opacity="0.8"
                />
              )}

              {/* Energy particles when speaking */}
              {isSpeaking && (
                <g>
                  <circle cx="210" cy="310" r="6" fill="#60A5FA" filter="url(#glow)">
                    <animate attributeName="cy" values="310;220;310" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="390" cy="315" r="6" fill="#A78BFA" filter="url(#glow)">
                    <animate attributeName="cy" values="315;225;315" dur="2.2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;1;0" dur="2.2s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="240" cy="325" r="5" fill="#EC4899" filter="url(#glow)">
                    <animate attributeName="cy" values="325;235;325" dur="1.8s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.9;0" dur="1.8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="360" cy="320" r="5" fill="#06B6D4" filter="url(#glow)">
                    <animate attributeName="cy" values="320;230;320" dur="2.1s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0;0.9;0" dur="2.1s" repeatCount="indefinite" />
                  </circle>
                </g>
              )}
            </g>
          </svg>
        </div>
      </div>

      {/* Status indicator */}
      <div className="absolute bottom-4 sm:bottom-8 left-1/2 transform -translate-x-1/2 hidden">
        <div className="bg-white/95 backdrop-blur-xl border-2 border-blue-400/40 rounded-2xl px-4 sm:px-8 py-2 sm:py-4 shadow-xl shadow-blue-200/50">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative">
              <div className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full ${
                isSpeaking ? 'bg-blue-500' : 
                isListening ? 'bg-green-500' : 
                'bg-indigo-500'
              }`}>
                <div className="absolute inset-0 rounded-full bg-current animate-ping opacity-75" />
              </div>
            </div>
            <span className="text-xs sm:text-sm text-slate-700 tracking-wide">
              {isSpeaking ? 'ГОВОРЮ...' : isListening ? 'СЛУШАЮ...' : 'ГОТОВ К ОБЩЕНИЮ'}
            </span>
            {(isSpeaking || isListening) && (
              <div className="flex gap-1 ml-2">
                <div className="w-1 h-3 sm:h-4 bg-blue-400 rounded-full animate-pulse" />
                <div className="w-1 h-3 sm:h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                <div className="w-1 h-3 sm:h-4 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}