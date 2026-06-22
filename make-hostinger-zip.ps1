$ErrorActionPreference = "Stop"

Write-Host "Tee Time Social deployment builder" -ForegroundColor Green

if (!(Test-Path "package.json")) {
  Write-Host "Run this from your project root, for example C:\teetimesocial" -ForegroundColor Red
  exit 1
}

Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install

Write-Host "Building production files..." -ForegroundColor Cyan
npm run build

if (!(Test-Path "dist")) {
  Write-Host "Build failed: dist folder was not created." -ForegroundColor Red
  exit 1
}

$deployFolder = "hostinger-deploy"
$zipFile = "teetimesocial-hostinger-deploy.zip"

if (Test-Path $deployFolder) {
  Remove-Item $deployFolder -Recurse -Force
}

if (Test-Path $zipFile) {
  Remove-Item $zipFile -Force
}

New-Item -ItemType Directory -Path $deployFolder | Out-Null

Copy-Item "dist" "$deployFolder\dist" -Recurse
Copy-Item "server.js" "$deployFolder\server.js"
Copy-Item "package.json" "$deployFolder\package.json"

if (Test-Path "package-lock.json") {
  Copy-Item "package-lock.json" "$deployFolder\package-lock.json"
}

Compress-Archive -Path "$deployFolder\*" -DestinationPath $zipFile -Force

Write-Host ""
Write-Host "Created $zipFile" -ForegroundColor Green
Write-Host ""
Write-Host "Upload this ZIP to Hostinger Node.js app." -ForegroundColor Yellow
Write-Host "ZIP root should contain: dist, server.js, package.json, package-lock.json" -ForegroundColor Yellow
