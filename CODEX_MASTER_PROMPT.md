# MASTER CODEX PROMPT — VerifiED v2

Build the complete **VerifiED** Blockchain-Based Academic Credential Issuance, Verification & Revocation System in this repository:

`https://github.com/vighneshvijayjadhav-eng/VerfiED_blockchain_mini_project.git`

The repository name's spelling (`VerfiED`) is intentional; display product name is **VerifiED**. I have Codex desktop, Windows 10, Node v24.21.0, npm v11.12.1 and Git.

**First, read and follow the repository-root `AGENTS.md`.** Treat it as mandatory project policy, especially its security, demo reliability and UI design requirements. Inspect the repository and avoid overwriting existing user files. Then implement the complete project autonomously, installing dependencies and running tests/builds. Do not stop after scaffolding or ask routine design questions.

## Product success criteria
This is a third-year Blockchain Honours mini-project worth 10 marks including a presentation. It must be technically defensible and visually convincing, yet small enough for a roughly 4–5 hour build. It should demonstrate in under four minutes:

1. Issuer completes a beautiful issuance form, issues a credential, sees a **real Hardhat transaction receipt** and downloads a polished academic PDF.
2. PDF has QR to `/verify/:credentialId`; scanning or opening link shows live on-chain **Verified** and issuance evidence.
3. Integrity form automatically loads known credential details, allows changing the grade, and clearly demonstrates **hash mismatch** against the on-chain canonical credential hash. Explicitly label this as *credential-data integrity*, not byte-level PDF verification.
4. Issuer enters a required reason, permanently revokes credential via an authorized transaction and receives confirmation.
5. Opening the SAME QR link now displays **Revoked** even when the data hash still matches.
6. Demonstrate non-issuer access rejection and show deployed contract address/transaction hashes/block numbers in the app.

## Build architecture
- React + Vite + Tailwind + React Router + Lucide React frontend.
- Express + Ethers.js v6 backend using a signer confined to the local server.
- Solidity + Hardhat 3 standalone local blockchain on localhost. Compile, deploy and test genuinely.
- Node `crypto` SHA-256 canonical credential hashing; QR code generation; PDFKit or pdf-lib for styled A4 landscape PDFs.
- Off-chain JSON storage with atomic file writes for student record details, document metadata and revocation reasons. Never put private academic data on chain.
- Do not require MetaMask, Sepolia, RPC accounts, a real database, external authentication, cloud hosting or paid APIs.
- Avoid promising production-grade authentication: admin routes are localhost-only developer demo functions, smart contract independently restricts issuer address. Distinguish browser UI checks from actual contract authorization.
- Provide ergonomic npm scripts: e.g. `npm install`, `npm run demo:setup`, `npm run dev`, `npm test`, `npm run build`, `npm run demo:reset`. Ensure any multi-process node/deploy/api/web startup actually works on Windows PowerShell. Choose clear alternative multi-terminal commands if a robust one-command setup is difficult.
- Ensure test/stale data isolation and chain reset awareness, with repeatable local deploy flow.

## Solidity contract
Implement `CertificateRegistry.sol`: one constructor-authorized issuer, issuance with unique ID and `bytes32` SHA-256 credential hash, timestamp, issuer and revoked flag; public view lookup; permanent `revokeCertificate`; emitted issuance/revocation events; helpful custom errors; reject unknown IDs, zero hash, duplicate IDs, unauthorized writers and repeat revocations. Include tests of positive and negative behavior. Store no student PII on-chain. Keep revocation reason off-chain; make this evident in the UI.

## Credential schema and integrity
Use full name, roll number, department, degree/course, academic year, grade, completion date, institution, credential ID and issue timestamp. Normalize and serialize deterministically on the server. Compute SHA-256 over UTF-8 canonical payload; convert to `bytes32`. Preserve canonical data for later integrity comparisons; avoid mismatch due to date formatting or uncontrolled whitespace. Public verify by ID must query the chain. Separate data-integrity endpoint must recompute hash of *user-supplied* credential data and compare to the chain; merely comparing saved DB data is not an integrity check. Show Verified, Revoked, Not Found, Data Mismatch and Chain Unavailable as distinguishable states. A copied valid QR on a forged PDF must not be presented as byte-level PDF integrity.

## Design brief — PRIORITY, not an afterthought
Before building components, plan the visual system: page map, layout grid, spacing scale, typography, image usage, main UI states and reusable components. Put a short `DESIGN_NOTES.md` in the repo documenting choices.

