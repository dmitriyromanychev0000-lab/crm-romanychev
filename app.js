const DB_NAME = "crm-romanychev";
const DB_VERSION = 1;
const STORE = "keyval";
const DATA_KEY = "crm-data";
const DIRECTORY_KEY = "backup-directory";
const PRE_IMPORT_KEY = "crm-pre-import-data";
const BACKUP_TEST_KEY = "crm-backup-self-test";
const DIAGNOSTIC_KEY = "crm-diagnostic-test";
const APP_VERSION = "0.24.0";
const APP_BUILD = "2026.09.25.24";
const APP_URL = "https://dmitriyromanychev0000-lab.github.io/crm-romanychev/";
const APP_RELEASE = "Проверка старых бэкапов без импорта, копирование диагностики и усиленная совместимость CRM BT v18";
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
  settings: {
    autoBackup: false,
    autoBackupDays: 1,
    lastBackupAt: null,
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
let orderPeriod = ["all", "7", "30", "90", "365"].includes(String(initialUiState.orderPeriod)) ? String(initialUiState.orderPeriod) : "all";
let searchQuery = typeof initialUiState.searchQuery === "string" ? initialUiState.searchQuery : "";
let warehouseSearch = typeof initialUiState.warehouseSearch === "string" ? initialUiState.warehouseSearch : "";
let clientSearch = typeof initialUiState.clientSearch === "string" ? initialUiState.clientSearch : "";
let analyticsPeriod = ["all", "30", "90", "365"].includes(String(initialUiState.analyticsPeriod)) ? String(initialUiState.analyticsPeriod) : "all";
let financePeriod = ["all", "30", "90", "365"].includes(String(initialUiState.financePeriod)) ? String(initialUiState.financePeriod) : "all";
let moreSection = typeof initialUiState.moreSection === "string" ? initialUiState.moreSection : "menu";
let selectedActOrderId = initialUiState.selectedActOrderId || null;
let restoreScrollY = Number(initialUiState.scrollY) || 0;

function saveUiState(extra = {}) {
  try {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify({
      activePage,
      orderFilter,
      orderPeriod,
      searchQuery,
      warehouseSearch,
      clientSearch,
      analyticsPeriod,
      financePeriod,
      moreSection,
      selectedActOrderId,
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
  logo: '<path d="M14.7 6.3a5 5 0 0 0-6.9 6.9L3.5 17.5a2.1 2.1 0 0 0 3 3l4.3-4.3a5 5 0 0 0 6.9-6.9l-3.1 3.1-3-3 3.1-3.1Z"/>',
  orders: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M8 9h8M8 13h8M8 17h5"/>',
  warehouse: '<path d="m4 9 8-5 8 5v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z"/><path d="M4 9h16M9 21v-7h6v7"/>',
  analytics: '<path d="M4 19V5M4 19h16"/><path d="m7 15 4-4 3 2 5-6"/>',
  more: '<circle cx="5" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.2" fill="currentColor" stroke="none"/>',
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
  phone: '<path d="M6.6 2.8 9 7.6 6.8 9a15 15 0 0 0 8.2 8.2l1.4-2.2 4.8 2.4v3a2 2 0 0 1-2 2C9.5 22.4 1.6 14.5 1.6 4.8a2 2 0 0 1 2-2Z"/>',
  appliance: '<rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 8h14M9 5h.01M13 5h.01"/><circle cx="12" cy="15" r="4"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  warning: '<path d="M12 3 2.5 20h19Z"/><path d="M12 9v5M12 17h.01"/>',
  chart: '<path d="M4 19V5M4 19h16"/><path d="M8 16v-4M12 16V8M16 16V5"/>',
  camera: '<path d="M4 7h4l2-3h4l2 3h4a2 2 0 0 1 2 2v10H2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/>',
  location: '<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  shield: '<path d="M12 3 20 6v6c0 5-3.4 8-8 10-4.6-2-8-5-8-10V6Z"/><path d="m9 12 2 2 4-4"/>',
  chevron: '<path d="m9 18 6-6-6-6"/>'
};

function icon(name, className = "") {
  const body = ICONS[name] || ICONS.document;
  return `<svg class="ui-icon ${escapeHtml(className)}" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
}

const money = (value) => `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number(value) || 0)} ₽`;

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

function validateBackup(candidate) {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) throw new Error("Файл не содержит объект CRM");
  const required = ["orders", "warehouse", "warehouse_movements", "expenses", "receipt_prices"];
  for (const key of required) {
    if (!Array.isArray(candidate[key])) throw new Error(`В бэкапе отсутствует или повреждён раздел ${key}`);
  }
  const optionalArrays = ["incomes", "service_custom", "receipts", "tools", "goods_sheets"];
  for (const key of optionalArrays) {
    if (key in candidate && !Array.isArray(candidate[key])) throw new Error(`Раздел ${key} имеет неверный формат`);
  }
  if (!candidate.settings || typeof candidate.settings !== "object" || Array.isArray(candidate.settings)) candidate.settings = {};
  return {
    ...defaultData(),
    ...candidate,
    settings: { ...defaultData().settings, ...candidate.settings }
  };
}

function backupWarnings(candidate) {
  const warnings = [];
  const version = Number(candidate.version);
  if (Number.isFinite(version) && version !== BACKUP_FORMAT_VERSION) {
    warnings.push(version > BACKUP_FORMAT_VERSION
      ? `версия бэкапа ${version} новее поддерживаемой ${BACKUP_FORMAT_VERSION}`
      : `версия бэкапа ${version}, ожидается CRM BT v${BACKUP_FORMAT_VERSION}`);
  }
  const duplicateCount = (items) => {
    const ids = items.map((item) => item?.id).filter((id) => id !== undefined && id !== null && String(id) !== "");
    return ids.length - new Set(ids.map(String)).size;
  };
  const orderDuplicates = duplicateCount(candidate.orders || []);
  const warehouseDuplicates = duplicateCount(candidate.warehouse || []);
  if (orderDuplicates > 0) warnings.push(`дубли ID заявок: ${orderDuplicates}`);
  if (warehouseDuplicates > 0) warnings.push(`дубли ID склада: ${warehouseDuplicates}`);
  const ordersWithoutId = (candidate.orders || []).filter((item) => !item?.id).length;
  if (ordersWithoutId > 0) warnings.push(`заявок без ID: ${ordersWithoutId}`);
  return warnings;
}

async function saveData() {
  data.date = new Date().toISOString();
  await dbSet(DATA_KEY, data);
}

function backupFilename() {
  const stamp = new Date().toISOString().slice(0, 10);
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
      modal.innerHTML = `<div class="modal compact-modal"><h2>Проверка бэкапа</h2><div class="goods-list">${rows.map(([name, value]) => `<div class="goods-sheet"><span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(value)}</small></span><b class="green">✓</b><span></span></div>`).join("")}</div>${warnings.length ? `<div class="form-section-title">Предупреждения</div><div class="panel">${warnings.map((item) => `<div class="small">• ${escapeHtml(item)}</div>`).join("")}</div>` : `<div class="panel"><strong class="green">Файл совместим с текущей CRM</strong></div>`}<div class="modal-actions"><button type="button" class="primary-button" data-close-modal>Закрыть</button></div></div>`;
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
    const sections = ["orders", "warehouse", "warehouse_movements", "expenses", "incomes", "service_custom", "receipts", "receipt_prices", "tools", "goods_sheets", "draft"];
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
    ["warehouse", "warehouse", "Склад"],
    ["analytics", "analytics", "Аналитика"],
    ["more", "more", "Ещё"]
  ];
  return `<nav class="bottom-nav">${items.map(([id, iconName, label]) => `
    <button class="nav-button ${activePage === id ? "active" : ""}" data-nav="${id}">
      <span class="nav-icon">${icon(iconName)}</span><span>${label}</span>
    </button>`).join("")}</nav>`;
}

function header() {
  return `<header class="topbar">
    <div class="logo">${icon("logo")}</div>
    <div class="brand">
      <div class="brand-title">CRM by <span>Romanychev</span> 😎</div>
      <div class="brand-subtitle">Личный кабинет мастера</div>
    </div>
  </header>`;
}

function emptyState(iconValue, title, description) {
  const legacyMap = { "▣": "orders", "▥": "warehouse", "⌕": "search", "♙": "clients", "▤": "document", "◇": "goods", "✎": "drafts", "🛠": "tools" };
  const iconName = legacyMap[iconValue] || iconValue;
  const graphic = ICONS[iconName] ? icon(iconName) : escapeHtml(iconValue);
  return `<div class="panel empty"><div class="empty-icon">${graphic}</div><h2>${title}</h2><p>${description}</p></div>`;
}

function orderCard(order) {
  const statusType = normalizeStatus(order.status);
  const isClosed = statusType === "closed";
  const isArchived = Boolean(order.archived);
  const photos = Array.isArray(order.photos) ? order.photos.length : 0;
  return `<article class="panel order-card ${isClosed ? "closed" : ""}">
    <div class="order-top">
      <div><span class="order-number">№${escapeHtml(order.id || "—")}</span><span class="order-name">${escapeHtml(order.name || "Без имени")}</span></div>
      <div><div class="order-date">${shortDate(order.created)}</div><span class="status ${isClosed ? "closed" : ""}">${isArchived ? "Архив" : escapeHtml(order.status || "В работе")}</span></div>
    </div>
    <div class="appliance">
      <div class="appliance-main"><div class="appliance-icon">${icon("appliance")}</div><div><div class="appliance-name">${escapeHtml(order.tech || "Техника")}</div><div class="appliance-model">${escapeHtml(order.brand || "Модель не указана")}</div></div></div>
      <div class="sum">${money(order.sum)}</div>
    </div>
    <div class="meta">
      ${order.phone ? `<span class="meta-item">${icon("phone")} ${escapeHtml(order.phone)}</span>` : ""}
      ${order.address ? `<span class="meta-item">${icon("location")} ${escapeHtml(order.address)}</span>` : ""}
      <span class="meta-item">${icon("shield")} ${escapeHtml(order.guarantee || 0)} мес.</span>
      ${photos ? `<span class="meta-item">${icon("camera")} ${photos} фото</span>` : ""}
    </div>
    <div class="actions">
      <button class="action" data-order-action="edit" data-id="${escapeHtml(order.id)}"><span>${icon("edit")}</span>Изменить</button>
      <button class="action" data-order-action="toggle" data-id="${escapeHtml(order.id)}"><span>${icon(isClosed ? "reopen" : "check")}</span>${isClosed ? "Открыть" : "Закрыть"}</button>
      <button class="action" data-order-action="copy" data-id="${escapeHtml(order.id)}"><span>${icon("copy")}</span>Копия</button>
      <button class="action" data-order-action="receipt" data-id="${escapeHtml(order.id)}"><span>${icon("document")}</span>Документ</button>
      <button class="action" data-order-action="archive" data-id="${escapeHtml(order.id)}"><span>${icon(isArchived ? "restore" : "archive")}</span>${isArchived ? "Вернуть" : "В архив"}</button>
      ${order.phone ? `<a class="action" href="tel:${escapeHtml(order.phone)}"><span>${icon("phone")}</span>Позвонить</a>` : `<button class="action" disabled><span>${icon("phone")}</span>Позвонить</button>`}
    </div>
  </article>`;
}

function ordersPage() {
  const query = searchQuery.trim().toLowerCase();
  const filtered = [...data.orders].reverse().filter((order) => {
    const status = normalizeStatus(order.status);
    const isArchived = Boolean(order.archived);
    const filterMatch = orderFilter === "archived"
      ? isArchived
      : !isArchived && (orderFilter === "all" || orderFilter === status);
    const haystack = [order.name, order.phone, order.tech, order.brand, order.address, order.id].join(" ").toLowerCase();
    const periodMatch = withinPeriod(order.created, orderPeriod);
    return filterMatch && periodMatch && (!query || haystack.includes(query));
  });
  return `<main class="content">
    <div class="page-head"><div><h1>Заявки</h1><p class="lead">Все ремонты в одном месте</p></div><button class="icon-button" data-action="new-order" aria-label="Новая заявка">+</button></div>
    <div class="search-row"><input class="search" id="order-search" value="${escapeHtml(searchQuery)}" placeholder="Имя, телефон, техника или модель" /></div>
    <div class="chips">
      <button class="chip ${orderFilter === "all" ? "active" : ""}" data-filter="all">Все</button>
      <button class="chip ${orderFilter === "closed" ? "active" : ""}" data-filter="closed">Закрыты</button>
      <button class="chip ${orderFilter === "active" ? "active" : ""}" data-filter="active">В работе</button>
      <button class="chip ${orderFilter === "declined" ? "active" : ""}" data-filter="declined">Отказы</button>
      <button class="chip ${orderFilter === "archived" ? "active" : ""}" data-filter="archived">Архив</button>
    </div>
    <div class="chips">
      <button class="chip ${orderPeriod === "all" ? "active" : ""}" data-order-period="all">Всё время</button>
      <button class="chip ${orderPeriod === "7" ? "active" : ""}" data-order-period="7">7 дней</button>
      <button class="chip ${orderPeriod === "30" ? "active" : ""}" data-order-period="30">30 дней</button>
      <button class="chip ${orderPeriod === "90" ? "active" : ""}" data-order-period="90">90 дней</button>
      <button class="chip ${orderPeriod === "365" ? "active" : ""}" data-order-period="365">365 дней</button>
    </div>
    ${filtered.length ? filtered.map(orderCard).join("") : `<div class="panel empty"><div class="empty-icon">▣</div><h2>Заявок пока нет</h2><p>Восстанови данные из резервной копии или создай первую заявку.</p><div class="empty-actions"><button class="primary-button" data-action="import">Импортировать бэкап</button><button class="secondary-button" data-action="new-order">Создать заявку</button></div></div>`}
  </main>`;
}

function warehousePage() {
  const query = warehouseSearch.trim().toLowerCase();
  const activeItems = [...data.warehouse].filter((item) => !item.archived);
  const items = activeItems.filter((item) => {
    const compatibility = Array.isArray(item.compatibility) ? item.compatibility.join(" ") : item.compatibility || "";
    const haystack = [item.name, item.category, item.unit, compatibility].join(" ").toLowerCase();
    return !query || haystack.includes(query);
  });
  const lowItems = activeItems.filter((item) => Number(item.quantity) <= Number(item.min || 0));
  const low = lowItems.length;
  const movements = [...data.warehouse_movements]
    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
    .slice(0, 12);
  const movementLabels = {
    initial: "Начальный остаток",
    manual_in: "Приход",
    manual_out: "Ручное списание",
    order_out: "Списано в заявку",
    order_return: "Возврат из заявки"
  };
  return `<main class="content">
    <div class="page-head"><div><h1>Склад</h1><p class="lead">Запчасти и расходные материалы</p></div><button class="icon-button" data-action="new-stock" aria-label="Новая позиция">+</button></div>
    <div class="search-row"><input class="search" id="warehouse-search" value="${escapeHtml(warehouseSearch)}" placeholder="Название, категория или совместимость" /></div>
    <div class="metrics panel">
      <div class="metric"><div class="metric-label">Активных позиций</div><div class="metric-value">${activeItems.length}</div></div>
      <div class="metric"><div class="metric-label">Мало осталось</div><div class="metric-value yellow">${low}</div></div>
    </div>
    ${lowItems.length ? `<section class="panel"><div class="panel-title"><span class="badge-icon">${icon("warning")}</span> Критические остатки</div><div class="goods-list">${lowItems.map((item) => `<button class="goods-sheet" data-action="edit-stock" data-id="${escapeHtml(item.id)}"><span><strong>${escapeHtml(item.name || "Без названия")}</strong><small>Минимум: ${escapeHtml(item.min || 0)} ${escapeHtml(item.unit || "шт.")}</small></span><b class="yellow">${escapeHtml(item.quantity || 0)} ${escapeHtml(item.unit || "шт.")}</b><span>›</span></button>`).join("")}</div></section>` : ""}
    ${items.length ? items.map((item) => `<article class="panel stock-card">
      <div class="stock-top"><div><div class="stock-name">${escapeHtml(item.name || "Без названия")}</div><div class="stock-category">${escapeHtml(item.category || "Без категории")} · ${money(item.lastPurchasePrice || item.price)} / ${escapeHtml(item.unit || "шт.")}</div></div><div><div class="quantity">${escapeHtml(item.quantity || 0)} ${escapeHtml(item.unit || "шт.")}</div><div class="small">в наличии</div></div></div>
      <div class="stock-actions"><button class="secondary-button" data-action="edit-stock" data-id="${escapeHtml(item.id)}">✎ Изменить</button><button class="secondary-button" data-stock="in" data-id="${escapeHtml(item.id)}">+ Приход</button><button class="secondary-button" data-stock="out" data-id="${escapeHtml(item.id)}">− Списать</button></div>
    </article>`).join("") : (query ? emptyState("⌕", "Ничего не найдено", "Попробуй изменить запрос поиска.") : emptyState("▥", "Склад пуст", "Позиции появятся после импорта бэкапа."))}
    <section class="panel"><div class="panel-title">Последние движения</div>
      ${movements.length ? `<ul class="list">${movements.map((movement) => {
        const item = data.warehouse.find((entry) => String(entry.id) === String(movement.warehouseId));
        const incoming = ["initial", "manual_in", "order_return"].includes(movement.type);
        const source = movement.orderId ? ` · заявка №${escapeHtml(movement.orderId)}` : "";
        return `<li class="price-row"><div><strong>${escapeHtml(movement.name || item?.name || "Позиция")}</strong><div class="small">${movementLabels[movement.type] || "Движение"}${source} · ${shortDate(movement.date)}</div></div><strong class="${incoming ? "green" : "red"}">${incoming ? "+" : "−"}${escapeHtml(movement.qty || 0)} ${escapeHtml(item?.unit || "шт.")}</strong></li>`;
      }).join("")}</ul>` : `<div class="empty">Движений пока нет</div>`}
    </section>
  </main>`;
}

function analyticsPage() {
  const closed = data.orders.filter((order) => !order.archived && normalizeStatus(order.status) === "closed" && withinPeriod(order.created, analyticsPeriod));
  const periodExpenses = data.expenses.filter((item) => withinPeriod(item.date, analyticsPeriod));
  const periodIncomes = data.incomes.filter((item) => withinPeriod(item.date, analyticsPeriod));
  const revenue = closed.reduce((sum, order) => sum + (Number(order.sum) || 0), 0);
  const repairCosts = closed.reduce((sum, order) => sum + (Number(order.expense_gray) || 0) + (Number(order.expense_white) || 0), 0);
  const repairResult = revenue - repairCosts;
  const personalExpenses = periodExpenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const personalIncome = periodIncomes.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const personalResult = personalIncome - personalExpenses;
  const totalResult = repairResult + personalResult;
  const average = closed.length ? revenue / closed.length : 0;

  const grouped = new Map();
  closed.forEach((order) => {
    const date = shortDate(order.created);
    grouped.set(date, (grouped.get(date) || 0) + (Number(order.sum) || 0));
  });
  const bars = [...grouped.entries()].slice(-7);
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
  data.warehouse_movements
    .filter((movement) => withinPeriod(movement.date, analyticsPeriod))
    .forEach((movement) => {
      let delta = 0;
      if (movement.type === "order_out" || movement.type === "manual_out") delta = Number(movement.qty) || 0;
      if (movement.type === "order_return") delta = -(Number(movement.qty) || 0);
      if (!delta) return;
      const key = String(movement.warehouseId || movement.name || "unknown");
      const stockItem = data.warehouse.find((item) => String(item.id) === String(movement.warehouseId));
      const current = usageMap.get(key) || {
        name: movement.name || stockItem?.name || "Материал",
        unit: stockItem?.unit || "шт.",
        qty: 0,
        operations: 0
      };
      current.qty += delta;
      current.operations += 1;
      usageMap.set(key, current);
    });
  const materialUsage = [...usageMap.values()]
    .filter((item) => item.qty > 0)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 10);

  return `<main class="content">
    <div class="page-head"><div><h1>Аналитика</h1><p class="lead">Ремонты, личные финансы и склад отдельно</p></div></div>
    <div class="chips"><button class="chip ${analyticsPeriod === "all" ? "active" : ""}" data-analytics-period="all">Всё время</button><button class="chip ${analyticsPeriod === "30" ? "active" : ""}" data-analytics-period="30">30 дней</button><button class="chip ${analyticsPeriod === "90" ? "active" : ""}" data-analytics-period="90">90 дней</button><button class="chip ${analyticsPeriod === "365" ? "active" : ""}" data-analytics-period="365">365 дней</button></div>
    <section class="panel">
      <div class="panel-title"><span class="badge-icon">${icon("analytics")}</span> Главные показатели</div>
      <div class="metrics">
        <div class="metric"><div class="metric-label">Закрыто</div><div class="metric-value">${closed.length}</div></div>
        <div class="metric"><div class="metric-label">Выручка ремонтов</div><div class="metric-value blue">${money(revenue)}</div></div>
        <div class="metric"><div class="metric-label">Результат ремонтов</div><div class="metric-value ${repairResult >= 0 ? "green" : "red"}">${money(repairResult)}</div></div>
        <div class="metric"><div class="metric-label">Расходы ремонтов</div><div class="metric-value red">${money(repairCosts)}</div></div>
        <div class="metric"><div class="metric-label">Личные финансы</div><div class="metric-value ${personalResult >= 0 ? "green" : "red"}">${money(personalResult)}</div></div>
        <div class="metric"><div class="metric-label">Общий результат</div><div class="metric-value ${totalResult >= 0 ? "green" : "red"}">${money(totalResult)}</div></div>
        <div class="metric"><div class="metric-label">Средний чек</div><div class="metric-value yellow">${money(average)}</div></div>
        <div class="metric"><div class="metric-label">Склад</div><div class="metric-value purple">${data.warehouse.filter((item) => !item.archived).length}</div></div>
      </div>
    </section>
    <section class="panel"><div class="panel-title">⌁ Динамика выручки</div>${bars.length ? `<div class="bars">${bars.map(([label, value]) => `<div class="bar-wrap"><span>${money(value)}</span><div class="bar" style="height:${Math.max(5, value / max * 120)}px"></div><span>${label}</span></div>`).join("")}</div>` : `<div class="empty">Пока нет данных для графика</div>`}</section>
    <section class="panel"><div class="panel-title">Доходность по типам техники</div>${techStats.length ? `<div class="goods-list">${techStats.map((item) => {
      const result = item.revenue - item.costs;
      return `<div class="goods-sheet"><span><strong>${escapeHtml(item.name)}</strong><small>${item.count} заявок · выручка ${money(item.revenue)} · расходы ${money(item.costs)}</small></span><b class="${result >= 0 ? "green" : "red"}">${money(result)}</b><span></span></div>`;
    }).join("")}</div>` : `<div class="empty">Нет закрытых заявок за период</div>`}</section>
    <section class="panel"><div class="panel-title">Расход материалов</div>${materialUsage.length ? `<div class="goods-list">${materialUsage.map((item) => `<div class="goods-sheet"><span><strong>${escapeHtml(item.name)}</strong><small>${item.operations} движ. за период</small></span><b class="yellow">${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 2 }).format(item.qty)} ${escapeHtml(item.unit)}</b><span></span></div>`).join("")}</div>` : `<div class="empty">Нет списаний материалов за период</div>`}</section>
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
  const prices = data.receipt_prices.slice(0, 100);
  const customServices = Array.isArray(data.service_custom) ? data.service_custom : [];
  return `<main class="content"><div class="page-head"><div><h1>Прайс-лист</h1><p class="lead">Каталог услуг и материалов</p></div><div class="finance-actions"><button class="secondary-button" data-action="more-menu">Назад</button><button class="primary-button" data-action="new-price">+ Позиция</button></div></div>
    <section class="panel"><div class="panel-title">Основной прайс</div>${prices.length ? `<ul class="list">${prices.map((item, index) => `<li class="price-row"><button class="goods-sheet" data-action="edit-price" data-index="${index}"><span><strong>${escapeHtml(item.name || "Без названия")}</strong><small>${escapeHtml(item.category || item.tech || (item.kind === "material" ? "Материал" : "Услуга"))}</small></span><b>${money(item.price)}</b><span>›</span></button></li>`).join("")}</ul>` : `<div class="empty">Основной прайс пуст</div>`}</section>
    <section class="panel"><div class="panel-title">Пользовательские услуги</div><button class="secondary-button wide" data-action="new-custom-service">+ Своя услуга</button>${customServices.length ? `<div class="goods-list">${customServices.map((item, index) => {
      const name = item.name || item.title || item.service || "Услуга";
      const price = Number(item.price || item.cost || item.sum) || 0;
      const category = item.category || item.tech || "Своя услуга";
      return `<button class="goods-sheet" data-action="edit-custom-service" data-index="${index}"><span><strong>${escapeHtml(name)}</strong><small>${escapeHtml(category)}</small></span><b>${money(price)}</b><span>›</span></button>`;
    }).join("")}</div>` : `<div class="empty">Своих услуг пока нет</div>`}</section>
  </main>`;
}


