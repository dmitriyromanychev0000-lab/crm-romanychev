const DB_NAME = "crm-romanychev";
const DB_VERSION = 1;
const STORE = "keyval";
const DATA_KEY = "crm-data";
const DIRECTORY_KEY = "backup-directory";
const PRE_IMPORT_KEY = "crm-pre-import-data";
const BACKUP_TEST_KEY = "crm-backup-self-test";
const DIAGNOSTIC_KEY = "crm-diagnostic-test";
const APP_VERSION = "1.0.0";
const APP_BUILD = "2026.09.27.170";
const APP_URL = "https://dmitriyromanychev0000-lab.github.io/crm-romanychev/";
const APP_RELEASE = "Общая мобильная оболочка доведена: шапка без жёсткой разделительной линии, нижняя навигация с ровной геометрией и отдельным цветовым активным состоянием каждой вкладки";
const BACKUP_FORMAT_VERSION = 18;

const defaultData = () => ({
  version: BACKUP_FORMAT_VERSION,
  date: new Date().toISOString(),
  orders: [],
  warehouse: [],
  warehouse_movements: [],
  expenses: [],
  incomes: [],
  service_custom: [],
  receipts: [],
  receipt_prices: [],
  tools: [],
  goods_sheets: [],
  draft: [],
  order_sources: [
    { id: "source-avito", name: "Авито", archived: false },
    { id: "source-word-of-mouth", name: "Сарафанное радио", archived: false }
  ],
  client_profiles: [],
  warranty_options: [],
  settings: {
    autoBackup: false,
    autoBackupDays: 1,
    lastBackupAt: null,
    catalogApplyWithoutFit: false,
    stockReservationModel: 1,
    searchMasterComment: false,
    companyName: "CRM by Romanychev",
    name: "",
    phone: ""
  }
});

const UI_STATE_KEY = "crm-ui-state";

function readUiState() {
  try {
    const saved = JSON.parse(localStorage.getItem(UI_STATE_KEY) || "{}");
    return saved && typeof saved === "object" ? saved : {};
  } catch {
    return {};
  }
}

const initialUiState = readUiState();
let data = defaultData();
let activePage = ["orders", "warehouse", "analytics", "more"].includes(initialUiState.activePage) ? initialUiState.activePage : "orders";
let orderFilter = ["all", "closed", "active", "declined", "archived"].includes(initialUiState.orderFilter) ? initialUiState.orderFilter : "all";
let orderVisitFilter = ["all", "today", "upcoming", "overdue"].includes(String(initialUiState.orderVisitFilter)) ? String(initialUiState.orderVisitFilter) : "all";
let searchQuery = typeof initialUiState.searchQuery === "string" ? initialUiState.searchQuery : "";
let warehouseSearch = typeof initialUiState.warehouseSearch === "string" ? initialUiState.warehouseSearch : "";
let warehouseFilter = ["active", "low", "all"].includes(String(initialUiState.warehouseFilter)) ? String(initialUiState.warehouseFilter) : "active";
let warehouseSection = ["list", "movements", "shopping"].includes(String(initialUiState.warehouseSection)) ? String(initialUiState.warehouseSection) : "list";
let warehouseMovementFilter = ["all", "in", "out"].includes(String(initialUiState.warehouseMovementFilter)) ? String(initialUiState.warehouseMovementFilter) : "all";
let clientSearch = typeof initialUiState.clientSearch === "string" ? initialUiState.clientSearch : "";
let priceSearch = typeof initialUiState.priceSearch === "string" ? initialUiState.priceSearch : "";
let priceTechFilter = typeof initialUiState.priceTechFilter === "string" ? initialUiState.priceTechFilter : "all";
let priceKindFilter = ["all", "service", "material", "custom"].includes(String(initialUiState.priceKindFilter)) ? String(initialUiState.priceKindFilter) : "all";
let analyticsPeriod = ["today", "7", "30", "365", "all", "custom"].includes(String(initialUiState.analyticsPeriod)) ? String(initialUiState.analyticsPeriod) : "30";
let analyticsOffset = Number.isInteger(Number(initialUiState.analyticsOffset)) ? Number(initialUiState.analyticsOffset) : 0;
let analyticsCustomStart = typeof initialUiState.analyticsCustomStart === "string" ? initialUiState.analyticsCustomStart : "";
let analyticsCustomEnd = typeof initialUiState.analyticsCustomEnd === "string" ? initialUiState.analyticsCustomEnd : "";
let financePeriod = ["all", "30", "90", "365"].includes(String(initialUiState.financePeriod)) ? String(initialUiState.financePeriod) : "all";
let moreSection = typeof initialUiState.moreSection === "string" ? initialUiState.moreSection : "menu";
let moreReturnSection = typeof initialUiState.moreReturnSection === "string" ? initialUiState.moreReturnSection : "menu";
let selectedActOrderId = initialUiState.selectedActOrderId || null;
let calendarMonthOffset = Number.isInteger(Number(initialUiState.calendarMonthOffset)) ? Number(initialUiState.calendarMonthOffset) : 0;
let calendarSelectedDate = typeof initialUiState.calendarSelectedDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(initialUiState.calendarSelectedDate)
  ? initialUiState.calendarSelectedDate
  : localDateInputValue();
let restoreScrollY = Number(initialUiState.scrollY) || 0;

function saveUiState(extra = {}) {
  try {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify({
      activePage,
      orderFilter,
      orderVisitFilter,
      searchQuery,
      warehouseSearch,
      warehouseFilter,
      warehouseSection,
      warehouseMovementFilter,
      clientSearch,
      priceSearch,
      priceTechFilter,
      priceKindFilter,
      analyticsPeriod,
      analyticsOffset,
      analyticsCustomStart,
      analyticsCustomEnd,
      financePeriod,
      moreSection,
      moreReturnSection,
      selectedActOrderId,
      calendarMonthOffset,
      calendarSelectedDate,
      scrollY: window.scrollY,
      ...extra
    }));
  } catch {}
}

const app = document.querySelector("#app");
const fileInput = document.querySelector("#backup-file");
const toastElement = document.querySelector("#toast");

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) request.result.createObjectStore(STORE);
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbGet(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function dbSet(key, value) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbDelete(key) {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const ICONS = {
  logo: '<path d="m12 2 8.5 5v10L12 22 3.5 17V7Z"/><path d="M16 7.2a3.5 3.5 0 0 0-4.9 4.9L7 16.2 8.8 18l4.1-4.1a3.5 3.5 0 0 0 4.9-4.9l-2.2 2.2-2.4-2.4Z"/><circle cx="8.2" cy="16.8" r=".7" fill="currentColor" stroke="none"/>',
  orders: '<rect x="4" y="4" width="16" height="17" rx="2.4"/><path d="M9 4.5V3h6v1.5M8 9h8M8 13h8M8 17h5"/>',
  warehouse: '<path d="m4 9 8-5 8 5v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M4 9h16M9 21v-7h6v7"/>',
  analytics: '<path d="M4 19V5M4 19h16"/><path d="m7 15 4-4 3 2 5-6"/>',
  more: '<circle cx="5" cy="12" r="1.65" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.65" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.65" fill="currentColor" stroke="none"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  minus: '<path d="M5 12h14"/>',
  back: '<path d="m15 18-6-6 6-6"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  backup: '<path d="M12 3v12M8 11l4 4 4-4"/><path d="M5 21h14a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2"/>',
  price: '<path d="M20 13 13 20a2 2 0 0 1-3 0l-6-6a2 2 0 0 1 0-3l7-7h7a2 2 0 0 1 2 2Z"/><circle cx="15.5" cy="8.5" r="1.2"/>',
  clients: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/>',
  finance: '<path d="M4 7h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h14"/><path d="M16 13h6"/><circle cx="17" cy="13" r="1"/>',
  goods: '<path d="m3 7 9-4 9 4-9 4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  tools: '<path d="M14.7 6.3a5 5 0 0 0-6.9 6.9L3.5 17.5a2.1 2.1 0 0 0 3 3l4.3-4.3a5 5 0 0 0 6.9-6.9l-3.1 3.1-3-3 3.1-3.1Z"/>',
  receipt: '<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  drafts: '<path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-9"/><path d="m13 13 7-7 2 2-7 7-3 1Z"/>',
  act: '<path d="M6 3h9l4 4v14H6Z"/><path d="M15 3v5h5M9 14l2 2 4-4"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z"/>',
  edit: '<path d="M12 20h9"/><path d="m16.5 3.5 4 4L8 20l-5 1 1-5Z"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  reopen: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  copy: '<rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/>',
  document: '<path d="M6 3h9l4 4v14H6Z"/><path d="M15 3v5h5M9 13h6M9 17h4"/>',
  archive: '<path d="M4 7h16v14H4Z"/><path d="M3 3h18v4H3ZM9 12h6"/>',
  restore: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>',
  refresh: '<path d="M20 7v5h-5"/><path d="M4 17v-5h5"/><path d="M6.1 8.2A7 7 0 0 1 18.4 6L20 8M4 16l1.6 2A7 7 0 0 0 18 15.8"/>',
  eye: '<path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  folder: '<path d="M3 7h7l2 2h9v10H3z"/><path d="M3 7V5h7l2 2"/>',
  phone: '<path d="M6.6 2.8 9 7.6 6.8 9a15 15 0 0 0 8.2 8.2l1.4-2.2 4.8 2.4v3a2 2 0 0 1-2 2C9.5 22.4 1.6 14.5 1.6 4.8a2 2 0 0 1 2-2Z"/>',
  appliance: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 8h14M9 5h.01M13 5h.01"/><circle cx="12" cy="15" r="4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  warning: '<path d="M12 3 2.5 20h19Z"/><path d="M12 9v5M12 17h.01"/>',
  chart: '<path d="M4.5 19V5M4.5 19h15.5"/><path d="M8.5 16v-4M13.5 16V9M18.5 16V6"/>',
  camera: '<path d="M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v10H2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/>',
  location: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  shield: '<path d="M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
  telegram: '<path d="m21 4-4 16-6-5-4 3 1-5 9-6-11 5-4-2Z"/><path d="m8 13 9-6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/>',
  washer: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M4 8h16M8 5h.01M12 5h.01"/><circle cx="12" cy="15" r="4.5"/>',
  fridge: '<rect x="6" y="2" width="12" height="20" rx="2"/><path d="M6 10h12M15 6v2M15 13v2"/>',
  dishwasher: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M4 8h16M8 5h.01M12 5h.01"/><path d="M8 14c1 2 7 2 8 0"/>',
  oven: '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M4 8h16M8 5h.01M12 5h.01M16 5h.01"/><rect x="7" y="11" width="10" height="7" rx="1"/>',
  history: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
  shopping: '<path d="M8 6h13l-2 8H9L7 3H3"/><circle cx="10" cy="19" r="1.5"/><circle cx="18" cy="19" r="1.5"/>',
  box: '<path d="m3 7 9-4 9 4-9 4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/>',
  gem: '<path d="M4 8 8 3h8l4 5-8 13Z"/><path d="m4 8 8 5 8-5M8 3l4 10 4-10"/>',
  shoppingList: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.2" fill="currentColor" stroke="none"/>',
  printer: '<path d="M6 9V3h12v6"/><rect x="5" y="14" width="14" height="7" rx="1"/><path d="M5 17H3a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h18a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2M17 12h.01"/>',
  tag: '<path d="M20 13 13 20a2 2 0 0 1-3 0l-6-6a2 2 0 0 1 0-3l7-7h7a2 2 0 0 1 2 2Z"/><circle cx="15.5" cy="8.5" r="1.2"/><path d="m10 12 4 4"/>'
};

function icon(name, className = "") {
  const body = ICONS[name] || ICONS.document;
  return `<svg class="ui-icon ${escapeHtml(className)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

const money = (value) => `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number(value) || 0)} ₽`;

function localDateInputValue(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function localDateTimeInputValue(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return String(value).slice(0, 16);
  const datePart = localDateInputValue(date);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${datePart}T${hours}:${minutes}`;
}

const shortDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat("ru-RU").format(date);
};

const withinPeriod = (value, period) => {
  if (period === "all") return true;
  const time = new Date(value || 0).getTime();
  if (!Number.isFinite(time)) return false;
  return time >= Date.now() - Number(period) * 86400000;
};

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value.includes("закры")) return "closed";
  if (value.includes("отказ")) return "declined";
  return "active";
};

function syncOrderCompletion(next, previous = null) {
  const nextStatus = normalizeStatus(next.status);
  const previousStatus = previous ? normalizeStatus(previous.status) : null;
  const isFinished = nextStatus === "closed" || nextStatus === "declined";
  const wasFinished = previousStatus === "closed" || previousStatus === "declined";
  if (!isFinished) {
    next.completed = null;
  } else if (!wasFinished) {
    next.completed = new Date().toISOString();
  } else {
    next.completed = previous?.completed || null;
  }
  return next;
}

function newOrderId() {
  const used = new Set(data.orders.map((item) => String(item.id ?? "")));
  const base = Number(String(Date.now()).slice(-6));
  for (let offset = 0; offset < 1000000; offset += 1) {
    const candidate = String((base + offset) % 1000000).padStart(6, "0");
    if (!used.has(candidate)) return candidate;
  }
  return crypto.randomUUID();
}

function toast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("show");
  clearTimeout(toastElement.timer);
  toastElement.timer = setTimeout(() => toastElement.classList.remove("show"), 2800);
}

function confirmDialog(message, options = {}) {
  const destructive = options.danger ?? /удал/i.test(String(message || ""));
  const title = options.title || (destructive ? "Подтвердить удаление" : "Подтверждение");
  const confirmLabel = options.confirmLabel || (destructive ? "Удалить" : "Продолжить");

  return new Promise((resolve) => {
    const modal = document.createElement("div");
    modal.className = "modal-backdrop crm-confirm-backdrop";
    modal.innerHTML = `<section class="crm-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="crm-confirm-title">
      <div class="crm-confirm-icon ${destructive ? "danger" : ""}">${icon(destructive ? "trash" : "warning")}</div>
      <h2 id="crm-confirm-title">${escapeHtml(title)}</h2>
      <p>${escapeHtml(String(message || "")).replaceAll("\n", "<br>")}</p>
      <div class="crm-confirm-actions">
        <button type="button" class="legacy-dark-button" data-confirm-cancel>Отмена</button>
        <button type="button" class="${destructive ? "crm-confirm-danger" : "legacy-orange-button"}" data-confirm-primary>${escapeHtml(confirmLabel)}</button>
      </div>
    </section>`;

    const finish = (value) => {
      if (!modal.isConnected) return;
      modal.remove();
      syncModalScrollLock();
      resolve(value);
    };

    modal.querySelector("[data-confirm-cancel]").addEventListener("click", () => finish(false));
    modal.querySelector("[data-confirm-primary]").addEventListener("click", () => finish(true));
    modal.addEventListener("click", (event) => {
      if (event.target === modal) finish(false);
    });

    document.body.appendChild(modal);
    requestAnimationFrame(() => modal.querySelector("[data-confirm-primary]")?.focus());
  });
}

function validateBackup(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("Файл не содержит объект CRM");
  const required = ["orders", "warehouse", "warehouse_movements", "expenses", "receipt_prices"];
  for (const key of required) {
    if (!Array.isArray(candidate[key])) throw new Error(`В бэкапе отсутствует или повреждён раздел ${key}`);
  }
  const optionalArrays = ["incomes", "service_custom", "receipts", "tools", "goods_sheets", "order_sources", "client_profiles", "warranty_options"];
  for (const key of optionalArrays) {
    if (key in candidate && !Array.isArray(candidate[key])) throw new Error(`Раздел ${key} имеет неверный формат`);
  }
  if (!candidate.settings || typeof candidate.settings !== "object" || Array.isArray(candidate.settings)) candidate.settings = {};
  const migratedSettings = { ...defaultData().settings, ...candidate.settings };
  if (!Object.prototype.hasOwnProperty.call(candidate.settings, "stockReservationModel")) {
    migratedSettings.stockReservationModel = 0;
  }
  if (!Object.prototype.hasOwnProperty.call(candidate.settings, "catalogApplyWithoutFit")
      && Object.prototype.hasOwnProperty.call(candidate.settings, "autoPriceAdjust")) {
    migratedSettings.catalogApplyWithoutFit = !Boolean(candidate.settings.autoPriceAdjust);
  }
  return {
    ...defaultData(),
    ...candidate,
    settings: migratedSettings
  };
}

function ensureOrderIds() {
  let changed = false;
  const used = new Set((Array.isArray(data.orders) ? data.orders : [])
    .map((item) => String(item?.id ?? "").trim())
    .filter(Boolean));
  let seed = Number(String(Date.now()).slice(-6));
  (Array.isArray(data.orders) ? data.orders : []).forEach((order) => {
    if (String(order?.id ?? "").trim()) return;
    let attempts = 0;
    let candidate = "";
    do {
      candidate = String((seed + attempts) % 1000000).padStart(6, "0");
      attempts += 1;
    } while (used.has(candidate) && attempts < 1000000);
    if (!candidate || used.has(candidate)) candidate = crypto.randomUUID();
    order.id = candidate;
    used.add(String(candidate));
    seed = (seed + attempts) % 1000000;
    changed = true;
  });
  return changed;
}

function ensureGoodsSheetIds() {
  let changed = false;
  (Array.isArray(data.goods_sheets) ? data.goods_sheets : []).forEach((sheet) => {
    if (String(sheet?.id || "").trim()) return;
    sheet.id = crypto.randomUUID();
    changed = true;
  });
  return changed;
}

function ensureOrderSourceIds() {
  let changed = false;
  (Array.isArray(data.order_sources) ? data.order_sources : []).forEach((source) => {
    if (String(source?.id || "").trim()) return;
    source.id = crypto.randomUUID();
    changed = true;
  });
  return changed;
}

function ensureClientProfileIds() {
  let changed = false;
  (Array.isArray(data.client_profiles) ? data.client_profiles : []).forEach((profile) => {
    if (String(profile?.id || "").trim()) return;
    profile.id = crypto.randomUUID();
    changed = true;
  });
  return changed;
}

const BASE_APPLIANCE_TYPES = [
  "Холодильник",
  "Коммерческое холод. оборудование",
  "Стиральная машина",
  "Посудомоечная машина",
  "Сушильная машина",
  "Плита / духовка",
  "Кондиционер",
  "Водонагреватель",
  "Мелкая бытовая техника",
  "Другое"
];

function applianceTypes() {
  return [...new Set([
    ...BASE_APPLIANCE_TYPES,
    ...(data.orders || []).map((order) => String(order.tech || "").trim()),
    ...(data.receipt_prices || []).map((item) => String(item.tech || "").trim()),
    ...(data.warranty_options || []).map((item) => String(item.tech || "").trim())
  ].filter(Boolean))];
}

function ensureWarrantyOptionIds() {
  let changed = false;
  (Array.isArray(data.warranty_options) ? data.warranty_options : []).forEach((option) => {
    if (String(option?.id || "").trim()) return;
    option.id = crypto.randomUUID();
    changed = true;
  });
  return changed;
}

function warrantyOptionsForTech(tech, { includeArchived = false } = {}) {
  const currentTech = String(tech || "").trim();
  return (Array.isArray(data.warranty_options) ? data.warranty_options : [])
    .filter((option) => String(option.tech || "").trim() === currentTech)
    .filter((option) => includeArchived || !option.archived)
    .sort((a, b) => Number(Boolean(a.archived)) - Number(Boolean(b.archived))
      || String(a.name || "").localeCompare(String(b.name || ""), "ru"));
}

function normalizeWarrantyTargets(order = {}) {
  return (Array.isArray(order.guaranteeTargets) ? order.guaranteeTargets : [])
    .map((target) => typeof target === "string"
      ? { id: "", name: target, tech: order.tech || "" }
      : {
          id: String(target?.id || ""),
          name: String(target?.name || "").trim(),
          tech: String(target?.tech || order.tech || "").trim()
        })
    .filter((target) => target.name);
}

function activeOrderSources() {
  return (Array.isArray(data.order_sources) ? data.order_sources : [])
    .filter((source) => !source.archived && String(source.name || "").trim())
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ru"));
}

function orderSourceName(order = {}) {
  const source = (Array.isArray(data.order_sources) ? data.order_sources : [])
    .find((item) => String(item.id) === String(order.sourceId || ""));
  return source?.name || order.sourceName || "";
}

function clientProfileByPhone(phone) {
  const normalized = normalizeRussianPhone(phone || "");
  if (!normalized) return null;
  return (Array.isArray(data.client_profiles) ? data.client_profiles : [])
    .find((profile) => normalizeRussianPhone(profile.phone || "") === normalized) || null;
}

function latestOrderByPhone(phone, { excludeOrderId = null } = {}) {
  const normalized = normalizeRussianPhone(phone || "");
  if (!normalized) return null;
  return [...(Array.isArray(data.orders) ? data.orders : [])]
    .filter((order) => !order.archived
      && normalizeRussianPhone(order.phone || "") === normalized
      && (excludeOrderId === null || String(order.id) !== String(excludeOrderId)))
    .sort((a, b) => (orderCreatedTimestamp(b) || 0) - (orderCreatedTimestamp(a) || 0))[0] || null;
}

function syncClientProfileFromOrder(order) {
  const phone = normalizeRussianPhone(order?.phone || "");
  if (!phone) return null;
  let profile = clientProfileByPhone(phone);
  if (!profile) {
    profile = { id: crypto.randomUUID(), phone, name: "", note: "", lastAddress: "", updatedAt: null };
    data.client_profiles.push(profile);
  }
  if (String(order.name || "").trim()) profile.name = String(order.name).trim();
  if (String(order.address || "").trim()) profile.lastAddress = String(order.address).trim();
  profile.phone = phone;
  profile.updatedAt = new Date().toISOString();
  return profile;
}

function visitDateParts(order = {}) {
  let date = String(order.nextVisitDate || "").slice(0, 10);
  let time = String(order.nextVisitTime || "").slice(0, 5);
  if (!date && order.nextVisit) {
    const raw = String(order.nextVisit);
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) date = raw.slice(0, 10);
    if (!time && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) && order.nextVisitTime !== "") {
      time = raw.slice(11, 16);
    }
  }
  return { date, time, duration: Math.max(15, Number(order.nextVisitDuration) || 60) };
}

function visitSortTimestamp(order = {}) {
  const { date, time } = visitDateParts(order);
  if (!date) return NaN;
  const value = new Date(`${date}T${time || "12:00"}:00`).getTime();
  return Number.isFinite(value) ? value : NaN;
}

function visitIsOverdue(order = {}) {
  const { date, time } = visitDateParts(order);
  if (!date || normalizeStatus(order.status) !== "active") return false;
  const today = localDateInputValue();
  if (date < today) return true;
  if (date > today || !time) return false;
  return new Date(`${date}T${time}:00`).getTime() < Date.now();
}

function formatOrderVisit(order = {}) {
  const { date, time, duration } = visitDateParts(order);
  if (!date) return "";
  const dateText = new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "2-digit", year: "numeric" })
    .format(new Date(`${date}T12:00:00`));
  return time ? `${dateText} · ${time} · ${duration} мин.` : `${dateText} · без времени`;
}

function yandexMapsUrl(address) {
  const value = String(address || "").trim();
  return value ? `https://yandex.ru/maps/?text=${encodeURIComponent(value)}` : "";
}

function visitInterval(order = {}) {
  const { date, time, duration } = visitDateParts(order);
  if (!date || !time) return null;
  const start = new Date(`${date}T${time}:00`).getTime();
  if (!Number.isFinite(start)) return null;
  return { start, end: start + Math.max(15, Number(duration) || 60) * 60000 };
}

function findVisitOverlap(order = {}) {
  if (normalizeStatus(order.status) !== "active") return null;
  const interval = visitInterval(order);
  if (!interval) return null;
  return (data.orders || []).find((other) => {
    if (other.archived || String(other.id) === String(order.id)) return false;
    if (normalizeStatus(other.status) !== "active") return false;
    const otherInterval = visitInterval(other);
    if (!otherInterval) return false;
    return interval.start < otherInterval.end && interval.end > otherInterval.start;
  }) || null;
}

function visitTimeRange(order = {}) {
  const { time, duration } = visitDateParts(order);
  if (!time) return "Без времени";
  const [hours, minutes] = time.split(":").map(Number);
  const startMinutes = hours * 60 + minutes;
  const endMinutes = startMinutes + Math.max(15, Number(duration) || 60);
  const endH = String(Math.floor(endMinutes / 60) % 24).padStart(2, "0");
  const endM = String(endMinutes % 60).padStart(2, "0");
  return `${time}–${endH}:${endM}`;
}

function ensureDataIds() {
  let changed = false;
  if (ensureOrderIds()) changed = true;
  if (ensureWarehouseIds()) changed = true;
  if (normalizeWarehouseUnitSettings()) changed = true;
  if (ensureGoodsSheetIds()) changed = true;
  if (ensureOrderSourceIds()) changed = true;
  if (ensureClientProfileIds()) changed = true;
  if (ensureWarrantyOptionIds()) changed = true;
  return changed;
}

const STOCK_UNITS = ["шт", "кг", "г", "л", "мл"];

function normalizeStockUnit(value = "") {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return "шт";
  if (raw === "шт." || raw === "штука" || raw === "штук") return "шт";
  if (raw === "килограмм" || raw === "килограммы") return "кг";
  if (raw === "грамм" || raw === "граммы") return "г";
  if (raw === "литр" || raw === "литры") return "л";
  if (raw === "миллилитр" || raw === "миллилитры") return "мл";
  return raw;
}

function allowedConsumeUnits(storageUnit) {
  const storage = normalizeStockUnit(storageUnit);
  if (storage === "кг") return ["кг", "г"];
  if (storage === "л") return ["л", "мл"];
  if (["шт", "г", "мл"].includes(storage)) return [storage];
  return [storage];
}

function stockQtyToStorage(qty, consumeUnit, storageUnit) {
  const value = Number(qty) || 0;
  const consume = normalizeStockUnit(consumeUnit);
  const storage = normalizeStockUnit(storageUnit);
  if (consume === storage) return value;
  if (storage === "кг" && consume === "г") return value / 1000;
  if (storage === "л" && consume === "мл") return value / 1000;
  return value;
}

function stockQtyFromStorage(qty, storageUnit, consumeUnit) {
  const value = Number(qty) || 0;
  const storage = normalizeStockUnit(storageUnit);
  const consume = normalizeStockUnit(consumeUnit);
  if (consume === storage) return value;
  if (storage === "кг" && consume === "г") return value * 1000;
  if (storage === "л" && consume === "мл") return value * 1000;
  return value;
}

function materialStorageQuantity(material = {}) {
  const warehouseItem = data.warehouse.find((item) => String(item.id) === String(material.warehouseId));
  const storageUnit = normalizeStockUnit(material.storageUnit || warehouseItem?.unit || material.unit || "шт");
  const consumeUnit = normalizeStockUnit(material.unit || warehouseItem?.consumeUnit || storageUnit);
  return stockQtyToStorage(Number(material.qty) || 0, consumeUnit, storageUnit);
}

function normalizeWarehouseUnitSettings() {
  let changed = false;
  (Array.isArray(data.warehouse) ? data.warehouse : []).forEach((item) => {
    const rawUnit = String(item.unit || "шт");
    const normalizedUnit = normalizeStockUnit(rawUnit);
    if (STOCK_UNITS.includes(normalizedUnit) && rawUnit !== normalizedUnit) {
      item.unit = normalizedUnit;
      changed = true;
    }
    const storageUnit = normalizeStockUnit(item.unit || normalizedUnit);
    const currentConsume = normalizeStockUnit(item.consumeUnit || storageUnit);
    const allowed = allowedConsumeUnits(storageUnit);
    const nextConsume = allowed.includes(currentConsume) ? currentConsume : storageUnit;
    if (item.consumeUnit !== nextConsume) {
      item.consumeUnit = nextConsume;
      changed = true;
    }
  });
  return changed;
}

function stockMaterialTotals(materials = []) {
  const result = new Map();
  (Array.isArray(materials) ? materials : []).forEach((material) => {
    if (!material?.warehouseId || !material.writeOff) return;
    const qty = materialStorageQuantity(material);
    if (qty <= 0) return;
    const id = String(material.warehouseId);
    result.set(id, (result.get(id) || 0) + qty);
  });
  return result;
}

function orderReservesStock(order) {
  return Boolean(order) && !order.archived && normalizeStatus(order.status) === "active";
}

function orderConsumesStock(order) {
  if (!order) return false;
  const status = normalizeStatus(order.status);
  return status === "closed" || status === "declined";
}

function stockReservedQuantity(warehouseId, { excludeOrderId = null } = {}) {
  const id = String(warehouseId || "");
  if (!id) return 0;
  return (Array.isArray(data.orders) ? data.orders : []).reduce((sum, order) => {
    if (!orderReservesStock(order)) return sum;
    if (excludeOrderId !== null && String(order.id) === String(excludeOrderId)) return sum;
    return sum + (stockMaterialTotals(order.materials).get(id) || 0);
  }, 0);
}

function stockAvailableQuantity(item, { excludeOrderId = null } = {}) {
  if (!item) return 0;
  const physical = Number(item.quantity) || 0;
  return Math.max(0, physical - stockReservedQuantity(item.id, { excludeOrderId }));
}

function migrateStockReservationModel() {
  if (Number(data.settings?.stockReservationModel) >= 1) return false;
  const restored = new Map();
  (Array.isArray(data.orders) ? data.orders : []).forEach((order) => {
    if (normalizeStatus(order.status) !== "active") return;
    stockMaterialTotals(order.materials).forEach((qty, warehouseId) => {
      restored.set(warehouseId, (restored.get(warehouseId) || 0) + qty);
    });
  });
  restored.forEach((qty, warehouseId) => {
    const item = data.warehouse.find((entry) => String(entry.id) === String(warehouseId));
    if (item) item.quantity = (Number(item.quantity) || 0) + qty;
  });
  data.settings = { ...data.settings, stockReservationModel: 1 };
  return true;
}

function ensureWarehouseIds() {
  let changed = false;
  const used = new Set();
  (Array.isArray(data.warehouse) ? data.warehouse : []).forEach((item) => {
    const current = String(item?.id || "").trim();
    if (current) {
      used.add(current);
      return;
    }
    let next = crypto.randomUUID();
    while (used.has(next)) next = crypto.randomUUID();
    item.id = next;
    used.add(next);
    changed = true;
  });
  return changed;
}

function duplicateIdCount(items = []) {
  const ids = items.map((item) => item?.id).filter((id) => id !== undefined && id !== null && String(id).trim() !== "");
  return ids.length - new Set(ids.map((id) => String(id).trim())).size;
}

function backupBlockingIssues(candidate) {
  const issues = [];
  const orderDuplicates = duplicateIdCount(candidate.orders || []);
  const warehouseDuplicates = duplicateIdCount(candidate.warehouse || []);
  const goodsDuplicates = duplicateIdCount(candidate.goods_sheets || []);
  if (orderDuplicates > 0) issues.push(`дубли ID заявок: ${orderDuplicates}`);
  if (warehouseDuplicates > 0) issues.push(`дубли ID склада: ${warehouseDuplicates}`);
  if (goodsDuplicates > 0) issues.push(`дубли ID товарников: ${goodsDuplicates}`);
  return issues;
}

function backupWarnings(candidate) {
  const warnings = [];
  const version = Number(candidate.version);
  if (Number.isFinite(version) && version !== BACKUP_FORMAT_VERSION) {
    warnings.push(version > BACKUP_FORMAT_VERSION
      ? `версия бэкапа ${version} новее поддерживаемой ${BACKUP_FORMAT_VERSION}`
      : `версия бэкапа ${version}, ожидается CRM BT v${BACKUP_FORMAT_VERSION}`);
  }
  const ordersWithoutId = (candidate.orders || []).filter((item) => !String(item?.id ?? "").trim()).length;
  const warehouseWithoutId = (candidate.warehouse || []).filter((item) => !String(item?.id ?? "").trim()).length;
  const goodsWithoutId = (candidate.goods_sheets || []).filter((item) => !String(item?.id ?? "").trim()).length;
  if (ordersWithoutId > 0) warnings.push(`заявок без ID: ${ordersWithoutId} · будут восстановлены автоматически`);
  if (warehouseWithoutId > 0) warnings.push(`позиций склада без ID: ${warehouseWithoutId} · будут восстановлены автоматически`);
  if (goodsWithoutId > 0) warnings.push(`товарников без ID: ${goodsWithoutId} · будут восстановлены автоматически`);
  return warnings;
}

async function saveData() {
  data.date = new Date().toISOString();
  await dbSet(DATA_KEY, data);
}

function backupFilename() {
  const stamp = localDateInputValue();
  return `CRM_BT_backup_${stamp}.json`;
}

function backupPayload() {
  return JSON.stringify({ ...data, date: new Date().toISOString() }, null, 2);
}

async function inspectBackupFile() {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "application/json,.json";
  input.hidden = true;
  document.body.appendChild(input);

  input.addEventListener("change", async () => {
    const file = input.files?.[0];
    if (!file) { input.remove(); return; }
    try {
      const candidate = JSON.parse(await file.text());
      const restored = validateBackup(structuredClone(candidate));
      const warnings = backupWarnings(restored);
      const blockingIssues = backupBlockingIssues(restored);
      const photoCount = restored.orders.reduce((sum, order) => sum + (Array.isArray(order.photos) ? order.photos.length : 0), 0);
      const draftCount = Array.isArray(restored.draft)
        ? restored.draft.length
        : looksLikeOrderDraft(restored.draft)
          ? 1
          : restored.draft && typeof restored.draft === "object"
            ? Object.keys(restored.draft).length
            : 0;
      const rows = [
        ["Файл", file.name],
        ["Размер", formatBytes(file.size)],
        ["Версия", String(candidate.version ?? "не указана")],
        ["Дата бэкапа", candidate.date ? shortDate(candidate.date) : "не указана"],
        ["Заявки", String(restored.orders.length)],
        ["Склад", String(restored.warehouse.length)],
        ["Документы", String(restored.receipts.length)],
        ["Инструменты", String(restored.tools.length)],
        ["Черновики", String(draftCount)],
        ["Фотографии", String(photoCount)]
      ];
      const modal = document.createElement("div");
      modal.className = "modal-backdrop";
      modal.innerHTML = `<div class="modal compact-modal"><h2>Проверка бэкапа</h2><div class="goods-list">${rows.map(([name, value]) => `<div class="goods-sheet"><span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(value)}</small></span><b class="green">✓</b><span></span></div>`).join("")}</div>${blockingIssues.length ? `<div class="form-section-title">Импорт заблокирован</div><div class="panel">${blockingIssues.map((item) => `<div class="small red">• ${escapeHtml(item)}</div>`).join("")}</div>` : warnings.length ? `<div class="form-section-title">Предупреждения</div><div class="panel">${warnings.map((item) => `<div class="small">• ${escapeHtml(item)}</div>`).join("")}</div>` : `<div class="panel"><strong class="green">Файл совместим с текущей CRM</strong></div>`}<div class="modal-actions"><button type="button" class="primary-button" data-close-modal>Закрыть</button></div></div>`;
      document.body.appendChild(modal);
      modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
      modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
    } catch (error) {
      console.error(error);
      toast(`Файл не прошёл проверку: ${error.message}`);
    } finally {
      input.remove();
    }
  }, { once: true });

  input.click();
}

