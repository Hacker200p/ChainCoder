# ============================================================
# ChainCoder - Windows Setup Script
# scripts/setup-windows.ps1
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
#
# This script:
#   1. Verifies all required prerequisites exist
#   2. Checks Docker Desktop is running
#   3. Installs frontend & backend npm dependencies
#   4. Creates backend/.env from .env.example (never overwrites)
#   5. Checks Fabric organizations directory exists
#   6. Checks IPFS is available
#   7. Prints next steps
#
# IMPORTANT: This script never destroys existing Fabric state.
# ============================================================

$ErrorActionPreference = "Stop"

# Move to the project root (parent of scripts/)
$ProjectRoot = Split-Path -Parent $PSScriptRoot
Set-Location $ProjectRoot

Write-Host ""
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  ChainCoder - Windows Developer Setup" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# Helper functions
# ============================================================

function Check-Command {
    param(
        [string]$Command,
        [string]$Description,
        [string]$InstallHint
    )
    Write-Host -NoNewline "  Checking $Description ... "
    $result = Get-Command $Command -ErrorAction SilentlyContinue
    if ($result) {
        $version = ""
        try {
            if ($Command -eq "docker") {
                $version = (docker --version 2>$null) -replace "Docker version ", ""
            } elseif ($Command -eq "node") {
                $version = (node --version 2>$null)
            } elseif ($Command -eq "npm") {
                $version = (npm --version 2>$null)
            } elseif ($Command -eq "git") {
                $version = (git --version 2>$null) -replace "git version ", ""
            } elseif ($Command -eq "ipfs") {
                $version = (ipfs version 2>$null)
            } elseif ($Command -eq "peer") {
                $version = "found"
            }
        } catch {}
        Write-Host "OK  $version" -ForegroundColor Green
        return $true
    } else {
        Write-Host "MISSING" -ForegroundColor Red
        Write-Host "    --> $InstallHint" -ForegroundColor Yellow
        return $false
    }
}

function Check-DockerCompose {
    Write-Host -NoNewline "  Checking docker compose (plugin) ... "
    $result = docker compose version 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "OK  $result" -ForegroundColor Green
        return $true
    } else {
        Write-Host "MISSING" -ForegroundColor Red
        Write-Host "    --> Install Docker Desktop (includes Compose plugin)" -ForegroundColor Yellow
        return $false
    }
}

function Invoke-Npm {
    param([Parameter(ValueFromRemainingArguments = $true)][string[]]$Arguments)
    $npmCmd = Get-Command "npm.cmd" -ErrorAction SilentlyContinue
    if ($npmCmd) {
        & $npmCmd.Source @Arguments
    } else {
        npm @Arguments
    }
}

# ============================================================
# STEP 1 - Check Prerequisites
# ============================================================

Write-Host "STEP 1 - Checking prerequisites" -ForegroundColor Yellow
Write-Host ""

$allOk = $true

$allOk = (Check-Command "git"    "Git"    "https://git-scm.com/download/win") -and $allOk
$allOk = (Check-Command "node"   "Node.js" "https://nodejs.org/  (LTS recommended - v20 or v22)") -and $allOk
$allOk = (Check-Command "npm"    "npm"    "Comes with Node.js") -and $allOk
$allOk = (Check-Command "docker" "Docker" "https://www.docker.com/products/docker-desktop/") -and $allOk

# docker compose (V2 plugin)
$allOk = (Check-DockerCompose) -and $allOk

