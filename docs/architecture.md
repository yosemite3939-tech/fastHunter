# Architecture

## Desktop Application

The desktop app uses Electron with a frameless React renderer. The renderer is intentionally isolated from Node.js. `apps/desktop/src/preload/preload.ts` exposes a narrow IPC bridge for download actions, settings, file opening, and folder selection. Context isolation remains enabled and Node integration remains disabled.

The Electron main process owns:

- Application lifecycle and single-instance behavior
- Download engine construction
- IPC request handlers
- Settings persistence
- Native messaging host mode
- Native shell actions such as opening completed files

## Download Engine

`packages/download-engine` is UI-independent. It contains:

- `DownloadEngine`: lifecycle, scheduling, pause / resume, streaming, merge, and progress events
- `DownloadRepository`: SQLite persistence
- `TaskQueue`: simultaneous-download limit
- `probeRemote`: server metadata detection
- Utility functions for names, categories, ranges, chunks, retries, and duplicate destinations

Temporary chunks live below Electron's application data folder. State is committed to SQLite during progress updates. After a restart, in-flight tasks return as paused rather than being silently restarted.

## SQLite State

FastHunter stores downloads in a local SQLite database exported atomically by `sql.js`. Each persisted row includes the source URL, destination, status, byte counts, range support, retry state, chunk metadata, and recent activity log entries.

The SQL schema is deliberately small for the MVP. Chunk and log payloads are JSON columns so recovery is easy to evolve without migration-heavy joins. A later release can normalize these tables if analytics or large histories make that worthwhile.

## Browser Extension and Native Messaging

The extension is a Manifest V3 extension with a service worker and popup. It sends framed JSON messages to `com.fasthunter.downloader`.

Chromium starts the dedicated `FastHunterNativeHost.exe` helper and communicates through length-prefixed JSON on standard input and output. The small Windows helper uses binary streams, validates that enqueue requests contain an HTTP or HTTPS URL, and launches the regular desktop instance with `--add-url`. Electron single-instance routing forwards the URL to the visible app.

## Security Boundaries

- The renderer has no direct file system or process access.
- The extension sends URLs only; it does not request cookie access.
- Automatic browser interception is disabled until the user enables it.
- Network activity is visible in the desktop app.
- FastHunter performs ordinary authenticated-or-public HTTP requests only. It does not bypass DRM or content controls.
