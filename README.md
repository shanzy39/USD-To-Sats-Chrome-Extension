# USD to Sats

A tiny Chrome/Brave/Edge extension that adds a right-click menu to convert any highlighted USD amount into satoshis using the live Bitcoin price.

## Features

- Right-click any highlighted dollar amount → see the equivalent in sats
- Uses the live BTC/USD price from [mempool.space](https://mempool.space)
- Price is cached for 60 seconds to avoid hammering the API
- Auto-copies the sats value to your clipboard
- Handles common formats: `$1,234.56`, `1234`, `$50 USD`, etc.
- No tracking, no analytics, no remote scripts. ~150 lines of vanilla JS.

## Screenshots

Highlight any dollar amount on a page, right-click, and pick "Convert to sats":

```
$25.00 = 24,096 sats
(BTC: $103,750.00)
```

## Install (developer mode)

1. Clone or download this repository
2. Open `chrome://extensions` (or `brave://extensions`, `edge://extensions`)
3. Toggle on **Developer mode** (top-right)
4. Click **Load unpacked**
5. Select the `usd-to-sats-extension` folder
6. The extension icon appears in your toolbar

## Usage

1. Highlight any USD amount on a webpage — e.g. `$50.00`, `1,234`, `100 USD`
2. Right-click → **Convert "$50.00" to sats**
3. A notification appears with the converted sats value
4. The raw sats number is copied to your clipboard automatically

## How it works

- A Manifest V3 service worker registers a `selection` context menu item.
- When clicked, the selected text is parsed for a dollar amount (strips `$`, `,`, `USD`).
- The BTC/USD price is fetched from `https://mempool.space/api/v1/prices` and cached for 60 seconds via `chrome.storage.local`.
- Sats are calculated as `round((usd / btc_price) * 100_000_000)` and shown via a `chrome.notifications` notification.
- The sats value is copied to the clipboard using `chrome.scripting.executeScript` so it works without an offscreen document.

## Permissions

- `contextMenus` — adds the right-click menu item
- `notifications` — shows the conversion result
- `storage` — caches the BTC price for 60 seconds
- `clipboardWrite` + `scripting` + `activeTab` — copies the sats value to your clipboard
- `https://mempool.space/*` — fetches the live BTC price

## Files

```
usd-to-sats-extension/
├── manifest.json     # Manifest V3 declaration
├── background.js     # Service worker: context menu, price fetch, conversion
├── make_icons.py     # Helper script to regenerate icons (Pillow)
├── icons/            # 16/48/128 px PNG icons
└── README.md
```

## Regenerate icons

If you want to tweak the icon design:

```bash
pip3 install --user Pillow
python3 make_icons.py
```

## License

MIT
