# WORK START HERE — CRM redesign

Before changing the CRM UI or product logic, read these in order:

1. **`AGENTS.md`** — mandatory engineering/work rules for every task
2. **`CRM_PRODUCT_CONCEPT.md`** — confirmed business logic, UX behavior and open product questions
3. **`Visual_koncept/README.md`**
4. **all 10 PNG sheets in `Visual_koncept/`**
5. **`design/mobile-crm-redesign/README.md`**

The file **`CRM_PRODUCT_CONCEPT.md` is the product-logic source of truth**.
The folder **`Visual_koncept/` is the approved visual source of truth** for the redesign.
The current `main` branch is the functional/data-compatibility source of truth.

If the current UI conflicts with confirmed product logic, preserve the confirmed product logic and redesign the UI around it.
Items explicitly listed as open questions in `CRM_PRODUCT_CONCEPT.md` must not be silently treated as final requirements.

## Целевое устройство — только телефон

Это **исключительно мобильная CRM**. Проектируется и проверяется только для
ширины 320–430 CSS px; приоритет — реальный телефон пользователя. Десктопную
версию, адаптацию под компьютер и компромиссы ради широкого экрана делать не
нужно. Любое изменение сначала должно быть безопасным и читаемым на телефоне.

Do not redesign from memory.
Do not use the old 29 screenshots as the new visual target.
Do not start a broad CSS rewrite until the product concept, all 10 concept sheets and the implementation brief have been reviewed.

Implementation must preserve existing CRM functionality and data migrations while matching the confirmed product logic and concept sheets as closely as practical on a phone.
