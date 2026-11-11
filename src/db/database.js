import Dexie from 'dexie';

export const db = new Dexie('TirtaPOS_DB');

db.version(1).stores({
  rooms: '++id, room_number, hourly_rate, status',
  products: '++id, name, buy_price, sell_price, stock, status',
  lcs: '++id, name, type, status', 
  transactions: '++id, bill_number, guest_name, room_id, start_time, end_time, billing_type, duration_hours, amount_paid, debt_amount, discount, payment_method, status, guest_contact',
  transaction_fnb: '++id, transaction_id, product_id, qty, price_at_transaction, subtotal',
  transaction_lcs: '++id, transaction_id, lc_id, lc_name'
});

db.version(2).stores({
  rooms: '++id, room_number, hourly_rate, status',
  products: '++id, name, buy_price, sell_price, stock, status',
  lcs: '++id, name, type, status', 
  transactions: '++id, bill_number, guest_name, room_id, start_time, end_time, billing_type, duration_hours, amount_paid, debt_amount, discount, payment_method, status, guest_contact',
  transaction_fnb: '++id, transaction_id, product_id, qty, price_at_transaction, subtotal',
  transaction_lcs: '++id, transaction_id, lc_id, lc_name',
  transaction_payments: '++id, transaction_id, payment_time, payment_method, amount_paid, change_given, note'
});

db.version(3).stores({
  rooms: '++id, room_number, hourly_rate, status',
  products: '++id, name, buy_price, sell_price, stock, status',
  lcs: '++id, name, type, status', 
  transactions: '++id, bill_number, guest_name, room_id, start_time, end_time, billing_type, duration_hours, amount_paid, debt_amount, discount, payment_method, status, guest_contact',
  transaction_fnb: '++id, transaction_id, product_id, qty, price_at_transaction, subtotal, order_time',
  transaction_lcs: '++id, transaction_id, lc_id, lc_name, start_time',
  transaction_payments: '++id, transaction_id, payment_time, payment_method, amount_paid, change_given, note'
});

export async function seedInitialData() {
  // 1. Inisialisasi Ruangan (Hanya jika belum ada data)
  if (await db.rooms.count() === 0) {
    await db.rooms.bulkAdd([
      { room_number: 'ROOM 1', hourly_rate: 50000, status: 'available' },
      { room_number: 'ROOM 2', hourly_rate: 50000, status: 'available' },
      { room_number: 'ROOM 3', hourly_rate: 75000, status: 'available' },
      { room_number: 'ROOM 4', hourly_rate: 50000, status: 'available' }
    ]);
  }

  // 2. Inisialisasi Produk F&B (Hanya jika belum ada data)
  if (await db.products.count() === 0) {
    await db.products.bulkAdd([
      { name: 'Anggur Merah', buy_price: 0, sell_price: 115000, stock: 0, status: 'active' },
      { name: 'Pigurr', buy_price: 0, sell_price: 100000, stock: 0, status: 'active' },
      { name: 'Atlas', buy_price: 0, sell_price: 140000, stock: 0, status: 'active' },
      { name: 'Kawa-Kawa', buy_price: 0, sell_price: 140000, stock: 0, status: 'active' },
      { name: 'Soju', buy_price: 0, sell_price: 140000, stock: 0, status: 'active' },
      { name: 'Bir Lemon', buy_price: 0, sell_price: 50000, stock: 0, status: 'active' },
      { name: 'Bir Putih', buy_price: 0, sell_price: 70000, stock: 0, status: 'active' },
      { name: 'Bir Hitam', buy_price: 0, sell_price: 80000, stock: 0, status: 'active' },
      { name: 'Bir Anggur', buy_price: 0, sell_price: 90000, stock: 0, status: 'active' },
      { name: 'M150', buy_price: 0, sell_price: 10000, stock: 0, status: 'active' },
      { name: 'Bintang Zero', buy_price: 0, sell_price: 20000, stock: 0, status: 'active' },
      { name: 'Aqua', buy_price: 0, sell_price: 10000, stock: 0, status: 'active' },
      { name: 'Susu Beruang', buy_price: 0, sell_price: 20000, stock: 0, status: 'active' },
      { name: 'Tisu', buy_price: 0, sell_price: 20000, stock: 0, status: 'active' },
      { name: 'Sampoerna Mild', buy_price: 0, sell_price: 50000, stock: 0, status: 'active' },
      { name: 'Esse Double', buy_price: 0, sell_price: 60000, stock: 0, status: 'active' },
      { name: 'Esse Change Biru', buy_price: 0, sell_price: 60000, stock: 0, status: 'active' },
      { name: 'Esse Juice', buy_price: 0, sell_price: 60000, stock: 0, status: 'active' },
      { name: 'LA Ice', buy_price: 0, sell_price: 50000, stock: 0, status: 'active' },
      { name: 'Class Mild', buy_price: 0, sell_price: 45000, stock: 0, status: 'active' },
      { name: 'Surya 16', buy_price: 0, sell_price: 50000, stock: 0, status: 'active' },
      { name: 'Dunhill', buy_price: 0, sell_price: 50000, stock: 0, status: 'active' },
      { name: 'Bull', buy_price: 0, sell_price: 45000, stock: 0, status: 'active' }
    ]);
  }

  // 3. Inisialisasi Master LC (Hanya jika belum ada data)
  if (await db.lcs.count() === 0) {
    await db.lcs.bulkAdd([
      { name: 'AnjeLL', type: 'tetap', hourly_rate_guest: 85000, hourly_rate_lc: 75000, status: 'available' },
      { name: 'Givia', type: 'tetap', hourly_rate_guest: 85000, hourly_rate_lc: 75000, status: 'available' },
      { name: 'Lita', type: 'tetap', hourly_rate_guest: 85000, hourly_rate_lc: 75000, status: 'available' },
      { name: 'Putri', type: 'tetap', hourly_rate_guest: 85000, hourly_rate_lc: 75000, status: 'available' },
      { name: 'Sisil', type: 'tetap', hourly_rate_guest: 85000, hourly_rate_lc: 75000, status: 'available' }
    ]);
  }
}