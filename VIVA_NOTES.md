# Viva notes

**Why blockchain?** It gives the demo an append-only transaction/event history and contract-enforced write permissions. Verification reads the same authoritative registry. On a single local Hardhat node it demonstrates these mechanisms, not production decentralization.

**Why not put the whole certificate on-chain?** Personal academic details would be public and expensive to store. A 32-byte commitment proves equality to a supplied canonical record without storing its text on-chain. Hashes are not encryption and can leak information if inputs are predictable.

**Why SHA-256?** It is a standard cryptographic digest supported by Node crypto. The contract stores the resulting 32 bytes; it does not need to re-hash the off-chain PII. `keccak256` is used separately to map a public credential ID to a fixed-size contract key.

**What is canonicalization?** Fixed key order/types, normalized text and dates, and unambiguous JSON serialization make equivalent data hash identically. See README for exact v1 rules. Changing the grade changes the digest.

**Does a verified QR prove the PDF is authentic?** No. Someone can copy the QR onto different artwork. It proves live registration/revocation state for that ID. The separate form checks supplied academic data, not PDF bytes or appearance.

**What happens after revocation?** The record/hash remain; the contract sets a permanent flag and emits an event. The same QR shows Revoked. Matching original data does not make the credential active again.

**Who may issue/revoke?** The immutable constructor issuer. Unauthorized callers receive a custom-error revert. The browser has no signer. The API obtains the unlocked local development account from the loopback Hardhat node; production private-key custody is outside scope.

**Is localhost an authentication system?** No. These are trusted local demo endpoints with Host/Origin checks; local processes and the development node remain trusted. Solidity authorization is independent from UI controls.

**Is the reason blockchain-proven?** No. The event proves that revocation occurred; the human-readable reason is an off-chain issuer statement.

**What if the chain resets?** A different Hardhat instance invalidates the old deployment. Live checks fail closed. Setup creates a new deployment and JSON namespace; old records are never enough for verification.

**What if disk persistence fails?** Receipt confirmation precedes local persistence. A post-confirmation disk failure cannot undo the chain transaction, so the API reports the hash and failure. A production system needs a recovery journal/reconciliation mechanism.

**How is non-issuer rejection demonstrated?** `npm test` starts an isolated real Hardhat node, connects a second account, and uses `eth_call` transaction simulation to assert the `Unauthorized` revert for both write methods. Successful authorized writes are mined and their receipt events asserted. Simulation proves the contract branch; no fake receipt is produced for a reverted call.

**What is permanent here?** Revocation cannot be undone within a deployed contract. The local development chain itself is ephemeral and can be restarted; this prototype does not promise durable public-chain permanence.

**What is the project's contribution?** A complete demonstrable trust flow: issuance → receipt → academic PDF → live public lookup → independent data mismatch → permanent contract revocation, with explicit and defensible trust boundaries.