function clientKeyForOrder(order) {
  return String(order.phone || order.name || order.id || "").trim().toLowerCase();
}

function clientsPage() {
  const clients = new Map();
  data.orders.forEach((order) => {
    if (order.archived) return;
    const key = clientKeyForOrder(order);
    if (!key) return;
    const current = clients.get(key) || { key, name: order.name || "Без имени", phone: order.phone || "", address: order.address || "", orders: [], total: 0, last: order.created };
    current.orders.push(order);
    current.total += Number(order.sum) || 0;
    if (new Date(order.created || 0) > new Date(current.last || 0)) {
      current.last = order.created;
      current.name = order.name || current.name;
      current.address = order.address || current.address;
    }
    clients.set(key, current);
  });
  const sorted = [...clients.values()].sort((a, b) => new Date(b.last || 0) - new Date(a.last || 0));
  const query = clientSearch.trim().toLowerCase();
  const filtered = sorted.filter((client) => !query || [client.name, client.phone, client.address].join(" ").toLowerCase().includes(query));
  return `<main class="content"><div class="page-head"><div><h1>Клиенты</h1><p class="lead">История обращений и ремонтов</p></div><button class="secondary-button" data-action="more-menu">Назад</button></div>
    <section class="panel"><div class="metrics"><div class="metric"><div class="metric-label">Клиентов</div><div class="metric-value">${sorted.length}</div></div><div class="metric"><div class="metric-label">Заявок</div><div class="metric-value blue">${data.orders.filter((item) => !item.archived).length}</div></div></div></section>
    <div class="search-row"><input class="search" id="client-search" value="${escapeHtml(clientSearch)}" placeholder="Имя, телефон или адрес" /></div>
    ${filtered.length ? `<div class="client-list">${filtered.map((client) => `<article class="panel client-card"><div class="client-top"><div><div class="client-name">${escapeHtml(client.name)}</div><div class="small">${escapeHtml(client.phone || "Телефон не указан")}</div></div><strong>${money(client.total)}</strong></div><div class="client-meta"><span>${client.orders.length} обращ.</span><span>Последнее: ${shortDate(client.last)}</span></div>${client.address ? `<div class="small client-address">⌖ ${escapeHtml(client.address)}</div>` : ""}${client.phone ? `<a class="secondary-button client-call" href="tel:${escapeHtml(client.phone)}">☎ Позвонить</a>` : ""}<button class="secondary-button client-call" data-action="open-client" data-key="${escapeHtml(client.key)}">История</button></article>`).join("")}</div>` : (query ? emptyState("⌕", "Клиент не найден", "Попробуй изменить запрос поиска.") : emptyState("♙", "Клиентов пока нет", "Клиенты появятся после создания или импорта заявок."))}
  </main>`;
}

