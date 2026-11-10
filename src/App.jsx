import { useEffect, useState } from 'react';
import { db, seedInitialData } from './db/database';
import { useLiveQuery } from 'dexie-react-hooks';
import dayjs from 'dayjs';
import { Clock } from 'lucide-react';

// Imports Utils
import { calculateBillableHours, calculateLcCost } from './utils/billingHelpers';
import { formatRupiah } from './utils/currencyHelpers';
import { handlePrintDraftReceipt, handlePrintReport, handlePrintLcPayoutSlip } from './utils/printHelpers';
import { checkIsActivated } from './utils/licenseHelpers';

// Imports Components
import Header from './components/Header';
import UpdateBanner from './components/UpdateBanner';
import BarHeaderCard from './components/BarHeaderCard';
import RoomGrid from './components/RoomGrid';
import RoomCheckInForm from './components/RoomCheckInForm';
import RoomActivePanel from './components/RoomActivePanel';
import BarPosPanel from './components/BarPosPanel';

// Imports Modals
import FnbModal from './modals/FnbModal';
import LcModal from './modals/LcModal';
import CheckoutModal from './modals/CheckoutModal';
import ReceiptModal from './modals/ReceiptModal';
import HistoryModal from './modals/HistoryModal';
import ReportModal from './modals/ReportModal';
import LcPayoutModal from './modals/LcPayoutModal';
import PinModal from './modals/PinModal';
import ChangePinModal from './modals/ChangePinModal';
import MasterRoomModal from './modals/master/MasterRoomModal';
import MasterFnbModal from './modals/master/MasterFnbModal';
import MasterLcModal from './modals/master/MasterLcModal';
import LicenseModal from './modals/LicenseModal';

const CURRENT_APP_VERSION = '1.1.0'; // Diubah sementara dari 1.2.0

