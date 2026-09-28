const { chromium } = require("playwright");
const fs = require("fs");

const BASE_URL = process.env.QA_URL || "http://127.0.0.1:8080/";
const widths = [320, 360, 390, 430];
const outDir = "ui-qa-artifacts";
fs.mkdirSync(outDir, { recursive: true });

const seed = {
  version: 18,
  date: "2026-09-26T12:00:00.000Z",
  orders: [
    {
      id: "0060", created: "2026-09-26T08:30:00+03:00", updatedAt: "2026-09-26T09:20:00+03:00",
      name: "Анна Смирнова", phone: "+79991234567", tech: "Холодильник", brand: "Samsung RB37",
      address: "Санкт-Петербург, проспект Испытателей, 24", issue: "Не охлаждает верхняя камера, периодически шумит",
      diagnosis: "Износ вентилятора испарителя", defects: "Небольшая вмятина справа", status: "В работе",
      nextVisit: "2026-09-27T11:30", sum: 12400, prepay: 2000, discount: 500, percent: 50,
      expense_gray: 1400, expense_white: 800, guarantee: 6, tag: "Срочно",
      services: [{ name: "Диагностика", qty: 1, price: 1500 }, { name: "Замена вентилятора", qty: 1, price: 6900 }],
      materials: [{ warehouseId: "w1", name: "Вентилятор испарителя Samsung", qty: 1, unit: "шт.", unitCost: 3100, writeOff: true }],
      photos: []
    },
    {
      id: "0059", created: "2026-09-24T14:15:00+03:00", updatedAt: "2026-09-24T18:00:00+03:00",
      completed: "2026-09-24T18:00:00+03:00", name: "Дмитрий Орлов", phone: "+79995556677",
      tech: "Стиральная машина", brand: "LG F2J3", address: "Санкт-Петербург, ул. Савушкина, 118",
      issue: "Не сливает воду", diagnosis: "Засор и износ сливного насоса", status: "Закрыта",
      sum: 8900, prepay: 0, discount: 0, percent: 50, expense_gray: 700, expense_white: 500, guarantee: 6,
      services: [{ name: "Замена сливного насоса", qty: 1, price: 6200 }],
      materials: [{ warehouseId: "w2", name: "Насос сливной LG", qty: 1, unit: "шт.", unitCost: 2100, writeOff: true }],
      photos: []
    },
    {
      id: "0058", created: "2026-09-20T10:00:00+03:00", name: "Мария Петрова", phone: "+79990001122",
      tech: "Посудомоечная машина", brand: "Bosch SMV", address: "Санкт-Петербург, Богатырский проспект, 55к2",
      issue: "Ошибка E15", status: "Отказ", sum: 1500, prepay: 1500, discount: 0, percent: 50,
      expense_gray: 0, expense_white: 0, guarantee: 0, services: [{ name: "Диагностика", qty: 1, price: 1500 }],
      materials: [], photos: []
    }
  ],
  warehouse: [
    { id: "w1", name: "Вентилятор испарителя Samsung", category: "Запчасти", unit: "шт.", quantity: 2, min: 1, price: 5200, lastPurchasePrice: 3100, tracking: "exact", compatibility: ["Холодильники"] },
    { id: "w2", name: "Насос сливной LG", category: "Насосы", unit: "шт.", quantity: 0, min: 2, price: 3900, lastPurchasePrice: 2100, tracking: "exact", compatibility: ["Стиральные машины"] },
    { id: "w3", name: "Хладагент R600a", category: "Расходники", unit: "г", quantity: 480, min: 200, price: 20, lastPurchasePrice: 8, tracking: "exact", compatibility: ["Холодильники"] },
    { id: "w4", name: "Герметик высокотемпературный", category: "Расходники", unit: "шт.", quantity: 5, min: 2, price: 900, lastPurchasePrice: 430, tracking: "presence", compatibility: [] }
  ],
  warehouse_movements: [
    { id: "m1", warehouseId: "w1", name: "Вентилятор испарителя Samsung", qty: 3, type: "in", date: "2026-09-22T12:00:00+03:00" },
    { id: "m2", warehouseId: "w2", name: "Насос сливной LG", qty: 1, type: "out", date: "2026-09-24T17:00:00+03:00", orderId: "0059" }
  ],
  expenses: [
    { id: "e1", amount: 2400, category: "Топливо", description: "Выезды по заявкам", date: "2026-09-25T12:00:00.000Z" },
    { id: "e2", amount: 1200, category: "Расходники", description: "Мелкие материалы", date: "2026-09-23T12:00:00.000Z" }
  ],
  incomes: [
    { id: "i1", amount: 8900, category: "Ремонт", description: "Заявка 0059", date: "2026-09-24T12:00:00.000Z" },
    { id: "i2", amount: 3500, category: "Продажа", description: "Продажа запчасти", date: "2026-09-25T12:00:00.000Z" }
  ],
  service_custom: [{ id: "cs1", name: "Срочный выезд", category: "Дополнительно", tech: "Холодильник", price: 1800 }],
  receipts: [
    { id: "r1", title: "Квитанция", number: "0059", date: "2026-09-24T12:00:00.000Z", amount: 8900, orderId: "0059", note: "Оплачено" },
    { id: "r2", title: "Чек расходных материалов", number: "A-17", date: "2026-09-23T15:00:00.000Z", amount: 1200, orderId: "", note: "Без привязки к заявке" }
  ],
  receipt_prices: [
    { id: "p1", name: "Диагностика", category: "Диагностика", tech: "Холодильник", kind: "service", price: 1500 },
    { id: "p2", name: "Замена вентилятора", category: "Ремонт", tech: "Холодильник", kind: "service", price: 6900 },
    { id: "p3", name: "Вентилятор испарителя Samsung", category: "Товар", tech: "Холодильник", kind: "material", unit: "шт.", price: 5200 },
    { id: "p4", name: "Насос сливной LG", category: "Товар", tech: "Стиральная машина", kind: "material", unit: "шт.", price: 3900 }
  ],
  tools: [
    { id: "t1", name: "Мультиметр Fluke 117", category: "Измерительный", status: "В наличии", price: 28500, serial: "FL-117-2026" },
    { id: "t2", name: "Вакуумный насос Value", category: "Холодильное оборудование", status: "На выезде", price: 19000, serial: "VP-442" }
  ],
  goods_sheets: [{
    id: "g1", title: "Товарник по заявке 0059", target: 7600, total: 7600,
    createdAt: "2026-09-24T18:10:00.000Z", updatedAt: "2026-09-24T18:10:00.000Z",
    items: [{ name: "Насос сливной LG", qty: 1, unit: "шт.", price: 3900 }, { name: "Комплект крепежа", qty: 1, unit: "компл.", price: 3700 }]
  }],
  draft: [{
    id: "draft-1",
    name: "Екатерина Соколова",
    phone: "+79991112233",
    tech: "Посудомоечная машина",
    brand: "Bosch Serie 4",
    sum: 6400,
    issue: "Не сливает воду",
    updatedAt: "2026-09-26T18:30:00.000Z"
  }],
  settings: {
    autoBackup: false, autoBackupDays: 1, lastBackupAt: null, catalogApplyWithoutFit: false,
    companyName: "CRM by Romanychev", name: "Дмитрий Романычев", phone: "+79990000000",
    companyAddress: "Санкт-Петербург", inn: "780000000000"
  }
};

function uiState(extra) {
  return Object.assign({
    activePage: "orders", orderFilter: "all", orderVisitFilter: "all", searchQuery: "",
    warehouseSearch: "", warehouseFilter: "active", warehouseSection: "list", warehouseMovementFilter: "all",
    clientSearch: "", priceSearch: "", priceTechFilter: "all", priceKindFilter: "all",
    analyticsPeriod: "30", analyticsOffset: 0, analyticsCustomStart: "", analyticsCustomEnd: "",
    financePeriod: "all", moreSection: "menu", moreReturnSection: "menu", selectedActOrderId: "0060",
    calendarMonthOffset: 0, calendarSelectedDate: "2026-09-27", scrollY: 0
  }, extra || {});
}

async function writeSeed(page, payload = seed) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.locator("#app > *").first().waitFor({ state: "attached" });
  await page.evaluate(async (payloadValue) => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("crm-romanychev", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("keyval")) request.result.createObjectStore("keyval");
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("keyval", "readwrite");
        tx.objectStore("keyval").put(payloadValue, "crm-data");
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, payload);
}

async function readStoredData(page) {
  return page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("crm-romanychev", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("keyval", "readonly");
        const get = tx.objectStore("keyval").get("crm-data");
        get.onsuccess = () => { const value = get.result; db.close(); resolve(value); };
        get.onerror = () => { db.close(); reject(get.error); };
      };
    });
  });
}

async function readIdbKey(page, key) {
  return page.evaluate(async (keyValue) => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open("crm-romanychev", 1);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("keyval", "readonly");
        const get = tx.objectStore("keyval").get(keyValue);
        get.onsuccess = () => { const value = get.result; db.close(); resolve(value); };
        get.onerror = () => { db.close(); reject(get.error); };
      };
    });
  }, key);
}

async function setState(page, state) {
  await page.evaluate((stateValue) => sessionStorage.setItem("__crm_qa_next_state", JSON.stringify(stateValue)), state);
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      if (attempt === 0) {
        await page.reload({ waitUntil: "domcontentloaded" });
      } else {
        await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
      }
      await page.locator("#app > *").first().waitFor({ state: "attached" });
      await page.waitForTimeout(20);
      return;
    } catch (error) {
      lastError = error;
      const message = String(error?.message || error);
      const transientNavigationError = message.includes("ERR_ABORTED") || message.includes("frame was detached");
      if (!transientNavigationError || attempt === 2) throw error;
      await page.waitForTimeout(60 * (attempt + 1));
    }
  }
  if (lastError) throw lastError;
}

async function inspect(page, label, width) {
  return page.evaluate(({ labelValue, widthValue }) => {
    const root = document.documentElement;
    const body = document.body;
    const overflow = Math.max(root.scrollWidth, body.scrollWidth) - window.innerWidth;
    const visible = (node) => {
      const style = getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return style.display !== "none" && style.visibility !== "hidden" && rect.width > 0 && rect.height > 0;
    };
    const tooSmall = [...document.querySelectorAll("button, a, summary")]
      .filter(visible)
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return { tag: node.tagName, text: (node.innerText || node.getAttribute("aria-label") || "").trim().slice(0, 60), w: Math.round(rect.width), h: Math.round(rect.height) };
      })
      .filter((item) => item.w < 44 || item.h < 44)
      .slice(0, 30);
    return {
      label: labelValue,
      width: widthValue,
      bodyScrollWidth: Math.max(root.scrollWidth, body.scrollWidth),
      viewportWidth: window.innerWidth,
      overflow,
      modalOpen: body.classList.contains("modal-open"),
      tooSmall
    };
  }, { labelValue: label, widthValue: width });
}

async function shot(page, width, label, fullPage = true) {
  const result = await inspect(page, label, width);
  if (result.tooSmall.length) {
    report.failures.push({ width, type: "small-touch-target", label, items: result.tooSmall });
  }
  await page.screenshot({ path: outDir + "/" + width + "-" + label + ".png", fullPage });
  return result;
}

async function fillConfirmed(locator, value) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await locator.fill(value);
    await locator.evaluate((node, nextValue) => {
      if (node.value === nextValue) return;
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
      if (setter) setter.call(node, nextValue);
      else node.value = nextValue;
      node.dispatchEvent(new Event("input", { bubbles: true }));
      node.dispatchEvent(new Event("change", { bubbles: true }));
    }, value);
    if (await locator.inputValue() === value) return true;
    await locator.page().waitForTimeout(15);
  }
  return false;
}

let activeBrowser = null;
const report = { generatedAt: new Date().toISOString(), testedSha: process.env.GITHUB_SHA || null, baseUrl: BASE_URL, results: [], failures: [] };

