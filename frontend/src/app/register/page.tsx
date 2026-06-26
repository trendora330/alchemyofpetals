'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '../lib/api';

export default function RegisterPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // 🚀 Sends the custom name, email, and password to the Express backend route
      const res = await api.post('/auth/register', { name, email, password });
      
      if (res.data.success) {
        setSuccess('Account registered successfully! Redirecting to login...');
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Registration failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-md border border-gray-200 max-w-md w-full">
        <h2 className="font-serif text-3xl font-bold text-gray-900 text-center mb-2">
          Create an Account
        </h2>
        <p className="text-gray-500 text-sm text-center mb-6">
          Join the nursery and start tracking your botanical selections.
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl mb-4 font-medium border border-red-100">
            ⚠️ {error}
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 text-emerald-600 text-sm p-3 rounded-xl mb-4 font-medium border border-emerald-100">
            🌿 {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-600 bg-gray-50 text-gray-900"
              placeholder="Gowri"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">
              Email Address
            </label>
            <input
              type="type"
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
              {loading ? 'Creating Account...' : 'Register 🌿'}
            </span>
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-green-700 font-semibold hover:underline">
            Sign In here
          </Link>
        </p>
      </div>
    </div>
  );
}