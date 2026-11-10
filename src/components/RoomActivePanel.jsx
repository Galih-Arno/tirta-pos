import React from 'react';
import { Plus, Users, Coffee, Minus, DollarSign, LogOut } from 'lucide-react';
import { formatRupiah } from '../utils/currencyHelpers';

export default function RoomActivePanel({
  selectedRoom, activeTransaction, billableRoomHours, roomRatePerHour, roomSubtotal,
  handleAddHourFixed, runningLcs, lcCalculations, setSelectedLcIds, setShowLcModal,
  runningFnb, setShowFnbModal, handleUpdateFnbQty, grandTotal, isPaymentSettled,
  remainingBalanceDue, setShowCheckoutModal, handleFinishRoomSession
}) {
  return (
    <div className="p-5 rounded-2xl border shadow-xl bg-card border-gray-800 space-y-4">
      {activeTransaction && (
        <>
          {/* Info Utama Guest & Room */}
          <div className="border-b pb-3.5 border-gray-700/80">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-serif font-bold text-white tracking-wide">{activeTransaction.guest_name}</h3>
                <p className="text-xs text-gray-400 mt-1 font-mono">
                  {selectedRoom.room_number} ({billableRoomHours} jam @ {formatRupiah(roomRatePerHour)})
                </p>
              </div>
              <span className="bg-warning/20 border border-warning/50 text-warning text-xs px-3 py-1 rounded-full font-extrabold uppercase">
                {activeTransaction.billing_type} MODE
              </span>
            </div>
            
            <div className="mt-3 flex justify-between items-center bg-black/40 p-3 rounded-xl border border-gray-800">
              <span className="text-xs font-semibold text-gray-300">Subtotal Sewa Room:</span>
              <span className="text-sm font-bold font-mono text-white">{formatRupiah(roomSubtotal)}</span>
            </div>

            {activeTransaction.billing_type === 'fixed' && (
              <button 
                onClick={handleAddHourFixed}
                className="w-full mt-2.5 py-2.5 bg-blue-950/80 hover:bg-blue-900 border border-blue-700 text-blue-300 font-bold rounded-xl text-xs flex items-center justify-center transition-all shadow-sm active:scale-95"
              >
                <Plus size={14} className="mr-1" /> TAMBAH 1 JAM PAKET SEWA (+ {formatRupiah(roomRatePerHour)})
              </button>
            )}
          </div>

          {/* Section Companion LC */}
          <div className="bg-black/30 p-3.5 rounded-xl border border-gray-800/80">
            <div className="flex justify-between items-center mb-2.5">
              <span className="font-bold text-xs text-blue-400 flex items-center">
                <Users size={15} className="mr-1.5"/> Companion LC ({runningLcs?.length || 0})
              </span>
              <button 
                onClick={() => {
                  setSelectedLcIds(runningLcs?.map(l => l.lc_id) || []);
                  setShowLcModal(true);
                }}
                className="text-xs font-bold px-3 py-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 rounded-lg flex items-center transition-all"
              >
                <Plus size={13} className="mr-1"/> Kelola LC
              </button>
            </div>
            
            {runningLcs && runningLcs.length > 0 ? (
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                {lcCalculations.map(l => (
                  <div key={l.id} className="flex justify-between items-center text-xs bg-[#12161b] p-2.5 rounded-lg border border-gray-800">
                    <div>
                      <span className="font-bold text-white">{l.lc_name}</span>
                      <span className="text-gray-400 text-[11px] ml-1.5">({l.hours.toFixed(1)} jam)</span>
                    </div>
                    <span className="font-bold font-mono text-green-400">{formatRupiah(l.cost)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Belum ada LC ditambahkan ke room ini.</p>
            )}
          </div>

          {/* Section Pesanan F&B */}
          <div className="bg-black/30 p-3.5 rounded-xl border border-gray-800/80">
            <div className="flex justify-between items-center mb-2.5">
              <span className="font-bold text-xs text-amber-400 flex items-center">
                <Coffee size={15} className="mr-1.5"/> Pesanan F&B / Minuman
              </span>
              <button 
                onClick={() => setShowFnbModal(true)}
                className="text-xs font-bold px-3 py-1.5 bg-amber-950 hover:bg-amber-900 border border-amber-700 text-amber-300 rounded-lg flex items-center transition-all"
              >
                <Plus size={13} className="mr-1"/> Tambah F&B
              </button>
            </div>

            {runningFnb && runningFnb.length > 0 ? (
              <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                {runningFnb.map(f => (
                  <div key={f.id} className="flex justify-between items-center text-xs bg-[#12161b] p-2.5 rounded-lg border border-gray-800">
                    <div>
                      <p className="font-bold text-white text-xs">{f.product_name}</p>
                      <p className="text-[11px] text-gray-400 font-mono">@ {formatRupiah(f.price_at_transaction)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleUpdateFnbQty(f, -1)} className="p-1.5 bg-gray-800 hover:bg-red-900 rounded-lg text-red-400"><Minus size={13}/></button>
                      <span className="font-bold text-xs w-4 text-center">{f.qty}</span>
                      <button onClick={() => handleUpdateFnbQty(f, 1)} className="p-1.5 bg-gray-800 hover:bg-green-900 rounded-lg text-green-400"><Plus size={13}/></button>
                      <span className="font-bold font-mono text-amber-300 text-xs ml-1.5">{formatRupiah(f.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Belum ada pesanan F&B / minuman.</p>
            )}
          </div>

          {/* Sisa Hak Bayar / Neraca */}
          <div className="border-t pt-3.5 border-gray-700 space-y-1.5 bg-black/40 p-3.5 rounded-xl">
            <div className="flex justify-between items-center text-xs text-gray-400">
              <span>Total Tagihan Keseluruhan:</span>
              <span className="font-bold font-mono text-white text-sm">{formatRupiah(grandTotal)}</span>
            </div>
            <div className="flex justify-between items-center text-base font-bold text-white pt-2 border-t border-gray-800">
              <span>SISA KURANG BAYAR</span>
              <span className={`font-mono ${isPaymentSettled ? 'text-success' : 'text-warning text-lg font-extrabold'}`}>
                {isPaymentSettled ? 'LUNAS (TIMER RUNNING)' : formatRupiah(remainingBalanceDue)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-2.5 pt-1">
            <button 
              onClick={() => setShowCheckoutModal(true)} 
              className="w-full py-4 bg-primary hover:bg-blue-600 font-bold rounded-xl flex items-center justify-center text-base transition-all shadow-lg text-white active:scale-95"
            >
              <DollarSign size={20} className="mr-1.5" /> PROSES BAYAR / TOP-UP
            </button>
            <button 
              onClick={handleFinishRoomSession} 
              className="w-full py-2.5 bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-200 font-bold rounded-xl flex items-center justify-center text-xs transition-all active:scale-95"
            >
              <LogOut size={16} className="mr-1.5" /> SELESAIKAN SESI & KOSONGKAN ROOM
            </button>
          </div>
        </>
      )}
    </div>
  );
}