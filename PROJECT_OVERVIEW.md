# Project overview

**Problem:** paper/PDF academic records can be altered, and a verifier needs current issuer-controlled registration and revocation information.

**Solution:** VerifiED anchors canonical credential hashes in a local Solidity registry. It offers a polished academic PDF and a public route reading current chain status. A separate supplied-data check demonstrates tamper detection.

## Components

1. React, React Router, Lucide and Tailwind/Vite form the presentation layer. Five routes cover dashboard, issue, registry, details and public verification. Locally authored architecture/guilloche SVGs and system fonts work offline.
2. Express validates academic fields, canonicalizes data, calculates SHA-256, invokes the issuer signer, waits for receipts, and generates PDFKit certificates with QRCode images.
3. `CertificateRegistry.sol` restricts writes to its immutable deploying issuer. It stores a non-PII identifier, hash, issuer, block timestamp and permanent revoked bit, and emits issuance/revocation events.
4. Deployment-scoped JSON stores personal details, receipt/document references and off-chain reasons. Atomic replacement and serialized API mutations avoid partial files and concurrent lost updates in this single-process demo.

## Transaction sequence

Issue: browser supplies academic fields → API validates, adds ID/time, canonicalizes → SHA-256 → authorized contract transaction → confirmed receipt → atomic off-chain save → UI confirmation/PDF.

Verify: public ID → API checks chain instance/deployment → contract lookup → existence/revocation result → optional off-chain details and their hash comparison → on-chain event evidence.

Integrity: supplied full data → normalization → SHA-256 → compare with live on-chain hash. A mismatch does not change the contract; matching data never cancels revocation.

Revoke: required reason → issuer transaction → receipt → off-chain reason saved → same public ID now returns Revoked.

## Security and limits

Contract authorization is real. Browser routing is not authentication. Only trusted localhost users are assumed; Hardhat accounts are unlocked and publicly known development accounts. The chain is ephemeral. Stop/restart requires deployment/setup and API restart. PII is intentionally not stored on-chain, but this demo's public localhost verification route displays its fictional off-chain details.

No attempt is made to prove that a PDF's visuals are genuine, that an institution is accredited, or that academic facts were truthful when submitted. A real deployment would need institutional identity, authentication, access/privacy controls, durable transactional persistence, operational monitoring and production key management.

## Feature 7 and 8 architecture

`server/explorer.js` reads Ethers network/block/transaction/receipt data and current-contract logs. Event counts include all successful issuance/revocation events from this deployment, including authorized writes made outside the UI. Block lists cover the local network, while events are scoped to the deployed registry. A bounded snapshot cache avoids rereading the same blocks every four seconds. Existing deployment identity checks run before cached responses so a reset cannot validate stale data.

`server/app.js` retains a single serialized issuance/revocation implementation with JSON or newline-delimited JSON output. The browser can observe actual submission before `transaction.wait()` returns. Receipt enrichment failure cannot prevent saving a successfully mined credential. Academic records remain off-chain; receipt confirmation precedes atomic persistence.

`src/transactions.jsx` renders transaction stages and receipt evidence. Explorer actions reuse Issue and RevokeDialog; certificate history links to internal block and receipt routes. Revocation changes current state and emits a second event without erasing issuance.

`src/QRUpload.jsx` uses a lazy-loaded local ZXing decoder, blob image preview and shared file/drop/paste handling. `src/qr.js` validates image format/size and the exact local verification URL structure. React ignores obsolete decoding results and releases blob URLs. A decoded ID uses the same public on-chain lookup as manual entry. No image reaches the server. This solves the separate-phone localhost limitation while retaining the distinction between registration status and canonical academic-data integrity.
