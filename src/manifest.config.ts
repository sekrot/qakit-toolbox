import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../package.json';

export default defineManifest({
  manifest_version: 3,
  name: '__MSG_extName__',
  description: '__MSG_extDescription__',
  default_locale: 'en',
  version: pkg.version,
  icons: {
    16: 'icons/icon-16.png',
    32: 'icons/icon-32.png',
    48: 'icons/icon-48.png',
    128: 'icons/icon-128.png',
  },
  action: {
    default_title: 'QAKit Toolbox',
    default_icon: {
      16: 'icons/icon-16.png',
      32: 'icons/icon-32.png',
    },
  },
  side_panel: {
    default_path: 'src/sidepanel/index.html',
  },
  background: {
    service_worker: 'src/background/index.ts',
    type: 'module',
  },
  permissions: ['storage', 'sidePanel', 'activeTab', 'clipboardRead', 'clipboardWrite'],
  // Required by chrome.tabs.captureVisibleTab() in the Screenshot tool.
  // `activeTab` alone is not enough: it grants permission only at the moment
  // the user clicks the extension's action, and only for the tab that was
  // active then. Switching tabs revokes the grant, breaking screenshots
  // taken from the side panel. <all_urls> here is read-only and only used
  // by captureVisibleTab; we never inject scripts or fetch page contents.
  host_permissions: ['<all_urls>'],
  // Default keyboard shortcut to open the side panel. Remappable in
  // chrome://extensions/shortcuts. Per-tool shortcuts were removed: Chrome's
  // sidePanel.open() requires a user gesture that's consumed by the first
  // `await` inside a chrome.commands.onCommand listener, which means
  // open-then-navigate flows are unreliable in practice.
  commands: {
    'open-toolbox': {
      suggested_key: { default: 'Alt+Shift+D', mac: 'Alt+Shift+D' },
      description: 'Open QAKit Toolbox side panel',
    },
  },
  minimum_chrome_version: '114',
});
