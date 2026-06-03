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
  const route = COMMAND_ROUTES[command];
  if (!route) return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (!tab?.windowId) return;
  // Queue the target route so the side panel can pick it up on mount or
  // via its chrome.storage subscription if it's already open.
  await chrome.storage.local.set({ [PENDING_ROUTE_KEY]: route });
  await chrome.sidePanel.open({ windowId: tab.windowId });
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
