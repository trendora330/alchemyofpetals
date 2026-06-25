'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Script from 'next/script'; // 🌸 Loads the external Razorpay Checkout SDK automatically
import { Minus, Plus, Trash2, ShoppingBag, Truck, Lock, CreditCard } from 'lucide-react';

interface ProductDetails {
  id: string;
  name: string;
  price: number;
  image_url?: string;
  imageUrl?: string;
}

interface CartItem {
  id: string;
  product_id: string;
  productId: string;
  quantity: number;
  product?: ProductDetails;
  products?: ProductDetails;
}

export default function CheckoutPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  const [shippingDetails, setShippingDetails] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    pincode: ''
  });

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alchemy-backend-kmjb.onrender.com';
  const API_URL = BASE_URL.endsWith('/api') ? BASE_URL.slice(0, -4) : BASE_URL;

  const fetchCart = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No active authentication token detected.');

      const response = await axios.get(`${API_URL}/api/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setCartItems(response.data.cartItems || []);
        setTotal(response.data.total || 0);
      }
    } catch (err: any) {
      console.error('Error fetching cart:', err);
      setError(err.response?.data?.error || 'Failed to populate plant selection items.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  const updateQuantity = async (productId: string, currentQty: number, delta: number, actionType?: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.post(
        `${API_URL}/api/cart`,
        {
          productId,
          quantity: delta,       
          action: actionType     
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Quantity modifier pipeline execution failure:', err);
    }
  };

  const removeItemCompletely = async (cartItemId: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.delete(`${API_URL}/api/cart/${cartItemId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        await fetchCart();
      }
    } catch (err) {
      console.error('Could not strip item from basket array:', err);
    }
  };

  // 💳 LAUNCH RAZORPAY TEST POPUP FLOW
  const handleRazorpayPayment = async () => {
    if (total <= 0 || cartItems.length === 0) return;
    
    // Optional basic validation to make sure your shipping form isn't empty
    if (!shippingDetails.name || !shippingDetails.phone || !shippingDetails.address) {
      alert('Please fill in your name, contact phone, and delivery address first!');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // 1. Tell Razorpay parameters to execute 
      // Razorpay mandates numbers in paise currency subunits (Amount * 100)
      const paymentOptions = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_T58hnFfDYthPem', // Fallback placeholder if env is syncing
        amount: total * 100, 
        currency: 'INR',
        name: 'Alchemy of Petals',
        description: 'Nursery Plant Order Checklist',
        image: 'https://alchemyofpetals-cyan.vercel.app/favicon.ico', // Optional thumbnail icon link
        handler: function (response: any) {
          // This callback handler fires upon a successful test payment execution
          alert(`🎉 Payment Successful!\nPayment ID: ${response.razorpay_payment_id}`);
          console.log('Razorpay Verification Response Hash:', response);
          
          // Redirect your mom to a beautiful landing or empty the database array here...
          setCartItems([]);
          setTotal(0);
        },
        prefill: {
          name: shippingDetails.name,
          contact: shippingDetails.phone,
          email: 'customer@alchemyofpetals.com'
        },
        notes: {
          address: `${shippingDetails.address}, ${shippingDetails.city} - ${shippingDetails.pincode}`
        },
        theme: {
          color: '#1E3A2F' // Matches your elegant dark-green header theme color code perfectly!
        }
      };

      // 2. Initialize the modal widget through the cast window interface to satisfy TypeScript check parameters
      const rzpWindow = window as any;
      if (rzpWindow.Razorpay) {
        const razorpayModalInstance = new rzpWindow.Razorpay(paymentOptions);
        razorpayModalInstance.open();
      } else {
        alert('Razorpay Checkout engine failed to load. Please verify your internet connection or check your adblocker.');
      }
    } catch (paymentError) {
      console.error('Payment checkout loop encounter error:', paymentError);
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center">
        <p className="text-gray-500 font-medium">Loading your green basket components...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      
      {/* Inject the official checkout overlay runtime bundle dynamically */}
      <Script id="razorpay-checkout-sdk" src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Card Item List */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#1E3A2F] flex items-center gap-2 mb-6">
              <ShoppingBag className="w-5 h-5" /> Your Plant Selection
            </h2>

            {cartItems.length === 0 ? (
              <p className="text-gray-400 text-center py-8">Your plant basket is empty.</p>
            ) : (
              <div className="space-y-4">
                {cartItems.map((item) => {
                  const product = item.product || item.products;
                  if (!product) return null;

                  return (
                    <div key={item.id} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                      <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center text-xs text-gray-400">
                          {product.image_url || product.imageUrl ? (
                            <img 
                              src={product.image_url || product.imageUrl} 
                              alt={product.name} 
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            '🪴'
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{product.name}</h3>
                          <p className="text-sm text-gray-400">₹{product.price} each</p>
                        </div>
                      </div>

                      {/* Interactive Counters */}
                      <div className="flex items-center gap-4">
                        <div className="flex items-center bg-gray-50 border border-gray-100 rounded-lg p-1 gap-2">
                          <button 
                            type="button" 
                            onClick={() => updateQuantity(product.id, item.quantity, -1, 'decrease')}
                            className="p-1 hover:bg-white rounded transition-colors text-gray-600 shadow-none"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-sm font-bold text-gray-700 px-1 w-4 text-center">{item.quantity}</span>
                          <button 
                            type="button" 
                            onClick={() => updateQuantity(product.id, item.quantity, 1, 'increase')}
                            className="p-1 hover:bg-white rounded transition-colors text-gray-600 shadow-none"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <span className="font-semibold text-gray-800 min-w-[3.5rem] text-right">
                          ₹{product.price * item.quantity}
                        </span>
                        <button 
                          type="button"
                          onClick={() => removeItemCompletely(item.id)}
                          className="text-gray-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Shipping Form Wrapper */}
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
            <h2 className="text-xl font-bold text-[#1E3A2F] mb-6">Shipping Details</h2>
            <form className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Recipient Name</label>
                <input 
                  type="text" 
                  value={shippingDetails.name}
                  onChange={(e) => setShippingDetails({...shippingDetails, name: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1E3A2F] transition-colors" 
                  placeholder="Dev Name" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone Number</label>
                <input 
                  type="text" 
                  value={shippingDetails.phone}
                  onChange={(e) => setShippingDetails({...shippingDetails, phone: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1E3A2F] transition-colors" 
                  placeholder="10-digit mobile number" 
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Nursery Delivery Address</label>
                <textarea 
                  rows={3}
                  value={shippingDetails.address}
                  onChange={(e) => setShippingDetails({...shippingDetails, address: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1E3A2F] transition-colors resize-none" 
                  placeholder="House No, Street name, Area, LandMark"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">City</label>
                  <input 
                    type="text" 
                    value={shippingDetails.city}
                    onChange={(e) => setShippingDetails({...shippingDetails, city: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1E3A2F] transition-colors" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Pincode</label>
                  <input 
                    type="text" 
                    value={shippingDetails.pincode}
                    onChange={(e) => setShippingDetails({...shippingDetails, pincode: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#1E3A2F] transition-colors" 
                    placeholder="PIN" 
                  />
                </div>
              </div>
            </form>
          </div>

        </div>

        {/* Right Column */}
        <div className="lg:col-span-5">
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm sticky top-6 space-y-6">
            <h2 className="text-xl font-bold text-[#1E3A2F]">Summary</h2>
            
            <div className="space-y-3 text-sm border-b border-gray-100 pb-4">
              <div className="flex justify-between text-gray-500">
                <span>Plant Basket Subtotal</span>
                <span className="font-semibold text-gray-800">₹{total}</span>
              </div>
              <div className="flex justify-between text-gray-500">
                <span>Delivery Logistics</span>
                <span className="font-bold text-green-600 flex items-center gap-1">
                  <Truck className="w-4 h-4" /> FREE
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-[#1E3A2F]">Grand Total:</span>
              <span className="text-2xl font-black text-[#1E3A2F]">₹{total}</span>
            </div>

            {/* Attached onClick Trigger Handler here */}
            <button 
              type="button"
              onClick={handleRazorpayPayment}
              disabled={cartItems.length === 0 || isProcessingPayment}
              className="w-full bg-[#1E3A2F] hover:bg-[#152921] disabled:bg-gray-200 text-white font-semibold py-4 rounded-xl transition-all shadow-sm hover:shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <CreditCard className="w-4 h-4" /> 
              {isProcessingPayment ? 'Connecting Sandbox...' : `Pay ₹${total} with Razorpay`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}