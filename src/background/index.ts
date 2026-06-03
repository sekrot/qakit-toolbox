import { bumpSession, ensureInstallMeta } from '@/storage/telemetry';

const PENDING_ROUTE_KEY = 'pending-route';

/** Maps Chrome command ids to the HashRouter path the side panel should navigate to. */
const COMMAND_ROUTES: Record<string, string> = {
  'open-toolbox': '/',
  'open-json': '/tools/json',
  'open-regex': '/tools/regex',
  'open-screenshot': '/tools/screenshot',
};

chrome.runtime.onInstalled.addListener(async (details) => {
  console.info('[DevKit Toolbox] installed', details.reason);
  const manifest = chrome.runtime.getManifest();
  await ensureInstallMeta(manifest.version);
});

chrome.runtime.onStartup.addListener(() => {
  void bumpSession();
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.windowId !== undefined) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.warn('[DevKit Toolbox] setPanelBehavior failed', err));

chrome.commands.onCommand.addListener(async (command) => {
  console.info('[DevKit Toolbox] command fired:', command);
  const route = COMMAND_ROUTES[command];
  if (!route) {
    console.warn('[DevKit Toolbox] unknown command:', command);
    return;
  }
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.windowId) {
    console.warn('[DevKit Toolbox] no active tab/window for command:', command);
    return;
  }

  // 1. Open the panel first (uses the gesture from the keyboard command).
  //    Wrapped in try/catch because Chrome throws if the panel is already
  //    open OR if the gesture window mismatches — neither should kill the
  //    navigation that follows.
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (e) {
    console.warn('[DevKit Toolbox] sidePanel.open failed:', e);
  }

  // 2. Write the route AFTER the panel is open. If the panel was already
  //    open, its onChanged subscription catches this. If it was just opened,
  //    its mount-time `consume()` reads the value.
  await chrome.storage.local.set({ [PENDING_ROUTE_KEY]: route });

  // 3. Belt-and-suspenders: also broadcast a runtime message in case the
  //    storage write races with the side panel's listener registration.
  //    `sendMessage` rejects when no receiver is listening — that's fine.
  try {
    await chrome.runtime.sendMessage({ type: 'navigate', route });
  } catch {
    // No listener yet (panel still loading). Storage handles the cold path.
  }
});

interface CaptureRequest {
  type: 'capture-visible-tab';
}

chrome.runtime.onMessage.addListener((message: CaptureRequest, _sender, sendResponse) => {
  if (message?.type !== 'capture-visible-tab') return undefined;
  (async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
      if (!tab?.windowId) {
        sendResponse({ ok: false, error: 'No active tab' });
        return;
      }
      if (
        tab.url &&
        /^(chrome|edge|brave|about|chrome-extension|devtools|view-source):/i.test(tab.url)
      ) {
        sendResponse({
          ok: false,
          error:
            'Chrome does not allow capturing internal pages (chrome://, extensions, devtools).',
        });
        return;
      }
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
      sendResponse({ ok: true, dataUrl });
    } catch (e) {
      sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  })();
  return true;
});
