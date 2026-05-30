# TASKS: DevKit Toolbox — Chrome Extension MVP

> Создано: 2026-05-30
> Статус: In Progress
> Итого: 56 задач, 141 SP
> Стек: Chrome Manifest V3 · React 18 · TypeScript · Vite · Tailwind CSS · Zustand
> Целевая аудитория: QA-инженеры и разработчики

## Контекст

Chrome-расширение со швейцарским ножом утилит для тестировщиков и разработчиков. Side panel содержит 11 утилит MVP, всё работает оффлайн, без обращений к серверу. Хранение настроек и истории — в `chrome.storage.local`. На первом этапе монетизации нет, но архитектура готова к freemium-разделению (feature flags + плейсхолдер `isPro()`).

**Языки UI**: английский (основной), немецкий, французский, испанский, русский, итальянский. Авто-определение по `navigator.language` + ручное переключение в настройках.

**Лендинг**: GitHub Pages в этом же репозитории (ветка `gh-pages` или папка `/docs`).

**Критерий "готово" для MVP**: расширение опубликовано в Chrome Web Store, все 10 утилит работают на 6 языках, есть тёмная/светлая тема, базовая аналитика установок, README + лендинг на GitHub Pages.

---

## Фаза 0: Setup проекта и инфраструктура

### Bootstrap

- [ ] **[🔴 Critical | 1 SP]** Инициализировать git-репозиторий, добавить `.gitignore` (node_modules, dist, .env)

  > Без этого нельзя коммитить.

- [ ] **[🔴 Critical | 2 SP]** Создать Vite-проект с шаблоном `react-ts`, настроить `vite.config.ts` под Chrome MV3 (использовать `@crxjs/vite-plugin`) — `vite.config.ts`, `package.json`

  > `@crxjs/vite-plugin` решает HMR для extension'ов из коробки.

- [ ] **[🔴 Critical | 2 SP]** Написать `manifest.json` под Manifest V3: side_panel, action, permissions (storage, clipboardRead, activeTab, scripting) — `public/manifest.json`

  > Запрашивать только нужные пермишены — иначе review в Chrome Web Store зарежет.

- [ ] **[🟠 High | 1 SP]** Настроить TypeScript: `strict: true`, path aliases (`@/components`, `@/utils`, `@/storage`) — `tsconfig.json`

- [ ] **[🟠 High | 2 SP]** Подключить Tailwind CSS + базовая дизайн-система (цвета, шрифты, темы light/dark через CSS-переменные) — `tailwind.config.ts`, `src/styles/globals.css`

- [ ] **[🟡 Medium | 1 SP]** Настроить ESLint + Prettier (правила для React + TS + a11y) — `.eslintrc.cjs`, `.prettierrc`

- [ ] **[🟡 Medium | 1 SP]** Настроить Vitest + React Testing Library — `vitest.config.ts`

- [ ] **[🟡 Medium | 1 SP]** Настроить Husky + lint-staged (pre-commit: lint + format) — `.husky/pre-commit`

### CI/CD

- [ ] **[🟡 Medium | 2 SP]** GitHub Actions workflow: lint → typecheck → test → build на каждый PR — `.github/workflows/ci.yml`

- [ ] **[🟢 Low | 2 SP]** Workflow для упаковки ZIP-релиза при тегировании (`v*.*.*`) для аплоада в Chrome Web Store — `.github/workflows/release.yml`

---

## Фаза 1: Архитектура и каркас

### Каркас приложения

- [ ] **[🔴 Critical | 3 SP]** Создать структуру: `src/sidepanel/`, `src/background/`, `src/content/`, `src/components/`, `src/tools/`, `src/storage/`, `src/lib/`

  > Модульная структура: каждая утилита = независимая папка в `src/tools/<tool-name>/`.

- [ ] **[🔴 Critical | 3 SP]** Side panel entry: React-приложение с роутингом между утилитами (react-router-dom v6, hash-роутер) — `src/sidepanel/main.tsx`, `src/sidepanel/App.tsx`

- [ ] **[🟠 High | 3 SP]** Реестр утилит: `tools.registry.ts` со списком `{ id, nameKey, icon, route, component, category, isPro }` — `src/tools/registry.ts`

  > Поле `isPro` сразу закладываем под Фазу 2 монетизации.

