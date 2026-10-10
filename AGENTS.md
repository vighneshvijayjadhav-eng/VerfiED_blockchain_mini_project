# AGENTS.md — VerifiED

## Mission
Build **VerifiED**, a polished, working, localhost-only Blockchain-Based Academic Credential Issuance, Verification & Revocation System for a 10-mark engineering mini-project. The goal is a reliable 3–4 minute academic demonstration with real Solidity transactions and excellent visual design. Keep the build achievable in approximately 4–5 hours; prioritize a working vertical slice over extra features.

## Repository and environment
- Repository: `https://github.com/vighneshvijayjadhav-eng/VerfiED_blockchain_mini_project.git` (spelling is intentional).
- Default branch: `main`. Product name: **VerifiED**.
- Target: Windows 10 PowerShell; Node.js 24.21.0; npm 11.12.1; Git installed.
- Work in the cloned repository; inspect existing files before modifying. Do not overwrite user work.
- Use npm workspaces if useful, but keep startup and reset commands simple.
- Never force-push, delete branches, rewrite history, or commit secrets. Commit on the local branch when ready; push only if Git credentials are available and permitted, otherwise report exact push commands.

## Core stack
- UI: React + Vite + Tailwind CSS + React Router + Lucide React.
- API: Node.js + Express + Ethers.js v6; Node crypto for SHA-256; PDFKit or pdf-lib; `qrcode`.
- Chain: Solidity + Hardhat 3 local standalone JSON-RPC node; an authorized local development signer.
- Off-chain: small JSON file store with atomic writes; no database service, paid APIs, MetaMask, public RPC, login, or cloud deployment.
- Prefer straightforward JavaScript/TypeScript, consistent with setup. Keep dependencies minimal and compatible with Node 24.

## Feature contract — do not dilute
1. Authorized issuer creates credentials from validated academic fields.
2. Professional A4 landscape academic PDF with locally generated QR verification link.
3. Public QR/ID authenticity lookup against the live contract.
4. Separate canonical-data integrity check against the on-chain SHA-256 hash.
5. Authorized, permanent credential revocation with a required off-chain reason, on-chain revocation status, and visible event/transaction evidence.
6. Certificate registry/dashboard with genuine counts and blockchain transaction proof.

### Academic data
Student name, roll number, department, degree/course, academic year, grade, completion date, institution, issuance timestamp, and credential ID. Canonicalize fields deterministically (stable keys/types, normalized dates, no ambiguous serialization), and hash the full credential payload once on the server. Document the canonicalization format. Never hash PDF bytes and call it PDF-integrity proof.

### On-chain/off-chain boundary
On-chain: credential ID or its deterministic representation, `bytes32` hash, issuer address, issuance timestamp, revoked flag, issuance/revocation events. No personal data on-chain. Off-chain: academic data, PDF metadata, revocation reason, transaction references. Chain is authoritative for existence and status. `VERIFIED` means registered and not revoked; integrity matching is a separate claim. Unknown ID, hash mismatch, revoked and chain unavailable must have distinct states. A QR URL by itself does not prove that PDF visuals are untampered. Never fabricate chain receipts.

### Authorization and safety
- Solidity must enforce issuer-only issue/revoke, reject duplicate credentials, and block repeated revocation.
- Only the Express server holds the local development signer; never send a private key to the browser or commit one.
- Administrative API routes are demo-only and should bind to loopback, not be represented as production authentication. Clearly label this limitation in documentation.
- Don't commit `.env`, local student data, generated certificates, node_modules, build output, or temporary chain state. Use fictional sample student data. Branding must explicitly say `PICT — DEMO` and avoid official insignia/signatures.
- Handle chain resets and contract address changes without presenting stale JSON records as valid. Give a deterministic reset/deploy command and explain local ephemeral state.

## Design direction — a major evaluation criterion
The interface must look like a high-quality, professionally art-directed academic credential SaaS rather than an unstyled classroom CRUD app.
- Palette (updated at the user's request): charcoal (#181D1C), white surfaces, emerald (#087F5B), light neutral (#F5F6F5), emerald for verified and amber/red for warnings.
- Composition: persistent refined sidebar; generous whitespace; typographic hierarchy; sophisticated empty states; data tables with strong alignment; consistent icons, radii and micro-interactions.
- **Use intentional background imagery:** locally stored, appropriately licensed or newly generated abstract academic architecture/campus/library/engraved-paper imagery. Add a subdued hero/background image on Dashboard and tasteful background texture/ornamentation on certificate preview and public verification hero. Keep contrast high using navy overlays/gradients and avoid busy full-screen imagery behind forms. No remote runtime image dependencies. Include attribution/LICENSE notes when needed; use CSS/SVG self-authored backgrounds if downloading approved assets isn't practical.
- Certificate: A4 landscape, elegant double border, institutional heading `PICT — DEMO`, clear certificate typography, seal marked `DEMO`, signature line `Demo Authorized Issuer`, exact academic fields, printed credential ID and readable QR with verification instructions. No claim of official issuance.
- Polished states: skeleton/loading, empty state, success, invalid, revoked, mismatch, offline, disabled buttons, errors, and responsive mobile fallback.
- Treat dashboard hero, issuance confirmation, PDF certificate, and public verification status screen as four showcase moments. Avoid generic gradients/glassmorphism and redundant decorative cards.
- Make image asset choices coherent and accessible; no images hotlinked to unsplash at runtime. Keep assets reasonably sized.

## Workflow
1. Inspect repository and confirm package/tool versions; write a short execution plan.
2. Implement and test the contract + local deployment.
3. Implement signing API, canonical hashes, persistence, PDF and QR.
4. Implement the complete, polished UI and images/assets.
5. Run builds, automated contract tests and end-to-end happy/negative flows.
6. Write README, PROJECT_OVERVIEW.md, DEMO_GUIDE.md, VIVA_NOTES.md and include screenshots if easily obtainable.
7. Provide exact Windows PowerShell commands and an honest pass/fail report. Fix blockers before polishing minor details.

## Acceptance checks
- Issue => on-chain confirmation => PDF download with scannable QR.
- QR/ID => accurate live contract lookup.
- Modified grade => canonical hash mismatch.
- Revoke => current status changes from Verified to Revoked; scanning same QR shows Revoked.
- Non-issuer transaction reverts; duplicate issue/repeated revoke revert.
- Local reset/startup is reliable; stale off-chain metadata never masquerades as an on-chain certificate.
- Fresh install, tests, build and demo commands documented.
- Images, CSS, PDF rendering and typography work offline.

## Scope discipline
No student login, wallet connection UI, email, external database, fake explorer link, AI, elaborate analytics or unnecessary dashboard pages. Do not sacrifice a working demo to add visual bells and whistles. If blocked, implement a smaller end-to-end working vertical slice and disclose the limitation explicitly.
