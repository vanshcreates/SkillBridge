import { createElement } from 'react'
import { ArrowRight, Flower2, HandHeart, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import content from '../data/local-storage.json'

const stories = [
  {
    icon: Flower2,
    eyebrow: 'Knowledge in every detail',
    title: 'A craft is more than its finished form.',
    description:
      'A stitch, a weave, or a carefully shaped object reflects practice built over time. The hands that make it carry techniques learned, adapted, and passed along.',
  },
  {
    icon: HandHeart,
    eyebrow: 'Made by people, for people',
    title: 'Every handmade piece has a maker.',
    description:
      'Behind each piece is a person making thoughtful choices about materials, colour, shape, and use. Knowing who made something can make the work feel closer and more meaningful.',
  },
  {
    icon: Sparkles,
    eyebrow: 'Tradition with room to grow',
    title: 'Living traditions keep evolving.',
    description:
      'Artisans build on what they know while finding new ways to make, teach, collaborate, and reach people who value their work.',
  },
]

const StoryOfArtPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <section className="bg-primary px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
            Skill, memory, imagination
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl font-semibold leading-tight sm:text-6xl">
            The story of art is the story of the hands behind it.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
            Handmade work brings together knowledge, patience, and creativity.
            SkillBridge celebrates the people and practices that make every
            piece one of a kind.
          </p>
          <Link
            className="mt-8 inline-flex min-h-11 items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-primary transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            to="/artisans"
          >
            Meet the artisans
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section
        aria-labelledby="story-heading"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-secondary">Stories in every craft</p>
          <h2
            className="mt-2 font-serif text-3xl font-semibold text-text-main sm:text-4xl"
            id="story-heading"
          >
            Art carries knowledge forward.
          </h2>
          <p className="mt-4 text-lg leading-8 text-text-secondary">
            From {content.skills[0].title.toLowerCase()} to{' '}
            {content.skills[1].title.toLowerCase()}, each practice has its own
            materials, methods, and meaning. The story is never only about the
            object; it is also about the maker and the community around the work.
          </p>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {stories.map(({ icon: Icon, eyebrow, title, description }) => (
            <article
              className="rounded-2xl border border-border bg-surface p-6 shadow-card sm:p-7"
              key={title}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-secondary">
                {createElement(Icon, {
                  'aria-hidden': true,
                  className: 'h-6 w-6',
                })}
              </span>
              <p className="mt-5 text-sm font-semibold text-secondary">{eyebrow}</p>
              <h3 className="mt-2 font-serif text-xl font-semibold text-text-main">
                {title}
              </h3>
              <p className="mt-3 leading-7 text-text-secondary">{description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-border bg-surface px-5 py-14 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-text-main">
              Help keep these stories moving.
            </h2>
            <p className="mt-2 max-w-2xl leading-7 text-text-secondary">
              Discover the makers, learn about their craft, and support work
              made with care.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            to="/marketplace"
          >
            Explore handmade work
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
    <Footer />
  </div>
)

export default StoryOfArtPage
