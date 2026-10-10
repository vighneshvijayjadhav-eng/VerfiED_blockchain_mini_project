import { createProvider } from "./chain.js";
import { readJson, createStore } from "./store.js";
import { createApp } from "./app.js";

try {
  const deployment = await readJson(".local/deployment.json");
  const store = await createStore(".local", deployment.deploymentId);
  const provider = createProvider();
  const app = createApp({
    provider,
    deployment,
    store,
    baseUrl: process.env.FRONTEND_BASE_URL || "http://localhost:5173",
  });
  const server = app.listen(Number(process.env.PORT || 3001), "127.0.0.1", () =>
    console.log("VerifiED API: http://127.0.0.1:" + (process.env.PORT || 3001)),
  );
  server.on("error", (error) => {
    console.error(error.message);
    provider.destroy();
    process.exitCode = 1;
  });
  for (const signal of ["SIGINT", "SIGTERM"])
    process.on(signal, () =>
      server.close(() => {
        provider.destroy();
        process.exit(0);
      }),
    );
} catch (error) {
  console.error(
    "Run npm run chain and npm run demo:setup first.",
    error.message,
  );
  process.exitCode = 1;
}
