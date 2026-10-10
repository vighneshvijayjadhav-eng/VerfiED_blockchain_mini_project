import { AppError } from "./canonical.js";

export function createExplorer(provider, deployment, chain) {
  const classify = (tx) =>
    tx.hash === deployment.transactionHash
      ? "Registry deployment"
      : tx.to?.toLowerCase() === deployment.address.toLowerCase()
        ? "VerifiED contract"
        : "Other network transaction";
  async function block(number) {
    await chain.assertLive();
    if (!/^\d+$/.test(String(number)) || !Number.isSafeInteger(Number(number)))
      throw new AppError("Invalid block number.");
    const value = await provider.getBlock(Number(number));
    if (!value) throw new AppError("Block not found.", 404, "NOT_FOUND");
    return {
      number: value.number,
      hash: value.hash,
      parentHash: value.parentHash,
      timestamp: new Date(value.timestamp * 1000).toISOString(),
      transactions: await Promise.all(
        value.transactions.map(async (hash) => {
          const tx = await provider.getTransaction(hash);
          return { hash, kind: classify(tx) };
        }),
      ),
    };
  }
  async function transaction(hash) {
    await chain.assertLive();
    if (!/^0x[0-9a-f]{64}$/i.test(hash))
      throw new AppError("Invalid transaction hash.");
    const tx = await provider.getTransaction(hash);
    if (!tx) throw new AppError("Transaction not found.", 404, "NOT_FOUND");
    const receipt = await provider.getTransactionReceipt(hash);
    const mined = receipt && (await provider.getBlock(receipt.blockNumber));
    const events = (receipt?.logs || [])
      .filter(
        (log) => log.address.toLowerCase() === deployment.address.toLowerCase(),
      )
      .flatMap((log) => {
        const decoded = chain.contract.interface.parseLog(log);
        return decoded
          ? [
              {
                name: decoded.name,
                args: Object.fromEntries(
                  decoded.fragment.inputs.map((input, i) => [
                    input.name,
                    String(decoded.args[i]),
                  ]),
                ),
              },
            ]
          : [];
      });
    return {
      transactionHash: hash,
      sender: tx.from,
      contractAddress: tx.to || receipt?.contractAddress,
      kind: classify(tx),
      status: !receipt
        ? "Pending confirmation"
        : receipt.status === 1
          ? "Confirmed"
          : "Failed",
      blockNumber: receipt?.blockNumber,
      blockHash: receipt?.blockHash,
      gasUsed: receipt?.gasUsed.toString(),
      timestamp: mined && new Date(mined.timestamp * 1000).toISOString(),
      events,
    };
  }
  let cached;
  async function overview(before) {
    await chain.assertLive();
    const latest = await provider.getBlock("latest");
    if (
      before !== undefined &&
      (!/^\d+$/.test(before) || !Number.isSafeInteger(Number(before)))
    )
      throw new AppError("Invalid block cursor.");
    if (cached?.hash === latest.hash && cached.before === before)
      return cached.value;
    const top = Math.min(
      latest.number,
      before === undefined ? latest.number : Number(before),
    );
    const [network, issues, revocations, blocks] = await Promise.all([
      provider.getNetwork(),
      chain.contract.queryFilter(
        chain.contract.filters.CertificateIssued(),
        deployment.blockNumber,
        latest.number,
      ),
      chain.contract.queryFilter(
        chain.contract.filters.CertificateRevoked(),
        deployment.blockNumber,
        latest.number,
      ),
      Promise.all(
        Array.from({ length: Math.min(12, top + 1) }, (_, i) => block(top - i)),
      ),
    ]);
    const value = {
      status: "CONNECTED",
      chainId: String(network.chainId),
      blockNumber: latest.number,
      blockHash: latest.hash,
      contractAddress: deployment.address,
      issued: issues.length,
      revoked: revocations.length,
      blocks,
      nextBefore: top >= 12 ? top - 12 : null,
      activity: [...issues, ...revocations]
        .sort((a, b) => b.blockNumber - a.blockNumber || b.index - a.index)
        .slice(0, 20)
        .map((log) => ({
          event: log.fragment.name,
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          key: `${log.transactionHash}:${log.index}`,
        })),
    };
    cached = { hash: latest.hash, before, value };
    return value;
  }
  return { block, transaction, overview };
}
