'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import axios from 'axios';
import { ShoppingCart, LogOut, History, User, Leaf } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [cartTotal, setCartTotal] = useState<number>(0);
  const [cartCount, setCartCount] = useState<number>(0);
  const [userName, setUserName] = useState<string>('Dev');

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alchemy-backend-kmjb.onrender.com';
  const API_URL = BASE_URL.endsWith('/api') ? BASE_URL.slice(0, -4) : BASE_URL;

  // Sync and fetch active cart aggregates to update navigation badges dynamically
  const fetchNavbarState = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCartTotal(response.data.total || 0);
        // Calculate total count of all plant units combined
        const items = response.data.cartItems || [];
        const count = items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
        setCartCount(count);
      }
    } catch (err) {
      console.error('Navbar status synchronization failure:', err);
    }
  };

  // Re-run status sync every time user alternates routes
  useEffect(() => {
    fetchNavbarState();
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <nav className="bg-[#1E3A2F] text-white shadow-md border-b border-[#152921] px-4 py-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand Logo Identity Link */}
        <Link href="/" className="flex items-center gap-2 text-xl font-black tracking-tight group">
          <Leaf className="w-6 h-6 text-emerald-400 group-hover:rotate-12 transition-transform" />
          <span>Alchemy of Petals</span>
        </Link>

        {/* Right Menu Interaction Control Matrix */}
        <div className="flex items-center gap-4 sm:gap-6 text-sm font-semibold">
          
          {/* User Profile Greeting Display */}
          <div className="flex items-center gap-1.5 text-emerald-200 bg-[#152921] px-3 py-1.5 rounded-xl border border-emerald-900/30">
            <User className="w-3.5 h-3.5" />
            <span>Hi, {userName}</span>
          </div>

          {/* 📜 NEW: Order History Dashboard Redirection Link */}
          <Link 
            href="/orders" 
            className={`flex items-center gap-1.5 py-2 px-1 transition-colors hover:text-emerald-300 ${pathname === '/orders' ? 'text-emerald-400 underline underline-offset-4' : 'text-white'}`}
          >
            <History className="w-4 h-4" />
            <span className="hidden sm:inline">My Orders</span>
          </Link>

          {/* Dynamic Interactive Cart Metric Display Overlay Badge */}
          <Link 
            href="/checkout"
            className="bg-emerald-800 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl transition-all flex items-center gap-2 border border-emerald-700/50 relative shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Cart (₹{cartTotal})</span>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-[#1E3A2F] animate-pulse">
                {cartCount}
              </span>
            )}
          </Link>

          {/* Session Destruction Trigger Option */}
          <button 
            type="button" 
            onClick={handleLogout}
            className="flex items-center gap-1 text-emerald-300 hover:text-red-400 transition-colors py-2 px-1 cursor-pointer font-bold"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Logout</span>
          </button>

        </div>

      </div>
    </nav>
  );
}