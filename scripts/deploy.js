import { mkdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { ContractFactory } from "ethers";
import { createProvider } from "../server/chain.js";
import { atomicJson, readJson } from "../server/store.js";

const provider = createProvider();
try {
  const metadata = await provider.send("hardhat_metadata", []);
  const old = await readJson(".local/deployment.json", null);
  if (
    !process.argv.includes("--reset") &&
    old?.instanceId === metadata.instanceId &&
    (await provider.getCode(old.address)) !== "0x"
  ) {
    console.log("Existing live deployment retained:", old.address);
  } else {
    const artifact = await readJson(
      "artifacts/contracts/CertificateRegistry.sol/CertificateRegistry.json",
    );
    const signer = await provider.getSigner(0);
    const contract = await new ContractFactory(
      artifact.abi,
      artifact.bytecode,
      signer,
    ).deploy();
    const receipt = await contract.deploymentTransaction().wait();
    await mkdir(".local", { recursive: true });
    await atomicJson(".local/deployment.json", {
      deploymentId: randomUUID(),
      instanceId: metadata.instanceId,
      address: await contract.getAddress(),
      issuer: await signer.getAddress(),
      abi: artifact.abi,
      transactionHash: receipt.hash,
      blockHash: receipt.blockHash,
      blockNumber: receipt.blockNumber,
    });
    console.log(
      "VerifiED deployed:",
      await contract.getAddress(),
      "\nTransaction:",
      receipt.hash,
    );
    console.log(
      "Fresh deployment scope created. Restart npm run dev if already running.",
    );
  }
} catch (error) {
  console.error(
    "Deployment failed. Run npm run chain in another terminal first.",
    error.shortMessage || error.message,
  );
  process.exitCode = 1;
} finally {
  provider.destroy();
}
