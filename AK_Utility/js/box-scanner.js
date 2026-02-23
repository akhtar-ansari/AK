// ============================================
// BOX SCANNER - STATE & CONFIG
// ============================================
const ScannerState = {
    staffName: '',
    purpose: '',
    remark: '',
    currentBox: null,
    boxScanning: false,
    language: 'en',
    scans: [],
    pendingDeleteId: null,
    completedBoxes: new Set(),
    isProcessingClose: false,
    isSyncing: false
};

const ScannerT = {
    en: {
        lblStaffName: "Your Name", lblPurpose: "Purpose", lblRemark: "Remark", lblStartSession: "Start Session",
        lblStore: "Store:", lblStaff: "Staff:", lblTotal: "Total", lblBoxQty: "Box Qty", lblBoxes: "Boxes",
        lblBoxId: "Box ID", lblBarcode: "Barcode", lblCloseBox: "Close Box", lblRecentScans: "Last 5 Scans",
        thBarcode: "Barcode", thTime: "Time", thAction: "Del", lblDownload: "Download", lblReset: "Reset",
        lblSettings: "Settings", lblCloseBoxTitle: "Close Box", lblQtyItems: "Quantity:", lblItems: "items",
        lblAreYouSure: "Are you sure you want to close this box?", lblScanToConfirm: "Scan box ID to confirm",
        lblResetTitle: "Reset Session?", lblResetMsg: "This will download your data and start a new session.",
        lblDeleteTitle: "Delete Scan?", lblDeleteMsg: "Delete this scan?", lblSettingsTitle: "Settings",
        lblLanguage: "Language", lblAdminReset: "Admin Reset", lblAdminResetDesc: "Reset store and all data",
        lblExecuteReset: "Execute Reset", boxIdPlaceholder: "Scan box ID...", barcodePlaceholder: "Scan barcode...",
        remarkPlaceholder: "e.g., Fall Winter 2023 stocks", staffPlaceholder: "Enter your name...",
        selectPurpose: "-- Select purpose --", errEnterName: "Please enter your name",
        errSelectPurpose: "Please select purpose", errEnterRemark: "Please enter a remark",
        errBoxFirst: "Scan Box ID first", errSameBox: "Scan same Box ID!", errCloseBoxFirst: "Close the box first!",
        errBoxAlreadyClosed: "Box already closed", msgAdminResetSuccess: "Store reset successful!",
        msgInvalidAdminCode: "Invalid admin code."
    },
    ar: {
        lblStaffName: "اسمك", lblPurpose: "الغرض", lblRemark: "ملاحظة", lblStartSession: "بدء الجلسة",
        lblStore: "المتجر:", lblStaff: "الموظف:", lblTotal: "الإجمالي", lblBoxQty: "الصندوق", lblBoxes: "مكتمل",
        lblBoxId: "رقم الصندوق", lblBarcode: "الباركود", lblCloseBox: "إغلاق الصندوق", lblRecentScans: "آخر 5 مسح",
        thBarcode: "الباركود", thTime: "الوقت", thAction: "حذف", lblDownload: "تحميل", lblReset: "إعادة",
        lblSettings: "الإعدادات", lblCloseBoxTitle: "إغلاق الصندوق", lblQtyItems: "الكمية:", lblItems: "قطعة",
        lblAreYouSure: "هل أنت متأكد من إغلاق هذا الصندوق؟", lblScanToConfirm: "امسح رقم الصندوق للتأكيد",
        lblResetTitle: "إعادة تعيين؟", lblResetMsg: "سيتم تحميل البيانات وبدء جلسة جديدة.",
        lblDeleteTitle: "حذف المسح؟", lblDeleteMsg: "حذف هذا المسح؟", lblSettingsTitle: "الإعدادات",
        lblLanguage: "اللغة", lblAdminReset: "إعادة تعيين المسؤول", lblAdminResetDesc: "إعادة تعيين المتجر وجميع البيانات",
        lblExecuteReset: "تنفيذ إعادة التعيين", boxIdPlaceholder: "امسح رقم الصندوق...", barcodePlaceholder: "امسح الباركود...",
        remarkPlaceholder: "مثال: مخزون خريف وشتاء 2023", staffPlaceholder: "أدخل اسمك...",
        selectPurpose: "-- اختر الغرض --", errEnterName: "الرجاء إدخال اسمك",
        errSelectPurpose: "الرجاء اختيار الغرض", errEnterRemark: "الرجاء إدخال ملاحظة",
        errBoxFirst: "امسح رقم الصندوق أولاً", errSameBox: "امسح نفس رقم الصندوق!", errCloseBoxFirst: "أغلق الصندوق أولاً!",
        errBoxAlreadyClosed: "الصندوق مغلق بالفعل", msgAdminResetSuccess: "تمت إعادة تعيين المتجر بنجاح!",
        msgInvalidAdminCode: "رمز المسؤول غير صالح."
    }
};

