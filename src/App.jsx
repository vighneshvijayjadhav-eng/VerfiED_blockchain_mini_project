import React, { useEffect, useState, useRef } from "react";
import {
  Routes,
  Route,
  NavLink,
  Link,
  useParams,
  useNavigate,
  useLocation,
} from "react-router-dom";
import {
  ShieldCheck,
  LayoutDashboard,
  FilePlus2,
  LibraryBig,
  ScanLine,
  ArrowUpRight,
  ArrowRight,
  Download,
  Check,
  CircleCheck,
  CircleX,
  AlertTriangle,
  Search,
  X,
  LoaderCircle,
  Blocks,
  Fingerprint,
  Copy,
  GraduationCap,
  ChevronRight,
  Ban,
} from "lucide-react";
import "./styles.css";
import QRUpload from "./QRUpload.jsx";
import { transact, TransactionProgress, Receipt } from "./transactions.jsx";

const institution = "Pune Institute of Computer Technology (PICT) — DEMO";
const fields = [
  ["fullName", "Full name"],
  ["rollNumber", "Roll number"],
  ["department", "Department"],
  ["degree", "Degree / course"],
  ["academicYear", "Academic year"],
  ["grade", "Grade"],
  ["completionDate", "Completion date"],
  ["institution", "Institution"],
];
const sample = {
  fullName: "Aarav Deshmukh",
  rollNumber: "TE-2026-042",
  department: "Computer Engineering",
  degree: "Bachelor of Engineering",
  academicYear: "2025-2026",
  grade: "A+",
  completionDate: "2026-06-15",
  institution,
};
const blank = Object.fromEntries(
  fields.map(([key]) => [key, key === "institution" ? institution : ""]),
);
async function api(path, body) {
  let response;
  try {
    response = await fetch(
      "/api" + path,
      body === undefined
        ? {}
        : {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          },
    );
  } catch {
    throw new Error(
      "API unavailable. Start npm run dev and the local blockchain.",
    );
  }
  const result = await response.json().catch(() => ({
    ok: false,
    error: {
      message: "The API did not return JSON. Check the server terminal.",
    },
  }));
  if (!result.ok) {
    const error = new Error(result.error.message);
    error.code = result.error.code;
    throw error;
  }
  return result.data;
}
function useLoad(path, revision = 0) {
  const [state, setState] = useState({
    loading: true,
    data: null,
    error: null,
  });
  useEffect(() => {
    let alive = true;
    setState({ path, revision, loading: true, data: null, error: null });
    api(path)
      .then(
        (data) =>
          alive &&
          setState({ path, revision, loading: false, data, error: null }),
      )
      .catch(
        (error) =>
          alive &&
          setState({ path, revision, loading: false, data: null, error }),
      );
    return () => {
      alive = false;
    };
  }, [path, revision]);
  return state.path === path && state.revision === revision
    ? state
    : { loading: true, data: null, error: null };
}
const formatDate = (value) =>
  new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
