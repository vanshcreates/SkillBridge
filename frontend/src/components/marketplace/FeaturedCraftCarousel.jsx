import { useEffect, useState } from 'react'
import { ArrowRight, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react'

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
      className="px-5 pb-8 pt-6 sm:px-8 sm:pb-12 sm:pt-8"
    >
      <div className="relative mx-auto min-h-[440px] max-w-7xl overflow-hidden rounded-3xl bg-primary shadow-2xl sm:min-h-[500px]">
        {products.map((product, index) => (
          <div
            aria-hidden={activeSlide !== index}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              activeSlide === index ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
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
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-primary/85 to-transparent" />
          </div>
        ))}

        <div className="relative z-10 flex min-h-[440px] max-w-2xl flex-col items-start justify-center px-7 py-12 text-white sm:min-h-[500px] sm:px-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-white/95 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            <span>Handpicked from Artisan Masters</span>
          </div>

          <p className="mt-5 text-xs font-bold uppercase tracking-widest text-accent">
            {activeProduct.category} · {activeProduct.artisan}
          </p>

          <h1
            aria-live="polite"
            className="mt-2 font-serif text-3xl font-bold leading-tight sm:text-5xl lg:text-6xl text-white"
          >
            {activeProduct.name}
          </h1>

          <p className="mt-4 max-w-lg text-sm leading-relaxed text-white/85 sm:text-base">
            {activeProduct.description}
          </p>

          <button
            className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-xl bg-white px-6 font-bold text-primary shadow-lg transition-all duration-200 hover:bg-background hover:scale-105 active:scale-98 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-primary cursor-pointer text-xs uppercase tracking-wider"
            onClick={() => {
              onSelectCategory(activeProduct.category)
              document.getElementById('products')?.scrollIntoView({ behavior: 'smooth' })
            }}
            type="button"
          >
            <span>Explore This Craft</span>
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>

        {/* Carousel slide controls */}
        <div className="absolute bottom-6 right-6 z-10 flex items-center gap-2.5 sm:bottom-8 sm:right-8">
          <button
            aria-label="Show previous featured craft"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-md transition-all hover:bg-white hover:text-primary hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
            onClick={showPrevious}
            type="button"
          >
            <ChevronLeft aria-hidden="true" className="h-5 w-5" />
          </button>

          {products.map((product, index) => (
            <button
              aria-label={`Show featured craft ${index + 1}: ${product.name}`}
              aria-pressed={activeSlide === index}
              className={`h-2.5 rounded-full transition-all duration-300 cursor-pointer ${
                activeSlide === index ? 'w-8 bg-white' : 'w-2.5 bg-white/40 hover:bg-white/70'
              }`}
              key={product.name}
              onClick={() => setActiveSlide(index)}
              type="button"
            />
          ))}

          <button
            aria-label="Show next featured craft"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-black/30 text-white backdrop-blur-md transition-all hover:bg-white hover:text-primary hover:scale-105 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent cursor-pointer"
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
