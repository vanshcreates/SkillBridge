const VoiceWaveform = ({ isActive = false, state = 'listening', barCount = 12 }) => {
  const bars = Array.from({ length: barCount })

  // Color classes depending on state
  const colorMap = {
    speaking: 'bg-primary from-primary to-amber-500',
    listening: 'bg-emerald-500 from-emerald-400 to-teal-500',
    processing: 'bg-indigo-500 from-indigo-400 to-purple-500',
    idle: 'bg-gray-300',
  }

  const activeColor = colorMap[state] || colorMap.idle

  return (
    <div
      aria-hidden="true"
      className="flex items-center justify-center gap-1.5 h-12 py-2 px-3"
    >
      {bars.map((_, index) => {
        // Vary baseline heights and animation delays
        const baseHeight = [30, 60, 90, 45, 100, 75, 85, 50, 95, 65, 40, 70][
          index % 12
        ]
        const delay = (index * 0.08).toFixed(2)

        return (
          <span
            key={index}
            className={`w-1.5 rounded-full transition-all duration-200 ${
              isActive
                ? `bg-gradient-to-t ${activeColor} animate-pulse`
                : 'h-2 bg-gray-300 opacity-40'
            }`}
            style={
              isActive
                ? {
                    height: `${Math.max(16, baseHeight * 0.45)}px`,
                    animationDelay: `${delay}s`,
                    animationDuration: state === 'speaking' ? '0.6s' : '0.8s',
                  }
                : { height: '8px' }
            }
          />
        )
      })}
    </div>
  )
}

export default VoiceWaveform

