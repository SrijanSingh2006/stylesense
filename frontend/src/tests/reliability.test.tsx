import React from 'react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { api, createOrder, fetchProducts } from '../services/api'
import { CartPage } from '../pages/Storefront/Cart'
import { WishlistPage } from '../pages/Storefront/Wishlist'
import { DiscoverPage } from '../pages/Storefront/Discover'
import { SearchResultsPage } from '../pages/Storefront/SearchResults'
import { ProductCard } from '../components/ui/ProductCard'
import { errorMessage } from '../services/errors'
import { useCartStore } from '../store/useCartStore'
import { useUserStore } from '../store/useUserStore'
import { useAuthStore, type AccountUser } from '../auth/state'
import type { Product } from '../types'

const product: Product = { id: 1, sku: 'TEST', name: 'Test Cotton Shirt', brand: 'Test', category: 'Shirts', colour: 'Blue', price: 100,
  sizes_available: ['M'], size_chart: {}, tags: [], rating: 4, review_count: 1, stock_quantity: 5, reorder_point: 1, active: true }
function response(config: InternalAxiosRequestConfig, data: any) { return { config, data, headers: {}, status: 200, statusText: 'OK' } }
function failure(config: InternalAxiosRequestConfig, status: number | string) {
  return new AxiosError('Request failed', status === 'timeout' ? 'ECONNABORTED' : 'ERR_NETWORK', config, {},
    typeof status === 'number' ? { ...response(config, { detail: status === 422 ? [{ loc: ['body', 'quantity'], msg: 'Must be positive' }] : 'Unable to place order' }), status } : undefined)
}
function mount(node: React.ReactNode, path = '/') {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  return render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}>{node}</MemoryRouter></QueryClientProvider>)
}
beforeEach(() => {
  useAuthStore.getState().accept({ access_token: 'test-access', csrf_token: 'test-csrf', expires_in: 300, user: { id: 1, customer_id: 1, full_name: 'Test Customer', role: 'customer', permissions: ['cart.manage', 'wishlist.manage', 'addresses.manage'], onboarding_completed: true } as AccountUser })
  useCartStore.getState().resetLocal(); useCartStore.setState({ ownerUserId: 1 }); sessionStorage.clear()
  useUserStore.getState().setCurrentUser({ id: 1, display_name: 'Aarav Mehta', preferred_categories: [], preferred_colours: [], preferred_brands: [], budget_min: 0, budget_max: 1000 })
})
afterEach(cleanup)

describe('API error propagation and checkout integrity', () => {
  it.each([400,404,422,500,'network','timeout'])('preserves cart and input on checkout error %s', async (status) => {
    useCartStore.setState({ items: [{ product, selected_size: 'M', quantity: 1, id: 1 }] })
    api.defaults.adapter = async (config) => {
      if (config.url === '/users/me/checkout') throw failure(config, status)
      if (config.url === '/users/me/addresses') return response(config, [{ id: 1, full_name: 'Saved Recipient', address_line_1: 'Saved delivery address', city: 'Delhi', postal_code: '110001', is_default: true }])
      if (config.url === '/users/me/cart') return response(config, { items: useCartStore.getState().items })
      return response(config, {})
    }
    mount(<CartPage />)
    await screen.findByText('Saved Recipient')
    await waitFor(() => expect((screen.getByRole('button', { name: 'Continue to order review' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Continue to order review' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Continue to payment method' }))
    fireEvent.click(screen.getByLabelText('Cash on delivery demonstration'))
    fireEvent.click(screen.getByRole('button', { name: /Complete Order/ }))
    await waitFor(() => expect(screen.getByRole('button', { name: /Complete Order/ }).hasAttribute('disabled')).toBe(false))
    expect(screen.queryByText('Order Successfully Placed')).toBeNull()
    expect(useCartStore.getState().items).toHaveLength(1)
    expect((screen.getByLabelText('Cash on delivery demonstration') as HTMLInputElement).checked).toBe(true)
    expect(screen.getByText(status === 'timeout' ? /timed out/ : status === 'network' ? /Cannot reach/ : status === 422 ? /Must be positive/ : /Unable to place order/)).toBeDefined()
  })
  it('clears cart only after a real successful order response', async () => {
    useCartStore.setState({ items: [{ product, selected_size: 'M', quantity: 1, id: 1 }] })
    api.defaults.adapter = async (config) => response(config, config.url === '/users/me/checkout' ? { id: 42, customer_id: 1, total_amount: 100, status: 'COMPLETED' } : config.url === '/users/me/addresses' ? [{ id: 1, full_name: 'Recipient', is_default: true }] : config.url === '/users/me/cart' ? { items: useCartStore.getState().items } : {})
    mount(<CartPage />)
    await waitFor(() => expect((screen.getByRole('button', { name: 'Continue to order review' }) as HTMLButtonElement).disabled).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Continue to order review' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Continue to payment method' }))
    fireEvent.click(screen.getByRole('button', { name: /Complete Order/ }))
    await screen.findByText('Order Successfully Placed')
    expect(useCartStore.getState().items).toHaveLength(0)
  })
  it('never substitutes product data when the network fails', async () => {
    api.defaults.adapter = async (config) => { throw failure(config, 500) }
    await expect(fetchProducts()).rejects.toBeInstanceOf(AxiosError)
  })
  it('formats validation errors without rendering objects', () => {
    expect(errorMessage(failure({} as InternalAxiosRequestConfig, 422))).toBe('quantity: Must be positive')
  })
})

