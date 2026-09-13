# ChainCoder - Complete Setup Guide (Windows)

This guide covers two scenarios:

| Scenario | You are... |
|---|---|
| **Fresh Machine** | Setting up ChainCoder on a brand new Windows laptop for the first time |
| **Existing Machine** | Already set up, just starting the system after a restart |

> **Read the right section for your scenario** to avoid unnecessary steps.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Fresh Machine Setup](#2-fresh-machine-setup)
3. [Daily Startup (Existing Machine)](#3-daily-startup-existing-machine)
4. [Fabric Network Details](#4-fabric-network-details)
5. [Chaincode Deployment (Fresh Network)](#5-chaincode-deployment-fresh-network)
6. [Backend Configuration](#6-backend-configuration)
7. [IPFS Setup](#7-ipfs-setup)
8. [Stopping the System](#8-stopping-the-system)
9. [Troubleshooting](#9-troubleshooting)
10. [Security Notes](#10-security-notes)
11. [Danger Zone](#11-danger-zone)

---

## 1. Prerequisites

Install these tools before doing anything else.

### 1.1 Git

**Used for**: Cloning the repository.

Download: https://git-scm.com/download/win

**Verify**:
```powershell
git --version
# Expected: git version 2.x.x
```

### 1.2 Node.js

**Used for**: Running the backend (Express) and frontend (Vite).

Download: https://nodejs.org/  
Recommended: **LTS version (v20.x or v22.x)**

**Verify**:
```powershell
node --version
# Expected: v20.x.x or v22.x.x

npm --version
# Expected: 10.x.x or higher
```

### 1.3 Docker Desktop

**Used for**: Running all Fabric components (peers, orderers, CAs) in containers.

Download: https://www.docker.com/products/docker-desktop/

After installation:
1. Start Docker Desktop
2. Wait until the system tray icon says "Docker Desktop is running"

**Verify**:
```powershell
docker --version
# Expected: Docker version 24.x.x or later

docker compose version
# Expected: Docker Compose version v2.x.x
```

> Note: This project uses Docker Compose **V2** (plugin syntax: `docker compose`, not `docker-compose`).

### 1.4 Hyperledger Fabric Binaries

**Used for**: CLI operations — packaging chaincode, querying channels, inspecting blocks.

The project uses **Fabric 2.5.x** binaries: `peer`, `configtxgen`, `configtxlator`, `osnadmin`.

#### Recommended: fabric-samples on Desktop

Clone `fabric-samples` next to your ChainCoder folder on the Desktop:

```bash
# Open Git Bash
cd ~/Desktop
git clone https://github.com/hyperledger/fabric-samples.git
cd fabric-samples
curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.5.12 1.5.17 -d -s
```

This downloads Fabric 2.5.12 binaries and Docker images into `fabric-samples/bin/`.

#### Alternative: Add Fabric bin to PATH permanently

If you installed Fabric elsewhere, add its `bin/` directory to your Windows PATH:

```
Control Panel → System → Advanced System Settings → Environment Variables
→ System Variables → Path → Edit → New → C:\path\to\fabric-samples\bin
```

Or set `FABRIC_BIN_PATH` environment variable:

```powershell
$env:FABRIC_BIN_PATH = "C:\path\to\fabric-samples\bin"
```

The setup script (`scripts\setup-windows.ps1`) automatically detects fabric-samples in these locations:
- `%USERPROFILE%\Desktop\fabric-samples\bin`
- `..\fabric-samples\bin` (next to the project)
- `FABRIC_BIN_PATH` environment variable

**Verify**:
```powershell
peer version
# Expected output contains: Version: 2.5.x
```

For Fabric CLI operations (channel queries, chaincode lifecycle), you also need:

```bash
# In Git Bash, from blockchain/sih-network/
export PATH="$PWD/../fabric-samples/bin:$PATH"
export FABRIC_CFG_PATH="$PWD/../fabric-samples/config"
peer version
```

### 1.5 IPFS / Kubo

**Used for**: Storing large documents off-chain; ChainCoder stores document CIDs on the blockchain.

Download Kubo for Windows: https://dist.ipfs.tech/#kubo

1. Download the Windows binary (`.zip`)
2. Extract `ipfs.exe` to `C:\ipfs\`
3. Add `C:\ipfs` to your PATH

**Verify**:
```powershell
ipfs version
# Expected: ipfs version 0.x.x
```

---

## 2. Fresh Machine Setup

**Follow this section if you are setting up ChainCoder for the first time on this computer.**

### 2.1 Clone the Repository

```bash
# Open Git Bash
cd ~/Desktop
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ChainCoder
```

### 2.2 Run the Setup Script

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
```

This script automatically:
- Checks all prerequisites
- Installs `npm` dependencies for `frontend/` and `backend/`
- Creates `backend\.env` from `backend\.env.example`
- Detects whether Fabric organizations already exist
- Initializes IPFS repository if needed

### 2.3 Configure the Backend Environment

Open `backend\.env` in any text editor and set at minimum:

```env
PORT=5000

FABRIC_CHANNEL=sihchannel
FABRIC_CHAINCODE=sih-contract

# BEL peer gateway
BEL_MSP_ID=BELMSP
BEL_PEER_ENDPOINT=localhost:7051
BEL_TLS_SERVER_NAME=peer0.bel.sih26125.local
BEL_MSP_PATH=./fabric/bel/msp
BEL_TLS_CA_PATH=./fabric/bel/tls-ca.pem

# Auditor peer gateway
AUDITOR_MSP_ID=AuditorMSP
AUDITOR_PEER_ENDPOINT=localhost:8051
AUDITOR_TLS_SERVER_NAME=peer0.auditor.sih26125.local
AUDITOR_MSP_PATH=../blockchain/sih-network/.msp-enroll/auditorchanneladmin/msp
AUDITOR_TLS_CA_PATH=../blockchain/sih-network/organizations/peerOrganizations/auditor.sih26125.local/peers/peer0.auditor.sih26125.local/tls/tlscacerts/tls-localhost-8054.pem

# Contractor peer gateway
CONTRACTOR_MSP_ID=ContractorMSP
CONTRACTOR_PEER_ENDPOINT=localhost:9051
CONTRACTOR_TLS_SERVER_NAME=peer0.contractor.sih26125.local
CONTRACTOR_MSP_PATH=../blockchain/sih-network/.msp-enroll/contractorchanneladmin/msp
CONTRACTOR_TLS_CA_PATH=../blockchain/sih-network/organizations/peerOrganizations/contractor.sih26125.local/peers/peer0.contractor.sih26125.local/tls/tlscacerts/tls-localhost-9054.pem

# IMPORTANT: Change this before deployment
JWT_SECRET=change-this-to-a-long-random-secret

IPFS_API_URL=http://127.0.0.1:5001/api/v0
IPFS_GATEWAY_URL=http://127.0.0.1:8080

NODE_ENV=development
```

> **All paths in `.env` are relative to the `backend/` directory.**

### 2.4 Obtain Fabric Identity Material

> ⚠️ **This is the most important step for team members.**

This project uses a **pre-configured Fabric network**. The cryptographic material (MSP keys, TLS certificates, admin identities) was generated by the original developer.

A new team member needs to receive the following directories from the original developer **via a secure channel** (USB, encrypted archive, private file share — NOT through Git):

```
blockchain\sih-network\organizations\        ← Full Fabric MSP/TLS material for all orgs
blockchain\sih-network\.msp-enroll\          ← Enrolled admin identities for channel operations
backend\fabric\bel\                          ← BEL identity used by the backend gateway
```

These contain private keys and must **never** be committed to Git.

**Expected backend identity structure**:
```
backend\fabric\bel\
├── msp\
│   ├── cacerts\
│   ├── keystore\        ← contains the *_sk private key
│   ├── signcerts\       ← contains cert.pem
│   └── config.yaml
└── tls-ca.pem           ← BEL TLS CA certificate
```

### 2.5 Start the Fabric Network

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-network.ps1
```

Verify:
```powershell
docker ps
```

Expected containers: `ca-bel`, `ca-auditor`, `ca-contractor`, `ca-orderer`,
`orderer1.sih26125.local`, `orderer2.sih26125.local`, `orderer3.sih26125.local`,
`peer0.bel.sih26125.local`, `peer0.auditor.sih26125.local`, `peer0.contractor.sih26125.local`

### 2.6 Start IPFS

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-ipfs.ps1
```

### 2.7 Start Backend

```powershell
cd backend
npm run dev
```

Expected output:
```
ChainCoder backend running on port 5000
```

### 2.8 Test Health

```powershell
# In a new terminal from the project root:
powershell -ExecutionPolicy Bypass -File .\scripts\test-network.ps1
```

Or manually:

```powershell
# Backend health
Invoke-RestMethod http://localhost:5000/api/health

# Fabric blockchain test
Invoke-RestMethod http://localhost:5000/api/blockchain/test
```

### 2.9 Start Frontend

```powershell
cd frontend
npm run dev
```

Frontend available at: **http://localhost:5173**

---

## 3. Daily Startup (Existing Machine)

**Follow this section if you already completed the full setup and just need to start the system.**

### Quick Start — 4 Terminals

**Terminal 1 — Fabric network:**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-network.ps1
```

**Terminal 2 — IPFS:**
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-ipfs.ps1
```

**Terminal 3 — Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 4 — Frontend:**
```powershell
cd frontend
npm run dev
```

### After a `git pull`

If `package.json` or `package-lock.json` changed, reinstall dependencies:

```powershell
cd backend; npm install; cd ..
cd frontend; npm install; cd ..
```

---

## 4. Fabric Network Details

### Organizations

| Organization | MSP ID | Peer | Peer Port | CA Port |
|---|---|---|---|---|
| BEL | `BELMSP` | `peer0.bel.sih26125.local` | 7051 | 7054 |
| Auditor | `AuditorMSP` | `peer0.auditor.sih26125.local` | 8051 | 8054 |
| Contractor | `ContractorMSP` | `peer0.contractor.sih26125.local` | 9051 | 9054 |
| Orderer | `OrdererMSP` | — | — | 10054 |

### Channel & Chaincode

| Item | Value |
|---|---|
| Channel | `sihchannel` |
| Chaincode | `sih-contract` |
| Version | `2.4` |

### Orderers (Raft)

| Container | gRPC Port | Admin Port |
|---|---|---|
| `orderer1.sih26125.local` | 7050 | 7053 |
| `orderer2.sih26125.local` | 8050 | 8053 |
| `orderer3.sih26125.local` | 9050 | 9053 |

### Fabric CLI Environment Variables

When running `peer` CLI commands manually, set these variables first:

```bash
# In Git Bash from blockchain/sih-network/

export PATH="$PWD/../fabric-samples/bin:$PATH"
export FABRIC_CFG_PATH="$PWD/../fabric-samples/config"

# For BEL admin operations:
export CORE_PEER_LOCALMSPID="BELMSP"
export CORE_PEER_ADDRESS="localhost:7051"
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_MSPCONFIGPATH="$PWD/.msp-enroll/belchanneladmin/msp"
export CORE_PEER_TLS_ROOTCERT_FILE="$PWD/organizations/peerOrganizations/bel.sih26125.local/peers/peer0.bel.sih26125.local/tls/tlscacerts/tls-localhost-7054.pem"
```

Test:
```bash
peer channel getinfo -c sihchannel
```

---

## 5. Chaincode Deployment (Fresh Network)

> **Only needed if starting a completely fresh Fabric network.**  
> If your network already has `sih-contract` deployed, skip this section.

The chaincode source is at:
```
blockchain\sih-network\chaincode\sih-contract\
```

### 5.1 Package the Chaincode

```bash
# In Git Bash from blockchain/sih-network/
export PATH="$PWD/../fabric-samples/bin:$PATH"
export FABRIC_CFG_PATH="$PWD/../fabric-samples/config"

peer lifecycle chaincode package sih-contract.tar.gz \
  --path chaincode/sih-contract \
  --lang node \
  --label sih-contract_2.4
```

### 5.2 Install on All Peers

Repeat for each organization (BEL, Auditor, Contractor) by setting the appropriate env vars:

```bash
peer lifecycle chaincode install sih-contract.tar.gz
peer lifecycle chaincode queryinstalled
```

Note the **Package ID** output (e.g., `sih-contract_2.4:<HASH>`). It is unique per machine.

### 5.3 Approve for Each Organization

```bash
# Each org must approve with their own Package ID
peer lifecycle chaincode approveformyorg \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer1.sih26125.local \
  --channelID sihchannel \
  --name sih-contract \
  --version 2.4 \
  --sequence 1 \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/sih26125.local/msp/tlscacerts/tls-localhost-10054-OrdererCA.pem" \
  --package-id <PACKAGE_ID_FROM_STEP_5.2>
```

### 5.4 Check Commit Readiness

```bash
peer lifecycle chaincode checkcommitreadiness \
  --channelID sihchannel \
  --name sih-contract \
  --version 2.4 \
  --sequence 1 \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/sih26125.local/msp/tlscacerts/tls-localhost-10054-OrdererCA.pem" \
  --output json
```

All organizations should show `true`.

### 5.5 Commit

```bash
peer lifecycle chaincode commit \
  -o localhost:7050 \
  --ordererTLSHostnameOverride orderer1.sih26125.local \
  --channelID sihchannel \
  --name sih-contract \
  --version 2.4 \
  --sequence 1 \
  --tls \
  --cafile "$PWD/organizations/ordererOrganizations/sih26125.local/msp/tlscacerts/tls-localhost-10054-OrdererCA.pem" \
  --peerAddresses localhost:7051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/bel.sih26125.local/peers/peer0.bel.sih26125.local/tls/tlscacerts/tls-localhost-7054.pem" \
  --peerAddresses localhost:8051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/auditor.sih26125.local/peers/peer0.auditor.sih26125.local/tls/tlscacerts/tls-localhost-8054.pem" \
  --peerAddresses localhost:9051 \
  --tlsRootCertFiles "$PWD/organizations/peerOrganizations/contractor.sih26125.local/peers/peer0.contractor.sih26125.local/tls/tlscacerts/tls-localhost-9054.pem"
```

### 5.6 Verify Deployment

```bash
peer lifecycle chaincode querycommitted \
  --channelID sihchannel \
  --name sih-contract

# Direct chaincode test:
peer chaincode query \
  -C sihchannel \
  -n sih-contract \
  -c '{"function":"test","Args":[]}'
```

---

## 6. Backend Configuration

### Environment Variables Reference

| Variable | Default / Example | Description |
|---|---|---|
| `NODE_ENV` | `development` | Environment mode |
| `PORT` | `5000` | Backend HTTP port |
| `FABRIC_CHANNEL` | `sihchannel` | Fabric channel name |
| `FABRIC_CHAINCODE` | `sih-contract` | Chaincode name |
| `BEL_MSP_ID` | `BELMSP` | BEL organization MSP ID |
| `BEL_PEER_ENDPOINT` | `localhost:7051` | BEL peer gRPC endpoint |
| `BEL_TLS_SERVER_NAME` | `peer0.bel.sih26125.local` | BEL TLS SNI override |
| `BEL_MSP_PATH` | `./fabric/bel/msp` | Path to BEL admin MSP |
| `BEL_TLS_CA_PATH` | `./fabric/bel/tls-ca.pem` | BEL TLS CA cert path |
| `AUDITOR_MSP_ID` | `AuditorMSP` | Auditor MSP ID |
| `AUDITOR_PEER_ENDPOINT` | `localhost:8051` | Auditor peer endpoint |
| `AUDITOR_MSP_PATH` | *(see .env.example)* | Auditor admin MSP path |
| `AUDITOR_TLS_CA_PATH` | *(see .env.example)* | Auditor TLS CA path |
| `CONTRACTOR_MSP_ID` | `ContractorMSP` | Contractor MSP ID |
| `CONTRACTOR_PEER_ENDPOINT` | `localhost:9051` | Contractor peer endpoint |
| `CONTRACTOR_MSP_PATH` | *(see .env.example)* | Contractor admin MSP path |
| `CONTRACTOR_TLS_CA_PATH` | *(see .env.example)* | Contractor TLS CA path |
| `JWT_SECRET` | **change this** | Secret for JWT tokens |
| `IPFS_API_URL` | `http://127.0.0.1:5001/api/v0` | IPFS API address |
| `IPFS_GATEWAY_URL` | `http://127.0.0.1:8080` | IPFS gateway address |
| `DB_URL` | *(empty)* | Reserved for future DB use |

### Path Portability

All MSP and TLS paths in `.env` use paths **relative to the `backend/` directory**.  
The backend resolves them with `path.resolve()` in `src/config/fabric.js`.

The defaults work if:
- BEL identity is at `backend/fabric/bel/` (checked into Git except private keys)
- Auditor/Contractor identities are at `blockchain/sih-network/.msp-enroll/` (not in Git)

Do **not** hardcode machine-specific absolute paths like `C:\Users\<username>\...` in `.env`.

---

## 7. IPFS Setup

### First Time

```powershell
# Initialize IPFS (only once per machine)
ipfs init

# Start daemon
powershell -ExecutionPolicy Bypass -File .\scripts\start-ipfs.ps1
```

### Verify

```powershell
ipfs id
# Should display your local IPFS peer ID

# Check API
Invoke-RestMethod -Uri "http://127.0.0.1:5001/api/v0/id" -Method POST
```

### IPFS API and Gateway

| Endpoint | URL |
|---|---|
| API | http://127.0.0.1:5001/api/v0 |
| Gateway | http://127.0.0.1:8080 |

---

## 8. Stopping the System

### Stop Backend / Frontend

Press `Ctrl+C` in their respective terminals.

### Stop IPFS

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-ipfs.ps1
```

Or press `Ctrl+C` in the IPFS daemon terminal.

### Stop Fabric Network (preserves ledger data)

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\stop-network.ps1
```

This uses `docker compose stop` which preserves all Docker volumes (ledger, CA databases).

---

## 9. Troubleshooting

### Docker containers failing to start

```powershell
# Check container logs
docker logs ca-bel
docker logs peer0.bel.sih26125.local
docker logs orderer1.sih26125.local
```

Common causes:
- **Port conflict**: Check if ports 7050–9054 are in use by another process
- **Missing organization files**: `blockchain\sih-network\organizations\` is missing
- **sih_network not created**: Run `docker network create sih_network`

### Backend fails to connect to Fabric

```
Error: private key not found
```
→ `backend\fabric\bel\msp\keystore\` is missing or empty. Get it from the original developer.

```
Error: ENOENT: no such file or directory, 'fabric/bel/tls-ca.pem'
```
→ `backend\fabric\bel\tls-ca.pem` is missing. Copy from BEL peer TLS CA.

### IPFS daemon won't start

```powershell
# Check if port 5001 is already in use
Get-NetTCPConnection -LocalPort 5001
```

If occupied by another process, kill it or wait for it to close.

### peer command not found

1. Verify `fabric-samples/bin/peer.exe` exists on your Desktop
2. Add it to PATH: `$env:PATH = "C:\Users\<you>\Desktop\fabric-samples\bin;$env:PATH"`
3. Or set `FABRIC_BIN_PATH` before running scripts

### Frontend can't connect to backend

Check `vite.config.js` proxy settings. Backend must be running on port 5000.

---

## 10. Security Notes

### What NOT to commit to Git

The `.gitignore` prevents accidental commits of:

- `backend\.env` — contains JWT secret
- `**/keystore/` — Fabric private keys
- `**/*_sk` — private key files
- `blockchain\sih-network\organizations\` — MSP/TLS material
- `blockchain\sih-network\.msp-enroll\` — enrolled admin identities
- `backend\fabric\` — backend gateway identity

### What IS committed to Git

- Chaincode source: `blockchain\sih-network\chaincode\sih-contract\`
- Docker Compose files: `blockchain\sih-network\docker\`
- Channel configuration: `blockchain\sih-network\configtx\`
- Backend source: `backend\src\`
- Frontend source: `frontend\src\`
- Environment template: `backend\.env.example`

### Transferring Identity Material to Teammates

Share these directories **via secure channel only** (not Git):

```
blockchain\sih-network\organizations\
blockchain\sih-network\.msp-enroll\
backend\fabric\bel\
```

Use an encrypted USB drive, encrypted archive (7-Zip with password), or a private storage service.

---

## 11. Danger Zone

The following commands **destroy Fabric ledger data**. Only run them if you intentionally want a fresh blockchain:

```powershell
# ⛔ DESTROYS ALL LEDGER DATA - use with extreme caution
docker compose -f blockchain\sih-network\docker\docker-compose-peer.yaml down -v
docker compose -f blockchain\sih-network\docker\docker-compose-network.yaml down -v
docker compose -f blockchain\sih-network\docker\docker-compose-ca.yaml down -v
docker volume prune
```

After running these, you will need to:
1. Re-enroll all Fabric identities
2. Recreate the channel
3. Redeploy the chaincode (see Section 5)
4. All existing assets and transactions will be lost

**For the SIH demonstration — do not run these commands on the demo machine.**
