export function parseQrPayload(payload) {
  if (
    typeof payload !== "string" ||
    payload.length > 512 ||
    !/^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::[0-9]{1,5})?\/verify\/VED-[A-F0-9]{16}\/?$/.test(
      payload,
    )
  )
    throw new Error("Malformed QR payload.");
  let url;
  try {
    url = new URL(payload);
  } catch {
    throw new Error("This QR does not contain a VerifiED verification URL.");
  }
  if (
    !["http:", "https:"].includes(url.protocol) ||
    !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    !/^\/verify\/VED-[A-F0-9]{16}\/?$/.test(url.pathname) ||
    payload.includes("%") ||
    payload.includes("\\") ||
    payload.includes("/../")
  )
    throw new Error(
      "Use a local VerifiED certificate QR, not an unrelated link.",
    );
  return url.pathname.split("/")[2];
}
export function validateQrFile(file) {
  if (!["image/png", "image/jpeg", "image/webp"].includes(file.type))
    throw new Error("Choose a PNG, JPEG or WebP image.");
  if (!file.size || file.size > 8 * 1024 * 1024)
    throw new Error("Choose a nonempty image smaller than 8 MB.");
}
