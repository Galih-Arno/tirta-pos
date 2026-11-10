import dayjs from 'dayjs';

export function calculateBillableHours(startIso, endIso = null) {
  if (!startIso) return 0;
  const start = dayjs(startIso);
  const end = endIso ? dayjs(endIso) : dayjs();
  const totalMinutes = Math.max(0, end.diff(start, 'minute'));

  if (totalMinutes === 0) return 0;
  if (totalMinutes <= 30) return 0.5;

  const blocks = Math.floor(totalMinutes / 30);
  const remainder = totalMinutes % 30;
  const finalBlocks = remainder >= 15 ? blocks + 1 : blocks;
  return Math.max(0.5, finalBlocks * 0.5);
}

export function calculateLcCost(hours) {
  if (hours <= 0) return 0;
  const fullHours = Math.floor(hours);
  const hasHalfHour = (hours % 1) >= 0.5;
  return (fullHours * 85000) + (hasHalfHour ? 45000 : 0);
}

export function formatDurationLabel(hours) {
  if (!hours || hours <= 0) return '0 Jam';
  const fullH = Math.floor(hours);
  const hasHalf = (hours % 1) >= 0.5;
  if (fullH > 0 && hasHalf) return `${fullH} Jam 30 Menit`;
  if (fullH > 0) return `${fullH} Jam`;
  if (hasHalf) return `30 Menit`;
  return `${hours} Jam`;
}

export function getLcCalculationDetail(hours) {
  if (!hours || hours <= 0) return '0 Jam';
  const fullH = Math.floor(hours);
  const hasHalf = (hours % 1) >= 0.5;

  const parts = [];
  if (fullH > 0) parts.push(`${fullH} jam (@ Rp 85.000)`);
  if (hasHalf) parts.push(`30 mnt (@ Rp 45.000)`);
  return parts.join(' + ');
}

/**
 * Menghitung nominal bersih uang yang benar-benar masuk ke kasir (dikurangi kembalian)
 */
export function calculateNetPayment(amountPaid = 0, changeGiven = 0) {
  return Math.max(0, (amountPaid || 0) - (changeGiven || 0));
}

/**
 * Menghitung akumulasi lengkap neraca transaksi berjalan / selesai
 */
export function calculateTransactionSummary(trx, trxFnb = [], trxLcs = [], trxPayments = [], roomRate = 50000) {
  if (!trx) {
    return {
      roomSubtotal: 0,
      fnbSubtotal: 0,
      lcSubtotal: 0,
      grossTotal: 0,
      discount: 0,
      netTotal: 0,
      totalPaidNet: 0,
      remainingDebt: 0,
      isSettled: false
    };
  }

  const durationHours = trx.duration_hours || 0;
  const roomSubtotal = trx.room_id ? (trx.room_subtotal ?? Math.round(durationHours * roomRate)) : 0;
  const fnbSubtotal = trxFnb.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  
  const lcSubtotal = trxLcs.reduce((sum, item) => {
    const hours = item.hours || durationHours;
    return sum + calculateLcCost(hours);
  }, 0);

  const grossTotal = roomSubtotal + fnbSubtotal + lcSubtotal;
  const discount = trx.discount || 0;
  const netTotal = Math.max(0, grossTotal - discount);

  // Perhitungan total dana tunai/transfer bersih yang sudah diterima
  let totalPaidNet = 0;
  if (trxPayments && trxPayments.length > 0) {
    totalPaidNet = trxPayments.reduce((sum, p) => sum + calculateNetPayment(p.amount_paid, p.change_given), 0);
  } else {
    totalPaidNet = trx.amount_paid || 0;
  }

  const remainingDebt = Math.max(0, netTotal - totalPaidNet);
  const isSettled = remainingDebt === 0 && netTotal > 0;

  return {
    roomSubtotal,
    fnbSubtotal,
    lcSubtotal,
    grossTotal,
    discount,
    netTotal,
    totalPaidNet,
    remainingDebt,
    isSettled
  };
}