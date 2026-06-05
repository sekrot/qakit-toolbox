# QAKit Toolbox — Privacy Policy

**Last updated:** 2026-06-05

QAKit Toolbox is a Chrome extension that bundles offline developer and QA
utilities (JSON, JWT, regex, hashes, timestamps, UUIDs, base64/URL, text
diff, clipboard history, color picker, screenshot annotator).

## TL;DR

**We do not collect, transmit, or sell any personal data. Ever.**

Everything QAKit Toolbox does happens locally on your device. No data is
sent to our servers — we do not even operate any servers.

## What data we handle

The extension only reads and writes data **on your own device** via
`chrome.storage.local`, which is sandboxed to this extension.

| Data                                                | Purpose                         | Stays on    |
| --------------------------------------------------- | ------------------------------- | ----------- |
| Your settings (theme, language, onboarding flag)    | Preserve UI preferences         | Your device |
| Clipboard history you save in the side panel        | The "Clipboard history" tool    | Your device |
| Color picker history                                | The "Color picker" tool         | Your device |
| Locally generated install id and session counter    | Internal local usage stats only | Your device |
| Page screenshots you capture in the Screenshot tool | Annotation and download         | Your device |

We do **not**:

- Send any data to remote servers.
- Use analytics, advertising, or fingerprinting libraries.
- Track your browsing history, tabs, or page contents.
- Read content from web pages (unless you actively press "Capture tab" in
  the Screenshot tool, which uses Chrome's `captureVisibleTab` API to take
  one PNG of the currently visible tab on your request).
- Share data with third parties — there are no third parties involved.

## Permissions we request and why

- **`storage`** — to save your settings and tool history locally.
- **`sidePanel`** — to render the extension UI in Chrome's side panel.
- **`activeTab`** + **`<all_urls>`** (host permission) — only used by
  `chrome.tabs.captureVisibleTab` in the Screenshot tool when you press
  "Capture tab". No scripts are injected into pages, no page contents are
  read or transmitted.
- **`scripting`** — reserved for future on-page tools; currently unused at
  runtime.
- **`clipboardRead`** / **`clipboardWrite`** — to read your clipboard when
  you press "Save clipboard" inside the side panel, and to copy results
  from tools (JSON, hashes, UUIDs, etc.) back to your clipboard.

## Exporting and deleting your data

- **Export** — _Settings → Data → Export settings_ downloads a JSON file
  containing everything we store locally.
- **Delete** — _Settings → Data → Clear all history_ removes clipboard
  and color picker history. Uninstalling the extension removes everything
  Chrome keeps for the extension, including local storage.

## Children

QAKit Toolbox is a developer tool not directed at children under 13. We
do not knowingly collect data from anyone, including children.

## Changes to this policy

If this policy ever changes, the new version will be published at the
same URL with an updated "Last updated" date. Material changes will be
announced in the release notes on the Chrome Web Store listing.

## Contact

Questions or concerns:
**Sergey Krotov** — [siargey.krotov@gmail.com](mailto:siargey.krotov@gmail.com)
