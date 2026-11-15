import React from 'react'
import { Heart } from 'lucide-react'
import { useWishlist } from '../../hooks/useWishlist'
export function WishlistButton({ productId }: { productId: number }) {
  const { products, toggle, saving, isLoading, isError } = useWishlist()
  const saved = products.some((p) => p.id === productId)
  return <button type="button" aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={saved}
    disabled={saving || isLoading || isError} className={`p-2 rounded-full bg-white/90 ${saved ? 'text-red-600' : 'text-charcoal-600'}`}
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggle({ productId, saved }) }}>
    <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
  </button>
}
