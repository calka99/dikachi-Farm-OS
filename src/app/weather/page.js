'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { endpoints, DEFAULT_FARM_ID } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";

export default function Weather() {
  const { data, loading } = useFetch(() => endpoints.weather(DEFAULT_FARM_ID), []);

  const chartData = (data || []).map((w) => ({
    date: new Date(w.recorded_at).toLocaleDateString(undefined, { weekday: "short" }),
    rainfall: w.rainfall_mm,
  }));

  const latest = data?.[data.length - 1];

  return (
    <>
      <PageHeader
        eyebrow="Weather Intelligence"
        title="Weather & forecast"
        subtitle="Meteorological forecasts combined with local observations, translated into farming actions."
      />

      {loading && <div className="loading-text">Loading weather data…</div>}

      {latest && (
        <div className="grid grid-4">
          <div className="stat-card">
            <div className="stat-label">Temperature</div>
            <div className="stat-value">{latest.temperature_c.toFixed(0)}°C</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Humidity</div>
            <div className="stat-value">{latest.humidity_pct.toFixed(0)}%</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Rainfall (today)</div>
            <div className="stat-value">{latest.rainfall_mm.toFixed(1)}mm</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Wind</div>
            <div className="stat-value">{latest.wind_kph.toFixed(0)} kph</div>
          </div>
        </div>
      )}

      {latest && (
        <div className="card section-gap">
          <div className="card-title">Today's recommendation</div>
          <p style={{ fontSize: 14, marginBottom: 10 }}>{latest.forecast_summary}</p>
          <div className="badge badge-info">{latest.recommended_action}</div>
        </div>
      )}

      <div className="card section-gap">
        <div className="card-title">Rainfall — last 7 days</div>
        <div style={{ width: "100%", height: 220 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ left: -10, right: 10 }}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--ink-400)" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "var(--ink-400)" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--line)", fontSize: 12 }} />
              <Bar dataKey="rainfall" fill="var(--sky-500)" radius={[4, 4, 0, 0]} name="Rainfall (mm)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Log</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Temp</th><th>Humidity</th><th>Rainfall</th><th>Action</th></tr>
            </thead>
            <tbody>
              {[...(data || [])].reverse().map((w) => (
                <tr key={w.id}>
                  <td>{new Date(w.recorded_at).toLocaleDateString()}</td>
                  <td>{w.temperature_c.toFixed(0)}°C</td>
                  <td>{w.humidity_pct.toFixed(0)}%</td>
                  <td>{w.rainfall_mm.toFixed(1)}mm</td>
                  <td className="muted">{w.recommended_action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
