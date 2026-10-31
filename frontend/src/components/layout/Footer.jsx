import { Heart, ShieldCheck, Sparkles, CreditCard, Award } from 'lucide-react'
import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <footer className="border-t border-border/80 bg-primary text-white">
      {/* Trust & Guarantee Banner */}
      <div className="border-b border-white/10 bg-black/15 px-5 py-6 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 text-xs font-semibold text-white/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-secondary" />
            <span>Verified Artisan Directory & Authentic Craftsmanship</span>
          </div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-accent" />
            <span>Direct Fair-Wage Escrow Settlements via Razorpay</span>
          </div>
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-secondary" />
            <span>Empowering Women & Rural Artisans Across India</span>
          </div>
        </div>
      </div>

      <div className="px-5 py-14 sm:px-8 sm:py-18">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-12 lg:gap-14">
          {/* Brand info (col-span-5) */}
          <div className="lg:col-span-5 space-y-4">
            <Link
              className="inline-flex items-center gap-2.5 font-serif text-2xl font-bold tracking-tight text-white hover:opacity-90"
              to="/"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-secondary">
                <Sparkles className="h-5 w-5" />
              </span>
              <span>SkillBridge</span>
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-white/75">
              Connecting rural craftspeople, conscious patrons, training masters, and ethical enterprises — preserving cultural heritage while creating sustainable, dignified livelihoods.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-white/90">
                <span className="h-2 w-2 rounded-full bg-success animate-pulse" />
                Live Network Active
              </span>
            </div>
          </div>

          {/* Quick Links (col-span-7) */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 lg:col-span-7">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-secondary">Marketplace</p>
              <ul className="mt-4 space-y-2.5 text-xs text-white/75">
                <li>
                  <Link className="transition hover:text-white" to="/marketplace">
                    All Handmade Crafts
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-white" to="/artisans">
                    Meet the Artisans
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-white" to="/story-of-art">
                    The Story of Art
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-white" to="/marketplace/orders">
                    Customer Orders
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-secondary">Ecosystem</p>
              <ul className="mt-4 space-y-2.5 text-xs text-white/75">
                <li>
                  <Link className="transition hover:text-white" to="/artisan/auth">
                    Artisan Workshop & Voice AI
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-white" to="/industry/auth">
                    Industry Partner Sourcing
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-white" to="/expert/auth">
                    Training Expert Studio
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-white" to="/about-us">
                    Our Mission & Values
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-secondary">Platform</p>
              <ul className="mt-4 space-y-2.5 text-xs text-white/75">
                <li>
                  <Link className="transition hover:text-white" to="/#fair-opportunities">
                    Fair-Wage Escrow
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-white" to="/#how-it-works">
                    Video Learning Modules
                  </Link>
                </li>
                <li>
                  <Link className="transition hover:text-white" to="/#roles">
                    Four-Way Participation
                  </Link>
                </li>
                <li>
                  <span className="inline-flex items-center gap-1 text-white/50 text-[0.68rem]">
                    Secured by Razorpay API
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mx-auto mt-12 flex max-w-7xl flex-col items-center justify-between gap-4 border-t border-white/15 pt-6 text-xs text-white/60 sm:flex-row">
          <p>
            © {new Date().getFullYear()} SkillBridge. All rights reserved. Handcrafted with passion in India.
          </p>
          <div className="flex items-center gap-1.5 text-white/75">
            <span>Preserving Indian Cultural Art with</span>
            <Heart className="h-3.5 w-3.5 fill-red-400 text-red-400" />
            <span>and Fair Commerce</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
