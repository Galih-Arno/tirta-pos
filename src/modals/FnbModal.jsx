import { ShoppingCart, X } from 'lucide-react';

export default function FnbModal({ selectedRoom, setShowFnbModal, fnbCart, setFnbCart, products, handleSaveFnb }) {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-[500px] max-h-[85vh] rounded-2xl border shadow-2xl p-6 flex flex-col bg-card border-gray-700 text-white">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-800">
          <h3 className="text-xl font-serif font-bold text-amber-400 flex items-center">
            <ShoppingCart size={20} className="mr-2"/> Tambah Pesanan F&B ({selectedRoom?.room_number})
          </h3>
          <button onClick={() => { setShowFnbModal(false); setFnbCart({}); }}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
          {products?.map(p => {
            const qty = fnbCart[p.id] || 0;
            return (
              <div key={p.id} className="flex justify-between items-center p-3 rounded-xl border bg-dark border-gray-800">
                <div>
                  <p className="font-bold text-sm text-white">{p.name}</p>
                  <p className="text-xs text-gray-400">Rp {p.sell_price.toLocaleString('id-ID')} | Stok: {p.stock}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setFnbCart({...fnbCart, [p.id]: Math.max(0, qty - 1)})} 
                    className="w-8 h-8 bg-gray-800 hover:bg-gray-700 rounded-lg font-bold text-white text-base"
                  >
                    -
                  </button>
                  <span className="w-6 text-center font-bold text-amber-400">{qty}</span>
                  <button 
                    onClick={() => {
                      if (p.stock <= qty) return alert("Stok tidak mencukupi!");
                      setFnbCart({...fnbCart, [p.id]: qty + 1});
                    }} 
                    className="w-8 h-8 bg-amber-600 hover:bg-amber-500 rounded-lg font-bold text-white text-base"
                  >
                    +
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-4 border-gray-800 flex space-x-3">
          <button 
            onClick={() => { setShowFnbModal(false); setFnbCart({}); }} 
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-sm"
          >
            Batal
          </button>
          <button 
            onClick={handleSaveFnb} 
            className="flex-1 py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-sm shadow-lg"
          >
            Simpan Pesanan
          </button>
        </div>
      </div>
    </div>
  );
}