function financePage() {
  const expenseRows = data.expenses.filter((item) => withinPeriod(item.date, financePeriod));
  const incomeRows = data.incomes.filter((item) => withinPeriod(item.date, financePeriod));
  const expenses = expenseRows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const incomes = incomeRows.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const rows = [
    ...expenseRows.map((item) => ({ ...item, financeType: "expense" })),
    ...incomeRows.map((item) => ({ ...item, financeType: "income" }))
  ].sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  return `<main class="content"><div class="page-head"><div><h1>Финансы</h1><p class="lead">Личные расходы и дополнительные доходы</p></div><button class="secondary-button" data-action="more-menu">Назад</button></div>
    <div class="chips"><button class="chip ${financePeriod === "all" ? "active" : ""}" data-finance-period="all">Всё время</button><button class="chip ${financePeriod === "30" ? "active" : ""}" data-finance-period="30">30 дней</button><button class="chip ${financePeriod === "90" ? "active" : ""}" data-finance-period="90">90 дней</button><button class="chip ${financePeriod === "365" ? "active" : ""}" data-finance-period="365">365 дней</button></div>
    <section class="panel"><div class="metrics"><div class="metric"><div class="metric-label">Доходы</div><div class="metric-value green">${money(incomes)}</div></div><div class="metric"><div class="metric-label">Расходы</div><div class="metric-value red">${money(expenses)}</div></div><div class="metric"><div class="metric-label">Результат</div><div class="metric-value ${incomes - expenses >= 0 ? "green" : "red"}">${money(incomes - expenses)}</div></div><div class="metric"><div class="metric-label">Операций</div><div class="metric-value">${rows.length}</div></div></div></section>
    <div class="finance-actions"><button class="primary-button" data-action="add-finance" data-type="expense">− Добавить расход</button><button class="secondary-button" data-action="add-finance" data-type="income">+ Добавить доход</button></div>
    <section class="panel"><div class="panel-title">История операций</div>${rows.length ? `<ul class="list">${rows.map((item) => `<li class="finance-row"><div><strong>${escapeHtml(item.description || item.category || "Без описания")}</strong><div class="small">${shortDate(item.date)} · ${escapeHtml(item.category || "Другое")}</div></div><div class="finance-amount ${item.financeType === "income" ? "green" : "red"}">${item.financeType === "income" ? "+" : "−"}${money(item.amount)}</div><button class="remove-line" data-delete-finance="${item.financeType}" data-id="${escapeHtml(item.id)}" aria-label="Удалить">×</button></li>`).join("")}</ul>` : `<div class="empty">Операций пока нет</div>`}</section>
  </main>`;
}

function actPage() {
  const orders = [...data.orders].filter((item) => !item.archived).reverse();
  if (orders.length && !orders.some((item) => String(item.id) === String(selectedActOrderId))) selectedActOrderId = String(orders[0].id);
  const order = orders.find((item) => String(item.id) === String(selectedActOrderId));
  const actItems = order ? [
    ...(Array.isArray(order.services) ? order.services.map((item) => ({ ...item, actType: "service" })) : []),
    ...(Array.isArray(order.materials) ? order.materials.map((item) => ({ name: item.name, qty: item.qty, price: item.unitCost, actType: "material" })) : [])
  ] : [];
  if (order && !actItems.length) actItems.push({ name: "Ремонт техники", qty: 1, price: Number(order.sum) || 0, actType: "service" });
  return `<main class="content"><div class="page-head no-print"><div><h1>Акт</h1><p class="lead">Подготовка и печать документа</p></div><button class="secondary-button" data-action="more-menu">Назад</button></div>
    <section class="panel no-print"><label class="form-group"><span class="small">Выберите заявку</span><select class="field" id="act-order-select"><option value="">— Заявка —</option>${orders.map((item) => `<option value="${escapeHtml(item.id)}" ${String(item.id) === String(selectedActOrderId) ? "selected" : ""}>№${escapeHtml(item.id)} · ${escapeHtml(item.name || "Без имени")} · ${money(item.sum)}</option>`).join("")}</select></label><button class="primary-button wide act-print-button" data-action="print-act" ${order ? "" : "disabled"}>Печать / сохранить PDF</button></section>
    ${order ? `<article class="act-sheet"><h2>АКТ ВЫПОЛНЕННЫХ РАБОТ</h2><div class="act-subtitle">от «${new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(new Date())}»</div><div class="act-fields"><div><b>Исполнитель:</b><span>${escapeHtml(data.settings.companyName || data.settings.name || "—")}</span></div><div><b>Мастер:</b><span>${escapeHtml(data.settings.name || "—")}</span></div><div><b>Телефон исполнителя:</b><span>${escapeHtml(data.settings.phone || "—")}</span></div><div><b>Адрес исполнителя:</b><span>${escapeHtml(data.settings.companyAddress || "—")}</span></div><div><b>ИНН:</b><span>${escapeHtml(data.settings.inn || "—")}</span></div><div><b>Заказчик:</b><span>${escapeHtml(order.name || "—")}${order.phone ? ` · ${escapeHtml(order.phone)}` : ""}</span></div>${order.address ? `<div><b>Адрес заказчика:</b><span>${escapeHtml(order.address)}</span></div>` : ""}<div><b>Тип, модель техники:</b><span>${escapeHtml([order.tech, order.brand].filter(Boolean).join(" ") || "—")}</span></div><div><b>Неисправность со слов клиента:</b><span>${escapeHtml(order.issue || "—")}</span></div><div><b>Результат диагностики:</b><span>${escapeHtml(order.diagnosis || "—")}</span></div><div><b>Внешние дефекты:</b><span>${escapeHtml(order.defects || "—")}</span></div></div><table><thead><tr><th>№</th><th>Наименование работ</th><th>Стоимость</th><th>Кол-во</th><th>Сумма</th><th>Гарантия</th></tr></thead><tbody>${actItems.map((item, index) => `<tr><td>${index + 1}</td><td>${escapeHtml(item.name || "Услуга")}</td><td>${money(item.price)}</td><td>${Number(item.qty) || 1}</td><td>${money((Number(item.price) || 0) * (Number(item.qty) || 1))}</td><td>${escapeHtml(order.guarantee || 0)} мес.</td></tr>`).join("")}</tbody></table><div class="act-total"><b>Итого к оплате:</b><strong>${money(order.sum)}</strong></div>${order.guaranteeNote ? `<div class="act-fields"><div><b>Условия гарантии:</b><span>${escapeHtml(order.guaranteeNote)}</span></div></div>` : ""}<div class="act-acceptance"><h3>АКТ СДАЧИ-ПРИЁМКИ ОКАЗАННЫХ УСЛУГ</h3><p>Исполнитель выполнил работы по обслуживанию указанного оборудования. Заказчик с условиями обслуживания и оплаты ознакомлен, к качеству работ и состоянию оборудования претензий не имеет.</p><div class="act-signatures"><div><b>Исполнитель:</b><br>${escapeHtml(data.settings.name || "________________")}<br>Подпись: ____________</div><div><b>Заказчик:</b><br>${escapeHtml(order.name || "________________")}<br>${escapeHtml(order.phone || "")}<br>Подпись: ____________</div></div></div></article>` : emptyState("▤", "Нет заявки для акта", "Сначала создай или импортируй заявку.")}
  </main>`;
}

