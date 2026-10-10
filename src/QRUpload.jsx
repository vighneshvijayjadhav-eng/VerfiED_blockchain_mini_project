import React, { useEffect, useRef, useState } from "react";
import { ScanLine } from "lucide-react";
import { parseQrPayload, validateQrFile } from "./qr.js";

export default function QRUpload({ onDecoded }) {
  const [state, setState] = useState({});
  const sequence = useRef(0),
    preview = useRef(null);
  useEffect(
    () => () => {
      sequence.current++;
      if (preview.current) URL.revokeObjectURL(preview.current);
    },
    [],
  );
  function reset() {
    sequence.current++;
    if (preview.current) URL.revokeObjectURL(preview.current);
    preview.current = null;
    setState({});
    onDecoded(null);
  }
  async function decode(file) {
    reset();
    const current = sequence.current;
    try {
      validateQrFile(file);
      const url = URL.createObjectURL(file);
      preview.current = url;
      setState({ url, name: file.name, busy: true });
      const image = new Image();
      image.src = url;
      await image.decode();
      if (image.width * image.height > 20000000)
        throw new Error(
          "Image is too large. Crop the screenshot around the QR code.",
        );
      const { BrowserQRCodeReader } = await import("@zxing/browser");
      let decoded;
      try {
        decoded = await new BrowserQRCodeReader().decodeFromImageElement(image);
      } catch {
        throw new Error(
          "No readable QR found. Try a sharper screenshot with the complete QR and its white border.",
        );
      }
      const id = parseQrPayload(decoded.getText());
      if (sequence.current !== current) return;
      setState({ url, name: file.name, id });
      onDecoded(id);
    } catch (error) {
      if (sequence.current === current)
        setState((old) => ({ ...old, busy: false, error: error.message }));
    }
  }
  return (
    <section className={`card padded qr-panel ${state.url ? "has-image" : ""}`}>
      <div
        className="upload-zone"
        tabIndex={0}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files[0]) decode(e.dataTransfer.files[0]);
        }}
        onPaste={(e) => {
          const file = Array.from(e.clipboardData.items)
            .find((i) => i.type.startsWith("image/"))
            ?.getAsFile();
          if (file) {
            e.preventDefault();
            decode(file);
          }
        }}
      >
        <ScanLine size={36} />
        <h2>Upload a QR screenshot</h2>
        <p>
          Drop an image here, choose a file, or focus this area and press
          Ctrl+V.
        </p>
        <label className="button secondary">
          Choose QR image
          <input
            aria-label="Choose QR image"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              if (e.target.files[0]) decode(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </label>
        <small>PNG, JPEG, WebP · up to 8 MB · decoded on this computer</small>
      </div>
      {state.url && (
        <div className="qr-preview">
          <img src={state.url} alt="Uploaded QR screenshot" />
          <div>
            <p>{state.name}</p>
            {state.id && (
              <p>
                Extracted credential ID: <strong>{state.id}</strong>
              </p>
            )}
            <button className="button secondary" onClick={reset}>
              Reset / scan another QR
            </button>
          </div>
        </div>
      )}
      <div aria-live="polite">
        {state.busy && <p>Decoding image locally…</p>}
        {state.error && (
          <p className="notice error">
            <strong>INVALID QR</strong> — {state.error}
          </p>
        )}
        {state.id && (
          <p>
            QR decoded. Registration and revocation status are checked against
            the live blockchain below.
          </p>
        )}
      </div>
    </section>
  );
}
