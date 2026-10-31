import React from 'react'
import { motion } from 'motion/react'
import {
  ArrowRight,
  Award,
  Building2,
  CheckCircle2,
  Compass,
  Heart,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { Button } from '../ui/Button'

export const Hero = () => {
  return (
    <section
      className="relative min-h-[85vh] w-full overflow-hidden flex items-center justify-center px-4 sm:px-8 md:px-16 lg:px-24 py-16 lg:py-24 section-divider"
      style={{
        '--hero-background':
          "url('https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSN8lvtaOg6W_MGhl6-wyAT-Kq-WA-DJiXHCmlBNP_b0XP90tScMU47F2Q&s=10')",
      }}
    >
      {/* High-end Gradient & Backdrop Overlay */}
      <div className="absolute inset-x-0 top-0 bottom-[50px] z-0 bg-gradient-to-r from-black/25 via-black/70 to-primary/75 backdrop-blur-[2px]" />

      {/* Decorative Floating Ambient Orbs */}
      <div className="pointer-events-none absolute -left-20 top-1/4 h-80 w-80 rounded-full bg-accent/20 blur-3xl animate-float" />
      <div className="pointer-events-none absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-secondary/30 blur-3xl animate-pulse-subtle" />

      {/* Main Content Container */}
      <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-12 lg:flex-row">
        {/* Left Column: Story, Headline & Actions */}
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="w-full text-center lg:w-3/5 lg:text-left space-y-6"
          initial={{ opacity: 0, y: 24 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          {/* Shimmering Trust Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-accent/40 bg-white/10 px-4 py-1.5 backdrop-blur-md shadow-xs">
            <Sparkles className="h-4 w-4 text-accent" />
            <span className="text-xs font-semibold tracking-wide text-accent-light uppercase">
              Ethical Handmade Marketplace & Industry Hub
            </span>
          </div>

          {/* Impact Headline */}
          <h1 className="font-serif text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.15]">
            Your Skills Have Value. <br />
            <span className="gradient-gold font-serif italic">
              Let’s Bridge the Gap.
            </span>
          </h1>

          <p className="max-w-2xl text-base sm:text-lg font-sans text-white/85 leading-relaxed">
            Turn generational craft into scalable opportunities. Direct artisan marketplace,
            fair-wage enterprise production contracts, and verified skill certifications — all in one unified ecosystem.
          </p>

          {/* Value Pillars Pills */}
          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs sm:text-sm font-medium text-white/90">
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-xs">
              <ShieldCheck className="h-4 w-4 text-accent" />
              Fair Wage Verified
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-xs">
              <Building2 className="h-4 w-4 text-accent" />
              Industry Direct Orders
            </span>
            <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 backdrop-blur-xs">
              <Heart className="h-4 w-4 text-accent" />
              100% Authentic Handcraft
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 justify-center lg:justify-start pt-3">
            <Button
              className="text-base px-7 py-3.5 shadow-md transition-transform hover:-translate-y-0.5"
              href="/marketplace"
              size="lg"
              variant="primary"
            >
              <Compass className="h-5 w-5" />
              <span>Explore Marketplace</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              className="text-base px-6 py-3.5 border border-white/30 bg-white/10 text-white hover:bg-white hover:text-primary transition-all"
              href="#how-it-works"
              size="lg"
              variant="outline"
            >
              Learn How It Works
            </Button>
          </div>
        </motion.div>

        {/* Right Column: High-end Frosted SaaS Impact Showcase Card */}
        <motion.div
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md lg:w-2/5"
          initial={{ opacity: 0, scale: 0.94 }}
          transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
        >
          <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-white/10 p-6 sm:p-8 backdrop-blur-xl shadow-2xl">
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-accent/20 blur-xl pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/15 pb-4">
              <span className="text-xs font-semibold uppercase tracking-wider text-accent-light">
                Platform Impact
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-success/20 border border-success/30 px-2.5 py-0.5 text-xs font-semibold text-green-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Live on Mainnet
              </span>
            </div>

            <h2 className="mt-4 font-serif text-2xl font-bold text-white">
              Made with Heritage. Connected with Global Demand.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/80">
              SkillBridge unites artisans, discerning consumers, and ethical industries to honor traditional techniques with modern compensation.
            </p>

            {/* Quick Stats Grid */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs">
                <p className="text-xs font-medium text-white/70">Master Makers</p>
                <p className="mt-1 font-serif text-2xl font-bold text-accent">1,250+</p>
                <p className="mt-0.5 text-[11px] text-white/60">Verified across 18 states</p>
              </div>
              <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-xs">
                <p className="text-xs font-medium text-white/70">Fair Wages Paid</p>
                <p className="mt-1 font-serif text-2xl font-bold text-green-300">₹45.8L+</p>
                <p className="mt-0.5 text-[11px] text-white/60">100% direct settlement</p>
              </div>
            </div>

            <div className="mt-5 rounded-xl border border-accent/30 bg-accent/10 p-3.5 text-xs text-white/90 flex items-center gap-3">
              <Award className="h-5 w-5 text-accent shrink-0" />
              <span>
                Equipped with instant <strong>Razorpay Test Checkout</strong> & automated completion settlement.
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
