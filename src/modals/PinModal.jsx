// src/modals/PinModal.jsx
import { Lock, X } from 'lucide-react';

export default function PinModal({ setShowPinModal, handleVerifyPin, pinInput, setPinInput }) {
  return (
    <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-80 rounded-2xl border shadow-2xl p-6 bg-card border-gray-700 text-white">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold flex items-center text-amber-400"><Lock size={18} className="mr-2"/> Verifikasi Owner</h3>
          <button onClick={() => setShowPinModal(false)}><X className="text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleVerifyPin} className="space-y-4">
          <input type="password" maxLength={6} value={pinInput} onChange={(e) => setPinInput(e.target.value)} className="w-full text-center text-2xl tracking-widest font-bold border rounded-xl p-3 bg-dark border-gray-700 text-white focus:border-amber-400 outline-none" placeholder="****" autoFocus />
          <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 font-bold rounded-xl text-white shadow-lg">MASUK OWNER</button>
        </form>
      </div>
    </div>
  );
}