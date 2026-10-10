import express from "express";
import { createExplorer } from "./explorer.js";
import { randomBytes } from "node:crypto";
import {
  academicData,
  hashCredential,
  validateId,
  normalized,
  institution,
  AppError,
} from "./canonical.js";
import { createChain, chainIdFor, receiptData } from "./chain.js";
import { certificatePdf, verificationUrl } from "./pdf.js";
import { readJson } from "./store.js";

export function createApp({
  provider,
  deployment,
  store,
  deploymentFile = ".local/deployment.json",
  baseUrl = "http://localhost:5173",
}) {
  const app = express();
  const chain = createChain(provider, deployment);
  const origins = new Set([
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3001",
    "http://127.0.0.1:3001",
    new URL(baseUrl).origin,
  ]);
  app.disable("x-powered-by");
  app.use((req, res, next) => {
    res.set("Cache-Control", "no-store");
    const hostname = req.hostname;
    if (!["localhost", "127.0.0.1", "[::1]"].includes(hostname))
      return next(
        new AppError("Only localhost requests are accepted.", 403, "FORBIDDEN"),
      );
    if (req.headers.origin && !origins.has(req.headers.origin))
      return next(
        new AppError(
          "Foreign browser origins are not allowed.",
          403,
          "FORBIDDEN",
        ),
      );
    if (!["GET", "HEAD"].includes(req.method) && !req.is("application/json"))
      return next(new AppError("Use application/json.", 415));
    next();
  });
  app.use(express.json({ limit: "32kb" }));
  app.use("/api", async (_req, _res, next) => {
    try {
      const active = await readJson(deploymentFile);
      if (
        active.deploymentId !== deployment.deploymentId ||
        active.address !== deployment.address
      )
        throw new Error("Deployment changed");
      next();
    } catch {
      next(
        new AppError(
          "Active deployment changed or is unreadable. Restart npm run dev after running demo:setup.",
          503,
          "CHAIN_UNAVAILABLE",
        ),
      );
    }
  });
  let queue = Promise.resolve();
  const serialize = (work) => {
    const result = queue.then(work);
    queue = result.catch(() => {});
    return result;
  };
  const route = (fn) => async (req, res, next) => {
    try {
      res.json({ ok: true, data: await fn(req) });
    } catch (error) {
      next(error);
    }
  };
  const explorer = createExplorer(provider, deployment, chain);
  const transactionRoute = (fn) => async (req, res, next) => {
    const streaming = req.get("accept") === "application/x-ndjson";
    const emit = (event) => {
      if (streaming && !res.destroyed) res.write(JSON.stringify(event) + "\n");
    };
    if (streaming) {
      res.type("application/x-ndjson");
      res.flushHeaders();
    }
    try {
      const data = await serialize(async () => {
        emit({ stage: "Preparing transaction" });
        return fn(req, emit);
      });
      if (streaming) {
        emit({ data });
        res.end();
      } else res.json({ ok: true, data });
    } catch (error) {
      if (streaming) {
        emit({
          stage: "Failed",
          error: {
            message: error.message,
            code: error.code || "TRANSACTION_FAILED",
          },
        });
        res.end();
      } else next(error);
    }
  };
  async function confirm(transaction, emit) {
    emit({ stage: "Submitted", transactionHash: transaction.hash });
    emit({ stage: "Pending confirmation", transactionHash: transaction.hash });
    const receipt = await transaction.wait();
    if (receipt.status === 1) {
      // Receipt enrichment must never prevent persistence of a mined credential.
      let proof;
      try {
        proof = await explorer.transaction(transaction.hash);
      } catch {
        proof = {
          ...receiptData(receipt),
          sender: transaction.from,
          contractAddress: deployment.address,
          status: "Confirmed",
          kind: "VerifiED contract",
          events: [],
        };
      }
      emit({ stage: "Confirmed", receipt: proof });
    }
    return receipt;
  }
  app.get(
    "/api/explorer",
    route((req) => explorer.overview(req.query.before)),
  );
  app.get(
    "/api/explorer/blocks/:number",
    route((req) => explorer.block(req.params.number)),
  );
  app.get(
    "/api/explorer/transactions/:hash",
    route((req) => explorer.transaction(req.params.hash)),
  );
  async function details(id) {
    validateId(id);
    const live = await chain.lookup(id);
    if (live.status === "NOT_FOUND")
      return { credentialId: id, ...live, record: null };
    const record = store.get(id) || null;
    const evidence = await chain.evidence(id);
    return {
      credentialId: id,
      ...live,
      record,
      evidence,
      storedDataMatches: record
        ? hashCredential(record.data).hash === live.hash
        : null,
      verificationUrl: verificationUrl(baseUrl, id),
    };
  }
  app.get(
    "/api/health",
    route(async () => {
      await chain.assertLive();
      return {
        status: "CONNECTED",
        chainId: Number((await provider.getNetwork()).chainId),
        contractAddress: deployment.address,
        issuer: deployment.issuer,
        blockNumber: await provider.getBlockNumber(),
        deploymentTransaction: deployment.transactionHash,
      };
    }),
  );
  app.get(
    "/api/certificates",
    route(async () => {
      await chain.assertLive();
      return Promise.all(
        store.all().map(async (record) => ({
          record,
          ...(await chain.lookup(record.data.credentialId)),
        })),
      );
    }),
  );
  app.get(
    "/api/certificates/:id",
    route((req) => details(req.params.id)),
  );
  app.get(
    "/api/verify/:id",
    route((req) => details(req.params.id)),
  );
  app.post(
    "/api/certificates",
    transactionRoute(async (req, emit) => {
      const fields = academicData(req.body);
      if (fields.institution !== institution)
        throw new AppError("Only PICT — DEMO credentials may be issued.");
      const credentialId =
        "VED-" + randomBytes(8).toString("hex").toUpperCase();
      const { data, hash } = hashCredential({
        ...fields,
        credentialId,
        issuedAt: new Date().toISOString(),
      });
      const writer = await chain.writer();
      const transaction = await writer.issueCertificate(
        chainIdFor(credentialId),
        hash,
      );
      const receipt = await confirm(transaction, emit);
      if (receipt.status !== 1)
        throw new AppError(
          "Issuance transaction failed.",
          502,
          "TRANSACTION_FAILED",
        );
      const record = {
        data,
        hash,
        issuance: receiptData(receipt, "CertificateIssued"),
        document: {
          filename: `${credentialId}.pdf`,
          verificationUrl: verificationUrl(baseUrl, credentialId),
        },
        revocation: null,
      };
      try {
        await store.put(record);
      } catch {
        throw new AppError(
          `Transaction ${receipt.hash} confirmed for ${credentialId}, but local storage failed. Do not issue again; preserve the transaction reference.`,
          500,
          "PERSISTENCE_FAILED",
        );
      }
      return details(credentialId);
    }),
  );
  app.post(
    "/api/certificates/:id/revoke",
    transactionRoute(async (req, emit) => {
      const id = validateId(req.params.id);
      const reason = normalized(req.body?.reason, "Revocation reason", 300);
      const live = await chain.lookup(id);
      if (live.status === "NOT_FOUND")
        throw new AppError("Credential not found.", 404, "NOT_FOUND");
      if (live.status === "REVOKED")
        throw new AppError(
          "This credential is permanently revoked.",
          409,
          "ALREADY_REVOKED",
        );
      const record = store.get(id);
      if (!record)
        throw new AppError(
          "Local metadata is unavailable; reason cannot be attached.",
          409,
          "MISSING_METADATA",
        );
      const writer = await chain.writer();
      const receipt = await confirm(
        await writer.revokeCertificate(chainIdFor(id)),
        emit,
      );
      if (receipt.status !== 1)
        throw new AppError(
          "Revocation transaction failed.",
          502,
          "TRANSACTION_FAILED",
        );
      try {
        await store.put({
          ...record,
          revocation: {
            ...receiptData(receipt, "CertificateRevoked"),
            reason,
          },
        });
      } catch {
        throw new AppError(
          `Revocation confirmed in ${receipt.hash}, but saving the off-chain reason failed.`,
          500,
          "PERSISTENCE_FAILED",
        );
      }
      return details(id);
    }),
  );
  app.post(
    "/api/integrity/:id",
    route(async (req) => {
      const id = validateId(req.params.id);
      if (req.body?.credentialId !== id)
        throw new AppError("Payload ID must match the lookup ID.");
      const live = await chain.lookup(id);
      if (live.status === "NOT_FOUND")
        return { ...live, integrity: "UNAVAILABLE" };
      const { hash } = hashCredential(req.body);
      return {
        status: live.status,
        integrity: hash === live.hash ? "MATCH" : "MISMATCH",
        suppliedHash: hash,
        onChainHash: live.hash,
      };
    }),
  );
  app.get("/api/certificates/:id/pdf", async (req, res, next) => {
    try {
      const item = await details(req.params.id);
      if (!item.record || item.status === "NOT_FOUND")
        throw new AppError("Certificate is unavailable.", 404, "NOT_FOUND");
      if (!item.storedDataMatches)
        throw new AppError(
          "Stored data differs from the on-chain hash; PDF generation blocked.",
          409,
          "DATA_MISMATCH",
        );
      const pdf = await certificatePdf(item.record.data, baseUrl);
      res
        .type("pdf")
        .set("Content-Disposition", `inline; filename="${req.params.id}.pdf"`)
        .send(pdf);
    } catch (error) {
      next(error);
    }
  });
  app.use("/api", (_req, _res, next) =>
    next(new AppError("API route not found.", 404, "NOT_FOUND")),
  );
  app.use((error, _req, res, _next) => {
    console.error(error.message);
    res.status(error.status || 500).json({
      ok: false,
      error: {
        code:
          error.code && typeof error.code === "string"
            ? error.code
            : "INTERNAL_ERROR",
        message: error.status
          ? error.message
          : "Operation failed. Check the API terminal and local chain.",
      },
    });
  });
  return app;
}
