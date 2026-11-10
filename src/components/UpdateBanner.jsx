import { RefreshCw } from 'lucide-react';

export default function UpdateBanner({ latestVersion, downloadUrl, setUpdateAvailable }) {
  return (
    <div className="mb-4 p-3 bg-blue-950 border-2 border-blue-500 rounded-2xl flex justify-between items-center shadow-lg animate-pulse">
      <div className="flex items-center space-x-3">
        <RefreshCw className="text-blue-400 animate-spin" size={24} />
        <div>
          <p className="font-bold text-sm text-blue-200">Pembaruan Aplikasi Tersedia! (v{latestVersion})</p>
          <p className="text-xs text-blue-300">Versi baru siap dipasang di tablet ini.</p>
        </div>
      </div>
      <div className="flex space-x-2">
        <button 
          onClick={() => setUpdateAvailable(false)} 
          className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl"
        >
          Nanti
        </button>
        <a 
          href={downloadUrl} 
          target="_blank" 
          rel="noreferrer" 
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl shadow flex items-center"
        >
          Update Sekarang
        </a>
      </div>
    </div>
  );
}