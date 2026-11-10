/**
 * Memformat angka mentah / string angka menjadi format Rupiah berpemisah ribuan (titik).
 * Contoh: 600000 -> "Rp 600.000"
 */
export function formatRupiah(value, withPrefix = true, withSuffix = false) {
  if (value === null || value === undefined || value === '') return '';
  
  // Hapus semua karakter selain angka
  const numericString = String(value).replace(/\D/g, '');
  if (!numericString) return '';
  
  const number = parseInt(numericString, 10);
  const formatted = number.toLocaleString('id-ID');

  let result = formatted;
  if (withPrefix) result = `Rp ${result}`;
  if (withSuffix) result = `${result},-`;
  
  return result;
}

/**
 * Mengubah string Rupiah terformat kembali menjadi integer mentah untuk disimpan di database.
 * Contoh: "Rp 600.000" -> 600000
 */
export function parseRupiah(formattedValue) {
  if (!formattedValue) return 0;
  const numericString = String(formattedValue).replace(/\D/g, '');
  return numericString ? parseInt(numericString, 10) : 0;
}