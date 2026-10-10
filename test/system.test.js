import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ContractFactory, ZeroHash, id } from "ethers";
import { createProvider, createChain, chainIdFor } from "../server/chain.js";
import { createStore, readJson } from "../server/store.js";
import { hashCredential, institution } from "../server/canonical.js";
import { createApp } from "../server/app.js";
import { verificationUrl } from "../server/pdf.js";

let node,
  provider,
  contract,
  outsider,
  deployment,
  store,
  root,
  server,
  base,
  issued;
const sample = {
  fullName: "Aarav Deshmukh",
  rollNumber: "TE-2026-042",
  department: "Computer Engineering",
  degree: "Bachelor of Engineering",
  academicYear: "2025-2026",
  grade: "A+",
  completionDate: "2026-06-15",
  institution,
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function call(path, body, headers = {}) {
  const response = await fetch(
    base + path,
    body === undefined
      ? { headers }
      : {
          method: "POST",
          headers: { "Content-Type": "application/json", ...headers },
          body: JSON.stringify(body),
        },
  );
  return { status: response.status, ...(await response.json()) };
}
async function expectRevert(promise, name) {
  await assert.rejects(promise, (error) => {
    const data =
      error.data || error.info?.error?.data?.data || error.info?.error?.data;
    let decoded;
    try {
      decoded = contract.interface.parseError(data);
    } catch {}
    assert.equal(
      decoded?.name,
      name,
      `Expected ${name}, got ${error.shortMessage || error.message}`,
    );
    return true;
  });
}
before(
  async () => {
    root = await mkdtemp(join(tmpdir(), "verified-test-"));
    // Tests own a different RPC port and never reset or seed the user's demo chain.
    node = spawn(
      process.execPath,
      [
        "node_modules/hardhat/dist/src/cli.js",
        "node",
        "--hostname",
        "127.0.0.1",
        "--port",
        "18545",
      ],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    let log = "";
    node.stdout.on("data", (data) => {
      log += data;
    });
    node.stderr.on("data", (data) => {
      log += data;
    });
    provider = createProvider("http://127.0.0.1:18545");
    let ready = false;
    for (let attempt = 0; attempt < 80; attempt++) {
      try {
        await provider.send("eth_chainId", []);
        ready = true;
        break;
      } catch {
        await sleep(250);
      }
    }
    assert.ok(
      ready,
      "Isolated Hardhat node did not start. " + log.slice(0, 300),
    );
    const artifact = await readJson(
      "artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json",
    );
    const signer = await provider.getSigner(0);
    outsider = await provider.getSigner(1);
    contract = await new ContractFactory(
      artifact.abi,
      artifact.bytecode,
      signer,
    ).deploy();
    const receipt = await contract.deploymentTransaction().wait();
    deployment = {
      deploymentId: "test-deployment",
      address: await contract.getAddress(),
      issuer: await signer.getAddress(),
      abi: artifact.abi,
      instanceId: (await provider.send("hardhat_metadata", [])).instanceId,
      transactionHash: receipt.hash,
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber,
    };
    store = await createStore(root, "test-deployment");
    const deploymentFile = join(root, "deployment.json");
    await writeFile(deploymentFile, JSON.stringify(deployment));
    server = createApp({ provider, deployment, store, deploymentFile }).listen(
      0,
      "127.0.0.1",
    );
    await new Promise((resolve) => server.once("listening", resolve));
    base = `http://127.0.0.1:${server.address().port}/api`;
  },
  { timeout: 40000 },
);
after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve));
  provider?.destroy();
  if (node && node.exitCode === null && node.signalCode === null) {
    node.kill();
    await new Promise((resolve) => node.once("exit", resolve));
  }
  if (root) await rm(root, { recursive: true, force: true });
});

