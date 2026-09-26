# WORK START HERE — CRM redesign

Before changing the CRM UI, read these in order:

1. **`Visual_koncept/README.md`**
2. **all 10 PNG sheets in `Visual_koncept/`**
3. **`design/mobile-crm-redesign/README.md`**

The folder **`Visual_koncept/` is the approved visual source of truth** for the redesign.
The current `main` branch is the functional/data-compatibility source of truth.

## Целевое устройство — только телефон

Это **исключительно мобильная CRM**. Проектируется и проверяется только для
ширины 320–430 CSS px; приоритет — реальный телефон пользователя. Десктопную
версию, адаптацию под компьютер и компромиссы ради широкого экрана делать не
нужно. Любое изменение сначала должно быть безопасным и читаемым на телефоне.

Do not redesign from memory.
Do not use the old 29 screenshots as the new visual target.
Do not start a broad CSS rewrite until all 10 concept sheets and the implementation brief have been reviewed.

Implementation must preserve existing CRM functionality and data migrations while matching the concept sheets as closely as practical on a phone.
