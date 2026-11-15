import React from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Heart } from 'lucide-react'
import { useWishlist } from '../../hooks/useWishlist'
export function WishlistButton({ productId }: { productId: number }) {
  const { products, toggle, saving, isLoading, isError, requiresLogin, allowed } = useWishlist()
  const navigate = useNavigate(), location = useLocation()
  if (!allowed) return null
  const saved = products.some((p) => p.id === productId)
  return <button type="button" aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} aria-pressed={saved}
    disabled={saving || (!requiresLogin && (isLoading || isError))} className={`p-2 rounded-full bg-white/90 ${saved ? 'text-red-600' : 'text-charcoal-600'}`}
    onClick={(e) => { e.preventDefault(); e.stopPropagation(); if (requiresLogin) navigate('/login', { state: { from: location.pathname + location.search } }); else toggle({ productId, saved }) }}>
    <Heart className={`w-5 h-5 ${saved ? 'fill-current' : ''}`} />
  </button>
}
