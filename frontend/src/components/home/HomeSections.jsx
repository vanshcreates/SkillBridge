import {
  BookOpenCheck,
  BriefcaseBusiness,
  CookingPot,
  Flower2,
  GraduationCap,
  Handshake,
  IndianRupee,
  Leaf,
  Package,
  PackageCheck,
  Scissors,
  Search,
  ShoppingBasket,
  Sprout,
  UsersRound,
  UserRoundPlus,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import content from '../../data/local-storage.json';

const { roles, skills, steps, platformGoals } = content;

const icons = {
  artisan: BriefcaseBusiness,
  customer: ShoppingBasket,
  partner: Handshake,
  expert: BookOpenCheck,
  embroidery: Flower2,
  tailoring: Scissors,
  food: CookingPot,
  handcrafted: Package,
  natural: Leaf,
  share: UserRoundPlus,
  discover: Search,
  grow: Sprout,
  pricing: IndianRupee,
  connect: UsersRound,
  orders: PackageCheck,
  training: GraduationCap,
};

function Icon({ name, className = '' }) {
  const IconComponent = icons[name] || Package;
  return <IconComponent aria-hidden="true" className={className} />;
}

function SectionHeading({
  eyebrow,
  title,
  description,
  centered = true,
  id,
}) {
  return (
    <div className={`max-w-3xl ${centered ? 'mx-auto text-center' : ''}`}>
      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-secondary/25 bg-secondary/10 px-3.5 py-1 text-xs font-semibold text-secondary uppercase tracking-wider">
        <Sparkles className="h-3.5 w-3.5" />
        <span>{eyebrow}</span>
      </div>
      <h2
        className="font-serif text-3xl font-bold leading-tight text-text-main sm:text-4xl lg:text-5xl"
        id={id}
      >
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-7 text-text-secondary sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}

function RolesSection() {
  return (
    <section
      aria-labelledby="roles-heading"
      className="bg-surface px-5 py-20 sm:px-8 lg:py-28"
      id="roles"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          centered={false}
          eyebrow="For the people who make it happen"
          id="roles-heading"
          title="There’s a place for you here."
          description="Whether you make, buy, teach, or bring a production brief, meaningful impact starts with people meeting each other."
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
          {roles.map((role, index) => {
            const card = (
              <motion.article
                className="group relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border border-border/80 bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1.5 hover:border-secondary/40 hover:shadow-card-hover"
                initial={{ opacity: 0, y: 20 }}
                key={role.title}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileInView={{ opacity: 1, y: 0 }}
              >
                <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-bl from-secondary/10 to-transparent rounded-bl-3xl pointer-events-none transition-transform group-hover:scale-125" />

                <div>
                  <div
                    className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3 ${role.tone}`}
                  >
                    <Icon className="h-7 w-7 text-primary" name={role.icon} />
                  </div>
                  <h3 className="font-serif text-2xl font-bold text-text-main group-hover:text-primary transition-colors">
                    {role.title}
                  </h3>
                  <p className="mt-3 leading-7 text-text-secondary text-sm">
                    {role.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-border/60 flex items-center justify-between">
                  <span className="font-semibold text-sm text-primary group-hover:text-secondary transition-colors">
                    {role.action}
                  </span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-primary transition-all group-hover:bg-primary group-hover:text-white">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                </div>
              </motion.article>
            );

            return role.href.startsWith('/') ? (
              <Link
                className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                key={role.title}
                to={role.href}
              >
                {card}
              </Link>
            ) : (
              <a
                className="rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                href={role.href}
                key={role.title}
              >
                {card}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SkillsSection() {
  return (
    <section
      aria-labelledby="skills-heading"
      className="border-y border-border/80 bg-background/60 px-5 py-20 sm:px-8 lg:py-28"
      id="explore-skills"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            centered={false}
            eyebrow="Heritage In Every Thread"
            id="skills-heading"
            title="Good work takes many forms."
            description="Every craft has its own rhythm, generational techniques, and a master maker who knows it by heart."
          />
          <a
            className="mb-1 inline-flex w-fit shrink-0 items-center gap-2 rounded-xl border border-secondary/30 bg-surface px-5 py-2.5 text-sm font-semibold text-primary transition-all hover:bg-secondary hover:text-white shadow-xs"
            href="#roles"
          >
            Find your place in the community <ArrowRight className="h-4 w-4" />
          </a>
        </div>
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill, index) => (
            <motion.li
              className="group flex gap-4 rounded-2xl border border-border/70 bg-card p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40 hover:shadow-card-hover"
              initial={{ opacity: 0, y: 16 }}
              key={skill.title}
              transition={{ duration: 0.4, delay: index * 0.08 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl shadow-xs transition-transform duration-300 group-hover:rotate-6 ${skill.tone}`}
              >
                <Icon className="h-6 w-6 text-primary" name={skill.icon} />
              </span>
              <div>
                <h3 className="font-serif text-lg font-bold text-text-main group-hover:text-secondary transition-colors">
                  {skill.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {skill.description}
                </p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function HowItWorksSection() {
  return (
    <section
      aria-labelledby="how-heading"
      className="bg-surface px-5 py-20 sm:px-8 lg:py-28"
      id="how-it-works"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          centered={false}
          eyebrow="Transparent & Direct"
          id="how-heading"
          title="From knowing your craft to scaling your livelihood."
          description="SkillBridge connects artisans directly with discerning consumers and ethical industry partners with fair pricing."
        />
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, index) => (
            <motion.li
              className="relative flex flex-col justify-between rounded-2xl border border-border/80 bg-card p-7 shadow-card transition-all duration-300 hover:-translate-y-1 hover:shadow-card-hover"
              initial={{ opacity: 0, y: 20 }}
              key={step.number}
              transition={{ duration: 0.5, delay: index * 0.12 }}
              viewport={{ once: true }}
              whileInView={{ opacity: 1, y: 0 }}
            >
              <div>
                <div className="flex items-center justify-between pb-5 border-b border-border/60">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-secondary font-serif text-base font-bold text-white shadow-xs">
                    0{step.number}
                  </span>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-muted text-secondary">
                    <Icon className="h-5 w-5" name={step.icon} />
                  </div>
                </div>
                <h3 className="mt-5 font-serif text-xl font-bold text-text-main">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-text-secondary">
                  {step.description}
                </p>
              </div>
            </motion.li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function FairOpportunitiesSection() {
  return (
    <section
      aria-labelledby="fair-heading"
      className="bg-surface-muted/70 px-5 py-20 text-text-main sm:px-8 lg:py-28"
      id="fair-opportunities"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:gap-16">
        <div>
          <SectionHeading
            centered={false}
            description="Sustainable livelihood begins with direct visibility, fair market compensation, and transparent settlements."
            eyebrow="What we stand for"
            id="fair-heading"
            title="Every craft deserves fair compensation."
          />
          <div className="mt-6 rounded-2xl border border-border bg-surface p-6 shadow-sm">
            <p className="text-sm font-semibold text-primary">Direct Payout Guarantee</p>
            <p className="mt-1 text-xs text-text-secondary leading-relaxed">
              When an industry or customer places an order, 100% of the agreed craft compensation flows directly to the artisan upon completion.
            </p>
          </div>
        </div>
        <ul className="divide-y divide-border/80 rounded-2xl border border-border bg-surface p-6 shadow-card">
          {platformGoals.map((goal) => (
            <li className="flex gap-4 py-5 first:pt-2 last:pb-2" key={goal.title}>
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/15 text-secondary">
                <Icon className="h-5 w-5" name={goal.icon} />
              </div>
              <div>
                <h3 className="font-serif text-lg font-bold text-text-main">
                  {goal.title}
                </h3>
                <p className="mt-1 text-sm leading-6 text-text-secondary">
                  {goal.description}
                </p>
                <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-secondary uppercase tracking-wider">
                  Verified Feature
                </span>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function MissionSection() {
  return (
    <section
      aria-labelledby="mission-heading"
      className="overflow-hidden border-y border-border bg-background px-5 py-20 sm:px-8 lg:py-28"
      id="mission"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[0.9fr_1.1fr] md:gap-16">
        <div className="relative mx-auto w-full max-w-md overflow-hidden rounded-3xl border border-border bg-surface shadow-2xl">
          <img
            alt="Illustration of an artisan embroidering patterned fabric"
            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
            height="1024"
            loading="lazy"
            src="/images/WhatsApp%20Image%202026-10-25%20at%2012.35.57%20PM.jpeg"
            width="1024"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          <div className="absolute bottom-5 left-5 right-5 text-white">
            <p className="text-xs uppercase tracking-widest text-accent-light font-semibold">Master Maker</p>
            <p className="font-serif text-lg font-bold">Kashmir Sozni Embroidery</p>
          </div>
        </div>
        <div>
          <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-secondary/10 px-3.5 py-1 text-xs font-semibold text-secondary uppercase tracking-wider">
            <span>The Hands Behind The Work</span>
          </div>
          <h2
            className="font-serif text-3xl font-bold leading-tight text-text-main sm:text-4xl lg:text-5xl"
            id="mission-heading"
          >
            There’s a living soul behind every piece.
          </h2>
          <p className="mt-5 text-base leading-7 text-text-secondary sm:text-lg">
            Someone spent days perfecting the dye. Someone learned the intricate needlework from grandparents. Someone sat with the work until every motif was flawless.
          </p>
          <p className="mt-4 leading-7 text-text-secondary text-sm">
            SkillBridge gives master artisans the modern digital tools, verified identity, and payment security needed to thrive in today’s economy.
          </p>
          <a
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-primary-hover hover:gap-3"
            href="#roles"
          >
            <span>Be part of the community</span>
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
}

function FinalCtaSection() {
  return (
    <section
      aria-labelledby="join-heading"
      className="relative overflow-hidden border-t border-border bg-gradient-to-b from-surface to-background px-5 py-20 text-center text-text-main sm:px-8 lg:py-28"
      id="community-cta"
    >
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-secondary">
          <Sparkles className="h-4 w-4" />
          <span>One stitch, one skill, one connection at a time</span>
        </p>
        <h2
          className="font-serif text-3xl font-bold leading-tight sm:text-4xl lg:text-5xl"
          id="join-heading"
        >
          Your Skills Can Open Global Doors.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-text-secondary">
          Explore handmade treasures in our marketplace, or join as an artisan or industry partner to pioneer ethical craft production.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
          <a
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-7 py-3.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary-hover hover:-translate-y-0.5"
            href="#roles"
          >
            <span>Explore ways to participate</span>
            <ArrowRight className="h-4 w-4" />
          </a>
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border-strong bg-surface px-7 py-3.5 text-sm font-semibold text-primary transition-all hover:border-primary hover:bg-surface-muted"
            href="/marketplace"
          >
            Browse Marketplace
          </a>
        </div>
      </div>
    </section>
  );
}

export {
  FairOpportunitiesSection,
  FinalCtaSection,
  HowItWorksSection,
  MissionSection,
  RolesSection,
  SkillsSection,
};
