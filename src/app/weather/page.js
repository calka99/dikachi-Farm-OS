'use client';

import { useSyncExternalStore } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { endpoints, getSelectedFarmSnapshot, subscribeToSelectedFarm } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import ExpandableList from "../../components/ExpandableList";

export default function Weather() {
  const selectedFarm = useSyncExternalStore(
    subscribeToSelectedFarm,
    getSelectedFarmSnapshot,
    () => null
  );
  const farmId = selectedFarm?.id;
  const { data, loading, error } = useFetch(
    () => farmId ? endpoints.weather(farmId) : Promise.resolve([]),
    [farmId]
  );

  const chartData = (data || []).map((w) => ({
    date: new Date(w.recorded_at).toLocaleDateString(undefined, { weekday: "short" }),
    rainfall: w.rainfall_mm,
    clearSky: w.clear_sky_pct,
    wind: w.wind_kph,
  }));

  const latest = data?.[data.length - 1];
  const mapUrl = latest?.latitude && latest?.longitude
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${latest.longitude - 0.12},${latest.latitude - 0.12},${latest.longitude + 0.12},${latest.latitude + 0.12}&layer=mapnik&marker=${latest.latitude},${latest.longitude}`
    : null;

  return (
    <>
      <PageHeader
        eyebrow="Weather Intelligence"
        title={selectedFarm ? `${selectedFarm.name} weather` : "Weather & forecast"}
        subtitle={selectedFarm
          ? `Viewing weather for ${selectedFarm.name}. Forecasts and local observations translated into farming actions.`
          : "Meteorological forecasts combined with local observations, translated into farming actions."}
      />

      {!farmId && <div className="loading-text">Select a farm from the dashboard to view weather data.</div>}
      {farmId && loading && <div className="loading-text">Loading weather data…</div>}
      {farmId && !loading && error && (
        <div className="auth-error" role="alert">
          Live weather is unavailable for {selectedFarm.name}: {error.message}
        </div>
      )}

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
          <div className="card-title">Today&apos;s recommendation</div>
          <p style={{ fontSize: 14, marginBottom: 10 }}>{latest.forecast_summary}</p>
          <div className="badge badge-info">{latest.recommended_action}</div>
        </div>
      )}

      {farmId && !loading && (
        <div className="card section-gap">
          <div className="card-title">Farm location</div>
          <p className="muted" style={{ fontSize: 13, marginBottom: 12 }}>{latest?.farm_location || selectedFarm?.name}</p>
          {!error && mapUrl ? (
            <iframe
              title={`Weather map for ${selectedFarm?.name || "selected farm"}`}
              src={mapUrl}
              style={{ width: "100%", height: 280, border: 0, borderRadius: 8 }}
              loading="lazy"
            />
          ) : (
            <p className="muted">Map unavailable because live weather or location coordinates could not be loaded.</p>
          )}
        </div>
      )}

      <div className="card section-gap">
        <div className="card-title">Weather trends — forecast</div>
        <div style={{ width: "100%", height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 48, bottom: 8, left: 0 }} barCategoryGap="20%" barGap={3}>
              <CartesianGrid stroke="var(--line)" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "var(--ink-400)" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="rainfall" tick={{ fontSize: 10, fill: "var(--ink-400)" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="clearSky" orientation="right" domain={[0, 100]} tick={{ fontSize: 10, fill: "var(--amber-500)" }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="wind" orientation="right" domain={[0, "auto"]} tick={{ fontSize: 10, fill: "var(--leaf-500)" }} axisLine={false} tickLine={false} hide />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--line)", fontSize: 12 }} />
              <Legend />
              <Bar yAxisId="rainfall" dataKey="rainfall" fill="var(--sky-500)" radius={[4, 4, 0, 0]} name="Rainfall (mm)" />
              <Bar yAxisId="clearSky" dataKey="clearSky" fill="var(--amber-500)" radius={[4, 4, 0, 0]} name="Clear sky (%)" />
              <Bar yAxisId="wind" dataKey="wind" fill="var(--leaf-500)" radius={[4, 4, 0, 0]} name="Wind (kph)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="muted" style={{ fontSize: 11, marginTop: 8 }} >Clear sky is estimated as 100% minus forecast cloud cover. Each measure uses its own scale.</p>
      </div>

      <div className="card section-gap">
        <div className="card-title">Log</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr><th>Date</th><th>Temp</th><th>Humidity</th><th>Rainfall</th><th>Action</th></tr>
            </thead>
            <ExpandableList
              as="tbody"
              items={[...(data || [])].reverse()}
              colSpan={5}
              renderItem={(w) => (
                <tr key={w.id}>
                  <td>{new Date(w.recorded_at).toLocaleDateString()}</td>
                  <td>{w.temperature_c.toFixed(0)}°C</td>
                  <td>{w.humidity_pct.toFixed(0)}%</td>
                  <td>{w.rainfall_mm.toFixed(1)}mm</td>
                  <td className="muted">{w.recommended_action}</td>
                </tr>
              )}
            />
          </table>
        </div>
      </div>
    </>
  );
}
