'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, Plus, Edit2, Printer, DollarSign, ListOrdered, ClipboardList, CheckCircle2 } from 'lucide-react';

export default function AdminDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedBill, setSelectedBill] = useState<any>(null);

  // New item addition form asset hooks state
  const [newPlant, setNewPlant] = useState({ name: '', price: '', image_url: '', stock: '10', description: '' });
  // Modification modal control asset selectors state
  const [editingPlant, setEditingPlant] = useState<any>(null);

  const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://alchemy-backend-kmjb.onrender.com';
  const API_URL = BASE_URL.endsWith('/api') ? BASE_URL.slice(0, -4) : BASE_URL;

  const refreshDashboardState = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_URL}/api/cart/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) setData(response.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { refreshDashboardState(); }, []);

  const handleCreateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post(`${API_URL}/api/cart/admin/products`, newPlant, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        alert('🪴 New Plant item injected successfully into active inventories!');
        setNewPlant({ name: '', price: '', image_url: '', stock: '10', description: '' });
        await refreshDashboardState();
      }
    } catch (err) { console.error(err); }
  };

  const handleUpdateProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await axios.put(`${API_URL}/api/cart/admin/products/${editingPlant.id}`, editingPlant, { headers: { Authorization: `Bearer ${token}` } });
      if (res.data.success) {
        alert('✏️ Catalog line item specifications successfully refreshed!');
        setEditingPlant(null);
        await refreshDashboardState();
      }
    } catch (err) { console.error(err); }
  };

  // 🖨️ SMART LABELS COMPONENT PRINT HANDLER ROUTINE
  const triggerStickyBillPrint = () => {
    const printContents = document.getElementById('sticky-parcel-bill-wrapper')?.innerHTML;
    if (!printContents) return;
    
    const originalBody = document.body.innerHTML;
    document.body.innerHTML = `
      <html>
        <head>
          <title>Parcel Packing Label Slip</title>
          <style>
            body { font-family: monospace; padding: 20px; color: #000; background: #fff; }
            .bill-box { border: 3px dashed #000; padding: 20px; max-width: 450px; margin: auto; }
            .title { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 15px; border-b: 2px solid #000; pb: 5px; }
            .section { margin-bottom: 12px; font-size: 14px; }
            .bold { font-weight: bold; }
            .item-line { display: flex; justify-content: space-between; font-size: 12px; border-bottom: 1px dotted #ccc; py: 2px; }
          </style>
        </head>
        <body>
          <div class="bill-box">${printContents}</div>
          <script>window.print(); setTimeout(() => { window.close(); }, 500);</script>
        </body>
      </html>
    `;
    window.print();
    // Restore layout dynamically right after print dialog context wraps execution processes
    window.location.reload();
  };

  if (loading) return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center font-medium text-gray-500">Compiling internal administration metrics summary registries...</div>;

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-10 px-4 sm:px-6 lg:px-8 font-sans text-gray-900">
      <div className="max-w-7xl mx-auto space-y-10">
        
        <div className="flex items-center justify-between border-b border-gray-200 pb-5">
          <h1 className="text-3xl font-black text-[#1E3A2F] flex items-center gap-2"><Package /> Core Store Hub Manager</h1>
          <span className="bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full border border-emerald-200 uppercase">Admin Access Secure Mode</span>
        </div>

        {/* 📊 SUMMARY METRICS MATRIX PANEL GRID COUNTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Gross Revenue</p><p className="text-2xl font-black text-[#1E3A2F] mt-1">₹{data?.metrics?.totalRevenue}</p></div>
            <div className="bg-emerald-50 text-[#1E3A2F] p-3 rounded-xl"><DollarSign className="w-6 h-6" /></div>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Orders Dispatched</p><p className="text-2xl font-black text-[#1E3A2F] mt-1">{data?.metrics?.totalOrders} Sales</p></div>
            <div className="bg-amber-50 text-amber-700 p-3 rounded-xl"><ListOrdered className="w-6 h-6" /></div>
          </div>
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm flex items-center justify-between">
            <div><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">In-Store Varietals</p><p className="text-2xl font-black text-[#1E3A2F] mt-1">{data?.metrics?.totalItemsInCatalog} Items</p></div>
            <div className="bg-blue-50 text-blue-700 p-3 rounded-xl"><ClipboardList className="w-6 h-6" /></div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* 🌿 LEFT SIDE COLUMN: INVENTORY TRACKER & ADD PLANT ASSORTMENT BUILDER FORM */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Create form wrapper item context line */}
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
              <h2 className="text-lg font-bold text-[#1E3A2F] mb-4 flex items-center gap-1.5"><Plus className="w-4 h-4" /> Add New Nursery Selection</h2>
              <form onSubmit={handleCreateProductSubmit} className="space-y-3 text-sm">
                <input type="text" placeholder="Botanical Item Name (e.g., Monstera Deliciosa)" value={newPlant.name} onChange={(e)=>setNewPlant({...newPlant, name:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#1E3A2F]" required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" placeholder="Price (₹)" value={newPlant.price} onChange={(e)=>setNewPlant({...newPlant, price:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#1E3A2F]" required />
                  <input type="number" placeholder="Stock Units" value={newPlant.stock} onChange={(e)=>setNewPlant({...newPlant, stock:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#1E3A2F]" required />
                </div>
                <input type="text" placeholder="Direct Plant Photo Link Image URL Address" value={newPlant.image_url} onChange={(e)=>setNewPlant({...newPlant, image_url:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#1E3A2F]" />
                <textarea rows={2} placeholder="Nursery growing notes and species overview descriptions..." value={newPlant.description} onChange={(e)=>setNewPlant({...newPlant, description:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-[#1E3A2F] resize-none" />
                <button type="submit" className="w-full bg-[#1E3A2F] text-white py-2.5 text-xs font-bold rounded-xl hover:bg-[#152921] transition-colors cursor-pointer">Inject Line Asset Into Storefront</button>
              </form>
            </div>

            {/* Editing Product Modal Block Configuration Inline overlay conditional toggle option line snippet */}
            {editingPlant && (
              <div className="bg-emerald-50 border border-emerald-200 p-6 rounded-2xl shadow-sm">
                <h2 className="text-lg font-bold text-[#1E3A2F] mb-4 flex items-center gap-1.5"><Edit2 className="w-4 h-4" /> Edit: {editingPlant.name}</h2>
                <form onSubmit={handleUpdateProductSubmit} className="space-y-3 text-sm">
                  <input type="text" value={editingPlant.name} onChange={(e)=>setEditingPlant({...editingPlant, name:e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs" required />
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" value={editingPlant.price} onChange={(e)=>setEditingPlant({...editingPlant, price:e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs" required />
                    <input type="number" value={editingPlant.stock} onChange={(e)=>setEditingPlant({...editingPlant, stock:e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs" required />
                  </div>
                  <input type="text" value={editingPlant.image_url || ''} onChange={(e)=>setEditingPlant({...editingPlant, image_url:e.target.value})} className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs" />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 bg-[#1E3A2F] text-white py-2 rounded-xl text-xs font-bold cursor-pointer">Update Plant</button>
                    <button type="button" onClick={()=>setEditingPlant(null)} className="bg-gray-200 text-gray-700 py-2 px-4 rounded-xl text-xs font-bold cursor-pointer">Cancel</button>
                  </div>
                </form>
              </div>
            )}

            {/* Inventory Listing List Layout block */}
            <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-4">
              <h2 className="text-md font-bold text-[#1E3A2F]">Live Plant Catalog Grid ({data?.products?.length})</h2>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                {data?.products?.map((prod: any) => (
                  <div key={prod.id} className="flex items-center justify-between border-b border-gray-50 pb-3 last:border-none last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-50 border border-gray-100 rounded-lg overflow-hidden flex items-center justify-center text-xs">
                        {prod.image_url || prod.imageUrl ? <img src={prod.image_url || prod.imageUrl} className="w-full h-full object-cover" /> : '🪴'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-800">{prod.name || prod.title}</p>
                        <p className="text-[11px] text-gray-400">Price: ₹{prod.price} | Stock: <span className="font-bold text-gray-600">{prod.stock ?? 10} units</span></p>
                      </div>
                    </div>
                    <button type="button" onClick={()=>setEditingPlant(prod)} className="p-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg text-gray-500 hover:text-[#1E3A2F] transition-colors cursor-pointer"><Edit2 className="w-3.5 h-3.5" /></button>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* 📦 RIGHT SIDE COLUMN: USER CUSTOMER ORDER FLOW INCOMING TRACKING FEED MODULES */}
          <div className="lg:col-span-7 bg-white border border-gray-100 p-6 rounded-2xl shadow-sm space-y-6">
            <h2 className="text-lg font-bold text-[#1E3A2F] flex items-center gap-1.5"><CheckCircle2 className="w-5 h-5 text-emerald-600" /> Dynamic Order Dispatch Feed Tracker</h2>
            
            <div className="space-y-4 max-h-[640px] overflow-y-auto pr-1">
              {data?.orders?.length === 0 ? (
                <p className="text-xs text-center py-12 text-gray-400 font-medium">No live completed customer check-outs recorded in backend data rows yet.</p>
              ) : (
                data?.orders?.map((order: any) => (
                  <div key={order.id} className="border border-gray-100 rounded-xl p-4 hover:bg-gray-50/50 transition-colors bg-white shadow-none space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-50 pb-2 flex-wrap gap-2">
                      <div>
                        <p className="text-xs font-black text-[#1E3A2F]">{order.recipient_name}</p>
                        <p className="text-[10px] font-mono text-gray-400 mt-0.5">Order Token ID: {order.order_id}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className="text-sm font-black text-[#1E3A2F]">₹{order.amount}</span>
                        {/* 🖨️ THE STICKY INVOICE BILL COMPILER BUTTON TRIGGER */}
                        <button 
                          type="button" 
                          onClick={() => setSelectedBill(order)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#1E3A2F] text-[11px] font-bold rounded-xl transition-all cursor-pointer shadow-none"
                        >
                          <Printer className="w-3 h-3" /> Generate Sticker Slip
                        </button>
                      </div>
                    </div>

                    <div className="text-[11px] text-gray-500 grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-lg border border-gray-100 font-medium">
                      <p><span className="font-bold text-gray-400">Phone:</span> {order.phone_number}</p>
                      <p className="sm:text-right"><span className="font-bold text-gray-400">Date:</span> {new Date(order.created_at).toLocaleDateString('en-IN')}</p>
                      <p className="sm:col-span-2"><span className="font-bold text-gray-400">Parcel Destination Address:</span> {order.delivery_address}, {order.city} - {order.pincode}</p>
                    </div>

                    <div className="text-[11px] pl-1 space-y-1">
                      <p className="font-bold text-gray-400 uppercase tracking-wider text-[10px] mb-1">Items Included:</p>
                      {order.items?.map((item: any, i: number) => (
                        <p key={i} className="text-gray-600 flex justify-between border-b border-dashed border-gray-100 pb-0.5 last:border-none">
                          <span>🪴 {item.product?.name || 'Assorted Nursery Botanical Selection'} <span className="font-black text-gray-400">×{item.quantity}</span></span>
                          <span className="font-semibold text-gray-500">₹{(item.product?.price || 0) * item.quantity}</span>
                        </p>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* =========================================================================
          🖨️ THE STICKY BILL THERMAL/STICKER BOX LABEL SIMULATOR MODAL POPUP WIDGET OVERLAY
          ========================================================================= */}
      {selectedBill && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 space-y-6">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-black text-[#1E3A2F] text-md flex items-center gap-1.5"><Printer className="w-4 h-4 text-emerald-600" /> Parcel Sticker Label Slip</h3>
              <button type="button" onClick={() => setSelectedBill(null)} className="text-gray-400 hover:text-gray-600 text-sm font-bold cursor-pointer bg-gray-50 p-1 px-2.5 rounded-xl border border-gray-200">Close</button>
            </div>

            {/* 📦 THE ISOLATED ELEMENT TO CAPTURE FOR CLEAN STICKY BOX PRINT PLACEMENT */}
            <div id="sticky-parcel-bill-wrapper" className="bg-white p-5 border-2 border-dashed border-gray-300 rounded-xl space-y-4 font-mono text-xs text-black">
              <div className="text-center font-bold text-sm tracking-wide border-b-2 border-black pb-2 uppercase">
                📦 ALCHEMY OF PETALS PARCEL 📦
              </div>
              
              <div className="space-y-1 border-b border-gray-200 pb-2">
                <p><span className="font-bold">TO:</span> <span className="text-sm font-black uppercase">{selectedBill.recipient_name}</span></p>
                <p><span className="font-bold">PHONE:</span> <span className="font-black">{selectedBill.phone_number}</span></p>
                <p className="leading-relaxed mt-1"><span className="font-bold">SHIPPING ADDRESS:</span><br />
                  <span className="font-semibold text-gray-800">{selectedBill.delivery_address}</span><br />
                  <span className="font-black uppercase">{selectedBill.city} - {selectedBill.pincode}</span>
                </p>
              </div>

              <div className="space-y-1 border-b border-gray-200 pb-2">
                <p className="font-bold uppercase text-[10px] tracking-wider text-gray-500 mb-1">PACKING CHECKLIST ARRAY:</p>
                {selectedBill.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex justify-between text-[11px]">
                    <span>[ ] {item.product?.name || 'Nursery Plant Selection'}</span>
                    <span className="font-bold">QTY: {item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between font-bold text-sm pt-1">
                <span>GRAND INVOICE VALUE:</span>
                <span>₹{selectedBill.amount}</span>
              </div>
              
              <div className="text-[9px] text-center text-gray-400 border-t border-dashed border-gray-300 pt-2 font-sans italic">
                Thank you for supporting green growers. Scan parcel upon delivery logistics arrival tracking lines.
              </div>
            </div>

            {/* Print Confirmation Actions Button Interface Row wrapper section content */}
            <button 
              type="button" 
              onClick={triggerStickyBillPrint}
              className="w-full bg-[#1E3A2F] text-white font-bold py-3 text-sm rounded-xl hover:bg-[#152921] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Execute Label Print to Sticky Sheet
            </button>

          </div>
        </div>
      )}
    </div>
  );
}