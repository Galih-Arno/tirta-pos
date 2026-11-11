import { Home, X, Edit2, Trash2, Plus } from 'lucide-react';

export default function MasterRoomModal({
  setShowRoomManageModal, editingRoom, setEditingRoom, handleSaveRoomMaster,
  roomNumberInput, setRoomNumberInput, roomRateInput, setRoomRateInput, rooms, db
}) {
  const handleDeleteRoom = async (id) => {
    if (confirm("Hapus ruangan ini dari daftar master?")) {
      await db.rooms.delete(id);
    }
  };

  const startEdit = (r) => {
    setEditingRoom(r);
    setRoomNumberInput(r.room_number);
    setRoomRateInput(r.hourly_rate);
  };

  const cancelEdit = () => {
    setEditingRoom(null);
    setRoomNumberInput('');
    setRoomRateInput('');
  };

  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-[600px] max-h-[85vh] rounded-2xl border shadow-2xl p-6 flex flex-col bg-card border-gray-700 text-white">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-800">
          <h3 className="text-xl font-serif font-bold text-purple-400 flex items-center">
            <Home size={20} className="mr-2"/> Master Kelola Room & Tarif Sewa
          </h3>
          <button onClick={() => setShowRoomManageModal(false)}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        {/* FORM TAMBAH / EDIT ROOM */}
        <form onSubmit={handleSaveRoomMaster} className="bg-dark p-4 rounded-xl border border-gray-800 mb-4 space-y-3">
          <div className="font-bold text-xs text-gray-300 uppercase">
            {editingRoom ? `Edit Ruangan: ${editingRoom.room_number}` : 'Tambah Ruangan Karaoke Baru'}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Nama / Nomor Room</label>
              <input type="text" value={roomNumberInput} onChange={e => setRoomNumberInput(e.target.value)} placeholder="Contoh: ROOM 01" className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-purple-400" />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-400 mb-1">Tarif per Jam (Rp)</label>
              <input type="number" value={roomRateInput} onChange={e => setRoomRateInput(e.target.value)} placeholder="50000" className="w-full bg-black/40 border border-gray-700 rounded-lg p-2 text-xs font-bold text-white outline-none focus:border-purple-400" />
            </div>
          </div>
          <div className="flex justify-end space-x-2 pt-1">
            {editingRoom && (
              <button type="button" onClick={cancelEdit} className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 rounded-lg text-xs font-bold text-gray-300">
                Batal Edit
              </button>
            )}
            <button type="submit" className="px-4 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-xs font-bold text-white shadow flex items-center">
              <Plus size={14} className="mr-1"/> {editingRoom ? 'Simpan Perubahan' : 'Tambah Room'}
            </button>
          </div>
        </form>

        {/* TABEL LIST ROOM */}
        <div className="flex-1 overflow-y-auto pr-1">
          <table className="w-full text-xs text-left text-gray-300">
            <thead className="text-[11px] uppercase bg-dark border-b border-gray-800 text-gray-400">
              <tr>
                <th className="p-2.5">Nomor Ruangan</th>
                <th className="p-2.5 text-right">Tarif Per Jam</th>
                <th className="p-2.5 text-center">Status Saat Ini</th>
                <th className="p-2.5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {rooms?.map(r => (
                <tr key={r.id} className="hover:bg-dark/50">
                  <td className="p-2.5 font-bold text-white">{r.room_number}</td>
                  <td className="p-2.5 text-right font-bold text-purple-300">Rp {(r.hourly_rate || 50000).toLocaleString('id-ID')}</td>
                  <td className="p-2.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${r.status === 'active' ? 'bg-amber-950 text-amber-300 border border-amber-800' : 'bg-green-950 text-green-300 border border-green-800'}`}>
                      {r.status === 'active' ? 'TERISI' : 'KOSONG'}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <div className="flex justify-center space-x-1">
                      <button onClick={() => startEdit(r)} className="p-1.5 bg-blue-950 hover:bg-blue-900 border border-blue-700 text-blue-300 rounded-lg" title="Edit"><Edit2 size={12}/></button>
                      <button onClick={() => handleDeleteRoom(r.id)} className="p-1.5 bg-red-950 hover:bg-red-900 border border-red-700 text-red-300 rounded-lg" title="Hapus"><Trash2 size={12}/></button>
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