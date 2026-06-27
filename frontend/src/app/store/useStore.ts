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

// 🍞 Toast structure mapping parameters
interface ToastConfig {
  message: string;
  type: 'success' | 'error' | 'info';
}

interface StoreState {
  user: UserProfile | null;
  token: string | null;
  cartItems: CartItem[];
  cartTotal: number;
  toast: ToastConfig | null; // 👈 Track active toast state
  setSession: (user: UserProfile | null, token: string | null) => void;
  setCart: (items: CartItem[], total: number) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void; // 👈 Trigger toast
  clearToast: () => void;
  clearSession: () => void;
}

const useStore = create<StoreState>((set) => {
  const initialToken = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const initialUserRaw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
  
  let initialUser: UserProfile | null = null;
  try {
    if (initialUserRaw) initialUser = JSON.parse(initialUserRaw);
  } catch (e) {
    console.error("Failed parsing initial session user details:", e);
  }

  return {
    user: initialUser,
    token: initialToken,
    cartItems: [],
    cartTotal: 0,
    toast: null, // Initial state holds no active alert blocks

    setSession: (user, token) => {
      if (typeof window !== 'undefined') {
        if (token) localStorage.setItem('token', token);
        else localStorage.removeItem('token');

        if (user) localStorage.setItem('user', JSON.stringify(user));
        else localStorage.removeItem('user');
      }

      const processedUser = user ? {
        ...user,
        name: user.user_metadata?.name || user.user_metadata?.full_name || user.name || user.email?.split('@')[0] || 'User'
      } : null;

      set({ user: processedUser, token });
    },

    setCart: (items, total) => set({ 
      cartItems: items || [], 
      cartTotal: Number(total) || 0 
    }),

    // ✨ NEW: Globally orchestrate custom alert dismissals
    showToast: (message, type = 'success') => {
      set({ toast: { message, type } });
    },

    clearToast: () => set({ toast: null }),

    clearSession: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      }
      set({ user: null, token: null, cartItems: [], cartTotal: 0, toast: null });
    }
  };
});

export default useStore;