function goodsPage() {
  const sheets = Array.isArray(data.goods_sheets) ? [...data.goods_sheets].reverse() : [];
  return `<main class="content"><div class="page-head"><div><h1>Товарник</h1><p class="lead">Товары и материалы · отдельный расчёт</p></div><button class="secondary-button" data-action="more-menu">Назад</button></div>
    <section class="panel"><div class="panel-title"><span class="badge-icon">${icon("goods")}</span> Новый товарник</div><p class="small">Товарник не списывает склад, не создаёт расход и не влияет на статистику.</p><button class="primary-button wide" data-action="new-goods-sheet">+ Создать вручную</button></section>
    ${sheets.length ? `<section class="panel"><div class="panel-title">Сохранённые расчёты</div><div class="goods-list">${sheets.map((sheet) => `<button class="goods-sheet" data-action="edit-goods-sheet" data-id="${escapeHtml(sheet.id)}"><span><strong>${escapeHtml(sheet.title || "Товарник")}</strong><small>${Array.isArray(sheet.items) ? sheet.items.length : 0} позиций · ${shortDate(sheet.updatedAt || sheet.createdAt)}</small></span><b>${money(sheet.total)}</b><span>›</span></button>`).join("")}</div></section>` : emptyState("◇", "Товарников пока нет", "Создай первый расчёт товаров или материалов.")}
  </main>`;
}

function settingsPage() {
  const settings = data.settings || {};
  return `<main class="content"><div class="page-head"><div><h1>Настройки</h1><p class="lead">Данные мастера и оформление документов</p></div><button class="secondary-button" data-action="more-menu">Назад</button></div>
    <form class="panel" id="settings-form"><div class="panel-title">Реквизиты исполнителя</div><div class="form-grid"><div class="form-group full"><label>Название</label><input class="field" name="companyName" value="${escapeHtml(settings.companyName || "")}" placeholder="Например: Ремонт бытовой техники" /></div><div class="form-group"><label>Исполнитель</label><input class="field" name="name" value="${escapeHtml(settings.name || "")}" placeholder="ФИО" /></div><div class="form-group"><label>Телефон</label><input class="field" name="phone" value="${escapeHtml(settings.phone || "")}" inputmode="tel" /></div><div class="form-group full"><label>Адрес</label><input class="field" name="companyAddress" value="${escapeHtml(settings.companyAddress || "")}" /></div><div class="form-group"><label>ИНН</label><input class="field" name="inn" value="${escapeHtml(settings.inn || "")}" inputmode="numeric" /></div></div><button class="primary-button wide settings-save" type="submit">Сохранить настройки</button></form>
    <section class="panel"><div class="panel-title">Версия приложения</div><div class="setting-row"><div><strong>CRM by Romanychev ${APP_VERSION}</strong><div class="small">Сборка ${APP_BUILD}</div><div class="small">Что нового: ${escapeHtml(APP_RELEASE)}</div></div><button class="secondary-button" data-action="check-update">Проверить обновление</button></div><div class="setting-row"><div><strong>Адрес приложения</strong><div class="small">${escapeHtml(APP_URL)}</div></div><a class="secondary-button" href="${escapeHtml(APP_URL)}">Открыть</a></div><div class="setting-row"><div><strong>Диагностика</strong><div class="small">Проверить базу, кэш, service worker и хранилище</div></div><button class="secondary-button" data-action="run-diagnostics">Запустить</button></div><div class="setting-row"><div><strong>Защита локальных данных</strong><div class="small">Попросить браузер не очищать базу автоматически при нехватке места</div></div><button class="secondary-button" data-action="protect-storage">Защитить</button></div></section>
    <section class="panel"><div class="panel-title">О данных</div><p class="small">Все данные находятся только в браузере устройства. Для переноса и защиты используй раздел «Бэкапы».</p></section>
  </main>`;
}

async function backupSettings() {
  const directory = await dbGet(DIRECTORY_KEY);
  const rollback = await dbGet(PRE_IMPORT_KEY);
  return `<main class="content"><div class="page-head"><div><h1>Бэкапы</h1><p class="lead">Данные остаются на твоём устройстве</p></div><button class="secondary-button" data-action="more-menu">Назад</button></div>
    <section class="panel">
      <div class="panel-title"><span class="badge-icon">${icon("backup")}</span> Резервное копирование</div>
      <div class="backup-grid">
        <button class="primary-button" data-action="import">Импортировать JSON</button>
        <button class="secondary-button" data-action="inspect-backup-file">Проверить файл</button>
        <button class="secondary-button" data-action="download-backup">Скачать бэкап</button>
        <button class="secondary-button" data-action="choose-folder">Выбрать папку</button>
        <button class="secondary-button" data-action="folder-backup">Сохранить в папку</button>
        <button class="secondary-button" data-action="backup-self-test">Проверить бэкап</button>
        <button class="secondary-button" data-action="restore-pre-import" ${rollback ? "" : "disabled"}>Откатить импорт</button>
      </div>
      <div class="setting-row"><div><strong>Папка</strong><div class="small">${directory ? escapeHtml(directory.name) : "Не выбрана"}</div></div></div>
      <div class="setting-row"><div><strong>Автоматический бэкап</strong><div class="small">Проверяется при открытии приложения</div></div><button class="toggle ${data.settings.autoBackup ? "on" : ""}" data-action="toggle-auto" aria-label="Автоматический бэкап"></button></div>
      <div class="setting-row"><div><strong>Периодичность</strong></div><select id="backup-days">${[1,2,3,5,7,14].map((days) => `<option value="${days}" ${Number(data.settings.autoBackupDays) === days ? "selected" : ""}>${days === 1 ? "Каждый день" : `Раз в ${days} дней`}</option>`).join("")}</select></div>
      <div class="setting-row"><div><strong>Последний бэкап</strong><div class="small">${data.settings.lastBackupAt ? new Date(data.settings.lastBackupAt).toLocaleString("ru-RU") : "Ещё не создавался"}</div></div></div><div class="setting-row"><div><strong>Точка отката импорта</strong><div class="small">${rollback ? `Есть · ${rollback.orders?.length || 0} заявок` : "Ещё не создавалась"}</div></div></div>
    </section>
    <section class="panel"><div class="panel-title">Содержимое</div><div class="metrics"><div class="metric"><div class="metric-label">Заявки</div><div class="metric-value">${data.orders.length}</div></div><div class="metric"><div class="metric-label">Склад</div><div class="metric-value">${data.warehouse.length}</div></div><div class="metric"><div class="metric-label">Движения</div><div class="metric-value">${data.warehouse_movements.length}</div></div><div class="metric"><div class="metric-label">Прайс</div><div class="metric-value">${data.receipt_prices.length}</div></div><div class="metric"><div class="metric-label">Документы</div><div class="metric-value">${data.receipts.length}</div></div><div class="metric"><div class="metric-label">Черновики</div><div class="metric-value">${draftRecords().length}</div></div></div></section>
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
  const drafts = draftRecords();
  return `<main class="content">
    <div class="page-head"><div><h1>Черновики</h1><p class="lead">Незавершённые заявки из текущей и старой CRM</p></div><button class="secondary-button" data-action="more-menu">Назад</button></div>
    <section class="panel"><div class="panel-title">Безопасное восстановление</div><p class="small">Старые данные не преобразуются автоматически. При продолжении создаётся новая заявка, исходный черновик остаётся до ручного удаления.</p></section>
    ${drafts.length ? `<div class="client-list">${drafts.map((record) => {
      const view = draftSummary(record.value);
      const meta = [view.tech, view.brand, view.phone, view.date ? shortDate(view.date) : ""].filter(Boolean).join(" · ");
      return `<article class="panel client-card"><div class="client-top"><div><div class="client-name">${escapeHtml(view.title)}</div><div class="small">${escapeHtml(meta || "Старый формат черновика")}</div></div>${view.sum ? `<strong>${money(view.sum)}</strong>` : ""}</div><div class="finance-actions"><button class="primary-button" data-action="continue-draft" data-key="${escapeHtml(record.key)}">Продолжить</button><button class="danger-button" data-action="delete-draft" data-key="${escapeHtml(record.key)}">Удалить</button></div></article>`;
    }).join("")}</div>` : emptyState("✎", "Черновиков пока нет", "Черновики можно сохранять из формы новой заявки.")}
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
  const total = receipts.reduce((sum, item) => sum + receiptSummary(item).amount, 0);
  return `<main class="content">
    <div class="page-head"><div><h1>Документы и чеки</h1><p class="lead">Старые документы CRM и новые записи</p></div><div class="finance-actions"><button class="secondary-button" data-action="more-menu">Назад</button><button class="primary-button" data-action="new-receipt">+ Документ</button></div></div>
    <section class="panel"><div class="metrics"><div class="metric"><div class="metric-label">Документов</div><div class="metric-value">${receipts.length}</div></div><div class="metric"><div class="metric-label">Сумма</div><div class="metric-value blue">${money(total)}</div></div></div></section>
    ${receipts.length ? `<section class="panel"><div class="goods-list">${receipts.map((item, index) => {
      const view = receiptSummary(item);
      const meta = [view.number ? `№${view.number}` : "", view.date ? shortDate(view.date) : "", view.orderId ? `заявка №${view.orderId}` : ""].filter(Boolean).join(" · ");
      return `<button class="goods-sheet" data-action="edit-receipt" data-index="${index}"><span><strong>${escapeHtml(view.title)}</strong><small>${escapeHtml(meta || view.note || "Без дополнительных данных")}</small></span><b>${view.amount ? money(view.amount) : ""}</b><span>›</span></button>`;
    }).join("")}</div></section>` : emptyState("▤", "Документов пока нет", "Добавь документ вручную или импортируй старый бэкап.")}
  </main>`;
}
function toolsPage() {
  const tools = Array.isArray(data.tools) ? data.tools : [];
  const active = tools.filter((item) => String(item.status || item.state || "").toLowerCase() !== "списан").length;
  return `<main class="content">
    <div class="page-head"><div><h1>Инструменты</h1><p class="lead">Учёт рабочего инструмента и оборудования</p></div><div class="finance-actions"><button class="secondary-button" data-action="more-menu">Назад</button><button class="primary-button" data-action="new-tool">+ Инструмент</button></div></div>
    <section class="panel"><div class="metrics"><div class="metric"><div class="metric-label">Всего</div><div class="metric-value">${tools.length}</div></div><div class="metric"><div class="metric-label">Активных</div><div class="metric-value green">${active}</div></div></div></section>
    ${tools.length ? `<section class="panel"><div class="goods-list">${tools.map((item, index) => {
      const name = item.name || item.title || item.tool || "Инструмент";
      const status = item.status || item.state || "В наличии";
      const category = item.category || item.type || "";
      return `<button class="goods-sheet" data-action="edit-tool" data-index="${index}"><span><strong>${escapeHtml(name)}</strong><small>${escapeHtml([category, status].filter(Boolean).join(" · "))}</small></span><b>${item.price || item.purchasePrice ? money(item.price || item.purchasePrice) : ""}</b><span>›</span></button>`;
    }).join("")}</div></section>` : emptyState("🛠", "Инструментов пока нет", "Добавь первый инструмент или импортируй старый бэкап.")}
  </main>`;
}
function moreMenu() {
  const items = [
    ["backup", "backup", "Бэкапы", "Импорт, экспорт и автосохранение"],
    ["prices", "price", "Прайс-лист", "Каталог услуг и материалов"],
    ["clients", "clients", "Клиенты", "История обращений и ремонтов"],
    ["finance", "finance", "Финансы", "Расходы и дополнительные доходы"],
    ["goods", "goods", "Товарник", "Отдельный расчёт товаров"],
    ["tools", "tools", "Инструменты", "Учёт рабочего инструмента"],
    ["receipts", "receipt", "Документы и чеки", "Старые документы и новые записи"],
    ["drafts", "drafts", "Черновики", "Незавершённые заявки и восстановление"],
    ["act", "act", "Акт", "Подготовка и печать документа"],
    ["settings", "settings", "Настройки", "Оформление и параметры приложения"]
  ];
  return `<main class="content"><div class="page-head"><div><h1>Ещё</h1><p class="lead">Финансы, документы, прайс и настройки</p></div></div><div class="menu-list">${items.map(([id, iconName, name, description]) => `<button class="menu-item" data-more="${id}"><span class="menu-icon">${icon(iconName)}</span><span class="menu-copy"><span class="menu-name">${name}</span><span class="menu-description">${description}</span></span><span class="chevron">›</span></button>`).join("")}</div></main>`;
}

