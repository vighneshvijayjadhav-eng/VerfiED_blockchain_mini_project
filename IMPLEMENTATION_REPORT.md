# Implementation report

Validated on 10 October 2026 using Windows PowerShell, Node 24.21.0 and npm 11.12.1.

## Delivered

- Solidity registry with immutable authorized issuer, unique non-PII IDs, SHA-256 hashes, issuance timestamps, permanent revocation, custom errors and events.
- Express/Ethers signing API, deterministic canonicalization, atomic deployment-scoped JSON storage, PDFKit A4 landscape certificates and local QR generation.
- Five complete React routes: dashboard, issuance, searchable registry, credential details and public verification. Original local campus and engraving SVG artwork; responsive laptop/mobile layouts.
- Clear separation between registration status and supplied-data integrity. Live contract queries and events provide evidence. Stale instances, missing deployments and changed active deployment files fail closed.
- Windows startup/reset scripts, reproducible lockfile, project overview, design notes, demo guide and viva notes.

## Checks actually executed

| Check | Result |
|---|---|
| Initial npm dependency installation | PASS |
| Clean `npm ci` from lockfile | PASS; stop Hardhat first on Windows to release its native binary |
| Solidity 0.8.28 compilation with Hardhat 3.19.0 | PASS |
| `npm test` | **21 passed, 0 failed, 0 skipped** |
| `npm run build` | PASS; final Vite build completed |
| Browser issuance with fictional data | PASS; mined transaction, receipt and CertificateIssued event |
| Public lookup of issued ID | PASS; Verified from live contract |
| Original supplied data / altered grade | PASS; MATCH / MISMATCH respectively |
| Required-reason revoke / same verification link | PASS; confirmed event, same URL returns Revoked |
| Original matching data after revocation | PASS; remains Revoked with separate matching integrity |
| A4 landscape PDF rendering | PASS; one 841.89 × 595.28 pt page, visually inspected |
| Long field PDF layout | PASS; maximum-length Latin fields visually inspected without clipping |
| QR decoded from rendered PDF image | PASS; actual localhost `/verify/VED-…` URL decoded |
| Desktop 1366×768 / mobile 390×844 | PASS; public verification and issuance visually inspected |
| `demo:reset`, real node restart and redeployment | PASS; fresh registry; stale deployment shows Chain Unavailable |

The 21 automated cases cover authorized issuance/event/storage, unauthorized issue/revoke, duplicates, zero values, unknown lookup/revoke, permanent/repeated revocation, stable canonicalization, input/origin rejection, health, receipt-backed persistence, supplied-data mismatch, PDF/QR metadata, tampered-store PDF blocking, reason validation, revoked-overrides-match behavior, separate deployment stores, instance mismatch, active deployment change, missing deployment and a stopped node.

Unauthorized-write tests execute EVM transaction simulation (`eth_call`) and assert the contract's custom revert. Successful issuance and revocation tests submit and mine real transactions; no receipt is invented for rejected calls.

Screenshots in `docs/screenshots` show fictional demo data and real local transaction evidence captured during browser testing. They are snapshots from a prior deployment; current ephemeral state may differ after reset. Generated PDFs, local records and chain logs remain ignored under `.local/`.

## Fixed during validation

- Corrected a JSX closure caught by the first build.
- Separated the React entry point from the application component to avoid duplicate-root warnings during hot reload.
- Moved the issuance action above the fold and removed certificate-preview overflow.
- Added font fitting for unusually long PDF values.
- Added active deployment-file checks so a running API cannot continue serving the prior scope after reset.

Hardhat's initial local-installation error was caused by the execution sandbox blocking Windows `realpath`; the normal host environment compiled and tested successfully. An initial clean reinstall hit a native-binary file lock while Hardhat was running; stopping the node resolved it. Poppler printed optional Symbol/ArialUnicode font warnings, but the used standard-font certificate text rendered correctly in inspected images.

## Website theme refresh

The user subsequently selected charcoal, white and emerald. Updated the shared stylesheet, primary/focus/hover accents, neutral campus artwork, favicon and browser theme colour. Production build passed; dashboard, issuance and public verification received visual checks, including a mobile viewport. Screenshot files for dashboard and issuance show the new theme; the revoked screenshot preserves the earlier functional test evidence. This presentation-only change does not alter contracts, API behaviour or the downloadable PDF design.

## Deliberate limits

This is a trusted localhost demonstration, not production authentication or durable decentralized infrastructure. Hardhat accounts are unlocked development accounts. QR links using localhost must be opened on the same computer. Data integrity does not prove PDF-byte/visual authenticity. Reasons are off-chain statements. Built-in PDF fonts restrict supported input to the documented Latin character set. Disk failure after chain confirmation requires manual recovery/reset; there is no recovery journal. No public-chain deployment, physical printer test, phone-over-LAN access or load testing was performed.

## Feature 7 / 8 upgrade verification (10 October 2026)

Implemented a real local blockchain explorer, shared streamed issue/revoke workflow, block and transaction inspectors, receipt/event metadata and timestamped credential audit links. Added browser-local QR image selection/drop/paste, strict local-URL and file validation, preview/reset, extracted ID and live-chain results. The charcoal/emerald theme, canonical hashing and PDF design are preserved.

Executed for this upgrade:

- `npm install @zxing/browser`: passed; npm reported zero vulnerabilities.
- `npm test`: **26 passed, 0 failed**. Existing contract/API tests plus QR parser/file limits, real explorer block/receipt/event data, changed-head cache refresh, stream stages for issuance/revocation/failure, and chain-outage errors.
- `npm run build`: passed, including a separate lazy-loaded QR decoder chunk.
- Fresh local node + `npm run demo:setup` + `npm run dev`: passed after the previous terminal processes stopped. A fresh deployment scope displayed zero issuance/revocation events and preserved old data in its prior scope.
- Browser explorer issuance: passed with fictional data and a real successful receipt; activity/count updated automatically.
- PDF image QR upload through file selection: passed in the first browser session, producing Verified. A later file-chooser automation attempt stalled; subsequent image tests used the supported clipboard-paste path.
- Browser paste of a full rendered PDF screenshot: decoded `VED-F4619058609A422C` and returned Verified. Issuance receipt and block were inspected in the UI.
- Browser explorer revocation with required reason: passed. Pasting the identical image afterward returned Revoked while the stored academic data hash still matched. Issuance and revocation evidence both remained available.
- Unknown-ID QR: Not Found. Unrelated URL QR: Invalid QR without navigating. Blank image: Invalid QR with readable guidance.
- Desktop 1366×768 and mobile 390×844 screenshot-upload layouts inspected; mobile document width did not overflow. Uploaded-image layout compacts to expose the status sooner.

Browser testing found and fixed stale response reuse when navigating from a transaction receipt to a block. The shared loading hook now withholds data belonging to the previous request. Receipt enrichment errors cannot interrupt persistence after a transaction has mined.

Limits of this upgrade's verification: no physical phone or camera workflow (not required), no manual drag-and-drop test, no separate JPEG/WebP decoding sample, and no browser-level stopped-node screenshot; file type validation is automated and actual stopped-node API/explorer behavior is tested on the isolated test chain. Blur cannot always be recovered: unreadable QR codes produce a retry/crop message. This remains a trusted localhost demo, not production authentication. Generated PDFs, screenshots, QR fixtures and local academic records are ignored under `.local/`.

Additional browser regression checks passed: switching from a decoded QR to the integrity tab preloaded the same credential; changing A+ to B produced Data mismatch detected while retaining Revoked; navigating from the issuance receipt to its block worked without reloading after the stale-response fix.
