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
    const clippedFieldLabels = [...document.querySelectorAll(
      ".form-group > label, .legacy-settings-grid label > span, .warehouse-filter-control > small, .warranty-manager-tech label > span"
    )]
      .filter(visible)
      .map((node) => {
        const rect = node.getBoundingClientRect();
        const style = getComputedStyle(node);
        return {
          text: (node.textContent || "").trim().replace(/\\s+/g, " ").slice(0, 80),
          width: Math.round(rect.width),
          scrollWidth: Math.round(node.scrollWidth || 0),
          whiteSpace: style.whiteSpace,
          overflow: style.overflow
        };
      })
      .filter((item) => item.text && item.scrollWidth > item.width + 1)
      .slice(0, 30);
    const misalignedActionIcons = [...document.querySelectorAll("button .ui-icon, a .ui-icon, summary .ui-icon")]
      .filter(visible)
      .map((icon) => {
        const action = icon.closest("button, a, summary");
        if (!action || !visible(action)) return null;
        if (action.matches(".nav-button, .legacy-client-main")) return null;
        if (action.closest(".legacy-order-actions, .legacy-expanded-actions")) return null;
        const actionStyle = getComputedStyle(action);
        const iconStyle = getComputedStyle(icon);
        const display = actionStyle.display;
        const centeredLayout = (display.includes("flex") && !String(actionStyle.flexDirection || "").startsWith("column") && actionStyle.alignItems === "center")
          || (display.includes("grid") && actionStyle.alignItems === "center");
        if (!centeredLayout || iconStyle.position === "absolute") return null;
        const actionRect = action.getBoundingClientRect();
        const iconRect = icon.getBoundingClientRect();
        const delta = Math.abs((actionRect.top + actionRect.height / 2) - (iconRect.top + iconRect.height / 2));
        return {
          text: (action.innerText || action.getAttribute("aria-label") || "").trim().replace(/\s+/g, " ").slice(0, 60),
          delta: Math.round(delta * 10) / 10,
          actionHeight: Math.round(actionRect.height),
          iconHeight: Math.round(iconRect.height),
          className: String(action.className || "").slice(0, 100)
        };
      })
      .filter((item) => item && item.delta > 2.5)
      .slice(0, 30);
    return {
      label: labelValue,
      width: widthValue,
      bodyScrollWidth: Math.max(root.scrollWidth, body.scrollWidth),
      viewportWidth: window.innerWidth,
      overflow,
      modalOpen: body.classList.contains("modal-open"),
      tooSmall,
      clippedFieldLabels,
      misalignedActionIcons
    };
  }, { labelValue: label, widthValue: width });
}

async function shot(page, width, label, fullPage = true) {
  const result = await inspect(page, label, width);
  if (result.tooSmall.length) {
    report.failures.push({ width, type: "small-touch-target", label, items: result.tooSmall });
  }
  if (result.clippedFieldLabels.length) {
    report.failures.push({ width, type: "clipped-field-label", label, items: result.clippedFieldLabels });
  }
  if (result.misalignedActionIcons.length) {
    report.failures.push({ width, type: "misaligned-action-icon", label, items: result.misalignedActionIcons });
  }
  await page.screenshot({ path: outDir + "/" + width + "-" + label + ".png", fullPage });
  return result;
}

async function assertPairedFooter(page, width, selector, type) {
  const state = await page.evaluate((selectorValue) => {
    const footer = document.querySelector(selectorValue);
    const rect = footer?.getBoundingClientRect();
    const style = footer ? getComputedStyle(footer) : null;
    const paddingLeft = style ? (parseFloat(style.paddingLeft) || 0) : 0;
    const paddingRight = style ? (parseFloat(style.paddingRight) || 0) : 0;
    const buttons = footer ? [...footer.querySelectorAll(":scope > button")].map((button) => {
      const buttonRect = button.getBoundingClientRect();
      return {
        left: Math.round(buttonRect.left),
        top: Math.round(buttonRect.top),
        width: Math.round(buttonRect.width),
        height: Math.round(buttonRect.height)
      };
    }) : [];
    return {
      footerHeight: Math.round(rect?.height || 0),
      contentLeft: rect ? Math.round(rect.left + paddingLeft) : 0,
      innerWidth: rect ? Math.round(rect.width - paddingLeft - paddingRight) : 0,
      buttons
    };
  }, selector);
  const first = state.buttons[0];
  const second = state.buttons[1];
  const gap = first && second ? second.left - (first.left + first.width) : 999;
  const usedWidth = first && second ? first.width + gap + second.width : 0;
  if (state.buttons.length !== 2
    || state.buttons.some((button) => button.width < 96 || button.height < 48 || button.height > 49)
    || Math.abs((first?.top || 0) - (second?.top || 0)) > 2
    || (second?.left || 0) <= (first?.left || 0)
    || Math.abs((first?.left || 0) - state.contentLeft) > 2
    || gap < 4
    || gap > 10
    || Math.abs(usedWidth - state.innerWidth) > 2
    || state.footerHeight > 72) {
    report.failures.push({ width, type, state, gap, usedWidth });
  }
  return state;
}