async function morePage() {
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
  if (activePage === "warehouse") page = warehousePage();
  if (activePage === "analytics") page = analyticsPage();
  if (activePage === "more") page = await morePage();
  app.innerHTML = `<div class="shell">${header()}${page}${nav()}</div>`;
}

const orderServiceRow = (item = {}) => `<div class="line-item" data-service-row>
  <input class="field" data-line="name" value="${escapeHtml(item.name || "")}" placeholder="Название услуги" />
  <input class="field compact" data-line="qty" type="number" min="0.01" step="0.01" value="${Number(item.qty) || 1}" aria-label="Количество" />
  <input class="field compact" data-line="price" type="number" min="0" step="1" value="${Number(item.price) || 0}" aria-label="Цена" />
  <button type="button" class="remove-line" data-remove-line aria-label="Удалить">×</button>
</div>`;

const orderMaterialRow = (item = {}) => `<div class="line-item material-line" data-material-row data-warehouse-id="${escapeHtml(item.warehouseId || "")}" data-unit="${escapeHtml(item.unit || "шт.")}" data-write-off="${item.writeOff ? "true" : "false"}">
  <input class="field" data-line="name" value="${escapeHtml(item.name || "")}" placeholder="Материал" />
  <input class="field compact" data-line="qty" type="number" min="0.01" step="0.01" value="${Number(item.qty) || 1}" aria-label="Количество" />
  <input class="field compact" data-line="unit-cost" type="number" min="0" step="1" value="${Number(item.unitCost) || 0}" aria-label="Цена" />
  <button type="button" class="remove-line" data-remove-line aria-label="Удалить">×</button>
</div>`;

function syncOrderStock(previousMaterials = [], nextMaterials = [], orderId) {
  const totals = (materials) => {
    const result = new Map();
    materials.forEach((material) => {
      if (!material?.warehouseId || !material.writeOff) return;
      const id = String(material.warehouseId);
      result.set(id, (result.get(id) || 0) + (Number(material.qty) || 0));
    });
    return result;
  };

  const previous = totals(Array.isArray(previousMaterials) ? previousMaterials : []);
  const next = totals(Array.isArray(nextMaterials) ? nextMaterials : []);
  const ids = [...new Set([...previous.keys(), ...next.keys()])];
  const changes = ids
    .map((warehouseId) => ({
      warehouseId,
      delta: (next.get(warehouseId) || 0) - (previous.get(warehouseId) || 0)
    }))
    .filter((change) => Math.abs(change.delta) > 1e-9);

  for (const change of changes) {
    if (change.delta <= 0) continue;
    const item = data.warehouse.find((entry) => String(entry.id) === change.warehouseId);
    if (!item) return { ok: false, message: "Позиция склада больше не найдена" };
    if ((Number(item.quantity) || 0) < change.delta) {
      return { ok: false, message: `Недостаточно на складе: ${item.name || "позиция"}` };
    }
  }

  const date = new Date().toISOString();
  changes.forEach((change) => {
    const item = data.warehouse.find((entry) => String(entry.id) === change.warehouseId);
    if (!item) return;
    item.quantity = Math.max(0, (Number(item.quantity) || 0) - change.delta);
    data.warehouse_movements.push({
      id: crypto.randomUUID(),
      warehouseId: item.id,
      orderId,
      name: item.name,
      qty: Math.abs(change.delta),
      type: change.delta > 0 ? "order_out" : "order_return",
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
function newOrderModal(existing = null, options = {}) {
  const forceNew = Boolean(options.forceNew);
  const sourceOrder = existing || {};
  const order = forceNew ? { ...structuredClone(sourceOrder), id: null, created: null } : sourceOrder;
  const previousMaterials = forceNew ? [] : (Array.isArray(order.materials) ? order.materials : []);
  const services = Array.isArray(order.services) ? order.services : [];
  const materials = Array.isArray(order.materials) ? order.materials : [];
  let orderPhotos = Array.isArray(order.photos) ? structuredClone(order.photos) : [];
  const serviceCatalog = availableServices();
  const serviceOptions = serviceCatalog
    .map((item, index) => `<option value="${index}">${escapeHtml(item.name)} · ${money(item.price)}${item.source === "custom" ? " · своё" : ""}</option>`).join("");
  const stockOptions = data.warehouse
    .filter((item) => !item.archived && !item.hiddenFromOrders)
    .map((item, index) => `<option value="${index}">${escapeHtml(item.name)} · ${escapeHtml(item.quantity || 0)} ${escapeHtml(item.unit || "шт.")}</option>`).join("");
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<form class="modal" id="order-form">
    <h2>${existing && !forceNew ? "Редактировать заявку" : "Новая заявка"}</h2>
    <div class="form-section-title">Клиент и техника</div>
    <div class="form-grid">
      <div class="form-group"><label>Клиент</label><input class="field" name="name" value="${escapeHtml(order.name || "")}" required /></div>
      <div class="form-group"><label>Телефон</label><input class="field" name="phone" value="${escapeHtml(order.phone || "")}" inputmode="tel" /></div>
      <div class="form-group"><label>Техника</label><select class="field" name="tech">${["Холодильник","Стиральная машина","Посудомоечная машина","Другое"].map((value) => `<option ${order.tech === value ? "selected" : ""}>${value}</option>`).join("")}</select></div>
      <div class="form-group"><label>Модель</label><input class="field" name="brand" value="${escapeHtml(order.brand || "")}" /></div>
      <div class="form-group full"><label>Адрес</label><input class="field" name="address" value="${escapeHtml(order.address || "")}" /></div>
      <div class="form-group full"><label>Неисправность со слов клиента</label><textarea class="field textarea" name="issue">${escapeHtml(order.issue || "")}</textarea></div>
      <div class="form-group full"><label>Результат диагностики</label><textarea class="field textarea" name="diagnosis">${escapeHtml(order.diagnosis || "")}</textarea></div>
      <div class="form-group full"><label>Внешние дефекты</label><textarea class="field textarea" name="defects">${escapeHtml(order.defects || "")}</textarea></div>
      <div class="form-group"><label>Следующий визит</label><input class="field" name="nextVisit" type="datetime-local" value="${order.nextVisit ? escapeHtml(String(order.nextVisit).slice(0, 16)) : ""}" /></div>
      <div class="form-group"><label>Статус</label><select class="field" name="status">${["В работе","Закрыта","Отказ"].map((value) => `<option ${normalizeStatus(order.status) === normalizeStatus(value) ? "selected" : ""}>${value}</option>`).join("")}</select></div>
    </div>

    <div class="form-section-title">Услуги</div>
    <div class="catalog-add"><select class="field" id="service-picker"><option value="">— Выбрать услугу из прайса —</option>${serviceOptions}</select><button type="button" class="secondary-button" id="add-service">+ Добавить</button></div>
    <div class="line-head"><span>Наименование</span><span>Кол-во</span><span>Цена</span><span></span></div>
    <div id="service-lines" class="line-list">${services.map(orderServiceRow).join("")}</div>

    <div class="form-section-title">Запчасти и материалы</div>
    <div class="catalog-add"><select class="field" id="material-picker"><option value="">— Выбрать со склада —</option>${stockOptions}</select><button type="button" class="secondary-button" id="add-material">+ Добавить</button></div>
    <div class="line-head"><span>Наименование</span><span>Кол-во</span><span>Цена</span><span></span></div>
    <div id="material-lines" class="line-list">${materials.map(orderMaterialRow).join("")}</div>

    <div class="form-section-title">Фотографии</div>
    <div class="form-group full"><label>Добавить фото</label><input class="field photo-input" id="order-photo-input" type="file" accept="image/*" multiple /><div class="small">Фото уменьшаются перед сохранением и остаются только в локальной CRM и бэкапе.</div></div>
    <div class="photo-grid" id="order-photo-list"></div>

    <div class="calculated-total"><span>Услуги и материалы</span><strong id="calculated-total">0 ₽</strong><button type="button" class="secondary-button" id="use-calculated-total">В итоговую сумму</button></div>

    <div class="form-section-title">Расчёт и гарантия</div>
    <div class="form-grid">
      <div class="form-group"><label>Итоговая сумма</label><input class="field" name="sum" type="number" min="0" value="${Number(order.sum) || 0}" /></div>
      <div class="form-group"><label>Предоплата</label><input class="field" name="prepay" type="number" min="0" value="${Number(order.prepay) || 0}" /></div>
      <div class="form-group"><label>Скидка</label><input class="field" name="discount" type="number" min="0" value="${Number(order.discount) || 0}" /></div>
      <div class="form-group"><label>Процент мастера</label><input class="field" name="percent" type="number" min="0" max="100" value="${Number(order.percent) || 0}" /></div>
      <div class="form-group"><label>Серые расходы</label><input class="field" name="expense_gray" type="number" min="0" value="${Number(order.expense_gray) || 0}" /></div>
      <div class="form-group"><label>Белые расходы</label><input class="field" name="expense_white" type="number" min="0" value="${Number(order.expense_white) || 0}" /></div>
      <div class="form-group"><label>Гарантия, мес.</label><input class="field" name="guarantee" type="number" min="0" value="${Number(order.guarantee) || 6}" /></div>
      <div class="form-group full"><label>Условия гарантии</label><textarea class="field textarea" name="guaranteeNote">${escapeHtml(order.guaranteeNote || "")}</textarea></div>
      <div class="form-group full"><label>Комментарий</label><textarea class="field textarea" name="comment">${escapeHtml(order.comment || "")}</textarea></div>
    </div>
    <div class="modal-actions"><button type="button" class="secondary-button" id="save-order-draft">В черновик</button><button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  const formElement = modal.querySelector("form");
  const photoList = modal.querySelector("#order-photo-list");
  const photoInput = modal.querySelector("#order-photo-input");
  const renderPhotos = () => {
    photoList.innerHTML = orderPhotos.length ? orderPhotos.map((photo, index) => {
      const source = photoSource(photo);
      const label = photoLabel(photo, index);
      return `<div class="photo-card">${source ? `<img src="${escapeHtml(source)}" alt="${escapeHtml(label)}" loading="lazy" />` : `<div class="photo-missing">▧<small>Старый формат</small></div>`}<div class="photo-caption" title="${escapeHtml(label)}">${escapeHtml(label)}</div><button type="button" class="photo-remove" data-remove-photo="${index}" aria-label="Удалить фото">×</button></div>`;
    }).join("") : `<div class="small">Фотографий пока нет</div>`;
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
    const button = event.target.closest("[data-remove-photo]");
    if (!button) return;
    orderPhotos.splice(Number(button.dataset.removePhoto), 1);
    renderPhotos();
  });
  renderPhotos();
  const calculateLines = () => {
    const serviceTotal = [...modal.querySelectorAll("[data-service-row]")].reduce((sum, row) => sum + (Number(row.querySelector('[data-line="qty"]').value) || 0) * (Number(row.querySelector('[data-line="price"]').value) || 0), 0);
    const materialTotal = [...modal.querySelectorAll("[data-material-row]")].reduce((sum, row) => sum + (Number(row.querySelector('[data-line="qty"]').value) || 0) * (Number(row.querySelector('[data-line="unit-cost"]').value) || 0), 0);
    const total = serviceTotal + materialTotal;
    modal.querySelector("#calculated-total").textContent = money(total);
    return total;
  };
  modal.querySelector("#add-service").addEventListener("click", () => {
    const picker = modal.querySelector("#service-picker");
    const item = picker.value === "" ? null : serviceCatalog[Number(picker.value)];
    modal.querySelector("#service-lines").insertAdjacentHTML("beforeend", orderServiceRow(item ? { name: item.name, price: item.price, basePrice: item.price, qty: 1 } : {}));
    calculateLines();
  });
  modal.querySelector("#add-material").addEventListener("click", () => {
    const picker = modal.querySelector("#material-picker");
    const item = picker.value === "" ? null : data.warehouse.filter((entry) => !entry.archived && !entry.hiddenFromOrders)[Number(picker.value)];
    modal.querySelector("#material-lines").insertAdjacentHTML("beforeend", orderMaterialRow(item ? { warehouseId: item.id, name: item.name, qty: 1, unit: item.unit, unitCost: item.price || item.lastPurchasePrice || 0, tracking: item.tracking, writeOff: true } : {}));
    calculateLines();
  });
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-remove-line]")) {
      event.target.closest(".line-item").remove();
      calculateLines();
    }
  });
  modal.addEventListener("input", (event) => { if (event.target.closest(".line-item")) calculateLines(); });
  modal.querySelector("#use-calculated-total").addEventListener("click", () => { formElement.elements.sum.value = calculateLines(); });
  calculateLines();
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  const collectOrderForm = ({ asDraft = false } = {}) => {
    const form = new FormData(formElement);
    return {
      ...order,
      id: asDraft ? crypto.randomUUID() : (order.id || newOrderId()),
      created: order.created || new Date().toISOString(),
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
      address: form.get("address"),
      issue: form.get("issue"),
      diagnosis: form.get("diagnosis"),
      defects: form.get("defects"),
      comment: form.get("comment"),
      guaranteeNote: form.get("guaranteeNote"),
      nextVisit: form.get("nextVisit") || null,
      status: form.get("status"),
      services: [...modal.querySelectorAll("[data-service-row]")].map((row) => ({
        name: row.querySelector('[data-line="name"]').value,
        qty: Number(row.querySelector('[data-line="qty"]').value) || 1,
        price: Number(row.querySelector('[data-line="price"]').value) || 0,
        basePrice: Number(row.querySelector('[data-line="price"]').value) || 0
      })).filter((item) => item.name.trim()),
      materials: [...modal.querySelectorAll("[data-material-row]")].map((row) => ({
        warehouseId: row.dataset.warehouseId || null,
        name: row.querySelector('[data-line="name"]').value,
        qty: Number(row.querySelector('[data-line="qty"]').value) || 1,
        unitCost: Number(row.querySelector('[data-line="unit-cost"]').value) || 0,
        unit: row.dataset.unit || "шт.",
        writeOff: row.dataset.writeOff === "true"
      })).filter((item) => item.name.trim()),
      photos: orderPhotos
    };
  };

  modal.querySelector("#save-order-draft").addEventListener("click", async () => {
    const draft = collectOrderForm({ asDraft: true });
    if (Array.isArray(data.draft)) data.draft.push(draft);
    else if (looksLikeOrderDraft(data.draft)) data.draft = [structuredClone(data.draft), draft];
    else if (data.draft && typeof data.draft === "object") data.draft[`draft_${Date.now()}`] = draft;
    else data.draft = [draft];
    await saveData();
    modal.remove();
    moreSection = "drafts";
    activePage = "more";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    toast("Черновик сохранён");
  });

  formElement.addEventListener("submit", async (event) => {
    event.preventDefault();
    const next = collectOrderForm();
    delete next.draft;
    const stockSync = syncOrderStock(previousMaterials, next.materials, next.id);
    if (!stockSync.ok) return toast(stockSync.message);
    const index = data.orders.findIndex((item) => String(item.id) === String(next.id));
    if (index >= 0) data.orders[index] = next; else data.orders.push(next);
    await saveData();
    modal.remove();
    render();
    toast("Заявка сохранена");
  });
}



