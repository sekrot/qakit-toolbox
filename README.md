# DevKit Toolbox

A Chrome extension toolbox of offline utilities for developers and QA engineers.

## Status

Phase 0 (bootstrap) complete. Tools coming in Phase 2 — see [TASKS.md](./TASKS.md).

## Stack

- Chrome Manifest V3 (side panel)
- React 18 + TypeScript + Vite (`@crxjs/vite-plugin`)
- Tailwind CSS
- Vitest + React Testing Library
- ESLint + Prettier + Husky

## Development

```bash
npm install
npm run dev       # Vite dev server with HMR
npm run build     # Production build into dist/
npm run typecheck
npm run lint
npm run test
```

## Loading the extension in Chrome

1. `npm run build`
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the `dist/` folder
5. Click the DevKit Toolbox icon to open the side panel

## i18n

Supported UI languages: English (default), German, French, Spanish, Russian, Italian.
Store-facing strings live under `public/_locales/<lang>/messages.json`.
In-app strings will use `react-i18next` (see Phase 1 in TASKS.md).