# Fabric peer binary - check PATH or FABRIC_BIN_PATH env
Write-Host -NoNewline "  Checking Fabric peer binary ... "
$peerCmd = Get-Command "peer" -ErrorAction SilentlyContinue
if (-not $peerCmd) {
    # Check FABRIC_BIN_PATH if set
    if ($env:FABRIC_BIN_PATH) {
        $peerPath = Join-Path $env:FABRIC_BIN_PATH "peer"
        if (Test-Path "$peerPath" -or (Test-Path "$peerPath.exe")) {
            Write-Host "OK  (via FABRIC_BIN_PATH)" -ForegroundColor Green
            $env:PATH = "$env:FABRIC_BIN_PATH;$env:PATH"
            $peerCmd = $true
        }
    }
    if (-not $peerCmd) {
        # Check fabric-samples next to project root or on Desktop
        $desktopPath = [System.Environment]::GetFolderPath("Desktop")
        $candidates = @(
            (Join-Path $desktopPath "fabric-samples\bin"),
            (Join-Path $ProjectRoot "..\fabric-samples\bin"),
            (Join-Path $ProjectRoot "blockchain\fabric-samples\bin")
        )
        $found = $false
        foreach ($candidate in $candidates) {
            if (Test-Path (Join-Path $candidate "peer.exe")) {
                Write-Host "OK  ($candidate)" -ForegroundColor Green
                $env:PATH = "$candidate;$env:PATH"
                $found = $true
                break
            }
        }
        if (-not $found) {
            Write-Host "NOT FOUND" -ForegroundColor Red
            Write-Host "    --> Fabric peer binary not found in PATH or FABRIC_BIN_PATH." -ForegroundColor Yellow
            Write-Host "    --> Option A: Add Fabric bin directory to PATH permanently" -ForegroundColor Yellow
            Write-Host "    --> Option B: Set FABRIC_BIN_PATH=C:\path\to\fabric-samples\bin" -ForegroundColor Yellow
            Write-Host "    --> Option C: Clone fabric-samples next to ChainCoder on your Desktop:" -ForegroundColor Yellow
            Write-Host "         git clone https://github.com/hyperledger/fabric-samples.git" -ForegroundColor Yellow
            Write-Host "         Then run: curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.12 1.5.17 -d -s" -ForegroundColor Yellow
            $allOk = $false
        }
    }
} else {
    $peerVer = (peer version 2>$null | Select-String "Version:" | Select-Object -First 1).ToString().Trim()
    Write-Host "OK  $peerVer" -ForegroundColor Green
}

# IPFS - optional but documented
Write-Host -NoNewline "  Checking IPFS (Kubo) ... "
$ipfsCmd = Get-Command "ipfs" -ErrorAction SilentlyContinue
if (-not $ipfsCmd) {
    # Try common Windows locations
    $ipfsCandidates = @("C:\ipfs\ipfs.exe", "$env:USERPROFILE\ipfs\ipfs.exe", "$env:LOCALAPPDATA\ipfs\ipfs.exe")
    $ipfsFound = $false
    foreach ($candidate in $ipfsCandidates) {
        if (Test-Path $candidate) {
            $ipfsFound = $true
            Write-Host "OK  ($candidate)" -ForegroundColor Green
            $ipfsDir = Split-Path $candidate -Parent
            $env:PATH = "$ipfsDir;$env:PATH"
            break
        }
    }
    if (-not $ipfsFound) {
        Write-Host "NOT FOUND (IPFS will not work)" -ForegroundColor Yellow
        Write-Host "    --> Download Kubo from https://dist.ipfs.tech/#kubo" -ForegroundColor Yellow
        Write-Host "    --> Extract ipfs.exe to C:\ipfs\ and add to PATH" -ForegroundColor Yellow
        Write-Host "    --> IPFS is required for document upload/download features" -ForegroundColor Yellow
        # IPFS missing is a warning, not a hard failure for setup
    }
} else {
    $ipfsVer = (ipfs version 2>$null)
    Write-Host "OK  $ipfsVer" -ForegroundColor Green
}

Write-Host ""

if (-not $allOk) {
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host "  Some prerequisites are MISSING. Install them and re-run." -ForegroundColor Red
    Write-Host "============================================================" -ForegroundColor Red
    Write-Host ""
    exit 1
}

# ============================================================
# STEP 2 - Check Docker is running
# ============================================================

Write-Host "STEP 2 - Checking Docker Desktop is running" -ForegroundColor Yellow
Write-Host ""

Write-Host -NoNewline "  docker ps ... "
$dockerPs = docker ps 2>&1
if ($LASTEXITCODE -ne 0) {
    Write-Host "FAILED" -ForegroundColor Red
    Write-Host "  Docker Desktop is NOT running. Please start Docker Desktop and wait" -ForegroundColor Red
    Write-Host "  until it shows 'Docker Desktop is running', then re-run this script." -ForegroundColor Red
    Write-Host ""
    exit 1
}
Write-Host "OK" -ForegroundColor Green
Write-Host ""

# ============================================================
# STEP 3 - Install frontend dependencies
# ============================================================