async function runBackupSelfTest() {
  try {
    const payload = backupPayload();
    const parsed = JSON.parse(payload);
    const restored = validateBackup(structuredClone(parsed));
    const sections = ["orders", "warehouse", "warehouse_movements", "expenses", "incomes", "service_custom", "receipts", "receipt_prices", "tools", "goods_sheets", "draft", "settings"];
    const compare = (left, right) => sections.filter((key) => JSON.stringify(left[key] ?? defaultData()[key]) !== JSON.stringify(right[key] ?? defaultData()[key]));

    const memoryMismatches = compare(parsed, restored);
    if (memoryMismatches.length) throw new Error(`Содержимое изменилось после восстановления: ${memoryMismatches.join(", ")}`);

    await dbSet(BACKUP_TEST_KEY, restored);
    const storedTest = await dbGet(BACKUP_TEST_KEY);
    const reread = validateBackup(structuredClone(storedTest));
    const storageMismatches = compare(restored, reread);
    await dbDelete(BACKUP_TEST_KEY);
    if (storageMismatches.length) throw new Error(`IndexedDB изменила разделы: ${storageMismatches.join(", ")}`);

    const warnings = backupWarnings(restored);
    const sizeMb = new Blob([payload]).size / 1024 / 1024;
    const photoCount = restored.orders.reduce((sum, order) => sum + (Array.isArray(order.photos) ? order.photos.length : 0), 0);
    const details = `${restored.orders.length} заявок · ${photoCount} фото · ${sizeMb.toFixed(1)} МБ`;
    toast(warnings.length ? `Бэкап и IndexedDB исправны (${details}), предупреждений: ${warnings.length}` : `Бэкап и IndexedDB полностью проверены · ${details}`);
  } catch (error) {
    await dbDelete(BACKUP_TEST_KEY).catch(() => {});
    console.error(error);
    toast(`Проверка бэкапа не пройдена: ${error.message}`);
  }
}

async function downloadBackup() {
  const blob = new Blob([backupPayload()], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = backupFilename();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  await markBackupComplete();
  toast("Бэкап подготовлен и скачивание запущено");
}


function formatBytes(value) {
  const bytes = Number(value) || 0;
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
}

async function requestPersistentStorage() {
  if (!navigator.storage?.persist) return toast("Этот браузер не поддерживает постоянное хранилище");
  try {
    if (navigator.storage.persisted && await navigator.storage.persisted()) return toast("Локальные данные уже защищены браузером");
    const granted = await navigator.storage.persist();
    toast(granted ? "Браузер включил защиту локальных данных" : "Браузер не разрешил постоянное хранилище — используй регулярные бэкапы");
  } catch (error) {
    console.warn(error);
    toast("Не удалось запросить защиту хранилища");
  }
}

async function runAppDiagnostics() {
  const rows = [];
  try {
    const marker = { ok: true, at: Date.now() };
    await dbSet(DIAGNOSTIC_KEY, marker);
    const reread = await dbGet(DIAGNOSTIC_KEY);
    await dbDelete(DIAGNOSTIC_KEY);
    rows.push(["IndexedDB", reread?.ok ? "✓ работает" : "✕ ошибка записи/чтения", Boolean(reread?.ok)]);
  } catch (error) {
    rows.push(["IndexedDB", `✕ ${error.message || "ошибка"}`, false]);
  }

  if ("serviceWorker" in navigator) {
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const state = registration?.active?.state || registration?.installing?.state || registration?.waiting?.state || "не активирован";
      rows.push(["Service worker", registration ? `✓ ${state}` : "△ не зарегистрирован", Boolean(registration)]);
    } catch (error) {
      rows.push(["Service worker", `✕ ${error.message || "ошибка"}`, false]);
    }
  } else {
    rows.push(["Service worker", "✕ не поддерживается", false]);
  }

  try {
    const cacheNames = "caches" in window ? await caches.keys() : [];
    rows.push(["Офлайн-кэш", cacheNames.length ? `✓ ${cacheNames.length} кэш(а)` : "△ пуст", cacheNames.length > 0]);
  } catch (error) {
    rows.push(["Офлайн-кэш", `✕ ${error.message || "ошибка"}`, false]);
  }

  try {
    const estimate = navigator.storage?.estimate ? await navigator.storage.estimate() : null;
    const persisted = navigator.storage?.persisted ? await navigator.storage.persisted() : null;
    rows.push(["Хранилище", estimate ? `${formatBytes(estimate.usage)} из ${formatBytes(estimate.quota)}${persisted === null ? "" : persisted ? " · постоянное" : " · обычное"}` : "данные недоступны", true]);
  } catch (error) {
    rows.push(["Хранилище", `✕ ${error.message || "ошибка"}`, false]);
  }

  const idIssues = backupBlockingIssues(data);
  rows.push(["Целостность ID", idIssues.length ? `! ${idIssues.join("; ")}` : "✓ уникальные", idIssues.length === 0]);
  rows.push(["Интернет", navigator.onLine ? "✓ онлайн" : "△ офлайн", true]);
  rows.push(["Версия", `${APP_VERSION} · сборка ${APP_BUILD}`, true]);
  rows.push(["Адрес", location.href, location.href.startsWith(APP_URL)]);

  const photoCount = data.orders.reduce((sum, order) => sum + (Array.isArray(order.photos) ? order.photos.length : 0), 0);
  rows.push(["Данные", `${data.orders.length} заявок · ${data.warehouse.length} склад · ${photoCount} фото`, true]);

  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal compact-modal"><h2>Диагностика приложения</h2><div class="goods-list">${rows.map(([name, value, ok]) => `<div class="goods-sheet"><span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(value)}</small></span><b class="${ok ? "green" : "red"}">${ok ? "✓" : "!"}</b><span></span></div>`).join("")}</div><div class="modal-actions"><button type="button" class="secondary-button" id="diagnostic-backup-test">Проверить бэкап</button><button type="button" class="secondary-button" id="copy-diagnostics">Скопировать отчёт</button><button type="button" class="primary-button" data-close-modal>Закрыть</button></div></div>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("#diagnostic-backup-test").addEventListener("click", () => runBackupSelfTest());
  modal.querySelector("#copy-diagnostics").addEventListener("click", async () => {
    const report = [
      "CRM by Romanychev — диагностика",
      ...rows.map(([name, value, ok]) => `${ok ? "OK" : "WARN"} | ${name}: ${value}`)
    ].join("\n");
    try {
      await navigator.clipboard.writeText(report);
      toast("Диагностический отчёт скопирован");
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = report;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
      toast("Диагностический отчёт скопирован");
    }
  });
}

async function checkForAppUpdate() {
  toast("Проверяем обновление…");
  try {
    if ("serviceWorker" in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) await registration.update();
    }
    await fetch("./index.html", { cache: "no-store" });
    window.location.replace(APP_URL);
  } catch (error) {
    console.warn("Не удалось проверить обновление", error);
    toast("Не удалось проверить обновление. Проверь интернет.");
  }
}
async function chooseBackupFolder() {
  if (!("showDirectoryPicker" in window)) {
    toast("Этот браузер не поддерживает выбор папки. Используем скачивание файла.");
    return;
  }
  try {
    const handle = await window.showDirectoryPicker({ mode: "readwrite" });
    await dbSet(DIRECTORY_KEY, handle);
    toast(`Папка выбрана: ${handle.name}`);
    render();
  } catch (error) {
    if (error.name !== "AbortError") toast("Не удалось выбрать папку");
  }
}

async function ensureDirectoryPermission(handle) {
  const options = { mode: "readwrite" };
  if ((await handle.queryPermission(options)) === "granted") return true;
  return (await handle.requestPermission(options)) === "granted";
}

async function writeBackupToDirectory({ silent = false } = {}) {
  const handle = await dbGet(DIRECTORY_KEY);
  if (!handle) {
    if (!silent) toast("Сначала выбери папку для бэкапов");
    return false;
  }
  try {
    if (!(await ensureDirectoryPermission(handle))) {
      if (!silent) toast("Нет разрешения на запись в папку");
      return false;
    }
    const fileHandle = await handle.getFileHandle(backupFilename(), { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(backupPayload());
    await writable.close();
    await markBackupComplete();
    if (!silent) toast(`Бэкап сохранён в «${handle.name}»`);
    render();
    return true;
  } catch (error) {
    console.error(error);
    if (!silent) toast("Не удалось записать бэкап в папку");
    return false;
  }
}

async function markBackupComplete() {
  data.settings.lastBackupAt = new Date().toISOString();
  await saveData();
}

async function maybeAutoBackup() {
  if (!data.settings.autoBackup) return;
  const days = Number(data.settings.autoBackupDays) || 1;
  const last = data.settings.lastBackupAt ? new Date(data.settings.lastBackupAt).getTime() : 0;
  if (Date.now() - last < days * 86400000) return;
  const handle = await dbGet(DIRECTORY_KEY);
  if (!handle) return;
  try {
    if ((await handle.queryPermission({ mode: "readwrite" })) === "granted") {
      const saved = await writeBackupToDirectory({ silent: true });
      if (saved) toast("Автоматический бэкап сохранён");
    }
  } catch (error) {
    console.warn("Автобэкап ожидает разрешения пользователя", error);
  }
}

function nav() {
  const items = [
    ["orders", "orders", "Заявки"],
    ["warehouse", "box", "Склад"],
    ["analytics", "chart", "Аналитика"],
    ["more", "more", "Ещё"]
  ];
  return `<nav class="bottom-nav">${items.map(([id, iconName, label]) => `
    <button type="button" class="nav-button ${activePage === id ? "active" : ""}" data-nav="${id}" aria-current="${activePage === id ? "page" : "false"}">
      <span class="nav-icon">${icon(iconName)}</span><span>${label}</span>
    </button>`).join("")}</nav>`;
}

function header() {
  return `<header class="topbar legacy-mobile-header">
    <div class="logo">${icon("logo")}</div>
    <div class="brand">
      <div class="brand-title">CRM by <span>Romanychev</span></div>
      <div class="brand-subtitle">ЛИЧНЫЙ КАБИНЕТ МАСТЕРА</div>
    </div>
  </header>`;
}

function emptyState(iconValue, title, description) {
  const legacyMap = { "▣": "orders", "▥": "warehouse", "⌕": "search", "♙": "clients", "▤": "document", "◇": "goods", "✎": "drafts", "🛠": "tools" };
  const iconName = legacyMap[iconValue] || iconValue;
  const graphic = ICONS[iconName] ? icon(iconName) : escapeHtml(iconValue);
  return `<div class="panel empty"><div class="empty-icon">${graphic}</div><h2>${title}</h2><p>${description}</p></div>`;
}

function applianceIconName(tech) {
  const value = String(tech || "").toLowerCase();
  if (value.includes("стира")) return "washer";
  if (value.includes("посуд")) return "dishwasher";
  if (value.includes("холод") || value.includes("мороз")) return "fridge";
  if (value.includes("плит") || value.includes("дух") || value.includes("печ")) return "oven";
  return "appliance";
}

function orderNetAmount(order) {
  const sum = Number(order?.sum) || 0;
  const gray = Number(order?.expense_gray) || 0;
  const white = Number(order?.expense_white) || 0;
  const percentRaw = order?.percent;
  const percent = percentRaw === undefined || percentRaw === null || percentRaw === "" ? 50 : Math.min(100, Math.max(0, Number(percentRaw) || 0));
  return (sum - gray) * (percent / 100) + (gray - white);
}

function orderCloseSummary(order) {
  const lines = [
    `Сумма заявки: ${money(order.sum)}`,
    `Серый расход: ${money(order.expense_gray)}`,
    `Белый расход: ${money(order.expense_white)}`,
    `Процент: ${Number(order.percent) || 0}%`,
    `Заработок: ${money(orderNetAmount(order))}`
  ];
  if ((Number(order.prepay) || 0) > (Number(order.sum) || 0)) {
    lines.push("⚠ Предоплата больше итоговой суммы");
  }
  return lines.join("\n");
}

async function confirmOrderClose(order) {
  return confirmDialog(orderCloseSummary(order), {
    title: "Закрыть заявку?",
    confirmLabel: "Закрыть"
  });
}

function formatVisitDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit"
  }).format(date).replace(",", "");
}

function visitTimeParts(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return { time: "—", day: "" };
  const time = new Intl.DateTimeFormat("ru-RU", { hour: "2-digit", minute: "2-digit" }).format(date);
  const today = new Date();
  const day = date.toDateString() === today.toDateString() ? "Сегодня" : new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "short" }).format(date);
  return { time, day };
}

function telegramPhoneLink(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  return digits ? `tg://resolve?phone=${digits}` : "";
}

function orderDateValue(order = {}) {
  return order.created || order.createdAt || order.date || order.created_at || order.updatedAt || "";
}

function orderCreatedTimestamp(order = {}) {
  const value = orderDateValue(order);
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : null;
}

function ordersNewestFirst(source = data.orders) {
  return [...(Array.isArray(source) ? source : [])]
    .map((order, index) => ({ order, index, time: orderCreatedTimestamp(order) }))
    .sort((a, b) => {
      if (a.time !== null && b.time !== null && a.time !== b.time) return b.time - a.time;
      if (a.time !== null && b.time === null) return -1;
      if (a.time === null && b.time !== null) return 1;
      return a.index - b.index;
    })
    .map((entry) => entry.order);
}

function normalizeRussianPhone(value = "") {
  let digits = String(value || "").replace(/\D/g, "").slice(0, 11);
  if (!digits) return "";
  if (digits[0] === "8") digits = "7" + digits.slice(1);
  if (digits[0] !== "7") return "";
  return "+" + digits;
}

function isValidRussianPhone(value = "") {
  return /^\+7\d{10}$/.test(String(value || ""));
}

function sanitizeRussianPhoneField(input) {
  if (!input) return "";
  const normalized = normalizeRussianPhone(input.value);
  input.value = normalized;
  input.setCustomValidity(normalized && !isValidRussianPhone(normalized) ? "Введите российский номер: +7XXXXXXXXXX" : "");
  return normalized;
}

function orderCard(order) {
  const statusType = normalizeStatus(order.status);
  const isClosed = statusType === "closed";
  const isDeclined = statusType === "declined";
  const isArchived = Boolean(order.archived);
  const applianceIcon = applianceIconName(order.tech);
  const cardClass = isClosed ? "closed" : isDeclined ? "declined" : "active";
  const statusText = isArchived ? "Архив" : (order.status || "В работе");
  const net = orderNetAmount(order);
  const photos = (Array.isArray(order.photos) ? order.photos : []).map(photoSource).filter(Boolean).slice(0, 4);
  const phoneHref = String(order.phone || "").replace(/[^+\d]/g, "");
  const guaranteeText = Number(order.guarantee) > 0 ? `${escapeHtml(order.guarantee)} мес.` : "без гарантии";
  const nextVisit = formatOrderVisit(order);
  const overdueVisit = visitIsOverdue(order);

  return `<article class="legacy-order-card ${cardClass}" data-order-action="view" data-id="${escapeHtml(order.id)}">
    <div class="legacy-order-accent"></div>
    <div class="legacy-order-head">
      <div class="legacy-order-title"><span>№${escapeHtml(order.id || "—")}</span><strong>${escapeHtml(order.name || "Без имени")}</strong></div>
      <div class="legacy-order-head-side"><time>${shortDate(orderDateValue(order))}</time><span class="legacy-status ${cardClass}">${escapeHtml(statusText)}</span></div>
    </div>

    <div class="legacy-order-device">
      <div class="legacy-device-icon">${icon(applianceIcon)}</div>
      <div><strong>${escapeHtml(order.tech || "Техника")}</strong><small>${escapeHtml(order.brand || order.issue || "Модель не указана")}</small></div>
    </div>

    <div class="legacy-order-money">
      <div><span>СУММА КЛИЕНТА</span><strong>${money(order.sum)}</strong></div>
      <div><span class="legacy-net-label">${icon("goods")} НА РУКИ</span><strong class="${isClosed ? "green" : isDeclined ? "muted" : "pending"}">${isClosed ? money(net) : isDeclined ? "—" : "После закрытия"}</strong></div>
    </div>

    <div class="legacy-order-meta">
      ${order.phone ? `<span>${icon("phone")}${escapeHtml(order.phone)}</span>` : ""}
      ${order.address ? `<a class="address" href="${escapeHtml(yandexMapsUrl(order.address))}" target="_blank" rel="noopener">${icon("location")}${escapeHtml(order.address)}</a>` : ""}
      <span>${icon("shield")}${guaranteeText}</span>
    </div>
    ${nextVisit ? `<div class="legacy-next-visit ${overdueVisit ? "overdue" : ""}">${icon("calendar")}<span>${overdueVisit ? "Визит просрочен" : "Следующий визит"}: ${escapeHtml(nextVisit)}</span></div>` : ""}
    ${photos.length ? `<div class="legacy-order-photos">${photos.map((src,index)=>`<button type="button" class="legacy-order-photo" data-order-action="view" data-id="${escapeHtml(order.id)}" aria-label="Открыть фото ${index+1}"><img src="${src}" alt="" /></button>`).join("")}</div>` : ""}

    <div class="legacy-order-actions">
      <button type="button" data-order-action="edit" data-id="${escapeHtml(order.id)}">${icon("edit")}<span>Изменить</span></button>
      <button type="button" data-order-action="toggle" data-id="${escapeHtml(order.id)}" class="action-toggle">${icon(isClosed ? "reopen" : "check")}<span>${isClosed ? "Открыть" : "Закрыть"}</span></button>
      ${phoneHref ? `<a href="tel:${escapeHtml(phoneHref)}" class="action-phone">${icon("phone")}<span>Позвонить</span></a>` : `<button type="button" disabled class="action-phone">${icon("phone")}<span>Позвонить</span></button>`}
      <button type="button" data-order-action="more" data-id="${escapeHtml(order.id)}" class="action-more">${icon("more")}<span>Ещё</span></button>
    </div>
  </article>`;
}

function ordersPage() {
  const query = searchQuery.trim().toLowerCase();
  const queryDigits = searchQuery.replace(/\D/g, "");
  const phoneQuery = queryDigits.length >= 3 ? normalizeRussianPhone(searchQuery) : "";
  const filtered = ordersNewestFirst().filter((order) => {
    const status = normalizeStatus(order.status);
    const isArchived = Boolean(order.archived);
    const filterMatch = orderFilter === "archived"
      ? isArchived
      : !isArchived && (orderFilter === "all" || orderFilter === status);
    const haystack = [
      order.name,
      order.phone,
      order.tech,
      order.brand,
      order.address,
      order.id,
      orderSourceName(order),
      order.issue,
      order.diagnosis,
      data.settings?.searchMasterComment ? order.comment : ""
    ].join(" ").toLowerCase();
    const normalizedOrderPhone = normalizeRussianPhone(order.phone || "");
    const searchMatch = !query || haystack.includes(query) || (phoneQuery && normalizedOrderPhone.includes(phoneQuery));
    const visitParts = visitDateParts(order);
    const todayKey = localDateInputValue();
    const visitMatch = orderVisitFilter === "all"
      || (orderVisitFilter === "today" && visitParts.date === todayKey)
      || (orderVisitFilter === "upcoming" && visitParts.date && !visitIsOverdue(order))
      || (orderVisitFilter === "overdue" && visitIsOverdue(order));
    return filterMatch && visitMatch && searchMatch;
  });

  const nearestVisits = data.orders
    .filter((order) => !order.archived
      && normalizeStatus(order.status) === "active"
      && visitDateParts(order).date
      && !visitIsOverdue(order))
    .sort((a, b) => visitSortTimestamp(a) - visitSortTimestamp(b))
    .slice(0, 3);

  return `<main class="content orders-content legacy-orders-page">
    <div class="legacy-page-head">
      <div><h1>Заявки</h1><p>Все ремонты в одном месте</p></div>
      <button type="button" class="legacy-page-add" data-action="new-order" aria-label="Новая заявка">${icon("plus")}</button>
    </div>

    ${nearestVisits.length ? `<section class="legacy-nearest-visit">
      <div class="legacy-nearest-title">${icon("calendar")}<strong>Ближайшие визиты</strong><span>${nearestVisits.length}</span><button type="button" data-action="calendar-screen">Календарь</button></div>
      <div class="legacy-nearest-visits-list">${nearestVisits.map((visit) => `<button type="button" class="legacy-nearest-line" data-order-action="view" data-id="${escapeHtml(visit.id)}"><strong>${escapeHtml(formatOrderVisit(visit))}</strong><span>${escapeHtml(visit.name || "Клиент")} · ${escapeHtml(visit.address || visit.tech || "")}</span><em>№${escapeHtml(visit.id)}</em></button>`).join("")}</div>
    </section>` : ""}

    <div class="legacy-order-search search-row search-with-icon">${icon("search")}<input class="search" id="order-search" value="${escapeHtml(searchQuery)}" placeholder="Имя, телефон, техника или модель" aria-label="Поиск заявок" /></div>

    <div class="legacy-order-filters">
      <button type="button" class="${orderFilter === "all" ? "active" : ""}" data-filter="all" aria-pressed="${orderFilter === "all"}">Все</button>
      <button type="button" class="${orderFilter === "closed" ? "active" : ""}" data-filter="closed" aria-pressed="${orderFilter === "closed"}">Закрыты</button>
      <button type="button" class="${orderFilter === "active" ? "active" : ""}" data-filter="active" aria-pressed="${orderFilter === "active"}">В работе</button>
    </div>

    <div class="legacy-visit-filter">
      <select class="field" id="order-visit-filter" aria-label="Фильтр по дате визита">
        <option value="all" ${orderVisitFilter === "all" ? "selected" : ""}>Все даты визита</option>
        <option value="today" ${orderVisitFilter === "today" ? "selected" : ""}>Сегодня</option>
        <option value="upcoming" ${orderVisitFilter === "upcoming" ? "selected" : ""}>Предстоящие визиты</option>
        <option value="overdue" ${orderVisitFilter === "overdue" ? "selected" : ""}>Просроченные визиты</option>
      </select>
      <span>${icon("chevron")}</span>
    </div>

    ${orderFilter === "declined" || orderFilter === "archived" ? `<div class="legacy-special-filter"><button type="button" data-filter="all">${icon("back")}<span>Вернуться ко всем заявкам</span></button></div>` : ""}

    <section class="legacy-orders-list">
      ${filtered.length ? filtered.map(orderCard).join("") : data.orders.length
        ? `<div class="panel empty"><div class="empty-icon">${icon("search")}</div><h2>Ничего не найдено</h2><p>Измени поиск или фильтр.</p><div class="empty-actions"><button type="button" class="secondary-button" data-action="reset-order-filters">Сбросить</button><button type="button" class="primary-button" data-action="new-order">${icon("plus")}<span>Новая заявка</span></button></div></div>`
        : `<div class="panel empty"><div class="empty-icon">${icon("orders")}</div><h2>Заявок пока нет</h2><p>Создай первую заявку или восстанови бэкап.</p><div class="empty-actions"><button type="button" class="primary-button" data-action="new-order">${icon("plus")}<span>Новая заявка</span></button><button type="button" class="secondary-button" data-action="import">Импортировать</button></div></div>`}
    </section>
  </main>`;
}

function warehousePage() {
  const query = warehouseSearch.trim().toLowerCase();
  const activeItems = [...data.warehouse].filter((item) => !item.archived);
  const inStockItems = activeItems.filter((item) => stockAvailableQuantity(item) > 0);
  const reservedItems = activeItems.filter((item) => stockReservedQuantity(item.id) > 0);
  const lowItems = activeItems.filter((item) => Number(item.min || 0) > 0 && stockAvailableQuantity(item) <= Number(item.min || 0));
  const sourceItems = warehouseFilter === "low"
    ? lowItems
    : warehouseFilter === "reserved"
      ? reservedItems
      : warehouseFilter === "all"
        ? [...data.warehouse]
        : inStockItems;
  const items = sourceItems.filter((item) => {
    const compatibility = Array.isArray(item.compatibility) ? item.compatibility.join(" ") : item.compatibility || "";
    const haystack = [item.name, item.category, item.unit, compatibility].join(" ").toLowerCase();
    return !query || haystack.includes(query);
  });
  const groupedItems = [...items.reduce((map, item) => {
    const category = String(item.category || "Нераспределённые").trim() || "Нераспределённые";
    if (!map.has(category)) map.set(category, []);
    map.get(category).push(item);
    return map;
  }, new Map()).entries()]
    .map(([category, group]) => [category, [...group].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ru"))])
    .sort(([a], [b]) => a.localeCompare(b, "ru"));

  return `<main class="content legacy-warehouse-page">
    <div class="legacy-warehouse-head">
      <div><h1>Склад</h1><p>Запчасти и расходные материалы</p></div>
      <button type="button" class="legacy-page-add" data-action="new-stock" aria-label="Новая позиция">${icon("plus")}</button>
    </div>

    <div class="legacy-warehouse-search search-row search-with-icon">
      ${icon("search")}
      <input class="search" id="warehouse-search" value="${escapeHtml(warehouseSearch)}" placeholder="Название или категория" aria-label="Поиск по складу" />
    </div>

    <div class="legacy-warehouse-filter">
      <select class="field" id="warehouse-filter-select" aria-label="Фильтр склада">
        <option value="active" ${warehouseFilter === "active" ? "selected" : ""}>В наличии</option>
        <option value="reserved" ${warehouseFilter === "reserved" ? "selected" : ""}>В резерве</option>
        <option value="low" ${warehouseFilter === "low" ? "selected" : ""}>Мало осталось</option>
        <option value="all" ${warehouseFilter === "all" ? "selected" : ""}>Все позиции</option>
      </select>
      <span>${icon("chevron")}</span>
    </div>

    <div class="legacy-warehouse-shortcuts">
      <button type="button" data-action="open-warehouse-movements">${icon("history")}<span>История движения</span></button>
      <button type="button" data-action="open-shopping">${icon("shopping")}<span>Список покупок</span></button>
    </div>

    <section class="legacy-warehouse-groups">
      ${groupedItems.length ? groupedItems.map(([category, group], groupIndex) => {
        const lowInGroup = group.filter((item) => !item.archived && Number(item.min || 0) > 0 && stockAvailableQuantity(item) <= Number(item.min || 0)).length;
        return `<details class="legacy-warehouse-group" ${groupIndex === 0 ? "open" : ""}>
          <summary>
            <span class="legacy-folder-icon">${icon("document")}</span>
            <span class="legacy-group-copy"><strong>${escapeHtml(category)}</strong><small>${group.length} поз.${lowInGroup ? ` · мало: ${lowInGroup}` : ""}</small></span>
            <span class="legacy-group-chevron">${icon("chevron")}</span>
          </summary>
          <div class="legacy-stock-list">
            ${group.map((item) => {
              const reserved = stockReservedQuantity(item.id);
              const available = stockAvailableQuantity(item);
              const isLow = !item.archived && Number(item.min || 0) > 0 && available <= Number(item.min || 0);
              const compatibility = Array.isArray(item.compatibility) ? item.compatibility[0] : "";
              return `<article class="legacy-stock-card-v2 ${item.archived ? "archived" : ""} ${isLow ? "low" : ""}">
                <button type="button" class="legacy-stock-main" data-stock-detail="${escapeHtml(item.id)}">
                  <span class="legacy-stock-icon">${icon("box")}</span>
                  <span class="legacy-stock-copy">
                    <strong>${escapeHtml(item.name || "Без названия")}</strong>
                    <small>${escapeHtml(compatibility || item.category || "Без категории")} · ${item.lastPurchasePrice ? `${money(item.lastPurchasePrice)} / ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}` : "себестоимость не задана"}</small>
                    <em>${item.archived ? "в архиве" : reserved > 0 ? `доступно ${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(available)} · резерв ${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(reserved)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}` : isLow ? `мало · минимум ${escapeHtml(item.min || 0)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}` : `доступно ${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(available)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}`}</em>
                  </span>
                  <span class="legacy-stock-qty"><strong>${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(available)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}</strong><small>${item.archived ? "АРХИВ" : reserved > 0 ? "ЕСТЬ РЕЗЕРВ" : isLow ? "МАЛО" : "ДОСТУПНО"}</small></span>
                </button>
                <div class="legacy-stock-actions-v2">
                  <button type="button" data-stock="in" data-id="${escapeHtml(item.id)}"><span class="stock-action-mini-icon">${icon("plus")}</span>Приход</button>
                  <button type="button" data-stock="out" data-id="${escapeHtml(item.id)}"><span class="stock-action-mini-icon">${icon("minus")}</span>Списать</button>
                  <button type="button" data-action="archive-stock" data-id="${escapeHtml(item.id)}">${icon(item.archived ? "restore" : "archive")}<span>${item.archived ? "Вернуть" : "Архив"}</span></button>
                  <button type="button" data-action="edit-stock" data-id="${escapeHtml(item.id)}">${icon("edit")}<span>Настроить</span></button>
                </div>
              </article>`;
            }).join("")}
          </div>
        </details>`;
      }).join("") : `<div class="panel empty"><div class="empty-icon">${icon("warehouse")}</div><h2>Склад пуст</h2><p>${query ? "По этому запросу ничего не найдено." : "Добавь первую позицию."}</p></div>`}
    </section>
  </main>`;
}

function analyticsRange(period = analyticsPeriod, offset = analyticsOffset) {
  const now = new Date();
  const day = 86400000;
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (period === "all") return null;
  if (period === "custom") {
    if (!analyticsCustomStart || !analyticsCustomEnd) return null;
    const start = new Date(`${analyticsCustomStart}T00:00:00`);
    const end = new Date(`${analyticsCustomEnd}T00:00:00`);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
    return { start: start.getTime(), end: end.getTime() + day };
  }
  if (period === "today") {
    const start = startOfToday.getTime() + offset * day;
    return { start, end: start + day };
  }
  if (period === "7") {
    const end = startOfToday.getTime() + day + offset * 7 * day;
    return { start: end - 7 * day, end };
  }
  if (period === "30") {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1).getTime();
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1).getTime();
    return { start, end };
  }
  if (period === "365") {
    const start = new Date(now.getFullYear() + offset, 0, 1).getTime();
    const end = new Date(now.getFullYear() + offset + 1, 0, 1).getTime();
    return { start, end };
  }
  return null;
}

function inAnalyticsRange(value, range = analyticsRange()) {
  if (!range) return true;
  const time = new Date(value || 0).getTime();
  return Number.isFinite(time) && time >= range.start && time < range.end;
}

