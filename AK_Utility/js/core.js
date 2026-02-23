// ============================================
// CONFIGURATION
// ============================================
const CONFIG = {
    GOOGLE_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbzOc6X_mxeknOoSppEelhR555OvJwKBShfUYxwmEzme-nuSlV3pSekTD_YbXUL2Smz9Rg/exec',
    ADMIN_CODE: 'AK@2026',
    STORAGE_PREFIX: 'aku_'
};

// ============================================
// APP REGISTRY
// ============================================
const APPS = [
    { 
        id: 'boxScanner', 
        name: 'Box Scanner', 
        icon: '📦', 
        description: 'Scan items into boxes', 
        sessionRequired: true,
        cssFile: 'boxScannerCSS',
        jsInit: 'initBoxScanner',
        htmlFile: 'box-scanner.html'
    },
    { 
        id: 'itemBarcode', 
        name: 'Item Barcode', 
        icon: '🏷️', 
        description: 'Print item labels', 
        sessionRequired: false,
        cssFile: 'itemBarcodeCSS',
        jsInit: 'initItemBarcode',
        htmlFile: 'item-barcode.html'
    },
    { 
        id: 'boxCode', 
        name: 'Box Code', 
        icon: '📤', 
        description: 'Generate box labels', 
        sessionRequired: false,
        cssFile: 'boxCodeCSS',
        jsInit: 'initBoxCode',
        htmlFile: 'box-code.html'
    },
    { 
        id: 'photoCapture', 
        name: 'Photo Capture', 
        icon: '📷', 
        description: 'Capture product photos', 
        sessionRequired: false,
        cssFile: 'photoCaptureCSS',
        jsInit: 'initPhotoCapture',
        htmlFile: 'photo-capture.html'
    }
];

// ============================================
// GLOBAL STATE
// ============================================
const AppState = {
    storeId: '',
    storeName: '',
    storeLocation: '',
    currentApp: null,
    currentScreen: 'loginScreen',
    hasActiveSession: false,
    activeSessionApp: null,
    isOnline: navigator.onLine
};

// ============================================
// STORAGE HELPERS
// ============================================
const Storage = {
    get(key) { return localStorage.getItem(CONFIG.STORAGE_PREFIX + key); },
    set(key, value) { localStorage.setItem(CONFIG.STORAGE_PREFIX + key, value); },
    remove(key) { localStorage.removeItem(CONFIG.STORAGE_PREFIX + key); },
    getJSON(key) {
        const val = this.get(key);
        if (!val) return null;
        try { return JSON.parse(val); } catch (e) { return null; }
    },
    setJSON(key, value) { this.set(key, JSON.stringify(value)); }
};

// ============================================
// ONLINE STATUS
// ============================================
function updateOnlineStatus() {
    AppState.isOnline = navigator.onLine;
    const el = document.getElementById('onlineStatus');
    if (AppState.isOnline) {
        el.textContent = 'Online';
        el.className = 'online-status online';
    } else {
        el.textContent = 'Offline';
        el.className = 'online-status offline';
    }
}

window.addEventListener('online', updateOnlineStatus);
window.addEventListener('offline', updateOnlineStatus);

// ============================================
// SCREEN NAVIGATION
// ============================================
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
    AppState.currentScreen = screenId;
}

// ============================================
// GOOGLE SHEETS API
// ============================================
async function fetchFromGoogleSheets(action, params = {}) {
    if (!AppState.isOnline) return null;
    try {
        const url = new URL(CONFIG.GOOGLE_SCRIPT_URL);
        url.searchParams.append('action', action);
        Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));
        const response = await fetch(url.toString());
        return await response.json();
    } catch (e) {
        console.error('Google Sheets fetch error:', e);
        return null;
    }
}

async function postToGoogleSheets(action, data) {
    if (!AppState.isOnline) return null;
    try {
        const response = await fetch(CONFIG.GOOGLE_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...data })
        });
        return { success: true };
    } catch (e) {
        console.error('Google Sheets post error:', e);
        return null;
    }
}

// ============================================
// STORE LOGIN
// ============================================
async function lookupStore() {
    const input = document.getElementById('storeIdInput');
    const errorDiv = document.getElementById('loginError');
    const btn = document.getElementById('lookupStoreBtn');
    const btnText = document.getElementById('lookupBtnText');
    
    const storeId = input.value.trim().toUpperCase();
    if (!storeId) {
        showError(errorDiv, 'Please enter a Store ID');
        return;
    }
    
    btn.disabled = true;
    btnText.innerHTML = '<span class="spinner"></span> Looking up...';
    errorDiv.classList.remove('show');
    
    const result = await fetchFromGoogleSheets('getStore', { storeId });
    
    btn.disabled = false;
    btnText.textContent = 'Search Your Store';
    
    if (result && result.success && result.store) {
        AppState.storeId = result.store.storeId;
        AppState.storeName = result.store.storeName;
        AppState.storeLocation = result.store.location;
        
        document.getElementById('confirmStoreId').textContent = result.store.storeId;
        document.getElementById('confirmStoreName').textContent = result.store.storeName;
        document.getElementById('confirmLocation').textContent = result.store.location;
        
        document.getElementById('storeConfirmBox').style.display = 'block';
        btn.style.display = 'none';
    } else {
        showError(errorDiv, 'Store not found. Please check the Store ID.');
    }
}

