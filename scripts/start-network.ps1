# ============================================================
# ChainCoder - Start Fabric Network
# scripts/start-network.ps1
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\start-network.ps1
#
# Starts the existing Fabric network in the correct order:
#   1. CA containers
#   2. Orderer containers
#   3. Peer containers
#
# IMPORTANT:
#   - Never uses "docker compose down -v"
#   - Never deletes volumes or ledger data
#   - Safe to re-run on an already-running network
# ============================================================

$ErrorActionPreference = "Stop"

$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

$NetworkDir = Join-Path $ProjectRoot "blockchain\sih-network"
$DockerDir  = Join-Path $NetworkDir "docker"

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ChainCoder - Starting Fabric Network" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Check Docker is running
# ============================================================

Write-Host "Checking Docker ..." -ForegroundColor Yellow
$dockerPs = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker is not running. Start Docker Desktop first." -ForegroundColor Red
    exit 1
}
Write-Host "Docker is running." -ForegroundColor Green
Write-Host ""

# ============================================================
# Check compose files exist
# ============================================================

$caFile      = Join-Path $DockerDir "docker-compose-ca.yaml"
$networkFile = Join-Path $DockerDir "docker-compose-network.yaml"
$peerFile    = Join-Path $DockerDir "docker-compose-peer.yaml"

foreach ($f in @($caFile, $networkFile, $peerFile)) {
    if (-not (Test-Path $f)) {
        Write-Host "ERROR: Compose file not found: $f" -ForegroundColor Red
        exit 1
    }
}

# ============================================================
# Check the sih_network Docker network exists
# (docker-compose-network.yaml and docker-compose-peer.yaml expect it as external)
# ============================================================

Write-Host "Ensuring sih_network Docker network exists ..." -ForegroundColor Yellow
$netExists = docker network ls --filter name=sih_network --format "{{.Name}}" 2>$null
if ($netExists -notmatch "sih_network") {
    Write-Host "  Creating Docker network: sih_network" -ForegroundColor Gray
    docker network create sih_network
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to create sih_network Docker network." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "  sih_network already exists." -ForegroundColor Green
}
Write-Host ""

# ============================================================
# STEP 1: Start Certificate Authorities
# ============================================================

Write-Host "STEP 1 - Starting Fabric Certificate Authorities ..." -ForegroundColor Yellow
Push-Location $NetworkDir
docker compose -f docker/docker-compose-ca.yaml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start CA containers." -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "CAs started." -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 3

# ============================================================
# STEP 2: Start Orderers
# ============================================================

Write-Host "STEP 2 - Starting Orderers ..." -ForegroundColor Yellow
Push-Location $NetworkDir
docker compose -f docker/docker-compose-network.yaml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start orderer containers." -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "Orderers started." -ForegroundColor Green
Write-Host ""

Start-Sleep -Seconds 3

# ============================================================
# STEP 3: Start Peers
# ============================================================

Write-Host "STEP 3 - Starting Peers ..." -ForegroundColor Yellow
Push-Location $NetworkDir
docker compose -f docker/docker-compose-peer.yaml up -d
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start peer containers." -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "Peers started." -ForegroundColor Green
Write-Host ""

# ============================================================
# Wait for containers to stabilize
# ============================================================

Write-Host "Waiting for containers to stabilize (5s) ..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# ============================================================
# Show running containers
# ============================================================

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Running containers:" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
docker ps --format "table {{.Names}}`t{{.Status}}`t{{.Ports}}"
Write-Host ""

# ============================================================
# Quick verification
# ============================================================

Write-Host "Verifying expected containers ..." -ForegroundColor Yellow
Write-Host ""

$running = docker ps --format "{{.Names}}" 2>$null

$expected = @(
    "ca-bel",
    "ca-auditor",
    "ca-contractor",
    "ca-orderer",
    "orderer1.sih26125.local",
    "orderer2.sih26125.local",
    "orderer3.sih26125.local",
    "peer0.bel.sih26125.local",
    "peer0.auditor.sih26125.local",
    "peer0.contractor.sih26125.local"
)

$allRunning = $true
foreach ($container in $expected) {
    if ($running -match [regex]::Escape($container)) {
        Write-Host "  [OK] $container" -ForegroundColor Green
    } else {
        Write-Host "  [!!] $container - NOT running" -ForegroundColor Yellow
        $allRunning = $false
    }
}

Write-Host ""

if ($allRunning) {
    Write-Host "============================================================" -ForegroundColor Green
    Write-Host "  All Fabric containers are running." -ForegroundColor Green
    Write-Host "============================================================" -ForegroundColor Green
} else {
    Write-Host "============================================================" -ForegroundColor Yellow
    Write-Host "  Some containers are not running." -ForegroundColor Yellow
    Write-Host "  Check logs with: docker logs <container-name>" -ForegroundColor Yellow
    Write-Host "  Common issues:" -ForegroundColor Yellow
    Write-Host "    - Missing organizations/ directory (need Fabric identities)" -ForegroundColor Yellow
    Write-Host "    - Port conflicts (check if ports 7050-9054 are in use)" -ForegroundColor Yellow
    Write-Host "    - Docker networking issue (try restarting Docker Desktop)" -ForegroundColor Yellow
    Write-Host "============================================================" -ForegroundColor Yellow
}
Write-Host ""
