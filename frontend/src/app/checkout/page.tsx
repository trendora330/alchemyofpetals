'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag, CreditCard, MapPin, User, Phone, Leaf, ArrowRight, Loader2 } from 'lucide-react';
import api from '../lib/api'; // 🔑 FIXED: Brought in missing api instance
import useStore from '../store/useStore'; // 🔑 FIXED: Hooks up global toast context state arrays

interface Product {
  id: string;
  name: string;
  price: number;
  images?: string[];
  image_url?: string;
  imageUrl?: string;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product?: Product;
}

export default function CheckoutPage() {
  const router = useRouter();
  
  // Zustand Global Store hooks
  const token = useStore((state) => state.token);
  const setCart = useStore((state) => state.setCart);
  const showToast = useStore((state) => state.showToast); // 🔑 FIXED: Pulled toast trigger

  // Local Page Component State Variables
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState<boolean>(false);

  // Delivery Form State Channels
  const [shippingDetails, setShippingDetails] = useState({
    recipientName: '',
    phoneNumber: '',
    deliveryAddress: '',
    city: '',
    pincode: ''
  });

  // Pull active cart data on load
  useEffect(() => {
    if (!token) {
      router.push('/login');
      return;
    }

    api.get('/cart')
      .then((res) => {
        if (res.data.success) {
          setCartItems(res.data.cartItems || []);
          setTotal(res.data.total || 0);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error syncing backend checkout layers:', err);
        showToast('Could not load your plant selections.', 'error');
        setLoading(false);
      });
  }, [token, router]);

  // Razorpay Transaction Gate Pipeline Insertion Routine
  const handleCheckoutPaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      showToast('Your checkout basket is empty! 🪴', 'info');
      return;
    }

    setIsProcessingPayment(true);

    try {
      // 1. Initialize custom payment order receipt sequence on Node Express backend
      const orderInitRes = await api.post('/cart/checkout', {
        amount: total,
        recipient_name: shippingDetails.recipientName,
        phone_number: shippingDetails.phoneNumber,
        delivery_address: shippingDetails.deliveryAddress,
        city: shippingDetails.city,
        pincode: shippingDetails.pincode
      });

      if (!orderInitRes.data.success) {
        throw new Error(orderInitRes.data.error || 'Order registration initialization failed.');
      }

      const { orderId, amount, currency, razorpayKeyId } = orderInitRes.data;

      // 2. Open standard window parameters options for the Razorpay Checkout SDK layout
      const options = {
        key: razorpayKeyId,
        amount: amount,
        currency: currency,
        name: 'Alchemy of Petals',
        description: 'Premium Botanical Garden Varieties',
        image: 'https://alchemy-of-petals-cyan.vercel.app/favicon.ico',
        order_id: orderId,
        
        // 🔒 SUCCESS TRANSACTION INTERACTION CHECKPOINT HOOK
        handler: async function (response: any) {
          try {
            // Confirm the incoming checkout sequence blocks signatures natively on our Node/Express server
            const saveOrderRes = await api.post('/cart/save-order', {
              order_id: orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              recipient_name: shippingDetails.recipientName,
              phone_number: shippingDetails.phoneNumber,
              delivery_address: shippingDetails.deliveryAddress,
              city: shippingDetails.city,
              pincode: shippingDetails.pincode,
              amount: total / 100, // Matching baseline database units
              items: cartItems
            });

            if (saveOrderRes.data.success) {
              // 🔄 FIXED: Dropped the old generic popup alert window for our gorgeous custom UI toast banner!
              showToast(`🎉 Order Placed and Archived Successfully! Payment ID: ${response.razorpay_payment_id}`, 'success');
              
              // Clear Zustand state caches 
              setCart([], 0);
              
              // Send the buyer home safely
              router.push('/');
            } else {
              throw new Error(saveOrderRes.data.error || 'Failed to archive payment receipt rows.');
            }
          } catch (verifyErr: any) {
            console.error(verifyErr);
            showToast(verifyErr.response?.data?.error || verifyErr.message || 'Payment validation failed.', 'error');
          }
        },
        prefill: {
          name: shippingDetails.recipientName,
          contact: shippingDetails.phoneNumber
        },
        theme: {
          color: '#2D6A4F'
        },
        modal: {
          ondismiss: function () {
            setIsProcessingPayment(false);
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();

    } catch (err: any) {
      console.error('Checkout validation workflow dropped error chains:', err);
      showToast(err.response?.data?.error || err.message || 'Could not instantiate transaction checkout gates.', 'error');
      setIsProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex flex-col items-center justify-center text-sm font-bold text-gray-500 gap-2">
        <Loader2 className="w-6 h-6 text-green-700 animate-spin" />
        Synchronizing shipping and active inventory structures...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-8">
        
        {/* Left Side: Delivery Details Form Input */}
        <div className="md:col-span-7 bg-white p-6 rounded-2xl shadow-sm border border-gray-200 space-y-6">
          <h2 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100">
            <MapPin className="text-[#2D6A4F] w-5 h-5" /> Shipping Details
          </h2>

          <form onSubmit={handleCheckoutPaymentSubmit} className="space-y-4 text-xs font-semibold uppercase tracking-wider text-gray-500">
            <div>
              <label className="block mb-1">Recipient Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input type="text" required value={shippingDetails.recipientName} onChange={(e) => setShippingDetails({ ...shippingDetails, recipientName: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-normal text-gray-900 lowercase first-letter:uppercase focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="Devanarayanan" />
              </div>
            </div>

            <div>
              <label className="block mb-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <input type="tel" required pattern="[0-9]{10}" value={shippingDetails.phoneNumber} onChange={(e) => setShippingDetails({ ...shippingDetails, phoneNumber: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-10 pr-4 py-3 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="9074123456" />
              </div>
            </div>

            <div>
              <label className="block mb-1">Nursery Delivery Address</label>
              <textarea required rows={3} value={shippingDetails.deliveryAddress} onChange={(e) => setShippingDetails({ ...shippingDetails, deliveryAddress: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600 resize-none" placeholder="House Name, Street Layout Details..." />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">City</label>
                <input type="text" required value={shippingDetails.city} onChange={(e) => setShippingDetails({ ...shippingDetails, city: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="Amaravati" />
              </div>
              <div>
                <label className="block mb-1">Pincode</label>
                <input type="text" required pattern="[0-9]{6}" value={shippingDetails.pincode} onChange={(e) => setShippingDetails({ ...shippingDetails, pincode: e.target.value })} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-normal text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-600" placeholder="522501" />
              </div>
            </div>

            <button type="submit" disabled={isProcessingPayment} className="w-full mt-4 bg-[#2D6A4F] text-white hover:bg-[#1b4332] active:scale-[0.99] font-bold py-4 rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer shadow-sm">
              {isProcessingPayment ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-white">Connecting Razorpay Systems...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4 text-white" />
                  <span className="text-white">Pay ₹{total} with Razorpay</span>
                  <ArrowRight className="w-4 h-4 text-white" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Side: Plant Selection Inventory Breakdown Summary */}
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
            <h2 className="font-serif text-xl font-bold text-gray-900 flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
              <ShoppingBag className="text-[#2D6A4F] w-5 h-5" /> Your Plant Selection
            </h2>

            <div className="space-y-4 max-h-[280px] overflow-y-auto pr-1">
              {cartItems.map((item) => {
                const imgSource = item.product?.images && item.product.images.length > 0 
                  ? item.product.images[0] 
                  : (item.product?.image_url || item.product?.imageUrl || '/placeholder-plant.jpg');

                return (
                  <div key={item.id} className="flex items-center justify-between gap-3 border-b border-gray-50 pb-3 last:border-none last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-50 border border-gray-100 rounded-xl overflow-hidden flex items-center justify-center flex-shrink-0">
                        <img src={imgSource} className="w-full h-full object-cover" alt="item photo" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900 line-clamp-1">{item.product?.name}</p>
                        <p className="text-xs text-gray-400 font-medium">Quantity: <span className="font-bold text-gray-600">×{item.quantity}</span></p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-gray-800">₹{(item.product?.price || 0) * item.quantity}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 mt-5 pt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Subtotal</span>
                <span>₹{total}</span>
              </div>
              <div className="flex justify-between text-gray-500 font-medium">
                <span>Logistics Delivery</span>
                <span className="text-emerald-600 font-bold flex items-center gap-0.5"><Leaf className="w-3.5 h-3.5"/> FREE</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between text-lg font-black text-gray-900">
                <span>Grand Total:</span>
                <span>₹{total}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}