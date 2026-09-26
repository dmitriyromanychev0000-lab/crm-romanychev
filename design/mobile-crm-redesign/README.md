# STATUS: superseded visual direction

**2026-09-26:** The user asked to return to the original/archived CRM appearance first and make only point changes afterward.

The active baseline is now the restored pre-`Visual_koncept` interface. See `../../WORK_START_HERE.md`.

The material below is retained only as historical/reference documentation and is **not** the current automatic implementation target.

---

# Mobile CRM redesign — approved visual direction

## READ THIS BEFORE CHANGING UI

This folder is the handoff for the next deep Work pass.

The **approved visual direction** is stored directly in the repository under:

**`Visual_koncept/`**

That folder contains all 10 generated mobile concept sheets plus its own `README.md` that maps the actual PNG filenames to sheets 01–10.

**Before implementation, inspect `Visual_koncept/README.md` and all 10 PNG files.**
Do not redesign from memory and do not use the old 29 screenshots as the new visual target. The old archive is useful for legacy behaviour/data compatibility only. The 10 PNG sheets in `Visual_koncept/` are the visual target.

---

## What each sheet covers

1. **01 — Applications**
   - order list
   - order detail/card
   - new/edit order form

2. **02 — Applications workflow**
   - service catalogue
   - schedule / nearest visits / list states
   - compact application actions

3. **03 — Warehouse**
   - warehouse list
   - stock item detail
   - create/edit stock item

4. **04 — Warehouse support**
   - movement history
   - shopping list
   - copy/share shopping list

5. **05 — Analytics**
   - main KPI dashboard
   - operational analytics
   - revenue / efficiency visualisation

6. **06 — Finance & clients**
   - finance
   - client list
   - client profile/history

7. **07 — Price & goods**
   - price list
   - custom service editor
   - goods/material calculation

8. **08 — Documents**
   - act screen
   - A4 print/PDF
   - receipts/documents

9. **09 — More & work utilities**
   - More menu
   - goods
   - tools

10. **10 — Settings**
    - settings
    - backups/import/export
    - executor/application settings

---

## Visual system to reproduce

This is a personal mobile CRM for one technician, used primarily from a phone.

### General
- Mobile-first: optimise primarily for 360–430 px widths.
- Dense but readable. Avoid giant empty cards and oversized typography.
- Dark graphite surfaces, not pure black everywhere.
- Warm coral/orange is the primary action/accent.
- Blue, green, yellow and purple are semantic secondary accents.
- Borders are subtle; shadows are restrained.
- Default card/control radius should feel compact: roughly 12–16 px.
- Prefer compact lists over huge nested panels.
- Minimum comfortable touch targets: about 44–48 px.
- Keep the fixed four-tab bottom navigation:
  - Заявки
  - Склад
  - Аналитика
  - Ещё

### Typography
- Do not make the interface “hero-sized”.
- Main mobile page titles should feel approximately 24–30 px visually, not 40+.
- Normal UI/body text should feel approximately 14–16 px.
- Secondary/meta text should feel approximately 11–13 px.
- Preserve clear money/status hierarchy.

### Order cards
- Newest orders first.
- Compact vertical rhythm.
- Important money/status visible without opening.
- Main actions in one row:
  - Изменить
  - Открыть/Закрыть
  - Копия
  - Позвонить
  - Ещё
- Overflow menu contains secondary actions such as document, Telegram, archive/restore and delete.

### Order editor
Use two columns for short fields where practical:
- Клиент | Телефон
- Техника | Модель
- Следующий визит | Статус
- Итог | Предоплата
- Скидка | Гарантия
- Серые расходы | Белые расходы
- % | Метка

Keep long fields full width:
- address
- issue
- diagnosis
- defects
- comments

Photos and secondary guarantee/comment content may be collapsible.

### Phone input
Russian phone validation is mandatory:
- accept only Russian 7/8 formats
- normalise to `+7XXXXXXXXXX`
- no letters/garbage/extra digits
- invalid phone must block saving when phone is required

### Service catalogue
- explicit close button in the header
- background body must not scroll while modal is open
- catalogue itself scrolls internally
- compact service rows and checkboxes
- **no “apply without fit” button inside catalogue**
- that behaviour is controlled only by Settings checkbox

### Warehouse
- no shopping-list content embedded inside the warehouse page
- warehouse only contains a button/link to the dedicated shopping-list page
- shopping list is also accessible from More
- shopping list includes **Copy list** action
- warehouse creation/editing should not be a huge always-open form

### Settings
- avoid a second huge menu taking half the screen
- utilities such as Tools / Documents / Drafts / Backups should be compact and easy to reach
- functional settings belong directly on the Settings page where sensible

### Analytics / Finance
- reduce block sizes
- every KPI needs a clear label and unit/period
- favour useful information density over decorative giant tiles

### Act / PDF
- A4 portrait
- one page for normal jobs
- use the full printable page, not a tiny document in the upper half
- signatures/acceptance area should naturally use lower page space
- only shrink for genuinely long tables
- keep screen preview readable but print CSS independent

---

## Functional source of truth

Current `main` around **0.49.0** is the functional baseline.

**Do not remove working functionality just to match a mockup.**
The concept images define layout/style; current code and backup compatibility define behaviour.

Must preserve or improve:
- orders and drafts
- Russian phone validation
- service catalogue
- price/custom services
- warehouse + movements
- dedicated shopping list + copy
- analytics
- personal finance
- clients/history
- act/PDF
- receipts/documents
- goods calculator
- tools
- backups/import/export/self-test/rollback
- compatibility with CRM BT v18 backup
- missing-ID/date migrations already added
- PWA/service-worker versioning

---

## Recommended implementation order

1. Shared design tokens, shell, header, bottom nav, typography and controls.
2. Sheet 01 — Applications core.
3. Sheet 02 — Application workflow/catalogue.
4. Sheets 03–04 — Warehouse + shopping.
5. Sheet 05 — Analytics.
6. Sheet 06 — Finance + clients.
7. Sheet 07 — Price + goods.
8. Sheet 08 — Act/PDF + documents.
9. Sheet 09 — More + tools.
10. Sheet 10 — Settings + backups.
11. Final phone-size QA at 360 / 390 / 430 px.
12. Final print QA for A4.

---

## Engineering rules for the Work pass

- Read `app.js`, `styles.css`, `index.html`, `sw.js` before refactoring.
- Prefer a coherent token/system layer over dozens of late CSS overrides.
- Remove obsolete overrides only after verifying they are no longer needed.
- Preserve data schema and migrations unless explicitly improving them.
- After each implementation slice:
  - run JS syntax check
  - audit `data-action` handlers
  - audit missing IDs/selectors
  - verify mobile overflow
  - bump asset query versions and SW cache only when the slice is stable
- Do not claim visual parity unless the reference sheet has actually been inspected.

---

## Success criterion

The result should feel like the generated concept sheets when used one-handed on a phone, while retaining all functional capabilities already recovered in the CRM.

If a concept image contains distorted AI-generated text, use the **current CRM labels/data model** as the textual source of truth and use the image only for layout, proportions, colour, hierarchy and interaction placement.
