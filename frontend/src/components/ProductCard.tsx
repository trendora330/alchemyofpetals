'use client';
import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import api from '../app/lib/api';
import useStore from '../app/store/useStore';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price: number;
  difficulty: string;
  tags: string[];
  images?: string[];
}

export default function ProductCard({ product }: { product: Product }) {
  const token = useStore((state) => state.token);
  const setCart = useStore((state) => state.setCart);
  const showToast = useStore((state) => state.showToast); // 👈 Pull toast trigger action
  const [adding, setAdding] = useState(false);

  const discount = product.original_price
    ? Math.round(((product.original_price - product.price) / product.original_price) * 100)
    : 0;

  const handleAddToCart = async () => {
    if (!token) {
      // 🔄 CHANGED: Chrome old popup replaced with custom error toast
      showToast('Please sign in or register to add premium varieties to your basket! 🌿', 'error');
      return;
    }

    setAdding(true);
    try {
      await api.post('/cart', { product_id: product.id, quantity: 1 });
      const cartRes = await api.get('/cart');
      setCart(cartRes.data.cartItems, cartRes.data.total);
      
      // 🔄 CHANGED: Replaced native alert with beautiful emerald success card
      showToast(`Added ${product.name} to your basket! 🌸`, 'success');
    } catch (err: any) {
      showToast(err.response?.data?.error || 'Could not append selected items.', 'error');
    } finally {
      setAdding(false);
    }
  };

  // ... keep your identical return UI elements down below!

  return (
    <div className="bg-white rounded-2xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 flex flex-col justify-between group">
      <div className="p-4">
        
        {/* Visual Container Box */}
        <div className="aspect-square bg-gray-100 rounded-xl mb-4 flex items-center justify-center relative border border-gray-200 overflow-hidden">
          {/* 📸 DYNAMIC ARRAY IMAGE RENDERER */}
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
              alt={product.name} 
            />
          ) : (
            <div className="text-gray-400 text-xs font-semibold">🪴 No Photo Available</div>
          )}

          {discount > 0 && (
            <span className="absolute top-2 left-2 bg-[#C9184A] text-white text-xs font-bold px-2 py-1 rounded-full z-10">
              {discount}% OFF
            </span>
          )}
        </div>

        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-900 font-bold border border-green-200">
          {product.difficulty} care
        </span>

        <h3 className="font-serif text-lg font-bold text-gray-900 mt-2 line-clamp-1">
          {product.name}
        </h3>

        <div className="flex gap-1 mt-2">
          {product.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="text-[11px] text-gray-600 bg-gray-100 font-medium px-2 py-0.5 rounded-full border border-gray-200">
              #{tag}
            </span>
          ))}
        </div>
      </div>

      <div className="p-4 pt-0">
        <div className="flex items-baseline gap-2 mb-3">
          <span className="text-xl font-bold text-gray-900">₹{product.price}</span>
          {product.original_price && (
            <span className="text-gray-500 line-through text-sm">₹{product.original_price}</span>
          )}
        </div>

        <button 
          onClick={handleAddToCart}
          disabled={adding}
          className="w-full bg-[#2D6A4F] text-white hover:bg-[#1b4332] active:scale-[0.98] py-3 rounded-xl transition-all flex items-center justify-center gap-2 font-bold text-sm disabled:opacity-60 shadow-sm cursor-pointer"
        >
          <ShoppingCart className="w-4 h-4 text-white" />
          <span className="text-white">
            {adding ? 'Adding Varieties...' : 'Add to Cart'}
          </span>
        </button>
      </div>
    </div>
  );
}