test("contract: authorized issuance stores hash, issuer, timestamp and event", async () => {
  const receipt = await (
    await contract.issueCertificate(id("contract-case"), id("canonical-data"))
  ).wait();
  assert.equal(receipt.status, 1);
  const cert = await contract.getCertificate(id("contract-case"));
  assert.equal(cert.dataHash, id("canonical-data"));
  assert.equal(cert.issuer, deployment.issuer);
  assert.equal(cert.revoked, false);
  assert.ok(cert.issuedAt > 0n);
  assert.equal(
    contract.interface.parseLog(receipt.logs[0]).name,
    "CertificateIssued",
  );
});
test("contract: unauthorized issuance reverts", () =>
  expectRevert(
    contract
      .connect(outsider)
      .issueCertificate.staticCall(id("unauthorized"), id("data")),
    "Unauthorized",
  ));
test("contract: duplicate issuance reverts", () =>
  expectRevert(
    contract.issueCertificate.staticCall(id("contract-case"), id("different")),
    "AlreadyExists",
  ));
test("contract: zero ID and zero hash rejected", async () => {
  await expectRevert(
    contract.issueCertificate.staticCall(ZeroHash, id("x")),
    "InvalidCredential",
  );
  await expectRevert(
    contract.issueCertificate.staticCall(id("x"), ZeroHash),
    "InvalidCredential",
  );
});
test("contract: unknown lookup and revoke rejected", async () => {
  await expectRevert(contract.getCertificate(id("unknown")), "NotFound");
  await expectRevert(
    contract.revokeCertificate.staticCall(id("unknown")),
    "NotFound",
  );
});
test("contract: unauthorized revoke rejected", () =>
  expectRevert(
    contract
      .connect(outsider)
      .revokeCertificate.staticCall(id("contract-case")),
    "Unauthorized",
  ));
test("contract: authorized revoke emits event and repeated revoke fails", async () => {
  const receipt = await (
    await contract.revokeCertificate(id("contract-case"))
  ).wait();
  assert.equal(
    contract.interface.parseLog(receipt.logs[0]).name,
    "CertificateRevoked",
  );
  assert.equal(
    (await contract.getCertificate(id("contract-case"))).revoked,
    true,
  );
  await expectRevert(
    contract.revokeCertificate.staticCall(id("contract-case")),
    "AlreadyRevoked",
  );
});
test("canonicalization: key order, whitespace and timestamps are stable", () => {
  const data = {
    ...sample,
    credentialId: "VED-0123456789ABCDEF",
    issuedAt: "2026-06-20T12:00:00Z",
  };
  const reversed = Object.fromEntries(Object.entries(data).reverse());
  reversed.fullName = "  Aarav   Deshmukh  ";
  reversed.issuedAt = "2026-06-20T17:30:00+05:30";
  assert.equal(hashCredential(data).hash, hashCredential(reversed).hash);
  assert.throws(() =>
    hashCredential({ ...data, completionDate: "2026-02-30" }),
  );
});
test("API: health and unknown ID come from live chain", async () => {
  assert.equal((await call("/health")).data.status, "CONNECTED");
  assert.equal(
    (await call("/verify/VED-0000000000000000")).data.status,
    "NOT_FOUND",
  );
});
test("API: malformed input and foreign browser origin rejected", async () => {
  assert.equal(
    (await call("/certificates", { ...sample, grade: "" })).status,
    400,
  );
  assert.equal(
    (await call("/certificates", sample, { Origin: "https://foreign.example" }))
      .status,
    403,
  );
  assert.equal(
    (
      await call("/certificates", {
        ...sample,
        institution: "Official university",
      })
    ).status,
    400,
  );
});
test("API: issuance confirms receipt before persistence", async () => {
  const response = await call("/certificates", sample);
  assert.equal(response.status, 200);
  issued = response.data;
  assert.equal(issued.status, "VERIFIED");
  assert.equal(issued.storedDataMatches, true);
  assert.ok(issued.evidence.issuance.transactionHash.startsWith("0x"));
  const receipt = await provider.getTransactionReceipt(
    issued.evidence.issuance.transactionHash,
  );
  assert.equal(receipt.status, 1);
  assert.equal(store.all().length, 1);
  assert.equal(
    (await contract.getCertificate(chainIdFor(issued.credentialId))).dataHash,
    hashCredential(issued.record.data).hash,
  );
});
test("API: supplied original data matches; altered grade mismatches", async () => {
  assert.equal(
    (await call("/integrity/" + issued.credentialId, issued.record.data)).data
      .integrity,
    "MATCH",
  );
  const changed = await call("/integrity/" + issued.credentialId, {
    ...issued.record.data,
    grade: "B",
  });
  assert.equal(changed.data.integrity, "MISMATCH");
  assert.equal(changed.data.status, "VERIFIED");
});
test("PDF: downloadable PDF, correct QR route and metadata", async () => {
  const response = await fetch(
    base + "/certificates/" + issued.credentialId + "/pdf",
  );
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type"), /application\/pdf/);
  const bytes = Buffer.from(await response.arrayBuffer());
  assert.equal(bytes.subarray(0, 5).toString(), "%PDF-");
  assert.ok(bytes.length > 4000);
  assert.equal(
    issued.verificationUrl,
    verificationUrl("http://localhost:5173/", issued.credentialId),
  );
  assert.equal(
    issued.record.document.verificationUrl,
    `http://localhost:5173/verify/${issued.credentialId}`,
  );
  // Kept in ignored local state for visual QA; fictional data only.
  await import("node:fs/promises").then((fs) =>
    fs.mkdir(".local", { recursive: true }),
  );
  await writeFile(".local/test-certificate.pdf", bytes);
});
test("API: tampered off-chain metadata cannot produce a trusted PDF", async () => {
  const original = store.get(issued.credentialId);
  try {
    await store.put({ ...original, data: { ...original.data, grade: "B" } });
    const lookup = await call("/verify/" + issued.credentialId);
    assert.equal(lookup.data.status, "VERIFIED");
    assert.equal(lookup.data.storedDataMatches, false);
    const pdf = await call("/certificates/" + issued.credentialId + "/pdf");
    assert.equal(pdf.status, 409);
    assert.equal(pdf.error.code, "DATA_MISMATCH");
  } finally {
    await store.put(original);
  }
});

