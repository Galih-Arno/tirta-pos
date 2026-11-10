import dayjs from 'dayjs';
import { getBase64ImageFromUrl } from './imageHelpers';
import { 
  calculateLcCost, 
  formatDurationLabel, 
  getLcCalculationDetail,
  calculateTransactionSummary 
} from './billingHelpers';

export const handlePrintDraftReceipt = async (trxToPrint, rooms, db) => {
  if (!trxToPrint) return;

  const logoBase64 = await getBase64ImageFromUrl('/logo-struk.jpg');
  const roomObj = rooms?.find(r => r.id === trxToPrint.room_id);
  const roomName = roomObj ? roomObj.room_number : 'NON-ROOM (BAR)';
  const roomRate = roomObj ? (roomObj.hourly_rate || 50000) : 50000;
  const durationHours = trxToPrint.duration_hours || 0;

  const trxFnb = await db.transaction_fnb.where('transaction_id').equals(trxToPrint.id).toArray();
  const trxLcs = await db.transaction_lcs.where('transaction_id').equals(trxToPrint.id).toArray();
  const trxPayments = db.transaction_payments ? await db.transaction_payments.where('transaction_id').equals(trxToPrint.id).toArray() : [];

  const summary = calculateTransactionSummary(trxToPrint, trxFnb, trxLcs, trxPayments, roomRate);

  // Penentuan judul status struk
  let receiptTitle = '*** STRUK TRANSAKSI ***';
  if (trxToPrint.status === 'ongoing') {
    receiptTitle = '*** STRUK SEMENTARA (RUNNING) ***';
  } else if (summary.remainingDebt > 0 || trxToPrint.status === 'debt') {
    receiptTitle = '*** STRUK KASBON / KURANG BAYAR ***';
  } else if (summary.isSettled || trxToPrint.status === 'paid') {
    receiptTitle = '*** STRUK PELUNASAN (FINAL) ***';
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Struk - ${trxToPrint.bill_number}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { box-sizing: border-box; }
          body { font-family: 'Courier New', Courier, monospace; width: 72mm; padding: 3mm 2mm; margin: 0 auto; color: #000; font-size: 11px; line-height: 1.25; background: #fff; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .logo-struk { width: 100%; max-width: 240px; height: auto; margin: 0 auto 6px auto; display: block; filter: grayscale(100%); }
          .divider-double { border-bottom: 2px dashed #000; margin: 6px 0; }
          .divider-single { border-bottom: 1px dotted #000; margin: 4px 0; }
          .flex { display: flex; justify-content: space-between; }
          .subtitle { font-size: 9px; margin-top: 2px; }
          .item-row { margin-bottom: 4px; }
          .detail-line { font-size: 10px; color: #333; }
          .box-alert { border: 1px solid #000; padding: 4px; margin: 4px 0; background-color: #f9f9f9; }
        </style>
      </head>
      <body>
        <div class="text-center">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo-struk" alt="Tirta Perkasa Karaoke" />` : '<div class="bold" style="font-size:16px;">TIRTA PERKASA KARAOKE</div>'}
          <div class="subtitle">Desa Purworejo, Kec. Pasir Sakti, Lampung Timur</div>
          <div class="bold" style="margin-top:4px;">${receiptTitle}</div>
        </div>
        <div class="divider-double"></div>
        <div class="flex"><span>No. Nota:</span><span class="bold">${trxToPrint.bill_number}</span></div>
        <div class="flex"><span>Tgl/Waktu:</span><span>${dayjs(trxToPrint.start_time).format('DD/MM/YY HH:mm')}</span></div>
        <div class="flex"><span>Tamu:</span><span class="bold">${trxToPrint.guest_name}</span></div>
        <div class="flex"><span>Layanan:</span><span>${roomName}</span></div>
        <div class="divider-double"></div>

        ${trxToPrint.room_id ? `
          <div class="bold">1. SEWA RUANGAN</div>
          <div class="item-row">
            <div class="bold">${roomName}</div>
            <div class="detail-line">@ Rp ${roomRate.toLocaleString('id-ID')}/jam | x ${formatDurationLabel(durationHours)}</div>
            <div class="flex"><span>Subtotal Room</span><span class="bold">Rp ${summary.roomSubtotal.toLocaleString('id-ID')}</span></div>
          </div>
          <div class="divider-single"></div>
        ` : ''}

        ${trxFnb.length > 0 ? `
          <div class="bold">2. PESANAN F&B / MINUMAN</div>
          ${trxFnb.map(f => `
            <div class="item-row">
              <div class="bold">${f.product_name}</div>
              <div class="flex">
                <span class="detail-line">@ Rp ${f.price_at_transaction.toLocaleString('id-ID')} x ${f.qty}</span>
                <span class="bold">Rp ${f.subtotal.toLocaleString('id-ID')}</span>
              </div>
              ${f.order_time ? `<div class="detail-line" style="font-size:8px;">Waktu Order: ${dayjs(f.order_time).format('HH:mm')}</div>` : ''}
            </div>
          `).join('')}
          <div class="divider-single"></div>
        ` : ''}

        ${trxLcs.length > 0 ? `
          <div class="bold">3. LADIES COMPANION (LC)</div>
          ${trxLcs.map(l => {
            const lcCost = calculateLcCost(durationHours);
            const lcDetail = getLcCalculationDetail(durationHours);
            return `
              <div class="item-row">
                <div class="bold">${l.lc_name}</div>
                <div class="detail-line">${lcDetail}</div>
                <div class="flex">
                  <span>Komisi LC</span>
                  <span class="bold">Rp ${lcCost.toLocaleString('id-ID')}</span>
                </div>
              </div>
            `;
          }).join('')}
          <div class="divider-single"></div>
        ` : ''}

        <div class="flex">
          <span>Subtotal Kotor</span>
          <span>Rp ${summary.grossTotal.toLocaleString('id-ID')}</span>
        </div>
        ${summary.discount > 0 ? `
          <div class="flex">
            <span>Diskon Owner</span>
            <span>- Rp ${summary.discount.toLocaleString('id-ID')}</span>
          </div>
        ` : ''}
        
        <div class="flex bold" style="font-size: 12px; margin-top: 4px;">
          <span>TOTAL AKUMULASI</span>
          <span>Rp ${summary.netTotal.toLocaleString('id-ID')}</span>
        </div>

        <div class="divider-double"></div>
        <div class="bold">RIWAYAT PEMBAYARAN MASUK:</div>
        ${trxPayments.length > 0 ? trxPayments.map((p, idx) => {
          const pTime = p.payment_time ? dayjs(p.payment_time).format('HH:mm') : '';
          const netIn = (p.amount_paid || 0) - (p.change_given || 0);
          return `
            <div class="item-row">
              <div class="flex">
                <span>#${idx+1} (${p.payment_method.toUpperCase()}) ${pTime ? `[${pTime}]` : ''}</span>
                <span class="bold">Rp ${p.amount_paid.toLocaleString('id-ID')}</span>
              </div>
              ${p.change_given > 0 ? `
                <div class="flex text-right detail-line">
                  <span>Kembalian: Rp ${p.change_given.toLocaleString('id-ID')}</span>
                  <span>(Nett: Rp ${netIn.toLocaleString('id-ID')})</span>
                </div>
              ` : ''}
            </div>
          `;
        }).join('') : `
          <div class="flex">
            <span>Pembayaran Awal</span>
            <span>Rp ${(trxToPrint.amount_paid || 0).toLocaleString('id-ID')}</span>
          </div>
        `}

        <div class="divider-single"></div>
        <div class="flex bold">
          <span>TOTAL DIBAYAR</span>
          <span>Rp ${summary.totalPaidNet.toLocaleString('id-ID')}</span>
        </div>

        ${summary.remainingDebt > 0 ? `
          <div class="box-alert text-center" style="margin-top: 4px;">
            <div class="bold" style="font-size: 12px;">SISA KURANG BAYAR / KASBON</div>
            <div class="bold" style="font-size: 14px;">Rp ${summary.remainingDebt.toLocaleString('id-ID')}</div>
            <div class="subtitle">* Belum Termasuk Tambahan Waktu Sesi Running</div>
          </div>
        ` : `
          <div class="flex bold text-center" style="margin-top: 4px; font-size: 12px;">
            <span>STATUS TAGIHAN</span>
            <span>[ LUNAS ]</span>
          </div>
        `}

        <div class="divider-double"></div>
        <div class="text-center" style="margin-top: 8px;">
          <div class="bold">TERIMA KASIH ATAS KUNJUNGAN ANDA</div>
          <div class="subtitle">-TIRTA PERKASA KARAOKE-</div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); }, 500);
};

export const handlePrintReport = async (allTransactions, reportStartDate, reportEndDate, db) => {
  const reportTrx = allTransactions.filter(t => {
    if (t.status === 'ongoing') return false;
    const d = dayjs(t.start_time);
    return d.isAfter(dayjs(reportStartDate).startOf('day').subtract(1, 'second')) && 
           d.isBefore(dayjs(reportEndDate).endOf('day').add(1, 'second'));
  });

  let totalCash = 0, totalTransfer = 0, totalDebt = 0, totalRoom = 0, totalFnb = 0, totalDiscount = 0;
  let lcSummary = {};

  for (const trx of reportTrx) {
    const trxPayments = db.transaction_payments ? await db.transaction_payments.where('transaction_id').equals(trx.id).toArray() : [];
    
    if (trxPayments.length > 0) {
      for (const p of trxPayments) {
        const netAmt = p.amount_paid - (p.change_given || 0);
        if (p.payment_method === 'cash') totalCash += netAmt;
        if (p.payment_method === 'transfer') totalTransfer += netAmt;
      }
    } else {
      if (trx.payment_method === 'cash') totalCash += (trx.amount_paid || 0);
      if (trx.payment_method === 'transfer') totalTransfer += (trx.amount_paid || 0);
    }

    if (trx.status === 'debt' || (trx.debt_amount || 0) > 0) {
      totalDebt += (trx.debt_amount || 0);
    }

    totalRoom += (trx.room_subtotal || 0);
    totalFnb += (trx.fnb_subtotal || 0);
    totalDiscount += (trx.discount || 0);

    const trxLcs = await db.transaction_lcs.where('transaction_id').equals(trx.id).toArray();
    const hours = trx.duration_hours || 0;
    for (const l of trxLcs) {
      if (!lcSummary[l.lc_name]) lcSummary[l.lc_name] = { hours: 0, pay: 0 };
      lcSummary[l.lc_name].hours += hours;
      lcSummary[l.lc_name].pay += calculateLcCost(hours);
    }
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Laporan Pembukuan Owner - Tirta Perkasa Karaoke</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #000; }
          h2, h3 { text-align: center; margin: 3px 0; }
          .location { text-align: center; font-size: 11px; color: #444; margin-bottom: 15px; }
          .subtitle { text-align: center; font-size: 12px; color: #555; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 25px; }
          th, td { border: 1px solid #333; padding: 8px 12px; font-size: 12px; text-align: left; }
          th { background-color: #f2f2f2; }
          .text-right { text-align: right; }
          .box { border: 1px solid #333; padding: 10px; margin-bottom: 15px; }
          .signature { margin-top: 40px; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <h2>TIRTA PERKASA KARAOKE</h2>
        <div class="location">Desa Purworejo, Kec. Pasir Sakti, Lampung Timur, Lampung</div>
        <h3>LAPORAN REKAPITULASI KEUANGAN OWNER</h3>
        <div class="subtitle">Owner: I Ketut Sunetre | Periode: ${reportStartDate} s/d ${reportEndDate}</div>
        <div class="box">
          <strong>RINGKASAN ARUS KAS & OMZET</strong>
          <table>
            <tr><td>Total Pendapatan Tunai (Cash Nett)</td><td class="text-right">Rp ${totalCash.toLocaleString('id-ID')}</td></tr>
            <tr><td>Total Pendapatan Transfer / QRIS</td><td class="text-right">Rp ${totalTransfer.toLocaleString('id-ID')}</td></tr>
            <tr><td>Total Potongan Diskon Owner</td><td class="text-right">Rp ${totalDiscount.toLocaleString('id-ID')}</td></tr>
            <tr><td>Total Piutang / Kasbon Belum Lunas</td><td class="text-right" style="color: red;">Rp ${totalDebt.toLocaleString('id-ID')}</td></tr>
            <tr><td><strong>Pendapatan Kotor Ruangan & F&B</strong></td><td class="text-right"><strong>Rp ${(totalRoom + totalFnb).toLocaleString('id-ID')}</strong></td></tr>
          </table>
        </div>
        <div class="box">
          <strong>REKAPITULASI JAM TERBANG & KOMISI LC</strong>
          <table>
            <thead><tr><th>Nama LC</th><th>Total Jam Kerja</th><th>Hak Pendapatan LC</th></tr></thead>
            <tbody>
              ${Object.keys(lcSummary).length === 0 ? '<tr><td colspan="3" style="text-align:center;">Tidak ada data LC</td></tr>' : 
                Object.entries(lcSummary).map(([name, data]) => `<tr><td>${name}</td><td>${data.hours.toFixed(2)} Jam</td><td>Rp ${Math.round(data.pay).toLocaleString('id-ID')}</td></tr>`).join('')
              }
            </tbody>
          </table>
        </div>
        <div class="signature">
          <div>Kasir / Admin</div>
          <div>Purworejo, ${dayjs().format('DD MMMM YYYY')}<br/><br/>I Ketut Sunetre<br/><strong>Owner / Pengelola</strong></div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); }, 500);
};

export const handlePrintLcPayoutSlip = async (selectedLcForPayout, payoutStartDate, payoutEndDate, rooms, db) => {
  if (!selectedLcForPayout) return alert("Pilih nama LC terlebih dahulu!");

  const logoBase64 = await getBase64ImageFromUrl('/logo-struk.jpg');
  const allLcLogs = await db.transaction_lcs.where('lc_name').equals(selectedLcForPayout).toArray();
  const filteredLogs = [];
  let totalLcHours = 0, totalLcEarnings = 0;

  for (const log of allLcLogs) {
    const parentTrx = await db.transactions.get(log.transaction_id);
    if (parentTrx && parentTrx.status !== 'ongoing') {
      const trxDate = dayjs(parentTrx.start_time);
      if (trxDate.isAfter(dayjs(payoutStartDate).startOf('day').subtract(1, 'second')) &&
          trxDate.isBefore(dayjs(payoutEndDate).endOf('day').add(1, 'second'))) {
        const roomObj = rooms?.find(r => r.id === parentTrx.room_id);
        const hours = parentTrx.duration_hours || 0;
        const cost = calculateLcCost(hours);
        totalLcHours += hours; 
        totalLcEarnings += cost;
        filteredLogs.push({ 
          bill_number: parentTrx.bill_number, 
          date: dayjs(parentTrx.start_time).format('DD/MM/YY HH:mm'), 
          room_name: roomObj?.room_number || 'Room', 
          hours, 
          cost 
        });
      }
    }
  }

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Slip Gaji LC - ${selectedLcForPayout}</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          * { box-sizing: border-box; }
          body { font-family: 'Courier New', Courier, monospace; width: 72mm; padding: 3mm 2mm; margin: 0 auto; color: #000; font-size: 11px; line-height: 1.25; background: #fff; }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          .logo-struk { width: 100%; max-width: 240px; height: auto; margin: 0 auto 6px auto; display: block; filter: grayscale(100%); }
          .divider-double { border-bottom: 2px dashed #000; margin: 6px 0; }
          .divider-single { border-bottom: 1px dotted #000; margin: 4px 0; }
          .flex { display: flex; justify-content: space-between; }
          .subtitle { font-size: 9px; margin-top: 2px; }
        </style>
      </head>
      <body>
        <div class="text-center">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo-struk" alt="Tirta Perkasa Karaoke" />` : '<div class="bold" style="font-size:16px;">TIRTA PERKASA KARAOKE</div>'}
          <div style="font-size:9px;">SLIP GAJI & KOMISI LC</div>
          <div class="bold" style="margin-top:4px;">*** SABTU PAYDAY ***</div>
        </div>
        <div class="divider-double"></div>
        <div class="flex"><span>Nama LC:</span><span class="bold">${selectedLcForPayout}</span></div>
        <div class="flex"><span>Periode:</span><span>${payoutStartDate} s/d ${payoutEndDate}</span></div>
        <div class="divider-double"></div>
        <div class="bold">RINCIAN JAM TERBANG:</div>
        ${filteredLogs.map(l => `<div class="flex"><span>${l.date} - ${l.room_name} (${l.hours}h)</span><span class="bold">Rp ${l.cost.toLocaleString('id-ID')}</span></div>`).join('')}
        <div class="divider-single"></div>
        <div class="flex bold" style="font-size: 13px;"><span>TOTAL GAJI:</span><span>Rp ${totalLcEarnings.toLocaleString('id-ID')}</span></div>
        <div class="divider-double"></div>
        <div class="text-center" style="margin-top: 8px;">
          <div class="bold">TERIMA KASIH DUKUNGANNYA</div>
          <div class="subtitle">-TIRTA PERKASA KARAOKE-</div>
        </div>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => { printWindow.print(); }, 500);
};