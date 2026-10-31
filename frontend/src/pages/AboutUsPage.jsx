import { createElement } from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  CheckCircle2,
  HandHeart,
  Handshake,
  ShieldCheck,
  ShoppingBasket,
  Sparkles,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'

const community = [
  {
    icon: BriefcaseBusiness,
    title: 'Artisans',
    badge: 'Makers',
    description:
      'Share handmade crafts, build a digital workshop, voice-register in native languages, and receive direct fair-wage payouts.',
  },
  {
    icon: ShoppingBasket,
    title: 'Conscious Patrons',
    badge: 'Collectors',
    description:
      'Discover authentic cultural artifacts with verified provenance, fair pricing, and secure online checkout via Razorpay.',
  },
  {
    icon: BookOpenCheck,
    title: 'Training Mentors',
    badge: 'Masters',
    description:
      'Publish video courses, share craft masterclasses, and pass invaluable generational techniques to new artisans.',
  },
  {
    icon: Handshake,
    title: 'Industry Partners',
    badge: 'Enterprises',
    description:
      'Connect with master artisan clusters for bulk production briefs, milestone tracking, and verified escrow payments.',
  },
]

const values = [
  {
    title: 'People Before Products',
    description:
      'Every handmade piece represents a human artisan, years of dedicated practice, and an invaluable cultural story worth sustaining.',
  },
  {
    title: 'Skills Deserve Transparent Value',
    description:
      'We eliminate predatory middlemen so artisans receive fair wages, prompt milestone settlements, and dignified business recognition.',
  },
  {
    title: 'A Flourishing Craft Ecosystem',
    description:
      'By connecting artisans with modern industry briefs, practical video education, and global patrons, heritage crafts continuously thrive.',
  },
]

const AboutUsPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      {/* Brand Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-[#432310] px-5 py-20 text-white sm:px-8 sm:py-32">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10 blur-2xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border border-white/10 blur-3xl" />
        
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Our Mission & Vision</span>
          </div>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">
            Empowering Artisans Through Ethical Technology & Unified Commerce.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-xl">
            SkillBridge connects traditional Indian artisans, conscious consumers, master craft educators, and ethical industry brands into one dignified, transparent ecosystem.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 font-bold text-primary shadow-lg transition-all duration-200 hover:bg-background hover:scale-105"
              to="/artisans"
            >
              <span>Explore Artisan Directory</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              to="/marketplace"
            >
              <span>Visit Marketplace</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Purpose Section */}
      <section
        aria-labelledby="about-purpose-heading"
        className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-24 md:grid-cols-[0.8fr_1.2fr] md:gap-16"
      >
        <div className="flex flex-col items-start">
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-primary/10 text-primary shadow-inner">
            <HandHeart aria-hidden="true" className="h-8 w-8" />
          </div>
          <p className="mt-6 text-xs font-bold uppercase tracking-wider text-secondary">Why We Exist</p>
          <h2
            className="mt-2 font-serif text-3xl font-bold leading-tight text-text-main sm:text-4xl"
            id="about-purpose-heading"
          >
            Preserving Heritage While Fueling Dignified Livelihoods.
          </h2>
        </div>
        <div className="space-y-4 text-base leading-relaxed text-text-secondary sm:text-lg">
          <p>
            Across rural India, millions of master artisans practice extraordinary art forms handed down through generations. Yet fragmented supply chains, lack of digital access, and intermediary markups have historically undervalued their labor.
          </p>
          <p>
            SkillBridge solves this with an inclusive full-stack platform: multilingual voice AI registration for rural artisans, video masterclasses for skill advancement, and seamless industry order placement with instant Razorpay fair-wage settlement upon project completion.
          </p>
        </div>
      </section>

      {/* 4 Pillars of Community */}
      <section className="border-t border-border/80 bg-surface/50 px-5 py-16 sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-bold uppercase tracking-wider text-secondary">Our Ecosystem</p>
            <h2 className="mt-2 font-serif text-3xl font-bold text-text-main sm:text-4xl">
              Four Pillars of SkillBridge
            </h2>
            <p className="mt-3 text-sm text-text-secondary">
              A balanced ecosystem where every stakeholder contributes to craft preservation and mutual prosperity.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {community.map(({ icon: Icon, title, badge, description }) => (
              <div
                className="group rounded-3xl border border-border/80 bg-surface p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40 hover:shadow-card-hover"
                key={title}
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                    {createElement(Icon, {
                      'aria-hidden': true,
                      className: 'h-6 w-6',
                    })}
                  </span>
                  <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[0.65rem] font-bold text-secondary">
                    {badge}
                  </span>
                </div>
                <h3 className="mt-5 font-serif text-lg font-bold text-text-main group-hover:text-primary transition-colors">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-text-secondary">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">Core Values</p>
          <h2 className="mt-2 font-serif text-3xl font-bold text-text-main sm:text-4xl">
            What Drives Everything We Build
          </h2>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {values.map(({ title, description }) => (
            <div
              className="rounded-3xl border border-border/80 bg-surface p-7 shadow-card"
              key={title}
            >
              <div className="flex items-center gap-2 text-secondary font-bold text-xs uppercase tracking-wider">
                <CheckCircle2 className="h-4 w-4" />
                <span>Value Pillar</span>
              </div>
              <h3 className="mt-3 font-serif text-xl font-bold text-text-main">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
    <Footer />
  </div>
)

export default AboutUsPage
