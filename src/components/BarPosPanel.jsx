import React, { useState } from 'react';
import { ArrowLeft, PauseCircle, Plus, X, CheckCircle, Search, Coffee, Tag } from 'lucide-react';
import CurrencyInput from './CurrencyInput';
import { formatRupiah } from '../utils/currencyHelpers';

export default function BarPosPanel({
  setIsNonRoomMode, heldBarBills, handleCreateNewBarBill, activeBarBillId, handleLoadHeldBill,
  handleDeleteHeldBill, barGuestName, setBarGuestName, products, barCart, setBarCart,
  fnbSubtotal, barPaymentMethod, setBarPaymentMethod, barAmountPaid, setBarAmountPaid,
  handleHoldCurrentBarBill, handleProcessNonRoomCheckout
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = products?.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (selectedCategory === 'all') return matchesSearch;
    return matchesSearch;
  }) || [];

  return (
    <div className="flex flex-col h-full justify-between">
      <div>
        {/* Header Bar */}
        <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-800">
          <div>
            <h2 className="text-2xl font-serif font-bold text-amber-400 flex items-center">
              <Coffee className="mr-2" size={24} /> Kasir Walk-In Bar
            </h2>
            <p className="text-xs text-gray-400">Transaksi makanan & minuman langsung (Tanpa Room)</p>
          </div>
          <button 
            onClick={() => setIsNonRoomMode(false)} 
            className="text-gray-300 hover:text-white flex items-center text-xs bg-gray-800 border border-gray-700 px-3 py-2 rounded-xl font-bold transition-all"
          >
            <ArrowLeft size={14} className="mr-1.5"/> Tutup Bar
          </button>
        </div>

        {/* Pesanan Gantung (Hold Bills) */}
        <div className="mb-4 bg-black/40 p-3.5 rounded-2xl border border-gray-800/90">
          <div className="flex justify-between items-center mb-2.5">
            <span className="text-xs font-bold text-amber-400 flex items-center">
              <PauseCircle size={15} className="mr-1.5"/> Pesanan Gantung ({heldBarBills.length})
            </span>
            <button 
              onClick={handleCreateNewBarBill}
              className="text-xs font-bold px-3 py-1.5 bg-amber-900/60 hover:bg-amber-800 border border-amber-700 text-amber-300 rounded-xl flex items-center transition-all shadow-sm"
            >
              <Plus size={13} className="mr-1"/> Tagihan Baru
            </button>
          </div>

          {heldBarBills.length > 0 ? (
            <div className="flex space-x-2.5 overflow-x-auto pb-1">
              {heldBarBills.map(bill => {
                const isEditing = activeBarBillId === bill.id;
                const itemsQty = Object.values(bill.cart || {}).reduce((a, b) => a + b, 0);

                return (
                  <div
                    key={bill.id}
                    onClick={() => handleLoadHeldBill(bill)}
                    className={`flex-shrink-0 p-3 rounded-xl border cursor-pointer transition-all min-w-[140px] ${
                      isEditing 
                        ? 'bg-amber-950/90 border-amber-500 ring-2 ring-amber-500/30' 
                        : 'bg-[#181d24] border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-xs text-white truncate max-w-[95px]">{bill.guestName}</p>
                      <button onClick={(e) => handleDeleteHeldBill(bill.id, e)} className="text-gray-500 hover:text-red-400 p-0.5"><X size={13}/></button>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-gray-400 mt-1.5">
                      <span>{bill.createdAt}</span>
                      <span className="font-bold text-amber-300">{itemsQty} item</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-gray-500 italic">Belum ada pesanan gantung tersimpan.</p>
          )}
        </div>

        {/* Input Nama Tamu */}
        <div className="mb-4">
          <label className="block text-xs font-bold mb-1.5 text-gray-300">Atas Nama Tamu / Meja (Opsional)</label>
          <input 
            type="text" 
            value={barGuestName} 
            onChange={e => setBarGuestName(e.target.value)} 
            className="w-full border rounded-xl p-3 text-sm font-semibold bg-[#12161b] border-gray-700 text-white outline-none focus:border-amber-500 transition-colors" 
            placeholder="Misal: Mas Budi / Meja Bar 2" 
          />
        </div>

        {/* Search & Selection F&B */}
        <div className="mb-3 flex space-x-2">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-3 text-gray-500"/>
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari minuman / makanan..."
              className="w-full bg-[#12161b] border border-gray-700 rounded-xl pl-9 pr-3 py-2 text-xs font-semibold text-white outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Lista Produk F&B */}
        <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
          {filteredProducts.map(p => {
            const q = barCart[p.id] || 0;
            return (
              <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border bg-[#181d24] border-gray-800 hover:border-gray-700 transition-all">
                <div>
                  <p className="font-bold text-sm text-white">{p.name}</p>
                  <p className="text-xs font-mono text-amber-400/90 font-semibold">{formatRupiah(p.sell_price)} <span className="text-gray-500 text-[11px] font-sans">| Stok: {p.stock}</span></p>
                </div>
                {/* Quantifier Buttons 40x40px */}
                <div className="flex items-center space-x-2.5">
                  <button 
                    onClick={() => setBarCart({...barCart, [p.id]: Math.max(0, q - 1)})} 
                    className="w-9 h-9 bg-gray-800 hover:bg-gray-700 active:scale-95 rounded-xl font-bold text-white text-base shadow flex items-center justify-center transition-all"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-base text-white">{q}</span>
                  <button 
                    onClick={() => {
                      if (p.stock <= q) return alert("Stok tidak mencukupi!");
                      setBarCart({...barCart, [p.id]: q + 1});
                    }} 
                    className="w-9 h-9 bg-amber-600 hover:bg-amber-500 active:scale-95 rounded-xl font-bold text-white text-base shadow flex items-center justify-center transition-all"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Summary & Payment Controls */}
      <div className="border-t pt-4 mt-4 border-gray-800 space-y-3 bg-[#161a20] p-4 rounded-2xl shadow-xl">
        <div className="flex justify-between items-center text-lg font-bold text-white">
          <span>Total Tagihan Bar:</span>
          <span className="text-amber-400 text-2xl font-mono font-extrabold">{formatRupiah(fnbSubtotal)}</span>
        </div>

        <div className="flex space-x-2">
          <button 
            onClick={() => setBarPaymentMethod('cash')} 
            className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-all ${barPaymentMethod === 'cash' ? 'bg-amber-600 border-amber-500 text-white shadow-lg' : 'bg-[#12161b] border-gray-700 text-gray-400'}`}
          >
            TUNAI (CASH)
          </button>
          <button 
            onClick={() => { setBarPaymentMethod('transfer'); setBarAmountPaid(fnbSubtotal); }} 
            className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-all ${barPaymentMethod === 'transfer' ? 'bg-amber-600 border-amber-500 text-white shadow-lg' : 'bg-[#12161b] border-gray-700 text-gray-400'}`}
          >
            TRANSFER / QRIS
          </button>
        </div>

        {barPaymentMethod === 'cash' && (
          <CurrencyInput 
            value={barAmountPaid} 
            onChange={val => setBarAmountPaid(val)} 
            placeholder="Nominal Uang Diterima Kasir..." 
            className="w-full border rounded-xl p-3 text-xl font-bold bg-[#12161b] border-gray-700 text-amber-400 outline-none text-right font-mono" 
          />
        )}

        <div className="flex space-x-2 pt-1">
          <button 
            onClick={handleHoldCurrentBarBill} 
            className="flex-1 py-3.5 bg-amber-900/60 hover:bg-amber-800 border border-amber-700 text-amber-300 font-bold rounded-xl flex items-center justify-center text-xs transition-all shadow-md active:scale-95"
          >
            <PauseCircle size={17} className="mr-1.5"/> SIMPAN GANTUNG
          </button>

          <button 
            onClick={handleProcessNonRoomCheckout} 
            className="flex-[1.6] py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center text-sm transition-all active:scale-95"
          >
            <CheckCircle size={18} className="mr-1.5"/> BAYAR & STRUK
          </button>
        </div>
      </div>
    </div>
  );
}