- [ ] **[🟠 High | 2 SP]** Главный экран со списком утилит (поиск + категории "Encoders", "Generators", "Testers", "QA Tools") — `src/sidepanel/HomeScreen.tsx`

- [ ] **[🟠 High | 2 SP]** Layout side panel: header (логотип, поиск, настройки), main, footer — `src/components/Layout/`

### UI Kit

- [ ] **[🟠 High | 3 SP]** Базовые компоненты: `Button`, `Input`, `Textarea`, `Select`, `Card`, `Tabs`, `Toast` — `src/components/ui/`

  > Минимальный набор. Можно взять shadcn/ui как референс, но не тянуть всю либу.

- [ ] **[🟠 High | 2 SP]** Компонент `CodeEditor` (обёртка над CodeMirror 6 с подсветкой JSON/JS/Regex) — `src/components/CodeEditor.tsx`

  > Один редактор переиспользуется в JSON-форматтере, JWT, regex-тестере, diff.

- [ ] **[🟡 Medium | 2 SP]** Переключатель темы (light/dark/system) с сохранением в storage — `src/components/ThemeToggle.tsx`

- [ ] **[🟡 Medium | 1 SP]** Компонент `CopyButton` (копирует значение в буфер, показывает toast) — `src/components/CopyButton.tsx`

### Интернационализация (i18n)

- [ ] **[🔴 Critical | 3 SP]** Подключить `react-i18next` + `i18next-browser-languagedetector`, настроить namespaces (`common`, `tools`, `settings`) — `src/i18n/index.ts`

  > Решение принимаем сразу: i18n библиотека или Chrome native `_locales/`. Берём react-i18next — гибче, легче DX, поддерживает плюрализацию и интерполяцию.

- [ ] **[🟠 High | 2 SP]** Структура переводов: `src/i18n/locales/{en,de,fr,es,ru,it}/{common,tools,settings}.json` — заполнить `en` как источник истины

  > Все ключи на английском. Остальные языки — копии файлов `en/` с переведёнными значениями.

- [ ] **[🟠 High | 3 SP]** Переводы для `common.json` и `settings.json` на 5 языков (de, fr, es, ru, it)

  > Использовать DeepL/качественный машинный перевод + ручная вычитка для en→ru (родной язык владельца).

- [ ] **[🟠 High | 5 SP]** Переводы для `tools.json` (10 утилит × ~15 строк) на 5 языков

  > Самая большая i18n-задача. Делать после того, как все утилиты функционально готовы — чтобы не переводить дважды.

- [ ] **[🟠 High | 2 SP]** Селектор языка в Settings (с авто-определением и опцией "System") — `src/components/LanguageSelector.tsx`

- [ ] **[🟡 Medium | 2 SP]** Локализация `manifest.json` через `_locales/<lang>/messages.json` (name, description в CWS) для всех 6 языков — `public/_locales/`

  > Это критично для CWS: пользователь видит описание на своём языке в магазине.

- [ ] **[🟢 Low | 1 SP]** Lint-правило / CI-проверка консистентности ключей между локалями (`i18next-parser` или кастомный скрипт)

### Storage и общие сервисы

- [ ] **[🟠 High | 2 SP]** Обёртка над `chrome.storage.local`: типизированный API `storage.get/set/subscribe` — `src/storage/storage.ts`

- [ ] **[🟠 High | 2 SP]** Zustand-стор с persist через storage-обёртку: настройки, тема, история использования утилит — `src/storage/store.ts`

- [ ] **[🟡 Medium | 1 SP]** Хелпер `isPro()` (плейсхолдер, всегда `true` сейчас, потом подменим на проверку лицензии) — `src/lib/license.ts`
  > Задел под монетизацию: оборачиваем Pro-фичи в `if (!isPro()) return <Upsell />` — но в MVP всё открыто.

---

## Фаза 2: MVP-утилиты

> Каждая утилита живёт в `src/tools/<name>/` с файлами: `index.tsx` (UI), `logic.ts` (чистые функции), `logic.test.ts` (тесты).

### 1. JSON Formatter / Validator / JSONPath

- [ ] **[🟠 High | 2 SP]** Логика: format, minify, validate с понятными ошибками (строка/колонка) — `src/tools/json/logic.ts`

