import { createElement } from 'react'
import {
  ArrowRight,
  BookOpenCheck,
  BriefcaseBusiness,
  HandHeart,
  Handshake,
  ShoppingBasket,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import Footer from '../components/layout/Footer'
import Navbar from '../components/layout/Navbar'

const community = [
  {
    icon: BriefcaseBusiness,
    title: 'Artisans',
    description:
      'Share handmade work, build a shop, and keep growing your craft and business.',
  },
  {
    icon: ShoppingBasket,
    title: 'Customers',
    description:
      'Discover makers and handmade pieces, and learn about the people behind the work.',
  },
  {
    icon: BookOpenCheck,
    title: 'Training experts',
    description:
      'Create practical courses and pass useful skills on to the next generation of makers.',
  },
  {
    icon: Handshake,
    title: 'Industry partners',
    description:
      'Connect with artisans and explore larger briefs and collaborations.',
  },
]

const values = [
  {
    title: 'People before products',
    description:
      'Every handmade piece represents a person, a practice, and time spent learning and making.',
  },
  {
    title: 'Skills deserve to be seen',
    description:
      'We want makers to have more ways to share what they know and help others discover their work.',
  },
  {
    title: 'A community that grows together',
    description:
      'Learning, thoughtful partnerships, and meaningful connections can help craft traditions keep evolving.',
  },
]

const AboutUsPage = () => (
  <div className="min-h-screen bg-background">
    <Navbar />
    <main>
      <section className="bg-primary px-5 py-20 text-white sm:px-8 sm:py-28">
        <div className="mx-auto max-w-7xl">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-white/70">
            About SkillBridge
          </p>
          <h1 className="mt-4 max-w-4xl font-serif text-4xl font-semibold leading-tight sm:text-6xl">
            Bringing people together through the skills they share.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">
            SkillBridge is a community platform built around artisans, handmade
            work, learning, and collaboration. We want the people behind each
            craft to be easier to find, learn from, and support.
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
        aria-labelledby="about-purpose-heading"
        className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 md:grid-cols-[0.8fr_1.2fr] md:gap-16"
      >
        <div className="flex items-start">
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-surface-muted text-secondary">
            <HandHeart aria-hidden="true" className="h-7 w-7" />
          </span>
        </div>
        <div>
          <p className="text-sm font-semibold text-secondary">Why we’re here</p>
          <h2
            className="mt-2 font-serif text-3xl font-semibold leading-tight text-text-main sm:text-4xl"
            id="about-purpose-heading"
          >
            There’s a person and a story behind every piece.
          </h2>
          <p className="mt-5 text-lg leading-8 text-text-secondary">
            A stitch, a weave, or a carefully shaped object carries knowledge
            built through practice. SkillBridge brings together spaces to
            discover artisans, explore handmade work, learn practical skills,
            and connect around new opportunities.
          </p>
          <p className="mt-4 leading-7 text-text-secondary">
            We’re building toward a community where creative skills are valued,
            makers can share what they know, and more people can find their way
            into the world of craft.
          </p>
        </div>
      </section>

      <section
        aria-labelledby="about-community-heading"
        className="bg-surface px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-secondary">A place for many people</p>
            <h2
              className="mt-2 font-serif text-3xl font-semibold text-text-main sm:text-4xl"
              id="about-community-heading"
            >
              Craft grows when people connect.
            </h2>
            <p className="mt-4 text-lg leading-8 text-text-secondary">
              SkillBridge is designed to bring different parts of the craft
              community closer together.
            </p>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {community.map(({ icon: Icon, title, description }) => (
              <article
                className="rounded-2xl border border-border bg-card p-6 shadow-card"
                key={title}
              >
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-secondary">
                  {createElement(Icon, {
                    'aria-hidden': true,
                    className: 'h-6 w-6',
                  })}
                </span>
                <h3 className="mt-5 font-serif text-xl font-semibold text-text-main">
                  {title}
                </h3>
                <p className="mt-3 leading-7 text-text-secondary">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section
        aria-labelledby="about-values-heading"
        className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20"
      >
        <div className="max-w-3xl">
          <p className="text-sm font-semibold text-secondary">What guides us</p>
          <h2
            className="mt-2 font-serif text-3xl font-semibold text-text-main sm:text-4xl"
            id="about-values-heading"
          >
            A few things we believe.
          </h2>
        </div>
        <div className="mt-8 divide-y divide-border border-y border-border">
          {values.map(({ title, description }) => (
            <article className="py-5 sm:flex sm:gap-8" key={title}>
              <h3 className="font-serif text-xl font-semibold text-text-main sm:w-64 sm:shrink-0">
                {title}
              </h3>
              <p className="mt-2 leading-7 text-text-secondary sm:mt-0">
                {description}
              </p>
            </article>
          ))}
        </div>
        <p className="mt-5 text-sm leading-6 text-text-muted">
          SkillBridge is still taking shape. Some experiences and opportunities
          described here are goals for the platform, not claims about services
          already available.
        </p>
      </section>

      <section className="border-y border-border bg-surface px-5 py-14 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-text-main">
              Find your place in the community.
            </h2>
            <p className="mt-2 max-w-2xl leading-7 text-text-secondary">
              Meet the makers and discover the skills and stories behind their work.
            </p>
          </div>
          <Link
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-lg bg-primary px-5 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            to="/artisans"
          >
            Explore artisans
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
    <Footer />
  </div>
)

export default AboutUsPage
