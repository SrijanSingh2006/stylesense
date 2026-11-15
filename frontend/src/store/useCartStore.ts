import { recordCartEvent } from '../services/api'
import { useUserStore } from './useUserStore'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { CartItem, Product } from '../types'

interface CartState {
  items: CartItem[]
  addItem: (product: Product, size: string, quantity?: number) => void
  removeItem: (productId: number, size: string) => void
  updateQuantity: (productId: number, size: string, quantity: number) => void
  clearCart: () => void
  getTotal: () => number
  getItemCount: () => number
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      addItem: (product, size, quantity = 1) => {
        if (!Number.isInteger(quantity) || quantity < 1 || !product.active || product.stock_quantity < quantity || !product.sizes_available.includes(size)) return
        const user = useUserStore.getState()
        recordCartEvent({ customer_id: user.currentUser.id, session_id: user.sessionId, product_id: product.id, action: 'add', quantity, selected_size: size }).catch(() => {})
        set((state) => {
          const existing = state.items.find(
            (i) => i.product.id === product.id && i.selected_size === size
          )
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.product.id === product.id && i.selected_size === size
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            }
          }
          return {
            items: [...state.items, { product, quantity, selected_size: size }],
          }
        })
      },
      removeItem: (productId, size) => {
        set((state) => ({
          items: state.items.filter(
            (i) => !(i.product.id === productId && i.selected_size === size)
          ),
        }))
      },
      updateQuantity: (productId, size, quantity) => {
        if (!Number.isInteger(quantity)) return
        if (quantity <= 0) {
          get().removeItem(productId, size)
          return
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.product.id === productId && i.selected_size === size
              ? { ...i, quantity }
              : i
          ),
        }))
      },
      clearCart: () => set({ items: [] }),
      getTotal: () => {
        return get().items.reduce(
          (sum, i) => sum + i.product.price * i.quantity,
          0
        )
      },
      getItemCount: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0)
      },
    }),
    {
      name: 'stylesense-cart-storage',
    }
  )
)