function receiptModal(existing = null, receiptIndex = -1) {
  const item = existing || {};
  const isStored = receiptIndex >= 0;
  const view = receiptSummary(item);
  const rawDate = String(view.date || "");
  const dateValue = /^\d{4}-\d{2}-\d{2}/.test(rawDate) ? rawDate.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const orderOptions = [...data.orders].reverse().map((order) => `<option value="${escapeHtml(order.id)}" ${String(view.orderId) === String(order.id) ? "selected" : ""}>№${escapeHtml(order.id)} · ${escapeHtml(order.name || "Без имени")} · ${money(order.sum)}</option>`).join("");
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<form class="modal compact-modal" id="receipt-form">
    <h2>${isStored ? "Редактировать документ" : "Новый документ"}</h2>
    <div class="form-grid">
      <div class="form-group full"><label>Тип / название</label><input class="field" name="title" value="${escapeHtml(view.title)}" required placeholder="Чек, квитанция, заказ-наряд…" /></div>
      <div class="form-group"><label>Номер</label><input class="field" name="number" value="${escapeHtml(view.number)}" /></div>
      <div class="form-group"><label>Дата</label><input class="field" name="date" type="date" value="${escapeHtml(dateValue)}" /></div>
      <div class="form-group"><label>Сумма</label><input class="field" name="amount" type="number" min="0" step="1" value="${view.amount}" /></div>
      <div class="form-group"><label>Заявка</label><select class="field" name="orderId"><option value="">— Не привязана —</option>${orderOptions}</select></div>
      <div class="form-group full"><label>Комментарий</label><textarea class="field textarea" name="note">${escapeHtml(view.note)}</textarea></div>
    </div>
    <div class="modal-actions">${isStored ? '<button type="button" class="danger-button" id="delete-receipt">Удалить</button>' : ""}<button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("#delete-receipt")?.addEventListener("click", async () => {
    if (!confirm("Удалить документ?")) return;
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
      title: form.get("title"),
      number: form.get("number"),
      date: date ? new Date(`${date}T12:00:00`).toISOString() : null,
      amount: Number(form.get("amount")) || 0,
      orderId: form.get("orderId") || null,
      note: form.get("note"),
      updatedAt: new Date().toISOString()
    };
    if (!Array.isArray(data.receipts)) data.receipts = [];
    if (receiptIndex >= 0) data.receipts[receiptIndex] = next;
    else data.receipts.push({ ...next, createdAt: new Date().toISOString() });
    await saveData(); modal.remove(); await render(); toast("Документ сохранён");
  });
}
function toolModal(existing = null, toolIndex = -1) {
  const item = existing || {};
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<form class="modal compact-modal" id="tool-form">
    <h2>${existing ? "Редактировать инструмент" : "Новый инструмент"}</h2>
    <div class="form-grid">
      <div class="form-group full"><label>Название</label><input class="field" name="name" value="${escapeHtml(item.name || item.title || item.tool || "")}" required /></div>
      <div class="form-group"><label>Категория</label><input class="field" name="category" value="${escapeHtml(item.category || item.type || "")}" placeholder="Электроинструмент, измерительный…" /></div>
      <div class="form-group"><label>Состояние</label><input class="field" name="status" value="${escapeHtml(item.status || item.state || "В наличии")}" /></div>
      <div class="form-group"><label>Стоимость</label><input class="field" name="price" type="number" min="0" step="1" value="${Number(item.price || item.purchasePrice) || 0}" /></div>
      <div class="form-group"><label>Серийный номер</label><input class="field" name="serial" value="${escapeHtml(item.serial || item.serialNumber || "")}" /></div>
      <div class="form-group full"><label>Комментарий</label><textarea class="field textarea" name="note">${escapeHtml(item.note || item.comment || "")}</textarea></div>
    </div>
    <div class="modal-actions">${existing ? '<button type="button" class="danger-button" id="delete-tool">Удалить</button>' : ""}<button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("#delete-tool")?.addEventListener("click", async () => {
    if (!confirm("Удалить инструмент?")) return;
    if (toolIndex >= 0) data.tools.splice(toolIndex, 1);
    await saveData(); modal.remove(); await render(); toast("Инструмент удалён");
  });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = {
      ...item,
      id: item.id || crypto.randomUUID(),
      name: form.get("name"),
      category: form.get("category"),
      status: form.get("status"),
      price: Number(form.get("price")) || 0,
      serial: form.get("serial"),
      note: form.get("note"),
      updatedAt: new Date().toISOString()
    };
    if (!Array.isArray(data.tools)) data.tools = [];
    if (toolIndex >= 0) data.tools[toolIndex] = next; else data.tools.push({ ...next, createdAt: new Date().toISOString() });
    await saveData(); modal.remove(); await render(); toast("Инструмент сохранён");
  });
}

