import { useState } from 'react';
import { ShoppingBag, Plus, Trash2, Search, CreditCard, Banknote, Bookmark, ArrowLeft } from 'lucide-react';
import { formatRupiah } from '../utils/currencyHelpers';

export default function BarPosPanel({
  setIsNonRoomMode,
  heldBarBills,
  handleCreateNewBarBill,
  activeBarBillId,
  handleLoadHeldBill,
  handleDeleteHeldBill,
  barGuestName,
  setBarGuestName,
  products,
  barCart,
  setBarCart,
  fnbSubtotal,
  barPaymentMethod,
  setBarPaymentMethod,
  barAmountPaid,
  setBarAmountPaid,
  handleHoldCurrentBarBill,
  handleProcessNonRoomCheckout
}) {
  const [showFnbModal, setShowFnbModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Total item di keranjang bar
  const totalCartItemsCount = Object.values(barCart).reduce((sum, q) => sum + q, 0);

  const handleQtyChange = (productId, delta) => {
    setBarCart(prev => {
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

  const filteredProducts = (products || []).filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* HEADER BAR & TOMBOL KEMBALI */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-800">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setIsNonRoomMode(false)}
            className="p-2 rounded-xl bg-gray-800 text-gray-300 hover:text-white hover:bg-gray-700 transition-all"
            title="Kembali ke Grid Room"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h2 className="text-xl font-serif font-bold text-amber-400">Kasir Walk-In Bar</h2>
            <p className="text-xs text-gray-400">Transaksi non-room (tanpa sewa ruangan & LC)</p>
          </div>
        </div>

        {/* PESANAN GANTUNG / HOLD BILLS BADGE */}
        {heldBarBills && heldBarBills.length > 0 && (
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-400">Gantung ({heldBarBills.length})</span>
            <button
              onClick={handleCreateNewBarBill}
              className="px-2.5 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/40 rounded-lg text-xs font-bold hover:bg-amber-500 hover:text-black transition-all"
            >
              + Baru
            </button>
          </div>
        )}
      </div>

      {/* DAFTAR BILL GANTUNG (JIKA ADA) */}
      {heldBarBills && heldBarBills.length > 0 && (
        <div className="flex space-x-2 overflow-x-auto pb-2">
          {heldBarBills.map(bill => (
            <div
              key={bill.id}
              onClick={() => handleLoadHeldBill(bill)}
              className={`flex-shrink-0 flex items-center space-x-2 px-3 py-2 rounded-xl border text-xs cursor-pointer transition-all ${
                activeBarBillId === bill.id
                  ? 'bg-amber-500 border-amber-500 text-black font-bold'
                  : 'bg-[#0d0f12] border-gray-800 text-gray-300 hover:border-gray-700'
              }`}
            >
              <span>{bill.guestName}</span>
              <button
                onClick={(e) => handleDeleteHeldBill(bill.id, e)}
                className="hover:text-rose-500 transition-colors ml-1"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* INPUT NAMA TAMU / MEJA */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">
          Nama Tamu / Nomor Meja Bar (Opsional)
        </label>
        <input
          type="text"
          placeholder="Contoh: Mas Budi / Meja Bar 02"
          value={barGuestName}
          onChange={(e) => setBarGuestName(e.target.value)}
          className="w-full bg-[#0d0f12] border border-gray-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-all"
        />
      </div>

      {/* RINGKASAN KERANJANG PESANAN */}
      <div className="bg-[#0d0f12] p-4 rounded-xl border border-gray-800 space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center space-x-2">
            <ShoppingBag size={14} className="text-amber-400" />
            <span>Pesanan Terpilih</span>
          </span>
          <button
            type="button"
            onClick={() => setShowFnbModal(true)}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs rounded-lg transition-all flex items-center space-x-1"
          >
            <Plus size={14} />
            <span>{totalCartItemsCount > 0 ? 'Edit / Tambah F&B' : 'Pilih Menu F&B'}</span>
          </button>
        </div>

        {/* LIST ITEM TERPILIH DENGAN TOMBOL + DAN - INLINE */}
        {totalCartItemsCount > 0 ? (
          <div className="max-h-48 overflow-y-auto space-y-2 pr-1 border-t border-gray-800/80 pt-2">
            {Object.entries(barCart).map(([prodId, qty]) => {
              const product = products?.find(p => p.id === Number(prodId));
              if (!product || qty <= 0) return null;
              return (
                <div key={prodId} className="flex justify-between items-center text-xs bg-[#161a20] p-2.5 rounded-xl border border-gray-800/80">
                  <span className="font-bold text-white flex-1 pr-2">{product.name}</span>
                  
                  <div className="flex items-center space-x-3">
                    {/* TOMBOL + / - UNTUK UBAH / TUKAR JUMLAH SECARA CEPT */}
                    <div className="flex items-center space-x-1.5 bg-[#0d0f12] px-2 py-1 rounded-lg border border-gray-800">
                      <button 
                        type="button"
                        onClick={() => handleQtyChange(Number(prodId), -1)}
                        className="w-5 h-5 rounded bg-gray-800 text-amber-400 font-extrabold flex items-center justify-center hover:bg-gray-700 active:scale-95 transition-all"
                        title="Kurangi Qty / Hapus"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-white px-1 text-center min-w-[16px]">{qty}</span>
                      <button 
                        type="button"
                        onClick={() => handleQtyChange(Number(prodId), 1)}
                        className="w-5 h-5 rounded bg-amber-500 text-black font-extrabold flex items-center justify-center hover:bg-amber-400 active:scale-95 transition-all"
                        title="Tambah Qty"
                      >
                        +
                      </button>
                    </div>

                    {/* SUBTOTAL PRODUCT */}
                    <span className="text-amber-400 font-bold min-w-[70px] text-right">
                      {formatRupiah(qty * product.sell_price)}
                    </span>
                    
                    {/* TOMBOL HAPUS BARIS */}
                    <button 
                      type="button"
                      onClick={() => handleQtyChange(Number(prodId), -qty)}
                      className="text-rose-400 hover:text-rose-300 p-1 transition-colors"
                      title="Hapus Item Ini"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 border-t border-gray-800/80">
            <p className="text-xs text-gray-500">Belum ada menu F&B yang dipilih.</p>
          </div>
        )}
      </div>

      {/* METODE PEMBAYARAN & PEMROSESAN */}
      <div className="bg-[#0d0f12] p-4 rounded-xl border border-gray-800 space-y-3">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-400 font-medium">Total Tagihan Bar:</span>
          <span className="text-xl font-bold text-emerald-400">{formatRupiah(fnbSubtotal)}</span>
        </div>

        {/* TOGGLE METODE BAYAR */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setBarPaymentMethod('cash')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 border transition-all ${
              barPaymentMethod === 'cash'
                ? 'bg-amber-500 border-amber-500 text-black'
                : 'bg-[#161a20] border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <Banknote size={14} />
            <span>Tunai (Cash)</span>
          </button>
          <button
            type="button"
            onClick={() => setBarPaymentMethod('transfer')}
            className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center space-x-2 border transition-all ${
              barPaymentMethod === 'transfer'
                ? 'bg-amber-500 border-amber-500 text-black'
                : 'bg-[#161a20] border-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            <CreditCard size={14} />
            <span>Transfer / QRIS</span>
          </button>
        </div>

        {/* INPUT NOMINAL TUNAI BERFORMAT RUPIAH */}
        {barPaymentMethod === 'cash' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
              Nominal Uang Tunai Diterima
            </label>
            <input
              type="text"
              placeholder="Rp 0"
              value={barAmountPaid ? `Rp ${Number(barAmountPaid).toLocaleString('id-ID')}` : ''}
              onChange={(e) => {
                const rawNumericValue = e.target.value.replace(/\D/g, '');
                setBarAmountPaid(rawNumericValue);
              }}
              className="w-full bg-[#161a20] border border-gray-800 focus:border-amber-500 rounded-xl px-4 py-2.5 text-xs text-amber-400 font-extrabold outline-none tracking-wide transition-all"
            />
          </div>
        )}

        {/* TOMBOL AKSI UTAMA */}
        <div className="grid grid-cols-3 gap-2 pt-1">
          <button
            type="button"
            onClick={handleHoldCurrentBarBill}
            className="py-3 bg-gray-800 hover:bg-gray-700 text-amber-400 font-bold text-xs uppercase rounded-xl flex items-center justify-center space-x-1 border border-gray-700"
          >
            <Bookmark size={14} />
            <span>Gantung</span>
          </button>

          <button
            type="button"
            onClick={handleProcessNonRoomCheckout}
            className="col-span-2 py-3 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
          >
            Bayar & Cetak Struk
          </button>
        </div>
      </div>

      {/* POP-UP MODAL SELEKSI MENU F&B */}
      {showFnbModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#161a20] border border-gray-800 rounded-2xl w-full max-w-lg p-5 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center border-b border-gray-800 pb-3">
              <h3 className="font-bold text-white flex items-center space-x-2">
                <ShoppingBag size={18} className="text-amber-400" />
                <span>Pilih Menu F&B (Walk-In Bar)</span>
              </h3>
              <button 
                type="button"
                onClick={() => setShowFnbModal(false)}
                className="text-gray-400 hover:text-white font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="relative">
              <Search size={14} className="absolute left-3 top-3 text-gray-500" />
              <input 
                type="text"
                placeholder="Cari minuman / makanan..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#0d0f12] border border-gray-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500"
              />
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 pr-1">
              {filteredProducts && filteredProducts.length > 0 ? (
                filteredProducts.map(p => {
                  const qty = barCart[p.id] || 0;
                  return (
                    <div 
                      key={p.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#0d0f12] border border-gray-800 hover:border-gray-700 transition-all"
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
                <p className="text-center text-xs text-gray-500 py-6">Produk F&B tidak ditemukan.</p>
              )}
            </div>

            <button 
              type="button"
              onClick={() => setShowFnbModal(false)}
              className="w-full py-3 bg-amber-500 text-black font-bold text-xs uppercase tracking-wider rounded-xl hover:bg-amber-400"
            >
              Selesai Memilih ({totalCartItemsCount} Item)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}