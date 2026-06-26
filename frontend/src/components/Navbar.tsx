'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import { ShoppingCart, LogOut, History, User, Leaf, LogIn } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [cartCount, setCartCount] = useState<number>(0);
  const [userName, setUserName] = useState<string>('');

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alchemy-backend-kmjb.onrender.com';
  const API_URL = BASE_URL.endsWith('/api') ? BASE_URL.slice(0, -4) : BASE_URL;

  const synchronizeUserSession = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      
      // 🔒 IF NO TOKEN EXISTS: Force visitor state to clean logged-out mode instantly
      if (!token) {
        setIsLoggedIn(false);
        setUserName('');
        setCartTotal(0);
        setCartCount(0);
        return;
      }

      // If a token is found, verify it with your database backend API
      const response = await axios.get(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setIsLoggedIn(true);
        // 🔄 FIXED: Reading dynamically from response payload rather than hardcoding 'Dev'
        setUserName(response.data.userName || 'User'); 
        setCartTotal(response.data.total || 0);
        
        const items = response.data.cartItems || [];
        const count = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        setCartCount(count);
      }
    } catch (err) {
      console.error('Session token invalid or expired:', err);
      // If the backend rejects the token because it's fake or expired, clear it out!
      setIsLoggedIn(false);
      setUserName('');
    }
  };

  // Re-run session sync on every single page navigation change
  useEffect(() => {
    synchronizeUserSession();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    window.location.href = '/login';
  };

  return (
    <nav className="bg-[#1E3A2F] text-white shadow-md border-b border-[#152921] px-4 py-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Identity Logo */}
        <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight group">
          <Leaf className="w-6 h-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span>Alchemy of Petals</span>
        </Link>

        {/* Dynamic Navigation Options Control Block */}
        <div className="flex items-center gap-4 sm:gap-6 text-sm font-semibold">
          
          {isLoggedIn ? (
            <>
              {/* 👥 DISPLAY ONLY IF AUTHENTICATED: User Profile Greeting */}
              <div className="flex items-center gap-1.5 text-emerald-200 bg-[#152921] px-3 py-1.5 rounded-xl border border-emerald-900/30">
                <User className="w-3.5 h-3.5" />
                <span>Hi, {userName}</span>
              </div>

              {/* 📜 Order History Dashboard Link */}
              <Link 
                href="/orders" 
                className={`flex items-center gap-1.5 py-2 px-1 transition-colors hover:text-emerald-300 ${pathname === '/orders' ? 'text-emerald-400 underline underline-offset-4' : 'text-white'}`}
              >
                <History className="w-4 h-4" />
                <span className="hidden sm:inline">My Orders</span>
              </Link>

              {/* Shopping Basket Metric Action Button */}
              <Link 
                href="/checkout"
                className="bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-emerald-700/50 relative shadow-sm"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Cart (₹{cartTotal})</span>
                {cartCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#1E3A2F]">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Logout Trigger Option */}
              <button 
                type="button" 
                onClick={handleLogout}
                className="flex items-center gap-1 text-emerald-300 hover:text-red-400 transition-colors py-2 px-1 cursor-pointer font-bold"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden md:inline">Logout</span>
              </button>
            </>
          ) : (
            /* 🔓 DISPLAY ONLY IF ANONYMOUS/LOGGED OUT: Clean Entry Portal Link */
            <Link 
              href="/login" 
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 rounded-xl transition-all flex items-center gap-1.5 shadow-sm border border-emerald-500/50"
            >
              <LogIn className="w-4 h-4" />
              <span>Login / Register</span>
            </Link>
          )}

        </div>

      </div>
    </nav>
  );
}