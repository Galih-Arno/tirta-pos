import { Wallet, X, Printer, Calendar } from 'lucide-react';

export default function LcPayoutModal({
  setShowLcPayoutModal, selectedLcForPayout, setSelectedLcForPayout,
  lcs, payoutStartDate, setPayoutStartDate, payoutEndDate, setPayoutEndDate,
  handlePrintLcPayoutSlip
}) {
  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-[500px] rounded-2xl border shadow-2xl p-6 bg-card border-gray-700 text-white">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-800">
          <h3 className="text-xl font-serif font-bold text-green-400 flex items-center">
            <Wallet size={20} className="mr-2"/> Penggajian & Rekap Jam LC
          </h3>
          <button onClick={() => setShowLcPayoutModal(false)}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">Pilih Nama LC</label>
            <select 
              value={selectedLcForPayout} 
              onChange={e => setSelectedLcForPayout(e.target.value)} 
              className="w-full bg-dark border border-gray-700 rounded-xl p-3 text-sm font-bold text-white outline-none focus:border-green-500"
            >
              <option value="">-- Pilih LC --</option>
              {lcs?.map(lc => (
                <option key={lc.id} value={lc.name}>{lc.name} ({lc.type})</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300 flex items-center">
                <Calendar size={12} className="mr-1 text-green-400"/> Dari Tanggal
              </label>
              <input 
                type="date" 
                value={payoutStartDate} 
                onChange={e => setPayoutStartDate(e.target.value)} 
                className="w-full bg-dark border border-gray-700 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300 flex items-center">
                <Calendar size={12} className="mr-1 text-green-400"/> Sampai Tanggal
              </label>
              <input 
                type="date" 
                value={payoutEndDate} 
                onChange={e => setPayoutEndDate(e.target.value)} 
                className="w-full bg-dark border border-gray-700 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-green-500"
              />
            </div>
          </div>

          <div className="p-3 bg-black/40 rounded-xl border border-gray-800 text-xs text-gray-400 space-y-1">
            <p className="font-bold text-white">Catatan Pembayaran Komisi LC:</p>
            <p>• Tarif per jam penuh: Rp 85.000</p>
            <p>• Tambahan 30 menit (opsional): Rp 45.000</p>
            <p>• Sistem akan menghitung otomatis berdasarkan transaksi selesai pada periode tanggal di atas.</p>
          </div>

          <button 
            onClick={handlePrintLcPayoutSlip} 
            className="w-full py-3.5 bg-green-600 hover:bg-green-500 font-bold rounded-xl text-white text-sm shadow-lg shadow-green-600/30 flex items-center justify-center transition-all"
          >
            <Printer size={18} className="mr-2"/> CETAK SLIP GAJI LC (80MM THERMAL)
          </button>
        </div>
      </div>
    </div>
  );
}