describe('Persistent wishlist at the network boundary', () => {
  it('adds, reloads, and removes a saved product through the API', async () => {
    let saved: Product[] = []
    api.defaults.adapter = async (config) => {
      if (config.url === '/users/me/cart/items') return response(config, { items: [{ id: 1, product, selected_size: 'M', quantity: 1 }] })
      if (config.method === 'put') saved = [product]
      if (config.method === 'delete') saved = []
      return response(config, saved)
    }
    const view = mount(<ProductCard product={product} />)
    await waitFor(() => expect(screen.getByRole('button', { name: 'Add to wishlist' }).hasAttribute('disabled')).toBe(false))
    fireEvent.click(screen.getByRole('button', { name: 'Add to wishlist' }))
    await screen.findByRole('button', { name: 'Remove from wishlist' })
    view.unmount()
    mount(<WishlistPage />)
    await screen.findByText('Test Cotton Shirt')
    fireEvent.click(screen.getByRole('button', { name: 'Add to bag' }))
    await waitFor(() => expect(useCartStore.getState().items).toHaveLength(1))
    fireEvent.click(screen.getByRole('button', { name: 'Remove from wishlist' }))
    await screen.findByText(/Your wishlist is empty/)
  })
  it('shows an actionable error instead of a fabricated empty wishlist', async () => {
    api.defaults.adapter = async (config) => { throw failure(config, 'network') }
    mount(<WishlistPage />)
    await screen.findByRole('button', { name: 'Retry' })
    expect(screen.queryByText(/Your wishlist is empty/)).toBeNull()
  })
})

describe('Discovery requests', () => {
  it('sends selected category and sort to the real API service', async () => {
    const requests: any[] = []
    api.defaults.adapter = async (config) => {
      if (config.url === '/products') requests.push(config.params)
      return response(config, config.url === '/products' ? { items: [], total: 0, pages: 1 } : [])
    }
    mount(<DiscoverPage />)
    fireEvent.click(screen.getByRole('button', { name: 'Shirts' }))
    await waitFor(() => expect(requests.some((r) => r.category === 'Shirts')).toBe(true))
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'price_asc' } })
    await waitFor(() => expect(requests.some((r) => r.sort_by === 'price_asc')).toBe(true))
  })
  it('uses the URL query in the search API payload', async () => {
    let query = ''
    api.defaults.adapter = async (config) => {
      if (config.url === '/search') query = JSON.parse(config.data).query
      return response(config, { items: [], total: 0, pages: 1, parsed_filters: { keywords: [] } })
    }
    mount(<SearchResultsPage />, '/search?q=black+sneakers+under+2500')
    await waitFor(() => expect(query).toBe('black sneakers under 2500'))
  })
})

describe('Dashboard data and filters', () => {
  it('renders actual API metrics and refetches when the date filter changes', async () => {
    const { OverviewPage } = await import('../pages/Analytics/Overview')
    const days: number[] = []
    api.defaults.adapter = async (config) => {
      if (config.url === '/analytics/overview') {
        days.push(config.params.days)
        return response(config, { total_revenue: 1234, average_order_value: 617, total_sessions: 20, unique_visitors: 10,
          total_orders: 2, conversion_rate: 10, cart_abandonment_rate: 50, return_rate: 0, repeat_customer_rate: 0, total_products_active: 1 })
      }
      if (config.url === '/analytics/north-star') return response(config, { north_star_value: 2, supporting_metrics: {}, metric_tree_description: 'Measured sessions' })
      return response(config, [])
    }
    mount(<OverviewPage />)
    await screen.findByText('₹1,234')
    expect(screen.getByText('Across 2 completed orders')).toBeDefined()
    fireEvent.click(screen.getByRole('button', { name: '7 Days' }))
    await waitFor(() => expect(days).toEqual([30, 7]))
  })
})