function calendarDayTime(value) {
  const date = new Date(value || 0);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

function revenueBarsForOrders(orders) {
  const grouped = new Map();
  orders.forEach((order) => {
    const dayTime = calendarDayTime(order.completed || orderDateValue(order));
    if (dayTime === null) return;
    grouped.set(dayTime, (grouped.get(dayTime) || 0) + (Number(order.sum) || 0));
  });
  return [...grouped.entries()]
    .sort(([left], [right]) => left - right)
    .slice(-7)
    .map(([dayTime, value]) => [shortDate(new Date(dayTime)), value]);
}

function analyticsPeriodTitle(range = analyticsRange()) {
  if (analyticsPeriod === "all") return "Всё время";
  if (analyticsPeriod === "custom") return analyticsCustomStart && analyticsCustomEnd ? `${shortDate(analyticsCustomStart)} — ${shortDate(analyticsCustomEnd)}` : "Свой период";
  if (!range) return "Период";
  const start = new Date(range.start);
  const end = new Date(range.end - 1);
  if (analyticsPeriod === "today") return new Intl.DateTimeFormat("ru-RU", { day: "numeric", month: "long", year: "numeric" }).format(start);
  if (analyticsPeriod === "30") return new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(start);
  if (analyticsPeriod === "365") return String(start.getFullYear());
  return `${shortDate(start)} — ${shortDate(end)}`;
}

function analyticsRangeModal() {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop legacy-analytics-range-backdrop";
  modal.innerHTML = `<form class="modal legacy-analytics-range-modal" id="analytics-range-form">
    <div class="legacy-range-head">
      <span class="legacy-range-icon">${icon("calendar")}</span>
      <div><strong>Свой период</strong><small>Выбери даты для отчёта</small></div>
      <button type="button" data-close-modal aria-label="Закрыть">${icon("close")}</button>
    </div>
    <div class="legacy-range-grid">
      <label><span>С</span><input class="field" type="date" name="start" value="${escapeHtml(analyticsCustomStart)}" required /></label>
      <label><span>ПО</span><input class="field" type="date" name="end" value="${escapeHtml(analyticsCustomEnd)}" required /></label>
    </div>
    <div class="legacy-range-actions">
      <button type="button" class="legacy-dark-button" data-close-modal>Отмена</button>
      <button class="legacy-orange-button" type="submit">Применить</button>
    </div>
  </form>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    analyticsCustomStart = String(form.get("start") || "");
    analyticsCustomEnd = String(form.get("end") || "");
    if (analyticsCustomStart > analyticsCustomEnd) return toast("Дата начала позже даты окончания");
    analyticsPeriod = "custom";
    analyticsOffset = 0;
    saveUiState();
    modal.remove();
    await render();
  });
}

function analyticsPage() {
  const range = analyticsRange();
  const closed = data.orders.filter((order) => !order.archived && normalizeStatus(order.status) === "closed" && inAnalyticsRange(order.completed || orderDateValue(order), range));
  const activeOrders = data.orders.filter((order) => !order.archived && normalizeStatus(order.status) === "active");
  const periodExpenses = data.expenses.filter((item) => inAnalyticsRange(item.date, range));
  const periodIncomes = data.incomes.filter((item) => inAnalyticsRange(item.date, range));
  const revenue = closed.reduce((sum, order) => sum + (Number(order.sum) || 0), 0);
  const repairCosts = closed.reduce((sum, order) => sum + (Number(order.expense_gray) || 0) + (Number(order.expense_white) || 0), 0);
  const repairResult = revenue - repairCosts;
  const personalExpenses = periodExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const personalIncome = periodIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const personalResult = personalIncome - personalExpenses;
  const totalSpent = repairCosts + personalExpenses;
  const totalResult = repairResult + personalResult;
  const average = closed.length ? revenue / closed.length : 0;

  const now = Date.now();
  const overdueVisits = activeOrders.filter((order) => order.nextVisit && new Date(order.nextVisit).getTime() < now).length;
  const lowStock = data.warehouse.filter((item) => !item.archived && Number(item.quantity) <= Number(item.min || 0)).length;
  const activeOrderAges = activeOrders
    .map((order) => orderCreatedTimestamp(order))
    .filter(Number.isFinite)
    .map((created) => Math.max(0, Math.floor((now - created) / 86400000)));
  const oldestActiveDays = activeOrderAges.length ? Math.max(...activeOrderAges) : 0;
  const activeSum = activeOrders.reduce((sum, order) => sum + (Number(order.sum) || 0), 0);

  const bars = revenueBarsForOrders(closed);
  const max = Math.max(...bars.map(([, value]) => value), 1);

  const techMap = new Map();
  closed.forEach((order) => {
    const key = String(order.tech || "Другое").trim() || "Другое";
    const current = techMap.get(key) || { name: key, count: 0, revenue: 0, costs: 0 };
    current.count += 1;
    current.revenue += Number(order.sum) || 0;
    current.costs += (Number(order.expense_gray) || 0) + (Number(order.expense_white) || 0);
    techMap.set(key, current);
  });
  const techStats = [...techMap.values()].sort((a, b) => b.revenue - a.revenue);

  const usageMap = new Map();
  data.warehouse_movements.filter((movement) => inAnalyticsRange(movement.date, range)).forEach((movement) => {
    let delta = 0;
    if (movement.type === "order_out" || movement.type === "manual_out") delta = Number(movement.qty) || 0;
    if (movement.type === "order_return") delta = -(Number(movement.qty) || 0);
    if (!delta) return;
    const key = String(movement.warehouseId || movement.name || "unknown");
    const stockItem = data.warehouse.find((item) => String(item.id) === String(movement.warehouseId));
    const current = usageMap.get(key) || { name: movement.name || stockItem?.name || "Материал", unit: stockItem?.unit || "шт.", qty: 0, operations: 0 };
    current.qty += delta;
    current.operations += 1;
    usageMap.set(key, current);
  });
  const materialUsage = [...usageMap.values()].filter((item) => item.qty > 0).sort((a, b) => b.qty - a.qty).slice(0, 10);

  const serviceMap = new Map();
  closed.forEach((order) => {
    (Array.isArray(order.services) ? order.services : []).forEach((service) => {
      const name = String(service.name || "Услуга").trim() || "Услуга";
      const current = serviceMap.get(name) || { name, qty: 0, revenue: 0 };
      const qty = Number(service.qty) || 1;
      current.qty += qty;
      current.revenue += qty * (Number(service.price) || 0);
      serviceMap.set(name, current);
    });
  });
  const serviceRanking = [...serviceMap.values()].sort((a, b) => b.revenue - a.revenue || b.qty - a.qty).slice(0, 5);
  const warehouseActive = data.warehouse.filter((item) => !item.archived);
  const warehouseValue = warehouseActive.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.lastPurchasePrice) || 0), 0);

  return `<main class="content analytics-content">
    <div class="page-head"><div><h1>Аналитика</h1><p class="lead">Деньги, работа и контроль в одном экране</p></div></div>

    <div class="analytics-period-grid">
      <button type="button" class="chip ${analyticsPeriod === "today" ? "active" : ""}" data-analytics-period="today" aria-pressed="${analyticsPeriod === "today"}">День</button>
      <button type="button" class="chip ${analyticsPeriod === "7" ? "active" : ""}" data-analytics-period="7" aria-pressed="${analyticsPeriod === "7"}">Неделя</button>
      <button type="button" class="chip ${analyticsPeriod === "30" ? "active" : ""}" data-analytics-period="30" aria-pressed="${analyticsPeriod === "30"}">Месяц</button>
      <button type="button" class="chip ${analyticsPeriod === "365" ? "active" : ""}" data-analytics-period="365" aria-pressed="${analyticsPeriod === "365"}">Год</button>
      <button type="button" class="chip ${analyticsPeriod === "all" ? "active" : ""}" data-analytics-period="all" aria-pressed="${analyticsPeriod === "all"}">Всё</button>
      <button type="button" class="chip calendar ${analyticsPeriod === "custom" ? "active" : ""}" data-analytics-period="custom" aria-pressed="${analyticsPeriod === "custom"}" aria-label="Свой период">${icon("calendar")}</button>
    </div>

    <div class="analytics-range-nav">
      <button type="button" class="analytics-arrow" data-analytics-shift="-1" aria-label="Предыдущий период" ${analyticsPeriod === "all" || analyticsPeriod === "custom" ? "disabled" : ""}>${icon("back")}</button>
      <div><strong>${escapeHtml(analyticsPeriodTitle(range))}</strong><small>${range ? `${shortDate(new Date(range.start))} — ${shortDate(new Date(range.end - 1))}` : "Все данные CRM"}</small></div>
      <button type="button" class="analytics-arrow" data-analytics-shift="1" aria-label="Следующий период" ${analyticsPeriod === "all" || analyticsPeriod === "custom" || analyticsOffset >= 0 ? "disabled" : ""}>${icon("chevron")}</button>
    </div>

    <section class="panel analytics-kpi-panel">
      <div class="panel-title"><span class="badge-icon analytics-gem">${icon("gem")}</span><span>Главные показатели<small>${escapeHtml(analyticsPeriodTitle(range))}</small></span></div>
      <div class="analytics-kpis">
        <div class="analytics-kpi revenue"><span class="analytics-kpi-icon green">${icon("finance")}</span><div><span>Выручка</span><strong>${money(revenue)}</strong><small>${closed.length} закрытых заявок</small></div></div>
        <div class="analytics-kpi result"><span class="analytics-kpi-icon blue">${icon("chart")}</span><div><span>Итог</span><strong class="${totalResult >= 0 ? "green" : "red"}">${money(totalResult)}</strong><small>после всех расходов</small></div></div>
        <div class="analytics-kpi expenses"><span class="analytics-kpi-icon red">${icon("shopping")}</span><div><span>Расходы</span><strong class="red">${money(totalSpent)}</strong><small>ремонт и личные</small></div></div>
        <div class="analytics-kpi average"><span class="analytics-kpi-icon purple">${icon("tools")}</span><div><span>Средний чек</span><strong class="yellow">${money(average)}</strong><small>по закрытым заявкам</small></div></div>
      </div>
      <div class="analytics-summary-strip"><span><small>Чистыми с ремонта</small><b class="${repairResult >= 0 ? "green" : "red"}">${money(repairResult)}</b></span><span><small>Личные финансы</small><b class="${personalResult >= 0 ? "green" : "red"}">${money(personalResult)}</b></span></div>
    </section>

    <section class="panel analytics-focus">
      <div class="panel-title"><span class="badge-icon">${icon("warning")}</span><span>Фокус внимания<small>что требует проверки сейчас</small></span></div>
      <div class="analytics-focus-list">
        <div class="analytics-focus-row"><span class="analytics-focus-icon red">${icon("calendar")}</span><span><b>Просроченные визиты</b><small>назначенная дата уже прошла</small></span><strong>${overdueVisits}</strong></div>
        <div class="analytics-focus-row"><span class="analytics-focus-icon yellow">${icon("box")}</span><span><b>Заканчивается на складе</b><small>остаток достиг минимума</small></span><strong>${lowStock}</strong></div>
        <div class="analytics-focus-row"><span class="analytics-focus-icon blue">${icon("history")}</span><span><b>Самая старая заявка</b><small>дней находится в работе</small></span><strong>${oldestActiveDays}</strong></div>
      </div>
    </section>

    <section class="panel analytics-work">
      <div class="panel-title"><span class="badge-icon">${icon("tools")}</span><span>Работа сейчас<small>активные заявки</small></span></div>
      <div class="analytics-work-grid">
        <div class="metric"><span class="metric-icon green">${icon("check")}</span><div class="metric-label">В работе</div><div class="metric-value">${activeOrders.length}</div></div>
        <div class="metric"><span class="metric-icon blue">${icon("finance")}</span><div class="metric-label">Сумма</div><div class="metric-value blue">${money(activeSum)}</div></div>
        <div class="metric"><span class="metric-icon yellow">${icon("calendar")}</span><div class="metric-label">Просрочено</div><div class="metric-value yellow">${overdueVisits}</div></div>
      </div>
    </section>

    <section class="panel analytics-ranking">
      <div class="panel-title"><span class="badge-icon">${icon("price")}</span> Рейтинг услуг</div>
      ${serviceRanking.length ? `<div class="analytics-ranking-list">${serviceRanking.map((item, index) => `<div class="analytics-ranking-row"><span class="ranking-place">${index + 1}</span><span><strong>${escapeHtml(item.name)}</strong><small>${item.qty} шт. за период</small></span><b>${money(item.revenue)}</b></div>`).join("")}</div>` : `<div class="small">Нет услуг в закрытых заявках за выбранный период.</div>`}
    </section>

    <details class="panel analytics-collapsible analytics-stock-summary">
      <summary><span class="panel-title"><span class="badge-icon">${icon("box")}</span><span>Склад<small>остатки и стоимость</small></span></span>${icon("chevron")}</summary>
      <div class="analytics-work-grid">
        <div class="metric"><div class="metric-label">Позиций</div><div class="metric-value">${warehouseActive.length}</div></div>
        <div class="metric"><div class="metric-label">Заканчивается</div><div class="metric-value yellow">${lowStock}</div></div>
        <div class="metric"><div class="metric-label">Стоимость остатков</div><div class="metric-value purple">${money(warehouseValue)}</div></div>
      </div>
    </details>

    <section class="panel analytics-chart-panel"><div class="panel-title"><span class="badge-icon">${icon("analytics")}</span><span>Динамика выручки<small>закрытые заявки по календарю</small></span></div>${bars.length ? `<div class="bars">${bars.map(([label, value]) => `<div class="bar-wrap"><span>${money(value)}</span><div class="bar" style="height:${Math.max(6, value / max * 84)}px"></div><span>${label}</span></div>`).join("")}</div>` : `<div class="empty">Пока нет данных для графика</div>`}</section>
    <details class="panel analytics-collapsible analytics-list-panel"><summary><span class="panel-title"><span class="badge-icon">${icon("tools")}</span><span>Доходность по технике<small>выручка минус расходы ремонта</small></span></span>${icon("chevron")}</summary>${techStats.length ? `<div class="goods-list">${techStats.map((item) => {
      const result = item.revenue - item.costs;
      return `<div class="goods-sheet"><span><strong>${escapeHtml(item.name)}</strong><small>${item.count} заявок · выручка ${money(item.revenue)} · расходы ${money(item.costs)}</small></span><b class="${result >= 0 ? "green" : "red"}">${money(result)}</b><span></span></div>`;
    }).join("")}</div>` : `<div class="empty">Нет закрытых заявок за период</div>`}</details>
    <details class="panel analytics-collapsible analytics-list-panel"><summary><span class="panel-title"><span class="badge-icon">${icon("box")}</span><span>Расход материалов<small>что реально ушло со склада</small></span></span>${icon("chevron")}</summary>${materialUsage.length ? `<div class="goods-list">${materialUsage.map((item) => `<div class="goods-sheet"><span><strong>${escapeHtml(item.name)}</strong><small>${item.operations} движ. за период</small></span><b class="yellow">${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(item.qty)} ${escapeHtml(item.unit)}</b><span></span></div>`).join("")}</div>` : `<div class="empty">Нет списаний материалов за период</div>`}</details>
  </main>`;
}


function availableServices() {
  const regular = data.receipt_prices
    .filter((item) => item.kind !== "material")
    .map((item) => ({ ...item, name: item.name || item.title || "Услуга", price: Number(item.price) || 0, source: "price" }));
  const custom = (Array.isArray(data.service_custom) ? data.service_custom : [])
    .map((item) => ({ ...item, name: item.name || item.title || item.service || "Услуга", price: Number(item.price || item.cost || item.sum) || 0, source: "custom" }));
  return [...regular, ...custom];
}
function priceList() {
  const query = priceSearch.trim().toLowerCase();
  const techs = [...new Set([
    ...data.receipt_prices.map((item) => String(item.tech || "").trim()),
    ...(Array.isArray(data.service_custom) ? data.service_custom.map((item) => String(item.tech || item.category || "").trim()) : [])
  ].filter(Boolean))].sort((a, b) => a.localeCompare(b, "ru"));

  const prices = data.receipt_prices.filter((item) => {
    const techMatch = priceTechFilter === "all" || String(item.tech || "") === priceTechFilter;
    const kind = item.kind === "material" ? "material" : "service";
    const kindMatch = priceKindFilter === "all" || priceKindFilter === kind;
    const haystack = [item.name, item.category, item.tech, item.unit, item.kind].join(" ").toLowerCase();
    return techMatch && kindMatch && (!query || haystack.includes(query));
  });

  const groups = [...prices.reduce((map, item) => {
    const group = String(item.category || (item.kind === "material" ? "Материалы" : "Услуги")).trim() || "Прочее";
    if (!map.has(group)) map.set(group, []);
    map.get(group).push(item);
    return map;
  }, new Map()).entries()]
    .map(([category, group]) => [category, [...group].sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ru"))])
    .sort(([a], [b]) => a.localeCompare(b, "ru"));

  const customServices = (priceKindFilter === "all" || priceKindFilter === "custom" ? (Array.isArray(data.service_custom) ? data.service_custom : []) : [])
    .filter((item) => {
      const techValue = String(item.tech || item.category || "").trim();
      const techMatch = priceTechFilter === "all" || techValue === priceTechFilter;
      const haystack = [item.name, item.title, item.service, item.category, item.tech].join(" ").toLowerCase();
      return techMatch && (!query || haystack.includes(query));
    })
    .sort((a, b) => String(a.name || a.title || a.service || "").localeCompare(String(b.name || b.title || b.service || ""), "ru"));

  const scopeTitle = priceTechFilter === "all" ? "Прайс-лист" : `Каталог · ${priceTechFilter}`;

  return `<main class="content legacy-price-page">
    <div class="legacy-subpage-head legacy-price-head">
      <button type="button" class="legacy-back-button" data-action="more-menu" aria-label="Назад">${icon("back")}</button>
      <div><h1>${escapeHtml(scopeTitle)}</h1><p>${prices.length + customServices.length} позиций · услуги и материалы</p></div>
      <button type="button" class="legacy-price-add" data-action="new-price" aria-label="Добавить позицию">${icon("plus")}</button>
    </div>

    <div class="legacy-price-search search-row search-with-icon">${icon("search")}<input class="search" id="price-search" value="${escapeHtml(priceSearch)}" placeholder="Название товара или услуги" aria-label="Поиск по прайсу" /></div>

    <div class="legacy-price-filters">
      <label><span>ТИП</span><select class="field" id="price-kind-filter">
        <option value="all" ${priceKindFilter === "all" ? "selected" : ""}>Все позиции</option>
        <option value="service" ${priceKindFilter === "service" ? "selected" : ""}>Услуги</option>
        <option value="material" ${priceKindFilter === "material" ? "selected" : ""}>Материалы</option>
        <option value="custom" ${priceKindFilter === "custom" ? "selected" : ""}>Свои услуги</option>
      </select></label>
      <label><span>ТЕХНИКА</span><select class="field" id="price-tech-filter">
        <option value="all">Вся техника</option>
        ${techs.map((tech) => `<option value="${escapeHtml(tech)}" ${priceTechFilter === tech ? "selected" : ""}>${escapeHtml(tech)}</option>`).join("")}
      </select></label>
    </div>

    ${groups.length ? `<div class="legacy-price-groups">${groups.map(([category, items]) => `
      <section class="legacy-price-group">
        <h3>${escapeHtml(category)}</h3>
        <div class="legacy-price-list">${items.map((item) => {
          const index = data.receipt_prices.indexOf(item);
          const meta = [item.unit, item.tech].filter(Boolean).join(" · ") || (item.kind === "material" ? "Материал" : "Услуга");
          return `<button type="button" class="legacy-price-row ${item.kind === "material" ? "material" : "service"}" data-action="edit-price" data-index="${index}">
            <span><strong>${escapeHtml(item.name || "Без названия")}</strong><small>${escapeHtml(meta)}</small></span>
            <b>${money(item.price || 0)}</b>
          </button>`;
        }).join("")}</div>
      </section>`).join("")}</div>` : ""}

    ${(priceKindFilter === "all" || priceKindFilter === "custom") ? `<section class="legacy-price-group legacy-custom-price">
      <div class="legacy-custom-price-head"><h3>СВОИ УСЛУГИ</h3><button type="button" data-action="new-custom-service">${icon("plus")}<span>Добавить</span></button></div>
      ${customServices.length ? `<div class="legacy-price-list">${customServices.map((item) => {
        const index = data.service_custom.indexOf(item);
        const name = item.name || item.title || item.service || "Услуга";
        const meta = item.category || item.tech || "Своя услуга";
        const price = Number(item.price || item.cost || item.sum) || 0;
        return `<button type="button" class="legacy-price-row custom" data-action="edit-custom-service" data-index="${index}">
          <span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(meta)}</small></span>
          <b>${money(price)}</b>
        </button>`;
      }).join("")}</div>` : `<div class="legacy-price-empty">Своих услуг пока нет.</div>`}
    </section>` : ""}

    ${!groups.length && !customServices.length ? `<div class="legacy-price-empty standalone">Ничего не найдено. Измени поиск или фильтры.</div>` : ""}
  </main>`;
}
function clientKeyForOrder(order) {
  const phone = normalizeRussianPhone(order.phone || "");
  if (phone) return phone;
  return `order:${String(order.id || "").trim()}`;
}

function clientsPage() {
  const clients = new Map();
  data.orders.forEach((order) => {
    if (order.archived) return;
    const key = clientKeyForOrder(order);
    if (!key) return;
    const orderDate = orderDateValue(order);
    const orderTime = orderCreatedTimestamp(order) || 0;
    const profile = clientProfileByPhone(order.phone || "");
    const current = clients.get(key) || {
      key,
      name: profile?.name || order.name || "Без имени",
      phone: normalizeRussianPhone(order.phone || "") || order.phone || "",
      address: profile?.lastAddress || order.address || "",
      note: profile?.note || "",
      orders: [],
      total: 0,
      last: orderDate,
      lastTime: orderTime
    };
    current.orders.push(order);
    current.total += Number(order.sum) || 0;
    if (orderTime > Number(current.lastTime || 0)) {
      current.last = orderDate;
      current.lastTime = orderTime;
      current.name = order.name || current.name;
      current.phone = normalizeRussianPhone(order.phone || "") || order.phone || current.phone;
      current.address = order.address || current.address;
    }
    clients.set(key, current);
  });

  const sorted = [...clients.values()].sort((a, b) => Number(b.lastTime || 0) - Number(a.lastTime || 0));
  const query = clientSearch.trim().toLowerCase();
  const queryDigits = clientSearch.replace(/\D/g, "");
  const phoneQuery = queryDigits.length >= 3 ? normalizeRussianPhone(clientSearch) : "";
  const filtered = sorted.filter((client) => {
    const haystack = [client.name, client.phone, client.address, client.note].join(" ").toLowerCase();
    const normalizedClientPhone = normalizeRussianPhone(client.phone || "");
    return !query || haystack.includes(query) || (phoneQuery && normalizedClientPhone.includes(phoneQuery));
  });
  const activeOrders = data.orders.filter((item) => !item.archived);
  const closedOrders = activeOrders.filter((item) => normalizeStatus(item.status) === "closed").length;
  const activeNow = activeOrders.filter((item) => normalizeStatus(item.status) === "active").length;

  return `<main class="content legacy-clients-page">
    <div class="legacy-subpage-head legacy-clients-head">
      <button type="button" class="legacy-back-button" data-action="more-menu" aria-label="Назад">${icon("back")}</button>
      <div><h1>Клиенты</h1><p>История обращений и ремонтов</p></div>
    </div>

    <div class="legacy-client-search search-row search-with-icon">${icon("search")}<input class="search" id="client-search" value="${escapeHtml(clientSearch)}" placeholder="Имя, телефон или адрес" aria-label="Поиск клиентов" /></div>

    <section class="legacy-clients-stats">
      <div class="clients-stat-primary"><span>КЛИЕНТОВ</span><strong>${sorted.length}</strong><small>${activeOrders.length} обращений всего</small></div>
      <div><span>В РАБОТЕ</span><strong class="blue">${activeNow}</strong><small>активные заявки</small></div>
      <div><span>ЗАКРЫТО</span><strong class="green">${closedOrders}</strong><small>завершённые ремонты</small></div>
    </section>

    ${filtered.length ? `<div class="legacy-client-list">${filtered.map((client) => {
      const closed = client.orders.filter((order) => normalizeStatus(order.status) === "closed").length;
      const active = client.orders.filter((order) => normalizeStatus(order.status) === "active").length;
      return `<article class="legacy-client-card">
        <button type="button" class="legacy-client-main" data-action="open-client" data-key="${escapeHtml(client.key)}">
          <span class="legacy-client-avatar">${icon("clients")}</span>
          <span class="legacy-client-copy">
            <strong>${escapeHtml(client.name || "Клиент")}</strong>
            <small>${escapeHtml(client.phone || "Телефон не указан")}</small>
            ${client.address ? `<em>${icon("location")}${escapeHtml(client.address)}</em>` : ""}
          </span>
          <span class="legacy-client-side"><b>${money(client.total)}</b><small>${client.orders.length} обращ.</small></span>
        </button>
        <div class="legacy-client-meta">
          <span><b class="green">${closed}</b> закрыто</span>
          <span><b class="blue">${active}</b> в работе</span>
          <span>последнее: <b>${shortDate(client.last)}</b></span>
        </div>
        <div class="legacy-client-actions">
          ${client.phone ? `<a href="tel:${escapeHtml(client.phone)}">${icon("phone")}<span>Позвонить</span></a>` : `<button type="button" disabled>${icon("phone")}<span>Нет телефона</span></button>`}
          <button type="button" data-action="open-client" data-key="${escapeHtml(client.key)}">${icon("history")}<span>История</span></button>
        </div>
      </article>`;
    }).join("")}</div>` : (query
      ? `<div class="legacy-client-empty">Клиент не найден. Попробуй изменить поиск.</div>`
      : `<div class="legacy-client-empty">Клиенты появятся после создания или импорта заявок.</div>`)}
  </main>`;
}
function financePage() {
  const expenseRows = data.expenses
    .map((item, sourceIndex) => ({ ...item, sourceIndex }))
    .filter((item) => withinPeriod(item.date, financePeriod));
  const incomeRows = data.incomes
    .map((item, sourceIndex) => ({ ...item, sourceIndex }))
    .filter((item) => withinPeriod(item.date, financePeriod));
  const expenses = expenseRows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const incomes = incomeRows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const result = incomes - expenses;
  const rows = [
    ...expenseRows.map((item) => ({ ...item, financeType: "expense" })),
    ...incomeRows.map((item) => ({ ...item, financeType: "income" }))
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

  return `<main class="content legacy-finance-page">
    <div class="legacy-subpage-head legacy-finance-head">
      <button type="button" class="legacy-back-button" data-action="more-menu" aria-label="Назад">${icon("back")}</button>
      <div><h1>Финансы</h1><p>Доходы, расходы и результат</p></div>
    </div>

    <div class="legacy-finance-periods">
      <button type="button" class="${financePeriod === "all" ? "active" : ""}" data-finance-period="all" aria-pressed="${financePeriod === "all"}">Всё время</button>
      <button type="button" class="${financePeriod === "30" ? "active" : ""}" data-finance-period="30" aria-pressed="${financePeriod === "30"}">30 дней</button>
      <button type="button" class="${financePeriod === "90" ? "active" : ""}" data-finance-period="90" aria-pressed="${financePeriod === "90"}">90 дней</button>
      <button type="button" class="${financePeriod === "365" ? "active" : ""}" data-finance-period="365" aria-pressed="${financePeriod === "365"}">Год</button>
    </div>

    <section class="legacy-finance-summary">
      <div class="result finance-result-hero ${result >= 0 ? "positive" : "negative"}"><span>РЕЗУЛЬТАТ ПЕРИОДА</span><strong class="${result >= 0 ? "green" : "red"}">${money(result)}</strong><small>${rows.length} операций</small></div>
      <div class="income"><span>ДОХОДЫ</span><strong>+${money(incomes)}</strong><small>${incomeRows.length} поступлений</small></div>
      <div class="expense"><span>РАСХОДЫ</span><strong>−${money(expenses)}</strong><small>${expenseRows.length} списаний</small></div>
    </section>

    <div class="legacy-finance-actions">
      <button type="button" class="legacy-orange-button" data-action="add-finance" data-type="income">${icon("plus")}<span>Добавить доход</span></button>
      <button type="button" class="legacy-dark-button" data-action="add-finance" data-type="expense">${icon("minus")}<span>Добавить расход</span></button>
    </div>

    <section class="legacy-finance-history">
      <div class="legacy-finance-history-head"><span class="legacy-section-icon small">${icon("history")}</span><h2>История операций</h2><b>${rows.length}</b></div>
      ${rows.length ? `<div class="legacy-finance-list">${rows.map((item) => `
        <article class="legacy-finance-row ${item.financeType}">
          <span class="legacy-finance-kind">${icon(item.financeType === "income" ? "finance" : "receipt")}</span>
          <span class="legacy-finance-copy"><strong>${escapeHtml(item.description || item.category || "Без описания")}</strong><small>${shortDate(item.date)} · ${escapeHtml(item.category || "Другое")}</small></span>
          <b class="${item.financeType === "income" ? "green" : "red"}">${item.financeType === "income" ? "+" : "−"}${money(item.amount)}</b>
          <button type="button" data-delete-finance="${item.financeType}" data-index="${item.sourceIndex}" aria-label="Удалить">${icon("trash")}</button>
        </article>`).join("")}</div>` : `<div class="legacy-finance-empty">Операций пока нет.</div>`}
    </section>
  </main>`;
}
function rublesInWords(value) {
  const n = Math.max(0, Math.round(Number(value) || 0));
  const oneM = ["","один","два","три","четыре","пять","шесть","семь","восемь","девять"];
  const oneF = ["","одна","две","три","четыре","пять","шесть","семь","восемь","девять"];
  const teen = ["десять","одиннадцать","двенадцать","тринадцать","четырнадцать","пятнадцать","шестнадцать","семнадцать","восемнадцать","девятнадцать"];
  const ten = ["","","двадцать","тридцать","сорок","пятьдесят","шестьдесят","семьдесят","восемьдесят","девяносто"];
  const hundred = ["","сто","двести","триста","четыреста","пятьсот","шестьсот","семьсот","восемьсот","девятьсот"];
  const form = (num, forms) => { const a=num%100,b=num%10; if(a>=11&&a<=19)return forms[2]; if(b===1)return forms[0]; if(b>=2&&b<=4)return forms[1]; return forms[2]; };
  const tri = (num, female=false) => { const out=[hundred[Math.floor(num/100)]]; const r=num%100; if(r>=10&&r<=19) out.push(teen[r-10]); else { out.push(ten[Math.floor(r/10)]); out.push((female?oneF:oneM)[r%10]); } return out.filter(Boolean); };
  if (!n) return "ноль рублей";
  const out=[]; const th=Math.floor(n/1000); const rest=n%1000;
  if (th) { out.push(...tri(th,true), form(th,["тысяча","тысячи","тысяч"])); }
  if (rest) { out.push(...tri(rest,false), form(rest,["рубль","рубля","рублей"])); } else { out.push("рублей"); }
  return out.join(" ");
}

function actDateText(value) {
  const date = value ? new Date(value) : new Date();
  const safe = Number.isFinite(date.getTime()) ? date : new Date();
  const day = safe.getDate();
  const month = new Intl.DateTimeFormat("ru-RU", { month: "long" }).format(safe);
  return `«${day}» ${month} ${safe.getFullYear()} г.`;
}

function actWarrantyHtml(order = {}) {
  const months = Number(order.guarantee) || 0;
  if (months <= 0) return "";
  const targets = normalizeWarrantyTargets(order).map((target) => target.name).filter(Boolean);
  const extra = String(order.guaranteeNote || "").trim();
  const parts = [];
  if (targets.length) parts.push(`Гарантия распространяется на: ${targets.map(escapeHtml).join(", ")}.`);
  if (extra) parts.push(escapeHtml(extra));
  return `<section class="act-guarantee">
    <b>Гарантия: ${months} мес.</b>
    ${parts.length ? `<span>${parts.join(" ")}</span>` : ""}
  </section>`;
}

function actPage() {
  const orders = ordersNewestFirst().filter((item) => !item.archived);
  if (orders.length && !orders.some((item) => String(item.id) === String(selectedActOrderId))) selectedActOrderId = String(orders[0].id);
  const order = orders.find((item) => String(item.id) === String(selectedActOrderId));
  const actItems = order
    ? (Array.isArray(order.services) ? order.services.map((item) => ({ ...item, actType: "service" })) : [])
    : [];
  if (order && !actItems.length) actItems.push({ name: "Ремонт техники", qty: 1, price: Number(order.sum) || 0, actType: "service" });

  const itemsTotal = actItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.qty) || 1), 0);
  const actTotal = Number(order?.sum) || itemsTotal;
  const amountWords = rublesInWords(actTotal);
  const contractDate = order ? actDateText(orderDateValue(order)) : "";
  const acceptanceDate = order ? actDateText(order.completed || order.updatedAt || new Date()) : "";
  const blank = (value) => String(value || "").trim() ? escapeHtml(String(value).trim()) : "&nbsp;";
  const executorName = String(data.settings.name || "").trim();
  const customerName = String(order?.name || "").trim();

  return `<main class="content legacy-act-page">
    <div class="legacy-subpage-head legacy-act-head no-print">
      <button type="button" class="legacy-back-button" data-action="more-menu" aria-label="Назад">${icon("back")}</button>
      <div><h1>Акт</h1><p>Предпросмотр перед сохранением</p></div>
    </div>

    <section class="legacy-act-control no-print">
      <div class="legacy-act-control-title"><span>${icon("document")}</span><div><h2>Акт выполненных работ</h2><small>Предпросмотр · сохранение картинкой</small></div></div>
      <label><span>ВЫБЕРИТЕ ЗАЯВКУ</span><select class="field" id="act-order-select"><option value="">— Заявка —</option>${orders.map((item) => `<option value="${escapeHtml(item.id)}" ${String(item.id) === String(selectedActOrderId) ? "selected" : ""}>№${escapeHtml(item.id)} ${escapeHtml(item.name || "Без имени")} — ${escapeHtml(item.tech || "Техника")} (${shortDate(orderDateValue(item))})</option>`).join("")}</select></label>
      ${order ? `<div class="legacy-act-selected">
        <span class="legacy-act-selected-icon">${icon(applianceIconName(order.tech))}</span>
        <span><small>В АКТЕ</small><strong>№${escapeHtml(order.id || "—")} · ${escapeHtml(order.name || "Клиент")}</strong><em>${escapeHtml([order.tech, order.brand].filter(Boolean).join(" · ") || "Техника")} · ${money(actTotal)}</em></span>
      </div>` : ""}
      <div class="legacy-act-control-actions single">
        <button type="button" class="legacy-orange-button" data-action="save-act-image" ${order ? "" : "disabled"}>${icon("download")}<span>Сохранить картинку</span></button>
      </div>
    </section>

    ${order ? `<div class="legacy-act-preview">
      <article class="act-sheet" data-act-order-id="${escapeHtml(order.id || "")}">
        <h2>АКТ ВЫПОЛНЕННЫХ РАБОТ</h2>
        <div class="act-contract-line">по договору №${escapeHtml(order.id || "")} от ${contractDate}</div>

        <div class="act-main-fields">
          <div><b>Тип, модель техники:</b><span>${blank([order.tech, order.brand].filter(Boolean).join(" "))}</span></div>
          <div><b>Неисправность со слов клиента:</b><span>${blank(order.issue)}</span></div>
          <div><b>Результат диагностики:</b><span>${blank(order.diagnosis)}</span></div>
          <div><b>Внешние дефекты:</b><span>${blank(order.defects)}</span></div>
        </div>

        <table class="act-work-table"><thead><tr><th>п/п</th><th>Наименование работ</th><th>Стоимость</th><th>Кол-во</th><th>Сумма</th></tr></thead><tbody>${actItems.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.name || "Услуга")}</td><td>${money(item.price)}</td><td>${Number(item.qty) || 1}</td><td>${money((Number(item.price) || 0) * (Number(item.qty) || 1))}</td></tr>`).join("")}</tbody></table>

        ${actWarrantyHtml(order)}

        <div class="act-totals">
          <div><b>Общая стоимость:</b><strong>${money(itemsTotal || actTotal)}</strong></div>
          <div><b>Итого к оплате:</b><strong>${money(actTotal)}</strong></div>
          <div class="act-total-words"><b>Сумма прописью:</b><span>${escapeHtml(amountWords)}</span></div>
        </div>

        <section class="act-acceptance">
          <h3>АКТ СДАЧИ-ПРИЕМКИ ОКАЗАННЫХ УСЛУГ</h3>
          <div class="act-acceptance-date">от ${acceptanceDate}</div>
          <p>Мы, нижеподписавшиеся, <b>Исполнитель ${blank(executorName)}</b> с одной стороны, и представитель Заказчика <b>${blank(customerName)}</b> с другой стороны, составили настоящий Акт о том, что в соответствии с настоящим договором Исполнителем выполнен в полном объёме перечень работ по обслуживанию оборудования, указанного в данном договоре. С условиями обслуживания и оплаты Заказчик ознакомлен. К качеству работ (услуг) и состоянию оборудования Заказчик претензий не имеет.</p>
          <div class="act-signatures">
            <div><b>Исполнитель:</b><br>Ф.И.О.: ${blank(executorName)}<br>Подпись: ____________<br><br>Адрес оказания услуг:<br>${blank(order.address)}</div>
            <div><b>Заказчик:</b><br>Ф.И.О.: ${blank(customerName)}<br>Телефон: ${blank(order.phone)}<br>Подпись: ____________</div>
          </div>
        </section>
      </article>
    </div>` : emptyState("document", "Нет заявки для акта", "Сначала создай или импортируй заявку.")}
  </main>`;
}

