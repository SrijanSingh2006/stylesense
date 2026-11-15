import React, { useState, useRef } from 'react'
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Search,
  Camera,
  ShoppingBag,
  Sparkles,
  User,
  LayoutDashboard,
  Sliders,
  ChevronDown,
  X,
  UploadCloud,
  Check,
} from 'lucide-react'
import { useCartStore } from '../store/useCartStore'
import { useUserStore, type DemoUser } from '../store/useUserStore'
import { visualSearch } from '../services/api'

const DEMO_PERSONAS: DemoUser[] = [
  {
    id: 1,
    display_name: 'Aarav Mehta (Minimalist Urban)',
    preferred_categories: ['Shirts', 'Jeans', 'Footwear'],
    preferred_colours: ['Black', 'Navy', 'Olive'],
    preferred_brands: ['UrbanKnit', 'Aura Denim', 'TerraSole'],
    budget_min: 1000,
    budget_max: 6000,
  },
  {
    id: 2,
    display_name: 'Ananya Sharma (Contemporary Casual)',
    preferred_categories: ['Dresses', 'T-Shirts', 'Trousers'],
    preferred_colours: ['Beige', 'White', 'Blue'],
    preferred_brands: ['VogueCraft', 'MetroTailor', 'Loom & Thread'],
    budget_min: 1500,
    budget_max: 8000,
  },
  {
    id: 3,
    display_name: 'Rohan Verma (Tailored Formal)',
    preferred_categories: ['Blazers', 'Trousers', 'Footwear'],
    preferred_colours: ['Charcoal', 'Navy', 'Brown'],
    preferred_brands: ['MetroTailor', 'TerraSole', 'Artisan Studio'],
    budget_min: 2500,
    budget_max: 12000,
  },
]

