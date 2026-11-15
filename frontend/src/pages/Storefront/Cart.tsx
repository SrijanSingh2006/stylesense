import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Truck,
} from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'
import { useUserStore } from '../../store/useUserStore'
import { createOrder } from '../../services/api'

export const CartPage: React.FC = () => {
  const { items, removeItem, updateQuantity, clearCart, getTotal } = useCartStore()
  const { currentUser, sessionId } = useUserStore()

  const [address, setAddress] = useState('Flat 402, Highline Residency, Indiranagar, Bengaluru - 560038')
  const [paymentMethod, setPaymentMethod] = useState('UPI / Credit Card')
  const [submitting, setSubmitting] = useState(false)
  const [orderConfirmed, setOrderConfirmed] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const subtotal = getTotal()
  const shipping = subtotal >= 1500 || subtotal === 0 ? 0 : 150
  const total = subtotal + shipping

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault()
    if (items.length === 0) return

    setSubmitting(true)
    setError(null)

    try {
      const orderPayload = {
        customer_id: currentUser.id,
        session_id: sessionId,
        items: items.map((i) => ({
          product_id: i.product.id,
          quantity: i.quantity,
          selected_size: i.selected_size,
        })),
      }

      const res = await createOrder(orderPayload)
      setOrderConfirmed(res)
      clearCart()
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          'Order processing failed. Transaction safely rolled back.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // Order Confirmation Success View
  if (orderConfirmed) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto shadow-inner animate-scale-up">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-bold uppercase tracking-widest text-emerald-700">
            Order Successfully Placed
          </span>
          <h1 className="text-3xl font-serif font-bold text-charcoal-900">
            Thank you, {currentUser.display_name.split(' ')[0]}!
          </h1>
          <p className="text-xs text-charcoal-500">
            Order Reference: <strong className="text-charcoal-800 font-mono">#{orderConfirmed.id}</strong> · Status: {orderConfirmed.status}
          </p>
        </div>

        <div className="p-6 bg-white rounded-2xl border border-cream-300 text-left space-y-4 shadow-sm">
          <div className="flex justify-between text-xs font-medium text-charcoal-600 border-b border-cream-200 pb-3">
            <span>Customer ID</span>
            <span className="font-semibold text-charcoal-900">{orderConfirmed.customer_id}</span>
          </div>
          <div className="flex justify-between text-xs font-medium text-charcoal-600 border-b border-cream-200 pb-3">
            <span>Total Paid</span>
            <span className="font-bold text-brand text-sm">₹{orderConfirmed.total_amount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-xs font-medium text-charcoal-600 border-b border-cream-200 pb-3">
            <span>Delivery Destination</span>
            <span className="font-medium text-charcoal-800 text-right max-w-xs truncate">{address}</span>
          </div>
          <div className="flex justify-between text-xs font-medium text-charcoal-600">
            <span>Inventory Status</span>
            <span className="text-emerald-700 font-semibold">Stock Decremented Transactionally</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            to="/discover"
            className="px-6 py-3 bg-brand hover:bg-brand-dark text-white text-xs font-semibold rounded-xl shadow"
          >
            Continue Shopping
          </Link>
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-white border border-cream-300 text-charcoal-800 text-xs font-semibold rounded-xl hover:bg-cream-100 shadow-sm"
          >
            Inspect Order in Analytics
          </Link>
        </div>
      </div>
    )
  }

  // Empty Bag View
  if (items.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-cream-200 text-charcoal-400 flex items-center justify-center mx-auto">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-serif font-bold text-charcoal-900">
          Your Shopping Bag is Empty
        </h2>
        <p className="text-xs text-charcoal-500 max-w-sm mx-auto leading-relaxed">
          Discover personalized fashion items curated according to your style preferences.
        </p>
        <Link
          to="/discover"
          className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-brand text-white text-xs font-semibold rounded-xl shadow-lg hover:bg-brand-dark transition-all"
        >
          <span>Start Exploring</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-serif font-bold text-charcoal-900">
          Your Shopping Bag
        </h1>
        <p className="text-xs text-charcoal-500 mt-1">
          {items.reduce((s, i) => s + i.quantity, 0)} items in your cart
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Left: Cart Items List */}
        <div className="lg:col-span-7 space-y-4">
          {items.map(({ product, quantity, selected_size }) => (
            <div
              key={`${product.id}-${selected_size}`}
              className="p-4 bg-white rounded-2xl border border-cream-300 shadow-sm flex gap-4 items-center"
            >
              <img
                src={product.image_url || 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=200&auto=format&fit=crop&q=80'}
                alt={product.name}
                className="w-20 h-24 object-cover rounded-xl bg-cream-200 shrink-0"
              />

              <div className="flex-1 min-w-0 space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-charcoal-500">
                  {product.brand}
                </span>
                <Link to={`/product/${product.id}`} className="block">
                  <h3 className="text-xs font-semibold text-charcoal-900 hover:text-brand truncate">
                    {product.name}
                  </h3>
                </Link>
                <div className="text-xs text-charcoal-500">
                  Size: <strong className="text-charcoal-800">{selected_size}</strong> · Colour: {product.colour}
                </div>
                <div className="text-xs font-bold text-charcoal-900 pt-1">
                  ₹{(product.price * quantity).toLocaleString('en-IN')}
                  {quantity > 1 && (
                    <span className="text-[11px] font-normal text-charcoal-400 ml-1">
                      (₹{product.price} each)
                    </span>
                  )}
                </div>
              </div>

              {/* Quantity Controls & Remove */}
              <div className="flex flex-col items-end gap-3 shrink-0">
                <button
                  onClick={() => removeItem(product.id, selected_size)}
                  className="text-charcoal-400 hover:text-red-500 p-1"
                  title="Remove item"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                <div className="flex items-center border border-cream-300 rounded-lg bg-cream-50 overflow-hidden">
                  <button
                    onClick={() => updateQuantity(product.id, selected_size, quantity - 1)}
                    className="p-1.5 hover:bg-cream-200 text-charcoal-600"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-2.5 text-xs font-semibold text-charcoal-800">
                    {quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(product.id, selected_size, quantity + 1)}
                    className="p-1.5 hover:bg-cream-200 text-charcoal-600"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right: Checkout Box */}
        <div className="lg:col-span-5">
          <form
            onSubmit={handleCheckout}
            className="p-6 bg-white rounded-2xl border border-cream-300 shadow-sm space-y-5 sticky top-24"
          >
            <h2 className="text-base font-serif font-bold text-charcoal-900 border-b border-cream-200 pb-3">
              Order Summary & Simulated Checkout
            </h2>

            {/* Price breakdown */}
            <div className="space-y-2.5 text-xs text-charcoal-600">
              <div className="flex justify-between">
                <span>Subtotal ({items.reduce((s, i) => s + i.quantity, 0)} items)</span>
                <span className="font-medium text-charcoal-900">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span>Standard Delivery</span>
                <span>
                  {shipping === 0 ? (
                    <span className="text-emerald-700 font-semibold">FREE</span>
                  ) : (
                    `₹${shipping}`
                  )}
                </span>
              </div>
              <div className="border-t border-cream-200 pt-3 flex justify-between text-sm font-bold text-charcoal-900">
                <span>Total Amount</span>
                <span className="text-brand text-base font-editorial">₹{total.toLocaleString('en-IN')}</span>
              </div>
            </div>

            {/* Simulated Customer & Address details */}
            <div className="space-y-3 pt-3 border-t border-cream-200">
              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Active Shopper
                </label>
                <input
                  type="text"
                  disabled
                  value={`${currentUser.display_name} (ID: ${currentUser.id})`}
                  className="w-full p-2.5 text-xs bg-cream-100 border border-cream-300 rounded-lg text-charcoal-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Delivery Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={2}
                  required
                  className="w-full p-2.5 text-xs bg-white border border-cream-300 rounded-lg text-charcoal-800 focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-charcoal-700 uppercase tracking-wider mb-1">
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full p-2.5 text-xs bg-white border border-cream-300 rounded-lg text-charcoal-800"
                >
                  <option value="UPI / Instant Bank">UPI Instant Transfer (Simulated)</option>
                  <option value="Credit Card">Credit / Debit Card (Simulated)</option>
                  <option value="COD">Cash on Delivery</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 bg-brand hover:bg-brand-dark text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {submitting ? 'Placing Order & Decrementing Inventory...' : `Complete Order · ₹${total.toLocaleString('en-IN')}`}
            </button>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-charcoal-400 text-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Simulated local transaction · Safe rollback on stock limit</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
