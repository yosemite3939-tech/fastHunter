# Manual QA Checklist

## Desktop Downloads

- [ ] Download a small file from a server with byte ranges
- [ ] Download a multi-gigabyte file and observe multiple segments
- [ ] Download from a server without byte ranges and confirm the single-stream message
- [ ] Pause and resume a segmented download
- [ ] Pause a single-stream download and confirm restart behavior
- [ ] Kill the app during transfer, reopen it, and resume the recovered paused task
- [ ] Retry a failed or expired download URL
- [ ] Queue more downloads than the configured simultaneous limit
- [ ] Download the same filename twice and confirm duplicate naming
- [ ] Open a completed file and reveal it in its folder

## Browser Integration

- [ ] Build and load the unpacked extension in Chrome
- [ ] Register the native host using the extension ID
- [ ] Confirm the popup reports desktop connection status
- [ ] Send the active page URL to the app
- [ ] Use **Download with FastHunter** from a downloadable link context menu
- [ ] Enable automatic capture explicitly, start a browser download, and confirm handoff
- [ ] Disable automatic capture and confirm browser downloads proceed normally

## Packaging

- [ ] Generate PNG and ICO assets
- [ ] Build the extension folder and ZIP
- [ ] Build the NSIS installer
- [ ] Build and run the portable executable
