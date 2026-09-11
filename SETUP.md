Below is the **full detailed `SETUP.md`** you can put in your ChainCoder repository. It is written for a **new Windows laptop**, with commands in the exact order.

````markdown
# ChainCoder – Complete Blockchain + Backend Setup

This document explains how to set up the ChainCoder project from scratch on a new Windows laptop.

The setup includes:

- Hyperledger Fabric
- Fabric Certificate Authorities
- BEL Organization
- Auditor Organization
- Contractor Organization
- 3 Raft Orderers
- `sihchannel`
- `sih-contract` chaincode
- IPFS Kubo
- Node.js backend
- REST APIs

---

# 1. System Architecture

ChainCoder uses the following architecture:

```text
                         CHAINCODER
                             |
                +------------+------------+
                |                         |
             FRONTEND                   BACKEND
              React                   Node.js
                |                         |
                +------------+------------+
                             |
                    Hyperledger Fabric
                             |
          +------------------+------------------+
          |                  |                  |
         BEL              Auditor          Contractor
         Peer               Peer              Peer
          |                  |                  |
          +------------------+------------------+
                             |
                        sihchannel
                             |
                       sih-contract
                             |
                    +--------+--------+
                    |        |        |
                Orderer1 Orderer2 Orderer3
                    \        |        /
                         Raft
````

Large documents are stored in IPFS.

The blockchain stores:

* Asset ID
* Document hash
* IPFS CID
* Ownership
* Identity information
* Access information
* Transaction information

---

# 2. Important Folder Structure

After setup, the project should look approximately like this:

```text
Desktop/
│
├── ChainCoder/
│   │
│   ├── backend/
│   │
│   ├── frontend/
│   │
│   └── blockchain/
│       └── sih-network/
│
└── fabric-samples/
```

The `fabric-samples` directory is required because it provides the Fabric CLI binaries.

---

# 3. Software Required

Install these programs first.

## Required

1. Git
2. Docker Desktop
3. Node.js
4. VS Code
5. Hyperledger Fabric binaries
6. Fabric Samples
7. IPFS Kubo

---

# 4. Install Git

Install Git for Windows.

After installation open:

```text
Git Bash
```

Run:

```bash
git --version
```

Expected:

```text
git version 2.x.x
```

If Git shows a version, installation is successful.

---

# 5. Install Docker Desktop

Install Docker Desktop for Windows.

Start Docker Desktop.

Wait until Docker shows:

```text
Docker Desktop is running
```

Open Git Bash and run:

```bash
docker --version
```

Then:

```bash
docker compose version
```

Both commands should return version information.

---

# 6. Install Node.js

Install Node.js.

Recommended version:

```text
Node.js 24.x
```

Open Git Bash:

```bash
node -v
```

Then:

```bash
npm -v
```

Expected:

```text
v24.x.x
```

and an npm version.

---

# 7. Clone ChainCoder

Open Git Bash.

Go to Desktop:

```bash
cd ~/Desktop
```

Clone the repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Enter the project:

```bash
cd ChainCoder
```

Check the files:

```bash
ls
```

You should see something similar to:

```text
backend
frontend
blockchain
.gitignore
README.md
```

---

# 8. Clone Fabric Samples

Go back to Desktop:

```bash
cd ~/Desktop
```

Clone Fabric Samples:

```bash
git clone https://github.com/hyperledger/fabric-samples.git
```

Now check:

```bash
ls
```

You should have:

```text
ChainCoder
fabric-samples
```

---

# 9. Check Fabric Binaries

Go to the ChainCoder Fabric network:

```bash
cd ~/Desktop/ChainCoder/blockchain/sih-network
```

Check the peer binary:

```bash
../fabric-samples/bin/peer version
```

If the folder structure is correct, it should display a Fabric version.

The project uses Fabric 2.5.x.

---

# 10. Configure Fabric CLI

From:

```bash
~/Desktop/ChainCoder/blockchain/sih-network
```

run:

```bash
export PATH="$PWD/../fabric-samples/bin:$PATH"
```

Then:

```bash
export FABRIC_CFG_PATH="$PWD/../fabric-samples/config"
```

Check:

```bash
peer version
```

If the command works, Fabric CLI is ready.

---

# 11. Check Docker Before Starting Fabric

Run:

```bash
docker ps
```

Docker should respond without an error.

If Docker is not running, start Docker Desktop first.

---

# 12. Go to the Fabric Network

Run:

```bash
cd ~/Desktop/ChainCoder/blockchain/sih-network
```

Check the files:

```bash
ls
```

You should see directories such as:

```text
chaincode
docker
organizations
scripts
```

Check Docker files:

```bash
ls docker
```

You should have:

```text
docker-compose-ca.yaml
docker-compose-network.yaml
docker-compose-peer.yaml
```

---

# 13. Start Fabric Certificate Authorities

The first component to start is the Fabric CA.

Run:

```bash
docker compose -f docker/docker-compose-ca.yaml up -d
```

Wait a few seconds.

Check:

```bash
docker ps
```

You should see the CA containers.

The network has:

```text
BEL CA
Auditor CA
Contractor CA
Orderer CA
```

---

# 14. Check CA Containers

Run:

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

The containers should have status similar to:

```text
Up ...
```

If any container is restarting repeatedly, check its logs:

```bash
docker logs <container-name>
```

---

# 15. Start the Orderer Network

Start the three Raft orderers:

```bash
docker compose -f docker/docker-compose-network.yaml up -d
```

Check:

```bash
docker ps
```

The orderers are:

```text
orderer1
orderer2
orderer3
```

They use Raft consensus.

---

# 16. Start the Peer Network

Run:

```bash
docker compose -f docker/docker-compose-peer.yaml up -d
```

Check:

```bash
docker ps
```

You should see:

```text
peer0.bel.sih26125.local
peer0.auditor.sih26125.local
peer0.contractor.sih26125.local
```

---

# 17. Complete Fabric Network

At this point the Fabric containers should include:

```text
Certificate Authorities
        |
        +-- BEL CA
        +-- Auditor CA
        +-- Contractor CA
        +-- Orderer CA