function Pill({ status }) {
  const labels = {
    VERIFIED: "Verified",
    REVOKED: "Revoked",
    NOT_FOUND: "Not found",
    MATCH: "Data matches",
    MISMATCH: "Data mismatch",
    CONNECTED: "Local chain connected",
  };
  return (
    <span className={`pill ${status?.toLowerCase()}`}>
      <span />
      {labels[status] || status}
    </span>
  );
}
function Notice({ error }) {
  return error ? (
    <div className="notice" role="alert">
      <AlertTriangle size={20} />
      <div>
        <strong>
          {error.code === "CHAIN_UNAVAILABLE"
            ? "Chain unavailable"
            : "Unable to complete request"}
        </strong>
        <p>{error.message || error}</p>
      </div>
    </div>
  ) : null;
}
function Loading() {
  return (
    <div className="loading" aria-label="Loading live blockchain data">
      <div className="skeleton" />
      <div className="skeleton" />
      <div className="skeleton" />
    </div>
  );
}
function Heading({ eyebrow, title, children, action }) {
  return (
    <header className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{children}</p>
      </div>
      {action}
    </header>
  );
}
function Empty() {
  return (
    <div className="empty">
      <div className="empty-icon">
        <GraduationCap size={34} />
      </div>
      <h3>Your first credential starts here.</h3>
      <p>
        Issue an academic record and anchor its integrity on the local
        blockchain.
      </p>
      <Link className="button" to="/issue">
        Issue a certificate <ArrowRight size={16} />
      </Link>
    </div>
  );
}
function CopyValue({ value }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="copy-value"
      title="Copy full value"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          setCopied(false);
        }
      }}
    >
      <code>{value}</code>
      {copied ? <Check size={14} /> : <Copy size={14} />}
    </button>
  );
}
export default function Shell() {
  const health = useLoad("/health");
  const location = useLocation();
  const publicPage = location.pathname.startsWith("/verify");
  if (publicPage)
    return (
      <div className="public-shell">
        <header className="public-nav">
          <Link className="brand dark" to="/">
            <ShieldCheck />
            Verifi<span>ED</span>
          </Link>
          <span className="public-tag">ACADEMIC TRUST, MADE VISIBLE</span>
          <Link to="/" className="text-link">
            Issuer workspace <ArrowUpRight size={15} />
          </Link>
        </header>
        <main>
          <AppRoutes />
        </main>
        <footer>
          PICT — DEMO{" "}
          <span>Academic blockchain prototype · Localhost only</span>
        </footer>
      </div>
    );
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link className="brand" to="/">
          <ShieldCheck />
          Verifi<span>ED</span>
        </Link>
        <div className="workspace-label">
          PICT — DEMO <span>Academic workspace</span>
        </div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>
          {[
            ["/", "Overview", LayoutDashboard],
            ["/issue", "Issue certificate", FilePlus2],
            ["/registry", "Certificate registry", LibraryBig],
            ["/explorer", "Blockchain Explorer", Blocks],
            ["/verify", "Public verification", ScanLine],
          ].map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end>
              <Icon size={19} />
              {label}
              {to === "/verify" && <ArrowUpRight size={14} />}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="network-indicator">
            <span className={health.data ? "online-dot" : "offline-dot"} />
            {health.data ? "Hardhat · Local network" : "Chain not connected"}
          </div>
          <p>
            Real transactions.
            <br />A controlled demo environment.
          </p>
          <div className="issuer-avatar">
            <span>PI</span>
            <div>
              Demo Authorized Issuer<small>Local development account</small>
            </div>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <div className="topbar">
          <span>Academic credential management</span>
          <span>
            <span className="small-dot" /> LOCAL DEMO{" "}
            <span className="avatar">PI</span>
          </span>
        </div>
        <main>
          <AppRoutes />
        </main>
        <footer>
          VerifiED <span>Built for academic trust · PICT — DEMO</span>
        </footer>
      </div>
    </div>
  );
}
function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/issue" element={<Issue />} />
      <Route path="/registry" element={<Registry />} />
      <Route path="/explorer" element={<Explorer />} />
      <Route path="/explorer/blocks/:number" element={<ExplorerInspect />} />
      <Route
        path="/explorer/transactions/:hash"
        element={<ExplorerInspect />}
      />
      <Route path="/certificates/:id" element={<Details />} />
      <Route path="/verify" element={<Verify />} />
      <Route path="/verify/:id" element={<Verify />} />
      <Route
        path="*"
        element={
          <Heading
            title="Page not found"
            action={<Link to="/">Return to overview</Link>}
          />
        }
      />
    </Routes>
  );
}
function RecordTable({ items, compact = false }) {
  if (!items.length) return <Empty />;
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            <th>RECIPIENT</th>
            <th>CREDENTIAL</th>
            {!compact && <th>ISSUED</th>}
            <th>LIVE STATUS</th>
            <th aria-label="Actions" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.record.data.credentialId}>
              <td>
                <div className="recipient">
                  <span className="initials">
                    {item.record.data.fullName
                      .split(" ")
                      .map((s) => s[0])
                      .slice(0, 2)
                      .join("")}
                  </span>
                  <div>
                    <strong>{item.record.data.fullName}</strong>
                    <small>
                      {item.record.data.rollNumber} ·{" "}
                      {item.record.data.department}
                    </small>
                  </div>
                </div>
              </td>
              <td>
                <span>{item.record.data.degree}</span>
                <small className="mono">{item.record.data.credentialId}</small>
              </td>
              {!compact && <td>{formatDate(item.record.data.issuedAt)}</td>}
              <td>
                <Pill status={item.status} />
              </td>
              <td>
                <Link
                  className="icon-link"
                  aria-label={`View ${item.record.data.fullName}`}
                  to={"/certificates/" + item.record.data.credentialId}
                >
                  <ArrowUpRight size={19} />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
