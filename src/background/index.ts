chrome.runtime.onInstalled.addListener(() => {
  console.info('[DevKit Toolbox] installed');
});

chrome.action.onClicked.addListener(async (tab) => {
  if (tab.windowId !== undefined) {
    await chrome.sidePanel.open({ windowId: tab.windowId });
  }
});

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.warn('[DevKit Toolbox] setPanelBehavior failed', err));

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
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
      sendResponse({ ok: true, dataUrl });
    } catch (e) {
      sendResponse({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  })();
  return true;
});
