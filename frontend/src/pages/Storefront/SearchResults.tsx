import React, { useEffect, useState } from 'react'
import { useSearchParams, useLocation, Link } from 'react-router-dom'
import {
  Search,
  Camera,
  Sparkles,
  SlidersHorizontal,
  RotateCcw,
  Tag,
  Palette,
} from 'lucide-react'
import { ProductCard } from '../../components/ui/ProductCard'
import { searchProducts } from '../../services/api'
import type { Product, SearchResponse, VisualSearchResponse } from '../../types'

export const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams()
  const location = useLocation()
  const rawQuery = searchParams.get('q') || ''
  const categoryParam = searchParams.get('category') || ''

  // Visual search results passed via state if user uploaded photo
  const visualResults = (location.state as { visualResults?: VisualSearchResponse; uploadedFileName?: string })?.visualResults
  const uploadedFileName = (location.state as { uploadedFileName?: string })?.uploadedFileName

  const [response, setResponse] = useState<SearchResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('relevance')

  useEffect(() => {
    if (visualResults) {
      setLoading(false)
      return
    }

    const executeSearch = async () => {
      setLoading(true)
      try {
        const res = await searchProducts({
          query: rawQuery,
          category: categoryParam || undefined,
          sort_by: sortBy,
          page: 1,
          limit: 24,
        })
        setResponse(res)
      } catch (err) {
        console.error('Search failed:')
      } finally {
        setLoading(false)
      }
    }

    executeSearch()
  }, [rawQuery, categoryParam, sortBy, visualResults])

  const products: Product[] = visualResults ? visualResults.items : response?.items || []
  const parsedFilters = response?.parsed_filters

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header and Parse Insights */}
      <div className="bg-white rounded-2xl border border-cream-300 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand uppercase tracking-wider">
              {visualResults ? <Camera className="w-4 h-4" /> : <Search className="w-4 h-4" />}
              <span>{visualResults ? 'Visual Palette Query' : 'Conversational NLP Search'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 mt-1">
              {visualResults
                ? `Visual Matches for "${uploadedFileName || 'Uploaded Photo'}"`
                : rawQuery
                ? `Results for "${rawQuery}"`
                : categoryParam
                ? `Collection: ${categoryParam}`
                : 'All Search Results'}
            </h1>
            <p className="text-xs text-charcoal-500 mt-1">
              {products.length} products matching search criteria
            </p>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-charcoal-500 uppercase tracking-wider">
              Sort:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="py-2 px-3 bg-cream-50 border border-cream-300 rounded-xl text-xs font-medium text-charcoal-800"
            >
              <option value="relevance">Relevance (TF-IDF)</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="rating">Highest Rated</option>
            </select>
          </div>
        </div>

        {/* Natural Language Extracted Facets Badge Bar */}
        {parsedFilters && (parsedFilters.category || parsedFilters.colour || parsedFilters.max_price || parsedFilters.brand) && (
          <div className="pt-4 border-t border-cream-200">
            <span className="text-[11px] font-semibold text-charcoal-400 uppercase tracking-wider block mb-2">
              Extracted Facet Filters (Deterministic NLP Parser):
            </span>
            <div className="flex flex-wrap gap-2 text-xs">
              {parsedFilters.category && (
                <span className="px-2.5 py-1 bg-cream-200 text-charcoal-800 rounded-lg font-medium flex items-center gap-1">
                  <Tag className="w-3 h-3 text-brand" /> Category: <strong>{parsedFilters.category}</strong>
                </span>
              )}
              {parsedFilters.colour && (
                <span className="px-2.5 py-1 bg-cream-200 text-charcoal-800 rounded-lg font-medium flex items-center gap-1">
                  <Palette className="w-3 h-3 text-brand" /> Colour: <strong>{parsedFilters.colour}</strong>
                </span>
              )}
              {parsedFilters.max_price && (
                <span className="px-2.5 py-1 bg-cream-200 text-charcoal-800 rounded-lg font-medium flex items-center gap-1">
                  Max Price: <strong>₹{parsedFilters.max_price.toLocaleString('en-IN')}</strong>
                </span>
              )}
              {parsedFilters.min_price && (
                <span className="px-2.5 py-1 bg-cream-200 text-charcoal-800 rounded-lg font-medium flex items-center gap-1">
                  Min Price: <strong>₹{parsedFilters.min_price.toLocaleString('en-IN')}</strong>
                </span>
              )}
              {parsedFilters.brand && (
                <span className="px-2.5 py-1 bg-cream-200 text-charcoal-800 rounded-lg font-medium flex items-center gap-1">
                  Brand: <strong>{parsedFilters.brand}</strong>
                </span>
              )}
            </div>
          </div>
        )}

        {/* Visual search color histogram breakdown */}
        {visualResults && (
          <div className="pt-4 border-t border-cream-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs bg-cream-50 p-4 rounded-xl">
            <div>
              <span className="font-semibold text-charcoal-800">Detected Colour: </span>
              <span className="px-2 py-0.5 bg-brand text-white font-bold rounded">
                {visualResults.extracted_colour}
              </span>
              <p className="text-[11px] text-charcoal-500 mt-1">{visualResults.notes}</p>
            </div>
            <div className="text-[11px] text-charcoal-400 font-mono">
              RGB Brightness: {Math.round((visualResults.extracted_histogram.brightness || 0.5) * 100)}%
            </div>
          </div>
        )}
      </div>

      {/* Grid of Results */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-cream-200 animate-pulse rounded-xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-16 text-center bg-white rounded-2xl border border-cream-300 space-y-4">
          <p className="text-base font-semibold text-charcoal-800">
            No products matched your exact query or facets.
          </p>
          <p className="text-xs text-charcoal-500 max-w-md mx-auto">
            Try adjusting your search terms, removing specific price thresholds, or browsing the entire catalogue.
          </p>
          <Link
            to="/discover"
            className="inline-block px-5 py-2.5 bg-brand text-white text-xs font-semibold rounded-xl"
          >
            Explore All Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  )
}
