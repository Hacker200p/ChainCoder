# SIH26125 — System Design Spec
Blockchain-Based Secure Platform for Identity, Access Control & Digital Asset Management

---

## 1. How many organizations?

**Three**, plus one infrastructure-only org that doesn't represent a real-world participant:

| Org | Type |
|---|---|
| BEL | Business participant (platform owner) |
| Auditor | Business participant (compliance/oversight) |
| Contractor | Business participant (external identity holders) |
| OrdererOrg | Infrastructure only — runs the 3 Raft orderer nodes, has no MSP-based business role |

Three is the right number for this problem statement: enough to demonstrate genuine multi-party trust (no single org can unilaterally act), without the network complexity outweighing what you can build and demo in the hackathon window.

---

## 2. What is each organization's responsibility?

**BEL** — platform owner and primary identity issuer
- Runs the BEL CA, issues certificates to internal staff (Admin, Manager, Employee)
- Hosts the primary endorsing/committing peers
- Mints most assets (certificates, licenses) on behalf of the platform
- Co-endorses sensitive transactions

**Auditor** — independent compliance and oversight
- Runs the Auditor CA, issues certificates to auditors
- Has read access to the entire ledger and to private collections it's a member of
- Co-endorses sensitive transactions (mint, grant, revoke) — but has no unilateral write power of its own; it can block a bad transaction, not create one alone
- Produces compliance reports from on-chain history

**Contractor** — external participants (vendors/partners)
- Runs the Contractor CA, issues certificates to contractor admins/users
- Registers as identity holders and asset owners
- Requests access to resources, receives/transfers assets
- Cannot mint assets or grant access unilaterally — always requires BEL/Auditor co-endorsement for anything sensitive

---

## 3. What roles exist?

| Org | Roles |
|---|---|
| BEL | Admin, Manager, Employee |
| Auditor | Auditor |
| Contractor | Contractor Admin, Contractor User |

---

## 4. What can each role do?

