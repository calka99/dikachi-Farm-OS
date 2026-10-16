'use client';

import { useEffect, useState, useSyncExternalStore } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faDroplet } from "@fortawesome/free-solid-svg-icons";
import { endpoints, getSelectedFarmSnapshot, subscribeToSelectedFarm } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/Badge";
import ExpandableList from "../../components/ExpandableList";
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
  const selectedFarm = useSyncExternalStore(
    subscribeToSelectedFarm,
    getSelectedFarmSnapshot,
    () => null
  );
  const farmId = selectedFarm?.id;
  const { data, loading, reload } = useFetch(
    () => farmId ? endpoints.irrigation(farmId) : Promise.resolve([]),
    [farmId]
  );
  const [form, setForm] = useState({ zone: "", scheduled_at: "", duration_minutes: "30", water_liters: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const createEvent = async (event) => {
    event.preventDefault(); setSaving(true); setFormError("");
    try {
      const scheduledAt = new Date(form.scheduled_at);
      if (!form.scheduled_at || Number.isNaN(scheduledAt.getTime())) {
        throw new Error("Please choose a valid irrigation date and time.");
      }
      await endpoints.createIrrigation({ ...form, farm_id: farmId, duration_minutes: Number(form.duration_minutes), water_liters: form.water_liters === "" ? null : Number(form.water_liters), scheduled_at: scheduledAt.toISOString() });
      setForm({ zone: "", scheduled_at: "", duration_minutes: "30", water_liters: "" });
      reload();
    }
    catch (requestError) { setFormError(requestError.message); } finally { setSaving(false); }
  };
  const [updating, setUpdating] = useState(null);

  const markComplete = async (id) => {
    setUpdating(id);
    await endpoints.updateIrrigationStatus(id, "completed");
    setUpdating(null);
    reload();
  };

  const totalWater = (data || []).reduce((sum, e) => sum + (e.water_liters || 0), 0);
  const today = new Date(currentTime);
  const completedToday = (data || []).filter((event) => {
    if (event.status !== "completed" || !event.completed_at) return false;
    const completedAt = new Date(event.completed_at);
    return completedAt.getFullYear() === today.getFullYear()
      && completedAt.getMonth() === today.getMonth()
      && completedAt.getDate() === today.getDate();
  }).length;

  return (
    <>
      <PageHeader
        eyebrow="Irrigation Management"
        title={selectedFarm ? `${selectedFarm.name} irrigation` : "Irrigation schedule"}
        subtitle={selectedFarm
          ? `Viewing and managing scheduled irrigation events for ${selectedFarm.name}.`
          : "Select a farm from the dashboard to view its irrigation schedule."}
      />

      {!farmId && <div className="loading-text">Select a farm from the dashboard to view irrigation data.</div>}

      {farmId && <div className="grid grid-3">
        <div className="stat-card">
          <div className="stat-label"><FontAwesomeIcon icon={faDroplet} style={{ fontSize: 14 }} /> Farm total events</div>
          <div className="stat-value">{data?.length ?? "—"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Farm scheduled water</div>
          <div className="stat-value">{totalWater.toLocaleString()}L</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Completed today</div>
          <div className="stat-value">{loading ? "—" : completedToday}</div>
        </div>
      </div>}

      {farmId && <div className="card section-gap">
        <div className="card-title">Schedule irrigation</div>
        <form onSubmit={createEvent} style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))" }}>
          <input required placeholder="Zone" value={form.zone} onChange={(event) => setForm({ ...form, zone: event.target.value })} />
          <input required type="datetime-local" value={form.scheduled_at} onChange={(event) => setForm({ ...form, scheduled_at: event.target.value })} />
          <input required min="1" type="number" placeholder="Duration (minutes)" value={form.duration_minutes} onChange={(event) => setForm({ ...form, duration_minutes: event.target.value })} />
          <input min="0" type="number" placeholder="Water (liters)" value={form.water_liters} onChange={(event) => setForm({ ...form, water_liters: event.target.value })} />
          <button type="submit" disabled={saving}>{saving ? "Saving…" : "Schedule event"}</button>
        </form>
        {formError && <p className="auth-error" style={{ marginTop: 10 }}>{formError}</p>}
      </div>}

      {farmId && <div className="card section-gap">
        <div className="card-title">Zones</div>
        {loading && <div className="loading-text">Loading irrigation events…</div>}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Zone</th><th>Scheduled</th><th>Duration</th><th>Water</th><th>Status</th><th></th></tr>
            </thead>
            <ExpandableList
              as="tbody"
              items={data || []}
              colSpan={6}
              renderItem={(ev) => (
                <tr key={ev.id}>
                  <td style={{ fontWeight: 600 }}>{ev.zone}</td>
                  <td>{formatWhen(ev.scheduled_at)}</td>
                  <td>{ev.duration_minutes} min</td>
                  <td>{ev.water_liters ? `${ev.water_liters}L` : "—"}</td>
                  <td><Badge tone={ev.status}>{ev.status}</Badge></td>
                  <td>
                    {(ev.status === "scheduled" || ev.status === "critical") && (
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
              )}
            />
          </table>
        </div>
      </div>}
    </>
  );
}
