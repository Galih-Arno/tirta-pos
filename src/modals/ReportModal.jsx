import { Printer, X, Calendar } from 'lucide-react';

export default function ReportModal({
  setShowReportModal, reportStartDate, setReportStartDate,
  reportEndDate, setReportEndDate, handlePrintReport
}) {
  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-[450px] rounded-2xl border shadow-2xl p-6 bg-card border-gray-700 text-white">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-800">
          <h3 className="text-xl font-serif font-bold text-primary flex items-center">
            <Printer size={20} className="mr-2"/> Laporan Keuangan Owner
          </h3>
          <button onClick={() => setShowReportModal(false)}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300 flex items-center">
                <Calendar size={12} className="mr-1 text-primary"/> Tanggal Mulai
              </label>
              <input 
                type="date" 
                value={reportStartDate} 
                onChange={e => setReportStartDate(e.target.value)} 
                className="w-full bg-dark border border-gray-700 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1 text-gray-300 flex items-center">
                <Calendar size={12} className="mr-1 text-primary"/> Tanggal Akhir
              </label>
              <input 
                type="date" 
                value={reportEndDate} 
                onChange={e => setReportEndDate(e.target.value)} 
                className="w-full bg-dark border border-gray-700 rounded-xl p-2.5 text-xs font-bold text-white outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="p-3 bg-black/40 rounded-xl border border-gray-800 text-xs text-gray-400 space-y-1">
            <p className="font-bold text-white">Isi Rekap Laporan:</p>
            <p>• Omzet Sewa Ruangan & Penjualan F&B</p>
            <p>• Rincian Pendapatan Cash vs Transfer/QRIS</p>
            <p>• Total Piutang / Kasbon Tamu Belum Lunas</p>
            <p>• Summary Jam Terbang & Hak Komisi LC</p>
          </div>

          <button 
            onClick={handlePrintReport} 
            className="w-full py-3.5 bg-primary hover:bg-blue-600 font-bold rounded-xl text-white text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center transition-all"
          >
            <Printer size={18} className="mr-2"/> CETAK LAPORAN REKAP OWNER
          </button>
        </div>
      </div>
    </div>
  );
}