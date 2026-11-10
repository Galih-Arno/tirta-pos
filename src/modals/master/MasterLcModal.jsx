import { Users, X, Edit2, Trash2, Plus } from 'lucide-react';

export default function MasterLcModal({
  setShowLcManageModal, editingLc, setEditingLc, handleSaveLcMaster,
  lcName, setLcName, lcType, setLcType, lcs, db
}) {
  const handleDeleteLc = async (id) => {
    if (confirm("Hapus data LC ini dari database?")) {
      await db.lcs.delete(id);
    }
  };

  const startEdit = (lc) => {
    setEditingLc(lc);
    setLcName(lc.name);
    setLcType(lc.type);
  };

  const cancelEdit = () => {
    setEditingLc(null);
    setLcName('');
    setLcType('tetap');
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-[600px] max-h-[85vh] rounded-2xl border shadow-2xl p-6 flex flex-col bg-card border-gray-700 text-white">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-800">
          <h3 className="text-xl font-serif font-bold text-blue-400 flex items-center">
            <Users size={20} className="mr-2"/> Master Kelola Ladies Companion (LC)
          </h3>
          <button onClick={() => setShowLcManageModal(false)}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        {/* FORM TAMBAH / EDIT LC */}
        <form onSubmit={handleSaveLcMaster} className="bg-dark p-4 rounded-xl border border-gray-800 mb-4 space-y-3">
          <div className="font-bold text-xs text-gray-300 uppercase">
            {editingLc ? `Edit LC: ${editingLc.name}` : 'Tambah Data LC Baru'}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Nama Panggilan LC</label>
              <input type="text" value={lcName} onChange={e => setLcName(e.target.value)} placeholder="Contoh: Siska" className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-blue-400" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Status Kemitraan</label>
              <select value={lcType} onChange={e => setLcType(e.target.value)} className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-blue-400">
                <option value="tetap">Tetap (Reguler)</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-1">
            {editingLc && (
              <button type="button" onClick={cancelEdit} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-300">
                Batal Edit
              </button>
            )}
            <button type="submit" className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-bold text-white shadow flex items-center">
              <Plus size={14} className="mr-1"/> {editingLc ? 'Simpan Perubahan' : 'Tambah LC'}
            </button>
          </div>
        </form>

        {/* LIST TABLE LC */}
        <div className="flex-1 overflow-y-auto pr-1">
          <table className="w-full text-xs text-left text-gray-300">
            <thead className="text-[11px] uppercase bg-dark border-b border-gray-800 text-gray-400">
              <tr>
                <th className="p-2.5">Nama LC</th>
                <th className="p-2.5 text-center">Tipe Kemitraan</th>
                <th className="p-2.5 text-center">Tarif per Jam</th>
                <th className="p-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {lcs?.map(lc => (
                <tr key={lc.id} className="hover:bg-dark/50">
                  <td className="p-2.5 font-bold text-white">{lc.name}</td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${lc.type === 'tetap' ? 'bg-blue-950 text-blue-300 border border-blue-800' : 'bg-purple-950 text-purple-300 border border-purple-800'}`}>
                      {lc.type}
                    </span>
                  </td>
                  <td className="p-2.5 text-center text-gray-400">Rp 85.000 / Jam</td>
                  <td className="p-2.5 text-center">
                    <div className="flex justify-center space-x-1">
                      <button onClick={() => startEdit(lc)} className="p-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 rounded-lg" title="Edit"><Edit2 size={12}/></button>
                      <button onClick={() => handleDeleteLc(lc.id)} className="p-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 rounded-lg" title="Hapus"><Trash2 size={12}/></button>
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