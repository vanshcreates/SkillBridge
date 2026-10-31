import { Building2, LogOut, Store } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthDialog } from '../../hooks/useAuthDialog'

const IndustryLayout = ({ children }) => {
  const { currentUser, logout } = useAuthDialog()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/industry/auth', { replace: true })
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface">
        <div className="flex min-h-20 w-full items-center justify-between gap-4 px-4 sm:px-8 lg:px-12">
          <Link
            aria-label="SkillBridge industry workspace"
            className="inline-flex min-w-0 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
            to={currentUser?.accountType === 'industry' ? '/industry/dashboard' : '/industry/auth'}
          >
            <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-white">
              <Building2 aria-hidden="true" className="h-6 w-6" />
            </span>
            <span className="min-w-0">
              <span className="block truncate font-serif text-xl font-semibold text-text-main">
                SkillBridge
              </span>
              <span className="block text-[0.68rem] font-bold uppercase tracking-[0.16em] text-secondary">
                Industry partner
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">
            {currentUser?.accountType === 'industry' && (
              <>
                <div className="hidden text-right sm:block">
                  <p className="max-w-40 truncate text-sm font-semibold text-text-main">
                    {currentUser.name}
                  </p>
                  <p className="text-xs text-text-muted">Industry account</p>
                </div>
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-text-secondary transition hover:border-border-strong hover:bg-background hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary"
                  onClick={handleLogout}
                  type="button"
                >
                  <LogOut aria-hidden="true" className="h-4 w-4" />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              </>
            )}
            <Link
              className="inline-flex min-h-10 items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 sm:px-4"
              to="/marketplace"
            >
              <Store aria-hidden="true" className="h-4 w-4" />
              <span className="hidden sm:inline">Marketplace</span>
            </Link>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}

export default IndustryLayout
