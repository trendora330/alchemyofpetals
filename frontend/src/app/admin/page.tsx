'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Plus, CheckCircle, XCircle, Leaf, RefreshCw, 
  DollarSign, Eye, CreditCard, Activity, Calendar, SlidersHorizontal 
} from 'lucide-react';
import api from '../lib/api';
import useStore from '../store/useStore';

export default function AdminDashboard() {
  const router = useRouter();
  const { user, token } = useStore();
  
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [metrics, setMetrics] = useState({
    totalInventoryValue: 0,
    estimatedVisits: 0,
    totalCatalogItems: 0,
    outOfStockCount: 0,
    salesTrendData: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    recentOrders: []
  });

  const [newPlant, setNewPlant] = useState({
    name: '', price: '', original_price: '', stock_quantity: '', difficulty: 'Easy', tags: '',
  });

  const fetchRealtimeDashboardData = async () => {
    try {
      const [productsRes, metricsRes] = await Promise.all([
        api.get('/products'),
        api.get('/admin/metrics')
      ]);

      setProducts(productsRes.data.products || []);
      setMetrics(metricsRes.data.metrics);
    } catch (err) {
      console.error('Failed to sync live operational board metrics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!token || user?.role !== 'admin') {
      router.push('/');
      return;
    }
    fetchRealtimeDashboardData();
  }, [token, user, router]);

  const handleCreatePlant = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...newPlant,
        price: Number(newPlant.price),
        original_price: newPlant.original_price ? Number(newPlant.original_price) : null,
        stock_quantity: Number(newPlant.stock_quantity),
        tags: newPlant.tags.split(',').map(t => t.trim()).filter(Boolean),
      };

      await api.post('/products', payload);
      alert('New plant variety successfully introduced! 🌸');
      setNewPlant({ name: '', price: '', original_price: '', stock_quantity: '', difficulty: 'Easy', tags: '' });
      fetchRealtimeDashboardData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update catalog listings.');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/products/${id}`, { is_available: !currentStatus });
      fetchRealtimeDashboardData();
    } catch (err) {
      alert('Could not update status toggles.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="font-bold text-[#2D6A4F] animate-pulse">Synchronizing Live Database Metrics... 🌿</div>
      </div>
    );
  }

  const totalStockItems = products.reduce((sum, p: any) => sum + p.stock_quantity, 0);
  const healthRatio = totalStockItems > 0 
    ? Math.round(((totalStockItems - metrics.outOfStockCount) / totalStockItems) * 100) 
    : 100;

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-gray-800 flex">
      {/* Sidebar Navigation */}
      <div className="w-64 bg-[#0F1E36] text-gray-300 min-h-screen flex flex-col p-4 shadow-xl hidden md:flex">
        <div className="flex items-center gap-3 px-2 py-4 border-b border-gray-700 mb-6">
          <Leaf className="w-6 h-6 text-[#4DFFB6]" />
          <span className="font-sans font-bold text-lg text-white tracking-wide">Alchemy Admin</span>
        </div>
        <nav className="space-y-1 flex-1">
          <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl bg-[#1E2E4A] text-white text-left">
            <SlidersHorizontal className="w-4 h-4 text-[#4DFFB6]" /> Dashboard
          </button>
          <button onClick={() => router.push('/')} className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl hover:bg-[#152642] hover:text-white transition-all text-left">
            <Leaf className="w-4 h-4" /> View Storefront
          </button>
        </nav>
      </div>

      {/* Main Workspace Frame */}
      <div className="flex-1 p-6 md:p-8 space-y-8 overflow-y-auto max-h-screen">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-white p-6 rounded-2xl border border-gray-200 shadow-sm gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Live Nursery Audit Panel</h1>
            <p className="text-gray-500 text-xs mt-0.5">Fetching genuine transactional totals directly from your connected Supabase records.</p>
          </div>
          <button 
            onClick={fetchRealtimeDashboardData}
            className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Pull Fresh Records
          </button>
        </div>

        {/* Dynamic Metric Grid Scoreboard */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/60">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Inventory Assets</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">₹{metrics.totalInventoryValue.toLocaleString('en-IN')}</h3>
              </div>
              <span className="p-2.5 bg-green-50 rounded-xl text-green-600"><DollarSign className="w-5 h-5" /></span>
            </div>
            <div className="text-xs text-green-600 font-bold mt-4 pt-3 border-t border-gray-50">● Live Supabase Valuation</div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/60">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Estimated Visits</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{metrics.estimatedVisits}</h3>
              </div>
              <span className="p-2.5 bg-blue-50 rounded-xl text-blue-600"><Eye className="w-5 h-5" /></span>
            </div>
            <div className="text-xs text-blue-600 font-bold mt-4 pt-3 border-t border-gray-50">+12% Standard Ratio Tracking</div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/60">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Catalog Variations</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{metrics.totalCatalogItems} Varieties</h3>
              </div>
              <span className="p-2.5 bg-purple-50 rounded-xl text-purple-600"><CreditCard className="w-5 h-5" /></span>
            </div>
            <div className="text-xs text-purple-600 font-bold mt-4 pt-3 border-t border-gray-50">Active Inventory Items</div>
          </div>

          <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-200/60">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Stock Operational Effect</p>
                <h3 className="text-2xl font-black text-gray-900 mt-1">{healthRatio}%</h3>
              </div>
              <span className="p-2.5 bg-amber-50 rounded-xl text-amber-600"><Activity className="w-5 h-5" /></span>
            </div>
            <div className="text-xs text-amber-700 font-medium mt-4 pt-3 border-t border-gray-50">{metrics.outOfStockCount} varieties completely depleted</div>
          </div>
        </div>

        {/* Live Graphical Charts Matrix */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200/80 space-y-6">
          <div className="flex justify-between items-center border-b pb-4 border-gray-100 text-sm font-bold">
            <span className="text-gray-900">Real-time Stock Sales Tracking Trend</span>
            <div className="flex items-center gap-1 text-gray-400 text-xs font-semibold bg-gray-50 px-3 py-1.5 border rounded-xl">
              <Calendar className="w-3.5 h-3.5" /> <span>2026 Season Analysis Range</span>
            </div>
          </div>

          <div className="h-44 flex items-end gap-3 pt-6 px-4 border-b border-gray-100 pb-2">
            {metrics.salesTrendData.map((heightPercentage, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <div className="w-full bg-blue-500 rounded-t-md transition-all duration-300 group-hover:bg-[#2D6A4F]" style={{ height: `${heightPercentage}%` }}></div>
                <span className="text-[10px] font-bold text-gray-400 uppercase font-mono">{['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][idx]}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Forms & Live Stock Rows Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 lg:col-span-4 h-fit">
            <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2"><Plus className="w-5 h-5" /> Introduce Variety</h2>
            <form onSubmit={handleCreatePlant} className="space-y-4 text-sm">
              <input type="text" required placeholder="Plant Variety Name" value={newPlant.name} onChange={(e) => setNewPlant({ ...newPlant, name: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-gray-50 outline-none text-sm"/>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" required placeholder="Price (₹)" value={newPlant.price} onChange={(e) => setNewPlant({ ...newPlant, price: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-gray-50 text-sm"/>
                <input type="number" required placeholder="Quantity" value={newPlant.stock_quantity} onChange={(e) => setNewPlant({ ...newPlant, stock_quantity: e.target.value })} className="w-full border rounded-xl px-3 py-2 bg-gray-50 text-sm"/>
              </div>
              <button type="submit" disabled={submitting} className="w-full bg-[#2D6A4F] text-white font-bold py-2.5 rounded-xl text-xs">{submitting ? 'Registering...' : 'Add Product'}</button>
            </form>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 lg:col-span-8 overflow-hidden p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Live Nursery Stock Sheets</h2>
            <div className="overflow-x-auto rounded-xl border flex-1">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="bg-gray-50 text-gray-400 font-bold text-[11px] uppercase tracking-wider"><th className="p-4">Variety Detail</th><th className="p-4">Price</th><th className="p-4">Stock Count</th><th className="p-4 text-center">Status</th></tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((plant: any) => (
                    <tr key={plant.id} className="hover:bg-gray-50/40">
                      <td className="p-4 font-bold text-gray-800">{plant.name}</td>
                      <td className="p-4 font-semibold text-gray-900">₹{plant.price}</td>
                      <td className="p-4"><span className="px-2 py-0.5 rounded bg-gray-50 font-bold text-xs">{plant.stock_quantity} units</span></td>
                      <td className="p-4 text-center">
                        <button onClick={() => toggleAvailability(plant.id, plant.is_available)}>{plant.is_available ? <CheckCircle className="w-5 h-5 text-green-600" /> : <XCircle className="w-5 h-5 text-gray-300" />}</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* LIVE INCOMING CUSTOMER ORDERS MATRIX */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Live Customer Order Queue</h2>
            <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg text-xs font-bold">
              {metrics.recentOrders?.length || 0} Total Orders
            </span>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-400 font-bold text-[11px] uppercase tracking-wider">
                  <th className="p-4">Customer Name / Contact</th>
                  <th className="p-4">Shipping Destination Address</th>
                  <th className="p-4">Total Paid</th>
                  <th className="p-4">Order Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {metrics.recentOrders?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-gray-400">No customer transactions recorded yet.</td>
                  </tr>
                ) : (
                  metrics.recentOrders?.map((order: any) => (
                    <tr key={order.id} className="hover:bg-gray-50/40 transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-900">{order.customer_name}</div>
                        <div className="text-xs text-gray-400 font-mono mt-0.5">{order.phone}</div>
                      </td>
                      <td className="p-4 text-gray-600 max-w-xs truncate">{order.delivery_address}</td>
                      <td className="p-4 font-bold text-gray-900">₹{order.total_amount}</td>
                      <td className="p-4">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                          order.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}