function customServiceModal(existing = null, serviceIndex = -1) {
  const item = existing || {};
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<form class="modal compact-modal" id="custom-service-form">
    <h2>${existing ? "Редактировать свою услугу" : "Новая своя услуга"}</h2>
    <div class="form-grid">
      <div class="form-group full"><label>Название</label><input class="field" name="name" value="${escapeHtml(item.name || item.title || item.service || "")}" required /></div>
      <div class="form-group"><label>Категория</label><input class="field" name="category" value="${escapeHtml(item.category || item.tech || "")}" /></div>
      <div class="form-group"><label>Цена</label><input class="field" name="price" type="number" min="0" step="1" value="${Number(item.price || item.cost || item.sum) || 0}" /></div>
      <div class="form-group full"><label>Комментарий</label><textarea class="field textarea" name="note">${escapeHtml(item.note || item.comment || "")}</textarea></div>
    </div>
    <div class="modal-actions">${existing ? '<button type="button" class="danger-button" id="delete-custom-service">Удалить</button>' : ""}<button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("#delete-custom-service")?.addEventListener("click", async () => {
    if (!confirm("Удалить пользовательскую услугу?")) return;
    if (serviceIndex >= 0) data.service_custom.splice(serviceIndex, 1);
    await saveData(); modal.remove(); await render(); toast("Услуга удалена");
  });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = {
      ...item,
      id: item.id || crypto.randomUUID(),
      name: form.get("name"),
      category: form.get("category"),
      price: Number(form.get("price")) || 0,
      note: form.get("note"),
      updatedAt: new Date().toISOString()
    };
    if (!Array.isArray(data.service_custom)) data.service_custom = [];
    if (serviceIndex >= 0) data.service_custom[serviceIndex] = next;
    else data.service_custom.push({ ...next, createdAt: new Date().toISOString() });
    await saveData(); modal.remove(); await render(); toast("Своя услуга сохранена");
  });
}
function priceModal(existing = null, priceIndex = -1) {
  const item = existing || {};
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<form class="modal compact-modal" id="price-form">
    <h2>${existing ? "Редактировать позицию" : "Новая позиция прайса"}</h2>
    <div class="form-grid">
      <div class="form-group full"><label>Название</label><input class="field" name="name" value="${escapeHtml(item.name || "")}" required /></div>
      <div class="form-group"><label>Категория</label><input class="field" name="category" value="${escapeHtml(item.category || item.tech || "")}" /></div>
      <div class="form-group"><label>Тип</label><select class="field" name="kind"><option value="service" ${item.kind !== "material" ? "selected" : ""}>Услуга</option><option value="material" ${item.kind === "material" ? "selected" : ""}>Материал</option></select></div>
      <div class="form-group full"><label>Цена</label><input class="field" name="price" type="number" min="0" step="1" value="${Number(item.price) || 0}" required /></div>
    </div>
    <div class="modal-actions">${existing ? '<button type="button" class="danger-button" id="delete-price">Удалить</button>' : ""}<button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("#delete-price")?.addEventListener("click", async () => {
    if (!confirm("Удалить позицию из прайса?")) return;
    if (priceIndex >= 0) data.receipt_prices.splice(priceIndex, 1);
    await saveData(); modal.remove(); await render(); toast("Позиция удалена");
  });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = { ...item, id: item.id || crypto.randomUUID(), name: form.get("name"), category: form.get("category"), kind: form.get("kind"), price: Number(form.get("price")) || 0 };
    if (priceIndex >= 0) data.receipt_prices[priceIndex] = next; else data.receipt_prices.push(next);
    await saveData(); modal.remove(); await render(); toast("Прайс обновлён");
  });
}

function clientModal(clientKey) {
  const orders = data.orders
    .filter((order) => !order.archived && clientKeyForOrder(order) === clientKey)
    .sort((a, b) => new Date(b.created || 0) - new Date(a.created || 0));
  if (!orders.length) return;
  const client = orders[0];
  const total = orders.reduce((sum, order) => sum + (Number(order.sum) || 0), 0);
  const closed = orders.filter((order) => normalizeStatus(order.status) === "closed").length;
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<div class="modal compact-modal">
    <h2>${escapeHtml(client.name || "Клиент")}</h2>
    <div class="form-grid">
      <div class="form-group"><label>Телефон</label><div class="field readonly-field">${escapeHtml(client.phone || "—")}</div></div>
      <div class="form-group"><label>Обращений</label><div class="field readonly-field">${orders.length}</div></div>
      <div class="form-group"><label>Закрыто</label><div class="field readonly-field">${closed}</div></div>
      <div class="form-group"><label>Общая сумма</label><div class="field readonly-field">${money(total)}</div></div>
      ${client.address ? `<div class="form-group full"><label>Последний адрес</label><div class="field readonly-field">${escapeHtml(client.address)}</div></div>` : ""}
    </div>
    <div class="form-section-title">История заявок</div>
    <div class="goods-list">${orders.map((order) => `<button class="goods-sheet" data-client-order="${escapeHtml(order.id)}"><span><strong>№${escapeHtml(order.id || "—")} · ${escapeHtml(order.tech || "Техника")}</strong><small>${shortDate(order.created)} · ${escapeHtml(order.status || "В работе")}</small></span><b>${money(order.sum)}</b><span>›</span></button>`).join("")}</div>
    <div class="modal-actions">
      ${client.phone ? `<a class="secondary-button" href="tel:${escapeHtml(client.phone)}">☎ Позвонить</a>` : ""}
      <button type="button" class="primary-button" data-close-modal>Закрыть</button>
    </div>
  </div>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => {
    if (event.target === modal) return modal.remove();
    const orderButton = event.target.closest("[data-client-order]");
    if (!orderButton) return;
    const order = data.orders.find((item) => String(item.id) === String(orderButton.dataset.clientOrder));
    if (!order) return;
    modal.remove();
    newOrderModal(order);
  });
}

function financeModal(type) {
  const isIncome = type === "income";
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<form class="modal compact-modal" id="finance-form"><h2>${isIncome ? "Новый доход" : "Новый расход"}</h2><div class="form-grid"><div class="form-group"><label>Сумма</label><input class="field" name="amount" type="number" min="0" required /></div><div class="form-group"><label>Категория</label><input class="field" name="category" value="${isIncome ? "Дополнительный доход" : "Личные расходы"}" /></div><div class="form-group full"><label>Описание</label><input class="field" name="description" required /></div><div class="form-group full"><label>Дата</label><input class="field" name="date" type="date" value="${new Date().toISOString().slice(0, 10)}" /></div></div><div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div></form>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const item = { id: crypto.randomUUID(), amount: Number(form.get("amount")) || 0, category: form.get("category"), description: form.get("description"), date: new Date(`${form.get("date")}T12:00:00`).toISOString(), source: "manual" };
    data[isIncome ? "incomes" : "expenses"].push(item);
    await saveData();
    modal.remove();
    await render();
    toast(isIncome ? "Доход добавлен" : "Расход добавлен");
  });
}

function stockModal(existing = null) {
  const item = existing || {};
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<form class="modal compact-modal" id="stock-form"><h2>${existing ? "Редактировать позицию" : "Новая позиция"}</h2><div class="form-grid"><div class="form-group full"><label>Название</label><input class="field" name="name" value="${escapeHtml(item.name || "")}" required placeholder="Например, компрессор" /></div><div class="form-group"><label>Категория</label><input class="field" name="category" value="${escapeHtml(item.category || "Запчасти")}" /></div><div class="form-group"><label>Единица хранения</label><select class="field" name="unit">${["шт.", "м", "г", "условно"].map((value) => `<option ${item.unit === value ? "selected" : ""}>${value}</option>`).join("")}</select></div><div class="form-group"><label>${existing ? "Остаток (приход / списание)" : "Количество"}</label><input class="field" name="quantity" type="number" min="0" step="0.01" value="${Number(item.quantity) || 0}" ${existing ? "readonly" : ""} /></div><div class="form-group"><label>Минимальный остаток</label><input class="field" name="min" type="number" min="0" step="0.01" value="${Number(item.min) || 0}" /></div><div class="form-group"><label>Цена продажи</label><input class="field" name="price" type="number" min="0" value="${Number(item.price) || 0}" /></div><div class="form-group"><label>Себестоимость</label><input class="field" name="lastPurchasePrice" type="number" min="0" value="${Number(item.lastPurchasePrice) || 0}" /></div><div class="form-group full"><label>Подходит для техники</label><input class="field" name="compatibility" value="${escapeHtml(Array.isArray(item.compatibility) ? item.compatibility.join(", ") : "")}" placeholder="Холодильники, стиральные машины…" /></div></div><div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div></form>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = { ...item, id: item.id || crypto.randomUUID(), name: form.get("name"), category: form.get("category"), unit: form.get("unit"), quantity: Number(form.get("quantity")) || 0, min: Number(form.get("min")) || 0, price: Number(form.get("price")) || 0, lastPurchasePrice: Number(form.get("lastPurchasePrice")) || 0, compatibility: String(form.get("compatibility") || "").split(",").map((value) => value.trim()).filter(Boolean), archived: false, hiddenFromOrders: false, tracking: item.tracking || "exact", consumeUnit: item.consumeUnit || form.get("unit") };
    const index = data.warehouse.findIndex((entry) => String(entry.id) === String(next.id));
    if (index >= 0) data.warehouse[index] = next; else data.warehouse.push(next);
    if (!existing && next.quantity > 0) data.warehouse_movements.push({ id: crypto.randomUUID(), warehouseId: next.id, name: next.name, qty: next.quantity, type: "initial", date: new Date().toISOString() });
    await saveData(); modal.remove(); await render(); toast("Позиция склада сохранена");
  });
}

const goodsLine = (item = {}) => `<div class="line-item" data-goods-row>
  <input class="field" data-line="name" value="${escapeHtml(item.name || "")}" placeholder="Товар или материал" />
  <input class="field compact" data-line="qty" type="number" min="0.01" step="0.01" value="${Number(item.qty) || 1}" aria-label="Количество" />
  <input class="field compact" data-line="price" type="number" min="0" step="1" value="${Number(item.price) || 0}" aria-label="Цена" />
  <button type="button" class="remove-line" data-remove-line aria-label="Удалить">×</button>
</div>`;

