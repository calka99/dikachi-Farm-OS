'use client';

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBug } from "@fortawesome/free-solid-svg-icons";
import { endpoints, DEFAULT_FARM_ID } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/Badge";

export default function Pests() {
  const { data, loading, reload } = useFetch(() => endpoints.pests(DEFAULT_FARM_ID), []);
  const [resolving, setResolving] = useState(null);

  const resolve = async (id) => {
    setResolving(id);
    await endpoints.resolvePest(id);
    setResolving(null);
    reload();
  };

  const list = Array.isArray(data) ? data : [];
  const open = list.filter((p) => !p?.resolved);
  const resolved = list.filter((p) => p?.resolved);

  return (
    <>
      <PageHeader
        eyebrow="Pest Alert"
        title="Pest & disease alerts"
        subtitle="Image recognition, outbreak history, and environmental variables flag risk before infestations spread."
      />

      {loading && <div className="loading-text">Loading pest alerts…</div>}

      <div className="card-title" style={{ marginTop: 4 }}>Active ({open.length})</div>
      <div className="grid grid-2">
        {open.map((p) => (
          <div className="card" key={p.id}>
            <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <div className="flex-row">
                <span className="icon-tile"><FontAwesomeIcon icon={faBug} style={{ fontSize: 16 }} /></span>
                <div>
                  <div style={{ fontWeight: 700 }}>{p?.pest_or_disease || "Unknown issue"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{p?.crop_name || "Unknown crop"}</div>
                </div>
              </div>
              <Badge tone={p?.risk_level || "info"}>{p?.risk_level || "info"} risk</Badge>
            </div>
            <p style={{ fontSize: 13, margin: "10px 0 14px" }}>{p?.recommended_action || "No action recorded yet."}</p>
            <div className="flex-row" style={{ justifyContent: "space-between" }}>
              <span className="muted" style={{ fontSize: 11.5 }}>
                Detected via {p?.detection_method?.replace("_", " ") || "unknown method"}
              </span>
              <button
                onClick={() => resolve(p.id)}
                disabled={resolving === p.id}
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--paper)",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                  color: "var(--leaf-600)",
                  fontWeight: 600,
                }}
              >
                {resolving === p.id ? "…" : "Mark resolved"}
              </button>
            </div>
          </div>
        ))}
        {open.length === 0 && !loading && <p className="muted">No active pest alerts. Nice work.</p>}
      </div>

      {resolved.length > 0 && (
        <>
          <div className="card-title section-gap">Resolved</div>
          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Crop</th><th>Issue</th><th>Risk</th><th>Detected</th></tr></thead>
                <tbody>
                  {resolved.map((p) => (
                    <tr key={p.id}>
                      <td>{p?.crop_name || "—"}</td>
                      <td>{p?.pest_or_disease || "—"}</td>
                      <td><Badge tone={p?.risk_level || "info"}>{p?.risk_level || "—"}</Badge></td>
                      <td className="muted">{p?.detected_at ? new Date(p.detected_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
