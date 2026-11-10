import React, { useState } from 'react';
import { ShieldAlert, Copy, Check, Lock, KeyRound } from 'lucide-react';
import { getDeviceId, verifyLicenseKey } from '../utils/licenseHelpers';

export default function LicenseModal({ setIsActivated }) {
  const deviceId = getDeviceId();
  const [serialInput, setSerialInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleCopyId = () => {
    navigator.clipboard.writeText(deviceId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleActivate = (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    const isValid = verifyLicenseKey(serialInput);
    if (isValid) {
      alert("Aplikasi Berhasil Diaktifkan! Selamat Menggunakan Tirta Perkasa POS.");
      setIsActivated(true);
    } else {
      setErrorMessage("Serial Key tidak cocok untuk Kode Perangkat ini!");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[999] p-4">
      <div className="bg-[#12161f] border border-amber-500/40 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative overflow-hidden text-center space-y-5">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600"></div>

        <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto text-amber-400 shadow-inner">
          <Lock size={32} />
        </div>

        <div>
          <h2 className="text-xl font-serif font-bold text-white tracking-wide">Aktivasi Hak Paten Perangkat</h2>
          <p className="text-xs text-gray-400 mt-1">
            Aplikasi ini dilindungi lisensi khusus Tirta Perkasa POS. Kirimkan Kode Perangkat berikut kepada Developer untuk mendapatkan Kunci Lisensi.
          </p>
        </div>

        {/* Box Display Device ID */}
        <div className="bg-[#1a202c] border border-gray-700/80 p-3.5 rounded-2xl text-left space-y-1">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">KODE ID PERANGKAT ANDA:</span>
          <div className="flex items-center justify-between bg-black/50 p-2.5 rounded-xl border border-gray-800">
            <span className="font-mono font-extrabold text-sm text-yellow-300 tracking-wider">{deviceId}</span>
            <button
              onClick={handleCopyId}
              type="button"
              className="px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg text-xs font-bold flex items-center transition-colors"
            >
              {copied ? <Check size={14} className="mr-1 text-green-400" /> : <Copy size={14} className="mr-1" />}
              {copied ? 'Tersalin' : 'Salin Kode'}
            </button>
          </div>
        </div>

        {/* Form Input Serial Key */}
        <form onSubmit={handleActivate} className="space-y-3 text-left">
          <div>
            <label className="block text-xs font-bold text-gray-300 mb-1 flex items-center">
              <KeyRound size={14} className="mr-1 text-amber-400" /> Masukkan Serial Key Aktivasi:
            </label>
            <input
              type="text"
              value={serialInput}
              onChange={(e) => setSerialInput(e.target.value.toUpperCase())}
              placeholder="Contoh: LIC-XXXX-XXXX"
              className="w-full bg-[#181e29] border border-gray-700 rounded-xl p-3 text-sm font-mono text-center text-green-400 font-bold uppercase tracking-widest outline-none focus:border-amber-500 shadow-inner"
              required
            />
          </div>

          {errorMessage && (
            <div className="p-2.5 bg-red-950/60 border border-red-800 text-red-300 text-xs rounded-xl flex items-center justify-center font-semibold">
              <ShieldAlert size={14} className="mr-1.5 shrink-0" /> {errorMessage}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all active:scale-95"
          >
            Aktifkan Lisensi Perangkat
          </button>
        </form>

        <p className="text-[10px] text-gray-500 font-mono">
          Lisensi terikat secara permanen pada Hardware Device ID perangkat ini.
        </p>
      </div>
    </div>
  );
}