function goodsPage() {
  const sheets = Array.isArray(data.goods_sheets)
    ? [...data.goods_sheets].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))
    : [];
  const latest = sheets[0] || null;
  const latestItems = latest && Array.isArray(latest.items) ? latest.items : [];
  const closedOrders = ordersNewestFirst().filter((order) => !order.archived && normalizeStatus(order.status) === "closed");
  const productPrice = data.receipt_prices
    .filter((item) => item.kind === "material" || String(item.category || "").toLowerCase().includes("товар"))
    .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ru"));

  return `<main class="content goods-content legacy-goods-page">
    <div class="legacy-subpage-head">
      <button type="button" class="legacy-back-button" data-action="more-menu" aria-label="Назад">${icon("back")}</button>
      <div><h1>Товарник</h1><p>Товары и материалы · отдельный расчёт</p></div>
    </div>

    <section class="legacy-goods-panel legacy-goods-new">
      <div class="legacy-section-title"><span class="legacy-section-icon">${icon("goods")}</span><h2>Новый товарник</h2></div>
      <div class="legacy-goods-create-grid">
        <button type="button" class="legacy-purple-button" data-action="new-goods-sheet"><span>${icon("plus")}</span>Создать вручную</button>
        <button type="button" class="legacy-dark-button" data-action="new-goods-from-order">${icon("document")}<span>Из закрытой<br>заявки</span></button>
      </div>
      <label class="legacy-goods-order-source">
        <span>ЗАЯВКА ДЛЯ АВТОЗАПОЛНЕНИЯ</span>
        <select class="field" id="goods-source-order">
          <option value="">— Выберите заявку —</option>
          ${closedOrders.map((order) => `<option value="${escapeHtml(order.id)}">№${escapeHtml(order.id)} · ${escapeHtml(order.name || "Клиент")} · ${escapeHtml(order.tech || "Техника")}</option>`).join("")}
        </select>
      </label>
      <p class="legacy-goods-help">Отдельный расчёт товаров — склад и статистика не изменяются.</p>
    </section>

    <section class="legacy-goods-panel legacy-goods-current">
      <div class="legacy-section-title"><span class="legacy-section-icon">${icon("edit")}</span><h2>${latest ? "Последний товарник" : "Товарник"}</h2></div>
      ${latest ? `
        <div class="legacy-goods-current-summary"><span><strong>${escapeHtml(latest.title || "Товарник")}</strong><small>${latestItems.length} позиций</small></span><b>${money(latest.total || 0)}</b></div>
        <div class="legacy-section-subtitle"><span class="legacy-section-icon small">${icon("document")}</span><h3>Позиции</h3></div>
        <div class="legacy-goods-position-list">
          ${latestItems.slice(0,6).map((item) => `<div class="legacy-goods-position"><span><strong>${escapeHtml(item.name || "Товар")}</strong><small>${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(Number(item.qty)||0)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))} · ${money(item.price || 0)} / ед.</small></span><b>${money((Number(item.qty)||0)*(Number(item.price)||0))}</b></div>`).join("")}
          ${latestItems.length > 6 ? `<div class="legacy-goods-more">Ещё ${latestItems.length - 6} поз.</div>` : ""}
        </div>
        <button type="button" class="legacy-open-editor" data-action="edit-goods-sheet" data-id="${escapeHtml(latest.id)}">Открыть редактирование</button>
      ` : `<div class="legacy-goods-empty">Создай товарник вручную или выбери закрытую заявку для автозаполнения.</div>`}
    </section>

    <details class="legacy-goods-panel legacy-product-price" id="product-price-panel">
      <summary><span class="legacy-section-title"><span class="legacy-section-icon">${icon("goods")}</span><h2>Прайс товаров</h2></span><span class="legacy-price-chevron">${icon("chevron")}</span></summary>
      ${productPrice.length ? `<div class="legacy-product-price-list">${productPrice.map((item) => `<div><span><strong>${escapeHtml(item.name || "Без названия")}</strong><small>${escapeHtml(item.category || "Товар")}</small></span><b>${money(item.price || 0)}</b></div>`).join("")}</div>` : `<p class="legacy-goods-help">В прайс-листе пока нет товарных позиций.</p>`}
    </details>
  </main>`;
}
function orderSourcesModal() {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop source-manager-backdrop";
  modal.innerHTML = `<section class="modal compact-modal source-manager-modal" role="dialog" aria-modal="true" aria-label="Источники заявок">
    <div class="source-manager-head">
      <div><small>НАСТРОЙКИ</small><h2>Источники заявок</h2></div>
      <button type="button" data-close-modal aria-label="Закрыть">${icon("close")}</button>
    </div>
    <div id="source-manager-list" class="source-manager-list"></div>
    <div class="source-manager-add">
      <input class="field" id="new-source-name" placeholder="Новый источник" />
      <button type="button" class="primary-button" id="add-order-source">${icon("plus")}<span>Добавить</span></button>
    </div>
  </section>`;
  document.body.appendChild(modal);

  const renderList = () => {
    const list = modal.querySelector("#source-manager-list");
    const sources = [...(data.order_sources || [])]
      .sort((a,b)=>Number(Boolean(a.archived))-Number(Boolean(b.archived)) || String(a.name||"").localeCompare(String(b.name||""),"ru"));
    list.innerHTML = sources.length ? sources.map((source)=>`<div class="source-manager-row ${source.archived ? "archived" : ""}" data-source-id="${escapeHtml(source.id)}">
      <input class="field" data-source-name value="${escapeHtml(source.name || "")}" aria-label="Название источника" />
      <button type="button" data-source-archive aria-label="${source.archived ? "Вернуть источник" : "Архивировать источник"}">${icon(source.archived ? "restore" : "archive")}</button>
    </div>`).join("") : `<div class="empty">Источников пока нет</div>`;
  };

  const close = () => {
    modal.remove();
    syncModalScrollLock();
  };
  modal.querySelector("[data-close-modal]").addEventListener("click", close);
  modal.addEventListener("click", async (event) => {
    if (event.target === modal) return close();
    const archiveButton = event.target.closest("[data-source-archive]");
    if (!archiveButton) return;
    const row = archiveButton.closest("[data-source-id]");
    const source = data.order_sources.find((item)=>String(item.id)===String(row?.dataset.sourceId||""));
    if (!source) return;
    source.archived = !source.archived;
    await saveData();
    renderList();
  });
  modal.addEventListener("change", async (event) => {
    const input = event.target.closest("[data-source-name]");
    if (!input) return;
    const row = input.closest("[data-source-id]");
    const source = data.order_sources.find((item)=>String(item.id)===String(row?.dataset.sourceId||""));
    if (!source) return;
    const name = String(input.value || "").trim();
    if (!name) {
      input.value = source.name || "";
      return toast("Название источника не может быть пустым");
    }
    source.name = name;
    await saveData();
    renderList();
  });
  modal.querySelector("#add-order-source").addEventListener("click", async () => {
    const input = modal.querySelector("#new-source-name");
    const name = String(input.value || "").trim();
    if (!name) return toast("Напиши название источника");
    if ((data.order_sources || []).some((source)=>String(source.name||"").trim().toLowerCase()===name.toLowerCase() && !source.archived)) {
      return toast("Такой источник уже есть");
    }
    data.order_sources.push({ id: crypto.randomUUID(), name, archived: false });
    input.value = "";
    await saveData();
    renderList();
  });
  renderList();
  syncModalScrollLock();
}

function warrantyOptionsModal() {
  const modal = document.createElement("div");
  modal.className = "modal-backdrop warranty-manager-backdrop";
  const types = applianceTypes();
  let selectedTech = types[0] || "Другое";

  modal.innerHTML = `<section class="modal compact-modal warranty-manager-modal" role="dialog" aria-modal="true" aria-label="Гарантии по технике">
    <div class="warranty-manager-head">
      <div><small>НАСТРОЙКИ</small><h2>Гарантии по технике</h2></div>
      <button type="button" data-close-modal aria-label="Закрыть">${icon("close")}</button>
    </div>
    <div class="warranty-manager-tech">
      <label><span>Тип техники</span><select class="field" id="warranty-manager-tech">${types.map((tech) => `<option>${escapeHtml(tech)}</option>`).join("")}</select></label>
    </div>
    <div id="warranty-manager-list" class="warranty-manager-list"></div>
    <div class="warranty-manager-add">
      <input class="field" id="new-warranty-name" placeholder="Например, компрессор" />
      <button type="button" class="primary-button" id="add-warranty-option">${icon("plus")}<span>Добавить</span></button>
    </div>
  </section>`;
  document.body.appendChild(modal);

  const renderList = () => {
    const list = modal.querySelector("#warranty-manager-list");
    const options = warrantyOptionsForTech(selectedTech, { includeArchived: true });
    list.innerHTML = options.length
      ? options.map((option) => `<div class="warranty-manager-row ${option.archived ? "archived" : ""}" data-warranty-option-id="${escapeHtml(option.id)}">
          <input class="field" data-warranty-option-name value="${escapeHtml(option.name || "")}" aria-label="Пункт гарантии" />
          <button type="button" data-warranty-option-archive aria-label="${option.archived ? "Вернуть пункт" : "Архивировать пункт"}">${icon(option.archived ? "restore" : "archive")}</button>
        </div>`).join("")
      : `<div class="warranty-manager-empty">Для этого типа техники пунктов пока нет.</div>`;
  };

  const close = () => {
    modal.remove();
    syncModalScrollLock();
  };
  modal.querySelector("[data-close-modal]").addEventListener("click", close);
  modal.addEventListener("click", async (event) => {
    if (event.target === modal) return close();
    const archiveButton = event.target.closest("[data-warranty-option-archive]");
    if (!archiveButton) return;
    const row = archiveButton.closest("[data-warranty-option-id]");
    const option = data.warranty_options.find((item) => String(item.id) === String(row?.dataset.warrantyOptionId || ""));
    if (!option) return;
    option.archived = !option.archived;
    await saveData();
    renderList();
  });
  modal.addEventListener("change", async (event) => {
    if (event.target.id === "warranty-manager-tech") {
      selectedTech = event.target.value;
      renderList();
      return;
    }
    const input = event.target.closest("[data-warranty-option-name]");
    if (!input) return;
    const row = input.closest("[data-warranty-option-id]");
    const option = data.warranty_options.find((item) => String(item.id) === String(row?.dataset.warrantyOptionId || ""));
    if (!option) return;
    const name = String(input.value || "").trim();
    if (!name) {
      input.value = option.name || "";
      return toast("Пункт гарантии не может быть пустым");
    }
    option.name = name;
    await saveData();
    renderList();
  });
  modal.querySelector("#add-warranty-option").addEventListener("click", async () => {
    const input = modal.querySelector("#new-warranty-name");
    const name = String(input.value || "").trim();
    if (!name) return toast("Напиши, на что распространяется гарантия");
    if (warrantyOptionsForTech(selectedTech, { includeArchived: false })
      .some((option) => String(option.name || "").trim().toLowerCase() === name.toLowerCase())) {
      return toast("Такой пункт уже есть");
    }
    data.warranty_options.push({
      id: crypto.randomUUID(),
      tech: selectedTech,
      name,
      archived: false
    });
    input.value = "";
    await saveData();
    renderList();
  });

  renderList();
  syncModalScrollLock();
}

function settingsPage() {
  const settings = data.settings || {};
  return `<main class="content legacy-settings-page">
    <div class="legacy-subpage-head">
      <button type="button" class="legacy-back-button" data-action="more-menu" aria-label="Назад">${icon("back")}</button>
      <div><h1>Настройки</h1><p>Реквизиты и приложение</p></div>
    </div>

    <form class="legacy-settings-card settings-profile-card" id="settings-form">
      <div class="legacy-section-title"><span class="legacy-section-icon">${icon("settings")}</span><h2>Реквизиты исполнителя</h2></div>
      <div class="legacy-settings-grid">
        <label class="full"><span>НАЗВАНИЕ</span><input class="field" name="companyName" value="${escapeHtml(settings.companyName || "")}" placeholder="Ремонт бытовой техники" /></label>
        <label><span>ИСПОЛНИТЕЛЬ</span><input class="field" name="name" value="${escapeHtml(settings.name || "")}" placeholder="ФИО" /></label>
        <label><span>ТЕЛЕФОН</span><input class="field" name="phone" value="${escapeHtml(normalizeRussianPhone(settings.phone || "") || settings.phone || "")}" inputmode="tel" autocomplete="tel" maxlength="12" placeholder="+7XXXXXXXXXX" /></label>
        <label class="full"><span>АДРЕС</span><input class="field" name="companyAddress" value="${escapeHtml(settings.companyAddress || "")}" /></label>
        <label><span>ИНН</span><input class="field" name="inn" value="${escapeHtml(settings.inn || "")}" inputmode="numeric" /></label>
      </div>
      <button class="legacy-settings-save" type="submit">Сохранить реквизиты</button>
    </form>

    <section class="legacy-settings-card settings-app-card">
      <div class="legacy-section-title"><span class="legacy-section-icon">${icon("document")}</span><h2>Приложение</h2></div>
      <div class="legacy-settings-list">
        <div class="legacy-settings-row"><span class="legacy-settings-row-icon">${icon("document")}</span><span><strong>CRM by Romanychev ${APP_VERSION}</strong><small>Сборка ${APP_BUILD}</small></span><button type="button" data-action="check-update">Обновить</button></div>
        <div class="legacy-settings-row"><span class="legacy-settings-row-icon">${icon("analytics")}</span><span><strong>Диагностика</strong><small>Кэш, база и хранилище</small></span><button type="button" data-action="run-diagnostics">Проверить</button></div>
        <div class="legacy-settings-row"><span class="legacy-settings-row-icon">${icon("backup")}</span><span><strong>Локальные данные</strong><small>${settings.lastBackupAt ? `Последний бэкап: ${new Date(settings.lastBackupAt).toLocaleString("ru-RU")}` : "Бэкап ещё не создавался"}</small></span><button type="button" data-action="protect-storage">Защитить</button></div>
      </div>
    </section>

    <section class="legacy-settings-card settings-data-card">
      <div class="legacy-section-title"><span class="legacy-section-icon">${icon("more")}</span><h2>Рабочие данные</h2></div>
      <label class="legacy-settings-toggle-row settings-search-toggle">
        <input type="checkbox" id="search-master-comment-toggle" ${settings.searchMasterComment ? "checked" : ""} />
        <span class="settings-checkbox"></span>
        <span><strong>Искать в комментарии мастера</strong><small>Включать внутренние заметки в глобальный поиск заявок</small></span>
      </label>
      <div class="legacy-settings-links">
        <button type="button" data-action="manage-order-sources"><span class="settings-link-icon">${icon("orders")}</span><span><strong>Источники заявок</strong><small>Добавить, переименовать или архивировать</small></span><b>${activeOrderSources().length}</b><span class="chevron">${icon("chevron")}</span></button>
        <button type="button" data-action="manage-warranty-options"><span class="settings-link-icon">${icon("shield")}</span><span><strong>Гарантии по технике</strong><small>Списки пунктов для каждого типа</small></span><b>${(data.warranty_options || []).filter((item) => !item.archived).length}</b><span class="chevron">${icon("chevron")}</span></button>
        <button type="button" data-more="tools"><span class="settings-link-icon">${icon("tools")}</span><span><strong>Инструменты</strong><small>Рабочее оснащение</small></span><b>${data.tools.length}</b><span class="chevron">${icon("chevron")}</span></button>
        <button type="button" data-more="receipts"><span class="settings-link-icon">${icon("receipt")}</span><span><strong>Документы и чеки</strong><small>Квитанции и документы CRM</small></span><b>${data.receipts.length}</b><span class="chevron">${icon("chevron")}</span></button>
        <button type="button" data-more="backup"><span class="settings-link-icon">${icon("backup")}</span><span><strong>Бэкапы</strong><small>Импорт, экспорт и защита данных</small></span><b>${data.orders.length + data.warehouse.length}</b><span class="chevron">${icon("chevron")}</span></button>
      </div>
    </section>
  </main>`;
}

function looksLikeOrderDraft(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  return ["name", "phone", "tech", "brand", "services", "materials", "sum", "issue", "diagnosis"].some((key) => key in value);
}

function draftRecords() {
  if (Array.isArray(data.draft)) {
    return data.draft.map((value, index) => ({
      key: String(index),
      value: value && typeof value === "object" ? value : { value },
      storage: "array"
    }));
  }
  if (looksLikeOrderDraft(data.draft)) {
    return [{ key: "__root__", value: data.draft, storage: "root" }];
  }
  if (data.draft && typeof data.draft === "object") {
    return Object.entries(data.draft).map(([key, value]) => ({
      key,
      value: value && typeof value === "object" ? value : { value },
      storage: "object"
    }));
  }
  return [];
}

function draftSummary(item = {}) {
  const title = item.title || item.name || item.client || item.customer || item.label || "Черновик";
  const date = item.updatedAt || item.updated || item.date || item.createdAt || item.created || "";
  const tech = item.tech || item.appliance || item.device || "";
  const brand = item.brand || item.model || "";
  const phone = item.phone || item.tel || "";
  const sum = Number(item.sum ?? item.total ?? item.amount) || 0;
  return { title, date, tech, brand, phone, sum };
}

function draftsPage() {
  const drafts = draftRecords().sort((a, b) => new Date(draftSummary(b.value).date || 0) - new Date(draftSummary(a.value).date || 0));
  return `<main class="content legacy-service-page legacy-drafts-page">
    <div class="legacy-subpage-head">
      <button type="button" class="legacy-back-button" data-action="more-back" aria-label="Назад">${icon("back")}</button>
      <div><h1>Черновики</h1><p>Незавершённые заявки</p></div>
    </div>
    <div class="legacy-service-note">Сохранённые незавершённые заявки. Продолжи работу или удали ненужное.</div>
    ${drafts.length ? `<div class="legacy-service-list">${drafts.map((record) => {
      const view = draftSummary(record.value);
      const meta = [view.tech, view.brand, view.phone, view.date ? shortDate(view.date) : ""].filter(Boolean).join(" · ");
      return `<article class="legacy-draft-card">
        <span class="legacy-draft-icon">${icon("drafts")}</span>
        <div class="legacy-draft-copy"><em>ЧЕРНОВИК</em><strong>${escapeHtml(view.title)}</strong><small>${escapeHtml(meta || "Старый формат черновика")}</small></div>
        ${view.sum ? `<b>${money(view.sum)}</b>` : ""}
        <div class="legacy-draft-actions"><button type="button" data-action="continue-draft" data-key="${escapeHtml(record.key)}">${icon("edit")}<span>Продолжить</span></button><button type="button" class="danger" data-action="delete-draft" data-key="${escapeHtml(record.key)}">${icon("trash")}<span>Удалить</span></button></div>
      </article>`;
    }).join("")}</div>` : `<div class="legacy-service-empty">Черновиков пока нет.</div>`}
  </main>`;
}

function getDraftRecord(key) {
  if (Array.isArray(data.draft)) {
    const index = Number(key);
    return Number.isInteger(index) && index >= 0 && index < data.draft.length ? data.draft[index] : null;
  }
  if (key === "__root__" && looksLikeOrderDraft(data.draft)) return data.draft;
  if (data.draft && typeof data.draft === "object") return data.draft[key] ?? null;
  return null;
}

function removeDraftRecord(key) {
  if (Array.isArray(data.draft)) {
    const index = Number(key);
    if (Number.isInteger(index) && index >= 0 && index < data.draft.length) data.draft.splice(index, 1);
    return;
  }
  if (key === "__root__" && looksLikeOrderDraft(data.draft)) { data.draft = []; return; }
  if (data.draft && typeof data.draft === "object") delete data.draft[key];
}
function receiptSummary(item = {}) {
  const title = item.title || item.name || item.type || item.kind || "Документ";
  const number = item.number || item.no || item.receiptNumber || item.receipt_no || "";
  const date = item.date || item.createdAt || item.created || item.timestamp || "";
  const amount = Number(item.amount ?? item.sum ?? item.total ?? item.price) || 0;
  const orderId = item.orderId || item.order_id || item.order || "";
  const note = item.note || item.comment || item.description || "";
  return { title, number, date, amount, orderId, note };
}

function receiptsPage() {
  const receipts = Array.isArray(data.receipts) ? data.receipts : [];
  const receiptEntries = receipts
    .map((item, index) => ({ item, index, view: receiptSummary(item) }))
    .sort((a, b) => new Date(b.view.date || b.item.updatedAt || 0) - new Date(a.view.date || a.item.updatedAt || 0));
  const total = receipts.reduce((sum, item) => sum + receiptSummary(item).amount, 0);
  const linked = receipts.filter((item) => receiptSummary(item).orderId).length;
  return `<main class="content legacy-service-page legacy-receipts-page">
    <div class="legacy-subpage-head legacy-service-head-with-add">
      <button type="button" class="legacy-back-button" data-action="more-back" aria-label="Назад">${icon("back")}</button>
      <div><h1>Документы</h1><p>Квитанции, чеки и документы</p></div>
      <button type="button" class="legacy-page-add" data-action="new-receipt" aria-label="Новый документ">${icon("plus")}</button>
    </div>
    <section class="legacy-service-stats receipts-stats">
      <div class="service-stat-primary"><span>ДОКУМЕНТОВ</span><strong>${receipts.length}</strong><small>всего сохранено</small></div>
      <div><span>СУММА</span><strong class="blue">${money(total)}</strong><small>по документам</small></div>
      <div><span>К ЗАЯВКАМ</span><strong class="green">${linked}</strong><small>связанных</small></div>
    </section>
    ${receipts.length ? `<div class="legacy-service-list">${receiptEntries.map(({ index, view }) => {
      const meta = [view.number ? `№${view.number}` : "", view.date ? shortDate(view.date) : "", view.orderId ? `заявка №${view.orderId}` : ""].filter(Boolean).join(" · ");
      return `<button type="button" class="legacy-document-row receipt ${view.orderId ? "linked" : "standalone"}" data-action="edit-receipt" data-index="${index}">
        <span class="legacy-document-icon">${icon("receipt")}</span>
        <span><strong>${escapeHtml(view.title)}</strong><small>${escapeHtml(meta || view.note || "Без дополнительных данных")}</small></span>
        <b>${view.amount ? money(view.amount) : "—"}</b>
        <span class="chevron">${icon("chevron")}</span>
      </button>`;
    }).join("")}</div>` : `<div class="legacy-service-empty">Документов пока нет.</div>`}
  </main>`;
}

function toolsPage() {
  const tools = Array.isArray(data.tools) ? data.tools : [];
  const toolEntries = tools
    .map((item, index) => ({ item, index }))
    .sort((a, b) => String(a.item.name || a.item.title || a.item.tool || "").localeCompare(String(b.item.name || b.item.title || b.item.tool || ""), "ru"));
  const active = tools.filter((item) => String(item.status || item.state || "").toLowerCase() !== "списан").length;
  return `<main class="content legacy-service-page legacy-tools-page">
    <div class="legacy-subpage-head legacy-service-head-with-add">
      <button type="button" class="legacy-back-button" data-action="more-back" aria-label="Назад">${icon("back")}</button>
      <div><h1>Инструменты</h1><p>Рабочий инструмент и оборудование</p></div>
      <button type="button" class="legacy-page-add" data-action="new-tool" aria-label="Добавить инструмент">${icon("plus")}</button>
    </div>
    <section class="legacy-service-stats two tools-stats">
      <div class="service-stat-primary"><span>ИНСТРУМЕНТОВ</span><strong>${tools.length}</strong><small>в учёте</small></div>
      <div><span>АКТИВНЫХ</span><strong class="green">${active}</strong><small>доступно в работе</small></div>
    </section>
    ${tools.length ? `<div class="legacy-service-list">${toolEntries.map(({item,index}) => {
      const name = item.name || item.title || item.tool || "Инструмент";
      const status = item.status || item.state || "В наличии";
      const category = item.category || item.type || "";
      const statusKey = String(status).toLowerCase();
      const toolState = statusKey.includes("спис")
        ? "retired"
        : statusKey.includes("выезд") || statusKey.includes("ремонт") || statusKey.includes("занят")
          ? "busy"
          : "available";
      return `<button type="button" class="legacy-document-row tool ${toolState}" data-action="edit-tool" data-index="${index}">
        <span class="legacy-document-icon">${icon("tools")}</span>
        <span><strong>${escapeHtml(name)}</strong><small>${escapeHtml([category,status].filter(Boolean).join(" · "))}${item.serial || item.serialNumber ? ` · № ${escapeHtml(item.serial || item.serialNumber)}` : ""}</small></span>
        <b>${item.price || item.purchasePrice ? money(item.price || item.purchasePrice) : ""}</b>
        <span class="chevron">${icon("chevron")}</span>
      </button>`;
    }).join("")}</div>` : `<div class="legacy-service-empty">Инструментов пока нет.</div>`}
  </main>`;
}

async function backupSettings() {
  const directory = await dbGet(DIRECTORY_KEY);
  const rollback = await dbGet(PRE_IMPORT_KEY);
  return `<main class="content legacy-service-page legacy-backup-page">
    <div class="legacy-subpage-head">
      <button type="button" class="legacy-back-button" data-action="more-back" aria-label="Назад">${icon("back")}</button>
      <div><h1>Бэкапы</h1><p>Резервные копии и восстановление</p></div>
    </div>

    <section class="legacy-settings-card backup-primary-card">
      <div class="legacy-section-title"><span class="legacy-section-icon">${icon("backup")}</span><h2>Сохранение и восстановление</h2></div>
      <div class="legacy-backup-main-actions">
        <button type="button" class="legacy-orange-button" data-action="download-backup">${icon("backup")}<span>Скачать бэкап</span></button>
        <button type="button" class="legacy-dark-button" data-action="import">${icon("document")}<span>Импорт JSON</span></button>
      </div>
      <div class="legacy-backup-grid">
        <button type="button" data-action="inspect-backup-file">Проверить файл</button>
        <button type="button" data-action="choose-folder">Выбрать папку</button>
        <button type="button" data-action="folder-backup">Сохранить в папку</button>
        <button type="button" data-action="backup-self-test">Самопроверка</button>
        <button type="button" data-action="restore-pre-import" ${rollback ? "" : "disabled"}>Откатить импорт</button>
      </div>
    </section>

    <section class="legacy-settings-card backup-auto-card">
      <div class="legacy-settings-list">
        <div class="legacy-settings-row plain"><span><strong>Папка</strong><small>${directory ? escapeHtml(directory.name) : "Не выбрана"}</small></span></div>
        <div class="legacy-settings-row plain"><span><strong>Автоматический бэкап</strong><small>Проверяется при открытии приложения</small></span><button type="button" class="toggle ${data.settings.autoBackup ? "on" : ""}" data-action="toggle-auto" role="switch" aria-checked="${Boolean(data.settings.autoBackup)}" aria-label="Автоматический бэкап"></button></div>
        <div class="legacy-settings-row plain"><span><strong>Периодичность</strong></span><select id="backup-days" aria-label="Периодичность автобэкапа">${[1,2,3,5,7,14].map((days) => `<option value="${days}" ${Number(data.settings.autoBackupDays) === days ? "selected" : ""}>${days === 1 ? "Каждый день" : `Раз в ${days} дней`}</option>`).join("")}</select></div>
        <div class="legacy-settings-row plain"><span><strong>Последний бэкап</strong><small>${data.settings.lastBackupAt ? new Date(data.settings.lastBackupAt).toLocaleString("ru-RU") : "Ещё не создавался"}</small></span></div>
      </div>
    </section>

    <section class="legacy-service-stats backup">
      <div><span>ЗАЯВКИ</span><strong>${data.orders.length}</strong></div>
      <div><span>СКЛАД</span><strong>${data.warehouse.length}</strong></div>
      <div><span>ПРАЙС</span><strong>${data.receipt_prices.length}</strong></div>
    </section>
  </main>`;
}

function shoppingItems() {
  return data.warehouse
    .filter((item) => !item.archived && Number(item.min || 0) > 0 && stockAvailableQuantity(item) <= Number(item.min || 0))
    .sort((a, b) => (stockAvailableQuantity(a) - Number(a.min || 0)) - (stockAvailableQuantity(b) - Number(b.min || 0)));
}

function shoppingListText() {
  const items = shoppingItems();
  const lines = items.map((item) => {
    const need = Math.max(0, Number(item.min || 0));
    const amount = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(need);
    return `• ${item.name || "Позиция"} — ${amount} ${normalizeStockUnit(item.unit || "шт")}`;
  });
  return ["Список покупок", ...lines].join("\n");
}

async function copyTextToClipboard(text, successMessage = "Скопировано") {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    textarea.remove();
  }
  toast(successMessage);
}

function warehouseMovementsPage() {
  const movementLabels = {
    initial: "Начальный остаток",
    in: "Приход",
    out: "Списание",
    manual_in: "Приход",
    manual_out: "Ручное списание",
    order_out: "Списано в заявку",
    order_return: "Возврат из заявки"
  };
  const incomingTypes = new Set(["initial", "in", "manual_in", "order_return"]);
  const source = [...data.warehouse_movements]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  const movements = source.filter((movement) => {
    const incoming = incomingTypes.has(movement.type);
    return warehouseMovementFilter === "all"
      || (warehouseMovementFilter === "in" && incoming)
      || (warehouseMovementFilter === "out" && !incoming);
  });
  const inCount = source.filter((movement) => incomingTypes.has(movement.type)).length;
  const outCount = source.length - inCount;

  return `<main class="content warehouse-support-content">
    <div class="support-page-head">
      <button type="button" class="support-back" data-action="warehouse-list" aria-label="Назад">${icon("back")}</button>
      <div><h1>История движения</h1><p>Приходы, списания и движения по заявкам</p></div>
    </div>

    <div class="movement-filter-chips">
      <button type="button" class="${warehouseMovementFilter === "all" ? "active" : ""}" data-movement-filter="all" aria-pressed="${warehouseMovementFilter === "all"}">Все <span>${source.length}</span></button>
      <button type="button" class="${warehouseMovementFilter === "in" ? "active" : ""}" data-movement-filter="in" aria-pressed="${warehouseMovementFilter === "in"}">Приход <span>${inCount}</span></button>
      <button type="button" class="${warehouseMovementFilter === "out" ? "active" : ""}" data-movement-filter="out" aria-pressed="${warehouseMovementFilter === "out"}">Расход <span>${outCount}</span></button>
    </div>

    <section class="movement-list">
      ${movements.length ? movements.map((movement) => {
        const item = data.warehouse.find((entry) => String(entry.id) === String(movement.warehouseId));
        const incoming = incomingTypes.has(movement.type);
        const sourceText = movement.orderId ? `Заявка №${escapeHtml(movement.orderId)}` : "Склад";
        return `<article class="movement-card ${incoming ? "incoming" : "outgoing"}">
          <span class="movement-icon ${incoming ? "incoming" : "outgoing"}">${icon(incoming ? "plus" : "minus")}</span>
          <div class="movement-copy"><strong>${escapeHtml(movement.name || item?.name || "Позиция")}</strong><small>${movementLabels[movement.type] || "Движение"} · ${sourceText}</small><time>${formatVisitDate(movement.date) || shortDate(movement.date)}</time></div>
          <b class="${incoming ? "green" : "red"}">${incoming ? "+" : "−"}${escapeHtml(movement.qty || 0)} ${escapeHtml(item?.unit || "шт.")}</b>
        </article>`;
      }).join("") : `<div class="panel empty warehouse-support-empty"><div class="empty-icon">${icon("history")}</div><h2>Движений нет</h2><p>Для выбранного фильтра записей пока нет.</p></div>`}
    </section>
  </main>`;
}

async function shareShoppingList() {
  const text = shoppingListText();
  if (!shoppingItems().length) return toast("Список покупок пуст");
  if (navigator.share) {
    try {
      await navigator.share({ title: "Список покупок", text });
      return;
    } catch (error) {
      if (error?.name === "AbortError") return;
    }
  }
  return copyTextToClipboard(text, "Список скопирован — можно отправить");
}