Write-Host "STEP 3 - Installing frontend dependencies" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "frontend\package.json")) {
    Write-Host "  ERROR: frontend\package.json not found. Is this the ChainCoder root?" -ForegroundColor Red
    exit 1
}

Write-Host "  Running: npm install in frontend/" -ForegroundColor Gray
Push-Location frontend
Invoke-Npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: npm install failed in frontend/" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "  Frontend dependencies installed." -ForegroundColor Green
Write-Host ""

# ============================================================
# STEP 4 - Install backend dependencies
# ============================================================

Write-Host "STEP 4 - Installing backend dependencies" -ForegroundColor Yellow
Write-Host ""

if (-not (Test-Path "backend\package.json")) {
    Write-Host "  ERROR: backend\package.json not found." -ForegroundColor Red
    exit 1
}

Write-Host "  Running: npm install in backend/" -ForegroundColor Gray
Push-Location backend
Invoke-Npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: npm install failed in backend/" -ForegroundColor Red
    Pop-Location
    exit 1
}
Pop-Location
Write-Host "  Backend dependencies installed." -ForegroundColor Green
Write-Host ""

# ============================================================
# STEP 5 - Create backend/.env from .env.example
# ============================================================

Write-Host "STEP 5 - Configuring backend environment" -ForegroundColor Yellow
Write-Host ""

$envFile    = "backend\.env"
$envExample = "backend\.env.example"

if (Test-Path $envFile) {
    Write-Host "  backend\.env already exists - NOT overwriting." -ForegroundColor Green
    Write-Host "  (Edit it manually if you need to update values.)" -ForegroundColor Gray
} else {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Host "  Created backend\.env from backend\.env.example" -ForegroundColor Green
        Write-Host ""
        Write-Host "  IMPORTANT: Open backend\.env and set:" -ForegroundColor Yellow
        Write-Host "    - JWT_SECRET  (use a long random string)" -ForegroundColor Yellow
        Write-Host "    - BEL_MSP_PATH / BEL_TLS_CA_PATH if paths differ" -ForegroundColor Yellow
    } else {
        Write-Host "  WARNING: backend\.env.example not found. Cannot create .env." -ForegroundColor Yellow
        Write-Host "  Create backend\.env manually based on SETUP.md." -ForegroundColor Yellow
    }
}
Write-Host ""

# ============================================================
# STEP 6 - Check Fabric network directory
# ============================================================

Write-Host "STEP 6 - Checking Fabric network directory" -ForegroundColor Yellow
Write-Host ""

$networkDir = "blockchain\sih-network"
$orgDir     = "$networkDir\organizations"
$dockerDir  = "$networkDir\docker"

if (-not (Test-Path $networkDir)) {
    Write-Host "  ERROR: $networkDir not found." -ForegroundColor Red
    exit 1
}
Write-Host "  blockchain\sih-network ... OK" -ForegroundColor Green

if (Test-Path (Join-Path $dockerDir "docker-compose-ca.yaml")) {
    Write-Host "  docker-compose-ca.yaml ... OK" -ForegroundColor Green
} else {
    Write-Host "  WARNING: docker-compose-ca.yaml not found in $dockerDir" -ForegroundColor Yellow
}
if (Test-Path (Join-Path $dockerDir "docker-compose-network.yaml")) {
    Write-Host "  docker-compose-network.yaml ... OK" -ForegroundColor Green
} else {
    Write-Host "  WARNING: docker-compose-network.yaml not found in $dockerDir" -ForegroundColor Yellow
}
if (Test-Path (Join-Path $dockerDir "docker-compose-peer.yaml")) {
    Write-Host "  docker-compose-peer.yaml ... OK" -ForegroundColor Green
} else {
    Write-Host "  WARNING: docker-compose-peer.yaml not found in $dockerDir" -ForegroundColor Yellow
}

