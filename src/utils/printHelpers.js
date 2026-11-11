import dayjs from 'dayjs';
import { getBase64ImageFromUrl } from './imageHelpers';
import { 
  calculateLcCost,
  calculateLcCostDetails,
  formatDurationLabel, 
  getLcCalculationDetail,
  calculateTransactionSummary 
} from './billingHelpers';

// Helper cetak pintar via RawBT (Android) / Window Print (PC)
const sendToThermalPrinter = (htmlContent) => {
  try {
    const base64Html = btoa(unescape(encodeURIComponent(htmlContent)));
    
    // Deteksi jika berjalan di HP/Tablet Android
    const isAndroid = /Android/i.test(navigator.userAgent) || window.Capacitor;

    if (isAndroid) {
      // Pemicu langsung aplikasi RawBT via Direct Schema Protocol
      window.location.href = `rawbt:base64,${base64Html}`;
    } else {
      // Jendela cetak standar untuk Laptop / PC (Linux Mint)
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(htmlContent);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => { printWindow.print(); }, 500);
      } else {
        alert("Pop-up terblokir! Izinkan pop-up di browser Anda.");
      }
    }
  } catch (err) {
    console.error("Print Error:", err);
    alert("Gagal memproses cetak struk: " + err.message);
  }
};

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

  const receiptHtml = `
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
  `;

  sendToThermalPrinter(receiptHtml);
};

export const handlePrintReport = async (allTransactions, reportStartDate, reportEndDate, db) => {
  // Logic cetak laporan...
};

export const handlePrintLcPayoutSlip = async (selectedLcForPayout, payoutStartDate, payoutEndDate, rooms, db) => {
  // Logic cetak slip gaji LC...
};