function shoppingPage(backAction = "more-menu") {
  const items = shoppingItems();
  return `<main class="content shopping-content"><div class="support-page-head shopping-support-head"><button type="button" class="support-back" data-action="${backAction}" aria-label="Назад">${icon("back")}</button><div><h1>Список покупок</h1><p>Позиции ниже минимального остатка</p></div></div>
    <section class="shopping-summary"><span class="shopping-summary-icon">${icon("shopping")}</span><span><small>НУЖНО ДОКУПИТЬ</small><strong>${items.length} ${items.length === 1 ? "позицию" : items.length >= 2 && items.length <= 4 ? "позиции" : "позиций"}</strong></span></section>
    <div class="shopping-page-actions"><button type="button" class="secondary-button" data-action="share-shopping-list" ${items.length ? "" : "disabled"}>${icon("telegram")}<span>Поделиться</span></button><button type="button" class="primary-button" data-action="copy-shopping-list" ${items.length ? "" : "disabled"}>${icon("copy")}<span>Копировать список</span></button></div>
    ${items.length ? `<div class="shopping-list">${items.map((item) => {
      const available = stockAvailableQuantity(item);
      const need = Math.max(0, Number(item.min || 0));
      return `<article class="shopping-card legacy-shopping-card ${available <= 0 ? "critical" : "low"}"><span class="shopping-item-icon">${icon("box")}</span><div><div class="stock-name">${escapeHtml(item.name || "Позиция")}</div><div class="small">${escapeHtml(item.category || "Без категории")} · доступно ${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(available)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}</div></div><div class="shopping-need"><span>ДОКУПИТЬ</span><strong>${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(need)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}</strong></div></article>`;
    }).join("")}</div>` : emptyState("shopping", "Покупать пока нечего", "Все складские позиции выше минимального остатка.")}
  </main>`;
}
function calendarPage() {
  const now = new Date();
  const monthDate = new Date(now.getFullYear(), now.getMonth() + calendarMonthOffset, 1);
  const year = monthDate.getFullYear();
  const month = monthDate.getMonth();
  const monthName = new Intl.DateTimeFormat("ru-RU", { month: "long", year: "numeric" }).format(monthDate);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
  const todayKey = localDateInputValue();
  const dateKey = (day) => `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

  const visits = (data.orders || []).filter((order) => !order.archived && visitDateParts(order).date);
  const byDate = new Map();
  visits.forEach((order) => {
    const key = visitDateParts(order).date;
    if (!byDate.has(key)) byDate.set(key, []);
    byDate.get(key).push(order);
  });

  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;
  if (!String(calendarSelectedDate || "").startsWith(monthPrefix)) {
    calendarSelectedDate = dateKey(1);
  }
  const selectedOrders = [...(byDate.get(calendarSelectedDate) || [])]
    .sort((a, b) => visitSortTimestamp(a) - visitSortTimestamp(b));
  const allDay = selectedOrders.filter((order) => !visitDateParts(order).time);
  const timed = selectedOrders.filter((order) => visitDateParts(order).time);
  const outsideTimeline = timed.filter((order) => {
    const hour = Number(visitDateParts(order).time.slice(0, 2));
    return hour < 10 || hour > 22;
  });

  const dayCells = [
    ...Array.from({ length: firstWeekday }, () => '<span class="calendar-day-spacer"></span>'),
    ...Array.from({ length: daysInMonth }, (_, index) => {
      const day = index + 1;
      const key = dateKey(day);
      const items = byDate.get(key) || [];
      const hasVisits = items.length > 0;
      const past = key < todayKey;
      const future = key >= todayKey;
      const classes = [
        "calendar-day",
        key === todayKey ? "today" : "",
        key === calendarSelectedDate ? "selected" : "",
        hasVisits && past ? "has-past" : "",
        hasVisits && future ? "has-future" : ""
      ].filter(Boolean).join(" ");
      return `<button type="button" class="${classes}" data-calendar-date="${key}" aria-label="${day} ${monthName}">
        <span>${day}</span>${hasVisits ? `<i>${items.length}</i>` : ""}
      </button>`;
    })
  ].join("");

  const eventButton = (order, compact = false) => {
    const status = normalizeStatus(order.status);
    return `<button type="button" class="calendar-event ${status} ${compact ? "compact" : ""}" data-calendar-order="${escapeHtml(order.id)}">
      <strong>${escapeHtml(visitTimeRange(order))}</strong>
      <span>${escapeHtml(order.name || "Клиент")} · ${escapeHtml(order.tech || "Техника")}</span>
      <small>${escapeHtml(order.address || order.brand || "")}</small>
      <em>№${escapeHtml(order.id)}</em>
    </button>`;
  };

  const timeline = Array.from({ length: 13 }, (_, i) => 10 + i).map((hour) => {
    const events = timed.filter((order) => Number(visitDateParts(order).time.slice(0, 2)) === hour);
    return `<div class="calendar-hour-row">
      <time>${String(hour).padStart(2, "0")}:00</time>
      <div>${events.map((order) => eventButton(order)).join("")}</div>
    </div>`;
  }).join("");

  const selectedDateText = new Intl.DateTimeFormat("ru-RU", { weekday: "long", day: "numeric", month: "long" })
    .format(new Date(`${calendarSelectedDate}T12:00:00`));

  return `<main class="content legacy-calendar-page">
    <div class="legacy-subpage-head calendar-page-head">
      <button type="button" class="legacy-back-button" data-action="more-menu" aria-label="Назад">${icon("back")}</button>
      <div><h1>Календарь</h1><p>Визиты и расписание</p></div>
    </div>

    <section class="calendar-month-card">
      <div class="calendar-month-head">
        <button type="button" data-calendar-shift="-1" aria-label="Предыдущий месяц">${icon("back")}</button>
        <strong>${escapeHtml(monthName)}</strong>
        <button type="button" class="next" data-calendar-shift="1" aria-label="Следующий месяц">${icon("chevron")}</button>
      </div>
      <div class="calendar-weekdays">${["Пн","Вт","Ср","Чт","Пт","Сб","Вс"].map((day)=>`<span>${day}</span>`).join("")}</div>
      <div class="calendar-grid">${dayCells}</div>
      <div class="calendar-legend"><span class="future">Будущие</span><span class="past">Прошедшие</span></div>
    </section>

    <section class="calendar-day-card">
      <div class="calendar-day-head"><div><small>РАСПИСАНИЕ</small><h2>${escapeHtml(selectedDateText)}</h2></div><b>${selectedOrders.length}</b></div>
      ${allDay.length ? `<div class="calendar-all-day"><span>Без времени</span><div>${allDay.map((order)=>eventButton(order,true)).join("")}</div></div>` : ""}
      ${outsideTimeline.length ? `<div class="calendar-all-day outside"><span>Вне шкалы 10:00–22:00</span><div>${outsideTimeline.map((order)=>eventButton(order,true)).join("")}</div></div>` : ""}
      <div class="calendar-timeline">${timeline}</div>
      ${!selectedOrders.length ? `<div class="calendar-empty">На этот день визитов нет.</div>` : ""}
    </section>
  </main>`;
}

function moreMenu() {
  const primaryItems = [
    ["calendar", "calendar", "Календарь", "Визиты и расписание"],
    ["finance", "finance", "Финансы", "Доходы, расходы и результат"],
    ["shopping", "shoppingList", "Список покупок", "Что нужно докупить на склад"],
    ["clients", "clients", "Клиенты", "История обращений и ремонтов"],
    ["prices", "price", "Прайс-лист", "Каталог услуг и свои позиции"],
    ["act", "printer", "Акт", "Подготовка и печать документа"],
    ["goods", "tag", "Товарник", "Товары из заявки или вручную"],
    ["tools", "tools", "Инструменты", "Личный инструмент и оборудование"],
    ["settings", "settings", "Настройки", "Реквизиты, данные и приложение"]
  ];
  const extraItems = [];

  const card = ([id, iconName, name, description]) => {
    const attrs = id === "report" ? 'data-action="analytics-screen"' : `data-more="${id}"`;
    return `<button type="button" class="menu-item menu-${id}" ${attrs}>
      <span class="menu-icon menu-icon-${id}">${icon(iconName)}</span>
      <span class="menu-copy"><span class="menu-name">${name}</span><span class="menu-description">${description}</span></span>
      <span class="chevron">${icon("chevron")}</span>
    </button>`;
  };

  return `<main class="content more-content legacy-more-page">
    <div class="legacy-more-head"><h1>Ещё</h1><p>Рабочие разделы и настройки</p></div>
    <div class="menu-list legacy-more-list">${primaryItems.map(card).join("")}</div>
  </main>`;
}

async function morePage() {
  if (moreSection === "calendar") return calendarPage();
  if (moreSection === "shopping") return shoppingPage();
  if (moreSection === "backup") return backupSettings();
  if (moreSection === "prices") return priceList();
  if (moreSection === "clients") return clientsPage();
  if (moreSection === "finance") return financePage();
  if (moreSection === "goods") return goodsPage();
  if (moreSection === "tools") return toolsPage();
  if (moreSection === "receipts") return receiptsPage();
  if (moreSection === "drafts") return draftsPage();
  if (moreSection === "act") return actPage();
  if (moreSection === "settings") return settingsPage();
  return moreMenu();
}

async function render() {
  let page;
  if (activePage === "orders") page = ordersPage();
  if (activePage === "warehouse") page = warehouseSection === "movements" ? warehouseMovementsPage() : warehouseSection === "shopping" ? shoppingPage("warehouse-list") : warehousePage();
  if (activePage === "analytics") page = analyticsPage();
  if (activePage === "more") page = await morePage();
  app.innerHTML = `<div class="shell">${header()}${page}${nav()}</div>`;
}

const orderServiceRow = (item = {}) => {
  const price = Number(item.price) || 0;
  const basePrice = Number(item.basePrice ?? item.catalogPrice ?? item.price) || 0;
  return `<div class="line-item legacy-service-row" data-service-row data-base-price="${basePrice}">
    <span class="service-check">${icon("check")}</span>
    <input class="field service-name-field" data-line="name" value="${escapeHtml(item.name || "")}" placeholder="Название услуги" />
    <input class="field compact service-qty-field" data-line="qty" type="number" min="0.01" step="0.01" value="${Number(item.qty) || 1}" aria-label="Количество" />
    <div class="service-price-field"><input class="field compact" data-line="price" type="number" min="0" step="0.01" value="${price}" aria-label="Цена, рассчитывается автоматически" readonly title="Цена автоматически подгоняется под итоговую сумму заявки" /><span>₽</span></div>
    <button type="button" class="remove-line service-remove" data-remove-line aria-label="Удалить">${icon("trash")}</button>
  </div>`;
};

function fitServiceRowsToTarget(orderModal, targetValue) {
  const rows = [...orderModal.querySelectorAll("[data-service-row]")];
  const target = Math.max(0, Number(targetValue) || 0);
  if (!rows.length || target <= 0) return false;

  const source = rows.map((row) => {
    const qty = Math.max(0.01, Number(row.querySelector('[data-line="qty"]')?.value) || 1);
    const currentPrice = Math.max(0, Number(row.querySelector('[data-line="price"]')?.value) || 0);
    const basePrice = Math.max(0, Number(row.dataset.basePrice) || currentPrice);
    if (!(Number(row.dataset.basePrice) > 0) && basePrice > 0) row.dataset.basePrice = String(basePrice);
    return { row, qty, basePrice, baseTotal: basePrice * qty };
  });

  const baseTotal = source.reduce((sum, item) => sum + item.baseTotal, 0);
  const rawTotals = source.map((item) => baseTotal > 0
    ? target * item.baseTotal / baseTotal
    : target / source.length);
  const roundedTotals = rawTotals.map((value) => Math.max(0, Math.round(value / 10) * 10));
  const assigned = roundedTotals.reduce((sum, value) => sum + value, 0);
  const remainder = target - assigned;

  let mostExpensiveIndex = 0;
  rawTotals.forEach((value, index) => {
    if (value > rawTotals[mostExpensiveIndex]) mostExpensiveIndex = index;
  });
  roundedTotals[mostExpensiveIndex] = Math.max(0, roundedTotals[mostExpensiveIndex] + remainder);

  source.forEach((item, index) => {
    const priceInput = item.row.querySelector('[data-line="price"]');
    if (!priceInput) return;
    const unitPrice = roundedTotals[index] / item.qty;
    priceInput.value = Number.isInteger(unitPrice) ? String(unitPrice) : String(Number(unitPrice.toFixed(2)));
  });
  return true;
}

const orderMaterialRow = (item = {}) => {
  const directExpense = Boolean(item.directExpense || !item.warehouseId);
  const qty = Number(item.qty) || 1;
  const amount = Number(item.amount ?? (qty * (Number(item.unitCost) || 0))) || 0;
  if (directExpense) {
    return `<div class="line-item material-line legacy-material-card direct-expense-card" data-material-row data-direct-expense="true" data-warehouse-id="" data-write-off="false">
      <div class="material-card-head">
        <div><input class="field material-name-field" data-line="name" value="${escapeHtml(item.name || "")}" placeholder="Например, ремонт платы" /><small>Расход конкретной заявки · без склада</small></div>
        <button type="button" class="remove-line material-remove" data-remove-line aria-label="Удалить">${icon("trash")}</button>
      </div>
      <div class="direct-expense-controls">
        <label><span>Кол-во</span><input class="field compact" data-line="qty" type="number" min="0.01" step="0.01" value="${qty}" /></label>
        <label><span>Сумма</span><input class="field compact" data-line="amount" type="number" min="0" step="1" value="${amount}" inputmode="decimal" /></label>
        <label class="direct-expense-comment"><span>Комментарий</span><input class="field" data-line="comment" value="${escapeHtml(item.comment || "")}" placeholder="Необязательно" /></label>
      </div>
    </div>`;
  }
  const warehouseItem = data.warehouse.find((entry) => String(entry.id) === String(item.warehouseId));
  const storageUnit = normalizeStockUnit(item.storageUnit || warehouseItem?.unit || item.unit || "шт");
  const consumeUnit = normalizeStockUnit(item.unit || warehouseItem?.consumeUnit || storageUnit);
  const storageNote = storageUnit !== consumeUnit ? ` · хранение: ${storageUnit}` : "";
  return `<div class="line-item material-line legacy-material-card" data-material-row data-direct-expense="false" data-warehouse-id="${escapeHtml(item.warehouseId || "")}" data-unit="${escapeHtml(consumeUnit)}" data-storage-unit="${escapeHtml(storageUnit)}" data-write-off="${item.writeOff ? "true" : "false"}">
    <div class="material-card-head">
      <div><input class="field material-name-field" data-line="name" value="${escapeHtml(item.name || "")}" placeholder="Материал" /><small>Материал со склада${escapeHtml(storageNote)}</small></div>
      <button type="button" class="remove-line material-remove" data-remove-line aria-label="Удалить">${icon("trash")}</button>
    </div>
    <div class="material-card-controls">
      <label><span>Кол-во</span><input class="field compact" data-line="qty" type="number" min="0.01" step="0.01" value="${qty}" /></label>
      <label><span>Ед.</span><div class="field readonly-field material-unit">${escapeHtml(consumeUnit)}</div></label>
      <label><span>Себестоимость</span><input class="field compact" data-line="unit-cost" type="number" min="0" step="1" value="${Number(item.unitCost) || 0}" /></label>
    </div>
  </div>`;
};

function syncOrderStock(previousOrder = null, nextOrder = null) {
  const previousTotals = stockMaterialTotals(previousOrder?.materials);
  const nextTotals = stockMaterialTotals(nextOrder?.materials);
  const previousConsumed = orderConsumesStock(previousOrder) ? previousTotals : new Map();
  const nextConsumed = orderConsumesStock(nextOrder) ? nextTotals : new Map();
  const orderId = nextOrder?.id ?? previousOrder?.id ?? null;
  const ids = [...new Set([
    ...previousTotals.keys(),
    ...nextTotals.keys(),
    ...previousConsumed.keys(),
    ...nextConsumed.keys()
  ])];
  const changes = [];

  for (const warehouseId of ids) {
    const item = data.warehouse.find((entry) => String(entry.id) === String(warehouseId));
    if (!item) return { ok: false, message: "Позиция склада больше не найдена" };

    const previousConsumedQty = previousConsumed.get(warehouseId) || 0;
    const nextConsumedQty = nextConsumed.get(warehouseId) || 0;
    const consumptionDelta = nextConsumedQty - previousConsumedQty;
    const physical = Number(item.quantity) || 0;
    const otherReserved = stockReservedQuantity(warehouseId, { excludeOrderId: orderId });
    const availableBefore = Math.max(0, physical - otherReserved);

    if (consumptionDelta > availableBefore + 1e-9) {
      return {
        ok: false,
        message: `Недостаточно доступного остатка: ${item.name || "позиция"} · доступно ${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(availableBefore)} ${normalizeStockUnit(item.unit || "шт")}`
      };
    }

    const projectedPhysical = physical - consumptionDelta;
    if (orderReservesStock(nextOrder)) {
      const wantedReserve = nextTotals.get(warehouseId) || 0;
      const availableForOrder = Math.max(0, projectedPhysical - otherReserved);
      if (wantedReserve > availableForOrder + 1e-9) {
        return {
          ok: false,
          message: `Недостаточно для резерва: ${item.name || "позиция"} · доступно ${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(availableForOrder)} ${normalizeStockUnit(item.unit || "шт")}`
        };
      }
    }

    if (Math.abs(consumptionDelta) > 1e-9) {
      changes.push({ item, consumptionDelta });
    }
  }

  const date = new Date().toISOString();
  changes.forEach(({ item, consumptionDelta }) => {
    item.quantity = Math.max(0, (Number(item.quantity) || 0) - consumptionDelta);
    data.warehouse_movements.push({
      id: crypto.randomUUID(),
      warehouseId: item.id,
      orderId,
      name: item.name,
      qty: Math.abs(consumptionDelta),
      type: consumptionDelta > 0 ? "order_out" : "order_return",
      date
    });
  });

  return { ok: true };
}

function photoSource(photo) {
  let value = "";
  if (typeof photo === "string") value = photo;
  else if (photo && typeof photo === "object") value = photo.dataUrl || photo.data || photo.src || photo.base64 || "";
  value = String(value || "");
  if (value.startsWith("data:image/") || value.startsWith("blob:")) return value;
  if (value.length > 1000 && /^[A-Za-z0-9+/=\s]+$/.test(value)) {
    return `data:image/jpeg;base64,${value.replace(/\s/g, "")}`;
  }
  return "";
}

function photoLabel(photo, index) {
  if (photo && typeof photo === "object") return photo.name || photo.filename || photo.title || `Фото ${index + 1}`;
  return `Фото ${index + 1}`;
}

async function compressPhotoFile(file) {
  if (!file?.type?.startsWith("image/")) throw new Error("Можно добавлять только изображения");
  if (file.size > 20 * 1024 * 1024) throw new Error(`Слишком большой файл: ${file.name}`);
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error || new Error("Не удалось прочитать фото"));
    reader.readAsDataURL(file);
  });
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Не удалось открыть фото: ${file.name}`));
    img.src = source;
  });
  const maxSide = 1280;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || 1, image.naturalHeight || 1));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Не удалось обработать фото");
  context.drawImage(image, 0, 0, width, height);
  return {
    id: crypto.randomUUID(),
    name: file.name,
    type: "image/jpeg",
    dataUrl: canvas.toDataURL("image/jpeg", 0.72),
    createdAt: new Date().toISOString()
  };
}
function warrantyUntilText(order = {}) {
  const months = order.guarantee === undefined || order.guarantee === null || order.guarantee === ""
    ? 6
    : Number(order.guarantee);
  if (!Number.isFinite(months) || months <= 0) return "без гарантии";
  const base = new Date(order.completed || order.updatedAt || orderDateValue(order) || Date.now());
  if (Number.isNaN(base.getTime())) return "";
  base.setMonth(base.getMonth() + months);
  return `до ${new Intl.DateTimeFormat("ru-RU").format(base)}`;
}


