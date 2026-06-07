<div align="center">
  <img src="public/icons/icon-128.png" alt="QAKit Toolbox icon" width="96" height="96"/>

# QAKit Toolbox

**A Chrome side-panel companion for developers and QA engineers.**
Eleven utilities you reach for every day — JSON, JWT, regex, hashes, color picker,
screenshots and more — bundled into one extension and running entirely on your device.

<em>Offline by design · no telemetry · no uploads</em>

<p>
  <a href="https://chromewebstore.google.com/detail/dnpeamdlnodnnmmhpbmeepajpcjjicen">
    <img alt="Chrome Web Store" src="https://img.shields.io/chrome-web-store/v/dnpeamdlnodnnmmhpbmeepajpcjjicen?label=Chrome%20Web%20Store&color=4f46e5" />
  </a>
  <a href="https://chromewebstore.google.com/detail/dnpeamdlnodnnmmhpbmeepajpcjjicen">
    <img alt="Users" src="https://img.shields.io/chrome-web-store/users/dnpeamdlnodnnmmhpbmeepajpcjjicen?color=4f46e5" />
  </a>
  <a href="https://chromewebstore.google.com/detail/dnpeamdlnodnnmmhpbmeepajpcjjicen">
    <img alt="Rating" src="https://img.shields.io/chrome-web-store/rating/dnpeamdlnodnnmmhpbmeepajpcjjicen?color=4f46e5" />
  </a>
</p>

<p>
  <a href="https://chromewebstore.google.com/detail/dnpeamdlnodnnmmhpbmeepajpcjjicen">
    <strong>→ Install from Chrome Web Store</strong>
  </a>
</p>

</div>

---

## See it in action

[![Regex Tester](docs/media/screenshots/01-regex.png)](docs/media/screenshots/01-regex.png)

<p align="center">
  <a href="docs/media/screenshots/02-jwt.png"><img src="docs/media/screenshots/02-jwt.png" width="46%" alt="JWT Decoder" /></a>
  <a href="docs/media/screenshots/03-home.png"><img src="docs/media/screenshots/03-home.png" width="46%" alt="Home — 11 tools by category" /></a>
</p>
<p align="center">
  <a href="docs/media/screenshots/04-screenshot.png"><img src="docs/media/screenshots/04-screenshot.png" width="46%" alt="Screenshot with annotations" /></a>
  <a href="docs/media/screenshots/05-json.png"><img src="docs/media/screenshots/05-json.png" width="46%" alt="JSON Formatter with JSONPath autocomplete" /></a>
</p>

> Live landing page with the same gallery:
> **<https://sekrot.github.io/qakit-toolbox/>**

## Features

<table>
<tr>
<td width="50%" valign="top">

### 🧾 Encoders & decoders

- **JSON Formatter** — format, minify, validate, query with JSONPath
- **JWT Decoder** — inspect headers, claims, expiration
- **Base64 / URL** — round-trip text safely (UTF-8 aware)
- **Unix Timestamp** — convert with timezone + relative time
- **Hash Calculator** — MD5, SHA-1, SHA-256, SHA-512 (text or file)

</td>
<td width="50%" valign="top">

### 🛠️ Builders & testers

- **UUID Generator** — v4, v7 (sortable), NIL, bulk output
- **Regex Tester** — live highlighting, capture groups, cheatsheet
- **Text Diff** — side-by-side / unified, ignore whitespace or case

</td>
</tr>
<tr>
<td width="50%" valign="top">

### 🎨 Design

- **Color Picker** — native screen eyedropper, HEX / RGB / HSL / CMYK, palette history

</td>
<td width="50%" valign="top">

### 🧪 QA helpers

- **Clipboard History** — searchable, pinned items survive cleanup
- **Screenshot + Annotations** — capture the active tab, draw rectangles, arrows, text

</td>
</tr>
</table>

**Languages:** English · Deutsch · Français · Español · Русский · Italiano
&nbsp;&nbsp;**Themes:** light · dark · system

## Quick start

```bash
git clone https://github.com/<you>/devkit-toolbox.git
cd devkit-toolbox
npm install
npm run build
```

Then load the unpacked extension:

1. Open `chrome://extensions`
2. Toggle **Developer mode** (top-right)
3. Click **Load unpacked** and select the `dist/` folder
4. Click the QAKit Toolbox icon in the toolbar — the side panel opens

A four-step onboarding tour runs on first launch.

## Privacy

QAKit Toolbox is **fully offline**. It never makes network requests, never
collects telemetry, never uploads files. Settings and history live in
`chrome.storage.local` and never leave your browser.

| Permission                         | Why it's needed                                                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `storage`                          | Persist your theme, language and tool history locally                                                             |
| `sidePanel`                        | Render the toolbox in Chrome's side panel                                                                         |
| `activeTab` + `scripting`          | Take screenshots and capture clipboard data when you trigger them                                                 |
| `clipboardRead` / `clipboardWrite` | Clipboard history and one-click "Copy" buttons                                                                    |
| `<all_urls>` host access           | Required by `chrome.tabs.captureVisibleTab` for the Screenshot tool. Only used to capture; no page reads/injects. |

No analytics endpoints. The `install_id` generated on first run lives only
in your local storage; we don't have it.

## Development

```bash
npm run dev          # Vite dev server (browser-only iteration)
npm run build        # Production bundle into dist/
npm run typecheck    # tsc -b --noEmit
npm run lint         # ESLint (warnings treated as errors)
npm run test         # Vitest one-shot
npm run i18n:check   # Verify locale key consistency
npm run zip          # Pack dist/ into dist-zip/devkit-toolbox.zip
```

Pre-commit runs `lint-staged` (ESLint + Prettier on staged files).
CI runs lint → typecheck → i18n check → tests → build on every push and PR.
Pushing a tag `v*.*.*` produces a GitHub Release with the packaged ZIP.

## Project structure

```
src/
├── background/      Service worker (side panel open, screenshot, install meta)
├── sidepanel/       App, Home, Settings, Tool, Onboarding screens
├── components/      Layout, ThemeProvider, ThemeToggle, LanguageSelector, ui/*
├── tools/           One folder per utility + registry.tsx
├── storage/         chrome.storage wrapper, Zustand store, backup, telemetry
├── i18n/            react-i18next setup + locales/{en,de,fr,es,ru,it}/
├── lib/             cn(), license placeholder, shared helpers
└── styles/          globals.css with Tailwind layers and theme tokens

public/
├── _locales/        Chrome Web Store-facing localised name/description
└── icons/           Extension icons (16/32/48/128)

scripts/
├── generate_icons.py   Regenerate icons from the geometric source
├── icon-source.svg     Vector reference for the icon design
└── check-i18n.mjs      CI check for missing/extra locale keys
```

Adding a new tool? See the recipe in [CLAUDE.md](./CLAUDE.md).

## Roadmap

- ✅ Phases 0–1: bootstrap, app shell, i18n, theming
- ✅ Phase 2: 11 MVP utilities, 129 unit tests
- 🛠️ Phase 3 (current): icons, onboarding, settings export, telemetry, translations, landing
- 🔮 Phase 4: Pro features (header overrides, mock API, team templates) once monetisation lands

See [TASKS.md](./TASKS.md) for the full task list and status.

## Contributing

Bug reports, ideas and PRs are welcome via GitHub Issues. For translations,
native-speaker review of `src/i18n/locales/<lang>/*.json` is especially
appreciated.

## License

TBD before first public release.
