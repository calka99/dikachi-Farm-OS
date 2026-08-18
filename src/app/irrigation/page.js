'use client';

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDroplet } from "@fortawesome/free-solid-svg-icons";
import { endpoints } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/Badge";
import "../globals.css"

function formatWhen(iso) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function Irrigation() {
  const { data, loading, reload } = useFetch(() => endpoints.irrigation(), []);
  const [updating, setUpdating] = useState(null);

  const markComplete = async (id) => {
    setUpdating(id);
    await endpoints.updateIrrigationStatus(id, "completed");
    setUpdating(null);
    reload();
  };

  const totalWater = (data || []).reduce((sum, e) => sum + (e.water_liters || 0), 0);

  return (
    <>
      <PageHeader
        eyebrow="Irrigation Management"
        title="Irrigation schedule"
        subtitle="Adaptive watering by zone, driven by soil moisture, weather forecasts, and crop water needs."
      />

      <div className="grid grid-3">
        <div className="stat-card">
          <div className="stat-label"><FontAwesomeIcon icon={faDroplet} style={{ fontSize: 14 }} /> Total events</div>
          <div className="stat-value">{data?.length ?? "—"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Scheduled water</div>
          <div className="stat-value">{totalWater.toLocaleString()}L</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed today</div>
          <div className="stat-value">{(data || []).filter((e) => e.status === "completed").length}</div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Zones</div>
        {loading && <div className="loading-text">Loading irrigation events…</div>}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Zone</th><th>Scheduled</th><th>Duration</th><th>Water</th><th>Trigger</th><th>Status</th><th></th></tr>
            </thead>
            <tbody>
              {data?.map((ev) => (
                <tr key={ev.id}>
                  <td style={{ fontWeight: 600 }}>{ev.zone}</td>
                  <td>{formatWhen(ev.scheduled_at)}</td>
                  <td>{ev.duration_minutes} min</td>
                  <td>{ev.water_liters ? `${ev.water_liters}L` : "—"}</td>
                  <td className="muted" style={{ textTransform: "capitalize" }}>{ev.trigger_reason?.replace("_", " ")}</td>
                  <td><Badge tone={ev.status}>{ev.status}</Badge></td>
                  <td>
                    {ev.status === "scheduled" && (
                      <button
                        onClick={() => markComplete(ev.id)}
                        disabled={updating === ev.id}
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
                        {updating === ev.id ? "…" : "Mark done"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
