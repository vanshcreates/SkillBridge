import { Building2, LogOut, ShieldCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import ProfileImageControl from '../profile/ProfileImageControl'
import { useAuthDialog } from '../../hooks/useAuthDialog'
import { usePreventBack } from '../../hooks/usePreventBack'

const IndustryLayout = ({ children }) => {
  const { currentUser, logout } = useAuthDialog()

  // Prevent browser back button from navigating out of the industry workspace
  usePreventBack(Boolean(currentUser && currentUser.accountType === 'industry'))

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/80 bg-surface/90 backdrop-blur-md transition-all">
        <div className="flex min-h-18 w-full items-center justify-between gap-4 px-4 sm:px-8 lg:px-12 py-2.5">
          <Link
            aria-label="SkillBridge industry workspace"
            className="group inline-flex min-w-0 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            to={currentUser?.accountType === 'industry' ? '/industry/dashboard' : '/industry/auth'}
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-hover text-white shadow-xs transition-transform group-hover:scale-105">
              <Building2 aria-hidden="true" className="h-5 w-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-serif text-xl font-bold tracking-tight text-text-main group-hover:text-primary transition-colors">
                SkillBridge
              </span>
              <span className="inline-flex items-center gap-1 text-[0.65rem] font-bold uppercase tracking-wider text-secondary">
                <span className="h-1.5 w-1.5 rounded-full bg-secondary animate-pulse" />
                Industry Workspace
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            {currentUser?.accountType === 'industry' && (
              <>
                <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-surface-muted/50 p-1.5 pr-4 backdrop-blur-xs">
                  <ProfileImageControl user={currentUser} size="small" />
                  <div className="hidden text-left sm:block">
                    <p className="max-w-40 truncate text-xs font-bold text-text-main">
                      {currentUser.name}
                    </p>
                    <p className="text-[0.68rem] text-secondary font-medium">Verified Partner</p>
                  </div>
                </div>

                <button
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-xl border border-border/80 bg-surface px-3 py-1.5 text-xs font-semibold text-text-secondary transition hover:border-error/40 hover:bg-red-50/50 hover:text-error focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary cursor-pointer"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut aria-hidden="true" className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </>
            )}
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}

export default IndustryLayout