function openServiceCatalog(orderModal, serviceCatalog) {
  const currentRows = [...orderModal.querySelectorAll("[data-service-row]")].map((row) => ({
    name: row.querySelector('[data-line="name"]').value.trim(),
    qty: Number(row.querySelector('[data-line="qty"]').value) || 1,
    price: Number(row.querySelector('[data-line="price"]').value) || 0,
    basePrice: Number(row.dataset.basePrice) || Number(row.querySelector('[data-line="price"]').value) || 0
  })).filter((item) => item.name);
  const currentByName = new Map(currentRows.map((item) => [item.name.toLowerCase(), item]));
  const catalogNames = new Set(serviceCatalog.map((item) => String(item.name || "").trim().toLowerCase()).filter(Boolean));
  const customRows = currentRows.filter((item) => !catalogNames.has(item.name.toLowerCase()));
  const selected = new Map();

  serviceCatalog.forEach((item, index) => {
    const existing = currentByName.get(String(item.name || "").trim().toLowerCase());
    if (existing) selected.set(index, { ...item, name: existing.name, qty: existing.qty, price: existing.price, basePrice: existing.basePrice || Number(item.price) || 0 });
  });

  const modal = document.createElement("div");
  modal.className = "modal-backdrop catalog-modal-backdrop";
  modal.innerHTML = `<div class="modal catalog-modal">
    <div class="catalog-modal-head"><div><div class="small">Каталог услуг · <span id="catalog-selected-count">0 выбрано</span></div><h2>Выбрать услуги</h2></div><button class="catalog-close" type="button" aria-label="Закрыть каталог">${icon("close")}</button></div>
    <div class="search-row search-with-icon catalog-search-row">${icon("search")}<input class="search" id="catalog-service-search" placeholder="Поиск услуги..." /></div>
    <div class="catalog-service-list" id="catalog-service-list"></div>
    <div class="catalog-fit-summary">
      <div><span>Выбрано:</span><strong id="catalog-selected-total">0 ₽</strong></div>
      <div><span>Цель:</span><strong id="catalog-target-total">0 ₽</strong></div>
      <div><span>Разница:</span><strong id="catalog-diff-total">0 ₽</strong></div>
    </div>
    <div class="catalog-modal-actions">
      <button class="secondary-button catalog-cancel" type="button">Отмена</button>
      <button class="primary-button" id="catalog-apply" type="button">Применить</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  const closeCatalog = () => {
    modal.remove();
    syncModalScrollLock();
  };

  const list = modal.querySelector("#catalog-service-list");
  const search = modal.querySelector("#catalog-service-search");
  const target = Number(orderModal.querySelector('[name="sum"]')?.value) || 0;

  const selectedTotal = () => [...selected.values()].reduce((sum, item) => sum + (Number(item.qty) || 1) * (Number(item.price) || 0), 0);
  const updateSummary = () => {
    const total = selectedTotal();
    modal.querySelector("#catalog-selected-total").textContent = money(total);
    const countEl = modal.querySelector("#catalog-selected-count");
    if (countEl) countEl.textContent = `${selected.size} выбрано`;
    modal.querySelector("#catalog-target-total").textContent = money(target);
    const diff = target - total;
    const diffEl = modal.querySelector("#catalog-diff-total");
    diffEl.textContent = `${diff > 0 ? "+" : ""}${money(diff)}`;
    diffEl.className = Math.abs(diff) < 0.01 ? "green" : diff < 0 ? "red" : "yellow";
  };

  const renderCatalog = () => {
    const query = search.value.trim().toLowerCase();
    const visible = serviceCatalog
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => !query || [item.name, item.category, item.tech].join(" ").toLowerCase().includes(query));

    const groups = visible.reduce((map, entry) => {
      const group = String(entry.item.category || entry.item.tech || "Услуги").trim() || "Услуги";
      if (!map.has(group)) map.set(group, []);
      map.get(group).push(entry);
      return map;
    }, new Map());

    list.innerHTML = groups.size ? [...groups.entries()].map(([group, entries]) => `
      <section class="catalog-service-group">
        <h3>${icon("folder")}<span>${escapeHtml(group)}</span></h3>
        ${entries.map(({ item, index }) => {
          const active = selected.has(index);
          const value = selected.get(index) || item;
          return `<label class="catalog-service-option ${active ? "selected" : ""}">
            <input type="checkbox" data-service-index="${index}" ${active ? "checked" : ""} />
            <span class="catalog-check">${active ? icon("check") : ""}</span>
            <span class="catalog-service-copy"><strong>${escapeHtml(item.name || "Услуга")}</strong><small>${escapeHtml(item.tech || item.category || "")}</small></span>
            <span class="catalog-service-price">${money(value.price || 0)}</span>
          </label>`;
        }).join("")}
      </section>`).join("") : `<div class="empty">Услуги не найдены</div>`;
    updateSummary();
  };

  const applySelection = () => {
    const chosen = [...selected.values()].map((item) => ({
      name: item.name || "Услуга",
      qty: Number(item.qty) || 1,
      price: Number(item.price) || Number(item.basePrice) || 0,
      basePrice: Number(item.basePrice ?? item.price) || 0
    }));

    const rows = [...customRows, ...chosen];
    orderModal.querySelector("#service-lines").innerHTML = rows.map(orderServiceRow).join("");
    const sumInput = orderModal.querySelector('[name="sum"]');
    if (sumInput) sumInput.dispatchEvent(new Event("input", { bubbles: true }));
    closeCatalog();
  };

  search.addEventListener("input", renderCatalog);
  list.addEventListener("change", (event) => {
    const checkbox = event.target.closest("[data-service-index]");
    if (!checkbox) return;
    const index = Number(checkbox.dataset.serviceIndex);
    const item = serviceCatalog[index];
    if (!item) return;
    if (checkbox.checked) {
      const existing = currentByName.get(String(item.name || "").trim().toLowerCase());
      selected.set(index, existing
        ? { ...item, ...existing, basePrice: Number(existing.basePrice) || Number(item.price) || 0 }
        : { ...item, qty: 1, price: Number(item.price) || 0, basePrice: Number(item.price) || 0 });
    } else {
      selected.delete(index);
    }
    renderCatalog();
  });
  modal.querySelector(".catalog-close").addEventListener("click", closeCatalog);
  modal.querySelector(".catalog-cancel").addEventListener("click", closeCatalog);
  modal.querySelector("#catalog-apply").addEventListener("click", applySelection);
  modal.addEventListener("click", (event) => { if (event.target === modal) closeCatalog(); });
  renderCatalog();
}

function materialCatalogTechTokens(tech = "") {
  const value = String(tech || "").toLowerCase();
  if (value.includes("коммер")) return ["коммер", "холод"];
  if (value.includes("холод") || value.includes("мороз")) return ["холод"];
  if (value.includes("стира")) return ["стира"];
  if (value.includes("посуд")) return ["посуд"];
  if (value.includes("сушил")) return ["сушил"];
  if (value.includes("плит") || value.includes("дух")) return ["плит", "дух"];
  if (value.includes("кондиц")) return ["кондиц"];
  if (value.includes("водонагр") || value.includes("бойлер")) return ["водонагр", "бойлер"];
  if (value.includes("мелк")) return ["мелк", "бытов"];
  return [];
}

function materialFitsTech(item, tech) {
  const compatibility = Array.isArray(item.compatibility) ? item.compatibility.map(String) : String(item.compatibility || "").split(",");
  const normalized = compatibility.map((value) => value.trim().toLowerCase()).filter(Boolean);
  if (!normalized.length) return true;
  if (normalized.some((value) => value.includes("универс") || value.includes("вся техник"))) return true;
  const tokens = materialCatalogTechTokens(tech);
  if (!tokens.length) return true;
  return normalized.some((value) => tokens.some((token) => value.includes(token)));
}

function openMaterialCatalog(orderModal) {
  const tech = String(orderModal.querySelector('[name="tech"]')?.value || "Техника");
  const orderId = String(orderModal.dataset.orderId || "") || null;
  const availableForOrder = (item) => stockAvailableQuantity(item, { excludeOrderId: orderId });
  const consumeUnitForItem = (item) => normalizeStockUnit(item.consumeUnit || item.unit || "шт");
  const availableForOrderInConsumeUnit = (item) => stockQtyFromStorage(availableForOrder(item), item.unit, consumeUnitForItem(item));
  const reservedInConsumeUnit = (item) => stockQtyFromStorage(stockReservedQuantity(item.id, { excludeOrderId: orderId }), item.unit, consumeUnitForItem(item));
  const source = data.warehouse.filter((item) => !item.archived && !item.hiddenFromOrders && materialFitsTech(item, tech));
  const modal = document.createElement("div");
  modal.className = "modal-backdrop material-catalog-backdrop";
  modal.innerHTML = `<section class="material-catalog-modal" aria-label="Каталог материалов">
    <header class="material-catalog-head">
      <span class="material-catalog-icon">${icon("price")}</span>
      <div class="material-catalog-title-copy"><strong>Каталог · ${escapeHtml(tech)}</strong><small id="material-catalog-selected-count">Ничего не выбрано</small></div>
      <button type="button" class="material-catalog-head-close" aria-label="Закрыть">${icon("close")}</button>
    </header>
    <div class="material-catalog-search search-row search-with-icon">${icon("search")}<input class="search" id="material-catalog-search" placeholder="Название товара" /></div>
    <div class="material-catalog-list" id="material-catalog-list"></div>
    <button type="button" class="material-catalog-close">${icon("check")}<span>Готово</span></button>
  </section>`;
  document.body.appendChild(modal);

  const list = modal.querySelector("#material-catalog-list");
  const search = modal.querySelector("#material-catalog-search");

  const render = () => {
    const query = String(search.value || "").trim().toLowerCase();
    const selectedCount = source.reduce((count, item) => {
      const existing = orderModal.querySelector(`[data-material-row][data-warehouse-id="${CSS.escape(String(item.id))}"]`);
      return count + (existing ? 1 : 0);
    }, 0);
    const selectedCountElement = modal.querySelector("#material-catalog-selected-count");
    if (selectedCountElement) selectedCountElement.textContent = selectedCount ? `${selectedCount} выбрано` : "Ничего не выбрано";
    const filtered = source.filter((item) => [item.name,item.category,item.unit].join(" ").toLowerCase().includes(query));
    const groups = [...filtered.reduce((map,item) => {
      const key = String(item.category || "Прочее").trim() || "Прочее";
      if(!map.has(key)) map.set(key,[]);
      map.get(key).push(item);
      return map;
    }, new Map()).entries()].sort(([a],[b]) => a.localeCompare(b,"ru"));

    list.innerHTML = groups.length ? groups.map(([category,items]) => `<section class="material-catalog-group">
      <h3>${escapeHtml(category)}</h3>
      <div>${items.sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"ru")).map((item) => {
        const existing = orderModal.querySelector(`[data-material-row][data-warehouse-id="${CSS.escape(String(item.id))}"]`);
        const available = availableForOrderInConsumeUnit(item);
        const reserved = reservedInConsumeUnit(item);
        const consumeUnit = consumeUnitForItem(item);
        return `<button type="button" class="material-catalog-row ${existing ? "selected" : ""} ${available <= 0 && !existing ? "unavailable" : ""}" data-material-id="${escapeHtml(item.id)}" ${available <= 0 && !existing ? "disabled" : ""}>
          <span><strong>${escapeHtml(item.name || "Без названия")}</strong><small>доступно ${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(available)} ${escapeHtml(consumeUnit)}${reserved > 0 ? ` · резерв ${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(reserved)} ${escapeHtml(consumeUnit)}` : ""}</small></span>
          <span class="material-catalog-side"><b>${money(item.price || item.lastPurchasePrice || 0)}</b>${existing ? `<span class="material-catalog-selected" aria-label="Уже в заявке">${icon("check")}</span>` : ""}</span>
        </button>`;
      }).join("")}</div>
    </section>`).join("") : `<div class="material-catalog-empty">Ничего не найдено.</div>`;
  };

  list.addEventListener("click", (event) => {
    const row = event.target.closest("[data-material-id]");
    if (!row) return;
    const item = data.warehouse.find((entry) => String(entry.id) === String(row.dataset.materialId));
    if (!item) return;
    const existing = orderModal.querySelector(`[data-material-row][data-warehouse-id="${CSS.escape(String(item.id))}"]`);
    const consumeUnit = consumeUnitForItem(item);
    const available = availableForOrderInConsumeUnit(item);
    if (existing) {
      const qty = existing.querySelector('[data-line="qty"]');
      const nextQty = (Number(qty.value) || 0) + 1;
      if (nextQty > available + 1e-9) return toast(`Доступно для резерва: ${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(available)} ${consumeUnit}`);
      qty.value = nextQty;
      qty.dispatchEvent(new Event("input", { bubbles:true }));
      toast("Количество увеличено");
    } else {
      if (available <= 0) return toast("Свободного остатка нет");
      orderModal.querySelector("#material-lines").insertAdjacentHTML("beforeend", orderMaterialRow({
        warehouseId:item.id,
        name:item.name,
        qty:Math.min(1, available),
        unit:consumeUnit,
        storageUnit:normalizeStockUnit(item.unit || consumeUnit),
        unitCost:(Number(item.lastPurchasePrice || item.price) || 0) * stockQtyToStorage(1, consumeUnit, item.unit || consumeUnit),
        tracking:item.tracking,
        writeOff:true
      }));
      const added = orderModal.querySelector(`[data-material-row][data-warehouse-id="${CSS.escape(String(item.id))}"]`);
      added?.querySelector('[data-line="qty"]')?.dispatchEvent(new Event("input", { bubbles:true }));
      toast("Материал добавлен");
    }
    render();
  });
  search.addEventListener("input", render);
  const closeMaterialCatalog = () => {
    modal.remove();
    syncModalScrollLock();
  };
  modal.querySelector(".material-catalog-close").addEventListener("click", closeMaterialCatalog);
  modal.querySelector(".material-catalog-head-close").addEventListener("click", closeMaterialCatalog);
  modal.addEventListener("click", (event) => { if(event.target === modal) closeMaterialCatalog(); });
  render();
}

function newOrderModal(existing = null, options = {}) {
  const forceNew = Boolean(options.forceNew);
  const sourceOrder = existing || {};
  const order = forceNew ? { ...structuredClone(sourceOrder), id: null, created: null } : sourceOrder;
  const services = Array.isArray(order.services) ? order.services : [];
  const materials = Array.isArray(order.materials) ? order.materials : [];
  const guaranteeMonths = order.guarantee === undefined || order.guarantee === null || order.guarantee === ""
    ? 6
    : Number(order.guarantee);
  const originalWarrantyTargets = normalizeWarrantyTargets(order);
  let orderPhotos = Array.isArray(order.photos) ? structuredClone(order.photos) : [];
  const serviceCatalog = availableServices();
  const visitParts = visitDateParts(order);
  const sourceOptions = activeOrderSources().map((source) => `<option value="${escapeHtml(source.id)}" ${String(order.sourceId || "") === String(source.id) ? "selected" : ""}>${escapeHtml(source.name)}</option>`).join("");
  const archivedSourceOption = order.sourceId && !activeOrderSources().some((source) => String(source.id) === String(order.sourceId))
    ? `<option value="${escapeHtml(order.sourceId)}" selected>${escapeHtml(orderSourceName(order) || "Архивный источник")}</option>`
    : "";
  const stockOptions = data.warehouse
    .filter((item) => !item.archived && !item.hiddenFromOrders)
    .map((item, index) => `<option value="${index}">${escapeHtml(item.name)} · ${escapeHtml(item.quantity || 0)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}</option>`).join("");
  const modal = document.createElement("div");
  modal.className = "modal-backdrop order-editor-backdrop";
  modal.innerHTML = `<form class="modal order-editor-modal" id="order-form" data-order-id="${escapeHtml(order.id || "")}">
    <div class="order-editor-head">
      <span class="order-editor-title-icon">${icon("orders")}</span>
      <div class="order-editor-title-copy"><small>${existing && !forceNew ? `ЗАЯВКА №${escapeHtml(order.id || "—")}` : "НОВАЯ ЗАЯВКА"}</small><h2>${existing && !forceNew ? "Редактирование" : "Создание заявки"}</h2></div>
      <button type="button" class="order-editor-close" data-close-modal aria-label="Закрыть">${icon("close")}</button>
    </div>
    <div class="order-editor-body">
    <section class="order-editor-section">
      <div class="form-section-title"><span class="order-editor-section-icon">${icon("clients")}</span><span>Клиент и техника</span></div>
      <div class="form-grid">
      <div class="form-group"><label>Клиент</label><input class="field" name="name" value="${escapeHtml(order.name || "")}" placeholder="Необязательно" /></div>
      <div class="form-group"><label>Телефон</label><input class="field" name="phone" value="${escapeHtml(normalizeRussianPhone(order.phone || "") || order.phone || "")}" inputmode="tel" autocomplete="tel" maxlength="12" placeholder="+7XXXXXXXXXX" /></div>
      <div class="form-group"><label>Техника</label><select class="field" name="tech">${applianceTypes().map((value) => `<option ${order.tech === value ? "selected" : ""}>${value}</option>`).join("")}</select></div>
      <div class="form-group"><label>Название техники</label><input class="field" name="brand" value="${escapeHtml(order.brand || "")}" placeholder="Samsung или Samsung RB37" /></div>
      <div class="client-match-slot full" id="client-match-slot"></div>
      <div class="form-group full"><label>Адрес</label><input class="field" name="address" value="${escapeHtml(order.address || "")}" /></div>
      <div class="form-group"><label>Источник заявки *</label><select class="field" name="sourceId"><option value="">Выбери источник</option>${sourceOptions}${archivedSourceOption}</select></div>
      <div class="form-group full"><label>Неисправность со слов клиента</label><textarea class="field textarea" name="issue">${escapeHtml(order.issue || "")}</textarea></div>
      <div class="form-group full"><label>Результат диагностики</label><textarea class="field textarea" name="diagnosis">${escapeHtml(order.diagnosis || "")}</textarea></div>
      <div class="form-group full"><label>Внешние дефекты</label><textarea class="field textarea compact-textarea" name="defects">${escapeHtml(order.defects || "")}</textarea></div>
      <div class="form-group"><label>Дата заявки</label><input class="field" name="createdDate" type="date" value="${escapeHtml(localDateInputValue(orderDateValue(order) || new Date()))}" /></div>
      <div class="form-group"><label>Дата визита</label><input class="field" name="nextVisitDate" type="date" value="${escapeHtml(visitParts.date)}" /></div>
      <div class="form-group"><label>Время визита</label><input class="field" name="nextVisitTime" type="time" value="${escapeHtml(visitParts.time)}" /></div>
      <div class="form-group"><label>Длительность</label><select class="field" name="nextVisitDuration">${[30,45,60,90,120,180].map((minutes) => `<option value="${minutes}" ${visitParts.duration === minutes ? "selected" : ""}>${minutes < 60 ? `${minutes} мин.` : minutes === 60 ? "1 час" : minutes === 90 ? "1 ч 30 мин." : `${minutes / 60} ч.`}</option>`).join("")}</select></div>
      <div class="form-group"><label>Статус</label><select class="field" name="status">${["В работе","Закрыта","Отказ"].map((value) => `<option ${normalizeStatus(order.status) === normalizeStatus(value) ? "selected" : ""}>${value}</option>`).join("")}</select></div>
      </div>
    </section>

    <section class="order-editor-section">
    <div class="form-section-title"><span class="order-editor-section-icon">${icon("tools")}</span><span>Работы и услуги</span></div>
    <button type="button" class="legacy-catalog-button legacy-service-catalog-open" id="open-service-catalog">${icon("shoppingList")}<span>Выбрать услуги из каталога</span></button>
    <div id="service-lines" class="line-list legacy-service-list">${services.map(orderServiceRow).join("")}</div>
    <div class="legacy-service-total"><span>Итого услуг</span><strong id="legacy-service-total">0 ₽</strong></div>
    </section>

    <section class="order-editor-section order-warranty-section">
      <div class="form-section-title"><span class="order-editor-section-icon">${icon("shield")}</span><span>Гарантия</span></div>
      <div class="warranty-term-row">
        <label><span>Срок</span><select class="field" name="guarantee"><option value="0" ${guaranteeMonths === 0 ? "selected" : ""}>Без гарантии</option><option value="3" ${guaranteeMonths === 3 ? "selected" : ""}>3 месяца</option><option value="6" ${guaranteeMonths === 6 ? "selected" : ""}>6 месяцев</option><option value="9" ${guaranteeMonths === 9 ? "selected" : ""}>9 месяцев</option><option value="12" ${guaranteeMonths === 12 ? "selected" : ""}>12 месяцев</option></select></label>
      </div>
      <div id="warranty-target-wrap" class="warranty-target-wrap">
        <div class="warranty-target-copy"><strong>На что распространяется</strong><small>Список зависит от типа техники</small></div>
        <div id="warranty-target-grid" class="warranty-target-grid"></div>
        <label class="warranty-extra"><span>Дополнительно</span><textarea class="field textarea compact-textarea" name="guaranteeNote" placeholder="Если нужного пункта нет — допиши своими словами">${escapeHtml(order.guaranteeNote || "")}</textarea></label>
      </div>
    </section>

    <section class="order-editor-section">
    <div class="form-section-title"><span class="order-editor-section-icon">${icon("warehouse")}</span><span>Запчасти и материалы</span></div>
    <p class="legacy-material-help">Выбери позицию со склада или добавь ручную — количество и себестоимость можно изменить.</p>
    <button type="button" class="legacy-stock-button material-catalog-open" id="open-material-catalog">${icon("warehouse")}<span>Выбрать со склада</span></button>
    <div id="material-lines" class="line-list">${materials.map(orderMaterialRow).join("")}</div>
    <button type="button" class="secondary-button wide direct-expense-add" id="add-manual-material">${icon("plus")}<span>Добавить расход без склада</span></button>
    </section>

    <section class="order-extra-details order-photo-details order-photo-static">
      <div class="order-photo-static-head"><span class="order-extra-summary-icon">${icon("camera")}</span><span>Фотографии</span></div>
      <div class="order-extra-body">
        <div class="form-group full order-photo-picker"><input class="order-photo-input" id="order-photo-input" type="file" accept="image/*" multiple /><label class="order-photo-add" for="order-photo-input">${icon("camera")}<span><b>Добавить фотографии</b><small>Открыть камеру или выбрать файлы</small></span></label><div class="small">Фото хранятся только в локальной CRM и бэкапе.</div></div>
        <div class="photo-grid" id="order-photo-list"></div>
      </div>
    </section>

    <section class="order-editor-section order-editor-payment-section">
    <div class="form-section-title"><span class="order-editor-section-icon">${icon("finance")}</span><span>Расчёт</span></div>
    <div class="calculated-total order-calculation-summary"><div><span>Услуги</span><strong id="service-total">0 ₽</strong></div><div><span>Без склада</span><strong id="material-total">0 ₽</strong></div><div class="calculation-grand"><span>Итог услуг</span><strong id="calculated-total">0 ₽</strong></div><button type="button" class="secondary-button" id="use-calculated-total">Подставить итог</button></div>

    <div class="form-grid legacy-payment-grid">
      <div class="form-group"><label>Итоговая сумма</label><input class="field" name="sum" type="number" min="0" value="${Number(order.sum) || 0}" /></div>
      <div class="form-group"><label>Предоплата</label><input class="field" name="prepay" type="number" min="0" value="${Number(order.prepay) || 0}" /></div>
      <div class="form-group"><label>Скидка</label><input class="field" name="discount" type="number" min="0" value="${Number(order.discount) || 0}" /></div>
      <div class="form-group"><label>Серый расход</label><input class="field" name="expense_gray" type="number" min="0" value="${Number(order.expense_gray) || 0}" /></div>
      <div class="form-group white-expense-group"><label>Белый расход</label><input class="field" name="expense_white" type="number" min="0" value="${Number(order.expense_white) || 0}" /><small class="white-expense-hint" id="white-expense-minimum">Минимум: 0 ₽</small></div>
      <div class="form-group"><label>Процент по заявке</label><input class="field" name="percent" type="number" min="0" max="100" value="${order.percent === undefined || order.percent === null || order.percent === "" ? 50 : Number(order.percent)}" /></div>
      <div class="form-group"><label>Метка</label><select class="field" name="tag"><option value="" ${!order.tag ? "selected" : ""}>Без</option>${order.tag ? `<option selected>${escapeHtml(order.tag)}</option>` : ""}</select></div>
    </div>
    </section>

    <section class="order-editor-section order-master-comment-section">
      <div class="form-section-title"><span class="order-editor-section-icon">${icon("document")}</span><span>Комментарий мастера</span></div>
      <div class="form-group order-comment"><textarea class="field textarea" name="comment" placeholder="Внутренняя заметка только для тебя">${escapeHtml(order.comment || "")}</textarea><small>Не попадает в акт и клиентские документы.</small></div>
    </section>
    </div>
    <div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  const formElement = modal.querySelector("form");
  const phoneInput = formElement.elements.phone;
  const clientMatchSlot = modal.querySelector("#client-match-slot");
  const applyKnownClient = () => {
    const normalized = sanitizeRussianPhoneField(phoneInput);
    if (!normalized || !isValidRussianPhone(normalized)) {
      if (clientMatchSlot) clientMatchSlot.innerHTML = "";
      return null;
    }
    const profile = clientProfileByPhone(normalized);
    const latest = latestOrderByPhone(normalized, { excludeOrderId: order.id || null });
    if (!profile && !latest) {
      if (clientMatchSlot) clientMatchSlot.innerHTML = "";
      return null;
    }
    const knownName = profile?.name || latest?.name || "";
    const knownAddress = profile?.lastAddress || latest?.address || "";
    if (!String(formElement.elements.name.value || "").trim() && knownName) formElement.elements.name.value = knownName;
    if (!String(formElement.elements.address.value || "").trim() && knownAddress) formElement.elements.address.value = knownAddress;
    if (clientMatchSlot) {
      const details = [
        profile?.note || "",
        latest ? `последняя заявка: ${money(latest.sum)}` : ""
      ].filter(Boolean).join(" · ");
      clientMatchSlot.innerHTML = `<div class="client-match-card">${icon("clients")}<span><strong>Клиент найден</strong><small>${escapeHtml(details || "История клиента найдена")}</small></span></div>`;
    }
    return { profile, latest };
  };
  phoneInput?.addEventListener("input", () => {
    sanitizeRussianPhoneField(phoneInput);
    if (isValidRussianPhone(phoneInput.value || "")) applyKnownClient();
  });
  phoneInput?.addEventListener("blur", () => {
    const normalized = sanitizeRussianPhoneField(phoneInput);
    if (normalized && !isValidRussianPhone(normalized)) return toast("Телефон: только российский номер +7XXXXXXXXXX");
    applyKnownClient();
  });
  applyKnownClient();

  const warrantyGrid = modal.querySelector("#warranty-target-grid");
  const warrantyWrap = modal.querySelector("#warranty-target-wrap");
  const guaranteeSelect = formElement.elements.guarantee;
  const renderWarrantyTargets = () => {
    const tech = String(formElement.elements.tech.value || "");
    const active = warrantyOptionsForTech(tech);
    const historical = originalWarrantyTargets.filter((target) => (!target.tech || target.tech === tech)
      && !active.some((option) => String(option.id) === String(target.id) || String(option.name) === String(target.name)));
    const rows = [
      ...active.map((option) => ({
        id: String(option.id || ""),
        name: String(option.name || ""),
        tech,
        archived: false,
        checked: originalWarrantyTargets.some((target) =>
          (target.id && String(target.id) === String(option.id))
          || (!target.id && String(target.name) === String(option.name)))
      })),
      ...historical.map((target) => ({ ...target, archived: true, checked: true }))
    ];
    warrantyGrid.innerHTML = rows.length
      ? rows.map((target) => `<label class="warranty-target-option ${target.archived ? "archived" : ""}"><input type="checkbox" data-warranty-target value="${escapeHtml(target.id)}" data-name="${escapeHtml(target.name)}" data-tech="${escapeHtml(tech)}" ${target.checked ? "checked" : ""}/><span class="warranty-check">${icon("check")}</span><strong>${escapeHtml(target.name)}</strong></label>`).join("")
      : `<div class="warranty-target-empty">Для «${escapeHtml(tech)}» пункты ещё не настроены. Добавь их в Настройки → Гарантии.</div>`;
  };
  const syncWarrantyState = () => {
    warrantyWrap?.classList.toggle("is-disabled", Number(guaranteeSelect?.value) === 0);
  };
  renderWarrantyTargets();
  syncWarrantyState();
  formElement.elements.tech.addEventListener("change", () => {
    renderWarrantyTargets();
    syncWarrantyState();
  });
  guaranteeSelect?.addEventListener("change", syncWarrantyState);

  const photoList = modal.querySelector("#order-photo-list");
  const photoInput = modal.querySelector("#order-photo-input");
  const renderPhotos = () => {
    photoList.innerHTML = orderPhotos.length ? orderPhotos.map((photo, index) => {
      const source = photoSource(photo);
      const label = photoLabel(photo, index);
      return `<button type="button" class="photo-card" data-view-photo="${index}" aria-label="Открыть ${escapeHtml(label)}">${source ? `<img src="${escapeHtml(source)}" alt="${escapeHtml(label)}" loading="lazy" />` : `<span class="photo-missing">${icon("camera")}<small>Старый формат</small></span>`}<span class="photo-caption" title="${escapeHtml(label)}">${escapeHtml(label)}</span><span class="photo-open-icon">${icon("eye")}</span></button>`;
    }).join("") : `<div class="photo-empty">${icon("camera")}<span>Фотографий пока нет</span></div>`;
  };
  const openPhotoViewer = (index) => {
    const photo = orderPhotos[index];
    const source = photoSource(photo);
    if (!photo || !source) return;
    const label = photoLabel(photo, index);
    const viewer = document.createElement("div");
    viewer.className = "modal-backdrop photo-viewer-backdrop";
    viewer.innerHTML = `<section class="photo-viewer-modal" role="dialog" aria-modal="true" aria-label="Просмотр фотографии">
      <header class="photo-viewer-head"><div><small>ФОТО ${index + 1} ИЗ ${orderPhotos.length}</small><strong>${escapeHtml(label)}</strong></div><button type="button" class="photo-viewer-close" aria-label="Закрыть">${icon("close")}</button></header>
      <div class="photo-viewer-stage"><img src="${escapeHtml(source)}" alt="${escapeHtml(label)}" /></div>
      <footer class="photo-viewer-actions"><button type="button" class="photo-viewer-delete">${icon("trash")}<span>Удалить фотографию</span></button></footer>
    </section>`;
    const closeViewer = () => {
      viewer.remove();
      syncModalScrollLock();
    };
    viewer.querySelector(".photo-viewer-close").addEventListener("click", closeViewer);
    viewer.querySelector(".photo-viewer-delete").addEventListener("click", async () => {
      if (!(await confirmDialog("Удалить фотографию из заявки?"))) return;
      orderPhotos.splice(index, 1);
      renderPhotos();
      closeViewer();
      toast("Фотография удалена");
    });
    viewer.addEventListener("click", (event) => {
      if (event.target === viewer) closeViewer();
    });
    document.body.appendChild(viewer);
    syncModalScrollLock();
  };
  photoInput.addEventListener("change", async () => {
    const files = [...(photoInput.files || [])];
    if (!files.length) return;
    if (orderPhotos.length + files.length > 20) {
      photoInput.value = "";
      return toast("В одной заявке можно хранить до 20 фото");
    }
    photoInput.disabled = true;
    for (const file of files) {
      try {
        orderPhotos.push(await compressPhotoFile(file));
      } catch (error) {
        toast(error.message || "Не удалось добавить фото");
      }
    }
    photoInput.value = "";
    photoInput.disabled = false;
    renderPhotos();
  });
  photoList.addEventListener("click", (event) => {
    const card = event.target.closest("[data-view-photo]");
    if (!card) return;
    openPhotoViewer(Number(card.dataset.viewPhoto));
  });
  renderPhotos();
  const directExpenseTotal = () => [...modal.querySelectorAll('[data-material-row][data-direct-expense="true"]')].reduce((sum, row) => {
    return sum + (Number(row.querySelector('[data-line="amount"]')?.value) || 0);
  }, 0);
  const syncWhiteExpenseMinimum = ({ raise = true } = {}) => {
    const minimum = directExpenseTotal();
    const input = formElement.elements.expense_white;
    const hint = modal.querySelector("#white-expense-minimum");
    if (input) {
      input.min = String(minimum);
      const current = Number(input.value) || 0;
      if (raise && current < minimum) input.value = String(minimum);
    }
    if (hint) hint.textContent = minimum > 0 ? `Минимум по расходам без склада: ${money(minimum)}` : "Минимум: 0 ₽";
    return minimum;
  };
  const calculateLines = () => {
    const serviceTotal = [...modal.querySelectorAll("[data-service-row]")].reduce((sum, row) => sum + (Number(row.querySelector('[data-line="qty"]').value) || 0) * (Number(row.querySelector('[data-line="price"]').value) || 0), 0);
    const directTotal = directExpenseTotal();
    modal.querySelector("#service-total").textContent = money(serviceTotal);
    modal.querySelector("#material-total").textContent = money(directTotal);
    modal.querySelector("#calculated-total").textContent = money(serviceTotal);
    const legacyServiceTotal = modal.querySelector("#legacy-service-total");
    if (legacyServiceTotal) legacyServiceTotal.textContent = money(serviceTotal);
    syncWhiteExpenseMinimum();
    return serviceTotal;
  };
  const refitServices = () => {
    const target = Number(formElement.elements.sum.value) || 0;
    if (target > 0) fitServiceRowsToTarget(modal, target);
    return calculateLines();
  };
  modal.querySelector("#open-service-catalog").addEventListener("click", () => openServiceCatalog(modal, serviceCatalog));
  modal.querySelector("#open-material-catalog").addEventListener("click", () => openMaterialCatalog(modal));
  modal.querySelector("#add-manual-material").addEventListener("click", () => {
    modal.querySelector("#material-lines").insertAdjacentHTML("beforeend", orderMaterialRow({ qty: 1, amount: 0, directExpense: true, writeOff: false }));
    calculateLines();
    modal.querySelector('#material-lines [data-material-row]:last-child [data-line="name"]')?.focus();
  });
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-remove-line]")) {
      const removedService = Boolean(event.target.closest("[data-service-row]"));
      event.target.closest(".line-item").remove();
      if (removedService) refitServices(); else calculateLines();
    }
  });
  modal.addEventListener("input", (event) => {
    if (event.target.name === "sum" || event.target.closest("[data-service-row]")) {
      refitServices();
      return;
    }
    if (event.target.closest("[data-material-row]")) calculateLines();
  });
  formElement.elements.expense_white?.addEventListener("change", () => {
    const minimum = syncWhiteExpenseMinimum({ raise: false });
    if ((Number(formElement.elements.expense_white.value) || 0) < minimum) {
      formElement.elements.expense_white.value = String(minimum);
      toast(`Белый расход не может быть меньше ${money(minimum)}`);
    }
  });
  modal.querySelector("#use-calculated-total").addEventListener("click", () => {
    const baseTotal = [...modal.querySelectorAll("[data-service-row]")].reduce((sum, row) => {
      const qty = Number(row.querySelector('[data-line="qty"]').value) || 0;
      const basePrice = Number(row.dataset.basePrice) || Number(row.querySelector('[data-line="price"]').value) || 0;
      return sum + qty * basePrice;
    }, 0);
    formElement.elements.sum.value = baseTotal;
    formElement.elements.sum.dispatchEvent(new Event("input", { bubbles: true }));
  });
  calculateLines();
  modal.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  const collectOrderForm = ({ asDraft = false } = {}) => {
    const form = new FormData(formElement);
    return {
      ...order,
      id: asDraft ? crypto.randomUUID() : (order.id || newOrderId()),
      created: form.get("createdDate") ? new Date(`${form.get("createdDate")}T12:00:00`).toISOString() : (orderDateValue(order) || new Date().toISOString()),
      updatedAt: new Date().toISOString(),
      draft: asDraft || undefined,
      sourceOrderId: asDraft && order.id ? order.id : (order.sourceOrderId || null),
      name: form.get("name"),
      phone: form.get("phone"),
      tech: form.get("tech"),
      brand: form.get("brand"),
      sum: Number(form.get("sum")),
      prepay: Number(form.get("prepay")),
      discount: Number(form.get("discount")),
      percent: Number(form.get("percent")),
      expense_gray: Number(form.get("expense_gray")),
      expense_white: Number(form.get("expense_white")),
      guarantee: Number(form.get("guarantee")),
      guaranteeTargets: [...modal.querySelectorAll("[data-warranty-target]:checked")].map((input) => ({
        id: String(input.value || ""),
        name: String(input.dataset.name || "").trim(),
        tech: String(input.dataset.tech || form.get("tech") || "").trim()
      })).filter((target) => target.name),
      tag: form.get("tag"),
      address: form.get("address"),
      issue: form.get("issue"),
      diagnosis: form.get("diagnosis"),
      defects: form.get("defects"),
      comment: form.get("comment"),
      guaranteeNote: form.get("guaranteeNote"),
      sourceId: String(form.get("sourceId") || ""),
      sourceName: activeOrderSources().find((source) => String(source.id) === String(form.get("sourceId") || ""))?.name || orderSourceName(order) || "",
      nextVisitDate: String(form.get("nextVisitDate") || ""),
      nextVisitTime: String(form.get("nextVisitTime") || ""),
      nextVisitDuration: Number(form.get("nextVisitDuration")) || 60,
      nextVisit: form.get("nextVisitDate") ? `${form.get("nextVisitDate")}T${form.get("nextVisitTime") || "12:00"}:00` : null,
      status: form.get("status"),
      services: [...modal.querySelectorAll("[data-service-row]")].map((row) => ({
        name: row.querySelector('[data-line="name"]').value,
        qty: Number(row.querySelector('[data-line="qty"]').value) || 1,
        price: Number(row.querySelector('[data-line="price"]').value) || 0,
        basePrice: Number(row.dataset.basePrice) || Number(row.querySelector('[data-line="price"]').value) || 0
      })).filter((item) => item.name.trim()),
      materials: [...modal.querySelectorAll("[data-material-row]")].map((row) => {
        const directExpense = row.dataset.directExpense === "true";
        const qty = Number(row.querySelector('[data-line="qty"]')?.value) || 1;
        const amount = directExpense ? Number(row.querySelector('[data-line="amount"]')?.value) || 0 : 0;
        return {
          warehouseId: directExpense ? null : (row.dataset.warehouseId || null),
          name: row.querySelector('[data-line="name"]').value,
          qty,
          unitCost: directExpense ? (qty > 0 ? amount / qty : 0) : (Number(row.querySelector('[data-line="unit-cost"]')?.value) || 0),
          unit: directExpense ? "" : normalizeStockUnit(row.dataset.unit || "шт"),
          storageUnit: directExpense ? undefined : normalizeStockUnit(row.dataset.storageUnit || row.dataset.unit || "шт"),
          writeOff: directExpense ? false : row.dataset.writeOff === "true",
          directExpense,
          amount: directExpense ? amount : undefined,
          comment: directExpense ? String(row.querySelector('[data-line="comment"]')?.value || "").trim() : undefined
        };
      }).filter((item) => item.name.trim()),
      photos: orderPhotos
    };
  };

  formElement.addEventListener("submit", async (event) => {
    event.preventDefault();
    const normalizedPhone = sanitizeRussianPhoneField(formElement.elements.phone);
    if (formElement.elements.phone.value && !isValidRussianPhone(normalizedPhone)) {
      formElement.elements.phone.focus();
      return toast("Введите российский номер в формате +7XXXXXXXXXX");
    }
    const next = collectOrderForm();
    delete next.draft;
    const index = data.orders.findIndex((item) => String(item.id) === String(next.id));
    const previous = index >= 0 ? data.orders[index] : null;
    if (index < 0 && !next.sourceId) {
      formElement.elements.sourceId.focus();
      return toast("Выбери источник заявки");
    }
    if (next.nextVisitTime && !next.nextVisitDate) {
      formElement.elements.nextVisitDate.focus();
      return toast("Для времени визита сначала выбери дату");
    }
    const nextStatus = normalizeStatus(next.status);
    const previousStatus = previous ? normalizeStatus(previous.status) : null;
    const directExpenseMinimum = next.materials
      .filter((item) => item.directExpense)
      .reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    if ((Number(next.percent) || 0) < 0 || (Number(next.percent) || 0) > 100) {
      formElement.elements.percent.focus();
      return toast("Процент по заявке должен быть от 0 до 100");
    }
    if ((Number(next.expense_gray) || 0) > (Number(next.sum) || 0)) {
      formElement.elements.expense_gray.focus();
      return toast("Серый расход не может быть больше итоговой суммы");
    }
    if ((Number(next.expense_white) || 0) < directExpenseMinimum) {
      formElement.elements.expense_white.value = String(directExpenseMinimum);
      formElement.elements.expense_white.focus();
      return toast(`Белый расход не может быть меньше ${money(directExpenseMinimum)}`);
    }
    if (nextStatus === "closed" && (Number(next.sum) || 0) <= 0) {
      formElement.elements.sum.focus();
      return toast("Для закрытой заявки итоговая сумма должна быть больше 0");
    }
    if (nextStatus === "closed" && previousStatus !== "closed") {
      if (!(await confirmOrderClose(next))) return;
    } else if (nextStatus === "declined" && (Number(next.prepay) || 0) > (Number(next.sum) || 0)) {
      if (!(await confirmDialog("Предоплата больше итоговой суммы. Сохранить отказ с такими данными?", { title: "Проверь сумму", confirmLabel: "Сохранить" }))) return;
    }
    const visitOverlap = findVisitOverlap(next);
    const stockSync = syncOrderStock(previous, next);
    if (!stockSync.ok) return toast(stockSync.message);
    syncOrderCompletion(next, previous);
    if (index >= 0) data.orders[index] = next; else data.orders.push(next);
    syncClientProfileFromOrder(next);
    await saveData();
    modal.remove();
    render();
    toast(visitOverlap
      ? `Заявка сохранена · визит пересекается с №${visitOverlap.id}`
      : "Заявка сохранена");
  });
}



function receiptModal(existing = null, receiptIndex = -1) {
  const item = existing || {};
  const isStored = receiptIndex >= 0;
  const view = receiptSummary(item);
  const rawDate = String(view.date || "");
  const dateValue = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : localDateInputValue();
  const orderOptions = ordersNewestFirst().map((order) => `<option value="${escapeHtml(order.id)}" ${String(view.orderId) === String(order.id) ? "selected" : ""}>№${escapeHtml(order.id)} · ${escapeHtml(order.name || "Без имени")} · ${money(order.sum)}</option>`).join("");
  const modal = document.createElement("div");
  modal.className = "modal-backdrop receipt-editor-backdrop legacy-service-editor-backdrop";
  modal.innerHTML = `<form class="modal compact-modal receipt-editor-modal" id="receipt-form">
    <div class="receipt-editor-head"><span class="service-editor-head-icon receipt">${icon("receipt")}</span><div><small>ДОКУМЕНТЫ</small><h2>${isStored ? "Редактировать документ" : "Новый документ"}</h2></div><button type="button" class="receipt-editor-close" data-close-modal aria-label="Закрыть">${icon("close")}</button></div>
    <div class="receipt-editor-type">${icon("receipt")}<span>Квитанция, чек, заказ-наряд или другой документ</span></div>
    <div class="form-grid">
      <div class="form-group full"><label>Тип / название</label><input class="field" name="title" value="${escapeHtml(view.title)}" required placeholder="Квитанция" /></div>
      <div class="form-group"><label>Номер</label><input class="field" name="number" value="${escapeHtml(view.number)}" placeholder="Необязательно" /></div>
      <div class="form-group"><label>Дата</label><input class="field" name="date" type="date" value="${escapeHtml(dateValue)}" /></div>
      <div class="form-group"><label>Сумма</label><input class="field receipt-editor-amount" name="amount" type="number" min="0" step="1" value="${view.amount}" inputmode="decimal" /></div>
      <div class="form-group"><label>Заявка</label><select class="field" name="orderId"><option value="">— Не привязана —</option>${orderOptions}</select></div>
      <div class="form-group full"><label>Комментарий</label><textarea class="field textarea" name="note" placeholder="Комментарий к документу">${escapeHtml(view.note)}</textarea></div>
    </div>
    <div class="modal-actions">${isStored ? '<button type="button" class="danger-button" id="delete-receipt">Удалить</button>' : ""}<button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("#delete-receipt")?.addEventListener("click", async () => {
    if (!(await confirmDialog("Удалить документ?"))) return;
    if (receiptIndex >= 0) data.receipts.splice(receiptIndex, 1);
    await saveData(); modal.remove(); await render(); toast("Документ удалён");
  });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const date = form.get("date");
    const next = {
      ...item,
      id: item.id || crypto.randomUUID(),
      title: String(form.get("title") || "").trim(),
      number: String(form.get("number") || "").trim(),
      date: date ? new Date(`${date}T12:00:00`).toISOString() : null,
      amount: Number(form.get("amount")) || 0,
      orderId: form.get("orderId") || null,
      note: String(form.get("note") || "").trim(),
      updatedAt: new Date().toISOString()
    };
    if (!next.title) return toast("Укажи название документа");
    if (!Array.isArray(data.receipts)) data.receipts = [];
    if (receiptIndex >= 0) data.receipts[receiptIndex] = next;
    else data.receipts.push({ ...next, createdAt: new Date().toISOString() });
    await saveData(); modal.remove(); await render(); toast("Документ сохранён");
  });
}
function toolModal(existing = null, toolIndex = -1) {
  const item = existing || {};
  const modal = document.createElement("div");
  modal.className = "modal-backdrop tool-editor-backdrop legacy-service-editor-backdrop";
  modal.innerHTML = `<form class="modal compact-modal tool-editor-modal" id="tool-form">
    <div class="tool-editor-head"><span class="service-editor-head-icon tool">${icon("tools")}</span><div><small>ИНСТРУМЕНТЫ</small><h2>${existing ? "Редактировать инструмент" : "Новый инструмент"}</h2></div><button type="button" class="tool-editor-close" data-close-modal aria-label="Закрыть">${icon("close")}</button></div>
    <div class="tool-editor-hero">${icon("tools")}<span><strong>Учёт оборудования</strong><small>Название, состояние, стоимость и серийный номер</small></span></div>
    <div class="form-grid">
      <div class="form-group full"><label>Название</label><input class="field" name="name" value="${escapeHtml(item.name || item.title || item.tool || "")}" required placeholder="Например, мультиметр" /></div>
      <div class="form-group"><label>Категория</label><input class="field" name="category" value="${escapeHtml(item.category || item.type || "")}" placeholder="Измерительный" /></div>
      <div class="form-group"><label>Состояние</label><input class="field" name="status" value="${escapeHtml(item.status || item.state || "В наличии")}" list="tool-status-options" /><datalist id="tool-status-options"><option value="В наличии"></option><option value="В ремонте"></option><option value="На выезде"></option><option value="Списан"></option></datalist></div>
      <div class="form-group"><label>Стоимость</label><input class="field tool-editor-price" name="price" type="number" min="0" step="1" value="${Number(item.price || item.purchasePrice) || 0}" inputmode="decimal" /></div>
      <div class="form-group"><label>Серийный номер</label><input class="field" name="serial" value="${escapeHtml(item.serial || item.serialNumber || "")}" /></div>
      <div class="form-group full"><label>Комментарий</label><textarea class="field textarea" name="note" placeholder="Необязательно">${escapeHtml(item.note || item.comment || "")}</textarea></div>
    </div>
    <div class="modal-actions">${existing ? '<button type="button" class="danger-button" id="delete-tool">Удалить</button>' : ""}<button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("#delete-tool")?.addEventListener("click", async () => {
    if (!(await confirmDialog("Удалить инструмент?"))) return;
    if (toolIndex >= 0) data.tools.splice(toolIndex, 1);
    await saveData(); modal.remove(); await render(); toast("Инструмент удалён");
  });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = {
      ...item,
      id: item.id || crypto.randomUUID(),
      name: String(form.get("name") || "").trim(),
      category: String(form.get("category") || "").trim(),
      status: String(form.get("status") || "В наличии").trim() || "В наличии",
      price: Number(form.get("price")) || 0,
      serial: String(form.get("serial") || "").trim(),
      note: String(form.get("note") || "").trim(),
      updatedAt: new Date().toISOString()
    };
    if (!next.name) return toast("Укажи название инструмента");
    if (!Array.isArray(data.tools)) data.tools = [];
    if (toolIndex >= 0) data.tools[toolIndex] = next; else data.tools.push({ ...next, createdAt: new Date().toISOString() });
    await saveData(); modal.remove(); await render(); toast("Инструмент сохранён");
  });
}