Orderers
        |
        +-- Orderer 1
        +-- Orderer 2
        +-- Orderer 3

Peers
        |
        +-- BEL Peer
        +-- Auditor Peer
        +-- Contractor Peer
```

Run:

```bash
docker ps
```

and confirm that all required containers are running.

---

# 18. Fabric Organizations

## BEL

MSP ID:

```text
BELMSP
```

Peer:

```text
peer0.bel.sih26125.local
```

Peer port:

```text
7051
```

CA port:

```text
7054
```

---

## Auditor

MSP ID:

```text
AuditorMSP
```

Peer:

```text
peer0.auditor.sih26125.local
```

Peer port:

```text
8051
```

CA port:

```text
8054
```

---

## Contractor

MSP ID:

```text
ContractorMSP
```

Peer:

```text
peer0.contractor.sih26125.local
```

Peer port:

```text
9051
```

CA port:

```text
9054
```

---

# 19. Channel

ChainCoder uses:

```text
sihchannel
```

All three organizations participate in this channel:

```text
BEL
Auditor
Contractor
```

The channel should already be configured by the project network scripts/configuration.

---

# 20. Configure BEL Fabric CLI

Fabric lifecycle commands require an administrative identity.

Go to:

```bash
cd ~/Desktop/ChainCoder/blockchain/sih-network
```

Set:

```bash
export CORE_PEER_LOCALMSPID="BELMSP"
```

Set peer:

```bash
export CORE_PEER_ADDRESS="localhost:7051"
```

Enable TLS:

```bash
export CORE_PEER_TLS_ENABLED=true
```

Set BEL administrative MSP:

```bash
export CORE_PEER_MSPCONFIGPATH="$PWD/.msp-enroll/belchanneladmin/msp"
```

Set BEL peer TLS certificate:

```bash
export CORE_PEER_TLS_ROOTCERT_FILE="$PWD/organizations/peerOrganizations/bel.sih26125.local/peers/peer0.bel.sih26125.local/tls/tlscacerts/tls-localhost-7054.pem"
```

---

# 21. Test BEL Administrative Identity

Run:

```bash
peer channel getinfo -c sihchannel
```

If the command returns channel information, the identity and peer configuration are working.

If you receive:

```text
identity is not an admin
```

check that:

```text
.msp-enroll/belchanneladmin/msp
```

contains the correct administrative identity.

Do not use the peer container's own MSP as the lifecycle administrator.

---

# 22. Chaincode Location

The ChainCoder chaincode is located at:

```text
blockchain/sih-network/chaincode/sih-contract/
```

Main contract:

```text
blockchain/sih-network/chaincode/sih-contract/lib/sihContract.js
```

---

# 23. Chaincode Functions

The smart contract contains functions such as:

```text
RegisterIdentity
GetIdentity
RevokeIdentity

