'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Minus, Trash2, ShoppingBag } from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const { user, cartItems, cartTotal, setCart, token } = useStore();
  const [loading, setLoading] = useState(false);
  const [fetchingCart, setFetchingCart] = useState(true);
  
  const [address, setAddress] = useState({
    name: user?.name || '',
    phone: '',
    address_line: '',
    city: '',
    state: '',
    pincode: '',
  });

  // 1. Sync and fetch the user's real live database cart state on page mount
  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    api.get('/cart')
      .then((res) => {
        setCart(res.data.cartItems, res.data.total);
      })
      .catch((err) => console.error('Error synchronizing basket:', err))
      .finally(() => setFetchingCart(false));
  }, [token, setCart, router]);

  const shipping = cartTotal >= 500 || cartTotal === 0 ? 0 : 50;
  const grandTotal = cartTotal + shipping;

  // 2. Interactive Controls: Handle inline item additions/subtractions
  const updateQuantity = async (productId: string, currentQty: number, adjustment: number) => {
    const targetQty = currentQty + adjustment;
    if (targetQty <= 0) return;

    try {
      await api.post('/cart', { product_id: productId, quantity: targetQty });
      const res = await api.get('/cart');
      setCart(res.data.cartItems, res.data.total);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Could not update quantity allocation.');
    }
  };

  const removeLineItem = async (cartRowId: string) => {
    try {
      await api.delete(`/cart/${cartRowId}`);
      const res = await api.get('/cart');
      setCart(res.data.cartItems, res.data.total);
    } catch (err) {
      alert('Could not strip item from basket array.');
    }
  };

  // Razorpay injection helper script
  const loadScript = (src: string) => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.phone || !address.address_line || !address.pincode) {
      alert('Please fill out your delivery address and contact phone number! 📦');
      return;
    }

    setLoading(true);
    try {
      const orderRes = await api.post('/payments/create-order');
      const { order, key_id } = orderRes.data;

      const scriptLoaded = await loadScript('https://checkout.razorpay.com/v1/checkout.js');
      if (!scriptLoaded) {
        alert('Razorpay payment gateway client failed to load.');
        return;
      }

      const options = {
        key: key_id,
        amount: order.amount,
        currency: 'INR',
        name: 'Alchemy of Petals',
        description: 'Secure Plant Nursery Purchase 🌿🌸',
        order_id: order.id,
        handler: async function (response: any) {
          try {
            const verifyRes = await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              setCart([], 0);
              alert('Transaction Complete! Your plant order has been safely placed. 🎉');
              router.push('/');
            }
          } catch (verifyErr) {
            alert('Payment validation check failed.');
          }
        },
        prefill: {
          name: address.name,
          email: user?.email || '',
          contact: address.phone,
        },
        theme: { color: '#2D6A4F' },
      };

      const paymentWindow = new window.Razorpay(options);
      paymentWindow.open();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Could not instantiate payment checkout order.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingCart) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center">
        <div className="text-center font-bold text-[#2D6A4F] animate-pulse">Synchronizing Nursery Basket...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-gray-900 py-12 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Aspect: Dynamic Item List & Address Forms (Column Span: 7) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Dynamic Interactive Basket Content Layout */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-[#2D6A4F]" /> Your Plant Selection
            </h2>

            {cartItems.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <p className="mb-4">Your basket is empty.</p>
                <button onClick={() => router.push('/')} className="bg-[#2D6A4F] text-white px-4 py-2 rounded-xl text-sm font-bold">
                  Browse Garden
                </button>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto pr-2">
                {cartItems.map((item) => (
                  <div key={item.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <h4 className="font-serif font-bold text-gray-900 leading-tight">{item.products?.name}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">₹{item.products?.price} each</p>
                    </div>

                    {/* Quantity Selector Layout Node */}
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 border border-gray-200">
                      <button 
                        type="button" onClick={() => updateQuantity(item.product_id, item.quantity, -1)}
                        className="p-1 hover:bg-white rounded transition-colors text-gray-600"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-800">{item.quantity}</span>
                      <button 
                        type="button" onClick={() => updateQuantity(item.product_id, item.quantity, 1)}
                        className="p-1 hover:bg-white rounded transition-colors text-gray-600"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Line Total and Purge Row Target */}
                    <div className="text-right flex items-center gap-3">
                      <span className="font-bold text-gray-900 min-w-[50px]">
                        ₹{item.products ? item.products.price * item.quantity : 0}
                      </span>
                      <button 
                        type="button" onClick={() => removeLineItem(item.id)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Delivery Configuration Input Matrix */}
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200">
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4">Shipping Details</h2>
            <form onSubmit={handlePayment} id="checkout-form" className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Recipient Name</label>
                <input
                  type="text" required value={address.name}
                  onChange={(e) => setAddress({ ...address, name: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:ring-2 focus:ring-forest-600 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Phone Number</label>
                <input
                  type="tel" required placeholder="10-digit mobile number" value={address.phone}
                  onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 bg-gray-50 focus:ring-2 focus:ring-forest-600 outline-none text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nursery Delivery Address</label>
                <textarea
                  required placeholder="House No, Street name, Area, LandMark" value={address.address_line}
                  onChange={(e) => setAddress({ ...address, address_line: e.target.value })}
                  className="w-full border rounded-xl px-4 py-2.5 bg-gray-50 h-16 focus:ring-2 focus:ring-forest-600 outline-none text-sm"
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">City</label>
                  <input
                    type="text" required value={address.city}
                    onChange={(e) => setAddress({ ...address, city: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 bg-gray-50 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Pincode</label>
                  <input
                    type="text" required maxLength={6} placeholder="PIN" value={address.pincode}
                    onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                    className="w-full border rounded-xl px-4 py-2.5 bg-gray-50 text-sm"
                  />
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Right Aspect: Static Order Summary Layout Card (Column Span: 5) */}
        <div className="lg:col-span-5">
          <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-200 sticky top-6">
            <h2 className="font-serif text-2xl font-bold text-gray-900 mb-4">Summary</h2>
            <div className="border-b pb-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Plant Basket Subtotal</span>
                <span className="font-semibold text-gray-900">₹{cartTotal}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Delivery Logistics</span>
                <span className="font-semibold text-gray-900">{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
            </div>
            <div className="flex justify-between items-baseline pt-4 mb-6">
              <span className="font-serif text-lg font-bold text-gray-900">Grand Total:</span>
              <span className="text-2xl font-bold text-[#2D6A4F]">₹{grandTotal}</span>
            </div>

            <button
              type="submit" form="checkout-form" disabled={loading || cartTotal === 0}
              className="w-full bg-[#2D6A4F] text-white font-bold py-3.5 rounded-xl hover:bg-[#1b4332] transition-colors disabled:opacity-40 shadow-sm text-sm"
            >
              {loading ? 'Processing Securely...' : `🔒 Pay ₹${grandTotal} with Razorpay`}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}