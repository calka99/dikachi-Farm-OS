'use client';

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { endpoints, DEFAULT_FARM_ID } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/Badge";

export default function Soil() {
  const { data, loading } = useFetch(() => endpoints.soil(DEFAULT_FARM_ID), []);

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
        title="Soil monitoring"
        subtitle="Sensor and lab readings for moisture, pH, and nutrients, with predictive degradation flags."
      />

      {loading && <div className="loading-text">Loading soil data…</div>}

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
            <tbody>
              {[...(data || [])].reverse().slice(0, 10).map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.recorded_at).toLocaleDateString()}</td>
                  <td>{r.moisture_pct.toFixed(0)}%</td>
                  <td>{r.ph_level.toFixed(1)}</td>
                  <td>{r.nitrogen_ppm?.toFixed(0)}</td>
                  <td>{r.phosphorus_ppm?.toFixed(0)}</td>
                  <td>{r.potassium_ppm?.toFixed(0)}</td>
                  <td><Badge tone={r.degradation_risk}>{r.degradation_risk}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
