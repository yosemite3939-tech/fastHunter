param(
  [Parameter(Mandatory = $true)]
  [string]$ExePath,
  [Parameter(Mandatory = $true)]
  [string]$ExtensionId
)

$resolvedExe = (Resolve-Path -LiteralPath $ExePath).Path
$nativeHost = Join-Path (Split-Path -Parent $resolvedExe) "resources\native-host\FastHunterNativeHost.exe"
if (-not (Test-Path -LiteralPath $nativeHost)) {
  throw "Native messaging helper not found at $nativeHost"
}
$hostDirectory = Join-Path $env:LOCALAPPDATA "FastHunter Downloader"
$manifestPath = Join-Path $hostDirectory "com.fasthunter.downloader.json"
New-Item -ItemType Directory -Force -Path $hostDirectory | Out-Null

$manifest = @{
  name = "com.fasthunter.downloader"
  description = "FastHunter Downloader browser bridge"
  path = $nativeHost
  type = "stdio"
  allowed_origins = @("chrome-extension://$ExtensionId/")
} | ConvertTo-Json -Depth 4
Set-Content -LiteralPath $manifestPath -Value $manifest -Encoding UTF8

$registryTargets = @(
  "HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.fasthunter.downloader",
  "HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.fasthunter.downloader"
)
foreach ($target in $registryTargets) {
  New-Item -Force -Path $target | Out-Null
  Set-Item -LiteralPath $target -Value $manifestPath
}

Write-Host "Registered FastHunter native messaging host for Chrome and Edge."
Write-Host "Manifest: $manifestPath"
