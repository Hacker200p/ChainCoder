# ChainCoder – SIH 2026

A blockchain-based document management and access-control system built with **Hyperledger Fabric 2.5**, **IPFS (Kubo)**, **Node.js / Express**, and **React + Vite**.

---

## Architecture

```
Frontend (React + Vite)  ←→  Backend (Node.js / Express :5000)
                                      ↓
                          Hyperledger Fabric (sihchannel)
                          ├── BEL Peer        (port 7051)
                          ├── Auditor Peer    (port 8051)
                          └── Contractor Peer (port 9051)
                                      ↓
                          IPFS Kubo daemon (port 5001 / 8080)
```

### Fabric Network

| Component | Container | Port |
|---|---|---|
| BEL CA | ca-bel | 7054 |
| Auditor CA | ca-auditor | 8054 |
| Contractor CA | ca-contractor | 9054 |
| Orderer CA | ca-orderer | 10054 |
| Orderer 1 | orderer1.sih26125.local | 7050 / 7053 |
| Orderer 2 | orderer2.sih26125.local | 8050 / 8053 |
| Orderer 3 | orderer3.sih26125.local | 9050 / 9053 |
| BEL Peer | peer0.bel.sih26125.local | 7051 |
| Auditor Peer | peer0.auditor.sih26125.local | 8051 |
| Contractor Peer | peer0.contractor.sih26125.local | 9051 |

- **Channel**: `sihchannel`  
- **Chaincode**: `sih-contract` (version 2.4)

---

## Prerequisites

| Tool | Version | Verify |
|---|---|---|
| Git | any | `git --version` |
| Node.js | 20.x or 22.x LTS | `node --version` |
| npm | ≥ 10 | `npm --version` |
| Docker Desktop | any recent | `docker --version` |
| Docker Compose | V2 plugin | `docker compose version` |
| Fabric binaries | 2.5.x | `peer version` |
| IPFS / Kubo | any recent | `ipfs version` |

See **[SETUP.md](./SETUP.md)** for full installation instructions for each prerequisite.

---

## Quick Start

> **Already have prerequisites installed?** Follow these steps.  
> **Fresh machine?** See [SETUP.md](./SETUP.md) for full setup instructions.

### 1 – Clone the repository

```powershell
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd ChainCoder
```

### 2 – Run the setup script

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\setup-windows.ps1
```

This will:
- Check prerequisites
- Install `npm` dependencies for frontend and backend
- Create `backend\.env` from `backend\.env.example` (if it doesn't exist)
- Verify Fabric network files and IPFS

### 3 – Start the Fabric network

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-network.ps1
```

### 4 – Start IPFS

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\start-ipfs.ps1
```

### 5 – Start the backend (Terminal 1)

```powershell
cd backend
npm run dev
```

Backend will be available at: **http://localhost:5000**

### 6 – Start the frontend (Terminal 2)

```powershell
cd frontend
npm run dev
```

Frontend will be available at: **http://localhost:5173**

---

## Daily Startup (Already Set Up Machine)

After the initial setup, you only need:

```powershell
# Terminal 1 – start Fabric
powershell -ExecutionPolicy Bypass -File .\scripts\start-network.ps1

# Terminal 2 – start IPFS
powershell -ExecutionPolicy Bypass -File .\scripts\start-ipfs.ps1

# Terminal 3 – start backend
cd backend; npm run dev

# Terminal 4 – start frontend
cd frontend; npm run dev
```

---

## Health Check

```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\test-network.ps1
```

Expected output:

```
  [PASS] Docker
  [PASS] BEL Certificate Authority (ca-bel)
  [PASS] Auditor Certificate Authority (ca-auditor)
  [PASS] Contractor Certificate Authority (ca-contractor)
  [PASS] Orderer Certificate Authority (ca-orderer)
  [PASS] Orderer 1 (Raft)
  [PASS] Orderer 2 (Raft)
  [PASS] Orderer 3 (Raft)
  [PASS] BEL Peer
  [PASS] Auditor Peer
  [PASS] Contractor Peer
  [PASS] IPFS API
  [PASS] Backend health
  [PASS] Blockchain test
```

---

## Stop the Network

```powershell
# Stop Fabric (preserves ledger data)
powershell -ExecutionPolicy Bypass -File .\scripts\stop-network.ps1

# Stop IPFS
powershell -ExecutionPolicy Bypass -File .\scripts\stop-ipfs.ps1
```

> ⚠️ **Never** run `docker compose down -v` or `docker volume prune` unless you intentionally want to destroy the Fabric ledger.

---

## Available Scripts

| Script | Purpose |
|---|---|
| `scripts\setup-windows.ps1` | One-time developer setup |
| `scripts\start-network.ps1` | Start Fabric CAs + orderers + peers |
| `scripts\stop-network.ps1` | Stop Fabric (data preserved) |
| `scripts\start-ipfs.ps1` | Start IPFS daemon |
| `scripts\stop-ipfs.ps1` | Stop IPFS daemon |
| `scripts\test-network.ps1` | Health check all components |

---

## API Endpoints

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Backend health check |
| `/api/blockchain/test` | GET | Fabric chaincode connectivity test |
| `/api/auth/*` | POST | Authentication |
| `/api/assets/*` | GET/POST | Asset management |
| `/api/identities/*` | GET/POST | Identity management |
| `/api/access/*` | GET/POST | Access control |
| `/api/audit/*` | GET | Audit logs |

---

## Project Structure

```
ChainCoder/
├── backend/
│   ├── src/
│   │   ├── app.js              # Express app entry point
│   │   ├── config/fabric.js    # Fabric gateway configuration
│   │   ├── controllers/        # Route controllers
│   │   ├── routes/             # Express routes
│   │   └── services/           # Business logic
│   ├── fabric/bel/             # BEL identity for backend gateway
│   │   ├── msp/               # BEL MSP (signcerts, keystore, cacerts)
│   │   └── tls-ca.pem         # BEL TLS CA certificate
│   ├── .env.example           # Environment template
│   └── package.json
│
├── frontend/
│   ├── src/                   # React components
│   ├── vite.config.js
│   └── package.json
│
├── blockchain/sih-network/
│   ├── chaincode/sih-contract/ # Smart contract source
│   ├── configtx/              # Channel configuration
│   ├── docker/                # Docker Compose files
│   └── organizations/         # Fabric MSP/TLS material
│
├── scripts/                   # Developer utility scripts
├── SETUP.md                   # Full setup guide
└── README.md
```

---

## Environment Configuration

Copy `backend\.env.example` to `backend\.env` and configure:

```env
PORT=5000
FABRIC_CHANNEL=sihchannel
FABRIC_CHAINCODE=sih-contract

BEL_MSP_ID=BELMSP
BEL_PEER_ENDPOINT=localhost:7051
BEL_MSP_PATH=./fabric/bel/msp
BEL_TLS_CA_PATH=./fabric/bel/tls-ca.pem

JWT_SECRET=<your-secret>

IPFS_API_URL=http://127.0.0.1:5001/api/v0
IPFS_GATEWAY_URL=http://127.0.0.1:8080
```

---

## Full Setup Guide

For complete step-by-step instructions including:
- Installing all prerequisites
- Fresh machine setup
- Fabric identity enrollment
- Chaincode deployment on a fresh network

See **[SETUP.md](./SETUP.md)**.

---

## Important Security Notes

- **Never commit** `backend\.env` or any file containing real private keys
- **Never commit** MSP keystore material (`*_sk` files)
- Change `JWT_SECRET` before any real deployment
- The `.gitignore` is configured to prevent accidental commits of secrets