- [ ] **[🟠 High | 3 SP]** UI: input + output, кнопки Format/Minify/Validate, drag&drop файла — `src/tools/json/index.tsx`

- [ ] **[🟡 Medium | 3 SP]** JSONPath-запросы через `jsonpath-plus`, отображение результата — `src/tools/json/jsonpath.ts`

- [ ] **[🟡 Medium | 2 SP]** Тесты на логику (валидный/невалидный JSON, edge cases с дубликатами ключей, большие файлы)

### 2. JWT Decoder

- [ ] **[🟠 High | 2 SP]** Логика: split на header/payload/signature, base64url-decode, парсинг JSON, проверка `exp/nbf/iat` — `src/tools/jwt/logic.ts`

- [ ] **[🟠 High | 2 SP]** UI: input токена, три колонки (header, payload, signature), индикатор истечения — `src/tools/jwt/index.tsx`

- [ ] **[🟢 Low | 1 SP]** Тесты на парсинг и edge cases (битый токен, отсутствие частей)

### 3. Base64 / URL Encode-Decode

- [ ] **[🟡 Medium | 1 SP]** Логика: encode/decode Base64 (стандартный и URL-safe), URL encode/decode — `src/tools/encoders/logic.ts`

- [ ] **[🟡 Medium | 2 SP]** UI: переключатель режимов, авто-определение направления — `src/tools/encoders/index.tsx`

### 4. Unix Timestamp ↔ Date

- [ ] **[🟡 Medium | 1 SP]** Логика: конверсия в обе стороны, поддержка миллисекунд/секунд, таймзоны — `src/tools/timestamp/logic.ts`

- [ ] **[🟡 Medium | 2 SP]** UI: два инпута + "Now" кнопка, выбор таймзоны, формат вывода — `src/tools/timestamp/index.tsx`

### 5. UUID / GUID Generator

- [ ] **[🟢 Low | 1 SP]** Логика: UUID v4, v7, NIL, bulk-генерация (N штук) — `src/tools/uuid/logic.ts`

- [ ] **[🟢 Low | 1 SP]** UI: кнопка генерации, выбор версии, инпут количества, "Copy all" — `src/tools/uuid/index.tsx`

### 6. Regex Tester

- [ ] **[🟠 High | 3 SP]** UI: паттерн + флаги + тестовая строка, подсветка матчей и групп — `src/tools/regex/index.tsx`

- [ ] **[🟡 Medium | 2 SP]** Шпаргалка по синтаксису regex (выпадающая панель) — `src/tools/regex/Cheatsheet.tsx`

### 7. Hash Calculator (MD5 / SHA-1 / SHA-256 / SHA-512)

- [ ] **[🟡 Medium | 2 SP]** Логика: использовать `crypto.subtle` для SHA, отдельная либа для MD5 (`spark-md5`) — `src/tools/hash/logic.ts`

- [ ] **[🟡 Medium | 2 SP]** UI: input + чекбоксы алгоритмов, поддержка файла через drop — `src/tools/hash/index.tsx`

### 8. Text Diff

- [ ] **[🟠 High | 3 SP]** Логика + UI: side-by-side diff через `diff` библиотеку, выделение добавленных/удалённых строк — `src/tools/diff/index.tsx`

- [ ] **[🟢 Low | 1 SP]** Опции: ignore whitespace, ignore case

### 9. Clipboard History

- [ ] **[🟠 High | 3 SP]** Background service worker: слушает события копирования (через content script с `document.execCommand` хуком), пишет в storage с лимитом 100 записей — `src/background/clipboard.ts`, `src/content/clipboard-listener.ts`

  > Manifest V3 ограничивает доступ к буферу — слушаем через content script на активной вкладке.

- [ ] **[🟠 High | 2 SP]** UI: список истории с поиском, кнопки "Copy"/"Delete", "Clear all" — `src/tools/clipboard/index.tsx`

- [ ] **[🟡 Medium | 1 SP]** Pin важных записей (не удаляются при достижении лимита)

### 10. Color Picker (Eyedropper)

- [ ] **[🟠 High | 2 SP]** Логика: использовать нативный `window.EyeDropper` API (Chrome 95+), fallback через захват экрана + canvas для старых версий — `src/tools/colorpicker/logic.ts`

  > Native EyeDropper работает по всей системе, не только во вкладке — это киллер-фича vs. конкурентов.

