import { create } from "zustand";
export interface DemoUser {
  id: number;
  display_name: string;
  preferred_categories: string[];
  preferred_colours: string[];
  preferred_brands: string[];
  budget_min: number;
  budget_max: number;
}
interface UserState {
  currentUser: DemoUser;
  sessionId: string;
  setCurrentUser: (user: DemoUser) => void;
  resetSession: () => void;
}
export const GUEST_USER: DemoUser = {
  id: 0,
  display_name: "Guest",
  preferred_categories: [],
  preferred_colours: [],
  preferred_brands: [],
  budget_min: 0,
  budget_max: 5000,
};
const newSession = () => `sess_${crypto.randomUUID()}`;
// User identity now comes only from the authenticated backend, never a persisted persona selector.
export const useUserStore = create<UserState>((set) => ({
  currentUser: GUEST_USER,
  sessionId: newSession(),
  setCurrentUser: (user) =>
    set((state) => ({
      currentUser: user,
      sessionId:
        state.currentUser.id === user.id ? state.sessionId : newSession(),
    })),
  resetSession: () => set({ sessionId: newSession() }),
}));
