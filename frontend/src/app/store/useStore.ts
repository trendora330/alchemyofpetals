import { create } from 'zustand';

interface UserProfile {
  id: string;
  email: string;
  role: string;
  name?: string;
  user_metadata?: {
    name?: string;
    full_name?: string;
    role?: string;
  };
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: any;
}

interface StoreState {
  user: UserProfile | null;
  token: string | null;
  cartItems: CartItem[];
  cartTotal: number;
  setSession: (user: UserProfile | null, token: string | null) => void;
  setCart: (items: CartItem[], total: number) => void;
  clearSession: () => void;
}

const useStore = create<StoreState>((set) => {
  // Safely grab initial values from browser local storage to prevent state flashes
  const initialToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const initialUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  
  let initialUser: UserProfile | null = null;
  try {
    if (initialUserRaw) {
      initialUser = JSON.parse(initialUserRaw);
    }
  } catch (e) {
    console.error("Failed parsing initial session user details metadata:", e);
  }

  return {
    // Session State Layers
    user: initialUser,
    token: initialToken,
    
    // Cart Metric Storage Containers
    cartItems: [],
    cartTotal: 0,

    // 🔄 Update Session Setter to prevent hardcoded identity overrides
    setSession: (user, token) => {
      if (typeof window !== 'undefined') {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');

        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
      }

      // Process user object mapping to assign names gracefully
      const processedUser = user ? {
        ...user,
        // 🔑 THE FIX: Dynamic lookup cascade across registration fields
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.name || user.email?.split('@')[0] || 'User'
      } : null;

      set({ user: processedUser, token });
    },

    // Update global cart matrices concurrently
    setCart: (items, total) => set({ 
      cartItems: items || [], 
      cartTotal: Number(total) || 0 
    }),

    // Wipes out memory state caches upon triggering store logout loops
    clearSession: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      set({ user: null, token: null, cartItems: [], cartTotal: 0 });
    }
  };
});

export default useStore;