function scannerT(key) { 
    return ScannerT[ScannerState.language][key] || key; 
}

// ============================================
// BOX SCANNER - DATABASE
// ============================================
let scannerDB;
const SCANNER_DB_NAME = 'AKBoxScannerDB';
const SCANNER_STORE = 'scans';

function initScannerDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(SCANNER_DB_NAME, 1);
        req.onerror = () => reject(req.error);
        req.onsuccess = () => { 
            scannerDB = req.result; 
            resolve(scannerDB); 
        };
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(SCANNER_STORE)) {
                db.createObjectStore(SCANNER_STORE, { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

async function addScan(scan) {
    return new Promise((resolve, reject) => {
        const tx = scannerDB.transaction([SCANNER_STORE], 'readwrite');
        const store = tx.objectStore(SCANNER_STORE);
        const req = store.add(scan);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function getAllScans() {
    return new Promise((resolve, reject) => {
        const tx = scannerDB.transaction([SCANNER_STORE], 'readonly');
        const store = tx.objectStore(SCANNER_STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function updateScan(scan) {
    return new Promise((resolve, reject) => {
        const tx = scannerDB.transaction([SCANNER_STORE], 'readwrite');
        const store = tx.objectStore(SCANNER_STORE);
        const req = store.put(scan);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
    });
}

async function deleteScanById(id) {
    return new Promise((resolve, reject) => {
        const tx = scannerDB.transaction([SCANNER_STORE], 'readwrite');
        const store = tx.objectStore(SCANNER_STORE);
        const req = store.delete(id);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

async function clearAllScans() {
    return new Promise((resolve, reject) => {
        const tx = scannerDB.transaction([SCANNER_STORE], 'readwrite');
        const store = tx.objectStore(SCANNER_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
    });
}

// ============================================
// BOX SCANNER - SESSION PERSISTENCE
// ============================================
function saveScannerSession() {
    Storage.setJSON('scanner_session', {
        staffName: ScannerState.staffName,
        purpose: ScannerState.purpose,
        remark: ScannerState.remark,
        currentBox: ScannerState.currentBox,
        boxScanning: ScannerState.boxScanning,
        language: ScannerState.language,
        completedBoxes: Array.from(ScannerState.completedBoxes)
    });
}

function loadScannerSession() {
    const session = Storage.getJSON('scanner_session');
    if (session) {
        ScannerState.staffName = session.staffName || '';
        ScannerState.purpose = session.purpose || '';
        ScannerState.remark = session.remark || '';
        ScannerState.currentBox = session.currentBox || null;
        ScannerState.boxScanning = session.boxScanning || false;
        ScannerState.language = session.language || 'en';
        ScannerState.completedBoxes = new Set(session.completedBoxes || []);
        return true;
    }
    return false;
}

function clearScannerSession() {
    Storage.remove('scanner_session');
    Storage.remove('active_session');
    ScannerState.staffName = '';
    ScannerState.purpose = '';
    ScannerState.remark = '';
    ScannerState.currentBox = null;
    ScannerState.boxScanning = false;
    ScannerState.scans = [];
    ScannerState.completedBoxes = new Set();
}

// ============================================
// BOX SCANNER - UI HELPERS
// ============================================
function showScannerScreen(screenId) {
    document.querySelectorAll('.scanner-screen').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none';
    });
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        targetScreen.style.display = 'block';
    }
}

function applyScannerTranslations() {
    const lang = ScannerT[ScannerState.language];
    Object.keys(lang).forEach(key => {
        const el = document.getElementById(key);
        if (el && !el.matches('input, select')) el.textContent = lang[key];
    });
    
    document.getElementById('scannerStaffInput').placeholder = scannerT('staffPlaceholder');
    document.getElementById('scannerRemarkInput').placeholder = scannerT('remarkPlaceholder');
    document.getElementById('boxIdInput').placeholder = scannerT('boxIdPlaceholder');
    document.getElementById('barcodeInput').placeholder = scannerT('barcodePlaceholder');
    
    const purposeSelect = document.getElementById('scannerPurposeSelect');
    if (purposeSelect.options[0]) purposeSelect.options[0].textContent = scannerT('selectPurpose');
    
    document.body.classList.toggle('rtl', ScannerState.language === 'ar');
    
    document.getElementById('langEnBtn').classList.toggle('active', ScannerState.language === 'en');
    document.getElementById('langArBtn').classList.toggle('active', ScannerState.language === 'ar');
    document.getElementById('settingsLangEnBtn').classList.toggle('active', ScannerState.language === 'en');
    document.getElementById('settingsLangArBtn').classList.toggle('active', ScannerState.language === 'ar');
}

function setScannerLanguage(lang) {
    ScannerState.language = lang;
    applyScannerTranslations();
    saveScannerSession();
    updateScansTable();
}

// ============================================
// BOX SCANNER - SESSION MANAGEMENT
// ============================================
function startScannerSession() {
    const staff = document.getElementById('scannerStaffInput').value.trim();
    const purpose = document.getElementById('scannerPurposeSelect').value;
    const remark = document.getElementById('scannerRemarkInput').value.trim();
    
    if (!staff) { 
        alert(scannerT('errEnterName')); 
        document.getElementById('scannerStaffInput').focus(); 
        return; 
    }
    if (!purpose) { 
        alert(scannerT('errSelectPurpose')); 
        document.getElementById('scannerPurposeSelect').focus(); 
        return; 
    }
    if (!remark) { 
        alert(scannerT('errEnterRemark')); 
        document.getElementById('scannerRemarkInput').focus(); 
        return; 
    }
    
    ScannerState.staffName = staff;
    ScannerState.purpose = purpose;
    ScannerState.remark = remark;
    
    setActiveSession('boxScanner', true);
    saveScannerSession();
    
    document.getElementById('dispScannerStore').textContent = `${AppState.storeId} - ${AppState.storeName}`;
    document.getElementById('dispScannerStaff').textContent = ScannerState.staffName;
    
    showScannerScreen('scannerScanScreen');
    document.getElementById('boxIdInput').focus();
    loadAndDisplayScans();
    updateBackButton();
}

// ============================================
// BOX SCANNER - SCANNING LOGIC
// ============================================
function handleBoxIdScan(e) {
    if (e.key !== 'Enter') return;
    const boxId = document.getElementById('boxIdInput').value.trim();
    if (!boxId) return;
    
    if (!ScannerState.boxScanning) {
        if (ScannerState.completedBoxes.has(boxId)) {
            const boxQty = ScannerState.scans.filter(s => s.boxNumber === boxId).length;
            alert(scannerT('errBoxAlreadyClosed') + ' (' + boxQty + ' items)');
            document.getElementById('boxIdInput').value = '';
            return;
        }
        
        ScannerState.currentBox = boxId;
        ScannerState.boxScanning = true;
        saveScannerSession();
        
        document.getElementById('boxIdGroup').classList.add('hidden');
        document.getElementById('barcodeGroup').classList.remove('hidden');
        document.getElementById('boxIdInput').value = '';
        document.getElementById('closeBoxBtn').classList.add('show');
        document.getElementById('closeBoxBtnId').textContent = boxId;
        document.getElementById('barcodeInput').focus();
        updateScannerStats();
    } else {
        document.getElementById('boxIdInput').value = '';
    }
}

async function handleBarcodeScan(e) {
    if (e.key !== 'Enter') return;
    const barcode = document.getElementById('barcodeInput').value.trim();
    if (!barcode) return;
    
    if (!ScannerState.boxScanning) {
        alert(scannerT('errBoxFirst'));
        document.getElementById('barcodeInput').value = '';
        document.getElementById('boxIdInput').focus();
        return;
    }
    
    const scan = {
        storeId: AppState.storeId,
        storeName: AppState.storeName,
        staffName: ScannerState.staffName,
        purpose: ScannerState.purpose,
        remark: ScannerState.remark,
        boxNumber: String(ScannerState.currentBox),
        barcode: String(barcode),
        qty: 1,
        boxStatus: 'Open',
        timestamp: new Date().toISOString(),
        synced: false
    };
    
    await addScan(scan);
    document.getElementById('barcodeInput').value = '';
    document.getElementById('barcodeInput').classList.add('input-highlight');
    setTimeout(() => document.getElementById('barcodeInput').classList.remove('input-highlight'), 500);
    await loadAndDisplayScans();
}

// ============================================
// BOX SCANNER - CLOSE BOX
// ============================================
function showCloseBoxModal() {
    const boxQty = ScannerState.scans.filter(s => s.boxNumber === ScannerState.currentBox).length;
    document.getElementById('modalBoxId').textContent = ScannerState.currentBox;
    document.getElementById('modalBoxQty').textContent = boxQty;
    document.getElementById('closeBoxStep1').style.display = 'block';
    document.getElementById('closeBoxStep2').style.display = 'none';
    document.getElementById('closeBoxButtons1').style.display = 'flex';
    document.getElementById('closeBoxButtons2').style.display = 'none';
    document.getElementById('closeBoxScanInput').value = '';
    document.getElementById('closeBoxModal').classList.add('active');
}

function closeBoxProceedToScan() {
    document.getElementById('closeBoxStep1').style.display = 'none';
    document.getElementById('closeBoxStep2').style.display = 'block';
    document.getElementById('closeBoxButtons1').style.display = 'none';
    document.getElementById('closeBoxButtons2').style.display = 'flex';
    setTimeout(() => document.getElementById('closeBoxScanInput').focus(), 100);
}

function handleCloseBoxScan(e) {
    if (e.key !== 'Enter') return;
    const scannedId = document.getElementById('closeBoxScanInput').value.trim();
    if (scannedId === ScannerState.currentBox) {
        executeCloseBox();
    } else {
        alert(scannerT('errSameBox'));
        document.getElementById('closeBoxScanInput').value = '';
        document.getElementById('closeBoxScanInput').focus();
    }
}

function cancelCloseBox() {
    document.getElementById('closeBoxModal').classList.remove('active');
    document.getElementById('closeBoxScanInput').value = '';
    document.getElementById('barcodeInput').focus();
}

async function executeCloseBox() {
    if (ScannerState.isProcessingClose) return;
    ScannerState.isProcessingClose = true;
    document.getElementById('closeBoxModal').classList.remove('active');
    document.getElementById('closeBoxScanInput').value = '';
    
    try {
        const closedBox = ScannerState.currentBox;
        for (const scan of ScannerState.scans) {
            if (scan.boxNumber === closedBox && scan.boxStatus === 'Open') {
                scan.boxStatus = 'Closed';
                scan.synced = false;
                await updateScan(scan);
            }
        }
        if (ScannerState.currentBox) ScannerState.completedBoxes.add(ScannerState.currentBox);
        ScannerState.currentBox = null;
        ScannerState.boxScanning = false;
        saveScannerSession();
        
        document.getElementById('boxIdGroup').classList.remove('hidden');
        document.getElementById('barcodeGroup').classList.add('hidden');
        document.getElementById('closeBoxBtn').classList.remove('show');
        document.getElementById('closeBoxBtnId').textContent = '';
        document.getElementById('boxIdInput').focus();
        await loadAndDisplayScans();
        updateScannerStats();
        if (AppState.isOnline) await autoSyncScans();
    } finally {
        ScannerState.isProcessingClose = false;
    }
}

// ============================================
// BOX SCANNER - DISPLAY & STATS
// ============================================
async function loadAndDisplayScans() {
    ScannerState.scans = await getAllScans();
    updateScannerStats();
    updateScansTable();
    updateSyncBadge();
}

function updateScannerStats() {
    document.getElementById('statTotal').textContent = ScannerState.scans.length;
    let boxQty = 0;
    if (ScannerState.currentBox) {
        boxQty = ScannerState.scans.filter(s => s.boxNumber === ScannerState.currentBox).length;
    }
    document.getElementById('statBoxQty').textContent = boxQty;
    document.getElementById('statBoxes').textContent = ScannerState.completedBoxes.size;
}

function updateScansTable() {
    const tbody = document.getElementById('scansTableBody');
    tbody.innerHTML = '';
    const currentBoxScans = ScannerState.scans.filter(s => s.boxNumber === ScannerState.currentBox && s.boxStatus === 'Open');
    const recent = currentBoxScans.slice(-5).reverse();
    
    if (recent.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--ak-text-light);">No scans yet</td></tr>`;
        return;
    }
    
    recent.forEach(scan => {
        const tr = document.createElement('tr');
        const time = new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        tr.innerHTML = `<td>${scan.barcode}</td><td>${time}</td><td><button class="delete-scan-btn" data-id="${scan.id}" data-barcode="${scan.barcode}">✕</button></td>`;
        tbody.appendChild(tr);
    });
}

function updateSyncBadge() {
    const pending = ScannerState.scans.filter(s => !s.synced && s.boxStatus === 'Closed').length;
    const badge = document.getElementById('syncBadge');
    if (pending === 0) {
        badge.textContent = '✓';
        badge.className = 'sync-badge synced';
    } else {
        badge.textContent = pending;
        badge.className = 'sync-badge pending';
    }
}

// ============================================
// BOX SCANNER - DELETE SCAN
// ============================================
function showDeleteModal(id, barcode) {
    ScannerState.pendingDeleteId = id;
    document.getElementById('deleteInfo').textContent = barcode;
    document.getElementById('deleteModal').classList.add('active');
}

async function executeDeleteScan(confirmed) {
    document.getElementById('deleteModal').classList.remove('active');
    if (confirmed && ScannerState.pendingDeleteId) {
        await deleteScanById(ScannerState.pendingDeleteId);
        await loadAndDisplayScans();
    }
    ScannerState.pendingDeleteId = null;
}

// ============================================
// BOX SCANNER - GOOGLE SHEETS SYNC
// ============================================
async function autoSyncScans() {
    if (ScannerState.isSyncing) return;
    ScannerState.isSyncing = true;
    try {
        const unsynced = ScannerState.scans.filter(s => !s.synced && s.boxStatus === 'Closed');
        if (unsynced.length === 0) return;
        const result = await postToGoogleSheets('addScans', { scans: unsynced });
        if (result && result.success) {
            for (const scan of unsynced) {
                scan.synced = true;
                await updateScan(scan);
            }
            await loadAndDisplayScans();
            console.log('Auto-synced ' + unsynced.length + ' scans');
        }
    } catch (e) {
        console.log('Auto-sync failed:', e);
    } finally {
        ScannerState.isSyncing = false;
    }
}

// ============================================
// BOX SCANNER - DOWNLOAD EXCEL
// ============================================
async function downloadScannerExcel() {
    if (ScannerState.boxScanning && ScannerState.currentBox) {
        alert(scannerT('errCloseBoxFirst'));
        return;
    }
    const scans = await getAllScans();
    if (scans.length === 0) {
        const data = [['Store ID', 'Store Name', 'Staff', 'Purpose', 'Remark', 'Box Number', 'Barcode', 'Qty', 'Box Status', 'Timestamp']];
        const ws = XLSX.utils.aoa_to_sheet(data);
        ws['!cols'] = [{wch:12},{wch:20},{wch:12},{wch:12},{wch:20},{wch:12},{wch:20},{wch:5},{wch:8},{wch:18}];
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Scans');
        XLSX.writeFile(wb, `${AppState.storeId}_empty_${new Date().toISOString().slice(0,10)}.xlsx`);
        return;
    }
    const data = scans.map(s => ({
        'Store ID': s.storeId, 'Store Name': s.storeName, 'Staff': s.staffName, 'Purpose': s.purpose,
        'Remark': s.remark, 'Box Number': s.boxNumber, 'Barcode': s.barcode, 'Qty': s.qty,
        'Box Status': s.boxStatus || 'Open', 'Timestamp': new Date(s.timestamp).toLocaleString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws['!cols'] = [{wch:12},{wch:20},{wch:12},{wch:12},{wch:20},{wch:12},{wch:20},{wch:5},{wch:8},{wch:18}];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Scans');
    XLSX.writeFile(wb, `${AppState.storeId}_${ScannerState.staffName}_${new Date().toISOString().slice(0,10)}.xlsx`);
}

// ============================================
// BOX SCANNER - RESET SESSION
// ============================================
function showResetModal() {
    if (ScannerState.boxScanning && ScannerState.currentBox) {
        alert(scannerT('errCloseBoxFirst'));
        return;
    }
    document.getElementById('resetModal').classList.add('active');
}

async function executeResetSession(confirmed) {
    document.getElementById('resetModal').classList.remove('active');
    if (confirmed) {
        await downloadScannerExcel();
        await clearAllScans();
        clearScannerSession();
        document.getElementById('scannerStaffInput').value = '';
        document.getElementById('scannerPurposeSelect').value = '';
        document.getElementById('scannerRemarkInput').value = '';
        document.getElementById('boxIdInput').value = '';
        document.getElementById('barcodeInput').value = '';
        document.getElementById('barcodeGroup').classList.add('hidden');
        document.getElementById('boxIdGroup').classList.remove('hidden');
        document.getElementById('closeBoxBtn').classList.remove('show');
        setActiveSession('boxScanner', false);
        showScannerScreen('scannerSessionScreen');
        updateBackButton();
    }
}

// ============================================
// BOX SCANNER - ADMIN RESET
// ============================================
async function executeAdminReset() {
    const code = document.getElementById('adminCodeInput').value;
    if (code === CONFIG.ADMIN_CODE) {
        Storage.remove('store_id');
        Storage.remove('store_name');
        Storage.remove('store_location');
        clearScannerSession();
        await clearAllScans();
        AppState.storeId = '';
        AppState.storeName = '';
        AppState.storeLocation = '';
        setActiveSession('boxScanner', false);
        document.getElementById('scannerSettingsModal').classList.remove('active');
        document.getElementById('adminCodeInput').value = '';
        updateHeaderStore();
        document.getElementById('storeIdInput').value = '';
        document.getElementById('storeConfirmBox').style.display = 'none';
        document.getElementById('lookupStoreBtn').style.display = 'block';
        document.getElementById('loginError').classList.remove('show');
        showScreen('loginScreen');
        alert(scannerT('msgAdminResetSuccess'));
    } else {
        alert(scannerT('msgInvalidAdminCode'));
    }
}

function openScannerSettings() {
    document.getElementById('adminCodeInput').value = '';
    document.getElementById('scannerSettingsModal').classList.add('active');
}

function closeScannerSettings() {
    document.getElementById('scannerSettingsModal').classList.remove('active');
}

// ============================================
// BOX SCANNER - EVENT LISTENERS
// ============================================
function setupScannerEventListeners() {
    setTimeout(() => {
        const langEnBtn = document.getElementById('langEnBtn');
        const langArBtn = document.getElementById('langArBtn');
        const settingsLangEnBtn = document.getElementById('settingsLangEnBtn');
        const settingsLangArBtn = document.getElementById('settingsLangArBtn');
        const startSessionBtn = document.getElementById('startSessionBtn');
        const boxIdInput = document.getElementById('boxIdInput');
        const barcodeInput = document.getElementById('barcodeInput');
        const closeBoxBtn = document.getElementById('closeBoxBtn');
        const closeBoxYesBtn = document.getElementById('closeBoxYesBtn');
        const closeBoxCancelBtn = document.getElementById('closeBoxCancelBtn');
        const closeBoxBackBtn = document.getElementById('closeBoxBackBtn');
        const closeBoxScanInput = document.getElementById('closeBoxScanInput');
        const scansTableBody = document.getElementById('scansTableBody');
        const deleteYesBtn = document.getElementById('deleteYesBtn');
        const deleteNoBtn = document.getElementById('deleteNoBtn');
        const downloadBtn = document.getElementById('downloadBtn');
        const resetSessionBtn = document.getElementById('resetSessionBtn');
        const resetYesBtn = document.getElementById('resetYesBtn');
        const resetNoBtn = document.getElementById('resetNoBtn');
        const openScannerSettingsBtn = document.getElementById('openScannerSettingsBtn');
        const closeSettingsBtn = document.getElementById('closeSettingsBtn');
        const adminResetBtn = document.getElementById('adminResetBtn');

        if (langEnBtn) langEnBtn.addEventListener('click', () => setScannerLanguage('en'));
        if (langArBtn) langArBtn.addEventListener('click', () => setScannerLanguage('ar'));
        if (settingsLangEnBtn) settingsLangEnBtn.addEventListener('click', () => setScannerLanguage('en'));
        if (settingsLangArBtn) settingsLangArBtn.addEventListener('click', () => setScannerLanguage('ar'));
        if (startSessionBtn) startSessionBtn.addEventListener('click', startScannerSession);
        if (boxIdInput) boxIdInput.addEventListener('keypress', handleBoxIdScan);
        if (barcodeInput) barcodeInput.addEventListener('keypress', handleBarcodeScan);
        if (closeBoxBtn) closeBoxBtn.addEventListener('click', showCloseBoxModal);
        if (closeBoxYesBtn) closeBoxYesBtn.addEventListener('click', closeBoxProceedToScan);
        if (closeBoxCancelBtn) closeBoxCancelBtn.addEventListener('click', cancelCloseBox);
        if (closeBoxBackBtn) closeBoxBackBtn.addEventListener('click', cancelCloseBox);
        if (closeBoxScanInput) closeBoxScanInput.addEventListener('keypress', handleCloseBoxScan);
        if (scansTableBody) {
            scansTableBody.addEventListener('click', (e) => {
                if (e.target.classList.contains('delete-scan-btn')) {
                    showDeleteModal(parseInt(e.target.dataset.id), e.target.dataset.barcode);
                }
            });
        }
        if (deleteYesBtn) deleteYesBtn.addEventListener('click', () => executeDeleteScan(true));
        if (deleteNoBtn) deleteNoBtn.addEventListener('click', () => executeDeleteScan(false));
        if (downloadBtn) downloadBtn.addEventListener('click', downloadScannerExcel);
        if (resetSessionBtn) resetSessionBtn.addEventListener('click', showResetModal);
        if (resetYesBtn) resetYesBtn.addEventListener('click', () => executeResetSession(true));
        if (resetNoBtn) resetNoBtn.addEventListener('click', () => executeResetSession(false));
        if (openScannerSettingsBtn) {
            openScannerSettingsBtn.addEventListener('click', (e) => { 
                e.preventDefault(); 
                openScannerSettings(); 
            });
        }
        if (closeSettingsBtn) closeSettingsBtn.addEventListener('click', closeScannerSettings);
        if (adminResetBtn) adminResetBtn.addEventListener('click', executeAdminReset);
    }, 100);
}

// ============================================
// BOX SCANNER - INITIALIZATION
// ============================================
async function initBoxScanner() {
    await initScannerDB();
    setupScannerEventListeners();
    const hasSession = loadScannerSession();
    applyScannerTranslations();
    
    if (hasSession && ScannerState.staffName && ScannerState.purpose && ScannerState.remark) {
        document.getElementById('dispScannerStore').textContent = `${AppState.storeId} - ${AppState.storeName}`;
        document.getElementById('dispScannerStaff').textContent = ScannerState.staffName;
        setActiveSession('boxScanner', true);
        if (ScannerState.boxScanning && ScannerState.currentBox) {
            document.getElementById('boxIdGroup').classList.add('hidden');
            document.getElementById('barcodeGroup').classList.remove('hidden');
            document.getElementById('closeBoxBtn').classList.add('show');
            document.getElementById('closeBoxBtnId').textContent = ScannerState.currentBox;
        }
        showScannerScreen('scannerScanScreen');
        if (ScannerState.boxScanning) {
            document.getElementById('barcodeInput').focus();
        } else {
            document.getElementById('boxIdInput').focus();
        }
        await loadAndDisplayScans();
    } else {
        showScannerScreen('scannerSessionScreen');
    }
    
    setInterval(async () => {
        if (AppState.isOnline && ScannerState.staffName) await autoSyncScans();
    }, 10000);
}