GrantAccess
CheckAccess
RevokeAccess

MintAsset
GetAsset
TransferAsset

UpdateAssetDocument
```

---

# 24. Check Chaincode Package

The chaincode package used by the project is:

```text
sih-contract
```

The deployed lifecycle version may differ from the package.json application version.

Do not change the chaincode lifecycle version manually unless you are intentionally upgrading the chaincode.

---

# 25. Deploy Chaincode on a Fresh Network

If this is a completely new Fabric network, the chaincode needs to be deployed.

First:

```bash
cd ~/Desktop/ChainCoder/blockchain/sih-network
```

Make sure Fabric CLI is configured:

```bash
peer version
```

Then package the chaincode:

```bash
peer lifecycle chaincode package sih-contract.tar.gz \
  --path chaincode/sih-contract \
  --lang node \
  --label sih-contract_2.4
```

Check:

```bash
ls
```

You should see:

```text
sih-contract.tar.gz
```

---

# 26. Install Chaincode

Install the package on the BEL peer.

Use:

```bash
peer lifecycle chaincode install sih-contract.tar.gz
```

Then:

```bash
peer lifecycle chaincode queryinstalled
```

The output will contain a package ID similar to:

```text
sih-contract_2.4:<PACKAGE_ID>
```

IMPORTANT:

Use the actual package ID returned by Fabric.

Do not copy an old package ID from another laptop.

---

# 27. Install Chaincode on Other Organizations

The same chaincode package must be installed on:

```text
BEL Peer
Auditor Peer
Contractor Peer
```

For each organization:

1. Configure that organization's MSP.
2. Configure its peer address.
3. Configure its TLS certificate.
4. Run:

```bash
peer lifecycle chaincode install sih-contract.tar.gz
```

5. Verify:

```bash
peer lifecycle chaincode queryinstalled
```

---

# 28. Approve Chaincode

After installation, each organization must approve the chaincode definition.

The approval uses:

```text
Channel:
sihchannel

Chaincode:
sih-contract

Version:
2.4

Sequence:
<current sequence>
```

The exact command depends on the current channel configuration and package ID.

Use the package ID returned by:

```bash
peer lifecycle chaincode queryinstalled
```

Do not reuse a package ID from another machine.

---

# 29. Commit Chaincode

After all required organizations approve the chaincode definition, commit it to:

```text
sihchannel
```

Then verify:

```bash
peer lifecycle chaincode querycommitted \
  --channelID sihchannel \
  --name sih-contract
```

You should see the committed chaincode definition.

---

# 30. Verify Chaincode Directly

After deployment, test:

```bash
peer chaincode query \
  -C sihchannel \
  -n sih-contract \
  -c '{"function":"test","Args":[]}'
```

The contract should return its test message.

---

# 31. Install IPFS

ChainCoder uses IPFS for large document storage.

Install Kubo for Windows.

Recommended project environment:

```text
Kubo v0.43.x
```

Place the executable at:

```text
C:\ipfs\ipfs.exe
```

---

# 32. Verify IPFS

Open PowerShell:

```powershell
C:\ipfs\ipfs.exe version
```

You should see the Kubo version.

---

# 33. Initialize IPFS

Run:

```powershell
C:\ipfs\ipfs.exe init
```

This creates the local IPFS repository.

You only need to initialize IPFS once.

---

# 34. Start IPFS

Run:

```powershell
C:\ipfs\ipfs.exe daemon
```

Keep this terminal open.

The IPFS API is:

```text
http://127.0.0.1:5001/api/v0
```

The IPFS gateway is:

```text
http://127.0.0.1:8080
```

---

# 35. Test IPFS

Open another PowerShell window.

Run:

```powershell
C:\ipfs\ipfs.exe id
```

If IPFS is running, it should display the local peer ID.

---

# 36. Backend Setup

Open a new Git Bash terminal.

Go to:

```bash
cd ~/Desktop/ChainCoder/backend
```

Install Node.js dependencies:

```bash
npm install
```

Wait until installation completes.

---

# 37. Backend Environment File

Create:

```text
backend/.env
```

Use:

```env
PORT=5000