| Role | Register identity | Revoke identity | Grant/revoke access | Mint asset | Transfer asset | View own data | View audit history |
|---|---|---|---|---|---|---|---|
| BEL Admin | ✅ (any org's identity, via CA) | ✅ | ✅ | ✅ | ✅ (any asset) | ✅ | ✅ |
| BEL Manager | ✅ (BEL staff only) | ❌ | ✅ (approve requests) | ✅ | ❌ | ✅ | ✅ |
| BEL Employee | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Auditor | ❌ | ❌ (co-sign only) | ❌ (co-sign only) | ❌ (co-sign only) | ❌ | ✅ (all orgs) | ✅ (all orgs) |
| Contractor Admin | ✅ (own org's users) | ❌ | ❌ (request only) | ❌ (request only) | ✅ (own assets) | ✅ | ✅ (own org) |
| Contractor User | ❌ | ❌ | ❌ (request only) | ❌ | ✅ (own assets) | ✅ (own) | ❌ |

The key design point: **"request" vs "grant"/"mint" are different actions.** A Contractor can *request* access or *request* an asset transfer, but the chaincode function that actually performs it (`GrantAccess`, `MintAsset`) only executes if the endorsement policy is satisfied — which for these functions means BEL + Auditor peers must both endorse (see Q7).

---

## 5. What data goes on Fabric?

**Public world state (visible to all 3 orgs):**
- Identity records — identityID, public-key hash, non-sensitive attributes (role, org, status), NOT raw KYC data
- Access grant/revoke records — identityID, resourceID, permission level, status, timestamps
- Asset ownership records — assetID, current ownerID, asset type, status
- Metadata **hashes** for assets and documents (the hash, not the file)
- All transaction events (`IdentityRegistered`, `AccessGranted`, `AssetMinted`, `AssetTransferred`, etc.)

**Private data collections (on Fabric, but restricted to specific orgs' peers):**
- `identityKycDetails` — raw KYC/personal details (BEL + Auditor peers only)
- `assetDocumentDetails` — richer document metadata tied to an asset (BEL, Auditor, Contractor)

Both categories are still Fabric-native, immutable, and queryable via `GetHistoryForKey` — the difference is *which peers physically store the data*, not whether it's on the blockchain.

---

## 6. What data stays off-chain?

- **Actual files/documents** (certificates, contracts, ID scans) — stored in IPFS or an off-chain document store; only the content hash goes on Fabric
- **Large media** (images, PDFs, videos) — same reasoning; keeps block size and peer storage manageable
- **Session/auth tokens, UI state** — lives in your backend/Redis, not the ledger
- **Application-level analytics/logs** (page views, API latency) — regular backend database
- **Raw private keys** — never touch the ledger or your backend database; they stay in the user's wallet/HSM or Fabric CA's local key material

Rule of thumb for your demo narrative: **if it needs to be provably untampered, its hash goes on Fabric. If it needs to stay private or is just operational data, it stays off-chain entirely.**

---

## 7. Which transactions require which organizations to approve?

| Chaincode function | Required endorsers | Why |
|---|---|---|
| `RegisterIdentity` | Issuing org only (e.g. `OR('BELMSP.peer')` or `OR('ContractorMSP.peer')` depending on who's registering) | Each org is the sole authority over its own members' identities |
| `RevokeIdentity` | Issuing org **AND** Auditor | Revocation is high-impact (locks someone out) — needs independent sign-off |
| `GrantAccess` | BEL **AND** Auditor | Prevents any single org from granting itself/others excessive access |
| `RevokeAccess` | Granting org only | Revoking access is lower-risk than granting it — can be single-org |
| `MintAsset` | BEL **AND** Auditor | New assets entering the system need verification before they're trusted |
| `TransferAsset` | Current owner's org **AND** BEL | Ensures the platform owner has visibility into all ownership changes |
| Read-only queries (`CheckAccess`, `GetAssetHistory`, etc.) | None (any peer can evaluate locally) | Reads don't need endorsement/ordering at all |

This table is literally what you'd pass to `--signature-policy` when committing each chaincode definition, or encode as separate chaincodes/functions with different endorsement requirements.

---

## 8. How do organizations communicate?

There is **no direct org-to-org API or channel** — that's intentional; it's what makes the system trustless rather than a federation of APIs that have to trust each other's word.

- **Transaction proposals** flow: Client app → own org's backend → own org's peer (endorsement) → *other required orgs' peers* (endorsement) — coordinated by the Fabric SDK (`fabric-gateway`), not by orgs calling each other directly
- **Block dissemination** happens via Fabric's **gossip protocol** — orderer broadcasts the block once, peers gossip it to each other within and across orgs on the channel
- **Shared source of truth** is the channel ledger itself — orgs don't need to message each other about system state because they all read the same committed blocks
- Off-chain, if orgs need to communicate outside transactions (e.g. a support ticket), that's a separate concern (email/Slack) — not part of the Fabric network

---

## 9. What APIs do we need?

Building on the `backend/app.js` REST wrapper already scaffolded:

**Auth / Identity**
- `POST /auth/enroll` — enroll a new user against their org's Fabric CA
- `POST /auth/login` — issue a session token backed by the enrolled Fabric identity
- `POST /identity/register`, `GET /identity/:id/verify`, `POST /identity/:id/revoke`, `GET /identity/:id`

**Access Control**
- `POST /access/grant`, `POST /access/revoke`, `GET /access/check`, `GET /access/history`
- `POST /access/request` — Contractor-side "request access" that creates a pending record for BEL/Auditor to approve (this triggers the actual `GrantAccess` once approved)

**Assets**
- `POST /asset/mint`, `POST /asset/transfer`, `GET /asset/:id`, `GET /asset/:id/history`, `GET /asset/owner/:ownerID`
- `POST /asset/upload` — uploads the actual file to IPFS, returns the hash to be passed into `MintAsset`

**Audit (Auditor-facing)**
- `GET /audit/identities`, `GET /audit/access-grants`, `GET /audit/assets` — read-heavy endpoints querying across all orgs' visible data
- `GET /audit/export` — generates a compliance report (CSV/PDF) from on-chain history

**Notifications (nice-to-have)**
- `GET /notifications` — pending approvals, revocations, transfers awaiting the logged-in user's org

---

## 10. What screens does the frontend need?

**Shared / all roles**
- Login (Fabric CA-backed)
- Dashboard (role-aware — shows different widgets per org/role)
- My Identity (view own credential status, attributes)
- My Assets (gallery of owned assets, with a "view history" drill-down showing full provenance)

**BEL Admin / Manager**
- Identity management (register/revoke BEL staff, view all registered identities)
- Access control panel (view/grant/revoke access, approve pending requests)
- Asset minting form
- Pending approvals queue (things needing BEL's co-endorsement)

**Auditor**
- Global audit log (searchable/filterable transaction history across all orgs)
- Identity registry viewer (read-only, all orgs)
- Access grants viewer (read-only, all orgs)
- Compliance report generator/export
- Pending co-endorsement queue (items awaiting Auditor sign-off)

**Contractor Admin / User**
- Register contractor users (Admin only)
- Request access to a resource (creates pending request)
- Request/initiate asset transfer
- View own org's asset and access history

**Cross-cutting**
- Notification center (pending approvals, status changes)
- "Verify" page — public-facing, lets anyone paste an assetID/identityID and see its current on-chain status + hash, without needing to log in (good demo centerpiece)

---

## Suggested build order for remaining hackathon time

1. Auth screens + `/auth/enroll`, `/auth/login` (everything else depends on this)
2. Identity management screens (BEL Admin + Contractor Admin)
3. Asset minting + gallery + history view (your strongest visual demo)
4. Access control panel + pending-approval queue (shows the multi-org endorsement story live)
5. Auditor dashboard (read-only, so it's fast to build once the write paths exist)
6. Public "Verify" page last — it's a great closer for judges but depends on everything else being done
