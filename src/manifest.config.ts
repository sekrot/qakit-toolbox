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
    default_title: 'DevKit Toolbox',
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
  permissions: [
    'storage',
    'sidePanel',
    'activeTab',
    'scripting',
    'clipboardRead',
    'clipboardWrite',
  ],
  // Required by chrome.tabs.captureVisibleTab() in the Screenshot tool.
  // `activeTab` alone is not enough: it grants permission only at the moment
  // the user clicks the extension's action, and only for the tab that was
  // active then. Switching tabs revokes the grant, breaking screenshots
  // taken from the side panel. <all_urls> here is read-only and only used
  // by captureVisibleTab; we never inject scripts or fetch page contents.
  host_permissions: ['<all_urls>'],
  // Default keyboard shortcuts. Chrome lets the user remap these via
  // chrome://extensions/shortcuts (up to four are user-rebindable per
  // extension). The `open-toolbox` slot mirrors clicking the action icon.
  commands: {
    'open-toolbox': {
      suggested_key: { default: 'Alt+Shift+D', mac: 'Alt+Shift+D' },
      description: 'Open DevKit Toolbox side panel',
    },
    'open-json': {
      suggested_key: { default: 'Alt+Shift+J', mac: 'Alt+Shift+J' },
      description: 'Open JSON Formatter',
    },
    'open-regex': {
      suggested_key: { default: 'Alt+Shift+R', mac: 'Alt+Shift+R' },
      description: 'Open Regex Tester',
    },
    'open-screenshot': {
      suggested_key: { default: 'Alt+Shift+S', mac: 'Alt+Shift+S' },
      description: 'Open Screenshot tool',
    },
  },
  minimum_chrome_version: '114',
});
