'use client';

import { useState, useSyncExternalStore } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { endpoints, getSelectedFarmSnapshot, subscribeToSelectedFarm } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/Badge";
import ExpandableList from "../../components/ExpandableList";

export default function Soil() {
  const selectedFarm = useSyncExternalStore(
    subscribeToSelectedFarm,
    getSelectedFarmSnapshot,
    () => null
  );

  const farmId = selectedFarm?.id;
  const { data, loading, reload } = useFetch(
    () => farmId ? endpoints.soil(farmId) : Promise.resolve([]),
    [farmId]
  );
  const [form, setForm] = useState({ moisture_pct: "", ph_level: "", nitrogen_ppm: "", phosphorus_ppm: "", potassium_ppm: "", organic_matter_pct: "", degradation_risk: "low" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const createReading = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await endpoints.createSoil({ ...form, farm_id: farmId, moisture_pct: Number(form.moisture_pct), ph_level: Number(form.ph_level), nitrogen_ppm: form.nitrogen_ppm === "" ? null : Number(form.nitrogen_ppm), phosphorus_ppm: form.phosphorus_ppm === "" ? null : Number(form.phosphorus_ppm), potassium_ppm: form.potassium_ppm === "" ? null : Number(form.potassium_ppm), organic_matter_pct: form.organic_matter_pct === "" ? null : Number(form.organic_matter_pct) });
      setForm({ moisture_pct: "", ph_level: "", nitrogen_ppm: "", phosphorus_ppm: "", potassium_ppm: "", organic_matter_pct: "", degradation_risk: "low" });
      reload();
    } catch (requestError) { setFormError(requestError.message); } finally { setSaving(false); }
  };

  const chartData = (data || []).map((r) => ({
    date: new Date(r.recorded_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    moisture: r.moisture_pct,
    ph: r.ph_level,
  }));

  const latest = data?.[data.length - 1];

  return (
    <>
      <PageHeader
        eyebrow="Soil Health"
        title={selectedFarm ? `${selectedFarm.name} soil health` : "Soil monitoring"}
        subtitle={selectedFarm
          ? `Viewing soil readings for ${selectedFarm.name}. Sensor and lab readings for moisture, pH, and nutrients.`
          : "Sensor and lab readings for moisture, pH, and nutrients, with predictive degradation flags."}
      />

      {!farmId && <div className="loading-text">Select a farm from the dashboard to view soil data.</div>}
      {farmId && loading && <div className="loading-text">Loading soil data…</div>}

      {farmId && <div className="card section-gap">
        <div className="card-title">Add soil reading</div>
        <form onSubmit={createReading} style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          <input required min="0" max="100" step="0.1" type="number" placeholder="Moisture %" value={form.moisture_pct} onChange={(event) => setForm({ ...form, moisture_pct: event.target.value })} />
          <input required min="0" max="14" step="0.1" type="number" placeholder="pH" value={form.ph_level} onChange={(event) => setForm({ ...form, ph_level: event.target.value })} />
          <input min="0" type="number" placeholder="Nitrogen ppm" value={form.nitrogen_ppm} onChange={(event) => setForm({ ...form, nitrogen_ppm: event.target.value })} />
          <input min="0" type="number" placeholder="Phosphorus ppm" value={form.phosphorus_ppm} onChange={(event) => setForm({ ...form, phosphorus_ppm: event.target.value })} />
          <input min="0" type="number" placeholder="Potassium ppm" value={form.potassium_ppm} onChange={(event) => setForm({ ...form, potassium_ppm: event.target.value })} />
          <input min="0" step="0.1" type="number" placeholder="Organic matter %" value={form.organic_matter_pct} onChange={(event) => setForm({ ...form, organic_matter_pct: event.target.value })} />
          <select value={form.degradation_risk} onChange={(event) => setForm({ ...form, degradation_risk: event.target.value })}><option value="low">Low risk</option><option value="medium">Medium risk</option><option value="high">High risk</option><option value="critical">Critical risk</option></select>
          <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save reading"}</button>
        </form>
        {formError && <p className="auth-error" style={{ marginTop: 10 }}>{formError}</p>}
      </div>}

      {latest && (
        <div className="grid grid-4">
          <div className="stat-card">
            <div className="stat-label">Moisture</div>
            <div className="stat-value">{latest.moisture_pct.toFixed(0)}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">pH level</div>
            <div className="stat-value">{latest.ph_level.toFixed(1)}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Organic matter</div>
            <div className="stat-value">{latest.organic_matter_pct?.toFixed(1)}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Degradation risk</div>
            <div style={{ marginTop: 4 }}>
              <Badge tone={latest.degradation_risk}>{latest.degradation_risk}</Badge>
            </div>
          </div>
        </div>
      )}

      <div className="card section-gap">
        <div className="card-title">Moisture &amp; pH — last 15 days</div>
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <LineChart data={chartData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--ink-400)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-400)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--line)", fontSize: 12 }} />
              <Line type="monotone" dataKey="moisture" stroke="var(--leaf-600)" strokeWidth={2.2} dot={false} name="Moisture %" />
              <Line type="monotone" dataKey="ph" stroke="var(--sky-500)" strokeWidth={2.2} dot={false} name="pH" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Reading log</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Moisture</th>
                <th>pH</th>
                <th>N (ppm)</th>
                <th>P (ppm)</th>
                <th>K (ppm)</th>
                <th>Risk</th>
              </tr>
            </thead>
            <ExpandableList
              as="tbody"
              items={[...(data || [])].reverse().slice(0, 10)}
              colSpan={7}
              renderItem={(r) => (
                <tr key={r.id}>
                  <td>{new Date(r.recorded_at).toLocaleDateString()}</td>
                  <td>{r.moisture_pct.toFixed(0)}%</td>
                  <td>{r.ph_level.toFixed(1)}</td>
                  <td>{r.nitrogen_ppm?.toFixed(0)}</td>
                  <td>{r.phosphorus_ppm?.toFixed(0)}</td>
                  <td>{r.potassium_ppm?.toFixed(0)}</td>
                  <td><Badge tone={r.degradation_risk}>{r.degradation_risk}</Badge></td>
                </tr>
              )}
            />
          </table>
        </div>
      </div>
    </>
  );
}
