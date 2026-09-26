# Design QA — Core mobile UI 0.99.0

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

- [P1] Post-fix mobile visual comparison is pending.
  - Location: Analytics screen at 320–430 px.
  - Evidence: the 0.93.0 phone screenshot showed tall KPI cards, repeated period text and insufficient safe space above the bottom navigation. These were changed in 0.93.1, but no post-fix phone capture exists yet.
  - Impact: the corrected above-the-fold density and final navigation clearance cannot be certified.
  - Fix: capture the published 0.93.1 Analytics screen on the same phone and compare it with both the 0.93.0 screenshot and Sheet 05.

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
- Version 0.94.0 replaces visible text-symbol controls with the shared SVG icon system, aligns page titles and normalizes close, add, subtract and disclosure controls across the CRM.\n- Version 0.95.0 reduces order-card actions from five cramped columns to four, moves copy into the actions sheet, removes remaining text-symbol controls and adds a 320 px editor fallback.\n- Version 0.95.1 applies the same four-action rule to order detail, tightens the 320 px header, and turns the editor footer into a two-row layout on very narrow screens.\n- Version 0.96.0 removes duplicated warehouse price metadata, uses the correct restore icon for archived stock, and adds narrow-screen layouts for stock actions, KPI cards, movements, shopping and the stock editor.\n- Version 0.97.0 adds 320–340 px layouts for finance filters/actions/history and client cards/profile history so amounts and controls no longer squeeze primary text.\n- Version 0.98.0 replaces goods text-symbol controls with shared SVG icons and adds narrow-screen fallbacks for price filters, editors, goods creation, rows, preview actions and save bars.\n- Version 0.99.0 adds narrow layouts for tool rows/editor, settings forms/system rows/links, and backup actions so 320 px screens keep readable primary text and reachable actions.

## Implementation checklist

- Capture Analytics 0.94.0 on the same phone.
- Check KPI wrapping, above-the-fold density and bottom navigation clearance.
- Check close buttons, warehouse operations, finance add buttons and disclosure arrows on the phone.\n- Check order cards at 320/360/390/430 px, especially the four-action row and editor field wrapping.
- Fix any P1/P2 differences and repeat the comparison.

final result: blocked