function confirmStore(confirmed) {
    if (confirmed) {
        Storage.set('store_id', AppState.storeId);
        Storage.set('store_name', AppState.storeName);
        Storage.set('store_location', AppState.storeLocation);
        updateHeaderStore();
        showScreen('homeScreen');
        renderAppGrid();
    } else {
        document.getElementById('storeIdInput').value = '';
        document.getElementById('storeConfirmBox').style.display = 'none';
        document.getElementById('lookupStoreBtn').style.display = 'block';
        AppState.storeId = '';
        AppState.storeName = '';
        AppState.storeLocation = '';
    }
}

function showError(element, message) {
    element.textContent = message;
    element.classList.add('show');
}

function updateHeaderStore() {
    const el = document.getElementById('headerStore');
    if (AppState.storeId) {
        el.textContent = AppState.storeId;
        el.classList.add('show');
    } else {
        el.classList.remove('show');
    }
}

// ============================================
// HOME SCREEN
// ============================================
function renderAppGrid() {
    const grid = document.getElementById('appGrid');
    grid.innerHTML = '';
    
    APPS.forEach(app => {
        const tile = document.createElement('div');
        tile.className = 'app-tile';
        tile.dataset.appId = app.id;
        
        const isLocked = AppState.hasActiveSession && AppState.activeSessionApp !== app.id && app.sessionRequired;
        if (isLocked) tile.classList.add('locked');
        
        tile.innerHTML = `
            <span class="app-tile-icon">${app.icon}</span>
            <span class="app-tile-name">${app.name}</span>
            <span class="app-tile-lock">🔒</span>
        `;
        
        tile.addEventListener('click', () => { if (!isLocked) openApp(app.id); });
        grid.appendChild(tile);
    });
    
    updateSessionBanner();
}

function updateSessionBanner() {
    const banner = document.getElementById('sessionBanner');
    banner.classList.toggle('show', AppState.hasActiveSession);
}

// ============================================
// APP NAVIGATION
// ============================================
async function openApp(appId) {
    const app = APPS.find(a => a.id === appId);
    if (!app) return;
    
    AppState.currentApp = appId;
    document.getElementById('appTitleText').innerHTML = `${app.icon} ${app.name}`;
    document.getElementById('appSubtitleText').textContent = app.description;
    
    APPS.forEach(a => {
        const cssEl = document.getElementById(a.cssFile);
        if (cssEl) cssEl.disabled = (a.id !== appId);
    });
    
    await loadAppModule(app);
    
    updateBackButton();
    showScreen('appScreen');
    
    if (window[app.jsInit]) {
        window[app.jsInit]();
    }
}

async function loadAppModule(app) {
    const container = document.getElementById('appModuleContainer');
    try {
        const response = await fetch(`modules/${app.htmlFile}`);
        const html = await response.text();
        container.innerHTML = html;
    } catch (error) {
        console.error('Failed to load module:', error);
        container.innerHTML = `<div class="card"><p style="color: var(--ak-danger);">Failed to load ${app.name} module.</p></div>`;
    }
}

function updateBackButton() {
    const btn = document.getElementById('appBackBtn');
    const app = APPS.find(a => a.id === AppState.currentApp);
    
    if (app && app.sessionRequired && AppState.hasActiveSession) {
        btn.classList.add('disabled');
        btn.title = 'Complete or reset session to go back';
    } else {
        btn.classList.remove('disabled');
        btn.title = 'Back to Home';
    }
}

function goToHome() {
    const app = APPS.find(a => a.id === AppState.currentApp);
    if (app && app.sessionRequired && AppState.hasActiveSession) return;
    
    AppState.currentApp = null;
    showScreen('homeScreen');
    renderAppGrid();
}

// ============================================
// SESSION MANAGEMENT
// ============================================
function setActiveSession(appId, active) {
    AppState.hasActiveSession = active;
    AppState.activeSessionApp = active ? appId : null;
    if (active) {
        Storage.set('active_session', appId);
    } else {
        Storage.remove('active_session');
    }
    updateBackButton();
    renderAppGrid();
}

function checkExistingSession() {
    const activeSession = Storage.get('active_session');
    if (activeSession) {
        AppState.hasActiveSession = true;
        AppState.activeSessionApp = activeSession;
    }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================
// EVENT LISTENERS
// ============================================
function setupEventListeners() {
    document.getElementById('storeIdInput').addEventListener('keypress', (e) => { 
        if (e.key === 'Enter') lookupStore(); 
    });
    document.getElementById('lookupStoreBtn').addEventListener('click', lookupStore);
    document.getElementById('confirmYesBtn').addEventListener('click', () => confirmStore(true));
    document.getElementById('confirmNoBtn').addEventListener('click', () => confirmStore(false));
    document.getElementById('appBackBtn').addEventListener('click', goToHome);
    document.getElementById('goToSessionBtn').addEventListener('click', () => { 
        if (AppState.activeSessionApp) openApp(AppState.activeSessionApp); 
    });
}

// ============================================
// INITIALIZATION
// ============================================
async function initApp() {
    updateOnlineStatus();
    setupEventListeners();
    
    const storedStoreId = Storage.get('store_id');
    if (storedStoreId) {
        AppState.storeId = storedStoreId;
        AppState.storeName = Storage.get('store_name') || '';
        AppState.storeLocation = Storage.get('store_location') || '';
        updateHeaderStore();
        checkExistingSession();
        showScreen('homeScreen');
        renderAppGrid();
    } else {
        showScreen('loginScreen');
    }
}

document.addEventListener('DOMContentLoaded', initApp);