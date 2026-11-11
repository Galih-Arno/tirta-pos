import { useState } from 'react';
import { UserCheck, Wine, Plus, Check } from 'lucide-react';
import { formatRupiah } from '../utils/currencyHelpers';

export default function RoomCheckInForm({
  guestName,
  setGuestName,
  billingType,
  setBillingType,
  duration,
  setDuration,
  lcs,
  initialSelectedLcIds,
  setInitialSelectedLcIds,
  products,
  initialFnbCart,
  setInitialFnbCart,
  handleStartRoom
}) {
  // Modal Pop-Up Lokal Form Check-In
  const [showLcPicker, setShowLcPicker] = useState(false);
  const [showFnbPicker, setShowFnbPicker] = useState(false);
  const [searchFnb, setSearchFnb] = useState('');

  // Hitung Total Item F&B Terpilih di Awal
  const totalFnbSelectedCount = Object.values(initialFnbCart).reduce((sum, q) => sum + q, 0);

  const handleQtyChange = (productId, delta) => {
    setInitialFnbCart(prev => {
      const current = prev[productId] || 0;
      const updated = current + delta;
      if (updated <= 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }
      return { ...prev, [productId]: updated };
    });
  };

  const toggleLcSelection = (lcId) => {
    setInitialSelectedLcIds(prev => 
      prev.includes(lcId) ? prev.filter(id => id !== lcId) : [...prev, lcId]
    );
  };

  const filteredProducts = (products || []).filter(p => 
    p.name.toLowerCase().includes(searchFnb.toLowerCase())
  );

  return (
    <div className="bg-[#1a1f26] p-5 rounded-2xl border border-gray-800/80 shadow-lg space-y-5">
      {/* 1. INPUT NAMA TAMU */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          Nama Tamu / Pemesan <span className="text-rose-500">*</span>
        </label>
        <input 
          type="text" 
          placeholder="Tulis nama tamu..." 
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="w-full bg-[#0d0f12] border border-gray-700 focus:border-amber-500 rounded-xl px-4 py-3 text-white font-medium outline-none transition-all"
        />
      </div>

      {/* 2. MODE WAKTU */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-2">
          Mode Billing Waktu
        </label>
        <div className="grid grid-cols-2 gap-3 p-1 bg-[#0d0f12] rounded-xl border border-gray-800">
          <button 
            type="button"
            onClick={() => setBillingType('fixed')}
            className={`py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
              billingType === 'fixed' 
                ? 'bg-amber-500 text-black shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Paket Jam
          </button>
          <button 
            type="button"
            onClick={() => setBillingType('open')}
            className={`py-2.5 rounded-lg text-xs font-bold tracking-wide transition-all ${
              billingType === 'open' 
                ? 'bg-amber-500 text-black shadow-md' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Open Time
          </button>
        </div>
      </div>

      {/* 3. DURASI PAKET (HANYA MUNCUL JIKA FIXED) */}
      {billingType === 'fixed' && (
        <div className="flex items-center justify-between bg-[#0d0f12] p-3 rounded-xl border border-gray-800">
          <span className="text-xs font-bold uppercase text-gray-400">Durasi Paket Sewa</span>
          <div className="flex items-center space-x-3">
            <button 
              type="button"
              onClick={() => setDuration(Math.max(1, duration - 1))}
              className="w-8 h-8 rounded-lg bg-gray-800 text-amber-400 font-extrabold flex items-center justify-center hover:bg-gray-700 active:scale-95 transition-all"
            >
              -
            </button>
            <span className="text-base font-bold text-white w-12 text-center">{duration} Jam</span>
            <button 
              type="button"
              onClick={() => setDuration(duration + 1)}
              className="w-8 h-8 rounded-lg bg-gray-800 text-amber-400 font-extrabold flex items-center justify-center hover:bg-gray-700 active:scale-95 transition-all"
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* 4. TOMBOL PENTING: PILIH LC & F&B (MENAMPILKAN BADGE COUNT) */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <button 
          type="button"
          onClick={() => setShowLcPicker(true)}
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all ${
            initialSelectedLcIds.length > 0
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
              : 'bg-[#0d0f12] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}
        >
          <span className="flex items-center space-x-2">
            <UserCheck size={16} />
            <span>Pilih LC</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-gray-800 text-[10px] text-amber-400 font-extrabold">
            {initialSelectedLcIds.length} Terpilih
          </span>
        </button>

        <button 
          type="button"
          onClick={() => setShowFnbPicker(true)}
          className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-bold transition-all ${
            totalFnbSelectedCount > 0
              ? 'bg-amber-500/10 border-amber-500/50 text-amber-400'
              : 'bg-[#0d0f12] border-gray-800 text-gray-300 hover:border-gray-700'
          }`}
        >
          <span className="flex items-center space-x-2">
            <Wine size={16} />
            <span>Pilih F&B</span>
          </span>
          <span className="px-2 py-0.5 rounded-full bg-gray-800 text-[10px] text-amber-400 font-extrabold">
            {totalFnbSelectedCount} Terpilih
          </span>
        </button>
      </div>

      {/* 5. TOMBOL UTAMA: MULAI TIMER SEWA ROOM */}
      <button 
        type="button"
        onClick={handleStartRoom}
        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 mt-4"
      >
        <span>Mulai Timer Sewa Room</span>
      </button>

      {/* ========================================== */}
      {/* POP-UP MODAL 1: PEMILIHAN LC */}
      {/* ========================================== */}
      {showLcPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161a20] border border-gray-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white flex items-center space-x-2">
                <UserCheck size={18} className="text-amber-400" />
                <span>Pilih LC untuk Sesi Awal</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowLcPicker(false)}
                className="text-gray-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {lcs && lcs.length > 0 ? (
                lcs.map(lc => {
                  const isSelected = initialSelectedLcIds.includes(lc.id);
                  return (
                    <div 
                      key={lc.id}
                      onClick={() => toggleLcSelection(lc.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500 text-white' 
                          : 'bg-[#0d0f12] border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm text-white">{lc.name}</p>
                        <p className="text-[11px] text-gray-400">{formatRupiah(lc.hourly_rate_guest || 85000)}/jam</p>
                      </div>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
                        isSelected ? 'bg-amber-500 border-amber-500 text-black' : 'border-gray-700'
                      }`}>
                        {isSelected && <Check size={14} strokeWidth={3} />}
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-gray-500 py-4">Belum ada data LC di master.</p>
              )}
            </div>

            <button 
              type="button"
              onClick={() => setShowLcPicker(false)}
              className="w-full py-3 bg-amber-500 text-black font-bold text-xs uppercase rounded-xl"
            >
              Selesai Memilih LC ({initialSelectedLcIds.length})
            </button>
          </div>
        </div>
      )}

      {/* ========================================== */}
      {/* POP-UP MODAL 2: PEMILIHAN F&B / MINUMAN */}
      {/* ========================================== */}
      {showFnbPicker && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161a20] border border-gray-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white flex items-center space-x-2">
                <Wine size={18} className="text-amber-400" />
                <span>Pilih F&B / Minuman di Awal</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowFnbPicker(false)}
                className="text-gray-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* BAR PENCARIAN F&B */}
            <input 
              type="text"
              placeholder="Cari item F&B..."
              value={searchFnb}
              onChange={(e) => setSearchFnb(e.target.value)}
              className="w-full bg-[#0d0f12] border border-gray-800 rounded-xl px-3 py-2.5 text-xs text-white outline-none focus:border-amber-500"
            />

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.map(p => {
                  const qty = initialFnbCart[p.id] || 0;
                  return (
                    <div 
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#0d0f12] border border-gray-800"
                    >
                      <div>
                        <p className="font-bold text-xs text-white">{p.name}</p>
                        <p className="text-[11px] text-amber-400">{formatRupiah(p.sell_price)}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {qty > 0 && (
                          <button 
                            type="button"
                            onClick={() => handleQtyChange(p.id, -1)}
                            className="w-7 h-7 rounded-lg bg-gray-800 text-amber-400 font-extrabold flex items-center justify-center hover:bg-gray-700"
                          >
                            -
                          </button>
                        )}
                        {qty > 0 && <span className="text-xs font-bold text-white w-6 text-center">{qty}</span>}
                        <button 
                          type="button"
                          onClick={() => handleQtyChange(p.id, 1)}
                          className="w-7 h-7 rounded-lg bg-amber-500 text-black font-extrabold flex items-center justify-center hover:bg-amber-400"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-center text-xs text-gray-500 py-4">Produk tidak ditemukan.</p>
              )}
            </div>

            <button 
              type="button"
              onClick={() => setShowFnbPicker(false)}
              className="w-full py-3 bg-amber-500 text-black font-bold text-xs uppercase rounded-xl"
            >
              Simpan Pilihan F&B ({totalFnbSelectedCount} Item)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}