Overall aesthetic: premium, believable academic credential-management SaaS. Editorial polish and clean information design, **not** a generic purple-glow blockchain admin template. Deep navy sidebar (#10233F), cobalt accents (#3568D4), warm white/pale stone surfaces, nuanced slate typography, teal success and restrained red/amber failure. Use refined typography hierarchy and generous whitespace. React motion can be subtle; do not add heavy animation packages unnecessarily.

### Images and backgrounds — mandatory
Use at least TWO thoughtfully integrated, genuine visual background treatments:
- **Dashboard hero/banner**: subdued high-quality university architecture / modern campus corridor / library-shelves image, with navy gradient overlay, concise product headline, status chip and primary CTA. Text must stay readable. Consider image focal point/crop, not random placement.
- **Public verification / certificate experience**: tasteful academic engraving, architectural detail or security-guilloche background/texture, low-opacity with strong contrast. Prefer a self-authored SVG pattern if it looks more polished and is easier to ship offline.

Optionally add subtle geometric imagery to empty states or educational explainer. Avoid stock photos scattered across every card. Store images locally in `public/assets`; optimize dimensions/file size and include asset credit/license documentation. No remote image URL dependence at runtime. If external images aren't reliably obtainable, create original SVG illustrations or backgrounds locally instead, and prioritize good composition. Ensure backgrounds do not reduce accessibility or make the UI unreadable.

### Required screens
1. **Dashboard**: gorgeous image-backed hero, smart title/subtitle, live chain connection, useful stat tiles (issued, active, revoked), recent issuance list, issuer shortcut and clean empty state; show real numbers only.
2. **Issue Certificate**: clear step-like form, validation, professional layout, optional certificate preview panel, blockchain transaction processing states, confirmation card, view/print/download.
3. **Certificate Registry**: searchable table, concise status pills, useful actions, revocation confirmation modal with required reason.
4. **Public Verification**: premium public-facing header/hero and separate concise lookup box. Accurate on-chain status; obvious verified/revoked/not found illustrations; credential details from off-chain store clearly marked; hash comparison panel and blockchain evidence. Should be easy to show on projector.
5. **Certificate Details**: elegant document preview, academic fields, transaction timeline, issuer address, ID, contract address, block/transaction details, download, verify and revoke where appropriate.

Make navigation, colors, shadows, cards, empty/error/success states and loading skeletons consistent. Responsive on desktop and mobile; primary evaluation target is a laptop/projector at 1366×768. Do not cram key actions below the fold. No clutter or fake charts.

### PDF design
A4 landscape, ornate but elegant academic border and subtle printed watermark/ornament, institution header `Pune Institute of Computer Technology (PICT) — DEMO`, title `Academic Certificate`, student's name and full required fields; verification ID, printable QR, issue date, `DEMO` academic seal, `Demo Authorized Issuer` signature line, small disclaimer `Academic blockchain prototype — not an official certificate`. QR points to localhost verification route using a configurable frontend base URL. Ensure font embedding if using custom font is legal and technically reliable, otherwise use robust built-ins. No official seal or real signature forgery. Test PDF renders correctly.

## API and persistence
Use consistent JSON responses for blockchain health, issue, list, details, revoke, ID verification, supplied-data hash integrity and PDF download. Validate all inputs and error paths. Do not write an issued local record until a chain receipt confirms success; handle transaction failures. Persist revocation reason only in the local store and note it is not independently blockchain-verifiable. When chain is restarted or contract changes, treat unbacked old JSON records as stale, not verified; provide clean demo reset or safe scoping by deployment.

## Quality and tests
Implement and run at least these cases: authorized issuance, unauthorized issuance rejected, duplicate ID rejected, unknown ID, data match, altered grade mismatch, authorized revoke, unauthorized revoke rejected, repeated revoke rejected, revoked status overriding match, QR URL correct, fresh start/reset. Run contract tests, frontend production build, server tests or smoke tests and manual end-to-end demo where feasible. Never claim success without evidence.

## Deliverables
Complete code, root `AGENTS.md`, `README.md` with Windows PowerShell commands, `.gitignore`, sample `.env.example`, `DESIGN_NOTES.md`, `PROJECT_OVERVIEW.md`, `DEMO_GUIDE.md`, `VIVA_NOTES.md`, plus a short `IMPLEMENTATION_REPORT.md` showing what was implemented, tests actually run, and any known limitations. Include no fake blockchain explorer links or placeholder transaction IDs. Use a few fictional demo academic records only if seeded deliberately and confirmed on-chain.

## GitHub workflow
Use the existing repository's `main` branch as the target. Set/verify remote `origin` exactly:
`https://github.com/vighneshvijayjadhav-eng/VerfiED_blockchain_mini_project.git`
Do not initialize a different unrelated repository. If the current workspace is empty, clone the remote repo into it or safely initialize and associate the remote, checking first for existing files. Commit logical milestones. Push the completed project to `main` only if authenticated push is available and the remote branch can be updated by a normal fast-forward (never force push). If push fails, give me the exact commands and error. Never commit local academic records, certificates, `.env`, secrets, `node_modules`, compiled build directories or temporary chain state.

## Execution order and autonomy
1. Inspect workspace and read `AGENTS.md`.
2. Plan route architecture, UI and asset art direction in `DESIGN_NOTES.md`.
3. Implement Solidity contract, deploy pipeline, and tests.
4. Implement Express chain integration, canonical hashes, atomic JSON, PDF and QR.
5. Build polished React UI with intentional locally hosted background imagery.
6. Integrate full issue → PDF → verify → tamper → revoke loop.
7. Run tests/build and fix real errors; run demo reset/startup once.
8. Finish documentation; commit and push if authenticated.
9. Return exact start commands, final repository commit SHA if committed, tests/results, brief architecture, remaining limitations, and presentation steps.

**Absolutely avoid:** generating a beautiful static mock UI that does not actually transact with the chain; bogus prefilled dashboard metrics; 'verified' claims based solely on local JSON; a QR code misrepresented as full PDF integrity; unlicensed external imagery; exposing signer keys; wasting time implementing extra features beyond the defined scope.

Take ownership of execution, troubleshoot autonomously and deliver a demonstrable working mini-project rather than an incomplete scaffold.
