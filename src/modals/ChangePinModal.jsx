// src/modals/ChangePinModal.jsx
import { X } from 'lucide-react';

export default function ChangePinModal({
  setShowChangePinModal, handleChangePin, oldPinInput, setOldPinInput,
  newPinInput, setNewPinInput, confirmPinInput, setConfirmPinInput
}) {
  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-80 rounded-2xl border shadow-2xl p-6 bg-card border-gray-700 text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-amber-400">Ganti PIN Owner</h3>
          <button onClick={() => setShowChangePinModal(false)}><X className="text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleChangePin} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">PIN Lama</label>
            <input type="password" maxLength={6} value={oldPinInput} onChange={e => setOldPinInput(e.target.value)} className="w-full border rounded-xl p-2.5 text-center font-bold bg-dark border-gray-700 text-white outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">PIN Baru</label>
            <input type="password" maxLength={6} value={newPinInput} onChange={e => setNewPinInput(e.target.value)} className="w-full border rounded-xl p-2.5 text-center font-bold bg-dark border-gray-700 text-white outline-none" />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 text-gray-300">Konfirmasi PIN Baru</label>
            <input type="password" maxLength={6} value={confirmPinInput} onChange={e => setConfirmPinInput(e.target.value)} className="w-full border rounded-xl p-2.5 text-center font-bold bg-dark border-gray-700 text-white outline-none" />
          </div>
          <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 font-bold rounded-xl text-white shadow-lg mt-2">SIMPAN PIN BARU</button>
        </form>
      </div>
    </div>
  );
}