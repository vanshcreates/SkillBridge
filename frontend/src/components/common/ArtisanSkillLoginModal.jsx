import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  ArrowRight,
  Bot,
  CheckCircle2,
  GraduationCap,
  LogIn,
  Sparkles,
  X,
} from 'lucide-react'

const ArtisanSkillLoginModal = ({ isOpen, onClose, currentUser }) => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen || typeof document === 'undefined') return null

  const handleLoginClick = () => {
    onClose?.()
    navigate('/artisan/auth?mode=login')
  }

  const handleSignupClick = () => {
    onClose?.()
    navigate('/artisan/auth?mode=signup')
  }

  const isOtherRole = currentUser && currentUser.accountType !== 'artisan'

  const modalContent = (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[9999] overflow-y-auto bg-black/60 backdrop-blur-sm p-4 sm:px-6 animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
    >
      <div className="flex min-h-full items-start justify-center pt-[8vh] pb-12 text-center">
        <div
          className="relative w-full max-w-lg text-left overflow-y-auto max-h-[84vh] rounded-3xl border border-secondary/20 bg-surface p-6 sm:p-8 shadow-2xl transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative background glow */}
          <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-secondary/15 blur-2xl pointer-events-none" />
          <div className="absolute -left-16 -bottom-16 h-48 w-48 rounded-full bg-primary/10 blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            aria-label="Close modal"
            className="absolute right-4 top-4 z-20 rounded-xl p-2 text-text-muted hover:bg-surface-muted hover:text-text-main transition cursor-pointer"
            onClick={onClose}
            type="button"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Header with Avatar / Badge */}
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white shadow-md shadow-primary/20">
                <GraduationCap className="h-6 w-6 text-secondary" />
              </span>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-secondary/30 bg-secondary/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-secondary">
                  <Sparkles className="h-3 w-3 text-secondary" />
                  Artisan Training Studio
                </span>
                <h3 className="mt-1 font-serif text-xl sm:text-2xl font-bold text-text-main">
                  Log in as an Artisan to Learn Skills
                </h3>
              </div>
            </div>

            <p className="mt-3 text-xs sm:text-sm text-text-secondary leading-relaxed">
              SkillBridge video masterclasses and practical craft tutorials are exclusively designed to empower registered artisans. Log in or create your free artisan account to learn new techniques and grow your craft livelihood.
            </p>

            {/* Benefits List */}
            <div className="mt-4 space-y-2 rounded-2xl border border-border/80 bg-surface-muted/50 p-4 text-xs">
              <div className="flex items-start gap-2.5 text-text-main">
                <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <span>Step-by-step video lessons taught by certified master craftsmen</span>
              </div>
              <div className="flex items-start gap-2.5 text-text-main">
                <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <span>Traditional techniques in Phulkari, Handloom, Pottery, Embroidery & Woodwork</span>
              </div>
              <div className="flex items-start gap-2.5 text-text-main">
                <CheckCircle2 className="h-4 w-4 text-secondary shrink-0 mt-0.5" />
                <span>Pricing calculators, cost guidance, and industrial bulk order readiness</span>
              </div>
            </div>

            {/* If logged in as another role (customer, industry, expert) */}
            {isOtherRole && (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
                <p className="font-semibold">
                  You are currently signed in as a{' '}
                  <span className="capitalize underline">{currentUser.accountType}</span>.
                </p>
                <p className="mt-0.5 text-amber-800 text-[11px]">
                  Artisan skill learning is restricted to Artisan profiles. Please log in with your artisan credentials to access course videos.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3.5 text-sm font-bold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-hover hover:scale-101 active:scale-99 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary cursor-pointer"
                onClick={handleLoginClick}
                type="button"
              >
                <LogIn className="h-4 w-4 text-secondary" />
                <span>Log in as Artisan</span>
                <ArrowRight className="h-4 w-4 ml-auto" />
              </button>

              <button
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-secondary/40 bg-surface px-5 py-3 text-sm font-semibold text-primary transition-all hover:bg-secondary/10 hover:border-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary cursor-pointer"
                onClick={handleSignupClick}
                type="button"
              >
                <Bot className="h-4 w-4 text-secondary" />
                <span>New Artisan? Register (Voice AI or Form)</span>
              </button>

              <button
                className="mt-1 text-center text-xs font-semibold text-text-muted hover:text-text-main transition cursor-pointer"
                onClick={onClose}
                type="button"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(modalContent, document.body)
}

export default ArtisanSkillLoginModal
