import { create } from "zustand";
import { persist } from "zustand/middleware";
import { api, recordCartEvent } from "../services/api";
import { useAuthStore, can, type AccountUser } from "../auth/state";
import { useUserStore } from "./useUserStore";
import type { CartItem, Product } from "../types";
export interface ServerCart {
  items: Array<CartItem & { id: number; available: boolean }>;
  subtotal: number;
  shipping: number;
  total: number;
}
interface CartState {
  items: Array<CartItem & { id?: number; available?: boolean }>;
  ownerUserId: number | null;
  mergeKey: string;
  syncing: boolean;
  error: string | null;
  connect: (user: AccountUser) => Promise<void>;
  reload: () => Promise<void>;
  resetLocal: () => void;
  addItem: (
    product: Product,
    size: string,
    quantity?: number,
  ) => Promise<boolean>;
  removeItem: (productId: number, size: string) => Promise<void>;
  updateQuantity: (
    productId: number,
    size: string,
    quantity: number,
  ) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}
export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      ownerUserId: null,
      mergeKey: crypto.randomUUID(),
      syncing: false,
      error: null,
      resetLocal: () =>
        set({
          items: [],
          ownerUserId: null,
          mergeKey: crypto.randomUUID(),
          syncing: false,
          error: null,
        }),
      connect: async (user) => {
        if (!can(user, "cart.manage")) {
          get().resetLocal();
          return;
        }
        set({ syncing: true, error: null });
        try {
          if (get().ownerUserId === null && get().items.length) {
            await api.post("/users/me/cart/merge", {
              merge_key: get().mergeKey,
              items: get().items.map((i) => ({
                product_id: i.product.id,
                selected_size: i.selected_size,
                quantity: i.quantity,
              })),
            });
          }
          const cart = (await api.get<ServerCart>("/users/me/cart")).data;
          if (useAuthStore.getState().user?.id === user.id)
            set({
              items: cart.items,
              ownerUserId: user.id,
              mergeKey: crypto.randomUUID(),
            });
        } catch {
          if (useAuthStore.getState().user?.id === user.id)
            set({
              error:
                "Your saved bag could not be synchronized. Retry before checking out.",
            });
        } finally {
          set({ syncing: false });
        }
      },
      reload: async () => {
        if (!useAuthStore.getState().user) return;
        const cart = (await api.get<ServerCart>("/users/me/cart")).data;
        set({ items: cart.items });
      },
      addItem: async (product, size, quantity = 1) => {
        if (get().syncing) return false;
        const user = useAuthStore.getState().user;
        if (
          user &&
          (!can(user, "cart.manage") || get().ownerUserId !== user.id)
        )
          return false;
        if (
          !Number.isInteger(quantity) ||
          quantity < 1 ||
          !product.active ||
          product.stock_quantity < quantity ||
          !product.sizes_available.includes(size)
        )
          return false;
        const existing = get().items.find(
          (i) => i.product.id === product.id && i.selected_size === size,
        );
        const total = (existing?.quantity || 0) + quantity;
        if (
          useAuthStore.getState().user &&
          get().ownerUserId === useAuthStore.getState().user?.id
        ) {
          try {
            const cart = (
              await api.put<ServerCart>("/users/me/cart/items", {
                product_id: product.id,
                selected_size: size,
                quantity: total,
              })
            ).data;
            set({ items: cart.items, error: null });
          } catch {
            return false;
          }
        } else {
          if (total > product.stock_quantity) return false;
          set({
            items: existing
              ? get().items.map((i) =>
                  i === existing ? { ...i, quantity: total } : i,
                )
              : [...get().items, { product, quantity, selected_size: size }],
          });
        }
        const state = useUserStore.getState();
        recordCartEvent({
          customer_id: state.currentUser.id || null,
          session_id: state.sessionId,
          product_id: product.id,
          action: "add",
          quantity,
          selected_size: size,
        }).catch(() => {});
        return true;
      },
      removeItem: async (productId, size) => {
        const item = get().items.find(
          (i) => i.product.id === productId && i.selected_size === size,
        );
        if (
          useAuthStore.getState().user &&
          get().ownerUserId === useAuthStore.getState().user?.id &&
          item?.id
        ) {
          const cart = (
            await api.delete<ServerCart>(`/users/me/cart/items/${item.id}`)
          ).data;
          set({ items: cart.items });
        } else
          set({
            items: get().items.filter(
              (i) => !(i.product.id === productId && i.selected_size === size),
            ),
          });
      },
      updateQuantity: async (productId, size, quantity) => {
        if (!Number.isInteger(quantity)) return;
        if (quantity <= 0) return get().removeItem(productId, size);
        const item = get().items.find(
          (i) => i.product.id === productId && i.selected_size === size,
        );
        if (!item) return;
        if (
          useAuthStore.getState().user &&
          get().ownerUserId === useAuthStore.getState().user?.id
        ) {
          const cart = (
            await api.put<ServerCart>("/users/me/cart/items", {
              product_id: productId,
              selected_size: size,
              quantity,
            })
          ).data;
          set({ items: cart.items });
        } else
          set({
            items: get().items.map((i) =>
              i === item ? { ...i, quantity } : i,
            ),
          });
      },
      clearCart: async () => {
        if (
          useAuthStore.getState().user &&
          get().ownerUserId === useAuthStore.getState().user?.id
        )
          await api.delete("/users/me/cart");
        set({ items: [], error: null });
      },
      getTotal: () =>
        get().items.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    {
      name: "stylesense-cart-storage",
      partialize: (state) => ({
        items: state.ownerUserId ? [] : state.items,
        mergeKey: state.mergeKey,
      }),
    },
  ),
);