- [ ] **[🟠 High | 2 SP]** UI: кнопка "Pick color", отображение в HEX / RGB / HSL / HSLA / CMYK, превью цвета, копирование одной кнопкой — `src/tools/colorpicker/index.tsx`

- [ ] **[🟡 Medium | 2 SP]** История выбранных цветов (последние 20) с возможностью pin в палитру — `src/tools/colorpicker/history.ts`

- [ ] **[🟢 Low | 1 SP]** Экспорт палитры в CSS-переменные / Tailwind config / JSON

### 11. Screenshot with Annotations

- [ ] **[🟠 High | 3 SP]** Background: захват вкладки через `chrome.tabs.captureVisibleTab` — `src/background/screenshot.ts`

- [ ] **[🟠 High | 5 SP]** Canvas-редактор: rectangle, arrow, text, blur, crop — `src/tools/screenshot/Editor.tsx`

  > Самая трудоёмкая утилита MVP. Если поджимает время — урезать до rectangle + text.

- [ ] **[🟡 Medium | 2 SP]** Экспорт PNG / копирование в буфер / скачивание — `src/tools/screenshot/export.ts`

---

## Фаза 3: Полировка перед публикацией

- [ ] **[🟠 High | 2 SP]** Иконки расширения (16/32/48/128px) и иконки утилит (lucide-react) — `public/icons/`

- [ ] **[🟠 High | 2 SP]** Onboarding-экран при первом запуске (краткий тур по утилитам)

- [ ] **[🟠 High | 1 SP]** Страница "Settings" (тема, очистка истории, экспорт настроек)

- [ ] **[🟡 Medium | 2 SP]** Аналитика установок без PII: `chrome.runtime.onInstalled` + опциональная отправка анонимного `install_id` (с явным opt-in в onboarding)

  > Без явного согласия — никакой телеметрии, иначе review-проблемы.

- [ ] **[🟡 Medium | 1 SP]** README с GIF-демо каждой утилиты

- [ ] **[🟡 Medium | 3 SP]** Лендинг на GitHub Pages в папке `/docs`: описание, скриншоты, ссылка на CWS, форма обратной связи. Базовый i18n через переключатель в шапке (минимум 6 языков)
  > Один статический HTML + минимум JS для переключения языка. SEO-теги (`hreflang`, og:image) для каждого языка.

### Публикация в Chrome Web Store

- [ ] **[🟠 High | 1 SP]** Завести Developer-аккаунт ($5 единоразово)

- [ ] **[🟠 High | 3 SP]** Подготовить материалы для CWS на 6 языках: описание (en, de, fr, es, ru, it), 5 скриншотов 1280x800, promo-tile, privacy policy (минимум en + ru)

  > Privacy policy обязательна, даже если данных не собираем — описать что и где хранится локально.

- [ ] **[🟠 High | 1 SP]** Первая публикация и прохождение review (обычно 1–3 дня)

---

## Фаза 4 (после MVP): Pro-фичи и монетизация

> Не делаем сейчас, но архитектурно учитываем. Список здесь, чтобы видеть направление.

- Локальный мок API (перехват через declarativeNetRequest)
- Подмена headers / User-Agent / геолокации
- Расширенная история буфера (без лимита, с тегами)
- Командная синхронизация шаблонов (нужен бэкенд)
- Генераторы тестовых данных по шаблону (фейковые ФИО, карты, адреса)
- Интеграция с Jira/Linear/GitHub для bug-репортов
- Подключение ExtensionPay для платежей

---

## Зависимости

- Фаза 1 (каркас) блокирует все утилиты Фазы 2
- `CodeEditor` (Фаза 1) нужен для JSON, JWT, Regex, Diff — делаем его раньше остальных
- Background service worker (Фаза 1 каркас) нужен для Clipboard History и Screenshot
- Публикация в CWS блокируется иконками и privacy policy из Фазы 3

## Открытые вопросы

- [ ] Проверить доступность имени "DevKit Toolbox" в Chrome Web Store перед стартом
- [ ] Источник переводов: DeepL API / ручной перевод носителями / community? Для MVP — DeepL + ручная вычитка ru
- [ ] Нужен ли отдельный slug для лендинга на GitHub Pages (например, `devkit-toolbox.github.io`) или сойдёт `username.github.io/devkit-toolbox`
