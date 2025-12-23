@echo off
echo [1/4] 正在编译前端项目 (npm run build)...
call npm run build
if %errorlevel% neq 0 (
    echo [错误] 前端编译失败，请检查错误并重试。
    pause
    exit /b %errorlevel%
)

echo.
echo [2/4] 正在同步到 Android 项目 (npx cap sync)...
call npx cap sync
if %errorlevel% neq 0 (
    echo [错误] Capacitor 同步失败。
    pause
    exit /b %errorlevel%
)

echo.
echo [3/4] 进入 android 目录并清理缓存...
cd android

echo.
echo [4/4] 正在生成 APK (assembleDebug)...
call .\gradlew assembleDebug
if %errorlevel% neq 0 (
    echo [错误] APK 生成失败。
    cd ..
    pause
    exit /b %errorlevel%
)

echo.
echo ==========================================
echo [成功] APK 已生成！
echo 文件位置: android\app\build\outputs\apk\debug\app-debug.apk
echo ==========================================
cd ..
pause
