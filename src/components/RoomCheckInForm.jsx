import { Clock, Users, Coffee, CheckCircle } from 'lucide-react';

export default function RoomCheckInForm({
  guestName, setGuestName,
  billingType, setBillingType,
  duration, setDuration,
  lcs, initialSelectedLcIds, setInitialSelectedLcIds,
  products, initialFnbCart, setInitialFnbCart,
  handleStartRoom
}) {
  return (
    <div className="p-6 rounded-2xl border shadow-lg bg-card border-gray-800 space-y-4">
      <h3 className="text-lg font-semibold text-gray-200">Masukkan Data/Pesanan Tamu</h3>
      
      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-300">Atas Nama (Tamu)</label>
        <input 
          type="text" 
          value={guestName} 
          onChange={(e) => setGuestName(e.target.value)} 
          className="w-full border rounded-xl p-3 font-medium outline-none transition-all bg-dark border-gray-700 text-white focus:border-primary" 
          placeholder="Nama tamu..." 
        />
      </div>

      <div>
        <label className="block text-sm font-semibold mb-2 text-gray-300">Mode Waktu</label>
        <div className="flex space-x-2">
          <button 
            onClick={() => setBillingType('fixed')} 
            className={`flex-1 py-3 rounded-xl font-bold border transition-all ${billingType === 'fixed' ? 'bg-primary border-primary text-white shadow-md' : 'border-gray-700 text-gray-300 bg-dark'}`}
          >
            Paket Jam
          </button>
          <button 
            onClick={() => setBillingType('open')} 
            className={`flex-1 py-3 rounded-xl font-bold border transition-all ${billingType === 'open' ? 'bg-primary border-primary text-white shadow-md' : 'border-gray-700 text-gray-300 bg-dark'}`}
          >
            Open
          </button>
        </div>
      </div>

      {billingType === 'fixed' && (
        <div className="flex items-center justify-between p-4 rounded-xl border bg-black/20 border-gray-700/50">
          <span className="text-sm font-semibold text-gray-300">Durasi Paket</span>
          <div className="flex items-center space-x-4">
            <button onClick={() => setDuration(Math.max(1, duration - 1))} className="w-10 h-10 rounded-xl font-bold transition-all bg-gray-700/50 text-white hover:bg-gray-700">-</button>
            <span className="text-xl font-bold w-16 text-center text-white">{duration} Jam</span>
            <button onClick={() => setDuration(duration + 1)} className="w-10 h-10 rounded-xl font-bold transition-all bg-gray-700/50 text-white hover:bg-gray-700">+</button>
          </div>
        </div>
      )}

      {/* SELEKSI LC DIAWAL */}
      <div className="bg-black/30 p-3.5 rounded-xl border border-gray-800/90">
        <label className="block text-xs font-semibold mb-2 text-blue-400 flex items-center">
          <Users size={14} className="mr-1.5"/> Pilih LC di Awal (Opsional)
        </label>
        <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
          {lcs?.map(lc => {
            const isSelected = initialSelectedLcIds.includes(lc.id);
            return (
              <div 
                key={lc.id}
                onClick={() => {
                  if (isSelected) {
                    setInitialSelectedLcIds(initialSelectedLcIds.filter(id => id !== lc.id));
                  } else {
                    setInitialSelectedLcIds([...initialSelectedLcIds, lc.id]);
                  }
                }}
                className={`flex justify-between items-center p-2 rounded-lg border cursor-pointer text-xs transition-all ${
                  isSelected ? 'bg-blue-950/80 border-blue-500 text-white' : 'bg-dark border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div>
                  <span className="font-bold">{lc.name}</span>
                  <span className="text-[10px] opacity-70 ml-1 capitalize">({lc.type})</span>
                </div>
                <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-400' : 'border-gray-600'}`}>
                  {isSelected && <CheckCircle size={12} className="text-white" />}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SELEKSI F&B DIAWAL */}
      <div className="bg-black/30 p-3.5 rounded-xl border border-gray-800/90">
        <label className="block text-xs font-semibold mb-2 text-amber-400 flex items-center">
          <Coffee size={14} className="mr-1.5"/> Pilih Minuman / F&B di Awal (Opsional)
        </label>
        <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
          {products?.map(p => {
            const qty = initialFnbCart[p.id] || 0;
            return (
              <div key={p.id} className="flex justify-between items-center p-2 rounded-lg border bg-dark border-gray-800 text-xs">
                <div>
                  <p className="font-bold text-white">{p.name}</p>
                  <p className="text-[10px] text-gray-400">Rp {p.sell_price.toLocaleString('id-ID')} | Stok: {p.stock}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setInitialFnbCart({ ...initialFnbCart, [p.id]: Math.max(0, qty - 1) })} 
                    className="w-6 h-6 bg-gray-800 hover:bg-gray-700 rounded font-bold text-white"
                  >
                    -
                  </button>
                  <span className="w-4 text-center font-bold text-amber-400">{qty}</span>
                  <button 
                    onClick={() => {
                      if (p.stock <= qty) return alert("Stok tidak mencukupi!");
                      setInitialFnbCart({ ...initialFnbCart, [p.id]: qty + 1 });
                    }} 
                    className="w-6 h-6 bg-amber-600 hover:bg-amber-500 rounded font-bold text-white"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <button onClick={handleStartRoom} className="w-full py-4 bg-success text-white font-bold rounded-xl hover:bg-green-600 shadow-lg shadow-green-600/30 transition-all flex items-center justify-center text-lg">
        <Clock size={20} className="mr-2"/> MULAI TIMER SEWA ROOM
      </button>
    </div>
  );
}