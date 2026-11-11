import dayjs from 'dayjs';
import { FileText, X, Printer } from 'lucide-react';
import { formatDurationLabel, calculateLcCost } from '../utils/billingHelpers';

export default function HistoryModal({
  setShowHistoryModal, selectedHistoryTrx, setSelectedHistoryTrx, historyFilter,
  setHistoryFilter, filteredHistory, rooms, historyRoomName, historyFnb, historyLcs,
  handlePrintDraftReceipt
}) {
  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-[750px] max-h-[85vh] rounded-2xl border shadow-2xl p-6 flex flex-col bg-card border-gray-700 text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-serif font-bold text-gray-200 flex items-center">
            <FileText size={20} className="mr-2 text-primary"/> Riwayat Transaksi & Struk
          </h3>
          <button onClick={() => { setShowHistoryModal(false); setSelectedHistoryTrx(null); }}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        <div className="flex space-x-2 mb-4">
          {['today', 'yesterday', '3days', '7days', 'all'].map(filterKey => (
            <button
              key={filterKey}
              onClick={() => setHistoryFilter(filterKey)}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs capitalize transition-all border ${
                historyFilter === filterKey ? 'bg-primary border-primary text-white shadow' : 'bg-dark border-gray-700 text-gray-400 hover:text-white'
              }`}
            >
              {filterKey === 'today' ? 'Hari Ini' : filterKey === 'yesterday' ? 'Kemarin' : filterKey === '3days' ? '3 Hari' : filterKey === '7days' ? '7 Hari' : 'Semua'}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
          <div className="overflow-y-auto space-y-2 pr-1 border-r border-gray-800">
            {filteredHistory.length === 0 ? (
              <p className="text-xs text-gray-500 p-4 text-center">Tidak ada transaksi ditemukan.</p>
            ) : (
              filteredHistory.map(t => {
                const isSelected = selectedHistoryTrx?.id === t.id;
                const rObj = rooms?.find(r => r.id === t.room_id);
                const rName = rObj ? rObj.room_number : 'NON-ROOM (BAR)';
                const total = (((t.room_subtotal||0)+(t.fnb_subtotal||0)+(t.lc_subtotal||0))-(t.discount||0));

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedHistoryTrx(t)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected ? 'bg-blue-950/80 border-blue-500 text-white' : 'bg-dark border-gray-800 text-gray-300 hover:border-gray-700'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <p className="font-bold text-xs text-white">{t.bill_number}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${t.status === 'paid' ? 'bg-green-900/60 text-green-300' : 'bg-red-900/60 text-red-300'}`}>
                        {t.status === 'paid' ? 'LUNAS' : 'KASBON'}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-gray-300 mt-1">{t.guest_name} • <span className="text-blue-300">{rName}</span></p>
                    <div className="flex justify-between items-center text-[11px] text-gray-400 mt-2">
                      <span>{dayjs(t.start_time).format('DD/MM/YY HH:mm')}</span>
                      <span className="font-bold text-white text-xs">Rp {total.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="flex flex-col justify-between overflow-y-auto pl-1">
            {selectedHistoryTrx ? (
              <div className="space-y-3">
                <div className="p-3 bg-dark rounded-xl border border-gray-800 space-y-1 text-xs text-gray-300">
                  <p className="font-bold text-white text-sm border-b pb-1 border-gray-700">{selectedHistoryTrx.bill_number}</p>
                  <p>Tamu: <strong className="text-white">{selectedHistoryTrx.guest_name}</strong></p>
                  <p>Ruangan: <strong className="text-blue-300">{historyRoomName}</strong></p>
                  <p>Waktu: {dayjs(selectedHistoryTrx.start_time).format('DD/MM/YYYY HH:mm')}</p>
                  <p>Metode Bayar: <strong className="uppercase text-amber-400">{selectedHistoryTrx.payment_method || 'Cash'}</strong></p>
                </div>

                <div className="space-y-1 text-xs">
                  <p className="font-bold text-gray-400 uppercase text-[10px]">Rincian Item:</p>
                  {selectedHistoryTrx.room_id && (
                    <div className="flex justify-between text-gray-300 bg-dark p-2 rounded-lg">
                      <span>Sewa Room ({formatDurationLabel(selectedHistoryTrx.duration_hours || 0)})</span>
                      <span className="font-bold text-white">Rp {(selectedHistoryTrx.room_subtotal||0).toLocaleString('id-ID')}</span>
                    </div>
                  )}
                  {historyFnb?.map(f => (
                    <div key={f.id} className="flex justify-between text-gray-300 bg-dark p-2 rounded-lg">
                      <span>{f.product_name} x {f.qty}</span>
                      <span className="font-bold text-amber-300">Rp {f.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                  {historyLcs?.map(l => (
                    <div key={l.id} className="flex justify-between text-gray-300 bg-dark p-2 rounded-lg">
                      <span>LC: {l.lc_name}</span>
                      <span className="font-bold text-green-300">Rp {calculateLcCost(selectedHistoryTrx.duration_hours||0).toLocaleString('id-ID')}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t pt-2 border-gray-800 flex justify-between font-bold text-sm text-white">
                  <span>Total Net:</span>
                  <span className="text-green-400">
                    Rp {(((selectedHistoryTrx.room_subtotal||0)+(selectedHistoryTrx.fnb_subtotal||0)+(selectedHistoryTrx.lc_subtotal||0))-(selectedHistoryTrx.discount||0)).toLocaleString('id-ID')}
                  </span>
                </div>

                <button
                  onClick={() => handlePrintDraftReceipt(selectedHistoryTrx)}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 font-bold rounded-xl text-white text-xs flex items-center justify-center shadow"
                >
                  <Printer size={16} className="mr-1.5"/> CETAK ULANG STRUK THERMAL 80MM
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs text-center">
                <FileText size={40} className="mb-2 opacity-30" />
                <p>Pilih salah satu transaksi untuk melihat rincian & cetak ulang struk</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}