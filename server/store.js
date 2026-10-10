import { mkdir, readFile, writeFile, rename } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

export async function readJson(path, fallback) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT" && fallback !== undefined) return fallback;
    throw error;
  }
}
export async function atomicJson(path, value) {
  const temporary = `${path}.${randomUUID()}.tmp`;
  await writeFile(temporary, JSON.stringify(value, null, 2), "utf8");
  await rename(temporary, path);
}
export async function createStore(root, deploymentId) {
  const directory = join(root, deploymentId);
  await mkdir(directory, { recursive: true });
  const path = join(directory, "credentials.json");
  let records = await readJson(path, {});
  return {
    all: () => Object.values(records),
    get: (id) => records[id],
    async put(record) {
      const next = { ...records, [record.data.credentialId]: record };
      await atomicJson(path, next);
      records = next;
    },
  };
}
