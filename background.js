// USD to Sats — context menu extension
// Converts highlighted USD amounts to satoshis using the live BTC price.

const MENU_ID = "convert-usd-to-sats";
const PRICE_API = "https://mempool.space/api/v1/prices";
const PRICE_CACHE_TTL_MS = 60 * 1000; // 60 seconds
const SATS_PER_BTC = 100_000_000;

// ---------- Context menu setup ----------

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "Convert \"%s\" to sats",
    contexts: ["selection"]
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !info.selectionText) return;

  const usd = parseUsdAmount(info.selectionText);
  if (usd === null) {
    notify("USD to Sats", `Could not parse a USD amount from "${truncate(info.selectionText, 40)}"`);
    return;
  }

  try {
    const price = await getBtcPriceUsd();
    const sats = Math.round((usd / price) * SATS_PER_BTC);
    const formatted = formatSats(sats);
    const message = `$${formatUsd(usd)} = ${formatted} sats\n(BTC: $${formatUsd(price)})`;

    notify("USD to Sats", message);
    await copyToClipboard(String(sats), tab?.id);
  } catch (err) {
    notify("USD to Sats", `Error: ${err.message || err}`);
  }
});

// ---------- Helpers ----------

// Parse a string like "$1,234.56", "1234", "1,234.56 USD" into a number.
function parseUsdAmount(text) {
  if (!text) return null;
  // Strip currency symbols, codes, commas, and surrounding whitespace.
  const cleaned = text
    .replace(/USD/gi, "")
    .replace(/[\$,\s]/g, "")
    .trim();
  if (!cleaned) return null;
  const value = parseFloat(cleaned);
  if (!isFinite(value) || value <= 0) return null;
  return value;
}

// Cached BTC/USD price fetch from mempool.space.
async function getBtcPriceUsd() {
  const cached = await chrome.storage.local.get(["btcPrice", "btcPriceTs"]);
  const now = Date.now();
  if (cached.btcPrice && cached.btcPriceTs && now - cached.btcPriceTs < PRICE_CACHE_TTL_MS) {
    return cached.btcPrice;
  }

  const res = await fetch(PRICE_API);
  if (!res.ok) throw new Error(`Price API returned ${res.status}`);
  const data = await res.json();
  const price = data?.USD;
  if (typeof price !== "number" || price <= 0) {
    throw new Error("Unexpected price API response");
  }

  await chrome.storage.local.set({ btcPrice: price, btcPriceTs: now });
  return price;
}

function notify(title, message) {
  chrome.notifications.create({
    type: "basic",
    iconUrl: "icons/icon128.png",
    title,
    message
  });
}

// Copy text to the clipboard via an offscreen-style fallback through the active tab.
async function copyToClipboard(text, tabId) {
  if (!tabId) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (value) => navigator.clipboard.writeText(value),
      args: [text]
    });
  } catch (_e) {
    // Clipboard write may fail on restricted pages (chrome://, store, etc.).
    // Not a hard error — the user still saw the notification.
  }
}

function formatSats(sats) {
  return sats.toLocaleString("en-US");
}

function formatUsd(value) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function truncate(text, max) {
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}
