'use client';

import React from "react";
import Link from "next/link";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSeedling,
  faLayerGroup,
  faCloudSun,
  faDroplet,
  faBug,
  faPaw,
  faTriangleExclamation,
} from "@fortawesome/free-solid-svg-icons";

import { endpoints } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Badge from "../../components/Badge";
import "../globals.css";

function timeAgo(iso) {
  if (!iso) return "—";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

export default function Dashboard() {
  const { data, loading, error } = useFetch(() => endpoints.dashboardOverview(), []);

  if (loading) {
    return <div className="loading-text">Loading dashboard overview…</div>;
  }

  if (error) {
    return <div className="loading-text">Unable to load your dashboard: {error.message}</div>;
  }

  if (!data) {
    return <div className="loading-text">No dashboard data available.</div>;
  }

  const farms = data.farms || [];
  const totalArea = farms.reduce((sum, farm) => sum + Number(farm.size_hectares || 0), 0);
  const locations = [...new Set(farms.map((farm) => farm.location).filter(Boolean))];
  const farmTypes = [...new Set(farms.map((farm) => farm.farm_type).filter(Boolean))];
  const latestSoil = data.latest_soil_reading;
  const latestWeather = data.latest_weather_log;

  return (
    <>
      <PageHeader
        eyebrow="Dashboard"
        title={data.title || "All farm activity"}
        subtitle="Your farms at a glance, with direct access to each farm’s activity dashboard."
      />

      <div className="grid grid-4">
        <StatCard icon={faSeedling} label="Farms owned" value={data.total_farms || farms.length} meta="Active farm sites" />
        <StatCard icon={faLayerGroup} label="Total area" value={`${totalArea.toFixed(1)} ha`} meta="Combined farm acreage" />
        <StatCard icon={faCloudSun} label="Regions" value={String(locations.length)} meta="Distinct locations" />
        <StatCard icon={faPaw} label="Operation types" value={farmTypes.join(", ") || "—"} meta="Farm specializations" />
      </div>

      <div className="grid grid-2 section-gap">
        <div className="card">
          <div className="card-title">
            <span className="flex-row"><FontAwesomeIcon icon={faCloudSun} style={{ fontSize: 14 }} /> Current conditions</span>
          </div>
          {latestWeather ? (
            <>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 8 }}>
                <span className="stat-value" style={{ fontSize: 34 }}>{latestWeather.temperature_c.toFixed(0)}°C</span>
                <span className="muted" style={{ fontSize: 13 }}>{latestWeather.humidity_pct.toFixed(0)}% humidity</span>
              </div>
              <p className="muted" style={{ fontSize: 13.5, marginBottom: 10 }}>{latestWeather.forecast_summary}</p>
              <Badge tone="info">{latestWeather.recommended_action}</Badge>
            </>
          ) : (
            <p className="muted">No weather data yet.</p>
          )}
        </div>

        <div className="card">
          <div className="card-title">
            <span className="flex-row"><FontAwesomeIcon icon={faDroplet} style={{ fontSize: 14 }} /> Crop and soil health</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <div className="flex-row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>Active crops</div>
                <div className="muted" style={{ fontSize: 12 }}>{data.total_active_crops || 0} crops across all farms</div>
              </div>
              <Badge tone="success">{data.total_active_crops || 0}</Badge>
            </div>
            <div className="flex-row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>Soil moisture</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {latestSoil ? `pH ${latestSoil.ph_level.toFixed(1)} · ${timeAgo(latestSoil.recorded_at)}` : "No soil readings"}
                </div>
              </div>
              <Badge tone="info">{latestSoil ? `${latestSoil.moisture_pct.toFixed(0)}%` : "—"}</Badge>
            </div>
            <div className="flex-row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>Open pest alerts</div>
                <div className="muted" style={{ fontSize: 12 }}>{data.total_pest_alerts || 0} issues needing attention</div>
              </div>
              <Badge tone="warning"><FontAwesomeIcon icon={faBug} style={{ marginRight: 6 }} />{data.total_pest_alerts || 0}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Owned farms</div>
        {farms.length === 0 ? (
          <p className="muted">No farms found yet. Add your first farm to monitor activity and alerts.</p>
        ) : (
          farms.map((farm) => (
            <div
              key={farm.id}
              className="settings-row"
              style={{ padding: "16px 0", borderBottom: "1px solid var(--line)" }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: 15 }}>{farm.name}</div>
                <div className="muted" style={{ fontSize: 12 }}>
                  {farm.location} · {farm.size_hectares} ha · {farm.farm_type}
                </div>
              </div>
              <Link href="/overview" className="badge badge-info">
                View farm activity
              </Link>
            </div>
          ))
        )}
      </div>
    </>
  );
}