function App() {
  // State Aktivasi Lisensi Perangkat
  const [isActivated, setIsActivated] = useState(() => checkIsActivated());

  const [selectedRoom, setSelectedRoom] = useState(null);
  const [isNonRoomMode, setIsNonRoomMode] = useState(false);
  
  // State Role & PIN Owner
  const [userRole, setUserRole] = useState('kasir');
  const [ownerPin, setOwnerPin] = useState(() => localStorage.getItem('tirta_owner_pin') || '1234');
  const [showPinModal, setShowPinModal] = useState(false);
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [oldPinInput, setOldPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pendingAction, setPendingAction] = useState(null);

  // State Form Room Check-In Awal
  const [guestName, setGuestName] = useState('');
  const [billingType, setBillingType] = useState('fixed');
  const [duration, setDuration] = useState(2);
  const [initialSelectedLcIds, setInitialSelectedLcIds] = useState([]);
  const [initialFnbCart, setInitialFnbCart] = useState({});

  // Auto-Save Hold Bills Bar
  const [heldBarBills, setHeldBarBills] = useState(() => {
    try {
      const saved = localStorage.getItem('tirta_held_bar_bills');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [activeBarBillId, setActiveBarBillId] = useState(null);
  const [barGuestName, setBarGuestName] = useState('');
  const [barCart, setBarCart] = useState({});
  const [barPaymentMethod, setBarPaymentMethod] = useState('cash');
  const [barAmountPaid, setBarAmountPaid] = useState('');

  useEffect(() => {
    try {
      localStorage.setItem('tirta_held_bar_bills', JSON.stringify(heldBarBills));
    } catch (e) {
      console.error("Gagal auto-save hold bills:", e);
    }
  }, [heldBarBills]);

  // State In-App Update Alert
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [latestVersion, setLatestVersion] = useState('');
  const [downloadUrl, setDownloadUrl] = useState('');

  // Modals Visibility States
  const [showFnbModal, setShowFnbModal] = useState(false);
  const [showLcModal, setShowLcModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showFnbManageModal, setShowFnbManageModal] = useState(false);
  const [showLcManageModal, setShowLcManageModal] = useState(false);
  const [showRoomManageModal, setShowRoomManageModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showLcPayoutModal, setShowLcPayoutModal] = useState(false);
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [selectedHistoryTrx, setSelectedHistoryTrx] = useState(null);

  // Master & Filter States
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomNumberInput, setRoomNumberInput] = useState('');
  const [roomRateInput, setRoomRateInput] = useState('');

  const [historyFilter, setHistoryFilter] = useState('today');
  const [discountAmount, setDiscountAmount] = useState('');
  const [reportStartDate, setReportStartDate] = useState(dayjs().startOf('month').format('YYYY-MM-DD'));
  const [reportEndDate, setReportEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  const [selectedLcForPayout, setSelectedLcForPayout] = useState('');
  const [payoutStartDate, setPayoutStartDate] = useState(dayjs().subtract(6, 'day').format('YYYY-MM-DD'));
  const [payoutEndDate, setPayoutEndDate] = useState(dayjs().format('YYYY-MM-DD'));

  const [editingProduct, setEditingProduct] = useState(null);
  const [prodName, setProdName] = useState('');
  const [prodBuyPrice, setProdBuyPrice] = useState('');
  const [prodSellPrice, setProdSellPrice] = useState('');
  const [prodStock, setProdStock] = useState('');

  // Master LC States (Termasuk Tarif Ditagih Ke Tamu & Hak Bersih LC)
  const [editingLc, setEditingLc] = useState(null);
  const [lcName, setLcName] = useState('');
  const [lcType, setLcType] = useState('tetap');
  const [lcRateGuest, setLcRateGuest] = useState(85000);
  const [lcRateLc, setLcRateLc] = useState(75000);

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
            { name: 'Bir Bintang', buy_price: 50000, sell_price: 75000, stock: 50, status: 'active' },
            { name: 'Kacang Garing', buy_price: 10000, sell_price: 20000, stock: 100, status: 'active' }
          ]);
        }
        if (await db.lcs.count() === 0) {
          await db.lcs.bulkAdd([
            { name: 'Siska', type: 'tetap', hourly_rate_guest: 85000, hourly_rate_lc: 75000, status: 'available' },
            { name: 'Putri', type: 'tetap', hourly_rate_guest: 85000, hourly_rate_lc: 75000, status: 'available' },
            { name: 'Rina (Freelance)', type: 'freelance', hourly_rate_guest: 85000, hourly_rate_lc: 75000, status: 'available' }
          ]);
        }
      } catch (err) {
        console.error("Gagal inisialisasi Database:", err);
      }
    };
    initData();

    const checkAppUpdate = async () => {
      try {
        const res = await fetch('https://api.github.com/repos/Galih-Arno/tirta-pos/releases/latest');
        if (res.ok) {
          const data = await res.json();
          const latestTag = data.tag_name?.replace('v', '') || '';
          if (latestTag && latestTag !== CURRENT_APP_VERSION) {
            setLatestVersion(latestTag);
            const apkAsset = data.assets?.find(a => a.name.endsWith('.apk'));
            setDownloadUrl(apkAsset ? apkAsset.browser_download_url : data.html_url);
            setUpdateAvailable(true);
          }
        }
      } catch (err) {
        console.log("Cek update dilewati / offline mode:", err);
      }
    };
    checkAppUpdate();

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
  const historyPayments = useLiveQuery(() => (selectedHistoryTrx && db.transaction_payments) ? db.transaction_payments.where('transaction_id').equals(selectedHistoryTrx.id).toArray() : [], [selectedHistoryTrx]);
  const historyRoomName = selectedHistoryTrx?.room_id ? (rooms?.find(r => r.id === selectedHistoryTrx.room_id)?.room_number || '-') : 'NON-ROOM (BAR)';

  const activeTransaction = (selectedRoom && !isNonRoomMode && selectedRoom.status === 'active')
    ? activeTransactions.find(t => t.room_id === selectedRoom.id) 
    : null;

  const runningFnb = useLiveQuery(() => activeTransaction ? db.transaction_fnb.where('transaction_id').equals(activeTransaction.id).toArray() : [], [activeTransaction]);
  const runningLcs = useLiveQuery(() => activeTransaction ? db.transaction_lcs.where('transaction_id').equals(activeTransaction.id).toArray() : [], [activeTransaction]);
  const runningPayments = useLiveQuery(() => (activeTransaction && db.transaction_payments) ? db.transaction_payments.where('transaction_id').equals(activeTransaction.id).toArray() : [], [activeTransaction]) || [];

  const roomRatePerHour = selectedRoom?.hourly_rate || 50000;
  let billableRoomHours = 0;
  if (activeTransaction) {
    if (activeTransaction.billing_type === 'fixed') {
      billableRoomHours = activeTransaction.duration_hours || 2;
    } else {
      billableRoomHours = calculateBillableHours(activeTransaction.start_time, currentTime.toISOString());
    }
  }

  const roomSubtotal = isNonRoomMode ? 0 : Math.round(billableRoomHours * roomRatePerHour);
  const fnbSubtotal = isNonRoomMode 
    ? Object.entries(barCart).reduce((sum, [pId, q]) => sum + (q * (products?.find(p => p.id === Number(pId))?.sell_price || 0)), 0)
    : (runningFnb?.reduce((sum, item) => sum + item.subtotal, 0) || 0);

  let lcSubtotal = 0;
  const lcCalculations = isNonRoomMode ? [] : (runningLcs?.map(l => {
    const hours = activeTransaction?.billing_type === 'fixed' 
      ? (activeTransaction.duration_hours || 2)
      : calculateBillableHours(l.start_time || activeTransaction?.start_time, currentTime.toISOString());
    
    // Pembacaan tarif dinamis per LC dari DB
    const masterLc = lcs?.find(m => m.id === l.lc_id || m.name === l.lc_name);
    const gRate = masterLc?.hourly_rate_guest || 85000;
    const lRate = masterLc?.hourly_rate_lc || 75000;
    
    const cost = calculateLcCost(hours, 'gross', gRate, lRate);
    lcSubtotal += cost;
    return { ...l, hours, cost };
  }) || []);

  const rawGrandTotal = roomSubtotal + fnbSubtotal + lcSubtotal;
  const discountVal = Number(discountAmount) || (activeTransaction?.discount || 0);
  const grandTotal = Math.max(0, rawGrandTotal - discountVal);

  const totalPaidNet = isNonRoomMode ? 0 : runningPayments.reduce((sum, p) => sum + (p.amount_paid - (p.change_given || 0)), 0);
  const remainingBalanceDue = Math.max(0, grandTotal - totalPaidNet);
  const isPaymentSettled = !isNonRoomMode && remainingBalanceDue === 0 && grandTotal > 0;

  // Handlers
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
    if (actionName === 'roomMaster') setShowRoomManageModal(true);
    if (actionName === 'report') setShowReportModal(true);
    if (actionName === 'lcPayout') setShowLcPayoutModal(true);
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
    if (oldPinInput !== ownerPin) return alert("PIN Lama Anda salah!");
    if (newPinInput.length < 4) return alert("PIN Baru minimal 4 digit!");
    if (newPinInput !== confirmPinInput) return alert("Konfirmasi PIN Baru tidak cocok!");

    setOwnerPin(newPinInput);
    localStorage.setItem('tirta_owner_pin', newPinInput);
    alert("PIN Owner berhasil diperbarui!");
    setShowChangePinModal(false);
    setOldPinInput(''); setNewPinInput(''); setConfirmPinInput('');
  };

  const handleHoldCurrentBarBill = () => {
    const totalItems = Object.values(barCart).reduce((a, b) => a + b, 0);
    if (totalItems === 0) return alert("Pilih minimal 1 pesanan F&B untuk disimpan gantung!");

    const nowTime = dayjs().format('HH:mm:ss');
    const nameToUse = barGuestName.trim() || `Tamu Bar (${nowTime})`;

    if (activeBarBillId) {
      setHeldBarBills(prev => prev.map(b => b.id === activeBarBillId ? {
        ...b,
        guestName: nameToUse,
        cart: { ...barCart },
        paymentMethod: barPaymentMethod,
        amountPaid: barAmountPaid,
        updatedAt: nowTime
      } : b));
    } else {
      const newBill = {
        id: `HOLD-${Date.now()}`,
        guestName: nameToUse,
        cart: { ...barCart },
        paymentMethod: barPaymentMethod,
        amountPaid: barAmountPaid,
        createdAt: nowTime
      };
      setHeldBarBills(prev => [...prev, newBill]);
    }

    setActiveBarBillId(null);
    setBarGuestName('');
    setBarCart({});
    setBarPaymentMethod('cash');
    setBarAmountPaid('');
    alert(`Pesanan atas nama "${nameToUse}" tersimpan aman di penyimpanan lokal!`);
  };

  const handleLoadHeldBill = (bill) => {
    setActiveBarBillId(bill.id);
    setBarGuestName(bill.guestName);
    setBarCart(bill.cart || {});
    setBarPaymentMethod(bill.paymentMethod || 'cash');
    setBarAmountPaid(bill.amountPaid || '');
  };

  const handleDeleteHeldBill = (billId, e) => {
    e.stopPropagation();
    if (confirm("Hapus pesanan gantung ini?")) {
      setHeldBarBills(prev => prev.filter(b => b.id !== billId));
      if (activeBarBillId === billId) {
        setActiveBarBillId(null);
        setBarGuestName('');
        setBarCart({});
        setBarPaymentMethod('cash');
        setBarAmountPaid('');
      }
    }
  };

  const handleCreateNewBarBill = () => {
    setActiveBarBillId(null);
    setBarGuestName('');
    setBarCart({});
    setBarPaymentMethod('cash');
    setBarAmountPaid('');
  };

  const handleProcessNonRoomCheckout = async () => {
    if (Object.keys(barCart).length === 0 || fnbSubtotal === 0) return alert("Pilih minimal 1 item F&B!");
    const paid = Number(barAmountPaid) || 0;
    if (barPaymentMethod === 'cash' && paid < grandTotal) return alert("Nominal pembayaran kurang!");

    const billNum = `TRX-BAR-${dayjs().format('YYMMDD-HHmmss')}`;
    const startTime = dayjs().toISOString();
    const changeGiven = barPaymentMethod === 'cash' ? paid - grandTotal : 0;

    try {
      const trxId = await db.transactions.add({
        bill_number: billNum,
        guest_name: barGuestName.trim() || 'Tamu Bar / Non-Room',
        guest_contact: '',
        room_id: null,
        start_time: startTime,
        end_time: startTime,
        billing_type: 'open',
        duration_hours: 0,
        room_subtotal: 0,
        fnb_subtotal: Math.round(fnbSubtotal),
        lc_subtotal: 0,
        discount: discountVal,
        amount_paid: grandTotal,
        payment_method: barPaymentMethod,
        status: 'paid',
        debt_amount: 0
      });

      const fnbItems = [];
      for (const [prodId, qty] of Object.entries(barCart)) {
        if (qty > 0) {
          const prod = products.find(p => p.id === Number(prodId));
          if (prod) {
            fnbItems.push({
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
      await db.transaction_fnb.bulkAdd(fnbItems);

      if (db.transaction_payments) {
        await db.transaction_payments.add({
          transaction_id: trxId,
          payment_time: startTime,
          payment_method: barPaymentMethod,
          amount_paid: barPaymentMethod === 'cash' ? paid : grandTotal,
          change_given: changeGiven,
          note: 'Transaksi Walk-In Bar'
        });
      }

      const fullTrx = await db.transactions.get(trxId);
      setSelectedHistoryTrx(fullTrx);
      setShowReceiptModal(true);

      if (activeBarBillId) {
        setHeldBarBills(prev => prev.filter(b => b.id !== activeBarBillId));
      }

      setActiveBarBillId(null);
      setBarGuestName('');
      setBarCart({});
      setBarPaymentMethod('cash');
      setBarAmountPaid('');
      setDiscountAmount('');
    } catch (err) {
      alert("Gagal memproses transaksi: " + err.message);
    }
  };

  const handleStartRoom = async () => {
    if (!guestName.trim()) return alert("Tulis nama tamu!");
    const startTime = dayjs().toISOString();
    const endTime = billingType === 'fixed' ? dayjs(startTime).add(duration, 'hour').toISOString() : null;

    try {
      const trxId = await db.transactions.add({
        bill_number: `TRX-${dayjs().format('YYMMDD-HHmmss')}`,
        guest_name: guestName,
        guest_contact: '',
        room_id: selectedRoom.id,
        start_time: startTime,
        end_time: endTime,
        billing_type: billingType,
        duration_hours: billingType === 'fixed' ? duration : 0,
        status: 'ongoing',
        discount: 0
      });

      const fnbItemsToAdd = [];
      for (const [productId, qty] of Object.entries(initialFnbCart)) {
        if (qty > 0) {
          const prod = products.find(p => p.id === Number(productId));
          if (prod) {
            fnbItemsToAdd.push({
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
      if (fnbItemsToAdd.length > 0) {
        await db.transaction_fnb.bulkAdd(fnbItemsToAdd);
      }

      const lcsToAdd = [];
      for (const lcId of initialSelectedLcIds) {
        const lc = lcs.find(l => l.id === lcId);
        if (lc) {
          lcsToAdd.push({
            transaction_id: trxId,
            lc_id: lc.id,
            lc_name: lc.name,
            start_time: startTime
          });
        }
      }
      if (lcsToAdd.length > 0) {
        await db.transaction_lcs.bulkAdd(lcsToAdd);
      }

      await db.rooms.update(selectedRoom.id, { status: 'active' });
      setGuestName(''); 
      setInitialSelectedLcIds([]);
      setInitialFnbCart({});
      setDuration(2); 
      setSelectedRoom(null);
    } catch (e) { 
      console.error(e); 
    }
  };

  const handleAddHourFixed = async () => {
    if (!activeTransaction || activeTransaction.billing_type !== 'fixed') return;
    const newDuration = (activeTransaction.duration_hours || 0) + 1;
    const currentEndTime = activeTransaction.end_time ? dayjs(activeTransaction.end_time) : dayjs(activeTransaction.start_time);
    const newEndTime = currentEndTime.add(1, 'hour').toISOString();
    
    try {
      await db.transactions.update(activeTransaction.id, { 
        duration_hours: newDuration, 
        end_time: newEndTime 
      });
    } catch (e) {
      console.error(e);
      alert("Gagal menambahkan waktu sewa: " + e.message);
    }
  };

  const handleSaveFnb = async () => {
    if (!activeTransaction) return;
    const itemsToAdd = [];
    for (const [productId, qty] of Object.entries(fnbCart)) {
      if (qty > 0) {
        const prod = products.find(p => p.id === Number(productId));
        if (prod) {
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
    }
    if (itemsToAdd.length > 0) {
      await db.transaction_fnb.bulkAdd(itemsToAdd);
    }
    setFnbCart({});
    setShowFnbModal(false);
  };

  const handleUpdateFnbQty = async (fnbItem, delta) => {
    const newQty = fnbItem.qty + delta;
    const prod = products.find(p => p.id === fnbItem.product_id);

    if (delta > 0 && prod && prod.stock < 1) return alert("Stok produk tidak mencukupi!");

    if (newQty <= 0) {
      await db.transaction_fnb.delete(fnbItem.id);
      if (prod) await db.products.update(prod.id, { stock: prod.stock + 1 });
    } else {
      await db.transaction_fnb.update(fnbItem.id, { qty: newQty, subtotal: newQty * fnbItem.price_at_transaction });
      if (prod) await db.products.update(prod.id, { stock: prod.stock - delta });
    }
  };

  const handleSaveLc = async () => {
    if (!activeTransaction) return;
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
          lcsToAdd.push({ transaction_id: activeTransaction.id, lc_id: lc.id, lc_name: lc.name, start_time: nowIso });
        }
      }
    }
    if (lcsToAdd.length > 0) await db.transaction_lcs.bulkAdd(lcsToAdd);
    setShowLcModal(false);
  };

  const handleSaveRoomMaster = async (e) => {
    e.preventDefault();
    if (!roomNumberInput.trim() || !roomRateInput) return alert("Semua kolom room wajib diisi!");
    if (editingRoom) {
      await db.rooms.update(editingRoom.id, { room_number: roomNumberInput, hourly_rate: Number(roomRateInput) });
    } else {
      await db.rooms.add({ room_number: roomNumberInput, hourly_rate: Number(roomRateInput), status: 'available' });
    }
    setEditingRoom(null); setRoomNumberInput(''); setRoomRateInput('');
  };

  const handleExportData = async () => {
    try {
      const data = {
        rooms: await db.rooms.toArray(),
        products: await db.products.toArray(),
        lcs: await db.lcs.toArray(),
        transactions: await db.transactions.toArray(),
        transaction_fnb: await db.transaction_fnb.toArray(),
        transaction_lcs: await db.transaction_lcs.toArray(),
        transaction_payments: db.transaction_payments ? await db.transaction_payments.toArray() : [],
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

  // Handler Simpan Master LC dengan Menyimpan Tarif Kotor Tamu & Hak Bersih LC
  const handleSaveLcMaster = async (e) => {
    e.preventDefault();
    if (!lcName.trim()) return alert("Nama LC wajib diisi!");
    
    const guestRate = Number(lcRateGuest) || 85000;
    const lcRate = Number(lcRateLc) || 75000;

    if (editingLc) {
      await db.lcs.update(editingLc.id, { 
        name: lcName, 
        type: lcType,
        hourly_rate_guest: guestRate,
        hourly_rate_lc: lcRate
      });
    } else {
      await db.lcs.add({ 
        name: lcName, 
        type: lcType, 
        hourly_rate_guest: guestRate,
        hourly_rate_lc: lcRate,
        status: 'available' 
      });
    }

    setEditingLc(null); 
    setLcName(''); 
    setLcType('tetap');
    setLcRateGuest(85000);
    setLcRateLc(75000);
  };

  const handleCheckout = async () => {
    const paidInput = Number(amountPaid) || 0;
    let actualPaid = paidInput;
    let changeGiven = 0;

    if (paymentMethod === 'cash') {
      if (paidInput >= remainingBalanceDue) {
        changeGiven = paidInput - remainingBalanceDue;
      }
    } else {
      actualPaid = remainingBalanceDue;
    }

    const newTotalPaidNet = totalPaidNet + (actualPaid - changeGiven);
    const isFullyPaid = newTotalPaidNet >= grandTotal;

    try {
      if (db.transaction_payments) {
        await db.transaction_payments.add({
          transaction_id: activeTransaction.id,
          payment_time: dayjs().toISOString(),
          payment_method: paymentMethod,
          amount_paid: actualPaid,
          change_given: changeGiven,
          note: isFullyPaid ? 'Pembayaran Lunas' : 'Pembayaran Bertahap / DP'
        });
      }

      await db.transactions.update(activeTransaction.id, {
        discount: discountVal,
        duration_hours: Number(billableRoomHours.toFixed(2)),
        room_subtotal: Math.round(roomSubtotal),
        fnb_subtotal: Math.round(fnbSubtotal),
        lc_subtotal: Math.round(lcSubtotal),
        amount_paid: newTotalPaidNet
      });

      setShowCheckoutModal(false); 
      setAmountPaid(''); 
      setDiscountAmount('');
      
      const fullUpdated = await db.transactions.get(activeTransaction.id);
      setSelectedHistoryTrx(fullUpdated);
      setShowReceiptModal(true);
    } catch (e) { 
      console.error(e); 
    }
  };

  const handleFinishRoomSession = async () => {
    if (!activeTransaction) return;

    if (remainingBalanceDue > 0) {
      if (!confirm(`Masih ada sisa tagihan Rp ${remainingBalanceDue.toLocaleString('id-ID')}. Selesaikan sesi & simpan sisa sebagai Kasbon?`)) {
        return;
      }
    } else {
      if (!confirm(`Konfirmasi tamu di ${selectedRoom.room_number} telah selesai dan keluar dari ruangan?`)) {
        return;
      }
    }

    try {
      await db.transactions.update(activeTransaction.id, {
        status: remainingBalanceDue > 0 ? 'debt' : 'paid',
        debt_amount: Math.round(remainingBalanceDue)
      });

      await db.rooms.update(selectedRoom.id, { status: 'available' });
      setSelectedRoom(null);
      alert("Sesi ruangan selesai dan ruangan kini KOSONG.");
    } catch (e) {
      console.error(e);
    }
  };

  // CHECKPOINTS AKTIVASI LISENSI: Jika Perangkat Belum Terdaftar/Terverifikasi, Kunci Akses POS
  if (!isActivated) {
    return <LicenseModal setIsActivated={setIsActivated} />;
  }

  return (
    <div className="flex h-screen font-sans overflow-hidden bg-[#0d0f12] text-white">
      {/* SISI KIRI: GRID RUANGAN & WALK-IN BAR (45%) */}
      <div className="w-[45%] p-5 flex flex-col relative z-0 border-r border-gray-800/90 overflow-y-auto">
        <Header 
          userRole={userRole} 
          setUserRole={setUserRole} 
          currentVersion={CURRENT_APP_VERSION}
          handleProtectedAction={handleProtectedAction}
          setShowChangePinModal={setShowChangePinModal}
          handleExportData={handleExportData}
          setShowHistoryModal={setShowHistoryModal}
          setShowPinModal={setShowPinModal}
        />

        {updateAvailable && (
          <UpdateBanner 
            latestVersion={latestVersion} 
            downloadUrl={downloadUrl} 
            setUpdateAvailable={setUpdateAvailable} 
          />
        )}

        <BarHeaderCard 
          isNonRoomMode={isNonRoomMode} 
          setIsNonRoomMode={setIsNonRoomMode} 
          setSelectedRoom={setSelectedRoom} 
        />

        <RoomGrid 
          rooms={rooms} 
          activeTransactions={activeTransactions} 
          selectedRoom={selectedRoom} 
          setSelectedRoom={setSelectedRoom} 
          isNonRoomMode={isNonRoomMode} 
          setIsNonRoomMode={setIsNonRoomMode} 
          currentTime={currentTime} 
        />
      </div>

      {/* SISI KANAN: PANEL AKSI KASIR (55% - LEBIH LUAS & LEGA) */}
      <div className="w-[55%] p-5 overflow-y-auto relative z-0 border-l bg-[#161a20] border-gray-800/90">
        {isNonRoomMode ? (
          <BarPosPanel 
            setIsNonRoomMode={setIsNonRoomMode}
            heldBarBills={heldBarBills}
            handleCreateNewBarBill={handleCreateNewBarBill}
            activeBarBillId={activeBarBillId}
            handleLoadHeldBill={handleLoadHeldBill}
            handleDeleteHeldBill={handleDeleteHeldBill}
            barGuestName={barGuestName}
            setBarGuestName={setBarGuestName}
            products={products}
            barCart={barCart}
            setBarCart={setBarCart}
            fnbSubtotal={fnbSubtotal}
            barPaymentMethod={barPaymentMethod}
            setBarPaymentMethod={setBarPaymentMethod}
            barAmountPaid={barAmountPaid}
            setBarAmountPaid={setBarAmountPaid}
            handleHoldCurrentBarBill={handleHoldCurrentBarBill}
            handleProcessNonRoomCheckout={handleProcessNonRoomCheckout}
          />
        ) : selectedRoom ? (
          <div>
            <h2 className="text-2xl font-serif font-bold mb-4 text-white flex items-center justify-between">
              <span>{selectedRoom.room_number}</span>
              <span className="text-xs font-sans text-gray-400 font-normal">Tarif: {formatRupiah(selectedRoom.hourly_rate || 50000)}/jam</span>
            </h2>
            {selectedRoom.status === 'available' ? (
              <RoomCheckInForm 
                guestName={guestName} setGuestName={setGuestName}
                billingType={billingType} setBillingType={setBillingType}
                duration={duration} setDuration={setDuration}
                lcs={lcs} initialSelectedLcIds={initialSelectedLcIds} setInitialSelectedLcIds={setInitialSelectedLcIds}
                products={products} initialFnbCart={initialFnbCart} setInitialFnbCart={setInitialFnbCart}
                handleStartRoom={handleStartRoom}
              />
            ) : (
              <RoomActivePanel 
                selectedRoom={selectedRoom}
                activeTransaction={activeTransaction}
                billableRoomHours={billableRoomHours}
                roomRatePerHour={roomRatePerHour}
                roomSubtotal={roomSubtotal}
                handleAddHourFixed={handleAddHourFixed}
                runningLcs={runningLcs}
                lcCalculations={lcCalculations}
                setSelectedLcIds={setSelectedLcIds}
                setShowLcModal={setShowLcModal}
                runningFnb={runningFnb}
                setShowFnbModal={setShowFnbModal}
                handleUpdateFnbQty={handleUpdateFnbQty}
                grandTotal={grandTotal}
                isPaymentSettled={isPaymentSettled}
                remainingBalanceDue={remainingBalanceDue}
                setShowCheckoutModal={setShowCheckoutModal}
                handleFinishRoomSession={handleFinishRoomSession}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 space-y-3">
            <Clock size={64} className="opacity-30 animate-pulse text-amber-500" />
            <p className="text-lg font-medium text-gray-400 text-center">Pilih salah satu ruangan di sebelah kiri atau buka Kasir Bar</p>
          </div>
        )}
      </div>

      {/* POP-UP MODALS */}
      {showFnbModal && activeTransaction && (
        <FnbModal 
          selectedRoom={selectedRoom} setShowFnbModal={setShowFnbModal} 
          fnbCart={fnbCart} setFnbCart={setFnbCart} products={products} 
          handleSaveFnb={handleSaveFnb} 
        />
      )}

      {showLcModal && activeTransaction && (
        <LcModal 
          selectedRoom={selectedRoom} setShowLcModal={setShowLcModal} 
          lcs={lcs} selectedLcIds={selectedLcIds} setSelectedLcIds={setSelectedLcIds} 
          handleSaveLc={handleSaveLc} 
        />
      )}

      {showFnbManageModal && (
        <MasterFnbModal 
          setShowFnbManageModal={setShowFnbManageModal} editingProduct={editingProduct} 
          setEditingProduct={setEditingProduct} handleSaveProductMaster={handleSaveProductMaster} 
          prodName={prodName} setProdName={setProdName} prodBuyPrice={prodBuyPrice} 
          setProdBuyPrice={setProdBuyPrice} prodSellPrice={prodSellPrice} setProdSellPrice={setProdSellPrice} 
          prodStock={prodStock} setProdStock={setProdStock} products={products} db={db}
        />
      )}

      {showLcManageModal && (
        <MasterLcModal 
          setShowLcManageModal={setShowLcManageModal} editingLc={editingLc} 
          setEditingLc={setEditingLc} handleSaveLcMaster={handleSaveLcMaster} 
          lcName={lcName} setLcName={setLcName} lcType={lcType} setLcType={setLcType} 
          lcRateGuest={lcRateGuest} setLcRateGuest={setLcRateGuest}
          lcRateLc={lcRateLc} setLcRateLc={setLcRateLc}
          lcs={lcs} db={db}
        />
      )}

      {showRoomManageModal && (
        <MasterRoomModal 
          setShowRoomManageModal={setShowRoomManageModal} editingRoom={editingRoom} 
          setEditingRoom={setEditingRoom} handleSaveRoomMaster={handleSaveRoomMaster} 
          roomNumberInput={roomNumberInput} setRoomNumberInput={setRoomNumberInput} 
          roomRateInput={roomRateInput} setRoomRateInput={setRoomRateInput} 
          rooms={rooms} db={db}
        />
      )}

      {showHistoryModal && (
        <HistoryModal 
          setShowHistoryModal={setShowHistoryModal} selectedHistoryTrx={selectedHistoryTrx} 
          setSelectedHistoryTrx={setSelectedHistoryTrx} historyFilter={historyFilter} 
          setHistoryFilter={setHistoryFilter} filteredHistory={filteredHistory} rooms={rooms} 
          historyRoomName={historyRoomName} historyFnb={historyFnb} historyLcs={historyLcs} 
          handlePrintDraftReceipt={(trx) => handlePrintDraftReceipt(trx, rooms, db)} 
        />
      )}

      {showReportModal && (
        <ReportModal 
          setShowReportModal={setShowReportModal} reportStartDate={reportStartDate} 
          setReportStartDate={setReportStartDate} reportEndDate={reportEndDate} 
          setReportEndDate={setReportEndDate} 
          handlePrintReport={() => handlePrintReport(allTransactions, reportStartDate, reportEndDate, db)} 
        />
      )}

      {showLcPayoutModal && (
        <LcPayoutModal 
          setShowLcPayoutModal={setShowLcPayoutModal} selectedLcForPayout={selectedLcForPayout} 
          setSelectedLcForPayout={setSelectedLcForPayout} lcs={lcs} payoutStartDate={payoutStartDate} 
          setPayoutStartDate={setPayoutStartDate} payoutEndDate={payoutEndDate} 
          setPayoutEndDate={setPayoutEndDate} 
          handlePrintLcPayoutSlip={() => handlePrintLcPayoutSlip(selectedLcForPayout, payoutStartDate, payoutEndDate, rooms, db)} 
        />
      )}

      {showPinModal && (
        <PinModal 
          setShowPinModal={setShowPinModal} handleVerifyPin={handleVerifyPin} 
          pinInput={pinInput} setPinInput={setPinInput} 
        />
      )}

      {showChangePinModal && (
        <ChangePinModal 
          setShowChangePinModal={setShowChangePinModal} handleChangePin={handleChangePin} 
          oldPinInput={oldPinInput} setOldPinInput={setOldPinInput} newPinInput={newPinInput} 
          setNewPinInput={setNewPinInput} confirmPinInput={confirmPinInput} setConfirmPinInput={setConfirmPinInput} 
        />
      )}

      {showCheckoutModal && (
        <CheckoutModal 
          setShowCheckoutModal={setShowCheckoutModal} remainingBalanceDue={remainingBalanceDue} 
          paymentMethod={paymentMethod} setPaymentMethod={setPaymentMethod} amountPaid={amountPaid} 
          setAmountPaid={setAmountPaid} handleCheckout={handleCheckout} 
        />
      )}

      {showReceiptModal && selectedHistoryTrx && (
        <ReceiptModal 
          setShowReceiptModal={setShowReceiptModal} selectedHistoryTrx={selectedHistoryTrx} 
          handlePrintDraftReceipt={(trx) => handlePrintDraftReceipt(trx, rooms, db)} 
        />
      )}
    </div>
  );
}

export default App;