FABRIC_CHANNEL=sihchannel
FABRIC_CHAINCODE=sih-contract

BEL_MSP_ID=BELMSP
BEL_PEER_ENDPOINT=localhost:7051

BEL_MSP_PATH=./fabric/bel/msp
BEL_TLS_CA_PATH=./fabric/bel/tls-ca.pem

JWT_SECRET=chaincoder-development-secret

IPFS_API_URL=http://127.0.0.1:5001/api/v0
IPFS_GATEWAY_URL=http://127.0.0.1:8080

NODE_ENV=development
```

---

# 38. Backend Fabric Files

The backend requires the BEL Fabric identity.

Check:

```bash
ls fabric/bel
```

You should have the required MSP and TLS certificate files.

Expected:

```text
fabric/
└── bel/
    ├── msp/
    └── tls-ca.pem
```

The MSP must contain the required Fabric identity information.

---

# 39. Start Backend

From:

```bash
~/Desktop/ChainCoder/backend
```

run:

```bash
npm run dev
```

The backend should start on:

```text
http://localhost:5000
```

Do not close this terminal.

---

# 40. Test Backend Health

Open another Git Bash terminal.

Run:

```bash
curl http://localhost:5000/api/health
```

Expected:

```json
{
  "success": true,
  "message": "ChainCoder backend is running"
}
```

If this response appears, the backend is running.

---

# 41. Test Backend → Fabric

Run:

```bash
curl http://localhost:5000/api/blockchain/test
```

Expected:

```json
{
  "success": true,
  "message": "SIH26125 chaincode is working"
}
```

This is an important test.

It verifies:

```text
Backend
   ↓
Fabric connection
   ↓
BEL Peer
   ↓
sihchannel
   ↓
sih-contract
```

---

# 42. Backend → IPFS Test

Make sure IPFS daemon is running.

The backend uses:

```text
http://127.0.0.1:5001/api/v0
```

To test IPFS independently:

```powershell
C:\ipfs\ipfs.exe id
```

If it returns the peer information, IPFS is running.

---

# 43. Document Upload Flow

When a document is uploaded:

```text
Frontend
   |
   | multipart/form-data
   ↓
Backend
   |
   +---- SHA-256 hash
   |
   +---- Upload file to IPFS
   |          |
   |          ↓
   |         CID
   |
   ↓
Hyperledger Fabric
   |
   +---- Asset ID
   +---- Document Hash
   +---- IPFS CID
   +---- Timestamp
```

The actual large document is stored off-chain.

The blockchain stores its verification information.

---

# 44. Important: Blockchain vs IPFS

## Blockchain stores

```text
Identity metadata
Asset ownership
Access permissions
Document hash
IPFS CID
Transaction information
Audit information
```

## IPFS stores

```text
Actual documents
Large files
PDFs
Other uploaded assets
```

Do not store large files directly on the blockchain.

---

# 45. Complete Startup Procedure

After the laptop is restarted, use the following order.

## STEP 1

Start Docker Desktop.

Wait until Docker is running.

---

## STEP 2

Open Git Bash:

```bash
cd ~/Desktop/ChainCoder/blockchain/sih-network
```

---

## STEP 3

Configure Fabric:

```bash
export PATH="$PWD/../fabric-samples/bin:$PATH"
```

Then:

```bash
export FABRIC_CFG_PATH="$PWD/../fabric-samples/config"
```

---

## STEP 4

Start Fabric CAs:

```bash
docker compose -f docker/docker-compose-ca.yaml up -d
```

---

## STEP 5

Start Orderers:

```bash
docker compose -f docker/docker-compose-network.yaml up -d
```

---

## STEP 6

Start Peers:

```bash
docker compose -f docker/docker-compose-peer.yaml up -d
```

---

## STEP 7

Check Docker:

```bash
docker ps
```

All required containers should be running.

---

## STEP 8

Start IPFS.

Open PowerShell:

```powershell
C:\ipfs\ipfs.exe daemon
```

Keep it running.

---

## STEP 9

Open another Git Bash terminal.

Start backend:

```bash
cd ~/Desktop/ChainCoder/backend
```

Then:

```bash
npm run dev
```

---

## STEP 10

Test backend:

```bash
curl http://localhost:5000/api/health
```

---

## STEP 11

Test blockchain:

```bash
curl http://localhost:5000/api/blockchain/test
```

---

# 46. One-Page Startup Commands

After everything has been installed, the normal startup process is:

### Terminal 1 – Fabric

```bash
cd ~/Desktop/ChainCoder/blockchain/sih-network

