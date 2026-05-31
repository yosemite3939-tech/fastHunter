$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $PSScriptRoot "native-host\FastHunterNativeHost.cs"
$outputDirectory = Join-Path $root "assets\native-host"
$output = Join-Path $outputDirectory "FastHunterNativeHost.exe"
$compiler = Join-Path $env:WINDIR "Microsoft.NET\Framework64\v4.0.30319\csc.exe"
if (-not (Test-Path -LiteralPath $compiler)) {
  $compiler = Join-Path $env:WINDIR "Microsoft.NET\Framework\v4.0.30319\csc.exe"
}
if (-not (Test-Path -LiteralPath $compiler)) {
  throw "The .NET Framework C# compiler was not found."
}
New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null
& $compiler /nologo /target:exe /optimize+ /reference:System.Web.Extensions.dll /out:$output $source
if ($LASTEXITCODE -ne 0) {
  throw "Native host compilation failed."
}
Write-Host "Built assets/native-host/FastHunterNativeHost.exe"
