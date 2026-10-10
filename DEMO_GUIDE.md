# A confident four-minute demo

Before presenting: complete README setup, keep the two terminals running, open localhost:5173 at 1366×768 or larger, and run `npm test` once. Use only fictional student data. Reset before the demo if a clean dashboard is desired.

| Time | Action | What to say |
|---|---|---|
| 0:00–0:25 | Dashboard, chain connection, empty or genuine counts | “This runs on a standalone local EVM. These counts come from live contract reads.” |
| 0:25–1:10 | Issue → Use fictional demo data → Issue | “Only the authorized issuer can register a record. Personal details remain off-chain; this is a real confirmed transaction.” |
| 1:10–1:40 | Open PDF and public verification | “The A4 certificate has a unique ID and QR. The link reads live existence and revocation state.” |
| 1:40–2:25 | Expand integrity → compare → change grade → compare | “We hash supplied canonical data. The altered grade produces a mismatch. This is not PDF-byte authentication.” |
| 2:25–3:15 | Details → Revoke → reason → same verification URL | “Revocation is permanent. The same QR now returns Revoked. The reason is off-chain; the event proves revocation.” |
| 3:15–3:50 | Restore original integrity data, compare; show test terminal | “Data still matches, but status remains Revoked. Contract tests prove non-issuer writes, duplicate issuance and repeat revocation revert.” |

## Presenter checklist

- Use **View / print / download PDF** to open the browser's PDF viewer; its toolbar offers save and print.
- Click a full hash/address to copy it. Evidence contains contract address, issuer, event name, block number and transaction hash. There is no fake public explorer link for the private local chain.
- Public status refreshes on page load or **Refresh live blockchain status**. After revocation, reload an already-open tab.
- A phone's localhost is not the presentation computer. Open/decode the QR on the same computer; the app deliberately binds to loopback.
- Avoid stopping Terminal 1 during the live presentation. If it restarts, run setup and restart the app; old records must not masquerade as verified.

## Recovery

**Chain unavailable:** start `npm run chain`; stop dev, run `npm run demo:setup`, restart `npm run dev`.

**Port already in use:** stop the prior process in its terminal. Do not launch two API processes over the same store. Tests use 18545 rather than the demo port.

**Wrong/unknown ID:** paste the ID from the issuance confirmation or registry. Unknown well-formed IDs yield Not Found, while malformed IDs show a validation error.

**Storage failure after confirmation:** keep the reported transaction hash. The chain transaction cannot be undone by a file error. Resolve the storage issue and reset the demo; there is no silent rollback or fake success.

## Explorer + screenshot demonstration (four minutes)

1. Open **Blockchain Explorer**. Point out chain ID 31337, actual current block and deployed contract. Select **Register New Credential**, fill or use fictional demo data, then issue. Show the completed transaction stages and receipt.
2. Open the PDF, take a screenshot containing its complete QR and white border (Windows `Win+Shift+S`). Open **Public verification → Upload QR Image**. Select a saved PNG/JPEG/WebP, drop it, or focus the upload zone and press Ctrl+V. Show the extracted ID and **Verified** result. This works on the presentation laptop without a phone.
3. Follow **View Transaction → View Block** to show sender, gas, block hash and CertificateIssued event. The registry contains the new credential.
4. In **Blockchain Explorer → Revoke Existing Credential**, search the ID, select revoke, supply a fictional correction reason and confirm. Show the new receipt and activity entry.
5. Paste/upload the **same image** again: **Revoked**. The issuance record still exists, and its canonical data can still match. Explain that the QR is a reference to current status, not proof of image/PDF-byte integrity.

Negative checks: an unknown but correctly formatted ID produces Not Found; an unrelated QR or blank image produces Invalid QR; a stopped node produces Blockchain Unavailable. If demonstrating a node restart, rerun `npm run demo:setup` and restart `npm run dev`; old deployment records are intentionally isolated. Use a new fictional credential after reset.

For a sharp screenshot include the entire QR with its white margin. Images above 8 MB or 20 megapixels are rejected; crop oversized screenshots. QR decoding needs no Internet service after dependencies are installed. The local API and chain must still be running for verification.
