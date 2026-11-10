import React, { useState } from 'react';
import { 
  ShieldCheck, Lock, LogOut, KeyRound, Home, Wallet, 
  Download, Users, Coffee, FileText, Printer, Settings, ChevronDown 
} from 'lucide-react';

export default function Header({
  userRole, setUserRole, currentVersion, handleProtectedAction, setShowChangePinModal,
  handleExportData, setShowHistoryModal, setShowPinModal
}) {
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);

  return (
    <div className="flex justify-between items-center mb-5 pb-4 border-b border-gray-800/80">
      {/* KIRI: Logo & Badge Status Mode */}
      <div className="flex items-center space-x-3">
        <img 
          src="/logo-header.jpg" 
          alt="Tirta Perkasa Karaoke" 
          className="h-11 w-auto object-contain rounded-lg border border-amber-500/30 shadow-md"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="flex items-center space-x-2">
          <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full flex items-center shadow-sm ${
            userRole === 'owner' 
              ? 'bg-amber-950/80 text-amber-300 border border-amber-700/80' 
              : 'bg-blue-950/80 text-blue-300 border border-blue-800/80'
          }`}>
            {userRole === 'owner' ? <ShieldCheck size={12} className="mr-1"/> : <Lock size={12} className="mr-1"/>}
            MODE: {userRole.toUpperCase()} (v{currentVersion})
          </span>
          {userRole === 'owner' ? (
            <button 
              onClick={() => setUserRole('kasir')} 
              className="text-[11px] text-gray-400 hover:text-white underline flex items-center transition-colors"
            >
              <LogOut size={10} className="mr-0.5"/> Keluar Owner
            </button>
          ) : (
            <button 
              onClick={() => setShowPinModal(true)} 
              className="text-[11px] text-amber-400 hover:text-amber-300 underline font-semibold flex items-center transition-colors"
            >
              <KeyRound size={10} className="mr-0.5"/> Login Owner
            </button>
          )}
        </div>
      </div>

      {/* KANAN: Tombol Utama & Dropdown Owner Menu */}
      <div className="flex space-x-2.5 items-center">
        {/* Dropdown Menu Pengaturan Owner */}
        {userRole === 'owner' && (
          <div className="relative">
            <button 
              onClick={() => setShowOwnerMenu(!showOwnerMenu)} 
              className="px-3.5 py-2.5 rounded-xl border bg-purple-950/40 border-purple-800/80 text-purple-300 hover:bg-purple-900/60 font-bold text-xs flex items-center transition-all shadow-md active:scale-95"
            >
              <Settings size={15} className="mr-1.5 text-purple-400"/> 
              Kelola Toko 
              <ChevronDown size={14} className={`ml-1 transition-transform duration-200 ${showOwnerMenu ? 'rotate-180' : ''}`} />
            </button>

            {showOwnerMenu && (
              <div 
                className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#1a1f26] border border-gray-700 shadow-2xl z-50 py-2 space-y-1 backdrop-blur-md"
                onMouseLeave={() => setShowOwnerMenu(false)}
              >
                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-800">
                  Menu Master & Penggajian
                </div>
                <button onClick={() => { setShowOwnerMenu(false); handleProtectedAction('roomMaster'); }} className="w-full text-left px-3.5 py-2 hover:bg-purple-900/40 text-xs font-semibold text-gray-200 flex items-center space-x-2">
                  <Home size={15} className="text-purple-400"/> <span>Master Room & Tarif</span>
                </button>
                <button onClick={() => { setShowOwnerMenu(false); handleProtectedAction('fnbMaster'); }} className="w-full text-left px-3.5 py-2 hover:bg-amber-900/40 text-xs font-semibold text-gray-200 flex items-center space-x-2">
                  <Coffee size={15} className="text-amber-400"/> <span>Master F&B & Stok</span>
                </button>
                <button onClick={() => { setShowOwnerMenu(false); handleProtectedAction('lcMaster'); }} className="w-full text-left px-3.5 py-2 hover:bg-blue-900/40 text-xs font-semibold text-gray-200 flex items-center space-x-2">
                  <Users size={15} className="text-blue-400"/> <span>Master Data LC</span>
                </button>
                <button onClick={() => { setShowOwnerMenu(false); handleProtectedAction('lcPayout'); }} className="w-full text-left px-3.5 py-2 hover:bg-green-900/40 text-xs font-semibold text-gray-200 flex items-center space-x-2">
                  <Wallet size={15} className="text-green-400"/> <span>Gaji LC (Sabtu Payday)</span>
                </button>
                <div className="border-t border-gray-800 my-1"></div>
                <button onClick={() => { setShowOwnerMenu(false); setShowChangePinModal(true); }} className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-xs font-semibold text-gray-300 flex items-center space-x-2">
                  <KeyRound size={15} className="text-amber-400"/> <span>Ganti PIN Owner</span>
                </button>
                <button onClick={() => { setShowOwnerMenu(false); handleExportData(); }} className="w-full text-left px-3.5 py-2 hover:bg-gray-800 text-xs font-semibold text-gray-300 flex items-center space-x-2">
                  <Download size={15} className="text-blue-400"/> <span>Backup Database JSON</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Tombol Akses Cepat Riwayat */}
        <button 
          onClick={() => setShowHistoryModal(true)} 
          className="px-3.5 py-2.5 rounded-xl border bg-gray-900/90 border-gray-700 hover:bg-gray-800 text-gray-200 text-xs font-bold transition-all flex items-center shadow-sm"
          title="Riwayat Transaksi"
        >
          <FileText size={15} className="mr-1.5 text-blue-400" /> Riwayat
        </button>

        {/* Tombol Akses Cepat Laporan (Owner Only) */}
        {userRole === 'owner' && (
          <button 
            onClick={() => handleProtectedAction('report')} 
            className="px-4 py-2.5 bg-primary hover:bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 flex items-center text-xs transition-all active:scale-95"
          >
            <Printer size={15} className="mr-1.5" /> Laporan PDF
          </button>
        )}
      </div>
    </div>
  );
}