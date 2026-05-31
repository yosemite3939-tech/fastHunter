# Windows Build

## Installer and Portable Executable

Install dependencies, generate icons, and package:

```powershell
npm.cmd install
npm.cmd run package:windows
```

Electron Builder writes an NSIS installer and portable executable under `release/windows/`.

Packaging also compiles the small `FastHunterNativeHost.exe` browser bridge with the Windows .NET Framework C# compiler and bundles it under the app resources directory.

## App Icon

The source icon is `assets/logo/app-icon.svg`. Generate PNG sizes and the Windows `.ico` file with:

```powershell
npm.cmd run icons
```

## Browser Extension ZIP

```powershell
npm.cmd run build:extension
npm.cmd run zip:extension
```

The archive is written to `release/fasthunter-browser-extension.zip`.

## Code Signing

Production distribution should sign both installer and executable with an Authenticode certificate. Electron Builder supports certificate configuration through its documented Windows signing environment variables. Keep signing credentials outside the repository and inject them only in a protected release environment.
