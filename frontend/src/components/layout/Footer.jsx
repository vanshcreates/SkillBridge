import { Link } from 'react-router-dom'

const Footer = () => {
  return (
    <>
      <div
        aria-hidden="true"
        className="section-divider h-12 bg-primary"
        style={{ '--hero-background': 'none' }}
      />
      <footer className="bg-primary px-5 py-12 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <Link
              className="font-serif text-2xl font-semibold focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              to="/"
            >
              SkillBridge
            </Link>
            <p className="mt-3 leading-7 text-white/75">
              Connecting skills, community, and better tomorrows—one handmade
              story at a time.
            </p>
          </div>
          <nav aria-label="Footer navigation">
            <h2 className="mb-4 font-semibold">Explore SkillBridge</h2>
            <ul className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm text-white/75">
              <li>
                <Link
                  className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  to="/marketplace"
                >
                  Marketplace
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  to="/#explore-skills"
                >
                  Skills and crafts
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  to="/#roles"
                >
                  Ways to participate
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  to="/#fair-opportunities"
                >
                  Industry partnerships
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  to="/#how-it-works"
                >
                  Training and learning
                </Link>
              </li>
              <li>
                <Link
                  className="hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  to="/#mission"
                >
                  Our mission
                </Link>
              </li>
            </ul>
          </nav>
        </div>
        <div className="mx-auto mt-10 max-w-7xl border-t border-white/20 pt-5 text-sm text-white/60">
          SkillBridge · Skills · Community · Better tomorrows
        </div>
      </footer>
    </>
  )
}

export default Footer
