import { useEffect, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'

const FeaturedCraftCarousel = ({ products, onSelectCategory }) => {
  const [activeSlide, setActiveSlide] = useState(0)
  const [unavailableImages, setUnavailableImages] = useState({})
  const activeProduct = products[activeSlide]

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined

    const timer = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % products.length)
    }, 6000)

    return () => window.clearInterval(timer)
  }, [products.length])

  const showPrevious = () => {
    setActiveSlide((current) => (current - 1 + products.length) % products.length)
  }

  const showNext = () => {
    setActiveSlide((current) => (current + 1) % products.length)
  }

  return (
    <section
      aria-label="Featured artisan crafts"
      className="px-5 pb-10 pt-8 sm:px-8 sm:pb-14 sm:pt-12"
    >
      <div className="relative mx-auto min-h-[420px] max-w-7xl overflow-hidden rounded-3xl bg-primary sm:min-h-[480px]">
        {products.map((product, index) => (
          <div
            aria-hidden={activeSlide !== index}
            className={`absolute inset-0 transition-opacity duration-700 ${
              activeSlide === index ? 'opacity-100' : 'opacity-0'
            }`}
            key={product.name}
          >
            {!unavailableImages[product.image] && (
              <img
                alt={product.imageAlt}
                className="absolute inset-0 h-full w-full object-cover object-center"
                onError={() =>
                  setUnavailableImages((current) => ({
                    ...current,
                    [product.image]: true,
                  }))
                }
                src={product.image}
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-primary/15" />
          </div>
        ))}

        <div className="relative z-10 flex min-h-[420px] max-w-2xl flex-col items-start justify-center px-7 py-12 text-white sm:min-h-[480px] sm:px-14">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-white/90 backdrop-blur-sm">
            Handpicked from our artisan community
          </span>
          <p className="mt-7 text-sm font-semibold uppercase tracking-[0.16em] text-accent">
            {activeProduct.category} · {activeProduct.artisan}
          </p>
          <h1
            aria-live="polite"
            className="mt-3 font-serif text-4xl font-semibold leading-tight sm:text-6xl"
          >
            {activeProduct.name}
          </h1>
          <p className="mt-4 max-w-lg text-base leading-7 text-white/80 sm:text-lg">
            {activeProduct.description}
          </p>
          <button
            className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-lg bg-white px-5 py-3 font-semibold text-primary transition hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary"
            onClick={() => {
              onSelectCategory(activeProduct.category)
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
            }}
            type="button"
          >
            Explore this craft <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        <div className="absolute bottom-5 right-5 z-10 flex items-center gap-2 sm:bottom-8 sm:right-8">
          <button
            aria-label="Show previous featured craft"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur-sm transition hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={showPrevious}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>
          {products.map((product, index) => (
            <button
              aria-label={`Show featured craft ${index + 1}: ${product.name}`}
              aria-pressed={activeSlide === index}
              className={`h-2.5 rounded-full transition-all ${
                activeSlide === index ? 'w-7 bg-white' : 'w-2.5 bg-white/50 hover:bg-white/80'
              }`}
              key={product.name}
              onClick={() => setActiveSlide(index)}
              type="button"
            />
          ))}
          <button
            aria-label="Show next featured craft"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/20 text-white backdrop-blur-sm transition hover:bg-white hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
            onClick={showNext}
            type="button"
          >
            <ChevronRight aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>
      </div>
    </section>
  )
}

export default FeaturedCraftCarousel