export PATH="$PWD/../fabric-samples/bin:$PATH"

export FABRIC_CFG_PATH="$PWD/../fabric-samples/config"

docker compose -f docker/docker-compose-ca.yaml up -d

docker compose -f docker/docker-compose-network.yaml up -d

docker compose -f docker/docker-compose-peer.yaml up -d

docker ps
```

---

### Terminal 2 – IPFS

```powershell
C:\ipfs\ipfs.exe daemon
```

---

### Terminal 3 – Backend

```bash
cd ~/Desktop/ChainCoder/backend

npm run dev
```

---

### Terminal 4 – Testing

```bash
curl http://localhost:5000/api/health
```

Then:

```bash
curl http://localhost:5000/api/blockchain/test
```

---

# 47. Stopping the System

Stop the backend with:

```text
Ctrl + C
```

Stop IPFS with:

```text
Ctrl + C
```

For Fabric, stop the containers without deleting volumes:

```bash
cd ~/Desktop/ChainCoder/blockchain/sih-network

docker compose -f docker/docker-compose-peer.yaml stop

docker compose -f docker/docker-compose-network.yaml stop

docker compose -f docker/docker-compose-ca.yaml stop
```

---

# 48. Starting Again

Start Docker Desktop.

Then:

```bash
cd ~/Desktop/ChainCoder/blockchain/sih-network

docker compose -f docker/docker-compose-ca.yaml up -d

docker compose -f docker/docker-compose-network.yaml up -d

docker compose -f docker/docker-compose-peer.yaml up -d
```

Then start IPFS:

```powershell
C:\ipfs\ipfs.exe daemon
```

Then backend:

```bash
cd ~/Desktop/ChainCoder/backend

npm run dev
```

---

# 49. DO NOT Run These Commands

Do not run:

```bash
docker compose down -v
```

unless you intentionally want to delete the Fabric network state.

Do not run:

```bash
docker volume prune
```

without knowing which Docker volumes will be removed.

Do not delete:

```text
organizations/
.msp-enroll/
```

if you need the existing Fabric identities.

Do not delete the Fabric ledger volumes.

---

# 50. If You Want a Completely Fresh Blockchain

If this laptop is only for development/testing and you intentionally want a new blockchain network, you can create a fresh Fabric network.

However, a fresh network means:

```text
Old ledger        → NOT available
Old transactions  → NOT available
Old assets        → NOT available
Old identities    → NOT available
Old blockchain IDs → NOT available
```

The chaincode source can be reused and redeployed.

For the SIH demonstration, a fresh network is usually acceptable if demo data is recreated.

---

# 51. GitHub Important Files

The GitHub repository should contain:

```text
ChainCoder/
│
├── backend/
├── frontend/
├── blockchain/
│   └── sih-network/
├── .gitignore
├── README.md
└── SETUP.md
```

The repository should NOT contain:

```text
Real private keys
Production secrets
.env with production credentials
JWT production secrets
Sensitive user data
```

---

# 52. Final Verification Checklist

Before saying the setup is complete, check:

## Software

```text
[ ] Git installed
[ ] Docker Desktop installed
[ ] Docker running
[ ] Node.js installed
[ ] VS Code installed
[ ] Fabric binaries available
[ ] Fabric Samples available
[ ] IPFS installed
```

## Fabric

```text
[ ] BEL CA running
[ ] Auditor CA running
[ ] Contractor CA running
[ ] Orderer CA running

