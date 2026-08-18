'use client';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt, faDownload } from "@fortawesome/free-solid-svg-icons";
import { endpoints, DEFAULT_FARM_ID } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/Badge";

const TYPE_TONE = { production: "low", financial: "info", environmental: "medium" };

export default function Reports() {
  const { data, loading } = useFetch(() => endpoints.reports(DEFAULT_FARM_ID), []);

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Generated reports"
        subtitle="Production summaries, environmental records, and financial reports for investors, agencies, and lenders."
      />

      {loading && <div className="loading-text">Loading reports…</div>}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {data?.map((r) => (
          <div key={r.id} className="card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px" }}>
            <div className="flex-row">
              <span className="icon-tile"><FontAwesomeIcon icon={faFileAlt} style={{ width: 16, height: 16 }} /></span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14.5 }}>{r.title}</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{r.summary}</div>
                <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                  {r.period_label} · Generated {new Date(r.generated_at).toLocaleDateString()}
                </div>
              </div>
            </div>
            <div className="flex-row">
              <Badge tone={TYPE_TONE[r.report_type] || "info"}>{r.report_type}</Badge>
              <button
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--paper)",
                  borderRadius: 6,
                  padding: "6px 10px",
                  cursor: "pointer",
                  color: "var(--leaf-600)",
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                <FontAwesomeIcon icon={faDownload} style={{ width: 13, height: 13 }} /> Export
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
