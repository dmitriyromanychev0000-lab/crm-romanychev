const DB_NAME = "crm-romanychev";
const DB_VERSION = 1;
const STORE = "keyval";
const DATA_KEY = "crm-data";
const DIRECTORY_KEY = "backup-directory";

const defaultData = () => ({
  version: 18,
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

let data = defaultData();
let activePage = "orders";
let orderFilter = "all";
let searchQuery = "";
let moreSection = "menu";

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

const escapeHtml = (value = "") => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");

const money = (value) => `${new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Number(value) || 0)} ₽`;

const shortDate = (value) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return escapeHtml(value);
  return new Intl.DateTimeFormat("ru-RU").format(date);
};

const normalizeStatus = (status) => {
  const value = String(status || "").toLowerCase();
  if (value.includes("закры")) return "closed";
  if (value.includes("отказ")) return "declined";
  return "active";
};

function toast(message) {
  toastElement.textContent = message;
  toastElement.classList.add("show");
  clearTimeout(toastElement.timer);
  toastElement.timer = setTimeout(() => toastElement.classList.remove("show"), 2800);
}

function validateBackup(candidate) {
  if (!candidate || typeof candidate !== "object") throw new Error("Файл не содержит объект CRM");
  const required = ["orders", "warehouse", "warehouse_movements", "expenses", "receipt_prices"];
  for (const key of required) {
    if (!Array.isArray(candidate[key])) throw new Error(`В бэкапе отсутствует раздел ${key}`);
  }
  if (!candidate.settings || typeof candidate.settings !== "object") candidate.settings = {};
  return {
    ...defaultData(),
    ...candidate,
    settings: { ...defaultData().settings, ...candidate.settings }
  };
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

function downloadBackup() {
  const blob = new Blob([backupPayload()], { type: "application/json;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = backupFilename();
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(link.href);
  markBackupComplete();
  toast("Бэкап скачан на устройство");
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
      await writeBackupToDirectory({ silent: true });
      toast("Автоматический бэкап сохранён");
    }
  } catch (error) {
    console.warn("Автобэкап ожидает разрешения пользователя", error);
  }
}

function nav() {
  const items = [
    ["orders", "▣", "Заявки"],
    ["warehouse", "▥", "Склад"],
    ["analytics", "⌁", "Аналитика"],
    ["more", "•••", "Ещё"]
  ];
  return `<nav class="bottom-nav">${items.map(([id, icon, label]) => `
    <button class="nav-button ${activePage === id ? "active" : ""}" data-nav="${id}">
      <span class="nav-icon">${icon}</span>${label}
    </button>`).join("")}</nav>`;
}

function header() {
  return `<header class="topbar">
    <div class="logo">⌁</div>
    <div class="brand">
      <div class="brand-title">CRM by <span>Romanychev</span> 😎</div>
      <div class="brand-subtitle">Личный кабинет мастера</div>
    </div>
  </header>`;
}

function emptyState(icon, title, description) {
  return `<div class="panel empty"><div class="empty-icon">${icon}</div><h2>${title}</h2><p>${description}</p></div>`;
}

function orderCard(order) {
  const statusType = normalizeStatus(order.status);
  const isClosed = statusType === "closed";
  const photos = Array.isArray(order.photos) ? order.photos.length : 0;
  return `<article class="panel order-card ${isClosed ? "closed" : ""}">
    <div class="order-top">
      <div><span class="order-number">№${escapeHtml(order.id || "—")}</span><span class="order-name">${escapeHtml(order.name || "Без имени")}</span></div>
      <div><div class="order-date">${shortDate(order.created)}</div><span class="status ${isClosed ? "closed" : ""}">${escapeHtml(order.status || "В работе")}</span></div>
    </div>
    <div class="appliance">
      <div class="appliance-main"><div class="appliance-icon">▥</div><div><div class="appliance-name">${escapeHtml(order.tech || "Техника")}</div><div class="appliance-model">${escapeHtml(order.brand || "Модель не указана")}</div></div></div>
      <div class="sum">${money(order.sum)}</div>
    </div>
    <div class="meta">
      ${order.phone ? `<span>☎ ${escapeHtml(order.phone)}</span>` : ""}
      ${order.address ? `<span>⌖ ${escapeHtml(order.address)}</span>` : ""}
      <span>♢ ${escapeHtml(order.guarantee || 0)} мес.</span>
      ${photos ? `<span>▧ ${photos} фото</span>` : ""}
    </div>
    <div class="actions">
      <button class="action" data-order-action="edit" data-id="${escapeHtml(order.id)}"><span>✎</span>Изменить</button>
      <button class="action" data-order-action="toggle" data-id="${escapeHtml(order.id)}"><span>${isClosed ? "↻" : "✓"}</span>${isClosed ? "Открыть" : "Закрыть"}</button>
      <button class="action" data-order-action="copy" data-id="${escapeHtml(order.id)}"><span>▣</span>Копия</button>
      ${order.phone ? `<a class="action" href="tel:${escapeHtml(order.phone)}"><span>☎</span>Позвонить</a>` : `<button class="action" disabled><span>☎</span>Позвонить</button>`}
    </div>
  </article>`;
}

function ordersPage() {
  const query = searchQuery.trim().toLowerCase();
  const filtered = [...data.orders].reverse().filter((order) => {
    const status = normalizeStatus(order.status);
    const filterMatch = orderFilter === "all" || orderFilter === status;
    const haystack = [order.name, order.phone, order.tech, order.brand, order.address, order.id].join(" ").toLowerCase();
    return filterMatch && (!query || haystack.includes(query));
  });
  return `<main class="content">
    <div class="page-head"><div><h1>Заявки</h1><p class="lead">Все ремонты в одном месте</p></div><button class="icon-button" data-action="new-order" aria-label="Новая заявка">+</button></div>
    <div class="search-row"><input class="search" id="order-search" value="${escapeHtml(searchQuery)}" placeholder="Имя, телефон, техника или модель" /></div>
    <div class="chips">
      <button class="chip ${orderFilter === "all" ? "active" : ""}" data-filter="all">Все</button>
      <button class="chip ${orderFilter === "closed" ? "active" : ""}" data-filter="closed">Закрыты</button>
      <button class="chip ${orderFilter === "active" ? "active" : ""}" data-filter="active">В работе</button>
      <button class="chip ${orderFilter === "declined" ? "active" : ""}" data-filter="declined">Отказы</button>
    </div>
    ${filtered.length ? filtered.map(orderCard).join("") : emptyState("▣", "Заявок пока нет", "Импортируй резервную копию или создай первую заявку.")}
  </main>`;
}

function warehousePage() {
  const items = [...data.warehouse].filter((item) => !item.archived);
  const low = items.filter((item) => Number(item.quantity) <= Number(item.min || 0)).length;
  return `<main class="content">
    <div class="page-head"><div><h1>Склад</h1><p class="lead">Запчасти и расходные материалы</p></div></div>
    <div class="metrics panel">
      <div class="metric"><div class="metric-label">Активных позиций</div><div class="metric-value">${items.length}</div></div>
      <div class="metric"><div class="metric-label">Мало осталось</div><div class="metric-value yellow">${low}</div></div>
    </div>
    ${items.length ? items.map((item) => `<article class="panel stock-card">
      <div class="stock-top"><div><div class="stock-name">${escapeHtml(item.name || "Без названия")}</div><div class="stock-category">${escapeHtml(item.category || "Без категории")} · ${money(item.lastPurchasePrice || item.price)} / ${escapeHtml(item.unit || "шт.")}</div></div><div><div class="quantity">${escapeHtml(item.quantity || 0)} ${escapeHtml(item.unit || "шт.")}</div><div class="small">в наличии</div></div></div>
      <div class="stock-actions"><button class="secondary-button" data-stock="in" data-id="${escapeHtml(item.id)}">+ Приход</button><button class="secondary-button" data-stock="out" data-id="${escapeHtml(item.id)}">− Списать</button></div>
    </article>`).join("") : emptyState("▥", "Склад пуст", "Позиции появятся после импорта бэкапа.")}
  </main>`;
}

function analyticsPage() {
  const closed = data.orders.filter((order) => normalizeStatus(order.status) === "closed");
  const revenue = closed.reduce((sum, order) => sum + (Number(order.sum) || 0), 0);
  const expenses = data.expenses.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const materialCost = closed.reduce((sum, order) => sum + (Number(order.expense_gray) || 0) + (Number(order.expense_white) || 0), 0);
  const profit = revenue - expenses - materialCost;
  const average = closed.length ? revenue / closed.length : 0;
  const grouped = new Map();
  closed.forEach((order) => {
    const date = shortDate(order.created);
    grouped.set(date, (grouped.get(date) || 0) + (Number(order.sum) || 0));
  });
  const bars = [...grouped.entries()].slice(-7);
  const max = Math.max(...bars.map(([, value]) => value), 1);
  return `<main class="content">
    <div class="page-head"><div><h1>Аналитика</h1><p class="lead">Финансы, эффективность, клиенты и склад</p></div></div>
    <section class="panel">
      <div class="panel-title"><span class="badge-icon">◇</span> Главные показатели</div>
      <div class="metrics">
        <div class="metric"><div class="metric-label">Закрыто</div><div class="metric-value">${closed.length}</div></div>
        <div class="metric"><div class="metric-label">Выручка</div><div class="metric-value blue">${money(revenue)}</div></div>
        <div class="metric"><div class="metric-label">Чистый результат</div><div class="metric-value green">${money(profit)}</div></div>
        <div class="metric"><div class="metric-label">Расходы</div><div class="metric-value red">${money(expenses + materialCost)}</div></div>
        <div class="metric"><div class="metric-label">Средний чек</div><div class="metric-value yellow">${money(average)}</div></div>
        <div class="metric"><div class="metric-label">Склад</div><div class="metric-value purple">${data.warehouse.length}</div></div>
      </div>
    </section>
    <section class="panel"><div class="panel-title">⌁ Динамика выручки</div>${bars.length ? `<div class="bars">${bars.map(([label, value]) => `<div class="bar-wrap"><span>${money(value)}</span><div class="bar" style="height:${Math.max(5, value / max * 120)}px"></div><span>${label}</span></div>`).join("")}</div>` : `<div class="empty">Пока нет данных для графика</div>`}</section>
  </main>`;
}

function priceList() {
  const prices = data.receipt_prices.slice(0, 100);
  return `<main class="content"><div class="page-head"><div><h1>Прайс-лист</h1><p class="lead">Каталог услуг и материалов</p></div><button class="secondary-button" data-action="more-menu">Назад</button></div>
    <section class="panel">${prices.length ? `<ul class="list">${prices.map((item) => `<li class="price-row"><div><strong>${escapeHtml(item.name)}</strong><div class="small">${escapeHtml(item.category || item.tech || "")}</div></div><strong class="accent">${money(item.price)}</strong></li>`).join("")}</ul>` : `<div class="empty">Прайс пуст</div>`}</section></main>`;
}

async function backupSettings() {
  const directory = await dbGet(DIRECTORY_KEY);
  return `<main class="content"><div class="page-head"><div><h1>Бэкапы</h1><p class="lead">Данные остаются на твоём устройстве</p></div><button class="secondary-button" data-action="more-menu">Назад</button></div>
    <section class="panel">
      <div class="panel-title"><span class="badge-icon">▧</span> Резервное копирование</div>
      <div class="backup-grid">
        <button class="primary-button" data-action="import">Импортировать JSON</button>
        <button class="secondary-button" data-action="download-backup">Скачать бэкап</button>
        <button class="secondary-button" data-action="choose-folder">Выбрать папку</button>
        <button class="secondary-button" data-action="folder-backup">Сохранить в папку</button>
      </div>
      <div class="setting-row"><div><strong>Папка</strong><div class="small">${directory ? escapeHtml(directory.name) : "Не выбрана"}</div></div></div>
      <div class="setting-row"><div><strong>Автоматический бэкап</strong><div class="small">Проверяется при открытии приложения</div></div><button class="toggle ${data.settings.autoBackup ? "on" : ""}" data-action="toggle-auto" aria-label="Автоматический бэкап"></button></div>
      <div class="setting-row"><div><strong>Периодичность</strong></div><select id="backup-days">${[1,2,3,5,7,14].map((days) => `<option value="${days}" ${Number(data.settings.autoBackupDays) === days ? "selected" : ""}>${days === 1 ? "Каждый день" : `Раз в ${days} дней`}</option>`).join("")}</select></div>
      <div class="setting-row"><div><strong>Последний бэкап</strong><div class="small">${data.settings.lastBackupAt ? new Date(data.settings.lastBackupAt).toLocaleString("ru-RU") : "Ещё не создавался"}</div></div></div>
    </section>
    <section class="panel"><div class="panel-title">Содержимое</div><div class="metrics"><div class="metric"><div class="metric-label">Заявки</div><div class="metric-value">${data.orders.length}</div></div><div class="metric"><div class="metric-label">Склад</div><div class="metric-value">${data.warehouse.length}</div></div><div class="metric"><div class="metric-label">Движения</div><div class="metric-value">${data.warehouse_movements.length}</div></div><div class="metric"><div class="metric-label">Прайс</div><div class="metric-value">${data.receipt_prices.length}</div></div></div></section>
  </main>`;
}

function moreMenu() {
  const items = [
    ["backup", "▧", "Бэкапы", "Импорт, экспорт и автосохранение"],
    ["prices", "◇", "Прайс-лист", "Каталог услуг и материалов"],
    ["clients", "♙", "Клиенты", "История обращений и ремонтов"],
    ["finance", "₽", "Финансы", "Расходы и дополнительные доходы"],
    ["act", "▤", "Акт", "Подготовка и печать документа"],
    ["settings", "⚙", "Настройки", "Оформление и параметры приложения"]
  ];
  return `<main class="content"><div class="page-head"><div><h1>Ещё</h1><p class="lead">Финансы, документы, прайс и настройки</p></div></div><div class="menu-list">${items.map(([id, icon, name, description]) => `<button class="menu-item" data-more="${id}"><span class="menu-icon">${icon}</span><span class="menu-copy"><span class="menu-name">${name}</span><span class="menu-description">${description}</span></span><span class="chevron">›</span></button>`).join("")}</div></main>`;
}

async function morePage() {
  if (moreSection === "backup") return backupSettings();
  if (moreSection === "prices") return priceList();
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

function newOrderModal(existing = null) {
  const order = existing || {};
  const modal = document.createElement("div");
  modal.className = "modal-backdrop";
  modal.innerHTML = `<form class="modal" id="order-form">
    <h2>${existing ? "Редактировать заявку" : "Новая заявка"}</h2>
    <div class="form-grid">
      <div class="form-group"><label>Клиент</label><input class="field" name="name" value="${escapeHtml(order.name || "")}" required /></div>
      <div class="form-group"><label>Телефон</label><input class="field" name="phone" value="${escapeHtml(order.phone || "")}" inputmode="tel" /></div>
      <div class="form-group"><label>Техника</label><select class="field" name="tech">${["Холодильник","Стиральная машина","Посудомоечная машина","Другое"].map((value) => `<option ${order.tech === value ? "selected" : ""}>${value}</option>`).join("")}</select></div>
      <div class="form-group"><label>Модель</label><input class="field" name="brand" value="${escapeHtml(order.brand || "")}" /></div>
      <div class="form-group"><label>Сумма</label><input class="field" name="sum" type="number" min="0" value="${Number(order.sum) || 0}" /></div>
      <div class="form-group"><label>Гарантия, мес.</label><input class="field" name="guarantee" type="number" min="0" value="${Number(order.guarantee) || 6}" /></div>
      <div class="form-group full"><label>Адрес</label><input class="field" name="address" value="${escapeHtml(order.address || "")}" /></div>
    </div>
    <div class="modal-actions"><button type="button" class="secondary-button" data-close-modal>Отмена</button><button class="primary-button" type="submit">Сохранить</button></div>
  </form>`;
  document.body.appendChild(modal);
  modal.querySelector("[data-close-modal]").addEventListener("click", () => modal.remove());
  modal.addEventListener("click", (event) => { if (event.target === modal) modal.remove(); });
  modal.querySelector("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const next = {
      ...order,
      id: order.id || String(Date.now()).slice(-6),
      created: order.created || new Date().toISOString(),
      status: order.status || "В работе",
      name: form.get("name"),
      phone: form.get("phone"),
      tech: form.get("tech"),
      brand: form.get("brand"),
      sum: Number(form.get("sum")),
      guarantee: Number(form.get("guarantee")),
      address: form.get("address"),
      services: order.services || [],
      materials: order.materials || [],
      photos: order.photos || []
    };
    const index = data.orders.findIndex((item) => String(item.id) === String(next.id));
    if (index >= 0) data.orders[index] = next; else data.orders.push(next);
    await saveData();
    modal.remove();
    render();
    toast("Заявка сохранена");
  });
}

async function handleOrderAction(action, id) {
  const index = data.orders.findIndex((item) => String(item.id) === String(id));
  if (index < 0) return;
  const order = data.orders[index];
  if (action === "edit") return newOrderModal(order);
  if (action === "toggle") {
    order.status = normalizeStatus(order.status) === "closed" ? "В работе" : "Закрыта";
  }
  if (action === "copy") {
    data.orders.push({ ...structuredClone(order), id: String(Date.now()).slice(-6), created: new Date().toISOString(), status: "В работе" });
  }
  await saveData();
  render();
  toast(action === "copy" ? "Создана копия заявки" : "Статус обновлён");
}

async function adjustStock(id, direction) {
  const item = data.warehouse.find((entry) => String(entry.id) === String(id));
  if (!item) return;
  const amount = Number(prompt(direction === "in" ? "Количество для прихода" : "Количество для списания", "1"));
  if (!Number.isFinite(amount) || amount <= 0) return;
  const before = Number(item.quantity) || 0;
  item.quantity = direction === "in" ? before + amount : Math.max(0, before - amount);
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
    await render();
    return;
  }
  const filter = event.target.closest("[data-filter]");
  if (filter) { orderFilter = filter.dataset.filter; await render(); return; }
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (action === "new-order") return newOrderModal();
  if (action === "import") return fileInput.click();
  if (action === "download-backup") return downloadBackup();
  if (action === "choose-folder") return chooseBackupFolder();
  if (action === "folder-backup") return writeBackupToDirectory();
  if (action === "more-menu") { moreSection = "menu"; return render(); }
  if (action === "toggle-auto") {
    data.settings.autoBackup = !data.settings.autoBackup;
    await saveData();
    await render();
    toast(data.settings.autoBackup ? "Автобэкап включён" : "Автобэкап выключен");
    return;
  }
  const more = event.target.closest("[data-more]")?.dataset.more;
  if (more) {
    if (["backup", "prices"].includes(more)) moreSection = more;
    else toast("Раздел будет восстановлен на следующем этапе");
    await render();
    return;
  }
  const orderAction = event.target.closest("[data-order-action]");
  if (orderAction) return handleOrderAction(orderAction.dataset.orderAction, orderAction.dataset.id);
  const stock = event.target.closest("[data-stock]");
  if (stock) return adjustStock(stock.dataset.id, stock.dataset.stock);
});

app.addEventListener("input", (event) => {
  if (event.target.id === "order-search") {
    searchQuery = event.target.value;
    const cursor = event.target.selectionStart;
    render().then(() => {
      const input = document.querySelector("#order-search");
      input?.focus();
      input?.setSelectionRange(cursor, cursor);
    });
  }
});

app.addEventListener("change", async (event) => {
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
    const confirmed = confirm(`Восстановить ${restored.orders.length} заявок, ${restored.warehouse.length} складских позиций и ${restored.receipt_prices.length} цен? Текущие данные будут заменены.`);
    if (!confirmed) return;
    data = restored;
    await saveData();
    activePage = "orders";
    moreSection = "menu";
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
  await maybeAutoBackup();
  if ("serviceWorker" in navigator) navigator.serviceWorker.register("/sw.js").catch(console.warn);
}

start();
