import React from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../../hooks/useWishlist'
import { ProductCard } from '../../components/ui/ProductCard'
import { useCartStore } from '../../store/useCartStore'
export function WishlistPage() {
  const { products, isLoading, isError, refetch } = useWishlist()
  const addItem = useCartStore((s) => s.addItem)
  if (isLoading) return <p className="p-8">Loading your wishlist…</p>
  if (isError) return <div role="alert" className="p-8">Wishlist could not be loaded. <button onClick={() => refetch()}>Retry</button></div>
  return <main className="max-w-7xl mx-auto p-6 space-y-6">
    <h1 className="text-3xl font-serif">Your Wishlist</h1>
    {!products.length && <p>Your wishlist is empty. <Link className="underline" to="/discover">Discover products</Link></p>}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">{products.map((p) => <div key={p.id}>
      <ProductCard product={p} />
      <button disabled={!p.active || p.stock_quantity < 1 || !p.sizes_available.length} className="w-full p-3 bg-brand text-white rounded-lg mt-2 disabled:opacity-50"
        onClick={() => { addItem(p, p.sizes_available[0], 1) }}>{p.active && p.stock_quantity > 0 ? 'Add to bag' : 'Currently unavailable'}</button>
    </div>)}</div>
  </main>
}
