import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Bot, MessageCircle, Sparkles, X } from 'lucide-react'
import ArtisanVoiceAssistantDrawer from './ArtisanVoiceAssistantDrawer'
import { useAuthDialog } from '../../hooks/useAuthDialog'

const FloatingRobotWidget = ({ user: propUser }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showBubble, setShowBubble] = useState(true)
  const { currentUser } = useAuthDialog()
  const location = useLocation()

  const activeUser = propUser || currentUser
  const pathname = location?.pathname || ''

  // Listen to global open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-voice-assistant', handleOpen)
    return () => window.removeEventListener('open-voice-assistant', handleOpen)
  }, [])

  // Auto-dismiss the greeting speech bubble after 12 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBubble(false)
    }, 12000)
    return () => clearTimeout(timer)
  }, [pathname])

  // Context-aware speech bubble copy
  const mascotGreeting = useMemo(() => {
    if (activeUser?.accountType === 'artisan') {
      return {
        title: 'Artisan Assistant',
        subtitle: 'Orders · Products · Earnings',
        punjabi: 'ਬੋਲ ਕੇ ਆਰਡਰ ਤੇ ਉਤਪਾਦ ਸੰਭਾਲੋ',
      }
    }
    if (pathname.includes('/artisan/auth')) {
      return {
        title: 'Artisan Onboarding',
        subtitle: 'Speak to Register / Login',
        punjabi: 'ਬੋਲ ਕੇ ਰਜਿਸਟਰ ਕਰੋ ਜਾਂ ਲੌਗਇਨ',
      }
    }
    if (pathname.includes('/expert/auth')) {
      return {
        title: 'Expert Assistant',
        subtitle: 'Craft Master Onboarding & Courses',
        punjabi: 'ਮਾਹਿਰ ਸਹਾਇਕ ਨਾਲ ਜੁੜੋ',
      }
    }
    if (pathname.includes('/industry/auth')) {
      return {
        title: 'Industry Partner',
        subtitle: 'Direct Enterprise Artisan Contracts',
        punjabi: 'ਉਦਯੋਗਿਕ ਪ੍ਰੋਜੈਕਟ ਸਹਾਇਕ',
      }
    }
    return {
      title: 'SkillBridge Assistant',
      subtitle: 'Ask anything or talk by voice',
      punjabi: 'ਮੈਂ ਤੁਹਾਡੀ ਹਰ ਕੰਮ ਵਿੱਚ ਮਦਦ ਕਰਾਂਗਾ',
    }
  }, [activeUser, pathname])

  return (
    <>
      {/* Floating launcher button at bottom-right corner of viewport */}
      <aside
        aria-label="SkillBridge AI Assistant Mascot"
        className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2.5 pointer-events-auto"
      >
        {/* Animated Contextual Speech Bubble / Mascot Callout */}
        {showBubble && !isOpen && (
          <div className="relative max-w-xs animate-bounce-subtle rounded-2xl border border-secondary/40 bg-surface/95 px-3.5 py-2.5 shadow-2xl backdrop-blur-md">
            <button
              aria-label="Dismiss message"
              className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-surface-muted text-text-muted hover:text-text-main shadow-xs text-[10px]"
              onClick={(e) => {
                e.stopPropagation()
                setShowBubble(false)
              }}
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
            <div
              className="cursor-pointer"
              onClick={() => setIsOpen(true)}
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-secondary">
                <Sparkles className="h-3 w-3 text-secondary animate-spin-slow" />
                <span>{mascotGreeting.title}</span>
              </div>
              <p className="mt-0.5 text-xs font-semibold text-text-main">
                {mascotGreeting.subtitle}
              </p>
              <p className="mt-0.5 text-[0.7rem] text-primary font-medium">
                {mascotGreeting.punjabi}
              </p>
            </div>
            {/* Little speech tail pointing down */}
            <div className="absolute -bottom-2 right-6 h-0 w-0 border-x-8 border-x-transparent border-t-8 border-t-surface/95" />
          </div>
        )}

        {/* Mascot Robot Button */}
        <button
          aria-label="Open SkillBridge AI Voice Assistant"
          className="group relative flex items-center gap-3 rounded-full bg-gradient-to-r from-primary via-primary-hover to-secondary py-2.5 pl-3.5 pr-4 text-white shadow-2xl ring-4 ring-secondary/20 transition-all duration-300 hover:scale-105 hover:shadow-primary/30 active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary cursor-pointer"
          onClick={() => {
            setIsOpen(true)
            setShowBubble(false)
          }}
          type="button"
        >
          {/* Animated Ambient Pulsing Aura */}
          <span className="absolute -inset-1 rounded-full bg-gradient-to-r from-secondary/40 to-accent/30 blur-sm animate-pulse -z-10" />

          {/* Mini Robot Avatar with Glowing Antenna */}
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/20 text-white shadow-inner">
            <Bot className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12 group-hover:scale-110" />
            {/* Pulsing Green Live Online Indicator on Antenna */}
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-primary animate-ping" />
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border-2 border-primary" />
          </span>

          {/* Mascot Info Badge */}
          <div className="text-left hidden sm:block">
            <div className="flex items-center gap-1 text-[0.62rem] font-bold uppercase tracking-wider text-accent-light">
              <MessageCircle className="h-2.5 w-2.5" />
              <span>Voice Mascot</span>
            </div>
            <p className="text-xs font-bold leading-tight text-white flex items-center gap-1">
              <span>SkillBridge AI</span>
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            </p>
          </div>
        </button>
      </aside>

      {/* Slide-over Conversation Drawer */}
      <ArtisanVoiceAssistantDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        user={activeUser}
      />
    </>
  )
}

export default FloatingRobotWidget
