import { Coffee, X, Edit2, Trash2, Plus } from 'lucide-react';

export default function MasterFnbModal({
  setShowFnbManageModal, editingProduct, setEditingProduct, handleSaveProductMaster,
  prodName, setProdName, prodBuyPrice, setProdBuyPrice, prodSellPrice, setProdSellPrice,
  prodStock, setProdStock, products, db
}) {
  const handleDeleteProduct = async (id) => {
    if (confirm("Hapus produk F&B ini dari sistem?")) {
      await db.products.delete(id);
    }
  };

  const startEdit = (p) => {
    setEditingProduct(p);
    setProdName(p.name);
    setProdBuyPrice(p.buy_price);
    setProdSellPrice(p.sell_price);
    setProdStock(p.stock);
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setProdName('');
    setProdBuyPrice('');
    setProdSellPrice('');
    setProdStock('');
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-[700px] max-h-[85vh] rounded-2xl border shadow-2xl p-6 flex flex-col bg-card border-gray-700 text-white">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-800">
          <h3 className="text-xl font-serif font-bold text-amber-400 flex items-center">
            <Coffee size={20} className="mr-2"/> Master Kelola F&B & Stok
          </h3>
          <button onClick={() => setShowFnbManageModal(false)}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        {/* FORM TAMBAH / EDIT PRODUK */}
        <form onSubmit={handleSaveProductMaster} className="bg-dark p-4 rounded-xl border border-gray-800 mb-4 space-y-3">
          <div className="font-bold text-xs text-gray-300 uppercase">
            {editingProduct ? `Edit Produk: ${editingProduct.name}` : 'Tambah Produk F&B Baru'}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Nama Barang</label>
              <input type="text" value={prodName} onChange={e => setProdName(e.target.value)} placeholder="Contoh: Bir Bintang" className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Jumlah Stok Initial/Current</label>
              <input type="number" value={prodStock} onChange={e => setProdStock(e.target.value)} placeholder="0" className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Harga Beli / Modal (Rp)</label>
              <input type="number" value={prodBuyPrice} onChange={e => setProdBuyPrice(e.target.value)} placeholder="50000" className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-amber-400" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Harga Jual Kasir (Rp)</label>
              <input type="number" value={prodSellPrice} onChange={e => setProdSellPrice(e.target.value)} placeholder="75000" className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-amber-400" />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-1">
            {editingProduct && (
              <button type="button" onClick={cancelEdit} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-300">
                Batal Edit
              </button>
            )}
            <button type="submit" className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 rounded-lg text-xs font-bold text-white shadow flex items-center">
              <Plus size={14} className="mr-1"/> {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk'}
            </button>
          </div>
        </form>

        {/* TABEL LIST PRODUK */}
        <div className="flex-1 overflow-y-auto pr-1">
          <table className="w-full text-xs text-left text-gray-300">
            <thead className="text-[11px] uppercase bg-dark border-b border-gray-800 text-gray-400">
              <tr>
                <th className="p-2.5">Nama Produk</th>
                <th className="p-2.5 text-right">Modal</th>
                <th className="p-2.5 text-right">Jual</th>
                <th className="p-2.5 text-center">Stok</th>
                <th className="p-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {products?.map(p => (
                <tr key={p.id} className="hover:bg-dark/50">
                  <td className="p-2.5 font-bold text-white">{p.name}</td>
                  <td className="p-2.5 text-right text-gray-400">Rp {p.buy_price?.toLocaleString('id-ID')}</td>
                  <td className="p-2.5 text-right font-bold text-amber-300">Rp {p.sell_price?.toLocaleString('id-ID')}</td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded font-bold ${p.stock <= 5 ? 'bg-red-950 text-red-400 border border-red-800' : 'bg-gray-800 text-white'}`}>
                      {p.stock}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <div className="flex justify-center space-x-1">
                      <button onClick={() => startEdit(p)} className="p-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 rounded-lg" title="Edit"><Edit2 size={12}/></button>
                      <button onClick={() => handleDeleteProduct(p.id)} className="p-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 rounded-lg" title="Hapus"><Trash2 size={12}/></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}