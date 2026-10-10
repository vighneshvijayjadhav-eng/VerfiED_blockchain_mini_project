import { Contract, JsonRpcProvider, id, ZeroAddress } from "ethers";
import { AppError } from "./canonical.js";

export const rpcUrl = "http://127.0.0.1:8545";
export function createProvider(url = rpcUrl) {
  return new JsonRpcProvider(url, undefined, {
    cacheTimeout: -1,
    pollingInterval: 200,
  });
}
export const chainIdFor = (credentialId) => id(credentialId);
export const receiptData = (receipt, event) => ({
  transactionHash: receipt.hash,
  blockNumber: receipt.blockNumber,
  blockHash: receipt.blockHash,
  gasUsed: receipt.gasUsed.toString(),
  event,
});
export function createChain(provider, deployment) {
  const contract = new Contract(deployment.address, deployment.abi, provider);
  async function assertLive() {
    try {
      const metadata = await provider.send("hardhat_metadata", []);
      if (metadata.instanceId !== deployment.instanceId)
        throw new Error("Chain was restarted.");
      const receipt = await provider.getTransactionReceipt(
        deployment.transactionHash,
      );
      if (
        !receipt ||
        receipt.blockHash !== deployment.blockHash ||
        (await provider.getCode(deployment.address)) === "0x"
      )
        throw new Error("Deployment is missing.");
      return metadata;
    } catch {
      throw new AppError(
        "Local blockchain or deployment is unavailable. Start the chain, run npm run demo:setup, and restart the app.",
        503,
        "CHAIN_UNAVAILABLE",
      );
    }
  }
  async function lookup(credentialId) {
    await assertLive();
    try {
      const cert = await contract.getCertificate(chainIdFor(credentialId));
      return {
        status: cert.revoked ? "REVOKED" : "VERIFIED",
        hash: cert.dataHash,
        issuer: cert.issuer,
        issuedAt: new Date(Number(cert.issuedAt) * 1000).toISOString(),
        contractAddress: deployment.address,
      };
    } catch (error) {
      let decoded;
      try {
        decoded = contract.interface.parseError(error.data);
      } catch {
        /* RPC transport errors have no revert data. */
      }
      if (decoded?.name === "NotFound")
        return { status: "NOT_FOUND", contractAddress: deployment.address };
      throw new AppError(
        "The live contract could not be read.",
        503,
        "CHAIN_UNAVAILABLE",
      );
    }
  }
  async function writer() {
    await assertLive();
    const signer = await provider.getSigner(0);
    if (
      (await signer.getAddress()) === ZeroAddress ||
      (await signer.getAddress()).toLowerCase() !==
        deployment.issuer.toLowerCase()
    )
      throw new AppError(
        "Local issuer does not match deployment.",
        503,
        "CHAIN_UNAVAILABLE",
      );
    return contract.connect(signer);
  }
  async function evidence(credentialId) {
    const key = chainIdFor(credentialId);
    const [issues, revocations] = await Promise.all([
      contract.queryFilter(
        contract.filters.CertificateIssued(key),
        deployment.blockNumber,
      ),
      contract.queryFilter(
        contract.filters.CertificateRevoked(key),
        deployment.blockNumber,
      ),
    ]);
    const summarize = async (log) =>
      log
        ? {
            transactionHash: log.transactionHash,
            blockNumber: log.blockNumber,
            blockHash: log.blockHash,
            event: log.fragment.name,
            timestamp: new Date(
              (await provider.getBlock(log.blockNumber)).timestamp * 1000,
            ).toISOString(),
          }
        : null;
    return {
      issuance: await summarize(issues[0]),
      revocation: await summarize(revocations[0]),
    };
  }
  return { contract, assertLive, lookup, writer, evidence };
}
