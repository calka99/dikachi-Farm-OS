'use client';

import React, { useState } from "react";
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

import { clearSelectedFarm, endpoints, saveSelectedFarm } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import StatCard from "../../components/StatCard";
import Badge from "../../components/Badge";
import ExpandableList from "../../components/ExpandableList";
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

function getWeatherRisk(forecast) {
  if (forecast.condition === "Thunderstorm") {
    return { type: "thunderstorm", title: "Thunderstorm expected", message: "Secure equipment and avoid exposed field work.", tone: "critical" };
  }
  if (forecast.rainfall_mm >= 5) {
    return { type: "heavy-rain", title: "Heavy rain expected", message: `${forecast.rainfall_mm.toFixed(1)} mm forecast; delay irrigation and check drainage.`, tone: "warning" };
  }
  if (forecast.temperature_c != null && forecast.temperature_c >= 35) {
    return { type: "heat", title: "High temperatures", message: `${forecast.temperature_c.toFixed(0)}°C forecast; check crops and soil moisture for heat stress.`, tone: "warning" };
  }
  if (forecast.temperature_c != null && forecast.temperature_c <= 5) {
    return { type: "cold", title: "Low temperatures", message: `${forecast.temperature_c.toFixed(0)}°C forecast; protect cold-sensitive crops.`, tone: "warning" };
  }
  if (forecast.wind_kph >= 45) {
    return { type: "strong-wind", title: "Strong winds", message: `${forecast.wind_kph.toFixed(0)} kph forecast; secure equipment and postpone spraying.`, tone: "warning" };
  }
  if (forecast.precipitation_probability_pct >= 70 && forecast.rainfall_mm >= 0.5) {
    return { type: "rain", title: "Rain likely", message: `${forecast.precipitation_probability_pct}% chance; review irrigation plans.`, tone: "info" };
  }
  return null;
}

