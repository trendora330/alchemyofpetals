'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ShoppingBag, Calendar, MapPin, Phone, User, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface OrderItem {
  id: string;
  quantity: number;
  product?: {
    name: string;
    price: number;
    image_url?: string;
  };
}

interface Order {
  id: string;
  payment_id: string;
  order_id: string;
  amount: number;
  recipient_name: string;
  phone_number: string;
  delivery_address: string;
  city: string;
  pincode: string;
  items: OrderItem[];
  created_at: string;
}

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alchemy-backend-kmjb.onrender.com';
  const API_URL = BASE_URL.endsWith('/api') ? BASE_URL.slice(0, -4) : BASE_URL;

  useEffect(() => {
    const fetchOrderHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_URL}/api/cart/history`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setOrders(response.data.orders || []);
        }
      } catch (err) {
        console.error('Error populating order history summaries:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading your plant purchase history...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation Link Back */}
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-[#1E3A2F] hover:underline">
            <ArrowLeft className="w-4 h-4" /> Back to Shop
          </Link>
          <h1 className="text-3xl font-black text-[#1E3A2F]">Order History</h1>
        </div>

        {orders.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-12 text-center shadow-sm space-y-4">
            <div className="text-4xl text-gray-300">🪴</div>
            <p className="text-gray-400 font-medium">You haven't placed any plant orders yet.</p>
            <Link href="/" className="inline-block bg-[#1E3A2F] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#152921]">
              Explore Plants
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
                
                {/* Order Top Summary Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-6 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-6 text-sm">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Date Placed</p>
                      <p className="font-semibold text-gray-700 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Reference</p>
                      <p className="font-mono text-xs text-gray-600 mt-1 bg-white border border-gray-200 px-2 py-0.5 rounded">
                        {order.payment_id}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Paid</p>
                    <p className="text-xl font-black text-[#1E3A2F]">₹{order.amount}</p>
                  </div>
                </div>

                {/* Content Layout Body */}
                <div className="p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
                  
                  {/* Left Column: List of items ordered */}
                  <div className="md:col-span-7 space-y-4 border-b md:border-b-0 md:border-r border-gray-100 pb-6 md:pb-0 md:pr-6">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                      <ShoppingBag className="w-3.5 h-3.5" /> Items Purchased
                    </h3>
                    
                    {order.items?.map((item, index) => {
                      const product = item.product;
                      return (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gray-50 rounded-lg flex items-center justify-center text-sm border border-gray-100">
                              {product?.image_url ? (
                                <img src={product.image_url} alt={product.name} className="w-full h-full object-cover rounded-lg" />
                              ) : (
                                '🪴'
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-gray-800">{product?.name || 'Unknown Plant'}</p>
                              <p className="text-xs text-gray-400">Qty: {item.quantity} × ₹{product?.price || 0}</p>
                            </div>
                          </div>
                          <span className="text-sm font-medium text-gray-700">
                            ₹{(product?.price || 0) * item.quantity}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Right Column: Destination Shipping Layout */}
                  <div className="md:col-span-5 space-y-3 text-sm text-gray-600">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                      <MapPin className="w-3.5 h-3.5" /> Shipping Address
                    </h3>
                    <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                      <p className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-gray-400" /> {order.recipient_name}
                      </p>
                      <p className="text-xs flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-gray-400" /> {order.phone_number}
                      </p>
                      <p className="text-xs text-gray-500 leading-relaxed mt-1 pl-5">
                        {order.delivery_address}, <br />
                        {order.city} - {order.pincode}
                      </p>
                    </div>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}