import { X, CheckCircle } from 'lucide-react';
import CurrencyInput from '../components/CurrencyInput';
import { formatRupiah } from '../utils/currencyHelpers';

export default function CheckoutModal({
  setShowCheckoutModal, remainingBalanceDue, paymentMethod, setPaymentMethod,
  amountPaid, setAmountPaid, handleCheckout
}) {
  const changeAmount = paymentMethod === 'cash' ? Math.max(0, (Number(amountPaid) || 0) - remainingBalanceDue) : 0;

  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-[500px] rounded-2xl border shadow-2xl p-6 bg-card border-gray-700 text-white">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-800">
          <h3 className="text-xl font-serif font-bold text-white">Pembayaran & Pelunasan</h3>
          <button onClick={() => setShowCheckoutModal(false)}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        <div className="mb-4 p-4 rounded-xl border bg-dark border-gray-800 space-y-2">
          <div className="flex justify-between items-center text-sm font-semibold text-gray-300">
            <span>Sisa Wajib Dibayar:</span>
            <span className="text-warning text-2xl font-mono font-bold">
              {formatRupiah(remainingBalanceDue)}
            </span>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-semibold mb-2 text-gray-300">Metode Pembayaran</label>
          <div className="flex space-x-2">
            <button 
              onClick={() => setPaymentMethod('cash')} 
              className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-all ${paymentMethod === 'cash' ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-dark border-gray-700 text-gray-400'}`}
            >
              TUNAI (CASH)
            </button>
            <button 
              onClick={() => { setPaymentMethod('transfer'); setAmountPaid(remainingBalanceDue); }} 
              className={`flex-1 py-3 rounded-xl font-bold text-xs border transition-all ${paymentMethod === 'transfer' ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-dark border-gray-700 text-gray-400'}`}
            >
              TRANSFER / QRIS
            </button>
          </div>
        </div>

        {paymentMethod === 'cash' && (
          <div className="mb-4 space-y-2">
            <label className="block text-xs font-semibold text-gray-300">Nominal Uang Diterima Kasir</label>
            <CurrencyInput
              value={amountPaid}
              onChange={(val) => setAmountPaid(val)}
              placeholder="Rp 0"
              className="w-full border rounded-xl p-3 text-2xl font-bold bg-dark border-gray-700 text-green-400 focus:border-green-500 outline-none text-right font-mono"
              autoFocus
            />

            {/* Quick Button Nominal Pas & Uang Pas */}
            <div className="flex space-x-2 pt-1">
              <button 
                onClick={() => setAmountPaid(remainingBalanceDue)} 
                className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg border border-gray-700"
              >
                Uang Pas ({formatRupiah(remainingBalanceDue)})
              </button>
            </div>

            {changeAmount > 0 && (
              <div className="flex justify-between items-center p-2.5 rounded-lg bg-green-950/60 border border-green-700/60 text-xs text-green-300">
                <span>Kembalian Tamu:</span>
                <span className="font-bold text-sm font-mono">{formatRupiah(changeAmount)}</span>
              </div>
            )}
          </div>
        )}

        <button 
          onClick={handleCheckout} 
          className="w-full py-4 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl text-base flex items-center justify-center shadow-lg transition-all"
        >
          <CheckCircle size={20} className="mr-2" /> KONFIRMASI BAYAR & CETAK STRUK
        </button>
      </div>
    </div>
  );
}