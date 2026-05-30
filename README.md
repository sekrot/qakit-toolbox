# DevKit Toolbox

> A Chrome extension toolbox of offline utilities for developers and QA engineers.

DevKit Toolbox lives in the side panel of your browser and bundles the small utilities you reach for every day — JSON formatter, JWT decoder, regex tester, hash calculator, color picker, screenshot annotator and more. Everything runs locally; no data ever leaves your machine.

## Features (MVP)

| #   | Tool                                              | Category   |
| --- | ------------------------------------------------- | ---------- |
| 1   | JSON Formatter / Validator / JSONPath             | Encoders   |
| 2   | JWT Decoder                                       | Encoders   |
| 3   | Base64 / URL Encode-Decode                        | Encoders   |
| 4   | Unix Timestamp ↔ Date                             | Encoders   |
| 5   | UUID Generator (v4 / v7 / NIL)                    | Generators |
| 6   | Regex Tester                                      | Testers    |
| 7   | Hash Calculator (MD5 / SHA-1 / SHA-256 / SHA-512) | Encoders   |
| 8   | Text Diff                                         | Testers    |
| 9   | Clipboard History                                 | QA Tools   |
| 10  | Color Picker (Eyedropper)                         | Design     |
| 11  | Screenshot with Annotations                       | QA Tools   |

**Languages:** English, Deutsch, Français, Español, Русский, Italiano.

**Themes:** light · dark · system.

## Status

Phases 0 (bootstrap) and 1 (app shell, routing, i18n, theming) are complete. Tool implementations land in Phase 2 — see [TASKS.md](./TASKS.md) for the full backlog.

## Stack

- Chrome Manifest V3 (side panel + service worker)
- React 18 · TypeScript (strict) · Vite (`@crxjs/vite-plugin`)
- Tailwind CSS · CSS-variable theme tokens
- Zustand (persisted to `chrome.storage.local`)
- react-router-dom v6 (HashRouter)
- react-i18next · i18next-browser-languagedetector
- Vitest · React Testing Library
- ESLint flat config · Prettier · Husky · lint-staged

## Quick start

```bash
npm install
npm run build
```

Then load the extension:

1. Open `chrome://extensions`
2. Toggle **Developer mode** (top-right)
3. Click **Load unpacked** and select the `dist/` folder
4. Click the DevKit Toolbox icon in the toolbar — the side panel opens

## Development

```bash
npm run dev         # Vite dev server (UI iteration without extension APIs)
npm run build       # Production bundle into dist/
npm run typecheck   # tsc -b --noEmit
npm run lint        # ESLint (warnings = errors)
npm run test        # Vitest one-shot
npm run test:watch
npm run format
npm run zip         # Pack dist/ into dist-zip/devkit-toolbox.zip
```

Pre-commit runs `lint-staged` (ESLint + Prettier on staged files).
CI runs lint → typecheck → test → build on every push and PR.
Pushing a tag `v*.*.*` produces a GitHub Release with the packaged ZIP.

## Project structure

```
src/
├── background/      Service worker (opens side panel on action click)
├── sidepanel/       Side panel entry (App, HomeScreen, SettingsScreen, ToolScreen)
├── components/      Layout, ThemeProvider, ThemeToggle, LanguageSelector, ui/*
├── tools/           One folder per utility + registry.tsx
├── storage/         chrome.storage wrapper + Zustand settings store
├── i18n/            react-i18next setup + locales/{en,de,fr,es,ru,it}/
├── lib/             cn(), license placeholder, shared helpers
└── styles/          globals.css with Tailwind layers and theme tokens

public/
├── _locales/        Chrome Web Store-facing localised name/description
└── icons/           Extension icons (16/32/48/128 — placeholders for now)
```

See [CLAUDE.md](./CLAUDE.md) for conventions and instructions on adding a new tool.

## Privacy

DevKit Toolbox is fully offline. It does not collect telemetry, does not phone home, and does not transmit your data anywhere. Settings and history are persisted only in your browser's local storage and never leave the device.

Required permissions and why:

| Permission                         | Reason                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------ |
| `storage`                          | Save your theme, language and tool history locally                             |
| `sidePanel`                        | Render the toolbox in Chrome's side panel                                      |
| `activeTab` + `scripting`          | Capture clipboard events and take screenshots when you explicitly trigger them |
| `clipboardRead` / `clipboardWrite` | Clipboard History tool and one-click "Copy" buttons                            |

## Contributing

The project is in early development; contributions, ideas and bug reports are welcome via GitHub Issues.

## License

TBD (will be added before the first public release).
