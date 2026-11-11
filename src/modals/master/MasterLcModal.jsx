import React from 'react';
import { X, Plus, Edit2, Trash2, Users, DollarSign } from 'lucide-react';
import CurrencyInput from '../../components/CurrencyInput';
import { formatRupiah } from '../../utils/currencyHelpers';

export default function MasterLcModal({
  setShowLcManageModal, editingLc, setEditingLc, handleSaveLcMaster,
  lcName, setLcName, lcType, setLcType,
  lcRateGuest, setLcRateGuest, lcRateLc, setLcRateLc,
  lcs, db
}) {
  const guestRateNum = Number(lcRateGuest) || 0;
  const lcRateNum = Number(lcRateLc) || 0;
  const houseFeeNum = Math.max(0, guestRateNum - lcRateNum);

  const startEdit = (lc) => {
    setEditingLc(lc);
    setLcName(lc.name);
    setLcType(lc.type || 'tetap');
    setLcRateGuest(lc.hourly_rate_guest || 85000);
    setLcRateLc(lc.hourly_rate_lc || 75000);
  };

  const cancelEdit = () => {
    setEditingLc(null);
    setLcName('');
    setLcType('tetap');
    setLcRateGuest(85000);
    setLcRateLc(75000);
  };

  const handleDelete = async (id) => {
    if (confirm("Hapus data LC ini?")) {
      await db.lcs.delete(id);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#161a20] border border-gray-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
        {/* Header Modal */}
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-black/40">
          <h3 className="text-lg font-serif font-bold text-blue-400 flex items-center">
            <Users size={20} className="mr-2" /> Master Kelola Ladies Companion (LC)
          </h3>
          <button onClick={() => setShowLcManageModal(false)} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-5 max-h-[80vh] overflow-y-auto">
          {/* Form Input / Edit LC */}
          <form onSubmit={handleSaveLcMaster} className="bg-[#101318] p-4 rounded-xl border border-gray-800 space-y-3">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              {editingLc ? `Edit Data LC: ${editingLc.name}` : 'Tambah Data LC Baru'}
            </h4>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Nama Panggilan LC</label>
                <input
                  type="text"
                  value={lcName}
                  onChange={e => setLcName(e.target.value)}
                  placeholder="Contoh: Siska"
                  className="w-full bg-[#181d24] border border-gray-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500 font-semibold"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Status Kemitraan</label>
                <select
                  value={lcType}
                  onChange={e => setLcType(e.target.value)}
                  className="w-full bg-[#181d24] border border-gray-700 rounded-xl p-2.5 text-xs text-white outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="tetap">Tetap (Reguler)</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
            </div>

            {/* Bagi Hasil & Skema Tarif */}
            <div className="pt-2 border-t border-gray-800/80">
              <label className="block text-xs font-bold text-amber-400 mb-2 flex items-center">
                <DollarSign size={14} className="mr-1" /> Pengaturan Tarif per Jam & Bagi Hasil
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <span className="block text-[11px] text-gray-400 mb-1">Tarif Ditagih ke Tamu (/jam):</span>
                  <CurrencyInput
                    value={lcRateGuest}
                    onChange={val => setLcRateGuest(val)}
                    placeholder="Rp 85.000"
                    className="w-full bg-[#181d24] border border-gray-700 rounded-xl p-2 text-xs font-mono font-bold text-amber-300 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <span className="block text-[11px] text-gray-400 mb-1">Hak Bersih Diterima LC (/jam):</span>
                  <CurrencyInput
                    value={lcRateLc}
                    onChange={val => setLcRateLc(val)}
                    placeholder="Rp 75.000"
                    className="w-full bg-[#181d24] border border-gray-700 rounded-xl p-2 text-xs font-mono font-bold text-green-400 outline-none focus:border-green-500"
                  />
                </div>
              </div>

              {/* Live Preview Profit Margin Owner */}
              <div className="mt-2.5 bg-blue-950/40 border border-blue-800/60 p-2.5 rounded-xl flex justify-between items-center text-xs">
                <span className="text-gray-300">Bagian / Fee Tempat Usaha (Owner):</span>
                <span className="font-mono font-bold text-blue-300">{formatRupiah(houseFeeNum)} / jam</span>
              </div>
            </div>

            <div className="flex space-x-2 pt-2">
              {editingLc && (
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-xs"
                >
                  Batal
                </button>
              )}
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs flex items-center justify-center shadow-md"
              >
                {editingLc ? 'Simpan Perubahan' : <><Plus size={14} className="mr-1"/> Tambah LC</>}
              </button>
            </div>
          </form>

          {/* Daftar LC */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Daftar LC Terdaftar</h4>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {lcs?.map(l => {
                const rGuest = l.hourly_rate_guest || 85000;
                const rLc = l.hourly_rate_lc || 75000;
                const rOwner = Math.max(0, rGuest - rLc);

                return (
                  <div key={l.id} className="flex justify-between items-center p-3 bg-[#101318] border border-gray-800 rounded-xl">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-sm text-white">{l.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${
                          l.type === 'freelance' ? 'bg-purple-950 text-purple-300 border border-purple-800' : 'bg-blue-950 text-blue-300 border border-blue-800'
                        }`}>
                          {l.type || 'tetap'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 font-mono">
                        Tamu: <strong className="text-amber-400">{formatRupiah(rGuest)}</strong> | LC: <strong className="text-green-400">{formatRupiah(rLc)}</strong> | Owner: <strong className="text-blue-300">{formatRupiah(rOwner)}</strong>
                      </p>
                    </div>
                    <div className="flex space-x-1.5">
                      <button onClick={() => startEdit(l)} className="p-2 bg-gray-800 hover:bg-blue-900 rounded-lg text-blue-400">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDelete(l.id)} className="p-2 bg-gray-800 hover:bg-red-900 rounded-lg text-red-400">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}