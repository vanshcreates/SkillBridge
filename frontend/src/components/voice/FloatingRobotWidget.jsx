import { useEffect, useState } from 'react'
import { Bot, Sparkles } from 'lucide-react'
import ArtisanVoiceAssistantDrawer from './ArtisanVoiceAssistantDrawer'

const FloatingRobotWidget = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-voice-assistant', handleOpen)
    return () => window.removeEventListener('open-voice-assistant', handleOpen)
  }, [])

  if (!user || user.accountType !== 'artisan') {
    return null
  }

  return (
    <>
      {/* Floating launcher button in bottom-right corner */}
      <aside
        aria-label="SkillBridge AI Assistant"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2"
      >
        <button
          aria-label="Open SkillBridge AI Voice Assistant"
          className="group relative flex items-center gap-2.5 rounded-full bg-gradient-to-r from-primary to-primary-hover py-2.5 pl-3.5 pr-4 text-white shadow-xl ring-4 ring-secondary/20 transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary cursor-pointer"
          onClick={() => setIsOpen(true)}
          type="button"
        >
          {/* Animated Glowing Ring */}
          <span className="absolute -inset-1 rounded-full bg-secondary/30 blur-xs animate-pulse -z-10" />

          {/* Mini Cute Robot Icon with Antenna Pulse */}
          <span className="relative flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white">
            <Bot className="h-5 w-5 transition-transform group-hover:rotate-6" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-primary animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-primary" />
          </span>

          {/* Label Pill */}
          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-secondary">
              <Sparkles className="h-2.5 w-2.5" />
              <span>Voice AI</span>
            </div>
            <p className="text-xs font-bold leading-tight">AI Assistant</p>
          </div>
        </button>
      </aside>

      {/* Slide-over Conversation Drawer */}
      <ArtisanVoiceAssistantDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        user={user}
      />
    </>
  )
}

export default FloatingRobotWidget