export const StorefrontLayout: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [visualModalOpen, setVisualModalOpen] = useState(false)
  const [visualLoading, setVisualLoading] = useState(false)
  const [userDropdown, setUserDropdown] = useState(false)
  const [visualError, setVisualError] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()

  const itemCount = useCartStore((s) => s.getItemCount())
  const { currentUser, setCurrentUser } = useUserStore()

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setVisualLoading(true)
    setVisualError(null)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await visualSearch(formData)
      setVisualModalOpen(false)
      navigate('/search', {
        state: { visualResults: res, uploadedFileName: file.name },
      })
    } catch (err: any) {
      setVisualError(err?.response?.data?.detail || 'Visual search failed to process image.')
    } finally {
      setVisualLoading(false)
    }
  }

  const categories = [
    { label: 'All Discovery', path: '/discover' },
    { label: 'Shirts', path: '/search?category=Shirts' },
    { label: 'T-Shirts', path: '/search?category=T-Shirts' },
    { label: 'Jeans', path: '/search?category=Jeans' },
    { label: 'Trousers', path: '/search?category=Trousers' },
    { label: 'Dresses', path: '/search?category=Dresses' },
    { label: 'Footwear', path: '/search?category=Footwear' },
    { label: 'Jackets', path: '/search?category=Jackets' },
  ]

  return (
    <div className="min-h-screen flex flex-col bg-cream-100 text-charcoal-900">
      {/* Top Bar with Switcher & Portals */}
      <div className="bg-charcoal-900 text-cream-200 text-xs py-2 px-4 border-b border-charcoal-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 max-w-full">
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-medium tracking-wide truncate text-[11px] sm:text-xs">
              StyleSense 2.0 Live Prototype · AI-Powered Storefront & Commerce Intelligence
            </span>
          </div>

          <div className="flex items-center gap-3 sm:gap-5 flex-wrap justify-center sm:justify-end text-[11px] sm:text-xs">
            {/* Persona Switcher */}
            <div className="relative">
              <button
                onClick={() => setUserDropdown(!userDropdown)}
                className="flex items-center gap-1.5 py-0.5 px-2.5 rounded bg-charcoal-800 hover:bg-charcoal-700 text-cream-200 transition-colors"
              >
                <User className="w-3.5 h-3.5 text-brand-accent" />
                <span className="max-w-[150px] truncate">{currentUser.display_name}</span>
                <ChevronDown className="w-3 h-3 text-charcoal-400" />
              </button>

              {userDropdown && (
                <div className="absolute right-0 mt-1.5 w-64 bg-white text-charcoal-800 rounded-xl shadow-2xl border border-cream-300 py-1.5 z-50">
                  <div className="px-3 py-1.5 border-b border-cream-200 text-[11px] font-semibold text-charcoal-500 uppercase tracking-wider">
                    Simulate Customer Profile
                  </div>
                  {DEMO_PERSONAS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => {
                        setCurrentUser(p)
                        setUserDropdown(false)
                      }}
                      className="w-full text-left px-3 py-2 text-xs hover:bg-cream-100 flex items-center justify-between"
                    >
                      <span className="font-medium">{p.display_name}</span>
                      {currentUser.id === p.id && (
                        <Check className="w-3.5 h-3.5 text-brand" />
                      )}
                    </button>
                  ))}
                  <div className="border-t border-cream-200 mt-1 pt-1 px-3 py-1">
                    <Link
                      to="/account/demo"
                      onClick={() => setUserDropdown(false)}
                      className="text-[11px] text-brand hover:underline font-medium block"
                    >
                      View Persona Preferences →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Portal Switchers */}
            <Link
              to="/dashboard"
              className="flex items-center gap-1.5 text-cream-300 hover:text-white font-medium transition-colors"
            >
              <LayoutDashboard className="w-3.5 h-3.5 text-emerald-400" />
              <span>Product Intelligence</span>
            </Link>
            <Link
              to="/operations/inventory"
              className="flex items-center gap-1.5 text-cream-300 hover:text-white font-medium transition-colors"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Business Operations</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Editorial Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-cream-300 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between py-3 md:py-0 md:h-20 gap-3 md:gap-6">
            <div className="flex items-center justify-between w-full md:w-auto gap-4">
              {/* Logo */}
              <Link to="/" className="flex items-center gap-2 shrink-0">
                <span className="text-xl sm:text-2xl font-serif font-bold tracking-tight text-charcoal-900">
                  STYLESENSE
                </span>
                <span className="text-[9px] sm:text-[10px] font-sans font-semibold tracking-widest uppercase bg-brand text-white px-2 py-0.5 rounded">
                  AI COMMERCE
                </span>
              </Link>

              {/* Navigation Icons & Cart (Mobile) */}
              <div className="flex items-center gap-3 md:hidden">
                <Link
                  to="/cart"
                  className="relative p-2 rounded-full bg-cream-50 hover:bg-cream-200 text-charcoal-800 transition-colors flex items-center gap-1.5"
                  title="Cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-md animate-scale-up">
                      {itemCount}
                    </span>
                  )}
                </Link>
              </div>
            </div>

            {/* Conversational & Visual Search Bar */}
            <div className="w-full md:flex-1 max-w-2xl relative">
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Ask StyleSense: 'Find black casual sneakers under 2500' or 'Italian linen shirt'..."
                  className="w-full pl-10 pr-24 py-2.5 sm:py-3 bg-cream-50 hover:bg-cream-100/70 focus:bg-white border border-cream-300 focus:border-brand rounded-full text-xs text-charcoal-900 placeholder:text-charcoal-400 focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all shadow-inner"
                />
                <Search className="w-4 h-4 text-charcoal-400 absolute left-3.5 top-1/2 -translate-y-1/2" />

                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {/* Camera / Visual Search */}
                  <button
                    type="button"
                    onClick={() => setVisualModalOpen(true)}
                    className="p-1.5 sm:p-2 text-charcoal-500 hover:text-brand hover:bg-cream-200 rounded-full transition-colors"
                    title="Visual Product Search (Upload Image)"
                  >
                    <Camera className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    className="px-3 py-1 sm:px-3.5 sm:py-1.5 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-full shadow transition-colors"
                  >
                    Find
                  </button>
                </div>
              </form>
            </div>

            {/* Navigation Icons & Cart (Desktop) */}
            <div className="hidden md:flex items-center gap-4 shrink-0">
              <Link
                to="/cart"
                className="relative p-2.5 rounded-full bg-cream-50 hover:bg-cream-200 text-charcoal-800 transition-colors flex items-center gap-2"
                title="Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-brand text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-md animate-scale-up">
                    {itemCount}
                  </span>
                )}
                <span className="text-xs font-semibold">Cart</span>
              </Link>
            </div>
          </div>

          {/* Category Bar */}
          <nav className="flex items-center gap-6 overflow-x-auto py-2.5 border-t border-cream-200 text-xs font-medium text-charcoal-600 no-scrollbar">
            {categories.map((c) => {
              const active = location.pathname + location.search === c.path
              return (
                <Link
                  key={c.label}
                  to={c.path}
                  className={`whitespace-nowrap transition-colors py-1 ${
                    active
                      ? 'text-brand font-bold border-b-2 border-brand'
                      : 'hover:text-brand'
                  }`}
                >
                  {c.label}
                </Link>
              )
            })}
          </nav>
        </div>
      </header>

      {/* Visual Search Modal */}
      {visualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-900/60 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl border border-cream-300 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-cream-200 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-brand" />
                <h3 className="text-sm font-semibold text-charcoal-900 font-editorial">
                  StyleSense Visual Palette Search
                </h3>
              </div>
              <button
                onClick={() => setVisualModalOpen(false)}
                className="p-1 rounded-full text-charcoal-400 hover:text-charcoal-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-charcoal-600 leading-relaxed">
              Upload any fashion reference photo (JPG, PNG, WEBP). StyleSense extracts the color histogram and silhouette metadata to match curated catalogue items.
            </p>

            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-cream-400 hover:border-brand rounded-xl p-8 text-center cursor-pointer transition-colors bg-cream-50 hover:bg-cream-100 flex flex-col items-center justify-center gap-3"
            >
              <UploadCloud className="w-10 h-10 text-brand" />
              <div>
                <span className="text-xs font-semibold text-charcoal-800">
                  Click to browse image
                </span>
                <p className="text-[11px] text-charcoal-400 mt-1">Supports files up to 5MB</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {visualLoading && (
              <div className="text-center py-2 text-xs text-brand font-medium animate-pulse">
                Analyzing visual histogram & matching catalogue...
              </div>
            )}

            {visualError && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg">
                {visualError}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Outlet */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Editorial Footer */}
      <footer className="bg-charcoal-900 text-cream-300 border-t border-charcoal-800 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="space-y-3">
              <span className="text-xl font-serif font-bold text-white tracking-tight">
                STYLESENSE
              </span>
              <p className="text-xs text-charcoal-400 leading-relaxed">
                An independently engineered commerce intelligence & personalisation platform built for modern multi-brand retail.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
                Experience
              </h4>
              <ul className="space-y-2 text-xs text-charcoal-400">
                <li><Link to="/discover" className="hover:text-white">Trending Discovery</Link></li>
                <li><Link to="/search?category=Shirts" className="hover:text-white">Curated Shirts</Link></li>
                <li><Link to="/search?category=Footwear" className="hover:text-white">Footwear Collection</Link></li>
                <li><Link to="/account/demo" className="hover:text-white">Customer Profile Preferences</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
                Product Intelligence
              </h4>
              <ul className="space-y-2 text-xs text-charcoal-400">
                <li><Link to="/dashboard" className="hover:text-white">Executive Overview</Link></li>
                <li><Link to="/dashboard/analytics" className="hover:text-white">Funnel & Cohorts</Link></li>
                <li><Link to="/dashboard/experiments" className="hover:text-white">A/B Testing Platform</Link></li>
                <li><Link to="/dashboard/segments" className="hover:text-white">RFM Customer Segmentation</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white mb-3">
                Business Operations
              </h4>
              <ul className="space-y-2 text-xs text-charcoal-400">
                <li><Link to="/operations/inventory" className="hover:text-white">Inventory Intelligence</Link></li>
                <li><Link to="/operations/returns" className="hover:text-white">Return Analytics</Link></li>
                <li><Link to="/operations/catalogue" className="hover:text-white">Catalogue Quality Audit</Link></li>
                <li><Link to="/operations/roadmap" className="hover:text-white">RICE Product Roadmap</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-charcoal-800 flex flex-col md:flex-row items-center justify-between text-xs text-charcoal-500 gap-4">
            <div>© {new Date().getFullYear()} StyleSense Platform. Fictional demo dataset for product portfolio.</div>
            <div className="flex gap-4">
              <span>FastAPI 2.0</span>
              <span>·</span>
              <span>React 18 + Vite</span>
              <span>·</span>
              <span>SQLAlchemy 2</span>
              <span>·</span>
              <span>Scikit-Learn NLP</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
