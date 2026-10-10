# VerifiED

A localhost academic credential issuance, verification and permanent revocation demo for **PICT — DEMO**. React + Express + Ethers v6 + Solidity + Hardhat 3. Transactions and contract events are real local EVM activity. No MetaMask, private-key configuration, cloud service or database is required.

## Windows PowerShell quick start

Requirements: Node.js 24.21.0 (or compatible supported Node 24), npm 11, Git. Run commands from this repository. The first dependency install and Solidity compiler download require internet; the configured demo then works offline.

```powershell
npm install
```

For a clean reproducible reinstall, stop **all** running app/Hardhat terminals first, then run `npm ci`. Windows cannot replace Hardhat's native EDR binary while the node is running.

Terminal 1 — keep the ephemeral local blockchain running:

```powershell
npm run chain
```

Terminal 2 — compile, deploy and launch the API + frontend:

```powershell
npm run demo:setup
npm run dev
```

Open **http://localhost:5173**. The UI proxy connects to the API at `127.0.0.1:3001`. Both servers and the RPC node bind to loopback. `npm run dev` starts both child processes and stops them together with Ctrl+C. If preferred, use `npm run api` and `npm run web` in separate terminals.

Optional settings: copy `.env.example` to `.env`. `FRONTEND_BASE_URL` changes the printed QR URL. The normal development proxy expects API port 3001; if changing `PORT`, update `vite.config.js` too. No secrets belong in frontend settings.

## Repeatable reset

Stop `npm run dev` with Ctrl+C, leave the chain running, then:

```powershell
npm run demo:reset
npm run dev
```

Reset deploys a **new empty registry** and starts a fresh off-chain namespace. It does not delete old files or rewrite blockchain history. Old data remains ignored under `.local/`, inaccessible through the new active deployment. To fully restart the ephemeral blockchain, stop/restart Terminal 1, run `npm run demo:setup`, then restart `npm run dev`. The API checks Hardhat's instance ID, deployment receipt and bytecode on each lookup; old instances fail closed as **Chain Unavailable**.

`demo:setup` is idempotent for an existing live deployment. `demo:reset` assumes compilation has already occurred (run `demo:setup` for first installation). Do not change deployments while an issuance is in progress; restart the API after any deployment change.

## Checks

```powershell
npm test
npm run build
```

Tests launch a dedicated standalone Hardhat node on **18545**, deploy a separate contract, and use a temporary JSON store. They do not reset or populate the demo chain on 8545. Leave 18545 free. Tests include authorized and unauthorized writes, duplicates, zero inputs, unknown records, data match/mismatch, revocation, PDF output, QR URL, persistence isolation, missing deployments and chain outages. An ignored fictional PDF is written to `.local/test-certificate.pdf` for visual inspection.

`npm run build` creates `dist/`; this is a production frontend build, not a cloud deployment. Use the documented Vite/API workflow for the local demonstration.

## Four-minute demonstration

1. Open **Issue certificate**, choose **Use fictional demo data**, and issue. Show the real transaction hash and block number.
2. Open **View / print / download PDF**. Open the same record's public verification link: **Verified**.
3. Expand **Credential-data integrity**. Compare original data (**matches**), change grade to B and compare (**mismatch**).
4. In credential details, revoke with a required reason. Reopen the **same verification link**: **Revoked**. Matching original data still leaves it revoked.
5. Show `npm test` results for smart-contract rejection of non-issuer transactions.

The QR targets localhost. A phone scanning it refers to the phone's own localhost and cannot reach this loopback-only app. For the demo, open the link on the presentation computer or decode the QR there. Do not expose this prototype to the LAN just to scan from a phone.

## Trust boundaries

- Only a deterministic ID (`keccak256` of the public credential ID), SHA-256 data hash, issuer address, block timestamp and revocation flag/events are on-chain. No student PII or revocation reason is on-chain.
- **Verified** means registered and not revoked. Data integrity is a separate hash comparison; revoked records can still match their original data.
- Academic details, document metadata and reasons are off-chain. Event/transaction evidence is read from the live contract. The reason is an issuer statement, not independently blockchain-proven.
- A valid QR copied onto a forged PDF does **not** validate that PDF's appearance or bytes. The integrity endpoint hashes user-supplied academic data, never PDF bytes.
- The Express server uses Hardhat's unlocked local account 0 through Ethers. No private key is copied into source, `.env`, browser bundles or API responses. The local node holds public development keys and must never hold real funds.
- Loopback admin APIs are **demo functions, not production authentication**. Host/Origin checks reject foreign browser origins, but local programs and direct access to the unlocked Hardhat node are trusted. The Solidity contract independently enforces issuer-only writes.
- JSON writes use temporary files and atomic rename; mutations are serialized in the single API process. Blockchain confirmation precedes local persistence. If a disk write fails after confirmation, the API reports the transaction hash and does not pretend it rolled back. This prototype has no automatic recovery journal; preserve the evidence and restart/reset the demo after resolving storage failures.
- Latin academic text is validated for compatibility with built-in PDF fonts. No official PICT insignia, signature or claim of official issuance is used.

## Canonical credential format v1

SHA-256 of the UTF-8 bytes of `JSON.stringify` on this **fixed insertion-order object**, with all values strings:

```text
version, credentialId, fullName, rollNumber, department, degree,
academicYear, grade, completionDate, institution, issuedAt
```

`version` is `"1"`; ID is `VED-` plus 16 uppercase hex characters generated on the server. Text is NFC-normalized, trimmed, and consecutive whitespace collapses to a single space. Completion date is validated as a real `YYYY-MM-DD` date; academic year is consecutive `YYYY-YYYY`; issue timestamp normalizes to UTC ISO 8601 with milliseconds. JSON escaping avoids delimiter ambiguity. Case is preserved. Hashing is defined in `server/canonical.js`.

The payload timestamp is assigned just before submitting issuance and is part of the canonical hash. The contract separately records `block.timestamp`; these represent different clocks and may differ by seconds.

## API

JSON success: `{ "ok": true, "data": ... }`; failure: `{ "ok": false, "error": { "code", "message" } }`.

| Method | Route | Result |
|---|---|---|
| GET | `/api/health` | Live chain/deployment status, issuer and address |
| GET | `/api/certificates` | Current deployment's stored records with live statuses |
| POST | `/api/certificates` | Validate, hash, issue, await receipt, persist |
| GET | `/api/certificates/:id` | Record, live status and event evidence |
| GET | `/api/verify/:id` | Public live lookup, with optional local metadata |
| POST | `/api/integrity/:id` | Canonicalize supplied full payload and compare hash |
| POST | `/api/certificates/:id/revoke` | Permanent authorized revoke; required `reason` |
| GET | `/api/certificates/:id/pdf` | A4 landscape PDF; blocked if stored data mismatches |

See [DESIGN_NOTES.md](DESIGN_NOTES.md), [PROJECT_OVERVIEW.md](PROJECT_OVERVIEW.md), [DEMO_GUIDE.md](DEMO_GUIDE.md), [VIVA_NOTES.md](VIVA_NOTES.md), and [IMPLEMENTATION_REPORT.md](IMPLEMENTATION_REPORT.md).

Hardhat configuration follows its [official configuration reference](https://hardhat.org/docs/reference/configuration). Artwork is original and local; see [asset license notes](public/assets/LICENSE.md).
