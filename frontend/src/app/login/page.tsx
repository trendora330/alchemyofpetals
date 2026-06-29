'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Mail, Lock, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import api from '../lib/api';
import useStore from '../store/useStore';

export default function LoginPage() {
  const router = useRouter();
  
  // Zustand state manager action layers
  const setSession = useStore((state) => state.setSession);
  const showToast = useStore((state) => state.showToast);

  // Local component form variables
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // 🔐 HANDLER: Triggers Supabase password reset link email transmission
  const handleForgotPasswordSubmit = async () => {
    if (!email) {
      showToast('Please type your email address into the input field first! ✉️', 'info');
      return;
    }

    try {
      // Points to a reset-password page on your frontend route shell layout
      const redirectUrl = `${window.location.origin}/reset-password`;
      
      // Request a recovery sequence directly from the authentication framework
      const res = await api.post('/auth/forgot-password', { 
        email, 
        redirectTo: redirectUrl 
      });

      if (res.data.success) {
        showToast('🔑 Secure password recovery link dispatched! Check your email inbox.', 'success');
      } else {
        throw new Error(res.data.error || 'Failed to dispatch recovery route links.');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || err.message || 'Could not instantiate recovery transmission pipelines.', 'error');
    }
  };

  // 🚀 HANDLER: Standard Email/Password Login routine
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await api.post('/auth/login', { email, password });
      
      if (res.data.success) {
        // Sync credentials into the global Zustand memory layer
        setSession(res.data.user, res.data.token);
        showToast(`Welcome back, ${res.data.user?.name || 'Gardener'}! 🌿`, 'success');
        
        // Push user to home directory storefront catalog matrix
        router.push('/');
      }
    } catch (err: any) {
      console.error(err);
      showToast(err.response?.data?.error || 'Invalid credentials profile configuration rules.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFAE0] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 font-sans text-gray-900 selection:bg-green-200">
      
      {/* Return to home button anchor container navigation header block */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-[#2D6A4F] transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Back to Nursery Catalog
      </Link>

      <div className="max-w-md w-full bg-white p-8 rounded-3xl shadow-md border border-gray-200 space-y-6">
        
        {/* Branding header configuration layer definitions */}
        <div className="text-center">
          <h2 className="font-serif text-3xl font-black text-gray-900 tracking-tight">
            Welcome Back
          </h2>
          <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mt-1.5">
            Log into your Alchemy of Petals account
          </p>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4 text-xs font-bold uppercase tracking-wider text-gray-500">
          
          {/* Email input field wrapper */}
          <div className="space-y-1">
            <label className="block">Email Address</label>
            <div className="relative font-normal normal-case">
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900"
                placeholder="grower@garden.com"
              />
            </div>
          </div>

          {/* Password input wrapper + integrated Forgot Password link button element layout */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label className="block">Password</label>
              
              {/* 🔑 FORGOT PASSWORD BUTTON */}
              <button
                type="button"
                onClick={handleForgotPasswordSubmit}
                className="text-[11px] font-black text-[#2D6A4F] hover:text-[#1b4332] lowercase first-letter:uppercase hover:underline cursor-pointer transition-colors"
              >
                Forgot Password?
              </button>
            </div>
            
            <div className="relative font-normal normal-case">
              <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-green-600 text-gray-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          {/* Submission action triggers selection button layout matrixes */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#2D6A4F] text-white hover:bg-[#1b4332] active:scale-[0.99] py-3.5 font-bold rounded-xl text-sm tracking-normal uppercase transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm cursor-pointer mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 text-white animate-spin" />
                <span className="text-white">Verifying credentials session maps...</span>
              </>
            ) : (
              <>
                <LogIn className="w-4 h-4 text-white" />
                <span className="text-white">Sign In to Account</span>
              </>
            )}
          </button>
        </form>

        {/* Alternative routing registration link anchors */}
        <div className="text-center border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-500 font-medium">
            New to the garden nursery stock?{' '}
            <Link 
              href="/register" 
              className="font-bold text-[#2D6A4F] hover:text-[#1b4332] hover:underline"
            >
              Create an Account
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}