[ ] Orderer 1 running
[ ] Orderer 2 running
[ ] Orderer 3 running

[ ] BEL Peer running
[ ] Auditor Peer running
[ ] Contractor Peer running

[ ] sihchannel available
[ ] sih-contract deployed
```

## IPFS

```text
[ ] IPFS initialized
[ ] IPFS daemon running
[ ] IPFS API available
```

## Backend

```text
[ ] npm install completed
[ ] .env configured
[ ] Fabric MSP available
[ ] Backend running
[ ] /api/health working
[ ] /api/blockchain/test working
```

---

# 53. Expected Final Test

Run:

```bash
curl http://localhost:5000/api/health
```

Expected:

```json
{
  "success": true,
  "message": "ChainCoder backend is running"
}
```

Then:

```bash
curl http://localhost:5000/api/blockchain/test
```

Expected:

```json
{
  "success": true,
  "message": "SIH26125 chaincode is working"
}
```

If both return `success: true`, the basic:

```text
Docker
   ↓
Hyperledger Fabric
   ↓
sihchannel
   ↓
sih-contract
   ↓
Backend
```

connection is working.

---

# 54. Frontend on Another Laptop

The frontend does not need Hyperledger Fabric installed.

Frontend laptop only needs:

```text
Git
Node.js
VS Code
```

Clone the project:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

Go to frontend:

```bash
cd ChainCoder/frontend
```

Install:

```bash
npm install
```

Start:

```bash
npm run dev
```

---

# 55. Connecting Frontend Laptop to Backend Laptop

Suppose:

```text
Backend Laptop:
192.168.1.10

Frontend Laptop:
192.168.1.20
```

The backend must accept network connections.

The Express server should listen on:

```text
0.0.0.0
```

instead of only:

```text
localhost
```

The frontend `.env` should contain:

```env
VITE_API_URL=http://192.168.1.10:5000/api
```

Replace `192.168.1.10` with the actual IP address of the backend laptop.

Then the architecture becomes:

```text
Frontend Laptop
      |
      | Wi-Fi/LAN
      |
      ↓
Backend Laptop
      |
      ├── Hyperledger Fabric
      |
      └── IPFS
```

---

# 56. Final ChainCoder Development Environment

```text
                 FRONTEND LAPTOP
                ┌───────────────┐
                │ React + Vite  │
                │ VS Code       │
                └───────┬───────┘
                        │
                        │ HTTP/REST
                        │
                        ▼
                 BACKEND LAPTOP
                ┌───────────────┐
                │ Node.js       │
                │ Express       │
                └───────┬───────┘
                        │
             ┌──────────┴──────────┐
             │                     │
             ▼                     ▼
      HYPERLEDGER FABRIC          IPFS
             │
      ┌──────┼──────┐
      ▼      ▼      ▼
     BEL  Auditor Contractor
      │      │      │
      └──────┼──────┘
             │
        sihchannel
             │
        sih-contract
             │
       ┌─────┼─────┐
       ▼     ▼     ▼
    Raft1  Raft2  Raft3
```

---

# 57. Setup Complete

The ChainCoder blockchain + backend environment is ready when:

```text
Docker
   ✓
Fabric CAs
   ✓
Raft Orderers
   ✓
Organization Peers
   ✓
sihchannel
   ✓
sih-contract
   ✓
IPFS
   ✓
Node.js Backend
   ✓
Backend → Fabric
   ✓
Backend → IPFS
   ✓
```

The frontend can then be developed independently and connected through the backend REST API.

````

### One important correction for your actual project

When you put this into GitHub, **don't hard-code your current package ID** such as:

```text
sih-contract_2.4:41eba92...
````

A new laptop with a newly packaged chaincode will get a **different package ID**. The setup should always tell the person to run:

```bash
peer lifecycle chaincode queryinstalled
```

and use the package ID returned on that machine.

Also, don't put your real `.env`, private MSP keys, or Fabric secrets into GitHub.
