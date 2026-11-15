import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, Star, ShoppingBag, Eye } from 'lucide-react'
import type { Product } from '../../types'
import { useCartStore } from '../../store/useCartStore'

interface ProductCardProps {
  product: Product
  onQuickView?: (product: Product) => void
  explanation?: string
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onQuickView,
  explanation,
}) => {
  const [wishlisted, setWishlisted] = useState(false)
  const [addedAnimation, setAddedAnimation] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const size = product.sizes_available?.[0] || 'M'
    addItem(product, size, 1)
    setAddedAnimation(true)
    setTimeout(() => setAddedAnimation(false), 1200)
  }

  const discount = product.original_price && product.original_price > product.price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0

  return (
    <div className="group relative flex flex-col bg-white rounded-xl border border-cream-300 overflow-hidden hover:shadow-xl hover:border-brand/40 transition-all duration-300">
      {/* Image container */}
      <Link to={`/product/${product.id}`} className="relative aspect-[3/4] w-full overflow-hidden bg-cream-200 block">
        <img
          src={product.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=600&auto=format&fit=crop&q=80'}
          alt={product.name}
          className="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          {discount > 0 && (
            <span className="bg-brand text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
              {discount}% OFF
            </span>
          )}
          {product.stock_quantity <= 15 && product.stock_quantity > 0 && (
            <span className="bg-amber-600 text-white text-[10px] font-medium px-2 py-0.5 rounded-full shadow-sm">
              Only {product.stock_quantity} left
            </span>
          )}
        </div>

        {/* Action icons */}
        <button
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            setWishlisted(!wishlisted)
          }}
          className={`absolute top-2.5 right-2.5 p-2 rounded-full transition-all duration-200 ${
            wishlisted
              ? 'bg-red-50 text-red-600 shadow-md'
              : 'bg-white/80 text-charcoal-600 hover:bg-white hover:text-red-500'
          }`}
          title="Wishlist"
        >
          <Heart className={`w-4 h-4 ${wishlisted ? 'fill-current' : ''}`} />
        </button>

        {/* Quick Add Overlay on Hover */}
        <div className="absolute inset-x-2 bottom-2 hidden group-hover:flex gap-2">
          <button
            onClick={handleQuickAdd}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-medium text-white shadow-lg transition-all ${
              addedAnimation ? 'bg-emerald-700' : 'bg-charcoal-900 hover:bg-brand'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            {addedAnimation ? 'Added!' : 'Quick Add'}
          </button>
          {onQuickView && (
            <button
              onClick={(e) => {
                e.preventDefault()
                e.stopPropagation()
                onQuickView(product)
              }}
              className="p-2 rounded-lg bg-white/95 text-charcoal-800 hover:bg-white shadow-lg"
              title="Quick view"
            >
              <Eye className="w-4 h-4" />
            </button>
          )}
        </div>
      </Link>

      {/* Info content */}
      <div className="p-3.5 flex flex-col flex-1 justify-between">
        <div>
          <div className="flex items-center justify-between text-xs text-charcoal-500 mb-1">
            <span className="font-medium tracking-wide uppercase">{product.brand}</span>
            <div className="flex items-center gap-0.5 text-amber-500 font-semibold">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span>{product.rating}</span>
              <span className="text-charcoal-400 font-normal">({product.review_count})</span>
            </div>
          </div>

          <Link to={`/product/${product.id}`} className="block">
            <h3 className="text-sm font-medium text-charcoal-900 group-hover:text-brand line-clamp-1 transition-colors">
              {product.name}
            </h3>
          </Link>

          {explanation && (
            <p className="mt-1.5 text-[11px] text-brand-light bg-brand-muted/70 px-2 py-0.5 rounded font-medium flex items-center gap-1 line-clamp-1">
              <span>✦</span> {explanation}
            </p>
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-cream-200 flex items-baseline gap-2">
          <span className="text-sm font-bold text-charcoal-900">
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-charcoal-400 line-through">
              ₹{product.original_price.toLocaleString('en-IN')}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
