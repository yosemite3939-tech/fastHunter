# Download Engine

## Metadata Probe

Each download begins with a `HEAD` request. FastHunter reads:

- `Content-Length`
- `Accept-Ranges`
- `Content-Type`
- `Content-Disposition`

If the server does not provide useful metadata for `HEAD`, FastHunter sends a small `Range: bytes=0-0` request and inspects the returned headers.

## Segmented Downloads

When a server supports byte ranges and the file size is known, FastHunter divides the file into contiguous chunks. It avoids tiny chunks below roughly 1 MB, caps parallel work at the configured connection count, and issues a request for each byte range.

Each chunk writes to its own `.part` file. The engine persists downloaded byte counts and retries failed chunks independently with exponential backoff.

## Single Stream Fallback

When `Accept-Ranges: bytes` is absent, FastHunter uses one ordinary stream and surfaces that limitation in the activity log. A paused or interrupted non-range stream restarts because the source cannot honor a byte offset safely.

## Pause, Cancel, and Recovery

Pause aborts active fetch requests and preserves chunk files. Resume probes the source again before continuing from saved chunk offsets. Cancel aborts requests and removes temporary files.

On application restart, tasks that were downloading or merging are restored as paused. This prevents unexpected network use and gives the user a clear recovery action.

## Merge and Validation

Completed chunks stream into `<destination>.fasthunter.part` in byte order. FastHunter validates the merged file size against server metadata and renames the temporary file into place only after validation succeeds.

## Failure Cases

The engine reports clear failures for:

- Expired or rejected URLs
- Missing response bodies
- Range responses that do not return HTTP `206`
- Chunks that end early
- Insufficient disk space
- Merged files with an unexpected size
- Disk write and rename errors

## Bandwidth Behavior

Bandwidth is unlimited by default. The optional user-defined limit introduces a cooperative delay after writes. FastHunter never claims to bypass the server, ISP, operating system, network, or storage hardware.
