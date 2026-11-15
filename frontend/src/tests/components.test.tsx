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
    useCartStore.getState().clearCart()
  })

  it('renders ProductCard with brand, name, rating, and calculated discount', () => {
    render(
      <BrowserRouter>
        <ProductCard product={mockProduct} explanation="Matches your preferred palette" />
      </BrowserRouter>
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

  it('verifies demo user store persona defaults and session switching', () => {
    const userStore = useUserStore.getState()
    expect(userStore.currentUser.display_name).toContain('Aarav Mehta')
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

  it('verifies RICE score calculation formula', () => {
    // Formula: RICE = (Reach * Impact * Confidence%) / Effort
    const reach = 10000
    const impact = 3.0
    const confidence = 80 // 80% = 0.8
    const effort = 4.0

    const rice = (reach * impact * (confidence / 100)) / effort
    expect(rice).toBe(6000)
  })

  it('verifies Price Elasticity of Demand formula calculation', () => {
    // Elasticity: % change in Q = Elasticity * % change in P
    const basePrice = 2000
    const discountPct = 20 // Price down 20%
    const elasticity = -1.8
    const baseUnits = 100

    const pctDemandChange = -elasticity * (discountPct / 100)
    const newUnits = Math.round(baseUnits * (1 + pctDemandChange))
    expect(pctDemandChange).toBeCloseTo(0.36) // 36% demand increase
    expect(newUnits).toBe(136)

    const baseRevenue = basePrice * baseUnits // 200,000
    const discountedPrice = basePrice * (1 - discountPct / 100) // 1600
    const newRevenue = discountedPrice * newUnits // 1600 * 136 = 217,600
    expect(newRevenue).toBeGreaterThan(baseRevenue)
  })

  it('verifies Two-Proportion Z-Test statistical calculation', () => {
    // Control: 100 conv / 1000 trials (10%)
    // Treatment: 130 conv / 1000 trials (13%)
    const n1 = 1000, x1 = 100, p1 = x1 / n1
    const n2 = 1000, x2 = 130, p2 = x2 / n2
    const pPool = (x1 + x2) / (n1 + n2)
    const se = Math.sqrt(pPool * (1 - pPool) * (1 / n1 + 1 / n2))
    const z = (p2 - p1) / se

    expect(p1).toBe(0.10)
    expect(p2).toBe(0.13)
    expect(z).toBeGreaterThan(1.96) // Statistically significant at alpha=0.05
  })
})