function customServiceModal(existing = null, serviceIndex = -1) {
  const item = existing || {};
  const modal = document.createElement("div");
  modal.className = "modal-backdrop legacy-price-editor-backdrop";
  modal.innerHTML = `<form class="modal legacy-price-editor" id="custom-service-form">
    <div class="legacy-subpage-head legacy-editor-head">
      <button type="button" class="legacy-back-button" data-close-modal aria-label="Назад">${icon("back")}</button>
      <div><h1>${existing ? "Своя услуга" : "Новая услуга"}</h1><p>Пользовательская позиция прайса</p></div>
    </div>

    <section class="legacy-price-editor-card">
      <div class="legacy-section-title"><span class="legacy-section-icon">${icon("edit")}</span><h2>${existing ? "Редактирование" : "Новая позиция"}</h2></div>
      <div class="legacy-price-editor-grid">
        <label class="full"><span>НАЗВАНИЕ</span><input class="field" name="name" value="${escapeHtml(item.name || item.title || item.service || "")}" required placeholder="Название услуги" /></label>
        <label><span>КАТЕГОРИЯ / ТЕХНИКА</span><input class="field" name="category" value="${escapeHtml(item.category || item.tech || "")}" placeholder="Холодильники" /></label>
        <label><span>ЦЕНА</span><input class="field legacy-price-value" name="price" type="number" min="0" step="1" value="${Number(item.price || item.cost || item.sum) || 0}" inputmode="decimal" /></label>
        <label class="full"><span>КОММЕНТАРИЙ</span><textarea class="field textarea" name="note" placeholder="Необязательно">${escapeHtml(item.note || item.comment || "")}</textarea></label>
      </div>
    </section>

    <div class="legacy-price-editor-actions">${existing ? '<button type="button" class="legacy-editor-delete" id="delete-custom-service">Удалить</button>' : ""}<button type="button" class="legacy-dark-button" data-close-modal>Отмена</button><button type="submit" class="legacy-editor-save">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.querySelector("#delete-custom-service")?.addEventListener("click", async () => {
    if (!(await confirmDialog("Удалить пользовательскую услугу?"))) return;
    if (serviceIndex >= 0) data.service_custom.splice(serviceIndex, 1);
    await saveData(); modal.remove(); await render(); toast("Услуга удалена");
  });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = {
      ...item,
      id: item.id || crypto.randomUUID(),
      name: String(form.get("name") || "").trim(),
      category: String(form.get("category") || "").trim(),
      tech: String(form.get("category") || "").trim(),
      price: Number(form.get("price")) || 0,
      note: String(form.get("note") || "").trim(),
      updatedAt: new Date().toISOString()
    };
    if (!next.name) return toast("Укажи название услуги");
    if (!Array.isArray(data.service_custom)) data.service_custom = [];
    if (serviceIndex >= 0) data.service_custom[serviceIndex] = next;
    else data.service_custom.push({ ...next, createdAt: new Date().toISOString() });
    await saveData(); modal.remove(); await render(); toast("Своя услуга сохранена");
  });
}
function priceModal(existing = null, priceIndex = -1) {
  const item = existing || {};
  const modal = document.createElement("div");
  modal.className = "modal-backdrop legacy-price-editor-backdrop";
  modal.innerHTML = `<form class="modal legacy-price-editor" id="price-form">
    <div class="legacy-subpage-head legacy-editor-head">
      <button type="button" class="legacy-back-button" data-close-modal aria-label="Назад">${icon("back")}</button>
      <div><h1>${existing ? "Позиция прайса" : "Новая позиция"}</h1><p>Услуга или материал</p></div>
    </div>

    <section class="legacy-price-editor-card">
      <div class="legacy-section-title"><span class="legacy-section-icon">${icon(item.kind === "material" ? "goods" : "price")}</span><h2>${existing ? "Редактирование" : "Новая позиция"}</h2></div>
      <div class="legacy-price-editor-grid">
        <label class="full"><span>НАЗВАНИЕ</span><input class="field" name="name" value="${escapeHtml(item.name || "")}" required placeholder="Название позиции" /></label>
        <label><span>КАТЕГОРИЯ</span><input class="field" name="category" value="${escapeHtml(item.category || "")}" placeholder="Расходные материалы" /></label>
        <label><span>ТЕХНИКА</span><input class="field" name="tech" value="${escapeHtml(item.tech || "")}" placeholder="Холодильники" /></label>
        <label><span>ТИП</span><select class="field" name="kind"><option value="service" ${item.kind !== "material" ? "selected" : ""}>Услуга</option><option value="material" ${item.kind === "material" ? "selected" : ""}>Материал / товар</option></select></label>
        <label><span>ЕДИНИЦА</span><input class="field" name="unit" value="${escapeHtml(item.unit || (item.kind === "material" ? "шт." : ""))}" placeholder="шт." /></label>
        <label class="full"><span>ЦЕНА</span><input class="field legacy-price-value" name="price" type="number" min="0" step="1" value="${Number(item.price) || 0}" required inputmode="decimal" /></label>
      </div>
    </section>

    <div class="legacy-price-editor-actions">${existing ? '<button type="button" class="legacy-editor-delete" id="delete-price">Удалить</button>' : ""}<button type="button" class="legacy-dark-button" data-close-modal>Отмена</button><button type="submit" class="legacy-editor-save">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  modal.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.querySelector("#delete-price")?.addEventListener("click", async () => {
    if (!(await confirmDialog("Удалить позицию из прайса?"))) return;
    if (priceIndex >= 0) data.receipt_prices.splice(priceIndex, 1);
    await saveData(); modal.remove(); await render(); toast("Позиция удалена");
  });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = {
      ...item,
      id: item.id || crypto.randomUUID(),
      name: String(form.get("name") || "").trim(),
      category: String(form.get("category") || "").trim(),
      tech: String(form.get("tech") || "").trim(),
      kind: String(form.get("kind") || "service"),
      unit: String(form.get("unit") || "").trim(),
      price: Number(form.get("price")) || 0
    };
    if (!next.name) return toast("Укажи название позиции");
    if (priceIndex >= 0) data.receipt_prices[priceIndex] = next; else data.receipt_prices.push(next);
    await saveData(); modal.remove(); await render(); toast("Прайс обновлён");
  });
}
function clientModal(clientKey) {
  const orders = data.orders
    .filter((order) => !order.archived && clientKeyForOrder(order) === clientKey)
    .sort((a, b) => (orderCreatedTimestamp(b) || 0) - (orderCreatedTimestamp(a) || 0));
  if (!orders.length) return;
  const client = orders[0];
  const total = orders.reduce((sum, order) => sum + (Number(order.sum) || 0), 0);
  const closedOrders = orders.filter((order) => normalizeStatus(order.status) === "closed");
  const closed = closedOrders.length;
  const active = orders.filter((order) => normalizeStatus(order.status) === "active").length;
  const average = closed ? closedOrders.reduce((sum, order) => sum + (Number(order.sum) || 0), 0) / closed : 0;
  const profile = clientProfileByPhone(client.phone || "");
  const modal = document.createElement("div");
  modal.className = "modal-backdrop client-profile-backdrop legacy-client-profile-backdrop";
  modal.innerHTML = `<section class="modal client-profile-modal" aria-label="Профиль клиента">
    <header class="client-profile-head">
      <button type="button" class="client-profile-back" data-close-modal aria-label="Назад">${icon("back")}</button>
      <div><strong>Клиент</strong><small>История обращений и ремонтов</small></div>
      ${client.phone ? `<a href="tel:${escapeHtml(client.phone)}" aria-label="Позвонить">${icon("phone")}</a>` : `<span></span>`}
    </header>
    <main class="client-profile-content">
      <section class="client-profile-hero">
        <span class="client-profile-avatar">${icon("clients")}</span>
        <div><h2>${escapeHtml(client.name || "Клиент")}</h2><p>${escapeHtml(client.phone || "Телефон не указан")}</p></div>
      </section>

      ${client.address ? `<a class="client-profile-address" href="${escapeHtml(yandexMapsUrl(client.address))}" target="_blank" rel="noopener">${icon("location")}<span><small>Последний адрес · открыть в Яндекс Картах</small><strong>${escapeHtml(client.address)}</strong></span></a>` : ""}

      <div class="client-profile-actions">
        ${client.phone ? `<a href="tel:${escapeHtml(client.phone)}">${icon("phone")}<span>Позвонить</span></a>` : `<button type="button" disabled>${icon("phone")}<span>Нет телефона</span></button>`}
        <button type="button" data-client-new-order>${icon("orders")}<span>Новая заявка</span></button>
      </div>

      <section class="client-profile-kpis">
        <div><span>Обращений</span><strong>${orders.length}</strong></div>
        <div><span>Закрыто</span><strong class="green">${closed}</strong></div>
        <div><span>Средний чек</span><strong class="blue">${money(average)}</strong></div>
        <div><span>Общая сумма</span><strong class="yellow">${money(total)}</strong></div>
      </section>

      ${client.phone ? `<section class="client-profile-note">
        <label for="client-profile-note">Заметка о клиенте</label>
        <textarea class="field textarea" id="client-profile-note" placeholder="Домофон, подъезд, особенности клиента...">${escapeHtml(profile?.note || "")}</textarea>
        <button type="button" class="secondary-button" id="save-client-profile-note">Сохранить заметку</button>
      </section>` : ""}

      <section class="client-profile-history">
        <h3>История ремонтов</h3>
        <div class="client-profile-orders">${orders.map((order) => {
          const status = normalizeStatus(order.status);
          return `<button type="button" data-client-order="${escapeHtml(order.id)}">
            <span class="client-order-icon">${icon(applianceIconName(order.tech))}</span>
            <span class="client-order-copy"><strong>№${escapeHtml(order.id || "—")} · ${escapeHtml(order.tech || "Техника")}</strong><small>${shortDate(orderDateValue(order))} · ${escapeHtml(order.status || "В работе")}</small><em>${escapeHtml(order.brand || order.issue || "")}</em></span>
            <span class="client-order-side"><b>${money(order.sum)}</b><i class="${status === "closed" ? "green" : status === "declined" ? "red" : "blue"}">${escapeHtml(order.status || "В работе")}</i></span>
          </button>`;
        }).join("")}</div>
      </section>
    </main>
  </section>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector("[data-close-modal]").addEventListener("click", close);
  modal.querySelector("#save-client-profile-note")?.addEventListener("click", async () => {
    const phone = normalizeRussianPhone(client.phone || "");
    if (!phone) return;
    let currentProfile = clientProfileByPhone(phone);
    if (!currentProfile) {
      currentProfile = { id: crypto.randomUUID(), phone, name: client.name || "", note: "", lastAddress: client.address || "", updatedAt: null };
      data.client_profiles.push(currentProfile);
    }
    currentProfile.note = String(modal.querySelector("#client-profile-note")?.value || "").trim();
    currentProfile.updatedAt = new Date().toISOString();
    await saveData();
    toast("Заметка клиента сохранена");
  });
  modal.addEventListener("click", (event) => {
    if (event.target === modal) return close();
    const newOrderButton = event.target.closest("[data-client-new-order]");
    if (newOrderButton) {
      close();
      return newOrderModal({
        name: client.name || "",
        phone: client.phone || "",
        address: client.address || "",
        status: "В работе",
        guarantee: 6,
        services: [],
        materials: [],
        photos: []
      }, { forceNew: true });
    }
    const orderButton = event.target.closest("[data-client-order]");
    if (!orderButton) return;
    const order = data.orders.find((item) => String(item.id) === String(orderButton.dataset.clientOrder));
    if (!order) return;
    close();
    orderDetailModal(order);
  });
}

function financeModal(type) {
  const isIncome = type === "income";
  const modal = document.createElement("div");
  modal.className = "modal-backdrop finance-entry-backdrop legacy-finance-entry-backdrop";
  modal.innerHTML = `<form class="modal compact-modal finance-entry-modal" id="finance-form">
    <div class="finance-entry-head">
      <span class="finance-entry-head-icon ${isIncome ? "income" : "expense"}">${icon(isIncome ? "finance" : "receipt")}</span>
      <div><small>ФИНАНСЫ</small><h2>${isIncome ? "Новый доход" : "Новый расход"}</h2></div>
      <button type="button" class="finance-entry-close" data-close-modal aria-label="Закрыть">${icon("close")}</button>
    </div>
    <div class="finance-entry-type ${isIncome ? "income" : "expense"}">${icon(isIncome ? "finance" : "receipt")}<span>${isIncome ? "Пополнение личных финансов" : "Личный расход вне заявки"}</span></div>
    <div class="form-grid">
      <div class="form-group"><label>Сумма</label><input class="field" name="amount" type="number" min="0" step="1" inputmode="decimal" required placeholder="0" /></div>
      <div class="form-group"><label>Дата</label><input class="field" name="date" type="date" value="${localDateInputValue()}" required /></div>
      <div class="form-group full"><label>Категория</label><input class="field" name="category" value="${isIncome ? "Дополнительный доход" : "Личные расходы"}" /></div>
      <div class="form-group full"><label>Описание</label><input class="field" name="description" required placeholder="${isIncome ? "Например, продажа запчасти" : "Например, топливо"}" /></div>
    </div>
    <div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get("amount")) || 0;
    if (amount <= 0) return toast("Укажи сумму");
    const item = {
      id: crypto.randomUUID(),
      amount,
      category: String(form.get("category") || "").trim() || (isIncome ? "Дополнительный доход" : "Личные расходы"),
      description: String(form.get("description") || "").trim(),
      date: new Date(`${form.get("date")}T12:00:00`).toISOString(),
      source: "manual"
    };
    data[isIncome ? "incomes" : "expenses"].push(item);
    await saveData();
    modal.remove();
    await render();
    toast(isIncome ? "Доход добавлен" : "Расход добавлен");
  });
}

function stockDetailModal(item) {
  const reserved = stockReservedQuantity(item.id);
  const available = stockAvailableQuantity(item);
  const isLow = !item.archived && Number(item.min || 0) > 0 && available <= Number(item.min || 0);
  const movements = [...data.warehouse_movements]
    .filter((movement) => String(movement.warehouseId) === String(item.id))
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 5);
  const movementLabels = {
    initial: "Начальный остаток",
    in: "Приход",
    out: "Списание",
    manual_in: "Приход",
    manual_out: "Списание",
    order_out: "В заявку",
    order_return: "Возврат"
  };
  const modal = document.createElement("div");
  modal.className = "modal-backdrop stock-detail-backdrop";
  modal.innerHTML = `<section class="modal stock-detail-modal" aria-label="Позиция склада">
    <header class="stock-detail-head">
      <button type="button" class="stock-detail-back" data-close-modal aria-label="Назад">${icon("back")}</button>
      <div><strong>Позиция склада</strong><small>${escapeHtml(item.category || "Без категории")}</small></div>
      <button type="button" class="stock-detail-edit" data-stock-detail-action="edit" aria-label="Редактировать">${icon("edit")}</button>
    </header>
    <main class="stock-detail-content">
      <section class="stock-detail-hero">
        <span class="stock-detail-icon">${icon("box")}</span>
        <div><h2>${escapeHtml(item.name || "Без названия")}</h2><p>${escapeHtml(Array.isArray(item.compatibility) && item.compatibility.length ? item.compatibility.join(" · ") : "Универсальная позиция")}</p><span class="stock-detail-sale-price">Продажа · ${money(item.price || 0)}</span></div>
        <span class="stock-detail-status ${isLow ? "low" : ""}">${item.archived ? "Архив" : isLow ? "Мало" : "В наличии"}</span>
      </section>
      <section class="stock-detail-kpis">
        <div class="primary"><span>Доступно</span><strong>${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(available)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}</strong><small>всего: ${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(Number(item.quantity) || 0)}</small></div>
        <div class="reserved"><span>В резерве</span><strong>${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(reserved)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}</strong></div>
        <div class="minimum"><span>Минимум</span><strong>${escapeHtml(item.min || 0)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}</strong></div>
      </section>
      <div class="stock-detail-actions">
        <button type="button" class="incoming" data-stock-detail-action="in"><span class="stock-action-icon">${icon("plus")}</span><span><b>Приход</b><small>Добавить на склад</small></span></button>
        <button type="button" class="outgoing" data-stock-detail-action="out"><span class="stock-action-icon">${icon("minus")}</span><span><b>Списать</b><small>Уменьшить остаток</small></span></button>
        <button type="button" class="stock-detail-archive" data-stock-detail-action="archive">${icon(item.archived ? "restore" : "archive")}<b>${item.archived ? "Вернуть из архива" : "Переместить в архив"}</b></button>
      </div>
      <section class="stock-detail-history">
        <h3>Последние движения</h3>
        ${movements.length ? movements.map((movement) => {
          const incoming = ["initial","in","manual_in","order_return"].includes(movement.type);
          return `<div class="stock-detail-movement"><span class="${incoming ? "green" : "red"}">${incoming ? "+" : "−"}${escapeHtml(movement.qty || 0)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}</span><p><strong>${movementLabels[movement.type] || "Движение"}</strong><small>${shortDate(movement.date)}${movement.orderId ? ` · заявка №${escapeHtml(movement.orderId)}` : ""}</small></p></div>`;
        }).join("") : `<p class="detail-empty">Движений пока нет</p>`}
      </section>
    </main>
  </section>`;
  document.body.appendChild(modal);
  const close = () => modal.remove();
  modal.querySelector("[data-close-modal]").addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  modal.querySelectorAll("[data-stock-detail-action]").forEach((button) => button.addEventListener("click", async () => {
    const action = button.dataset.stockDetailAction;
    close();
    if (action === "edit") return stockModal(item);
    if (action === "in" || action === "out") return adjustStock(item.id, action);
    if (action === "archive") {
      item.archived = !item.archived;
      await saveData();
      await render();
      return toast(item.archived ? "Позиция перемещена в архив" : "Позиция возвращена на склад");
    }
  }));
}

function stockModal(existing = null) {
  const item = existing || {};
  const currentStorageUnit = normalizeStockUnit(item.unit || "шт");
  const storageUnits = STOCK_UNITS.includes(currentStorageUnit) ? STOCK_UNITS : [currentStorageUnit, ...STOCK_UNITS];
  const allowedCurrentConsumeUnits = allowedConsumeUnits(currentStorageUnit);
  const currentConsumeUnitRaw = normalizeStockUnit(item.consumeUnit || currentStorageUnit);
  const currentConsumeUnit = allowedCurrentConsumeUnits.includes(currentConsumeUnitRaw) ? currentConsumeUnitRaw : currentStorageUnit;
  const commonCompatibility = [
    "Холодильники",
    "Коммерческое холод. оборудование",
    "Стиральные машины",
    "Посудомоечные машины",
    "Сушильные машины",
    "Плиты и духовки",
    "Кондиционеры",
    "Мелкая бытовая техника"
  ];
  const currentCompatibility = Array.isArray(item.compatibility) ? item.compatibility.map(String) : [];
  const customCompatibility = currentCompatibility.filter((value) => !commonCompatibility.includes(value)).join(", ");
  const modal = document.createElement("div");
  modal.className = "modal-backdrop stock-editor-backdrop";
  modal.innerHTML = `<form class="modal compact-modal stock-editor-modal" id="stock-form">
    <div class="stock-editor-head">
      <span class="stock-editor-title-icon">${icon("box")}</span>
      <div><small>Склад</small><h2>${existing ? "Редактировать позицию" : "Новая позиция"}</h2></div>
      <button type="button" class="stock-editor-close" data-close-modal aria-label="Закрыть">${icon("close")}</button>
    </div>

    <p class="stock-editor-intro">${existing ? "Измени параметры позиции, совместимость и цены." : "Добавь запчасть или расходный материал на склад."}</p>
    <div class="stock-editor-body">
    <section class="stock-editor-section">
    <div class="stock-editor-section-title"><span class="stock-editor-section-icon">${icon("box")}</span><span>Основное</span></div>
    <div class="form-grid">
      <div class="form-group full"><label>Название</label><input class="field" name="name" value="${escapeHtml(item.name || "")}" required placeholder="Например, компрессор" /></div>
      <div class="form-group"><label>Категория</label><input class="field" name="category" value="${escapeHtml(item.category || "Запчасти")}" /></div>
      <div class="form-group"><label>Единица хранения</label><select class="field" name="unit" id="stock-storage-unit">${storageUnits.map((value) => `<option value="${escapeHtml(value)}" ${currentStorageUnit === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select></div>
      <div class="form-group"><label>Единица списания</label><select class="field" name="consumeUnit" id="stock-consume-unit">${allowedCurrentConsumeUnits.map((value) => `<option value="${escapeHtml(value)}" ${currentConsumeUnit === value ? "selected" : ""}>${escapeHtml(value)}</option>`).join("")}</select></div>
      <div class="form-group"><label>${existing ? "Текущий остаток" : "Количество"}</label><input class="field" name="quantity" type="number" min="0" step="0.001" value="${Number(item.quantity) || 0}" ${existing ? "readonly" : ""} /></div>
      <div class="form-group"><label>Минимальный остаток</label><input class="field" name="min" type="number" min="0" step="0.001" value="${Number(item.min) || 0}" /></div>
    </div>
    </section>

    <section class="stock-editor-section">
    <div class="stock-editor-section-title"><span class="stock-editor-section-icon">${icon("finance")}</span><span>Цены и учёт</span></div>
    <div class="form-grid">
      <div class="form-group"><label>Цена продажи</label><input class="field" name="price" type="number" min="0" step="1" value="${Number(item.price) || 0}" /></div>
      <div class="form-group"><label>Себестоимость</label><input class="field" name="lastPurchasePrice" type="number" min="0" step="1" value="${Number(item.lastPurchasePrice) || 0}" /></div>
      <div class="form-group full"><label>Учёт расхода</label><select class="field" name="tracking"><option value="exact" ${item.tracking !== "presence" ? "selected" : ""}>Точный — списывать количество</option><option value="presence" ${item.tracking === "presence" ? "selected" : ""}>По наличию — без точного расхода</option></select></div>
    </div>
    </section>

    <section class="stock-editor-section">
    <div class="stock-editor-section-title"><span class="stock-editor-section-icon">${icon("tools")}</span><span>Совместимость</span></div>
    <details class="stock-editor-compat-details" ${currentCompatibility.length ? "open" : ""}>
    <summary><span><b>Типы техники</b><small>${currentCompatibility.length ? `Выбрано: ${currentCompatibility.length}` : "Не выбрано · универсальная позиция"}</small></span>${icon("chevron")}</summary>
    <div class="stock-editor-compat-content">
    <div class="stock-editor-compat">
      ${commonCompatibility.map((value) => `<label><input type="checkbox" name="compatibility" value="${escapeHtml(value)}" ${currentCompatibility.includes(value) ? "checked" : ""}/><span class="warehouse-check"></span><b>${escapeHtml(value)}</b></label>`).join("")}
    </div>
    <div class="form-group stock-editor-custom-compat"><label>Дополнительно</label><input class="field" name="compatibilityExtra" value="${escapeHtml(customCompatibility)}" placeholder="Через запятую" /></div>
    </div>
    </details>
    <label class="stock-editor-toggle"><input type="checkbox" name="hiddenFromOrders" ${item.hiddenFromOrders ? "checked" : ""}/><span class="warehouse-check"></span><span><b>Скрыть в заявках</b><small>Не предлагать эту позицию при добавлении материалов</small></span></label>
    </section>
    </div>

    <div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  const storageUnitSelect = modal.querySelector("#stock-storage-unit");
  const consumeUnitSelect = modal.querySelector("#stock-consume-unit");
  const syncConsumeUnits = () => {
    if (!storageUnitSelect || !consumeUnitSelect) return;
    const allowed = allowedConsumeUnits(storageUnitSelect.value);
    const previous = normalizeStockUnit(consumeUnitSelect.value);
    consumeUnitSelect.innerHTML = allowed.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
    consumeUnitSelect.value = allowed.includes(previous) ? previous : allowed[0];
  };
  storageUnitSelect?.addEventListener("change", syncConsumeUnits);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const extraCompatibility = String(form.get("compatibilityExtra") || "").split(",").map((value) => value.trim()).filter(Boolean);
    const compatibility = [...new Set([...form.getAll("compatibility").map(String), ...extraCompatibility])];
    const next = {
      ...item,
      id: item.id || crypto.randomUUID(),
      name: String(form.get("name") || "").trim(),
      category: String(form.get("category") || "Запчасти").trim() || "Запчасти",
      unit: normalizeStockUnit(form.get("unit") || "шт"),
      consumeUnit: normalizeStockUnit(form.get("consumeUnit") || form.get("unit") || "шт"),
      quantity: Number(form.get("quantity")) || 0,
      min: Number(form.get("min")) || 0,
      price: Number(form.get("price")) || 0,
      lastPurchasePrice: Number(form.get("lastPurchasePrice")) || 0,
      compatibility,
      archived: existing ? Boolean(item.archived) : false,
      hiddenFromOrders: form.get("hiddenFromOrders") === "on",
      tracking: String(form.get("tracking") || "exact")
    };
    if (!next.name) return toast("Укажи название позиции");
    const index = data.warehouse.findIndex((entry) => String(entry.id) === String(next.id));
    if (index >= 0) data.warehouse[index] = next; else data.warehouse.push(next);
    if (!existing && next.quantity > 0) {
      data.warehouse_movements.push({ id: crypto.randomUUID(), warehouseId: next.id, name: next.name, qty: next.quantity, type: "initial", date: new Date().toISOString() });
    }
    await saveData();
    modal.remove();
    await render();
    toast("Позиция склада сохранена");
  });
}

const goodsLine = (item = {}) => `<div class="legacy-goods-edit-row" data-goods-row data-original-price="${Number(item.originalPrice ?? item.price) || 0}">
  <div class="legacy-goods-row-label"><span>ТОВАР</span><button type="button" data-remove-line aria-label="Удалить">${icon("trash")}</button></div>
  <label><span>НАИМЕНОВАНИЕ</span><input class="field" data-line="name" value="${escapeHtml(item.name || "")}" placeholder="Название товара" /></label>
  <div class="legacy-goods-row-grid">
    <label><span>КОЛ-ВО</span><input class="field" data-line="qty" type="number" min="0.01" step="0.01" value="${Number(item.qty) || 1}" /></label>
    <label><span>ЕД.</span><input class="field" data-line="unit" value="${escapeHtml(normalizeStockUnit(item.unit || "шт"))}" /></label>
  </div>
  <div class="legacy-goods-row-grid">
    <label><span>ЦЕНА ЗА ЕД.</span><input class="field" data-line="price" type="number" min="0" step="1" value="${Number(item.price) || 0}" /></label>
    <div class="legacy-goods-row-sum"><span>СУММА</span><strong data-line-total>0 ₽</strong></div>
  </div>
</div>`;

function goodsModal(existing = null, seed = null) {
  const isStored = Boolean(existing && (data.goods_sheets || []).some((item) => String(item.id) === String(existing.id)));
  const sheet = existing || seed || { id: crypto.randomUUID(), title: "Новый товарник", items: [], target: 0, createdAt: new Date().toISOString() };
  const goodsPriceEntries = data.receipt_prices
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.kind === "material" || String(item.category || "").toLowerCase().includes("товар"))
    .sort((a, b) => String(a.item.name || "").localeCompare(String(b.item.name || ""), "ru"));
  const options = goodsPriceEntries.map(({ item, index }) => `<option value="${index}">${escapeHtml(item.name)} · ${money(item.price)}</option>`).join("");
  const modal = document.createElement("div");
  modal.className = "modal-backdrop goods-editor-backdrop legacy-goods-editor-backdrop";
  modal.innerHTML = `<form class="modal goods-editor-modal legacy-goods-editor" id="goods-form">
    <div class="legacy-subpage-head goods-modal-head">
      <button type="button" class="legacy-back-button" data-close-modal aria-label="Назад">${icon("back")}</button>
      <div><h1>Товарник</h1><p>Товары и материалы · отдельный расчёт</p></div>
    </div>

    <section class="legacy-goods-panel legacy-editor-panel">
      <div class="legacy-section-title"><span class="legacy-section-icon">${icon("edit")}</span><h2>Редактирование товарника</h2></div>
      <p class="legacy-goods-intro">Добавь товары, при необходимости подгони цены и сохрани расчёт.</p>

      <label class="legacy-editor-title"><span>НАЗВАНИЕ РАСЧЁТА</span><input class="field" name="title" value="${escapeHtml(sheet.title || "")}" required /></label>

      <div class="legacy-section-subtitle"><span class="legacy-section-icon small">${icon("document")}</span><h3>Позиции</h3></div>
      <div class="legacy-goods-add-line"><select class="field" id="goods-picker"><option value="">— Выберите товар из прайса —</option>${options}</select><button type="button" id="add-goods-line">${icon("plus")}<span>Добавить</span></button></div>
      <div class="legacy-goods-editor-list" id="goods-lines">${(sheet.items || []).map(goodsLine).join("")}</div>
      <button type="button" class="legacy-manual-add" id="add-manual-goods">${icon("plus")}<span>Добавить позицию вручную</span></button>

      <div class="legacy-goods-target">
        <label><span>ЦЕЛЕВАЯ СУММА</span><input class="field" id="goods-target" name="target" type="number" min="0" step="1" value="${Number(sheet.target) || 0}" placeholder="—" /></label>
        <p>Необязательно. Используй только если итог должен точно совпасть с нужной суммой.</p>
      </div>

      <div class="legacy-goods-editor-actions">
        <button type="button" class="legacy-purple-button" id="adjust-goods-prices">${icon("price")}<span>Подогнать цены</span></button>
        <button type="button" class="legacy-dark-button" id="restore-goods-prices">${icon("refresh")}<span>Вернуть исходные<br>цены</span></button>
        <button type="button" class="legacy-orange-button" id="preview-goods">${icon("eye")}<span>К итогу</span></button>
      </div>
    </section>

    <section class="legacy-goods-panel legacy-editor-preview" id="goods-editor-preview">
      <div class="legacy-section-title"><span class="legacy-section-icon">${icon("eye")}</span><h2>Предпросмотр</h2></div>
      <div class="legacy-preview-table-wrap"><table class="legacy-preview-table"><thead><tr><th>ТОВАР</th><th>КОЛИЧЕСТВО</th><th>ЦЕНА</th></tr></thead><tbody id="goods-preview-body"></tbody></table></div>
      <div class="legacy-preview-total"><strong>Итого</strong><strong id="goods-preview-total">0 ₽</strong></div>
    </section>

    <details class="legacy-goods-panel legacy-product-price">
      <summary><span class="legacy-section-title"><span class="legacy-section-icon">${icon("goods")}</span><h2>Прайс товаров</h2></span><span class="legacy-price-chevron">${icon("chevron")}</span></summary>
      ${goodsPriceEntries.length ? `<div class="legacy-product-price-list">${goodsPriceEntries.map(({item}) => `<div><span><strong>${escapeHtml(item.name || "Без названия")}</strong><small>${escapeHtml(item.category || "Товар")}</small></span><b>${money(item.price || 0)}</b></div>`).join("")}</div>` : `<p class="legacy-goods-help">В прайс-листе пока нет товарных позиций.</p>`}
    </details>

    <div class="legacy-goods-savebar">
      ${isStored ? '<button type="button" class="legacy-delete-goods" id="delete-goods-sheet">Удалить</button>' : ""}
      <button type="button" class="legacy-dark-button legacy-goods-cancel" data-close-modal>Отмена</button>
      <button type="submit" class="legacy-save-goods">Сохранить товарник</button>
    </div>
  </form>`;
  document.body.appendChild(modal);

  const readRows = () => [...modal.querySelectorAll("[data-goods-row]")].map((row) => ({
    name: row.querySelector('[data-line="name"]').value.trim(),
    qty: Number(row.querySelector('[data-line="qty"]').value) || 0,
    unit: row.querySelector('[data-line="unit"]').value.trim() || "шт.",
    price: Number(row.querySelector('[data-line="price"]').value) || 0
  }));

  const calculate = () => {
    const rows = [...modal.querySelectorAll("[data-goods-row]")];
    let total = 0;
    rows.forEach((row) => {
      const qty = Number(row.querySelector('[data-line="qty"]').value) || 0;
      const price = Number(row.querySelector('[data-line="price"]').value) || 0;
      const rowTotal = qty * price;
      total += rowTotal;
      const output = row.querySelector("[data-line-total]");
      if (output) output.textContent = money(rowTotal);
    });
    const previewRows = readRows().filter((item) => item.name);
    const previewBody = modal.querySelector("#goods-preview-body");
    if (previewBody) previewBody.innerHTML = previewRows.map((item) => `<tr><td>${escapeHtml(item.name)}</td><td>${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(item.qty)} ${escapeHtml(item.unit)}</td><td>${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:0}).format(item.price)}</td></tr>`).join("");
    modal.querySelector("#goods-preview-total").textContent = money(total);
    return total;
  };

  const addRow = (item = {}) => {
    modal.querySelector("#goods-lines").insertAdjacentHTML("beforeend", goodsLine({ ...item, originalPrice: Number(item.originalPrice ?? item.price) || 0 }));
    calculate();
  };

  modal.querySelector("#add-goods-line").addEventListener("click", () => {
    const picker = modal.querySelector("#goods-picker");
    const item = picker.value === "" ? null : data.receipt_prices[Number(picker.value)];
    if (!item) return toast("Выбери товар из прайса");
    addRow({ name: item.name, qty: 1, price: Number(item.price) || 0, originalPrice: Number(item.price) || 0, unit: normalizeStockUnit(item.unit || "шт") });
  });
  modal.querySelector("#add-manual-goods").addEventListener("click", () => addRow({ unit: "шт.", price: 0, originalPrice: 0 }));
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-remove-line]")) {
      event.target.closest("[data-goods-row]")?.remove();
      calculate();
    }
  });
  modal.addEventListener("input", (event) => { if (event.target.closest("[data-goods-row]") || event.target.id === "goods-target") calculate(); });

  modal.querySelector("#adjust-goods-prices").addEventListener("click", () => {
    const rows = [...modal.querySelectorAll("[data-goods-row]")];
    const target = Number(modal.querySelector("#goods-target").value);
    const current = calculate();
    if (!rows.length || !Number.isFinite(target) || target <= 0) return toast("Добавь позиции и укажи целевую сумму");
    rows.forEach((row) => {
      const qty = Number(row.querySelector('[data-line="qty"]').value) || 1;
      const price = Number(row.querySelector('[data-line="price"]').value) || 0;
      row.querySelector('[data-line="price"]').value = Math.max(0, Math.round(current ? price * target / current : target / rows.length / qty));
    });
    calculate();
    toast("Цены подогнаны под целевую сумму");
  });

  modal.querySelector("#restore-goods-prices").addEventListener("click", () => {
    [...modal.querySelectorAll("[data-goods-row]")].forEach((row) => {
      row.querySelector('[data-line="price"]').value = Number(row.dataset.originalPrice) || 0;
    });
    calculate();
    toast("Исходные цены восстановлены");
  });

  modal.querySelector("#preview-goods").addEventListener("click", () => {
    calculate();
    modal.querySelector("#goods-editor-preview")?.scrollIntoView({ behavior: "smooth", block: "start" });
  });

  modal.querySelector("#delete-goods-sheet")?.addEventListener("click", async () => {
    if (!isStored || !(await confirmDialog("Удалить этот товарник?"))) return;
    data.goods_sheets = (data.goods_sheets || []).filter((item) => String(item.id) !== String(sheet.id));
    await saveData(); modal.remove(); await render(); toast("Товарник удалён");
  });

  modal.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = {
      ...sheet,
      id: sheet.id || crypto.randomUUID(),
      title: String(form.get("title") || "").trim(),
      target: Number(form.get("target")) || 0,
      items: readRows().filter((item) => item.name).map((item) => ({ ...item })),
      total: calculate(),
      updatedAt: new Date().toISOString()
    };
    if (!next.title) return toast("Укажи название расчёта");
    if (!next.items.length) return toast("Добавь хотя бы одну позицию");
    if (!Array.isArray(data.goods_sheets)) data.goods_sheets = [];
    const index = data.goods_sheets.findIndex((item) => String(item.id) === String(next.id));
    if (index >= 0) data.goods_sheets[index] = next; else data.goods_sheets.push({ ...next, createdAt: next.createdAt || new Date().toISOString() });
    await saveData(); modal.remove(); await render(); toast("Товарник сохранён");
  });
  calculate();
}

function orderActionsSheet(order) {
  const tg = telegramPhoneLink(order.phone);
  const modal = document.createElement("div");
  modal.className = "modal-backdrop order-actions-backdrop legacy-order-actions-backdrop";
  modal.innerHTML = `<section class="order-actions-sheet" aria-label="Действия заявки №${escapeHtml(order.id)}">
    <div class="order-actions-head">
      <div><strong>Заявка №${escapeHtml(order.id || "—")}</strong><small>Дополнительные действия</small></div>
      <button type="button" class="order-actions-close" aria-label="Закрыть">${icon("close")}</button>
    </div>
    <div class="order-actions-grid">
      <button type="button" data-order-sheet-action="copy">${icon("copy")}<b>Копия заявки</b></button>
      <button type="button" data-order-sheet-action="receipt">${icon("document")}<b>Квитанция</b></button>
      <button type="button" data-order-sheet-action="act">${icon("printer")}<b>Акт / PDF</b></button>
      ${tg ? `<a href="${escapeHtml(tg)}">${icon("telegram")}<b>Telegram</b></a>` : `<button type="button" disabled>${icon("telegram")}<b>Telegram</b></button>`}
      <button type="button" data-order-sheet-action="archive">${icon(order.archived ? "reopen" : "archive")}<b>${order.archived ? "Вернуть" : "В архив"}</b></button>
      ${order.archived ? `<button type="button" class="danger order-actions-delete" data-order-sheet-action="delete">${icon("trash")}<b>Удалить навсегда</b></button>` : ""}
    </div>
    <button type="button" class="order-actions-cancel" data-close-modal>Отмена</button>
  </section>`;
  document.body.appendChild(modal);

  const close = () => modal.remove();
  modal.querySelector(".order-actions-close").addEventListener("click", close);
  modal.addEventListener("click", (event) => { if (event.target === modal) close(); });
  modal.querySelectorAll("[data-order-sheet-action]").forEach((button) => button.addEventListener("click", async () => {
    const action = button.dataset.orderSheetAction;
    close();
    if (action === "act") {
      selectedActOrderId = String(order.id);
      activePage = "more";
      moreSection = "act";
      saveUiState({ scrollY: 0 });
      await render();
      window.scrollTo(0, 0);
      return;
    }
    return handleOrderAction(action, order.id);
  }));
}

