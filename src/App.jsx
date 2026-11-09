import { useEffect, useState } from 'react';
import { db, seedInitialData } from './db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import { Clock, Users, Coffee, FileText, PlusCircle, CheckCircle, X, ShoppingCart, DollarSign, Edit, Trash2, Printer, Plus, Minus, Receipt, Lock, ShieldCheck, LogOut, KeyRound, Download, Upload } from 'lucide-react';
import dayjs from 'dayjs';

// Rumus Pembulatan Menit ke Blok 30 Menit (Toleransi 15 Menit)
function calculateBillableHours(startIso, endIso = null) {
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

// Rumus Biaya LC Khusus (1 Jam = 85.000, 0.5 Jam = 45.000)
function calculateLcCost(hours) {
  if (hours <= 0) return 0;
  const fullHours = Math.floor(hours);
  const hasHalfHour = (hours % 1) >= 0.5;
  return (fullHours * 85000) + (hasHalfHour ? 45000 : 0);
}

function App() {
  const [selectedRoom, setSelectedRoom] = useState(null);
  
  // State Role & Pengaturan PIN Permanen (Default PIN: 1234)
  const [userRole, setUserRole] = useState('kasir'); // 'kasir' | 'owner'
  const [ownerPin, setOwnerPin] = useState(() => localStorage.getItem('tirta_owner_pin') || '1234');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  // State Form Order Awal
  const [guestName, setGuestName] = useState('');
  const [billingType, setBillingType] = useState('fixed');
  const [duration, setDuration] = useState(2);
  const [initialSelectedLcs, setInitialSelectedLcs] = useState([]);
  const [initialFnbCart, setInitialFnbCart] = useState({});
  
  // State Modal (Pop-up)
  const [showFnbModal, setShowFnbModal] = useState(false);
  const [showLcModal, setShowLcModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showFnbManageModal, setShowFnbManageModal] = useState(false);
  const [showLcManageModal, setShowLcManageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedHistoryTrx, setSelectedHistoryTrx] = useState(null);

  // State Filter & Checkout
  const [historyFilter, setHistoryFilter] = useState('today');
  const [discountAmount, setDiscountAmount] = useState('');
  const [reportStartDate, setReportStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [reportEndDate, setReportEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  // State Form Master F&B & LC
  const [editingProduct, setEditingProduct] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodBuyPrice, setProdBuyPrice] = useState('');
  const [prodSellPrice, setProdSellPrice] = useState('');
  const [prodStock, setProdStock] = useState('');

  const [editingLc, setEditingLc] = useState(null);
  const [lcName, setLcName] = useState('');
  const [lcType, setLcType] = useState('tetap');

  // State Keranjang & Pembayaran
  const [fnbCart, setFnbCart] = useState({});
  const [selectedLcIds, setSelectedLcIds] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  
  const [currentTime, setCurrentTime] = useState(dayjs());

  useEffect(() => {
    const initData = async () => {
      try {
        await seedInitialData();
        if (await db.products.count() === 0) {
          await db.products.bulkAdd([
            { name: 'Anggur Merah', buy_price: 80000, sell_price: 100000, stock: 50, status: 'active' },
            { name: 'Atlas', buy_price: 90000, sell_price: 110000, stock: 50, status: 'active' },
            { name: 'Kacang Garing', buy_price: 10000, sell_price: 20000, stock: 100, status: 'active' }
          ]);
        }
        if (await db.lcs.count() === 0) {
          await db.lcs.bulkAdd([
            { name: 'Siska', type: 'tetap', status: 'available' },
            { name: 'Putri', type: 'tetap', status: 'available' },
            { name: 'Rina (Freelance)', type: 'freelance', status: 'available' }
          ]);
        }
      } catch (err) {
        console.error("Gagal inisialisasi IndexedDB Offline:", err);
      }
    };
    initData();

    const timer = setInterval(() => setCurrentTime(dayjs()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rooms = useLiveQuery(() => db.rooms.toArray());
  const products = useLiveQuery(() => db.products.toArray());
  const lcs = useLiveQuery(() => db.lcs.toArray());
  const activeTransactions = useLiveQuery(() => db.transactions.where('status').equals('ongoing').toArray()) || [];
  const allTransactions = useLiveQuery(() => db.transactions.toArray()) || [];

  const filteredHistory = allTransactions.filter(t => {
    if (t.status === 'ongoing') return false;
    const trxDate = dayjs(t.start_time);
    const now = dayjs();
    if (historyFilter === 'today') return trxDate.isSame(now, 'day');
    if (historyFilter === 'yesterday') return trxDate.isSame(now.subtract(1, 'day'), 'day');
    if (historyFilter === '3days') return trxDate.isAfter(now.subtract(3, 'day').startOf('day'));
    if (historyFilter === '7days') return trxDate.isAfter(now.subtract(7, 'day').startOf('day'));
    return true;
  });

  const historyFnb = useLiveQuery(() => selectedHistoryTrx ? db.transaction_fnb.where('transaction_id').equals(selectedHistoryTrx.id).toArray() : [], [selectedHistoryTrx]);
  const historyLcs = useLiveQuery(() => selectedHistoryTrx ? db.transaction_lcs.where('transaction_id').equals(selectedHistoryTrx.id).toArray() : [], [selectedHistoryTrx]);
  const historyRoomName = rooms?.find(r => r.id === selectedHistoryTrx?.room_id)?.room_number || '-';

  const activeTransaction = selectedRoom?.status === 'active' 
    ? activeTransactions.find(t => t.room_id === selectedRoom.id) 
    : null;

  const runningFnb = useLiveQuery(() => activeTransaction ? db.transaction_fnb.where('transaction_id').equals(activeTransaction.id).toArray() : [], [activeTransaction]);
  const runningLcs = useLiveQuery(() => activeTransaction ? db.transaction_lcs.where('transaction_id').equals(activeTransaction.id).toArray() : [], [activeTransaction]);

  // --- LOGIKA PERHITUNGAN BIAYA & TARIF LC (85rb / 45rb) ---
  const roomRatePerHour = selectedRoom?.hourly_rate || 50000;

  let billableRoomHours = 0;
  if (activeTransaction) {
    billableRoomHours = calculateBillableHours(activeTransaction.start_time, currentTime.toISOString());
  }

  const roomSubtotal = Math.round(billableRoomHours * roomRatePerHour);
  const fnbSubtotal = runningFnb?.reduce((sum, item) => sum + item.subtotal, 0) || 0;

  let lcSubtotal = 0;
  const lcCalculations = runningLcs?.map(l => {
    const hours = calculateBillableHours(l.start_time || activeTransaction?.start_time, currentTime.toISOString());
    const cost = calculateLcCost(hours);
    lcSubtotal += cost;
    return { ...l, hours, cost };
  }) || [];

  const rawGrandTotal = roomSubtotal + fnbSubtotal + lcSubtotal;
  const discountVal = Number(discountAmount) || 0;
  const grandTotal = Math.max(0, rawGrandTotal - discountVal);

  // --- HANDLER VERIFIKASI & UBAH PIN OWNER ---
  const handleProtectedAction = (actionName) => {
    if (userRole === 'owner') {
      executeAction(actionName);
    } else {
      setPendingAction(actionName);
      setPinInput('');
      setShowPinModal(true);
    }
  };

  const executeAction = (actionName) => {
    if (actionName === 'lcMaster') setShowLcManageModal(true);
    if (actionName === 'fnbMaster') setShowFnbManageModal(true);
    if (actionName === 'report') setShowReportModal(true);
  };

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput === ownerPin) {
      setUserRole('owner');
      setShowPinModal(false);
      if (pendingAction) {
        executeAction(pendingAction);
        setPendingAction(null);
      }
    } else {
      alert("PIN Owner Salah! Akses Ditolak.");
      setPinInput('');
    }
  };

  const handleChangePin = (e) => {
    e.preventDefault();
    if (oldPinInput !== ownerPin) {
      return alert("PIN Lama Anda salah!");
    }
    if (newPinInput.length < 4) {
      return alert("PIN Baru minimal 4 digit!");
    }
    if (newPinInput !== confirmPinInput) {
      return alert("Konfirmasi PIN Baru tidak cocok!");
    }

    setOwnerPin(newPinInput);
    localStorage.setItem('tirta_owner_pin', newPinInput);
    alert("PIN Owner berhasil diperbarui!");
    setShowChangePinModal(false);
    setOldPinInput(''); setNewPinInput(''); setConfirmPinInput('');
  };

  // --- FITUR BACKUP & RESTORE DATA (OWNER EXCLUSIVE) ---
  const handleExportData = async () => {
    try {
      const data = {
        rooms: await db.rooms.toArray(),
        products: await db.products.toArray(),
        lcs: await db.lcs.toArray(),
        transactions: await db.transactions.toArray(),
        transaction_fnb: await db.transaction_fnb.toArray(),
        transaction_lcs: await db.transaction_lcs.toArray(),
        exported_at: dayjs().format('YYYY-MM-DD HH:mm:ss')
      };
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", jsonString);
      downloadAnchor.setAttribute("download", `backup-tirta-pos-${dayjs().format('YYYYMMDD-HHmmss')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert("Gagal melakukan export data: " + err.message);
    }
  };

  // --- HANDLER OPERASIONAL KASIR ---
  const handleStartRoom = async () => {
    if (!guestName.trim()) return alert("Tulis nama tamu!");
    const startTime = dayjs().toISOString();
    const endTime = billingType === 'fixed' ? dayjs(startTime).add(duration, 'hour').toISOString() : null;

    try {
      const trxId = await db.transactions.add({
        bill_number: `TRX-${dayjs().format('YYMMDD-HHmmss')}`,
        guest_name: guestName,
        room_id: selectedRoom.id,
        start_time: startTime,
        end_time: endTime,
        billing_type: billingType,
        duration_hours: billingType === 'fixed' ? duration : 0,
        status: 'ongoing'
      });

      if (initialSelectedLcs.length > 0) {
        const lcsToAdd = initialSelectedLcs.map(lcId => {
          const lc = lcs.find(l => l.id === lcId);
          return { transaction_id: trxId, lc_id: lc.id, lc_name: lc.name, start_time: startTime };
        });
        await db.transaction_lcs.bulkAdd(lcsToAdd);
      }

      const fnbToAdd = [];
      for (const [prodId, qty] of Object.entries(initialFnbCart)) {
        if (qty > 0) {
          const prod = products.find(p => p.id === Number(prodId));
          if (prod) {
            fnbToAdd.push({
              transaction_id: trxId,
              product_id: prod.id,
              product_name: prod.name,
              qty: qty,
              price_at_transaction: prod.sell_price,
              subtotal: qty * prod.sell_price
            });
            await db.products.update(prod.id, { stock: Math.max(0, prod.stock - qty) });
          }
        }
      }
      if (fnbToAdd.length > 0) await db.transaction_fnb.bulkAdd(fnbToAdd);

      await db.rooms.update(selectedRoom.id, { status: 'active' });
      setGuestName(''); setDuration(2); setInitialSelectedLcs([]); setInitialFnbCart({}); setSelectedRoom(null);
    } catch (e) { console.error("Error Check-in:", e); }
  };

  const handleAddHourFixed = async () => {
    if (!activeTransaction || activeTransaction.billing_type !== 'fixed') return;
    const newDuration = activeTransaction.duration_hours + 1;
    const newEndTime = dayjs(activeTransaction.end_time).add(1, 'hour').toISOString();

    try {
      await db.transactions.update(activeTransaction.id, {
        duration_hours: newDuration,
        end_time: newEndTime
      });
    } catch (e) { console.error(e); }
  };

  const handleUpdateFnbQty = async (fnbItem, delta) => {
    const newQty = fnbItem.qty + delta;
    const prod = products.find(p => p.id === fnbItem.product_id);

    if (delta > 0 && prod && prod.stock < 1) {
      return alert("Stok produk tidak mencukupi!");
    }

    if (newQty <= 0) {
      await db.transaction_fnb.delete(fnbItem.id);
      if (prod) await db.products.update(prod.id, { stock: prod.stock + 1 });
    } else {
      await db.transaction_fnb.update(fnbItem.id, {
        qty: newQty,
        subtotal: newQty * fnbItem.price_at_transaction
      });
      if (prod) await db.products.update(prod.id, { stock: prod.stock - delta });
    }
  };

  const handleSaveFnb = async () => {
    const itemsToAdd = [];
    for (const [productId, qty] of Object.entries(fnbCart)) {
      if (qty > 0) {
        const prod = products.find(p => p.id === Number(productId));
        itemsToAdd.push({
          transaction_id: activeTransaction.id,
          product_id: prod.id,
          product_name: prod.name,
          qty: qty,
          price_at_transaction: prod.sell_price,
          subtotal: qty * prod.sell_price
        });
        await db.products.update(prod.id, { stock: Math.max(0, prod.stock - qty) });
      }
    }
    if (itemsToAdd.length > 0) await db.transaction_fnb.bulkAdd(itemsToAdd);
    setFnbCart({}); setShowFnbModal(false);
  };

  const handleSaveProductMaster = async (e) => {
    e.preventDefault();
    if (!prodName || !prodBuyPrice || !prodSellPrice || !prodStock) return alert("Semua kolom wajib diisi!");
    if (editingProduct) {
      await db.products.update(editingProduct.id, { name: prodName, buy_price: Number(prodBuyPrice), sell_price: Number(prodSellPrice), stock: Number(prodStock) });
    } else {
      await db.products.add({ name: prodName, buy_price: Number(prodBuyPrice), sell_price: Number(prodSellPrice), stock: Number(prodStock), status: 'active' });
    }
    setEditingProduct(null); setProdName(''); setProdBuyPrice(''); setProdSellPrice(''); setProdStock('');
  };

  const handleEditProduct = (p) => {
    setEditingProduct(p);
    setProdName(p.name); setProdBuyPrice(p.buy_price); setProdSellPrice(p.sell_price); setProdStock(p.stock);
  };

  const handleDeleteProduct = async (id) => {
    if (confirm("Hapus produk ini dari master?")) await db.products.delete(id);
  };

  const handleSaveLcMaster = async (e) => {
    e.preventDefault();
    if (!lcName.trim()) return alert("Nama LC wajib diisi!");
    if (editingLc) {
      await db.lcs.update(editingLc.id, { name: lcName, type: lcType });
    } else {
      await db.lcs.add({ name: lcName, type: lcType, status: 'available' });
    }
    setEditingLc(null); setLcName(''); setLcType('tetap');
  };

  const handleEditLc = (lc) => {
    setEditingLc(lc);
    setLcName(lc.name); setLcType(lc.type);
  };

  const handleDeleteLc = async (id) => {
    if (confirm("Hapus data LC ini dari master?")) await db.lcs.delete(id);
  };

  const handleSaveLc = async () => {
    const existingLcMap = new Map(runningLcs.map(l => [l.lc_id, l]));
    const nowIso = dayjs().toISOString();

    for (const l of runningLcs) {
      if (!selectedLcIds.includes(l.lc_id)) {
        await db.transaction_lcs.delete(l.id);
      }
    }

    const lcsToAdd = [];
    for (const lcId of selectedLcIds) {
      if (!existingLcMap.has(lcId)) {
        const lc = lcs.find(l => l.id === lcId);
        if (lc) {
          lcsToAdd.push({
            transaction_id: activeTransaction.id,
            lc_id: lc.id,
            lc_name: lc.name,
            start_time: nowIso
          });
        }
      }
    }
    if (lcsToAdd.length > 0) await db.transaction_lcs.bulkAdd(lcsToAdd);
    setShowLcModal(false);
  };

  // --- CETAK STRUK 80MM (DRAFT & LUNAS) ---
  const handlePrintDraftReceipt = async () => {
    if (!activeTransaction || !selectedRoom) return;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Struk Sementara - ${activeTransaction.bill_number}</title>
          <style>
            @page { size: 80mm auto; margin: 0; }
            body { 
              font-family: 'Courier New', Courier, monospace; 
              width: 72mm; 
              padding: 4mm; 
              margin: 0 auto; 
              color: #000; 
              font-size: 11px;
              line-height: 1.3;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 6px 0; }
            .flex { display: flex; justify-content: space-between; }
            .title { font-size: 15px; font-weight: bold; margin-bottom: 2px; }
            .subtitle { font-size: 10px; margin-bottom: 6px; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="title">TIRTA PERKASA KARAOKE</div>
            <div class="subtitle">Desa Purworejo, Kec. Pasir Sakti, Lampung Timur</div>
            <div class="bold">*** STRUK SEMENTARA / DRAFT ***</div>
          </div>
          <div class="line"></div>
          <div>No Nota : ${activeTransaction.bill_number}</div>
          <div>Tanggal : ${dayjs().format('DD/MM/YYYY HH:mm')}</div>
          <div>Tamu    : ${activeTransaction.guest_name}</div>
          <div>Ruangan : ${selectedRoom.room_number} (${activeTransaction.billing_type.toUpperCase()})</div>
          <div class="line"></div>
          
          <div class="bold" style="margin-bottom: 3px;">1. SEWA RUANGAN</div>
          <div class="flex">
            <span>${selectedRoom.room_number} (${billableRoomHours} Jam @ Rp ${(selectedRoom.hourly_rate || 0).toLocaleString('id-ID')})</span>
          </div>
          <div class="text-right bold">Rp ${roomSubtotal.toLocaleString('id-ID')}</div>

          <div class="line"></div>
          <div class="bold" style="margin-bottom: 3px;">2. PESANAN F&B</div>
          ${runningFnb && runningFnb.length > 0 ? runningFnb.map(f => `
            <div>${f.product_name}</div>
            <div class="flex">
              <span>${f.qty} x Rp ${f.price_at_transaction.toLocaleString('id-ID')}</span>
              <span>Rp ${f.subtotal.toLocaleString('id-ID')}</span>
            </div>
          `).join('') : '<div style="font-style:italic;">Tidak ada pesanan F&B</div>'}
          <div class="text-right bold" style="margin-top:2px;">Subtotal F&B: Rp ${fnbSubtotal.toLocaleString('id-ID')}</div>

          <div class="line"></div>
          <div class="bold" style="margin-bottom: 3px;">3. LADIES COMPANION (LC)</div>
          ${lcCalculations && lcCalculations.length > 0 ? lcCalculations.map(l => `
            <div>${l.lc_name}</div>
            <div class="flex">
              <span>${l.hours} Jam (Rp 85k/jam, 45k/30m)</span>
              <span>Rp ${l.cost.toLocaleString('id-ID')}</span>
            </div>
          `).join('') : '<div style="font-style:italic;">Tidak ada LC</div>'}
          <div class="text-right bold" style="margin-top:2px;">Subtotal LC: Rp ${lcSubtotal.toLocaleString('id-ID')}</div>

          <div class="line"></div>
          ${discountVal > 0 ? `
            <div class="flex">
              <span>Subtotal</span>
              <span>Rp ${rawGrandTotal.toLocaleString('id-ID')}</span>
            </div>
            <div class="flex">
              <span>Diskon Owner</span>
              <span>- Rp ${discountVal.toLocaleString('id-ID')}</span>
            </div>
          ` : ''}
          <div class="flex bold" style="font-size: 13px; margin-top: 4px;">
            <span>TOTAL ESTIMASI</span>
            <span>Rp ${grandTotal.toLocaleString('id-ID')}</span>
          </div>
          <div class="line"></div>
          <div class="text-center" style="font-size: 9px; margin-top: 8px;">
            * Struk ini rincian sementara sebelum pelunasan kasir.<br/>
            Terima kasih atas kunjungan Anda!
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  const handleCheckout = async () => {
    const paid = Number(amountPaid) || 0;
    const isKasbon = paid < grandTotal;
    
    if (paymentMethod === 'cash' && isKasbon && !confirm(`Uang kurang Rp ${(grandTotal - paid).toLocaleString('id-ID')}. Simpan sebagai Kasbon/Piutang?`)) {
      return;
    }

    try {
      await db.transactions.update(activeTransaction.id, {
        status: isKasbon ? 'debt' : 'paid',
        payment_method: paymentMethod,
        amount_paid: paymentMethod === 'transfer' ? grandTotal : paid,
        debt_amount: isKasbon ? Math.round(grandTotal - paid) : 0,
        discount: discountVal,
        duration_hours: Number(billableRoomHours.toFixed(2)),
        room_subtotal: Math.round(roomSubtotal),
        fnb_subtotal: Math.round(fnbSubtotal),
        lc_subtotal: Math.round(lcSubtotal)
      });
      await db.rooms.update(selectedRoom.id, { status: 'available' });
      setShowCheckoutModal(false); setSelectedRoom(null); setAmountPaid(''); setDiscountAmount('');
    } catch (e) { console.error(e); }
  };

  const handlePrintReport = async () => {
    const reportTrx = allTransactions.filter(t => {
      if (t.status === 'ongoing') return false;
      const d = dayjs(t.start_time);
      return d.isAfter(dayjs(reportStartDate).startOf('day').subtract(1, 'second')) && 
             d.isBefore(dayjs(reportEndDate).endOf('day').add(1, 'second'));
    });

    let totalCash = 0;
    let totalTransfer = 0;
    let totalDebt = 0;
    let totalRoom = 0;
    let totalFnb = 0;
    let totalDiscount = 0;
    let lcSummary = {};

    for (const trx of reportTrx) {
      if (trx.payment_method === 'cash') totalCash += (trx.amount_paid || 0);
      if (trx.payment_method === 'transfer') totalTransfer += (trx.amount_paid || 0);
      if (trx.status === 'debt') totalDebt += (trx.debt_amount || 0);

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
              <tr><td>Total Pendapatan Tunai (Cash)</td><td class="text-right">Rp ${totalCash.toLocaleString('id-ID')}</td></tr>
              <tr><td>Total Pendapatan Transfer / QRIS</td><td class="text-right">Rp ${totalTransfer.toLocaleString('id-ID')}</td></tr>
              <tr><td>Total Potongan Diskon Owner</td><td class="text-right">Rp ${totalDiscount.toLocaleString('id-ID')}</td></tr>
              <tr><td>Total Piutang / Kasbon Belum Lunas</td><td class="text-right" style="color: red;">Rp ${totalDebt.toLocaleString('id-ID')}</td></tr>
              <tr><td><strong>Pendapatan Kotor Ruangan & F&B</strong></td><td class="text-right"><strong>Rp ${(totalRoom + totalFnb).toLocaleString('id-ID')}</strong></td></tr>
            </table>
          </div>

          <div class="box">
            <strong>REKAPITULASI JAM TERBANG & KOMISI LC (Rp 85.000 / Jam, Rp 45.000 / 30m)</strong>
            <table>
              <thead>
                <tr><th>Nama LC</th><th>Total Jam Kerja</th><th>Hak Pendapatan LC</th></tr>
              </thead>
              <tbody>
                ${Object.keys(lcSummary).length === 0 ? '<tr><td colspan="3" style="text-align:center;">Tidak ada data LC</td></tr>' : 
                  Object.entries(lcSummary).map(([name, data]) => `
                    <tr>
                      <td>${name}</td>
                      <td>${data.hours.toFixed(2)} Jam</td>
                      <td>Rp ${Math.round(data.pay).toLocaleString('id-ID')}</td>
                    </tr>
                  `).join('')
                }
              </tbody>
            </table>
          </div>

          <div class="box">
            <strong>DAFTAR DETAIL TRANSAKSI & KASBON PER NOTA</strong>
            <table>
              <thead>
                <tr><th>No Nota</th><th>Tamu</th><th>Status</th><th>Total Tagihan</th><th>Kasbon/Kurang</th></tr>
              </thead>
              <tbody>
                ${reportTrx.map(t => `
                  <tr>
                    <td>${t.bill_number}</td>
                    <td>${t.guest_name}</td>
                    <td>${t.status === 'paid' ? 'LUNAS' : 'KASBON'}</td>
                    <td>Rp ${(((t.room_subtotal || 0) + (t.fnb_subtotal || 0) + (t.lc_subtotal || 0)) - (t.discount || 0)).toLocaleString('id-ID')}</td>
                    <td style="color: ${t.debt_amount > 0 ? 'red' : 'inherit'};">Rp ${(t.debt_amount || 0).toLocaleString('id-ID')}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <div class="signature">
            <div><br/><br/>Kasir / Admin</div>
            <div>Purworejo, ${dayjs().format('DD MMMM YYYY')}<br/><br/>I Ketut Sunetre<br/><strong>Owner / Pengelola</strong></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => { printWindow.print(); }, 500);
  };

  return (
    <div className="flex h-screen font-sans overflow-hidden bg-[#0f0f0f] text-white">
      {/* SISI KIRI: GRID RUANGAN */}
      <div className="w-[60%] p-6 flex flex-col relative z-0 border-r border-gray-800">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-4xl tracking-wider font-extrabold vt323-font" style={{ fontFamily: "'VT323', monospace", letterSpacing: '2px' }}>
              TIRTA PERKASA
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center ${userRole === 'owner' ? 'bg-amber-900/60 text-amber-400 border border-amber-700' : 'bg-blue-900/60 text-blue-400 border border-blue-800'}`}>
                {userRole === 'owner' ? <ShieldCheck size={12} className="mr-1"/> : <Lock size={12} className="mr-1"/>}
                MODE: {userRole.toUpperCase()}
              </span>
              {userRole === 'owner' ? (
                <button onClick={() => setUserRole('kasir')} className="text-[11px] text-gray-400 hover:text-white underline flex items-center">
                  <LogOut size={10} className="mr-0.5"/> Logout Owner
                </button>
              ) : (
                <button onClick={() => { setPinInput(''); setShowPinModal(true); }} className="text-[11px] text-amber-400 hover:text-amber-300 underline flex items-center">
                  <KeyRound size={10} className="mr-0.5"/> Login Owner
                </button>
              )}
            </div>
          </div>

          <div className="flex space-x-2 items-center">
            {/* FITUR KHUSUS MODE OWNER (SEMBUNYI SAAT MODE KASIR) */}
            {userRole === 'owner' && (
              <>
                <button onClick={() => setShowChangePinModal(true)} className="p-2.5 rounded-xl border bg-amber-950/40 border-amber-800 text-amber-300 hover:bg-amber-900/60 transition-all" title="Ganti PIN Owner"><KeyRound size={18} /></button>
                <button onClick={handleExportData} className="p-2.5 rounded-xl border bg-gray-900 border-gray-700 text-gray-300 hover:bg-gray-800 transition-all" title="Backup Database (JSON)"><Download size={18} /></button>
                <button onClick={() => handleProtectedAction('lcMaster')} className="p-2.5 rounded-xl border bg-card border-gray-700 hover:bg-gray-800 text-gray-200 transition-all" title="Kelola Master LC"><Users size={18} /></button>
                <button onClick={() => handleProtectedAction('fnbMaster')} className="p-2.5 rounded-xl border bg-card border-gray-700 hover:bg-gray-800 text-gray-200 transition-all" title="Kelola Master F&B & Stok"><Coffee size={18} /></button>
              </>
            )}

            {/* FITUR YANG BISA DIAKSES KASIR & OWNER */}
            <button onClick={() => setShowHistoryModal(true)} className="p-2.5 rounded-xl border bg-card border-gray-700 hover:bg-gray-800 text-gray-200 transition-all" title="Riwayat Transaksi"><FileText size={18} /></button>

            {userRole === 'owner' && (
              <button onClick={() => handleProtectedAction('report')} className="px-3.5 py-2.5 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center text-xs transition-all" title="Laporan Owner PDF"><Printer size={16} className="mr-1.5" /> Laporan</button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 overflow-y-auto pr-1">
          {rooms?.map((room) => {
            const trx = room.status === 'active' ? activeTransactions?.find(t => t.room_id === room.id) : null;
            const isActive = room.status === 'active';
            return (
              <div 
                key={room.id} 
                onClick={() => setSelectedRoom(room)} 
                className={`p-6 rounded-2xl cursor-pointer border-2 transition-all duration-300 shadow-md ${
                  selectedRoom?.id === room.id ? 'border-primary ring-4 ring-primary/20 scale-[1.01]' : 'border-transparent'
                } ${
                  isActive 
                    ? 'bg-gradient-to-br from-blue-950/60 to-indigo-950/60 border-blue-500/50' 
                    : 'bg-card hover:bg-gray-800/80 border-gray-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <h2 className="text-xl font-bold font-serif tracking-wide text-gray-200">{room.room_number}</h2>
                  {trx && (
                    <span className="bg-primary text-white text-xs font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wider">
                      {trx.billing_type}
                    </span>
                  )}
                </div>

                {trx && (
                  <div className="mt-3 px-3 py-2 rounded-xl border font-bold text-base truncate bg-black/55 border-blue-400/60 text-blue-300 shadow-inner">
                    👤 {trx.guest_name}
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
      </div>

      {/* SISI KANAN: PANEL AKSI */}
      <div className="w-[40%] p-6 overflow-y-auto relative z-0 border-l bg-[#161616] border-gray-800">
        {selectedRoom ? (
          <div>
            <h2 className="text-2xl font-serif font-bold mb-6 text-white">{selectedRoom.room_number}</h2>
            {selectedRoom.status === 'available' ? (
               <div className="p-6 rounded-2xl border shadow-lg bg-card border-gray-800 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-200">Form Check-In Terpadu</h3>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Atas Nama (Tamu)</label>
                    <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full border rounded-xl p-3 font-medium outline-none transition-all bg-dark border-gray-700 text-white focus:border-primary" placeholder="Nama tamu..." />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-300">Mode Waktu</label>
                    <div className="flex space-x-2">
                      <button onClick={() => setBillingType('fixed')} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${billingType === 'fixed' ? 'bg-primary border-primary text-white shadow-md' : 'border-gray-700 text-gray-300 bg-dark'}`}>Paket Jam</button>
                      <button onClick={() => setBillingType('open')} className={`flex-1 py-3 rounded-xl font-bold border transition-all ${billingType === 'open' ? 'bg-primary border-primary text-white shadow-md' : 'border-gray-700 text-gray-300 bg-dark'}`}>Open</button>
                    </div>
                  </div>
                  {billingType === 'fixed' && (
                    <div className="flex items-center justify-between p-4 rounded-xl border bg-black/20 border-gray-700/50">
                      <span className="text-sm font-semibold text-gray-300">Durasi Paket</span>
                      <div className="flex items-center space-x-4">
                        <button onClick={() => setDuration(Math.max(1, duration - 1))} className="w-10 h-10 rounded-xl font-bold transition-all bg-gray-700/50 text-white hover:bg-gray-700">-</button>
                        <span className="text-xl font-bold w-16 text-center text-white">{duration} Jam</span>
                        <button onClick={() => setDuration(duration + 1)} className="w-10 h-10 rounded-xl font-bold transition-all bg-gray-700/50 text-white hover:bg-gray-700">+</button>
                      </div>
                    </div>
                  )}

                  {/* Input LC Awal */}
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-300">Pilih LC Awal (Opsional)</label>
                    <div className="grid grid-cols-2 gap-2 max-h-28 overflow-y-auto p-2 bg-dark rounded-xl border border-gray-800">
                      {lcs?.map(lc => {
                        const isSel = initialSelectedLcs.includes(lc.id);
                        return (
                          <button key={lc.id} type="button" onClick={() => {
                            if (isSel) setInitialSelectedLcs(initialSelectedLcs.filter(id => id !== lc.id));
                            else setInitialSelectedLcs([...initialSelectedLcs, lc.id]);
                          }} className={`p-2 rounded-lg text-xs font-bold text-left border transition-all ${isSel ? 'bg-primary/30 border-primary text-blue-300' : 'bg-card border-gray-800 text-gray-400 hover:bg-gray-800'}`}>
                            {lc.name} ({lc.type})
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Input F&B Awal */}
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-gray-300">Pilih F&B Awal (Opsional)</label>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto p-2 bg-dark rounded-xl border border-gray-800">
                      {products?.map(p => {
                        const qty = initialFnbCart[p.id] || 0;
                        return (
                          <div key={p.id} className="flex justify-between items-center text-xs">
                            <span className="text-gray-300 font-medium">{p.name} (Rp {p.sell_price.toLocaleString('id-ID')})</span>
                            <div className="flex items-center space-x-2">
                              <button type="button" onClick={() => setInitialFnbCart({...initialFnbCart, [p.id]: Math.max(0, qty - 1)})} className="w-6 h-6 bg-gray-800 rounded font-bold">-</button>
                              <span className="w-4 text-center font-bold text-white">{qty}</span>
                              <button type="button" onClick={() => setInitialFnbCart({...initialFnbCart, [p.id]: qty + 1})} className="w-6 h-6 bg-primary rounded font-bold text-white">+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button onClick={handleStartRoom} className="w-full py-4 bg-success text-white font-bold rounded-xl hover:bg-green-600 shadow-lg shadow-green-600/30 transition-all">MULAI</button>
               </div>
            ) : (
               <div className="p-6 rounded-2xl border shadow-lg bg-card border-gray-800">
                 {activeTransaction && (
                    <>
                      <div className="border-b pb-4 mb-4 border-gray-700">
                        <div className="flex justify-between items-start">
                          <h3 className="text-2xl font-serif font-bold text-white">{activeTransaction.guest_name}</h3>
                          <span className="bg-warning/20 text-warning text-xs px-3 py-1 rounded-full font-bold uppercase">{activeTransaction.billing_type} MODE</span>
                        </div>
                        <p className="text-sm mt-1 font-medium text-gray-300">
                          {selectedRoom.room_number} ({billableRoomHours} jam @ Rp {roomRatePerHour.toLocaleString('id-ID')}) = <strong className="text-white font-bold">Rp {roomSubtotal.toLocaleString('id-ID')}</strong>
                        </p>
                      </div>
                      
                      {/* Pesanan F&B Live (+ / -) */}
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-sm text-gray-300">Pesanan F&B</span>
                          <span className="font-bold text-white">Rp {fnbSubtotal.toLocaleString('id-ID')}</span>
                        </div>
                        {runningFnb?.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">Belum ada pesanan F&B</p>
                        ) : (
                          runningFnb?.map(f => (
                            <div key={f.id} className="flex justify-between items-center text-sm mb-1.5 text-gray-300 bg-dark p-2 rounded-xl border border-gray-800">
                              <div>
                                <p className="font-bold text-white text-xs">{f.product_name}</p>
                                <p className="text-[10px] text-gray-400">@ Rp {f.price_at_transaction.toLocaleString('id-ID')}</p>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button onClick={() => handleUpdateFnbQty(f, -1)} className="p-1 bg-gray-800 hover:bg-red-900 rounded text-red-400 transition-colors"><Minus size={14}/></button>
                                <span className="font-bold text-xs w-4 text-center">{f.qty}</span>
                                <button onClick={() => handleUpdateFnbQty(f, 1)} className="p-1 bg-gray-800 hover:bg-green-900 rounded text-green-400 transition-colors"><Plus size={14}/></button>
                                <span className="font-bold text-blue-300 text-xs ml-2">Rp {f.subtotal.toLocaleString('id-ID')}</span>
                              </div>
                            </div>
                          ))
                        )}
                      </div>

                      {/* LC Live Tarif Baru (85rb/1 jam, 45rb/30m) */}
                      <div className="mb-6">
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-semibold text-sm text-gray-300">Ladies Companion (LC)</span>
                          <span className="font-bold text-white">Rp {lcSubtotal.toLocaleString('id-ID')}</span>
                        </div>
                        {lcCalculations?.length === 0 ? (
                          <p className="text-xs text-gray-500 italic">Tidak ada LC bertugas</p>
                        ) : (
                          lcCalculations?.map(l => (
                            <div key={l.id} className="flex justify-between text-xs mb-1 text-gray-300 bg-dark p-2 rounded-xl border border-gray-800">
                              <span>- {l.lc_name} ({l.hours} Jam)</span>
                              <span className="font-bold text-blue-300">Rp {l.cost.toLocaleString('id-ID')}</span>
                            </div>
                          ))
                        )}
                      </div>

                      {activeTransaction.billing_type === 'fixed' && (
                        <div className="mb-4">
                          <button onClick={handleAddHourFixed} className="w-full py-3 border rounded-xl text-sm font-bold flex items-center justify-center transition-all bg-blue-900/30 hover:bg-blue-900/50 border-blue-800 text-blue-300">
                            <PlusCircle size={18} className="mr-2 text-warning" /> Tambah +1 Jam Waktu Sewa
                          </button>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button onClick={() => {
                          setSelectedLcIds(runningLcs.map(l => l.lc_id));
                          setShowLcModal(true);
                        }} className="flex items-center justify-center p-3.5 border rounded-xl text-sm font-bold transition-all bg-blue-900/30 hover:bg-blue-900/50 border-blue-800 text-blue-300">
                          <Users size={16} className="mr-2"/> Pilih LC
                        </button>
                        <button onClick={() => setShowFnbModal(true)} className="flex items-center justify-center p-3.5 border rounded-xl text-sm font-bold transition-all bg-warning/20 hover:bg-warning/30 border-warning/50 text-warning">
                          <ShoppingCart size={16} className="mr-2"/> Tambah F&B
                        </button>
                      </div>

                      {/* Tombol Cetak Struk Diawal (Draft 80mm) */}
                      <button onClick={handlePrintDraftReceipt} className="w-full py-3 mb-4 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-blue-300 font-bold rounded-xl flex items-center justify-center text-sm transition-all shadow-md">
                        <Receipt size={18} className="mr-2 text-warning" /> CETAK STRUK DIAWAL (DRAFT 80MM)
                      </button>

                      <div className="border-t pt-4 mb-6 border-gray-700">
                        <div className="flex justify-between items-center text-xl font-bold text-white">
                          <span>TOTAL TAGIHAN</span>
                          <span className="text-success font-extrabold">Rp {grandTotal.toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      <button onClick={() => setShowCheckoutModal(true)} className="w-full py-4 bg-danger hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-600/30 flex items-center justify-center text-lg transition-all">
                        <DollarSign size={24} className="mr-2" /> PROSES PEMBAYARAN
                      </button>
                    </>
                 )}
               </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <Clock size={64} className="mb-4 opacity-40 animate-pulse" />
            <p className="text-xl font-medium">Pilih ruangan di sebelah kiri</p>
          </div>
        )}
      </div>

      {/* --- MODAL INPUT PIN OWNER --- */}
      {showPinModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-80 rounded-2xl border shadow-2xl p-6 bg-card border-gray-700 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center text-amber-400">
                <Lock size={18} className="mr-2"/> Verifikasi Owner
              </h3>
              <button onClick={() => setShowPinModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleVerifyPin} className="space-y-4">
              <p className="text-xs text-gray-400">Fitur ini dilindungi. Masukkan PIN Owner untuk melanjutkan.</p>
              <input 
                type="password" 
                maxLength={6}
                value={pinInput} 
                onChange={(e) => setPinInput(e.target.value)} 
                className="w-full text-center text-2xl tracking-widest font-bold border rounded-xl p-3 bg-dark border-gray-700 text-white focus:border-amber-400 outline-none" 
                placeholder="****" 
                autoFocus
              />
              <button type="submit" className="w-full py-3 bg-amber-600 hover:bg-amber-500 font-bold rounded-xl text-white shadow-lg">
                MASUK OWNER
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL GANTI PIN OWNER --- */}
      {showChangePinModal && (
        <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-96 rounded-2xl border shadow-2xl p-6 bg-card border-gray-700 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold flex items-center text-amber-400">
                <KeyRound size={18} className="mr-2"/> Pengaturan PIN Owner
              </h3>
              <button onClick={() => setShowChangePinModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleChangePin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">PIN Lama</label>
                <input 
                  type="password" 
                  value={oldPinInput} 
                  onChange={(e) => setOldPinInput(e.target.value)} 
                  className="w-full border rounded-xl p-2.5 text-sm bg-dark border-gray-700 text-white outline-none" 
                  placeholder="Masukkan PIN lama" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">PIN Baru</label>
                <input 
                  type="password" 
                  value={newPinInput} 
                  onChange={(e) => setNewPinInput(e.target.value)} 
                  className="w-full border rounded-xl p-2.5 text-sm bg-dark border-gray-700 text-white outline-none" 
                  placeholder="PIN baru (minimal 4 digit)" 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Konfirmasi PIN Baru</label>
                <input 
                  type="password" 
                  value={confirmPinInput} 
                  onChange={(e) => setConfirmPinInput(e.target.value)} 
                  className="w-full border rounded-xl p-2.5 text-sm bg-dark border-gray-700 text-white outline-none" 
                  placeholder="Ulangi PIN baru" 
                />
              </div>
              <button type="submit" className="w-full py-3 mt-2 bg-amber-600 hover:bg-amber-500 font-bold rounded-xl text-white shadow-lg">
                SIMPAN PIN BARU
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL LAPORAN PDF OWNER --- */}
      {showReportModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[500px] rounded-2xl border shadow-2xl p-6 bg-card border-gray-700 text-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold">Cetak Laporan Pembukuan Owner</h3>
              <button onClick={() => setShowReportModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            <div className="space-y-4 mb-6">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">Dari Tanggal</label>
                <input type="date" value={reportStartDate} onChange={e => setReportStartDate(e.target.value)} className="w-full border rounded-xl p-3 outline-none font-medium bg-dark border-gray-700 text-white" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-300">Sampai Tanggal</label>
                <input type="date" value={reportEndDate} onChange={e => setReportEndDate(e.target.value)} className="w-full border rounded-xl p-3 outline-none font-medium bg-dark border-gray-700 text-white" />
              </div>
            </div>
            <button onClick={handlePrintReport} className="w-full py-4 bg-primary text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-500/30 flex items-center justify-center text-lg">
              <Printer size={22} className="mr-2" /> GENERATE & PRINT PDF
            </button>
          </div>
        </div>
      )}

      {/* --- MODAL RIWAYAT TRANSAKSI (HISTORY) --- */}
      {showHistoryModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[800px] max-h-[85vh] rounded-2xl border shadow-2xl p-6 flex flex-col bg-card border-gray-700 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-serif font-bold">Riwayat Transaksi & Nota</h3>
              <button onClick={() => { setShowHistoryModal(false); setSelectedHistoryTrx(null); }}><X className="text-gray-400 hover:text-white" /></button>
            </div>

            <div className="flex space-x-2 mb-4">
              <button onClick={() => setHistoryFilter('today')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${historyFilter === 'today' ? 'bg-primary border-primary text-white shadow-md' : 'bg-dark border-gray-800 text-gray-300'}`}>Hari Ini</button>
              <button onClick={() => setHistoryFilter('yesterday')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${historyFilter === 'yesterday' ? 'bg-primary border-primary text-white shadow-md' : 'bg-dark border-gray-800 text-gray-300'}`}>Kemarin</button>
              <button onClick={() => setHistoryFilter('3days')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${historyFilter === '3days' ? 'bg-primary border-primary text-white shadow-md' : 'bg-dark border-gray-800 text-gray-300'}`}>3 Hari Lalu</button>
              <button onClick={() => setHistoryFilter('7days')} className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${historyFilter === '7days' ? 'bg-primary border-primary text-white shadow-md' : 'bg-dark border-gray-800 text-gray-300'}`}>7 Hari Lalu</button>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
              <div className="rounded-xl p-3 overflow-y-auto space-y-2 border bg-dark border-gray-800">
                {filteredHistory.length === 0 ? (
                  <p className="text-center text-gray-500 py-10">Tidak ada riwayat transaksi.</p>
                ) : (
                  filteredHistory.map(trx => (
                    <div key={trx.id} onClick={() => setSelectedHistoryTrx(trx)} className={`p-3.5 rounded-xl border cursor-pointer transition-all ${selectedHistoryTrx?.id === trx.id ? 'bg-primary/20 border-primary ring-2 ring-primary/30' : 'bg-card border-gray-800 hover:bg-gray-800'}`}>
                      <div className="flex justify-between font-bold text-sm">
                        <span className="text-white">{trx.bill_number}</span>
                        <span className={trx.status === 'paid' ? 'text-success font-bold' : 'text-warning font-bold'}>{trx.status === 'paid' ? 'LUNAS' : `KASBON (Rp ${(trx.debt_amount||0).toLocaleString('id-ID')})`}</span>
                      </div>
                      <div className="text-xs mt-1 flex justify-between font-medium text-gray-400">
                        <span>Tamu: {trx.guest_name}</span>
                        <span>{dayjs(trx.start_time).format('DD/MM/YYYY HH:mm')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-xl p-4 overflow-y-auto border flex flex-col justify-between bg-dark border-gray-800 text-gray-200">
                {selectedHistoryTrx ? (
                  <div>
                    <div className="border-b pb-3 mb-3 border-gray-800">
                      <p className="text-xs text-primary font-bold">{selectedHistoryTrx.bill_number}</p>
                      <h4 className="text-lg font-bold text-white">{selectedHistoryTrx.guest_name}</h4>
                      <p className="text-xs text-gray-400">Ruangan: {historyRoomName} | Metode: {selectedHistoryTrx.payment_method?.toUpperCase()}</p>
                    </div>

                    <div className="space-y-2 text-sm mb-4 font-medium text-gray-300">
                      <div className="flex justify-between">
                        <span>{historyRoomName} ({selectedHistoryTrx.duration_hours || 0} Jam)</span>
                        <span>Rp {(selectedHistoryTrx.room_subtotal || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>F&B Subtotal</span>
                        <span>Rp {(selectedHistoryTrx.fnb_subtotal || 0).toLocaleString('id-ID')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>LC Subtotal</span>
                        <span>Rp {(selectedHistoryTrx.lc_subtotal || 0).toLocaleString('id-ID')}</span>
                      </div>
                      {selectedHistoryTrx.discount > 0 && (
                        <div className="flex justify-between text-danger font-semibold">
                          <span>Diskon Owner</span>
                          <span>- Rp {selectedHistoryTrx.discount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                      {selectedHistoryTrx.debt_amount > 0 && (
                        <div className="flex justify-between text-warning font-bold">
                          <span>Kasbon / Belum Lunas</span>
                          <span>Rp {selectedHistoryTrx.debt_amount.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>

                    <div className="border-t pt-3 text-xs space-y-1 border-gray-800 text-gray-400">
                      <p className="font-bold mb-1 text-white">Rincian F&B:</p>
                      {historyFnb?.map(f => (
                        <div key={f.id} className="flex justify-between">
                          <span>- {f.qty}x {f.product_name} (@ Rp {f.price_at_transaction?.toLocaleString('id-ID')})</span>
                          <span>Rp {f.subtotal.toLocaleString('id-ID')}</span>
                        </div>
                      ))}
                      <p className="font-bold mt-2 mb-1 text-white">Rincian LC:</p>
                      {historyLcs?.map(l => (
                        <div key={l.id}>- {l.lc_name}</div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-sm font-medium">
                    Pilih salah satu nota di samping
                  </div>
                )}

                {selectedHistoryTrx && (
                  <div className="border-t pt-3 mt-4 flex justify-between items-center font-bold border-gray-800">
                    <span>Status: <span className={selectedHistoryTrx.status === 'paid' ? 'text-success' : 'text-warning'}>{selectedHistoryTrx.status === 'paid' ? 'LUNAS' : 'KASBON'}</span></span>
                    <span className="text-success text-lg font-extrabold">Rp {(((selectedHistoryTrx.room_subtotal || 0) + (selectedHistoryTrx.fnb_subtotal || 0) + (selectedHistoryTrx.lc_subtotal || 0)) - (selectedHistoryTrx.discount || 0)).toLocaleString('id-ID')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL KELOLA MASTER LC (PROTEKSI OWNER) --- */}
      {showLcManageModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[550px] max-h-[85vh] rounded-2xl border shadow-2xl p-6 flex flex-col bg-card border-gray-700 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-serif font-bold text-amber-400">Manajemen Master Data LC (Owner)</h3>
              <button onClick={() => { setShowLcManageModal(false); setEditingLc(null); }}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSaveLcMaster} className="p-4 rounded-xl border mb-4 space-y-3 bg-dark border-gray-800">
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Nama LC</label>
                <input type="text" value={lcName} onChange={e => setLcName(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm outline-none font-medium bg-card border-gray-700 text-white" placeholder="Contoh: Siska" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Status / Tipe LC</label>
                <select value={lcType} onChange={e => setLcType(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm outline-none font-medium bg-card border-gray-700 text-white">
                  <option value="tetap">Tetap</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div className="flex space-x-2 pt-1">
                <button type="submit" className="flex-1 py-2.5 bg-primary font-bold rounded-xl text-sm hover:bg-blue-600 shadow-md">
                  {editingLc ? 'Simpan Perubahan' : 'Tambah LC Baru'}
                </button>
                {editingLc && (
                  <button type="button" onClick={() => { setEditingLc(null); setLcName(''); setLcType('tetap'); }} className="px-4 py-2.5 bg-gray-700 text-sm rounded-xl text-white font-semibold">Batal</button>
                )}
              </div>
            </form>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {lcs?.map(lc => (
                <div key={lc.id} className="flex justify-between items-center p-3.5 rounded-xl border bg-dark border-gray-800">
                  <div>
                    <p className="font-bold text-sm text-white">{lc.name}</p>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${lc.type === 'tetap' ? 'bg-blue-900/40 text-blue-400 border border-blue-800' : 'bg-warning/20 text-warning border border-warning/40'}`}>
                      {lc.type}
                    </span>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEditLc(lc)} className="p-2 bg-blue-900/40 text-blue-400 rounded-xl hover:bg-blue-900"><Edit size={16}/></button>
                    <button onClick={() => handleDeleteLc(lc.id)} className="p-2 bg-red-900/40 text-red-400 rounded-xl hover:bg-red-900"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL KELOLA MASTER F&B & STOK OPNAME (PROTEKSI OWNER) --- */}
      {showFnbManageModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[650px] max-h-[85vh] rounded-2xl border shadow-2xl p-6 flex flex-col bg-card border-gray-700 text-white">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-serif font-bold text-amber-400">Manajemen Master F&B & Stok Opname (Owner)</h3>
              <button onClick={() => { setShowFnbManageModal(false); setEditingProduct(null); }}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            <form onSubmit={handleSaveProductMaster} className="p-4 rounded-xl border mb-4 grid grid-cols-2 gap-3 bg-dark border-gray-800">
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1 text-gray-300">Nama Produk</label>
                <input type="text" value={prodName} onChange={e => setProdName(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm outline-none font-medium bg-card border-gray-700 text-white" placeholder="Contoh: Bir Bintang" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Harga Beli (HPP)</label>
                <input type="number" value={prodBuyPrice} onChange={e => setProdBuyPrice(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm outline-none font-medium bg-card border-gray-700 text-white" placeholder="0" />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1 text-gray-300">Harga Jual</label>
                <input type="number" value={prodSellPrice} onChange={e => setProdSellPrice(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm outline-none font-medium bg-card border-gray-700 text-white" placeholder="0" />
              </div>
              <div className="col-span-2">
                <label className="block text-xs font-semibold mb-1 text-gray-300">Stok Awal / Opname</label>
                <input type="number" value={prodStock} onChange={e => setProdStock(e.target.value)} className="w-full border rounded-xl p-2.5 text-sm outline-none font-medium bg-card border-gray-700 text-white" placeholder="0" />
              </div>
              <div className="col-span-2 flex space-x-2">
                <button type="submit" className="flex-1 py-2.5 bg-primary font-bold rounded-xl text-sm hover:bg-blue-600 shadow-md">
                  {editingProduct ? 'Simpan Perubahan' : 'Tambah Produk Baru'}
                </button>
                {editingProduct && (
                  <button type="button" onClick={() => { setEditingProduct(null); setProdName(''); setProdBuyPrice(''); setProdSellPrice(''); setProdStock(''); }} className="px-4 py-2.5 bg-gray-700 text-sm rounded-xl text-white font-semibold">Batal</button>
                )}
              </div>
            </form>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {products?.map(p => (
                <div key={p.id} className="flex justify-between items-center p-3.5 rounded-xl border bg-dark border-gray-800">
                  <div>
                    <p className="font-bold text-sm text-white">{p.name}</p>
                    <p className="text-xs text-gray-400">Modal: Rp {p.buy_price.toLocaleString('id-ID')} | Jual: <strong className="text-success font-bold">Rp {p.sell_price.toLocaleString('id-ID')}</strong> | Stok: <span className="text-warning font-bold">{p.stock}</span></p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => handleEditProduct(p)} className="p-2 bg-blue-900/40 text-blue-400 rounded-xl hover:bg-blue-900"><Edit size={16}/></button>
                    <button onClick={() => handleDeleteProduct(p.id)} className="p-2 bg-red-900/40 text-red-400 rounded-xl hover:bg-red-900"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL TAMBAH F&B KE TRANSAKSI --- */}
      {showFnbModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-96 rounded-2xl border shadow-2xl p-6 bg-card border-gray-700 text-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold">Pilih Pesanan F&B</h3>
              <button onClick={() => setShowFnbModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {products?.map(p => {
                const qty = fnbCart[p.id] || 0;
                return (
                  <div key={p.id} className="flex justify-between items-center p-3.5 rounded-xl border bg-dark border-gray-800">
                    <div>
                      <p className="font-bold text-sm text-white">{p.name}</p>
                      <p className="text-xs text-gray-400">Stok: {p.stock} | Rp {p.sell_price.toLocaleString('id-ID')}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button onClick={() => setFnbCart({...fnbCart, [p.id]: Math.max(0, qty - 1)})} className="bg-gray-700/50 hover:bg-gray-700 w-8 h-8 rounded-lg font-bold text-white">-</button>
                      <span className="font-bold w-4 text-center text-white">{qty}</span>
                      <button onClick={() => setFnbCart({...fnbCart, [p.id]: qty + 1})} className="bg-primary hover:bg-blue-600 w-8 h-8 rounded-lg font-bold text-white">+</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={handleSaveFnb} className="w-full mt-6 py-3.5 bg-success text-white font-bold rounded-xl hover:bg-green-600 shadow-lg shadow-green-600/30">Simpan Pesanan</button>
          </div>
        </div>
      )}

      {/* --- MODAL ATUR LC --- */}
      {showLcModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-96 rounded-2xl border shadow-2xl p-6 bg-card border-gray-700 text-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold">Pilih LC Bertugas</h3>
              <button onClick={() => setShowLcModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>
            <div className="space-y-2 mb-6 max-h-80 overflow-y-auto pr-1">
              {lcs?.map(lc => {
                const isSelected = selectedLcIds.includes(lc.id);
                return (
                  <label key={lc.id} className={`flex items-center justify-between p-4 rounded-xl cursor-pointer border transition-all ${isSelected ? 'bg-primary/20 border-primary ring-2 ring-primary/30' : 'bg-dark border-gray-800'}`}>
                    <div className="flex items-center">
                      <input type="checkbox" className="w-5 h-5 mr-4 accent-blue-500 rounded" checked={isSelected} 
                        onChange={(e) => {
                          if (e.target.checked) setSelectedLcIds([...selectedLcIds, lc.id]);
                          else setSelectedLcIds(selectedLcIds.filter(id => id !== lc.id));
                        }} 
                      />
                      <span className="font-bold text-white">{lc.name}</span>
                    </div>
                    <span className="text-xs text-gray-400 uppercase font-semibold">({lc.type})</span>
                  </label>
                );
              })}
            </div>
            <button onClick={handleSaveLc} className="w-full py-3.5 bg-success text-white font-bold rounded-xl hover:bg-green-600 shadow-lg shadow-green-600/30">Konfirmasi LC</button>
          </div>
        </div>
      )}

      {/* --- MODAL CHECKOUT & PEMBAYARAN --- */}
      {showCheckoutModal && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="w-[500px] rounded-2xl border shadow-2xl p-6 bg-card border-gray-700 text-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-serif font-bold">Pembayaran & Diskon</h3>
              <button onClick={() => setShowCheckoutModal(false)}><X className="text-gray-400 hover:text-white" /></button>
            </div>

            <div className="mb-4 p-3.5 rounded-xl border bg-dark border-gray-800">
              <label className="block text-xs font-semibold mb-1 text-gray-300">Diskon Khusus Owner (Opsional)</label>
              <input 
                type="number" 
                value={discountAmount} 
                onChange={e => setDiscountAmount(e.target.value)} 
                className="w-full border rounded-xl p-2.5 text-sm outline-none font-medium bg-card border-gray-700 text-white" 
                placeholder="Masukkan nominal diskon (misal: 20000)" 
              />
              <p className="text-[10px] text-gray-500 mt-1">*Diskon ini murni mengurangi pendapatan bersih Owner, komisi LC tetap utuh.</p>
            </div>

            <div className="p-4 rounded-xl border mb-4 text-center bg-dark border-gray-800">
              <p className="text-xs mb-1 font-semibold text-gray-400">Total Tagihan Akhir (Grand Total)</p>
              <h1 className="text-3xl font-mono font-extrabold text-success">Rp {grandTotal.toLocaleString('id-ID')}</h1>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-semibold mb-2 text-gray-300">Metode Pembayaran</label>
              <div className="flex space-x-2">
                <button onClick={() => setPaymentMethod('cash')} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${paymentMethod === 'cash' ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-dark border-gray-700 text-gray-300'}`}>TUNAI (CASH)</button>
                <button onClick={() => { setPaymentMethod('transfer'); setAmountPaid(grandTotal); }} className={`flex-1 py-3 rounded-xl font-bold text-sm border transition-all ${paymentMethod === 'transfer' ? 'bg-blue-600 border-blue-500 text-white shadow-md' : 'bg-dark border-gray-700 text-gray-300'}`}>TRANSFER / QRIS</button>
              </div>
            </div>

            {paymentMethod === 'cash' && (
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-gray-300">Uang Diterima dari Tamu</label>
                <input 
                  type="number" 
                  value={amountPaid} 
                  onChange={(e) => setAmountPaid(e.target.value)}
                  className="w-full border rounded-xl p-3 text-xl font-bold outline-none bg-dark border-gray-700 text-white"
                  placeholder="0"
                />
                {amountPaid && (
                  <div className={`mt-2 p-3.5 rounded-xl font-bold text-center text-sm border ${Number(amountPaid) >= grandTotal ? 'bg-green-900/30 border-green-800 text-success' : 'bg-warning/20 border-warning/50 text-warning'}`}>
                    {Number(amountPaid) >= grandTotal 
                      ? `Kembalian: Rp ${(Number(amountPaid) - grandTotal).toLocaleString('id-ID')}` 
                      : `Uang Kurang (Kasbon): Rp ${(grandTotal - Number(amountPaid)).toLocaleString('id-ID')}`
                    }
                  </div>
                )}
              </div>
            )}

            <div className="flex space-x-2 mb-2">
              <button onClick={handlePrintDraftReceipt} className="flex-1 py-3 bg-gray-800 border border-gray-700 hover:bg-gray-700 text-blue-300 font-bold rounded-xl text-xs flex items-center justify-center">
                <Receipt size={16} className="mr-1.5 text-warning" /> CETAK STRUK DIAWAL (80MM)
              </button>
            </div>

            <button onClick={handleCheckout} className={`w-full py-4 text-white font-bold rounded-xl text-base flex items-center justify-center shadow-lg transition-colors ${paymentMethod === 'cash' && Number(amountPaid) < grandTotal ? 'bg-warning hover:bg-yellow-600 text-black shadow-warning/30' : 'bg-primary hover:bg-blue-600 shadow-blue-500/30'}`}>
              <CheckCircle size={20} className="mr-2" />
              {paymentMethod === 'cash' && amountPaid && Number(amountPaid) < grandTotal ? 'SIMPAN SEBAGAI KASBON' : 'BAYAR LUNAS & CETAK'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;