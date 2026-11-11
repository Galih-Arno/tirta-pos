import dayjs from 'dayjs';

export default function RoomGrid({ rooms, activeTransactions, selectedRoom, setSelectedRoom, isNonRoomMode, setIsNonRoomMode, currentTime }) {
  return (
    <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-1 flex-1">
      {rooms?.map((room) => {
        const trx = room.status === 'active' ? activeTransactions?.find(t => t.room_id === room.id) : null;
        const isActive = room.status === 'active';
        const isSelected = selectedRoom?.id === room.id && !isNonRoomMode;
        return (
          <div 
            key={room.id} 
            onClick={() => { setIsNonRoomMode(false); setSelectedRoom(room); }} 
            className={`p-6 rounded-2xl cursor-pointer border-2 transition-all duration-300 shadow-md ${
              isSelected ? 'border-primary ring-4 ring-primary/20 scale-[1.01]' : 'border-transparent'
            } ${
              isActive 
                ? 'bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-blue-500/50' 
                : 'bg-card hover:bg-gray-800/80 border-gray-800'
            }`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold font-serif tracking-wide text-gray-200">{room.room_number}</h2>
                <span className="text-[11px] text-gray-400 font-mono">Rp {(room.hourly_rate||50000).toLocaleString('id-ID')}/jam</span>
              </div>
              {trx && (
                <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                  {trx.billing_type}
                </span>
              )}
            </div>

            {trx && (
              <div className="mt-3 px-3 py-2 rounded-xl border font-bold text-base truncate bg-black/55 border-blue-400/60 text-blue-300 shadow-inner flex justify-between items-center">
                <span>👤 {trx.guest_name}</span>
              </div>
            )}

            <div className="mt-4 flex items-center justify-center h-16">
              {room.status === 'available' ? (
                <span className="text-2xl font-mono font-extrabold tracking-widest text-success">KOSONG</span>
              ) : (
                trx && (
                  trx.billing_type === 'fixed' ? (
                    <span className={`text-3xl font-mono font-bold ${dayjs(trx.end_time).diff(currentTime, 's') <= 600 ? 'text-warning animate-pulse' : 'text-blue-400'}`}>
                      {dayjs(trx.end_time).diff(currentTime, 's') > 0 ? dayjs().startOf('day').add(dayjs(trx.end_time).diff(currentTime, 's'), 'second').format('HH:mm:ss') : 'HABIS'}
                    </span>
                  ) : (
                    <span className="text-3xl font-mono font-bold text-warning animate-pulse">
                      {(() => {
                        const diffSec = currentTime.diff(dayjs(trx.start_time), 'second');
                        const h = Math.floor(diffSec / 3600).toString().padStart(2, '0');
                        const m = Math.floor((diffSec % 3600) / 60).toString().padStart(2, '0');
                        const s = (diffSec % 60).toString().padStart(2, '0');
                        return `${h}:${m}:${s}`;
                      })()}
                    </span>
                  )
                )
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}