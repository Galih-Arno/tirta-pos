import dayjs from 'dayjs';
import { CheckCircle, X, Printer, ArrowLeft } from 'lucide-react';

export default function ReceiptModal({ setShowReceiptModal, selectedHistoryTrx, handlePrintDraftReceipt }) {
  return (
    <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center">
      <div className="w-[450px] rounded-2xl border shadow-2xl p-6 bg-card border-gray-700 text-white">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-800">
          <h3 className="text-lg font-bold flex items-center text-success">
            <CheckCircle size={20} className="mr-2"/> Struk Pembayaran Sukses
          </h3>
          <button onClick={() => setShowReceiptModal(false)}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        <div className="bg-black/50 p-4 rounded-xl border border-gray-800 mb-6 font-mono text-xs space-y-1 text-gray-300">
          <p className="text-center font-bold text-white text-sm mb-2">TIRTA PERKASA KARAOKE</p>
          <p>No. Nota: {selectedHistoryTrx.bill_number}</p>
          <p>Tamu: {selectedHistoryTrx.guest_name}</p>
          <p>Waktu: {dayjs(selectedHistoryTrx.start_time).format('DD/MM/YYYY HH:mm')}</p>
          <div className="border-t border-dashed my-2 border-gray-700"></div>
          <div className="flex justify-between font-bold text-white text-sm">
            <span>TOTAL LUNAS:</span>
            <span>Rp {(((selectedHistoryTrx.room_subtotal||0)+(selectedHistoryTrx.fnb_subtotal||0)+(selectedHistoryTrx.lc_subtotal||0))-(selectedHistoryTrx.discount||0)).toLocaleString('id-ID')}</span>
          </div>
        </div>

        <div className="space-y-3">
          <button onClick={() => handlePrintDraftReceipt(selectedHistoryTrx)} className="w-full py-3.5 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl text-white flex items-center justify-center text-sm shadow-md">
            <Printer size={18} className="mr-2"/> CETAK STRUK THERMAL 80MM
          </button>

          <button onClick={() => setShowReceiptModal(false)} className="w-full py-3 bg-gray-800 hover:bg-gray-700 font-bold rounded-xl text-gray-300 flex items-center justify-center text-sm border border-gray-700">
            <ArrowLeft size={18} className="mr-2"/> KEMBALI KE APLIKASI
          </button>
        </div>
      </div>
    </div>
  );
}