async function assertCompactDangerFooter(page, width, selector, type) {
  const state = await page.evaluate((selectorValue) => {
    const footer = document.querySelector(selectorValue);
    const rect = footer?.getBoundingClientRect();
    const style = footer ? getComputedStyle(footer) : null;
    const paddingLeft = style ? (parseFloat(style.paddingLeft) || 0) : 0;
    const paddingRight = style ? (parseFloat(style.paddingRight) || 0) : 0;
    const buttons = footer ? [...footer.querySelectorAll(":scope > button")].map((button) => {
      const buttonRect = button.getBoundingClientRect();
      const label = button.querySelector("span");
      return {
        left: Math.round(buttonRect.left),
        top: Math.round(buttonRect.top),
        width: Math.round(buttonRect.width),
        height: Math.round(buttonRect.height),
        aria: button.getAttribute("aria-label") || "",
        hasIcon: Boolean(button.querySelector(".ui-icon")),
        labelDisplay: label ? getComputedStyle(label).display : "missing"
      };
    }) : [];
    return {
      footerHeight: Math.round(rect?.height || 0),
      contentLeft: rect ? Math.round(rect.left + paddingLeft) : 0,
      innerWidth: rect ? Math.round(rect.width - paddingLeft - paddingRight) : 0,
      buttons
    };
  }, selector);
  const [danger, cancel, save] = state.buttons;
  const gap1 = danger && cancel ? cancel.left - (danger.left + danger.width) : 999;
  const gap2 = cancel && save ? save.left - (cancel.left + cancel.width) : 999;
  const usedWidth = danger && cancel && save ? danger.width + gap1 + cancel.width + gap2 + save.width : 0;
  if (state.buttons.length !== 3
    || danger?.width < 44 || danger?.width > 45
    || danger?.height < 48 || danger?.height > 49
    || !danger?.aria || !danger?.hasIcon || danger?.labelDisplay !== "none"
    || cancel?.width < 72 || cancel?.height < 48 || cancel?.height > 49
    || save?.width < 100 || save?.height < 48 || save?.height > 49
    || Math.max(...state.buttons.map((button) => button.top)) - Math.min(...state.buttons.map((button) => button.top)) > 2
    || Math.abs((danger?.left || 0) - state.contentLeft) > 2
    || gap1 < 4 || gap1 > 10 || gap2 < 4 || gap2 > 10
    || Math.abs(usedWidth - state.innerWidth) > 2
    || state.footerHeight > 72) {
    report.failures.push({ width, type, state, gap1, gap2, usedWidth });
  }
  return state;
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
        const grid = document.querySelector(".order-editor-modal .form-grid:not(.legacy-payment-grid)");
        const rect = (name) => {
          const box = document.querySelector(`.order-editor-modal [name="${name}"]`)?.closest(".form-group")?.getBoundingClientRect();
          return box ? { left: Math.round(box.left), top: Math.round(box.top), width: Math.round(box.width) } : null;
        };
        const gridRect = grid?.getBoundingClientRect();
        return {
          sourceOptions: document.querySelectorAll('.order-editor-modal [name="sourceId"] option').length,
          gridWidth: Math.round(gridRect?.width || 0),
          client: rect("name"),
          phone: rect("phone"),
          tech: rect("tech"),
          brand: rect("brand"),
          createdDate: rect("createdDate"),
          visitDate: rect("nextVisitDate"),
          visitTime: rect("nextVisitTime"),
          visitDuration: rect("nextVisitDuration"),
          source: rect("sourceId"),
          status: rect("status"),
          issue: rect("issue"),
          compactTextFit: (() => {
            const measure = (node, text, extra = 0) => {
              if (!node) return { required: 999, available: 0, text: "" };
              const style = getComputedStyle(node);
              const canvas = document.createElement("canvas");
              const ctx = canvas.getContext("2d");
              ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
              return {
                text,
                required: Math.ceil(ctx.measureText(text).width) + extra,
                available: Math.floor(node.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0))
              };
            };
            const brand = document.querySelector('.order-editor-modal [name="brand"]');
            const source = document.querySelector('.order-editor-modal [name="sourceId"]');
            const tech = document.querySelector('.order-editor-modal [name="tech"]');
            const techOptions = [...(tech?.options || [])].map((option) => option.textContent?.trim() || "").filter(Boolean);
            const longestTech = techOptions.sort((a, b) => b.length - a.length)[0] || "";
            return {
              brand: measure(brand, brand?.placeholder || ""),
              source: measure(source, source?.selectedOptions?.[0]?.textContent?.trim() || "", 20),
              techLongest: measure(tech, longestTech, 20)
            };
          })()
        };
      });
      const pairAligned = (left, right) => left && right
        && Math.abs(left.top - right.top) <= 2
        && right.left > left.left
        && left.width >= 120
        && right.width >= 120;
      const fullWidthField = (field) => field && field.width >= sourceVisitFields.gridWidth * 0.92;
      if (sourceVisitFields.sourceOptions < 3
        || !pairAligned(sourceVisitFields.client, sourceVisitFields.phone)
        || (width > 340 && !pairAligned(sourceVisitFields.tech, sourceVisitFields.brand))
        || (width <= 340 && (!fullWidthField(sourceVisitFields.tech) || !fullWidthField(sourceVisitFields.brand)))
        || (width <= 340 && sourceVisitFields.compactTextFit.techLongest.required > sourceVisitFields.compactTextFit.techLongest.available)
        || !pairAligned(sourceVisitFields.createdDate, sourceVisitFields.visitDate)
        || !pairAligned(sourceVisitFields.visitTime, sourceVisitFields.visitDuration)
        || !pairAligned(sourceVisitFields.source, sourceVisitFields.status)
        || sourceVisitFields.compactTextFit.brand.text !== "Марка / модель"
        || sourceVisitFields.compactTextFit.source.text !== "Выбери"
        || sourceVisitFields.compactTextFit.brand.required > sourceVisitFields.compactTextFit.brand.available
        || sourceVisitFields.compactTextFit.source.required > sourceVisitFields.compactTextFit.source.available
        || !fullWidthField(sourceVisitFields.issue)) {
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

      const nearestVisitState = await page.evaluate(() => {
        const section = document.querySelector(".legacy-nearest-visit");
        const title = section?.querySelector(".legacy-nearest-title");
        const calendar = title?.querySelector("button");
        const rows = [...(section?.querySelectorAll(".legacy-nearest-visits-list .legacy-nearest-line") || [])];
        return {
          rows: rows.length,
          text: section?.innerText || "",
          sectionRadius: section ? parseFloat(getComputedStyle(section).borderRadius || "0") : 0,
          sectionBackground: section ? getComputedStyle(section).backgroundColor : "missing",
          titleHeight: Math.round(title?.getBoundingClientRect().height || 0),
          calendarHeight: Math.round(calendar?.getBoundingClientRect().height || 0),
          rowHeights: rows.map((row) => Math.round(row.getBoundingClientRect().height || 0))
        };
      });
      if (nearestVisitState.rows < 1
        || !nearestVisitState.text.includes("02.01.2030")
        || nearestVisitState.sectionRadius !== 12
        || nearestVisitState.sectionBackground !== "rgb(12, 23, 33)"
        || nearestVisitState.titleHeight < 44
        || nearestVisitState.titleHeight > 45
        || nearestVisitState.calendarHeight < 44
        || nearestVisitState.calendarHeight > 45
        || nearestVisitState.rowHeights.some((height) => height < 44 || height > 45)) {
        report.failures.push({ width, type: "nearest-visits-three-slot", nearestVisitState });
      }

      await writeSeed(page);
      await setState(page, uiState({ activePage: "more", moreSection: "settings" }));
      await page.locator('[data-action="manage-order-sources"]').click();
      await page.waitForTimeout(40);
      const sourceManagerInitial = await page.evaluate(() => {
        const head = document.querySelector(".source-manager-head");
        const list = document.querySelector(".source-manager-list");
        const row = document.querySelector(".source-manager-row");
        const close = document.querySelector(".source-manager-head > button");
        const add = document.querySelector(".source-manager-add");
        const addField = document.querySelector(".source-manager-add .field");
        const px = (value) => Number.parseFloat(value || "0") || 0;
        return {
          modal: document.querySelectorAll(".source-manager-modal").length,
          rows: document.querySelectorAll(".source-manager-row").length,
          locked: document.body.classList.contains("modal-open"),
          headHeight: Math.round(head?.getBoundingClientRect().height || 0),
          listPaddingTop: list ? px(getComputedStyle(list).paddingTop) : 999,
          listGap: list ? px(getComputedStyle(list).rowGap) : 999,
          rowHeight: Math.round(row?.getBoundingClientRect().height || 0),
          closeWidth: Math.round(close?.getBoundingClientRect().width || 0),
          closeHeight: Math.round(close?.getBoundingClientRect().height || 0),
          addPaddingTop: add ? px(getComputedStyle(add).paddingTop) : 999,
          addGap: add ? px(getComputedStyle(add).rowGap) : 999,
          addFieldHeight: Math.round(addField?.getBoundingClientRect().height || 0)
        };
      });
      if (sourceManagerInitial.modal !== 1 || sourceManagerInitial.rows < 2 || !sourceManagerInitial.locked) {
        report.failures.push({ width, type: "source-manager-open", sourceManagerInitial });
      }
      if (sourceManagerInitial.headHeight > 62
        || sourceManagerInitial.listPaddingTop > 10
        || sourceManagerInitial.listGap > 6.5
        || sourceManagerInitial.rowHeight < 44
        || sourceManagerInitial.rowHeight > 46
        || sourceManagerInitial.closeWidth < 44
        || sourceManagerInitial.closeHeight < 44
        || sourceManagerInitial.addPaddingTop > 10
        || sourceManagerInitial.addGap > 6.5
        || sourceManagerInitial.addFieldHeight < 48) {
        report.failures.push({ width, type: "source-manager-compact-density", sourceManagerInitial });
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
      const managerHelpMetrics = await page.evaluate(() => {
        const node = document.querySelector(".price-categories-modal .manager-help");
        const style = node ? getComputedStyle(node) : null;
        return {
          fontSize: parseFloat(style?.fontSize || "0") || 0,
          lineHeight: parseFloat(style?.lineHeight || "0") || 0,
          marginTop: parseFloat(style?.marginTop || "999") || 999,
          marginBottom: parseFloat(style?.marginBottom || "999") || 999,
          height: Math.round(node?.getBoundingClientRect().height || 999)
        };
      });
      if (managerHelpMetrics.fontSize < 12.5
        || managerHelpMetrics.fontSize > 13
        || managerHelpMetrics.lineHeight > 18
        || managerHelpMetrics.marginTop > 8
        || managerHelpMetrics.marginBottom > 7
        || managerHelpMetrics.height > (width <= 340 ? 72 : 56)) {
        report.failures.push({ width, type: "manager-help-compact-density", managerHelpMetrics });
      }
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
          visibleTimelineRows: [...timelineRows].filter((node) => getComputedStyle(node).display !== "none").length,
          hiddenTimelineRows: [...timelineRows].filter((node) => getComputedStyle(node).display === "none").length,
          fullDayToggle: Boolean(document.querySelector("[data-calendar-full-day]")),
          fullDayExpanded: document.querySelector("[data-calendar-full-day]")?.getAttribute("aria-expanded") || "",
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
        || calendarState.visibleTimelineRows < 3
        || calendarState.visibleTimelineRows > 5
        || calendarState.hiddenTimelineRows < 8
        || !calendarState.fullDayToggle
        || calendarState.fullDayExpanded !== "false"
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
        const firstHour = [...document.querySelectorAll(".calendar-hour-row")].find((node) => getComputedStyle(node).display !== "none");
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

      await page.locator("[data-calendar-full-day]").click();
      const calendarFullDayState = await page.evaluate(() => ({
        visibleRows: [...document.querySelectorAll(".calendar-hour-row")].filter((node) => getComputedStyle(node).display !== "none").length,
        expanded: document.querySelector("[data-calendar-full-day]")?.getAttribute("aria-expanded") || "",
        label: document.querySelector("[data-calendar-full-day]")?.textContent?.replace(/\s+/g, " ").trim() || ""
      }));
      if (calendarFullDayState.visibleRows !== 13
        || calendarFullDayState.expanded !== "true"
        || !calendarFullDayState.label.includes("Свернуть весь день")) {
        report.failures.push({ width, type: "calendar-full-day-toggle", calendarFullDayState });
      }
      await page.locator("[data-calendar-full-day]").click();

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
      const nr = nav?.getBoundingClientRect();
      const br = active?.getBoundingClientRect();
      const ir = activeIcon?.getBoundingClientRect();
      const glyph = activeIcon?.querySelector(".ui-icon")?.getBoundingClientRect();
      const lr = logo?.getBoundingClientRect();
      return {
        headerHeight: hr ? Math.round(hr.height) : 0,
        navHeight: nr ? Math.round(nr.height) : 0,
        navButtonHeight: br ? Math.round(br.height) : 0,
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
        activeGlyphWidth: glyph ? Math.round(glyph.width) : 0,
        activeGlyphHeight: glyph ? Math.round(glyph.height) : 0,
        labelSpread: labelTops.length ? Math.max(...labelTops) - Math.min(...labelTops) : 999
      };
    });
    const expectedHeaderMin = 68;
    const expectedLogo = width <= 340 ? 40 : 42;
    if (shellSurface.headerHeight < expectedHeaderMin
      || shellSurface.headerHeight > expectedHeaderMin + 1
      || shellSurface.headerBorder !== "1px"
      || shellSurface.headerBackground !== "rgb(8, 13, 17)"
      || parseFloat(shellSurface.titleFont) < (width <= 340 ? 16.5 : 17)
      || shellSurface.logoDisplay === "none"
      || shellSurface.logoWidth !== expectedLogo
      || shellSurface.logoHeight !== expectedLogo
      || shellSurface.navHeight < 68
      || shellSurface.navHeight > 69
      || shellSurface.navButtonHeight < 54
      || shellSurface.navButtonHeight > 55
      || !shellSurface.navBackground.startsWith("rgba(9, 13, 16, ")
      || shellSurface.navBorder !== "rgb(37, 44, 50)"
      || shellSurface.activeColor !== "rgb(255, 114, 85)"
      || shellSurface.activeIconBackground !== "rgba(0, 0, 0, 0)"
      || shellSurface.activeIconWidth !== 28
      || shellSurface.activeIconHeight !== 28
      || shellSurface.activeGlyphWidth !== 23
      || shellSurface.activeGlyphHeight !== 23
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
    if (moreNavSurface.color !== "rgb(255, 114, 85)"
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
        columns: style?.gridTemplateColumns || "",
        buttons
      };
    });
    if (warehouseShortcutLayout.buttons.length !== 2
      || warehouseShortcutLayout.columns.split(" ").filter(Boolean).length !== 2
      || warehouseShortcutLayout.buttons.some((button) => button.width < 125)
      || Math.abs(warehouseShortcutLayout.buttons[0]?.width - warehouseShortcutLayout.buttons[1]?.width) > 2
      || warehouseShortcutLayout.buttons.some((button) => button.height < 44 || button.height > 45)
      || warehouseShortcutLayout.buttons.some((button) => button.labelWrap)
      || Math.abs(warehouseShortcutLayout.buttons[0]?.top - warehouseShortcutLayout.buttons[1]?.top) > 2
      || warehouseShortcutLayout.buttons[1]?.left <= warehouseShortcutLayout.buttons[0]?.left) {
      report.failures.push({ width, type: "warehouse-shortcuts-two-columns", warehouseShortcutLayout });
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
          height: Math.round(rect.height),
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
      || shoppingActionLayout.buttons[0]?.width < shoppingActionLayout.containerWidth - 8
      || Math.abs((shoppingActionLayout.buttons[0]?.left || 0) - shoppingActionLayout.containerLeft) > 2
      || shoppingActionLayout.buttons.some((button) => button.height < 48 || button.height > 49)
      || shoppingActionLayout.buttons[1]?.top <= shoppingActionLayout.buttons[0]?.top
      || Math.abs((shoppingActionLayout.buttons[1]?.top || 0) - (shoppingActionLayout.buttons[2]?.top || 0)) > 2
      || Math.abs((shoppingActionLayout.buttons[1]?.width || 0) - (shoppingActionLayout.buttons[2]?.width || 0)) > 2
      || (shoppingActionLayout.buttons[1]?.width || 0) < 120
      || Math.abs((shoppingActionLayout.buttons[1]?.left || 0) - shoppingActionLayout.containerLeft) > 2
      || (shoppingActionLayout.buttons[2]?.left || 0) <= (shoppingActionLayout.buttons[1]?.left || 0)) {
      report.failures.push({ width, type: "shopping-actions-compact-grid", shoppingActionLayout });
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
        select: getComputedStyle(document.querySelector('.order-editor-modal select[name="tech"]')).backgroundColor,
        numberAppearance: getComputedStyle(document.querySelector('.order-editor-modal input[type="number"]')).appearance
      }));
      if (orderFieldSurfaces.input !== "rgb(9, 15, 20)"
        || orderFieldSurfaces.textarea !== "rgb(9, 15, 20)"
        || orderFieldSurfaces.select !== "rgb(9, 15, 20)"
        || !["textfield","none"].includes(orderFieldSurfaces.numberAppearance)) {
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
        saveButton: document.querySelector('[data-action="save-act-image"]')?.textContent || "",
        bottomNavCount: document.querySelectorAll(".bottom-nav").length,
        backButtonCount: document.querySelectorAll(".legacy-act-head .legacy-back-button").length,
        actSelectFit: (() => {
          const node = document.querySelector("#act-order-select");
          if (!node) return { text: "", required: 999, available: 0 };
          const style = getComputedStyle(node);
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
          const text = node.selectedOptions?.[0]?.textContent?.trim() || "";
          return {
            text,
            required: Math.ceil(ctx.measureText(text).width),
            available: Math.floor(node.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0) - 24)
          };
        })()
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
        || !actScreenSurface.saveButton.includes("Сохранить картинку")
        || actScreenSurface.bottomNavCount !== 0
        || actScreenSurface.backButtonCount !== 1
        || actScreenSurface.actSelectFit.text.includes("Холодильник")
        || actScreenSurface.actSelectFit.required > actScreenSurface.actSelectFit.available + 1) {
        report.failures.push({ width, type: "act-semantic-hierarchy", actScreenSurface });
      }
      const actDensity = await page.evaluate(() => {
        const control = document.querySelector(".legacy-act-control")?.getBoundingClientRect();
        const title = document.querySelector(".legacy-act-control-title")?.getBoundingClientRect();
        const field = document.querySelector(".legacy-act-control .field")?.getBoundingClientRect();
        const selected = document.querySelector(".legacy-act-selected")?.getBoundingClientRect();
        const actionNode = document.querySelector(".legacy-act-control-actions button");
        const action = actionNode?.getBoundingClientRect();
        const fieldNode = document.querySelector(".legacy-act-control .field");
        const fieldStyle = fieldNode ? getComputedStyle(fieldNode) : null;
        const titleIcon = document.querySelector(".legacy-act-control-title > span");
        const selectedIcon = document.querySelector(".legacy-act-selected-icon");
        const centerDelta = (box, child) => {
          const boxRect = box?.getBoundingClientRect();
          const childRect = child?.getBoundingClientRect();
          if (!boxRect || !childRect) return 999;
          return Math.round(Math.abs((boxRect.top + boxRect.height / 2) - (childRect.top + childRect.height / 2)) * 10) / 10;
        };
        return {
          controlHeight: Math.round(control?.height || 0),
          titleHeight: Math.round(title?.height || 0),
          fieldHeight: Math.round(field?.height || 0),
          fieldPaddingTop: parseFloat(fieldStyle?.paddingTop || "0") || 0,
          fieldPaddingBottom: parseFloat(fieldStyle?.paddingBottom || "0") || 0,
          selectedHeight: Math.round(selected?.height || 0),
          actionHeight: Math.round(action?.height || 0),
          titleIconDelta: centerDelta(titleIcon, titleIcon?.querySelector(".ui-icon")),
          selectedIconDelta: centerDelta(selectedIcon, selectedIcon?.querySelector(".ui-icon")),
          actionIconDelta: centerDelta(actionNode, actionNode?.querySelector(".ui-icon"))
        };
      });
      if (!actDensity.controlHeight
        || actDensity.controlHeight > 216
        || actDensity.titleHeight > 38
        || actDensity.fieldHeight !== 46
        || actDensity.fieldPaddingTop !== 0
        || actDensity.fieldPaddingBottom !== 0
        || actDensity.selectedHeight > 58
        || actDensity.actionHeight < 44
        || actDensity.titleIconDelta > 1
        || actDensity.selectedIconDelta > 1
        || actDensity.actionIconDelta > 1) {
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
        const add = document.querySelector(".legacy-orders-add-fab");
        const page = document.querySelector(".legacy-orders-page");
        const addRect = add?.getBoundingClientRect();
        const pageRect = page?.getBoundingClientRect();
        const search = document.querySelector(".legacy-order-search .search")?.getBoundingClientRect();
        const filters = document.querySelector(".legacy-order-filters")?.getBoundingClientRect();
        const filterButton = document.querySelector(".legacy-order-filters button")?.getBoundingClientRect();
        const visit = document.querySelector(".legacy-visit-filter .field")?.getBoundingClientRect();
        const nearest = document.querySelector(".legacy-nearest-visit")?.getBoundingClientRect();
        const head = document.querySelector(".legacy-orders-head")?.getBoundingClientRect();
        const card = document.querySelector(".legacy-order-card");
        const money = card?.querySelector(".legacy-order-money");
        const address = card?.querySelector(".legacy-order-meta .address");
        const moneyLabels = [...(money?.querySelectorAll("span") || [])].map((node) => node.textContent.trim());
        return {
          card: getComputedStyle(card).backgroundColor,
          cardRadius: parseFloat(getComputedStyle(card).borderRadius || "0"),
          moneyCell: money?.firstElementChild ? getComputedStyle(money.firstElementChild).backgroundColor : "missing",
          moneyBlocks: card?.querySelectorAll(".legacy-order-money").length || 0,
          moneyCells: money?.children.length || 0,
          moneyLabels,
          addressText: address?.textContent?.trim() || "",
          addressDisplay: address ? getComputedStyle(address).display : "missing",
          addressTextWhiteSpace: address?.querySelector(".legacy-order-address-text") ? getComputedStyle(address.querySelector(".legacy-order-address-text")).whiteSpace : "missing",
          addressLineClamp: address?.querySelector(".legacy-order-address-text") ? getComputedStyle(address.querySelector(".legacy-order-address-text")).webkitLineClamp : "missing",
          metaPhoneClass: Boolean(card?.querySelector(".legacy-order-meta .phone")),
          metaGuaranteeClass: Boolean(card?.querySelector(".legacy-order-meta .guarantee")),
          action: getComputedStyle(document.querySelector(".legacy-order-card .legacy-order-actions > button, .legacy-order-card .legacy-order-actions > a")).backgroundColor,
          addWidth: Math.round(addRect?.width || 0),
          addHeight: Math.round(addRect?.height || 0),
          pageWidth: Math.round(pageRect?.width || 0),
          addLabel: add?.getAttribute("aria-label") || add?.textContent?.trim() || "",
          searchHeight: Math.round(search?.height || 0),
          filtersHeight: Math.round(filters?.height || 0),
          filterButtonHeight: Math.round(filterButton?.height || 0),
          visitHeight: Math.round(visit?.height || 0),
          searchWidth: Math.round(search?.width || 0),
          filtersWidth: Math.round(filters?.width || 0),
          visitWidth: Math.round(visit?.width || 0),
          nearestWidth: Math.round(nearest?.width || 0),
          headWidth: Math.round(head?.width || 0),
          cardWidth: Math.round(card?.getBoundingClientRect().width || 0),
          gapAddSearch: addRect && search ? Math.round(search.top - addRect.bottom) : 999,
          gapSearchFilters: search && filters ? Math.round(filters.top - search.bottom) : 999,
          gapFiltersVisit: filters && visit ? Math.round(visit.top - filters.bottom) : 999,
          titleFont: parseFloat(getComputedStyle(document.querySelector(".legacy-orders-head h1")).fontSize || "0"),
          subtitleFont: parseFloat(getComputedStyle(document.querySelector(".legacy-orders-head p")).fontSize || "0"),
          headMarginBottom: parseFloat(getComputedStyle(document.querySelector(".legacy-orders-head")).marginBottom || "0"),
          pagePaddingTop: parseFloat(getComputedStyle(page).paddingTop || "0")
        };
      });
      const restoredOrdersLayout = orderPageSurfaces.addWidth >= 46
        && orderPageSurfaces.addWidth <= 47
        && orderPageSurfaces.addHeight >= 46
        && orderPageSurfaces.addHeight <= 47
        && orderPageSurfaces.searchHeight >= 45
        && orderPageSurfaces.searchHeight <= 47
        && orderPageSurfaces.filtersHeight <= 45
        && orderPageSurfaces.filterButtonHeight >= 44
        && orderPageSurfaces.filterButtonHeight <= 45
        && orderPageSurfaces.visitHeight >= 44
        && orderPageSurfaces.visitHeight <= 45
        && orderPageSurfaces.gapSearchFilters <= 7
        && orderPageSurfaces.gapFiltersVisit <= 7
        && orderPageSurfaces.titleFont >= (width <= 340 ? 22 : 23)
        && orderPageSurfaces.titleFont <= (width <= 340 ? 22.5 : 23.5)
        && orderPageSurfaces.subtitleFont >= (width <= 340 ? 9.5 : 10)
        && orderPageSurfaces.subtitleFont <= (width <= 340 ? 10 : 10.5)
        && orderPageSurfaces.headMarginBottom <= 7
        && orderPageSurfaces.pagePaddingTop <= 7
        && Math.abs(orderPageSurfaces.searchWidth - orderPageSurfaces.cardWidth) <= 1
        && Math.abs(orderPageSurfaces.filtersWidth - orderPageSurfaces.cardWidth) <= 1
        && Math.abs(orderPageSurfaces.visitWidth - orderPageSurfaces.cardWidth) <= 1
        && (!orderPageSurfaces.nearestWidth || Math.abs(orderPageSurfaces.nearestWidth - orderPageSurfaces.cardWidth) <= 1)
        && Math.abs(orderPageSurfaces.headWidth - orderPageSurfaces.cardWidth) <= 1
        && orderPageSurfaces.addLabel.includes("Новая заявка");
      if (!restoredOrdersLayout
        || orderPageSurfaces.moneyBlocks !== 1
        || orderPageSurfaces.moneyCells !== 2
        || !orderPageSurfaces.moneyLabels.some((label) => label.includes("СУММА КЛИЕНТА"))
        || !orderPageSurfaces.moneyLabels.some((label) => label.includes("НА РУКИ"))
        || !orderPageSurfaces.addressText.includes("Санкт-Петербург")
        || orderPageSurfaces.addressDisplay !== "grid"
        || orderPageSurfaces.addressTextWhiteSpace === "nowrap"
        || orderPageSurfaces.addressLineClamp !== "2"
        || !orderPageSurfaces.metaPhoneClass
        || !orderPageSurfaces.metaGuaranteeClass
        || orderPageSurfaces.cardRadius !== 15
        || orderPageSurfaces.moneyCell !== "rgb(23, 30, 37)"
        || orderPageSurfaces.action !== "rgb(23, 30, 37)") {
        report.failures.push({ width, type: "orders-restored-layout", orderPageSurfaces, restoredOrdersLayout });
      }
      const orderDensity = await page.evaluate(() => {
        const card = document.querySelector(".legacy-order-card");
        const list = document.querySelector(".legacy-orders-list");
        const device = card?.querySelector(".legacy-device-icon");
        const deviceRow = card?.querySelector(".legacy-order-device");
        const meta = card?.querySelector(".legacy-order-meta");
        const actions = card?.querySelector(".legacy-order-actions");
        const action = actions?.querySelector("button, a");
        const cardStyle = card ? getComputedStyle(card) : null;
        const listStyle = list ? getComputedStyle(list) : null;
        const actionsStyle = actions ? getComputedStyle(actions) : null;
        return {
          paddingTop: parseFloat(cardStyle?.paddingTop || "999"),
          paddingBottom: parseFloat(cardStyle?.paddingBottom || "999"),
          listGap: parseFloat(listStyle?.rowGap || listStyle?.gap || "999"),
          pagePaddingLeft: parseFloat(getComputedStyle(document.querySelector(".legacy-orders-page")).paddingLeft || "999"),
          pagePaddingRight: parseFloat(getComputedStyle(document.querySelector(".legacy-orders-page")).paddingRight || "999"),
          cardWidth: Math.round(card?.getBoundingClientRect().width || 0),
          deviceHeight: Math.round(device?.getBoundingClientRect().height || 999),
          deviceRowHeight: Math.round(deviceRow?.getBoundingClientRect().height || 999),
          metaHeight: Math.round(meta?.getBoundingClientRect().height || 999),
          moneyHeight: Math.round(card?.querySelector(".legacy-order-money")?.getBoundingClientRect().height || 0),
          actionHeight: Math.round(action?.getBoundingClientRect().height || 0),
          actionCount: actions?.querySelectorAll(":scope > button, :scope > a").length || 0,
          actionIconTops: [...(actions?.querySelectorAll(":scope > button .ui-icon, :scope > a .ui-icon") || [])].map((node) => Math.round(node.getBoundingClientRect().top)),
          actionLabelTops: [...(actions?.querySelectorAll(":scope > button > span, :scope > a > span") || [])].map((node) => Math.round(node.getBoundingClientRect().top)),
          actionLabelFont: parseFloat(action ? getComputedStyle(action).fontSize : "0"),
          actionsMarginTop: parseFloat(actionsStyle?.marginTop || "999"),
          actionsPaddingTop: parseFloat(actionsStyle?.paddingTop || "999")
        };
      });
      if (orderDensity.paddingTop > 14
        || orderDensity.paddingBottom > 12
        || orderDensity.listGap > (width <= 340 ? 6 : 7)
        || orderDensity.pagePaddingLeft > (width <= 340 ? 5 : 6)
        || orderDensity.pagePaddingRight > (width <= 340 ? 5 : 6)
        || orderDensity.cardWidth < width - (width <= 340 ? 10 : 12)
        || orderDensity.deviceHeight < 47
        || orderDensity.deviceHeight > 48
        || orderDensity.deviceRowHeight < 47
        || orderDensity.deviceRowHeight > 49
        || orderDensity.metaHeight > 52
        || orderDensity.moneyHeight < 61
        || orderDensity.moneyHeight > 63
        || orderDensity.actionHeight < 47
        || orderDensity.actionHeight > 48
        || orderDensity.actionCount !== 4
        || orderDensity.actionIconTops.length !== 4
        || Math.max(...orderDensity.actionIconTops) - Math.min(...orderDensity.actionIconTops) > 1
        || orderDensity.actionLabelTops.length !== 4
        || Math.max(...orderDensity.actionLabelTops) - Math.min(...orderDensity.actionLabelTops) > 1
        || orderDensity.actionLabelFont < (width <= 340 ? 7.5 : 8)
        || orderDensity.actionsMarginTop > 11
        || orderDensity.actionsPaddingTop > 10) {
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

      const emptyPhotoState = await page.evaluate(() => {
        const block = document.querySelector(".order-photo-details");
        const head = block?.querySelector(".order-photo-static-head");
        const body = block?.querySelector(".order-extra-body");
        const add = block?.querySelector(".order-photo-add");
        const grid = block?.querySelector("#order-photo-list");
        return {
          tag: block?.tagName || "",
          summaries: block?.querySelectorAll("summary").length || 0,
          headHeight: Math.round(head?.getBoundingClientRect().height || 0),
          bodyDisplay: body ? getComputedStyle(body).display : "missing",
          addHeight: Math.round(add?.getBoundingClientRect().height || 0),
          gridDisplay: grid ? getComputedStyle(grid).display : "missing",
          countText: block?.querySelector("#order-photo-count")?.textContent || ""
        };
      });
      if (emptyPhotoState.tag !== "SECTION"
        || emptyPhotoState.summaries !== 0
        || emptyPhotoState.headHeight < 44
        || emptyPhotoState.headHeight > 52
        || emptyPhotoState.bodyDisplay === "none"
        || emptyPhotoState.addHeight < 44
        || emptyPhotoState.addHeight > 56
        || emptyPhotoState.gridDisplay !== "none"
        || emptyPhotoState.countText !== "Нет фото") {
        report.failures.push({ width, type: "photos-empty-always-open", emptyPhotoState });
      }

      const emptyCommentState = await page.evaluate(() => {
        const block = document.querySelector(".order-comment-details");
        const summary = block?.querySelector("summary");
        const body = block?.querySelector(".order-comment");
        const summaryRect = summary?.getBoundingClientRect();
        return {
          tag: block?.tagName || "",
          open: Boolean(block?.open),
          summaries: block?.querySelectorAll("summary").length || 0,
          summaryHeight: Math.round(summaryRect?.height || 0),
          bodyDisplay: body ? getComputedStyle(body).display : "missing",
          stateText: block?.querySelector("#order-comment-state")?.textContent || ""
        };
      });
      if (emptyCommentState.tag !== "DETAILS"
        || emptyCommentState.open
        || emptyCommentState.summaries !== 1
        || emptyCommentState.summaryHeight < 44
        || emptyCommentState.summaryHeight > 54
        || emptyCommentState.bodyDisplay !== "none"
        || emptyCommentState.stateText !== "Нет заметки") {
        report.failures.push({ width, type: "order-comment-empty-collapsed", emptyCommentState });
      }

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
        const fieldHeights = [...(grid?.querySelectorAll(".field") || [])].map((field) => Math.round(field.getBoundingClientRect().height));
        return {
          gridWidth: Math.round(gridRect?.width || 0),
          columns: gridStyle?.gridTemplateColumns || "",
          rowGap: Number.parseFloat(gridStyle?.rowGap || "0") || 0,
          fieldHeights,
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
      const paymentColumnWidth = Math.min(paymentGridLayout.sum?.width || 0, paymentGridLayout.prepay?.width || 0);
      const tagCompact = paymentGridLayout.tag
        && paymentGridLayout.tag.width >= 120
        && Math.abs(paymentGridLayout.tag.width - paymentColumnWidth) <= 3
        && paymentGridLayout.tag.width <= paymentGridLayout.gridWidth * 0.55;
      const paymentControlsCompact = paymentGridLayout.fieldHeights?.length >= 7
        && paymentGridLayout.fieldHeights.every((height) => height >= 46 && height <= 49)
        && paymentGridLayout.rowGap <= 10;
      if (!paymentPairsAligned
        || !tagCompact
        || !paymentControlsCompact
        || paymentGridLayout.sum.width < 120
        || paymentGridLayout.prepay.width < 120) {
        report.failures.push({ width, type: "order-payment-grid-two-columns", paymentGridLayout, paymentPairsAligned, tagCompact, paymentControlsCompact });
      }

      const calculationSummaryRemoved = await page.evaluate(() => ({
        summary: document.querySelectorAll(".order-editor-modal .order-calculation-summary").length,
        button: document.querySelectorAll("#use-calculated-total").length
      }));
      if (calculationSummaryRemoved.summary !== 0 || calculationSummaryRemoved.button !== 0) {
        report.failures.push({ width, type: "order-calculation-summary-removed", calculationSummaryRemoved });
      }

      const orderEditorDensity = await page.evaluate(() => {
        const body = document.querySelector(".order-editor-body");
        const section = document.querySelector(".order-editor-section");
        const title = document.querySelector(".order-editor-section .form-section-title");
        const field = document.querySelector(".order-editor-section .field");
        const textarea = document.querySelector(".order-editor-section textarea.field");
        const issue = document.querySelector('.order-editor-modal textarea[name="issue"]');
        const diagnosis = document.querySelector('.order-editor-modal textarea[name="diagnosis"]');
        const defects = document.querySelector('.order-editor-modal textarea[name="defects"]');
        const px = (value) => Number.parseFloat(value || "0") || 0;
        const bodyStyle = body ? getComputedStyle(body) : null;
        const sectionStyle = section ? getComputedStyle(section) : null;
        const titleStyle = title ? getComputedStyle(title) : null;
        const centerDelta = (box, child) => {
          const boxRect = box?.getBoundingClientRect();
          const childRect = child?.getBoundingClientRect();
          if (!boxRect || !childRect) return 999;
          return Math.round(Math.abs((boxRect.top + boxRect.height / 2) - (childRect.top + childRect.height / 2)) * 10) / 10;
        };
        const headerIcon = document.querySelector(".order-editor-title-icon");
        const closeButton = document.querySelector(".order-editor-close");
        const sectionIcons = [...document.querySelectorAll(".order-editor-section-icon")];
        const catalogButton = document.querySelector(".order-editor-modal .legacy-catalog-button");
        return {
          bodyPaddingTop: bodyStyle ? px(bodyStyle.paddingTop) : 999,
          sectionMarginBottom: sectionStyle ? px(sectionStyle.marginBottom) : 999,
          sectionPaddingTop: sectionStyle ? px(sectionStyle.paddingTop) : 999,
          sectionPaddingBottom: sectionStyle ? px(sectionStyle.paddingBottom) : 999,
          titleMarginBottom: titleStyle ? px(titleStyle.marginBottom) : 999,
          sectionIconSize: Math.round(sectionIcons[0]?.getBoundingClientRect().width || 0),
          fieldHeight: Math.round(field?.getBoundingClientRect().height || 0),
          fieldFont: parseFloat(field ? getComputedStyle(field).fontSize : "0"),
          labelMarginBottom: (() => {
            const label = document.querySelector(".order-editor-section .form-group label");
            return label ? px(getComputedStyle(label).marginBottom) : 999;
          })(),
          textareaHeight: Math.round(textarea?.getBoundingClientRect().height || 0),
          issueHeight: Math.round(issue?.getBoundingClientRect().height || 0),
          diagnosisHeight: Math.round(diagnosis?.getBoundingClientRect().height || 0),
          defectsHeight: Math.round(defects?.getBoundingClientRect().height || 0),
          primaryControls: [...document.querySelectorAll('.order-editor-modal .form-grid:not(.legacy-payment-grid) .form-group > input.field:not([type="checkbox"]):not([type="radio"]), .order-editor-modal .form-grid:not(.legacy-payment-grid) .form-group > select.field')].map((node) => {
            const style = getComputedStyle(node);
            return {
              height: Math.round(node.getBoundingClientRect().height),
              paddingTop: px(style.paddingTop),
              paddingBottom: px(style.paddingBottom)
            };
          }),
          headerIconDelta: centerDelta(headerIcon, headerIcon?.querySelector(".ui-icon")),
          closeIconDelta: centerDelta(closeButton, closeButton?.querySelector(".ui-icon")),
          sectionIconDeltas: sectionIcons.map((node) => centerDelta(node, node.querySelector(".ui-icon"))),
          catalogIconDelta: centerDelta(catalogButton, catalogButton?.querySelector(".ui-icon"))
        };
      });
      if (orderEditorDensity.bodyPaddingTop > 12
        || orderEditorDensity.sectionMarginBottom > 18
        || orderEditorDensity.sectionPaddingTop > 10
        || orderEditorDensity.sectionPaddingBottom > 10
        || orderEditorDensity.titleMarginBottom > 7
        || orderEditorDensity.sectionIconSize !== 28
        || orderEditorDensity.fieldHeight < 46
        || orderEditorDensity.fieldHeight > 48
        || orderEditorDensity.fieldFont < 12
        || orderEditorDensity.labelMarginBottom > 3
        || orderEditorDensity.textareaHeight > 50
        || orderEditorDensity.issueHeight < 46
        || orderEditorDensity.issueHeight > 50
        || orderEditorDensity.diagnosisHeight < 46
        || orderEditorDensity.diagnosisHeight > 50
        || orderEditorDensity.defectsHeight < 42
        || orderEditorDensity.defectsHeight > 46
        || orderEditorDensity.primaryControls.length < 8
        || orderEditorDensity.primaryControls.some((item) => item.height < 46 || item.height > 48 || item.paddingTop !== 0 || item.paddingBottom !== 0)
        || orderEditorDensity.headerIconDelta > 1
        || orderEditorDensity.closeIconDelta > 1
        || orderEditorDensity.sectionIconDeltas.length < 2
        || orderEditorDensity.sectionIconDeltas.some((value) => value > 1)
        || orderEditorDensity.catalogIconDelta > 1) {
        report.failures.push({ width, type: "order-editor-compact-density", orderEditorDensity });
      }

      const issueBeforeGrow = orderEditorDensity.issueHeight;
      await page.locator('.order-editor-modal textarea[name="issue"]').fill("Первая строка\nВторая строка\nТретья строка\nЧетвёртая строка");
      await page.waitForTimeout(20);
      const issueAfterGrow = await page.evaluate(() => Math.round(document.querySelector('.order-editor-modal textarea[name="issue"]')?.getBoundingClientRect().height || 0));
      if (issueAfterGrow <= issueBeforeGrow + 12 || issueAfterGrow > 132) {
        report.failures.push({ width, type: "order-editor-textarea-autogrow", issueBeforeGrow, issueAfterGrow });
      }
      await page.locator('.order-editor-modal textarea[name="issue"]').fill("");

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
      if (serviceCatalogSurface.modal !== "rgb(16, 23, 27)"
        || serviceCatalogSurface.option !== "rgb(23, 30, 35)"
        || serviceCatalogSurface.summary !== "rgb(18, 25, 30)") {
        report.failures.push({ width, type: "service-catalog-restored-surface", serviceCatalogSurface });
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
        const paddingLeft = actionStyle ? (parseFloat(actionStyle.paddingLeft) || 0) : 0;
        const paddingRight = actionStyle ? (parseFloat(actionStyle.paddingRight) || 0) : 0;
        return {
          width: Math.round(rect?.width || 0),
          left: Math.round(rect?.left || 0),
          innerLeft: rect ? Math.round(rect.left + paddingLeft) : 0,
          innerWidth: rect
            ? Math.round(rect.width - paddingLeft - paddingRight)
            : 0,
          buttons
        };
      });
      if (serviceCatalogActions.buttons.length !== 2
        || serviceCatalogActions.buttons.some((button) => button.height < 48 || button.height > 49)
        || serviceCatalogActions.buttons.some((button) => button.width < 105)
        || Math.abs((serviceCatalogActions.buttons[0]?.top || 0) - (serviceCatalogActions.buttons[1]?.top || 0)) > 2
        || (serviceCatalogActions.buttons[1]?.left || 0) <= (serviceCatalogActions.buttons[0]?.left || 0)
        || Math.abs((serviceCatalogActions.buttons[0]?.left || 0) - serviceCatalogActions.innerLeft) > 2
        || (serviceCatalogActions.buttons[0]?.width || 0) + (serviceCatalogActions.buttons[1]?.width || 0) > serviceCatalogActions.innerWidth) {
        report.failures.push({ width, type: "service-catalog-actions-two-columns", serviceCatalogActions });
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
      const serviceSelection = await page.evaluate(() => {
        const option = document.querySelector(".catalog-service-option.selected");
        return {
          selectedRows: document.querySelectorAll(".catalog-service-option.selected").length,
          checkedIcons: document.querySelectorAll(".catalog-service-option.selected .catalog-check .ui-icon").length,
          countText: document.querySelector("#catalog-selected-count")?.textContent || "",
          nativeCheckboxes: document.querySelectorAll('.catalog-service-option input[type="checkbox"]').length,
          optionTag: option?.tagName || "",
          pressed: option?.getAttribute("aria-pressed") || ""
        };
      });
      if (serviceSelection.selectedRows !== 1
        || serviceSelection.checkedIcons !== 1
        || !serviceSelection.countText.startsWith("1 ")
        || serviceSelection.nativeCheckboxes !== 0
        || serviceSelection.optionTag !== "BUTTON"
        || serviceSelection.pressed !== "true") {
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
      await page.locator('.order-editor-modal [name="sum"]').blur();
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
          locationText: document.querySelector('#material-lines [data-line="location"] option:checked')?.textContent?.trim() || "",
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
      if (editorSurfaceState.material !== "rgb(17, 24, 29)"
        || editorSurfaceState.materialField !== "rgb(9, 15, 20)"
        || editorSurfaceState.secondaryAction !== "rgb(10, 17, 22)"
        || editorSurfaceState.serviceMatchCount !== 0
        || editorSurfaceState.clippedMaterialLabels.length
        || editorSurfaceState.qtyWidth < 60
        || editorSurfaceState.costWidth < 100
        || editorSurfaceState.locationText !== "Не выбрано"
        || editorSurfaceState.footerWidth < width - 2
        || editorSurfaceState.footerCoverage < 0.9
        || editorSurfaceState.footerButtonGap < 4
        || editorSurfaceState.footerButtonGap > 10
        || editorSurfaceState.secondaryWidth < 100
        || editorSurfaceState.primaryWidth < 140
        || editorSurfaceState.primaryWidth <= editorSurfaceState.secondaryWidth
        || Math.abs(editorSurfaceState.primaryTop - editorSurfaceState.secondaryTop) > 2) {
        report.failures.push({ width, type: "order-editor-polish", editorSurfaceState });
      }
      if (width === 390) {
        await page.locator("#material-lines [data-material-row]").scrollIntoViewIfNeeded();
        const toastSafeState = await page.evaluate(() => {
          const toast = document.querySelector("#toast.toast.show");
          const footer = document.querySelector(".order-editor-modal .modal-actions");
          const tr = toast?.getBoundingClientRect();
          const fr = footer?.getBoundingClientRect();
          return {
            visible: Boolean(toast),
            toastBottom: tr ? Math.round(tr.bottom) : 0,
            footerTop: fr ? Math.round(fr.top) : 0,
            gap: tr && fr ? Math.round(fr.top - tr.bottom) : -999
          };
        });
        if (!toastSafeState.visible || toastSafeState.gap < 12) {
          report.failures.push({ width, type: "modal-toast-overlap", toastSafeState });
        }
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
        const clampToastVisible = await page.locator("#toast.toast.show").count();
        if (clampedWhite !== 3000 || clampToastVisible !== 0) {
          report.failures.push({ width, type: "direct-expense-white-clamp", clampedWhite, clampToastVisible });
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
        photoSeed.orders[0].comment = "Позвонить клиенту перед выездом";
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
          const grid = block?.querySelector("#order-photo-list");
          return {
            tag: block?.tagName || "",
            summaries: block?.querySelectorAll("summary").length || 0,
            bodyDisplay: body ? getComputedStyle(body).display : "missing",
            gridDisplay: grid ? getComputedStyle(grid).display : "missing",
            countText: block?.querySelector("#order-photo-count")?.textContent || "",
            addVisible: Boolean(block?.querySelector("#order-photo-input")),
            cards: block?.querySelectorAll("[data-view-photo]").length || 0
          };
        });
        if (staticPhotoState.tag !== "SECTION"
          || staticPhotoState.summaries !== 0
          || staticPhotoState.bodyDisplay === "none"
          || staticPhotoState.gridDisplay === "none"
          || staticPhotoState.countText !== "1 фото"
          || !staticPhotoState.addVisible
          || staticPhotoState.cards !== 1) {
          report.failures.push({ width, type: "photos-with-data-always-open", staticPhotoState });
        }
        const storedCommentState = await page.evaluate(() => {
          const block = document.querySelector(".order-comment-details");
          const body = block?.querySelector(".order-comment");
          return {
            tag: block?.tagName || "",
            open: Boolean(block?.open),
            bodyDisplay: body ? getComputedStyle(body).display : "missing",
            stateText: block?.querySelector("#order-comment-state")?.textContent || "",
            value: block?.querySelector('[name="comment"]')?.value || ""
          };
        });
        if (storedCommentState.tag !== "DETAILS"
          || !storedCommentState.open
          || storedCommentState.bodyDisplay === "none"
          || storedCommentState.stateText !== "Есть заметка"
          || storedCommentState.value !== "Позвонить клиенту перед выездом") {
          report.failures.push({ width, type: "order-comment-with-data-open", storedCommentState });
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
        const actions = [...document.querySelectorAll(".legacy-expanded-actions > button, .legacy-expanded-actions > a")];
        const action = actions[0];
        const section = document.querySelector(".legacy-detail-section");
        const line = document.querySelector(".legacy-detail-line");
        const px = (value) => Number.parseFloat(value || "0") || 0;
        const cardStyle = card ? getComputedStyle(card) : null;
        const sectionStyle = section ? getComputedStyle(section) : null;
        return {
          cardPaddingTop: cardStyle ? px(cardStyle.paddingTop) : 999,
          moneyHeight: Math.round(money?.getBoundingClientRect().height || 0),
          actionHeight: Math.round(action?.getBoundingClientRect().height || 0),
          actionHeights: actions.map((node) => Math.round(node.getBoundingClientRect().height || 0)),
          actionIconTops: actions.map((node) => Math.round(node.querySelector(".ui-icon")?.getBoundingClientRect().top || 0)),
          actionLabelTops: actions.map((node) => Math.round(node.querySelector(":scope > span")?.getBoundingClientRect().top || 0)),
          actionLabels: actions.map((node) => (node.querySelector(":scope > span")?.textContent || "").trim()),
          sectionMarginTop: sectionStyle ? px(sectionStyle.marginTop) : 999,
          sectionPaddingTop: sectionStyle ? px(sectionStyle.paddingTop) : 999,
          lineHeight: Math.round(line?.getBoundingClientRect().height || 0)
        };
      });
      if (orderDetailDensity.cardPaddingTop > 12
        || orderDetailDensity.moneyHeight > 52
        || orderDetailDensity.actionHeight < 44
        || orderDetailDensity.actionHeight > 48
        || orderDetailDensity.actionHeights.length !== 4
        || Math.max(...orderDetailDensity.actionHeights) - Math.min(...orderDetailDensity.actionHeights) > 1
        || Math.max(...orderDetailDensity.actionIconTops) - Math.min(...orderDetailDensity.actionIconTops) > 1
        || Math.max(...orderDetailDensity.actionLabelTops) - Math.min(...orderDetailDensity.actionLabelTops) > 1
        || !["Изменить","Закрыть","Позвонить","Ещё"].every((label) => orderDetailDensity.actionLabels.includes(label))
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
      const orderActionsDensity = await page.evaluate(() => {
        const sheet = document.querySelector(".order-actions-sheet");
        const head = sheet?.querySelector(".order-actions-head");
        const grid = sheet?.querySelector(".order-actions-grid");
        const action = grid?.querySelector("button, a");
        const cancel = sheet?.querySelector(".order-actions-cancel");
        const px = (value) => Number.parseFloat(value || "0") || 0;
        return {
          paddingTop: sheet ? px(getComputedStyle(sheet).paddingTop) : 999,
          headMarginBottom: head ? px(getComputedStyle(head).marginBottom) : 999,
          gridGap: grid ? px(getComputedStyle(grid).rowGap || getComputedStyle(grid).gap) : 999,
          actionHeight: Math.round(action?.getBoundingClientRect().height || 0),
          cancelMarginTop: cancel ? px(getComputedStyle(cancel).marginTop) : 999,
          cancelHeight: Math.round(cancel?.getBoundingClientRect().height || 0)
        };
      });
      if (orderActionsDensity.paddingTop > 10
        || orderActionsDensity.headMarginBottom > 7
        || orderActionsDensity.gridGap > 6.5
        || orderActionsDensity.actionHeight < 44
        || orderActionsDensity.actionHeight > 50
        || orderActionsDensity.cancelMarginTop > 7
        || orderActionsDensity.cancelHeight < 44
        || orderActionsDensity.cancelHeight > 48) {
        report.failures.push({ width, type: "order-actions-compact-density", orderActionsDensity });
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
            if (warrantyAnalytics["Выручка клиентов"] !== 11400
              || warrantyAnalytics["Получил чистыми"] !== 6050
              || warrantyAnalytics["Средний чек"] !== 8900) {
              report.failures.push({ width, type: "warranty-appeal-analytics", warrantyAnalytics });
            }
          }

          await writeSeed(page, seed);
          await setState(page, uiState({ activePage: "orders" }));
        }
      }

      await setState(page, uiState({ activePage: "analytics" }));
      const analyticsRestoredSurface = await page.evaluate(() => {
        const firstPanel = document.querySelector(".analytics-first-kpi");
        const firstCard = document.querySelector(".analytics-first-card");
        const workPanel = document.querySelector(".analytics-work-now");
        const workCard = document.querySelector(".analytics-now-grid > div");
        return {
          firstCards: document.querySelectorAll(".analytics-first-card").length,
          workCards: document.querySelectorAll(".analytics-now-grid > div").length,
          focusBlocks: document.querySelectorAll(".analytics-focus").length,
          firstCardBackground: firstCard ? getComputedStyle(firstCard).backgroundColor : "missing",
          firstPanelRadius: firstPanel ? parseFloat(getComputedStyle(firstPanel).borderRadius) : 0,
          workCardBackground: workCard ? getComputedStyle(workCard).backgroundColor : "missing",
          workPanelRadius: workPanel ? parseFloat(getComputedStyle(workPanel).borderRadius) : 0,
          lowerIconBorder: (() => { const node = document.querySelector(".analytics-content .panel-title > .badge-icon"); return node ? parseFloat(getComputedStyle(node).borderTopWidth) || 0 : 999; })(),
          lowerIconBackground: (() => { const node = document.querySelector(".analytics-content .panel-title > .badge-icon"); return node ? getComputedStyle(node).backgroundColor : "missing"; })(),
          firstTitleLayout: (() => {
            const title = document.querySelector(".analytics-first-title");
            const strong = title?.querySelector(":scope > strong");
            const small = title?.querySelector(":scope > small");
            const titleRect = title?.getBoundingClientRect();
            const strongRect = strong?.getBoundingClientRect();
            const smallRect = small?.getBoundingClientRect();
            return {
              titleHeight: Math.round(titleRect?.height || 0),
              strongBottom: Math.round(strongRect?.bottom || 0),
              smallTop: Math.round(smallRect?.top || 0),
              smallScrollWidth: small?.scrollWidth || 0,
              smallClientWidth: small?.clientWidth || 0,
              smallDisplay: small ? getComputedStyle(small).display : "missing"
            };
          })()
        };
      });
      if (analyticsRestoredSurface.firstCards !== 6
        || analyticsRestoredSurface.workCards !== 2
        || analyticsRestoredSurface.focusBlocks !== 0
        || analyticsRestoredSurface.firstCardBackground !== "rgb(23, 30, 35)"
        || analyticsRestoredSurface.workCardBackground !== "rgb(20, 27, 32)"
        || analyticsRestoredSurface.lowerIconBorder !== 0
        || analyticsRestoredSurface.lowerIconBackground !== "rgba(255, 118, 92, 0.075)"
        || analyticsRestoredSurface.firstPanelRadius < 16
        || analyticsRestoredSurface.workPanelRadius < 16
        || (width <= 340 && (
          analyticsRestoredSurface.firstTitleLayout.smallDisplay === "none"
          || analyticsRestoredSurface.firstTitleLayout.smallTop < analyticsRestoredSurface.firstTitleLayout.strongBottom - 1
          || analyticsRestoredSurface.firstTitleLayout.smallScrollWidth > analyticsRestoredSurface.firstTitleLayout.smallClientWidth + 1
          || analyticsRestoredSurface.firstTitleLayout.titleHeight > 34
        ))) {
        report.failures.push({ width, type: "analytics-first-version-surface", analyticsRestoredSurface });
      }

      const analyticsDensity = await page.evaluate(() => {
        const kpi = document.querySelector(".analytics-first-card");
        const workCard = document.querySelector(".analytics-now-grid > div");
        const panel = document.querySelector(".analytics-first-kpi");
        const panelStyle = panel ? getComputedStyle(panel) : null;
        const px = (value) => Number.parseFloat(value || "0") || 0;
        return {
          kpiHeight: Math.round(kpi?.getBoundingClientRect().height || 0),
          workHeight: Math.round(workCard?.getBoundingClientRect().height || 0),
          panelPaddingTop: panelStyle ? px(panelStyle.paddingTop) : 999,
          panelMarginBottom: panelStyle ? px(panelStyle.marginBottom) : 999
        };
      });
      if (analyticsDensity.kpiHeight < 70
        || analyticsDensity.kpiHeight > 78
        || analyticsDensity.workHeight < 64
        || analyticsDensity.workHeight > 70
        || analyticsDensity.panelPaddingTop < 8
        || analyticsDensity.panelPaddingTop > 11
        || analyticsDensity.panelMarginBottom > 8) {
        report.failures.push({ width, type: "analytics-first-version-density", analyticsDensity });
      }

      const analyticsHeaderDensity = await page.evaluate(() => {
        const rangeNav = document.querySelector(".analytics-range-nav");
        const firstPanel = document.querySelector(".analytics-content .panel");
        const chips = [...document.querySelectorAll(".analytics-period-grid .chip")];
        const arrows = [...document.querySelectorAll(".analytics-arrow")];
        return {
          chipHeights: chips.map((chip) => Math.round(chip.getBoundingClientRect().height)),
          arrowHeights: arrows.map((arrow) => Math.round(arrow.getBoundingClientRect().height)),
          rangeHeight: Math.round(rangeNav?.getBoundingClientRect().height || 0),
          firstPanelTop: Math.round(firstPanel?.getBoundingClientRect().top || 999)
        };
      });
      if (analyticsHeaderDensity.chipHeights.length !== 6
        || analyticsHeaderDensity.chipHeights.some((height) => height < 44)
        || analyticsHeaderDensity.arrowHeights.length !== 2
        || analyticsHeaderDensity.arrowHeights.some((height) => height < 44)
        || analyticsHeaderDensity.rangeHeight < 44
        || analyticsHeaderDensity.rangeHeight > 46
        || analyticsHeaderDensity.firstPanelTop > 282) {
        report.failures.push({ width, type: "analytics-compact-header", analyticsHeaderDensity });
      }

      const analyticsModelState = await page.evaluate(() => {
        const numberFrom = (value) => Number(String(value || "").replace(/[^0-9-]/g, "")) || 0;
        const cards = [...document.querySelectorAll(".analytics-first-card")];
        const values = Object.fromEntries(cards.map((card) => [
          card.querySelector(":scope > span")?.textContent?.trim() || "",
          numberFrom(card.querySelector(":scope > strong")?.textContent)
        ]));
        const work = [...document.querySelectorAll(".analytics-now-grid > div")];
        const workValues = Object.fromEntries(work.map((card) => [
          card.querySelector("span")?.textContent?.trim() || "",
          numberFrom(card.querySelector("strong")?.textContent)
        ]));
        const expenseButton = document.querySelector(".analytics-add-expense");
        const expenseRect = expenseButton?.getBoundingClientRect();
        return {
          values,
          workValues,
          bars: document.querySelectorAll(".analytics-chart-panel .bar-wrap").length,
          barWidths: [...document.querySelectorAll(".analytics-chart-panel .bar")].map((bar) => Math.round(bar.getBoundingClientRect().width)),
          hasSources: Boolean([...document.querySelectorAll(".analytics-list-panel .panel-title")].find((node) => node.textContent.includes("Источники заявок"))),
          sourceOpen: Boolean(document.querySelector(".analytics-list-panel[open]")),
          expenseButtonHeight: expenseRect ? Math.round(expenseRect.height) : 0,
          expenseButtonWidth: expenseRect ? Math.round(expenseRect.width) : 0,
          expenseButtonBackground: expenseButton ? getComputedStyle(expenseButton).backgroundColor : "missing",
          expenseButtonColor: expenseButton ? getComputedStyle(expenseButton).color : "missing",
          pageTitle: document.querySelector(".analytics-content .page-head h1")?.textContent?.trim() || "",
          pageTitleWhiteSpace: getComputedStyle(document.querySelector(".analytics-content .page-head h1")).whiteSpace,
          pageTitleScrollWidth: document.querySelector(".analytics-content .page-head h1")?.scrollWidth || 0,
          pageTitleClientWidth: document.querySelector(".analytics-content .page-head h1")?.clientWidth || 0,
          pageTitleFontSize: parseFloat(getComputedStyle(document.querySelector(".analytics-content .page-head h1")).fontSize) || 0,
          pageLead: document.querySelector(".analytics-content .page-head .lead")?.textContent?.trim() || "",
          comparisonBlocks: document.querySelectorAll(".analytics-comparison-strip, .analytics-comparison-empty").length
        };
      });
      if (analyticsModelState.values["Выручка клиентов"] !== 10400
        || analyticsModelState.values["Потратил всего"] !== 4100
        || analyticsModelState.values["Получил чистыми"] !== 5050
        || analyticsModelState.values["Средний чек"] !== 8900
        || Object.keys(analyticsModelState.values).length !== 6
        || Object.keys(analyticsModelState.workValues).length !== 2
        || analyticsModelState.bars !== 2
        || analyticsModelState.barWidths.some((widthValue) => widthValue < 20 || widthValue > 36)
        || !analyticsModelState.hasSources
        || analyticsModelState.sourceOpen
        || analyticsModelState.expenseButtonHeight < 44
        || analyticsModelState.expenseButtonWidth < 44
        || analyticsModelState.expenseButtonWidth > 50
        || analyticsModelState.pageTitleWhiteSpace !== "nowrap"
        || (width <= 340 && analyticsModelState.pageTitleScrollWidth > analyticsModelState.pageTitleClientWidth + 1)
        || (width <= 340 && analyticsModelState.pageTitleFontSize < 18)
        || analyticsModelState.expenseButtonBackground !== "rgb(13, 20, 25)"
        || analyticsModelState.expenseButtonColor !== "rgb(255, 118, 92)"
        || analyticsModelState.pageTitle !== "Аналитический центр"
        || analyticsModelState.pageLead !== "Финансы, эффективность, клиенты и склад"
        || analyticsModelState.comparisonBlocks !== 0) {
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
      const analyticsRangeDensity = await page.evaluate(() => {
        const modal = document.querySelector(".legacy-analytics-range-modal");
        const head = modal?.querySelector(".legacy-range-head");
        const grid = modal?.querySelector(".legacy-range-grid");
        const field = modal?.querySelector(".legacy-range-grid .field");
        const actions = modal?.querySelector(".legacy-range-actions");
        const action = actions?.querySelector("button");
        const px = (value) => Number.parseFloat(value || "0") || 0;
        return {
          paddingTop: modal ? px(getComputedStyle(modal).paddingTop) : 999,
          headMarginBottom: head ? px(getComputedStyle(head).marginBottom) : 999,
          gridGap: grid ? px(getComputedStyle(grid).rowGap || getComputedStyle(grid).gap) : 999,
          fieldHeight: Math.round(field?.getBoundingClientRect().height || 0),
          actionsMarginTop: actions ? px(getComputedStyle(actions).marginTop) : 999,
          actionHeight: Math.round(action?.getBoundingClientRect().height || 0)
        };
      });
      if (analyticsRangeDensity.paddingTop > 10
        || analyticsRangeDensity.headMarginBottom > 8
        || analyticsRangeDensity.gridGap > 6.5
        || analyticsRangeDensity.fieldHeight < 44
        || analyticsRangeDensity.fieldHeight > 48
        || analyticsRangeDensity.actionsMarginTop > 8
        || analyticsRangeDensity.actionHeight < 44
        || analyticsRangeDensity.actionHeight > 48) {
        report.failures.push({ width, type: "analytics-range-compact-density", analyticsRangeDensity });
      }
      report.results.push(await shot(page, width, "analytics-range", false));
      await page.locator(".legacy-analytics-range-modal [data-close-modal]").last().click();

      await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list" }));
      const warehousePageSurfaces = await page.evaluate(() => {
        const actionButtons = [...document.querySelectorAll(".legacy-stock-actions-v2 button")].slice(0, 4);
        const actionRects = actionButtons.map((button) => button.getBoundingClientRect());
        const actionAreaRect = document.querySelector(".legacy-stock-actions-v2")?.getBoundingClientRect();
        const filterGrid = document.querySelector(".warehouse-filter-grid");
        const filterGridRect = filterGrid?.getBoundingClientRect();
        const filterRects = [...document.querySelectorAll(".warehouse-filter-grid > .warehouse-filter-control")].map((node) => node.getBoundingClientRect());
        const headRect = document.querySelector(".legacy-warehouse-head")?.getBoundingClientRect();
        const addRect = document.querySelector(".legacy-warehouse-add-wide")?.getBoundingClientRect();
        const searchRect = document.querySelector(".legacy-warehouse-search .search")?.getBoundingClientRect();
        const shortcutsRect = document.querySelector(".legacy-warehouse-shortcuts")?.getBoundingClientRect();
        const shortcutRects = [...document.querySelectorAll(".legacy-warehouse-shortcuts > button")].map((node) => node.getBoundingClientRect());
        const firstGroupRect = document.querySelector(".legacy-warehouse-groups > .legacy-warehouse-group")?.getBoundingClientRect();
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
          groupIcon: getComputedStyle(document.querySelector(".warehouse-tech-group > summary .legacy-folder-icon")).color,
          groupIconBackground: getComputedStyle(document.querySelector(".warehouse-tech-group > summary .legacy-folder-icon")).backgroundColor,
          stock: getComputedStyle(document.querySelector(".legacy-stock-card-v2")).backgroundColor,
          action: getComputedStyle(document.querySelector(".legacy-stock-actions-v2 button")).backgroundColor,
          actionWidths: actionRects.map((rect) => Math.round(rect.width)),
          actionHeights: actionRects.map((rect) => Math.round(rect.height)),
          actionTops: actionRects.map((rect) => Math.round(rect.top)),
          actionAreaHeight: Math.round(actionAreaRect?.height || 0),
          secondaryActionLabels: actionButtons.slice(2).map((button) => ({
            aria: button.getAttribute("aria-label") || "",
            textDisplay: getComputedStyle(button.querySelector("span")).display
          })),
          filters: [...document.querySelectorAll("#warehouse-filter-select option")].map((option) => option.value),
          techGroups: [...document.querySelectorAll(".warehouse-tech-group > summary .legacy-group-copy strong")].map((node) => node.textContent.trim()),
          categoryBlocks: document.querySelectorAll(".warehouse-category-block").length,
          hasTechFilter: Boolean(document.querySelector("#warehouse-tech-filter")),
          hasCategoryFilter: Boolean(document.querySelector("#warehouse-category-filter")),
          addWidth: Math.round(addRect?.width || 0),
          pageWidth: Math.round(document.querySelector(".legacy-warehouse-page")?.getBoundingClientRect().width || 0),
          addHeight: Math.round(addRect?.height || 0),
          addText: document.querySelector(".legacy-warehouse-add-wide")?.textContent?.trim() || "",
          searchHeight: Math.round(searchRect?.height || 0),
          filterGridWidth: Math.round(filterGridRect?.width || 0),
          filterGridHeight: Math.round(filterGridRect?.height || 0),
          filterWidths: filterRects.map((rect) => Math.round(rect.width)),
          filterHeights: filterRects.map((rect) => Math.round(rect.height)),
          filterLabelDisplays: [...document.querySelectorAll(".warehouse-filter-control > small")].map((node) => getComputedStyle(node).display),
          filterAriaLabels: [...document.querySelectorAll(".warehouse-filter-control select")].map((node) => node.getAttribute("aria-label") || ""),
          shortcutHeights: shortcutRects.map((rect) => Math.round(rect.height)),
          gapHeadAdd: headRect && addRect ? Math.round(addRect.top - headRect.bottom) : 999,
          gapAddSearch: addRect && searchRect ? Math.round(searchRect.top - addRect.bottom) : 999,
          gapSearchFilters: searchRect && filterGridRect ? Math.round(filterGridRect.top - searchRect.bottom) : 999,
          gapFiltersShortcuts: filterGridRect && shortcutsRect ? Math.round(shortcutsRect.top - filterGridRect.bottom) : 999,
          gapShortcutsGroups: shortcutsRect && firstGroupRect ? Math.round(firstGroupRect.top - shortcutsRect.bottom) : 999,
          filterLefts: filterRects.map((rect) => Math.round(rect.left)),
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
        || warehousePageSurfaces.groupIcon !== "rgb(255, 128, 103)"
        || warehousePageSurfaces.groupIconBackground !== "rgba(255, 118, 92, 0.075)"
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
        || warehousePageSurfaces.actionWidths[0] < 70
        || warehousePageSurfaces.actionWidths[1] < 70
        || Math.abs(warehousePageSurfaces.actionWidths[0] - warehousePageSurfaces.actionWidths[1]) > 2
        || warehousePageSurfaces.actionWidths[2] < 44
        || warehousePageSurfaces.actionWidths[2] > 45
        || warehousePageSurfaces.actionWidths[3] < 44
        || warehousePageSurfaces.actionWidths[3] > 45
        || warehousePageSurfaces.actionHeights.some((value) => value < 44 || value > 45)
        || Math.max(...warehousePageSurfaces.actionTops) - Math.min(...warehousePageSurfaces.actionTops) > 2
        || warehousePageSurfaces.actionAreaHeight > 58
        || warehousePageSurfaces.secondaryActionLabels.length !== 2
        || warehousePageSurfaces.secondaryActionLabels.some((item) => !item.aria || item.textDisplay !== "none")
        || warehousePageSurfaces.addWidth < warehousePageSurfaces.pageWidth - 34
        || warehousePageSurfaces.addHeight < 48
        || warehousePageSurfaces.addHeight > 49
        || warehousePageSurfaces.searchHeight < 44
        || warehousePageSurfaces.searchHeight > 45
        || !warehousePageSurfaces.addText.includes("Новая позиция")
        || warehousePageSurfaces.filterWidths.length !== 4
        || warehousePageSurfaces.filterWidths.some((value) => value < 120)
        || Math.max(...warehousePageSurfaces.filterWidths) - Math.min(...warehousePageSurfaces.filterWidths) > 3
        || warehousePageSurfaces.filterHeights.some((value) => value < 44 || value > 45)
        || warehousePageSurfaces.filterGridHeight > 94
        || warehousePageSurfaces.filterLabelDisplays.length !== 4
        || warehousePageSurfaces.filterLabelDisplays.some((value) => value !== "none")
        || warehousePageSurfaces.filterAriaLabels.length !== 4
        || warehousePageSurfaces.filterAriaLabels.some((value) => !value)
        || warehousePageSurfaces.shortcutHeights.length !== 2
        || warehousePageSurfaces.shortcutHeights.some((value) => value < 44 || value > 45)
        || warehousePageSurfaces.gapHeadAdd > 8
        || warehousePageSurfaces.gapAddSearch > 7
        || warehousePageSurfaces.gapSearchFilters > 6
        || warehousePageSurfaces.gapFiltersShortcuts > 7
        || warehousePageSurfaces.gapShortcutsGroups > 8
        || Math.abs(warehousePageSurfaces.filterTops[0] - warehousePageSurfaces.filterTops[1]) > 2
        || Math.abs(warehousePageSurfaces.filterTops[2] - warehousePageSurfaces.filterTops[3]) > 2
        || warehousePageSurfaces.filterTops[2] <= warehousePageSurfaces.filterTops[0]
        || warehousePageSurfaces.filterLefts[1] <= warehousePageSurfaces.filterLefts[0]
        || warehousePageSurfaces.filterLefts[3] <= warehousePageSurfaces.filterLefts[2]
        || warehousePageSurfaces.filterIconTransforms.length !== 4
        || warehousePageSurfaces.filterIconTransforms.some((value) => value === "none")
        || warehousePageSurfaces.groupChevronTransforms.length < 2
        || warehousePageSurfaces.groupChevronTransforms[0] === "none"
        || warehousePageSurfaces.groupChevronTransforms[0] === warehousePageSurfaces.groupChevronTransforms[1]) {
        report.failures.push({ width, type: "warehouse-deep-dark-page", warehousePageSurfaces });
      }
      if (width <= 340) {
        const stockQtyBelowCopy = warehousePageSurfaces.stockQtyLeft >= 50
          && warehousePageSurfaces.stockQtyLeft < warehousePageSurfaces.stockCopyRight - 2;
        if (warehousePageSurfaces.stockMainHeight > 98
          || !stockQtyBelowCopy
          || warehousePageSurfaces.stockTitleHeight > 38) {
          report.failures.push({ width, type: "warehouse-320-compact-card", warehousePageSurfaces, stockQtyBelowCopy });
        }
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
        const transfer = document.querySelector(".stock-detail-actions .stock-detail-transfer");
        const correct = document.querySelector(".stock-detail-actions .stock-detail-correct");
        const archive = document.querySelector(".stock-detail-actions .stock-detail-archive");
        const incomingRect = incoming?.getBoundingClientRect();
        const outgoingRect = outgoing?.getBoundingClientRect();
        const kpiGrid = document.querySelector(".stock-detail-kpis");
        const kpiGridRect = kpiGrid?.getBoundingClientRect();
        const kpiRects = [...document.querySelectorAll(".stock-detail-kpis > div")].map((node) => node.getBoundingClientRect());
        const transferRect = transfer?.getBoundingClientRect();
        const correctRect = correct?.getBoundingClientRect();
        const archiveRect = archive?.getBoundingClientRect();
        return {
          modal: getComputedStyle(document.querySelector(".stock-detail-modal")).backgroundColor,
          hero: getComputedStyle(document.querySelector(".stock-detail-hero")).backgroundColor,
          primaryKpi: getComputedStyle(document.querySelector(".stock-detail-kpis > .primary")).backgroundColor,
          reservedKpi: getComputedStyle(document.querySelector(".stock-detail-kpis > .reserved")).backgroundColor,
          minimumKpi: getComputedStyle(document.querySelector(".stock-detail-kpis > .minimum")).backgroundColor,
          kpiGridHeight: Math.round(kpiGridRect?.height || 0),
          kpiRects: kpiRects.map((rect) => ({ left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) })),
          incoming: incoming ? getComputedStyle(incoming).backgroundColor : "missing",
          outgoing: outgoing ? getComputedStyle(outgoing).backgroundColor : "missing",
          transfer: transfer ? getComputedStyle(transfer).backgroundColor : "missing",
          correct: correct ? getComputedStyle(correct).backgroundColor : "missing",
          archive: archive ? getComputedStyle(archive).backgroundColor : "missing",
          incomingWidth: incomingRect ? Math.round(incomingRect.width) : 0,
          outgoingWidth: outgoingRect ? Math.round(outgoingRect.width) : 0,
          transferWidth: transferRect ? Math.round(transferRect.width) : 0,
          correctWidth: correctRect ? Math.round(correctRect.width) : 0,
          archiveWidth: archiveRect ? Math.round(archiveRect.width) : 0,
          incomingTop: incomingRect ? Math.round(incomingRect.top) : 0,
          outgoingTop: outgoingRect ? Math.round(outgoingRect.top) : 0,
          transferTop: transferRect ? Math.round(transferRect.top) : 0,
          correctTop: correctRect ? Math.round(correctRect.top) : 0,
          archiveTop: archiveRect ? Math.round(archiveRect.top) : 0,
          correctTextOverflow: correct?.querySelector("b") ? Math.max(0, correct.querySelector("b").scrollWidth - correct.querySelector("b").clientWidth) : 999,
          correctWordBreak: correct?.querySelector("b") ? getComputedStyle(correct.querySelector("b")).wordBreak : "missing",
          correctOverflowWrap: correct?.querySelector("b") ? getComputedStyle(correct.querySelector("b")).overflowWrap : "missing"
        };
      });
      if (stockDetailSurface.modal !== "rgb(3, 7, 10)"
        || stockDetailSurface.hero !== "rgb(11, 17, 21)"
        || stockDetailSurface.primaryKpi !== "rgb(17, 24, 29)"
        || stockDetailSurface.reservedKpi !== "rgb(17, 24, 29)"
        || stockDetailSurface.minimumKpi !== "rgb(17, 24, 29)"
        || stockDetailSurface.kpiRects.length !== 3
        || stockDetailSurface.kpiGridHeight > 66
        || Math.max(...stockDetailSurface.kpiRects.map((item) => item.top)) - Math.min(...stockDetailSurface.kpiRects.map((item) => item.top)) > 2
        || stockDetailSurface.kpiRects.some((item) => item.width < 80 || item.height < 58 || item.height > 66)
        || stockDetailSurface.kpiRects[1].left <= stockDetailSurface.kpiRects[0].left
        || stockDetailSurface.kpiRects[2].left <= stockDetailSurface.kpiRects[1].left
        || stockDetailSurface.incoming !== "rgb(21, 29, 35)"
        || stockDetailSurface.outgoing !== "rgb(21, 29, 35)"
        || stockDetailSurface.transfer !== "rgb(21, 29, 35)"
        || stockDetailSurface.correct !== "rgb(21, 29, 35)"
        || stockDetailSurface.archive !== "rgb(21, 29, 35)"
        || stockDetailSurface.incomingWidth < 100
        || Math.abs(stockDetailSurface.incomingWidth - stockDetailSurface.outgoingWidth) > 2
        || Math.abs(stockDetailSurface.transferWidth - stockDetailSurface.correctWidth) > 2
        || stockDetailSurface.transferWidth < 100
        || stockDetailSurface.correctWidth < 100
        || Math.abs(stockDetailSurface.incomingTop - stockDetailSurface.outgoingTop) > 2
        || Math.abs(stockDetailSurface.transferTop - stockDetailSurface.correctTop) > 2
        || stockDetailSurface.transferTop <= stockDetailSurface.incomingTop
        || stockDetailSurface.archiveTop <= stockDetailSurface.transferTop
        || stockDetailSurface.archiveWidth < stockDetailSurface.incomingWidth * 1.8
        || stockDetailSurface.correctTextOverflow > 1
        || (width <= 340 && stockDetailSurface.correctWordBreak !== "normal")
        || (width <= 340 && stockDetailSurface.correctOverflowWrap !== "normal")) {
        report.failures.push({ width, type: "stock-detail-hierarchy", stockDetailSurface });
      }

      const stockDetailDensity = await page.evaluate(() => {
        const hero = document.querySelector(".stock-detail-hero");
        const title = document.querySelector(".stock-detail-hero h2");
        const kpi = document.querySelector(".stock-detail-kpis > div");
        const incoming = document.querySelector(".stock-detail-actions .incoming");
        const transfer = document.querySelector(".stock-detail-actions .stock-detail-transfer");
        const correct = document.querySelector(".stock-detail-actions .stock-detail-correct");
        const archive = document.querySelector(".stock-detail-actions .stock-detail-archive");
        const movement = document.querySelector(".stock-detail-movement");
        const history = document.querySelector(".stock-detail-history:not(.stock-location-summary)") || [...document.querySelectorAll(".stock-detail-history")].at(-1);
        const historyEmpty = history?.querySelector(":scope > .detail-empty");
        const historyEmptyStyle = historyEmpty ? getComputedStyle(historyEmpty) : null;
        const titleStyle = title ? getComputedStyle(title) : null;
        const titleLineHeight = titleStyle ? parseFloat(titleStyle.lineHeight) || 0 : 0;
        const titleHeight = title?.getBoundingClientRect().height || 0;
        return {
          titleLineClamp: titleStyle?.webkitLineClamp || "missing",
          titleTextOverflow: titleStyle?.textOverflow || "missing",
          titleScrollHeight: Math.round(title?.scrollHeight || 0),
          titleClientHeight: Math.round(title?.clientHeight || 0),
          heroHeight: Math.round(hero?.getBoundingClientRect().height || 0),
          heroTitleLines: titleLineHeight > 0 ? Math.max(1, Math.round(titleHeight / titleLineHeight)) : 1,
          kpiHeight: Math.round(kpi?.getBoundingClientRect().height || 0),
          incomingHeight: Math.round(incoming?.getBoundingClientRect().height || 0),
          transferHeight: Math.round(transfer?.getBoundingClientRect().height || 0),
          correctHeight: Math.round(correct?.getBoundingClientRect().height || 0),
          archiveHeight: Math.round(archive?.getBoundingClientRect().height || 0),
          movementHeight: Math.round(movement?.getBoundingClientRect().height || 0),
          historyHeight: Math.round(history?.getBoundingClientRect().height || 0),
          hasEmptyHistory: Boolean(historyEmpty),
          emptyMarginTop: historyEmptyStyle ? parseFloat(historyEmptyStyle.marginTop) || 0 : 0,
          emptyMarginBottom: historyEmptyStyle ? parseFloat(historyEmptyStyle.marginBottom) || 0 : 0
        };
      });
      const stockDetailHeroMax = width <= 340 && stockDetailDensity.heroTitleLines > 2 ? 104 : (stockDetailDensity.heroTitleLines > 1 ? 92 : (width <= 340 ? 82 : 76));
      if (stockDetailDensity.heroHeight > stockDetailHeroMax
        || (width <= 340 && stockDetailDensity.titleLineClamp !== "3")
        || (width <= 340 && stockDetailDensity.titleTextOverflow === "ellipsis")
        || (width <= 340 && stockDetailDensity.titleScrollHeight > stockDetailDensity.titleClientHeight + 1)
        || stockDetailDensity.kpiHeight > 66
        || stockDetailDensity.incomingHeight < 44
        || stockDetailDensity.incomingHeight > 54
        || stockDetailDensity.transferHeight < 44
        || stockDetailDensity.transferHeight > 48
        || stockDetailDensity.correctHeight < 44
        || stockDetailDensity.correctHeight > 48
        || stockDetailDensity.archiveHeight < 44
        || stockDetailDensity.archiveHeight > 48
        || stockDetailDensity.movementHeight > 50
        || (stockDetailDensity.hasEmptyHistory && stockDetailDensity.historyHeight > 58)
        || (stockDetailDensity.hasEmptyHistory && stockDetailDensity.emptyMarginTop > 2.5)
        || (stockDetailDensity.hasEmptyHistory && stockDetailDensity.emptyMarginBottom > 0.5)) {
        report.failures.push({ width, type: "stock-detail-compact-density", stockDetailDensity, stockDetailHeroMax });
      }
      report.results.push(await shot(page, width, "stock-detail", false));
      await page.keyboard.press("Escape");
      await page.locator('[data-action="new-stock"]').click();
      const stockEditorSurface = await page.evaluate(() => {
        const group = (name) => document.querySelector(`.stock-editor-modal [name="${name}"]`)?.closest(".form-group");
        const rect = (name) => {
          const box = group(name)?.getBoundingClientRect();
          return box ? { left: Math.round(box.left), top: Math.round(box.top), width: Math.round(box.width), height: Math.round(box.height) } : null;
        };
        const minimum = group("min");
        const grid = minimum?.closest(".form-grid");
        const fullName = rect("name");
        const locationNode = document.querySelector('.stock-editor-modal [name="initialLocationId"]')?.closest(".form-group")
          || document.querySelector(".stock-editor-modal .stock-field-location");
        const locationRect = locationNode?.getBoundingClientRect();
        const labelFit = [".stock-field-storage-unit > label",".stock-field-consume-unit > label",".stock-field-min > label"].map((selector) => {
          const node = document.querySelector(`.stock-editor-modal ${selector}`);
          return { selector, scrollWidth: node?.scrollWidth || 0, clientWidth: node?.clientWidth || 0 };
        });
        return {
          modal: getComputedStyle(document.querySelector(".stock-editor-modal")).backgroundColor,
          section: getComputedStyle(document.querySelector(".stock-editor-section")).backgroundColor,
          field: getComputedStyle(document.querySelector(".stock-editor-modal .field")).backgroundColor,
          compat: getComputedStyle(document.querySelector(".stock-editor-compat-details")).backgroundColor,
          hasStockTech: Boolean(document.querySelector('.stock-editor-modal [name="stockTech"]')),
          categoryRequired: Boolean(document.querySelector('.stock-editor-modal [name="category"]')?.required),
          gridWidth: Math.round(grid?.getBoundingClientRect().width || 0),
          fullName,
          location: locationRect ? { left: Math.round(locationRect.left), top: Math.round(locationRect.top), width: Math.round(locationRect.width), height: Math.round(locationRect.height) } : null,
          stockTech: rect("stockTech"),
          category: rect("category"),
          storageUnit: rect("unit"),
          consumeUnit: rect("consumeUnit"),
          quantity: rect("quantity"),
          minimum: rect("min"),
          price: rect("price"),
          cost: rect("initialPurchaseTotal") || rect("lastPurchasePrice"),
          labelFit
        };
      });
      if (stockEditorSurface.modal !== "rgb(7, 12, 15)"
        || stockEditorSurface.section !== "rgb(17, 24, 29)"
        || stockEditorSurface.field !== "rgb(21, 29, 35)"
        || stockEditorSurface.compat !== "rgb(17, 24, 29)"
        || !stockEditorSurface.hasStockTech
        || !stockEditorSurface.categoryRequired
        || !stockEditorSurface.fullName
        || !stockEditorSurface.location
        || stockEditorSurface.fullName.width < stockEditorSurface.gridWidth * 0.92
        || stockEditorSurface.location.width < stockEditorSurface.gridWidth * 0.92
        || !stockEditorSurface.stockTech
        || !stockEditorSurface.category
        || !stockEditorSurface.storageUnit
        || !stockEditorSurface.consumeUnit
        || !stockEditorSurface.quantity
        || !stockEditorSurface.minimum
        || !stockEditorSurface.price
        || !stockEditorSurface.cost
        || Math.abs(stockEditorSurface.stockTech.top - stockEditorSurface.category.top) > 2
        || stockEditorSurface.category.left <= stockEditorSurface.stockTech.left
        || Math.abs(stockEditorSurface.storageUnit.top - stockEditorSurface.consumeUnit.top) > 2
        || stockEditorSurface.consumeUnit.left <= stockEditorSurface.storageUnit.left
        || Math.abs(stockEditorSurface.quantity.top - stockEditorSurface.minimum.top) > 2
        || stockEditorSurface.minimum.left <= stockEditorSurface.quantity.left
        || Math.abs(stockEditorSurface.price.top - stockEditorSurface.cost.top) > 2
        || stockEditorSurface.cost.left <= stockEditorSurface.price.left
        || [stockEditorSurface.stockTech, stockEditorSurface.category, stockEditorSurface.storageUnit, stockEditorSurface.consumeUnit, stockEditorSurface.quantity, stockEditorSurface.minimum, stockEditorSurface.price, stockEditorSurface.cost].some((item) => item.width < 110)
        || stockEditorSurface.labelFit.some((item) => item.scrollWidth > item.clientWidth + 1)) {
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
          compatHeight: Math.round(compat?.getBoundingClientRect().height || 0),
          firstSectionHeight: Math.round(section?.getBoundingClientRect().height || 999),
          initialCostHint: (() => {
            const node = document.querySelector("#stock-initial-unit-cost");
            return node ? { scrollWidth: node.scrollWidth, clientWidth: node.clientWidth, whiteSpace: getComputedStyle(node).whiteSpace } : null;
          })()
        };
      });
      if (stockEditorDensity.headHeight > 66
        || stockEditorDensity.bodyGap > 8
        || stockEditorDensity.sectionPaddingTop > 9
        || stockEditorDensity.fieldHeight < 44
        || stockEditorDensity.fieldHeight > 48
        || stockEditorDensity.compatHeight < 44
        || stockEditorDensity.compatHeight > 48
        || stockEditorDensity.firstSectionHeight > (width <= 340 ? 430 : 410)
        || (stockEditorDensity.initialCostHint && stockEditorDensity.initialCostHint.scrollWidth > stockEditorDensity.initialCostHint.clientWidth + 1)) {
        report.failures.push({ width, type: "stock-editor-compact-density", stockEditorDensity });
      }
      await assertPairedFooter(page, width, ".stock-editor-modal .modal-actions", "stock-editor-actions-two-columns");
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
        const comment = modal?.querySelector('.stock-adjust-field [name="comment"]');
        const commentStyle = comment ? getComputedStyle(comment) : null;
        const cancel = modal?.querySelector(".stock-adjust-actions .legacy-dark-button");
        const close = modal?.querySelector(".stock-adjust-head > button");
        const closeRect = close?.getBoundingClientRect();
        return {
          modal: modal ? getComputedStyle(modal).backgroundColor : "missing",
          balance: balance ? getComputedStyle(balance).backgroundColor : "missing",
          field: field ? getComputedStyle(field).backgroundColor : "missing",
          commentFontSize: parseFloat(commentStyle?.fontSize || "0") || 0,
          commentFontWeight: parseFloat(commentStyle?.fontWeight || "0") || 0,
          commentTextAlign: commentStyle?.textAlign || "missing",
          cancel: cancel ? getComputedStyle(cancel).backgroundColor : "missing",
          closeWidth: closeRect ? Math.round(closeRect.width) : 0,
          closeHeight: closeRect ? Math.round(closeRect.height) : 0
        };
      });
      if (stockAdjustSurface.modal !== "rgb(7, 12, 15)"
        || stockAdjustSurface.balance !== "rgb(17, 24, 29)"
        || stockAdjustSurface.field !== "rgb(21, 29, 35)"
        || stockAdjustSurface.commentFontSize < 13.5
        || stockAdjustSurface.commentFontSize > 14.5
        || stockAdjustSurface.commentFontWeight > 600
        || stockAdjustSurface.commentTextAlign !== "left"
        || stockAdjustSurface.cancel !== "rgb(21, 29, 35)"
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
        const summary = document.querySelector(".shopping-summary");
        const summaryIcon = document.querySelector(".shopping-summary-icon");
        const summaryRect = summary?.getBoundingClientRect();
        const summaryIconRect = summaryIcon?.getBoundingClientRect();
        const card = document.querySelector(".shopping-card");
        const need = card?.querySelector(".shopping-need");
        const needRect = need?.getBoundingClientRect();
        return {
          summary: getComputedStyle(document.querySelector(".shopping-summary")).backgroundColor,
          summaryHeight: Math.round(summaryRect?.height || 0),
          summaryIconWidth: Math.round(summaryIconRect?.width || 0),
          summaryIconHeight: Math.round(summaryIconRect?.height || 0),
          card: card ? getComputedStyle(card).backgroundColor : "missing",
          critical: card?.classList.contains("critical") || false,
          needBackground: need ? getComputedStyle(need).backgroundColor : "missing",
          needWidth: needRect ? Math.round(needRect.width) : 0,
          secondaryActionBackgrounds: [...document.querySelectorAll(".shopping-page-actions .secondary-button")].map((node) => getComputedStyle(node).backgroundColor),
          secondaryActionIcons: [...document.querySelectorAll(".shopping-page-actions .secondary-button .ui-icon")].map((node) => getComputedStyle(node).color),
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
      if (shoppingSurface.summary !== "rgb(21, 23, 15)"
        || shoppingSurface.summaryHeight < 56
        || shoppingSurface.summaryHeight > 60
        || shoppingSurface.summaryIconWidth < 36
        || shoppingSurface.summaryIconWidth > 37
        || shoppingSurface.summaryIconHeight < 36
        || shoppingSurface.summaryIconHeight > 37
        || shoppingSurface.card !== "rgb(23, 19, 22)"
        || !shoppingSurface.critical
        || shoppingSurface.needBackground !== "rgba(255, 102, 112, 0.067)"
        || shoppingSurface.needWidth < 60
        || shoppingSurface.secondaryActionBackgrounds.length < 2
        || shoppingSurface.secondaryActionBackgrounds.some((value) => value !== "rgb(21, 29, 35)")
        || shoppingSurface.secondaryActionIcons.some((value) => value !== "rgb(255, 128, 104)")
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
        resultBorder: getComputedStyle(document.querySelector(".finance-result-hero")).borderTopColor,
        incomeBorder: getComputedStyle(document.querySelector(".legacy-finance-summary > .income")).borderTopColor,
        expenseBorder: getComputedStyle(document.querySelector(".legacy-finance-summary > .expense")).borderTopColor,
        actionsWidth: Math.round(document.querySelector(".legacy-finance-actions")?.getBoundingClientRect().width || 0),
        actionRects: [...document.querySelectorAll(".legacy-finance-actions > button")].map((node) => {
          const rect = node.getBoundingClientRect();
          return { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) };
        }),
        rowTitleFont: getComputedStyle(document.querySelector(".legacy-finance-copy strong")).fontSize
      }));
      if (financePageSurface.result !== "rgb(17, 24, 29)"
        || financePageSurface.income !== "rgb(17, 24, 29)"
        || financePageSurface.expense !== "rgb(17, 24, 29)"
        || financePageSurface.incomeRow !== "rgb(17, 24, 29)"
        || financePageSurface.expenseRow !== "rgb(17, 24, 29)"
        || financePageSurface.incomeAction !== "rgb(21, 29, 35)"
        || financePageSurface.expenseAction !== "rgb(21, 29, 35)"
        || financePageSurface.incomeActionBorder !== "rgb(48, 59, 66)"
        || financePageSurface.expenseActionBorder !== "rgb(48, 59, 66)"
        || financePageSurface.incomeActionColor !== "rgb(101, 217, 149)"
        || financePageSurface.expenseActionColor !== "rgb(255, 113, 123)"
        || financePageSurface.resultBorder !== "rgb(48, 58, 65)"
        || financePageSurface.incomeBorder !== "rgb(48, 58, 65)"
        || financePageSurface.expenseBorder !== "rgb(48, 58, 65)"
        || financePageSurface.actionRects.length !== 2
        || financePageSurface.actionRects.some((rect) => rect.width < 120 || rect.height < 48 || rect.height > 49)
        || Math.abs(financePageSurface.actionRects[0].width - financePageSurface.actionRects[1].width) > 2
        || Math.abs(financePageSurface.actionRects[0].top - financePageSurface.actionRects[1].top) > 2
        || financePageSurface.actionRects[1].left <= financePageSurface.actionRects[0].left
        || financePageSurface.actionRects[0].width + financePageSurface.actionRects[1].width > financePageSurface.actionsWidth
        || parseFloat(financePageSurface.rowTitleFont) < 11.5) {
        report.failures.push({ width, type: "finance-semantic-hierarchy", financePageSurface });
      }
      await page.locator('[data-action="add-finance"][data-type="income"]').click();
      const financeEditorState = await page.evaluate(() => {
        const modal = document.querySelector(".finance-entry-modal");
        const field = document.querySelector(".finance-entry-modal .field");
        const footer = document.querySelector(".finance-entry-modal .modal-actions");
        const footerRect = footer?.getBoundingClientRect();
        const modalRect = modal?.getBoundingClientRect();
        const gridRect = document.querySelector(".finance-entry-modal .form-grid")?.getBoundingClientRect();
        const close = document.querySelector(".finance-entry-close");
        const closeRect = close?.getBoundingClientRect();
        const action = footer?.querySelector("button");
        const actionRect = action?.getBoundingClientRect();
        return {
          modal: modal ? getComputedStyle(modal).backgroundColor : "missing",
          backdrop: getComputedStyle(document.querySelector(".legacy-finance-entry-backdrop")).backgroundColor,
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
          modalBottom: modalRect ? Math.round(modalRect.bottom) : 0,
          blankGap: footerRect && gridRect ? Math.round(footerRect.top - gridRect.bottom) : 999,
          viewportHeight: window.innerHeight
        };
      });
      if (financeEditorState.modal !== "rgb(7, 12, 15)"
        || financeEditorState.backdrop !== "rgb(2, 5, 7)"
        || financeEditorState.field !== "rgb(21, 29, 35)"
        || parseFloat(financeEditorState.fieldFont) < 13.5
        || financeEditorState.closeWidth < 44
        || financeEditorState.closeHeight < 44
        || financeEditorState.actionHeight < 48
        || financeEditorState.modalBottom > financeEditorState.viewportHeight + 1
        || financeEditorState.blankGap > 20) {
        report.failures.push({ width, type: "finance-editor-layout", financeEditorState });
      }
      if (financeEditorState.headHeight > 60
        || financeEditorState.typeHeight > 52
        || financeEditorState.fieldHeight > 46
        || financeEditorState.rowGap > 7.5) {
        report.failures.push({ width, type: "finance-editor-compact-density", financeEditorState });
      }
      await assertPairedFooter(page, width, ".finance-entry-modal .modal-actions", "finance-editor-actions-two-columns");
      report.results.push(await shot(page, width, "finance-editor", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "prices" }));
      const pricePageSurface = await page.evaluate(() => {
        const search = document.querySelector("#price-search");
        const searchStyle = getComputedStyle(search);
        const filterGrid = document.querySelector(".legacy-price-filters");
        const filterGridRect = filterGrid?.getBoundingClientRect();
        const filterRects = [...document.querySelectorAll(".legacy-price-filters > label")].map((node) => node.getBoundingClientRect());
        const filterFields = [...document.querySelectorAll(".legacy-price-filters .field")].map((node) => node.getBoundingClientRect());
        const addRect = document.querySelector(".legacy-price-add-wide")?.getBoundingClientRect();
        const searchRect = search?.getBoundingClientRect();
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
          addWidth: Math.round(addRect?.width || 0),
          searchWidth: Math.round(searchRect?.width || 0),
          addHeight: Math.round(addRect?.height || 0),
          searchHeight: Math.round(searchRect?.height || 0),
          addBackground: getComputedStyle(document.querySelector(".legacy-price-add-wide")).backgroundColor,
          filterFieldHeights: filterFields.map((rect) => Math.round(rect.height)),
          gapAddSearch: addRect && searchRect ? Math.round(searchRect.top - addRect.bottom) : 999,
          gapSearchFilters: searchRect && filterGridRect ? Math.round(filterGridRect.top - searchRect.bottom) : 999,
          priceColors: [...document.querySelectorAll(".legacy-price-row > b")].map((node) => getComputedStyle(node).color),
          rowBorders: [...document.querySelectorAll(".legacy-price-row")].map((node) => getComputedStyle(node).borderTopColor),
          customHeadBorder: getComputedStyle(document.querySelector(".legacy-custom-price-head")).borderBottomColor,
          filterGridWidth: Math.round(filterGridRect?.width || 0),
          filterWidths: filterRects.map((rect) => Math.round(rect.width)),
          filterLefts: filterRects.map((rect) => Math.round(rect.left)),
          filterTops: filterRects.map((rect) => Math.round(rect.top)),
          firstRowHeight: Math.round(rowRect?.height || 0),
          firstCopyRight: Math.round(copyRect?.right || 0),
          firstPriceLeft: Math.round(priceRect?.left || 0),
          firstPriceCenter: priceRect ? Math.round(priceRect.top + priceRect.height / 2) : 0,
          firstRowCenter: rowRect ? Math.round(rowRect.top + rowRect.height / 2) : 0,
          groupHeaderHeights: [...document.querySelectorAll(".legacy-price-groups .legacy-price-group > h3")].map((node) => Math.round(node.getBoundingClientRect().height)),
          customHeadHeight: Math.round(document.querySelector(".legacy-custom-price-head")?.getBoundingClientRect().height || 0),
          customActionHeight: Math.round(document.querySelector(".legacy-custom-price-head button")?.getBoundingClientRect().height || 0),
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
      if (pricePageSurface.group !== "rgb(17, 24, 29)"
        || pricePageSurface.service !== "rgb(17, 24, 29)"
        || pricePageSurface.material !== "rgb(17, 24, 29)"
        || pricePageSurface.custom !== "rgb(17, 24, 29)"
        || parseFloat(pricePageSurface.rowTitleFont) < 11.5
        || pricePageSurface.searchBackground !== "rgb(21, 29, 35)"
        || pricePageSurface.searchBorder !== "rgb(32, 45, 53)"
        || pricePageSurface.searchShadow !== "none"
        || Math.abs(pricePageSurface.addWidth - pricePageSurface.searchWidth) > 2
        || pricePageSurface.addHeight < 48
        || pricePageSurface.addHeight > 49
        || pricePageSurface.searchHeight < 44
        || pricePageSurface.searchHeight > 45
        || pricePageSurface.filterFieldHeights.length !== 2
        || pricePageSurface.filterFieldHeights.some((value) => value < 44 || value > 45)
        || pricePageSurface.gapAddSearch > 7
        || pricePageSurface.gapSearchFilters > 7
        || pricePageSurface.addBackground !== "rgb(255, 113, 79)"
        || pricePageSurface.priceColors.some((value) => value !== "rgb(255, 138, 112)")
        || pricePageSurface.rowBorders.some((value) => value !== "rgb(40, 51, 58)")
        || pricePageSurface.customHeadBorder !== "rgb(40, 51, 58)"
        || pricePageSurface.filterTops.length !== 2
        || pricePageSurface.filterLefts.length !== 2
        || pricePageSurface.filterWidths.some((value) => value < 130)
        || Math.abs(pricePageSurface.filterWidths[0] - pricePageSurface.filterWidths[1]) > 2
        || Math.abs(pricePageSurface.filterTops[0] - pricePageSurface.filterTops[1]) > 2
        || pricePageSurface.filterLefts[1] <= pricePageSurface.filterLefts[0]
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
      const priceRowLimit = width <= 340 ? 56 : 54;
      if (pricePageSurface.groupHeaderHeights.length < 1
        || pricePageSurface.groupHeaderHeights.some((value) => value < 32 || value > 36)
        || pricePageSurface.customHeadHeight < 48
        || pricePageSurface.customHeadHeight > 52
        || pricePageSurface.customActionHeight < 44
        || pricePageSurface.firstRowHeight > priceRowLimit) {
        report.failures.push({ width, type: "price-group-density", pricePageSurface, priceRowLimit });
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
        const footer = document.querySelector(".legacy-price-editor-actions");
        const footerRect = footer?.getBoundingClientRect();
        const modalRect = document.querySelector(".legacy-price-editor")?.getBoundingClientRect();
        const cardRect = document.querySelector(".legacy-price-editor-card")?.getBoundingClientRect();
        const action = footer?.querySelector("button");
        const actionRect = action?.getBoundingClientRect();
        const field = document.querySelector(".legacy-price-editor .field");
        return {
          backdrop: getComputedStyle(document.querySelector(".legacy-price-editor-backdrop")).backgroundColor,
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
          cardPaddingTop: parseFloat(getComputedStyle(document.querySelector(".legacy-price-editor-card")).paddingTop) || 0,
          modalBottom: modalRect ? Math.round(modalRect.bottom) : 0,
          blankGap: footerRect && cardRect ? Math.round(footerRect.top - cardRect.bottom) : 999,
          viewportHeight: window.innerHeight
        };
      });
      if (priceEditorState.backdrop !== "rgb(2, 5, 7)"
        || priceEditorState.card !== "rgb(17, 24, 29)"
        || priceEditorState.field !== "rgb(21, 29, 35)"
        || parseFloat(priceEditorState.fieldFont) < 13.5
        || priceEditorState.secondary !== "rgb(21, 29, 35)"
        || priceEditorState.backWidth < 44
        || priceEditorState.backHeight < 44
        || priceEditorState.actionHeight < 48
        || priceEditorState.modalBottom > priceEditorState.viewportHeight + 1
        || priceEditorState.blankGap > 20) {
        report.failures.push({ width, type: "price-editor-deep-dark", priceEditorState });
      }
      if (priceEditorState.headHeight > 60
        || priceEditorState.fieldHeight > 46
        || priceEditorState.rowGap > 7.5
        || priceEditorState.cardPaddingTop > 10) {
        report.failures.push({ width, type: "price-editor-compact-density", priceEditorState });
      }
      await assertPairedFooter(page, width, ".legacy-price-editor-actions", "price-editor-actions-two-columns");
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
      if (clientPageSurface.background !== "rgb(17, 24, 29)"
        || clientPageSurface.primaryStat !== "rgb(17, 24, 29)"
        || clientPageSurface.activeStat !== "rgb(17, 24, 29)"
        || clientPageSurface.closedStat !== "rgb(17, 24, 29)"
        || parseFloat(clientPageSurface.titleFont) < 11.5
        || clientPageSurface.actionBackgrounds.some((value) => value !== "rgb(21, 29, 35)")
        || clientPageSurface.actionBorders.some((value) => value !== "rgb(48, 59, 66)")
        || clientPageSurface.actionWidths.length !== 2
        || Math.abs(clientPageSurface.actionWidths[0] - clientPageSurface.actionWidths[1]) > 2
        || clientPageSurface.totalColor !== "rgb(255, 138, 112)") {
        report.failures.push({ width, type: "clients-semantic-hierarchy", clientPageSurface });
      }
      const clientDensity = await page.evaluate(() => {
        const stats = document.querySelector(".legacy-clients-stats");
        const statRects = [...document.querySelectorAll(".legacy-clients-stats > div")].map((node) => node.getBoundingClientRect());
        const primary = document.querySelector(".legacy-clients-stats > .clients-stat-primary");
        const secondary = document.querySelector(".legacy-clients-stats > div:nth-child(2)");
        const main = document.querySelector(".legacy-client-main");
        const action = document.querySelector(".legacy-client-actions > *");
        return {
          primaryHeight: Math.round(primary?.getBoundingClientRect().height || 0),
          secondaryHeight: Math.round(secondary?.getBoundingClientRect().height || 0),
          mainHeight: Math.round(main?.getBoundingClientRect().height || 0),
          actionHeight: Math.round(action?.getBoundingClientRect().height || 0),
          columns: stats ? getComputedStyle(stats).gridTemplateColumns : "",
          statWidths: statRects.map((rect) => Math.round(rect.width)),
          statHeights: statRects.map((rect) => Math.round(rect.height)),
          statTops: statRects.map((rect) => Math.round(rect.top))
        };
      });
      const clientDensityLimits = width <= 340
        ? { primary: 86, secondary: 76, main: 104 }
        : { primary: 86, secondary: 76, main: 78 };
      if (clientDensity.primaryHeight > clientDensityLimits.primary
        || clientDensity.secondaryHeight > clientDensityLimits.secondary
        || clientDensity.columns.split(" ").filter(Boolean).length !== 3
        || clientDensity.statWidths.length !== 3
        || clientDensity.statWidths.some((value) => value < 80)
        || Math.max(...clientDensity.statWidths) - Math.min(...clientDensity.statWidths) > 2
        || clientDensity.statHeights.some((value) => value < 70 || value > 82)
        || Math.max(...clientDensity.statTops) - Math.min(...clientDensity.statTops) > 2
        || clientDensity.mainHeight > clientDensityLimits.main
        || clientDensity.actionHeight < 44) {
        report.failures.push({ width, type: "clients-compact-density", clientDensity, clientDensityLimits });
      }
      const clientCardDensity = await page.evaluate(() => {
        const card = document.querySelector(".legacy-client-card")?.getBoundingClientRect();
        const main = document.querySelector(".legacy-client-main")?.getBoundingClientRect();
        const copy = document.querySelector(".legacy-client-copy")?.getBoundingClientRect();
        const side = document.querySelector(".legacy-client-side")?.getBoundingClientRect();
        const meta = document.querySelector(".legacy-client-meta")?.getBoundingClientRect();
        const action = document.querySelector(".legacy-client-actions > *")?.getBoundingClientRect();
        return {
          cardHeight: Math.round(card?.height || 0),
          mainHeight: Math.round(main?.height || 0),
          metaHeight: Math.round(meta?.height || 0),
          actionHeight: Math.round(action?.height || 0),
          mainColumns: main ? getComputedStyle(document.querySelector(".legacy-client-main")).gridTemplateColumns : "",
          copyLeft: Math.round(copy?.left || 0),
          copyBottom: Math.round(copy?.bottom || 0),
          sideLeft: Math.round(side?.left || 0),
          sideTop: Math.round(side?.top || 0)
        };
      });
      if (clientCardDensity.mainHeight > (width <= 340 ? 80 : 76)
        || clientCardDensity.metaHeight > 30
        || clientCardDensity.actionHeight < 44
        || clientCardDensity.mainColumns.split(" ").filter(Boolean).length !== 3
        || clientCardDensity.sideLeft <= clientCardDensity.copyLeft
        || clientCardDensity.sideTop >= clientCardDensity.copyBottom) {
        report.failures.push({ width, type: "clients-card-density", clientCardDensity });
      }
      await page.locator('[data-action="open-client"]').first().click();
      const clientProfileState = await page.evaluate(() => {
        const head = document.querySelector(".client-profile-head")?.getBoundingClientRect();
        const hero = document.querySelector(".client-profile-hero")?.getBoundingClientRect();
        const address = document.querySelector(".client-profile-address")?.getBoundingClientRect();
        const action = document.querySelector(".client-profile-actions > *")?.getBoundingClientRect();
        const kpi = document.querySelector(".client-profile-kpis > div")?.getBoundingClientRect();
        const note = document.querySelector(".client-profile-note-details");
        const noteSummary = document.querySelector(".client-profile-note-summary")?.getBoundingClientRect();
        const noteBody = document.querySelector(".client-profile-note-body");
        const textarea = document.querySelector(".client-profile-note .textarea")?.getBoundingClientRect();
        const order = document.querySelector(".client-profile-orders > button")?.getBoundingClientRect();
        const back = document.querySelector(".client-profile-back")?.getBoundingClientRect();
        return {
          modal: getComputedStyle(document.querySelector(".client-profile-modal")).backgroundColor,
          hero: getComputedStyle(document.querySelector(".client-profile-hero")).backgroundColor,
          totalKpi: getComputedStyle(document.querySelector(".client-profile-kpis > div:nth-child(4)")).backgroundColor,
          closedKpi: getComputedStyle(document.querySelector(".client-profile-kpis > div:nth-child(2)")).backgroundColor,
          activeKpi: getComputedStyle(document.querySelector(".client-profile-kpis > div:nth-child(3)")).backgroundColor,
          callAction: getComputedStyle(document.querySelector(".client-profile-actions > a:first-child")).backgroundColor,
          newOrderAction: getComputedStyle(document.querySelector(".client-profile-actions > button:last-child")).backgroundColor,
          headHeight: Math.round(head?.height || 0),
          heroHeight: Math.round(hero?.height || 0),
          addressHeight: Math.round(address?.height || 0),
          addressMeta: (() => {
            const meta = document.querySelector(".client-profile-address-meta");
            const label = meta?.querySelector(":scope > span");
            const actionText = meta?.querySelector(":scope > em");
            const labelRect = label?.getBoundingClientRect();
            const actionRect = actionText?.getBoundingClientRect();
            return {
              labelText: label?.textContent?.trim() || "",
              actionText: actionText?.textContent?.trim() || "",
              labelScrollWidth: label?.scrollWidth || 0,
              labelClientWidth: label?.clientWidth || 0,
              actionScrollWidth: actionText?.scrollWidth || 0,
              actionClientWidth: actionText?.clientWidth || 0,
              labelRight: Math.round(labelRect?.right || 0),
              actionLeft: Math.round(actionRect?.left || 0)
            };
          })(),
          actionHeight: Math.round(action?.height || 0),
          kpiHeight: Math.round(kpi?.height || 0),
          noteTag: note?.tagName || "",
          noteOpen: Boolean(note?.open),
          noteSummaryHeight: Math.round(noteSummary?.height || 0),
          noteBodyDisplay: noteBody ? getComputedStyle(noteBody).display : "missing",
          noteStateText: document.querySelector("#client-profile-note-state")?.textContent || "",
          textareaHeight: Math.round(textarea?.height || 0),
          orderHeight: Math.round(order?.height || 0),
          backWidth: Math.round(back?.width || 0),
          backHeight: Math.round(back?.height || 0)
        };
      });
      if (clientProfileState.modal !== "rgb(3, 7, 10)"
        || clientProfileState.hero !== "rgb(7, 12, 16)"
        || clientProfileState.totalKpi !== "rgb(17, 24, 29)"
        || clientProfileState.closedKpi !== "rgb(17, 24, 29)"
        || clientProfileState.activeKpi !== "rgb(17, 24, 29)"
        || clientProfileState.callAction !== "rgb(21, 29, 35)"
        || clientProfileState.newOrderAction !== "rgb(21, 29, 35)") {
        report.failures.push({ width, type: "client-profile-semantic-hierarchy", clientProfileState });
      }
      if (clientProfileState.headHeight > 60
        || clientProfileState.heroHeight > 72
        || (clientProfileState.addressHeight && clientProfileState.addressHeight > 60)
        || (clientProfileState.addressHeight && (
          clientProfileState.addressMeta.labelText !== "Последний адрес"
          || clientProfileState.addressMeta.actionText !== "Открыть карту"
          || clientProfileState.addressMeta.labelScrollWidth > clientProfileState.addressMeta.labelClientWidth + 1
          || clientProfileState.addressMeta.actionScrollWidth > clientProfileState.addressMeta.actionClientWidth + 1
          || clientProfileState.addressMeta.actionLeft < clientProfileState.addressMeta.labelRight + 4
        ))
        || clientProfileState.actionHeight < 44
        || clientProfileState.kpiHeight > 60
        || clientProfileState.noteTag !== "DETAILS"
        || clientProfileState.noteOpen
        || clientProfileState.noteSummaryHeight < 44
        || clientProfileState.noteSummaryHeight > 52
        || clientProfileState.noteBodyDisplay !== "none"
        || clientProfileState.noteStateText !== "Нет заметки"
        || (clientProfileState.orderHeight && clientProfileState.orderHeight > (width <= 340 ? 70 : 66))
        || clientProfileState.backWidth < 44
        || clientProfileState.backHeight < 44) {
        report.failures.push({ width, type: "client-profile-compact-density", clientProfileState });
      }
      report.results.push(await shot(page, width, "client-profile", false));
      if (width === 390) {
        await page.locator(".client-profile-note-summary").click();
        const expandedClientNote = await page.evaluate(() => {
          const note = document.querySelector(".client-profile-note-details");
          const body = document.querySelector(".client-profile-note-body");
          const textarea = document.querySelector("#client-profile-note")?.getBoundingClientRect();
          return {
            open: Boolean(note?.open),
            bodyDisplay: body ? getComputedStyle(body).display : "missing",
            textareaHeight: Math.round(textarea?.height || 0)
          };
        });
        if (!expandedClientNote.open
          || expandedClientNote.bodyDisplay === "none"
          || expandedClientNote.textareaHeight < 70) {
          report.failures.push({ width, type: "client-profile-note-expand", expandedClientNote });
        }
        await page.locator(".client-profile-note-summary").click();
      }
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "menu" }));
      const moreMenuSurface = await page.evaluate(() => {
        const items = [...document.querySelectorAll(".legacy-more-list .menu-item")];
        const page = document.querySelector(".legacy-more-page");
        const pageStyle = page ? getComputedStyle(page) : null;
        return {
          names: items.map((item) => item.querySelector(".menu-name")?.textContent?.trim() || ""),
          iconBackgrounds: items.map((item) => getComputedStyle(item.querySelector(".menu-icon")).backgroundColor),
          iconBorders: items.map((item) => parseFloat(getComputedStyle(item.querySelector(".menu-icon")).borderTopWidth) || 0),
          finance: document.querySelectorAll(".legacy-more-list .menu-finance").length,
          shopping: document.querySelectorAll(".legacy-more-list .menu-shopping").length,
          tools: document.querySelectorAll(".legacy-more-list .menu-tools").length,
          titleFont: parseFloat(getComputedStyle(document.querySelector(".legacy-more-list .menu-name")).fontSize) || 0,
          titleWeight: parseFloat(getComputedStyle(document.querySelector(".legacy-more-list .menu-name")).fontWeight) || 0,
          pagePaddingLeft: pageStyle ? parseFloat(pageStyle.paddingLeft) || 0 : 999,
          pagePaddingRight: pageStyle ? parseFloat(pageStyle.paddingRight) || 0 : 999,
          versionText: document.querySelector(".more-version-button")?.innerText || "",
          versionHeight: Math.round(document.querySelector(".more-version-button")?.getBoundingClientRect().height || 0),
          descriptionStyles: [...document.querySelectorAll(".legacy-more-list .menu-description")].map((node) => {
            const style = getComputedStyle(node);
            return {
              whiteSpace: style.whiteSpace,
              textOverflow: style.textOverflow,
              lineClamp: style.webkitLineClamp
            };
          }),
          alignments: items.map((item) => {
            const itemRect = item.getBoundingClientRect();
            const iconRect = item.querySelector(".menu-icon")?.getBoundingClientRect();
            const copyRect = item.querySelector(".menu-copy")?.getBoundingClientRect();
            const chevronRect = item.querySelector(":scope > .chevron")?.getBoundingClientRect();
            const svgRect = item.querySelector(".menu-icon .ui-icon")?.getBoundingClientRect();
            const centerY = (rect) => rect ? rect.top + rect.height / 2 : -999;
            const itemCenter = centerY(itemRect);
            return {
              iconDelta: Math.round(Math.abs(centerY(iconRect) - itemCenter) * 10) / 10,
              copyDelta: Math.round(Math.abs(centerY(copyRect) - itemCenter) * 10) / 10,
              chevronDelta: Math.round(Math.abs(centerY(chevronRect) - itemCenter) * 10) / 10,
              svgWidth: Math.round(svgRect?.width || 0),
              svgHeight: Math.round(svgRect?.height || 0)
            };
          })
        };
      });
      const expectedMoreNames = ["Финансы","Список покупок","Клиенты","Прайс-лист","Акт","Товарник","Календарь","Настройки"];
      if (JSON.stringify(moreMenuSurface.names) !== JSON.stringify(expectedMoreNames)
        || moreMenuSurface.finance !== 1
        || moreMenuSurface.shopping !== 1
        || moreMenuSurface.tools !== 0
        || new Set(moreMenuSurface.iconBackgrounds).size < 6
        || moreMenuSurface.iconBorders.some((value) => value > 0.1)
        || moreMenuSurface.titleFont < 14
        || moreMenuSurface.titleWeight > 650
        || moreMenuSurface.pagePaddingLeft > 9
        || moreMenuSurface.pagePaddingRight > 9
        || !/v\d+\.\d+\.\d+/.test(moreMenuSurface.versionText)
        || !moreMenuSurface.versionText.includes("Что нового")
        || moreMenuSurface.versionHeight < 44
        || moreMenuSurface.alignments.length !== expectedMoreNames.length
        || moreMenuSurface.alignments.some((item) =>
          item.iconDelta > 1
          || item.copyDelta > 2
          || item.chevronDelta > 1
          || item.svgWidth < 20
          || item.svgWidth > 22
          || item.svgHeight < 20
          || item.svgHeight > 22
        )
        || (width <= 340 && moreMenuSurface.descriptionStyles.some((style) =>
          style.whiteSpace === "nowrap"
          || style.textOverflow === "ellipsis"
          || style.lineClamp !== "2"
        ))) {
        report.failures.push({ width, type: "more-menu-first-version-hierarchy", moreMenuSurface });
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
      if (moreMenuDensity.gap > 9
        || moreMenuDensity.itemHeight < 76
        || moreMenuDensity.itemHeight > 84
        || moreMenuDensity.iconHeight < 44
        || moreMenuDensity.iconHeight > 47) {
        report.failures.push({ width, type: "more-menu-first-version-density", moreMenuDensity });
      }

      await page.locator('.more-version-button[data-action="release-notes"]').click();
      await page.waitForTimeout(50);
      const releaseNotesDensity = await page.evaluate(() => {
        const backdrop = document.querySelector(".release-notes-backdrop");
        const modal = document.querySelector(".release-notes-modal");
        const head = modal?.querySelector(".release-notes-head");
        const close = head?.querySelector("[data-close-modal]");
        const current = modal?.querySelector(".release-current");
        const list = modal?.querySelector(".release-notes-list");
        const note = modal?.querySelector(".release-note");
        const noteTitle = note?.querySelector("h3");
        const done = modal?.querySelector(":scope > .primary-button.wide");
        const px = (value) => Number.parseFloat(value || "0") || 0;
        const modalStyle = modal ? getComputedStyle(modal) : null;
        const headStyle = head ? getComputedStyle(head) : null;
        const currentStyle = current ? getComputedStyle(current) : null;
        const listStyle = list ? getComputedStyle(list) : null;
        const noteStyle = note ? getComputedStyle(note) : null;
        const closeRect = close?.getBoundingClientRect();
        return {
          backdropPaddingLeft: backdrop ? px(getComputedStyle(backdrop).paddingLeft) : 999,
          modalPaddingTop: modalStyle ? px(modalStyle.paddingTop) : 999,
          headPosition: headStyle?.position || "missing",
          headTop: headStyle ? px(headStyle.top) : 999,
          closeWidth: Math.round(closeRect?.width || 0),
          closeHeight: Math.round(closeRect?.height || 0),
          currentMarginTop: currentStyle ? px(currentStyle.marginTop) : 999,
          currentPaddingTop: currentStyle ? px(currentStyle.paddingTop) : 999,
          listGap: listStyle ? px(listStyle.rowGap || listStyle.gap) : 999,
          notePaddingTop: noteStyle ? px(noteStyle.paddingTop) : 999,
          noteTitleFont: noteTitle ? px(getComputedStyle(noteTitle).fontSize) : 0,
          doneHeight: Math.round(done?.getBoundingClientRect().height || 0),
          scrollable: Boolean(modal && modal.scrollHeight > modal.clientHeight + 20)
        };
      });
      if (releaseNotesDensity.backdropPaddingLeft > 8
        || releaseNotesDensity.modalPaddingTop > 10
        || releaseNotesDensity.headPosition !== "sticky"
        || Math.abs(releaseNotesDensity.headTop) > 0.5
        || releaseNotesDensity.closeWidth < 44
        || releaseNotesDensity.closeHeight < 44
        || releaseNotesDensity.currentMarginTop > 8
        || releaseNotesDensity.currentPaddingTop > 9
        || releaseNotesDensity.listGap > 6.5
        || releaseNotesDensity.notePaddingTop > 9
        || releaseNotesDensity.noteTitleFont < 11
        || releaseNotesDensity.doneHeight < 48
        || !releaseNotesDensity.scrollable) {
        report.failures.push({ width, type: "release-notes-compact-density", releaseNotesDensity });
      }
      const releaseNotesSticky = await page.evaluate(() => {
        const modal = document.querySelector(".release-notes-modal");
        const head = modal?.querySelector(".release-notes-head");
        const close = head?.querySelector("[data-close-modal]");
        if (!modal || !head || !close) return { scrollTop: 0, closeVisible: false };
        modal.scrollTop = Math.min(360, Math.max(0, modal.scrollHeight - modal.clientHeight));
        const modalRect = modal.getBoundingClientRect();
        const closeRect = close.getBoundingClientRect();
        return {
          scrollTop: Math.round(modal.scrollTop),
          closeVisible: closeRect.top >= modalRect.top - 1 && closeRect.bottom <= modalRect.bottom + 1
        };
      });
      if (releaseNotesSticky.scrollTop > 0 && !releaseNotesSticky.closeVisible) {
        report.failures.push({ width, type: "release-notes-sticky-close", releaseNotesSticky });
      }
      report.results.push(await shot(page, width, "release-notes", false));
      await page.locator(".release-notes-head [data-close-modal]").click();

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
        createRects: [...document.querySelectorAll(".legacy-goods-create-grid > button")].map((node) => {
          const rect = node.getBoundingClientRect();
          return { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) };
        }),
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
        || goodsPageSurface.createRects.length !== 2
        || goodsPageSurface.createRects.some((item) => item.width < 120 || item.height < 48 || item.height > 49)
        || Math.abs(goodsPageSurface.createRects[0].width - goodsPageSurface.createRects[1].width) > 2
        || Math.abs(goodsPageSurface.createRects[0].top - goodsPageSurface.createRects[1].top) > 2
        || goodsPageSurface.createRects[1].left <= goodsPageSurface.createRects[0].left
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
        const rowAmount = row?.querySelector(":scope > b")?.getBoundingClientRect();
        const sourceLabel = document.querySelector(".legacy-goods-new .legacy-goods-order-source > span");
        const help = document.querySelector(".legacy-goods-new .legacy-goods-help")?.getBoundingClientRect();
        const edit = document.querySelector(".legacy-open-editor");
        const panelStyle = panel ? getComputedStyle(panel) : null;
        const px = (value) => Number.parseFloat(value || "0") || 0;
        return {
          panelPaddingTop: panelStyle ? px(panelStyle.paddingTop) : 999,
          summaryHeight: Math.round(summary?.getBoundingClientRect().height || 0),
          rowHeight: Math.round(row?.getBoundingClientRect().height || 0),
          rowColumns: row ? getComputedStyle(row).gridTemplateColumns : "",
          rowAmountRight: Math.round(rowAmount?.right || 0),
          sourceLabelDisplay: sourceLabel ? getComputedStyle(sourceLabel).display : "missing",
          helpHeight: Math.round(help?.height || 0),
          editHeight: Math.round(edit?.getBoundingClientRect().height || 0)
        };
      });
      const goodsRowLimit = 58;
      if (goodsDensity.panelPaddingTop > 10
        || goodsDensity.summaryHeight > 62
        || goodsDensity.rowHeight > goodsRowLimit
        || goodsDensity.rowColumns.split(" ").filter(Boolean).length !== 2
        || goodsDensity.rowAmountRight <= 0
        || goodsDensity.sourceLabelDisplay !== "none"
        || goodsDensity.helpHeight > 16
        || goodsDensity.editHeight < 44) {
        report.failures.push({ width, type: "goods-compact-density", goodsDensity, goodsRowLimit });
      }

      await page.locator("#product-price-panel > summary").click();
      const goodsProductPrice = await page.evaluate(() => {
        const row = document.querySelector(".legacy-product-price-list > div");
        const copy = row?.querySelector(":scope > span");
        const amount = row?.querySelector(":scope > b");
        const rowRect = row?.getBoundingClientRect();
        const copyRect = copy?.getBoundingClientRect();
        const amountRect = amount?.getBoundingClientRect();
        const countCopy = document.querySelector(".legacy-goods-current-summary small")?.textContent?.trim() || "";
        return {
          open: document.querySelector("#product-price-panel")?.open === true,
          rowColumns: row ? getComputedStyle(row).gridTemplateColumns : "",
          rowHeight: Math.round(rowRect?.height || 0),
          copyRight: Math.round(copyRect?.right || 0),
          amountLeft: Math.round(amountRect?.left || 0),
          amountRight: Math.round(amountRect?.right || 0),
          rowRight: Math.round(rowRect?.right || 0),
          countCopy,
          chevronTransform: getComputedStyle(document.querySelector(".legacy-product-price .legacy-price-chevron")).transform
        };
      });
      if (!goodsProductPrice.open
        || goodsProductPrice.chevronTransform === "none"
        || goodsProductPrice.rowColumns.split(" ").filter(Boolean).length !== 2
        || goodsProductPrice.rowHeight > 64
        || goodsProductPrice.amountLeft <= goodsProductPrice.copyRight - 2
        || Math.abs(goodsProductPrice.rowRight - goodsProductPrice.amountRight) > 12
        || goodsProductPrice.countCopy !== "Позиций: 2") {
        report.failures.push({ width, type: "goods-product-price-layout", goodsProductPrice });
      }
      report.results.push(await shot(page, width, "goods-product-price", false));
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
          previewBackground: getComputedStyle(document.querySelector("#preview-goods")).backgroundColor,
          headHeight: Math.round(document.querySelector(".legacy-goods-editor .goods-modal-head")?.getBoundingClientRect().height || 0),
          fieldHeight: Math.round(field?.getBoundingClientRect().height || 0),
          panelPaddingTop: parseFloat(getComputedStyle(document.querySelector(".legacy-goods-editor .legacy-editor-panel")).paddingTop) || 0,
          targetPaddingTop: parseFloat(getComputedStyle(document.querySelector(".legacy-goods-target")).paddingTop) || 0,
          savebarGap: parseFloat(getComputedStyle(document.querySelector(".legacy-goods-savebar")).rowGap) || 0,
          addButtonHeight: Math.round(addButtonRect?.height || 0)
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
      if (goodsEditorState.headHeight > 60
        || goodsEditorState.fieldHeight > 46
        || goodsEditorState.panelPaddingTop > 10
        || goodsEditorState.targetPaddingTop > 9
        || goodsEditorState.savebarGap > 6.5
        || goodsEditorState.addButtonHeight < 44) {
        report.failures.push({ width, type: "goods-editor-compact-density", goodsEditorState });
      }
      await assertPairedFooter(page, width, ".legacy-goods-savebar", "goods-editor-actions-two-columns");
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
          chevronLeft: Math.round(chevronRect?.left || 0),
          titleWrap: (() => {
            const node = row?.querySelector(":scope > span:nth-child(2) > strong");
            const style = node ? getComputedStyle(node) : null;
            return { whiteSpace: style?.whiteSpace || "missing", lineClamp: style?.webkitLineClamp || "missing", textOverflow: style?.textOverflow || "missing" };
          })(),
          metaWrap: (() => {
            const node = row?.querySelector(":scope > span:nth-child(2) > small");
            const style = node ? getComputedStyle(node) : null;
            const lineHeight = style ? parseFloat(style.lineHeight) || 0 : 0;
            return {
              whiteSpace: style?.whiteSpace || "missing",
              lineClamp: style?.webkitLineClamp || "missing",
              textOverflow: style?.textOverflow || "missing",
              lines: node && lineHeight > 0 ? Math.round(node.getBoundingClientRect().height / lineHeight) : 0
            };
          })()
        };
      });
      if (toolsPageSurface.totalStat !== "rgb(17, 24, 29)"
        || toolsPageSurface.activeStat !== "rgb(17, 24, 29)"
        || toolsPageSurface.available !== "rgb(17, 24, 29)"
        || toolsPageSurface.busy !== "rgb(17, 24, 29)"
        || toolsPageSurface.addWidth < toolsPageSurface.pageWidth - 34
        || toolsPageSurface.addHeight < 48
        || parseFloat(toolsPageSurface.rowTitleFont) < 11.5
        || toolsPageSurface.metaWrap.whiteSpace === "nowrap"
        || toolsPageSurface.metaWrap.lineClamp !== "2"
        || toolsPageSurface.metaWrap.textOverflow === "ellipsis"
        || toolsPageSurface.metaWrap.lines > 2
        || (width <= 340 && (
          toolsPageSurface.rowHeight > 72
          || toolsPageSurface.titleWrap.whiteSpace === "nowrap"
          || toolsPageSurface.titleWrap.lineClamp !== "2"
          || toolsPageSurface.titleWrap.textOverflow === "ellipsis"
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
        const modalRect = document.querySelector(".tool-editor-modal")?.getBoundingClientRect();
        const gridRect = document.querySelector(".tool-editor-modal .form-grid")?.getBoundingClientRect();
        const field = document.querySelector(".tool-editor-modal .field");
        const close = document.querySelector(".tool-editor-close");
        const closeRect = close?.getBoundingClientRect();
        const action = footer?.querySelector("button");
        const actionRect = action?.getBoundingClientRect();
        const head = document.querySelector(".tool-editor-head")?.getBoundingClientRect();
        const hero = document.querySelector(".tool-editor-hero")?.getBoundingClientRect();
        const textarea = document.querySelector(".tool-editor-modal textarea")?.getBoundingClientRect();
        const grid = document.querySelector(".tool-editor-modal .form-grid");
        const gridStyle = getComputedStyle(grid);
        const box = (name) => {
          const rect = document.querySelector(`.tool-editor-modal [name="${name}"]`)?.closest(".form-group")?.getBoundingClientRect();
          return rect ? { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) } : null;
        };
        const statusField = document.querySelector('.tool-editor-modal [name="status"]');
        return {
          modal: getComputedStyle(document.querySelector(".tool-editor-modal")).backgroundColor,
          backdrop: getComputedStyle(document.querySelector(".tool-editor-backdrop")).backgroundColor,
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
          modalBottom: modalRect ? Math.round(modalRect.bottom) : 0,
          blankGap: rect && gridRect ? Math.round(rect.top - gridRect.bottom) : 999,
          viewportHeight: window.innerHeight,
          gridColumns: gridStyle.gridTemplateColumns,
          nameBox: box("name"),
          categoryBox: box("category"),
          statusBox: box("status"),
          priceBox: box("price"),
          serialBox: box("serial"),
          noteBox: box("note"),
          statusTag: statusField?.tagName || "",
          statusOptions: [...(statusField?.options || [])].map((option) => option.value),
          statusValue: statusField?.value || ""
        };
      });
      if (toolEditorState.modal !== "rgb(7, 12, 15)"
        || toolEditorState.backdrop !== "rgb(2, 5, 7)"
        || toolEditorState.field !== "rgb(21, 29, 35)"
        || parseFloat(toolEditorState.fieldFont) < 13.5
        || toolEditorState.closeWidth < 44
        || toolEditorState.closeHeight < 44
        || toolEditorState.actionHeight < 48
        || toolEditorState.modalBottom > toolEditorState.viewportHeight + 1
        || toolEditorState.blankGap > 20
        || toolEditorState.statusTag !== "SELECT"
        || toolEditorState.statusOptions.length < 4
        || toolEditorState.statusValue !== "В наличии"
        || (width <= 340 && toolEditorState.gridColumns.split(" ").filter(Boolean).length !== 1)
        || (width > 340 && (
          toolEditorState.gridColumns.split(" ").filter(Boolean).length !== 2
          || !toolEditorState.categoryBox || !toolEditorState.statusBox
          || !toolEditorState.priceBox || !toolEditorState.serialBox
          || Math.abs(toolEditorState.categoryBox.top - toolEditorState.statusBox.top) > 2
          || Math.abs(toolEditorState.priceBox.top - toolEditorState.serialBox.top) > 2
          || Math.abs(toolEditorState.categoryBox.width - toolEditorState.statusBox.width) > 2
          || Math.abs(toolEditorState.priceBox.width - toolEditorState.serialBox.width) > 2
          || !toolEditorState.nameBox || !toolEditorState.noteBox
          || toolEditorState.nameBox.width < toolEditorState.categoryBox.width * 1.9
          || toolEditorState.noteBox.width < toolEditorState.categoryBox.width * 1.9
        ))) {
        report.failures.push({ width, type: "tool-editor-layout", toolEditorState });
      }
      if (toolEditorState.headHeight > 60
        || toolEditorState.heroHeight > 58
        || toolEditorState.fieldHeight > 46
        || (toolEditorState.textareaHeight && toolEditorState.textareaHeight > 82)
        || toolEditorState.rowGap > 7.5) {
        report.failures.push({ width, type: "tool-editor-compact-density", toolEditorState });
      }
      await assertPairedFooter(page, width, ".tool-editor-modal .modal-actions", "tool-editor-actions-two-columns");
      report.results.push(await shot(page, width, "tool-editor", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "receipts" }));
      const receiptsPageSurface = await page.evaluate(() => {
        const add = document.querySelector(".legacy-receipts-page .legacy-service-add-wide");
        const addRect = add?.getBoundingClientRect();
        const pageRect = document.querySelector(".legacy-receipts-page")?.getBoundingClientRect();
        const statGrid = document.querySelector(".receipts-stats");
        const statGridRect = statGrid?.getBoundingClientRect();
        const statRects = [...document.querySelectorAll(".receipts-stats > div")].map((node) => node.getBoundingClientRect());
        const row = document.querySelector(".legacy-document-row.receipt");
        const copyRect = row?.querySelector(":scope > span:nth-child(2)")?.getBoundingClientRect();
        const amountRect = row?.querySelector(":scope > b")?.getBoundingClientRect();
        const chevronRect = row?.querySelector(":scope > .chevron")?.getBoundingClientRect();
        const rowRect = row?.getBoundingClientRect();
        return {
          total: getComputedStyle(document.querySelector(".receipts-stats > .service-stat-primary")).backgroundColor,
          amount: getComputedStyle(document.querySelector(".receipts-stats > div:nth-child(2)")).backgroundColor,
          linkedStat: getComputedStyle(document.querySelector(".receipts-stats > div:nth-child(3)")).backgroundColor,
          statGridWidth: Math.round(statGridRect?.width || 0),
          statRects: statRects.map((rect) => ({ left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) })),
          amountStatFit: (() => {
            const node = document.querySelector(".receipts-stats > div:nth-child(2) strong");
            return { scrollWidth: node?.scrollWidth || 0, clientWidth: node?.clientWidth || 0 };
          })(),
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
          chevronLeft: Math.round(chevronRect?.left || 0),
          titleWrap: (() => {
            const node = row?.querySelector(":scope > span:nth-child(2) > strong");
            const style = node ? getComputedStyle(node) : null;
            return { whiteSpace: style?.whiteSpace || "missing", lineClamp: style?.webkitLineClamp || "missing", textOverflow: style?.textOverflow || "missing" };
          })()
        };
      });
      if (receiptsPageSurface.total !== "rgb(17, 24, 29)"
        || receiptsPageSurface.amount !== "rgb(17, 24, 29)"
        || receiptsPageSurface.linkedStat !== "rgb(17, 24, 29)"
        || receiptsPageSurface.linkedRow !== "rgb(17, 24, 29)"
        || receiptsPageSurface.standaloneRow !== "rgb(17, 24, 29)"
        || receiptsPageSurface.addWidth < receiptsPageSurface.pageWidth - 34
        || receiptsPageSurface.addHeight < 48
        || receiptsPageSurface.statRects.length !== 3
        || receiptsPageSurface.statRects.some((item) => item.width < 80 || item.height < 66 || item.height > 74)
        || receiptsPageSurface.amountStatFit.scrollWidth > receiptsPageSurface.amountStatFit.clientWidth + 1
        || Math.max(...receiptsPageSurface.statRects.map((item) => item.top)) - Math.min(...receiptsPageSurface.statRects.map((item) => item.top)) > 2
        || receiptsPageSurface.statRects[1].left <= receiptsPageSurface.statRects[0].left
        || receiptsPageSurface.statRects[2].left <= receiptsPageSurface.statRects[1].left
        || parseFloat(receiptsPageSurface.rowTitleFont) < 11.5
        || (width <= 340 && (
          receiptsPageSurface.rowHeight > 72
          || receiptsPageSurface.titleWrap.whiteSpace === "nowrap"
          || receiptsPageSurface.titleWrap.lineClamp !== "2"
          || receiptsPageSurface.titleWrap.textOverflow === "ellipsis"
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
      if (receiptsDensity.statHeight > 74
        || receiptsDensity.rowHeight > (width <= 340 ? 72 : 64)) {
        report.failures.push({ width, type: "receipts-compact-density", receiptsDensity });
      }
      await page.locator('[data-action="new-receipt"]').click();
      const receiptEditorState = await page.evaluate(() => {
        const footer = document.querySelector(".receipt-editor-modal .modal-actions");
        const rect = footer?.getBoundingClientRect();
        const modalRect = document.querySelector(".receipt-editor-modal")?.getBoundingClientRect();
        const gridRect = document.querySelector(".receipt-editor-modal .form-grid")?.getBoundingClientRect();
        const field = document.querySelector(".receipt-editor-modal .field");
        const close = document.querySelector(".receipt-editor-close");
        const closeRect = close?.getBoundingClientRect();
        const action = footer?.querySelector("button");
        const actionRect = action?.getBoundingClientRect();
        const head = document.querySelector(".receipt-editor-head")?.getBoundingClientRect();
        const hero = document.querySelector(".receipt-editor-type")?.getBoundingClientRect();
        const textarea = document.querySelector(".receipt-editor-modal textarea")?.getBoundingClientRect();
        const grid = document.querySelector(".receipt-editor-modal .form-grid");
        const gridStyle = getComputedStyle(grid);
        const box = (name) => {
          const rect = document.querySelector(`.receipt-editor-modal [name="${name}"]`)?.closest(".form-group")?.getBoundingClientRect();
          return rect ? { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) } : null;
        };
        return {
          modal: getComputedStyle(document.querySelector(".receipt-editor-modal")).backgroundColor,
          backdrop: getComputedStyle(document.querySelector(".receipt-editor-backdrop")).backgroundColor,
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
          modalBottom: modalRect ? Math.round(modalRect.bottom) : 0,
          blankGap: rect && gridRect ? Math.round(rect.top - gridRect.bottom) : 999,
          viewportHeight: window.innerHeight,
          gridColumns: gridStyle.gridTemplateColumns,
          titleBox: box("title"),
          numberBox: box("number"),
          dateBox: box("date"),
          amountBox: box("amount"),
          orderBox: box("orderId"),
          noteBox: box("note")
        };
      });
      if (receiptEditorState.modal !== "rgb(7, 12, 15)"
        || receiptEditorState.backdrop !== "rgb(2, 5, 7)"
        || receiptEditorState.field !== "rgb(21, 29, 35)"
        || parseFloat(receiptEditorState.fieldFont) < 13.5
        || receiptEditorState.closeWidth < 44
        || receiptEditorState.closeHeight < 44
        || receiptEditorState.actionHeight < 48
        || receiptEditorState.modalBottom > receiptEditorState.viewportHeight + 1
        || receiptEditorState.blankGap > 20
        || (width <= 340 && receiptEditorState.gridColumns.split(" ").filter(Boolean).length !== 1)
        || (width > 340 && (
          receiptEditorState.gridColumns.split(" ").filter(Boolean).length !== 2
          || !receiptEditorState.dateBox || !receiptEditorState.amountBox
          || Math.abs(receiptEditorState.dateBox.top - receiptEditorState.amountBox.top) > 2
          || Math.abs(receiptEditorState.dateBox.width - receiptEditorState.amountBox.width) > 2
          || !receiptEditorState.titleBox || !receiptEditorState.numberBox || !receiptEditorState.orderBox || !receiptEditorState.noteBox
          || receiptEditorState.numberBox.width < receiptEditorState.dateBox.width * 1.9
          || receiptEditorState.orderBox.width < receiptEditorState.dateBox.width * 1.9
          || receiptEditorState.noteBox.width < receiptEditorState.dateBox.width * 1.9
        ))) {
        report.failures.push({ width, type: "receipt-editor-layout", receiptEditorState });
      }
      if (receiptEditorState.headHeight > 60
        || receiptEditorState.heroHeight > 52
        || receiptEditorState.fieldHeight > 46
        || (receiptEditorState.textareaHeight && receiptEditorState.textareaHeight > 82)
        || receiptEditorState.rowGap > 7.5) {
        report.failures.push({ width, type: "receipt-editor-compact-density", receiptEditorState });
      }
      await assertPairedFooter(page, width, ".receipt-editor-modal .modal-actions", "receipt-editor-actions-two-columns");
      report.results.push(await shot(page, width, "receipt-editor", false));
      await page.keyboard.press("Escape");

      if (width === 320 || width === 390) {
        await writeSeed(page, seed);

        await setState(page, uiState({ activePage: "more", moreSection: "prices" }));
        await page.locator(".legacy-price-row.service").first().click();
        await assertCompactDangerFooter(page, width, ".legacy-price-editor-actions", "price-existing-actions-compact");
        report.results.push(await shot(page, width, "price-editor-existing", false));
        await page.keyboard.press("Escape");

        await setState(page, uiState({ activePage: "more", moreSection: "prices" }));
        await page.locator(".legacy-price-row.custom").first().click();
        await assertCompactDangerFooter(page, width, ".legacy-price-editor-actions", "custom-price-existing-actions-compact");
        report.results.push(await shot(page, width, "custom-price-editor-existing", false));
        await page.keyboard.press("Escape");

        await setState(page, uiState({ activePage: "more", moreSection: "goods" }));
        await page.locator('[data-action="edit-goods-sheet"]').click();
        await assertCompactDangerFooter(page, width, ".legacy-goods-savebar", "goods-existing-actions-compact");
        report.results.push(await shot(page, width, "goods-editor-existing", false));
        await page.keyboard.press("Escape");

        await setState(page, uiState({ activePage: "more", moreSection: "tools" }));
        await page.locator('[data-action="edit-tool"]').first().click();
        await assertCompactDangerFooter(page, width, ".tool-editor-modal .modal-actions", "tool-existing-actions-compact");
        report.results.push(await shot(page, width, "tool-editor-existing", false));
        await page.keyboard.press("Escape");

        await setState(page, uiState({ activePage: "more", moreSection: "receipts" }));
        await page.locator('[data-action="edit-receipt"]').first().click();
        await assertCompactDangerFooter(page, width, ".receipt-editor-modal .modal-actions", "receipt-existing-actions-compact");
        report.results.push(await shot(page, width, "receipt-editor-existing", false));
        await page.keyboard.press("Escape");

        await writeSeed(page, seed);
      }

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
        const meta = card?.querySelector(".legacy-draft-copy small");
        const metaLines = [...(meta?.querySelectorAll(":scope > span") || [])];
        const secondMeta = metaLines[1];
        return {
          card: card ? getComputedStyle(card).backgroundColor : "missing",
          note: note ? getComputedStyle(note).backgroundColor : "missing",
          next: next ? getComputedStyle(next).backgroundColor : "missing",
          remove: remove ? getComputedStyle(remove).backgroundColor : "missing",
          cardHeight: cardRect ? Math.round(cardRect.height) : 0,
          noteHeight: noteRect ? Math.round(noteRect.height) : 0,
          nextHeight: nextRect ? Math.round(nextRect.height) : 0,
          removeHeight: removeRect ? Math.round(removeRect.height) : 0,
          noteText: note?.textContent?.trim() || "",
          metaLineCount: metaLines.length,
          metaFirst: metaLines[0]?.textContent?.trim() || "",
          metaSecond: secondMeta?.textContent?.trim() || "",
          metaSecondOverflow: secondMeta ? Math.max(0, secondMeta.scrollWidth - secondMeta.clientWidth) : 999
        };
      });
      if (draftSurface.card !== "rgb(17, 24, 29)"
        || draftSurface.note !== "rgb(21, 29, 35)"
        || draftSurface.next !== "rgb(21, 29, 35)"
        || draftSurface.remove !== "rgb(21, 29, 35)"
        || draftSurface.nextHeight < 44
        || draftSurface.removeHeight < 44
        || draftSurface.noteText !== "Незавершённые заявки — продолжи или удали ненужное."
        || draftSurface.metaLineCount !== 2
        || !draftSurface.metaFirst.includes("Посудомоечная машина")
        || !draftSurface.metaSecond.includes("+79991112233")
        || draftSurface.metaSecondOverflow > 1) {
        report.failures.push({ width, type: "drafts-workflow-hierarchy", draftSurface });
      }
      const draftHeightLimit = width <= 320 ? 132 : 120;
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
        const field = (name) => {
          const rect = document.querySelector(`.settings-profile-card [name="${name}"]`)?.closest("label")?.getBoundingClientRect();
          return rect ? { left: Math.round(rect.left), top: Math.round(rect.top), width: Math.round(rect.width), height: Math.round(rect.height) } : null;
        };
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
          companyName: field("companyName"),
          name: field("name"),
          phone: field("phone"),
          companyAddress: field("companyAddress"),
          inn: field("inn"),
          profileLabelFit: [".settings-company-name > span",".settings-provider-name > span"].map((selector) => {
            const node = document.querySelector(selector);
            return {
              selector,
              scrollWidth: node?.scrollWidth || 0,
              clientWidth: node?.clientWidth || 0
            };
          }),
          profileTextFit: ["companyName","name"].map((name) => {
            const node = document.querySelector(`.settings-profile-card [name="${name}"]`);
            if (!node) return { name, required: 999, available: 0, fontSize: 0 };
            const style = getComputedStyle(node);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
            return {
              name,
              required: Math.ceil(ctx.measureText(node.value || "").width),
              available: Math.floor(node.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0) - 2),
              fontSize: parseFloat(style.fontSize) || 0
            };
          }),
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
          appRowHeights: [...document.querySelectorAll(".settings-app-card .legacy-settings-row")].map((node) => Math.round(node.getBoundingClientRect().height)),
          appActionWidths: [...document.querySelectorAll(".settings-app-card .legacy-settings-row > button:not(.toggle)")].map((node) => Math.round(node.getBoundingClientRect().width)),
          appActionHeights: [...document.querySelectorAll(".settings-app-card .legacy-settings-row > button:not(.toggle)")].map((node) => Math.round(node.getBoundingClientRect().height)),
          appCardHeight: Math.round(document.querySelector(".settings-app-card")?.getBoundingClientRect().height || 0),
          versionSummaryFit: (() => {
            const node = document.querySelector(".settings-app-card .app-version-row small");
            return {
              text: node?.textContent?.trim() || "",
              clientHeight: node?.clientHeight || 0,
              scrollHeight: node?.scrollHeight || 0,
              lineClamp: node ? getComputedStyle(node).webkitLineClamp : "missing"
            };
          })(),
          profileCardHeight: Math.round(document.querySelector(".settings-profile-card")?.getBoundingClientRect().height || 0),
          profileFields: [...document.querySelectorAll(".settings-profile-card .legacy-settings-grid .field")].map((node) => {
            const style = getComputedStyle(node);
            return {
              height: Math.round(node.getBoundingClientRect().height),
              paddingTop: parseFloat(style.paddingTop) || 0,
              paddingBottom: parseFloat(style.paddingBottom) || 0,
              lineHeight: parseFloat(style.lineHeight) || 0
            };
          }),
          linkAlignment: [...document.querySelectorAll(".legacy-settings-links > button")].map((button) => {
            const buttonRect = button.getBoundingClientRect();
            const iconRect = button.querySelector(".settings-link-icon")?.getBoundingClientRect();
            const copyRect = button.querySelector(":scope > span:nth-child(2)")?.getBoundingClientRect();
            const countRect = button.querySelector(":scope > b")?.getBoundingClientRect();
            const chevronRect = button.querySelector(":scope > .chevron")?.getBoundingClientRect();
            const centerY = (rect) => rect ? rect.top + rect.height / 2 : -999;
            const buttonCenter = centerY(buttonRect);
            return {
              iconDelta: Math.round(Math.abs(centerY(iconRect) - buttonCenter) * 10) / 10,
              copyDelta: Math.round(Math.abs(centerY(copyRect) - buttonCenter) * 10) / 10,
              countDelta: Math.round(Math.abs(centerY(countRect) - buttonCenter) * 10) / 10,
              chevronDelta: Math.round(Math.abs(centerY(chevronRect) - buttonCenter) * 10) / 10,
              copyRight: Math.round(copyRect?.right || 0),
              countLeft: Math.round(countRect?.left || 0),
              countRight: Math.round(countRect?.right || 0),
              chevronLeft: Math.round(chevronRect?.left || 0)
            };
          })
        };
      });
      if (settingsSurface.profile !== "rgb(17, 24, 29)"
        || settingsSurface.app !== "rgb(17, 24, 29)"
        || settingsSurface.data !== "rgb(17, 24, 29)"
        || settingsSurface.field !== "rgb(21, 29, 35)"
        || settingsSurface.toolsLink !== "rgb(21, 29, 35)"
        || settingsSurface.backupLink !== "rgb(21, 29, 35)"
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
        || !settingsSurface.companyName
        || !settingsSurface.name
        || !settingsSurface.phone
        || !settingsSurface.companyAddress
        || !settingsSurface.inn
        || (width > 340 && Math.abs(settingsSurface.companyName.top - settingsSurface.name.top) > 2)
        || (width > 340 && settingsSurface.name.left <= settingsSurface.companyName.left)
        || (width <= 340 && settingsSurface.companyName.width < settingsSurface.gridWidth - 2)
        || (width <= 340 && settingsSurface.name.width < settingsSurface.gridWidth - 2)
        || (width <= 340 && settingsSurface.name.top <= settingsSurface.companyName.top)
        || Math.abs(settingsSurface.phone.top - settingsSurface.inn.top) > 2
        || settingsSurface.inn.left <= settingsSurface.phone.left
        || settingsSurface.companyName.width < 120
        || settingsSurface.name.width < 120
        || settingsSurface.phone.width < 120
        || settingsSurface.inn.width < 120
        || settingsSurface.profileLabelFit.length !== 2
        || settingsSurface.profileLabelFit.some((item) => item.scrollWidth > item.clientWidth + 1)
        || settingsSurface.profileTextFit.length !== 2
        || settingsSurface.profileTextFit.some((item) => item.required > item.available + 1 || item.fontSize < 12.5)
        || settingsSurface.companyAddress.width < settingsSurface.gridWidth - 2
        || settingsSurface.companyAddress.top <= settingsSurface.phone.top
        || settingsSurface.longLinkTitle.whiteSpace === "nowrap"
        || settingsSurface.longLinkTitle.lineClamp !== "2"
        || settingsSurface.longLinkTitle.textOverflow === "ellipsis"
        || settingsSurface.longLinkDescription.whiteSpace === "nowrap"
        || settingsSurface.longLinkDescription.lineClamp !== "2"
        || settingsSurface.longLinkHeight < 60
        || settingsSurface.appActionWidths.length !== settingsSurface.appRowWidths.length
        || settingsSurface.appActionWidths.some((value) => value < 78 || value > 90)
        || settingsSurface.appActionHeights.some((value) => value < 44 || value > 45)
        || settingsSurface.appRowHeights.some((value) => value < 50 || value > 64)
        || settingsSurface.appCardHeight > 305
        || !settingsSurface.versionSummaryFit.text
        || settingsSurface.versionSummaryFit.scrollHeight > settingsSurface.versionSummaryFit.clientHeight + 1
        || settingsSurface.versionSummaryFit.lineClamp !== "2"
        || settingsSurface.profileCardHeight > (width <= 340 ? 356 : 322)
        || settingsSurface.profileFields.length !== 5
        || settingsSurface.profileFields.some((item) => item.height !== 44 || item.paddingTop !== 0 || item.paddingBottom !== 0 || item.lineHeight < 41 || item.lineHeight > 43)
        || settingsSurface.linkAlignment.length < 9
        || settingsSurface.linkAlignment.some((item) =>
          item.iconDelta > 1
          || item.copyDelta > 2
          || item.countDelta > 1
          || item.chevronDelta > 1
          || item.countLeft < item.copyRight
          || item.chevronLeft < item.countRight
        )) {
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
      const settingsRowLimit = 64;
      const settingsLinkLimit = width <= 340 ? 70 : 60;
      if (settingsDensity.cardPaddingTop > 10
        || settingsDensity.rowHeight > settingsRowLimit
        || settingsDensity.linkHeight < 54
        || settingsDensity.linkHeight > settingsLinkLimit
        || settingsDensity.iconHeight > 34) {
        report.failures.push({ width, type: "settings-compact-density", settingsDensity, settingsRowLimit, settingsLinkLimit });
      }

      const settingsReleaseText = await page.evaluate(() => ({
        version: document.querySelector(".settings-app-card .app-version-row strong")?.textContent?.trim() || "",
        subtitle: document.querySelector(".settings-app-card .app-version-row small")?.textContent?.trim() || ""
      }));
      await page.locator('.settings-app-card .app-version-row [data-action="release-notes"]').click();
      await page.waitForTimeout(40);
      const currentReleaseText = await page.evaluate(() => ({
        version: document.querySelector(".release-current strong")?.textContent?.trim() || "",
        noteVersion: document.querySelector(".release-note.current > div > strong")?.textContent?.trim() || "",
        noteTitle: document.querySelector(".release-note.current h3")?.textContent?.trim() || ""
      }));
      if (settingsReleaseText.version !== `Версия ${currentReleaseText.version}`
        || currentReleaseText.noteVersion !== currentReleaseText.version
        || settingsReleaseText.subtitle !== currentReleaseText.noteTitle) {
        report.failures.push({ width, type: "settings-release-sync", settingsReleaseText, currentReleaseText });
      }
      await page.locator(".release-notes-head [data-close-modal]").click();

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
        mainGap: Number.parseFloat(getComputedStyle(document.querySelector(".legacy-backup-main-actions")).columnGap || "0") || 0,
        mainButtonWidths: [...document.querySelectorAll(".legacy-backup-main-actions > button")].map((node) => Math.round(node.getBoundingClientRect().width)),
        mainButtonHeights: [...document.querySelectorAll(".legacy-backup-main-actions > button")].map((node) => Math.round(node.getBoundingClientRect().height)),
        primaryCardHeight: Math.round(document.querySelector(".backup-primary-card")?.getBoundingClientRect().height || 0),
        advancedTag: document.querySelector(".legacy-backup-advanced")?.tagName || "",
        advancedOpen: Boolean(document.querySelector(".legacy-backup-advanced")?.open),
        advancedSummaryHeight: Math.round(document.querySelector(".legacy-backup-advanced > summary")?.getBoundingClientRect().height || 0),
        advancedGridDisplay: getComputedStyle(document.querySelector(".legacy-backup-grid")).display,
        advancedButtons: document.querySelectorAll(".legacy-backup-grid > button").length
      }));
      if (backupSurface.primary !== "rgb(17, 24, 29)"
        || backupSurface.auto !== "rgb(17, 24, 29)"
        || backupSurface.orders !== "rgb(17, 24, 29)"
        || backupSurface.warehouse !== "rgb(17, 24, 29)"
        || backupSurface.price !== "rgb(17, 24, 29)"
        || backupSurface.download !== "rgb(255, 113, 79)"
        || backupSurface.importButton !== "rgb(21, 29, 35)"
        || backupSurface.mainButtonWidths.length !== 2
        || backupSurface.mainButtonWidths.some((value) => value < Math.floor((backupSurface.mainWidth - backupSurface.mainGap) / 2) - 2 || value > Math.ceil((backupSurface.mainWidth - backupSurface.mainGap) / 2) + 2)
        || backupSurface.mainButtonHeights.some((value) => value < 48 || value > 49)
        || backupSurface.primaryCardHeight > 190
        || backupSurface.advancedTag !== "DETAILS"
        || backupSurface.advancedOpen
        || backupSurface.advancedSummaryHeight < 44
        || backupSurface.advancedSummaryHeight > 52
        || backupSurface.advancedGridDisplay !== "none"
        || backupSurface.advancedButtons !== 7) {
        report.failures.push({ width, type: "backup-semantic-hierarchy", backupSurface });
      }

      await page.locator(".legacy-backup-advanced > summary").click();
      const backupAdvancedOpen = await page.evaluate(() => {
        const details = document.querySelector(".legacy-backup-advanced");
        const grid = document.querySelector(".legacy-backup-grid");
        const gridRect = grid?.getBoundingClientRect();
        return {
          open: Boolean(details?.open),
          gridDisplay: grid ? getComputedStyle(grid).display : "missing",
          gridWidth: Math.round(gridRect?.width || 0),
          gridInnerWidth: grid ? Math.round(grid.clientWidth - (parseFloat(getComputedStyle(grid).paddingLeft) || 0) - (parseFloat(getComputedStyle(grid).paddingRight) || 0)) : 0,
          gridGap: grid ? (parseFloat(getComputedStyle(grid).columnGap) || 0) : 0,
          buttonWidths: [...document.querySelectorAll(".legacy-backup-grid > button")].map((node) => Math.round(node.getBoundingClientRect().width)),
          buttonHeights: [...document.querySelectorAll(".legacy-backup-grid > button")].map((node) => Math.round(node.getBoundingClientRect().height))
        };
      });
      const backupAdvancedColumnWidth = (backupAdvancedOpen.gridInnerWidth - backupAdvancedOpen.gridGap) / 2;
      if (!backupAdvancedOpen.open
        || backupAdvancedOpen.gridDisplay === "none"
        || backupAdvancedOpen.buttonWidths.length !== 7
        || backupAdvancedOpen.buttonWidths.slice(0, 6).some((value) => value < Math.floor(backupAdvancedColumnWidth) - 2 || value > Math.ceil(backupAdvancedColumnWidth) + 2)
        || backupAdvancedOpen.buttonWidths[6] < backupAdvancedOpen.gridInnerWidth - 2
        || backupAdvancedOpen.buttonHeights.slice(0, 6).some((value) => value < 48)
        || backupAdvancedOpen.buttonHeights[6] < 44) {
        report.failures.push({ width, type: "backup-advanced-open", backupAdvancedOpen, backupAdvancedColumnWidth });
      }
      await shot(page, width, "backup-advanced");
      await page.locator(".legacy-backup-advanced > summary").click();
      const backupDensity = await page.evaluate(() => {
        const card = document.querySelector(".legacy-backup-page .backup-primary-card");
        const stat = document.querySelector(".legacy-service-stats.backup > div");
        const mainButton = document.querySelector(".legacy-backup-main-actions > button");
        const cardStyle = card ? getComputedStyle(card) : null;
        const px = (value) => Number.parseFloat(value || "0") || 0;
        const autoCard = document.querySelector(".backup-auto-card");
        const autoRows = [...document.querySelectorAll(".backup-auto-card .legacy-settings-row.plain")];
        const autoToggle = document.querySelector('.backup-auto-card [data-action="toggle-auto"]');
        const periodSelect = document.querySelector(".backup-auto-card #backup-days");
        return {
          cardPaddingTop: cardStyle ? px(cardStyle.paddingTop) : 999,
          statHeight: Math.round(stat?.getBoundingClientRect().height || 0),
          mainButtonHeight: Math.round(mainButton?.getBoundingClientRect().height || 0),
          autoCardHeight: Math.round(autoCard?.getBoundingClientRect().height || 0),
          autoRowHeights: autoRows.map((node) => Math.round(node.getBoundingClientRect().height)),
          autoToggleWidth: Math.round(autoToggle?.getBoundingClientRect().width || 0),
          periodSelectWidth: Math.round(periodSelect?.getBoundingClientRect().width || 0),
          periodSelectHeight: Math.round(periodSelect?.getBoundingClientRect().height || 0)
        };
      });
      if (backupDensity.cardPaddingTop > 10
        || backupDensity.statHeight > 62
        || backupDensity.mainButtonHeight < 48
        || (width <= 340 && (
          backupDensity.autoCardHeight > 325
          || backupDensity.autoToggleWidth < 50
          || backupDensity.autoToggleWidth > 54
          || backupDensity.periodSelectWidth < 108
          || backupDensity.periodSelectWidth > 116
          || backupDensity.periodSelectHeight < 44
          || backupDensity.autoRowHeights.some((value) => value > 72)
        ))) {
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
      const diagnosticsDensity = await page.evaluate(() => {
        const modal = document.querySelector(".diagnostics-modal");
        const title = modal?.querySelector(":scope > h2");
        const list = modal?.querySelector(".goods-list");
        const row = modal?.querySelector(".goods-sheet");
        const footer = modal?.querySelector(".modal-actions");
        const action = footer?.querySelector("button");
        const status = row?.querySelector(".diagnostics-status");
        const statusIcon = status?.querySelector(".ui-icon");
        const copy = row?.querySelector(".diagnostics-copy");
        const buttons = [...(footer?.querySelectorAll("button") || [])];
        const px = (value) => Number.parseFloat(value || "0") || 0;
        const rect = (node) => node?.getBoundingClientRect();
        const rowRect = rect(row);
        const statusRect = rect(status);
        const copyRect = rect(copy);
        return {
          paddingTop: modal ? px(getComputedStyle(modal).paddingTop) : 999,
          titleMarginBottom: title ? px(getComputedStyle(title).marginBottom) : 999,
          listGap: list ? px(getComputedStyle(list).rowGap || getComputedStyle(list).gap) : 999,
          rowHeight: Math.round(rowRect?.height || 0),
          footerPaddingTop: footer ? px(getComputedStyle(footer).paddingTop) : 999,
          actionHeight: Math.round(action?.getBoundingClientRect().height || 0),
          statusWidth: Math.round(statusRect?.width || 0),
          statusHeight: Math.round(statusRect?.height || 0),
          statusCenterDelta: rowRect && statusRect ? Math.abs((statusRect.top + statusRect.height / 2) - (rowRect.top + rowRect.height / 2)) : 999,
          copyCenterDelta: rowRect && copyRect ? Math.abs((copyRect.top + copyRect.height / 2) - (rowRect.top + rowRect.height / 2)) : 999,
          statusIconWidth: Math.round(statusIcon?.getBoundingClientRect().width || 0),
          actionOverflows: buttons.map((button) => button.scrollWidth > button.clientWidth + 1),
          actionIconWidths: buttons.map((button) => Math.round(button.querySelector(".ui-icon")?.getBoundingClientRect().width || 0))
        };
      });
      if (diagnosticsDensity.paddingTop > 10
        || diagnosticsDensity.titleMarginBottom > 8
        || diagnosticsDensity.listGap > 5.5
        || diagnosticsDensity.rowHeight < 46
        || diagnosticsDensity.rowHeight > 50
        || diagnosticsDensity.footerPaddingTop > 8
        || diagnosticsDensity.actionHeight < 44
        || diagnosticsDensity.statusWidth < 30
        || diagnosticsDensity.statusHeight < 30
        || diagnosticsDensity.statusCenterDelta > 1
        || diagnosticsDensity.copyCenterDelta > 2
        || diagnosticsDensity.statusIconWidth < 15
        || diagnosticsDensity.actionOverflows.some(Boolean)
        || diagnosticsDensity.actionIconWidths.some((value) => value < 13)) {
        report.failures.push({ width, type: "diagnostics-compact-density", diagnosticsDensity });
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
      const confirmDensity = await page.evaluate(() => {
        const modal = document.querySelector(".crm-confirm-modal");
        const icon = modal?.querySelector(".crm-confirm-icon");
        const paragraph = modal?.querySelector("p");
        const actions = modal?.querySelector(".crm-confirm-actions");
        const cancel = actions?.querySelector("[data-confirm-cancel]");
        const px = (value) => Number.parseFloat(value || "0") || 0;
        const iconStyle = icon ? getComputedStyle(icon) : null;
        const paragraphStyle = paragraph ? getComputedStyle(paragraph) : null;
        return {
          paddingTop: modal ? px(getComputedStyle(modal).paddingTop) : 999,
          iconHeight: Math.round(icon?.getBoundingClientRect().height || 0),
          iconMarginBottom: iconStyle ? px(iconStyle.marginBottom) : 999,
          paragraphMarginTop: paragraphStyle ? px(paragraphStyle.marginTop) : 999,
          paragraphMarginBottom: paragraphStyle ? px(paragraphStyle.marginBottom) : 999,
          actionsGap: actions ? px(getComputedStyle(actions).columnGap || getComputedStyle(actions).gap) : 999,
          cancelHeight: Math.round(cancel?.getBoundingClientRect().height || 0)
        };
      });
      if (confirmDensity.paddingTop > 14
        || confirmDensity.iconHeight > 42
        || confirmDensity.iconMarginBottom > 9
        || confirmDensity.paragraphMarginTop > 7
        || confirmDensity.paragraphMarginBottom > 12
        || confirmDensity.actionsGap > 6.5
        || confirmDensity.cancelHeight < 48) {
        report.failures.push({ width, type: "confirm-dialog-compact-density", confirmDensity });
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
              const deviceTitle = document.querySelector(".legacy-order-device-copy > strong");
              const model = document.querySelector(".legacy-order-device small");
              const address = document.querySelector(".legacy-order-meta .address");
              const ns = name ? getComputedStyle(name) : null;
              const ds = deviceTitle ? getComputedStyle(deviceTitle) : null;
              const ms = model ? getComputedStyle(model) : null;
              const as = address ? getComputedStyle(address) : null;
              return {
                nameWhiteSpace: ns?.whiteSpace || "missing",
                nameLineClamp: ns?.webkitLineClamp || "missing",
                nameTextOverflow: ns?.textOverflow || "missing",
                deviceTitleWhiteSpace: ds?.whiteSpace || "missing",
                deviceTitleLineClamp: ds?.webkitLineClamp || "missing",
                deviceTitleTextOverflow: ds?.textOverflow || "missing",
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
              || orderTextState.modelWhiteSpace !== "nowrap"
              || orderTextState.modelTextOverflow !== "ellipsis"
              || orderTextState.addressWhiteSpace === "missing"
              || orderTextState.addressHeight < 10
              || orderTextState.addressHeight > 36) {
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
            const priceLongTitle = await page.evaluate(() => {
              const row = document.querySelector(".legacy-price-row.service");
              const title = row?.querySelector("strong");
              const style = title ? getComputedStyle(title) : null;
              return {
                lineClamp: style?.webkitLineClamp || "missing",
                whiteSpace: style?.whiteSpace || "missing",
                textOverflow: style?.textOverflow || "missing",
                rowHeight: Math.round(row?.getBoundingClientRect().height || 0)
              };
            });
            if (priceLongTitle.lineClamp !== "3"
              || priceLongTitle.whiteSpace === "nowrap"
              || priceLongTitle.textOverflow === "ellipsis"
              || priceLongTitle.rowHeight > 84) {
              report.failures.push({ width, type: "stress-price-long-title", priceLongTitle });
            }
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
          ["empty-movements", uiState({ activePage: "warehouse", warehouseSection: "movements", warehouseMovementFilter: "all" })],
          ["empty-shopping", uiState({ activePage: "warehouse", warehouseSection: "shopping" })],
          ["empty-clients", uiState({ activePage: "more", moreSection: "clients" })],
          ["empty-goods", uiState({ activePage: "more", moreSection: "goods" })],
          ["empty-tools", uiState({ activePage: "more", moreSection: "tools" })],
          ["empty-receipts", uiState({ activePage: "more", moreSection: "receipts" })],
          ["empty-drafts", uiState({ activePage: "more", moreSection: "drafts" })]
        ]) {
          await setState(page, emptyState);
          if (emptyLabel === "empty-drafts") {
            const draftEmptyState = await page.evaluate(() => {
              const root = document.querySelector(".legacy-draft-empty");
              const icon = root?.querySelector(".legacy-draft-empty-icon");
              const title = root?.querySelector("strong");
              const copy = root?.querySelector("small");
              const copyStyle = copy ? getComputedStyle(copy) : null;
              const lineHeight = copyStyle ? parseFloat(copyStyle.lineHeight) || 0 : 0;
              return {
                height: Math.round(root?.getBoundingClientRect().height || 0),
                iconWidth: Math.round(icon?.getBoundingClientRect().width || 0),
                iconHeight: Math.round(icon?.getBoundingClientRect().height || 0),
                title: title?.textContent?.trim() || "",
                copyLines: copy && lineHeight > 0 ? Math.round(copy.getBoundingClientRect().height / lineHeight) : 0
              };
            });
            if (draftEmptyState.height < 100
              || draftEmptyState.height > 120
              || draftEmptyState.iconWidth !== 36
              || draftEmptyState.iconHeight !== 36
              || draftEmptyState.title !== "Черновиков пока нет"
              || draftEmptyState.copyLines > 2) {
              report.failures.push({ width, type: "empty-drafts-layout", draftEmptyState });
            }
          }
          if (emptyLabel === "empty-receipts") {
            const receiptEmptyState = await page.evaluate(() => {
              const root = document.querySelector(".legacy-receipt-empty");
              const icon = root?.querySelector(".legacy-receipt-empty-icon");
              const title = root?.querySelector("strong");
              const copy = root?.querySelector("small");
              const copyStyle = copy ? getComputedStyle(copy) : null;
              const lineHeight = copyStyle ? parseFloat(copyStyle.lineHeight) || 0 : 0;
              return {
                height: Math.round(root?.getBoundingClientRect().height || 0),
                iconWidth: Math.round(icon?.getBoundingClientRect().width || 0),
                iconHeight: Math.round(icon?.getBoundingClientRect().height || 0),
                title: title?.textContent?.trim() || "",
                copyLines: copy && lineHeight > 0 ? Math.round(copy.getBoundingClientRect().height / lineHeight) : 0
              };
            });
            if (receiptEmptyState.height < 100
              || receiptEmptyState.height > 120
              || receiptEmptyState.iconWidth !== 36
              || receiptEmptyState.iconHeight !== 36
              || receiptEmptyState.title !== "Документов пока нет"
              || receiptEmptyState.copyLines > 2) {
              report.failures.push({ width, type: "empty-receipts-layout", receiptEmptyState });
            }
          }
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
          if (emptyLabel === "empty-shopping") {
            const disabledShoppingActions = await page.evaluate(() => {
              const buttons = [...document.querySelectorAll(".shopping-page-actions-primary > button:disabled")];
              return buttons.map((node) => {
                const style = getComputedStyle(node);
                const icon = node.querySelector(".ui-icon");
                return {
                  background: style.backgroundColor,
                  color: style.color,
                  opacity: parseFloat(style.opacity) || 0,
                  iconColor: icon ? getComputedStyle(icon).color : "missing"
                };
              });
            });
            if (disabledShoppingActions.length !== 2
              || disabledShoppingActions.some((item) =>
                item.background !== "rgb(13, 20, 25)"
                || item.color !== "rgb(111, 123, 131)"
                || item.opacity < 0.99
                || item.iconColor !== "rgb(102, 114, 122)"
              )) {
              report.failures.push({ width, type: "empty-shopping-disabled-actions", disabledShoppingActions });
            }
          }
          if (emptyLabel === "empty-movements" || emptyLabel === "empty-shopping") {
            const supportEmptyState = await page.evaluate((label) => {
              const root = label === "empty-movements"
                ? document.querySelector(".warehouse-support-empty")
                : document.querySelector(".shopping-empty-state");
              const icon = root?.querySelector(".empty-icon");
              const title = root?.querySelector("h2");
              const copy = root?.querySelector("p");
              const copyStyle = copy ? getComputedStyle(copy) : null;
              const copyLineHeight = copyStyle ? parseFloat(copyStyle.lineHeight) || 0 : 0;
              return {
                height: Math.round(root?.getBoundingClientRect().height || 0),
                iconWidth: Math.round(icon?.getBoundingClientRect().width || 0),
                iconHeight: Math.round(icon?.getBoundingClientRect().height || 0),
                titleFont: title ? parseFloat(getComputedStyle(title).fontSize) || 0 : 0,
                copyLines: copy && copyLineHeight > 0 ? Math.round(copy.getBoundingClientRect().height / copyLineHeight) : 0
              };
            }, emptyLabel);
            const heightLimit = emptyLabel === "empty-movements" ? 120 : 145;
            const minHeight = emptyLabel === "empty-movements" ? 100 : 118;
            const maxCopyLines = emptyLabel === "empty-movements" ? 2 : 4;
            if (supportEmptyState.height < minHeight
              || supportEmptyState.height > heightLimit
              || supportEmptyState.iconWidth !== 36
              || supportEmptyState.iconHeight !== 36
              || supportEmptyState.titleFont < 12.5
              || supportEmptyState.copyLines > maxCopyLines) {
              report.failures.push({ width, type: `${emptyLabel}-layout`, supportEmptyState, heightLimit });
            }
          }
          if (emptyLabel === "empty-orders") {
            const ordersEmptyState = await page.evaluate(() => {
              const root = document.querySelector(".orders-empty-state");
              const icon = root?.querySelector(".empty-icon");
              const title = root?.querySelector("h2");
              const actions = root?.querySelector(".empty-actions");
              const actionButtons = [...(actions?.querySelectorAll("button") || [])];
              return {
                height: Math.round(root?.getBoundingClientRect().height || 0),
                iconWidth: Math.round(icon?.getBoundingClientRect().width || 0),
                iconHeight: Math.round(icon?.getBoundingClientRect().height || 0),
                titleFont: title ? parseFloat(getComputedStyle(title).fontSize) || 0 : 0,
                actionDisplay: actions ? getComputedStyle(actions).display : "missing",
                actionColumns: actions ? getComputedStyle(actions).gridTemplateColumns : "missing",
                actionHeights: actionButtons.map((node) => Math.round(node.getBoundingClientRect().height))
              };
            });
            const ordersEmptyHeightLimit = width <= 340 ? 185 : 175;
            if (ordersEmptyState.height < 145
              || ordersEmptyState.height > ordersEmptyHeightLimit
              || ordersEmptyState.iconWidth !== 36
              || ordersEmptyState.iconHeight !== 36
              || ordersEmptyState.titleFont < 13.5
              || ordersEmptyState.actionDisplay !== "grid"
              || ordersEmptyState.actionHeights.length !== 2
              || ordersEmptyState.actionHeights.some((value) => value < 44 || value > 48)
              || !ordersEmptyState.actionColumns.includes("px")) {
              report.failures.push({ width, type: "empty-orders-layout", ordersEmptyState, ordersEmptyHeightLimit });
            }
          }
          if (emptyLabel === "empty-warehouse") {
            const warehouseEmptyState = await page.evaluate(() => {
              const root = document.querySelector(".warehouse-list-empty");
              const icon = root?.querySelector(".empty-icon");
              const title = root?.querySelector("h2");
              const copy = root?.querySelector("p");
              const copyStyle = copy ? getComputedStyle(copy) : null;
              const copyLineHeight = copyStyle ? parseFloat(copyStyle.lineHeight) || 0 : 0;
              return {
                height: Math.round(root?.getBoundingClientRect().height || 0),
                iconWidth: Math.round(icon?.getBoundingClientRect().width || 0),
                iconHeight: Math.round(icon?.getBoundingClientRect().height || 0),
                title: title?.textContent?.trim() || "",
                titleFont: title ? parseFloat(getComputedStyle(title).fontSize) || 0 : 0,
                copyLines: copy && copyLineHeight > 0 ? Math.round(copy.getBoundingClientRect().height / copyLineHeight) : 0
              };
            });
            if (warehouseEmptyState.height < 100
              || warehouseEmptyState.height > 120
              || warehouseEmptyState.iconWidth !== 36
              || warehouseEmptyState.iconHeight !== 36
              || warehouseEmptyState.title !== "Ничего не найдено"
              || warehouseEmptyState.titleFont < 12.5
              || warehouseEmptyState.copyLines > 2) {
              report.failures.push({ width, type: "empty-warehouse-layout", warehouseEmptyState });
            }
          }
          if (emptyLabel === "empty-clients") {
            const clientEmptyState = await page.evaluate(() => {
              const root = document.querySelector(".legacy-client-empty");
              const icon = root?.querySelector(".legacy-client-empty-icon");
              const title = root?.querySelector("strong");
              const copy = root?.querySelector("small");
              const copyStyle = copy ? getComputedStyle(copy) : null;
              const copyLineHeight = copyStyle ? parseFloat(copyStyle.lineHeight) || 0 : 0;
              return {
                height: Math.round(root?.getBoundingClientRect().height || 0),
                iconWidth: Math.round(icon?.getBoundingClientRect().width || 0),
                iconHeight: Math.round(icon?.getBoundingClientRect().height || 0),
                title: title?.textContent?.trim() || "",
                titleFont: title ? parseFloat(getComputedStyle(title).fontSize) || 0 : 0,
                copyLines: copy && copyLineHeight > 0 ? Math.round(copy.getBoundingClientRect().height / copyLineHeight) : 0
              };
            });
            if (clientEmptyState.height < 100
              || clientEmptyState.height > 124
              || clientEmptyState.iconWidth !== 36
              || clientEmptyState.iconHeight !== 36
              || clientEmptyState.title !== "Клиентов пока нет"
              || clientEmptyState.titleFont < 12.5
              || clientEmptyState.copyLines > 2) {
              report.failures.push({ width, type: "empty-client-layout", clientEmptyState });
            }
          }
          if (emptyLabel === "empty-goods") {
            const goodsEmptyState = await page.evaluate(() => {
              const root = document.querySelector(".legacy-goods-empty");
              const icon = root?.querySelector(".legacy-goods-empty-icon");
              const title = root?.querySelector("strong");
              const copy = root?.querySelector("small");
              const copyStyle = copy ? getComputedStyle(copy) : null;
              const copyLineHeight = copyStyle ? parseFloat(copyStyle.lineHeight) || 0 : 0;
              return {
                height: Math.round(root?.getBoundingClientRect().height || 0),
                iconWidth: Math.round(icon?.getBoundingClientRect().width || 0),
                iconHeight: Math.round(icon?.getBoundingClientRect().height || 0),
                title: title?.textContent?.trim() || "",
                titleFont: title ? parseFloat(getComputedStyle(title).fontSize) || 0 : 0,
                copyLines: copy && copyLineHeight > 0 ? Math.round(copy.getBoundingClientRect().height / copyLineHeight) : 0
              };
            });
            if (goodsEmptyState.height < 100
              || goodsEmptyState.height > 124
              || goodsEmptyState.iconWidth !== 36
              || goodsEmptyState.iconHeight !== 36
              || goodsEmptyState.title !== "Товарников пока нет"
              || goodsEmptyState.titleFont < 12.5
              || goodsEmptyState.copyLines > 2) {
              report.failures.push({ width, type: "empty-goods-layout", goodsEmptyState });
            }
          if (emptyLabel === "empty-tools") {
            const toolsEmptyState = await page.evaluate(() => {
              const root = document.querySelector(".legacy-tool-empty");
              const icon = root?.querySelector(".legacy-tool-empty-icon");
              const title = root?.querySelector("strong");
              const copy = root?.querySelector("small");
              const copyStyle = copy ? getComputedStyle(copy) : null;
              const copyLineHeight = copyStyle ? parseFloat(copyStyle.lineHeight) || 0 : 0;
              return {
                height: Math.round(root?.getBoundingClientRect().height || 0),
                iconWidth: Math.round(icon?.getBoundingClientRect().width || 0),
                iconHeight: Math.round(icon?.getBoundingClientRect().height || 0),
                title: title?.textContent?.trim() || "",
                copyLines: copy && copyLineHeight > 0 ? Math.round(copy.getBoundingClientRect().height / copyLineHeight) : 0
              };
            });
            if (toolsEmptyState.height < 100
              || toolsEmptyState.height > 120
              || toolsEmptyState.iconWidth !== 36
              || toolsEmptyState.iconHeight !== 36
              || toolsEmptyState.title !== "Инструментов пока нет"
              || toolsEmptyState.copyLines > 2) {
              report.failures.push({ width, type: "empty-tools-layout", toolsEmptyState });
            }
          }
          }
          const emptyResult = await shot(page, width, emptyLabel, true);
          report.results.push(emptyResult);
          if (emptyResult.overflow > 2) report.failures.push({ width, type: "empty-horizontal-overflow", label: emptyLabel, overflow: emptyResult.overflow });
        }

        await page.evaluate(() => {
          const toast = document.querySelector("#toast");
          toast.textContent = "Изменения сохранены";
          toast.classList.add("show");
        });
        await page.waitForTimeout(220);
        const toastFeedback = await page.evaluate(() => {
          const toast = document.querySelector("#toast");
          const style = getComputedStyle(toast);
          const rect = toast.getBoundingClientRect();
          const nav = document.querySelector(".bottom-nav")?.getBoundingClientRect();
          return {
            background: style.backgroundColor,
            radius: style.borderRadius,
            opacity: parseFloat(style.opacity) || 0,
            bottom: Math.round(rect.bottom),
            navTop: nav ? Math.round(nav.top) : 0
          };
        });
        if (toastFeedback.background !== "rgb(10, 17, 22)"
          || parseFloat(toastFeedback.radius) < 12
          || toastFeedback.opacity < 0.95
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
    const actions = node.closest(".modal-actions");
    const actionsRect = actions?.getBoundingClientRect();
    const actionsStyle = actions ? getComputedStyle(actions) : null;
    const paddingLeft = actionsStyle ? (parseFloat(actionsStyle.paddingLeft) || 0) : 0;
    const paddingRight = actionsStyle ? (parseFloat(actionsStyle.paddingRight) || 0) : 0;
    const actionButtons = actions ? [...actions.querySelectorAll(":scope > button")].map((button) => {
      const buttonRect = button.getBoundingClientRect();
      return {
        width: Math.round(buttonRect.width),
        height: Math.round(buttonRect.height),
        left: Math.round(buttonRect.left),
        top: Math.round(buttonRect.top)
      };
    }) : [];
    return {
      top: Math.round(rect.top),
      bottom: Math.round(rect.bottom),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
      viewportHeight: window.innerHeight,
      locked: document.body.classList.contains("modal-open"),
      bodyFixed: getComputedStyle(document.body).position === "fixed",
      actionsInnerLeft: actionsRect ? Math.round(actionsRect.left + paddingLeft) : 0,
      actionsInnerWidth: actionsRect ? Math.round(actionsRect.width - paddingLeft - paddingRight) : 0,
      actionButtons
    };
  });
  const keyboardReachable = keyboardMetrics.height >= 44
    && keyboardMetrics.top >= 0
    && keyboardMetrics.bottom <= keyboardMetrics.viewportHeight + 1
    && keyboardMetrics.locked
    && keyboardMetrics.bodyFixed;
  const orderEditorActionsPaired = keyboardMetrics.actionButtons.length === 2
    && keyboardMetrics.actionButtons.every((button) => button.width >= 100 && button.height >= 48 && button.height <= 49)
    && Math.abs((keyboardMetrics.actionButtons[0]?.top || 0) - (keyboardMetrics.actionButtons[1]?.top || 0)) <= 2
    && (keyboardMetrics.actionButtons[1]?.left || 0) > (keyboardMetrics.actionButtons[0]?.left || 0)
    && Math.abs((keyboardMetrics.actionButtons[0]?.left || 0) - keyboardMetrics.actionsInnerLeft) <= 2
    && (keyboardMetrics.actionButtons[0]?.width || 0) + (keyboardMetrics.actionButtons[1]?.width || 0) <= keyboardMetrics.actionsInnerWidth;
  if (!keyboardReachable) report.failures.push({ type: "keyboard-height-order-editor", keyboardMetrics });
  if (!orderEditorActionsPaired) report.failures.push({ type: "order-editor-actions-two-columns", keyboardMetrics });
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
    const actionsCompact = metrics.actionButtons.length === 2
      && metrics.actionButtons.every((button) => button.width >= 96 && button.height >= 44)
      && Math.abs((metrics.actionButtons[0]?.top || 0) - (metrics.actionButtons[1]?.top || 0)) <= 2
      && metrics.actionButtons.reduce((sum, button) => sum + button.width, 0) <= metrics.actionsInnerWidth
      && metrics.actionsInnerWidth - metrics.actionButtons.reduce((sum, button) => sum + button.width, 0) <= 10;
    const reachable = metrics.height >= 44
      && metrics.top >= 0
      && metrics.bottom <= metrics.viewportHeight + 1
      && metrics.backdropCount === 1
      && metrics.locked
      && metrics.bodyFixed
      && actionsCompact;
    if (!reachable) report.failures.push({ type: "keyboard-height-editor", label: editorCase.label, metrics, actionsCompact });
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
  await utilityPage.locator(".legacy-backup-advanced > summary").click();
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

  const legacyV18 = structuredClone(seed);
  legacyV18.date = "2026-09-10T19:33:48.333Z";
  legacyV18.orders = legacyV18.orders.map((order, index) => ({
    ...order,
    status: index === 2 ? "Отказ" : "Закрыта",
    completed: order.completed || "2026-09-10T18:00:00.000Z"
  }));
  legacyV18.orders[0].materials = [
    ...(legacyV18.orders[0].materials || []),
    {
      id: "legacy-detached-material",
      warehouseId: "legacy-removed-stock",
      name: "Исторический материал",
      qty: "1",
      unit: "шт.",
      unitCost: 123,
      writeOff: false
    }
  ];
  [
    "goods_sheets", "order_sources", "client_profiles", "appliance_types",
    "price_categories", "stock_categories", "warranty_options", "warranty_results",
    "shopping_manual", "shopping_overrides", "storage_locations"
  ].forEach((key) => delete legacyV18[key]);
  legacyV18.settings = {
    name: "Тестовый мастер",
    inn: "",
    phone: "+70000000000",
    autoBackup: false,
    autoPriceAdjust: true,
    companyName: "CRM by Romanychev",
    companyAddress: "",
    receiptShowCompany: true,
    receiptShowExecutor: true,
    receiptShowStamp: false,
    receiptShowSignature: false,
    autoBackupDays: 7
  };

  await writeSeed(utilityPage, seed);
  await setState(utilityPage, uiState({ activePage: "more", moreSection: "backup" }));
  await utilityPage.locator("#backup-file").setInputFiles({
    name: "CRM_BT_backup_v18_legacy.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(legacyV18))
  });
  await utilityPage.locator("[data-confirm-primary]").waitFor({ state: "visible", timeout: 5000 });
  const legacyImportPrompt = (await utilityPage.locator(".crm-confirm-modal").innerText()).trim();
  await utilityPage.locator("[data-confirm-primary]").click();
  await utilityPage.locator("#toast.show").waitFor({ state: "visible", timeout: 5000 });
  const legacyImportToast = (await utilityPage.locator("#toast").innerText()).trim();
  const legacyStored = await readStoredData(utilityPage);
  const legacyRollback = await readIdbKey(utilityPage, "crm-pre-import-data");
  const detachedMaterial = legacyStored.orders
    ?.flatMap((order) => Array.isArray(order.materials) ? order.materials : [])
    .find((material) => material.id === "legacy-detached-material");
  const migratedWarehouse = Array.isArray(legacyStored.warehouse) ? legacyStored.warehouse : [];
  const batchModelOk = migratedWarehouse.every((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const batches = Array.isArray(item.batches) ? item.batches : [];
    const batchQty = batches.reduce((sum, batch) => sum + Math.max(0, Number(batch.remainingQty) || 0), 0);
    return qty <= 1e-9 ? batches.length === 0 : Math.abs(batchQty - qty) <= 1e-7;
  });
  const locationModelOk = migratedWarehouse.every((item) => {
    const qty = Math.max(0, Number(item.quantity) || 0);
    const balances = Array.isArray(item.locationBalances) ? item.locationBalances : [];
    const locationQty = balances.reduce((sum, entry) => sum + Math.max(0, Number(entry.qty) || 0), 0);
    return Math.abs(locationQty - qty) <= 1e-7;
  });
  const legacyV18ImportOk = /Бэкап успешно восстановлен/i.test(legacyImportToast)
    && legacyImportPrompt.includes(String(legacyV18.orders.length))
    && legacyStored.version === 18
    && legacyStored.orders?.length === legacyV18.orders.length
    && legacyStored.warehouse?.length === legacyV18.warehouse.length
    && legacyStored.receipt_prices?.length === legacyV18.receipt_prices.length
    && legacyStored.settings?.stockReservationModel === 1
    && legacyStored.settings?.stockBatchModel === 1
    && legacyStored.settings?.stockLocationModel === 2
    && Array.isArray(legacyStored.goods_sheets)
    && Array.isArray(legacyStored.order_sources)
    && Array.isArray(legacyStored.storage_locations)
    && detachedMaterial?.name === "Исторический материал"
    && detachedMaterial?.writeOff === false
    && detachedMaterial?.warehouseId === "legacy-removed-stock"
    && legacyRollback?.orders?.length === seed.orders.length
    && batchModelOk
    && locationModelOk;
  if (!legacyV18ImportOk) {
    report.failures.push({
      type: "backup-legacy-v18-import",
      legacyImportToast,
      legacyV18ImportOk,
      stockModels: legacyStored.settings ? {
        reservation: legacyStored.settings.stockReservationModel,
        batch: legacyStored.settings.stockBatchModel,
        location: legacyStored.settings.stockLocationModel
      } : null,
      detachedMaterial: detachedMaterial ? {
        name: detachedMaterial.name,
        writeOff: detachedMaterial.writeOff,
        warehouseId: detachedMaterial.warehouseId
      } : null,
      batchModelOk,
      locationModelOk
    });
  }
  report.results.push({
    label: "backup-legacy-v18-import",
    width: 320,
    bodyScrollWidth: await utilityPage.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth)),
    viewportWidth: 320,
    overflow: await utilityPage.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) - window.innerWidth),
    modalOpen: false,
    tooSmall: [],
    legacyV18ImportOk
  });

  await writeSeed(utilityPage, seed);
  await setState(utilityPage, uiState({ activePage: "more", moreSection: "backup" }));

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
