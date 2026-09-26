# Design QA — Analytics 0.93.1

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

## Implementation checklist

- Capture Analytics 0.93.1 on the same phone.
- Check KPI wrapping, above-the-fold density and bottom navigation clearance.
- Fix any P1/P2 differences and repeat the comparison.

final result: blocked