test("API: missing reason blocks revocation", async () => {
  assert.equal(
    (await call(`/certificates/${issued.credentialId}/revoke`, { reason: " " }))
      .status,
    400,
  );
  assert.equal(
    (await call("/verify/" + issued.credentialId)).data.status,
    "VERIFIED",
  );
});
test("API: same QR lookup now revoked; matching data never overrides revocation", async () => {
  const response = await call(`/certificates/${issued.credentialId}/revoke`, {
    reason: "Fictional demo: academic grade correction",
  });
  assert.equal(response.data.status, "REVOKED");
  assert.equal(response.data.evidence.revocation.event, "CertificateRevoked");
  assert.equal(
    (await call("/verify/" + issued.credentialId)).data.status,
    "REVOKED",
  );
  const check = await call(
    "/integrity/" + issued.credentialId,
    issued.record.data,
  );
  assert.equal(check.data.status, "REVOKED");
  assert.equal(check.data.integrity, "MATCH");
  assert.equal(
    (
      await call(`/certificates/${issued.credentialId}/revoke`, {
        reason: "Again",
      })
    ).status,
    409,
  );
});
test("persistence: fresh deployment scope is empty; prior record preserved", async () => {
  const fresh = await createStore(root, "fresh-deployment");
  assert.equal(fresh.all().length, 0);
  const reopened = await createStore(root, "test-deployment");
  assert.equal(reopened.all().length, 1);
  assert.equal(
    reopened.get(issued.credentialId).revocation.reason,
    "Fictional demo: academic grade correction",
  );
});
test("chain identity mismatch fails closed instead of trusting JSON", async () => {
  const stale = createChain(provider, {
    ...deployment,
    instanceId: "wrong-instance",
  });
  await assert.rejects(
    stale.lookup(issued.credentialId),
    (error) => error.code === "CHAIN_UNAVAILABLE",
  );
});
test("API: changing the active deployment blocks an API still holding the old scope", async () => {
  const path = join(root, "deployment.json");
  try {
    await writeFile(
      path,
      JSON.stringify({ ...deployment, deploymentId: "new-deployment" }),
    );
    const response = await call("/verify/" + issued.credentialId);
    assert.equal(response.status, 503);
    assert.equal(response.error.code, "CHAIN_UNAVAILABLE");
  } finally {
    await writeFile(path, JSON.stringify(deployment));
  }
});

