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
  receipts: [{ id: "r1", title: "Квитанция", number: "0059", date: "2026-09-24T12:00:00.000Z", amount: 8900, orderId: "0059", note: "Оплачено" }],
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
  draft: [],
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
    financePeriod: "all", moreSection: "menu", moreReturnSection: "menu", selectedActOrderId: "0060", scrollY: 0
  }, extra || {});
}

async function writeSeed(page) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
  await page.evaluate(async (payload) => {
    await new Promise((resolve, reject) => {
      const request = indexedDB.open("crm-romanychev", 1);
      request.onupgradeneeded = () => {
        if (!request.result.objectStoreNames.contains("keyval")) request.result.createObjectStore("keyval");
      };
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction("keyval", "readwrite");
        tx.objectStore("keyval").put(payload, "crm-data");
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  }, seed);
}

async function setState(page, state) {
  await page.evaluate((stateValue) => localStorage.setItem("crm-ui-state", JSON.stringify(stateValue)), state);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(60);
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
      .filter((item) => item.w < 32 || item.h < 32)
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
  await page.screenshot({ path: outDir + "/" + width + "-" + label + ".png", fullPage });
  return result;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const report = { generatedAt: new Date().toISOString(), baseUrl: BASE_URL, results: [], failures: [] };

  const screens = [
    ["orders", uiState({ activePage: "orders" })],
    ["warehouse", uiState({ activePage: "warehouse", warehouseSection: "list" })],
    ["movements", uiState({ activePage: "warehouse", warehouseSection: "movements" })],
    ["shopping", uiState({ activePage: "warehouse", warehouseSection: "shopping" })],
    ["analytics", uiState({ activePage: "analytics" })],
    ["more", uiState({ activePage: "more", moreSection: "menu" })],
    ["finance", uiState({ activePage: "more", moreSection: "finance" })],
    ["clients", uiState({ activePage: "more", moreSection: "clients" })],
    ["prices", uiState({ activePage: "more", moreSection: "prices" })],
    ["goods", uiState({ activePage: "more", moreSection: "goods" })],
    ["tools", uiState({ activePage: "more", moreSection: "tools" })],
    ["receipts", uiState({ activePage: "more", moreSection: "receipts" })],
    ["settings", uiState({ activePage: "more", moreSection: "settings" })],
    ["act", uiState({ activePage: "more", moreSection: "act", selectedActOrderId: "0060" })]
  ];

  for (const width of widths) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
      serviceWorkers: "block"
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    page.setDefaultNavigationTimeout(10000);
    page.on("pageerror", (error) => report.failures.push({ width, type: "pageerror", message: String(error) }));
    page.on("console", (msg) => { if (msg.type() === "error") report.failures.push({ width, type: "console", message: msg.text() }); });
    await writeSeed(page);

    for (const [label, state] of screens) {
      console.log(`QA ${width}px · ${label}`);
      await setState(page, state);
      const result = await shot(page, width, label, true);
      report.results.push(result);
      if (result.overflow > 2) report.failures.push({ width, type: "horizontal-overflow", label, overflow: result.overflow });
    }

    if (width === 320 || width === 390) {
      await setState(page, uiState({ activePage: "orders" }));
      await page.locator('[data-action="new-order"]').first().click();
      await page.waitForTimeout(100);
      let modalCheck = await page.evaluate(() => ({
        locked: document.body.classList.contains("modal-open"),
        fixed: getComputedStyle(document.body).position === "fixed",
        dialogs: document.querySelectorAll('.modal-backdrop').length
      }));
      if (!modalCheck.locked || !modalCheck.fixed || modalCheck.dialogs !== 1) report.failures.push({ width, type: "order-modal-lock", modalCheck });
      report.results.push(await shot(page, width, "order-editor", false));

      await page.locator("#open-service-catalog").click();
      await page.waitForTimeout(100);
      const nested = await page.evaluate(() => {
        const layers = [...document.querySelectorAll(".modal-backdrop")];
        return { count: layers.length, firstInert: Boolean(layers[0] && layers[0].inert), firstHidden: layers[0] && layers[0].getAttribute("aria-hidden") };
      });
      if (nested.count !== 2 || !nested.firstInert || nested.firstHidden !== "true") report.failures.push({ width, type: "nested-modal", nested });
      report.results.push(await shot(page, width, "service-catalog", false));
      await page.keyboard.press("Escape");
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list" }));
      await page.locator('[data-action="new-stock"]').click();
      report.results.push(await shot(page, width, "stock-editor", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "finance" }));
      await page.locator('[data-action="add-finance"][data-type="income"]').click();
      report.results.push(await shot(page, width, "finance-editor", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "prices" }));
      await page.locator('[data-action="new-price"]').click();
      report.results.push(await shot(page, width, "price-editor", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "tools" }));
      await page.locator('[data-action="new-tool"]').click();
      report.results.push(await shot(page, width, "tool-editor", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "receipts" }));
      await page.locator('[data-action="new-receipt"]').click();
      report.results.push(await shot(page, width, "receipt-editor", false));
      await page.keyboard.press("Escape");
    }

    await context.close();
  }

  fs.writeFileSync(outDir + "/report.json", JSON.stringify(report, null, 2));
  console.log(JSON.stringify({ failures: report.failures, checked: report.results.length }, null, 2));
  await browser.close();
  if (report.failures.length) process.exitCode = 1;
})().catch((error) => {
  fs.writeFileSync(outDir + "/fatal.txt", String(error && error.stack || error));
  console.error(error);
  process.exitCode = 1;
});