export default function Dashboard() {
  const { data, loading, error, reload } = useFetch(() => endpoints.dashboardOverview(), []);
  const [farmForm, setFarmForm] = useState({ name: "", location: "", size_hectares: "", farm_type: "mixed" });
  const [farmSaving, setFarmSaving] = useState(false);
  const [farmError, setFarmError] = useState("");
  const [editingFarmId, setEditingFarmId] = useState(null);
  const [editFarmForm, setEditFarmForm] = useState({ name: "", location: "", size_hectares: "", farm_type: "mixed" });
  const [editFarmError, setEditFarmError] = useState("");
  const [deletingFarmId, setDeletingFarmId] = useState(null);
  const [deleteFarmError, setDeleteFarmError] = useState("");
  const farms = data?.farms || [];
  const farmWeatherKey = farms.map((farm) => `${farm.id}:${farm.location}`).join("|");
  const { data: weatherRiskData, loading: weatherRiskLoading } = useFetch(async () => {
    const results = await Promise.all(farms.map(async (farm) => {
      try {
        const forecast = await endpoints.next24HoursWeather(farm.id);
        return { farm, forecast, error: null };
      } catch (requestError) {
        return { farm, forecast: [], error: requestError };
      }
    }));
    const farmConditions = [];
    const errors = [];

    results.forEach(({ farm, forecast, error }) => {
      if (error) {
        errors.push({ farmName: farm.name, message: error.message });
        return;
      }

      const nextForecast = forecast[0];
      if (!nextForecast) {
        errors.push({ farmName: farm.name, message: "No hourly forecast was returned." });
        return;
      }

      const farmRisks = [];
      forecast.forEach((period) => {
        const risk = getWeatherRisk(period);
        if (risk) farmRisks.push({ ...risk, forecastAt: period.forecast_at });
      });
      farmConditions.push({
        farmId: farm.id,
        farmName: farm.name,
        forecast: nextForecast,
        risk: farmRisks[0] || null,
      });
    });

    return { farmConditions, errors };
  }, [farmWeatherKey]);

  const createFarm = async (event) => {
    event.preventDefault();
    setFarmSaving(true);
    setFarmError("");
    try {
      await endpoints.createFarm({ ...farmForm, size_hectares: Number(farmForm.size_hectares) });
      setFarmForm({ name: "", location: "", size_hectares: "", farm_type: "mixed" });
      reload();
    } catch (requestError) {
      setFarmError(requestError.message);
    } finally {
      setFarmSaving(false);
    }
  };

  const beginFarmEdit = (farm) => {
    setEditingFarmId(farm.id);
    setEditFarmForm({
      name: farm.name,
      location: farm.location,
      size_hectares: String(farm.size_hectares),
      farm_type: farm.farm_type,
    });
    setEditFarmError("");
  };

  const updateFarm = async (event, farmId) => {
    event.preventDefault();
    setFarmSaving(true);
    setEditFarmError("");
    try {
      const updatedFarm = await endpoints.updateFarm(farmId, {
        ...editFarmForm,
        size_hectares: Number(editFarmForm.size_hectares),
      });
      setEditingFarmId(null);
      if (String(localStorage.getItem("farmos_selected_farm")) === String(farmId)) {
        saveSelectedFarm(updatedFarm);
      }
      reload();
    } catch (requestError) {
      setEditFarmError(requestError.message);
    } finally {
      setFarmSaving(false);
    }
  };

  const deleteFarm = async (farm) => {
    if (!window.confirm(`Delete ${farm.name} and all of its farm data? This cannot be undone.`)) return;

    setDeletingFarmId(farm.id);
    setDeleteFarmError("");
    try {
      await endpoints.deleteFarm(farm.id);
      if (String(localStorage.getItem("farmos_selected_farm")) === String(farm.id)) {
        clearSelectedFarm();
      }
      reload();
    } catch (requestError) {
      setDeleteFarmError(requestError.message);
    } finally {
      setDeletingFarmId(null);
    }
  };

  if (loading) {
    return <div className="loading-text">Loading dashboard overview…</div>;
  }

  if (error) {
    return <div className="loading-text">Unable to load your dashboard: {error.message}</div>;
  }

  if (!data) {
    return <div className="loading-text">No dashboard data available.</div>;
  }

  const totalArea = farms.reduce((sum, farm) => sum + Number(farm.size_hectares || 0), 0);
  const locations = [...new Set(farms.map((farm) => farm.location).filter(Boolean))];
  const farmTypes = [...new Set(farms.map((farm) => farm.farm_type).filter(Boolean))];
  const latestSoil = data.latest_soil_reading;

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
            <span className="flex-row"><FontAwesomeIcon icon={faTriangleExclamation} style={{ fontSize: 14 }} /> Weather risks · next 24 hours</span>
          </div>
          {weatherRiskLoading ? (
            <p className="muted">Checking forecasts for your farms…</p>
          ) : farms.length === 0 ? (
            <p className="muted">Add a farm to see local weather risks.</p>
          ) : weatherRiskData?.farmConditions.length > 0 ? (
            <>
              <ExpandableList
                items={weatherRiskData.farmConditions}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
                renderItem={({ farmId, farmName, forecast, risk }) => (
                  <div key={farmId} className="settings-row" style={{ padding: "10px 0" }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{farmName} · {forecast.condition}, {forecast.temperature_c == null ? "—" : `${forecast.temperature_c.toFixed(0)}°C`}</div>
                      <div className="muted" style={{ fontSize: 12 }}>
                        {risk ? `${risk.title}: ${risk.message}` : `${forecast.precipitation_probability_pct}% rain chance · ${forecast.wind_kph.toFixed(0)} kph wind`}
                      </div>
                    </div>
                    <Badge tone={risk?.tone || "info"}>
                      {new Date(forecast.forecast_at).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}
                    </Badge>
                  </div>
                )}
              />
            </>
          ) : (
            <p className="muted">No farm forecasts are available right now.</p>
          )}
          {weatherRiskData?.errors.length > 0 && (
            <p className="auth-error" role="alert" style={{ marginTop: 12 }}>
              Forecast unavailable for {weatherRiskData.errors.map((item) => item.farmName).join(", ")}.
            </p>
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
            <div className="flex-row" style={{ justifyContent: "space-between" }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13.5 }}>Livestock disease alerts</div>
                <div className="muted" style={{ fontSize: 12 }}>{data.total_livestock_health_alerts || 0} animal health issues needing attention</div>
              </div>
              <Badge tone="critical"><FontAwesomeIcon icon={faTriangleExclamation} style={{ marginRight: 6 }} />{data.total_livestock_health_alerts || 0}</Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Add a farm</div>
        <form onSubmit={createFarm} style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <input required placeholder="Farm name" value={farmForm.name} onChange={(event) => setFarmForm({ ...farmForm, name: event.target.value })} />
          <input required placeholder="Location" value={farmForm.location} onChange={(event) => setFarmForm({ ...farmForm, location: event.target.value })} />
          <input required min="0" step="0.1" type="number" placeholder="Size (hectares)" value={farmForm.size_hectares} onChange={(event) => setFarmForm({ ...farmForm, size_hectares: event.target.value })} />
          <select value={farmForm.farm_type} onChange={(event) => setFarmForm({ ...farmForm, farm_type: event.target.value })}>
            <option value="mixed">Mixed</option>
            <option value="crop">Crop</option>
            <option value="livestock">Livestock</option>
            <option value="aquaculture">Aquaculture</option>
          </select>
          <button type="submit" disabled={farmSaving}>{farmSaving ? "Adding…" : "Add farm"}</button>
        </form>
        {farmError && <p className="auth-error" style={{ marginTop: 10 }}>{farmError}</p>}
      </div>

      <div className="card section-gap">
        <div className="card-title">Owned farms</div>
        {deleteFarmError && <p className="auth-error" role="alert" style={{ marginBottom: 10 }}>{deleteFarmError}</p>}
        {farms.length === 0 ? (
          <p className="muted">No farms found yet. Add your first farm to monitor activity and alerts.</p>
        ) : (
          <ExpandableList
            items={farms}
            renderItem={(farm) => (
            <div
              key={farm.id}
              className="settings-row"
              style={{ padding: "16px 0", borderBottom: "1px solid var(--line)", alignItems: "flex-start" }}
            >
              {editingFarmId === farm.id ? (
                <form onSubmit={(event) => updateFarm(event, farm.id)} style={{ width: "100%", display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                  <input required placeholder="Farm name" aria-label="Farm name" value={editFarmForm.name} onChange={(event) => setEditFarmForm({ ...editFarmForm, name: event.target.value })} />
                  <input required placeholder="Location" aria-label="Location" value={editFarmForm.location} onChange={(event) => setEditFarmForm({ ...editFarmForm, location: event.target.value })} />
                  <input required min="0" step="0.1" type="number" placeholder="Size (hectares)" aria-label="Size (hectares)" value={editFarmForm.size_hectares} onChange={(event) => setEditFarmForm({ ...editFarmForm, size_hectares: event.target.value })} />
                  <select aria-label="Farm type" value={editFarmForm.farm_type} onChange={(event) => setEditFarmForm({ ...editFarmForm, farm_type: event.target.value })}>
                    <option value="mixed">Mixed</option>
                    <option value="crop">Crop</option>
                    <option value="livestock">Livestock</option>
                    <option value="aquaculture">Aquaculture</option>
                  </select>
                  <div className="flex-row">
                    <button type="submit" disabled={farmSaving}>{farmSaving ? "Saving…" : "Save changes"}</button>
                    <button type="button" onClick={() => setEditingFarmId(null)}>Cancel</button>
                  </div>
                  {editFarmError && <p className="auth-error" role="alert" style={{ gridColumn: "1 / -1" }}>{editFarmError}</p>}
                </form>
              ) : (
                <>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 15 }}>{farm.name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>
                      {farm.location} · {farm.size_hectares} ha · {farm.farm_type}
                    </div>
                  </div>
                  <div className="flex-row" style={{ flexWrap: "wrap" }}>
                    <button type="button" onClick={() => beginFarmEdit(farm)}>Edit</button>
                    <button
                      type="button"
                      disabled={deletingFarmId === farm.id}
                      onClick={() => deleteFarm(farm)}
                    >
                      {deletingFarmId === farm.id ? "Deleting…" : "Delete farm"}
                    </button>
                    <Link
                      href={`/overview?farm_id=${farm.id}`}
                      className="badge badge-info"
                      onClick={() => saveSelectedFarm(farm)}
                    >
                      View farm activity
                    </Link>
                  </div>
                </>
              )}
            </div>
            )}
          />
        )}
      </div>
    </>
  );
}
