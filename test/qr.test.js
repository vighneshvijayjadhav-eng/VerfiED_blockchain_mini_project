import { test } from "node:test";
import assert from "node:assert/strict";
import { parseQrPayload, validateQrFile } from "../src/qr.js";
test("QR parser: local certificate URLs preserve ID across ports and hosts", () => {
  for (const host of ["localhost:5173", "127.0.0.1:4321", "[::1]:5173"])
    assert.equal(
      parseQrPayload("http://" + host + "/verify/VED-0123456789ABCDEF"),
      "VED-0123456789ABCDEF",
    );
});
test("QR parser: arbitrary, malformed and disguised URLs rejected", () => {
  for (const payload of [
    "hello",
    "https://evil.test/verify/VED-0123456789ABCDEF",
    "http://localhost:5173/verify/bad",
    "http://localhost:5173/verify/VED-0123456789ABCDEF?next=evil",
    "http://user@localhost/verify/VED-0123456789ABCDEF",
    "http://localhost/other/../verify/VED-0123456789ABCDEF",
    "javascript:alert(1)",
    "http://localhost/./verify/VED-0123456789ABCDEF",
    " http://localhost/verify/VED-0123456789ABCDEF",
  ])
    assert.throws(() => parseQrPayload(payload));
});
test("QR files: formats and size validated", () => {
  for (const type of ["image/png", "image/jpeg", "image/webp"])
    validateQrFile({ type, size: 1000 });
  assert.throws(() => validateQrFile({ type: "image/svg+xml", size: 100 }));
  assert.throws(() =>
    validateQrFile({ type: "image/png", size: 9 * 1024 * 1024 }),
  );
  assert.throws(() => validateQrFile({ type: "image/png", size: 0 }));
});
