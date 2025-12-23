# Android Build & Sync Script (PowerShell)

Write-Host "[1/4] Building Frontend (npm run build)..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) { 
    Write-Host "[Error] Frontend build failed." -ForegroundColor Red
    exit $LASTEXITCODE 
}

Write-Host "`n[2/4] Syncing to Android (npx cap sync)..." -ForegroundColor Cyan
npx cap sync
if ($LASTEXITCODE -ne 0) { 
    Write-Host "[Error] Capacitor sync failed." -ForegroundColor Red
    exit $LASTEXITCODE 
}

Write-Host "`n[3/4] Navigating to android directory..." -ForegroundColor Cyan
Set-Location android

Write-Host "`n[4/4] Generating APK (assembleDebug)..." -ForegroundColor Cyan
.\gradlew assembleDebug
if ($LASTEXITCODE -ne 0) { 
    Write-Host "[Error] APK generation failed." -ForegroundColor Red
    Set-Location ..
    exit $LASTEXITCODE 
}

Write-Host "`n==========================================" -ForegroundColor Green
Write-Host "[Success] APK Generated Successfully!" -ForegroundColor Green
Write-Host "Location: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor Green
Write-Host "==========================================" -ForegroundColor Green

Set-Location ..
Read-Host "Press Enter to exit..."
