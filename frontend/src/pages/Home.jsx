import React from 'react'
import Navbar from '../components/layout/Navbar'
import Hero from '../components/layout/Hero'
import Footer from '../components/layout/Footer'
import { ArrowRight, BookOpenText, UsersRound } from 'lucide-react'
import { Link } from 'react-router-dom'
import {
  FairOpportunitiesSection,
  FinalCtaSection,
  HowItWorksSection,
  MissionSection,
  RolesSection,
  SkillsSection,
} from '../components/home/HomeSections'

const Home = () => {
  return (
    <>
        <Navbar />
      <main>
        <Hero />
        <section
          aria-label="Discover artisans and their stories"
          className="bg-background px-5 py-16 sm:px-8 lg:py-20"
        >
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2">
            <Link
              className="group rounded-2xl border border-border bg-surface p-7 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 sm:p-9"
              to="/artisans"
            >
              <UsersRound aria-hidden="true" className="h-8 w-8 text-secondary" />
              <h2 className="mt-5 font-serif text-2xl font-semibold text-text-main">
                Find an artisan
              </h2>
              <p className="mt-3 leading-7 text-text-secondary">
                Meet the people behind the craft and explore work made by hand.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 font-semibold text-primary">
                Meet the makers
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
            <Link
              className="group rounded-2xl border border-border bg-surface p-7 shadow-card transition hover:-translate-y-1 hover:shadow-card-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2 sm:p-9"
              to="/story-of-art"
            >
              <BookOpenText aria-hidden="true" className="h-8 w-8 text-secondary" />
              <h2 className="mt-5 font-serif text-2xl font-semibold text-text-main">
                The story of art
              </h2>
              <p className="mt-3 leading-7 text-text-secondary">
                Discover the skills, traditions, and care carried in handmade work.
              </p>
              <span className="mt-5 inline-flex items-center gap-2 font-semibold text-primary">
                Read the story
                <ArrowRight aria-hidden="true" className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </div>
        </section>
        <RolesSection />
        <SkillsSection />
        <HowItWorksSection />
        <FairOpportunitiesSection />
        <MissionSection />
        <FinalCtaSection />
      </main>
      <Footer />
    </>
  )
}

export default Home