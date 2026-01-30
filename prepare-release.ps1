# Prepare Release Script
# This script helps prepare files for a GitHub release

param(
    [Parameter(Mandatory=$true)]
    [string]$Version
)

Write-Host "Preparing release for version $Version" -ForegroundColor Cyan
Write-Host ""

# Paths
$nsisPath = "apps\web\src-tauri\target\release\bundle\nsis"
$installer = "$nsisPath\meditrack${Version}_x64-setup.exe"
$signature = "$nsisPath\meditrack_${Version}_x64-setup.exe.sig"

# Check if files exist
if (-not (Test-Path $installer)) {
    Write-Host "Error: Installer not found at $installer" -ForegroundColor Red
    Write-Host "Did you run 'bun run desktop:build'?" -ForegroundColor Yellow
    exit 1
}

if (-not (Test-Path $signature)) {
    Write-Host "Error: Signature not found at $signature" -ForegroundColor Red
    exit 1
}

# Get signature content
$sig = Get-Content $signature -Raw
$sig = $sig.Trim()

Write-Host "✓ Found installer: $installer" -ForegroundColor Green
Write-Host "✓ Found signature: $signature" -ForegroundColor Green
Write-Host ""

# Display signature
Write-Host "Signature for latest.json:" -ForegroundColor Yellow
Write-Host $sig
Write-Host ""

# Create latest.json template
$latestJson = @"
{
  "version": "$Version",
  "notes": "Release $Version",
  "pub_date": "$(Get-Date -Format 'yyyy-MM-ddTHH:mm:ssZ')",
  "platforms": {
    "windows-x86_64": {
      "signature": "$sig",
      "url": "https://github.com/sabry-awad97/meditrack/releases/download/v$Version/meditrack_${Version}_x64-setup.exe"
    }
  }
}
"@

# Save latest.json
$latestJson | Out-File -FilePath "latest.json" -Encoding UTF8 -NoNewline

Write-Host "✓ Created latest.json" -ForegroundColor Green
Write-Host ""

# Summary
Write-Host "Release files ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Files to upload to GitHub:" -ForegroundColor Cyan
Write-Host "  1. $installer"
Write-Host "  2. $signature"
Write-Host "  3. latest.json"
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Go to: https://github.com/sabry-awad97/medi-order/releases/new"
Write-Host "  2. Create tag: v$Version"
Write-Host "  3. Upload the 3 files above"
Write-Host "  4. Publish release"
Write-Host ""
