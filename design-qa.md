# Design QA — Release candidate 0.99.14

- Source visual truth: `Visual_koncept/file_00000000b1848246b2b9135b6ca828b3.png`
- Source pixels: 1448 × 1086, density not normalized because the sheet contains three framed phone screens.
- Implementation: `https://dmitriyromanychev0000-lab.github.io/crm-romanychev/`
- Phone evidence before density fix: user screenshot `1000100984.jpg`, 691 × 1536 px after image export/compression.
- Intended CSS viewport: 320–430 px.
- Available cloud-browser viewport: 1363 × 936 px at DPR 1.
- State tested: Analytics, empty data, Month and Week periods, custom range modal, expanded warehouse summary.

## Full-view comparison evidence

The source sheet was opened at original resolution. The user then provided a real-phone screenshot of Analytics 0.93.0. It confirms the correct mobile rules and content hierarchy, while showing excessive vertical height in the KPI and focus sections.

## Focused comparison evidence

The real-phone screenshot provided usable evidence for the header, period controls, KPI panel, focus panel and bottom navigation. A post-fix phone screenshot is still required to confirm the 0.93.1 density changes.

## Findings

- Automated release QA: **passed**.
  - Latest full Chromium smoke covers 97 states across 320 / 360 / 390 / 430 px with zero failures.
  - Coverage includes long-data stress, empty/archived states, order detail/actions, both nested catalogs, stock/client/goods/tool/receipt editors, navigation/search/filter clicks, modal inert + scroll-lock, PWA offline reload and A4 PDF.
  - Remaining non-automated check: subjective real-device density and Android/iOS virtual-keyboard behavior.

## Functional verification

- Period switching: passed.
- Custom date modal open/close: passed.
- Collapsible warehouse summary: passed.
- Background modal lock: present through the shared modal lock.
- App console errors: none observed. Cloud-browser extension metadata errors were unrelated to the CRM.

## Fidelity surfaces

- Fonts and typography: the phone screenshot confirmed readable hierarchy; duplicate secondary text was removed from section headers.
- Spacing and layout rhythm: KPI cards and focus rows were reduced, and 96 px safe content padding was added above the fixed navigation; post-fix rendering remains to be checked.
- Colors and visual tokens: graphite surfaces, coral primary accent and semantic green/blue/yellow/purple follow the source direction.
- Image quality and assets: no raster imagery is required on this screen; existing product icon system is reused.
- Copy and content: current CRM data labels retained; hierarchy follows Sheet 05.

## Comparison history

- Initial live pass confirmed the new hierarchy and interactions, but exposed a viewport mismatch.
- User phone screenshot then identified three P1/P2 density issues: duplicate period labels, oversized KPI/focus sections and weak bottom-navigation clearance.
- Version 0.93.1 removes the duplicates, reduces component heights and adds safe bottom padding.
- Version 0.94.0 replaces visible text-symbol controls with the shared SVG icon system, aligns page titles and normalizes close, add, subtract and disclosure controls across the CRM.\n- Version 0.95.0 reduces order-card actions from five cramped columns to four, moves copy into the actions sheet, removes remaining text-symbol controls and adds a 320 px editor fallback.\n- Version 0.95.1 applies the same four-action rule to order detail, tightens the 320 px header, and turns the editor footer into a two-row layout on very narrow screens.\n- Version 0.96.0 removes duplicated warehouse price metadata, uses the correct restore icon for archived stock, and adds narrow-screen layouts for stock actions, KPI cards, movements, shopping and the stock editor.\n- Version 0.97.0 adds 320–340 px layouts for finance filters/actions/history and client cards/profile history so amounts and controls no longer squeeze primary text.\n- Version 0.98.0 replaces goods text-symbol controls with shared SVG icons and adds narrow-screen fallbacks for price filters, editors, goods creation, rows, preview actions and save bars.\n- Version 0.99.0 adds narrow layouts for tool rows/editor, settings forms/system rows/links, and backup actions so 320 px screens keep readable primary text and reachable actions.\n- Version 0.99.1 adds narrow document/editor layouts, a scroll-safe A4 preview on mobile, and print scaling based on both row count and document text volume.\n- Version 0.99.2 hardens local date defaults, filter accessibility states, button semantics and final mobile readability/touch-target minimums that were still overridden by older CSS layers.\n- Version 0.99.3 adds confirmation before finance deletion, marks stacked modal underlays inert/hidden from assistive tech, and exposes automatic backup controls as an accessible switch.\n- Version 0.99.4 converts stored visit timestamps to local datetime-local values and makes network-first service-worker caching await successful cache writes with a navigation-only shell fallback.\n- Version 0.99.5 adds 192×192 and 512×512 PNG PWA icon fallbacks plus a maskable manifest entry, and precaches all icon variants for install/offline consistency.

## Implementation checklist

- [x] 320 / 360 / 390 / 430 px Chromium regression pass.
- [x] Long-data stress and empty/archive states.
- [x] Nested modal lock / Escape / inert behavior.
- [x] PWA service worker activation and offline reload.
- [x] A4 PDF generation and one-page stress act.
- [ ] Real-phone keyboard and final subjective density check.

final result: automated release QA passed

- Version 0.99.6 blocks ambiguous duplicate IDs during backup import, reports them during backup inspection, and exposes ID integrity in app diagnostics.

- Version 0.99.7 fixes rendered 320 px truncation in the order net KPI, removes misleading pending copy from declined orders, and replaces the remaining service-catalog emoji/check glyphs with shared SVG icons.

- Version 0.99.8 raises the rendered QA bar: sub-32 px interactive targets fail the smoke run, backup is included as a screen, and 320/390 px modal coverage now includes order detail/actions, both nested catalogs, stock detail, client profile and goods editor.

- Version 0.99.9 removes the service-catalog local Escape handler so the global modal stack closes exactly one layer per Escape and preserves the underlying order editor lock.

- Version 0.99.10 fixes the only rendered small-touch-target failure from the 86-state smoke run: automatic backup now has a 64×44 px hit area with a compact visual track. QA reports are only published when the tested commit is still the current main head.

- Version 0.99.11 fixes a rendered order-detail artifact caused by the generic `.toggle::after` switch rule colliding with the order status action class; the order action now uses `.action-toggle`.

- Version 0.99.12 scopes switch CSS away from generic `.toggle`, prevents narrow action labels from breaking inside words, and adds 320 px long-data/empty-state stress fixtures plus an A4 PDF smoke artifact.

- Version 0.99.13 keeps client-facing money values complete under long-data stress by replacing ellipsis truncation with responsive numeric sizing.

- Version 0.99.14 extends backup self-test equality checks to `settings`, so company/user details and backup preferences are covered by the JSON → validate → IndexedDB → validate round-trip.
