'use client';
import { useEffect, useState } from 'react';
import api from './lib/api'; 
import ProductCard from '@/components/ProductCard';

export default function HomePage() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/products')
      .then((res: { data: { products: any } }) => {
        setPlants(res.data.products);
        setLoading(false);
      })
      .catch((err: unknown) => {
        console.error('Error fetching plant data:', err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#FEFAE0] text-gray-900 selection:bg-green-200">
      {/* Hero Header Banner - Bright high-contrast background */}
      <header className="bg-[#2D6A4F] text-white py-16 px-4 text-center shadow-sm">
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3 text-white">
          Alchemy of Petals
        </h1>
        <p className="text-green-100 max-w-xl mx-auto text-sm md:text-base font-medium">
          Premium flowering Bougainvilleas, fragrant Roses, and healthy home varieties cultivated with care.
        </p>
      </header>

      {/* Main Grid View */}
      <main className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6 border-b border-gray-300 pb-2">
          Our Initial Garden Stock 🌿
        </h2>

        {loading ? (
          <div className="text-center py-12 text-gray-700 font-bold text-lg animate-pulse">
            Loading your mom's plants...
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {plants.map((plant: any) => (
              <ProductCard key={plant.id} product={plant} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}