import { Coffee } from 'lucide-react';

export default function BarHeaderCard({ isNonRoomMode, setIsNonRoomMode, setSelectedRoom }) {
  return (
    <div className="mb-4">
      <div 
        onClick={() => { setIsNonRoomMode(true); setSelectedRoom({ id: 'non-room', room_number: 'WALK-IN BAR / NON-ROOM' }); }}
        className={`p-4 rounded-2xl cursor-pointer border-2 transition-all flex justify-between items-center shadow-lg ${isNonRoomMode ? 'bg-gradient-to-r from-amber-950 to-orange-950 border-amber-500 ring-4 ring-amber-500/20' : 'bg-gradient-to-r from-gray-900 to-gray-800 border-amber-700/50 hover:border-amber-500'}`}
      >
        <div className="flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-amber-500/20 text-amber-400"><Coffee size={24}/></div>
          <div>
            <h3 className="text-lg font-bold text-amber-400">🍺 PESANAN NON-ROOM (WALK-IN BAR)</h3>
            <p className="text-xs text-gray-400">Proses transaksi tamu hanya minum/makan tanpa sewa room & tanpa LC</p>
          </div>
        </div>
        <span className="px-4 py-2 bg-amber-600 hover:bg-amber-500 font-bold text-xs rounded-xl text-white shadow-md">BUKA KASIR BAR</span>
      </div>
    </div>
  );
}