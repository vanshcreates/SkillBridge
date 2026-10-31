import { createElement } from 'react'
import { ArrowRight, Flower2, HandHeart, Sparkles, HeartHandshake } from 'lucide-react'
import { Link } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'
import content from '../data/local-storage.json'

const stories = [
  {
    icon: Flower2,
    eyebrow: 'Knowledge in Every Detail',
    title: 'A craft is far more than its finished form.',
    description:
      'A stitch, a weave, or a carefully shaped object reflects generational practice built over decades. The hands that make it carry ancient techniques learned, adapted, and passed down across families.',
  },
  {
    icon: HandHeart,
    eyebrow: 'Made by People, For People',
    title: 'Every handmade piece has an authentic human maker.',
    description:
      'Behind each piece is a person making thoughtful choices about materials, natural dyes, geometry, and utility. Knowing who made something transforms an everyday object into a living heirloom.',
  },
  {
    icon: Sparkles,
    eyebrow: 'Tradition with Room to Grow',
    title: 'Living traditions continuously evolve with modern purpose.',
    description:
      'Artisans build upon centuries of heritage while adopting new digital tools, direct ethical market access, and collaborative briefs with conscious patrons worldwide.',
  },
]

const StoryOfArtPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      {/* Editorial Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary via-primary-hover to-[#432310] px-5 py-20 text-white sm:px-8 sm:py-32">
        <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full border border-white/10 blur-2xl" />
        <div className="absolute -bottom-40 -left-20 h-96 w-96 rounded-full border border-white/10 blur-3xl" />
        
        <div className="relative z-10 mx-auto max-w-7xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white/90 backdrop-blur-xs">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Skill · Memory · Imagination</span>
          </div>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl font-bold leading-tight sm:text-6xl lg:text-7xl">
            The Story of Art is the Story of the Hands Behind It.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/80 sm:text-xl">
            Handmade craft unites centuries of indigenous knowledge, patient dedication, and soulful creativity.
            SkillBridge celebrates the makers and practices that make every piece truly one of a kind.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link
              className="inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 font-bold text-primary shadow-lg transition-all duration-200 hover:bg-background hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              to="/artisans"
            >
              <span>Meet the Artisans</span>
              <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
            <Link
              className="inline-flex min-h-12 items-center gap-2 rounded-xl border border-white/30 bg-white/10 px-6 font-semibold text-white backdrop-blur-sm transition-all hover:bg-white/20"
              to="/marketplace"
            >
              <span>Browse Crafted Works</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Stories Section */}
      <section
        aria-labelledby="story-heading"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-24"
      >
        <div className="max-w-3xl border-l-4 border-secondary pl-6">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary">Stories in Every Craft</p>
          <h2
            className="mt-2 font-serif text-3xl font-bold text-text-main sm:text-4xl lg:text-5xl"
            id="story-heading"
          >
            Art Carries Generational Knowledge Forward.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-text-secondary sm:text-lg">
            From {content.skills[0].title.toLowerCase()} to{' '}
            {content.skills[1].title.toLowerCase()}, each practice embodies distinct
            materials, organic techniques, and cultural symbolism. The story is never solely about the
            object — it is about the resilient community that breathes life into it.
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {stories.map(({ icon: Icon, eyebrow, title, description }) => (
            <article
              className="group relative rounded-3xl border border-border/80 bg-surface p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40 hover:shadow-card-hover"
              key={title}
            >
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                {createElement(Icon, {
                  'aria-hidden': true,
                  className: 'h-6 w-6',
                })}
              </span>
              <p className="mt-5 text-xs font-bold uppercase tracking-wider text-secondary">{eyebrow}</p>
              <h3 className="mt-2 font-serif text-xl font-bold text-text-main group-hover:text-primary transition-colors">
                {title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-text-secondary">{description}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="border-y border-border/80 bg-surface/60 px-5 py-16 sm:px-8 backdrop-blur-xs">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-secondary mb-2">
              <HeartHandshake className="h-4 w-4" />
              <span>Cultural Preservation</span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-text-main sm:text-3xl">
              Help Keep These Heritage Stories Alive.
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-text-secondary">
              Discover verified traditional makers, learn their techniques through video courses,
              and support ethical livelihoods with fair, transparent compensation.
            </p>
          </div>
          <Link
            className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-primary to-primary-hover px-6 font-bold text-white shadow-md transition-all duration-200 hover:shadow-lg hover:brightness-105 active:scale-98"
            to="/marketplace"
          >
            <span>Explore Handmade Work</span>
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
    <Footer />
  </div>
)

export default StoryOfArtPage
