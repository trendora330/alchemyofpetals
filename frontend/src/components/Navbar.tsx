'use client';
import Link from 'next/link';
import { ShoppingCart, Leaf, LogOut, User } from 'lucide-react';
import useStore from '../app/store/useStore';

export default function Navbar() {
  const { user, logout, cartItems, cartTotal } = useStore();

  // Calculate total number of plant items currently in the basket arrays
  const totalItemsCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <nav className="bg-[#2D6A4F] text-white shadow-md">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        
        {/* Brand Logo Link */}
        <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
          <Leaf className="w-6 h-6 text-[#FEFAE0] fill-[#FEFAE0]" />
          <span className="font-serif text-xl font-bold tracking-tight text-white">
            Alchemy of Petals
          </span>
        </Link>

        {/* Action Controls Side */}
        <div className="flex items-center gap-6 font-medium text-sm">
          
          {user ? (
            <>
              {/* Live Status Summary */}
              <div className="hidden sm:flex items-center gap-1.5 text-green-100">
                <User className="w-4 h-4 text-[#FEFAE0]" />
                <span>Hi, {user.name.split(' ')[0]}</span>
              </div>

              {/* Basket Checkout Direct Target Link */}
              <Link 
                href="/checkout" 
                className="relative bg-[#1b4332] border border-green-700 rounded-xl px-4 py-2 flex items-center gap-2 hover:bg-opacity-80 transition-all text-white"
              >
                <ShoppingCart className="w-4 h-4 text-white" />
                <span className="text-white font-bold">Cart (₹{cartTotal})</span>
                
                {totalItemsCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[#C9184A] text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-white animate-bounce">
                    {totalItemsCount}
                  </span>
                )}
              </Link>

              {/* Session Terminate Button */}
              <button 
                onClick={logout}
                className="text-green-100 hover:text-[#E8A0BF] transition-colors flex items-center gap-1 font-medium"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Logout</span>
              </button>
            </>
          ) : (
            <Link 
              href="/login" 
              className="bg-[#FEFAE0] text-[#2D6A4F] font-bold px-5 py-2 rounded-xl hover:bg-opacity-90 transition-all"
            >
              Sign In 🌿
            </Link>
          )}

        </div>
      </div>
    </nav>
  );
}