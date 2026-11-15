import React, { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  Star,
  Ruler,
  ShoppingBag,
  Heart,
  Check,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ArrowRight,
} from 'lucide-react'
import { fetchProductById, fetchCompleteLook, fetchRecommendations, trackEvent } from '../../services/api'
import { useCartStore } from '../../store/useCartStore'
import { useUserStore } from '../../store/useUserStore'
import { SizeAssistantModal } from '../../components/ui/SizeAssistantModal'
import { ProductCard } from '../../components/ui/ProductCard'
import type { Product, CompleteLookResponse, RecommendationItem } from '../../types'

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const productId = Number(id)
  const { currentUser, sessionId } = useUserStore()
  const addItem = useCartStore((s) => s.addItem)

  const [product, setProduct] = useState<Product | null>(null)
  const [completeLook, setCompleteLook] = useState<CompleteLookResponse | null>(null)
  const [similarItems, setSimilarItems] = useState<RecommendationItem[]>([])
  const [selectedSize, setSelectedSize] = useState<string>('M')
  const [sizeModalOpen, setSizeModalOpen] = useState(false)
  const [addedToast, setAddedToast] = useState(false)
  const [wishlisted, setWishlisted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!productId) return

    const loadData = async () => {
      setLoading(true)
      try {
        const prod = await fetchProductById(productId)
        setProduct(prod)
        if (prod.sizes_available?.length > 0) {
          setSelectedSize(prod.sizes_available[0])
        }

        // Track product view event
        trackEvent({
          customer_id: currentUser.id,
          session_id: sessionId,
          product_id: prod.id,
          event_type: 'product_view',
          metadata: { sku: prod.sku, category: prod.category, price: prod.price },
        }).catch(() => {})

        // Load Complete the look & similar recommendations in parallel
        const [lookRes, recRes] = await Promise.all([
          fetchCompleteLook(currentUser.id, prod.id).catch(() => null),
          fetchRecommendations(currentUser.id, 4, prod.category).catch(() => null),
        ])

        if (lookRes) setCompleteLook(lookRes)
        if (recRes) setSimilarItems(recRes.items)
      } catch (err) {
        console.error('Failed to load product details:', err)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [productId, currentUser])

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-brand border-r-transparent" />
        <p className="mt-4 text-xs text-charcoal-500 font-medium">Loading product curation...</p>
      </div>
    )
  }

  const discount = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  const handleAddToCart = () => {
    addItem(product, selectedSize, 1)
    setAddedToast(true)
    setTimeout(() => setAddedToast(false), 2500)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* Toast Notification */}
      {addedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-charcoal-900 text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-charcoal-700 animate-slide-up">
          <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center">
            <Check className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold block">{product.name} (Size {selectedSize})</span>
            <span className="text-[11px] text-cream-300">Added to your shopping bag</span>
          </div>
          <Link to="/cart" className="ml-2 text-xs font-bold text-emerald-400 hover:underline">
            View Bag
          </Link>
        </div>
      )}

      {/* Main PDP Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Left: Gallery */}
        <div className="lg:col-span-7 space-y-4">
          <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-cream-200 border border-cream-300 shadow-sm relative">
            <img
              src={product.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80'}
              alt={product.name}
              className="w-full h-full object-cover object-center"
            />
            {discount > 0 && (
              <span className="absolute top-4 left-4 bg-brand text-white text-xs font-bold px-3 py-1 rounded-full shadow">
                {discount}% OFF
              </span>
            )}
          </div>
        </div>

        {/* Right: Buy Box & Product Info */}
        <div className="lg:col-span-5 space-y-6">
          {/* Brand & Title */}
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-charcoal-500">
              {product.brand} · {product.category}
            </span>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-charcoal-900 mt-1 leading-snug">
              {product.name}
            </h1>

            {/* Rating & Stock */}
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1 text-amber-500 font-semibold text-xs">
                <Star className="w-4 h-4 fill-current" />
                <span>{product.rating}</span>
                <span className="text-charcoal-400 font-normal">({product.review_count} verified reviews)</span>
              </div>
              <span className="text-charcoal-300">·</span>
              <span className={`text-xs font-medium ${product.stock_quantity <= 15 ? 'text-amber-600 font-semibold' : 'text-emerald-700'}`}>
                {product.stock_quantity <= 15 ? `Low Stock (Only ${product.stock_quantity} left)` : 'In Stock'}
              </span>
            </div>
          </div>

          {/* Pricing */}
          <div className="p-4 bg-cream-50 rounded-xl border border-cream-200 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-charcoal-900 font-editorial">
              ₹{product.price.toLocaleString('en-IN')}
            </span>
            {product.original_price && product.original_price > product.price && (
              <span className="text-sm text-charcoal-400 line-through">
                ₹{product.original_price.toLocaleString('en-IN')}
              </span>
            )}
            <span className="text-xs text-charcoal-500 ml-auto">Inclusive of all taxes</span>
          </div>

          {/* Description */}
          <p className="text-xs text-charcoal-600 leading-relaxed">
            {product.description}
          </p>

          {/* Attributes */}
          <div className="grid grid-cols-2 gap-3 text-xs border-y border-cream-200 py-3">
            <div>
              <span className="text-charcoal-400 block text-[11px]">Colour</span>
              <span className="font-semibold text-charcoal-800">{product.colour}</span>
            </div>
            <div>
              <span className="text-charcoal-400 block text-[11px]">Material</span>
              <span className="font-semibold text-charcoal-800">{product.material || 'Organic Cotton'}</span>
            </div>
            <div>
              <span className="text-charcoal-400 block text-[11px]">Fit Type</span>
              <span className="font-semibold text-charcoal-800">{product.fit_type || 'Regular'}</span>
            </div>
            <div>
              <span className="text-charcoal-400 block text-[11px]">Occasion</span>
              <span className="font-semibold text-charcoal-800">{product.occasion || 'Casual'}</span>
            </div>
          </div>

          {/* Size Selector with AI Assistant Button */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-charcoal-700 uppercase tracking-wider">
                Select Size: <span className="text-brand font-extrabold">{selectedSize}</span>
              </label>

              {/* AI Size Assistant Trigger */}
              <button
                type="button"
                onClick={() => setSizeModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs text-brand hover:text-brand-dark font-semibold transition-colors"
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Fit & Size Assistant</span>
              </button>
            </div>

            {/* Size options */}
            <div className="flex flex-wrap gap-2">
              {product.sizes_available.map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setSelectedSize(sz)}
                  className={`min-w-[48px] py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all ${
                    selectedSize === sz
                      ? 'border-brand bg-brand text-white shadow-md'
                      : 'border-cream-300 bg-white text-charcoal-700 hover:border-cream-400'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Action CTA Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAddToCart}
              className="flex-1 py-4 px-6 bg-brand hover:bg-brand-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add to Shopping Bag</span>
            </button>

            <button
              onClick={() => setWishlisted(!wishlisted)}
              className={`p-4 rounded-xl border transition-colors ${
                wishlisted
                  ? 'border-red-200 bg-red-50 text-red-600'
                  : 'border-cream-300 bg-white text-charcoal-600 hover:bg-cream-100'
              }`}
              title="Add to Wishlist"
            >
              <Heart className={`w-5 h-5 ${wishlisted ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Delivery & Assurance Perks */}
          <div className="space-y-2 pt-2 text-xs text-charcoal-500">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-brand" />
              <span>Free express shipping on all orders above ₹1,500</span>
            </div>
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-brand" />
              <span>Hassle-free 15-day return guarantee & size exchange</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand" />
              <span>100% Genuine brand curated styling assurance</span>
            </div>
          </div>
        </div>
      </div>

      {/* Complete The Look Section for Current Product */}
      {completeLook && completeLook.outfit_items.length > 0 && (
        <section className="bg-white rounded-2xl border border-cream-300 p-8 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand uppercase tracking-wider">
                <Sparkles className="w-4 h-4" />
                <span>Outfit Synergy Recommendation</span>
              </div>
              <h2 className="text-2xl font-serif font-bold text-charcoal-900 mt-1">
                Complete The Look with This Piece
              </h2>
              <p className="text-xs text-charcoal-600 mt-1">
                {completeLook.styling_notes}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-charcoal-400 block">Total Ensemble</span>
              <span className="text-xl font-bold text-charcoal-900">
                ₹{completeLook.total_outfit_price.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            <div className="relative">
              <span className="absolute top-2 left-2 z-10 bg-charcoal-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                THIS ITEM
              </span>
              <ProductCard product={completeLook.primary_product} />
            </div>
            {completeLook.outfit_items.map((item) => (
              <div key={item.id} className="relative">
                <span className="absolute top-2 left-2 z-10 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  STYLED PAIRING
                </span>
                <ProductCard product={item} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Similar pieces */}
      {similarItems.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-serif font-bold text-charcoal-900">
              Similar Curations You May Like
            </h3>
            <Link to="/discover" className="text-xs font-semibold text-brand hover:underline">
              Browse Category →
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {similarItems.map((item) => (
              <ProductCard key={item.product.id} product={item.product} explanation={item.explanation} />
            ))}
          </div>
        </section>
      )}

      {/* Size Assistant Modal */}
      <SizeAssistantModal
        isOpen={sizeModalOpen}
        onClose={() => setSizeModalOpen(false)}
        productCategory={product.category}
        brand={product.brand}
        onApplySize={(sz) => setSelectedSize(sz)}
      />
    </div>
  )
}
