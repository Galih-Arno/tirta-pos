import { ShieldCheck, Lock, LogOut, KeyRound, Home, Wallet, Download, Users, Coffee, FileText, Printer } from 'lucide-react';

export default function Header({
  userRole, setUserRole, currentVersion, handleProtectedAction, setShowChangePinModal,
  handleExportData, setShowHistoryModal, setShowPinModal
}) {
  return (
    <div className="flex justify-between items-center mb-6">
      <div>
        <img 
          src="/logo-header.jpg" 
          alt="Tirta Perkasa Karaoke" 
          className="h-14 w-auto object-contain rounded-lg border border-amber-500/30 shadow-md mb-2"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="flex items-center space-x-2 mt-1">
          <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full flex items-center ${userRole === 'owner' ? 'bg-amber-900/60 text-amber-400 border border-amber-700' : 'bg-blue-900/60 text-blue-400 border border-blue-800'}`}>
            {userRole === 'owner' ? <ShieldCheck size={12} className="mr-1"/> : <Lock size={12} className="mr-1"/>}
            MODE: {userRole.toUpperCase()} (v{currentVersion})
          </span>
          {userRole === 'owner' ? (
            <button onClick={() => setUserRole('kasir')} className="text-[11px] text-gray-400 hover:text-white underline flex items-center">
              <LogOut size={10} className="mr-0.5"/> Logout Owner
            </button>
          ) : (
            <button onClick={() => setShowPinModal(true)} className="text-[11px] text-amber-400 hover:text-amber-300 underline flex items-center">
              <KeyRound size={10} className="mr-0.5"/> Login Owner
            </button>
          )}
        </div>
      </div>

      <div className="flex space-x-2 items-center">
        {userRole === 'owner' && (
          <>
            <button onClick={() => handleProtectedAction('roomMaster')} className="p-2.5 rounded-xl border bg-purple-950/40 border-purple-800 text-purple-300 hover:bg-purple-900/60 transition-all flex items-center text-xs font-bold" title="Master Room & Tarif"><Home size={16} className="mr-1"/> Master Room</button>
            <button onClick={() => handleProtectedAction('lcPayout')} className="p-2.5 rounded-xl border bg-green-950/40 border-green-800 text-green-300 hover:bg-green-900/60 transition-all flex items-center text-xs font-bold" title="Penggajian LC Sabtu"><Wallet size={16} className="mr-1"/> Gaji LC</button>
            <button onClick={() => setShowChangePinModal(true)} className="p-2.5 rounded-xl border bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/60 transition-all" title="Ganti PIN Owner"><KeyRound size={18} /></button>
            <button onClick={handleExportData} className="p-2.5 rounded-xl border bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 transition-all" title="Backup Database (JSON)"><Download size={18} /></button>
            <button onClick={() => handleProtectedAction('lcMaster')} className="p-2.5 rounded-xl border bg-card border-gray-700 hover:bg-gray-800 text-gray-200 transition-all" title="Kelola Master LC"><Users size={18} /></button>
            <button onClick={() => handleProtectedAction('fnbMaster')} className="p-2.5 rounded-xl border bg-card border-gray-700 hover:bg-gray-800 text-gray-200 transition-all" title="Kelola Master F&B & Stok"><Coffee size={18} /></button>
          </>
        )}

        <button onClick={() => setShowHistoryModal(true)} className="p-2.5 rounded-xl border bg-card border-gray-700 hover:bg-gray-800 text-gray-200 transition-all" title="Riwayat Transaksi"><FileText size={18} /></button>

        {userRole === 'owner' && (
          <button onClick={() => handleProtectedAction('report')} className="px-3.5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center text-xs transition-all" title="Laporan Owner PDF"><Printer size={16} className="mr-1.5" /> Laporan</button>
        )}
      </div>
    </div>
  );
}