# Detect whether this is a fresh machine (no organizations directory)
if (Test-Path $orgDir) {
    Write-Host ""
    Write-Host "  Existing Fabric organizations detected at: $orgDir" -ForegroundColor Green
    Write-Host "  This looks like an existing environment - skipping Fabric initialization." -ForegroundColor Green
    Write-Host "  To start the network run:" -ForegroundColor Gray
    Write-Host "    powershell -ExecutionPolicy Bypass -File .\scripts\start-network.ps1" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "  *** FRESH MACHINE DETECTED ***" -ForegroundColor Yellow
    Write-Host "  The Fabric organizations directory is missing: $orgDir" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  This project uses a pre-configured Fabric network." -ForegroundColor Yellow
    Write-Host "  A fresh developer machine needs the complete network artifacts from the" -ForegroundColor Yellow
    Write-Host "  original developer (private keys, MSP material, TLS certificates)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  These cannot be regenerated automatically without recreating the" -ForegroundColor Yellow
    Write-Host "  entire blockchain (which would lose all existing ledger data)." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  >>> Manual action required <<<" -ForegroundColor Red
    Write-Host "  See SETUP.md section 'Fresh Machine Setup' for detailed instructions." -ForegroundColor Yellow
    Write-Host "  Contact the original developer to transfer:" -ForegroundColor Yellow
    Write-Host "    blockchain\sih-network\organizations\  (MSP/TLS material)" -ForegroundColor Yellow
    Write-Host "    blockchain\sih-network\.msp-enroll\    (enrolled admin identities)" -ForegroundColor Yellow
    Write-Host "    backend\fabric\bel\                    (backend BEL identity)" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================
# STEP 7 - Check backend Fabric identity
# ============================================================

Write-Host "STEP 7 - Checking backend BEL identity" -ForegroundColor Yellow
Write-Host ""

$belMsp    = "backend\fabric\bel\msp"
$belTlsCa  = "backend\fabric\bel\tls-ca.pem"

if (Test-Path $belMsp) {
    Write-Host "  backend\fabric\bel\msp ... OK" -ForegroundColor Green
} else {
    Write-Host "  MISSING: backend\fabric\bel\msp" -ForegroundColor Red
    Write-Host "  The backend cannot connect to Fabric without the BEL identity." -ForegroundColor Yellow
    Write-Host "  See SETUP.md - 'Backend Fabric Identity' section." -ForegroundColor Yellow
}

if (Test-Path $belTlsCa) {
    Write-Host "  backend\fabric\bel\tls-ca.pem ... OK" -ForegroundColor Green
} else {
    Write-Host "  MISSING: backend\fabric\bel\tls-ca.pem" -ForegroundColor Red
    Write-Host "  Copy this from the BEL peer TLS CA to backend\fabric\bel\tls-ca.pem" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================
# STEP 8 - Check IPFS repo
# ============================================================

Write-Host "STEP 8 - Checking IPFS repository" -ForegroundColor Yellow
Write-Host ""

$ipfsRepo = "$env:USERPROFILE\.ipfs"
$ipfsCmd2 = Get-Command "ipfs" -ErrorAction SilentlyContinue
if ($ipfsCmd2) {
    if (Test-Path $ipfsRepo) {
        Write-Host "  IPFS repository found at: $ipfsRepo" -ForegroundColor Green
        Write-Host "  No initialization needed." -ForegroundColor Gray
    } else {
        Write-Host "  IPFS repository not found. Initializing..." -ForegroundColor Yellow
        ipfs init
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  IPFS initialized successfully." -ForegroundColor Green
        } else {
            Write-Host "  WARNING: IPFS initialization failed. Run 'ipfs init' manually." -ForegroundColor Yellow
        }
    }
} else {
    Write-Host "  IPFS not found in PATH - skipping IPFS repo check." -ForegroundColor Yellow
    Write-Host "  Install IPFS and run: ipfs init" -ForegroundColor Yellow
}
Write-Host ""

# ============================================================
# Done
# ============================================================

Write-Host "============================================================" -ForegroundColor Green
Write-Host "  ChainCoder setup complete." -ForegroundColor Green
Write-Host "============================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "  1. Start Fabric network:" -ForegroundColor White
Write-Host "     powershell -ExecutionPolicy Bypass -File .\scripts\start-network.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "  2. Start IPFS:" -ForegroundColor White
Write-Host "     powershell -ExecutionPolicy Bypass -File .\scripts\start-ipfs.ps1" -ForegroundColor Gray
Write-Host ""
Write-Host "  3. Start backend (in a new terminal):" -ForegroundColor White
Write-Host "     cd backend ; npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  4. Start frontend (in another terminal):" -ForegroundColor White
Write-Host "     cd frontend ; npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "  5. Run health check:" -ForegroundColor White
Write-Host "     powershell -ExecutionPolicy Bypass -File .\scripts\test-network.ps1" -ForegroundColor Gray
Write-Host ""
