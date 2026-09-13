# ============================================================
# ChainCoder - Stop IPFS Daemon
# scripts/stop-ipfs.ps1
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\stop-ipfs.ps1
#
# Safely stops the local IPFS daemon by sending the shutdown
# command via the API. Falls back to killing the process if
# the API is unavailable.
# ============================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ChainCoder - Stopping IPFS Daemon" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Locate ipfs executable
# ============================================================

$ipfsExe = $null
$onPath = Get-Command "ipfs" -ErrorAction SilentlyContinue
if ($onPath) {
    $ipfsExe = $onPath.Source
} else {
    $candidates = @(
        "C:\ipfs\ipfs.exe",
        "$env:USERPROFILE\ipfs\ipfs.exe",
        "$env:LOCALAPPDATA\ipfs\ipfs.exe",
        "$env:ProgramFiles\kubo\ipfs.exe"
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            $ipfsExe = $candidate
            break
        }
    }
}

# ============================================================
# Check if daemon is running
# ============================================================

$portInUse = $false
try {
    $conn = (Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue)
    if ($conn) { $portInUse = $true }
} catch {}

if (-not $portInUse) {
    Write-Host "IPFS daemon does not appear to be running (port 5001 is free)." -ForegroundColor Yellow
    Write-Host ""
    exit 0
}

# ============================================================
# Try graceful shutdown via ipfs shutdown command
# ============================================================

if ($ipfsExe) {
    Write-Host "Sending shutdown command to IPFS daemon ..." -ForegroundColor Yellow
    & $ipfsExe shutdown 2>$null
    Start-Sleep -Seconds 2

    # Re-check
    $portInUse2 = $false
    try {
        $conn2 = (Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue)
        if ($conn2) { $portInUse2 = $true }
    } catch {}

    if (-not $portInUse2) {
        Write-Host "IPFS daemon stopped gracefully." -ForegroundColor Green
        Write-Host ""
        exit 0
    }
}

# ============================================================
# Fallback: kill ipfs process
# ============================================================

Write-Host "Graceful shutdown did not complete. Killing ipfs process ..." -ForegroundColor Yellow
$ipfsProcs = Get-Process -Name "ipfs" -ErrorAction SilentlyContinue
if ($ipfsProcs) {
    $ipfsProcs | Stop-Process -Force
    Write-Host "ipfs process killed." -ForegroundColor Green
} else {
    Write-Host "No ipfs process found to kill." -ForegroundColor Yellow
}
Write-Host ""
Write-Host "IPFS daemon stopped." -ForegroundColor Green
Write-Host ""
