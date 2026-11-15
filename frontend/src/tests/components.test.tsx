import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { api } from '../services/api'
import { riceScore, discountPercent } from '../utils/commerce'
import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { ProductCard } from '../components/ui/ProductCard'
import { useCartStore } from '../store/useCartStore'
import { useUserStore } from '../store/useUserStore'
import type { Product } from '../types'

const mockProduct: Product = {
  id: 101,
  sku: 'SS-SHI-101',
  name: 'UrbanKnit Oxford Cotton Shirt',
  brand: 'UrbanKnit',
  category: 'Shirts',
  colour: 'White',
  price: 1899,
  original_price: 2499,
  sizes_available: ['S', 'M', 'L', 'XL'],
  size_chart: {},
  tags: ['casual', 'white'],
  rating: 4.6,
  review_count: 54,
  stock_quantity: 45,
  reorder_point: 15,
  active: true,
}

describe('StyleSense Frontend Component Tests', () => {
  beforeEach(() => {
    useCartStore.getState().resetLocal()
    useUserStore.getState().setCurrentUser({ id: 0, display_name: 'Guest', preferred_categories: [], preferred_colours: [], preferred_brands: [], budget_min: 0, budget_max: 1000 })
    api.defaults.adapter = async (config) => ({ data: [], status: 200, statusText: "OK", headers: {}, config })
  })

  it('renders ProductCard with brand, name, rating, and calculated discount', () => {
    render(
      <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}><BrowserRouter>
        <ProductCard product={mockProduct} explanation="Matches your preferred palette" />
      </BrowserRouter></QueryClientProvider>
    )

    expect(screen.getByText('UrbanKnit')).toBeDefined()
    expect(screen.getByText('UrbanKnit Oxford Cotton Shirt')).toBeDefined()
    expect(screen.getByText('4.6')).toBeDefined()
    expect(screen.getByText('24% OFF')).toBeDefined()
    expect(screen.getByText(/Matches your preferred palette/)).toBeDefined()
  })

  it('manages cart store addition, quantity updates, and total calculation', () => {
    const store = useCartStore.getState()
    expect(store.items.length).toBe(0)

    store.addItem(mockProduct, 'M', 2)
    const updated = useCartStore.getState()
    expect(updated.items.length).toBe(1)
    expect(updated.items[0].quantity).toBe(2)
    expect(updated.items[0].selected_size).toBe('M')
    expect(updated.getTotal()).toBe(1899 * 2)

    updated.updateQuantity(mockProduct.id, 'M', 3)
    expect(useCartStore.getState().items[0].quantity).toBe(3)
    expect(useCartStore.getState().getTotal()).toBe(1899 * 3)

    updated.removeItem(mockProduct.id, 'M')
    expect(useCartStore.getState().items.length).toBe(0)
  })

  it('starts anonymous and updates only the display profile', () => {
    const userStore = useUserStore.getState()
    expect(userStore.currentUser.display_name).toBe('Guest')
    expect(userStore.sessionId).toBeDefined()

    userStore.setCurrentUser({
      id: 2,
      display_name: 'Ananya Sharma',
      preferred_categories: ['Dresses', 'Footwear'],
      preferred_colours: ['Beige'],
      preferred_brands: ['VogueCraft'],
      budget_min: 1500,
      budget_max: 8000,
    })

    const newUser = useUserStore.getState().currentUser
    expect(newUser.id).toBe(2)
    expect(newUser.display_name).toBe('Ananya Sharma')
  })

  it('uses the same RICE function as the roadmap and validates inputs', () => {
    expect(riceScore(10000, 3, 80, 4)).toBe(6000)
    expect(riceScore(100, 2, 0, 1)).toBe(0)
    expect(() => riceScore(100, 2, 80, 0)).toThrow()
    expect(() => riceScore(100, 2, 101, 1)).toThrow()
  })
  it('uses the actual product discount calculation', () => {
    expect(discountPercent(1899, 2499)).toBe(24)
    expect(discountPercent(100, 100)).toBe(0)
    expect(discountPercent(100)).toBe(0)
  })
})
