import { Users, X, CheckCircle } from 'lucide-react';

export default function LcModal({ selectedRoom, setShowLcModal, lcs, selectedLcIds, setSelectedLcIds, handleSaveLc }) {
  return (
    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="w-[450px] max-h-[85vh] rounded-2xl border shadow-2xl p-6 flex flex-col bg-card border-gray-700 text-white">
        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-800">
          <h3 className="text-xl font-serif font-bold text-blue-400 flex items-center">
            <Users size={20} className="mr-2"/> Pilih Companion LC ({selectedRoom?.room_number})
          </h3>
          <button onClick={() => setShowLcModal(false)}><X className="text-gray-400 hover:text-white" /></button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 mb-4">
          {lcs?.map(lc => {
            const isSelected = selectedLcIds.includes(lc.id);
            return (
              <div 
                key={lc.id} 
                onClick={() => {
                  if (isSelected) {
                    setSelectedLcIds(selectedLcIds.filter(id => id !== lc.id));
                  } else {
                    setSelectedLcIds([...selectedLcIds, lc.id]);
                  }
                }}
                className={`flex justify-between items-center p-3.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected ? 'bg-blue-950/70 border-blue-500 text-white' : 'bg-dark border-gray-800 text-gray-400 hover:border-gray-700'
                }`}
              >
                <div>
                  <p className="font-bold text-sm">{lc.name}</p>
                  <p className="text-xs opacity-75 capitalize">Tipe: {lc.type}</p>
                </div>
                <div className={`w-6 h-6 rounded-lg border flex items-center justify-center ${isSelected ? 'bg-blue-600 border-blue-400' : 'border-gray-600'}`}>
                  {isSelected && <CheckCircle size={16} className="text-white" />}
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t pt-4 border-gray-800 flex space-x-3">
          <button 
            onClick={() => setShowLcModal(false)} 
            className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold rounded-xl text-sm"
          >
            Batal
          </button>
          <button 
            onClick={handleSaveLc} 
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm shadow-lg"
          >
            Simpan LC Selected
          </button>
        </div>
      </div>
    </div>
  );
}