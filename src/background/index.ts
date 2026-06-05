import { bumpSession, ensureInstallMeta } from '@/storage/telemetry';

chrome.runtime.onInstalled.addListener(async (details) => {
  console.info('[QAKit Toolbox] installed', details.reason);
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
  .catch((err) => console.warn('[QAKit Toolbox] setPanelBehavior failed', err));

chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'open-toolbox') return;
  const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
  if (tab?.windowId === undefined) return;
  try {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  } catch (e) {
    console.warn('[QAKit Toolbox] sidePanel.open failed:', e);
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
