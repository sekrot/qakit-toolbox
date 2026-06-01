# Recording demo GIFs

Drop-in workflow for producing the README demo clips. Stick to it so all
demos have a consistent look and weight.

## Tools

| OS      | Recorder                                    | Notes                                      |
| ------- | ------------------------------------------- | ------------------------------------------ |
| macOS   | [Kap](https://getkap.co/)                   | Free, exports GIF, lets you crop and trim. |
| Windows | [ScreenToGif](https://www.screentogif.com/) | Free, GIF + editing.                       |
| Linux   | [Peek](https://github.com/phw/peek)         | Simple, exports GIF/WebM.                  |

## Parameters

- **Frame rate:** 16 fps (smooth enough, keeps size small)
- **Width:** 800 px (legible on GitHub; halve to 400 px for mobile-friendly README)
- **Length:** 6–10 seconds per demo
- **Mouse cursor:** capture it (so viewers can follow what's clicked)

## Scenes to capture

Each tool has a fixed scenario. Use the same sample data so demos feel
like a coherent suite.

| File                   | Tool              | What to show                                                                                                                   |
| ---------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| `json-demo.gif`        | JSON Formatter    | Paste minified `{"user":{"name":"Ada","age":36},"tags":["engineer","author"]}` → Format → switch to JSONPath → run `$.tags[*]` |
| `jwt-demo.gif`         | JWT Decoder       | Paste a sample JWT (see Header in README) → header / payload / signature panes light up → expiry badge shown                   |
| `encoders-demo.gif`    | Base64 / URL      | Type `Hello, мир 🌍` → Base64 encode → Swap → Decode back to original                                                          |
| `timestamp-demo.gif`   | Unix Timestamp    | Click _Now_ → show ISO + local time in NY timezone                                                                             |
| `uuid-demo.gif`        | UUID Generator    | Switch v4 → v7 → set count to 10 → Copy all                                                                                    |
| `regex-demo.gif`       | Regex Tester      | Pattern `\b\w+@\w+\.\w+\b` against sample text → matches highlight live                                                        |
| `hash-demo.gif`        | Hash Calculator   | Type "hello world" → all four hashes appear instantly                                                                          |
| `diff-demo.gif`        | Text Diff         | Sample before/after → toggle split / unified                                                                                   |
| `clipboard-demo.gif`   | Clipboard History | Copy a few snippets from another tool → switch here → click one to paste                                                       |
| `colorpicker-demo.gif` | Color Picker      | Click "Pick" → grab a colour → all 6 formats appear → pin it                                                                   |
| `screenshot-demo.gif`  | Screenshot        | Capture tab → draw a rectangle and arrow → download                                                                            |

## Post-processing

Optimise with [gifsicle](https://www.lcdf.org/gifsicle/) to keep the
README under 5 MB total:

```bash
gifsicle -O3 --lossy=80 --colors=128 -o out.gif input.gif
```

Drop the optimised files into this directory and they'll be picked up
by the README.
