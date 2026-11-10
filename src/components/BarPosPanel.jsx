import { ArrowLeft, PauseCircle, Plus, X, CheckCircle } from 'lucide-react';
import CurrencyInput from './CurrencyInput';
import { formatRupiah } from '../utils/currencyHelpers';

export default function BarPosPanel({
  setIsNonRoomMode, heldBarBills, handleCreateNewBarBill, activeBarBillId, handleLoadHeldBill,
  handleDeleteHeldBill, barGuestName, setBarGuestName, products, barCart, setBarCart,
  fnbSubtotal, barPaymentMethod, setBarPaymentMethod, barAmountPaid, setBarAmountPaid,
  handleHoldCurrentBarBill, handleProcessNonRoomCheckout
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-2xl font-serif font-bold text-amber-400">Kasir Walk-In Bar</h2>
        <button onClick={() => setIsNonRoomMode(false)} className="text-gray-400 hover:text-white flex items-center text-xs bg-gray-800 px-3 py-1.5 rounded-lg"><ArrowLeft size={14} className="mr-1"/> Tutup Bar</button>
      </div>

      <div className="mb-4 bg-black/40 p-3 rounded-2xl border border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs font-bold text-amber-400 flex items-center">
            <PauseCircle size={14} className="mr-1.5"/> Pesanan Gantung ({heldBarBills.length})
          </span>
          <button 
            onClick={handleCreateNewBarBill}
            className="text-[11px] font-bold px-2 py-1 bg-amber-900/60 hover:bg-amber-800 border border-amber-700 text-amber-300 rounded-lg flex items-center transition-all"
          >
            <Plus size={12} className="mr-1"/> Baru
          </button>
        </div>

        {heldBarBills.length > 0 ? (
          <div className="flex space-x-2 overflow-x-auto pb-1">
            {heldBarBills.map(bill => {
              const isEditing = activeBarBillId === bill.id;
              const itemsQty = Object.values(bill.cart || {}).reduce((a, b) => a + b, 0);

              return (
                <div
                  key={bill.id}
                  onClick={() => handleLoadHeldBill(bill)}
                  className={`flex-shrink-0 p-2.5 rounded-xl border cursor-pointer transition-all min-w-[130px] ${
                    isEditing 
                      ? 'bg-amber-950/80 border-amber-500 ring-2 ring-amber-500/30' 
                      : 'bg-dark border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <p className="font-bold text-xs text-white truncate max-w-[90px]">{bill.guestName}</p>
                    <button onClick={(e) => handleDeleteHeldBill(bill.id, e)} className="text-gray-500 hover:text-red-400 p-0.5"><X size={12}/></button>
                  </div>
                  <div className="flex justify-between items-center text-[10px] text-gray-400 mt-1">
                    <span>{bill.createdAt}</span>
                    <span className="font-bold text-amber-300">{itemsQty} item</span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-gray-500 italic">Belum ada pesanan gantung tersimpan.</p>
        )}
      </div>
      
      <div className="p-5 rounded-2xl border bg-card border-gray-800 space-y-4">
        <div>
          <label className="block text-xs font-semibold mb-1 text-gray-300">Atas Nama Tamu (Opsional)</label>
          <input 
            type="text" 
            value={barGuestName} 
            onChange={e => setBarGuestName(e.target.value)} 
            className="w-full border rounded-xl p-2.5 text-sm bg-dark border-gray-700 text-white outline-none focus:border-amber-500" 
            placeholder="Misal: Mas Budi / Meja Bar 2" 
          />
        </div>

        <div>
          <label className="block text-sm font-semibold mb-2 text-amber-400">Pilih Pesanan Minuman / F&B</label>
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {products?.map(p => {
              const q = barCart[p.id] || 0;
              return (
                <div key={p.id} className="flex justify-between items-center p-2.5 rounded-xl border bg-dark border-gray-800 text-xs">
                  <div>
                    <p className="font-bold text-white">{p.name}</p>
                    <p className="text-gray-400">{formatRupiah(p.sell_price)} | Stok: {p.stock}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => setBarCart({...barCart, [p.id]: Math.max(0, q - 1)})} 
                      className="w-7 h-7 bg-gray-800 hover:bg-gray-700 rounded font-bold"
                    >
                      -
                    </button>
                    <span className="w-4 text-center font-bold text-white">{q}</span>
                    <button 
                      onClick={() => {
                        if (p.stock <= q) return alert("Stok tidak mencukupi!");
                        setBarCart({...barCart, [p.id]: q + 1});
                      }} 
                      className="w-7 h-7 bg-amber-600 hover:bg-amber-500 rounded font-bold text-white"
                    >
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="border-t pt-3 border-gray-700 space-y-2">
          <div className="flex justify-between text-base font-bold text-white">
            <span>Total Tagihan Bar:</span>
            <span className="text-amber-400 text-xl font-mono">{formatRupiah(fnbSubtotal)}</span>
          </div>

          <div className="flex space-x-2">
            <button 
              onClick={() => setBarPaymentMethod('cash')} 
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs border ${barPaymentMethod === 'cash' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-dark border-gray-700 text-gray-400'}`}
            >
              TUNAI
            </button>
            <button 
              onClick={() => { setBarPaymentMethod('transfer'); setBarAmountPaid(fnbSubtotal); }} 
              className={`flex-1 py-2.5 rounded-xl font-bold text-xs border ${barPaymentMethod === 'transfer' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-dark border-gray-700 text-gray-400'}`}
            >
              TRANSFER/QRIS
            </button>
          </div>

          {barPaymentMethod === 'cash' && (
            <CurrencyInput 
              value={barAmountPaid} 
              onChange={val => setBarAmountPaid(val)} 
              placeholder="Nominal Uang Diterima..." 
              className="w-full border rounded-xl p-3 text-xl font-bold bg-dark border-gray-700 text-amber-400 outline-none text-right font-mono" 
            />
          )}

          <div className="flex space-x-2 pt-1">
            <button 
              onClick={handleHoldCurrentBarBill} 
              className="flex-1 py-3.5 bg-amber-900/60 hover:bg-amber-800 border border-amber-700 text-amber-300 font-bold rounded-xl flex items-center justify-center text-xs transition-all shadow-md"
            >
              <PauseCircle size={18} className="mr-1.5"/> SIMPAN GANTUNG (HOLD BILL)
            </button>

            <button 
              onClick={handleProcessNonRoomCheckout} 
              className="flex-[1.5] py-3.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-600/30 flex items-center justify-center text-sm"
            >
              <CheckCircle size={18} className="mr-1.5"/> BAYAR & STRUK
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}