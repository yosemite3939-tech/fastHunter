# Browser Extension

## Scope

The Chrome / Edge Manifest V3 extension is in `apps/browser-extension`. It provides:

- A **Download with FastHunter** context menu on links, video, and audio
- A page URL handoff from the popup
- Desktop host connection status
- An opt-in automatic browser download interception toggle

## Permissions

The extension requests:

- `activeTab` to read the currently selected page URL after popup interaction
- `contextMenus` to add explicit FastHunter actions
- `downloads` for optional automatic interception
- `nativeMessaging` to contact the desktop app
- `storage` to save the automatic-capture preference

It does not request cookies, browsing history, or broad content-script access.

## Development Installation

```powershell
npm.cmd run build:extension
```

Open `chrome://extensions` or `edge://extensions`, enable developer mode, choose **Load unpacked**, and select `apps/browser-extension/dist`.

## Native Host Registration

After installing the desktop app with the NSIS installer and loading the extension, copy its generated extension ID:

```powershell
.\scripts\register-native-host.ps1 `
  -ExePath "C:\Program Files\FastHunter Downloader\FastHunter Downloader.exe" `
  -ExtensionId "YOUR_EXTENSION_ID"
```

This registers `com.fasthunter.downloader` for both Chrome and Edge under `HKCU`.
