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

/**
 * Kalkulasi rincian tarif kotor, hak LC, dan house share berdasarkan objek LC atau masukan manual
 */
export function calculateLcCostDetails(hours, guestHourly = 85000, lcShareHourly = 75000) {
  if (hours <= 0) return { gross: 0, lcShare: 0, houseShare: 0 };
  
  const fullHours = Math.floor(hours);
  const hasHalf = (hours % 1) >= 0.5;

  // Rasio 30 menit disesuaikan proporsional
  const guestHalf = Math.round(guestHourly / 2) + (guestHourly % 20000 === 0 ? 0 : 2500); 
  const lcHalf = Math.round(lcShareHourly / 2) + (lcShareHourly % 20000 === 0 ? 0 : 2500);

  const gross = (fullHours * guestHourly) + (hasHalf ? guestHalf : 0);
  const lcShare = (fullHours * lcShareHourly) + (hasHalf ? lcHalf : 0);
  const houseShare = Math.max(0, gross - lcShare);

  return { gross, lcShare, houseShare };
}

export function calculateLcCost(hours, type = 'gross', guestHourly = 85000, lcShareHourly = 75000) {
  const details = calculateLcCostDetails(hours, guestHourly, lcShareHourly);
  if (type === 'lc_share') return details.lcShare;
  if (type === 'house_share') return details.houseShare;
  return details.gross;
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

export function getLcCalculationDetail(hours, guestHourly = 85000) {
  if (!hours || hours <= 0) return '0 Jam';
  const fullH = Math.floor(hours);
  const hasHalf = (hours % 1) >= 0.5;
  const guestHalf = Math.round(guestHourly / 2) + (guestHourly % 20000 === 0 ? 0 : 2500);

  const parts = [];
  if (fullH > 0) parts.push(`${fullH} jam (@ Rp ${guestHourly.toLocaleString('id-ID')})`);
  if (hasHalf) parts.push(`30 mnt (@ Rp ${guestHalf.toLocaleString('id-ID')})`);
  return parts.join(' + ');
}

export function calculateNetPayment(amountPaid = 0, changeGiven = 0) {
  return Math.max(0, (amountPaid || 0) - (changeGiven || 0));
}

export function calculateTransactionSummary(trx, trxFnb = [], trxLcs = [], trxPayments = [], roomRate = 50000, lcsMaster = []) {
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
    const masterLc = lcsMaster.find(l => l.id === item.lc_id);
    const guestRate = masterLc?.hourly_rate_guest || 85000;
    const lcRate = masterLc?.hourly_rate_lc || 75000;
    return sum + calculateLcCost(hours, 'gross', guestRate, lcRate);
  }, 0);

  const grossTotal = roomSubtotal + fnbSubtotal + lcSubtotal;
  const discount = trx.discount || 0;
  const netTotal = Math.max(0, grossTotal - discount);

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