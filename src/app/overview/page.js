'use client';
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faHouse,
  faSeedling,
  faLayerGroup,
  faCloudSun,
  faDroplet,
  faPaw,
  faChartLine,
  faChartColumn,
  faFileLines,
  faGear,
} from "@fortawesome/free-solid-svg-icons";

import { endpoints } from "../../api/client"
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import ExpandableList from "../../components/ExpandableList";
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

function FarmOverviewContent() {
  const searchParams = useSearchParams();
  const farmId = searchParams.get("farm_id") || DEFAULT_FARM_ID;
  const { data, loading } = useFetch(() => endpoints.farmOverview(farmId), [farmId]);
  const { data: nextHourWeather, loading: weatherLoading, error: weatherError } = useFetch(
    () => endpoints.nextHourWeather(farmId),
    [farmId]
  );

  if (loading || !data) {
    return <div className="loading-text">Loading farm overview…</div>;
  }

  const { farm, active_crops, total_crop_yield_kg, livestock_count, latest_soil, upcoming_irrigation, recent_alerts } = data;

  return (
    <>
      <PageHeader
        eyebrow="Farm Overview"
        title={farm.name}
        subtitle={`${farm.location} · ${farm.size_hectares} hectares · ${farm.farm_type} operation`}
      />

      <div className="grid grid-4">
        <StatCard icon={faSeedling} label="Active crops" value={active_crops} meta="Across all plots" />
        <StatCard
          icon={faChartLine}
          label="Total crop yield"
          value={`${total_crop_yield_kg.toLocaleString(undefined, { maximumFractionDigits: 1 })} kg`}
          meta="Across all crops"
        />
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
            <span className="flex-row"><FontAwesomeIcon icon={faCloudSun} style={{ fontSize: 14 }} /> Weather forecast · next hour</span>
          </div>
          {weatherLoading ? (
            <p className="muted">Loading forecast…</p>
          ) : weatherError ? (
            <p className="auth-error" role="alert">Weather forecast unavailable: {weatherError.message}</p>
          ) : nextHourWeather?.forecast_at ? (
            <div style={{ padding: 14, borderRadius: "var(--radius-md)", background: "var(--cream-50)" }}>
              <div style={{ fontWeight: 600, fontSize: 12.5, marginBottom: 6 }}>
                Around {new Date(nextHourWeather.forecast_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
              </div>
              <div className="stat-value" style={{ fontSize: 30 }}>{nextHourWeather.temperature_c?.toFixed(0) ?? "—"}°C</div>
              <div className="muted" style={{ fontSize: 13, marginTop: 4 }}>{nextHourWeather.condition}</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>
                {nextHourWeather.humidity_pct ?? "—"}% humidity · {nextHourWeather.rainfall_mm.toFixed(1)} mm rain
              </div>
              <div className="muted" style={{ fontSize: 12, marginTop: 3 }}>
                {nextHourWeather.wind_kph.toFixed(0)} kph wind · {nextHourWeather.precipitation_probability_pct}% rain chance
              </div>
            </div>
          ) : (
            <p className="muted">No forecast is available for the next hour.</p>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <span className="flex-row"><FontAwesomeIcon icon={faDroplet} style={{ fontSize: 14 }} /> Upcoming irrigation</span>
          </div>
          {upcoming_irrigation.length === 0 && <p className="muted">Nothing scheduled.</p>}
          <ExpandableList
            items={upcoming_irrigation}
            style={{ display: "flex", flexDirection: "column", gap: 12 }}
            renderItem={(ev) => (
              <div key={ev.id} className="flex-row" style={{ justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{ev.zone}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{ev.duration_minutes} min · {ev.water_liters ? `${ev.water_liters}L` : ""}</div>
                </div>
                <Badge tone="scheduled">{formatWhen(ev.scheduled_at)}</Badge>
              </div>
            )}
          />
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Recent alerts</div>
        <ExpandableList
          items={recent_alerts}
          style={{ display: "flex", flexDirection: "column", gap: 0 }}
          renderItem={(a) => (
            <div key={a.id} className="settings-row" style={{ padding: "12px 0" }}>
              <div>
                <div style={{ fontSize: 13.5 }}>{a.message}</div>
                <div className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>
                  {a.category} · {timeAgo(a.created_at)}
                </div>
              </div>
              <Badge tone={severityTone[a.severity] || "info"}>{a.severity}</Badge>
            </div>
          )}
        />
      </div>
    </>
  );
}

export default function FarmOverview() {
  return (
    <Suspense fallback={<div className="loading-text">Loading farm overview…</div>}>
      <FarmOverviewContent />
    </Suspense>
  );
}
