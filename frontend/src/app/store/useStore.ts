import { create } from 'zustand';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    original_price: number;
    stock_quantity: number;
  };
}

interface StoreState {
  user: User | null;
  token: string | null;
  cartItems: CartItem[];
  cartTotal: number;
  setSession: (user: User | null, token: string | null) => void;
  setCart: (items: CartItem[], total: number) => void;
  logout: () => void;
}

const useStore = create<StoreState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  cartItems: [],
  cartTotal: 0,
  setSession: (user, token) => {
    set({ user, token });
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  },
  setCart: (cartItems, cartTotal) => set({ cartItems, cartTotal }),
  logout: () => {
    set({ user: null, token: null, cartItems: [], cartTotal: 0 });
    localStorage.removeItem('token');
  },
}));

export default useStore;