function orderDetailModal(order) {
  const statusType = normalizeStatus(order.status);
  const isClosed = statusType === "closed";
  const isDeclined = statusType === "declined";
  const cardClass = isClosed ? "closed" : isDeclined ? "declined" : "active";
  const statusText = order.archived ? "Архив" : (order.status || "В работе");
  const services = Array.isArray(order.services) ? order.services : [];
  const materials = Array.isArray(order.materials) ? order.materials : [];
  const photos = (Array.isArray(order.photos) ? order.photos : []).map(photoSource).filter(Boolean);
  const net = orderNetAmount(order);
  const phoneHref = String(order.phone || "").replace(/[^+\d]/g, "");
  const guaranteeText = Number(order.guarantee) > 0 ? `${escapeHtml(order.guarantee)} мес.` : "без гарантии";
  const serviceTotal = services.reduce((sum,item) => sum + (Number(item.qty)||1) * (Number(item.price)||0), 0);
  const materialTotal = materials.reduce((sum,item) => sum + (Number(item.qty)||1) * (Number(item.unitCost)||0), 0);

  const modal = document.createElement("div");
  modal.className = "modal-backdrop order-detail-backdrop legacy-order-detail-backdrop";
  modal.innerHTML = `<section class="modal order-detail-modal legacy-order-detail-modal" aria-label="Заявка №${escapeHtml(order.id)}">
    <header class="legacy-order-detail-brand">
      <button type="button" class="legacy-detail-back" data-close-modal aria-label="Назад">${icon("back")}</button>
      <span class="legacy-detail-logo">${icon("logo")}</span>
      <span class="legacy-detail-brand-copy"><strong>CRM by <b>Romanychev</b></strong><small>ЛИЧНЫЙ КАБИНЕТ МАСТЕРА</small></span>
      <button type="button" class="legacy-detail-more" data-detail-action="more" aria-label="Ещё">${icon("more")}</button>
    </header>

    <main class="legacy-order-detail-content">
      <article class="legacy-expanded-order-card ${cardClass}">
        <span class="legacy-expanded-accent"></span>

        <div class="legacy-expanded-head">
          <div class="legacy-expanded-title"><b>№${escapeHtml(order.id || "—")}</b><strong>${escapeHtml(order.name || "Без имени")}</strong></div>
          <div class="legacy-expanded-head-side"><time>${shortDate(orderDateValue(order))}</time><span class="legacy-expanded-status ${cardClass}">${escapeHtml(statusText)}</span></div>
        </div>

        <div class="legacy-expanded-device">
          <span class="legacy-expanded-device-icon">${icon(applianceIconName(order.tech))}</span>
          <span class="legacy-expanded-device-copy"><strong>${escapeHtml(order.tech || "Техника")}</strong><small>${escapeHtml(order.brand || "Модель не указана")}</small></span>
        </div>

        <div class="legacy-expanded-money">
          <div><span>СУММА КЛИЕНТА</span><strong>${money(order.sum)}</strong></div>
          <div><span class="net">${icon("goods")} НА РУКИ</span><strong class="${isClosed ? "green" : ""}">${isClosed ? money(net) : "После закрытия"}</strong></div>
        </div>

        <div class="legacy-expanded-meta">
          ${order.phone ? `<span>${icon("phone")}<b>${escapeHtml(order.phone)}</b></span>` : ""}
          ${order.address ? `<span class="address">${icon("location")}<b>${escapeHtml(order.address)}</b></span>` : ""}
          <span>${icon("shield")}<b>${guaranteeText}</b></span>
        </div>
        ${order.nextVisit ? `<div class="legacy-expanded-visit">${icon("calendar")}<span>Следующий визит: ${escapeHtml(formatVisitDate(order.nextVisit))}</span></div>` : ""}

        ${photos.length ? `<div class="legacy-expanded-photos">${photos.slice(0,6).map((src,index)=>`<button type="button" class="legacy-expanded-photo" aria-label="Фото ${index+1}"><img src="${src}" alt="" /></button>`).join("")}</div>` : ""}

        <div class="legacy-expanded-actions">
          <button type="button" data-detail-action="edit">${icon("edit")}<span>Изменить</span></button>
          <button type="button" data-detail-action="toggle" class="action-toggle">${icon(isClosed ? "reopen" : "check")}<span>${isClosed ? "Открыть" : "Закрыть"}</span></button>
          ${phoneHref ? `<a href="tel:${escapeHtml(phoneHref)}" class="phone">${icon("phone")}<span>Позвонить</span></a>` : `<button type="button" class="phone" disabled>${icon("phone")}<span>Позвонить</span></button>`}
          <button type="button" data-detail-action="more" class="more">${icon("more")}<span>Ещё</span></button>
        </div>
      </article>

      <section class="legacy-detail-section legacy-detail-services">
        <div class="legacy-detail-section-head"><span>${icon("tools")}</span><h3>Работы и услуги</h3><b>${money(serviceTotal)}</b></div>
        ${services.length ? `<div class="legacy-detail-lines">${services.map(item=>`<div class="legacy-detail-line"><span><strong>${escapeHtml(item.name || "Услуга")}</strong><small>${escapeHtml(item.qty || 1)} шт. · ${money(item.price || 0)} / ед.</small></span><b>${money((Number(item.qty)||1)*(Number(item.price)||0))}</b></div>`).join("")}</div>` : `<p class="legacy-detail-empty">Работы пока не добавлены.</p>`}
      </section>

      <section class="legacy-detail-section legacy-detail-materials">
        <div class="legacy-detail-section-head"><span>${icon("warehouse")}</span><h3>Запчасти и материалы</h3><b>${money(materialTotal)}</b></div>
        ${materials.length ? `<div class="legacy-detail-lines">${materials.map(item=>`<div class="legacy-detail-line"><span><strong>${escapeHtml(item.name || "Материал")}</strong><small>${escapeHtml(item.qty || 1)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))} · себестоимость ${money(item.unitCost || 0)}</small></span><b>${money((Number(item.qty)||1)*(Number(item.unitCost)||0))}</b></div>`).join("")}</div>` : `<p class="legacy-detail-empty">Материалы пока не добавлены.</p>`}
      </section>

      ${order.issue || order.diagnosis || order.defects || order.comment ? `<section class="legacy-detail-section legacy-detail-notes">
        <div class="legacy-detail-section-head"><span>${icon("document")}</span><h3>Описание ремонта</h3></div>
        ${order.issue ? `<div><span>НЕИСПРАВНОСТЬ</span><p>${escapeHtml(order.issue)}</p></div>` : ""}
        ${order.diagnosis ? `<div><span>ДИАГНОСТИКА</span><p>${escapeHtml(order.diagnosis)}</p></div>` : ""}
        ${order.defects ? `<div><span>ВНЕШНИЕ ДЕФЕКТЫ</span><p>${escapeHtml(order.defects)}</p></div>` : ""}
        ${order.comment ? `<div><span>КОММЕНТАРИЙ</span><p>${escapeHtml(order.comment)}</p></div>` : ""}
      </section>` : ""}

      <section class="legacy-detail-total-row">
        <span>Итого по заявке</span><strong>${money(order.sum)}</strong>
      </section>
    </main>
  </section>`;

  document.body.appendChild(modal);

  const run = (action) => {
    modal.remove();
    if (action === "edit") return newOrderModal(order);
    if (action === "more") return orderActionsSheet(order);
    return handleOrderAction(action, order.id);
  };
  modal.querySelectorAll("[data-detail-action]").forEach((button) => button.addEventListener("click", () => run(button.dataset.detailAction)));
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
}

function copyComputedStylesForImage(source, target) {
  if (!(source instanceof Element) || !(target instanceof Element)) return;
  const computed = getComputedStyle(source);
  for (const property of computed) {
    const value = computed.getPropertyValue(property);
    if (/url\s*\(/i.test(value)) continue;
    target.style.setProperty(property, value, computed.getPropertyPriority(property));
  }
  target.querySelectorAll?.("img,video,canvas").forEach((node) => node.remove());
  const sourceChildren = [...source.children];
  const targetChildren = [...target.children];
  sourceChildren.forEach((child, index) => {
    const targetChild = targetChildren[index];
    if (targetChild) copyComputedStylesForImage(child, targetChild);
  });
}

async function saveActAsImage() {
  const sheet = document.querySelector(".act-sheet");
  if (!sheet) return toast("Сначала выбери заявку");
  try {
    if (document.fonts?.ready) await document.fonts.ready;
    const rect = sheet.getBoundingClientRect();
    const width = Math.max(320, Math.ceil(rect.width));
    const height = Math.max(1, Math.ceil(sheet.scrollHeight));
    const clone = sheet.cloneNode(true);
    copyComputedStylesForImage(sheet, clone);
    clone.style.width = `${width}px`;
    clone.style.height = "auto";
    clone.style.margin = "0";
    clone.style.boxSizing = "border-box";
    clone.style.transform = "none";
    clone.style.zoom = "1";

    const serialized = new XMLSerializer().serializeToString(clone);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;height:${height}px;background:#fff;">${serialized}</div>
      </foreignObject>
    </svg>`;
    const svgUrl = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    const image = new Image();
    image.decoding = "async";
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error("Не удалось отрисовать акт"));
      image.src = svgUrl;
    });

    const scale = Math.min(3, Math.max(2, 1080 / width));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(width * scale);
    canvas.height = Math.round(height * scale);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Не удалось создать изображение");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const png = await new Promise((resolve) => canvas.toBlob(resolve, "image/png", 1));
    if (!png) throw new Error("Не удалось сохранить PNG");
    const pngUrl = URL.createObjectURL(png);
    const orderId = sheet.dataset.actOrderId || "act";
    const link = document.createElement("a");
    link.href = pngUrl;
    link.download = `Акт_${orderId}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(pngUrl), 2000);
    toast("Акт сохранён картинкой");
  } catch (error) {
    console.error(error);
    toast(error.message || "Не удалось сохранить акт");
  }
}

async function handleOrderAction(action, id) {
  const index = data.orders.findIndex((item) => String(item.id) === String(id));
  if (index < 0) return;
  const order = data.orders[index];
  if (action === "view") return orderDetailModal(order);
  if (action === "edit") return newOrderModal(order);
  if (action === "more") return orderActionsSheet(order);
  if (action === "receipt") return receiptModal({ title: "Квитанция", date: new Date().toISOString(), amount: Number(order.sum) || 0, orderId: order.id, note: [order.tech, order.brand].filter(Boolean).join(" ") });
  if (action === "toggle") {
    const wasClosed = normalizeStatus(order.status) === "closed";
    if (!wasClosed) {
      if ((Number(order.sum) || 0) <= 0) return toast("Для закрытия заявки укажи итоговую сумму больше 0");
      if (!(await confirmOrderClose(order))) return;
    }
    const previous = structuredClone(order);
    const next = { ...structuredClone(order), status: wasClosed ? "В работе" : "Закрыта" };
    const stockSync = syncOrderStock(previous, next);
    if (!stockSync.ok) return toast(stockSync.message);
    Object.assign(order, next);
    syncOrderCompletion(order, previous);
  }
  if (action === "copy") {
    const copy = {
      ...structuredClone(order),
      id: newOrderId(),
      created: new Date().toISOString(),
      status: "В работе",
      completed: null,
      updatedAt: new Date().toISOString(),
      archived: false,
      archivedAt: null,
      photos: []
    };
    const stockSync = syncOrderStock(null, copy);
    if (!stockSync.ok) return toast(`Копия не создана: ${stockSync.message}`);
    data.orders.push(copy);
  }
  if (action === "archive") {
    const previous = structuredClone(order);
    const next = { ...structuredClone(order), archived: !order.archived, archivedAt: !order.archived ? new Date().toISOString() : null };
    const stockSync = syncOrderStock(previous, next);
    if (!stockSync.ok) return toast(stockSync.message);
    Object.assign(order, next);
  }
  if (action === "delete") {
    if (!order.archived) return toast("Сначала перемести заявку в архив");
    if (!(await confirmDialog(`Удалить заявку №${order.id || "—"} навсегда? История будет полностью стёрта.`))) return;
    const stockSync = syncOrderStock(order, null);
    if (!stockSync.ok) return toast(stockSync.message);
    data.orders.splice(index, 1);
    await saveData();
    await render();
    return toast("Заявка удалена");
  }
  await saveData();
  render();
  toast(action === "copy" ? "Создана копия заявки" : action === "archive" ? (order.archived ? "Заявка перемещена в архив" : "Заявка возвращена") : "Статус обновлён");
}

async function adjustStock(id, direction) {
  const item = data.warehouse.find((entry) => String(entry.id) === String(id));
  if (!item) return;

  const incoming = direction === "in";
  const physicalBefore = Number(item.quantity) || 0;
  const reservedBefore = stockReservedQuantity(item.id);
  const before = stockAvailableQuantity(item);
  const modal = document.createElement("div");
  modal.className = "modal-backdrop stock-adjust-backdrop";
  modal.innerHTML = `<form class="modal stock-adjust-modal" id="stock-adjust-form">
    <div class="stock-adjust-head">
      <span class="stock-adjust-icon ${incoming ? "incoming" : "outgoing"}">${icon(incoming ? "plus" : "minus")}</span>
      <div><strong>${incoming ? "Приход" : "Списание"}</strong><small>${escapeHtml(item.name || "Позиция склада")}</small></div>
      <button type="button" data-close-modal aria-label="Закрыть">${icon("close")}</button>
    </div>
    <div class="stock-adjust-balance">
      <span>СЕЙЧАС НА СКЛАДЕ</span>
      <strong>${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(before)} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}</strong>
    </div>
    <label class="stock-adjust-field">
      <span>КОЛИЧЕСТВО</span>
      <input class="field" name="amount" type="number" min="0.01" step="0.01" value="1" inputmode="decimal" required autofocus />
    </label>
    <div class="stock-adjust-preview">
      <span>ОСТАТОК ПОСЛЕ ОПЕРАЦИИ</span>
      <strong id="stock-adjust-result">${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(incoming ? before + 1 : Math.max(0,before - 1))} ${escapeHtml(normalizeStockUnit(item.unit || "шт"))}</strong>
    </div>
    <div class="stock-adjust-actions">
      <button type="button" class="legacy-dark-button" data-close-modal>Отмена</button>
      <button type="submit" class="${incoming ? "stock-adjust-confirm incoming" : "stock-adjust-confirm outgoing"}">${incoming ? "Добавить" : "Списать"}</button>
    </div>
  </form>`;
  document.body.appendChild(modal);

  const input = modal.querySelector('[name="amount"]');
  const result = modal.querySelector("#stock-adjust-result");
  const updatePreview = () => {
    const amount = Number(input.value) || 0;
    const next = incoming ? before + amount : Math.max(0, before - amount);
    result.textContent = `${new Intl.NumberFormat("ru-RU",{maximumFractionDigits:2}).format(next)} ${normalizeStockUnit(item.unit || "шт")}`;
    result.className = !incoming && amount > before ? "red" : "";
  };
  input.addEventListener("input", updatePreview);
  modal.querySelectorAll("[data-close-modal]").forEach((button) => button.addEventListener("click", () => modal.remove()));
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const amount = Number(input.value);
    if (!Number.isFinite(amount) || amount <= 0) return toast("Укажи количество");
    if (!incoming && amount > before) return toast(`Недостаточно на складе: доступно ${before} ${normalizeStockUnit(item.unit || "шт")}`);
    item.quantity = incoming ? physicalBefore + amount : physicalBefore - amount;
    data.warehouse_movements.push({
      id: crypto.randomUUID(),
      warehouseId: item.id,
      name: item.name,
      qty: amount,
      type: incoming ? "manual_in" : "manual_out",
      date: new Date().toISOString()
    });
    await saveData();
    modal.remove();
    await render();
    toast(incoming ? "Приход сохранён" : "Списание сохранено");
  });
  updatePreview();
  requestAnimationFrame(() => input.focus());
}

function closeTopModalFromKeyboard() {
  const backdrops = [...document.querySelectorAll(".modal-backdrop")];
  const top = backdrops.at(-1);
  if (!top) return false;
  const closeButton = top.querySelector(".catalog-close, .material-catalog-head-close, .material-catalog-close, .order-actions-close, [data-close-modal], [data-confirm-cancel]");
  if (closeButton) closeButton.click();
  else top.remove();
  return true;
}

let modalLockScrollY = 0;

const syncModalScrollLock = () => {
  const backdrops = [...document.querySelectorAll(".modal-backdrop")];
  backdrops.forEach((backdrop, index) => {
    const underlay = index < backdrops.length - 1;
    backdrop.classList.toggle("modal-underlay", underlay);
    backdrop.inert = underlay;
    if (underlay) backdrop.setAttribute("aria-hidden", "true");
    else backdrop.removeAttribute("aria-hidden");
    const dialog = backdrop.querySelector('[role="dialog"], .modal, .order-actions-sheet, .catalog-modal, .material-catalog-modal, .crm-confirm-modal');
    if (dialog) {
      if (!dialog.hasAttribute("role")) dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", underlay ? "false" : "true");
    }
  });
  const hasModal = backdrops.length > 0;
  const locked = document.body.classList.contains("modal-open");

  if (hasModal && !locked) {
    modalLockScrollY = window.scrollY || document.documentElement.scrollTop || 0;
    document.documentElement.classList.add("modal-open");
    document.body.classList.add("modal-open");
    document.body.style.top = `-${modalLockScrollY}px`;
    return;
  }

  if (!hasModal && locked) {
    const restoreY = modalLockScrollY;
    document.documentElement.classList.remove("modal-open");
    document.body.classList.remove("modal-open");
    document.body.style.top = "";
    requestAnimationFrame(() => window.scrollTo(0, restoreY));
  }
};

const modalScrollObserver = new MutationObserver(syncModalScrollLock);
modalScrollObserver.observe(document.body, { childList: true, subtree: true });
syncModalScrollLock();

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (closeTopModalFromKeyboard()) event.preventDefault();
});

document.addEventListener("click", (event) => {
  const closeButton = event.target.closest("[data-close-modal]");
  if (!closeButton) return;
  const backdrop = closeButton.closest(".modal-backdrop");
  if (!backdrop) return;
  event.preventDefault();
  backdrop.remove();
  syncModalScrollLock();
});

const stopBackgroundScrollWhileModalOpen = (event) => {
  if (!document.body.classList.contains("modal-open")) return;
  const target = event.target instanceof Element ? event.target : null;
  if (target?.closest(".modal-backdrop")) return;
  event.preventDefault();
};

document.addEventListener("touchmove", stopBackgroundScrollWhileModalOpen, { passive: false });
document.addEventListener("wheel", stopBackgroundScrollWhileModalOpen, { passive: false });

app.addEventListener("click", async (event) => {
  const navButton = event.target.closest("[data-nav]");
  if (navButton) {
    activePage = navButton.dataset.nav;
    if (activePage === "warehouse") warehouseSection = "list";
    if (activePage === "more") {
      moreSection = "menu";
      moreReturnSection = "menu";
    } else {
      moreSection = "menu";
    }
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) { orderFilter = filter.dataset.filter; saveUiState(); await render(); return; }
  const warehouseFilterButton = event.target.closest("[data-warehouse-filter]");
  if (warehouseFilterButton) {
    warehouseFilter = warehouseFilterButton.dataset.warehouseFilter;
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  const movementFilterButton = event.target.closest("[data-movement-filter]");
  if (movementFilterButton) {
    warehouseMovementFilter = movementFilterButton.dataset.movementFilter;
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  const visitFilter = event.target.closest("[data-visit-filter]");
  if (visitFilter) {
    orderVisitFilter = visitFilter.dataset.visitFilter || "all";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  const calendarShift = event.target.closest("[data-calendar-shift]");
  if (calendarShift) {
    calendarMonthOffset += Number(calendarShift.dataset.calendarShift) || 0;
    const now = new Date();
    const monthDate = new Date(now.getFullYear(), now.getMonth() + calendarMonthOffset, 1);
    calendarSelectedDate = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, "0")}-01`;
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  const calendarDate = event.target.closest("[data-calendar-date]");
  if (calendarDate) {
    calendarSelectedDate = calendarDate.dataset.calendarDate;
    saveUiState();
    await render();
    document.querySelector(".calendar-day-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  const calendarOrder = event.target.closest("[data-calendar-order]");
  if (calendarOrder) {
    const order = data.orders.find((item) => String(item.id) === String(calendarOrder.dataset.calendarOrder));
    if (order) return orderDetailModal(order);
    return;
  }

  const analyticsFilter = event.target.closest("[data-analytics-period]");
  if (analyticsFilter) {
    const period = analyticsFilter.dataset.analyticsPeriod;
    if (period === "custom") return analyticsRangeModal();
    analyticsPeriod = period;
    analyticsOffset = 0;
    saveUiState();
    await render();
    return;
  }
  const analyticsShift = event.target.closest("[data-analytics-shift]");
  if (analyticsShift) {
    analyticsOffset += Number(analyticsShift.dataset.analyticsShift) || 0;
    if (analyticsOffset > 0) analyticsOffset = 0;
    saveUiState();
    await render();
    return;
  }
  const financeFilter = event.target.closest("[data-finance-period]");
  if (financeFilter) { financePeriod = financeFilter.dataset.financePeriod; saveUiState(); await render(); return; }
  const priceKindButton = event.target.closest("[data-price-kind]");
  if (priceKindButton) {
    priceKindFilter = priceKindButton.dataset.priceKind || "all";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "open-warehouse-movements") {
    activePage = "warehouse";
    warehouseSection = "movements";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "open-shopping") {
    activePage = "warehouse";
    warehouseSection = "shopping";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "warehouse-list") {
    activePage = "warehouse";
    warehouseSection = "list";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "copy-shopping-list") return copyTextToClipboard(shoppingListText(), "Список покупок скопирован");
  if (action === "share-shopping-list") return shareShoppingList();
  if (action === "new-order") return newOrderModal();
  if (action === "manage-order-sources") return orderSourcesModal();
  if (action === "manage-warranty-options") return warrantyOptionsModal();
  if (action === "reset-order-filters") {
    orderFilter = "all";
    orderVisitFilter = "all";
    searchQuery = "";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "import") return fileInput.click();
  if (action === "inspect-backup-file") return inspectBackupFile();
  if (action === "download-backup") return downloadBackup();
  if (action === "choose-folder") return chooseBackupFolder();
  if (action === "folder-backup") return writeBackupToDirectory();
  if (action === "backup-self-test") return runBackupSelfTest();
  if (action === "restore-pre-import") {
    const rollback = await dbGet(PRE_IMPORT_KEY);
    if (!rollback) return toast("Точки отката пока нет");
    if (!(await confirmDialog("Вернуть данные, которые были до последнего импорта?", { confirmLabel: "Вернуть данные" }))) return;
    const current = structuredClone(data);
    data = validateBackup(structuredClone(rollback));
    ensureDataIds();
    migrateStockReservationModel();
    await saveData();
    await dbSet(PRE_IMPORT_KEY, current);
    activePage = "orders";
    moreSection = "menu";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return toast("Данные до импорта восстановлены");
  }
  if (action === "more-menu") { moreSection = "menu"; moreReturnSection = "menu"; saveUiState({ scrollY: 0 }); window.scrollTo(0, 0); return render(); }
  if (action === "more-back") {
    moreSection = moreReturnSection || "menu";
    const target = moreSection;
    moreReturnSection = target === "menu" ? "menu" : "menu";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "settings-screen") {
    activePage = "more";
    moreReturnSection = "menu";
    moreSection = "settings";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "analytics-screen") {
    activePage = "analytics";
    moreSection = "menu";
    moreReturnSection = "menu";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "calendar-screen") {
    activePage = "more";
    moreReturnSection = "menu";
    moreSection = "calendar";
    calendarMonthOffset = 0;
    calendarSelectedDate = localDateInputValue();
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "add-finance") return financeModal(event.target.closest("[data-action]").dataset.type);
  if (action === "check-update") return checkForAppUpdate();
  if (action === "run-diagnostics") return runAppDiagnostics();
  if (action === "protect-storage") return requestPersistentStorage();
  if (action === "new-price") return priceModal();
  if (action === "open-receipts") {
    activePage = "more";
    moreReturnSection = "act";
    moreSection = "receipts";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "act-screen") {
    activePage = "more";
    moreSection = "act";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  if (action === "new-receipt") return receiptModal();
  if (action === "continue-draft") {
    const key = event.target.closest("[data-action]").dataset.key;
    const draft = getDraftRecord(key);
    if (draft && typeof draft === "object") return newOrderModal(draft, { forceNew: true });
    return toast("Этот черновик нельзя продолжить как заявку");
  }
  if (action === "delete-draft") {
    const key = event.target.closest("[data-action]").dataset.key;
    if (!(await confirmDialog("Удалить этот черновик?"))) return;
    removeDraftRecord(key);
    await saveData();
    await render();
    return toast("Черновик удалён");
  }
  if (action === "edit-receipt") {
    const index = Number(event.target.closest("[data-action]").dataset.index);
    const item = data.receipts[index];
    if (item) return receiptModal(item, index);
  }
  if (action === "new-custom-service") return customServiceModal();
  if (action === "edit-custom-service") {
    const index = Number(event.target.closest("[data-action]").dataset.index);
    const item = data.service_custom[index];
    if (item) return customServiceModal(item, index);
  }
  if (action === "archive-stock") {
    const id = event.target.closest("[data-action]").dataset.id;
    const item = data.warehouse.find((entry) => String(entry.id) === String(id));
    if (!item) return;
    item.archived = !item.archived;
    await saveData();
    await render();
    return toast(item.archived ? "Позиция перемещена в архив" : "Позиция возвращена на склад");
  }
  if (action === "new-tool") return toolModal();
  if (action === "edit-tool") {
    const index = Number(event.target.closest("[data-action]").dataset.index);
    const item = data.tools[index];
    if (item) return toolModal(item, index);
  }
  if (action === "open-client") return clientModal(event.target.closest("[data-action]").dataset.key);
  if (action === "edit-price") {
    const index = Number(event.target.closest("[data-action]").dataset.index);
    const item = data.receipt_prices[index];
    if (item) return priceModal(item, index);
  }
  if (action === "new-stock") return stockModal();
  if (action === "edit-stock") {
    const id = event.target.closest("[data-action]").dataset.id;
    const item = data.warehouse.find((entry) => String(entry.id) === String(id));
    if (item) return stockModal(item);
  }
  if (action === "open-product-price") {
    const panel = document.querySelector("#product-price-panel");
    if (panel) {
      panel.open = true;
      panel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    return;
  }
  if (action === "new-goods-sheet") return goodsModal();
  if (action === "new-goods-from-order") {
    const select = document.querySelector("#goods-source-order");
    const orderId = select?.value || "";
    if (!orderId) return toast("Выбери закрытую заявку");
    const order = data.orders.find((item) => String(item.id) === String(orderId));
    if (!order) return toast("Заявка не найдена");
    const items = (Array.isArray(order.materials) ? order.materials : []).map((item) => ({
      name: item.name || "Материал",
      qty: Number(item.qty) || 1,
      unit: normalizeStockUnit(item.unit || "шт"),
      price: Number(item.price) || 0,
      originalPrice: Number(item.price) || 0
    })).filter((item) => item.name);
    if (!items.length) return toast("В заявке нет использованных товаров или материалов");
    const total = items.reduce((sum,item) => sum + item.qty * item.price, 0);
    return goodsModal(null, {
      id: crypto.randomUUID(),
      title: `Товарник по заявке №${order.id}`,
      items,
      target: total,
      total,
      createdAt: new Date().toISOString(),
      sourceOrderId: order.id
    });
  }
  if (action === "edit-goods-sheet") {
    const id = event.target.closest("[data-action]").dataset.id;
    const sheet = (data.goods_sheets || []).find((item) => String(item.id) === String(id));
    if (sheet) return goodsModal(sheet);
  }
  if (action === "save-act-image") return saveActAsImage();
  if (action === "toggle-auto") {
    data.settings.autoBackup = !data.settings.autoBackup;
    await saveData();
    await render();
    toast(data.settings.autoBackup ? "Автобэкап включён" : "Автобэкап выключен");
    return;
  }
  const more = event.target.closest("[data-more]")?.dataset.more;
  if (more) {
    const supportedMoreSections = ["calendar", "shopping", "backup", "prices", "clients", "finance", "goods", "tools", "receipts", "drafts", "act", "settings"];
    if (!supportedMoreSections.includes(more)) return toast("Раздел недоступен");
    if (more === "shopping") activePage = "more";
    moreReturnSection = moreSection === "settings" ? "settings" : "menu";
    moreSection = more;
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  const orderAction = event.target.closest("[data-order-action]");
  if (orderAction) return handleOrderAction(orderAction.dataset.orderAction, orderAction.dataset.id);
  const stockDetail = event.target.closest("[data-stock-detail]");
  if (stockDetail) {
    const item = data.warehouse.find((entry) => String(entry.id) === String(stockDetail.dataset.stockDetail));
    if (item) return stockDetailModal(item);
  }
  const stock = event.target.closest("[data-stock]");
  if (stock) return adjustStock(stock.dataset.id, stock.dataset.stock);
  const financeDelete = event.target.closest("[data-delete-finance]");
  if (financeDelete) {
    const key = financeDelete.dataset.deleteFinance === "income" ? "incomes" : "expenses";
    const sourceIndex = Number(financeDelete.dataset.index);
    if (!Number.isInteger(sourceIndex) || sourceIndex < 0 || sourceIndex >= data[key].length) return toast("Операция не найдена");
    const operation = data[key][sourceIndex];
    const operationName = operation?.description || operation?.category || "операцию";
    if (!(await confirmDialog(`Удалить финансовую операцию «${operationName}»?`))) return;
    data[key].splice(sourceIndex, 1);
    await saveData();
    await render();
    toast("Операция удалена");
  }
});

app.addEventListener("focusin", (event) => {
  const priceSearch = event.target.closest?.("#price-search");
  if (priceSearch) priceSearch.closest(".legacy-price-search")?.classList.add("is-focused");
});

app.addEventListener("focusout", (event) => {
  const priceSearch = event.target.closest?.("#price-search");
  if (!priceSearch) return;
  requestAnimationFrame(() => {
    const wrap = document.querySelector(".legacy-price-search");
    if (wrap && !wrap.contains(document.activeElement)) wrap.classList.remove("is-focused");
  });
});

app.addEventListener("input", (event) => {
  if (event.target.closest("#settings-form") && event.target.name === "phone") {
    sanitizeRussianPhoneField(event.target);
    return;
  }
  const liveSearch = async (selector) => {
    const cursor = event.target.selectionStart;
    await render();
    const input = document.querySelector(selector);
    input?.focus();
    input?.setSelectionRange(cursor, cursor);
  };
  if (event.target.id === "order-search") {
    searchQuery = event.target.value;
    saveUiState();
    return liveSearch("#order-search");
  }
  if (event.target.id === "warehouse-search") {
    warehouseSearch = event.target.value;
    saveUiState();
    return liveSearch("#warehouse-search");
  }
  if (event.target.id === "client-search") {
    clientSearch = event.target.value;
    saveUiState();
    return liveSearch("#client-search");
  }
  if (event.target.id === "price-search") {
    priceSearch = event.target.value;
    saveUiState();
    return liveSearch("#price-search");
  }
});

app.addEventListener("submit", async (event) => {
  if (event.target.id !== "settings-form") return;
  event.preventDefault();
  const settingsPhoneInput = event.target.elements.phone;
  const rawSettingsPhone = String(settingsPhoneInput?.value || "").trim();
  const normalizedSettingsPhone = sanitizeRussianPhoneField(settingsPhoneInput);
  if (rawSettingsPhone && !isValidRussianPhone(normalizedSettingsPhone)) {
    settingsPhoneInput?.focus();
    return toast("Телефон мастера: формат +7XXXXXXXXXX");
  }
  const form = new FormData(event.target);
  data.settings = {
    ...data.settings,
    companyName: form.get("companyName"),
    name: form.get("name"),
    phone: normalizedSettingsPhone,
    companyAddress: form.get("companyAddress"),
    inn: form.get("inn")
  };
  await saveData();
  toast("Настройки сохранены");
});

app.addEventListener("change", async (event) => {
  if (event.target.id === "search-master-comment-toggle") {
    data.settings.searchMasterComment = Boolean(event.target.checked);
    await saveData();
    toast(event.target.checked ? "Поиск по комментариям включён" : "Поиск по комментариям выключен");
    return;
  }
  if (event.target.id === "price-tech-filter") {
    priceTechFilter = event.target.value;
    saveUiState();
    await render();
    return;
  }
  if (event.target.id === "price-kind-filter") {
    priceKindFilter = event.target.value;
    saveUiState();
    await render();
    return;
  }
  if (event.target.id === "order-visit-filter") {
    orderVisitFilter = event.target.value;
    saveUiState();
    await render();
    return;
  }
  if (event.target.id === "warehouse-filter-select") {
    warehouseFilter = event.target.value;
    saveUiState();
    await render();
    return;
  }
  if (event.target.id === "act-order-select") {
    selectedActOrderId = event.target.value;
    saveUiState();
    await render();
    return;
  }
  if (event.target.id === "backup-days") {
    data.settings.autoBackupDays = Number(event.target.value);
    await saveData();
    toast("Периодичность сохранена");
  }
});

fileInput.addEventListener("change", async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  try {
    const candidate = JSON.parse(await file.text());
    const restored = validateBackup(candidate);
    const blockingIssues = backupBlockingIssues(restored);
    if (blockingIssues.length) throw new Error(`Импорт заблокирован: ${blockingIssues.join("; ")}`);
    const warnings = backupWarnings(restored);
    const warningText = warnings.length ? `\n\nПредупреждения:\n• ${warnings.join("\n• ")}` : "";
    const confirmed = await confirmDialog(`Восстановить ${restored.orders.length} заявок, ${restored.warehouse.length} складских позиций и ${restored.receipt_prices.length} цен?\n\nТекущие данные будут сохранены как точка отката перед заменой.${warningText}`, { title: "Восстановление бэкапа", confirmLabel: "Восстановить" });
    if (!confirmed) return;
    await dbSet(PRE_IMPORT_KEY, structuredClone(data));
    data = restored;
    ensureDataIds();
    migrateStockReservationModel();
    await saveData();
    activePage = "orders";
    moreSection = "menu";
    saveUiState({ scrollY: 0 });
    await render();
    toast("Бэкап успешно восстановлен");
  } catch (error) {
    console.error(error);
    toast(`Ошибка импорта: ${error.message}`);
  } finally {
    fileInput.value = "";
  }
});

async function start() {
  try {
    const stored = await dbGet(DATA_KEY);
    if (stored) {
      data = validateBackup(stored);
      let migrated = ensureDataIds();
      if (migrateStockReservationModel()) migrated = true;
      if (migrated) await saveData();
    }
  } catch (error) {
    console.error("Не удалось прочитать локальную базу", error);
    toast("Не удалось открыть локальную базу");
  }
  await render();
  if (restoreScrollY > 0) {
    const targetY = restoreScrollY;
    restoreScrollY = 0;
    requestAnimationFrame(() => requestAnimationFrame(() => window.scrollTo(0, targetY)));
  }
  await maybeAutoBackup();
  if ("serviceWorker" in navigator) {
    let reloadingForUpdate = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloadingForUpdate) return;
      reloadingForUpdate = true;
      window.location.replace(APP_URL);
    });
    navigator.serviceWorker.register("./sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update().catch(console.warn))
      .catch(console.warn);
  }
}

let uiScrollTimer = null;
window.addEventListener("scroll", () => {
  clearTimeout(uiScrollTimer);
  uiScrollTimer = setTimeout(() => saveUiState(), 120);
}, { passive: true });
window.addEventListener("beforeunload", () => saveUiState());
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") saveUiState();
});

start();
