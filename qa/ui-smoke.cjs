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

async function writeSeed(page, payload = seed) {
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });
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

async function setState(page, state) {
  await page.evaluate((stateValue) => sessionStorage.setItem("__crm_qa_next_state", JSON.stringify(stateValue)), state);
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForTimeout(100);
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
  if (result.tooSmall.length) {
    report.failures.push({ width, type: "small-touch-target", label, items: result.tooSmall });
  }
  await page.screenshot({ path: outDir + "/" + width + "-" + label + ".png", fullPage });
  return result;
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
    ["finance", uiState({ activePage: "more", moreSection: "finance" })],
    ["clients", uiState({ activePage: "more", moreSection: "clients" })],
    ["prices", uiState({ activePage: "more", moreSection: "prices" })],
    ["goods", uiState({ activePage: "more", moreSection: "goods" })],
    ["tools", uiState({ activePage: "more", moreSection: "tools" })],
    ["receipts", uiState({ activePage: "more", moreSection: "receipts" })],
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

      await page.locator(".catalog-service-option").first().click();
      await page.waitForTimeout(60);
      const serviceSelection = await page.evaluate(() => ({
        selectedRows: document.querySelectorAll(".catalog-service-option.selected").length,
        checkedIcons: document.querySelectorAll(".catalog-service-option.selected .catalog-check .ui-icon").length,
        countText: document.querySelector("#catalog-selected-count")?.textContent || ""
      }));
      if (serviceSelection.selectedRows !== 1 || serviceSelection.checkedIcons !== 1 || !serviceSelection.countText.startsWith("1 ")) {
        report.failures.push({ width, type: "service-selection-feedback", serviceSelection });
      }
      report.results.push(await shot(page, width, "service-catalog-selected", false));

      await page.locator("#catalog-apply").click();
      await page.waitForTimeout(80);
      const serviceRowState = await page.evaluate(() => {
        const row = document.querySelector("#service-lines [data-service-row]");
        const remove = row?.querySelector("[data-remove-line]");
        const rect = remove?.getBoundingClientRect();
        return {
          rows: document.querySelectorAll("#service-lines [data-service-row]").length,
          removeVisible: Boolean(remove && getComputedStyle(remove).display !== "none"),
          removeWidth: rect ? Math.round(rect.width) : 0,
          removeHeight: rect ? Math.round(rect.height) : 0
        };
      });
      if (serviceRowState.rows !== 1 || !serviceRowState.removeVisible || serviceRowState.removeWidth < 44 || serviceRowState.removeHeight < 44) {
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
      report.results.push(await shot(page, width, "material-catalog", false));

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
        const remove = row?.querySelector("[data-remove-line]");
        const rect = remove?.getBoundingClientRect();
        return {
          rows: document.querySelectorAll("#material-lines [data-material-row]").length,
          removeWidth: rect ? Math.round(rect.width) : 0,
          removeHeight: rect ? Math.round(rect.height) : 0
        };
      });
      if (materialRowState.rows !== 1 || materialRowState.removeWidth < 44 || materialRowState.removeHeight < 44) {
        report.failures.push({ width, type: "material-row-actions", materialRowState });
      }
      const editorSurfaceState = await page.evaluate(() => ({
        material: getComputedStyle(document.querySelector("#material-lines [data-material-row]")).backgroundColor,
        materialField: getComputedStyle(document.querySelector("#material-lines .material-card-controls .field")).backgroundColor,
        secondaryAction: getComputedStyle(document.querySelector(".order-editor-modal .modal-actions .secondary-button")).backgroundColor
      }));
      if (editorSurfaceState.material !== "rgb(7, 12, 16)"
        || editorSurfaceState.materialField !== "rgb(9, 15, 20)"
        || editorSurfaceState.secondaryAction !== "rgb(10, 17, 22)") {
        report.failures.push({ width, type: "order-editor-deep-dark-surfaces", editorSurfaceState });
      }
      await page.locator("#material-lines [data-remove-line]").first().click();
      if (await page.locator("#material-lines [data-material-row]").count() !== 0) {
        report.failures.push({ width, type: "material-row-remove" });
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
      await page.locator(".legacy-order-card").first().click();
      await page.waitForTimeout(80);
      const detailActions = await page.locator(".legacy-expanded-actions > button, .legacy-expanded-actions > a").count();
      if (detailActions !== 4) report.failures.push({ width, type: "order-detail-actions", count: detailActions });
      report.results.push(await shot(page, width, "order-detail", false));
      await page.locator('.legacy-expanded-actions [data-detail-action="more"]').click();
      await page.waitForTimeout(80);
      const copyAction = await page.locator('[data-order-sheet-action="copy"]').count();
      if (copyAction !== 1) report.failures.push({ width, type: "order-actions-copy", count: copyAction });
      report.results.push(await shot(page, width, "order-actions", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "warehouse", warehouseSection: "list" }));
      await page.locator("[data-stock-detail]").first().click();
      report.results.push(await shot(page, width, "stock-detail", false));
      await page.keyboard.press("Escape");
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

      await setState(page, uiState({ activePage: "more", moreSection: "clients" }));
      await page.locator('[data-action="open-client"]').first().click();
      report.results.push(await shot(page, width, "client-profile", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "goods" }));
      await page.locator('[data-action="new-goods-sheet"]').click();
      report.results.push(await shot(page, width, "goods-editor", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "tools" }));
      await page.locator('[data-action="new-tool"]').click();
      report.results.push(await shot(page, width, "tool-editor", false));
      await page.keyboard.press("Escape");

      await setState(page, uiState({ activePage: "more", moreSection: "receipts" }));
      await page.locator('[data-action="new-receipt"]').click();
      report.results.push(await shot(page, width, "receipt-editor", false));
      await page.keyboard.press("Escape");

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
        }

        await setState(page, uiState({ activePage: "orders" }));
        await page.locator(".legacy-order-card").first().click();
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
          const emptyResult = await shot(page, width, emptyLabel, true);
          report.results.push(emptyResult);
          if (emptyResult.overflow > 2) report.failures.push({ width, type: "empty-horizontal-overflow", label: emptyLabel, overflow: emptyResult.overflow });
        }

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
        await page.locator('[data-filter="closed"]').click();
        await page.waitForTimeout(60);
        const visibleClosedAfterSearch = await page.locator(".legacy-order-card").count();
        if (visibleClosedAfterSearch !== 0) report.failures.push({ width, type: "order-filter-combination", count: visibleClosedAfterSearch });
      }

      if (width === 390) {
        const printSeed = structuredClone(seed);
        printSeed.orders[0].services = Array.from({ length: 22 }, (_, index) => ({
          name: `Тестовая работа №${index + 1} с расширенным наименованием для проверки печати`,
          qty: 1,
          price: 1000 + index * 125
        }));
        printSeed.orders[0].materials = Array.from({ length: 8 }, (_, index) => ({
          name: `Материал №${index + 1} для проверки одностраничного акта`,
          qty: 1,
          unit: "шт.",
          unitCost: 500 + index * 50
        }));
        await writeSeed(page, printSeed);
        await setState(page, uiState({ activePage: "more", moreSection: "act", selectedActOrderId: "0060" }));
        await page.evaluate(() => {
          window.print = () => {};
          document.querySelector('[data-action="print-act"]')?.click();
        });
        await page.waitForTimeout(60);
        const printZoom = await page.evaluate(() => Number(getComputedStyle(document.documentElement).getPropertyValue("--act-print-zoom")) || 1);
        if (printZoom >= 1) report.failures.push({ width, type: "act-print-zoom", zoom: printZoom });
        await page.emulateMedia({ media: "print" });
        await page.pdf({ path: outDir + "/act-a4.pdf", format: "A4", printBackground: true, preferCSSPageSize: true });
        await page.emulateMedia({ media: "screen" });
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
  await pwaPage.reload({ waitUntil: "networkidle" });
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
