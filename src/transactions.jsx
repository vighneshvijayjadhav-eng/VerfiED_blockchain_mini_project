import React from "react";
import { Link } from "react-router-dom";

export async function transact(path, body, onProgress) {
  const response = await fetch("/api" + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson",
    },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const value = await response.json();
    throw Object.assign(new Error(value.error.message), {
      code: value.error.code,
    });
  }
  const reader = response.body.getReader(),
    decoder = new TextDecoder();
  let buffer = "",
    result,
    failure;
  while (true) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value, { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines.filter(Boolean)) {
      const event = JSON.parse(line);
      if (event.stage) onProgress((old) => [...old, event]);
      if (event.error)
        failure = Object.assign(new Error(event.error.message), {
          code: event.error.code,
        });
      if (event.data) result = event.data;
    }
    if (done) break;
  }
  if (failure) throw failure;
  if (!result)
    throw new Error(
      "Connection ended before the result arrived. Check the registry before trying again.",
    );
  return result;
}
export function Receipt({ value }) {
  return (
    <div className="receipt">
      <h3>
        {value.status} · {value.kind}
      </h3>
      <dl>
        {Object.entries(value)
          .filter(([key]) => !["events", "kind"].includes(key))
          .map(([key, v]) => (
            <div key={key}>
              <dt>{key.replace(/([A-Z])/g, " $1")}</dt>
              <dd>{String(v ?? "Awaiting confirmation")}</dd>
            </div>
          ))}
      </dl>
      <div className="actions">
        <Link to={"/explorer/transactions/" + value.transactionHash}>
          View Transaction
        </Link>
        {value.blockNumber != null && (
          <Link to={"/explorer/blocks/" + value.blockNumber}>
            View Block {value.blockNumber}
          </Link>
        )}
      </div>
      <h4>Decoded contract events</h4>
      {value.events.map((event, i) => (
        <div key={i}>
          <strong>{event.name}</strong>
          <pre>{JSON.stringify(event.args, null, 2)}</pre>
        </div>
      ))}
      {!value.events.length && (
        <p>No events from the current VerifiED contract.</p>
      )}
    </div>
  );
}
export function TransactionProgress({ events }) {
  if (!events.length) return null;
  return (
    <section className="card padded transaction-progress" aria-live="polite">
      <h3>Transaction workflow</h3>
      <ol>
        {events.map((event, i) => (
          <li key={i}>
            {event.stage}
            {event.transactionHash && <code>{event.transactionHash}</code>}
          </li>
        ))}
      </ol>
      {events.find((e) => e.receipt)?.receipt && (
        <Receipt value={events.find((e) => e.receipt).receipt} />
      )}
    </section>
  );
}
