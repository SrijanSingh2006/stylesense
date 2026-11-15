import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface DemoUser {
  id: number
  display_name: string
  preferred_categories: string[]
  preferred_colours: string[]
  preferred_brands: string[]
  budget_min: number
  budget_max: number
}

interface UserState {
  currentUser: DemoUser
  sessionId: string
  setCurrentUser: (user: DemoUser) => void
  resetSession: () => void
}

const DEFAULT_USER: DemoUser = {
  id: 1,
  display_name: 'Aarav Mehta',
  preferred_categories: ['Shirts', 'Jeans', 'Footwear'],
  preferred_colours: ['Black', 'Navy', 'Olive'],
  preferred_brands: ['UrbanKnit', 'Aura Denim', 'TerraSole'],
  budget_min: 1000,
  budget_max: 6000,
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: DEFAULT_USER,
      sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      setCurrentUser: (user) => set({ currentUser: user }),
      resetSession: () =>
        set({
          sessionId: `sess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        }),
    }),
    {
      name: 'stylesense-user-storage',
    }
  )
)
