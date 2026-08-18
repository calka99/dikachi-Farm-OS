'use client';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faSeedling,
  faLayerGroup,
  faCloudSun,
  faDroplet,
  faBug,
  faPaw,
  faChartLine,
  faChartColumn,
  faFileLines,
  faGear,
} from "@fortawesome/free-solid-svg-icons";

import { endpoints, DEFAULT_FARM_ID } from "../../api/client"
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Badge from "../../components/Badge";
import "../globals.css" 

const severityTone = { info: "info", warning: "warning", critical: "critical" };

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatWhen(iso) {
  const d = new Date(iso);
  const diffMs = d.getTime() - Date.now();
  const hours = Math.round(diffMs / 3600000);
  if (hours < 0) return "overdue";
  if (hours < 24) return `in ${hours}h`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function FarmOverview() {
  const { data, loading } = useFetch(() => endpoints.farmOverview(DEFAULT_FARM_ID), []);

  if (loading || !data) {
    return <div className="loading-text">Loading farm overview…</div>;
  }

  const { farm, active_crops, open_pest_alerts, livestock_count, latest_soil, latest_weather, upcoming_irrigation, recent_alerts } = data;

  return (
    <>
      <PageHeader
        eyebrow="Farm Overview"
        title={farm.name}
        subtitle={`${farm.location} · ${farm.size_hectares} hectares · ${farm.farm_type} operation`}
      />

      <div className="grid grid-4">
        <StatCard icon={faSeedling} label="Active crops" value={active_crops} meta="Across all plots" />
        <StatCard icon={faBug} label="Open pest alerts" value={open_pest_alerts} meta="Needs attention" />
        <StatCard icon={faPaw} label="Livestock groups" value={livestock_count} meta="Poultry & aquaculture" />
        <StatCard
          icon={faLayerGroup}
          label="Soil moisture"
          value={latest_soil ? `${latest_soil.moisture_pct.toFixed(0)}%` : "—"}
          meta={latest_soil ? `pH ${latest_soil.ph_level.toFixed(1)} · ${timeAgo(latest_soil.recorded_at)}` : ""}
        />
      </div>

      <div className="grid grid-2 section-gap">
        <div className="card">
          <div className="card-title">
            <span className="flex-row"><FontAwesomeIcon icon={faCloudSun} style={{ fontSize: 14 }} /> Current conditions</span>
          </div>
          {latest_weather ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
                <span className="stat-value" style={{ fontSize: 34 }}>{latest_weather.temperature_c.toFixed(0)}°C</span>
                <span className="muted" style={{ fontSize: 13 }}>{latest_weather.humidity_pct.toFixed(0)}% humidity</span>
              </div>
              <p className="muted" style={{ fontSize: 13.5, marginBottom: 10 }}>{latest_weather.forecast_summary}</p>
              <div className="badge badge-info">{latest_weather.recommended_action}</div>
            </>
          ) : (
            <p className="muted">No weather data yet.</p>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <span className="flex-row"><FontAwesomeIcon icon={faDroplet} style={{ fontSize: 14 }} /> Upcoming irrigation</span>
          </div>
          {upcoming_irrigation.length === 0 && <p className="muted">Nothing scheduled.</p>}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {upcoming_irrigation.map((ev) => (
              <div key={ev.id} className="flex-row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{ev.zone}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{ev.duration_minutes} min · {ev.water_liters ? `${ev.water_liters}L` : ""}</div>
                </div>
                <Badge tone="scheduled">{formatWhen(ev.scheduled_at)}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Recent alerts</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {recent_alerts.map((a) => (
            <div key={a.id} className="settings-row" style={{ padding: "12px 0" }}>
              <div>
                <div style={{ fontSize: 13.5 }}>{a.message}</div>
                <div className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>
                  {a.category} · {timeAgo(a.created_at)}
                </div>
              </div>
              <Badge tone={severityTone[a.severity] || "info"}>{a.severity}</Badge>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
