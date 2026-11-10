import { Plus, Users, Coffee, Minus, DollarSign, LogOut } from 'lucide-react';

export default function RoomActivePanel({
  selectedRoom, activeTransaction, billableRoomHours, roomRatePerHour, roomSubtotal,
  handleAddHourFixed, runningLcs, lcCalculations, setSelectedLcIds, setShowLcModal,
  runningFnb, setShowFnbModal, handleUpdateFnbQty, grandTotal, isPaymentSettled,
  remainingBalanceDue, setShowCheckoutModal, handleFinishRoomSession
}) {
  return (
    <div className="p-6 rounded-2xl border shadow-lg bg-card border-gray-800 space-y-4">
      {activeTransaction && (
        <>
          <div className="border-b pb-3 border-gray-700">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-serif font-bold text-white">{activeTransaction.guest_name}</h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedRoom.room_number} ({billableRoomHours} jam @ Rp {roomRatePerHour.toLocaleString('id-ID')})
                </p>
              </div>
              <span className="bg-warning/20 text-warning text-xs px-3 py-1 rounded-full font-bold uppercase">{activeTransaction.billing_type} MODE</span>
            </div>
            
            <div className="mt-2 flex justify-between items-center bg-black/40 p-2.5 rounded-xl border border-gray-800">
              <span className="text-xs font-semibold text-gray-300">Subtotal Sewa Room:</span>
              <span className="text-sm font-bold text-white">Rp {roomSubtotal.toLocaleString('id-ID')}</span>
            </div>

            {activeTransaction.billing_type === 'fixed' && (
              <button 
                onClick={handleAddHourFixed}
                className="w-full mt-2 py-2 bg-blue-900/60 hover:bg-blue-800 border border-blue-700 text-blue-300 font-bold rounded-xl text-xs flex items-center justify-center transition-all shadow-sm"
              >
                <Plus size={14} className="mr-1" /> TAMBAH 1 JAM PAKET SEWA (+ Rp {roomRatePerHour.toLocaleString('id-ID')})
              </button>
            )}
          </div>

          <div className="bg-black/30 p-3 rounded-xl border border-gray-800/80">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-xs text-gray-300 flex items-center">
                <Users size={14} className="mr-1.5 text-blue-400"/> Companion LC ({runningLcs?.length || 0})
              </span>
              <button 
                onClick={() => {
                  setSelectedLcIds(runningLcs?.map(l => l.lc_id) || []);
                  setShowLcModal(true);
                }}
                className="text-[11px] font-bold px-2.5 py-1 bg-blue-900/50 hover:bg-blue-800 border border-blue-700 text-blue-300 rounded-lg flex items-center transition-all"
              >
                <Plus size={12} className="mr-1"/> Pilih / Kelola LC
              </button>
            </div>
            
            {runningLcs && runningLcs.length > 0 ? (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {lcCalculations.map(l => (
                  <div key={l.id} className="flex justify-between items-center text-xs bg-dark p-2 rounded-lg border border-gray-800">
                    <div>
                      <span className="font-bold text-white">{l.lc_name}</span>
                      <span className="text-gray-400 text-[10px] ml-1">({l.hours.toFixed(1)} jam)</span>
                    </div>
                    <span className="font-bold text-green-400">Rp {l.cost.toLocaleString('id-ID')}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic">Belum ada LC ditambahkan ke room ini.</p>
            )}
          </div>

          <div className="bg-black/30 p-3 rounded-xl border border-gray-800/80">
            <div className="flex justify-between items-center mb-2">
              <span className="font-semibold text-xs text-gray-300 flex items-center">
                <Coffee size={14} className="mr-1.5 text-amber-400"/> Pesanan F&B / Minuman
              </span>
              <button 
                onClick={() => setShowFnbModal(true)}
                className="text-[11px] font-bold px-2.5 py-1 bg-amber-900/50 hover:bg-amber-800 border border-amber-700 text-amber-300 rounded-lg flex items-center transition-all"
              >
                <Plus size={12} className="mr-1"/> Tambah F&B
              </button>
            </div>

            {runningFnb && runningFnb.length > 0 ? (
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {runningFnb.map(f => (
                  <div key={f.id} className="flex justify-between items-center text-xs bg-dark p-2 rounded-lg border border-gray-800">
                    <div>
                      <p className="font-bold text-white text-xs">{f.product_name}</p>
                      <p className="text-[10px] text-gray-400">@ Rp {f.price_at_transaction.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleUpdateFnbQty(f, -1)} className="p-1 bg-gray-800 hover:bg-red-900 rounded text-red-400"><Minus size={12}/></button>
                      <span className="font-bold text-xs w-4 text-center">{f.qty}</span>
                      <button onClick={() => handleUpdateFnbQty(f, 1)} className="p-1 bg-gray-800 hover:bg-green-900 rounded text-green-400"><Plus size={12}/></button>
                      <span className="font-bold text-amber-300 text-xs ml-1">Rp {f.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-gray-500 italic">Belum ada pesanan F&B / minuman.</p>
            )}
          </div>

          <div className="border-t pt-3 border-gray-700 space-y-1 bg-black/30 p-3 rounded-xl">
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>Total Tagihan Keseluruhan:</span>
              <span className="font-bold text-white">Rp {grandTotal.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between items-center text-base font-bold text-white pt-1 border-t border-gray-800">
              <span>SISA HAK BAYAR</span>
              <span className={isPaymentSettled ? 'text-success' : 'text-warning'}>
                {isPaymentSettled ? 'LUNAS (TIMER RUNNING)' : `Rp ${remainingBalanceDue.toLocaleString('id-ID')}`}
              </span>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <button onClick={() => setShowCheckoutModal(true)} className="w-full py-3.5 bg-primary hover:bg-blue-600 font-bold rounded-xl flex items-center justify-center text-base transition-all shadow-lg text-white">
              <DollarSign size={20} className="mr-1.5" /> PROSES BAYAR / TOP-UP
            </button>
            <button onClick={handleFinishRoomSession} className="w-full py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 font-bold rounded-xl flex items-center justify-center text-xs transition-all">
              <LogOut size={16} className="mr-1.5" /> SELESAIKAN SESI & KOSONGKAN ROOM
            </button>
          </div>
        </>
      )}
    </div>
  );
}