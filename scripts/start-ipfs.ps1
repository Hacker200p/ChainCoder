# ============================================================
# ChainCoder - Start IPFS Daemon
# scripts/start-ipfs.ps1
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-ipfs.ps1
#
# This script:
#   1. Locates the ipfs executable
#   2. Checks if a daemon is already running (port 5001)
#   3. Initializes IPFS repo if not yet initialized
#   4. Starts the IPFS daemon in a new window
#
# Does NOT delete existing IPFS repository.
# ============================================================

$ErrorActionPreference = "Continue"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ChainCoder - Starting IPFS Daemon" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Locate ipfs executable
# ============================================================

$ipfsExe = $null

# 1. Check if 'ipfs' is on PATH
$onPath = Get-Command "ipfs" -ErrorAction SilentlyContinue
if ($onPath) {
    $ipfsExe = $onPath.Source
    Write-Host "  Found ipfs in PATH: $ipfsExe" -ForegroundColor Green
} else {
    # 2. Check common Windows installation locations
    $candidates = @(
        "C:\ipfs\ipfs.exe",
        "$env:USERPROFILE\ipfs\ipfs.exe",
        "$env:LOCALAPPDATA\ipfs\ipfs.exe",
        "$env:ProgramFiles\kubo\ipfs.exe"
    )
    foreach ($candidate in $candidates) {
        if (Test-Path $candidate) {
            $ipfsExe = $candidate
            Write-Host "  Found ipfs at: $ipfsExe" -ForegroundColor Green
            break
        }
    }
}

if (-not $ipfsExe) {
    Write-Host "ERROR: ipfs executable not found." -ForegroundColor Red
    Write-Host ""
    Write-Host "Install IPFS Kubo:" -ForegroundColor Yellow
    Write-Host "  1. Download from https://dist.ipfs.tech/#kubo" -ForegroundColor Yellow
    Write-Host "  2. Extract ipfs.exe to C:\ipfs\" -ForegroundColor Yellow
    Write-Host "  3. Add C:\ipfs to your PATH, or" -ForegroundColor Yellow
    Write-Host "  4. Re-run this script" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ============================================================
# Check if daemon is already running (port 5001)
# ============================================================

Write-Host ""
Write-Host "Checking if IPFS daemon is already running ..." -ForegroundColor Yellow

$portInUse = $false
try {
    $conn = (Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue)
    if ($conn) {
        $portInUse = $true
    }
} catch {}

if ($portInUse) {
    Write-Host "  Port 5001 is already in use - IPFS daemon appears to be running." -ForegroundColor Green
    Write-Host "  IPFS API:     http://127.0.0.1:5001/api/v0" -ForegroundColor Gray
    Write-Host "  IPFS Gateway: http://127.0.0.1:8080" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  To verify: & '$ipfsExe' id" -ForegroundColor Gray
    Write-Host ""
    exit 0
}

# ============================================================
# Check / initialize IPFS repository
# ============================================================

$ipfsRepo = "$env:USERPROFILE\.ipfs"
if (-not (Test-Path $ipfsRepo)) {
    Write-Host "  IPFS repository not found at $ipfsRepo" -ForegroundColor Yellow
    Write-Host "  Initializing IPFS repository ..." -ForegroundColor Yellow
    & $ipfsExe init
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: 'ipfs init' failed." -ForegroundColor Red
        exit 1
    }
    Write-Host "  IPFS repository initialized." -ForegroundColor Green
} else {
    Write-Host "  IPFS repository found at: $ipfsRepo" -ForegroundColor Green
}

# ============================================================
# Start the IPFS daemon in a new PowerShell window
# ============================================================

Write-Host ""
Write-Host "Starting IPFS daemon ..." -ForegroundColor Yellow
Write-Host "  A new terminal window will open running the daemon." -ForegroundColor Gray
Write-Host "  Keep that window open while using ChainCoder." -ForegroundColor Gray
Write-Host ""
Write-Host "  IPFS API:     http://127.0.0.1:5001/api/v0" -ForegroundColor Cyan
Write-Host "  IPFS Gateway: http://127.0.0.1:8080" -ForegroundColor Cyan
Write-Host ""

Start-Process powershell -ArgumentList "-NoExit", "-Command", "& '$ipfsExe' daemon"

Write-Host "IPFS daemon started in a new window." -ForegroundColor Green
Write-Host ""
Write-Host "To verify (after ~5 seconds):" -ForegroundColor Gray
Write-Host "  & '$ipfsExe' id" -ForegroundColor Gray
Write-Host ""