function goodsModal(existing = null) {
  const sheet = existing || { id: crypto.randomUUID(), title: "Новый товарник", items: [], target: 0, createdAt: new Date().toISOString() };
  const options = data.receipt_prices.map((item, index) => `<option value="${index}">${escapeHtml(item.name)} · ${money(item.price)}</option>`).join("");
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<form class="modal" id="goods-form"><h2>Товарник</h2><div class="form-grid"><div class="form-group full"><label>Название расчёта</label><input class="field" name="title" value="${escapeHtml(sheet.title || "")}" required /></div></div>
    <div class="form-section-title">Позиции</div><div class="catalog-add"><select class="field" id="goods-picker"><option value="">— Выбрать из прайс-листа —</option>${options}</select><button type="button" class="secondary-button" id="add-goods-line">+ Добавить</button></div><div class="line-head"><span>Наименование</span><span>Кол-во</span><span>Цена</span><span></span></div><div class="line-list" id="goods-lines">${(sheet.items || []).map(goodsLine).join("")}</div>
    <div class="form-section-title">Итог</div><div class="form-grid"><div class="form-group"><label>Целевая сумма</label><input class="field" id="goods-target" name="target" type="number" min="0" value="${Number(sheet.target) || 0}" /></div><div class="form-group"><label>Текущая сумма</label><div class="field readonly-field" id="goods-total">0 ₽</div></div></div><div class="goods-adjust"><button type="button" class="secondary-button" id="adjust-goods-prices">Подогнать цены под цель</button><button type="button" class="danger-button" id="delete-goods-sheet" ${existing ? "" : "disabled"}>Удалить товарник</button></div>
    <div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div></form>`;
  document.body.appendChild(modal);
  const calculate = () => {
    const total = [...modal.querySelectorAll("[data-goods-row]")].reduce((sum, row) => sum + (Number(row.querySelector('[data-line="qty"]').value) || 0) * (Number(row.querySelector('[data-line="price"]').value) || 0), 0);
    modal.querySelector("#goods-total").textContent = money(total);
    return total;
  };
  modal.querySelector("#add-goods-line").addEventListener("click", () => {
    const picker = modal.querySelector("#goods-picker");
    const item = picker.value === "" ? null : data.receipt_prices[Number(picker.value)];
    modal.querySelector("#goods-lines").insertAdjacentHTML("beforeend", goodsLine(item ? { name: item.name, qty: 1, price: item.price } : {}));
    calculate();
  });
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-remove-line]")) { event.target.closest(".line-item").remove(); calculate(); }
  });
  modal.addEventListener("input", (event) => { if (event.target.closest("[data-goods-row]")) calculate(); });
  modal.querySelector("#adjust-goods-prices").addEventListener("click", () => {
    const rows = [...modal.querySelectorAll("[data-goods-row]")];
    const target = Number(modal.querySelector("#goods-target").value);
    const current = calculate();
    if (!rows.length || !Number.isFinite(target) || target < 0) return toast("Добавь позиции и укажи целевую сумму");
    rows.forEach((row) => {
      const qty = Number(row.querySelector('[data-line="qty"]').value) || 1;
      const price = Number(row.querySelector('[data-line="price"]').value) || 0;
      row.querySelector('[data-line="price"]').value = Math.round(current ? price * target / current : target / rows.length / qty);
    });
    calculate();
  });
  modal.querySelector("#delete-goods-sheet").addEventListener("click", async () => {
    if (!existing || !confirm("Удалить этот товарник?")) return;
    data.goods_sheets = (data.goods_sheets || []).filter((item) => String(item.id) !== String(sheet.id));
    await saveData(); modal.remove(); await render(); toast("Товарник удалён");
  });
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = { ...sheet, title: form.get("title"), target: Number(form.get("target")) || 0, items: [...modal.querySelectorAll("[data-goods-row]")].map((row) => ({ name: row.querySelector('[data-line="name"]').value, qty: Number(row.querySelector('[data-line="qty"]').value) || 1, price: Number(row.querySelector('[data-line="price"]').value) || 0 })).filter((item) => item.name.trim()), total: calculate(), updatedAt: new Date().toISOString() };
    const index = (data.goods_sheets || []).findIndex((item) => String(item.id) === String(next.id));
    if (!Array.isArray(data.goods_sheets)) data.goods_sheets = [];
    if (index >= 0) data.goods_sheets[index] = next; else data.goods_sheets.push(next);
    await saveData(); modal.remove(); await render(); toast("Товарник сохранён");
  });
  calculate();
}

async function handleOrderAction(action, id) {
  const index = data.orders.findIndex((item) => String(item.id) === String(id));
  if (index < 0) return;
  const order = data.orders[index];
  if (action === "edit") return newOrderModal(order);
  if (action === "receipt") return receiptModal({ title: "Квитанция", date: new Date().toISOString(), amount: Number(order.sum) || 0, orderId: order.id, note: [order.tech, order.brand].filter(Boolean).join(" ") });
  if (action === "toggle") {
    order.status = normalizeStatus(order.status) === "closed" ? "В работе" : "Закрыта";
  }
  if (action === "copy") {
    const copy = {
      ...structuredClone(order),
      id: newOrderId(),
      created: new Date().toISOString(),
      status: "В работе",
      archived: false,
      archivedAt: null,
      photos: []
    };
    const stockSync = syncOrderStock([], copy.materials, copy.id);
    if (!stockSync.ok) return toast(`Копия не создана: ${stockSync.message}`);
    data.orders.push(copy);
  }
  if (action === "archive") {
    order.archived = !order.archived;
    order.archivedAt = order.archived ? new Date().toISOString() : null;
  }
  await saveData();
  render();
  toast(action === "copy" ? "Создана копия заявки" : action === "archive" ? (order.archived ? "Заявка перемещена в архив" : "Заявка возвращена") : "Статус обновлён");
}

async function adjustStock(id, direction) {
  const item = data.warehouse.find((entry) => String(entry.id) === String(id));
  if (!item) return;
  const amount = Number(prompt(direction === "in" ? "Количество для прихода" : "Количество для списания", "1"));
  if (!Number.isFinite(amount) || amount <= 0) return;
  const before = Number(item.quantity) || 0;
  if (direction === "out" && amount > before) return toast(`Недостаточно на складе: доступно ${before} ${item.unit || "шт."}`);
  item.quantity = direction === "in" ? before + amount : before - amount;
  data.warehouse_movements.push({ id: crypto.randomUUID(), warehouseId: item.id, name: item.name, qty: amount, type: direction === "in" ? "manual_in" : "manual_out", date: new Date().toISOString() });
  await saveData();
  render();
  toast("Остаток обновлён");
}

app.addEventListener("click", async (event) => {
  const navButton = event.target.closest("[data-nav]");
  if (navButton) {
    activePage = navButton.dataset.nav;
    if (activePage !== "more") moreSection = "menu";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) { orderFilter = filter.dataset.filter; saveUiState(); await render(); return; }
  const orderPeriodFilter = event.target.closest("[data-order-period]");
  if (orderPeriodFilter) { orderPeriod = orderPeriodFilter.dataset.orderPeriod; saveUiState(); await render(); return; }
  const analyticsFilter = event.target.closest("[data-analytics-period]");
  if (analyticsFilter) { analyticsPeriod = analyticsFilter.dataset.analyticsPeriod; saveUiState(); await render(); return; }
  const financeFilter = event.target.closest("[data-finance-period]");
  if (financeFilter) { financePeriod = financeFilter.dataset.financePeriod; saveUiState(); await render(); return; }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "new-order") return newOrderModal();
  if (action === "import") return fileInput.click();
  if (action === "inspect-backup-file") return inspectBackupFile();
  if (action === "download-backup") return downloadBackup();
  if (action === "choose-folder") return chooseBackupFolder();
  if (action === "folder-backup") return writeBackupToDirectory();
  if (action === "backup-self-test") return runBackupSelfTest();
  if (action === "restore-pre-import") {
    const rollback = await dbGet(PRE_IMPORT_KEY);
    if (!rollback) return toast("Точки отката пока нет");
    if (!confirm("Вернуть данные, которые были до последнего импорта?")) return;
    const current = structuredClone(data);
    data = validateBackup(structuredClone(rollback));
    await saveData();
    await dbSet(PRE_IMPORT_KEY, current);
    activePage = "orders";
    moreSection = "menu";
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return toast("Данные до импорта восстановлены");
  }
  if (action === "more-menu") { moreSection = "menu"; saveUiState({ scrollY: 0 }); window.scrollTo(0, 0); return render(); }
  if (action === "add-finance") return financeModal(event.target.closest("[data-action]").dataset.type);
  if (action === "check-update") return checkForAppUpdate();
  if (action === "run-diagnostics") return runAppDiagnostics();
  if (action === "protect-storage") return requestPersistentStorage();
  if (action === "new-price") return priceModal();
  if (action === "new-receipt") return receiptModal();
  if (action === "continue-draft") {
    const key = event.target.closest("[data-action]").dataset.key;
    const draft = getDraftRecord(key);
    if (draft && typeof draft === "object") return newOrderModal(draft, { forceNew: true });
    return toast("Этот черновик нельзя продолжить как заявку");
  }
  if (action === "delete-draft") {
    const key = event.target.closest("[data-action]").dataset.key;
    if (!confirm("Удалить этот черновик?")) return;
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
  if (action === "new-goods-sheet") return goodsModal();
  if (action === "edit-goods-sheet") {
    const id = event.target.closest("[data-action]").dataset.id;
    const sheet = (data.goods_sheets || []).find((item) => String(item.id) === String(id));
    if (sheet) return goodsModal(sheet);
  }
  if (action === "print-act") return window.print();
  if (action === "toggle-auto") {
    data.settings.autoBackup = !data.settings.autoBackup;
    await saveData();
    await render();
    toast(data.settings.autoBackup ? "Автобэкап включён" : "Автобэкап выключен");
    return;
  }
  const more = event.target.closest("[data-more]")?.dataset.more;
  if (more) {
    if (["backup", "prices", "clients", "finance", "goods", "tools", "receipts", "drafts", "act", "settings"].includes(more)) moreSection = more;
    else toast("Раздел будет восстановлен на следующем этапе");
    saveUiState({ scrollY: 0 });
    await render();
    window.scrollTo(0, 0);
    return;
  }
  const orderAction = event.target.closest("[data-order-action]");
  if (orderAction) return handleOrderAction(orderAction.dataset.orderAction, orderAction.dataset.id);
  const stock = event.target.closest("[data-stock]");
  if (stock) return adjustStock(stock.dataset.id, stock.dataset.stock);
  const financeDelete = event.target.closest("[data-delete-finance]");
  if (financeDelete) {
    const key = financeDelete.dataset.deleteFinance === "income" ? "incomes" : "expenses";
    data[key] = data[key].filter((item) => String(item.id) !== String(financeDelete.dataset.id));
    await saveData();
    await render();
    toast("Операция удалена");
  }
});

app.addEventListener("input", (event) => {
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
});

app.addEventListener("submit", async (event) => {
  if (event.target.id !== "settings-form") return;
  event.preventDefault();
  const form = new FormData(event.target);
  data.settings = { ...data.settings, companyName: form.get("companyName"), name: form.get("name"), phone: form.get("phone"), companyAddress: form.get("companyAddress"), inn: form.get("inn") };
  await saveData();
  toast("Настройки сохранены");
});

app.addEventListener("change", async (event) => {
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
    const warnings = backupWarnings(restored);
    const warningText = warnings.length ? `\n\nПредупреждения:\n• ${warnings.join("\n• ")}` : "";
    const confirmed = confirm(`Восстановить ${restored.orders.length} заявок, ${restored.warehouse.length} складских позиций и ${restored.receipt_prices.length} цен?\n\nТекущие данные будут сохранены как точка отката перед заменой.${warningText}`);
    if (!confirmed) return;
    await dbSet(PRE_IMPORT_KEY, structuredClone(data));
    data = restored;
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
    if (stored) data = validateBackup(stored);
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
