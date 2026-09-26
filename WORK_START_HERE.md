# WORK START HERE — CRM visual baseline

## Current user decision — 2026-09-26

The visual redesign based on `Visual_koncept/` has been superseded by the user's newer instruction.

**Current visual source of truth: the user's archived/original CRM screenshots (29 JPGs, dated around 2026-09-10) and the restored pre-Visual_koncept implementation.**

The `main` branch has been returned to the last pre-concept visual implementation baseline (based on commit `10722737c3ff09b7d4b6f39ac6ff4e39bd558fdd`), while the concept-based v0.67 work is preserved on branch:

`backup/visual-concepts-v0.67`

### Rules from now on

- Do **not** broadly redesign the CRM from `Visual_koncept/`.
- Preserve the restored legacy appearance unless the user asks for a specific change.
- Make changes **point-by-point**, screen-by-screen.
- Keep existing data compatibility and migrations safe.
- Target phone widths 320–430 CSS px.
- Use the old screenshots as the visual reference when available.
- `Visual_koncept/` remains a reference archive only, not the active target.

Before editing UI, inspect the current screen and change only what the user explicitly asks to change.