test("missing deployment fails closed", async () => {
  const stale = createChain(provider, {
    ...deployment,
    transactionHash: ZeroHash,
  });
  await assert.rejects(
    stale.lookup(issued.credentialId),
    (error) => error.code === "CHAIN_UNAVAILABLE",
  );
});
test("explorer: live counts, blocks, decoded receipts and immutable history", async () => {
  const overview = (await call("/explorer")).data;
  assert.equal(overview.chainId, "31337");
  assert.ok(overview.issued >= 2 && overview.revoked >= 2);
  assert.equal(
    new Set(overview.activity.map((e) => e.key)).size,
    overview.activity.length,
  );
  const details = (await call("/verify/" + issued.credentialId)).data;
  for (const key of ["issuance", "revocation"]) {
    const event = details.evidence[key];
    const tx = (await call("/explorer/transactions/" + event.transactionHash))
      .data;
    assert.equal(tx.status, "Confirmed");
    assert.equal(tx.sender, deployment.issuer);
    assert.ok(BigInt(tx.gasUsed) > 0n);
    assert.equal(tx.events[0].name, event.event);
    const block = (await call("/explorer/blocks/" + tx.blockNumber)).data;
    assert.equal(block.hash, tx.blockHash);
    assert.ok(block.transactions.some((t) => t.hash === tx.transactionHash));
  }
  assert.equal(
    (await call("/explorer/transactions/" + deployment.transactionHash)).data
      .kind,
    "Registry deployment",
  );
  assert.equal((await call("/explorer/transactions/bad")).status, 400);
  assert.equal((await call("/explorer/blocks/999999")).status, 404);
  assert.equal((await call("/explorer?before=-1")).status, 400);
});
test("streaming: actual submission, confirmation and failure preserve shared service", async () => {
  async function stream(path, body) {
    const response = await fetch(base + path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/x-ndjson",
      },
      body: JSON.stringify(body),
    });
    return (await response.text())
      .trim()
      .split("\n")
      .map((line) => JSON.parse(line));
  }
  const prior = (await call("/explorer")).data;
  const events = await stream("/certificates", sample);
  assert.deepEqual(
    events.filter((e) => e.stage).map((e) => e.stage),
    ["Preparing transaction", "Submitted", "Pending confirmation", "Confirmed"],
  );
  const result = events.at(-1).data;
  const receipt = events.find((e) => e.receipt).receipt;
  assert.equal(
    receipt.transactionHash,
    result.evidence.issuance.transactionHash,
  );
  assert.equal(
    (await call("/verify/" + result.credentialId)).data.status,
    "VERIFIED",
  );
  const revoked = await stream(
    "/certificates/" + result.credentialId + "/revoke",
    { reason: "Stream workflow test" },
  );
  assert.equal(revoked.at(-1).data.status, "REVOKED");
  const updated = (await call("/explorer")).data;
  assert.equal(updated.issued, prior.issued + 1);
  assert.equal(updated.revoked, prior.revoked + 1);
  assert.equal(
    revoked.find((e) => e.receipt).receipt.events[0].name,
    "CertificateRevoked",
  );
  const failed = await stream(
    "/certificates/" + result.credentialId + "/revoke",
    { reason: "Again" },
  );
  assert.equal(failed.at(-1).stage, "Failed");
  assert.ok(!failed.some((e) => e.stage === "Confirmed"));
});
test("API: chain outage returns distinct 503 and preserves saved record", async () => {
  await new Promise((resolve) => {
    node.once("exit", resolve);
    node.kill();
  });
  const response = await call("/verify/" + issued.credentialId);
  assert.equal(response.status, 503);
  assert.equal(response.error.code, "CHAIN_UNAVAILABLE");
  assert.equal(store.all().length, 2);
  assert.equal((await call("/explorer")).error.code, "CHAIN_UNAVAILABLE");
});
