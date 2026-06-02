# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Project

**DevKit Toolbox** — Chrome extension (Manifest V3) с набором офлайн-утилит для разработчиков и QA. Side panel UI, 11 утилит в MVP, без сетевых запросов, всё хранение — `chrome.storage.local`.

Полный план задач: [TASKS.md](./TASKS.md). Фазы 0 и 1 завершены; текущая работа — Фаза 2 (реализация утилит).

## Stack

- **Build:** Vite 5 + `@crxjs/vite-plugin` (HMR для MV3)
- **UI:** React 18 + TypeScript (strict) + Tailwind CSS
- **State:** Zustand с persist через `chrome.storage.local`
- **Routing:** react-router-dom v6 (HashRouter — обязательно для extension контекста)
- **i18n:** react-i18next + LanguageDetector, 6 языков (en, de, fr, es, ru, it)
- **Icons:** lucide-react
- **Tests:** Vitest + React Testing Library + jsdom
- **Lint:** ESLint flat config + Prettier + Husky pre-commit (lint-staged)

## Commands

```bash
npm run dev        # Vite dev server (для разработки UI без extension API)
npm run build      # tsc -b && vite build → dist/ (загружать как Unpacked)
npm run typecheck
npm run lint
npm run test
npm run zip        # упаковка dist/ в dist-zip/devkit-toolbox.zip для CWS
```

## Структура

```
src/
  background/        # service worker (MV3 background)
  sidepanel/         # entry side panel: main.tsx, App.tsx, экраны
  components/        # shared UI: Layout, ThemeProvider, ThemeToggle, LanguageSelector, ui/
  components/ui/     # базовые компоненты: Button, Input, Card
  tools/             # утилиты — каждая в своей папке
    registry.tsx     # реестр всех утилит (TOOLS массив)
    <name>/
      index.tsx      # UI компонент (default export)
      logic.ts       # чистые функции (без React)
      logic.test.ts  # юнит-тесты на логику
  storage/           # storage.ts (обёртка над chrome.storage) + store.ts (Zustand)
  i18n/              # index.ts (init) + locales/<lang>/{common,tools,settings}.json
  lib/               # утилиты: cn() для className, license.ts для isPro()
  styles/globals.css # Tailwind + CSS-переменные тем
public/
  _locales/<lang>/messages.json  # name/description для Chrome Web Store
  icons/             # 16/32/48/128 (placeholder — заменить в Фазе 3)
```

## Добавление новой утилиты

1. Создать `src/tools/<id>/index.tsx` с **default export** компонента.
2. (Опц.) `logic.ts` для чистых функций + `logic.test.ts`.
3. Добавить ключи в `src/i18n/locales/en/tools.json`: `<id>.name`, `<id>.description`. Синхронизировать со всеми 5 другими локалями.
4. Зарегистрировать в `src/tools/registry.tsx`:
   ```ts
   const MyTool = lazy(() => import('./<id>'));
   // ...
   { id: '<id>', nameKey: 'tools:<id>.name', descriptionKey: 'tools:<id>.description',
     route: '/tools/<id>', icon: SomeIcon, category: '<cat>', isPro: false, component: MyTool }
   ```
5. Утилита автоматически появится на главном экране и по URL `#/tools/<id>`.

## Соглашения

- **Никаких сетевых запросов** в MVP — всё работает офлайн. Crypto через `crypto.subtle` (или специализированные либы для алгоритмов, которых нет в SubtleCrypto, например MD5).
- **Pro-фичи**: пока `isPro()` всегда `true`. Когда добавим монетизацию — заворачивать Pro-функционал в `if (!isPro()) return <Upsell />`. Поле `isPro` в реестре утилит уже есть.
- **i18n**: никаких хардкод-строк в UI. Всегда `useTranslation(<ns>)` + `t('key')`. Источник истины — `en/`. При добавлении ключа — обновить все 6 локалей (для не-en можно временно скопировать английский).
- **Storage**: писать через `useSettings` (Zustand) или `storage.ts` (низкоуровнево). Не дёргать `chrome.storage` напрямую из компонентов.
- **MV3 ограничения**: side panel — не popup, у него свой жизненный цикл. Background — это service worker, может быть остановлен в любой момент, нельзя хранить state в модульных переменных.

## Permissions в manifest

Текущие пермишены (`src/manifest.config.ts`):

- `permissions`: `storage`, `sidePanel`, `activeTab`, `scripting`, `clipboardRead`, `clipboardWrite`.
- `host_permissions`: `<all_urls>` — единственный способ снимать скриншоты из side panel. `activeTab` теряется при переключении вкладок, а `chrome.tabs.captureVisibleTab` всё равно требует host-доступ к захватываемой странице. Используется только для capture, никаких inject/fetch.

Добавление нового пермишена требует обоснования в Chrome Web Store при ревью.

## Тестирование расширения вручную

```bash
npm run build
# chrome://extensions → "Developer mode" → "Load unpacked" → выбрать dist/
# Клик по иконке в toolbar → откроется side panel
# После изменений: npm run build → кнопка "Reload" на карточке расширения
```

Для HMR во время разработки UI без extension API: `npm run dev` (откроется на http://localhost:5173, но `chrome.*` API будут недоступны).

## Memory

Долгосрочный контекст проекта хранится в `~/.claude/projects/-Users-siargey-krotov-llm-projects-start-up/memory/`. Перед нетривиальной работой загляни в `MEMORY.md` индекс — там фиксируются стратегические решения (стек, монетизация, языки).

## Open questions

- Имя "DevKit Toolbox" — проверить доступность в Chrome Web Store перед публикацией.
- Перевод non-en локалей: пока заглушки (копии en). Делать после стабилизации всех `t()` ключей в Фазе 2.
- Placeholder иконки — заменить на финальный логотип в Фазе 3.
