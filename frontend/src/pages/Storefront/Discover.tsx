import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Filter, SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import { ProductCard } from '../../components/ui/ProductCard'
import { fetchProducts } from '../../services/api'
import type { Product } from '../../types'

export const DiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal] = useState(0)
  const [pages, setPages] = useState(1)
  const [loading, setLoading] = useState(true)

  // Filters
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '')
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '')
  const [selectedColour, setSelectedColour] = useState('')
  const [minPrice, setMinPrice] = useState<number | ''>('')
  const [maxPrice, setMaxPrice] = useState<number | ''>('')
  const [sortBy, setSortBy] = useState('rating')
  const [page, setPage] = useState(1)

  const categories = ['Shirts', 'T-Shirts', 'Jeans', 'Trousers', 'Dresses', 'Footwear', 'Jackets', 'Blazers', 'Accessories']
  const brands = ['UrbanKnit', 'Aura Denim', 'VogueCraft', 'MetroTailor', 'NordicStyle', 'TerraSole', 'Loom & Thread']
  const colours = ['Black', 'White', 'Navy', 'Blue', 'Olive', 'Grey', 'Beige', 'Brown']

  const loadData = async () => {
    setLoading(true)
    try {
      const res = await fetchProducts({
        category: selectedCategory || undefined,
        brand: selectedBrand || undefined,
        colour: selectedColour || undefined,
        min_price: minPrice !== '' ? Number(minPrice) : undefined,
        max_price: maxPrice !== '' ? Number(maxPrice) : undefined,
        sort_by: sortBy,
        page,
        limit: 16,
      })
      setProducts(res.items)
      setTotal(res.total)
      setPages(res.pages)
    } catch (err) {
      console.error('Failed to load products:')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedCategory, selectedBrand, selectedColour, minPrice, maxPrice, sortBy, page])

  const handleResetFilters = () => {
    setSelectedCategory('')
    setSelectedBrand('')
    setSelectedColour('')
    setMinPrice('')
    setMaxPrice('')
    setSortBy('rating')
    setPage(1)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title & Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-cream-300">
        <div>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900">
            StyleSense Curated Catalogue
          </h1>
          <p className="text-xs text-charcoal-500 mt-1">
            Showing {products.length} of {total} products with active stock availability
          </p>
        </div>

        {/* Sort Select */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value)
              setPage(1)
            }}
            className="py-2 px-3 bg-white border border-cream-300 rounded-xl text-xs font-medium text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand shadow-sm"
          >
            <option value="rating">Top Rated & Popular</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">New Arrivals</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Left Filter Sidebar */}
        <div className="space-y-6 lg:border-r lg:border-cream-300 lg:pr-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-charcoal-900">
              <SlidersHorizontal className="w-4 h-4 text-brand" />
              <span>Filters</span>
            </div>
            {(selectedCategory || selectedBrand || selectedColour || minPrice !== '' || maxPrice !== '') && (
              <button
                onClick={handleResetFilters}
                className="text-xs text-brand hover:underline font-medium flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2">
              Category
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(selectedCategory === cat ? '' : cat)
                    setPage(1)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedCategory === cat
                      ? 'bg-brand text-white font-semibold'
                      : 'text-charcoal-700 hover:bg-cream-200'
                  }`}
                >
                  <span>{cat}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2">
              Brand
            </label>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2">
              {brands.map((br) => (
                <button
                  key={br}
                  onClick={() => {
                    setSelectedBrand(selectedBrand === br ? '' : br)
                    setPage(1)
                  }}
                  className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-between ${
                    selectedBrand === br
                      ? 'bg-brand text-white font-semibold'
                      : 'text-charcoal-700 hover:bg-cream-200'
                  }`}
                >
                  <span>{br}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Colour Filter */}
          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2">
              Colour Palette
            </label>
            <div className="flex flex-wrap gap-1.5">
              {colours.map((col) => (
                <button
                  key={col}
                  onClick={() => {
                    setSelectedColour(selectedColour === col ? '' : col)
                    setPage(1)
                  }}
                  className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
                    selectedColour === col
                      ? 'bg-brand border-brand text-white font-semibold'
                      : 'bg-white border-cream-300 text-charcoal-700 hover:border-cream-400'
                  }`}
                >
                  {col}
                </button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-xs font-bold text-charcoal-700 uppercase tracking-wider mb-2">
              Price Range (₹)
            </label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => {
                  setMinPrice(e.target.value ? Number(e.target.value) : '')
                  setPage(1)
                }}
                className="w-full p-2 text-xs bg-white border border-cream-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
              />
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => {
                  setMaxPrice(e.target.value ? Number(e.target.value) : '')
                  setPage(1)
                }}
                className="w-full p-2 text-xs bg-white border border-cream-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
          </div>
        </div>

        {/* Right Product Grid */}
        <div className="lg:col-span-3 space-y-8">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[3/4] bg-cream-200 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-cream-300 space-y-3">
              <p className="text-sm font-semibold text-charcoal-800">No matching products found.</p>
              <p className="text-xs text-charcoal-500">
                Try clearing selected filters or expanding the price threshold.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 bg-brand text-white text-xs font-semibold rounded-xl"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-6 border-t border-cream-300">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-cream-300 bg-white text-charcoal-600 hover:bg-cream-100 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-semibold text-charcoal-700">
                Page {page} of {pages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(pages, p + 1))}
                disabled={page === pages}
                className="p-2 rounded-lg border border-cream-300 bg-white text-charcoal-600 hover:bg-cream-100 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
