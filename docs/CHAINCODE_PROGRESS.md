# ChainCoder Chaincode Progress

**Project:** ChainCoder / SIH26125  
**Updated:** 2026-09-06  
**Current phase:** Chaincode lifecycle and functional blockchain testing

## Work Completed

The existing Fabric network and channel were preserved. No network reset, channel recreation, ledger deletion, or destructive Docker cleanup was performed.

According to the current project handoff, the following Fabric components are already working:

- Fabric CAs and TLS
- MSP and NodeOUs
- Three Raft orderers
- BEL, Auditor, and Contractor peers
- Channel `sihchannel`
- Channel membership and ledger consistency
- Chaincode installation, approval, and commit for `sih-contract` version `2.2`, sequence `4`

The chaincode source was converted from ES modules to CommonJS to address a Fabric Node chaincode loader problem.

Current source verification:

- `index.js` uses `require('./lib/sihContract')`.
- `module.exports.contracts` registers the contract.
- `sihContract.js` imports `Contract` with `require('fabric-contract-api')`.
- `SIHContract` is exported through `module.exports`.
- `package.json` does not contain `"type": "module"`.
- The start script is `fabric-chaincode-node start`.
- The contract contains utility, identity, access, asset, and `test()` functions.

The local startup check produced only the expected missing `peer.address` and
`chaincode-id-name` message. The previous `contractClass is not a constructor`
error did not occur.

The fixed chaincode was packaged, installed, approved, and committed as v2.3.
The calculated package ID was:

```text
sih-contract_2.3:e0e72864bd451258a3c53ce569174ddcba1b6e133ec3a8fc408b55c048271f80
```

## Issue Encountered

Version `2.2` was committed successfully, but invoking `test()` failed when Fabric tried to start the chaincode container.

Reported error:

```text
could not launch chaincode sih-contract_2.2:
chaincode registration failed:
container exited with 1

TypeError: contractClass is not a constructor
```

The original implementation used ES module exports:

```js
import SIHContract from './lib/sihContract.js';
export default { contracts: [SIHContract] };
```

Fabric did not resolve the exported contract class correctly in that runtime. The source was therefore changed to CommonJS exports. The package start command was also kept as `fabric-chaincode-node start`; using `node index.js` would cause the chaincode process to exit instead of starting through the Fabric chaincode runtime.

### Second Issue: Chaincode Container Network

After v2.3 was committed, the chaincode container started but exited with status
`0`. Its logs showed:

```text
Error: 14 UNAVAILABLE: Name resolution failed for target dns:peer0.bel.sih26125.local:7052
```

The peer containers were running on `sih_network`, while Fabric-launched
chaincode containers were using Docker `host` networking. The peer Compose
configuration was updated with:

```text
CORE_VM_DOCKER_HOSTCONFIG_NETWORKMODE=sih_network
```

The three peer containers were recreated with their existing ledger volumes.
The temporary admin MSP directories were restored from `.msp-enroll` after the
recreation.

## Current Lifecycle State

The last known committed definition is:

| Field | Value |
|---|---|
| Chaincode | `sih-contract` |
| Channel | `sihchannel` |
| Version | `2.2` |
| Sequence | `4` |
| Policy | `OR('BELMSP.member','AuditorMSP.member','ContractorMSP.member')` |
| Last commit transaction | `9a0b99763687a7f6003adf30cab0da93ff2e6658043da8c6732b97f8631d744e` |

The current committed definition is now:

| Field | Value |
|---|---|
| Chaincode | `sih-contract` |
| Channel | `sihchannel` |
| Version | `2.3` |
| Sequence | `5` |
| Package ID | `sih-contract_2.3:e0e72864bd451258a3c53ce569174ddcba1b6e133ec3a8fc408b55c048271f80` |
| Commit transaction | `557ac3fb33a80afd57ae996da3e45881f4e54b61e2f9c4600152874194899791` |
| Approvals | `AuditorMSP: true`, `BELMSP: true`, `ContractorMSP: true` |

The v2.3 `test()` query returned `SIH26125 chaincode is working`. All three
v2.3 chaincode containers are currently `Up` and attached to `sih_network`.

## Remaining Work

1. Run functional tests for identity, asset, access, and transfer operations.
2. Record successful transactions, rejected authorization attempts, state transitions, transaction IDs, validation status, and container status.

No package ID, transaction ID, hash, or command result should be recorded until it is produced by the relevant command.

## Planned Functional Tests

The following operations need success and failure coverage where applicable:

- `RegisterIdentity`
- `GetIdentity`
- `RevokeIdentity`
- `MintAsset`
- `GetAsset`
- `GrantAccess`
- `CheckAccess`
- `RevokeAccess`
- `TransferAsset`

Authorization tests must use the correct organization identity rather than running every test as BEL. In particular, Contractor should be tested as an unauthorized organization for operations restricted to BEL or Auditor.

Suggested test records are `EMP001`, `ASSET001`, and `ACCESS001`, subject to the actual chaincode argument signatures and current ledger state.

## Safety Notes

- Do not rebuild Fabric or recreate `sihchannel`.
- Do not delete ledger volumes or organizations.
- Do not run destructive Docker cleanup unless the current network state proves it is necessary and the consequences are understood.
- Stop functional testing if the new chaincode container exits; inspect the newest container logs first.

## Current Conclusion

The original contract-export runtime issue was fixed with CommonJS exports. The
follow-up Docker network issue was fixed by configuring peer-launched chaincode
containers to use `sih_network`. Chaincode v2.3 / sequence 5 is committed and
the `test()` smoke test is working. Business-function functional testing is the
next phase.