function Dashboard() {
  const records = useLoad("/certificates"),
    health = useLoad("/health");
  const items = records.data || [];
  const counts = [
    items.filter((x) => x.status !== "NOT_FOUND").length,
    items.filter((x) => x.status === "VERIFIED").length,
    items.filter((x) => x.status === "REVOKED").length,
  ];
  return (
    <>
      <Heading
        eyebrow="THE ISSUER WORKSPACE"
        title="A trusted record. A brighter future."
      >
        Your institution’s academic credentials, secured and verifiable.
      </Heading>
      <section className="hero">
        <div className="hero-content">
          <div className="hero-kicker">
            <span /> KNOWLEDGE. RECOGNITION. TRUST.
          </div>
          <h2>
            Achievement deserves
            <br />a lasting proof.
          </h2>
          <p>
            Issue with confidence. Verify in seconds.
            <br />
            Every credential backed by the blockchain.
          </p>
          <Link to="/issue" className="button light">
            Issue a certificate <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="hero-caption">
          THE VERIFIED ACADEMIC ARCHIVE <span>01 / LOCAL EDITION</span>
        </div>
      </section>
      <Notice error={records.error} />
      <div className="stats">
        {[
          ["Credentials issued", "Confirmed on the blockchain", LibraryBig],
          ["Active credentials", "Ready for public verification", ShieldCheck],
          ["Revoked credentials", "Permanently marked on-chain", Ban],
        ].map(([label, sub, Icon], i) => (
          <div className="stat" key={label}>
            <div>
              <span>{label}</span>
              <Icon size={20} />
            </div>
            <strong>
              {records.loading || records.error ? "—" : counts[i]}
            </strong>
            <small>{sub}</small>
          </div>
        ))}
      </div>
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>Recent credentials</h2>
            <p>A live view of your academic records.</p>
          </div>
          <Link className="text-link" to="/registry">
            View registry <ArrowRight size={16} />
          </Link>
        </div>
        {records.error ? null : records.loading ? (
          <Loading />
        ) : (
          <RecordTable compact items={[...items].reverse().slice(0, 5)} />
        )}
      </section>
      <div className="chain-strip">
        <Blocks size={23} />
        <div>
          <strong>
            {health.data
              ? "Connected to your local blockchain"
              : "Blockchain connection unavailable"}
          </strong>
          <small>
            {health.data
              ? `Hardhat · Chain ID 31337 · Latest block ${health.data.blockNumber}`
              : "Start the local node and deploy the registry."}
          </small>
        </div>
        {health.data && (
          <span className="chain-address">
            Contract <code>{health.data.contractAddress}</code>
          </span>
        )}
      </div>
    </>
  );
}
function AcademicFields({ data, onChange, integrity = false }) {
  return (
    <div className="form-grid">
      {fields.map(([key, label]) => (
        <label key={key} className={key === "institution" ? "span-two" : ""}>
          {label}
          <input
            required
            maxLength={
              key === "institution" ? 100 : key === "fullName" ? 64 : 70
            }
            type={key === "completionDate" ? "date" : "text"}
            value={data[key] || ""}
            readOnly={!integrity && key === "institution"}
            placeholder={
              {
                fullName: "e.g. Aarav Deshmukh",
                rollNumber: "e.g. TE-2026-042",
                department: "Computer Engineering",
                degree: "Bachelor of Engineering",
                academicYear: "2025-2026",
                grade: "A+",
              }[key]
            }
            onChange={(event) =>
              onChange({ ...data, [key]: event.target.value })
            }
          />
        </label>
      ))}
    </div>
  );
}
function Preview({ data }) {
  return (
    <div className="certificate-preview">
      <div className="certificate-inner">
        <div className="mini-crest">
          <GraduationCap size={23} />
        </div>
        <div className="eyebrow">PICT — DEMO</div>
        <p className="preview-institution">
          Pune Institute of Computer Technology
        </p>
        <h2>Academic Certificate</h2>
        <p>This is to certify that</p>
        <h3>{data.fullName || "Recipient’s full name"}</h3>
        <p>has completed</p>
        <strong>{data.degree || "Degree / course"}</strong>
        <p>
          {data.department || "Department"} ·{" "}
          {data.academicYear || "Academic year"}
        </p>
        <div className="preview-bottom">
          <span>
            Grade <b>{data.grade || "—"}</b>
          </span>
          <span className="demo-seal">DEMO</span>
          <span>Demo Authorized Issuer</span>
        </div>
        <small>Academic prototype — not an official certificate</small>
      </div>
    </div>
  );
}
function Issue({ onComplete }) {
  const [progress, setProgress] = useState([]);
  const [data, setData] = useState(blank),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null),
    [issued, setIssued] = useState(null);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      setProgress([]);
      const result = await transact("/certificates", data, setProgress);
      setIssued(result);
      onComplete?.(result);
    } catch (error) {
      setError(error);
    } finally {
      setBusy(false);
    }
  }
  if (issued)
    return (
      <>
        <Heading
          eyebrow="ISSUANCE COMPLETE"
          title="An achievement, now on record."
        >
          The authorized transaction has been confirmed on your local
          blockchain.
        </Heading>
        <div className="success-banner">
          <CircleCheck size={34} />
          <div>
            <h2>Certificate successfully issued</h2>
            <p>
              {issued.record.data.fullName} · {issued.credentialId}
            </p>
          </div>
          <Pill status={issued.status} />
        </div>
        <div className="two-columns">
          <Preview data={issued.record.data} />
          <section className="card padded">
            <h2>Your next steps</h2>
            <p>
              Download the certificate or open its public verification page.
            </p>
            <div className="stack-actions">
              <a
                className="button"
                href={`/api/certificates/${issued.credentialId}/pdf`}
                target="_blank"
                rel="noreferrer"
              >
                <Download size={17} /> View / print / download PDF
              </a>
              <Link
                className="button secondary"
                to={"/verify/" + issued.credentialId}
              >
                <ScanLine size={17} /> Open public verification
              </Link>
              <Link
                className="text-link"
                to={"/certificates/" + issued.credentialId}
              >
                View credential details <ArrowRight size={16} />
              </Link>
            </div>
            <Evidence item={issued} />
            <TransactionProgress events={progress} />
            <button
              className="button secondary"
              onClick={() => {
                setIssued(null);
                setData(blank);
              }}
            >
              Issue another certificate
            </button>
          </section>
        </div>
      </>
    );
  return (
    <>
      <Heading
        eyebrow="CREATE A CREDENTIAL"
        title="Recognise an achievement."
        action={
          <div className="actions">
            <button
              className="button secondary"
              disabled={busy}
              onClick={() => setData(sample)}
            >
              Use fictional demo data
            </button>
            <button className="button" form="issue-form" disabled={busy}>
              {busy ? (
                <>
                  <LoaderCircle className="spin" size={17} /> Confirming
                  transaction…
                </>
              ) : (
                <>
                  Issue certificate <ArrowRight size={17} />
                </>
              )}
            </button>
          </div>
        }
      >
        Academic details stay off-chain. Their cryptographic proof lives on it.
      </Heading>
      <div className="issue-layout">
        <div>
          <TransactionProgress events={progress} />
          <form id="issue-form" className="card padded" onSubmit={submit}>
            <div className="step-heading">
              <span>01</span>
              <div>
                <h2>Academic details</h2>
                <p>Enter the record exactly as it should appear.</p>
              </div>
            </div>
            <fieldset disabled={busy}>
              <AcademicFields data={data} onChange={setData} />
            </fieldset>
            <div className="form-note">
              <Fingerprint size={20} />
              <p>
                A SHA-256 hash of the complete canonical record will be
                registered. No student details are sent to the blockchain.
              </p>
            </div>
            <Notice error={error} />
            <small className="muted">
              Localhost demo action · Contract enforces the authorized issuer
            </small>
          </form>
        </div>
        <aside className="preview-column">
          <div className="eyebrow">LIVE DOCUMENT PREVIEW</div>
          <Preview data={data} />
          <div className="quiet-note">
            <ShieldCheck size={23} />
            <div>
              <h3>Designed to be verified.</h3>
              <p>
                The final A4 certificate includes a unique ID and a QR link to
                its live registration status.
              </p>
            </div>
          </div>
          <div className="quiet-note">
            <Blocks size={23} />
            <div>
              <h3>A real transaction. A clear record.</h3>
              <p>
                Confirmation includes a transaction hash, block number and
                issuance event.
              </p>
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
function Registry() {
  const [search, setSearch] = useState("");
  const state = useLoad("/certificates");
  const items = (state.data || []).filter((x) =>
    `${x.record.data.fullName} ${x.record.data.rollNumber} ${x.record.data.credentialId}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  return (
    <>
      <Heading
        eyebrow="ACADEMIC ARCHIVE"
        title="Certificate registry"
        action={
          <Link to="/issue" className="button">
            <FilePlus2 size={17} /> Issue certificate
          </Link>
        }
      >
        Every credential, its current status and its blockchain evidence.
      </Heading>
      <Notice error={state.error} />
      <section className="card">
        <div className="section-heading">
          <div>
            <h2>
              All credentials{" "}
              <span className="count">{state.data?.length ?? "—"}</span>
            </h2>
            <p>Open a record to view evidence, download or revoke.</p>
          </div>
          <label className="search">
            <Search size={18} />
            <input
              aria-label="Search records"
              placeholder="Search name, roll number or ID"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
        </div>
        {state.error ? null : state.loading ? (
          <Loading />
        ) : items.length || !search ? (
          <RecordTable items={[...items].reverse()} />
        ) : (
          <div className="empty">
            <Search />
            <h3>No matching records</h3>
            <p>Try another name, roll number or credential ID.</p>
          </div>
        )}
      </section>
    </>
  );
}
function Evidence({ item }) {
  return (
    <div className="evidence">
      <h3>
        <Blocks size={18} /> Blockchain evidence
      </h3>
      {[
        ["Contract address", item.contractAddress],
        ["Authorized issuer", item.issuer],
        ["SHA-256 · canonical data", item.hash],
      ].map(
        ([label, value]) =>
          value && (
            <div key={label}>
              <small>{label}</small>
              <CopyValue value={value} />
            </div>
          ),
      )}
      {["issuance", "revocation"].map(
        (key) =>
          item.evidence?.[key] && (
            <div className="event" key={key}>
              <span className="event-dot" />
              <small>
                {item.evidence[key].event} · Block{" "}
                {item.evidence[key].blockNumber}
              </small>
              <small>{item.evidence[key].timestamp}</small>
              <CopyValue value={item.evidence[key].transactionHash} />
              <div className="actions">
                <Link
                  to={
                    "/explorer/transactions/" +
                    item.evidence[key].transactionHash
                  }
                >
                  View Transaction
                </Link>
                <Link to={"/explorer/blocks/" + item.evidence[key].blockNumber}>
                  View Block
                </Link>
              </div>
            </div>
          ),
      )}
    </div>
  );
}
function FieldList({ data }) {
  return (
    <dl className="field-list">
      {[
        ...fields,
        ["credentialId", "Credential ID"],
        ["issuedAt", "Issue timestamp (UTC)"],
      ].map(([key, label]) => (
        <div key={key}>
          <dt>{label}</dt>
          <dd>{data[key]}</dd>
        </div>
      ))}
    </dl>
  );
}
function RevokeDialog({ id, onClose, onDone }) {
  const [progress, setProgress] = useState([]);
  const [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  const ref = useRef();
  useEffect(() => {
    ref.current.showModal();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={(event) => {
        if (busy) event.preventDefault();
        else onClose();
      }}
    >
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            setProgress([]);
            const result = await transact(
              `/certificates/${id}/revoke`,
              { reason },
              setProgress,
            );
            onDone(result);
          } catch (error) {
            setError(error);
            setBusy(false);
          }
        }}
      >
        <div className="dialog-heading">
          <span className="danger-icon">
            <Ban />
          </span>
          <button
            type="button"
            className="icon-link"
            aria-label="Close dialog"
            disabled={busy}
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <h2>Permanently revoke this credential?</h2>
        <TransactionProgress events={progress} />
        <p>
          This cannot be undone. The same verification link will show{" "}
          <strong>Revoked</strong> after the transaction confirms.
        </p>
        <label>
          Revocation reason
          <textarea
            required
            maxLength={300}
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Explain why this record is being revoked"
            disabled={busy}
          />
        </label>
        <small>
          The reason is stored off-chain. It is not independently
          blockchain-verifiable.
        </small>
        <Notice error={error} />
        <div className="actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button danger" disabled={busy || !reason.trim()}>
            {busy ? (
              <>
                <LoaderCircle size={16} className="spin" /> Confirming…
              </>
            ) : (
              "Permanently revoke"
            )}
          </button>
        </div>
      </form>
    </dialog>
  );
}
function Details() {
  const { id } = useParams();
  const [revision, setRevision] = useState(0),
    [modal, setModal] = useState(false);
  const state = useLoad("/certificates/" + id, revision);
  const item = state.data;
  return (
    <>
      <Link className="breadcrumb" to="/registry">
        Certificate registry <ChevronRight size={14} /> Credential details
      </Link>
      <Heading
        eyebrow="CREDENTIAL RECORD"
        title={item?.record?.data.fullName || "Certificate details"}
        action={
          item?.record && (
            <div className="actions">
              <a
                className="button secondary"
                target="_blank"
                rel="noreferrer"
                href={`/api/certificates/${id}/pdf`}
              >
                <Download size={16} /> Certificate PDF
              </a>
              <Link className="button" to={"/verify/" + id}>
                Verify <ArrowUpRight size={16} />
              </Link>
            </div>
          )
        }
      >
        {id}
      </Heading>
      <Notice error={state.error} />
      {state.loading ? (
        <Loading />
      ) : item?.status === "NOT_FOUND" ? (
        <div className="notice">
          This credential is not registered on the current blockchain.
        </div>
      ) : (
        item && (
          <>
            <div className="status-bar">
              <Pill status={item.status} />
              <span>
                {item.status === "REVOKED"
                  ? "Permanently revoked on the blockchain."
                  : "Registered by the authorized issuer."}
              </span>
              {item.status === "VERIFIED" && item.record && (
                <button
                  className="text-link danger-text"
                  onClick={() => setModal(true)}
                >
                  <Ban size={16} /> Revoke credential
                </button>
              )}
            </div>
            <div className="two-columns">
              <div>
                {item.record && <Preview data={item.record.data} />}
                <section className="card padded space-top">
                  <h2>Academic record</h2>
                  <p className="muted">
                    Off-chain metadata ·{" "}
                    {item.storedDataMatches
                      ? "matches the registered hash"
                      : "integrity not confirmed"}
                  </p>
                  {item.record ? (
                    <FieldList data={item.record.data} />
                  ) : (
                    <p>Local academic data is unavailable.</p>
                  )}
                </section>
              </div>
              <section className="card padded">
                <Evidence item={item} />
                {item.record?.revocation && (
                  <div className="revoke-reason">
                    <h3>Revocation reason</h3>
                    <p>{item.record.revocation.reason}</p>
                    <small>
                      Off-chain issuer statement; not independently proven by
                      the chain.
                    </small>
                  </div>
                )}
                <div className="quiet-note">
                  <Fingerprint />
                  <p>
                    Registration status and data integrity are separate claims.
                    An unchanged record may still be revoked.
                  </p>
                </div>
              </section>
            </div>
          </>
        )
      )}
      {modal && (
        <RevokeDialog
          id={id}
          onClose={() => setModal(false)}
          onDone={() => {
            setModal(false);
            setRevision((x) => x + 1);
          }}
        />
      )}
    </>
  );
}
function Verify() {
  const [tab, setTab] = useState("Enter Credential ID");
  const [qrId, setQrId] = useState(null);
  const { id } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState(id || "");
  useEffect(() => setQuery(id || ""), [id]);
  return (
    <>
      <section className="verification-hero">
        <div className="eyebrow">THE PUBLIC VERIFICATION PORTAL</div>
        <h1>Confidence in every credential.</h1>
        <p>
          Check the live blockchain record. Know where an achievement stands.
        </p>
        <span className="verification-seal">
          <ShieldCheck size={52} />
        </span>
      </section>
      <div className="verify-content">
        <div className="verify-tabs card">
          <Segments
            values={[
              "Enter Credential ID",
              "Upload QR Image",
              "Check Credential Data Integrity",
            ]}
            value={tab}
            onChange={(next) => {
              if (next === tab) return;
              if (tab === "Upload QR Image" && qrId) navigate("/verify/" + qrId);
              if (next === "Upload QR Image") setQrId(null);
              setTab(next);
            }}
          />
        </div>
        {tab === "Upload QR Image" ? (
          <QRUpload onDecoded={setQrId} />
        ) : (
          <form
            className="lookup card"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(
                "/verify/" + encodeURIComponent(query.trim().toUpperCase()),
              );
            }}
          >
            <label htmlFor="lookup">
              Verify an academic credential
              <small>Enter the ID printed on the certificate.</small>
            </label>
            <div>
              <input
                id="lookup"
                required
                placeholder="VED-…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <button className="button">
                <Search size={18} /> Verify credential
              </button>
            </div>
          </form>
        )}
        {(tab === "Upload QR Image" ? qrId : id) ? (
          <VerificationResult
            key={(tab === "Upload QR Image" ? qrId : id) + tab}
            id={tab === "Upload QR Image" ? qrId : id}
            integrityOpen={tab === "Check Credential Data Integrity"}
          />
        ) : (
          <div className="verification-intro">
            <div>
              <ShieldCheck />
              <h3>Live registration</h3>
              <p>Read directly from the deployed smart contract.</p>
            </div>
            <div>
              <Fingerprint />
              <h3>Independent integrity check</h3>
              <p>Compare supplied academic data with its on-chain hash.</p>
            </div>
            <div>
              <ScanLine />
              <h3>One link, current status</h3>
              <p>The original QR reflects permanent revocation.</p>
            </div>
          </div>
        )}
        <div className="trust-note">
          <AlertTriangle size={19} />
          <p>
            A valid QR proves registration status only. It does not authenticate
            the appearance or bytes of a PDF. This is a localhost academic
            prototype, not an official PICT service.
          </p>
        </div>
      </div>
    </>
  );
}
function VerificationResult({ id, integrityOpen = false }) {
  const [revision, setRevision] = useState(0);
  const state = useLoad("/verify/" + id, revision);
  const item = state.data;
  if (state.loading) return <Loading />;
  if (state.error)
    return (
      <>
        <Notice error={state.error} />
        <button
          className="button secondary"
          onClick={() => setRevision((x) => x + 1)}
        >
          Retry live lookup
        </button>
      </>
    );
  const found = item.status !== "NOT_FOUND",
    revoked = item.status === "REVOKED";
  const Icon = revoked ? Ban : found ? ShieldCheck : CircleX;
  return (
    <>
      <section
        className={`verification-status ${revoked ? "is-revoked" : found ? "is-verified" : "is-missing"}`}
      >
        <div className="status-symbol">
          <Icon size={38} />
        </div>
        <div>
          <div className="eyebrow">LIVE BLOCKCHAIN RESULT</div>
          <h2>
            {revoked
              ? "This credential has been revoked."
              : found
                ? "A verified academic credential."
                : "Credential not found."}
          </h2>
          <p>
            {revoked
              ? "The issuer permanently revoked this record. It is no longer active."
              : found
                ? "Registered on-chain and not revoked by the authorized issuer."
                : "No registration exists for this ID on the current contract."}
          </p>
        </div>
        <Pill status={item.status} />
      </section>
      {found && (
        <>
          <div className="two-columns verification-columns">
            <section className="card padded">
              <div className="section-heading inline">
                <div>
                  <h2>Academic record</h2>
                  <p>Details from the local off-chain store</p>
                </div>
                <GraduationCap size={27} />
              </div>
              {item.record ? (
                <>
                  <h3 className="recipient-name">
                    {item.record.data.fullName}
                  </h3>
                  <FieldList data={item.record.data} />
                  <div className="stored-match">
                    <Fingerprint size={17} />
                    {item.storedDataMatches
                      ? "Stored record matches on-chain hash"
                      : "Stored record differs from on-chain hash"}
                  </div>
                </>
              ) : (
                <p>
                  Academic details are unavailable. The chain record remains
                  authoritative.
                </p>
              )}
              {item.record?.revocation && (
                <div className="revoke-reason">
                  <h3>Issuer’s revocation reason</h3>
                  <p>{item.record.revocation.reason}</p>
                  <small>
                    Off-chain statement, not independently
                    blockchain-verifiable.
                  </small>
                </div>
              )}
            </section>
            <section className="card padded">
              <Evidence item={item} />
            </section>
          </div>
          <Integrity item={item} startOpen={integrityOpen} />
        </>
      )}
      <button
        className="text-link refresh"
        onClick={() => setRevision((x) => x + 1)}
      >
        Refresh live blockchain status <ArrowRight size={16} />
      </button>
    </>
  );
}
function Integrity({ item, startOpen = false }) {
  const [data, setData] = useState(
    item.record?.data || {
      ...blank,
      credentialId: item.credentialId,
      issuedAt: "",
    },
  );
  const [result, setResult] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(null);
  function change(next) {
    setData(next);
    setResult(null);
  }
  return (
    <section className="card padded integrity">
      <div className="section-heading inline">
        <div>
          <div className="eyebrow">A SEPARATE CRYPTOGRAPHIC CHECK</div>
          <h2>Credential-data integrity</h2>
          <p>
            Compare the details you supply with the SHA-256 hash stored
            on-chain.
          </p>
        </div>
        <Fingerprint size={30} />
      </div>
      <details open={startOpen || undefined}>
        <summary>
          Inspect or edit the academic data{" "}
          <span>Try changing the grade to demonstrate tamper detection</span>
        </summary>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              const comparison = await api(
                "/integrity/" + item.credentialId,
                data,
              );
              if (comparison.integrity === "UNAVAILABLE")
                throw new Error(
                  "Credential not found on the current contract. Refresh the live lookup.",
                );
              setResult(comparison);
            } catch (error) {
              setError(error);
            } finally {
              setBusy(false);
            }
          }}
        >
          <fieldset disabled={busy}>
            <AcademicFields data={data} onChange={change} integrity />
            <div className="form-grid">
              <label>
                Credential ID
                <input readOnly value={data.credentialId} />
              </label>
              <label>
                Issue timestamp (UTC)
                <input
                  required
                  value={data.issuedAt}
                  onChange={(e) =>
                    change({ ...data, issuedAt: e.target.value })
                  }
                />
              </label>
            </div>
          </fieldset>
          <div className="actions">
            <button className="button" disabled={busy}>
              {busy ? (
                <LoaderCircle className="spin" size={16} />
              ) : (
                <Fingerprint size={16} />
              )}{" "}
              Compare supplied data
            </button>
            {item.record && (
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={() => change({ ...item.record.data })}
              >
                Restore original data
              </button>
            )}
          </div>
        </form>
      </details>
      <Notice error={error} />
      {result && (
        <div
          className={`integrity-result ${result.integrity === "MATCH" ? "match" : "mismatch"}`}
          role="status"
        >
          <h3>
            {result.integrity === "MATCH" ? (
              <CircleCheck size={20} />
            ) : (
              <AlertTriangle size={20} />
            )}{" "}
            {result.integrity === "MATCH"
              ? "Credential data matches"
              : "Data mismatch detected"}
          </h3>
          <p>
            {result.integrity === "MATCH"
              ? "The supplied canonical data produces the registered SHA-256 hash."
              : "The supplied academic details differ from the record anchored on-chain."}{" "}
            {result.status === "REVOKED" && (
              <strong>
                This credential is still REVOKED regardless of data integrity.
              </strong>
            )}
          </p>
          <small>Supplied data hash</small>
          <CopyValue value={result.suppliedHash} />
          <small>On-chain hash</small>
          <CopyValue value={result.onChainHash} />
        </div>
      )}
      <p className="integrity-disclaimer">
        This checks canonical credential data, not PDF bytes, layout, signatures
        or visuals.
      </p>
    </section>
  );
}

function Segments({ values, value, onChange }) {
  return (
    <div className="segments" role="group" aria-label="Choose an option">
      {values.map((item) => (
        <button
          type="button"
          key={item}
          aria-pressed={value === item}
          onClick={() => onChange(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
function Explorer() {
  const [state, setState] = useState({ loading: true }),
    [revision, setRevision] = useState(0),
    [before, setBefore] = useState(null);
  const [action, setAction] = useState("Register New Credential"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState(null),
    [completed, setCompleted] = useState(null);
  const records = useLoad("/certificates", revision);
  useEffect(() => {
    let alive = true,
      timer;
    async function refresh() {
      try {
        const data = await api(
          "/explorer" + (before === null ? "" : "?before=" + before),
        );
        if (alive) setState({ data });
      } catch (error) {
        if (alive) setState({ error });
      }
      if (alive) timer = setTimeout(refresh, 4000);
    }
    refresh();
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [revision, before]);
  const data = state.data;
  const refresh = () => setRevision((v) => v + 1);
  return (
    <>
      <Heading
        eyebrow="LOCAL CHAIN / LIVE EVIDENCE"
        title="Blockchain Explorer"
      >
        Inspect the ledger. Follow every confirmed action. Updates every four
        seconds.
      </Heading>
      <Notice error={state.error} />
      {state.loading && <Loading />}
      {data && (
        <>
          <div className="explorer-stats">
            {[
              ["Network", data.status],
              ["Chain ID", data.chainId],
              ["Current block", data.blockNumber],
              ["Issuance transactions", data.issued],
              ["Revocation transactions", data.revoked],
            ].map(([label, value]) => (
              <div className="card padded" key={label}>
                <small>{label}</small>
                <h2>{value}</h2>
              </div>
            ))}
          </div>
          <section className="card padded">
            <small>Deployed contract</small>
            <CopyValue value={data.contractAddress} />
            <small>Latest block hash</small>
            <CopyValue value={data.blockHash} />
          </section>
        </>
      )}
      <section className="explorer-actions">
        <h2>Execute Blockchain Action</h2>
        <p>
          Local developer demo functions. The server signs; the contract
          independently enforces issuer authorization.
        </p>
        <Segments
          values={["Register New Credential", "Revoke Existing Credential"]}
          value={action}
          onChange={setAction}
        />
        {action === "Register New Credential" ? (
          <Issue onComplete={refresh} />
        ) : (
          <section className="card padded">
            <h3>Select a registered credential</h3>
            <label>
              Search certificates
              <input
                placeholder="Name or credential ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </label>
            <Notice error={records.error} />
            {records.loading && <Loading />}
            {records.data
              ?.filter(
                (item) =>
                  item.status === "VERIFIED" &&
                  (
                    item.record.data.fullName +
                    " " +
                    item.record.data.credentialId
                  )
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )
              .map((item) => (
                <div
                  className="explorer-row"
                  key={item.record.data.credentialId}
                >
                  <div>
                    <strong>{item.record.data.fullName}</strong>
                    <small>{item.record.data.credentialId}</small>
                  </div>
                  <button
                    className="button danger"
                    onClick={() => setSelected(item.record.data.credentialId)}
                  >
                    Revoke credential
                  </button>
                </div>
              ))}
            {records.data &&
              !records.data.some((item) => item.status === "VERIFIED") && (
                <p>No active credentials available to revoke.</p>
              )}
            {completed && (
              <>
                <h3>Revocation confirmed</h3>
                <Evidence item={completed} />
                <ReceiptLookup
                  hash={completed.evidence.revocation.transactionHash}
                />
                <Link to={"/verify/" + completed.credentialId}>
                  Check the updated public status
                </Link>
              </>
            )}
          </section>
        )}
      </section>
      {data && (
        <div className="two-columns">
          <section className="card padded">
            <h2>Recent contract activity</h2>
            {!data.activity.length && (
              <p>No issuance or revocation events on this deployment.</p>
            )}
            {data.activity.map((event) => (
              <div className="explorer-row" key={event.key}>
                <div>
                  <strong>{event.event}</strong>
                  <Link to={"/explorer/transactions/" + event.transactionHash}>
                    View Transaction
                  </Link>
                </div>
                <Link to={"/explorer/blocks/" + event.blockNumber}>
                  Block {event.blockNumber}
                </Link>
              </div>
            ))}
          </section>
          <section className="card padded">
            <h2>Browse blocks</h2>
            {data.blocks.map((block) => (
              <Link
                className="explorer-row"
                key={block.hash}
                to={"/explorer/blocks/" + block.number}
              >
                <strong>Block {block.number}</strong>
                <span>{block.transactions.length} transactions</span>
              </Link>
            ))}
            <div className="actions">
              <button
                className="button secondary"
                onClick={() => setBefore(null)}
              >
                Latest blocks
              </button>
              {data.nextBefore !== null && (
                <button
                  className="button secondary"
                  onClick={() => setBefore(data.nextBefore)}
                >
                  Older blocks
                </button>
              )}
            </div>
          </section>
        </div>
      )}
      {selected && (
        <RevokeDialog
          id={selected}
          onClose={() => setSelected(null)}
          onDone={(result) => {
            setSelected(null);
            setCompleted(result);
            refresh();
          }}
        />
      )}
    </>
  );
}
function ExplorerInspect() {
  const { number, hash } = useParams();
  const state = useLoad(
    hash ? "/explorer/transactions/" + hash : "/explorer/blocks/" + number,
  );
  return (
    <>
      <Link className="breadcrumb" to="/explorer">
        ← Blockchain Explorer
      </Link>
      <Heading
        eyebrow="LOCAL BLOCKCHAIN EVIDENCE"
        title={hash ? "Transaction receipt" : "Block " + number}
      >
        Read directly from the current Hardhat network.
      </Heading>
      <Notice error={state.error} />
      {state.loading && <Loading />}
      {state.data && (
        <section className="card padded">
          {hash ? (
            <Receipt value={state.data} />
          ) : (
            <>
              <dl className="receipt">
                {["number", "hash", "parentHash", "timestamp"].map((key) => (
                  <div key={key}>
                    <dt>{key}</dt>
                    <dd>{state.data[key]}</dd>
                  </div>
                ))}
              </dl>
              <h3>{state.data.transactions.length} transactions</h3>
              {state.data.transactions.map((tx) => (
                <div className="explorer-row" key={tx.hash}>
                  <span>{tx.kind}</span>
                  <Link
                    className="hash-link"
                    to={"/explorer/transactions/" + tx.hash}
                  >
                    {tx.hash}
                  </Link>
                </div>
              ))}
            </>
          )}
        </section>
      )}
    </>
  );
}

function ReceiptLookup({ hash }) {
  const state = useLoad("/explorer/transactions/" + hash);
  return (
    <>
      <Notice error={state.error} />
      {state.loading && <Loading />}
      {state.data && <Receipt value={state.data} />}
    </>
  );
}
