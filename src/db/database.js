import Dexie from 'dexie';

// Inisialisasi Database Lokal
export const db = new Dexie('TirtaPOS_DB');

db.version(1).stores({
  // Tabel Master
  rooms: '++id, room_number, hourly_rate, status',
  products: '++id, name, buy_price, sell_price, stock, status',
  lcs: '++id, name, type, status', 
  
  // Tabel Transaksi
  transactions: '++id, bill_number, guest_name, room_id, start_time, end_time, billing_type, duration_hours, amount_paid, debt_amount, discount, payment_method, status, guest_contact',
  
  // Tabel Relasi Detail
  transaction_fnb: '++id, transaction_id, product_id, qty, price_at_transaction, subtotal',
  transaction_lcs: '++id, transaction_id, lc_id, lc_name'
});

// Fungsi untuk menyuntikkan data awal (Seeding) saat pertama kali aplikasi dibuka
export async function seedInitialData() {
  const roomCount = await db.rooms.count();
  if (roomCount === 0) {
    await db.rooms.bulkAdd([
      { room_number: 'ROOM 1', hourly_rate: 50000, status: 'available' },
      { room_number: 'ROOM 2', hourly_rate: 50000, status: 'available' },
      { room_number: 'ROOM 3', hourly_rate: 75000, status: 'available' },
      { room_number: 'ROOM 4', hourly_rate: 50000, status: 'available' }
    ]);
    console.log("Master Ruangan berhasil dibuat.");
  }
}