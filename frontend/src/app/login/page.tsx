'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../lib/api';
import useStore from '../store/useStore';

export default function LoginPage() {
  const router = useRouter();
  const setSession = useStore((state) => state.setSession);
  const setCart = useStore((state) => state.setCart);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    loading || setLoading(true);

    try {
      // 1. Submit email and password to the backend Express route
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.success) {
        // Save the dynamic token to local browser memory explicitly so navigation checks intercept it correctly
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', res.data.token);
        }

        // 2. Save the user data and token globally in the Zustand store
        setSession(res.data.user, res.data.token);
        
        // 3. Immediately pull their cart rows so the navbar counts update with genuine registration data rows
        try {
          const cartRes = await api.get('/cart');
          setCart(cartRes.data.cartItems, cartRes.data.total);
        } catch (cartErr) {
          console.error('Non-blocking error syncing user cart:', cartErr);
        }

        // 4. Smart redirect based on backend role configuration settings
        if (res.data.user?.role === 'admin' || res.data.user?.user_metadata?.role === 'admin') {
          router.push('/admin');
        } else {
          router.push('/');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Invalid email or password configuration.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200 max-w-md w-full">
        <h2 className="font-serif text-3xl font-bold text-gray-900 text-center mb-2">
          Welcome Back
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Log in to manage your garden selections.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 font-medium border border-red-100">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-gray-900"
              placeholder="name@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-gray-900"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2D6A4F] text-white hover:bg-[#1b4332] active:scale-[0.99] font-bold py-3.5 rounded-xl transition-all disabled:opacity-50 mt-2 shadow-sm flex items-center justify-center cursor-pointer"
          >
            <span className="text-white font-bold">
              {loading ? 'Logging you in...' : 'Sign In 🌿'}
            </span>
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          New to the shop?{' '}
          <Link href="/register" className="text-green-700 font-semibold hover:underline">
            Register here
          </Link>
        </p>
      </div>
    </div>
  );
}