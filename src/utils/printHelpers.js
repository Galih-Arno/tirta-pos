import dayjs from 'dayjs';
import { getBase64ImageFromUrl } from './imageHelpers';
import { 
  calculateLcCost,
  calculateLcCostDetails,
  formatDurationLabel, 
  getLcCalculationDetail,
  calculateTransactionSummary 
} from './billingHelpers';

export const handlePrintDraftReceipt = async (trxToPrint, rooms, db) => {
  if (!trxToPrint) return;

  const logoBase64 = await getBase64ImageFromUrl('/logo-struk.jpg');
  const allLcsMaster = await db.lcs.toArray();
  const roomObj = rooms?.find(r => r.id === trxToPrint.room_id);
  const roomName = roomObj ? roomObj.room_number : 'NON-ROOM (BAR)';
  const roomRate = roomObj ? (roomObj.hourly_rate || 50000) : 50000;
  const durationHours = trxToPrint.duration_hours || 0;

  const trxFnb = await db.transaction_fnb.where('transaction_id').equals(trxToPrint.id).toArray();
  const trxLcs = await db.transaction_lcs.where('transaction_id').equals(trxToPrint.id).toArray();
  const trxPayments = db.transaction_payments ? await db.transaction_payments.where('transaction_id').equals(trxToPrint.id).toArray() : [];

  const summary = calculateTransactionSummary(trxToPrint, trxFnb, trxLcs, trxPayments, roomRate, allLcsMaster);

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
            const masterLc = allLcsMaster.find(m => m.id === l.lc_id);
            const gRate = masterLc?.hourly_rate_guest || 85000;
            const lRate = masterLc?.hourly_rate_lc || 75000;
            const lcCost = calculateLcCost(durationHours, 'gross', gRate, lRate);
            const lcDetail = getLcCalculationDetail(durationHours, gRate);
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
  const logoBase64 = await getBase64ImageFromUrl('/logo-struk.jpg');
  const allLcsMaster = await db.lcs.toArray();

  const reportTrx = allTransactions.filter(t => {
    if (t.status === 'ongoing') return false;
    const d = dayjs(t.start_time);
    return d.isAfter(dayjs(reportStartDate).startOf('day').subtract(1, 'second')) && 
           d.isBefore(dayjs(reportEndDate).endOf('day').add(1, 'second'));
  });

  let totalCash = 0, totalTransfer = 0, totalDebt = 0;
  let grossRoomTotal = 0, grossFnbTotal = 0, grossLcCharged = 0, totalLcNetShare = 0, totalHouseLcShare = 0, totalDiscount = 0;
  
  let lcSummary = {};
  let fnbSummary = {};

  for (const trx of reportTrx) {
    const trxPayments = db.transaction_payments ? await db.transaction_payments.where('transaction_id').equals(trx.id).toArray() : [];
    
    if (trxPayments.length > 0) {
      for (const p of trxPayments) {
        const netAmt = (p.amount_paid || 0) - (p.change_given || 0);
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

    grossRoomTotal += (trx.room_subtotal || 0);
    grossFnbTotal += (trx.fnb_subtotal || 0);
    totalDiscount += (trx.discount || 0);

    // Rekap LC (Membaca tarif individual per LC)
    const trxLcs = await db.transaction_lcs.where('transaction_id').equals(trx.id).toArray();
    const hours = trx.duration_hours || 0;
    for (const l of trxLcs) {
      const masterLc = allLcsMaster.find(m => m.id === l.lc_id || m.name === l.lc_name);
      const gRate = masterLc?.hourly_rate_guest || 85000;
      const lRate = masterLc?.hourly_rate_lc || 75000;

      const details = calculateLcCostDetails(hours, gRate, lRate);
      grossLcCharged += details.gross;
      totalLcNetShare += details.lcShare;
      totalHouseLcShare += details.houseShare;

      if (!lcSummary[l.lc_name]) lcSummary[l.lc_name] = { hours: 0, lcShare: 0, houseShare: 0, gross: 0 };
      lcSummary[l.lc_name].hours += hours;
      lcSummary[l.lc_name].lcShare += details.lcShare;
      lcSummary[l.lc_name].houseShare += details.houseShare;
      lcSummary[l.lc_name].gross += details.gross;
    }

    // Rekap Penjualan F&B
    const trxFnb = await db.transaction_fnb.where('transaction_id').equals(trx.id).toArray();
    for (const f of trxFnb) {
      if (!fnbSummary[f.product_name]) fnbSummary[f.product_name] = { qty: 0, total: 0 };
      fnbSummary[f.product_name].qty += (f.qty || 0);
      fnbSummary[f.product_name].total += (f.subtotal || 0);
    }
  }

  const grossSalesTotal = grossRoomTotal + grossFnbTotal + grossLcCharged;
  const netBusinessSales = Math.max(0, grossRoomTotal + grossFnbTotal + totalHouseLcShare - totalDiscount);

  const sumLcHours = Object.values(lcSummary).reduce((a, b) => a + b.hours, 0);
  const sumFnbQty = Object.values(fnbSummary).reduce((a, b) => a + b.qty, 0);

  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <html>
      <head>
        <title>Laporan Pembukuan Eksekutif Owner - Tirta Perkasa Karaoke</title>
        <style>
          @page { size: A4 portrait; margin: 8mm 10mm; }
          * { box-sizing: border-box; }
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 0; color: #1a1a1a; font-size: 10px; background: #fff; }
          
          .header-container { text-align: center; border-bottom: 2px solid #1a1a1a; padding-bottom: 6px; margin-bottom: 10px; position: relative; }
          .logo-report { max-height: 46px; width: auto; margin-bottom: 4px; }
          h2 { font-size: 16px; margin: 0; color: #000; text-transform: uppercase; letter-spacing: 0.5px; }
          h3 { font-size: 12px; margin: 2px 0 0 0; color: #333; font-weight: 600; }
          .subtitle { font-size: 10px; color: #666; margin-top: 2px; }
          
          /* KPI Cards Summary */
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 12px; }
          .kpi-card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 6px 8px; background: #f8fafc; text-align: center; }
          .kpi-card.highlight { background: #eff6ff; border-color: #93c5fd; }
          .kpi-card.alert { background: #fef2f2; border-color: #fca5a5; }
          .kpi-title { font-size: 8.5px; text-transform: uppercase; font-weight: bold; color: #475569; margin-bottom: 2px; }
          .kpi-value { font-size: 13px; font-weight: bold; color: #0f172a; }
          .kpi-card.alert .kpi-value { color: #dc2626; }
          .kpi-card.highlight .kpi-value { color: #1d4ed8; }

          /* Section Boxes */
          .section-title { font-size: 10px; font-weight: bold; text-transform: uppercase; color: #1e293b; margin-bottom: 4px; padding-bottom: 2px; border-bottom: 1px solid #cbd5e1; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px; }
          
          table { width: 100%; border-collapse: collapse; margin-top: 2px; margin-bottom: 4px; }
          th, td { border: 1px solid #cbd5e1; padding: 4px 6px; font-size: 9.5px; text-align: left; }
          th { background-color: #f1f5f9; font-weight: bold; color: #334155; }
          tfoot tr { background-color: #f8fafc; font-weight: bold; }
          tfoot td { border-top: 2px solid #0f172a; border-bottom: 2px solid #0f172a; font-size: 10px; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .bold { font-weight: bold; }
          
          .signature { margin-top: 16px; display: flex; justify-content: space-between; page-break-inside: avoid; }
          .sig-box { text-align: center; width: 180px; font-size: 10px; }
          .sig-line { margin-top: 38px; border-top: 1px solid #000; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="header-container">
          ${logoBase64 ? `<img src="${logoBase64}" class="logo-report" alt="Tirta Perkasa Karaoke" />` : ''}
          <h2>TIRTA PERKASA KARAOKE</h2>
          <div class="subtitle">Desa Purworejo, Kec. Pasir Sakti, Kab. Lampung Timur, Lampung</div>
          <h3>LAPORAN PEMBUKUAN KEUANGAN EKSEKUTIF OWNER</h3>
          <div class="subtitle"><strong>Owner:</strong> I Ketut Sunetre &nbsp;|&nbsp; <strong>Periode Audit:</strong> ${reportStartDate} s/d ${reportEndDate} &nbsp;|&nbsp; <strong>Total Trx Selesai:</strong> ${reportTrx.length} Nota</div>
        </div>

        <!-- 1. KPI SUMMARY CARDS -->
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">TOTAL OMZET KOTOR (GROSS)</div>
            <div class="kpi-value">Rp ${grossSalesTotal.toLocaleString('id-ID')}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">TOTAL HAK BERSIH LC</div>
            <div class="kpi-value">Rp ${totalLcNetShare.toLocaleString('id-ID')}</div>
          </div>
          <div class="kpi-card highlight">
            <div class="kpi-title">PENDAPATAN BERSIH USAHA</div>
            <div class="kpi-value">Rp ${netBusinessSales.toLocaleString('id-ID')}</div>
          </div>
          <div class="kpi-card alert">
            <div class="kpi-title">TOTAL PIUTANG / KASBON</div>
            <div class="kpi-value">Rp ${totalDebt.toLocaleString('id-ID')}</div>
          </div>
        </div>

        <!-- 2 & 3. BREAKDOWN PENDAPATAN & AUDIT ARUS KAS -->
        <div class="grid-2">
          <div>
            <div class="section-title">A. RINCIAN PENDAPATAN KOTOR & MARGIN</div>
            <table>
              <tr><td>Pendapatan Sewa Ruangan (Room)</td><td class="text-right bold">Rp ${grossRoomTotal.toLocaleString('id-ID')}</td></tr>
              <tr><td>Penjualan F&B / Minuman Bar</td><td class="text-right bold">Rp ${grossFnbTotal.toLocaleString('id-ID')}</td></tr>
              <tr><td>Pendapatan Layanan LC (Total Tagihan Tamu)</td><td class="text-right bold">Rp ${grossLcCharged.toLocaleString('id-ID')}</td></tr>
              <tr style="background:#f8fafc;"><td><strong>Total Omzet Kotor (Akumulasi)</strong></td><td class="text-right bold"><strong>Rp ${grossSalesTotal.toLocaleString('id-ID')}</strong></td></tr>
              <tr><td>Potongan Diskon Khusus Owner</td><td class="text-right" style="color:#dc2626;">- Rp ${totalDiscount.toLocaleString('id-ID')}</td></tr>
              <tr><td>Titipan Hak Bersih LC (Keluaran Gaji LC)</td><td class="text-right" style="color:#dc2626;">- Rp ${totalLcNetShare.toLocaleString('id-ID')}</td></tr>
              <tr style="background:#f0fdf4;"><td><strong>Fee Manajemen Tempat dari LC (House Share)</strong></td><td class="text-right bold" style="color:#166534;">+ Rp ${totalHouseLcShare.toLocaleString('id-ID')}</td></tr>
              <tr style="background:#eff6ff;"><td><strong>NET REVENUE (PENDAPATAN BERSIH OWNER)</strong></td><td class="text-right bold" style="color:#1d4ed8;"><strong>Rp ${netBusinessSales.toLocaleString('id-ID')}</strong></td></tr>
            </table>
          </div>

          <div>
            <div class="section-title">B. AUDIT ARUS KAS & ALIRAN FISIK DAN DIGITAL</div>
            <table>
              <tr><td>Uang Tunai Bersih di Laci Kasir (Cash Nett)</td><td class="text-right bold">Rp ${totalCash.toLocaleString('id-ID')}</td></tr>
              <tr><td>Uang Masuk Rekening (Transfer / QRIS)</td><td class="text-right bold">Rp ${totalTransfer.toLocaleString('id-ID')}</td></tr>
              <tr style="background:#f8fafc;"><td><strong>Total Dana Masuk Diterima Kasir</strong></td><td class="text-right bold"><strong>Rp ${(totalCash + totalTransfer).toLocaleString('id-ID')}</strong></td></tr>
              <tr><td>Tunggakan Piutang / Kasbon Tamu Belum Lunas</td><td class="text-right bold" style="color:#dc2626;">Rp ${totalDebt.toLocaleString('id-ID')}</td></tr>
            </table>
          </div>
        </div>

        <!-- 4. ITEM RECAPS (LC & F&B TOP SALES) DENGAN TOTAL FOOTER & FEE OWNER -->
        <div class="grid-2">
          <div>
            <div class="section-title">C. REKAPITULASI JAM TERBANG & KOMISI LC</div>
            <table>
              <thead>
                <tr>
                  <th>Nama LC</th>
                  <th class="text-center">Jam Kerja</th>
                  <th class="text-right">Hak Bersih LC</th>
                  <th class="text-right">Fee Tempat</th>
                </tr>
              </thead>
              <tbody>
                ${Object.keys(lcSummary).length === 0 ? '<tr><td colspan="4" class="text-center">Tidak ada transaksi LC pada periode ini</td></tr>' : 
                  Object.entries(lcSummary).map(([name, data]) => `
                    <tr>
                      <td class="bold">${name}</td>
                      <td class="text-center">${data.hours.toFixed(1)} Jam</td>
                      <td class="text-right bold">Rp ${Math.round(data.lcShare).toLocaleString('id-ID')}</td>
                      <td class="text-right font-mono" style="color:#15803d;">Rp ${Math.round(data.houseShare).toLocaleString('id-ID')}</td>
                    </tr>
                  `).join('')
                }
              </tbody>
              <tfoot>
                <tr>
                  <td class="bold">TOTAL</td>
                  <td class="text-center bold">${sumLcHours.toFixed(1)} Jam</td>
                  <td class="text-right bold">Rp ${Math.round(totalLcNetShare).toLocaleString('id-ID')}</td>
                  <td class="text-right bold" style="color:#166534;">Rp ${Math.round(totalHouseLcShare).toLocaleString('id-ID')}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div>
            <div class="section-title">D. DETAIL PENJUALAN F&B PER PRODUK</div>
            <table>
              <thead>
                <tr>
                  <th>Nama Produk F&B</th>
                  <th class="text-center">Terjual</th>
                  <th class="text-right">Total Nominal</th>
                </tr>
              </thead>
              <tbody>
                ${Object.keys(fnbSummary).length === 0 ? '<tr><td colspan="3" class="text-center">Tidak ada transaksi F&B pada periode ini</td></tr>' : 
                  Object.entries(fnbSummary).map(([name, data]) => `
                    <tr>
                      <td class="bold">${name}</td>
                      <td class="text-center bold">${data.qty} pcs</td>
                      <td class="text-right bold">Rp ${data.total.toLocaleString('id-ID')}</td>
                    </tr>
                  `).join('')
                }
              </tbody>
              <tfoot>
                <tr>
                  <td class="bold">TOTAL</td>
                  <td class="text-center bold">${sumFnbQty} pcs</td>
                  <td class="text-right bold">Rp ${grossFnbTotal.toLocaleString('id-ID')}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div class="signature">
          <div class="sig-box">
            <div>Dibuat Oleh (Kasir / Admin):</div>
            <div class="sig-line">Staf Operasional POS</div>
          </div>
          <div class="sig-box">
            <div>Purworejo, ${dayjs().format('DD MMMM YYYY')}<br/>Mengetahui (Owner / Pengelola):</div>
            <div class="sig-line">I Ketut Sunetre</div>
          </div>
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
  const allLcsMaster = await db.lcs.toArray();
  const targetLcMaster = allLcsMaster.find(m => m.name === selectedLcForPayout);
  const gRate = targetLcMaster?.hourly_rate_guest || 85000;
  const lRate = targetLcMaster?.hourly_rate_lc || 75000;

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
        const lcNetPay = calculateLcCost(hours, 'lc_share', gRate, lRate);
        totalLcHours += hours; 
        totalLcEarnings += lcNetPay;
        filteredLogs.push({ 
          bill_number: parentTrx.bill_number, 
          date: dayjs(parentTrx.start_time).format('DD/MM/YY HH:mm'), 
          room_name: roomObj?.room_number || 'Room', 
          hours, 
          cost: lcNetPay 
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