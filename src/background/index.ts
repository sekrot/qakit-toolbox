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