(async () => {
  const browser = activeBrowser = await chromium.launch({ headless: true });

  const screens = [
    ["orders", uiState({ activePage: "orders" })],
    ["warehouse", uiState({ activePage: "warehouse", warehouseSection: "list" })],
    ["movements", uiState({ activePage: "warehouse", warehouseSection: "movements" })],
    ["shopping", uiState({ activePage: "warehouse", warehouseSection: "shopping" })],
    ["analytics", uiState({ activePage: "analytics" })],
    ["more", uiState({ activePage: "more", moreSection: "menu" })],
    ["calendar", uiState({ activePage: "more", moreSection: "calendar", calendarMonthOffset: 0, calendarSelectedDate: "2026-09-27" })],
    ["finance", uiState({ activePage: "more", moreSection: "finance" })],
    ["clients", uiState({ activePage: "more", moreSection: "clients" })],
    ["prices", uiState({ activePage: "more", moreSection: "prices" })],
    ["goods", uiState({ activePage: "more", moreSection: "goods" })],
    ["tools", uiState({ activePage: "more", moreSection: "tools" })],
    ["receipts", uiState({ activePage: "more", moreSection: "receipts" })],
    ["drafts", uiState({ activePage: "more", moreSection: "drafts" })],
    ["settings", uiState({ activePage: "more", moreSection: "settings" })],
    ["backup", uiState({ activePage: "more", moreSection: "backup" })],
    ["act", uiState({ activePage: "more", moreSection: "act", selectedActOrderId: "0060" })]
  ];

  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
      serviceWorkers: "block"
    });
    await context.addInitScript(() => {
      const nextState = sessionStorage.getItem("__crm_qa_next_state");
      if (!nextState) return;
      localStorage.setItem("crm-ui-state", nextState);
      sessionStorage.removeItem("__crm_qa_next_state");
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(10000);
    page.on("pageerror", (error) => report.failures.push({ width, type: "pageerror", message: String(error) }));
    page.on("console", (msg) => { if (msg.type() === "error") report.failures.push({ width, type: "console", message: msg.text() }); });
    await writeSeed(page);

    await setState(page, uiState({ activePage: "orders" }));

    if (width === 390) {
      const migratedStock = await readStoredData(page);
      const migratedW1 = migratedStock.warehouse.find((item) => item.id === "w1");
      if (Number(migratedStock.settings?.stockReservationModel) !== 1
        || Number(migratedStock.settings?.stockBatchModel) !== 1
        || Number(migratedStock.settings?.stockLocationModel) !== 2
        || Number(migratedW1?.quantity) !== 3
        || Number(migratedW1?.locationBalances?.find((entry) => entry.locationId === "location-unassigned")?.qty) !== 3
        || migratedStock.orders.find((item) => item.id === "0060")?.materials?.[0]?.locationId !== "location-unassigned"
        || migratedW1?.batches?.length !== 1
        || Number(migratedW1?.batches?.[0]?.remainingQty) !== 3
        || Number(migratedW1?.batches?.[0]?.unitCost) !== 3100) {
        report.failures.push({
          width,
          type: "stock-reservation-migration",
          reservationModel: migratedStock.settings?.stockReservationModel,
          batchModel: migratedStock.settings?.stockBatchModel,
          quantity: migratedW1?.quantity,
          batches: migratedW1?.batches
        });
      }

      await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list", warehouseFilter: "all" }));
      const reservationSurface = await page.evaluate(() => {
        const card = document.querySelector('[data-stock-detail="w1"]')?.closest(".legacy-stock-card-v2");
        return {
          text: card?.textContent || "",
          hasReserveFilter: Boolean(document.querySelector('#warehouse-filter-select option[value="reserved"]'))
        };
      });
      if (!reservationSurface.text.includes("резерв 1")
        || !reservationSurface.text.includes("2")
        || !reservationSurface.hasReserveFilter) {
        report.failures.push({ width, type: "stock-reservation-surface", reservationSurface });
      }

      await setState(page, uiState({ activePage: "orders" }));
      await page.locator('.legacy-order-card [data-order-action="edit"]').first().click();
      await page.locator('#material-lines [data-warehouse-id="w1"] [data-line="qty"]').fill("2");
      await page.locator('.order-editor-modal button[type="submit"]').click();
      await page.waitForTimeout(80);
      const afterReserveEdit = await readStoredData(page);
      const afterReserveW1 = afterReserveEdit.warehouse.find((item) => item.id === "w1");
      const afterReserveOrder = afterReserveEdit.orders.find((item) => item.id === "0060");
      if (Number(afterReserveW1?.quantity) !== 3
        || Number(afterReserveOrder?.materials?.find((item) => item.warehouseId === "w1")?.qty) !== 2) {
        report.failures.push({
          width,
          type: "stock-active-order-reserves-without-writeoff",
          quantity: afterReserveW1?.quantity,
          orderQty: afterReserveOrder?.materials?.find((item) => item.warehouseId === "w1")?.qty
        });
      }

      await page.locator('.legacy-order-card [data-order-action="toggle"]').first().click();
      await page.locator("[data-confirm-primary]").click();
      await page.waitForTimeout(80);
      const afterClose = await readStoredData(page);
      const closedW1 = afterClose.warehouse.find((item) => item.id === "w1");
      const closedOrder = afterClose.orders.find((item) => item.id === "0060");
      const closeMovement = [...afterClose.warehouse_movements].reverse().find((item) => item.orderId === "0060" && item.type === "order_out");
      if (Number(closedW1?.quantity) !== 1
        || Number(closedW1?.locationBalances?.find((entry) => entry.locationId === "location-unassigned")?.qty) !== 1
        || closedOrder?.status !== "Закрыта"
        || closeMovement?.locationId !== "location-unassigned"
        || Number(closeMovement?.qty) !== 2) {
        report.failures.push({
          width,
          type: "stock-close-final-writeoff",
          quantity: closedW1?.quantity,
          status: closedOrder?.status,
          movement: closeMovement
        });
      }

      await page.locator('.legacy-order-card [data-order-action="toggle"]').first().click();
      await page.waitForTimeout(80);
      const afterReopen = await readStoredData(page);
      const reopenedW1 = afterReopen.warehouse.find((item) => item.id === "w1");
      const reopenedOrder = afterReopen.orders.find((item) => item.id === "0060");
      if (Number(reopenedW1?.quantity) !== 3
        || Number(reopenedW1?.locationBalances?.find((entry) => entry.locationId === "location-unassigned")?.qty) !== 3
        || reopenedOrder?.status !== "В работе") {
        report.failures.push({
          width,
          type: "stock-reopen-restores-to-reserve",
          quantity: reopenedW1?.quantity,
          status: reopenedOrder?.status
        });
      }

      await writeSeed(page);
      await setState(page, uiState({ activePage: "orders" }));

      await page.locator('[data-action="new-order"]').first().click();
      await page.waitForTimeout(60);
      const sourceVisitFields = await page.evaluate(() => {
        const grid = document.querySelector(".order-editor-modal .form-grid");
        const source = document.querySelector('.order-editor-modal [name="sourceId"]')?.closest(".form-group");
        const status = document.querySelector('.order-editor-modal [name="status"]')?.closest(".form-group");
        const client = document.querySelector('.order-editor-modal [name="name"]')?.closest(".form-group");
        const phone = document.querySelector('.order-editor-modal [name="phone"]')?.closest(".form-group");
        const gridRect = grid?.getBoundingClientRect();
        const sourceRect = source?.getBoundingClientRect();
        const statusRect = status?.getBoundingClientRect();
        const clientRect = client?.getBoundingClientRect();
        const phoneRect = phone?.getBoundingClientRect();
        return {
          sourceOptions: document.querySelectorAll('.order-editor-modal [name="sourceId"] option').length,
          hasVisitDate: Boolean(document.querySelector('.order-editor-modal [name="nextVisitDate"]')),
          hasVisitTime: Boolean(document.querySelector('.order-editor-modal [name="nextVisitTime"]')),
          hasVisitDuration: Boolean(document.querySelector('.order-editor-modal [name="nextVisitDuration"]')),
          gridWidth: Math.round(gridRect?.width || 0),
          sourceWidth: Math.round(sourceRect?.width || 0),
          statusWidth: Math.round(statusRect?.width || 0),
          clientWidth: Math.round(clientRect?.width || 0),
          phoneWidth: Math.round(phoneRect?.width || 0)
        };
      });
      if (sourceVisitFields.sourceOptions < 3
        || !sourceVisitFields.hasVisitDate
        || !sourceVisitFields.hasVisitTime
        || !sourceVisitFields.hasVisitDuration
        || sourceVisitFields.sourceWidth < sourceVisitFields.gridWidth * 0.92
        || sourceVisitFields.statusWidth < sourceVisitFields.gridWidth * 0.92
        || sourceVisitFields.clientWidth < sourceVisitFields.gridWidth * 0.92
        || sourceVisitFields.phoneWidth < sourceVisitFields.gridWidth * 0.92) {
        report.failures.push({ width, type: "order-source-visit-fields", sourceVisitFields });
      }

      await page.locator('.order-editor-modal [name="phone"]').fill("+79991234567");
      await page.locator('.order-editor-modal [name="phone"]').blur();
      await page.waitForTimeout(40);
      const recalledClient = await page.evaluate(() => ({
        name: document.querySelector('.order-editor-modal [name="name"]')?.value || "",
        address: document.querySelector('.order-editor-modal [name="address"]')?.value || "",
        hint: document.querySelector(".client-match-card")?.innerText || ""
      }));
      if (recalledClient.name !== "Анна Смирнова"
        || !recalledClient.address.includes("Испытателей")
        || !recalledClient.hint.includes("Клиент найден")) {
        report.failures.push({ width, type: "client-phone-recall", recalledClient });
      }

      await page.locator('.order-editor-modal [name="sourceId"]').selectOption("source-avito");
      await page.locator('.order-editor-modal [name="nextVisitDate"]').fill("2030-01-02");
      await page.locator('.order-editor-modal [name="nextVisitTime"]').fill("14:30");
      await page.locator('.order-editor-modal [name="nextVisitDuration"]').selectOption("90");
      await page.locator('.order-editor-modal button[type="submit"]').click();
      await page.waitForTimeout(80);

      const savedSourceVisit = await readStoredData(page);
      const created = [...savedSourceVisit.orders].reverse().find((item) => item.phone === "+79991234567" && item.nextVisitDate === "2030-01-02");
      const profile = savedSourceVisit.client_profiles?.find((item) => item.phone === "+79991234567");
      if (!created
        || created.sourceId !== "source-avito"
        || created.nextVisitTime !== "14:30"
        || Number(created.nextVisitDuration) !== 90
        || !profile
        || !String(profile.lastAddress || "").includes("Испытателей")) {
        report.failures.push({
          width,
          type: "order-source-visit-persist",
          created: created ? {
            sourceId: created.sourceId,
            nextVisitDate: created.nextVisitDate,
            nextVisitTime: created.nextVisitTime,
            nextVisitDuration: created.nextVisitDuration
          } : null,
          profile
        });
      }

      const nearestVisitState = await page.evaluate(() => ({
        rows: document.querySelectorAll(".legacy-nearest-visits-list .legacy-nearest-line").length,
        text: document.querySelector(".legacy-nearest-visit")?.innerText || ""
      }));
      if (nearestVisitState.rows < 1 || !nearestVisitState.text.includes("02.01.2030")) {
        report.failures.push({ width, type: "nearest-visits-three-slot", nearestVisitState });
      }

      await writeSeed(page);
      await setState(page, uiState({ activePage: "more", moreSection: "settings" }));
      await page.locator('[data-action="manage-order-sources"]').click();
      await page.waitForTimeout(40);
      const sourceManagerInitial = await page.evaluate(() => ({
        modal: document.querySelectorAll(".source-manager-modal").length,
        rows: document.querySelectorAll(".source-manager-row").length,
        locked: document.body.classList.contains("modal-open")
      }));
      if (sourceManagerInitial.modal !== 1 || sourceManagerInitial.rows < 2 || !sourceManagerInitial.locked) {
        report.failures.push({ width, type: "source-manager-open", sourceManagerInitial });
      }
      await page.locator("#new-source-name").fill("Сайт");
      await page.locator("#add-order-source").click();
      await page.waitForTimeout(40);
      const sourceManagerAdded = await page.evaluate(() => ({
        rows: document.querySelectorAll(".source-manager-row").length,
        names: [...document.querySelectorAll("[data-source-name]")].map((input) => input.value)
      }));
      if (sourceManagerAdded.rows < 3 || !sourceManagerAdded.names.includes("Сайт")) {
        report.failures.push({ width, type: "source-manager-add", sourceManagerAdded });
      }
      report.results.push(await shot(page, width, "source-manager", false));
      await page.locator(".source-manager-head [data-close-modal]").click();
      await page.waitForTimeout(30);
      const sourceManagerClosed = await page.evaluate(() => ({
        modal: document.querySelectorAll(".source-manager-modal").length,
        locked: document.body.classList.contains("modal-open")
      }));
      if (sourceManagerClosed.modal !== 0 || sourceManagerClosed.locked) {
        report.failures.push({ width, type: "source-manager-close", sourceManagerClosed });
      }

      const migratedDirectories = await readStoredData(page);
      if (!Array.isArray(migratedDirectories.appliance_types)
        || migratedDirectories.appliance_types.length < 10
        || !Array.isArray(migratedDirectories.price_categories)
        || migratedDirectories.price_categories.length < 3
        || !Array.isArray(migratedDirectories.stock_categories)
        || migratedDirectories.stock_categories.length < 4) {
        report.failures.push({
          width,
          type: "price-directory-migration",
          applianceTypes: migratedDirectories.appliance_types?.length,
          priceCategories: migratedDirectories.price_categories?.length,
          stockCategories: migratedDirectories.stock_categories?.length
        });
      }

      await page.locator('[data-action="manage-appliance-types"]').click();
      await page.waitForTimeout(30);
      const directoryAddLayout = await page.evaluate(() => {
        const wrap = document.querySelector(".appliance-types-modal .source-manager-add");
        const input = document.querySelector("#new-appliance-type-name");
        const button = document.querySelector("#add-appliance-type");
        const wr = wrap?.getBoundingClientRect();
        const ir = input?.getBoundingClientRect();
        const br = button?.getBoundingClientRect();
        return {
          wrapWidth: Math.round(wr?.width || 0),
          inputWidth: Math.round(ir?.width || 0),
          buttonWidth: Math.round(br?.width || 0),
          inputTop: Math.round(ir?.top || 0),
          buttonTop: Math.round(br?.top || 0),
          inputBottom: Math.round(ir?.bottom || 0)
        };
      });
      if (directoryAddLayout.inputWidth < directoryAddLayout.wrapWidth - 30
        || directoryAddLayout.buttonWidth < directoryAddLayout.wrapWidth - 30
        || directoryAddLayout.buttonTop < directoryAddLayout.inputBottom) {
        report.failures.push({ width, type: "directory-add-full-width", directoryAddLayout });
      }
      await page.locator("#new-appliance-type-name").fill("Кофемашина");
      await page.locator("#add-appliance-type").click();
      await page.waitForTimeout(30);
      const addedTypeInput = page.locator("[data-appliance-type-name]").last();
      await addedTypeInput.fill("Кофемашина автомат");
      await addedTypeInput.press("Tab");
      await page.waitForTimeout(40);
      await page.locator("[data-appliance-type-id]").last().locator("[data-appliance-type-archive]").click();
      await page.waitForTimeout(40);
      const applianceDirectoryState = await readStoredData(page);
      const coffeeType = applianceDirectoryState.appliance_types.find((item) => item.name === "Кофемашина автомат");
      if (!coffeeType?.archived) report.failures.push({ width, type: "appliance-directory-edit-archive", coffeeType });
      report.results.push(await shot(page, width, "appliance-type-manager", false));
      await page.locator(".appliance-types-modal [data-close-modal]").click();
      await page.waitForTimeout(20);

      await page.locator('[data-action="manage-price-categories"]').click();
      await page.waitForTimeout(30);
      await page.locator("#price-category-tech").selectOption({ label: "Холодильник" });
      await page.waitForTimeout(20);
      const diagnosticCategory = page.locator("[data-price-category-id]").filter({
        has: page.locator('[data-price-category-name][value="Диагностика"]')
      }).first();
      if (await diagnosticCategory.count() !== 1) {
        report.failures.push({ width, type: "price-category-migration-visible" });
      } else {
        await diagnosticCategory.locator("[data-price-category-archive]").click();
        await page.waitForTimeout(40);
        let categoryArchiveData = await readStoredData(page);
        const diagnosisPrice = categoryArchiveData.receipt_prices.find((item) => item.id === "p1");
        if (!diagnosisPrice?.archived || !diagnosisPrice?.archivedByCategory) {
          report.failures.push({ width, type: "price-category-archive-cascade", diagnosisPrice });
        }
        await diagnosticCategory.locator("[data-price-category-archive]").click();
        await page.waitForTimeout(40);
        categoryArchiveData = await readStoredData(page);
        const restoredDiagnosisPrice = categoryArchiveData.receipt_prices.find((item) => item.id === "p1");
        if (restoredDiagnosisPrice?.archived || restoredDiagnosisPrice?.archivedByCategory) {
          report.failures.push({ width, type: "price-category-restore-cascade", restoredDiagnosisPrice });
        }
      }
      await page.locator("#new-price-category-name").fill("Электрика");
      await page.locator("#add-price-category").click();
      await page.waitForTimeout(30);
      const categoryNames = await page.locator("[data-price-category-name]").evaluateAll((nodes) => nodes.map((node) => node.value));
      if (!categoryNames.includes("Электрика")) report.failures.push({ width, type: "price-category-add", categoryNames });
      report.results.push(await shot(page, width, "price-category-manager", false));
      await page.locator(".price-categories-modal [data-close-modal]").click();
      await page.waitForTimeout(20);

      await page.locator('[data-action="manage-stock-categories"]').click();
      await page.waitForTimeout(30);
      await page.locator("#stock-category-tech").selectOption({ label: "Холодильник" });
      await page.waitForTimeout(20);
      const stockCategoryNamesInitial = await page.locator("[data-stock-category-name]").evaluateAll((nodes) => nodes.map((node) => node.value));
      if (!stockCategoryNamesInitial.includes("Запчасти") || !stockCategoryNamesInitial.includes("Расходники")) {
        report.failures.push({ width, type: "stock-category-migration-visible", stockCategoryNamesInitial });
      }
      await page.locator("#new-stock-category-name").fill("Компрессоры");
      await page.locator("#add-stock-category").click();
      await page.waitForTimeout(30);
      const addedStockCategory = page.locator('[data-stock-category-id]:has([data-stock-category-name][value="Компрессоры"])').first();
      if (await addedStockCategory.count() !== 1) {
        report.failures.push({ width, type: "stock-category-add" });
      } else {
        const addedStockCategoryId = await addedStockCategory.getAttribute("data-stock-category-id");
        const stableAddedStockCategory = page.locator(`[data-stock-category-id="${addedStockCategoryId}"]`);
        const addedInput = stableAddedStockCategory.locator("[data-stock-category-name]");
        await addedInput.fill("Компрессорные узлы");
        await addedInput.press("Tab");
        await page.waitForTimeout(30);
        await stableAddedStockCategory.locator("[data-stock-category-archive]").click();
        await page.waitForTimeout(30);
        const stockDirectoryData = await readStoredData(page);
        const addedCategory = stockDirectoryData.stock_categories.find((entry) => entry.name === "Компрессорные узлы");
        if (!addedCategory?.archived) report.failures.push({ width, type: "stock-category-edit-archive", addedCategory });
      }
      const partsCategory = page.locator('[data-stock-category-id]:has([data-stock-category-name][value="Запчасти"])').first();
      if (await partsCategory.count() === 1) {
        const partsInput = partsCategory.locator("[data-stock-category-name]");
        await partsInput.fill("Комплектующие");
        await partsInput.press("Tab");
        await page.waitForTimeout(30);
        const renamedStockData = await readStoredData(page);
        const w1AfterCategoryRename = renamedStockData.warehouse.find((item) => item.id === "w1");
        if (w1AfterCategoryRename?.category !== "Комплектующие") {
          report.failures.push({ width, type: "stock-category-rename-cascade", category: w1AfterCategoryRename?.category });
        }
      }
      report.results.push(await shot(page, width, "stock-category-manager", false));
      await page.locator(".stock-categories-modal [data-close-modal]").click();
      await page.waitForTimeout(20);

      const techCatalogSeed = structuredClone(seed);
      techCatalogSeed.receipt_prices.push({ id: "p-tech-washer", name: "Тестовая услуга стиральной машины", category: "Ремонт", tech: "Стиральная машина", kind: "service", price: 2400 });
      await writeSeed(page, techCatalogSeed);
      await setState(page, uiState({ activePage: "orders" }));
      await page.locator('.legacy-order-card [data-order-action="edit"]').first().click();
      await page.locator("#open-service-catalog").click();
      await page.waitForTimeout(30);
      const fridgeCatalogText = await page.locator("#catalog-service-list").innerText();
      if (fridgeCatalogText.includes("Тестовая услуга стиральной машины")) {
        report.failures.push({ width, type: "service-catalog-tech-filter-fridge", fridgeCatalogText });
      }
      await page.locator(".catalog-close").click();
      await page.locator('.order-editor-modal [name="tech"]').selectOption({ label: "Стиральная машина" });
      await page.locator("#open-service-catalog").click();
      await page.waitForTimeout(30);
      const washerCatalogText = await page.locator("#catalog-service-list").innerText();
      if (!washerCatalogText.includes("Тестовая услуга стиральной машины") || washerCatalogText.includes("Замена вентилятора")) {
        report.failures.push({ width, type: "service-catalog-tech-filter-washer", washerCatalogText });
      }
      await page.locator(".catalog-close").click();
      await page.locator(".order-editor-close").click();
      await page.waitForTimeout(20);

      await writeSeed(page);
      await setState(page, uiState({ activePage: "more", moreSection: "settings" }));
      await page.locator('[data-action="manage-warranty-options"]').click();
      await page.waitForTimeout(30);
      await page.locator("#new-warranty-name").fill("Компрессор");
      await page.locator("#add-warranty-option").click();
      await page.locator("#new-warranty-name").fill("Плата управления");
      await page.locator("#add-warranty-option").click();
      await page.waitForTimeout(30);
      const warrantyManagerState = await page.evaluate(() => ({
        modal: document.querySelectorAll(".warranty-manager-modal").length,
        rows: document.querySelectorAll(".warranty-manager-row").length,
        names: [...document.querySelectorAll("[data-warranty-option-name]")].map((input) => input.value),
        locked: document.body.classList.contains("modal-open")
      }));
      if (warrantyManagerState.modal !== 1
        || warrantyManagerState.rows !== 2
        || !warrantyManagerState.names.includes("Компрессор")
        || !warrantyManagerState.names.includes("Плата управления")
        || !warrantyManagerState.locked) {
        report.failures.push({ width, type: "warranty-manager-add", warrantyManagerState });
      }
      report.results.push(await shot(page, width, "warranty-manager", false));
      await page.locator(".warranty-manager-head [data-close-modal]").click();
      await page.waitForTimeout(20);

      await page.locator('[data-action="manage-warranty-results"]').click();
      await page.waitForTimeout(30);
      const warrantyResultsInitial = await page.evaluate(() => ({
        modal: document.querySelectorAll(".warranty-result-manager-modal").length,
        rows: document.querySelectorAll("[data-warranty-result-id]").length,
        names: [...document.querySelectorAll("[data-warranty-result-name]")].map((input) => input.value)
      }));
      if (warrantyResultsInitial.modal !== 1
        || warrantyResultsInitial.rows !== 3
        || !warrantyResultsInitial.names.includes("Гарантия подтверждена")
        || !warrantyResultsInitial.names.includes("Гарантия не подтверждена")
        || !warrantyResultsInitial.names.includes("Неисправность не выявлена")) {
        report.failures.push({ width, type: "warranty-result-manager-defaults", warrantyResultsInitial });
      }
      await page.locator("#new-warranty-result-name").fill("Повторный платный ремонт");
      await page.locator("#add-warranty-result").click();
      await page.waitForTimeout(30);
      const warrantyResultsAdded = await page.evaluate(() => ({
        rows: document.querySelectorAll("[data-warranty-result-id]").length,
        names: [...document.querySelectorAll("[data-warranty-result-name]")].map((input) => input.value)
      }));
      if (warrantyResultsAdded.rows !== 4 || !warrantyResultsAdded.names.includes("Повторный платный ремонт")) {
        report.failures.push({ width, type: "warranty-result-manager-add", warrantyResultsAdded });
      }
      report.results.push(await shot(page, width, "warranty-result-manager", false));
      await page.locator(".warranty-result-manager-modal [data-close-modal]").click();
      await page.waitForTimeout(20);

      await setState(page, uiState({ activePage: "orders" }));
      await page.locator('.legacy-order-card [data-order-action="edit"]').first().click();
      await page.waitForTimeout(30);
      const warrantyEditorInitial = await page.evaluate(() => {
        const grid = document.querySelector("#warranty-target-grid");
        const style = grid ? getComputedStyle(grid) : null;
        return {
          options: document.querySelectorAll("[data-warranty-target]").length,
          names: [...document.querySelectorAll("[data-warranty-target]")].map((input) => input.dataset.name),
          columns: style?.gridTemplateColumns || "",
          empty: document.querySelector(".warranty-target-empty")?.innerText || ""
        };
      });
      if (warrantyEditorInitial.options !== 2
        || !warrantyEditorInitial.names.includes("Компрессор")
        || !warrantyEditorInitial.names.includes("Плата управления")
        || warrantyEditorInitial.columns.split(" ").filter(Boolean).length !== 2) {
        report.failures.push({ width, type: "warranty-editor-grid", warrantyEditorInitial });
      }

      await page.locator('.order-editor-modal [name="tech"]').selectOption({ label: "Стиральная машина" });
      await page.waitForTimeout(20);
      const washerWarranty = await page.evaluate(() => ({
        options: document.querySelectorAll("[data-warranty-target]").length,
        empty: document.querySelector(".warranty-target-empty")?.innerText || ""
      }));
      if (washerWarranty.options !== 0 || !washerWarranty.empty.includes("не настроены")) {
        report.failures.push({ width, type: "warranty-by-appliance", washerWarranty });
      }

      await page.locator('.order-editor-modal [name="tech"]').selectOption({ label: "Холодильник" });
      await page.locator('.order-editor-modal [name="guarantee"]').selectOption("0");
      const noWarrantyDisplay = await page.evaluate(() => getComputedStyle(document.querySelector("#warranty-target-wrap")).display);
      if (noWarrantyDisplay !== "none") {
        report.failures.push({ width, type: "warranty-none-hides-targets", noWarrantyDisplay });
      }
      await page.locator('.order-editor-modal [name="guarantee"]').selectOption("6");
      await page.locator('.warranty-target-option:has([data-warranty-target][data-name="Компрессор"])').click();
      await page.locator('.order-editor-modal [name="guaranteeNote"]').fill("Герметичность контура");
      report.results.push(await shot(page, width, "order-editor-warranty", false));
      await page.locator('.order-editor-modal button[type="submit"]').click();
      await page.waitForTimeout(60);
      const savedWarrantyData = await readStoredData(page);
      const warrantyOrder = savedWarrantyData.orders.find((item) => item.id === "0060");
      if (Number(warrantyOrder?.guarantee) !== 6
        || warrantyOrder?.guaranteeTargets?.length !== 1
        || warrantyOrder?.guaranteeTargets?.[0]?.name !== "Компрессор"
        || warrantyOrder?.guaranteeNote !== "Герметичность контура") {
        report.failures.push({
          width,
          type: "warranty-order-persist",
          guarantee: warrantyOrder?.guarantee,
          targets: warrantyOrder?.guaranteeTargets,
          note: warrantyOrder?.guaranteeNote
        });
      }

      await writeSeed(page);
      await setState(page, uiState({
        activePage: "more",
        moreSection: "calendar",
        calendarMonthOffset: 0,
        calendarSelectedDate: "2026-09-27"
      }));
      await page.waitForTimeout(50);
      const calendarState = await page.evaluate(() => {
        const grid = document.querySelector(".calendar-grid");
        const dayButtons = [...document.querySelectorAll(".calendar-day")];
        const selected = document.querySelector('.calendar-day[data-calendar-date="2026-09-27"]');
        const event = document.querySelector('.calendar-event[data-calendar-order="0060"]');
        const timelineRows = document.querySelectorAll(".calendar-hour-row");
        const root = document.documentElement;
        return {
          dayButtons: dayButtons.length,
          weekdayLabels: document.querySelectorAll(".calendar-weekdays span").length,
          selectedText: selected?.innerText || "",
          eventText: event?.innerText || "",
          timelineRows: timelineRows.length,
          overflow: Math.max(root.scrollWidth, document.body.scrollWidth) - window.innerWidth,
          gridWidth: Math.round(grid?.getBoundingClientRect().width || 0),
          eventNameStyle: (() => {
            const node = event?.querySelector("span");
            const style = node ? getComputedStyle(node) : null;
            return {
              whiteSpace: style?.whiteSpace || "missing",
              textOverflow: style?.textOverflow || "missing",
              lineClamp: style?.webkitLineClamp || "missing"
            };
          })()
        };
      });
      if (calendarState.dayButtons < 28
        || calendarState.weekdayLabels !== 7
        || !calendarState.selectedText.includes("27")
        || !calendarState.eventText.includes("11:30")
        || !calendarState.eventText.includes("Анна Смирнова")
        || calendarState.timelineRows !== 13
        || calendarState.overflow > 0
        || calendarState.eventNameStyle.whiteSpace === "nowrap"
        || calendarState.eventNameStyle.textOverflow === "ellipsis"
        || calendarState.eventNameStyle.lineClamp !== "2") {
        report.failures.push({ width, type: "calendar-month-day-timeline", calendarState });
      }
      const calendarDensity = await page.evaluate(() => {
        const pageNode = document.querySelector(".legacy-calendar-page");
        const month = document.querySelector(".calendar-month-card");
        const dayCard = document.querySelector(".calendar-day-card");
        const dayHead = document.querySelector(".calendar-day-head");
        const firstHour = document.querySelector(".calendar-hour-row");
        const event = document.querySelector('.calendar-event[data-calendar-order="0060"]');
        const px = (value) => Number.parseFloat(value || "0") || 0;
        const pageStyle = pageNode ? getComputedStyle(pageNode) : null;
        const monthStyle = month ? getComputedStyle(month) : null;
        const dayStyle = dayCard ? getComputedStyle(dayCard) : null;
        const headStyle = dayHead ? getComputedStyle(dayHead) : null;
        return {
          pagePaddingTop: pageStyle ? px(pageStyle.paddingTop) : 999,
          monthMarginBottom: monthStyle ? px(monthStyle.marginBottom) : 999,
          monthPaddingTop: monthStyle ? px(monthStyle.paddingTop) : 999,
          dayPaddingTop: dayStyle ? px(dayStyle.paddingTop) : 999,
          dayHeadMarginBottom: headStyle ? px(headStyle.marginBottom) : 999,
          firstHourHeight: Math.round(firstHour?.getBoundingClientRect().height || 0),
          eventHeight: Math.round(event?.getBoundingClientRect().height || 0)
        };
      });
      if (calendarDensity.pagePaddingTop > 10
        || calendarDensity.monthMarginBottom > 9
        || calendarDensity.monthPaddingTop > 10
        || calendarDensity.dayPaddingTop > 10
        || calendarDensity.dayHeadMarginBottom > 8
        || calendarDensity.firstHourHeight > 50
        || calendarDensity.eventHeight < 44
        || calendarDensity.eventHeight > 60) {
        report.failures.push({ width, type: "calendar-compact-density", calendarDensity });
      }
      report.results.push(await shot(page, width, "calendar-selected-day", false));

      await page.locator('.calendar-event[data-calendar-order="0060"]').click();
      await page.waitForTimeout(30);
      const calendarOpenedOrder = await page.evaluate(() => ({
        detail: document.querySelectorAll(".order-detail-modal").length,
        text: document.querySelector(".order-detail-modal")?.innerText || ""
      }));
      if (calendarOpenedOrder.detail !== 1 || !calendarOpenedOrder.text.includes("0060")) {
        report.failures.push({ width, type: "calendar-open-order", calendarOpenedOrder });
      }
      await page.locator(".order-detail-modal [data-close-modal]").click();
      await page.waitForTimeout(20);

      await writeSeed(page);
      await setState(page, uiState({ activePage: "orders" }));
    }

    const shellSurface = await page.evaluate(() => {
      const header = document.querySelector(".legacy-mobile-header");
      const title = document.querySelector(".legacy-mobile-header .brand-title");
      const nav = document.querySelector(".bottom-nav");
      const buttons = [...document.querySelectorAll(".nav-button")];
      const active = document.querySelector('.nav-button[data-nav="orders"]');
      const activeIcon = active?.querySelector(".nav-icon");
      const logo = document.querySelector(".legacy-mobile-header .logo");
      const labelTops = buttons.map((button) => Math.round(button.querySelector(":scope > span:last-child")?.getBoundingClientRect().top || 0));
      const hr = header?.getBoundingClientRect();
      const ir = activeIcon?.getBoundingClientRect();
      const lr = logo?.getBoundingClientRect();
      return {
        headerHeight: hr ? Math.round(hr.height) : 0,
        logoDisplay: logo ? getComputedStyle(logo).display : "missing",
        logoWidth: lr ? Math.round(lr.width) : 0,
        logoHeight: lr ? Math.round(lr.height) : 0,
        headerBorder: header ? getComputedStyle(header).borderBottomWidth : "missing",
        headerBackground: header ? getComputedStyle(header).backgroundColor : "missing",
        titleFont: title ? getComputedStyle(title).fontSize : "missing",
        navBackground: nav ? getComputedStyle(nav).backgroundColor : "missing",
        navBorder: nav ? getComputedStyle(nav).borderTopColor : "missing",
        activeColor: active ? getComputedStyle(active).color : "missing",
        activeIconBackground: activeIcon ? getComputedStyle(activeIcon).backgroundColor : "missing",
        activeIconWidth: ir ? Math.round(ir.width) : 0,
        activeIconHeight: ir ? Math.round(ir.height) : 0,
        labelSpread: labelTops.length ? Math.max(...labelTops) - Math.min(...labelTops) : 999
      };
    });
    if (shellSurface.headerHeight < 64
      || shellSurface.headerHeight > 86
      || shellSurface.headerBorder !== "0px"
      || !shellSurface.headerBackground.startsWith("rgba(4, 8, 11, ")
      || parseFloat(shellSurface.titleFont) < 17
      || shellSurface.logoDisplay === "none"
      || shellSurface.logoWidth < 40
      || shellSurface.logoHeight < 40
      || !shellSurface.navBackground.startsWith("rgba(3, 7, 10, ")
      || shellSurface.navBorder !== "rgb(21, 31, 37)"
      || shellSurface.activeColor !== "rgb(255, 118, 92)"
      || shellSurface.activeIconBackground !== "rgba(0, 0, 0, 0)"
      || shellSurface.activeIconWidth < 30
      || shellSurface.activeIconHeight < 30
      || shellSurface.labelSpread > 1) {
      report.failures.push({ width, type: "shell-header-nav", shellSurface });
    }

    await setState(page, uiState({ activePage: "more", moreSection: "menu" }));
    const moreNavSurface = await page.evaluate(() => {
      const active = document.querySelector('.nav-button[data-nav="more"]');
      const icon = active?.querySelector(".nav-icon");
      return {
        color: active ? getComputedStyle(active).color : "missing",
        iconBackground: icon ? getComputedStyle(icon).backgroundColor : "missing"
      };
    });
    if (moreNavSurface.color !== "rgb(255, 118, 92)"
      || moreNavSurface.iconBackground !== "rgba(0, 0, 0, 0)") {
      report.failures.push({ width, type: "shell-more-nav-state", moreNavSurface });
    }

    for (const [label, state] of screens) {
      console.log(`QA ${width}px · ${label}`);
      await setState(page, state);
      const result = await shot(page, width, label, true);
      report.results.push(result);
      if (result.overflow > 2) report.failures.push({ width, type: "horizontal-overflow", label, overflow: result.overflow });
    }

    await setState(page, uiState({ activePage: "more", moreSection: "backup" }));
    const backupStatsLayout = await page.evaluate(() => {
      const cards = [...document.querySelectorAll(".legacy-service-stats.backup > div")];
      const rects = cards.map((card) => card.getBoundingClientRect());
      return {
        count: rects.length,
        widths: rects.map((rect) => Math.round(rect.width)),
        tops: rects.map((rect) => Math.round(rect.top)),
        heights: rects.map((rect) => Math.round(rect.height))
      };
    });
    if (backupStatsLayout.count !== 3
      || Math.max(...backupStatsLayout.widths) - Math.min(...backupStatsLayout.widths) > 2
      || Math.max(...backupStatsLayout.tops) - Math.min(...backupStatsLayout.tops) > 2
      || backupStatsLayout.widths.some((value) => value < 80)
      || backupStatsLayout.heights.some((value) => value < 56)) {
      report.failures.push({ width, type: "backup-stats-single-row", backupStatsLayout });
    }

    await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list" }));
    const warehouseShortcutLayout = await page.evaluate(() => {
      const container = document.querySelector(".legacy-warehouse-shortcuts");
      const style = container ? getComputedStyle(container) : null;
      const rect = container?.getBoundingClientRect();
      const buttons = [...document.querySelectorAll(".legacy-warehouse-shortcuts > button")].map((button) => {
        const buttonRect = button.getBoundingClientRect();
        const label = button.querySelector("span");
        return {
          width: Math.round(buttonRect.width),
          height: Math.round(buttonRect.height),
          left: Math.round(buttonRect.left),
          top: Math.round(buttonRect.top),
          labelWrap: label ? Math.round(label.getBoundingClientRect().height) > 20 : true
        };
      });
      return {
        width: Math.round(rect?.width || 0),
        innerWidth: rect && style
          ? Math.round(rect.width - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0))
          : 0,
        buttons
      };
    });
    if (warehouseShortcutLayout.buttons.length !== 2
      || warehouseShortcutLayout.buttons.some((button) => button.width < warehouseShortcutLayout.innerWidth - 2)
      || warehouseShortcutLayout.buttons.some((button) => button.height < 48)
      || warehouseShortcutLayout.buttons.some((button) => button.labelWrap)
      || warehouseShortcutLayout.buttons[1]?.top <= warehouseShortcutLayout.buttons[0]?.top) {
      report.failures.push({ width, type: "warehouse-shortcuts-full-width", warehouseShortcutLayout });
    }

    const warehouseDensity = await page.evaluate(() => {
      const groupHead = document.querySelector(".legacy-warehouse-group > summary");
      const main = document.querySelector(".legacy-stock-main");
      const action = document.querySelector(".legacy-stock-actions-v2 > button");
      return {
        groupHeadHeight: Math.round(groupHead?.getBoundingClientRect().height || 0),
        mainHeight: Math.round(main?.getBoundingClientRect().height || 0),
        actionHeight: Math.round(action?.getBoundingClientRect().height || 0)
      };
    });
    const warehouseMainMax = width <= 340 ? 88 : 78;
    if (warehouseDensity.groupHeadHeight > 56
      || warehouseDensity.mainHeight > warehouseMainMax
      || warehouseDensity.actionHeight < 44
      || warehouseDensity.actionHeight > 48) {
      report.failures.push({ width, type: "warehouse-compact-density", warehouseDensity, warehouseMainMax });
    }

    await setState(page, uiState({ activePage: "warehouse", warehouseSection: "shopping" }));
    const shoppingActionLayout = await page.evaluate(() => {
      const container = document.querySelector(".shopping-page-actions-primary");
      const containerRect = container?.getBoundingClientRect();
      const buttons = [...document.querySelectorAll(".shopping-page-actions-primary > button")].map((button) => {
        const rect = button.getBoundingClientRect();
        return {
          width: Math.round(rect.width),
          left: Math.round(rect.left),
          top: Math.round(rect.top)
        };
      });
      return {
        containerWidth: Math.round(containerRect?.width || 0),
        containerLeft: Math.round(containerRect?.left || 0),
        buttons
      };
    });
    if (shoppingActionLayout.buttons.length !== 3
      || shoppingActionLayout.buttons.some((button) => button.width < shoppingActionLayout.containerWidth - 8)
      || shoppingActionLayout.buttons.some((button) => Math.abs(button.left - shoppingActionLayout.containerLeft) > 2)
      || shoppingActionLayout.buttons.some((button, index, buttons) => index > 0 && button.top <= buttons[index - 1].top)) {
      report.failures.push({ width, type: "shopping-actions-full-width", shoppingActionLayout });
    }

    if (width >= 360) {
      await setState(page, uiState({ activePage: "more", moreSection: "finance" }));
      const financeRowLayout = await page.evaluate(() => {
        const row = document.querySelector(".legacy-finance-row");
        const icon = row?.querySelector(".legacy-finance-kind")?.getBoundingClientRect();
        const amount = row?.querySelector(":scope > b")?.getBoundingClientRect();
        const remove = row?.querySelector(":scope > button")?.getBoundingClientRect();
        const rect = row?.getBoundingClientRect();
        return {
          rowHeight: rect ? Math.round(rect.height) : 0,
          iconCenter: icon ? Math.round(icon.top + icon.height / 2) : 0,
          amountCenter: amount ? Math.round(amount.top + amount.height / 2) : 0,
          removeCenter: remove ? Math.round(remove.top + remove.height / 2) : 0,
          removeLeft: remove ? Math.round(remove.left) : 0,
          amountRight: amount ? Math.round(amount.right) : 0
        };
      });
      if (financeRowLayout.rowHeight > 76
        || Math.abs(financeRowLayout.iconCenter - financeRowLayout.removeCenter) > 12
        || Math.abs(financeRowLayout.amountCenter - financeRowLayout.removeCenter) > 12
        || financeRowLayout.removeLeft < financeRowLayout.amountRight) {
        report.failures.push({ width, type: "finance-row-single-line", financeRowLayout });
      }
      const financeDensity = await page.evaluate(() => {
        const hero = document.querySelector(".legacy-finance-summary .finance-result-hero");
        const tile = document.querySelector(".legacy-finance-summary > div:not(.finance-result-hero)");
        const action = document.querySelector(".legacy-finance-actions > button");
        return {
          heroHeight: Math.round(hero?.getBoundingClientRect().height || 0),
          tileHeight: Math.round(tile?.getBoundingClientRect().height || 0),
          actionHeight: Math.round(action?.getBoundingClientRect().height || 0)
        };
      });
      if (financeDensity.heroHeight > 88
        || financeDensity.tileHeight > 70
        || financeDensity.actionHeight < 44) {
        report.failures.push({ width, type: "finance-compact-density", financeDensity });
      }
    }

    await setState(page, uiState({ activePage: "more", moreSection: "goods" }));
    const goodsRowSurface = await page.evaluate(() => {
      const row = document.querySelector(".legacy-goods-position");
      const rect = row?.getBoundingClientRect();
      const price = row?.querySelector(":scope > b")?.getBoundingClientRect();
      return {
        background: row ? getComputedStyle(row).backgroundColor : "missing",
        radius: row ? getComputedStyle(row).borderRadius : "missing",
        height: rect ? Math.round(rect.height) : 0,
        priceRight: price ? Math.round(price.right) : 0,
        rowRight: rect ? Math.round(rect.right) : 0
      };
    });
    if (goodsRowSurface.background !== "rgb(9, 15, 20)"
      || goodsRowSurface.radius !== "11px"
      || goodsRowSurface.height < 48
      || goodsRowSurface.priceRight > goodsRowSurface.rowRight + 1) {
      report.failures.push({ width, type: "goods-position-surface", goodsRowSurface });
    }

    await setState(page, uiState({ activePage: "warehouse", warehouseSection: "shopping" }));
    const shoppingCardLayout = await page.evaluate(() => {
      const card = document.querySelector(".shopping-content .legacy-shopping-card");
      const icon = card?.querySelector(".shopping-item-icon");
      const copy = card?.querySelector(":scope > div:not(.shopping-need)");
      const need = card?.querySelector(".shopping-need");
      const cr = card?.getBoundingClientRect();
      const ir = icon?.getBoundingClientRect();
      const xr = copy?.getBoundingClientRect();
      const nr = need?.getBoundingClientRect();
      return {
        cardHeight: cr ? Math.round(cr.height) : 0,
        iconCenterY: ir ? Math.round(ir.top + ir.height / 2) : 0,
        copyCenterY: xr ? Math.round(xr.top + xr.height / 2) : 0,
        needCenterY: nr ? Math.round(nr.top + nr.height / 2) : 0,
        copyLeft: xr ? Math.round(xr.left) : 0,
        iconRight: ir ? Math.round(ir.right) : 0,
        needLeft: nr ? Math.round(nr.left) : 0,
        copyRight: xr ? Math.round(xr.right) : 0,
        needRight: nr ? Math.round(nr.right) : 0,
        cardRight: cr ? Math.round(cr.right) : 0
      };
    });
    if (shoppingCardLayout.cardHeight > 86
      || Math.abs(shoppingCardLayout.iconCenterY - shoppingCardLayout.needCenterY) > 12
      || Math.abs(shoppingCardLayout.copyCenterY - shoppingCardLayout.needCenterY) > 16
      || shoppingCardLayout.copyLeft <= shoppingCardLayout.iconRight
      || shoppingCardLayout.needLeft < shoppingCardLayout.copyRight - 1
      || shoppingCardLayout.needRight > shoppingCardLayout.cardRight + 1) {
      report.failures.push({ width, type: "shopping-card-single-row", shoppingCardLayout });
    }
    const shoppingCompactMax = width <= 340 ? 82 : 80;
    if (shoppingCardLayout.cardHeight > shoppingCompactMax) {
      report.failures.push({ width, type: "shopping-compact-density", shoppingCardLayout, shoppingCompactMax });
    }

    if (width === 390) {
      const autoQty = page.locator("[data-shopping-auto-qty]").first();
      const minimum = Number(await autoQty.getAttribute("min")) || 0;
      await autoQty.fill(String(minimum + 3));
      await autoQty.evaluate((el) => el.dispatchEvent(new Event("change", { bubbles: true })));
      await page.waitForTimeout(40);
      let shoppingStored = await readStoredData(page);
      const autoOverride = shoppingStored.shopping_overrides?.find((item) => item.warehouseId === "w2");
      if (Number(autoOverride?.qty) !== minimum + 3) {
        report.failures.push({ width, type: "shopping-auto-quantity-override", minimum, autoOverride });
      }

      await page.locator('[data-action="new-shopping-item"]').click();
      await page.locator('.shopping-item-modal [name="name"]').fill("Перчатки");
      await page.locator('.shopping-item-modal [name="qty"]').fill("4");
      await page.locator('.shopping-item-modal button[type="submit"]').click();
      await page.waitForTimeout(60);
      const manualRow = page.locator(".legacy-shopping-card.manual").first();
      const manualQty = manualRow.locator("[data-shopping-manual-qty]");
      const manualState = await page.evaluate(() => {
        const row = document.querySelector(".legacy-shopping-card.manual");
        const remove = row?.querySelector(".shopping-remove");
        const removeRect = remove?.getBoundingClientRect();
        return {
          rows: document.querySelectorAll(".legacy-shopping-card.manual").length,
          text: row?.innerText || "",
          removeWidth: removeRect ? Math.round(removeRect.width) : 0,
          removeHeight: removeRect ? Math.round(removeRect.height) : 0
        };
      });
      if (manualState.rows !== 1 || !manualState.text.includes("Перчатки") || manualState.removeWidth < 44 || manualState.removeHeight < 44) {
        report.failures.push({ width, type: "shopping-manual-item-surface", manualState });
      }
      await manualQty.fill("6");
      await manualQty.evaluate((el) => el.dispatchEvent(new Event("change", { bubbles: true })));
      shoppingStored = await readStoredData(page);
      const manualStored = shoppingStored.shopping_manual?.find((item) => item.name === "Перчатки");
      if (Number(manualStored?.qty) !== 6) {
        report.failures.push({ width, type: "shopping-manual-quantity", manualStored });
      }
      report.results.push(await shot(page, width, "shopping-manual", false));

      await manualRow.locator(".shopping-remove").click();
      await page.locator("[data-confirm-primary]").click();
      await page.waitForTimeout(40);
      shoppingStored = await readStoredData(page);
      if (shoppingStored.shopping_manual?.some((item) => item.name === "Перчатки")) {
        report.failures.push({ width, type: "shopping-manual-delete", items: shoppingStored.shopping_manual });
      }
      await writeSeed(page, seed);
      await setState(page, uiState({ activePage: "warehouse", warehouseSection: "shopping" }));
    }

    if (width === 320 || width === 390) {
      await setState(page, uiState({ activePage: "orders" }));
      await page.locator('[data-action="new-order"]').first().click();
      await page.waitForTimeout(80);
      const orderFieldSurfaces = await page.evaluate(() => ({
        input: getComputedStyle(document.querySelector('.order-editor-modal input[name="name"]')).backgroundColor,
        textarea: getComputedStyle(document.querySelector('.order-editor-modal textarea[name="issue"]')).backgroundColor,
        select: getComputedStyle(document.querySelector('.order-editor-modal select[name="tech"]')).backgroundColor
      }));
      if (orderFieldSurfaces.input !== "rgb(9, 15, 20)"
        || orderFieldSurfaces.textarea !== "rgb(9, 15, 20)"
        || orderFieldSurfaces.select !== "rgb(9, 15, 20)") {
        report.failures.push({ width, type: "order-editor-field-surfaces", orderFieldSurfaces });
      }
      await page.keyboard.press("Escape");
    }

    if (width === 320 || width === 390) {
      await setState(page, uiState({ activePage: "more", moreSection: "act", selectedActOrderId: "0060" }));
      const actScreenSurface = await page.evaluate(() => ({
        control: getComputedStyle(document.querySelector(".legacy-act-control")).backgroundColor,
        field: getComputedStyle(document.querySelector(".legacy-act-control .field")).backgroundColor,
        selected: getComputedStyle(document.querySelector(".legacy-act-selected")).backgroundColor,
        primary: getComputedStyle(document.querySelector(".legacy-act-control-actions .legacy-orange-button")).backgroundColor,
        preview: getComputedStyle(document.querySelector(".legacy-act-preview")).backgroundColor,
        sheet: getComputedStyle(document.querySelector(".legacy-act-preview .act-sheet")).backgroundColor,
        headers: [...document.querySelectorAll(".act-work-table th")].map((node) => node.textContent.trim()),
        contract: document.querySelector(".act-contract-line")?.textContent || "",
        saveButton: document.querySelector('[data-action="save-act-image"]')?.textContent || ""
      }));
      if (actScreenSurface.control !== "rgb(7, 12, 16)"
        || actScreenSurface.field !== "rgb(9, 15, 20)"
        || actScreenSurface.selected !== "rgb(13, 20, 25)"
        || actScreenSurface.primary !== "rgb(255, 113, 79)"
        || actScreenSurface.preview !== "rgb(5, 9, 12)"
        || actScreenSurface.sheet !== "rgb(255, 255, 255)"
        || actScreenSurface.headers.length !== 5
        || actScreenSurface.headers.includes("Гарантия")
        || !actScreenSurface.contract.includes("№0060")
        || !actScreenSurface.saveButton.includes("Сохранить картинку")) {
        report.failures.push({ width, type: "act-semantic-hierarchy", actScreenSurface });
      }
      const actDensity = await page.evaluate(() => {
        const control = document.querySelector(".legacy-act-control")?.getBoundingClientRect();
        const title = document.querySelector(".legacy-act-control-title")?.getBoundingClientRect();
        const field = document.querySelector(".legacy-act-control .field")?.getBoundingClientRect();
        const selected = document.querySelector(".legacy-act-selected")?.getBoundingClientRect();
        const action = document.querySelector(".legacy-act-control-actions button")?.getBoundingClientRect();
        return {
          controlHeight: Math.round(control?.height || 0),
          titleHeight: Math.round(title?.height || 0),
          fieldHeight: Math.round(field?.height || 0),
          selectedHeight: Math.round(selected?.height || 0),
          actionHeight: Math.round(action?.height || 0)
        };
      });
      if (!actDensity.controlHeight
        || actDensity.controlHeight > 216
        || actDensity.titleHeight > 38
        || actDensity.fieldHeight < 44
        || actDensity.selectedHeight > 58
        || actDensity.actionHeight < 44) {
        report.failures.push({ width, type: "act-compact-density", actDensity });
      }
      const actPreviewState = await page.evaluate(() => {
        const preview = document.querySelector(".legacy-act-preview");
        const sheet = document.querySelector(".legacy-act-preview .act-sheet");
        const table = document.querySelector(".legacy-act-preview .act-work-table");
        const title = document.querySelector(".legacy-act-preview .act-sheet h2");
        const pr = preview?.getBoundingClientRect();
        const sr = sheet?.getBoundingClientRect();
        const tr = table?.getBoundingClientRect();
        return {
          previewWidth: pr ? Math.round(pr.width) : 0,
          sheetWidth: sr ? Math.round(sr.width) : 0,
          sheetLeft: sr ? Math.round(sr.left) : 0,
          sheetRight: sr ? Math.round(sr.right) : 0,
          previewLeft: pr ? Math.round(pr.left) : 0,
          previewRight: pr ? Math.round(pr.right) : 0,
          tableRight: tr ? Math.round(tr.right) : 0,
          titleOverflow: title ? title.scrollWidth - title.clientWidth : 999
        };
      });
      if (actPreviewState.sheetWidth > actPreviewState.previewWidth + 1
        || actPreviewState.sheetLeft < actPreviewState.previewLeft - 1
        || actPreviewState.sheetRight > actPreviewState.previewRight + 1
        || actPreviewState.tableRight > actPreviewState.previewRight + 1
        || actPreviewState.titleOverflow > 1) {
        report.failures.push({ width, type: "act-mobile-preview-fit", actPreviewState });
      }

      await setState(page, uiState({ activePage: "orders" }));
      const orderPageSurfaces = await page.evaluate(() => {
        const add = document.querySelector(".legacy-orders-add-wide");
        const page = document.querySelector(".legacy-orders-page");
        const addRect = add?.getBoundingClientRect();
        const pageRect = page?.getBoundingClientRect();
        return {
          card: getComputedStyle(document.querySelector(".legacy-order-card")).backgroundColor,
          money: getComputedStyle(document.querySelector(".legacy-order-card .legacy-order-money > div")).backgroundColor,
          action: getComputedStyle(document.querySelector(".legacy-order-card .legacy-order-actions > button, .legacy-order-card .legacy-order-actions > a")).backgroundColor,
          addWidth: Math.round(addRect?.width || 0),
          addHeight: Math.round(addRect?.height || 0),
          pageWidth: Math.round(pageRect?.width || 0),
          addText: add?.textContent?.trim() || ""
        };
      });
      if (orderPageSurfaces.card !== "rgb(7, 12, 16)"
        || orderPageSurfaces.money !== "rgb(9, 15, 20)"
        || orderPageSurfaces.action !== "rgb(9, 15, 20)"
        || orderPageSurfaces.addWidth < orderPageSurfaces.pageWidth - 34
        || orderPageSurfaces.addHeight < 48
        || !orderPageSurfaces.addText.includes("Новая заявка")) {
        report.failures.push({ width, type: "orders-deep-dark-page", orderPageSurfaces });
      }
      const orderDensity = await page.evaluate(() => {
        const card = document.querySelector(".legacy-order-card");
        const list = document.querySelector(".legacy-orders-list");
        const device = card?.querySelector(".legacy-device-icon");
        const money = card?.querySelector(".legacy-order-money > div");
        const actions = card?.querySelector(".legacy-order-actions");
        const action = actions?.querySelector("button, a");
        const cardStyle = card ? getComputedStyle(card) : null;
        const listStyle = list ? getComputedStyle(list) : null;
        const actionsStyle = actions ? getComputedStyle(actions) : null;
        return {
          paddingTop: parseFloat(cardStyle?.paddingTop || "999"),
          paddingBottom: parseFloat(cardStyle?.paddingBottom || "999"),
          listGap: parseFloat(listStyle?.rowGap || listStyle?.gap || "999"),
          deviceHeight: Math.round(device?.getBoundingClientRect().height || 999),
          moneyHeight: Math.round(money?.getBoundingClientRect().height || 999),
          actionHeight: Math.round(action?.getBoundingClientRect().height || 0),
          actionsMarginTop: parseFloat(actionsStyle?.marginTop || "999"),
          actionsPaddingTop: parseFloat(actionsStyle?.paddingTop || "999")
        };
      });
      if (orderDensity.paddingTop > 12
        || orderDensity.paddingBottom > 10
        || orderDensity.listGap > 8
        || orderDensity.deviceHeight > 41
        || orderDensity.moneyHeight > 52
        || orderDensity.actionHeight < 44
        || orderDensity.actionHeight > 46
        || orderDensity.actionsMarginTop > 8
        || orderDensity.actionsPaddingTop > 7) {
        report.failures.push({ width, type: "orders-density", orderDensity });
      }
      await page.locator('[data-action="new-order"]').first().click();
      await page.waitForTimeout(100);
      let modalCheck = await page.evaluate(() => ({
        locked: document.body.classList.contains("modal-open"),
        fixed: getComputedStyle(document.body).position === "fixed",
        dialogs: document.querySelectorAll('.modal-backdrop').length
      }));
      if (!modalCheck.locked || !modalCheck.fixed || modalCheck.dialogs !== 1) report.failures.push({ width, type: "order-modal-lock", modalCheck });
      report.results.push(await shot(page, width, "order-editor", false));

      const paymentGridLayout = await page.evaluate(() => {
        const grid = document.querySelector(".legacy-payment-grid");
        const gridStyle = grid ? getComputedStyle(grid) : null;
        const gridRect = grid?.getBoundingClientRect();
        const group = (name) => document.querySelector(`.legacy-payment-grid [name="${name}"]`)?.closest(".form-group")?.getBoundingClientRect();
        const sum = group("sum");
        const prepay = group("prepay");
        const discount = group("discount");
        const percent = group("percent");
        const gray = group("expense_gray");
        const white = group("expense_white");
        const tag = group("tag");
        return {
          gridWidth: Math.round(gridRect?.width || 0),
          columns: gridStyle?.gridTemplateColumns || "",
          sum: sum ? { left: Math.round(sum.left), top: Math.round(sum.top), width: Math.round(sum.width) } : null,
          prepay: prepay ? { left: Math.round(prepay.left), top: Math.round(prepay.top), width: Math.round(prepay.width) } : null,
          discount: discount ? { left: Math.round(discount.left), top: Math.round(discount.top), width: Math.round(discount.width) } : null,
          percent: percent ? { left: Math.round(percent.left), top: Math.round(percent.top), width: Math.round(percent.width) } : null,
          gray: gray ? { left: Math.round(gray.left), top: Math.round(gray.top), width: Math.round(gray.width) } : null,
          white: white ? { left: Math.round(white.left), top: Math.round(white.top), width: Math.round(white.width) } : null,
          tag: tag ? { left: Math.round(tag.left), top: Math.round(tag.top), width: Math.round(tag.width) } : null
        };
      });
      const paymentPairsAligned = paymentGridLayout.sum && paymentGridLayout.prepay
        && paymentGridLayout.discount && paymentGridLayout.percent
        && paymentGridLayout.gray && paymentGridLayout.white
        && Math.abs(paymentGridLayout.sum.top - paymentGridLayout.prepay.top) <= 2
        && Math.abs(paymentGridLayout.discount.top - paymentGridLayout.percent.top) <= 2
        && Math.abs(paymentGridLayout.gray.top - paymentGridLayout.white.top) <= 2
        && paymentGridLayout.prepay.left > paymentGridLayout.sum.left
        && paymentGridLayout.percent.left > paymentGridLayout.discount.left
        && paymentGridLayout.white.left > paymentGridLayout.gray.left;
      if (!paymentPairsAligned
        || !paymentGridLayout.tag
        || paymentGridLayout.tag.width < paymentGridLayout.gridWidth - 2
        || paymentGridLayout.sum.width < 120
        || paymentGridLayout.prepay.width < 120) {
        report.failures.push({ width, type: "order-payment-grid-two-columns", paymentGridLayout, paymentPairsAligned });
      }

      const orderEditorDensity = await page.evaluate(() => {
        const body = document.querySelector(".order-editor-body");
        const section = document.querySelector(".order-editor-section");
        const title = document.querySelector(".order-editor-section .form-section-title");
        const field = document.querySelector(".order-editor-section .field");
        const textarea = document.querySelector(".order-editor-section textarea.field");
        const px = (value) => Number.parseFloat(value || "0") || 0;
        const bodyStyle = body ? getComputedStyle(body) : null;
        const sectionStyle = section ? getComputedStyle(section) : null;
        const titleStyle = title ? getComputedStyle(title) : null;
        return {
          bodyPaddingTop: bodyStyle ? px(bodyStyle.paddingTop) : 999,
          sectionMarginBottom: sectionStyle ? px(sectionStyle.marginBottom) : 999,
          titleMarginBottom: titleStyle ? px(titleStyle.marginBottom) : 999,
          fieldHeight: Math.round(field?.getBoundingClientRect().height || 0),
          textareaHeight: Math.round(textarea?.getBoundingClientRect().height || 0)
        };
      });
      if (orderEditorDensity.bodyPaddingTop > 12
        || orderEditorDensity.sectionMarginBottom > 18
        || orderEditorDensity.titleMarginBottom > 8
        || orderEditorDensity.fieldHeight < 44
        || orderEditorDensity.fieldHeight > 48
        || orderEditorDensity.textareaHeight > 76) {
        report.failures.push({ width, type: "order-editor-compact-density", orderEditorDensity });
      }

      await page.locator("#open-service-catalog").click();
      await page.waitForTimeout(100);
      const nested = await page.evaluate(() => {
        const layers = [...document.querySelectorAll(".modal-backdrop")];
        return { count: layers.length, firstInert: Boolean(layers[0] && layers[0].inert), firstHidden: layers[0] && layers[0].getAttribute("aria-hidden") };
      });
      if (nested.count !== 2 || !nested.firstInert || nested.firstHidden !== "true") report.failures.push({ width, type: "nested-modal", nested });
      const serviceCatalogSurface = await page.evaluate(() => ({
        modal: getComputedStyle(document.querySelector(".catalog-modal")).backgroundColor,
        option: getComputedStyle(document.querySelector(".catalog-service-option")).backgroundColor,
        summary: getComputedStyle(document.querySelector(".catalog-fit-summary")).backgroundColor
      }));
      if (serviceCatalogSurface.modal !== "rgb(3, 7, 10)"
        || serviceCatalogSurface.option !== "rgb(9, 15, 20)"
        || serviceCatalogSurface.summary !== "rgb(6, 11, 15)") {
        report.failures.push({ width, type: "service-catalog-deep-dark", serviceCatalogSurface });
      }
      const serviceCatalogActions = await page.evaluate(() => {
        const actions = document.querySelector(".catalog-modal-actions");
        const actionStyle = actions ? getComputedStyle(actions) : null;
        const rect = actions?.getBoundingClientRect();
        const buttons = [...document.querySelectorAll(".catalog-modal-actions > button")].map((button) => {
          const buttonRect = button.getBoundingClientRect();
          return {
            width: Math.round(buttonRect.width),
            height: Math.round(buttonRect.height),
            left: Math.round(buttonRect.left),
            top: Math.round(buttonRect.top)
          };
        });
        return {
          width: Math.round(rect?.width || 0),
          left: Math.round(rect?.left || 0),
          innerWidth: rect && actionStyle
            ? Math.round(rect.width - (parseFloat(actionStyle.paddingLeft) || 0) - (parseFloat(actionStyle.paddingRight) || 0))
            : 0,
          buttons
        };
      });
      if (serviceCatalogActions.buttons.length !== 2
        || serviceCatalogActions.buttons.some((button) => button.width < serviceCatalogActions.innerWidth - 2)
        || serviceCatalogActions.buttons.some((button) => button.height < 48)
        || serviceCatalogActions.buttons[1]?.top <= serviceCatalogActions.buttons[0]?.top) {
        report.failures.push({ width, type: "service-catalog-actions-full-width", serviceCatalogActions });
      }
      report.results.push(await shot(page, width, "service-catalog", false));

      await page.evaluate(() => {
        const backdrop = document.querySelector(".catalog-modal-backdrop");
        backdrop?.style.setProperty("transform", "translate3d(0,-240px,0)", "important");
        window.dispatchEvent(new Event("resize"));
      });
      await page.waitForTimeout(40);
      const catalogViewportPin = await page.evaluate(() => {
        const backdrop = document.querySelector(".catalog-modal-backdrop");
        const dialog = document.querySelector(".catalog-modal");
        const actions = document.querySelector(".catalog-modal-actions");
        const list = document.querySelector(".catalog-service-list");
        const summary = document.querySelector(".catalog-fit-summary");
        const rect = backdrop?.getBoundingClientRect();
        const dialogRect = dialog?.getBoundingClientRect();
        const actionsRect = actions?.getBoundingClientRect();
        const listRect = list?.getBoundingClientRect();
        const summaryRect = summary?.getBoundingClientRect();
        const visual = window.visualViewport;
        const top = Number(visual?.offsetTop) || 0;
        const bottom = top + (Number(visual?.height) || window.innerHeight);
        return {
          backdropTop: rect ? Math.round(rect.top) : 999,
          backdropBottom: rect ? Math.round(rect.bottom) : -999,
          dialogTop: dialogRect ? Math.round(dialogRect.top) : 999,
          dialogBottom: dialogRect ? Math.round(dialogRect.bottom) : -999,
          actionsBottom: actionsRect ? Math.round(actionsRect.bottom) : -999,
          listBottom: listRect ? Math.round(listRect.bottom) : -999,
          summaryTop: summaryRect ? Math.round(summaryRect.top) : 999,
          listOverflowY: list ? getComputedStyle(list).overflowY : "missing",
          targetTop: Math.round(top),
          targetBottom: Math.round(bottom)
        };
      });
      if (Math.abs(catalogViewportPin.backdropTop - catalogViewportPin.targetTop) > 2
        || Math.abs(catalogViewportPin.backdropBottom - catalogViewportPin.targetBottom) > 3
        || Math.abs(catalogViewportPin.dialogTop - catalogViewportPin.targetTop) > 2
        || Math.abs(catalogViewportPin.dialogBottom - catalogViewportPin.targetBottom) > 3
        || Math.abs(catalogViewportPin.actionsBottom - catalogViewportPin.targetBottom) > 3
        || catalogViewportPin.listBottom > catalogViewportPin.summaryTop + 2
        || !["auto","scroll"].includes(catalogViewportPin.listOverflowY)) {
        report.failures.push({ width, type: "service-catalog-viewport-pin", catalogViewportPin });
      }

      const catalogScrollBeforeSelection = await page.evaluate(() => {
        const list = document.querySelector(".catalog-service-list");
        if (list) list.scrollTop = list.scrollHeight;
        return {
          scrollTop: Math.round(list?.scrollTop || 0),
          maxScroll: Math.round((list?.scrollHeight || 0) - (list?.clientHeight || 0))
        };
      });
      await page.locator(".catalog-service-option").last().scrollIntoViewIfNeeded();
      await page.locator(".catalog-service-option").last().click();
      await page.waitForTimeout(60);
      const serviceSelection = await page.evaluate(() => ({
        selectedRows: document.querySelectorAll(".catalog-service-option.selected").length,
        checkedIcons: document.querySelectorAll(".catalog-service-option.selected .catalog-check .ui-icon").length,
        countText: document.querySelector("#catalog-selected-count")?.textContent || ""
      }));
      if (serviceSelection.selectedRows !== 1 || serviceSelection.checkedIcons !== 1 || !serviceSelection.countText.startsWith("1 ")) {
        report.failures.push({ width, type: "service-selection-feedback", serviceSelection });
      }
      const catalogAfterSelection = await page.evaluate(() => {
        const modal = document.querySelector(".catalog-modal-backdrop");
        const dialog = document.querySelector(".catalog-modal");
        const actions = document.querySelector(".catalog-modal-actions");
        const list = document.querySelector(".catalog-service-list");
        const dialogRect = dialog?.getBoundingClientRect();
        const actionsRect = actions?.getBoundingClientRect();
        const visual = window.visualViewport;
        const top = Number(visual?.offsetTop) || 0;
        const bottom = top + (Number(visual?.height) || window.innerHeight);
        return {
          modalConnected: Boolean(modal?.isConnected),
          modalLayers: document.querySelectorAll(".modal-backdrop").length,
          scrollTop: Math.round(list?.scrollTop || 0),
          maxScroll: Math.round((list?.scrollHeight || 0) - (list?.clientHeight || 0)),
          dialogTop: dialogRect ? Math.round(dialogRect.top) : 999,
          dialogBottom: dialogRect ? Math.round(dialogRect.bottom) : -999,
          actionsBottom: actionsRect ? Math.round(actionsRect.bottom) : -999,
          targetTop: Math.round(top),
          targetBottom: Math.round(bottom)
        };
      });
      if (!catalogAfterSelection.modalConnected
        || catalogAfterSelection.modalLayers !== 2
        || (catalogScrollBeforeSelection.maxScroll > 24 && catalogAfterSelection.scrollTop < Math.max(0, catalogScrollBeforeSelection.scrollTop - 24))
        || Math.abs(catalogAfterSelection.dialogTop - catalogAfterSelection.targetTop) > 2
        || Math.abs(catalogAfterSelection.dialogBottom - catalogAfterSelection.targetBottom) > 3
        || Math.abs(catalogAfterSelection.actionsBottom - catalogAfterSelection.targetBottom) > 3) {
        report.failures.push({
          width,
          type: "service-catalog-scrolled-selection-stays-open",
          catalogScrollBeforeSelection,
          catalogAfterSelection
        });
      }
      report.results.push(await shot(page, width, "service-catalog-selected", false));

      await page.locator("#catalog-apply").click();
      await page.waitForTimeout(80);
      const serviceRowState = await page.evaluate(() => {
        const row = document.querySelector("#service-lines [data-service-row]");
        const remove = row?.querySelector("[data-remove-line]");
        const name = row?.querySelector(".service-name-field");
        const price = row?.querySelector(".service-price-field input");
        const rect = remove?.getBoundingClientRect();
        const nameStyle = name ? getComputedStyle(name) : null;
        const priceStyle = price ? getComputedStyle(price) : null;
        return {
          rows: document.querySelectorAll("#service-lines [data-service-row]").length,
          removeVisible: Boolean(remove && getComputedStyle(remove).display !== "none"),
          removeWidth: rect ? Math.round(rect.width) : 0,
          removeHeight: rect ? Math.round(rect.height) : 0,
          nameBackground: nameStyle?.backgroundColor || "missing",
          nameBackgroundImage: nameStyle?.backgroundImage || "missing",
          nameBorderTop: nameStyle?.borderTopWidth || "missing",
          nameShadow: nameStyle?.boxShadow || "missing",
          priceBackground: priceStyle?.backgroundColor || "missing"
        };
      });
      if (serviceRowState.rows !== 1
        || !serviceRowState.removeVisible
        || serviceRowState.removeWidth < 44
        || serviceRowState.removeHeight < 44
        || serviceRowState.nameBackground !== "rgba(0, 0, 0, 0)"
        || serviceRowState.nameBackgroundImage !== "none"
        || serviceRowState.nameBorderTop !== "0px"
        || serviceRowState.nameShadow !== "none"
        || serviceRowState.priceBackground !== "rgba(0, 0, 0, 0)") {
        report.failures.push({ width, type: "service-row-actions", serviceRowState });
      }
      const servicePriceLayout = await page.evaluate(() => {
        const input = document.querySelector("#service-lines .service-price-field input");
        const suffix = document.querySelector("#service-lines .service-price-field > span");
        const inputRect = input?.getBoundingClientRect();
        const suffixRect = suffix?.getBoundingClientRect();
        return {
          inputRight: inputRect ? Math.round(inputRect.right) : 0,
          suffixLeft: suffixRect ? Math.round(suffixRect.left) : 0,
          suffixPosition: suffix ? getComputedStyle(suffix).position : "missing"
        };
      });
      if (servicePriceLayout.suffixPosition !== "static" || servicePriceLayout.suffixLeft < servicePriceLayout.inputRight) {
        report.failures.push({ width, type: "service-price-overlap", servicePriceLayout });
      }

      const servicePriceBeforeFit = await page.evaluate(() => {
        const row = document.querySelector("#service-lines [data-service-row]");
        const price = row?.querySelector('[data-line="price"]');
        return {
          readonly: Boolean(price?.readOnly),
          basePrice: Number(row?.dataset.basePrice) || 0,
          currentPrice: Number(price?.value) || 0
        };
      });
      await page.locator('.order-editor-modal [name="sum"]').fill("12340");
      await page.waitForTimeout(40);
      const servicePriceAfterFit = await page.evaluate(() => {
        const rows = [...document.querySelectorAll("#service-lines [data-service-row]")];
        const total = rows.reduce((sum, row) => {
          const qty = Number(row.querySelector('[data-line="qty"]')?.value) || 0;
          const price = Number(row.querySelector('[data-line="price"]')?.value) || 0;
          return sum + qty * price;
        }, 0);
        return {
          total,
          readonly: rows.every((row) => Boolean(row.querySelector('[data-line="price"]')?.readOnly)),
          basePrice: Number(rows[0]?.dataset.basePrice) || 0
        };
      });
      if (!servicePriceBeforeFit.readonly
        || servicePriceBeforeFit.basePrice <= 0
        || !servicePriceAfterFit.readonly
        || servicePriceAfterFit.basePrice !== servicePriceBeforeFit.basePrice
        || Math.abs(servicePriceAfterFit.total - 12340) > 0.01) {
        report.failures.push({ width, type: "service-price-auto-fit", servicePriceBeforeFit, servicePriceAfterFit });
      }

      await page.locator("#service-lines [data-remove-line]").first().click();
      if (await page.locator("#service-lines [data-service-row]").count() !== 0) {
        report.failures.push({ width, type: "service-row-remove" });
      }

      await page.locator("#open-service-catalog").click();
      await page.waitForTimeout(60);
      await page.keyboard.press("Escape");
      let nestedClose = await page.evaluate(() => ({
        count: document.querySelectorAll(".modal-backdrop").length,
        locked: document.body.classList.contains("modal-open")
      }));
      if (nestedClose.count !== 1 || !nestedClose.locked) report.failures.push({ width, type: "service-catalog-close", nestedClose });

      await page.locator("#open-material-catalog").click();
      await page.waitForTimeout(100);
      const materialNested = await page.evaluate(() => {
        const layers = [...document.querySelectorAll(".modal-backdrop")];
        const dialog = document.querySelector(".material-catalog-modal");
        return {
          count: layers.length,
          firstInert: Boolean(layers[0] && layers[0].inert),
          firstHidden: layers[0] && layers[0].getAttribute("aria-hidden"),
          role: dialog?.getAttribute("role"),
          ariaModal: dialog?.getAttribute("aria-modal")
        };
      });
      if (materialNested.count !== 2 || !materialNested.firstInert || materialNested.firstHidden !== "true" || materialNested.role !== "dialog" || materialNested.ariaModal !== "true") {
        report.failures.push({ width, type: "material-nested-modal", materialNested });
      }
      const materialCatalogSurface = await page.evaluate(() => ({
        modal: getComputedStyle(document.querySelector(".material-catalog-modal")).backgroundColor,
        row: getComputedStyle(document.querySelector(".material-catalog-row")).backgroundColor,
        search: getComputedStyle(document.querySelector(".material-catalog-search .search")).backgroundColor
      }));
      if (materialCatalogSurface.modal !== "rgb(3, 7, 10)"
        || materialCatalogSurface.row !== "rgb(9, 15, 20)"
        || materialCatalogSurface.search !== "rgb(9, 15, 20)") {
        report.failures.push({ width, type: "material-catalog-deep-dark", materialCatalogSurface });
      }
      report.results.push(await shot(page, width, "material-catalog", false));
      const materialCatalogDone = await page.evaluate(() => {
        const button = document.querySelector(".material-catalog-close");
        const rect = button?.getBoundingClientRect();
        const style = button ? getComputedStyle(button) : null;
        return {
          background: style?.backgroundColor || "missing",
          color: style?.color || "missing",
          radius: style?.borderRadius || "missing",
          height: rect ? Math.round(rect.height) : 0,
          icon: Boolean(button?.querySelector(".ui-icon"))
        };
      });
      if (materialCatalogDone.background !== "rgb(255, 104, 74)"
        || materialCatalogDone.color !== "rgb(28, 16, 12)"
        || materialCatalogDone.radius !== "12px"
        || materialCatalogDone.height < 48
        || !materialCatalogDone.icon) {
        report.failures.push({ width, type: "material-catalog-done-cta", materialCatalogDone });
      }

      await page.locator("[data-material-id]").first().click();
      await page.waitForTimeout(60);
      const materialSelection = await page.evaluate(() => ({
        selectedRows: document.querySelectorAll(".material-catalog-row.selected").length,
        selectedIcons: document.querySelectorAll(".material-catalog-selected .ui-icon").length,
        countText: document.querySelector("#material-catalog-selected-count")?.textContent || ""
      }));
      if (materialSelection.selectedRows !== 1 || materialSelection.selectedIcons !== 1 || !materialSelection.countText.startsWith("1 ")) {
        report.failures.push({ width, type: "material-selection-feedback", materialSelection });
      }
      report.results.push(await shot(page, width, "material-catalog-selected", false));

      await page.keyboard.press("Escape");
      nestedClose = await page.evaluate(() => ({
        count: document.querySelectorAll(".modal-backdrop").length,
        locked: document.body.classList.contains("modal-open")
      }));
      if (nestedClose.count !== 1 || !nestedClose.locked) report.failures.push({ width, type: "material-catalog-close", nestedClose });

      const materialRowState = await page.evaluate(() => {
        const row = document.querySelector("#material-lines [data-material-row]");
        const head = row?.querySelector(".material-card-head");
        const controls = row?.querySelector(".material-card-controls");
        const remove = row?.querySelector("[data-remove-line]");
        const rowRect = row?.getBoundingClientRect();
        const headRect = head?.getBoundingClientRect();
        const controlsRect = controls?.getBoundingClientRect();
        const removeRect = remove?.getBoundingClientRect();
        return {
          rows: document.querySelectorAll("#material-lines [data-material-row]").length,
          removeWidth: removeRect ? Math.round(removeRect.width) : 0,
          removeHeight: removeRect ? Math.round(removeRect.height) : 0,
          rowHeight: rowRect ? Math.round(rowRect.height) : 0,
          headToControlsGap: headRect && controlsRect ? Math.round(controlsRect.top - headRect.bottom) : 999,
          removeOffsetTop: headRect && removeRect ? Math.round(removeRect.top - headRect.top) : 999
        };
      });
      if (materialRowState.rows !== 1
        || materialRowState.removeWidth < 44
        || materialRowState.removeHeight < 44
        || materialRowState.rowHeight > 176
        || materialRowState.headToControlsGap > 14
        || materialRowState.removeOffsetTop > 8) {
        report.failures.push({ width, type: "material-row-actions", materialRowState });
      }
      const editorSurfaceState = await page.evaluate(() => {
        const labels = [...document.querySelectorAll("#material-lines .material-card-controls label > span")];
        const footer = document.querySelector(".order-editor-modal .modal-actions");
        const secondary = footer?.querySelector(".secondary-button");
        const primary = footer?.querySelector(".primary-button");
        const footerRect = footer?.getBoundingClientRect();
        const footerStyle = footer ? getComputedStyle(footer) : null;
        const secondaryRect = secondary?.getBoundingClientRect();
        const primaryRect = primary?.getBoundingClientRect();
        return {
          material: getComputedStyle(document.querySelector("#material-lines [data-material-row]")).backgroundColor,
          materialField: getComputedStyle(document.querySelector("#material-lines .material-card-controls .field")).backgroundColor,
          secondaryAction: getComputedStyle(document.querySelector(".order-editor-modal .modal-actions .secondary-button")).backgroundColor,
          serviceMatchCount: document.querySelectorAll("#legacy-service-match").length,
          clippedMaterialLabels: labels.filter((label) => label.scrollWidth > label.clientWidth + 1).map((label) => label.textContent),
          qtyWidth: Math.round(document.querySelector('#material-lines [data-line="qty"]')?.getBoundingClientRect().width || 0),
          costWidth: Math.round(document.querySelector('#material-lines [data-line="unit-cost"]')?.getBoundingClientRect().width || 0),
          footerWidth: Math.round(footerRect?.width || 0),
          footerInnerWidth: footerRect && footerStyle
            ? Math.round(footerRect.width - (parseFloat(footerStyle.paddingLeft) || 0) - (parseFloat(footerStyle.paddingRight) || 0))
            : 0,
          footerCoverage: footerRect && secondaryRect && primaryRect ? Number(((secondaryRect.width + primaryRect.width) / footerRect.width).toFixed(3)) : 0,
          footerButtonGap: secondaryRect && primaryRect ? Math.round(primaryRect.left - secondaryRect.right) : 999,
          secondaryWidth: Math.round(secondaryRect?.width || 0),
          primaryWidth: Math.round(primaryRect?.width || 0),
          secondaryTop: Math.round(secondaryRect?.top || 0),
          primaryTop: Math.round(primaryRect?.top || 0)
        };
      });
      if (editorSurfaceState.material !== "rgb(7, 12, 16)"
        || editorSurfaceState.materialField !== "rgb(9, 15, 20)"
        || editorSurfaceState.secondaryAction !== "rgb(10, 17, 22)"
        || editorSurfaceState.serviceMatchCount !== 0
        || editorSurfaceState.clippedMaterialLabels.length
        || editorSurfaceState.qtyWidth < 60
        || editorSurfaceState.costWidth < 100
        || editorSurfaceState.footerWidth < width - 2
        || editorSurfaceState.footerCoverage < 1.8
        || editorSurfaceState.footerButtonGap > 10
        || editorSurfaceState.secondaryWidth < editorSurfaceState.footerInnerWidth - 2
        || editorSurfaceState.primaryWidth < editorSurfaceState.footerInnerWidth - 2
        || editorSurfaceState.primaryTop <= editorSurfaceState.secondaryTop) {
        report.failures.push({ width, type: "order-editor-polish", editorSurfaceState });
      }
      if (width === 390) {
        await page.locator("#material-lines [data-material-row]").scrollIntoViewIfNeeded();
        report.results.push(await shot(page, width, "order-editor-material-row", false));
      }
      await page.locator("#material-lines [data-remove-line]").first().click();
      if (await page.locator("#material-lines [data-material-row]").count() !== 0) {
        report.failures.push({ width, type: "material-row-remove" });
      }

      if (width === 390) {
        await page.locator("#add-manual-material").click();
        await page.locator('[data-material-row][data-direct-expense="true"] [data-line="name"]').fill("Ремонт платы");
        await page.locator('[data-material-row][data-direct-expense="true"] [data-line="amount"]').fill("3000");
        await page.waitForTimeout(30);
        const directExpenseState = await page.evaluate(() => {
          const row = document.querySelector('[data-material-row][data-direct-expense="true"]');
          const amount = row?.querySelector('[data-line="amount"]');
          const comment = row?.querySelector('[data-line="comment"]');
          const white = document.querySelector('.order-editor-modal [name="expense_white"]');
          const hint = document.querySelector("#white-expense-minimum");
          const add = document.querySelector("#add-manual-material");
          return {
            rows: document.querySelectorAll('[data-material-row][data-direct-expense="true"]').length,
            amount: Number(amount?.value) || 0,
            hasComment: Boolean(comment),
            white: Number(white?.value) || 0,
            whiteMin: Number(white?.min) || 0,
            hint: hint?.textContent || "",
            addAlign: add ? getComputedStyle(add).justifyContent : "missing",
            addHeight: Math.round(add?.getBoundingClientRect().height || 0)
          };
        });
        if (directExpenseState.rows !== 1
          || directExpenseState.amount !== 3000
          || !directExpenseState.hasComment
          || directExpenseState.white !== 3000
          || directExpenseState.whiteMin !== 3000
          || !directExpenseState.hint.includes("3")
          || directExpenseState.addAlign !== "center"
          || directExpenseState.addHeight < 44) {
          report.failures.push({ width, type: "direct-expense-white-minimum", directExpenseState });
        }

        await page.locator('.order-editor-modal [name="expense_white"]').fill("2000");
        await page.locator('.order-editor-modal [name="expense_white"]').evaluate((el) => el.dispatchEvent(new Event("change", { bubbles: true })));
        const clampedWhite = Number(await page.locator('.order-editor-modal [name="expense_white"]').inputValue());
        if (clampedWhite !== 3000) {
          report.failures.push({ width, type: "direct-expense-white-clamp", clampedWhite });
        }

        await page.locator('.order-editor-modal [name="expense_white"]').fill("4000");
        await page.locator('.order-editor-modal [name="expense_white"]').evaluate((el) => el.dispatchEvent(new Event("change", { bubbles: true })));
        const raisedWhite = Number(await page.locator('.order-editor-modal [name="expense_white"]').inputValue());
        if (raisedWhite !== 4000) {
          report.failures.push({ width, type: "direct-expense-white-manual-increase", raisedWhite });
        }
        await page.locator('[data-material-row][data-direct-expense="true"]').scrollIntoViewIfNeeded();
        report.results.push(await shot(page, width, "order-editor-direct-expense", false));
        await page.locator('[data-material-row][data-direct-expense="true"] [data-remove-line]').click();
      }

      await page.keyboard.press("Escape");
      const editorClosed = await page.evaluate(() => ({
        count: document.querySelectorAll(".modal-backdrop").length,
        locked: document.body.classList.contains("modal-open"),
        fixed: getComputedStyle(document.body).position === "fixed"
      }));
      if (editorClosed.count !== 0 || editorClosed.locked || editorClosed.fixed) report.failures.push({ width, type: "order-editor-unlock", editorClosed });

      if (width === 390) {
        const photoSeed = structuredClone(seed);
        photoSeed.orders[0].photos = [{
          name: "Фото холодильника",
          dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M/wHwAEAQH/9jzG9AAAAABJRU5ErkJggg=="
        }];
        await writeSeed(page, photoSeed);
        await setState(page, uiState({ activePage: "orders" }));
        await page.locator('.legacy-order-card [data-order-action="edit"]').first().click();
        const staticPhotoState = await page.evaluate(() => {
          const block = document.querySelector(".order-photo-details");
          const body = block?.querySelector(".order-extra-body");
          return {
            tag: block?.tagName || "",
            summaries: block?.querySelectorAll("summary").length || 0,
            bodyDisplay: body ? getComputedStyle(body).display : "missing",
            addVisible: Boolean(block?.querySelector("#order-photo-input")),
            cards: block?.querySelectorAll("[data-view-photo]").length || 0
          };
        });
        if (staticPhotoState.tag !== "SECTION"
          || staticPhotoState.summaries !== 0
          || staticPhotoState.bodyDisplay === "none"
          || !staticPhotoState.addVisible
          || staticPhotoState.cards !== 1) {
          report.failures.push({ width, type: "photos-always-open", staticPhotoState });
        }
        await page.locator("#open-service-catalog").scrollIntoViewIfNeeded();
        report.results.push(await shot(page, width, "order-editor-restored", false));
        await page.locator("[data-view-photo]").click();
        const photoViewerState = await page.evaluate(() => {
          const viewer = document.querySelector(".photo-viewer-modal");
          const underlay = document.querySelector(".order-editor-backdrop");
          const deleteButton = document.querySelector(".photo-viewer-delete");
          const rect = deleteButton?.getBoundingClientRect();
          return {
            viewers: document.querySelectorAll(".photo-viewer-modal").length,
            underlayInert: Boolean(underlay?.inert),
            deleteWidth: rect ? Math.round(rect.width) : 0,
            deleteHeight: rect ? Math.round(rect.height) : 0
          };
        });
        if (photoViewerState.viewers !== 1 || !photoViewerState.underlayInert || photoViewerState.deleteWidth < 44 || photoViewerState.deleteHeight < 44) {
          report.failures.push({ width, type: "photo-viewer", photoViewerState });
        }
        report.results.push(await shot(page, width, "photo-viewer", false));
        await page.locator(".photo-viewer-delete").click();
        await page.locator("[data-confirm-primary]").click();
        const photoDeleted = await page.evaluate(() => ({
          viewers: document.querySelectorAll(".photo-viewer-modal").length,
          cards: document.querySelectorAll("[data-view-photo]").length,
          locked: document.body.classList.contains("modal-open")
        }));
        if (photoDeleted.viewers !== 0 || photoDeleted.cards !== 0 || !photoDeleted.locked) {
          report.failures.push({ width, type: "photo-delete", photoDeleted });
        }
        await page.keyboard.press("Escape");
        await writeSeed(page, seed);
      }

      await setState(page, uiState({ activePage: "orders" }));
      if (width === 390) {
        const overdueState = await page.evaluate(() => ({
          overdue: document.querySelectorAll(".legacy-next-visit.overdue").length,
          text: document.querySelector(".legacy-next-visit.overdue")?.innerText || ""
        }));
        if (overdueState.overdue !== 1 || !overdueState.text.includes("Визит просрочен")) {
          report.failures.push({ width, type: "overdue-visit-label", overdueState });
        }
      }
      await page.locator(".legacy-order-card").first().click();
      await page.waitForTimeout(80);
      const detailActions = await page.locator(".legacy-expanded-actions > button, .legacy-expanded-actions > a").count();
      if (detailActions !== 4) report.failures.push({ width, type: "order-detail-actions", count: detailActions });
      const detailWorkState = await page.evaluate(() => ({
        card: getComputedStyle(document.querySelector(".legacy-expanded-order-card")).backgroundColor,
        serviceSection: getComputedStyle(document.querySelector(".legacy-detail-services")).backgroundColor,
        materialSection: getComputedStyle(document.querySelector(".legacy-detail-materials")).backgroundColor,
        notesSection: getComputedStyle(document.querySelector(".legacy-detail-notes")).backgroundColor,
        serviceRows: document.querySelectorAll(".legacy-detail-services .legacy-detail-line").length,
        materialRows: document.querySelectorAll(".legacy-detail-materials .legacy-detail-line").length
      }));
      if (detailWorkState.card !== "rgb(6, 11, 15)"
        || detailWorkState.serviceSection !== "rgb(6, 11, 15)"
        || detailWorkState.materialSection !== "rgb(6, 11, 15)"
        || detailWorkState.notesSection !== "rgb(6, 11, 15)"
        || detailWorkState.serviceRows < 1
        || detailWorkState.materialRows < 1) {
        report.failures.push({ width, type: "order-detail-work-materials", detailWorkState });
      }
      const orderDetailDensity = await page.evaluate(() => {
        const card = document.querySelector(".legacy-expanded-order-card");
        const money = document.querySelector(".legacy-expanded-money > div");
        const action = document.querySelector(".legacy-expanded-actions > button, .legacy-expanded-actions > a");
        const section = document.querySelector(".legacy-detail-section");
        const line = document.querySelector(".legacy-detail-line");
        const px = (value) => Number.parseFloat(value || "0") || 0;
        const cardStyle = card ? getComputedStyle(card) : null;
        const sectionStyle = section ? getComputedStyle(section) : null;
        return {
          cardPaddingTop: cardStyle ? px(cardStyle.paddingTop) : 999,
          moneyHeight: Math.round(money?.getBoundingClientRect().height || 0),
          actionHeight: Math.round(action?.getBoundingClientRect().height || 0),
          sectionMarginTop: sectionStyle ? px(sectionStyle.marginTop) : 999,
          sectionPaddingTop: sectionStyle ? px(sectionStyle.paddingTop) : 999,
          lineHeight: Math.round(line?.getBoundingClientRect().height || 0)
        };
      });
      if (orderDetailDensity.cardPaddingTop > 12
        || orderDetailDensity.moneyHeight > 52
        || orderDetailDensity.actionHeight < 44
        || orderDetailDensity.actionHeight > 48
        || orderDetailDensity.sectionMarginTop > 8
        || orderDetailDensity.sectionPaddingTop > 10
        || orderDetailDensity.lineHeight > 52) {
        report.failures.push({ width, type: "order-detail-compact-density", orderDetailDensity });
      }
      report.results.push(await shot(page, width, "order-detail", false));
      await page.locator('.legacy-expanded-actions [data-detail-action="more"]').click();
      await page.waitForTimeout(80);
      const copyAction = await page.locator('[data-order-sheet-action="copy"]').count();
      if (copyAction !== 1) report.failures.push({ width, type: "order-actions-copy", count: copyAction });
      const orderActionsSurface = await page.evaluate(() => ({
        sheet: getComputedStyle(document.querySelector(".order-actions-sheet")).backgroundColor,
        action: getComputedStyle(document.querySelector(".order-actions-grid button, .order-actions-grid a")).backgroundColor,
        cancel: getComputedStyle(document.querySelector(".order-actions-cancel")).backgroundColor
      }));
      if (orderActionsSurface.sheet !== "rgb(6, 11, 15)"
        || orderActionsSurface.action !== "rgb(9, 15, 20)"
        || orderActionsSurface.cancel !== "rgb(9, 15, 20)") {
        report.failures.push({ width, type: "order-actions-deep-dark", orderActionsSurface });
      }
      report.results.push(await shot(page, width, "order-actions", false));
      await page.keyboard.press("Escape");

      if (width === 390) {
        await page.locator('[data-order-action="more"][data-id="0059"]').click();
        const warrantyActionCount = await page.locator('[data-order-sheet-action="warranty"]').count();
        if (warrantyActionCount !== 1) {
          report.failures.push({ width, type: "warranty-appeal-action", count: warrantyActionCount });
        } else {
          await page.locator('[data-order-sheet-action="warranty"]').click();
          await page.waitForTimeout(60);
          const warrantyDraftState = await page.evaluate(() => ({
            origin: document.querySelector(".warranty-appeal-origin")?.textContent || "",
            services: document.querySelectorAll("#service-lines [data-service-row]").length,
            materials: document.querySelectorAll("#material-lines [data-material-row]").length,
            percent: Number(document.querySelector('.order-editor-modal [name="percent"]')?.value) || 0,
            resultOptions: document.querySelectorAll('.order-editor-modal [name="warrantyResultId"] option').length,
            sumLabel: document.querySelector('.order-editor-modal [name="sum"]')?.closest(".form-group")?.querySelector("label")?.textContent?.trim() || ""
          }));
          if (!warrantyDraftState.origin.includes("0059")
            || warrantyDraftState.services !== 0
            || warrantyDraftState.materials !== 0
            || warrantyDraftState.percent !== 100
            || warrantyDraftState.resultOptions < 4
            || warrantyDraftState.sumLabel !== "Получено от клиента") {
            report.failures.push({ width, type: "warranty-appeal-draft", warrantyDraftState });
          }

          await page.locator('.order-editor-modal [name="sourceId"]').selectOption("source-avito");
          await page.locator('.order-editor-modal [name="warrantyResultId"]').selectOption("warranty-confirmed");
          await page.locator('.order-editor-modal [name="status"]').selectOption({ label: "Закрыта" });
          await page.locator('.order-editor-modal [name="sum"]').fill("0");
          await page.locator('.order-editor-modal button[type="submit"]').click();
          await page.locator("[data-confirm-primary]").click();
          await page.waitForTimeout(80);

          let warrantyData = await readStoredData(page);
          let appeal = warrantyData.orders.find((item) => item.orderType === "warranty" && String(item.parentOrderId) === "0059");
          if (!appeal
            || appeal.status !== "Закрыта"
            || Number(appeal.sum) !== 0
            || Number(appeal.percent) !== 100
            || appeal.warrantyResultId !== "warranty-confirmed"
            || (appeal.services || []).length !== 0
            || (appeal.materials || []).length !== 0) {
            report.failures.push({ width, type: "warranty-appeal-zero-close", appeal });
          }

          if (appeal) {
            await page.locator(`[data-order-action="edit"][data-id="${appeal.id}"]`).click();
            await page.locator('.order-editor-modal [name="sum"]').fill("1000");
            await page.locator('.order-editor-modal button[type="submit"]').click();
            await page.waitForTimeout(80);
            warrantyData = await readStoredData(page);
            appeal = warrantyData.orders.find((item) => String(item.id) === String(appeal.id));
            if (Number(appeal?.sum) !== 1000 || Number(appeal?.percent) !== 100) {
              report.failures.push({ width, type: "warranty-appeal-voluntary-money", appeal });
            }

            await setState(page, uiState({ activePage: "analytics" }));
            const warrantyAnalytics = await page.evaluate(() => {
              const numberFrom = (value) => Number(String(value || "").replace(/[^0-9-]/g, "")) || 0;
              const cards = [...document.querySelectorAll(".analytics-kpi")];
              const values = Object.fromEntries(cards.map((card) => [
                card.querySelector("span:not(.analytics-kpi-icon)")?.textContent?.trim() || "",
                numberFrom(card.querySelector("strong")?.textContent)
              ]));
              return values;
            });
            if (warrantyAnalytics["Получено от клиентов"] !== 11400
              || warrantyAnalytics["Заработал"] !== 6050
              || warrantyAnalytics["Средний чек"] !== 8900) {
              report.failures.push({ width, type: "warranty-appeal-analytics", warrantyAnalytics });
            }
          }

          await writeSeed(page, seed);
          await setState(page, uiState({ activePage: "orders" }));
        }
      }

      await setState(page, uiState({ activePage: "analytics" }));
      const analyticsPageSurfaces = await page.evaluate(() => ({
        panel: getComputedStyle(document.querySelector(".analytics-content .panel")).backgroundColor,
        kpi: getComputedStyle(document.querySelector(".analytics-kpi")).backgroundColor,
        focusList: getComputedStyle(document.querySelector(".analytics-focus-list")).backgroundColor,
        focus: getComputedStyle(document.querySelector(".analytics-focus-row")).backgroundColor
      }));
      if (analyticsPageSurfaces.panel !== "rgb(7, 12, 16)"
        || analyticsPageSurfaces.kpi !== "rgb(9, 15, 20)"
        || analyticsPageSurfaces.focusList !== "rgb(6, 11, 15)"
        || analyticsPageSurfaces.focus !== "rgb(6, 11, 15)") {
        report.failures.push({ width, type: "analytics-deep-dark-page", analyticsPageSurfaces });
      }
      const analyticsDensity = await page.evaluate(() => {
        const kpi = document.querySelector(".analytics-kpi");
        const workMetric = document.querySelector(".analytics-work .metric");
        const focusRow = document.querySelector(".analytics-focus-row");
        const panel = document.querySelector(".analytics-content .panel");
        const panelStyle = panel ? getComputedStyle(panel) : null;
        const px = (value) => Number.parseFloat(value || "0") || 0;
        return {
          kpiHeight: Math.round(kpi?.getBoundingClientRect().height || 0),
          workMetricHeight: Math.round(workMetric?.getBoundingClientRect().height || 0),
          focusHeight: Math.round(focusRow?.getBoundingClientRect().height || 0),
          panelPaddingTop: panelStyle ? px(panelStyle.paddingTop) : 999,
          panelMarginBottom: panelStyle ? px(panelStyle.marginBottom) : 999
        };
      });
      if (analyticsDensity.kpiHeight > 90
        || analyticsDensity.workMetricHeight > 74
        || analyticsDensity.focusHeight > 58
        || analyticsDensity.panelPaddingTop > 10
        || analyticsDensity.panelMarginBottom > 8) {
        report.failures.push({ width, type: "analytics-compact-density", analyticsDensity });
      }
      const analyticsModelState = await page.evaluate(() => {
        const numberFrom = (value) => Number(String(value || "").replace(/[^0-9-]/g, "")) || 0;
        const cards = [...document.querySelectorAll(".analytics-kpi")];
        const values = Object.fromEntries(cards.map((card) => [
          card.querySelector("span:not(.analytics-kpi-icon)")?.textContent?.trim() || "",
          numberFrom(card.querySelector("strong")?.textContent)
        ]));
        const metrics = [...document.querySelectorAll(".analytics-work .metric")];
        const conversionMetric = metrics.find((metric) => metric.querySelector(".metric-label")?.textContent?.trim() === "Конверсия");
        const expenseButton = document.querySelector(".analytics-add-expense");
        const expenseRect = expenseButton?.getBoundingClientRect();
        return {
          values,
          conversion: numberFrom(conversionMetric?.querySelector(".metric-value")?.textContent),
          weekdays: document.querySelectorAll(".analytics-weekdays > span").length,
          bars: document.querySelectorAll(".analytics-chart-panel .bar-wrap").length,
          barWidths: [...document.querySelectorAll(".analytics-chart-panel .bar")].map((bar) => Math.round(bar.getBoundingClientRect().width)),
          hasSources: Boolean([...document.querySelectorAll(".analytics-list-panel .panel-title")].find((node) => node.textContent.includes("Источники заявок"))),
          expenseButtonHeight: expenseRect ? Math.round(expenseRect.height) : 0,
          expenseButtonWidth: expenseRect ? Math.round(expenseRect.width) : 0,
          expenseButtonBackground: expenseButton ? getComputedStyle(expenseButton).backgroundColor : "missing",
          expenseButtonColor: expenseButton ? getComputedStyle(expenseButton).color : "missing",
          pageTitle: document.querySelector(".analytics-content .page-head h1")?.textContent?.trim() || "",
          pageTitleWhiteSpace: getComputedStyle(document.querySelector(".analytics-content .page-head h1")).whiteSpace,
          pageTitleScrollWidth: document.querySelector(".analytics-content .page-head h1")?.scrollWidth || 0,
          pageTitleClientWidth: document.querySelector(".analytics-content .page-head h1")?.clientWidth || 0,
          pageTitleFontSize: parseFloat(getComputedStyle(document.querySelector(".analytics-content .page-head h1")).fontSize) || 0,
          pageLead: document.querySelector(".analytics-content .page-head .lead")?.textContent?.trim() || ""
        };
      });
      if (analyticsModelState.values["Получено от клиентов"] !== 10400
        || analyticsModelState.values["Потрачено"] !== 4100
        || analyticsModelState.values["Заработал"] !== 5050
        || analyticsModelState.values["Средний чек"] !== 8900
        || analyticsModelState.conversion !== 33
        || analyticsModelState.weekdays !== 7
        || analyticsModelState.bars !== 2
        || analyticsModelState.barWidths.some((widthValue) => widthValue < 20 || widthValue > 36)
        || !analyticsModelState.hasSources
        || analyticsModelState.expenseButtonHeight < 44
        || analyticsModelState.expenseButtonWidth < 44
        || analyticsModelState.expenseButtonWidth > 50
        || analyticsModelState.pageTitleWhiteSpace !== "nowrap"
        || (width <= 340 && analyticsModelState.pageTitleScrollWidth > analyticsModelState.pageTitleClientWidth + 1)
        || (width <= 340 && analyticsModelState.pageTitleFontSize < 18)
        || analyticsModelState.expenseButtonBackground !== "rgb(13, 20, 25)"
        || analyticsModelState.expenseButtonColor !== "rgb(255, 118, 92)"
        || analyticsModelState.pageTitle !== "Аналитический центр"
        || analyticsModelState.pageLead !== "Финансы, эффективность, клиенты и склад") {
        report.failures.push({ width, type: "analytics-product-model", analyticsModelState });
      }

      await page.locator('[data-analytics-period="custom"]').click();
      await page.waitForTimeout(60);
      const analyticsRangeSurface = await page.evaluate(() => {
        const modal = document.querySelector(".legacy-analytics-range-modal");
        const field = modal?.querySelector(".field");
        const cancel = modal?.querySelector(".legacy-dark-button");
        const close = modal?.querySelector(".legacy-range-head > button");
        const closeRect = close?.getBoundingClientRect();
        const rangeGrid = modal?.querySelector(".legacy-range-grid");
        const rangeRect = rangeGrid?.getBoundingClientRect();
        const rangeRects = [...(rangeGrid?.querySelectorAll("label") || [])].map((node) => node.getBoundingClientRect());
        return {
          modal: modal ? getComputedStyle(modal).backgroundColor : "missing",
          field: field ? getComputedStyle(field).backgroundColor : "missing",
          cancel: cancel ? getComputedStyle(cancel).backgroundColor : "missing",
          closeWidth: closeRect ? Math.round(closeRect.width) : 0,
          closeHeight: closeRect ? Math.round(closeRect.height) : 0,
          rangeWidth: Math.round(rangeRect?.width || 0),
          rangeFieldWidths: rangeRects.map((rect) => Math.round(rect.width)),
          rangeFieldTops: rangeRects.map((rect) => Math.round(rect.top))
        };
      });
      if (analyticsRangeSurface.modal !== "rgb(6, 11, 15)"
        || analyticsRangeSurface.field !== "rgb(9, 15, 20)"
        || analyticsRangeSurface.cancel !== "rgb(10, 17, 22)"
        || analyticsRangeSurface.closeWidth < 44
        || analyticsRangeSurface.closeHeight < 44
        || analyticsRangeSurface.rangeFieldWidths.some((value) => value < analyticsRangeSurface.rangeWidth - 2)
        || analyticsRangeSurface.rangeFieldTops.length !== 2
        || analyticsRangeSurface.rangeFieldTops[1] <= analyticsRangeSurface.rangeFieldTops[0]) {
        report.failures.push({ width, type: "analytics-range-deep-dark", analyticsRangeSurface });
      }
      report.results.push(await shot(page, width, "analytics-range", false));
      await page.locator(".legacy-analytics-range-modal [data-close-modal]").last().click();

      await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list" }));
      const warehousePageSurfaces = await page.evaluate(() => {
        const actionButtons = [...document.querySelectorAll(".legacy-stock-actions-v2 button")].slice(0, 4);
        const actionRects = actionButtons.map((button) => button.getBoundingClientRect());
        const filterGrid = document.querySelector(".warehouse-filter-grid");
        const filterGridRect = filterGrid?.getBoundingClientRect();
        const filterRects = [...document.querySelectorAll(".warehouse-filter-grid > .warehouse-filter-control")].map((node) => node.getBoundingClientRect());
        const stockMain = document.querySelector(".legacy-stock-main");
        const stockCopy = document.querySelector(".legacy-stock-copy");
        const stockQty = document.querySelector(".legacy-stock-qty");
        const stockTitle = document.querySelector(".legacy-stock-copy strong");
        const stockMainRect = stockMain?.getBoundingClientRect();
        const stockCopyRect = stockCopy?.getBoundingClientRect();
        const stockQtyRect = stockQty?.getBoundingClientRect();
        const stockTitleRect = stockTitle?.getBoundingClientRect();
        return {
          group: getComputedStyle(document.querySelector(".legacy-warehouse-group")).backgroundColor,
          stock: getComputedStyle(document.querySelector(".legacy-stock-card-v2")).backgroundColor,
          action: getComputedStyle(document.querySelector(".legacy-stock-actions-v2 button")).backgroundColor,
          actionWidths: actionRects.map((rect) => Math.round(rect.width)),
          actionTops: actionRects.map((rect) => Math.round(rect.top)),
          filters: [...document.querySelectorAll("#warehouse-filter-select option")].map((option) => option.value),
          techGroups: [...document.querySelectorAll(".warehouse-tech-group > summary .legacy-group-copy strong")].map((node) => node.textContent.trim()),
          categoryBlocks: document.querySelectorAll(".warehouse-category-block").length,
          hasTechFilter: Boolean(document.querySelector("#warehouse-tech-filter")),
          hasCategoryFilter: Boolean(document.querySelector("#warehouse-category-filter")),
          addWidth: Math.round(document.querySelector(".legacy-warehouse-add-wide")?.getBoundingClientRect().width || 0),
          pageWidth: Math.round(document.querySelector(".legacy-warehouse-page")?.getBoundingClientRect().width || 0),
          addHeight: Math.round(document.querySelector(".legacy-warehouse-add-wide")?.getBoundingClientRect().height || 0),
          addText: document.querySelector(".legacy-warehouse-add-wide")?.textContent?.trim() || "",
          filterGridWidth: Math.round(filterGridRect?.width || 0),
          filterWidths: filterRects.map((rect) => Math.round(rect.width)),
          filterTops: filterRects.map((rect) => Math.round(rect.top)),
          stockMainHeight: Math.round(stockMainRect?.height || 0),
          stockCopyRight: Math.round(stockCopyRect?.right || 0),
          stockQtyLeft: Math.round(stockQtyRect?.left || 0),
          stockQtyRight: Math.round(stockQtyRect?.right || 0),
          stockTitleHeight: Math.round(stockTitleRect?.height || 0),
          filterIconTransforms: [...document.querySelectorAll(".warehouse-filter-control > span > .ui-icon")].map((node) => getComputedStyle(node).transform),
          groupChevronTransforms: [...document.querySelectorAll(".warehouse-tech-group > summary .legacy-group-chevron")].slice(0, 2).map((node) => getComputedStyle(node).transform)
        };
      });
      if (warehousePageSurfaces.group !== "rgb(7, 12, 16)"
        || warehousePageSurfaces.stock !== "rgb(6, 11, 15)"
        || warehousePageSurfaces.action !== "rgb(9, 15, 20)"
        || !warehousePageSurfaces.filters.includes("out")
        || !warehousePageSurfaces.filters.includes("reserved")
        || !warehousePageSurfaces.filters.includes("archived")
        || !warehousePageSurfaces.techGroups.includes("Холодильник")
        || warehousePageSurfaces.categoryBlocks < 1
        || !warehousePageSurfaces.hasTechFilter
        || !warehousePageSurfaces.hasCategoryFilter
        || warehousePageSurfaces.actionWidths.length !== 4
        || warehousePageSurfaces.actionWidths.some((value) => value < 100)
        || Math.max(...warehousePageSurfaces.actionWidths) - Math.min(...warehousePageSurfaces.actionWidths) > 2
        || Math.abs(warehousePageSurfaces.actionTops[0] - warehousePageSurfaces.actionTops[1]) > 2
        || Math.abs(warehousePageSurfaces.actionTops[2] - warehousePageSurfaces.actionTops[3]) > 2
        || warehousePageSurfaces.actionTops[2] <= warehousePageSurfaces.actionTops[0]
        || warehousePageSurfaces.addWidth < warehousePageSurfaces.pageWidth - 34
        || warehousePageSurfaces.addHeight < 48
        || !warehousePageSurfaces.addText.includes("Новая позиция")
        || warehousePageSurfaces.filterWidths.some((value) => value < warehousePageSurfaces.filterGridWidth - 2)
        || warehousePageSurfaces.filterTops.some((top, index, list) => index > 0 && top <= list[index - 1])
        || warehousePageSurfaces.filterIconTransforms.length !== 4
        || warehousePageSurfaces.filterIconTransforms.some((value) => value === "none")
        || warehousePageSurfaces.groupChevronTransforms.length < 2
        || warehousePageSurfaces.groupChevronTransforms[0] === "none"
        || warehousePageSurfaces.groupChevronTransforms[0] === warehousePageSurfaces.groupChevronTransforms[1]) {
        report.failures.push({ width, type: "warehouse-deep-dark-page", warehousePageSurfaces });
      }
      if (width <= 340 && (
        warehousePageSurfaces.stockMainHeight > 90
        || warehousePageSurfaces.stockQtyLeft < warehousePageSurfaces.stockCopyRight - 2
        || warehousePageSurfaces.stockTitleHeight > 38
      )) {
        report.failures.push({ width, type: "warehouse-320-compact-card", warehousePageSurfaces });
      }
      if (width === 390) {
        await page.locator("#warehouse-tech-filter").selectOption({ label: "Холодильник" });
        await page.waitForTimeout(50);
        const techFiltered = await page.evaluate(() => ({
          cards: [...document.querySelectorAll("[data-stock-detail]")].map((node) => node.dataset.stockDetail),
          techValue: document.querySelector("#warehouse-tech-filter")?.value || ""
        }));
        if (techFiltered.techValue !== "Холодильник" || techFiltered.cards.some((id) => !["w1","w3"].includes(id)) || techFiltered.cards.length !== 2) {
          report.failures.push({ width, type: "warehouse-tech-filter", techFiltered });
        }

        await page.locator("#warehouse-category-filter").selectOption({ label: "Расходники" });
        await page.waitForTimeout(50);
        const categoryFiltered = await page.evaluate(() => ({
          cards: [...document.querySelectorAll("[data-stock-detail]")].map((node) => node.dataset.stockDetail),
          categoryValue: document.querySelector("#warehouse-category-filter")?.value || ""
        }));
        if (categoryFiltered.categoryValue !== "Расходники" || categoryFiltered.cards.length !== 1 || categoryFiltered.cards[0] !== "w3") {
          report.failures.push({ width, type: "warehouse-category-filter", categoryFiltered });
        }

        await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list" }));
      }
      await page.locator("[data-stock-detail]").first().click();
      const stockDetailSurface = await page.evaluate(() => {
        const incoming = document.querySelector(".stock-detail-actions .incoming");
        const outgoing = document.querySelector(".stock-detail-actions .outgoing");
        const correct = document.querySelector(".stock-detail-actions .stock-detail-correct");
        const archive = document.querySelector(".stock-detail-actions .stock-detail-archive");
        const incomingRect = incoming?.getBoundingClientRect();
        const correctRect = correct?.getBoundingClientRect();
        const archiveRect = archive?.getBoundingClientRect();
        return {
          modal: getComputedStyle(document.querySelector(".stock-detail-modal")).backgroundColor,
          hero: getComputedStyle(document.querySelector(".stock-detail-hero")).backgroundColor,
          primaryKpi: getComputedStyle(document.querySelector(".stock-detail-kpis > .primary")).backgroundColor,
          reservedKpi: getComputedStyle(document.querySelector(".stock-detail-kpis > .reserved")).backgroundColor,
          minimumKpi: getComputedStyle(document.querySelector(".stock-detail-kpis > .minimum")).backgroundColor,
          incoming: incoming ? getComputedStyle(incoming).backgroundColor : "missing",
          outgoing: outgoing ? getComputedStyle(outgoing).backgroundColor : "missing",
          correct: correct ? getComputedStyle(correct).backgroundColor : "missing",
          archive: archive ? getComputedStyle(archive).backgroundColor : "missing",
          incomingWidth: incomingRect ? Math.round(incomingRect.width) : 0,
          correctWidth: correctRect ? Math.round(correctRect.width) : 0,
          archiveWidth: archiveRect ? Math.round(archiveRect.width) : 0
        };
      });
      if (stockDetailSurface.modal !== "rgb(3, 7, 10)"
        || stockDetailSurface.hero !== "rgb(6, 11, 15)"
        || stockDetailSurface.primaryKpi !== "rgb(7, 17, 12)"
        || stockDetailSurface.reservedKpi !== "rgb(8, 16, 25)"
        || stockDetailSurface.minimumKpi !== "rgb(19, 16, 6)"
        || stockDetailSurface.incoming !== "rgb(7, 19, 13)"
        || stockDetailSurface.outgoing !== "rgb(22, 9, 12)"
        || stockDetailSurface.correct !== "rgb(16, 13, 6)"
        || stockDetailSurface.archive !== "rgb(8, 16, 25)"
        || stockDetailSurface.incomingWidth < 100
        || stockDetailSurface.correctWidth < stockDetailSurface.incomingWidth * 1.8
        || stockDetailSurface.archiveWidth < stockDetailSurface.incomingWidth * 1.8) {
        report.failures.push({ width, type: "stock-detail-hierarchy", stockDetailSurface });
      }

      const stockDetailDensity = await page.evaluate(() => {
        const hero = document.querySelector(".stock-detail-hero");
        const title = document.querySelector(".stock-detail-hero h2");
        const kpi = document.querySelector(".stock-detail-kpis > div");
        const incoming = document.querySelector(".stock-detail-actions .incoming");
        const correct = document.querySelector(".stock-detail-actions .stock-detail-correct");
        const archive = document.querySelector(".stock-detail-actions .stock-detail-archive");
        const movement = document.querySelector(".stock-detail-movement");
        const titleStyle = title ? getComputedStyle(title) : null;
        const titleLineHeight = titleStyle ? parseFloat(titleStyle.lineHeight) || 0 : 0;
        const titleHeight = title?.getBoundingClientRect().height || 0;
        return {
          heroHeight: Math.round(hero?.getBoundingClientRect().height || 0),
          heroTitleLines: titleLineHeight > 0 ? Math.max(1, Math.round(titleHeight / titleLineHeight)) : 1,
          kpiHeight: Math.round(kpi?.getBoundingClientRect().height || 0),
          incomingHeight: Math.round(incoming?.getBoundingClientRect().height || 0),
          correctHeight: Math.round(correct?.getBoundingClientRect().height || 0),
          archiveHeight: Math.round(archive?.getBoundingClientRect().height || 0),
          movementHeight: Math.round(movement?.getBoundingClientRect().height || 0)
        };
      });
      const stockDetailHeroMax = stockDetailDensity.heroTitleLines > 1 ? 92 : (width <= 340 ? 82 : 76);
      if (stockDetailDensity.heroHeight > stockDetailHeroMax
        || stockDetailDensity.kpiHeight > 66
        || stockDetailDensity.incomingHeight < 44
        || stockDetailDensity.incomingHeight > 54
        || stockDetailDensity.correctHeight < 44
        || stockDetailDensity.correctHeight > 52
        || stockDetailDensity.archiveHeight < 44
        || stockDetailDensity.archiveHeight > 48
        || stockDetailDensity.movementHeight > 50) {
        report.failures.push({ width, type: "stock-detail-compact-density", stockDetailDensity, stockDetailHeroMax });
      }
      report.results.push(await shot(page, width, "stock-detail", false));
      await page.keyboard.press("Escape");
      await page.locator('[data-action="new-stock"]').click();
      const stockEditorSurface = await page.evaluate(() => {
        const minimum = document.querySelector('.stock-editor-modal [name="min"]')?.closest(".form-group");
        const stockTech = document.querySelector('.stock-editor-modal [name="stockTech"]')?.closest(".form-group");
        const category = document.querySelector('.stock-editor-modal [name="category"]')?.closest(".form-group");
        const grid = minimum?.closest(".form-grid");
        return {
          modal: getComputedStyle(document.querySelector(".stock-editor-modal")).backgroundColor,
          section: getComputedStyle(document.querySelector(".stock-editor-section")).backgroundColor,
          field: getComputedStyle(document.querySelector(".stock-editor-modal .field")).backgroundColor,
          compat: getComputedStyle(document.querySelector(".stock-editor-compat-details")).backgroundColor,
          hasStockTech: Boolean(document.querySelector('.stock-editor-modal [name="stockTech"]')),
          categoryRequired: Boolean(document.querySelector('.stock-editor-modal [name="category"]')?.required),
          minimumWidth: Math.round(minimum?.getBoundingClientRect().width || 0),
          stockTechWidth: Math.round(stockTech?.getBoundingClientRect().width || 0),
          categoryWidth: Math.round(category?.getBoundingClientRect().width || 0),
          gridWidth: Math.round(grid?.getBoundingClientRect().width || 0)
        };
      });
      if (stockEditorSurface.modal !== "rgb(3, 7, 10)"
        || stockEditorSurface.section !== "rgb(6, 11, 15)"
        || stockEditorSurface.field !== "rgb(9, 15, 20)"
        || stockEditorSurface.compat !== "rgb(9, 15, 20)"
        || !stockEditorSurface.hasStockTech
        || !stockEditorSurface.categoryRequired
        || stockEditorSurface.minimumWidth < stockEditorSurface.gridWidth * 0.92
        || stockEditorSurface.stockTechWidth < stockEditorSurface.gridWidth * 0.92
        || stockEditorSurface.categoryWidth < stockEditorSurface.gridWidth * 0.92) {
        report.failures.push({ width, type: "stock-editor-deep-dark", stockEditorSurface });
      }

      const stockEditorDensity = await page.evaluate(() => {
        const head = document.querySelector(".stock-editor-head");
        const body = document.querySelector(".stock-editor-body");
        const section = document.querySelector(".stock-editor-section");
        const field = document.querySelector(".stock-editor-modal .field");
        const compat = document.querySelector(".stock-editor-compat-details > summary");
        const bodyStyle = body ? getComputedStyle(body) : null;
        const sectionStyle = section ? getComputedStyle(section) : null;
        const px = (value) => Number.parseFloat(value || "0") || 0;
        return {
          headHeight: Math.round(head?.getBoundingClientRect().height || 0),
          bodyGap: bodyStyle ? px(bodyStyle.gap) : 999,
          sectionPaddingTop: sectionStyle ? px(sectionStyle.paddingTop) : 999,
          fieldHeight: Math.round(field?.getBoundingClientRect().height || 0),
          compatHeight: Math.round(compat?.getBoundingClientRect().height || 0)
        };
      });
      if (stockEditorDensity.headHeight > 66
        || stockEditorDensity.bodyGap > 8
        || stockEditorDensity.sectionPaddingTop > 9
        || stockEditorDensity.fieldHeight < 44
        || stockEditorDensity.fieldHeight > 48
        || stockEditorDensity.compatHeight < 44
        || stockEditorDensity.compatHeight > 48) {
        report.failures.push({ width, type: "stock-editor-compact-density", stockEditorDensity });
      }
      report.results.push(await shot(page, width, "stock-editor", false));
      if (width === 390) {
        await page.locator('.stock-editor-modal [name="name"]').fill("Датчик температуры 10 кОм");
        await page.locator('.stock-editor-modal [name="stockTech"]').selectOption("Холодильник");
        await page.locator('.stock-editor-modal [name="category"]').fill("Датчики");
        await page.locator('.stock-editor-modal [name="quantity"]').fill("2");
        await page.locator('.stock-editor-modal [name="initialPurchaseTotal"]').fill("1000");
        await page.locator('.stock-editor-modal button[type="submit"]').click();
        await page.waitForTimeout(70);
        const hierarchyStored = await readStoredData(page);
        const createdStock = hierarchyStored.warehouse.find((item) => item.name === "Датчик температуры 10 кОм");
        if (createdStock?.stockTech !== "Холодильник" || createdStock?.category !== "Датчики") {
          report.failures.push({ width, type: "warehouse-hierarchy-save", createdStock });
        }
        await writeSeed(page, seed);
        await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list" }));
      } else {
        await page.keyboard.press("Escape");
      }

      await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list" }));
      await page.locator('[data-stock-detail="w1"]').evaluate((node) => {
        const details = node.closest("details");
        if (details) details.open = true;
      });
      await page.locator('[data-stock="in"][data-id="w1"]').click();
      await page.waitForTimeout(60);
      const stockAdjustSurface = await page.evaluate(() => {
        const modal = document.querySelector(".stock-adjust-modal");
        const balance = modal?.querySelector(".stock-adjust-balance");
        const field = modal?.querySelector(".stock-adjust-field .field");
        const cancel = modal?.querySelector(".stock-adjust-actions .legacy-dark-button");
        const close = modal?.querySelector(".stock-adjust-head > button");
        const closeRect = close?.getBoundingClientRect();
        return {
          modal: modal ? getComputedStyle(modal).backgroundColor : "missing",
          balance: balance ? getComputedStyle(balance).backgroundColor : "missing",
          field: field ? getComputedStyle(field).backgroundColor : "missing",
          cancel: cancel ? getComputedStyle(cancel).backgroundColor : "missing",
          closeWidth: closeRect ? Math.round(closeRect.width) : 0,
          closeHeight: closeRect ? Math.round(closeRect.height) : 0
        };
      });
      if (stockAdjustSurface.modal !== "rgb(6, 11, 15)"
        || stockAdjustSurface.balance !== "rgb(9, 15, 20)"
        || !["rgb(9, 15, 20)", "rgb(10, 17, 22)", "rgb(11, 17, 22)", "rgb(11, 18, 23)"].includes(stockAdjustSurface.field)
        || stockAdjustSurface.cancel !== "rgb(10, 17, 22)"
        || stockAdjustSurface.closeWidth < 44
        || stockAdjustSurface.closeHeight < 44) {
        report.failures.push({ width, type: "stock-adjust-deep-dark", stockAdjustSurface });
      }
      report.results.push(await shot(page, width, "stock-adjust", false));

      if (width === 390) {
        await page.locator('.stock-adjust-modal [name="amount"]').fill("2");
        await page.locator('.stock-adjust-modal [name="totalCost"]').fill("10000");
        await page.locator('.stock-adjust-modal [name="comment"]').fill("Партия 2");
        await page.locator('.stock-adjust-modal button[type="submit"]').click();
        await page.locator(".stock-adjust-modal").waitFor({ state: "detached" });
        await page.waitForTimeout(20);

        const afterPurchase = await readStoredData(page);
        const purchasedItem = afterPurchase.warehouse.find((item) => item.id === "w1");
        const purchaseExpense = [...afterPurchase.expenses].reverse().find((item) => item.source === "stock_purchase" && item.warehouseId === "w1");
        const purchaseMovement = [...afterPurchase.warehouse_movements].reverse().find((item) => item.type === "purchase_in" && item.warehouseId === "w1");
        if (Number(purchasedItem?.quantity) !== 5
          || purchasedItem?.batches?.length !== 2
          || Number(purchasedItem?.batches?.[0]?.remainingQty) !== 3
          || Number(purchasedItem?.batches?.[0]?.unitCost) !== 3100
          || Number(purchasedItem?.batches?.[1]?.remainingQty) !== 2
          || Number(purchasedItem?.batches?.[1]?.unitCost) !== 5000
          || Number(purchaseExpense?.amount) !== 10000
          || Number(purchaseMovement?.totalCost) !== 10000) {
          report.failures.push({
            width,
            type: "stock-purchase-batch",
            item: purchasedItem,
            purchaseExpense,
            purchaseMovement
          });
        }

        await page.locator('[data-stock-detail="w1"]').evaluate((node) => {
          const details = node.closest("details");
          if (details) details.open = true;
        });
        await page.locator('[data-stock="out"][data-id="w1"]').click();
        const firstFifoAmount = page.locator('.stock-adjust-modal [name="amount"]');
        await firstFifoAmount.fill("3");
        const firstFifoComment = page.locator('.stock-adjust-modal [name="comment"]');
        const firstFifoReasonReady = await fillConfirmed(firstFifoComment, "Тест FIFO · первая партия");
        if (!firstFifoReasonReady) report.failures.push({ width, type: "qa-input-fill", field: "first-fifo-comment" });
        const firstFifoMax = await firstFifoAmount.getAttribute("max");
        const firstFifoLocation = await page.locator('.stock-adjust-modal [name="locationId"]').inputValue();
        const firstFifoBeforeText = await page.locator("#stock-adjust-before").innerText();
        await page.locator('.stock-adjust-modal button[type="submit"]').click();
        let firstFifoClosed = true;
        try {
          await page.locator(".stock-adjust-modal").waitFor({ state: "detached", timeout: 1500 });
        } catch {
          firstFifoClosed = false;
          const diagnosticData = await readStoredData(page);
          const diagnosticItem = diagnosticData.warehouse.find((item) => item.id === "w1");
          const diagnosticOrder = diagnosticData.orders.find((item) => item.id === "0060");
          const toastText = await page.locator("#toast").innerText().catch(() => "");
          report.failures.push({
            width,
            type: "stock-fifo-first-submit",
            amount: "3",
            max: firstFifoMax,
            locationId: firstFifoLocation,
            beforeText: firstFifoBeforeText,
            toast: toastText,
            quantity: diagnosticItem?.quantity,
            locationBalances: diagnosticItem?.locationBalances,
            batches: diagnosticItem?.batches,
            reservedMaterial: diagnosticOrder?.materials?.find((item) => item.warehouseId === "w1")
          });
          await page.locator('.stock-adjust-modal [data-close-modal]').first().click().catch(() => {});
          await page.locator(".stock-adjust-modal").waitFor({ state: "detached", timeout: 1500 }).catch(() => {});
        }
        await page.waitForTimeout(20);

        if (firstFifoClosed) {
          await page.locator('[data-stock-detail="w1"]').evaluate((node) => {
            const details = node.closest("details");
            if (details) details.open = true;
          });
          await page.locator('[data-stock="out"][data-id="w1"]').click();
        }
        let secondFifoClosed = false;
        if (firstFifoClosed) {
          const secondFifoAmount = page.locator('.stock-adjust-modal [name="amount"]');
          await secondFifoAmount.fill("0.5");
          const secondFifoComment = page.locator('.stock-adjust-modal [name="comment"]');
          const secondFifoReasonReady = await fillConfirmed(secondFifoComment, "Тест FIFO · вторая партия");
          if (!secondFifoReasonReady) report.failures.push({ width, type: "qa-input-fill", field: "second-fifo-comment" });
          const secondFifoMax = await secondFifoAmount.getAttribute("max");
          await page.locator('.stock-adjust-modal button[type="submit"]').click();
          secondFifoClosed = true;
          try {
            await page.locator(".stock-adjust-modal").waitFor({ state: "detached", timeout: 1500 });
          } catch {
            secondFifoClosed = false;
            const diagnosticData = await readStoredData(page);
            const diagnosticItem = diagnosticData.warehouse.find((item) => item.id === "w1");
            const diagnosticOrder = diagnosticData.orders.find((item) => item.id === "0060");
            const toastText = await page.locator("#toast").innerText().catch(() => "");
            report.failures.push({
              width,
              type: "stock-fifo-submit",
              amount: "0.5",
              max: secondFifoMax,
              toast: toastText,
              quantity: diagnosticItem?.quantity,
              locationBalances: diagnosticItem?.locationBalances,
              batches: diagnosticItem?.batches,
              reservedMaterial: diagnosticOrder?.materials?.find((item) => item.warehouseId === "w1")
            });
            await page.locator('.stock-adjust-modal [data-close-modal]').first().click().catch(() => {});
            await page.locator(".stock-adjust-modal").waitFor({ state: "detached", timeout: 1500 }).catch(() => {});
          }
        }
        await page.waitForTimeout(30);

        const afterFifo = await readStoredData(page);
        const fifoItem = afterFifo.warehouse.find((item) => item.id === "w1");
        const fifoMovements = [...afterFifo.warehouse_movements]
          .filter((item) => item.type === "manual_out" && item.warehouseId === "w1")
          .slice(-2);
        const firstFifo = fifoMovements[0];
        const secondFifo = fifoMovements[1];
        const firstAllocations = firstFifo?.allocations || [];
        const secondAllocations = secondFifo?.allocations || [];
        if (firstFifoClosed && secondFifoClosed && (Number(fifoItem?.quantity) !== 1.5
          || Number(fifoItem?.batches?.[0]?.remainingQty) !== 0
          || Number(fifoItem?.batches?.[1]?.remainingQty) !== 1.5
          || fifoMovements.length !== 2
          || firstAllocations.length !== 1
          || Number(firstAllocations[0]?.qty) !== 3
          || Number(firstAllocations[0]?.unitCost) !== 3100
          || Number(firstFifo?.batchCost) !== 9300
          || firstFifo?.comment !== "Тест FIFO · первая партия"
          || secondAllocations.length !== 1
          || Number(secondAllocations[0]?.qty) !== 0.5
          || Number(secondAllocations[0]?.unitCost) !== 5000
          || Number(secondFifo?.batchCost) !== 2500
          || secondFifo?.comment !== "Тест FIFO · вторая партия")) {
          report.failures.push({ width, type: "stock-fifo-writeoff", item: fifoItem, fifoMovements });
        }

        await writeSeed(page, seed);
        await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list" }));

        const locationSeed = await readStoredData(page);
        locationSeed.storage_locations.push({ id: "location-car", name: "Машина", archived: false, system: false });
        await writeSeed(page, locationSeed);
        await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list" }));
        await page.locator('[data-stock-detail="w1"]').evaluate((node) => {
          const details = node.closest("details");
          if (details) details.open = true;
        });
        await page.locator('[data-stock-detail="w1"]').click();
        await page.locator('[data-stock-detail-action="transfer"]').click();
        await page.locator('.stock-transfer-modal [name="toLocationId"]').selectOption("location-car");
        await page.locator('.stock-transfer-modal [name="amount"]').fill("1");
        report.results.push(await shot(page, width, "stock-transfer", false));
        await page.locator('.stock-transfer-modal button[type="submit"]').click();
        await page.locator(".stock-transfer-modal").waitFor({ state: "detached" });
        const afterTransfer = await readStoredData(page);
        const transferredItem = afterTransfer.warehouse.find((item) => item.id === "w1");
        const transferMovement = [...afterTransfer.warehouse_movements].reverse().find((item) => item.type === "transfer" && item.warehouseId === "w1");
        if (Number(transferredItem?.quantity) !== 3
          || Number(transferredItem?.locationBalances?.find((entry) => entry.locationId === "location-unassigned")?.qty) !== 2
          || Number(transferredItem?.locationBalances?.find((entry) => entry.locationId === "location-car")?.qty) !== 1
          || transferMovement?.fromLocationId !== "location-unassigned"
          || transferMovement?.toLocationId !== "location-car") {
          report.failures.push({ width, type: "stock-location-transfer", transferredItem, transferMovement });
        }

        await writeSeed(page, seed);
        await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list" }));

        const beforeCorrection = await readStoredData(page);
        const expenseCountBeforeCorrection = beforeCorrection.expenses.length;
        await page.locator('[data-stock-detail="w1"]').evaluate((node) => {
          const details = node.closest("details");
          if (details) details.open = true;
        });
        await page.locator('[data-stock-detail="w1"]').click();
        await page.locator('[data-stock-detail-action="correct"]').click();
        const correctionQuantity = page.locator('.stock-correction-modal [name="quantity"]');
        const correctionComment = page.locator('.stock-correction-modal [name="comment"]');
        const physicalBeforeCorrection = Number(await correctionQuantity.inputValue()) || 0;
        await correctionQuantity.fill(String(physicalBeforeCorrection + 1));
        const correctionReasonReady = await fillConfirmed(correctionComment, "Контрольный пересчёт");
        if (!correctionReasonReady) report.failures.push({ width, type: "qa-input-fill", field: "stock-correction-comment" });
        report.results.push(await shot(page, width, "stock-correction", false));
        if (await correctionComment.inputValue() !== "Контрольный пересчёт") {
          await fillConfirmed(correctionComment, "Контрольный пересчёт");
        }
        const correctionPreSubmit = await page.evaluate(() => {
          const form = document.querySelector(".stock-correction-modal");
          const quantity = form?.querySelector('[name="quantity"]');
          const comment = form?.querySelector('[name="comment"]');
          const place = form?.querySelector('[name="locationId"]');
          return {
            valid: form?.checkValidity?.() ?? null,
            quantity: quantity?.value ?? "",
            min: quantity?.min ?? "",
            comment: comment?.value ?? "",
            locationId: place?.value ?? ""
          };
        });
        await page.locator('.stock-correction-modal button[type="submit"]').click();
        let correctionClosed = true;
        try {
          await page.locator(".stock-correction-modal").waitFor({ state: "detached", timeout: 1500 });
        } catch {
          correctionClosed = false;
          const diagnosticData = await readStoredData(page);
          const diagnosticItem = diagnosticData.warehouse.find((item) => item.id === "w1");
          const toastText = await page.locator("#toast").innerText().catch(() => "");
          const correctionAfterClick = await page.evaluate(() => {
            const form = document.querySelector(".stock-correction-modal");
            return {
              quantity: form?.querySelector('[name="quantity"]')?.value ?? "",
              comment: form?.querySelector('[name="comment"]')?.value ?? "",
              diff: form?.querySelector("#stock-correction-diff")?.textContent ?? ""
            };
          });
          report.failures.push({
            width,
            type: "stock-correction-submit",
            preSubmit: correctionPreSubmit,
            afterClick: correctionAfterClick,
            toast: toastText,
            quantity: diagnosticItem?.quantity,
            locationBalances: diagnosticItem?.locationBalances,
            batches: diagnosticItem?.batches
          });
          await page.locator('.stock-correction-modal [data-close-modal]').first().click().catch(() => {});
          await page.locator(".stock-correction-modal").waitFor({ state: "detached", timeout: 1500 }).catch(() => {});
        }
        await page.waitForTimeout(20);
        const afterCorrection = await readStoredData(page);
        const correctedItem = afterCorrection.warehouse.find((item) => item.id === "w1");
        const correctionMovement = [...afterCorrection.warehouse_movements].reverse().find((item) => item.type === "correction_in" && item.warehouseId === "w1");
        if (correctionClosed && (Number(correctedItem?.quantity) !== physicalBeforeCorrection + 1
          || Number(correctionMovement?.before) !== physicalBeforeCorrection
          || Number(correctionMovement?.after) !== physicalBeforeCorrection + 1
          || Number(correctionMovement?.difference) !== 1
          || correctionMovement?.comment !== "Контрольный пересчёт"
          || afterCorrection.expenses.length !== expenseCountBeforeCorrection)) {
          report.failures.push({ width, type: "stock-correction-history", correctedItem, correctionMovement, expenseCountBeforeCorrection, expenseCountAfter: afterCorrection.expenses.length });
        }

        await writeSeed(page, seed);
        await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list" }));
      } else {
        await page.locator(".stock-adjust-actions [data-close-modal]").click();
      }

      await setState(page, uiState({ activePage: "warehouse", warehouseSection: "movements" }));
      const movementSurface = await page.evaluate(() => {
        const incoming = document.querySelector(".movement-card.incoming");
        const outgoing = document.querySelector(".movement-card.outgoing");
        return {
          filter: getComputedStyle(document.querySelector(".movement-filter-chips")).backgroundColor,
          incoming: incoming ? getComputedStyle(incoming).backgroundColor : "missing",
          outgoing: outgoing ? getComputedStyle(outgoing).backgroundColor : "missing",
          incomingLabel: incoming?.querySelector(".movement-copy small")?.textContent || "",
          outgoingLabel: outgoing?.querySelector(".movement-copy small")?.textContent || "",
          inCount: document.querySelector('[data-movement-filter="in"] span')?.textContent || "",
          outCount: document.querySelector('[data-movement-filter="out"] span')?.textContent || "",
          titleStyles: [...document.querySelectorAll(".movement-copy strong")].map((node) => {
            const style = getComputedStyle(node);
            return { whiteSpace: style.whiteSpace, textOverflow: style.textOverflow, lineClamp: style.webkitLineClamp };
          })
        };
      });
      if (movementSurface.filter !== "rgb(6, 11, 15)"
        || movementSurface.incoming !== "rgb(7, 17, 12)"
        || movementSurface.outgoing !== "rgb(20, 9, 11)"
        || !movementSurface.incomingLabel.includes("Приход")
        || !movementSurface.outgoingLabel.includes("Списание")
        || movementSurface.inCount.trim() !== "1"
        || movementSurface.outCount.trim() !== "1"
        || movementSurface.titleStyles.some((style) =>
          style.whiteSpace === "nowrap"
          || style.textOverflow === "ellipsis"
          || style.lineClamp !== "2"
        )) {
        report.failures.push({ width, type: "warehouse-movement-hierarchy", movementSurface });
      }

      const movementDensity = await page.evaluate(() => {
        const card = document.querySelector(".movement-card");
        const icon = card?.querySelector(".movement-icon");
        const copy = card?.querySelector(".movement-copy");
        const value = card?.querySelector(":scope > b");
        const filter = document.querySelector(".movement-filter-chips button");
        const cr = card?.getBoundingClientRect();
        const ir = icon?.getBoundingClientRect();
        const xr = copy?.getBoundingClientRect();
        const vr = value?.getBoundingClientRect();
        const fr = filter?.getBoundingClientRect();
        return {
          cardHeight: Math.round(cr?.height || 0),
          iconWidth: Math.round(ir?.width || 0),
          iconHeight: Math.round(ir?.height || 0),
          filterHeight: Math.round(fr?.height || 0),
          copyLeft: Math.round(xr?.left || 0),
          copyRight: Math.round(xr?.right || 0),
          valueLeft: Math.round(vr?.left || 0),
          valueRight: Math.round(vr?.right || 0),
          cardRight: Math.round(cr?.right || 0),
          cardCenterY: cr ? Math.round(cr.top + cr.height / 2) : 0,
          valueCenterY: vr ? Math.round(vr.top + vr.height / 2) : 0
        };
      });
      const movementCardMax = width <= 340 ? 86 : 82;
      if (movementDensity.cardHeight > movementCardMax
        || movementDensity.iconWidth > 38
        || movementDensity.iconHeight > 38
        || movementDensity.filterHeight < 44
        || movementDensity.valueLeft < movementDensity.copyRight - 1
        || movementDensity.valueRight > movementDensity.cardRight + 1
        || Math.abs(movementDensity.cardCenterY - movementDensity.valueCenterY) > 18) {
        report.failures.push({ width, type: "warehouse-movement-compact-density", movementDensity, movementCardMax });
      }
      report.results.push(await shot(page, width, "warehouse-movements", false));

      await page.locator('[data-movement-filter="in"]').click();
      const incomingFilterState = await page.evaluate(() => ({
        active: document.querySelector('[data-movement-filter="in"]')?.classList.contains("active") || false,
        cards: document.querySelectorAll(".movement-card").length,
        incomingCards: document.querySelectorAll(".movement-card.incoming").length
      }));
      if (!incomingFilterState.active || incomingFilterState.cards !== 1 || incomingFilterState.incomingCards !== 1) {
        report.failures.push({ width, type: "warehouse-movement-filter-in", incomingFilterState });
      }

      await setState(page, uiState({ activePage: "warehouse", warehouseSection: "shopping", warehouseMovementFilter: "all" }));
      const shoppingSurface = await page.evaluate(() => {
        const card = document.querySelector(".shopping-card");
        const need = card?.querySelector(".shopping-need");
        const needRect = need?.getBoundingClientRect();
        return {
          summary: getComputedStyle(document.querySelector(".shopping-summary")).backgroundColor,
          card: card ? getComputedStyle(card).backgroundColor : "missing",
          critical: card?.classList.contains("critical") || false,
          needBackground: need ? getComputedStyle(need).backgroundColor : "missing",
          needWidth: needRect ? Math.round(needRect.width) : 0,
          titleStyle: (() => {
            const node = card?.querySelector(".stock-name");
            const style = node ? getComputedStyle(node) : null;
            return {
              whiteSpace: style?.whiteSpace || "missing",
              textOverflow: style?.textOverflow || "missing",
              lineClamp: style?.webkitLineClamp || "missing"
            };
          })()
        };
      });
      if (shoppingSurface.summary !== "rgb(16, 13, 6)"
        || shoppingSurface.card !== "rgb(22, 9, 12)"
        || !shoppingSurface.critical
        || shoppingSurface.needBackground !== "rgba(255, 102, 112, 0.067)"
        || shoppingSurface.needWidth < 60
        || shoppingSurface.titleStyle.whiteSpace === "nowrap"
        || shoppingSurface.titleStyle.textOverflow === "ellipsis"
        || shoppingSurface.titleStyle.lineClamp !== "2") {
        report.failures.push({ width, type: "warehouse-shopping-hierarchy", shoppingSurface });
      }
      report.results.push(await shot(page, width, "warehouse-shopping", false));

      await setState(page, uiState({ activePage: "more", moreSection: "finance" }));
      const financePageSurface = await page.evaluate(() => ({
        result: getComputedStyle(document.querySelector(".finance-result-hero")).backgroundColor,
        income: getComputedStyle(document.querySelector(".legacy-finance-summary > .income")).backgroundColor,
        expense: getComputedStyle(document.querySelector(".legacy-finance-summary > .expense")).backgroundColor,
        incomeRow: getComputedStyle(document.querySelector(".legacy-finance-row.income")).backgroundColor,
        expenseRow: getComputedStyle(document.querySelector(".legacy-finance-row.expense")).backgroundColor,
        incomeAction: getComputedStyle(document.querySelector('.legacy-finance-actions [data-type="income"]')).backgroundColor,
        expenseAction: getComputedStyle(document.querySelector('.legacy-finance-actions [data-type="expense"]')).backgroundColor,
        incomeActionBorder: getComputedStyle(document.querySelector('.legacy-finance-actions [data-type="income"]')).borderTopColor,
        expenseActionBorder: getComputedStyle(document.querySelector('.legacy-finance-actions [data-type="expense"]')).borderTopColor,
        incomeActionColor: getComputedStyle(document.querySelector('.legacy-finance-actions [data-type="income"]')).color,
        expenseActionColor: getComputedStyle(document.querySelector('.legacy-finance-actions [data-type="expense"]')).color,
        actionsWidth: Math.round(document.querySelector(".legacy-finance-actions")?.getBoundingClientRect().width || 0),
        actionWidths: [...document.querySelectorAll(".legacy-finance-actions > button")].map((node) => Math.round(node.getBoundingClientRect().width)),
        rowTitleFont: getComputedStyle(document.querySelector(".legacy-finance-copy strong")).fontSize
      }));
      if (financePageSurface.result !== "rgb(7, 12, 16)"
        || financePageSurface.income !== "rgb(7, 12, 16)"
        || financePageSurface.expense !== "rgb(7, 12, 16)"
        || financePageSurface.incomeRow !== "rgb(7, 12, 16)"
        || financePageSurface.expenseRow !== "rgb(7, 12, 16)"
        || financePageSurface.incomeAction !== "rgb(13, 20, 25)"
        || financePageSurface.expenseAction !== "rgb(13, 20, 25)"
        || financePageSurface.incomeActionBorder !== "rgb(39, 52, 60)"
        || financePageSurface.expenseActionBorder !== "rgb(39, 52, 60)"
        || financePageSurface.incomeActionColor !== "rgb(101, 217, 149)"
        || financePageSurface.expenseActionColor !== "rgb(255, 113, 123)"
        || financePageSurface.actionWidths.length !== 2
        || financePageSurface.actionWidths.some((value) => value < financePageSurface.actionsWidth - 2)
        || parseFloat(financePageSurface.rowTitleFont) < 11.5) {
        report.failures.push({ width, type: "finance-semantic-hierarchy", financePageSurface });
      }
      await page.locator('[data-action="add-finance"][data-type="income"]').click();
      const financeEditorState = await page.evaluate(() => {
        const modal = document.querySelector(".finance-entry-modal");
        const field = document.querySelector(".finance-entry-modal .field");
        const footer = document.querySelector(".finance-entry-modal .modal-actions");
        const footerRect = footer?.getBoundingClientRect();
        const close = document.querySelector(".finance-entry-close");
        const closeRect = close?.getBoundingClientRect();
        const action = footer?.querySelector("button");
        const actionRect = action?.getBoundingClientRect();
        return {
          modal: modal ? getComputedStyle(modal).backgroundColor : "missing",
          field: field ? getComputedStyle(field).backgroundColor : "missing",
          fieldFont: field ? getComputedStyle(field).fontSize : "missing",
          closeWidth: closeRect ? Math.round(closeRect.width) : 0,
          closeHeight: closeRect ? Math.round(closeRect.height) : 0,
          actionHeight: actionRect ? Math.round(actionRect.height) : 0,
          headHeight: Math.round(document.querySelector(".finance-entry-head")?.getBoundingClientRect().height || 0),
          typeHeight: Math.round(document.querySelector(".finance-entry-type")?.getBoundingClientRect().height || 0),
          fieldHeight: Math.round(field?.getBoundingClientRect().height || 0),
          rowGap: parseFloat(getComputedStyle(document.querySelector(".finance-entry-modal .form-grid")).rowGap) || 0,
          footerBottom: footerRect ? Math.round(footerRect.bottom) : 0,
          viewportHeight: window.innerHeight
        };
      });
      if (financeEditorState.modal !== "rgb(3, 7, 10)"
        || financeEditorState.field !== "rgb(9, 15, 20)"
        || parseFloat(financeEditorState.fieldFont) < 13.5
        || financeEditorState.closeWidth < 44
        || financeEditorState.closeHeight < 44
        || financeEditorState.actionHeight < 48
        || financeEditorState.footerBottom < financeEditorState.viewportHeight - 24) {
        report.failures.push({ width, type: "finance-editor-layout", financeEditorState });
      }
      if (financeEditorState.headHeight > 60
        || financeEditorState.typeHeight > 52
        || financeEditorState.fieldHeight > 46
        || financeEditorState.rowGap > 7.5) {
        report.failures.push({ width, type: "finance-editor-compact-density", financeEditorState });
      }
      report.results.push(await shot(page, width, "finance-editor", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "prices" }));
      const pricePageSurface = await page.evaluate(() => {
        const search = document.querySelector("#price-search");
        const searchStyle = getComputedStyle(search);
        const filterGrid = document.querySelector(".legacy-price-filters");
        const filterGridRect = filterGrid?.getBoundingClientRect();
        const filterRects = [...document.querySelectorAll(".legacy-price-filters > label")].map((node) => node.getBoundingClientRect());
        const firstRow = document.querySelector(".legacy-price-row");
        const firstCopy = firstRow?.querySelector(":scope > span");
        const firstPrice = firstRow?.querySelector(":scope > b");
        const rowRect = firstRow?.getBoundingClientRect();
        const copyRect = firstCopy?.getBoundingClientRect();
        const priceRect = firstPrice?.getBoundingClientRect();
        return {
          group: getComputedStyle(document.querySelector(".legacy-price-group")).backgroundColor,
          service: getComputedStyle(document.querySelector(".legacy-price-row.service")).backgroundColor,
          material: getComputedStyle(document.querySelector(".legacy-price-row.material")).backgroundColor,
          custom: getComputedStyle(document.querySelector(".legacy-price-row.custom")).backgroundColor,
          rowTitleFont: getComputedStyle(document.querySelector(".legacy-price-row strong")).fontSize,
          searchBackground: searchStyle.backgroundColor,
          searchBorder: searchStyle.borderTopColor,
          searchShadow: searchStyle.boxShadow,
          addWidth: Math.round(document.querySelector(".legacy-price-add-wide")?.getBoundingClientRect().width || 0),
          searchWidth: Math.round(search?.getBoundingClientRect().width || 0),
          addHeight: Math.round(document.querySelector(".legacy-price-add-wide")?.getBoundingClientRect().height || 0),
          addBackground: getComputedStyle(document.querySelector(".legacy-price-add-wide")).backgroundColor,
          priceColors: [...document.querySelectorAll(".legacy-price-row > b")].map((node) => getComputedStyle(node).color),
          rowBorders: [...document.querySelectorAll(".legacy-price-row")].map((node) => getComputedStyle(node).borderTopColor),
          customHeadBorder: getComputedStyle(document.querySelector(".legacy-custom-price-head")).borderBottomColor,
          filterGridWidth: Math.round(filterGridRect?.width || 0),
          filterWidths: filterRects.map((rect) => Math.round(rect.width)),
          filterTops: filterRects.map((rect) => Math.round(rect.top)),
          firstRowHeight: Math.round(rowRect?.height || 0),
          firstCopyRight: Math.round(copyRect?.right || 0),
          firstPriceLeft: Math.round(priceRect?.left || 0),
          firstPriceCenter: priceRect ? Math.round(priceRect.top + priceRect.height / 2) : 0,
          firstRowCenter: rowRect ? Math.round(rowRect.top + rowRect.height / 2) : 0,
          groupCounts: [...document.querySelectorAll(".legacy-price-groups .legacy-price-group")].map((group) => {
            const badge = group.querySelector(":scope > h3 > small");
            const rect = badge?.getBoundingClientRect();
            return {
              badge: Number(badge?.textContent || -1),
              rows: group.querySelectorAll(".legacy-price-row").length,
              width: Math.round(rect?.width || 0),
              height: Math.round(rect?.height || 0)
            };
          })
        };
      });
      if (pricePageSurface.group !== "rgb(7, 12, 16)"
        || pricePageSurface.service !== "rgb(7, 12, 16)"
        || pricePageSurface.material !== "rgb(7, 12, 16)"
        || pricePageSurface.custom !== "rgb(7, 12, 16)"
        || parseFloat(pricePageSurface.rowTitleFont) < 11.5
        || pricePageSurface.searchBackground !== "rgb(9, 15, 20)"
        || pricePageSurface.searchBorder !== "rgb(32, 45, 53)"
        || pricePageSurface.searchShadow !== "none"
        || Math.abs(pricePageSurface.addWidth - pricePageSurface.searchWidth) > 2
        || pricePageSurface.addHeight < 48
        || pricePageSurface.addBackground !== "rgb(255, 113, 79)"
        || pricePageSurface.priceColors.some((value) => value !== "rgb(255, 138, 112)")
        || pricePageSurface.rowBorders.some((value) => value !== "rgb(32, 45, 53)")
        || pricePageSurface.customHeadBorder !== "rgb(32, 45, 53)"
        || pricePageSurface.filterWidths.some((value) => value < pricePageSurface.filterGridWidth - 2)
        || pricePageSurface.filterTops.length !== 2
        || pricePageSurface.filterTops[1] <= pricePageSurface.filterTops[0]
        || pricePageSurface.groupCounts.length < 1
        || pricePageSurface.groupCounts.some((group) => group.badge !== group.rows || group.width < 24 || group.height < 24)) {
        report.failures.push({ width, type: "price-semantic-hierarchy", pricePageSurface });
      }
      if (width <= 340 && (
        pricePageSurface.firstRowHeight > 68
        || pricePageSurface.firstPriceLeft < pricePageSurface.firstCopyRight - 2
        || Math.abs(pricePageSurface.firstPriceCenter - pricePageSurface.firstRowCenter) > 10
      )) {
        report.failures.push({ width, type: "price-320-inline-price", pricePageSurface });
      }
      if (width > 340 && pricePageSurface.firstRowHeight > 62) {
        report.failures.push({ width, type: "price-compact-density", pricePageSurface });
      }
      await page.waitForTimeout(80);
      await page.locator("#price-search").click();
      await page.waitForTimeout(220);
      const priceSearchFocus = await page.evaluate(() => {
        const search = document.querySelector("#price-search");
        const icon = document.querySelector(".legacy-price-search > .ui-icon");
        const style = getComputedStyle(search);
        return {
          focused: document.activeElement === search,
          border: style.borderTopColor,
          background: style.backgroundColor,
          shadow: style.boxShadow,
          icon: icon ? getComputedStyle(icon).color : "missing"
        };
      });
      if (!priceSearchFocus.focused
        || !priceSearchFocus.border.includes("255, 104, 74")
        || priceSearchFocus.background !== "rgb(11, 18, 23)"
        || priceSearchFocus.shadow === "none"
        || priceSearchFocus.icon !== "rgb(255, 118, 92)") {
        report.failures.push({ width, type: "price-search-focus", priceSearchFocus });
      }
      await page.locator("#price-search").evaluate((node) => node.blur());
      await page.locator('[data-action="new-price"]').click();
      const priceEditorState = await page.evaluate(() => {
        const back = document.querySelector(".legacy-price-editor .legacy-back-button");
        const backRect = back?.getBoundingClientRect();
        const action = document.querySelector(".legacy-price-editor-actions button");
        const actionRect = action?.getBoundingClientRect();
        const field = document.querySelector(".legacy-price-editor .field");
        return {
          card: getComputedStyle(document.querySelector(".legacy-price-editor-card")).backgroundColor,
          field: getComputedStyle(field).backgroundColor,
          fieldFont: getComputedStyle(field).fontSize,
          secondary: getComputedStyle(document.querySelector(".legacy-price-editor-actions .legacy-dark-button")).backgroundColor,
          backWidth: backRect ? Math.round(backRect.width) : 0,
          backHeight: backRect ? Math.round(backRect.height) : 0,
          actionHeight: actionRect ? Math.round(actionRect.height) : 0,
          headHeight: Math.round(document.querySelector(".legacy-price-editor .legacy-editor-head")?.getBoundingClientRect().height || 0),
          fieldHeight: Math.round(field?.getBoundingClientRect().height || 0),
          rowGap: parseFloat(getComputedStyle(document.querySelector(".legacy-price-editor-grid")).rowGap) || 0,
          cardPaddingTop: parseFloat(getComputedStyle(document.querySelector(".legacy-price-editor-card")).paddingTop) || 0
        };
      });
      if (priceEditorState.card !== "rgb(6, 11, 15)"
        || priceEditorState.field !== "rgb(9, 15, 20)"
        || parseFloat(priceEditorState.fieldFont) < 13.5
        || priceEditorState.secondary !== "rgb(10, 17, 22)"
        || priceEditorState.backWidth < 44
        || priceEditorState.backHeight < 44
        || priceEditorState.actionHeight < 48) {
        report.failures.push({ width, type: "price-editor-deep-dark", priceEditorState });
      }
      if (priceEditorState.headHeight > 60
        || priceEditorState.fieldHeight > 46
        || priceEditorState.rowGap > 7.5
        || priceEditorState.cardPaddingTop > 10) {
        report.failures.push({ width, type: "price-editor-compact-density", priceEditorState });
      }
      report.results.push(await shot(page, width, "price-editor", false));
      await page.keyboard.press("Escape");

      if (width === 390) {
        await setState(page, uiState({ activePage: "more", moreSection: "goods" }));
        await page.locator('[data-action="new-goods-sheet"]').click();
        const goodsPicker = page.locator("#goods-picker");
        await goodsPicker.selectOption("2");
        await page.locator("#add-goods-line").click();
        await goodsPicker.selectOption("3");
        await page.locator("#add-goods-line").click();
        await page.locator("#goods-target").fill("10003");
        await page.locator("#adjust-goods-prices").click();
        const goodsFitState = await page.evaluate(() => {
          const totals = [...document.querySelectorAll("[data-goods-row]")].map((row) => {
            const qty = Number(row.querySelector('[data-line="qty"]')?.value) || 0;
            const price = Number(row.querySelector('[data-line="price"]')?.value) || 0;
            return qty * price;
          });
          return { totals, total: totals.reduce((sum, value) => sum + value, 0) };
        });
        if (Math.abs(goodsFitState.total - 10003) > 0.001
          || goodsFitState.totals.length !== 2
          || goodsFitState.totals[0] <= goodsFitState.totals[1]) {
          report.failures.push({ width, type: "goods-proportional-target-fit", goodsFitState });
        }
        await page.locator("#restore-goods-prices").click();
        const restoredGoodsTotal = await page.evaluate(() => [...document.querySelectorAll("[data-goods-row]")].reduce((sum, row) => {
          const qty = Number(row.querySelector('[data-line="qty"]')?.value) || 0;
          const price = Number(row.querySelector('[data-line="price"]')?.value) || 0;
          return sum + qty * price;
        }, 0));
        if (Math.abs(restoredGoodsTotal - 9100) > 0.001) {
          report.failures.push({ width, type: "goods-restore-base-prices", restoredGoodsTotal });
        }
        await page.keyboard.press("Escape");

        await writeSeed(page, seed);
        await setState(page, uiState({ activePage: "more", moreSection: "prices" }));
        await page.locator('.legacy-price-row.service').filter({ hasText: "Диагностика" }).click();
        await page.locator("#toggle-price-archive").click();
        await page.locator("[data-confirm-primary]").click();
        await page.waitForTimeout(80);
        const archivedPriceData = await readStoredData(page);
        const archivedPrice = archivedPriceData.receipt_prices.find((item) => item.id === "p1");
        if (!archivedPrice?.archived || archivedPriceData.receipt_prices.length !== seed.receipt_prices.length) {
          report.failures.push({
            width,
            type: "price-archive-preserves-history",
            archived: archivedPrice?.archived,
            count: archivedPriceData.receipt_prices.length
          });
        }

        await setState(page, uiState({ activePage: "more", moreSection: "prices", priceKindFilter: "archived" }));
        const archivedPriceSurface = await page.evaluate(() => ({
          text: document.querySelector(".legacy-price-page")?.innerText || "",
          rows: document.querySelectorAll(".legacy-price-row.archived").length
        }));
        if (!archivedPriceSurface.text.includes("Диагностика") || archivedPriceSurface.rows < 1) {
          report.failures.push({ width, type: "price-archive-visible", archivedPriceSurface });
        }
        await page.locator('.legacy-price-row.archived').filter({ hasText: "Диагностика" }).click();
        await page.locator("#toggle-price-archive").click();
        await page.locator("[data-confirm-primary]").click();
        await page.waitForTimeout(80);
        const restoredPriceData = await readStoredData(page);
        if (restoredPriceData.receipt_prices.find((item) => item.id === "p1")?.archived) {
          report.failures.push({ width, type: "price-archive-restore" });
        }
        await writeSeed(page, seed);
      }

      await setState(page, uiState({ activePage: "more", moreSection: "clients" }));
      const clientPageSurface = await page.evaluate(() => ({
        background: getComputedStyle(document.querySelector(".legacy-client-card")).backgroundColor,
        primaryStat: getComputedStyle(document.querySelector(".legacy-clients-stats > .clients-stat-primary")).backgroundColor,
        activeStat: getComputedStyle(document.querySelector(".legacy-clients-stats > div:nth-child(2)")).backgroundColor,
        closedStat: getComputedStyle(document.querySelector(".legacy-clients-stats > div:nth-child(3)")).backgroundColor,
        titleFont: getComputedStyle(document.querySelector(".legacy-client-copy strong")).fontSize,
        actionBackgrounds: [...document.querySelectorAll(".legacy-client-actions > *")].slice(0,2).map((node) => getComputedStyle(node).backgroundColor),
        actionBorders: [...document.querySelectorAll(".legacy-client-actions > *")].slice(0,2).map((node) => getComputedStyle(node).borderTopColor),
        actionWidths: [...document.querySelectorAll(".legacy-client-actions > *")].slice(0,2).map((node) => Math.round(node.getBoundingClientRect().width)),
        totalColor: getComputedStyle(document.querySelector(".legacy-client-side > b")).color
      }));
      if (clientPageSurface.background !== "rgb(7, 12, 16)"
        || clientPageSurface.primaryStat !== "rgb(7, 12, 16)"
        || clientPageSurface.activeStat !== "rgb(7, 12, 16)"
        || clientPageSurface.closedStat !== "rgb(7, 12, 16)"
        || parseFloat(clientPageSurface.titleFont) < 11.5
        || clientPageSurface.actionBackgrounds.some((value) => value !== "rgb(13, 20, 25)")
        || clientPageSurface.actionBorders.some((value) => value !== "rgb(39, 52, 60)")
        || clientPageSurface.actionWidths.length !== 2
        || Math.abs(clientPageSurface.actionWidths[0] - clientPageSurface.actionWidths[1]) > 2
        || clientPageSurface.totalColor !== "rgb(255, 138, 112)") {
        report.failures.push({ width, type: "clients-semantic-hierarchy", clientPageSurface });
      }
      const clientDensity = await page.evaluate(() => {
        const primary = document.querySelector(".legacy-clients-stats > .clients-stat-primary");
        const secondary = document.querySelector(".legacy-clients-stats > div:nth-child(2)");
        const main = document.querySelector(".legacy-client-main");
        const action = document.querySelector(".legacy-client-actions > *");
        return {
          primaryHeight: Math.round(primary?.getBoundingClientRect().height || 0),
          secondaryHeight: Math.round(secondary?.getBoundingClientRect().height || 0),
          mainHeight: Math.round(main?.getBoundingClientRect().height || 0),
          actionHeight: Math.round(action?.getBoundingClientRect().height || 0)
        };
      });
      const clientDensityLimits = width <= 340
        ? { primary: 86, secondary: 76, main: 104 }
        : { primary: 86, secondary: 76, main: 78 };
      if (clientDensity.primaryHeight > clientDensityLimits.primary
        || clientDensity.secondaryHeight > clientDensityLimits.secondary
        || clientDensity.mainHeight > clientDensityLimits.main
        || clientDensity.actionHeight < 44) {
        report.failures.push({ width, type: "clients-compact-density", clientDensity, clientDensityLimits });
      }
      await page.locator('[data-action="open-client"]').first().click();
      const clientProfileState = await page.evaluate(() => ({
        modal: getComputedStyle(document.querySelector(".client-profile-modal")).backgroundColor,
        hero: getComputedStyle(document.querySelector(".client-profile-hero")).backgroundColor,
        totalKpi: getComputedStyle(document.querySelector(".client-profile-kpis > div:nth-child(4)")).backgroundColor,
        closedKpi: getComputedStyle(document.querySelector(".client-profile-kpis > div:nth-child(2)")).backgroundColor,
        activeKpi: getComputedStyle(document.querySelector(".client-profile-kpis > div:nth-child(3)")).backgroundColor
      }));
      if (clientProfileState.modal !== "rgb(3, 7, 10)"
        || clientProfileState.hero !== "rgb(7, 12, 16)"
        || clientProfileState.totalKpi !== "rgb(9, 15, 20)"
        || clientProfileState.closedKpi !== "rgb(9, 15, 20)"
        || clientProfileState.activeKpi !== "rgb(9, 15, 20)") {
        report.failures.push({ width, type: "client-profile-semantic-hierarchy", clientProfileState });
      }
      report.results.push(await shot(page, width, "client-profile", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "menu" }));
      const moreMenuSurface = await page.evaluate(() => {
        const items = [...document.querySelectorAll(".legacy-more-list .menu-item")];
        return {
          names: items.map((item) => item.querySelector(".menu-name")?.textContent?.trim() || ""),
          backgrounds: items.map((item) => getComputedStyle(item).backgroundColor),
          iconBackgrounds: items.map((item) => getComputedStyle(item.querySelector(".menu-icon")).backgroundColor),
          finance: document.querySelectorAll(".legacy-more-list .menu-finance").length,
          shopping: document.querySelectorAll(".legacy-more-list .menu-shopping").length,
          tools: document.querySelectorAll(".legacy-more-list .menu-tools").length,
          titleFont: getComputedStyle(document.querySelector(".legacy-more-list .menu-name")).fontSize,
          versionText: document.querySelector(".more-version-button")?.innerText || "",
          versionHeight: Math.round(document.querySelector(".more-version-button")?.getBoundingClientRect().height || 0),
          descriptionStyles: [...document.querySelectorAll(".legacy-more-list .menu-description")].map((node) => {
            const style = getComputedStyle(node);
            return {
              whiteSpace: style.whiteSpace,
              textOverflow: style.textOverflow,
              lineClamp: style.webkitLineClamp
            };
          })
        };
      });
      const expectedMoreNames = ["Финансы","Список покупок","Клиенты","Прайс-лист","Товарник","Акт","Календарь","Настройки"];
      const expectedMoreBackgrounds = Array(expectedMoreNames.length).fill("rgb(13, 20, 25)");
      const expectedMoreIconBackgrounds = [
        "rgb(13, 29, 21)",
        "rgb(27, 23, 12)",
        "rgb(13, 24, 34)",
        "rgb(22, 17, 36)",
        "rgb(28, 17, 13)",
        "rgb(12, 25, 28)",
        "rgb(13, 23, 31)",
        "rgb(17, 25, 30)"
      ];
      if (JSON.stringify(moreMenuSurface.names) !== JSON.stringify(expectedMoreNames)
        || moreMenuSurface.finance !== 1
        || moreMenuSurface.shopping !== 1
        || moreMenuSurface.tools !== 0
        || JSON.stringify(moreMenuSurface.backgrounds) !== JSON.stringify(expectedMoreBackgrounds)
        || JSON.stringify(moreMenuSurface.iconBackgrounds) !== JSON.stringify(expectedMoreIconBackgrounds)
        || new Set(moreMenuSurface.backgrounds).size !== 1
        || new Set(moreMenuSurface.iconBackgrounds).size < 6
        || parseFloat(moreMenuSurface.titleFont) < 13.5
        || !/v\d+\.\d+\.\d+/.test(moreMenuSurface.versionText)
        || !moreMenuSurface.versionText.includes("Что нового")
        || moreMenuSurface.versionHeight < 44
        || (width <= 340 && moreMenuSurface.descriptionStyles.some((style) =>
          style.whiteSpace === "nowrap"
          || style.textOverflow === "ellipsis"
          || style.lineClamp !== "2"
        ))) {
        report.failures.push({ width, type: "more-menu-hierarchy", moreMenuSurface });
      }
      const moreMenuDensity = await page.evaluate(() => {
        const list = document.querySelector(".legacy-more-list");
        const item = document.querySelector(".legacy-more-list .menu-item");
        const icon = document.querySelector(".legacy-more-list .menu-icon");
        const listStyle = list ? getComputedStyle(list) : null;
        return {
          gap: listStyle ? Number.parseFloat(listStyle.gap || "0") || 0 : 999,
          itemHeight: Math.round(item?.getBoundingClientRect().height || 0),
          iconHeight: Math.round(icon?.getBoundingClientRect().height || 0)
        };
      });
      const moreItemLimit = width <= 340 ? 86 : 78;
      if (moreMenuDensity.gap > 6
        || moreMenuDensity.itemHeight > moreItemLimit
        || moreMenuDensity.itemHeight < 60
        || moreMenuDensity.iconHeight > 40) {
        report.failures.push({ width, type: "more-menu-compact-density", moreMenuDensity, moreItemLimit });
      }

      await setState(page, uiState({ activePage: "more", moreSection: "goods" }));
      const goodsPageSurface = await page.evaluate(() => ({
        create: getComputedStyle(document.querySelector(".legacy-goods-new")).backgroundColor,
        current: getComputedStyle(document.querySelector(".legacy-goods-current")).backgroundColor,
        currentSummary: getComputedStyle(document.querySelector(".legacy-goods-current-summary")).backgroundColor,
        productPrice: getComputedStyle(document.querySelector(".legacy-product-price")).backgroundColor,
        itemTitleFont: getComputedStyle(document.querySelector(".legacy-goods-position strong")).fontSize,
        manualBackground: getComputedStyle(document.querySelector('.legacy-goods-new [data-action="new-goods-sheet"]')).backgroundColor,
        fromOrderBackground: getComputedStyle(document.querySelector('.legacy-goods-new [data-action="new-goods-from-order"]')).backgroundColor,
        createGridWidth: Math.round(document.querySelector(".legacy-goods-create-grid")?.getBoundingClientRect().width || 0),
        createWidths: [...document.querySelectorAll(".legacy-goods-create-grid > button")].map((node) => Math.round(node.getBoundingClientRect().width)),
        rowAmountColors: [...document.querySelectorAll(".legacy-goods-position > b")].map((node) => getComputedStyle(node).color),
        currentTotalColor: getComputedStyle(document.querySelector(".legacy-goods-current-summary > b")).color,
        currentSummaryBorder: getComputedStyle(document.querySelector(".legacy-goods-current-summary")).borderTopColor,
        editBackground: getComputedStyle(document.querySelector(".legacy-goods-current .legacy-open-editor")).backgroundColor,
        editBorder: getComputedStyle(document.querySelector(".legacy-goods-current .legacy-open-editor")).borderTopColor
      }));
      if (goodsPageSurface.create !== "rgb(7, 12, 16)"
        || goodsPageSurface.current !== "rgb(7, 12, 16)"
        || goodsPageSurface.currentSummary !== "rgb(13, 20, 25)"
        || goodsPageSurface.productPrice !== "rgb(7, 12, 16)"
        || goodsPageSurface.manualBackground !== "rgb(255, 113, 79)"
        || goodsPageSurface.fromOrderBackground !== "rgb(13, 20, 25)"
        || goodsPageSurface.createWidths.length !== 2
        || goodsPageSurface.createWidths.some((value) => value < goodsPageSurface.createGridWidth - 2)
        || goodsPageSurface.rowAmountColors.some((value) => value !== "rgb(231, 236, 238)")
        || goodsPageSurface.currentTotalColor !== "rgb(255, 138, 112)"
        || goodsPageSurface.currentSummaryBorder !== "rgb(39, 52, 60)"
        || goodsPageSurface.editBackground !== "rgb(13, 20, 25)"
        || goodsPageSurface.editBorder !== "rgb(39, 52, 60)"
        || parseFloat(goodsPageSurface.itemTitleFont) < 11) {
        report.failures.push({ width, type: "goods-semantic-hierarchy", goodsPageSurface });
      }
      const goodsDensity = await page.evaluate(() => {
        const panel = document.querySelector(".legacy-goods-panel");
        const summary = document.querySelector(".legacy-goods-current-summary");
        const row = document.querySelector(".legacy-goods-position");
        const edit = document.querySelector(".legacy-open-editor");
        const panelStyle = panel ? getComputedStyle(panel) : null;
        const px = (value) => Number.parseFloat(value || "0") || 0;
        return {
          panelPaddingTop: panelStyle ? px(panelStyle.paddingTop) : 999,
          summaryHeight: Math.round(summary?.getBoundingClientRect().height || 0),
          rowHeight: Math.round(row?.getBoundingClientRect().height || 0),
          editHeight: Math.round(edit?.getBoundingClientRect().height || 0)
        };
      });
      const goodsRowLimit = width <= 340 ? 66 : 58;
      if (goodsDensity.panelPaddingTop > 10
        || goodsDensity.summaryHeight > 62
        || goodsDensity.rowHeight > goodsRowLimit
        || goodsDensity.editHeight < 44) {
        report.failures.push({ width, type: "goods-compact-density", goodsDensity, goodsRowLimit });
      }
      await page.locator('[data-action="new-goods-sheet"]').click();
      const goodsEditorState = await page.evaluate(() => {
        const field = document.querySelector(".legacy-goods-editor .field");
        const back = document.querySelector(".legacy-goods-editor .legacy-back-button");
        const backRect = back?.getBoundingClientRect();
        const action = document.querySelector(".legacy-goods-savebar button");
        const actionRect = action?.getBoundingClientRect();
        const addLine = document.querySelector(".legacy-goods-add-line");
        const picker = document.querySelector("#goods-picker");
        const addButton = document.querySelector("#add-goods-line");
        const addLineRect = addLine?.getBoundingClientRect();
        const pickerRect = picker?.getBoundingClientRect();
        const addButtonRect = addButton?.getBoundingClientRect();
        return {
          modal: getComputedStyle(document.querySelector(".legacy-goods-editor")).backgroundColor,
          panel: getComputedStyle(document.querySelector(".legacy-goods-editor .legacy-editor-panel")).backgroundColor,
          field: getComputedStyle(field).backgroundColor,
          fieldFont: getComputedStyle(field).fontSize,
          backWidth: backRect ? Math.round(backRect.width) : 0,
          backHeight: backRect ? Math.round(backRect.height) : 0,
          actionHeight: actionRect ? Math.round(actionRect.height) : 0,
          addLineWidth: Math.round(addLineRect?.width || 0),
          pickerWidth: Math.round(pickerRect?.width || 0),
          addButtonWidth: Math.round(addButtonRect?.width || 0),
          pickerBottom: Math.round(pickerRect?.bottom || 0),
          addButtonTop: Math.round(addButtonRect?.top || 0),
          fitBackground: getComputedStyle(document.querySelector("#adjust-goods-prices")).backgroundColor,
          fitColor: getComputedStyle(document.querySelector("#adjust-goods-prices")).color,
          restoreBackground: getComputedStyle(document.querySelector("#restore-goods-prices")).backgroundColor,
          previewBackground: getComputedStyle(document.querySelector("#preview-goods")).backgroundColor
        };
      });
      if (goodsEditorState.modal !== "rgb(3, 7, 10)"
        || goodsEditorState.panel !== "rgb(6, 11, 15)"
        || goodsEditorState.field !== "rgb(9, 15, 20)"
        || parseFloat(goodsEditorState.fieldFont) < 13.5
        || goodsEditorState.backWidth < 44
        || goodsEditorState.backHeight < 44
        || goodsEditorState.actionHeight < 48
        || goodsEditorState.pickerWidth < goodsEditorState.addLineWidth - 2
        || goodsEditorState.addButtonWidth < goodsEditorState.addLineWidth - 2
        || goodsEditorState.addButtonTop < goodsEditorState.pickerBottom
        || goodsEditorState.fitBackground !== "rgb(13, 20, 25)"
        || goodsEditorState.fitColor !== "rgb(216, 201, 248)"
        || goodsEditorState.restoreBackground !== "rgb(13, 20, 25)"
        || goodsEditorState.previewBackground !== "rgb(255, 113, 83)") {
        report.failures.push({ width, type: "goods-editor-deep-dark", goodsEditorState });
      }
      report.results.push(await shot(page, width, "goods-editor", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "tools" }));
      const toolsPageSurface = await page.evaluate(() => {
        const add = document.querySelector(".legacy-tools-page .legacy-service-add-wide");
        const addRect = add?.getBoundingClientRect();
        const pageRect = document.querySelector(".legacy-tools-page")?.getBoundingClientRect();
        const row = document.querySelector(".legacy-document-row.tool");
        const copyRect = row?.querySelector(":scope > span:nth-child(2)")?.getBoundingClientRect();
        const amountRect = row?.querySelector(":scope > b")?.getBoundingClientRect();
        const chevronRect = row?.querySelector(":scope > .chevron")?.getBoundingClientRect();
        const rowRect = row?.getBoundingClientRect();
        return {
          totalStat: getComputedStyle(document.querySelector(".tools-stats > .service-stat-primary")).backgroundColor,
          activeStat: getComputedStyle(document.querySelector(".tools-stats > div:nth-child(2)")).backgroundColor,
          available: getComputedStyle(document.querySelector(".legacy-document-row.tool.available")).backgroundColor,
          busy: getComputedStyle(document.querySelector(".legacy-document-row.tool.busy")).backgroundColor,
          rowTitleFont: getComputedStyle(document.querySelector(".legacy-document-row.tool strong")).fontSize,
          addWidth: Math.round(addRect?.width || 0),
          pageWidth: Math.round(pageRect?.width || 0),
          addHeight: Math.round(addRect?.height || 0),
          rowHeight: Math.round(rowRect?.height || 0),
          copyRight: Math.round(copyRect?.right || 0),
          amountLeft: Math.round(amountRect?.left || 0),
          amountRight: Math.round(amountRect?.right || 0),
          amountCenter: amountRect ? Math.round(amountRect.top + amountRect.height / 2) : 0,
          rowCenter: rowRect ? Math.round(rowRect.top + rowRect.height / 2) : 0,
          chevronLeft: Math.round(chevronRect?.left || 0)
        };
      });
      if (toolsPageSurface.totalStat !== "rgb(7, 12, 16)"
        || toolsPageSurface.activeStat !== "rgb(7, 12, 16)"
        || toolsPageSurface.available !== "rgb(9, 15, 20)"
        || toolsPageSurface.busy !== "rgb(9, 15, 20)"
        || toolsPageSurface.addWidth < toolsPageSurface.pageWidth - 34
        || toolsPageSurface.addHeight < 48
        || parseFloat(toolsPageSurface.rowTitleFont) < 11.5
        || (width <= 340 && (
          toolsPageSurface.rowHeight > 72
          || toolsPageSurface.amountLeft < toolsPageSurface.copyRight - 2
          || toolsPageSurface.chevronLeft < toolsPageSurface.amountRight
          || Math.abs(toolsPageSurface.amountCenter - toolsPageSurface.rowCenter) > 10
        ))) {
        report.failures.push({ width, type: "tools-status-hierarchy", toolsPageSurface });
      }
      const toolsDensity = await page.evaluate(() => {
        const stat = document.querySelector(".tools-stats > div");
        const row = document.querySelector(".legacy-document-row.tool");
        return {
          statHeight: Math.round(stat?.getBoundingClientRect().height || 0),
          rowHeight: Math.round(row?.getBoundingClientRect().height || 0)
        };
      });
      if (toolsDensity.statHeight > 66
        || toolsDensity.rowHeight > (width <= 340 ? 72 : 64)) {
        report.failures.push({ width, type: "tools-compact-density", toolsDensity });
      }
      await page.locator('[data-action="new-tool"]').click();
      const toolEditorState = await page.evaluate(() => {
        const footer = document.querySelector(".tool-editor-modal .modal-actions");
        const rect = footer?.getBoundingClientRect();
        const field = document.querySelector(".tool-editor-modal .field");
        const close = document.querySelector(".tool-editor-close");
        const closeRect = close?.getBoundingClientRect();
        const action = footer?.querySelector("button");
        const actionRect = action?.getBoundingClientRect();
        const head = document.querySelector(".tool-editor-head")?.getBoundingClientRect();
        const hero = document.querySelector(".tool-editor-hero")?.getBoundingClientRect();
        const textarea = document.querySelector(".tool-editor-modal textarea")?.getBoundingClientRect();
        const gridStyle = getComputedStyle(document.querySelector(".tool-editor-modal .form-grid"));
        return {
          modal: getComputedStyle(document.querySelector(".tool-editor-modal")).backgroundColor,
          field: getComputedStyle(field).backgroundColor,
          fieldFont: getComputedStyle(field).fontSize,
          fieldHeight: Math.round(field?.getBoundingClientRect().height || 0),
          headHeight: Math.round(head?.height || 0),
          heroHeight: Math.round(hero?.height || 0),
          textareaHeight: Math.round(textarea?.height || 0),
          rowGap: parseFloat(gridStyle.rowGap) || 0,
          closeWidth: closeRect ? Math.round(closeRect.width) : 0,
          closeHeight: closeRect ? Math.round(closeRect.height) : 0,
          actionHeight: actionRect ? Math.round(actionRect.height) : 0,
          footerBottom: rect ? Math.round(rect.bottom) : 0,
          viewportHeight: window.innerHeight
        };
      });
      if (toolEditorState.modal !== "rgb(3, 7, 10)"
        || toolEditorState.field !== "rgb(9, 15, 20)"
        || parseFloat(toolEditorState.fieldFont) < 13.5
        || toolEditorState.closeWidth < 44
        || toolEditorState.closeHeight < 44
        || toolEditorState.actionHeight < 48
        || toolEditorState.footerBottom < toolEditorState.viewportHeight - 2) {
        report.failures.push({ width, type: "tool-editor-layout", toolEditorState });
      }
      if (toolEditorState.headHeight > 60
        || toolEditorState.heroHeight > 58
        || toolEditorState.fieldHeight > 46
        || (toolEditorState.textareaHeight && toolEditorState.textareaHeight > 82)
        || toolEditorState.rowGap > 7.5) {
        report.failures.push({ width, type: "tool-editor-compact-density", toolEditorState });
      }
      report.results.push(await shot(page, width, "tool-editor", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "receipts" }));
      const receiptsPageSurface = await page.evaluate(() => {
        const add = document.querySelector(".legacy-receipts-page .legacy-service-add-wide");
        const addRect = add?.getBoundingClientRect();
        const pageRect = document.querySelector(".legacy-receipts-page")?.getBoundingClientRect();
        const row = document.querySelector(".legacy-document-row.receipt");
        const copyRect = row?.querySelector(":scope > span:nth-child(2)")?.getBoundingClientRect();
        const amountRect = row?.querySelector(":scope > b")?.getBoundingClientRect();
        const chevronRect = row?.querySelector(":scope > .chevron")?.getBoundingClientRect();
        const rowRect = row?.getBoundingClientRect();
        return {
          total: getComputedStyle(document.querySelector(".receipts-stats > .service-stat-primary")).backgroundColor,
          amount: getComputedStyle(document.querySelector(".receipts-stats > div:nth-child(2)")).backgroundColor,
          linkedStat: getComputedStyle(document.querySelector(".receipts-stats > div:nth-child(3)")).backgroundColor,
          linkedRow: getComputedStyle(document.querySelector(".legacy-document-row.receipt.linked")).backgroundColor,
          standaloneRow: getComputedStyle(document.querySelector(".legacy-document-row.receipt.standalone")).backgroundColor,
          rowTitleFont: getComputedStyle(document.querySelector(".legacy-document-row.receipt strong")).fontSize,
          addWidth: Math.round(addRect?.width || 0),
          pageWidth: Math.round(pageRect?.width || 0),
          addHeight: Math.round(addRect?.height || 0),
          rowHeight: Math.round(rowRect?.height || 0),
          copyRight: Math.round(copyRect?.right || 0),
          amountLeft: Math.round(amountRect?.left || 0),
          amountRight: Math.round(amountRect?.right || 0),
          amountCenter: amountRect ? Math.round(amountRect.top + amountRect.height / 2) : 0,
          rowCenter: rowRect ? Math.round(rowRect.top + rowRect.height / 2) : 0,
          chevronLeft: Math.round(chevronRect?.left || 0)
        };
      });
      if (receiptsPageSurface.total !== "rgb(7, 12, 16)"
        || receiptsPageSurface.amount !== "rgb(7, 12, 16)"
        || receiptsPageSurface.linkedStat !== "rgb(7, 12, 16)"
        || receiptsPageSurface.linkedRow !== "rgb(9, 15, 20)"
        || receiptsPageSurface.standaloneRow !== "rgb(9, 15, 20)"
        || receiptsPageSurface.addWidth < receiptsPageSurface.pageWidth - 34
        || receiptsPageSurface.addHeight < 48
        || parseFloat(receiptsPageSurface.rowTitleFont) < 11.5
        || (width <= 340 && (
          receiptsPageSurface.rowHeight > 72
          || receiptsPageSurface.amountLeft < receiptsPageSurface.copyRight - 2
          || receiptsPageSurface.chevronLeft < receiptsPageSurface.amountRight
          || Math.abs(receiptsPageSurface.amountCenter - receiptsPageSurface.rowCenter) > 10
        ))) {
        report.failures.push({ width, type: "receipts-semantic-hierarchy", receiptsPageSurface });
      }
      const receiptsDensity = await page.evaluate(() => {
        const stat = document.querySelector(".receipts-stats > div");
        const row = document.querySelector(".legacy-document-row.receipt");
        return {
          statHeight: Math.round(stat?.getBoundingClientRect().height || 0),
          rowHeight: Math.round(row?.getBoundingClientRect().height || 0)
        };
      });
      if (receiptsDensity.statHeight > 66
        || receiptsDensity.rowHeight > (width <= 340 ? 72 : 64)) {
        report.failures.push({ width, type: "receipts-compact-density", receiptsDensity });
      }
      await page.locator('[data-action="new-receipt"]').click();
      const receiptEditorState = await page.evaluate(() => {
        const footer = document.querySelector(".receipt-editor-modal .modal-actions");
        const rect = footer?.getBoundingClientRect();
        const field = document.querySelector(".receipt-editor-modal .field");
        const close = document.querySelector(".receipt-editor-close");
        const closeRect = close?.getBoundingClientRect();
        const action = footer?.querySelector("button");
        const actionRect = action?.getBoundingClientRect();
        const head = document.querySelector(".receipt-editor-head")?.getBoundingClientRect();
        const hero = document.querySelector(".receipt-editor-type")?.getBoundingClientRect();
        const textarea = document.querySelector(".receipt-editor-modal textarea")?.getBoundingClientRect();
        const gridStyle = getComputedStyle(document.querySelector(".receipt-editor-modal .form-grid"));
        return {
          modal: getComputedStyle(document.querySelector(".receipt-editor-modal")).backgroundColor,
          field: getComputedStyle(field).backgroundColor,
          fieldFont: getComputedStyle(field).fontSize,
          fieldHeight: Math.round(field?.getBoundingClientRect().height || 0),
          headHeight: Math.round(head?.height || 0),
          heroHeight: Math.round(hero?.height || 0),
          textareaHeight: Math.round(textarea?.height || 0),
          rowGap: parseFloat(gridStyle.rowGap) || 0,
          closeWidth: closeRect ? Math.round(closeRect.width) : 0,
          closeHeight: closeRect ? Math.round(closeRect.height) : 0,
          actionHeight: actionRect ? Math.round(actionRect.height) : 0,
          footerBottom: rect ? Math.round(rect.bottom) : 0,
          viewportHeight: window.innerHeight
        };
      });
      if (receiptEditorState.modal !== "rgb(3, 7, 10)"
        || receiptEditorState.field !== "rgb(9, 15, 20)"
        || parseFloat(receiptEditorState.fieldFont) < 13.5
        || receiptEditorState.closeWidth < 44
        || receiptEditorState.closeHeight < 44
        || receiptEditorState.actionHeight < 48
        || receiptEditorState.footerBottom < receiptEditorState.viewportHeight - 2) {
        report.failures.push({ width, type: "receipt-editor-layout", receiptEditorState });
      }
      if (receiptEditorState.headHeight > 60
        || receiptEditorState.heroHeight > 52
        || receiptEditorState.fieldHeight > 46
        || (receiptEditorState.textareaHeight && receiptEditorState.textareaHeight > 82)
        || receiptEditorState.rowGap > 7.5) {
        report.failures.push({ width, type: "receipt-editor-compact-density", receiptEditorState });
      }
      report.results.push(await shot(page, width, "receipt-editor", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "drafts" }));
      const draftSurface = await page.evaluate(() => {
        const card = document.querySelector(".legacy-draft-card");
        const note = document.querySelector(".legacy-drafts-page .legacy-service-note");
        const next = document.querySelector('.legacy-draft-actions [data-action="continue-draft"]');
        const remove = document.querySelector('.legacy-draft-actions [data-action="delete-draft"]');
        const nextRect = next?.getBoundingClientRect();
        const removeRect = remove?.getBoundingClientRect();
        const cardRect = card?.getBoundingClientRect();
        const noteRect = note?.getBoundingClientRect();
        return {
          card: card ? getComputedStyle(card).backgroundColor : "missing",
          note: note ? getComputedStyle(note).backgroundColor : "missing",
          next: next ? getComputedStyle(next).backgroundColor : "missing",
          remove: remove ? getComputedStyle(remove).backgroundColor : "missing",
          cardHeight: cardRect ? Math.round(cardRect.height) : 0,
          noteHeight: noteRect ? Math.round(noteRect.height) : 0,
          nextHeight: nextRect ? Math.round(nextRect.height) : 0,
          removeHeight: removeRect ? Math.round(removeRect.height) : 0
        };
      });
      if (draftSurface.card !== "rgb(7, 12, 16)"
        || draftSurface.note !== "rgb(13, 20, 25)"
        || draftSurface.next !== "rgb(13, 20, 25)"
        || draftSurface.remove !== "rgb(13, 20, 25)"
        || draftSurface.nextHeight < 44
        || draftSurface.removeHeight < 44) {
        report.failures.push({ width, type: "drafts-workflow-hierarchy", draftSurface });
      }
      const draftHeightLimit = width <= 320 ? 126 : 110;
      if (!draftSurface.cardHeight
        || draftSurface.cardHeight > draftHeightLimit
        || !draftSurface.noteHeight
        || draftSurface.noteHeight > 58) {
        report.failures.push({ width, type: "drafts-compact-density", draftSurface, draftHeightLimit });
      }

      await setState(page, uiState({ activePage: "more", moreSection: "settings" }));
      const settingsSurface = await page.evaluate(() => {
        const grid = document.querySelector(".legacy-settings-grid");
        const gridRect = grid?.getBoundingClientRect();
        const fieldRects = [...document.querySelectorAll(".legacy-settings-grid > label")].map((node) => node.getBoundingClientRect());
        return {
          profile: getComputedStyle(document.querySelector(".settings-profile-card")).backgroundColor,
          app: getComputedStyle(document.querySelector(".settings-app-card")).backgroundColor,
          data: getComputedStyle(document.querySelector(".settings-data-card")).backgroundColor,
          field: getComputedStyle(document.querySelector(".legacy-settings-grid .field")).backgroundColor,
          toolsLink: getComputedStyle(document.querySelector('.legacy-settings-links [data-more="tools"]')).backgroundColor,
          backupLink: getComputedStyle(document.querySelector('.legacy-settings-links [data-more="backup"]')).backgroundColor,
          linkIconBackgrounds: [...document.querySelectorAll(".legacy-settings-links > button .settings-link-icon")].map((node) => getComputedStyle(node).backgroundColor),
          rowTitleFont: getComputedStyle(document.querySelector(".legacy-settings-row strong")).fontSize,
          gridWidth: Math.round(gridRect?.width || 0),
          fieldWidths: fieldRects.map((rect) => Math.round(rect.width)),
          fieldTops: fieldRects.map((rect) => Math.round(rect.top)),
          longLinkTitle: (() => {
            const node = document.querySelector('[data-action="manage-warranty-results"] strong');
            const style = node ? getComputedStyle(node) : null;
            return {
              whiteSpace: style?.whiteSpace || "missing",
              lineClamp: style?.webkitLineClamp || "missing",
              textOverflow: style?.textOverflow || "missing",
              scrollWidth: node?.scrollWidth || 0,
              clientWidth: node?.clientWidth || 0
            };
          })(),
          longLinkDescription: (() => {
            const node = document.querySelector('[data-action="manage-warranty-results"] small');
            const style = node ? getComputedStyle(node) : null;
            return {
              whiteSpace: style?.whiteSpace || "missing",
              lineClamp: style?.webkitLineClamp || "missing"
            };
          })(),
          longLinkHeight: Math.round(document.querySelector('[data-action="manage-warranty-results"]')?.getBoundingClientRect().height || 0),
          appRowWidths: [...document.querySelectorAll(".settings-app-card .legacy-settings-row")].map((node) => Math.round(node.getBoundingClientRect().width)),
          appActionWidths: [...document.querySelectorAll(".settings-app-card .legacy-settings-row > button:not(.toggle)")].map((node) => Math.round(node.getBoundingClientRect().width))
        };
      });
      if (settingsSurface.profile !== "rgb(7, 12, 16)"
        || settingsSurface.app !== "rgb(7, 12, 16)"
        || settingsSurface.data !== "rgb(7, 12, 16)"
        || settingsSurface.field !== "rgb(9, 15, 20)"
        || settingsSurface.toolsLink !== "rgb(13, 20, 25)"
        || settingsSurface.backupLink !== "rgb(13, 20, 25)"
        || JSON.stringify(settingsSurface.linkIconBackgrounds) !== JSON.stringify([
          "rgb(13, 24, 34)",
          "rgb(22, 17, 36)",
          "rgb(13, 24, 34)",
          "rgb(13, 29, 21)",
          "rgb(13, 29, 21)",
          "rgb(27, 23, 12)",
          "rgb(27, 23, 12)",
          "rgb(12, 25, 28)",
          "rgb(28, 17, 13)"
        ])
        || new Set(settingsSurface.linkIconBackgrounds).size < 5
        || parseFloat(settingsSurface.rowTitleFont) < 11.5
        || settingsSurface.fieldWidths.length !== 5
        || settingsSurface.fieldWidths.some((value) => value < settingsSurface.gridWidth - 2)
        || settingsSurface.fieldTops.some((top, index, list) => index > 0 && top <= list[index - 1])
        || settingsSurface.longLinkTitle.whiteSpace === "nowrap"
        || settingsSurface.longLinkTitle.lineClamp !== "2"
        || settingsSurface.longLinkTitle.textOverflow === "ellipsis"
        || settingsSurface.longLinkDescription.whiteSpace === "nowrap"
        || settingsSurface.longLinkDescription.lineClamp !== "2"
        || settingsSurface.longLinkHeight < 68
        || (width <= 340 && (
          settingsSurface.appActionWidths.length !== settingsSurface.appRowWidths.length
          || settingsSurface.appActionWidths.some((value, index) => value < settingsSurface.appRowWidths[index] - 2)
        ))) {
        report.failures.push({ width, type: "settings-semantic-hierarchy", settingsSurface });
      }
      const settingsDensity = await page.evaluate(() => {
        const card = document.querySelector(".legacy-settings-card");
        const row = document.querySelector(".legacy-settings-row");
        const link = document.querySelector(".legacy-settings-links > button:not([data-action=\"manage-warranty-results\"])");
        const icon = document.querySelector(".legacy-settings-links .settings-link-icon");
        const cardStyle = card ? getComputedStyle(card) : null;
        const px = (value) => Number.parseFloat(value || "0") || 0;
        return {
          cardPaddingTop: cardStyle ? px(cardStyle.paddingTop) : 999,
          rowHeight: Math.round(row?.getBoundingClientRect().height || 0),
          linkHeight: Math.round(link?.getBoundingClientRect().height || 0),
          iconHeight: Math.round(icon?.getBoundingClientRect().height || 0)
        };
      });
      const settingsRowLimit = width <= 340 ? 108 : 70;
      const settingsLinkLimit = width <= 340 ? 76 : 68;
      if (settingsDensity.cardPaddingTop > 10
        || settingsDensity.rowHeight > settingsRowLimit
        || settingsDensity.linkHeight > settingsLinkLimit
        || settingsDensity.iconHeight > 36) {
        report.failures.push({ width, type: "settings-compact-density", settingsDensity, settingsRowLimit, settingsLinkLimit });
      }

      await setState(page, uiState({ activePage: "more", moreSection: "backup" }));
      const backupSurface = await page.evaluate(() => ({
        primary: getComputedStyle(document.querySelector(".backup-primary-card")).backgroundColor,
        auto: getComputedStyle(document.querySelector(".backup-auto-card")).backgroundColor,
        orders: getComputedStyle(document.querySelector(".legacy-service-stats.backup > div:nth-child(1)")).backgroundColor,
        warehouse: getComputedStyle(document.querySelector(".legacy-service-stats.backup > div:nth-child(2)")).backgroundColor,
        price: getComputedStyle(document.querySelector(".legacy-service-stats.backup > div:nth-child(3)")).backgroundColor,
        download: getComputedStyle(document.querySelector('.legacy-backup-main-actions [data-action="download-backup"]')).backgroundColor,
        importButton: getComputedStyle(document.querySelector('.legacy-backup-main-actions [data-action="import"]')).backgroundColor,
        mainWidth: Math.round(document.querySelector(".legacy-backup-main-actions")?.getBoundingClientRect().width || 0),
        mainButtonWidths: [...document.querySelectorAll(".legacy-backup-main-actions > button")].map((node) => Math.round(node.getBoundingClientRect().width)),
        gridWidth: Math.round(document.querySelector(".legacy-backup-grid")?.getBoundingClientRect().width || 0),
        gridButtonWidths: [...document.querySelectorAll(".legacy-backup-grid > button")].map((node) => Math.round(node.getBoundingClientRect().width))
      }));
      if (backupSurface.primary !== "rgb(7, 12, 16)"
        || backupSurface.auto !== "rgb(7, 12, 16)"
        || backupSurface.orders !== "rgb(7, 12, 16)"
        || backupSurface.warehouse !== "rgb(7, 12, 16)"
        || backupSurface.price !== "rgb(7, 12, 16)"
        || backupSurface.download !== "rgb(255, 113, 79)"
        || backupSurface.importButton !== "rgb(13, 20, 25)"
        || backupSurface.mainButtonWidths.some((value) => value < backupSurface.mainWidth - 2)
        || backupSurface.gridButtonWidths.some((value) => value < backupSurface.gridWidth - 2)) {
        report.failures.push({ width, type: "backup-semantic-hierarchy", backupSurface });
      }
      const backupDensity = await page.evaluate(() => {
        const card = document.querySelector(".legacy-backup-page .backup-primary-card");
        const stat = document.querySelector(".legacy-service-stats.backup > div");
        const mainButton = document.querySelector(".legacy-backup-main-actions > button");
        const cardStyle = card ? getComputedStyle(card) : null;
        const px = (value) => Number.parseFloat(value || "0") || 0;
        return {
          cardPaddingTop: cardStyle ? px(cardStyle.paddingTop) : 999,
          statHeight: Math.round(stat?.getBoundingClientRect().height || 0),
          mainButtonHeight: Math.round(mainButton?.getBoundingClientRect().height || 0)
        };
      });
      if (backupDensity.cardPaddingTop > 10
        || backupDensity.statHeight > 62
        || backupDensity.mainButtonHeight < 50) {
        report.failures.push({ width, type: "backup-compact-density", backupDensity });
      }

      await setState(page, uiState({ activePage: "more", moreSection: "settings" }));
      await page.locator('[data-action="run-diagnostics"]').click();
      await page.waitForTimeout(120);
      const diagnosticsSurface = await page.evaluate(() => {
        const modal = document.querySelector('body > .modal-backdrop > div.modal.compact-modal');
        const row = modal?.querySelector('.goods-sheet');
        const footer = modal?.querySelector('.modal-actions');
        return {
          modal: modal ? getComputedStyle(modal).backgroundColor : "missing",
          row: row ? getComputedStyle(row).backgroundColor : "missing",
          footer: footer ? getComputedStyle(footer).backgroundColor : "missing"
        };
      });
      if (diagnosticsSurface.modal !== "rgb(3, 7, 10)"
        || diagnosticsSurface.row !== "rgb(9, 15, 20)"
        || diagnosticsSurface.footer !== "rgba(3, 7, 10, 0.99)") {
        report.failures.push({ width, type: "diagnostics-deep-dark", diagnosticsSurface });
      }
      report.results.push(await shot(page, width, "diagnostics-modal", false));
      await page.locator('body > .modal-backdrop [data-close-modal]').click();

      await setState(page, uiState({ activePage: "more", moreSection: "finance" }));
      await page.locator(".legacy-finance-row > button").first().click();
      await page.waitForTimeout(60);
      const confirmSurface = await page.evaluate(() => {
        const modal = document.querySelector(".crm-confirm-modal");
        const cancel = document.querySelector(".crm-confirm-actions .legacy-dark-button");
        const cancelRect = cancel?.getBoundingClientRect();
        return {
          modal: modal ? getComputedStyle(modal).backgroundColor : "missing",
          cancel: cancel ? getComputedStyle(cancel).backgroundColor : "missing",
          cancelHeight: cancelRect ? Math.round(cancelRect.height) : 0
        };
      });
      if (confirmSurface.modal !== "rgb(6, 11, 15)"
        || confirmSurface.cancel !== "rgb(10, 17, 22)"
        || confirmSurface.cancelHeight < 48) {
        report.failures.push({ width, type: "confirm-dialog-deep-dark", confirmSurface });
      }
      report.results.push(await shot(page, width, "confirm-dialog", false));
      await page.locator("[data-confirm-cancel]").click();

      if (width === 320) {
        const stressSeed = structuredClone(seed);
        Object.assign(stressSeed.orders[0], {
          name: "Александр Константинопольский-Смирнов Очень Длинное Имя Клиента",
          brand: "Samsung Bespoke Family Hub RB38A7B6BB1/WT очень длинная модель холодильника",
          address: "Санкт-Петербург, внутригородское муниципальное образование, проспект Испытателей, дом 124 корпус 7 строение 2 квартира 987",
          issue: "Периодически полностью перестаёт охлаждать верхняя камера, появляется громкий посторонний шум и ошибка на дисплее после длительной работы",
          sum: 987654321,
          expense_gray: 12345678,
          expense_white: 8765432
        });
        stressSeed.warehouse[0].name = "Вентилятор испарителя Samsung оригинальный с длинным заводским артикулом DA31-00334D и дополнительным описанием";
        stressSeed.receipt_prices[0].name = "Диагностика холодильника с полной проверкой электронного модуля управления и температурных датчиков";
        await writeSeed(page, stressSeed);

        for (const [stressLabel, stressState] of [
          ["stress-orders", uiState({ activePage: "orders" })],
          ["stress-warehouse", uiState({ activePage: "warehouse", warehouseSection: "list" })],
          ["stress-prices", uiState({ activePage: "more", moreSection: "prices" })]
        ]) {
          await setState(page, stressState);
          const stressResult = await shot(page, width, stressLabel, true);
          report.results.push(stressResult);
          if (stressResult.overflow > 2) report.failures.push({ width, type: "stress-horizontal-overflow", label: stressLabel, overflow: stressResult.overflow });
          if (stressLabel === "stress-orders") {
            const orderTextState = await page.evaluate(() => {
              const name = document.querySelector(".legacy-order-title > strong");
              const model = document.querySelector(".legacy-order-device small");
              const address = document.querySelector(".legacy-order-meta .address");
              const ns = name ? getComputedStyle(name) : null;
              const ms = model ? getComputedStyle(model) : null;
              const as = address ? getComputedStyle(address) : null;
              return {
                nameWhiteSpace: ns?.whiteSpace || "missing",
                nameLineClamp: ns?.webkitLineClamp || "missing",
                nameTextOverflow: ns?.textOverflow || "missing",
                modelWhiteSpace: ms?.whiteSpace || "missing",
                modelLineClamp: ms?.webkitLineClamp || "missing",
                modelTextOverflow: ms?.textOverflow || "missing",
                addressWhiteSpace: as?.whiteSpace || "missing",
                addressTextOverflow: as?.textOverflow || "missing",
                addressHeight: Math.round(address?.getBoundingClientRect().height || 0)
              };
            });
            if (orderTextState.nameWhiteSpace === "nowrap"
              || orderTextState.nameLineClamp !== "2"
              || orderTextState.nameTextOverflow === "ellipsis"
              || orderTextState.modelWhiteSpace === "nowrap"
              || orderTextState.modelLineClamp !== "2"
              || orderTextState.modelTextOverflow === "ellipsis"
              || orderTextState.addressWhiteSpace === "nowrap"
              || orderTextState.addressTextOverflow === "ellipsis"
              || orderTextState.addressHeight < 44) {
              report.failures.push({ width, type: "stress-order-readable-text", orderTextState });
            }
          }
          if (stressLabel === "stress-warehouse") {
            const stockTextState = await page.evaluate(() => {
              const title = document.querySelector(".legacy-stock-copy strong");
              const copy = document.querySelector(".legacy-stock-copy");
              const copyMeta = document.querySelector(".legacy-stock-copy em");
              const qty = document.querySelector(".legacy-stock-qty");
              const copyRect = copy?.getBoundingClientRect();
              const qtyRect = qty?.getBoundingClientRect();
              return {
                lineClamp: getComputedStyle(title).webkitLineClamp,
                whiteSpace: getComputedStyle(title).whiteSpace,
                textOverflow: getComputedStyle(title).textOverflow,
                copyEmDisplay: copyMeta ? getComputedStyle(copyMeta).display : "missing",
                qtyDisplay: qty ? getComputedStyle(qty).display : "missing",
                copyBottom: Math.round(copyRect?.bottom || 0),
                copyRight: Math.round(copyRect?.right || 0),
                qtyTop: Math.round(qtyRect?.top || 0),
                qtyLeft: Math.round(qtyRect?.left || 0)
              };
            });
            const stockQtySeparated = stockTextState.qtyTop >= stockTextState.copyBottom
              || stockTextState.qtyLeft >= stockTextState.copyRight - 2;
            if (stockTextState.lineClamp !== "2"
              || stockTextState.whiteSpace === "nowrap"
              || stockTextState.textOverflow === "ellipsis"
              || stockTextState.copyEmDisplay !== "none"
              || !["flex", "grid"].includes(stockTextState.qtyDisplay)
              || !stockQtySeparated) {
              report.failures.push({ width, type: "stress-warehouse-long-name", stockTextState, stockQtySeparated });
            }
          }
          if (stressLabel === "stress-prices") {
            await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
            await page.waitForTimeout(60);
            const bottomClearance = await page.evaluate(() => {
              const last = document.querySelector(".legacy-custom-price") || [...document.querySelectorAll(".legacy-price-group")].at(-1);
              const nav = document.querySelector(".bottom-nav");
              const shell = document.querySelector(".shell");
              const lr = last?.getBoundingClientRect();
              const nr = nav?.getBoundingClientRect();
              return {
                gap: lr && nr ? Math.round(nr.top - lr.bottom) : -999,
                shellPaddingBottom: shell ? getComputedStyle(shell).paddingBottom : "missing",
                scrollY: Math.round(window.scrollY),
                maxScroll: Math.round(document.documentElement.scrollHeight - window.innerHeight)
              };
            });
            if (bottomClearance.gap < 16
              || parseFloat(bottomClearance.shellPaddingBottom) < 90
              || Math.abs(bottomClearance.scrollY - bottomClearance.maxScroll) > 2) {
              report.failures.push({ width, type: "fixed-nav-bottom-clearance", bottomClearance });
            }
          }
        }

        await setState(page, uiState({ activePage: "orders" }));
        await page.locator(".legacy-order-card").first().click();
        const stressDetailText = await page.evaluate(() => {
          const name = document.querySelector(".legacy-expanded-title > strong");
          const model = document.querySelector(".legacy-expanded-device-copy small");
          const address = document.querySelector(".legacy-expanded-meta .address");
          const ns = getComputedStyle(name);
          const ms = getComputedStyle(model);
          const as = getComputedStyle(address);
          return {
            nameClamp: ns.webkitLineClamp,
            modelClamp: ms.webkitLineClamp,
            addressClamp: as.webkitLineClamp,
            nameWhiteSpace: ns.whiteSpace,
            modelWhiteSpace: ms.whiteSpace,
            addressWhiteSpace: as.whiteSpace,
            nameTextOverflow: ns.textOverflow,
            modelTextOverflow: ms.textOverflow,
            addressTextOverflow: as.textOverflow,
            nameOverflow: Math.max(0, name.scrollWidth - name.clientWidth),
            modelOverflow: Math.max(0, model.scrollWidth - model.clientWidth),
            addressOverflow: Math.max(0, address.scrollWidth - address.clientWidth),
            titleBottom: Math.round(document.querySelector(".legacy-expanded-title")?.getBoundingClientRect().bottom || 0),
            headSideTop: Math.round(document.querySelector(".legacy-expanded-head-side")?.getBoundingClientRect().top || 0)
          };
        });
        if (stressDetailText.nameClamp === "2"
          || stressDetailText.modelClamp === "2"
          || stressDetailText.addressClamp === "2"
          || stressDetailText.nameWhiteSpace === "nowrap"
          || stressDetailText.modelWhiteSpace === "nowrap"
          || stressDetailText.addressWhiteSpace === "nowrap"
          || stressDetailText.nameTextOverflow === "ellipsis"
          || stressDetailText.modelTextOverflow === "ellipsis"
          || stressDetailText.addressTextOverflow === "ellipsis"
          || stressDetailText.nameOverflow > 1
          || stressDetailText.modelOverflow > 1
          || stressDetailText.addressOverflow > 1
          || stressDetailText.headSideTop < stressDetailText.titleBottom) {
          report.failures.push({ width, type: "stress-order-detail-long-text", stressDetailText });
        }
        const stressDetail = await shot(page, width, "stress-order-detail", false);
        report.results.push(stressDetail);
        if (stressDetail.overflow > 2) report.failures.push({ width, type: "stress-horizontal-overflow", label: "stress-order-detail", overflow: stressDetail.overflow });
        await page.keyboard.press("Escape");

        const emptySeed = structuredClone(seed);
        emptySeed.orders = [];
        emptySeed.warehouse = [];
        emptySeed.warehouse_movements = [];
        emptySeed.expenses = [];
        emptySeed.incomes = [];
        emptySeed.service_custom = [];
        emptySeed.receipts = [];
        emptySeed.receipt_prices = [];
        emptySeed.tools = [];
        emptySeed.goods_sheets = [];
        emptySeed.draft = [];
        await writeSeed(page, emptySeed);

        for (const [emptyLabel, emptyState] of [
          ["empty-orders", uiState({ activePage: "orders" })],
          ["empty-warehouse", uiState({ activePage: "warehouse", warehouseSection: "list" })],
          ["empty-clients", uiState({ activePage: "more", moreSection: "clients" })],
          ["empty-goods", uiState({ activePage: "more", moreSection: "goods" })]
        ]) {
          await setState(page, emptyState);
          const emptySurface = await page.evaluate(() => {
            const node = document.querySelector(".panel.empty, .legacy-client-empty, .legacy-goods-empty, .legacy-price-empty.standalone, .legacy-finance-empty, .legacy-service-empty");
            if (!node) return { found: false };
            const style = getComputedStyle(node);
            return {
              found: true,
              background: style.backgroundColor,
              borderStyle: style.borderStyle,
              radius: style.borderRadius
            };
          });
          if (!emptySurface.found
            || emptySurface.background !== "rgb(6, 11, 15)"
            || emptySurface.borderStyle !== "dashed"
            || parseFloat(emptySurface.radius) < 12) {
            report.failures.push({ width, type: "empty-state-surface", label: emptyLabel, emptySurface });
          }
          const emptyResult = await shot(page, width, emptyLabel, true);
          report.results.push(emptyResult);
          if (emptyResult.overflow > 2) report.failures.push({ width, type: "empty-horizontal-overflow", label: emptyLabel, overflow: emptyResult.overflow });
        }

        const toastFeedback = await page.evaluate(() => {
          const toast = document.querySelector("#toast");
          toast.textContent = "Изменения сохранены";
          toast.classList.add("show");
          const style = getComputedStyle(toast);
          const rect = toast.getBoundingClientRect();
          const nav = document.querySelector(".bottom-nav")?.getBoundingClientRect();
          return {
            background: style.backgroundColor,
            radius: style.borderRadius,
            bottom: Math.round(rect.bottom),
            navTop: nav ? Math.round(nav.top) : 0
          };
        });
        if (toastFeedback.background !== "rgb(10, 17, 22)"
          || parseFloat(toastFeedback.radius) < 12
          || (toastFeedback.navTop && toastFeedback.bottom > toastFeedback.navTop - 2)) {
          report.failures.push({ width, type: "toast-feedback-surface", toastFeedback });
        }
        const toastShot = await shot(page, width, "toast-feedback", false);
        report.results.push(toastShot);
        await page.evaluate(() => document.querySelector("#toast")?.classList.remove("show"));

        const archiveSeed = structuredClone(seed);
        archiveSeed.orders[0].archived = true;
        archiveSeed.orders[0].archivedAt = "2026-09-26T15:00:00+03:00";
        archiveSeed.warehouse[0].archived = true;
        await writeSeed(page, archiveSeed);
        await setState(page, uiState({ activePage: "orders", orderFilter: "archived" }));
        const archivedOrders = await shot(page, width, "archived-orders", true);
        report.results.push(archivedOrders);
        if (archivedOrders.overflow > 2) report.failures.push({ width, type: "archive-horizontal-overflow", label: "archived-orders", overflow: archivedOrders.overflow });

        await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list", warehouseFilter: "all" }));
        const archivedWarehouse = await shot(page, width, "archived-warehouse", true);
        report.results.push(archivedWarehouse);
        if (archivedWarehouse.overflow > 2) report.failures.push({ width, type: "archive-horizontal-overflow", label: "archived-warehouse", overflow: archivedWarehouse.overflow });

        await writeSeed(page, seed);
        await setState(page, uiState({ activePage: "orders" }));
        await page.locator('[data-nav="warehouse"]').click();
        await page.waitForTimeout(60);
        if (await page.locator(".legacy-warehouse-page").count() !== 1) report.failures.push({ width, type: "nav-click", target: "warehouse" });
        await page.locator('[data-nav="orders"]').click();
        await page.waitForTimeout(60);
        await page.locator("#order-search").fill("Анна");
        await page.waitForTimeout(80);
        const visibleOrdersAfterSearch = await page.locator(".legacy-order-card").count();
        if (visibleOrdersAfterSearch !== 1) report.failures.push({ width, type: "order-search", count: visibleOrdersAfterSearch });

        const commentSearchSeed = structuredClone(seed);
        commentSearchSeed.orders[0].comment = "внутренний маркер магистраль 7788";
        commentSearchSeed.settings.searchMasterComment = false;
        await writeSeed(page, commentSearchSeed);
        await setState(page, uiState({ activePage: "orders", searchQuery: "" }));
        await page.locator("#order-search").fill("магистраль 7788");
        await page.waitForTimeout(70);
        const hiddenCommentMatches = await page.locator(".legacy-order-card").count();
        if (hiddenCommentMatches !== 0) report.failures.push({ width, type: "master-comment-search-disabled", count: hiddenCommentMatches });

        await setState(page, uiState({ activePage: "more", moreSection: "settings" }));
        const commentToggle = page.locator("#search-master-comment-toggle");
        if (await commentToggle.count() !== 1 || await commentToggle.isChecked()) {
          report.failures.push({ width, type: "master-comment-search-setting-default" });
        } else {
          await page.locator("label.settings-search-toggle").click();
          await page.waitForTimeout(70);
        }
        await setState(page, uiState({ activePage: "orders", searchQuery: "" }));
        await page.locator("#order-search").fill("магистраль 7788");
        await page.waitForTimeout(70);
        const enabledCommentMatches = await page.locator(".legacy-order-card").count();
        if (enabledCommentMatches !== 1) report.failures.push({ width, type: "master-comment-search-enabled", count: enabledCommentMatches });

        await writeSeed(page, seed);
        await setState(page, uiState({ activePage: "orders", searchQuery: "Анна" }));
        await page.locator('[data-filter="closed"]').click();
        await page.waitForTimeout(60);
        const visibleClosedAfterSearch = await page.locator(".legacy-order-card").count();
        if (visibleClosedAfterSearch !== 0) report.failures.push({ width, type: "order-filter-combination", count: visibleClosedAfterSearch });
      }

      if (width === 390) {
        const actSeed = structuredClone(seed);
        actSeed.orders[0].services = Array.from({ length: 12 }, (_, index) => ({
          name: `Тестовая работа №${index + 1} с расширенным наименованием`,
          qty: 1,
          price: 1000 + index * 125
        }));
        actSeed.orders[0].guarantee = 6;
        actSeed.orders[0].guaranteeTargets = [
          { id: "war-fridge-compressor", name: "Компрессор", tech: "Холодильник" },
          { id: "war-fridge-circuit", name: "Контур охлаждения", tech: "Холодильник" }
        ];
        actSeed.orders[0].guaranteeNote = "Дополнительные условия гарантии";
        await writeSeed(page, actSeed);
        await setState(page, uiState({ activePage: "more", moreSection: "act", selectedActOrderId: "0060" }));
        const warrantyBlock = await page.evaluate(() => ({
          count: document.querySelectorAll(".act-guarantee").length,
          text: document.querySelector(".act-guarantee")?.textContent || ""
        }));
        if (warrantyBlock.count !== 1
          || !warrantyBlock.text.includes("6 мес")
          || !warrantyBlock.text.includes("Компрессор")
          || !warrantyBlock.text.includes("Дополнительные условия")) {
          report.failures.push({ width, type: "act-warranty-block", warrantyBlock });
        }

        const downloadPromise = page.waitForEvent("download");
        await page.locator('[data-action="save-act-image"]').click();
        const download = await downloadPromise;
        const filename = download.suggestedFilename();
        const path = await download.path();
        const size = path ? fs.statSync(path).size : 0;
        if (filename !== "Акт_0060.png" || size < 5000) {
          report.failures.push({ width, type: "act-png-export", filename, size });
        }
      }
    }

    await context.close();
  }

  const utilityContext = await browser.newContext({
    viewport: { width: 320, height: 520 },
    deviceScaleFactor: 1,
    serviceWorkers: "block"
  });
  await utilityContext.addInitScript(() => {
    const nextState = sessionStorage.getItem("__crm_qa_next_state");
    if (!nextState) return;
    localStorage.setItem("crm-ui-state", nextState);
    sessionStorage.removeItem("__crm_qa_next_state");
  });
  const utilityPage = await utilityContext.newPage();
  utilityPage.setDefaultTimeout(8000);
  await writeSeed(utilityPage, seed);

  await setState(utilityPage, uiState({ activePage: "orders" }));
  await utilityPage.locator('[data-action="new-order"]').first().click();
  await utilityPage.waitForTimeout(80);
  const issueField = utilityPage.locator('.order-editor-modal [name="issue"]');
  await issueField.scrollIntoViewIfNeeded();
  await issueField.focus();
  const saveButton = utilityPage.locator('.order-editor-modal .modal-actions .primary-button');
  await saveButton.scrollIntoViewIfNeeded();
  const keyboardMetrics = await saveButton.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    return {
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      viewportHeight: window.innerHeight,
      locked: document.body.classList.contains("modal-open"),
      bodyFixed: getComputedStyle(document.body).position === "fixed"
    };
  });
  const keyboardReachable = keyboardMetrics.height >= 44
    && keyboardMetrics.top >= 0
    && keyboardMetrics.bottom <= keyboardMetrics.viewportHeight + 1
    && keyboardMetrics.locked
    && keyboardMetrics.bodyFixed;
  if (!keyboardReachable) report.failures.push({ type: "keyboard-height-order-editor", keyboardMetrics });
  await utilityPage.screenshot({ path: outDir + "/320-keyboard-order-editor.png", fullPage: false });
  report.results.push({
    label: "keyboard-order-editor",
    width: 320,
    viewportHeight: 520,
    bodyScrollWidth: await utilityPage.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)),
    viewportWidth: 320,
    overflow: await utilityPage.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth),
    modalOpen: keyboardMetrics.locked,
    tooSmall: [],
    keyboardReachable,
    keyboardMetrics
  });
  await utilityPage.keyboard.press("Escape");

  const keyboardEditorCases = [
    {
      label: "stock-editor",
      state: uiState({ activePage: "warehouse", warehouseSection: "list" }),
      open: '[data-action="new-stock"]',
      field: '.stock-editor-modal [name="initialPurchaseTotal"]',
      action: '.stock-editor-modal .modal-actions .primary-button',
      actions: '.stock-editor-modal .modal-actions'
    },
    {
      label: "finance-editor",
      state: uiState({ activePage: "more", moreSection: "finance" }),
      open: '[data-action="add-finance"][data-type="income"]',
      field: '.finance-entry-modal [name="description"]',
      action: '.finance-entry-modal .modal-actions .primary-button',
      actions: '.finance-entry-modal .modal-actions'
    },
    {
      label: "price-editor",
      state: uiState({ activePage: "more", moreSection: "prices" }),
      open: '[data-action="new-price"]',
      field: '.legacy-price-editor [name="price"]',
      action: '.legacy-price-editor-actions .legacy-editor-save',
      actions: '.legacy-price-editor-actions'
    },
    {
      label: "goods-editor",
      state: uiState({ activePage: "more", moreSection: "goods" }),
      open: '[data-action="new-goods-sheet"]',
      field: '.legacy-goods-editor [name="target"]',
      action: '.legacy-goods-savebar .legacy-save-goods',
      actions: '.legacy-goods-savebar'
    },
    {
      label: "tool-editor",
      state: uiState({ activePage: "more", moreSection: "tools" }),
      open: '[data-action="new-tool"]',
      field: '.tool-editor-modal [name="note"]',
      action: '.tool-editor-modal .modal-actions .primary-button',
      actions: '.tool-editor-modal .modal-actions'
    },
    {
      label: "receipt-editor",
      state: uiState({ activePage: "more", moreSection: "receipts" }),
      open: '[data-action="new-receipt"]',
      field: '.receipt-editor-modal [name="note"]',
      action: '.receipt-editor-modal .modal-actions .primary-button',
      actions: '.receipt-editor-modal .modal-actions'
    }
  ];

  for (const editorCase of keyboardEditorCases) {
    await setState(utilityPage, editorCase.state);
    await utilityPage.locator(editorCase.open).first().click();
    await utilityPage.waitForTimeout(60);
    const editorField = utilityPage.locator(editorCase.field);
    await editorField.scrollIntoViewIfNeeded();
    await editorField.focus();
    const editorAction = utilityPage.locator(editorCase.action);
    await editorAction.scrollIntoViewIfNeeded();
    const metrics = await editorAction.evaluate((node, actionsSelector) => {
      const rect = node.getBoundingClientRect();
      const backdrop = node.closest(".modal-backdrop");
      const actions = document.querySelector(actionsSelector);
      const actionsStyle = actions ? getComputedStyle(actions) : null;
      const actionsRect = actions?.getBoundingClientRect();
      const actionButtons = actions ? [...actions.querySelectorAll(":scope > button")].map((button) => {
        const buttonRect = button.getBoundingClientRect();
        return {
          width: Math.round(buttonRect.width),
          height: Math.round(buttonRect.height),
          top: Math.round(buttonRect.top)
        };
      }) : [];
      return {
        top: Math.round(rect.top),
        bottom: Math.round(rect.bottom),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
        viewportHeight: window.innerHeight,
        backdropCount: document.querySelectorAll(".modal-backdrop").length,
        backdropOverflow: backdrop ? getComputedStyle(backdrop).overflowY : "missing",
        locked: document.body.classList.contains("modal-open"),
        bodyFixed: getComputedStyle(document.body).position === "fixed",
        actionsInnerWidth: actionsRect && actionsStyle
          ? Math.round(actionsRect.width - (parseFloat(actionsStyle.paddingLeft) || 0) - (parseFloat(actionsStyle.paddingRight) || 0))
          : 0,
        actionButtons
      };
    }, editorCase.actions);
    const actionsFullWidth = metrics.actionButtons.length >= 2
      && metrics.actionButtons.every((button) => button.width >= metrics.actionsInnerWidth - 2 && button.height >= 44)
      && metrics.actionButtons.every((button, index, buttons) => index === 0 || button.top > buttons[index - 1].top);
    const reachable = metrics.height >= 44
      && metrics.top >= 0
      && metrics.bottom <= metrics.viewportHeight + 1
      && metrics.backdropCount === 1
      && metrics.locked
      && metrics.bodyFixed
      && actionsFullWidth;
    if (!reachable) report.failures.push({ type: "keyboard-height-editor", label: editorCase.label, metrics, actionsFullWidth });
    await utilityPage.screenshot({ path: outDir + "/320-keyboard-" + editorCase.label + ".png", fullPage: false });
    report.results.push({
      label: "keyboard-" + editorCase.label,
      width: 320,
      viewportHeight: 520,
      bodyScrollWidth: await utilityPage.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)),
      viewportWidth: 320,
      overflow: await utilityPage.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth),
      modalOpen: metrics.locked,
      tooSmall: [],
      keyboardReachable: reachable,
      keyboardMetrics: metrics
    });
    await utilityPage.keyboard.press("Escape");
  }

  await writeSeed(utilityPage, seed);
  await setState(utilityPage, uiState({ activePage: "more", moreSection: "backup" }));
  await utilityPage.locator('[data-action="backup-self-test"]').click();
  await utilityPage.locator("#toast.show").waitFor({ state: "visible", timeout: 8000 });
  const backupToast = (await utilityPage.locator("#toast").innerText()).trim();
  const backupRoundtripOk = /(?:полностью проверены|исправны)/i.test(backupToast) && !/не пройдена/i.test(backupToast);
  if (!backupRoundtripOk) report.failures.push({ type: "backup-roundtrip", toast: backupToast });
  report.results.push({
    label: "backup-roundtrip",
    width: 320,
    bodyScrollWidth: await utilityPage.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)),
    viewportWidth: 320,
    overflow: await utilityPage.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth),
    modalOpen: false,
    tooSmall: [],
    backupRoundtripOk,
    toast: backupToast
  });

  const backupIntervals = await utilityPage.locator("#backup-days option").evaluateAll((nodes) => nodes.map((node) => Number(node.value)));
  if (JSON.stringify(backupIntervals) !== JSON.stringify([1,2,3,5,7,10])) {
    report.failures.push({ type: "backup-intervals", backupIntervals });
  }

  const fallbackSeed = structuredClone(seed);
  fallbackSeed.settings = { ...fallbackSeed.settings, autoBackup: true, autoBackupDays: 1, lastBackupAt: "2020-01-01T00:00:00.000Z" };
  await writeSeed(utilityPage, fallbackSeed);
  await setState(utilityPage, uiState({ activePage: "more", moreSection: "backup" }));
  await utilityPage.waitForFunction(async () => {
    return new Promise((resolve) => {
      const request = indexedDB.open("crm-romanychev", 1);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("keyval", "readonly");
        const get = tx.objectStore("keyval").get("crm-auto-backup-fallback");
        get.onsuccess = () => { resolve(Boolean(get.result?.payload)); db.close(); };
        get.onerror = () => { resolve(false); db.close(); };
      };
      request.onerror = () => resolve(false);
    });
  }, null, { timeout: 5000 });
  const fallbackSnapshot = await readIdbKey(utilityPage, "crm-auto-backup-fallback");
  const fallbackStoredData = await readStoredData(utilityPage);
  let fallbackPayload = null;
  try { fallbackPayload = JSON.parse(fallbackSnapshot?.payload || "null"); } catch {}
  if (!fallbackSnapshot?.createdAt
    || !fallbackPayload
    || fallbackPayload.orders?.length !== seed.orders.length
    || fallbackStoredData.settings?.lastBackupKind !== "local") {
    report.failures.push({ type: "backup-local-fallback", fallbackSnapshot, lastBackupKind: fallbackStoredData.settings?.lastBackupKind });
  }
  report.results.push({
    label: "backup-local-fallback",
    width: 320,
    bodyScrollWidth: await utilityPage.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)),
    viewportWidth: 320,
    overflow: await utilityPage.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth),
    modalOpen: false,
    tooSmall: [],
    fallbackCreatedAt: fallbackSnapshot?.createdAt || null
  });
  await utilityContext.close();

  const pwaContext = await browser.newContext({
    viewport: { width: 390, height: 900 },
    deviceScaleFactor: 1,
    serviceWorkers: "allow"
  });
  const pwaPage = await pwaContext.newPage();
  const pageErrorMessages = [];
  pwaPage.on("pageerror", (error) => pageErrorMessages.push(String(error)));
  await pwaPage.goto(BASE_URL, { waitUntil: "networkidle" });
  const swReady = await pwaPage.evaluate(async () => {
    if (!("serviceWorker" in navigator)) return false;
    const registration = await navigator.serviceWorker.ready;
    return Boolean(registration?.active);
  });
  if (!swReady) report.failures.push({ type: "pwa-service-worker", message: "Service worker did not become active" });
  await pwaPage.reload({ waitUntil: "domcontentloaded" });
  await pwaPage.waitForSelector("#app .shell", { timeout: 5000 });
  await pwaContext.setOffline(true);
  let offlineLoaded = true;
  try {
    await pwaPage.reload({ waitUntil: "domcontentloaded", timeout: 10000 });
    await pwaPage.waitForSelector("#app .shell", { timeout: 5000 });
  } catch (error) {
    offlineLoaded = false;
    report.failures.push({ type: "pwa-offline-reload", message: String(error && error.message || error) });
  }
  const offlineShell = offlineLoaded ? await pwaPage.locator("#app .shell").count() : 0;
  if (offlineLoaded && offlineShell !== 1) report.failures.push({ type: "pwa-offline-shell", count: offlineShell });
  if (pageErrorMessages.length) report.failures.push({ type: "pwa-pageerror", messages: pageErrorMessages });
  report.results.push({ label: "pwa-offline", width: 390, bodyScrollWidth: null, viewportWidth: 390, overflow: 0, modalOpen: false, tooSmall: [], serviceWorkerReady: swReady, offlineLoaded });
  await pwaContext.setOffline(false);
  await pwaContext.close();

  fs.writeFileSync(outDir + "/report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ failures: report.failures, checked: report.results.length }, null, 2));
  await browser.close();
  activeBrowser = null;
  if (report.failures.length) process.exitCode = 1;
})().catch(async (error) => {
  report.failures.push({ type: "fatal", message: String(error && error.message || error) });
  fs.writeFileSync(outDir + "/report.json", JSON.stringify(report, null, 2));
  fs.writeFileSync(outDir + "/fatal.txt", String(error && error.stack || error));
  console.error(error);
  try { await activeBrowser?.close(); } catch {}
  activeBrowser = null;
  process.exitCode = 1;
});
