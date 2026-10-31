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
} from 'lucide-react';
import { Link } from 'react-router-dom';
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
  const IconComponent = icons[name];
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
      <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-secondary">
        <span aria-hidden="true" className="h-px w-5 bg-secondary" />
        {eyebrow}
      </p>
      <h2
        className="font-serif text-3xl font-semibold leading-tight text-text-main sm:text-4xl"
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
      className="bg-surface px-5 py-20 sm:px-8 lg:py-24"
      id="roles"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          centered={false}
          eyebrow="For the people who make it happen"
          id="roles-heading"
          title="There’s a place for you here."
          description="Whether you make, buy, teach, or bring a bigger brief, good work starts with people meeting each other."
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
          {roles.map((role) => {
            const card = (
              <article
                className="group flex h-full flex-col rounded-xl bg-card p-6 shadow-card transition duration-200 hover:-translate-y-1 hover:border-border-strong hover:shadow-card-hover focus-within:ring-2 focus-within:ring-secondary focus-within:ring-offset-2"
                key={role.title}
              >
                <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-full ${role.tone}`}>
                  <Icon className="h-6 w-6 transition-transform duration-200 group-hover:scale-110" name={role.icon} />
                </div>
                <h3 className="font-serif text-xl font-semibold text-main">
                  {role.title}
                </h3>
                <p className="mt-3 flex-1 leading-7 text-text-secondary">
                  {role.description}
                </p>
                <span className="mt-5 inline-flex w-fit items-center gap-2 font-semibold text-primary underline decoration-border underline-offset-4 transition-colors group-hover:decoration-primary">
                  {role.action}
                  <span aria-hidden="true">→</span>
                </span>
              </article>
            );

            return role.href.startsWith('/') ? (
              <Link
                className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
                key={role.title}
                to={role.href}
              >
                {card}
              </Link>
            ) : (
              <a
                className="rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
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
      className="border-y border-border bg-surface px-5 py-20 sm:px-8 lg:py-24 "
      id="explore-skills"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <SectionHeading
            centered={false}
            eyebrow="A few things made by hand"
            id="skills-heading"
            title="Good work takes many forms."
            description="Every craft has its own rhythm, its own techniques, and a person who knows it by heart."
          />
          <a
            className="mb-1 inline-flex w-fit shrink-0 items-center gap-2 font-semibold text-primary underline decoration-border-strong underline-offset-4 hover:decoration-primary focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            href="#roles"
          >
            Find your place in the community <span aria-hidden="true">→</span>
          </a>
        </div>
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {skills.map((skill) => (
            <li
              className="group flex gap-4 rounded-xl border border-border bg-card p-5 shadow-card transition duration-200 hover:-translate-y-1 hover:shadow-card-hover"
              key={skill.title}
            >
              <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${skill.tone}`}>
                <Icon className="h-6 w-6 transition-transform duration-200 group-hover:rotate-[-8deg]" name={skill.icon} />
              </span>
              <div>
                <h3 className="font-serif text-lg font-semibold text-text-main">
                  {skill.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-text-secondary">
                  {skill.description}
                </p>
              </div>
            </li>
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
      className="bg-surface px-5 py-20 sm:px-8 lg:py-24"
      id="how-it-works"
    >
      <div className="mx-auto max-w-7xl">
        <SectionHeading
          centered={false}
          eyebrow="How we hope to bring people together"
          id="how-heading"
          title="From knowing your craft to finding your people."
          description="SkillBridge is being shaped around a simple idea: make it easier for people to find each other through the work they do."
        />
        <ol className="mt-12 grid gap-5 md:grid-cols-3">
          {steps.map((step) => (
            <li
              className="flex gap-5 rounded-xl border border-border bg-card p-6 shadow-card"
              key={step.number}
            >
              <div className="shrink-0">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary font-serif text-sm text-white">{step.number}</span>
                <Icon className="mx-auto mt-4 h-6 w-6 text-secondary" name={step.icon} />
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-text-main">
                  {step.title}
                </h3>
                <p className="mt-2 leading-7 text-text-secondary">
                  {step.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <p className="mt-5 text-sm text-text-muted">
          SkillBridge is still taking shape; this is the kind of community we hope to build.
        </p>
      </div>
    </section>
  );
}

function FairOpportunitiesSection() {
  return (
    <section
      aria-labelledby="fair-heading"
      className="bg-surface-muted px-5 py-20 text-text-main sm:px-8 lg:py-24"
      id="fair-opportunities"
    >
      <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
        <div>
          <SectionHeading
            centered={false}
            description="A good livelihood begins with being seen, valued for what you know, and able to meet the people looking for your work."
            eyebrow="What we believe"
            id="fair-heading"
            title="Craft deserves to be valued."
          />
          <p className="mt-5 max-w-xl leading-7 text-text-secondary">
            These are the things we hope to make more possible as SkillBridge
            grows—not features we claim are already live.
          </p>
        </div>
        <ul className="divide-y divide-border border-y border-border">
          {platformGoals.map((goal) => (
            <li className="flex gap-4 py-5" key={goal.title}>
              <Icon className="mt-1 h-5 w-5 shrink-0 text-secondary" name={goal.icon} />
              <div>
                <h3 className="font-serif text-lg font-semibold text-text-main">
                  {goal.title}
                </h3>
                <p className="mt-1 leading-7 text-text-secondary">
                  {goal.description}
                </p>
                <p className="mt-2 text-xs font-semibold text-secondary">
                  A goal for the platform
                </p>
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
      className="overflow-hidden border-y border-border bg-background px-5 py-16 sm:px-8 lg:py-20"
      id="mission"
    >
      <div className="mx-auto grid max-w-6xl items-center gap-10 md:grid-cols-[0.8fr_1.2fr] md:gap-16">
        <div className="mx-auto w-full max-w-sm overflow-hidden rounded-xl border border-border bg-surface shadow-card">
          <img
            alt="Illustration of an artisan embroidering patterned fabric"
            className="h-full w-full object-cover"
            height="1024"
            loading="lazy"
            src="/images/WhatsApp%20Image%202026-10-25%20at%2012.35.57%20PM.jpeg"
            width="1024"
          />
        </div>
        <div>
          <p className="mb-3 text-sm font-semibold text-secondary">
            The hands behind the work
          </p>
          <h2
            className="font-serif text-3xl font-semibold leading-tight text-text-main sm:text-4xl"
            id="mission-heading"
          >
            There’s a person behind every piece.
          </h2>
          <p className="mt-5 text-base leading-7 text-text-secondary sm:text-lg">
            Someone chose the colours. Someone learned the stitch from a parent,
            neighbour, or patient teacher. Someone sat with the work until it
            felt just right.
          </p>
          <p className="mt-4 leading-7 text-text-secondary">
            We want SkillBridge to help those hands and skills be seen—and to
            make room for the next story to begin.
          </p>
          <a
            className="mt-7 inline-flex items-center gap-2 font-semibold text-primary underline-offset-4 hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            href="#roles"
          >
            Be part of the community <span aria-hidden="true">→</span>
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
      className="border-t border-border bg-surface px-5 py-16 text-center text-text-main sm:px-8 lg:py-20"
      id="community-cta"
    >
      <div className="mx-auto max-w-3xl">
        <p className="mb-3 text-sm font-semibold text-secondary">
          One stitch, one skill, one connection at a time.
        </p>
        <h2
          className="font-serif text-3xl font-semibold leading-tight sm:text-4xl"
          id="join-heading"
        >
          Your Skills Can Open New Opportunities.
        </h2>
        <p className="mx-auto mt-4 max-w-2xl leading-7 text-text-secondary">
          Take a look at the crafts in our community, or find the part you’d
          like to play.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-primary bg-primary px-6 py-3 font-semibold text-white transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            href="#roles"
          >
            Explore ways to participate
          </a>
          <a
            className="inline-flex min-h-12 items-center justify-center rounded-lg border border-border-strong bg-surface px-6 py-3 font-semibold text-primary transition hover:border-primary hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary focus-visible:ring-offset-2"
            href="#explore-skills"
          >
            Explore skills and crafts
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
