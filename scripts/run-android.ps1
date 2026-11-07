param(
    [string]$AvdName = "Darts_API_30"
)

$ErrorActionPreference = "Stop"
$projectRoot = Split-Path -Parent $PSScriptRoot
$sdkRoot = if ($env:ANDROID_HOME) { $env:ANDROID_HOME } else { Join-Path $env:LOCALAPPDATA "Android\Sdk" }
$adb = Join-Path $sdkRoot "platform-tools\adb.exe"
$emulator = Join-Path $sdkRoot "emulator\emulator.exe"

if (-not (Test-Path -LiteralPath $adb)) { throw "adb was not found: $adb" }
if (-not (Test-Path -LiteralPath $emulator)) { throw "Android Emulator was not found: $emulator" }

Push-Location $projectRoot
try {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        $bundledNode = Join-Path $env:USERPROFILE ".cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
        if (Test-Path -LiteralPath (Join-Path $bundledNode "node.exe")) {
            $env:Path = "$bundledNode;$env:Path"
        }
    }
    $pnpmCommand = Get-Command pnpm -ErrorAction SilentlyContinue
    if ($pnpmCommand) {
        pnpm build
        if ($LASTEXITCODE -ne 0) { throw "The web build failed." }
        pnpm exec cap sync android
        if ($LASTEXITCODE -ne 0) { throw "Capacitor sync failed." }
    } else {
        Write-Warning "pnpm is not on PATH. Using the previously synced web assets."
    }

    & $adb start-server | Out-Null
    $onlineDevice = & $adb devices | Select-String "\sdevice$"
    if (-not $onlineDevice) {
        Write-Host "Starting emulator $AvdName with a cold boot..."
        Start-Process -FilePath $emulator -ArgumentList @(
            "-avd", $AvdName,
            "-no-snapshot-load",
            "-gpu", "swiftshader_indirect",
            "-no-boot-anim"
        )

        $booted = $false
        for ($i = 0; $i -lt 60; $i++) {
            Start-Sleep -Seconds 3
            $deviceLine = & $adb devices | Select-String "emulator-\d+\s+device$" | Select-Object -First 1
            $serial = if ($deviceLine) { $deviceLine.ToString().Split()[0] } else { $null }
            if ($serial -and ((& $adb -s $serial shell getprop sys.boot_completed 2>$null) -eq "1")) {
                $booted = $true
                break
            }
        }
        if (-not $booted) { throw "The emulator did not boot within 180 seconds." }
    }

    $env:ANDROID_HOME = $sdkRoot
    $env:ANDROID_SDK_ROOT = $sdkRoot
    if (-not $env:JAVA_HOME) {
        $androidStudioJdk = "C:\Program Files\Android\Android Studio\jbr"
        if (Test-Path -LiteralPath $androidStudioJdk) { $env:JAVA_HOME = $androidStudioJdk }
    }

    Push-Location (Join-Path $projectRoot "android")
    try {
        .\gradlew.bat installDebug
        if ($LASTEXITCODE -ne 0) { throw "The Android build or install failed." }
    } finally {
        Pop-Location
    }

    & $adb shell am force-stop jp.jpl.ordermaker
    & $adb shell am start -W -n jp.jpl.ordermaker/.MainActivity
    if ($LASTEXITCODE -ne 0) { throw "JPL Order Maker could not be started." }
    Write-Host "JPL Order Maker started successfully."
} finally {
    Pop-Location
}
