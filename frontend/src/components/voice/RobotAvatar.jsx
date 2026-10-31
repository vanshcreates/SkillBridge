import { useEffect, useState } from 'react'

/**
 * RobotAvatar - Animated AI Assistant for Rural Artisan Voice Registration
 * States:
 *  - 'idle': gentle floating, soft breathing, blinking eyes, gentle smile
 *  - 'speaking': animated mouth movements synced with speech, bobbing head, active antenna
 *  - 'listening': listening ear radar waves, wide attentive eyes, sound sensor mouth
 *  - 'processing': rotating thinking halo, scanning eye expression, pulsing body
 *  - 'success': cheerful bouncing, smiling eyes, celebration sparkles
 */
const RobotAvatar = ({
  state = 'idle',
  isMouthMoving = false,
  language = 'pa',
  className = '',
}) => {
  const [blink, setBlink] = useState(false)
  const [mouthFrame, setMouthFrame] = useState(0)

  // Periodic blinking in idle & listening states
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 200)
    }, 3500)
    return () => clearInterval(blinkInterval)
  }, [])

  // Dynamic mouth movement oscillation when speaking
  useEffect(() => {
    if (state !== 'speaking' && !isMouthMoving) return
    const mouthInterval = setInterval(() => {
      setMouthFrame((prev) => (prev + 1) % 4)
    }, 140)
    return () => clearInterval(mouthInterval)
  }, [state, isMouthMoving])

  // Antenna color based on state
  const antennaColors = {
    idle: '#F59E0B', // Amber
    speaking: '#EC4899', // Pink / Warm Magenta
    listening: '#10B981', // Emerald green
    processing: '#6366F1', // Indigo
    success: '#3B82F6', // Sky blue
  }

  const antennaGlow = antennaColors[state] || '#F59E0B'

  return (
    <div
      aria-label="SkillBridge Voice AI Robot"
      className={`relative flex flex-col items-center justify-center select-none ${className}`}
      role="img"
    >
      {/* Outer Sound Waves / Aura for Listening State */}
      {state === 'listening' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="absolute h-56 w-56 rounded-full border-2 border-emerald-400/40 animate-ping opacity-60" />
          <span className="absolute h-48 w-48 rounded-full border border-emerald-400/50 animate-pulse opacity-75" />
          <span className="absolute h-40 w-40 rounded-full bg-emerald-500/10 blur-xl animate-pulse" />
        </div>
      )}

      {/* Speaking Aura */}
      {state === 'speaking' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="absolute h-52 w-52 rounded-full bg-primary/10 blur-xl animate-pulse" />
        </div>
      )}

      {/* Processing Aura */}
      {state === 'processing' && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="absolute h-44 w-44 rounded-full border-2 border-dashed border-indigo-400 animate-spin opacity-50 duration-3000" />
          <span className="absolute h-48 w-48 rounded-full bg-indigo-500/10 blur-lg animate-pulse" />
        </div>
      )}

      {/* Main SVG Robot */}
      <svg
        className={`w-44 h-48 sm:w-52 sm:h-56 transition-transform duration-300 ${
          state === 'speaking'
            ? 'animate-bounce [animation-duration:1.2s]'
            : state === 'listening'
              ? 'scale-105'
              : state === 'success'
                ? 'animate-bounce [animation-duration:0.8s]'
                : 'hover:scale-102'
        }`}
        viewBox="0 0 240 260"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Metallic Head Gradient */}
          <linearGradient id="robotHeadGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2E3A59" />
            <stop offset="50%" stopColor="#1E293B" />
            <stop offset="100%" stopColor="#0F172A" />
          </linearGradient>

          {/* Screen Bezel Gradient */}
          <linearGradient id="robotScreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0A0F1D" />
            <stop offset="100%" stopColor="#161F36" />
          </linearGradient>

          {/* Eye Glow Filter */}
          <filter id="eyeGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Metallic Ear Gradient */}
          <linearGradient id="earGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E0E7FF" />
            <stop offset="100%" stopColor="#818CF8" />
          </linearGradient>
        </defs>

        {/* 1. Antenna */}
        <g id="antenna">
          {/* Stem */}
          <line
            x1="120"
            y1="38"
            x2="120"
            y2="14"
            stroke="#94A3B8"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Glowing Orb */}
          <circle
            cx="120"
            cy="12"
            r="8"
            fill={antennaGlow}
            filter="url(#eyeGlow)"
            className={state !== 'idle' ? 'animate-pulse' : ''}
          />
          <circle cx="120" cy="12" r="4" fill="#FFFFFF" />
          {/* Antenna Waves */}
          {state === 'speaking' && (
            <>
              <path
                d="M106 6 A18 18 0 0 1 134 6"
                stroke={antennaGlow}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <path
                d="M98 0 A28 28 0 0 1 142 0"
                stroke={antennaGlow}
                strokeWidth="2"
                fill="none"
                strokeLinecap="round"
                opacity="0.6"
              />
            </>
          )}
        </g>

        {/* 2. Ears / Sound Sensors with Listening Radiating Rings */}
        <g id="ears">
          {/* Left Ear */}
          <rect
            x="24"
            y="76"
            width="14"
            height="36"
            rx="7"
            fill="url(#earGrad)"
          />
          <circle cx="31" cy="94" r="4" fill="#4338CA" />

          {/* Right Ear */}
          <rect
            x="202"
            y="76"
            width="14"
            height="36"
            rx="7"
            fill="url(#earGrad)"
          />
          <circle cx="209" cy="94" r="4" fill="#4338CA" />

          {/* Listening Sound Pulses on Ears */}
          {state === 'listening' && (
            <>
              <path
                d="M16 80 C8 88 8 100 16 108"
                stroke="#10B981"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                className="animate-pulse"
              />
              <path
                d="M224 80 C232 88 232 100 224 108"
                stroke="#10B981"
                strokeWidth="3"
                fill="none"
                strokeLinecap="round"
                className="animate-pulse"
              />
            </>
          )}
        </g>

        {/* 3. Robot Head Outer Shell */}
        <g id="head-shell">
          <rect
            x="34"
            y="36"
            width="172"
            height="124"
            rx="36"
            fill="url(#robotHeadGrad)"
            stroke="#475569"
            strokeWidth="3"
          />
          {/* Decorative Head Highlights */}
          <path
            d="M50 48 Q120 38 190 48"
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.15"
            fill="none"
          />
        </g>

        {/* 4. Display Screen (Inside Head) */}
        <g id="face-screen">
          <rect
            x="48"
            y="50"
            width="144"
            height="96"
            rx="24"
            fill="url(#robotScreenGrad)"
            stroke="#1E293B"
            strokeWidth="2"
          />

          {/* Subtle Grid / Scanlines in Screen */}
          <line x1="56" y1="72" x2="184" y2="72" stroke="#1E293B" strokeWidth="0.8" opacity="0.4" />
          <line x1="56" y1="96" x2="184" y2="96" stroke="#1E293B" strokeWidth="0.8" opacity="0.4" />
          <line x1="56" y1="120" x2="184" y2="120" stroke="#1E293B" strokeWidth="0.8" opacity="0.4" />
        </g>

        {/* 5. Eyes */}
        <g id="eyes" filter="url(#eyeGlow)">
          {blink ? (
            // Blinking Line Eyes
            <>
              <line x1="78" y1="84" x2="102" y2="84" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
              <line x1="138" y1="84" x2="162" y2="84" stroke="#38BDF8" strokeWidth="4" strokeLinecap="round" />
            </>
          ) : state === 'success' ? (
            // Happy Crescent Eyes (^ ^)
            <>
              <path d="M78 88 Q90 74 102 88" stroke="#34D399" strokeWidth="5" fill="none" strokeLinecap="round" />
              <path d="M138 88 Q150 74 162 88" stroke="#34D399" strokeWidth="5" fill="none" strokeLinecap="round" />
            </>
          ) : state === 'processing' ? (
            // Scanning / Processing Concentric Eyes
            <>
              <circle cx="90" cy="84" r="10" fill="none" stroke="#A78BFA" strokeWidth="3" />
              <circle cx="90" cy="84" r="4" fill="#DDD6FE" className="animate-ping" />
              <circle cx="150" cy="84" r="10" fill="none" stroke="#A78BFA" strokeWidth="3" />
              <circle cx="150" cy="84" r="4" fill="#DDD6FE" className="animate-ping" />
            </>
          ) : state === 'listening' ? (
            // Wide Attentive Green/Cyan Eyes
            <>
              <rect x="80" y="72" width="20" height="24" rx="10" fill="#34D399" />
              <circle cx="86" cy="78" r="3.5" fill="#FFFFFF" />
              <rect x="140" y="72" width="20" height="24" rx="10" fill="#34D399" />
              <circle cx="146" cy="78" r="3.5" fill="#FFFFFF" />
            </>
          ) : state === 'speaking' ? (
            // Cheerful Animated Eyes
            <>
              <rect x="80" y="74" width="20" height="22" rx="9" fill="#38BDF8" />
              <circle cx="86" cy="79" r="4" fill="#FFFFFF" />
              <rect x="140" y="74" width="20" height="22" rx="9" fill="#38BDF8" />
              <circle cx="146" cy="79" r="4" fill="#FFFFFF" />
            </>
          ) : (
            // Normal Cute Blue Eyes (Idle)
            <>
              <rect x="80" y="74" width="20" height="22" rx="9" fill="#38BDF8" />
              <circle cx="86" cy="78" r="4" fill="#FFFFFF" />
              <rect x="140" y="74" width="20" height="22" rx="9" fill="#38BDF8" />
              <circle cx="146" cy="78" r="4" fill="#FFFFFF" />
            </>
          )}

          {/* Cute Rosy Cheeks */}
          <ellipse cx="68" cy="98" rx="6" ry="3.5" fill="#F43F5E" opacity="0.4" />
          <ellipse cx="172" cy="98" rx="6" ry="3.5" fill="#F43F5E" opacity="0.4" />
        </g>

        {/* 6. Mouth - Animated Audio-Reactive & State Specific */}
        <g id="mouth">
          {state === 'speaking' || isMouthMoving ? (
            // Talking Mouth Frames (Oscillating open/closed)
            mouthFrame === 0 ? (
              // Open O-shape
              <ellipse cx="120" cy="120" rx="14" ry="10" fill="#F43F5E" stroke="#FECDD3" strokeWidth="2" />
            ) : mouthFrame === 1 ? (
              // Wide talking smile
              <path
                d="M106 116 Q120 130 134 116 Z"
                fill="#F43F5E"
                stroke="#FECDD3"
                strokeWidth="2"
              />
            ) : mouthFrame === 2 ? (
              // Medium open oval
              <rect x="108" y="115" width="24" height="11" rx="5.5" fill="#F43F5E" stroke="#FECDD3" strokeWidth="2" />
            ) : (
              // Cheerful open curve
              <path
                d="M108 116 Q120 126 132 116"
                stroke="#F43F5E"
                strokeWidth="3.5"
                fill="none"
                strokeLinecap="round"
              />
            )
          ) : state === 'listening' ? (
            // Attentive Sound Sensor (Glowing Oval)
            <rect
              x="110"
              y="118"
              width="20"
              height="8"
              rx="4"
              fill="#10B981"
              stroke="#6EE7B7"
              strokeWidth="2"
              className="animate-pulse"
            />
          ) : state === 'processing' ? (
            // Processing Dot Waves
            <g>
              <circle cx="110" cy="122" r="3" fill="#A78BFA" className="animate-ping" />
              <circle cx="120" cy="122" r="3" fill="#C4B5FD" />
              <circle cx="130" cy="122" r="3" fill="#A78BFA" className="animate-ping" />
            </g>
          ) : state === 'success' ? (
            // Big Happy Smile
            <path
              d="M102 116 Q120 134 138 116"
              stroke="#34D399"
              strokeWidth="4"
              fill="none"
              strokeLinecap="round"
            />
          ) : (
            // Idle Gentle Smile
            <path
              d="M108 118 Q120 128 132 118"
              stroke="#38BDF8"
              strokeWidth="3.5"
              fill="none"
              strokeLinecap="round"
            />
          )}
        </g>

        {/* 7. Robot Torso & SkillBridge Badge */}
        <g id="body">
          {/* Neck */}
          <rect x="110" y="160" width="20" height="10" rx="3" fill="#64748B" />

          {/* Shoulders / Torso */}
          <path
            d="M72 170 C72 170 82 170 120 170 C158 170 168 170 168 170 C182 170 190 182 190 200 L190 230 C190 240 182 248 172 248 L68 248 C58 248 50 240 50 230 L50 200 C50 182 58 170 72 170 Z"
            fill="url(#robotHeadGrad)"
            stroke="#475569"
            strokeWidth="3"
          />

          {/* Chest Center Badge - SkillBridge Golden Medallion */}
          <circle cx="120" cy="204" r="16" fill="#F59E0B" stroke="#FDE68A" strokeWidth="2" />
          <path
            d="M114 204 L118 208 L127 198"
            stroke="#FFFFFF"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />

          {/* Arm Joints */}
          <circle cx="48" cy="200" r="8" fill="#94A3B8" />
          <circle cx="192" cy="200" r="8" fill="#94A3B8" />
        </g>
      </svg>

      {/* Floating State Badge Below Avatar */}
      <div className="mt-2 flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md border transition-all duration-300">
        {state === 'speaking' && (
          <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 border-amber-200">
            <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            {language === 'pa' ? 'ਬੋਲ ਰਿਹਾ ਹਾਂ...' : language === 'hi' ? 'बोल रहा हूँ...' : 'Speaking...'}
          </span>
        )}
        {state === 'listening' && (
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            {language === 'pa' ? 'ਸੁਣ ਰਿਹਾ ਹਾਂ... ਤੁਸੀਂ ਬੋਲੋ' : language === 'hi' ? 'सुन रहा हूँ... आप बोलिए' : 'Listening... speak now'}
          </span>
        )}
        {state === 'processing' && (
          <span className="flex items-center gap-1.5 text-indigo-700 bg-indigo-50 border-indigo-200">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-spin" />
            {language === 'pa' ? 'ਸਮਝ ਰਿਹਾ ਹਾਂ...' : language === 'hi' ? 'समझ रहा हूँ...' : 'Understanding...'}
          </span>
        )}
        {state === 'idle' && (
          <span className="flex items-center gap-1.5 text-gray-600 bg-gray-50 border-gray-200">
            <span className="h-2 w-2 rounded-full bg-gray-400" />
            {language === 'pa' ? 'ਤਿਆਰ ਹਾਂ' : language === 'hi' ? 'तैयाਰ हूँ' : 'Ready'}
          </span>
        )}
        {state === 'success' && (
          <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {language === 'pa' ? 'ਦਰਜ ਹੋ ਗਿਆ!' : language === 'hi' ? 'दर्ज हो गया!' : 'Recorded!'}
          </span>
        )}
      </div>
    </div>
  )
}

export default RobotAvatar

