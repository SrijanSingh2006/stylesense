import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Search,
  Ruler,
  Compass,
  ShoppingBag,
  TrendingUp,
} from 'lucide-react'
import { ProductCard } from '../../components/ui/ProductCard'
import { fetchRecommendations, fetchCompleteLook, fetchProducts } from '../../services/api'
import { useUserStore } from '../../store/useUserStore'
import { useCartStore } from '../../store/useCartStore'
import type { Product, RecommendationItem, CompleteLookResponse } from '../../types'

export const HomePage: React.FC = () => {
  const { currentUser } = useUserStore()
  const addItem = useCartStore((s) => s.addItem)
  const navigate = useNavigate()

  const [recommendations, setRecommendations] = useState<RecommendationItem[]>([])
  const [completeLook, setCompleteLook] = useState<CompleteLookResponse | null>(null)
  const [trending, setTrending] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadHomeData = async () => {
      setLoading(true)
      try {
        const [recRes, prodRes] = await Promise.all([
          fetchRecommendations(currentUser.id, 8),
          fetchProducts({ limit: 8, sort_by: 'rating' }),
        ])
        setRecommendations(recRes.items)
        setTrending(prodRes.items)

        // Fetch complete look for the first trending product
        if (prodRes.items.length > 0) {
          const lookRes = await fetchCompleteLook(currentUser.id, prodRes.items[0].id)
          setCompleteLook(lookRes)
        }
      } catch (err) {
        console.error('Failed to load home page data:', err)
      } finally {
        setLoading(false)
      }
    }
    loadHomeData()
  }, [currentUser])

  const handleAddOutfitToCart = () => {
    if (!completeLook) return
    // Add primary item
    addItem(completeLook.primary_product, completeLook.primary_product.sizes_available?.[0] || 'M', 1)
    // Add each complementary item
    completeLook.outfit_items.forEach((item) => {
      addItem(item, item.sizes_available?.[0] || 'M', 1)
    })
    navigate('/cart')
  }

  const queryChips = [
    'Black casual sneakers under 2500',
    'White linen shirt',
    'Denim jacket under 3500',
    'Tailored wool trousers',
  ]

  return (
    <div className="space-y-16 pb-20">
      {/* Editorial Hero Section */}
      <section className="relative overflow-hidden bg-cream-200/80 border-b border-cream-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand/10 border border-brand/20 text-brand text-xs font-semibold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI-Powered Multimodal Discovery</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-charcoal-900 tracking-tight leading-[1.15]">
              Intelligent Curation for Contemporary Living.
            </h1>

            <p className="text-base sm:text-lg text-charcoal-600 leading-relaxed max-w-xl font-light">
              Experience fashion discovery orchestrated by real-time preference affinity, natural language search understanding, and anthropometric sizing assistance.
            </p>

            {/* Quick search chips */}
            <div className="pt-2">
              <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider block mb-2">
                Popular AI Search Prompts:
              </span>
              <div className="flex flex-wrap gap-2">
                {queryChips.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => navigate(`/search?q=${encodeURIComponent(chip)}`)}
                    className="text-xs px-3 py-1.5 rounded-full bg-white border border-cream-300 hover:border-brand text-charcoal-700 hover:text-brand shadow-sm transition-all"
                  >
                    "{chip}"
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 pt-4">
              <Link
                to="/discover"
                className="px-6 py-3.5 bg-brand hover:bg-brand-dark text-white text-sm font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
              >
                <span>Explore Full Collection</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to="/dashboard"
                className="px-5 py-3.5 bg-white border border-cream-300 hover:bg-cream-50 text-charcoal-800 text-sm font-medium rounded-xl shadow-sm transition-all"
              >
                View Analytics Console
              </Link>
            </div>
          </div>

          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white aspect-[4/5]">
              <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800&auto=format&fit=crop&q=80"
                alt="Editorial look"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal-900/80 via-transparent to-transparent flex flex-col justify-end p-6 text-white">
                <span className="text-xs font-semibold uppercase tracking-widest text-brand-accent">
                  Persona Affinity Matched
                </span>
                <p className="text-lg font-serif font-bold mt-1">
                  Tailored for {currentUser.display_name}
                </p>
                <p className="text-xs text-cream-200 mt-1 font-light">
                  Preferences: {currentUser.preferred_categories.join(', ')} · Palette: {currentUser.preferred_colours.join(', ')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Pillar Badges */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-xl border border-cream-300 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-brand-muted flex items-center justify-center text-brand shrink-0">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal-900">Conversational Search</h3>
              <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">
                Parse complex queries into category, colour, price constraints, and TF-IDF semantic relevance.
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-cream-300 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700 shrink-0">
              <Ruler className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal-900">Sizing Confidence Engine</h3>
              <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">
                Brand-specific measurement curves and fit tolerances reduce return rates and drop-offs.
              </p>
            </div>
          </div>

          <div className="p-6 bg-white rounded-xl border border-cream-300 shadow-sm flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-700 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-charcoal-900">Curated Outfit Synergy</h3>
              <p className="text-xs text-charcoal-500 mt-1 leading-relaxed">
                Complete-the-look outfit pairings dynamically match compatible silhouettes and color palettes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Personalized Recommendations Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-brand uppercase tracking-wider">
              <Sparkles className="w-4 h-4" />
              <span>Personalised Selection</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 mt-1">
              Recommended for {currentUser.display_name.split(' ')[0]}
            </h2>
            <p className="text-xs text-charcoal-500 mt-1">
              Curated by StyleSense hybrid recommendation algorithm based on your style affinities.
            </p>
          </div>
          <Link
            to="/discover"
            className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[3/4] bg-cream-200 animate-pulse rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {recommendations.map((item) => (
              <ProductCard
                key={item.product.id}
                product={item.product}
                explanation={item.explanation}
              />
            ))}
          </div>
        )}
      </section>

      {/* Complete The Look Section */}
      {completeLook && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-2xl border border-cream-300 p-8 shadow-sm">
            <div className="max-w-2xl mb-6">
              <span className="text-xs font-semibold text-brand uppercase tracking-wider">
                StyleSense Stylist
              </span>
              <h2 className="text-2xl font-serif font-bold text-charcoal-900 mt-1">
                Complete The Look: Complementary Ensemble
              </h2>
              <p className="text-xs text-charcoal-600 mt-2 leading-relaxed">
                {completeLook.styling_notes}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
              {/* Primary Anchor Product */}
              <div className="relative">
                <span className="absolute top-2 left-2 z-10 bg-charcoal-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  ANCHOR ITEM
                </span>
                <ProductCard product={completeLook.primary_product} />
              </div>

              {/* Complementary items */}
              {completeLook.outfit_items.map((item) => (
                <div key={item.id} className="relative">
                  <span className="absolute top-2 left-2 z-10 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                    PAIRED COMPLEMENT
                  </span>
                  <ProductCard product={item} />
                </div>
              ))}
            </div>

            {/* Total Bundle Callout */}
            <div className="mt-8 pt-6 border-t border-cream-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs text-charcoal-500">Total Ensemble Price (All Items)</span>
                <div className="text-2xl font-bold text-charcoal-900">
                  ₹{completeLook.total_outfit_price.toLocaleString('en-IN')}
                </div>
              </div>

              <button
                onClick={handleAddOutfitToCart}
                className="w-full sm:w-auto px-6 py-3 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Add Complete Outfit to Cart</span>
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Trending Catalogue Highlights */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              <TrendingUp className="w-4 h-4" />
              <span>Trending Now</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 mt-1">
              Highest-Rated Pieces
            </h2>
          </div>
          <Link
            to="/discover"
            className="text-xs font-semibold text-brand hover:underline flex items-center gap-1"
          >
            <span>Browse Catalogue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {trending.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
    </div>
  )
}
