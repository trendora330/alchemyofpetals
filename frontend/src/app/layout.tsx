'use client';
import { useEffect, useState } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import api from './lib/api';
import useStore from './store/useStore';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { setSession, setCart, logout, token } = useStore();
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const initializeSession = async () => {
      // If no token exists in localStorage, skip sync and render immediately
      if (!token) {
        setHydrated(true);
        return;
      }

      try {
        // 1. Verify token validity directly against the backend session endpoint
        const userRes = await api.get('/auth/me');
        if (userRes.data.success) {
          setSession(userRes.data.user, token);
          
          // 2. Hydrate their active cart rows into memory
          const cartRes = await api.get('/cart');
          setCart(cartRes.data.cartItems, cartRes.data.total);
        }
      } catch (err) {
        console.error('Session expired or invalid token detected. Clearing storage.');
        logout(); // Safely clear compromised or old tokens
      } finally {
        setHydrated(true);
      }
    };

    initializeSession();
  }, [token, setSession, setCart, logout]);

  return (
    <html lang="en">
      <body className="bg-[#FEFAE0] text-gray-900 antialiased min-h-screen">
        {hydrated ? (
          <>
            <Navbar />
            <div>{children}</div>
          </>
        ) : (
          <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center">
            <div className="text-center font-bold text-[#2D6A4F] animate-pulse">
              Securing Connection... 🌿
            </div>
          </div>
        )}
      </body>
    </html>
  );
}