'use client';

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaw } from "@fortawesome/free-solid-svg-icons";
import { endpoints, DEFAULT_FARM_ID } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/Badge";

export default function LivestockPage() {
  const { data, loading } = useFetch(() => endpoints.livestock(DEFAULT_FARM_ID), []);
  const list = Array.isArray(data) ? data : [];

  return (
    <>
      <PageHeader
        eyebrow="Livestock Management"
        title="Livestock & aquaculture"
        subtitle="Animal health, feeding schedules, vaccination history, and productivity for mixed urban farms."
      />

      {loading && <div className="loading-text">Loading livestock records…</div>}

      <div className="grid grid-2">
        {list.map((l) => (
          <div className="card" key={l.id}>
            <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <div className="flex-row">
                <span className="icon-tile"><FontAwesomeIcon icon={faPaw} style={{ fontSize: 16 }} /></span>
                <div>
                  <div style={{ fontWeight: 700 }}>{l.species || "Unknown species"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{l.tag_id || "—"}</div>
                </div>
              </div>
              <Badge tone={l.health_status || "info"}>{l.health_status || "Unknown"}</Badge>
            </div>

            <div className="grid grid-2" style={{ gap: 10 }}>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Count</div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{Number(l.count || 0).toLocaleString()}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Productivity</div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.productivity_metric || "—"}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Feeding schedule</div>
                <div style={{ fontSize: 13 }}>{l.feeding_schedule || "—"}</div>
              </div>
              <div>
                <div className="muted" style={{ fontSize: 11 }}>Last vaccination</div>
                <div style={{ fontSize: 13 }}>
                  {l.last_vaccination ? new Date(l.last_vaccination).toLocaleDateString() : "N/A"}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
