'use client';

import React, { useEffect, useState } from "react";
import { endpoints } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import ExpandableList from "../../components/ExpandableList";
import "../globals.css"

const growthStages = [
  { value: "seeding", label: "Seeding", startsAt: 0 },
  { value: "germination", label: "Germination", startsAt: 5 },
  { value: "seedling", label: "Seedling", startsAt: 12 },
  { value: "vegetative", label: "Vegetative", startsAt: 25 },
  { value: "budding", label: "Budding", startsAt: 45 },
  { value: "flowering", label: "Flowering", startsAt: 55 },
  { value: "fruiting", label: "Fruiting", startsAt: 70 },
  { value: "maturing", label: "Maturing", startsAt: 85 },
  { value: "harvesting", label: "Harvesting", startsAt: 95 },
];

function daysUntil(iso) {
  if (!iso) return null;
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  return days;
}

function formatDate(iso) {
  return iso ? new Date(iso).toLocaleDateString() : "Not set";
}

function harvestProgress(plantingDate, harvestDate) {
  if (!plantingDate || !harvestDate) return null;

  const start = new Date(plantingDate).getTime();
  const end = new Date(harvestDate).getTime();
  const now = Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;

  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}

function estimatedGrowthStage(progress, storedStage) {
  if (progress === null) {
    const storedValue = storedStage?.toLowerCase().replaceAll(" ", "_");
    return growthStages.find((stage) => stage.value === storedValue)?.label || "Stage unavailable";
  }

  return growthStages.reduce(
    (currentStage, stage) => progress >= stage.startsAt ? stage.label : currentStage,
    growthStages[0].label
  );
}

export default function Crops() {
  const { data, loading, reload } = useFetch(() => endpoints.crops(), []);
  const { data: dashboard } = useFetch(() => endpoints.dashboardOverview(), []);
  const { data: cropTypes, loading: cropTypesLoading } = useFetch(() => endpoints.cropTypes(), []);
  const [form, setForm] = useState({ farm_id: "", crop_type_id: "", variety: "", planting_date: "", area_hectares: "", planting_density: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [cropToHarvest, setCropToHarvest] = useState(null);
  const [harvestYieldKg, setHarvestYieldKg] = useState("");
  const [harvestingCropId, setHarvestingCropId] = useState(null);
  const [harvestError, setHarvestError] = useState("");
  const [cropDeleteError, setCropDeleteError] = useState("");
  const [deletingCropId, setDeletingCropId] = useState(null);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const farms = dashboard?.farms || [];
  const crops = data || [];
  const harvestedCrops = crops.filter((crop) => crop.harvested_at || crop.growth_stage?.toLowerCase() === "harvested");
  const recentHarvests = [...harvestedCrops]
    .sort((first, second) => Date.parse(second.harvested_at || "") - Date.parse(first.harvested_at || ""))
    .slice(0, 10);
  const activeCrops = crops.filter((crop) => !crop.harvested_at && crop.growth_stage?.toLowerCase() !== "harvested");

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentTime(Date.now()), 60000);
    return () => window.clearInterval(timer);
  }, []);

  const createCrop = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await endpoints.createCrop({
        ...form,
        area_hectares: Number(form.area_hectares || 0),
        planting_date: `${form.planting_date}T00:00:00Z`,
      });
      setForm({ farm_id: "", crop_type_id: "", variety: "", planting_date: "", area_hectares: "", planting_density: "" });
      reload();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const openHarvestForm = (crop) => {
    setCropToHarvest(crop);
    setHarvestYieldKg("");
    setHarvestError("");
  };

  const markAsHarvested = async (event) => {
    event.preventDefault();
    if (!cropToHarvest) return;

    setHarvestingCropId(cropToHarvest.id);
    setHarvestError("");
    try {
      await endpoints.markCropHarvested(cropToHarvest.id, {
        historical_yield_kg: Number(harvestYieldKg),
      });
      reload();
      setCropToHarvest(null);
      setHarvestYieldKg("");
    } catch (requestError) {
      setHarvestError(requestError.message);
    } finally {
      setHarvestingCropId(null);
    }
  };

  const deleteCrop = async (crop) => {
    if (!window.confirm(`Delete ${crop.name}? This cannot be undone.`)) return;

    setDeletingCropId(crop.id);
    setCropDeleteError("");
    try {
      await endpoints.deleteCrop(crop.id);
      reload();
    } catch (requestError) {
      setCropDeleteError(requestError.message);
    } finally {
      setDeletingCropId(null);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Crops"
        title="Planted crops"
        subtitle="Growth stages, planting density, expected harvest dates, and AI-generated planting recommendations."
      />

      {loading && <div className="loading-text">Loading crops…</div>}

      <div className="card section-gap">
        <div className="card-title">Add a crop</div>
        <form onSubmit={createCrop} style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <select required value={form.farm_id} onChange={(event) => setForm({ ...form, farm_id: event.target.value })}>
            <option value="">Select farm</option>
            {farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
          </select>
          <select required value={form.crop_type_id} onChange={(event) => setForm({ ...form, crop_type_id: event.target.value })}>
            <option value="">{cropTypesLoading ? "Loading crop options…" : "Select crop"}</option>
            {(cropTypes || []).map((cropType) => <option key={cropType.id} value={cropType.id}>{cropType.name} ({cropType.lifespan_days} days)</option>)}
          </select>
          <input placeholder="Variety" value={form.variety} onChange={(event) => setForm({ ...form, variety: event.target.value })} />
          <input required type="date" value={form.planting_date} onChange={(event) => setForm({ ...form, planting_date: event.target.value })} />
          <input min="0" step="0.1" type="number" placeholder="Area (ha)" value={form.area_hectares} onChange={(event) => setForm({ ...form, area_hectares: event.target.value })} />
          <input placeholder="Planting density" value={form.planting_density} onChange={(event) => setForm({ ...form, planting_density: event.target.value })} />
          <button type="submit" disabled={saving || farms.length === 0}>{saving ? "Adding…" : "Add crop"}</button>
        </form>
        {formError && <p className="auth-error" style={{ marginTop: 10 }}>{formError}</p>}
      </div>

      {harvestError && <p className="auth-error section-gap" role="alert">{harvestError}</p>}
      {cropDeleteError && <p className="auth-error section-gap" role="alert">{cropDeleteError}</p>}

      <h2 className="section-gap" style={{ fontSize: 20 }}>Growing crops</h2>
      {activeCrops.length === 0 && !loading ? (
        <p className="muted">No active crops. Add a crop to begin tracking a growing cycle.</p>
      ) : (
      <ExpandableList
        items={activeCrops}
        className="grid grid-2"
        renderItem={(crop) => {
          const progress = harvestProgress(crop.planting_date, crop.expected_harvest_date);
          const growthStage = estimatedGrowthStage(progress, crop.growth_stage);
          const days = daysUntil(crop.expected_harvest_date);
          const harvestDate = crop.expected_harvest_date ? new Date(crop.expected_harvest_date).getTime() : NaN;
          const harvestAvailable = Number.isFinite(harvestDate) && currentTime >= harvestDate;
          return (
            <div className="card" key={crop.id}>
              <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <h3 style={{ fontSize: 17 }}>{crop.name}</h3>
                <span className="badge badge-info" aria-label={`Estimated growth stage: ${growthStage}`}>
                  {growthStage}
                </span>
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
                {crop.variety} · {crop.area_hectares} ha · {crop.planting_density}
              </p>
              <p className="muted" style={{ fontSize: 11.5, marginBottom: 14 }}>
                Farm: {crop.farm_name}
              </p>
              <div className="muted" style={{ display: "flex", justifyContent: "space-between", gap: 12, fontSize: 11.5, marginBottom: 8 }}>
                <span>Planted: {formatDate(crop.planting_date)}</span>
                <span>Expected harvest: {formatDate(crop.expected_harvest_date)}</span>
              </div>

              {progress !== null ? (
                <>
                  <div className="progress-track" style={{ marginBottom: 6 }}>
                    <div className="progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <div className="muted" style={{ fontSize: 11.5, marginBottom: 16 }}>
                    Timeline progress: {Math.round(progress)}%
                  </div>
                </>
              ) : (
                <div className="muted" style={{ fontSize: 11.5, marginBottom: 16 }}>
                  Add a harvest date to track timeline progress.
                </div>
              )}
              <div className="muted" style={{ fontSize: 11.5, marginBottom: 16 }}>
                {days !== null && days >= 0
                  ? `Expected harvest in ${days} days`
                  : days !== null
                  ? "Harvest window open"
                  : "Harvest date not set"}
              </div>

              {crop.ai_recommendation && (
                <div style={{ background: "var(--green-100)", borderRadius: "var(--radius-sm)", padding: "10px 12px", fontSize: 12.5, color: "var(--forest-800)" }}>
                  <strong style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, letterSpacing: "0.04em" }}>AI RECOMMENDATION · </strong>
                  {crop.ai_recommendation}
                </div>
              )}

              <div className="flex-row" style={{ marginTop: 14, flexWrap: "wrap" }}>
                <button
                  type="button"
                  disabled={!harvestAvailable}
                  title={!harvestAvailable ? "Harvest is available on or after the expected harvest date." : undefined}
                  onClick={() => openHarvestForm(crop)}
                >
                  Mark harvested
                </button>
                <button
                  type="button"
                  disabled={deletingCropId === crop.id}
                  onClick={() => deleteCrop(crop)}
                >
                  {deletingCropId === crop.id ? "Deleting…" : "Delete crop"}
                </button>
              </div>
            </div>
          );
        }}
      />
      )}

      <section className="card section-gap" aria-labelledby="successful-harvests-title">
        <h2 id="successful-harvests-title" className="card-title">Successful harvests · latest 10</h2>
        {harvestedCrops.length === 0 ? (
          <p className="muted">Harvested crops will appear here when marked harvested.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr><th>Crop</th><th>Farm</th><th>Variety</th><th>Planted</th><th>Harvested</th><th>Area</th><th>Yield</th><th>Result</th></tr>
              </thead>
              <ExpandableList
                as="tbody"
                items={recentHarvests}
                colSpan={8}
                renderItem={(crop) => (
                  <tr key={crop.id}>
                    <td>{crop.name}</td>
                    <td>{crop.farm_name}</td>
                    <td>{crop.variety || "—"}</td>
                    <td>{formatDate(crop.planting_date)}</td>
                    <td>{formatDate(crop.harvested_at)}</td>
                    <td>{crop.area_hectares} ha</td>
                    <td>{crop.historical_yield_kg != null ? `${crop.historical_yield_kg.toLocaleString()} kg` : "—"}</td>
                    <td><span className="badge badge-completed">Successful</span></td>
                  </tr>
                )}
              />
            </table>
          </div>
        )}
      </section>

      {cropToHarvest && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            padding: 20,
            background: "rgba(0, 0, 0, 0.45)",
          }}
        >
          <section
            className="card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="harvest-dialog-title"
            style={{ width: "min(100%, 440px)", boxShadow: "var(--shadow-card)" }}
          >
            <h2 id="harvest-dialog-title" className="card-title">Record crop harvest</h2>
            <p className="muted" style={{ marginBottom: 14 }}>{cropToHarvest.name}</p>
            <form onSubmit={markAsHarvested} style={{ display: "grid", gap: 12 }}>
              <label htmlFor="harvest-yield-kg">Crop harvest in kg</label>
              <input
                id="harvest-yield-kg"
                autoFocus
                required
                min="0"
                step="0.1"
                type="number"
                value={harvestYieldKg}
                onChange={(event) => setHarvestYieldKg(event.target.value)}
              />
              {harvestError && <p className="auth-error" role="alert">{harvestError}</p>}
              <div className="flex-row" style={{ justifyContent: "flex-end", marginTop: 4 }}>
                <button
                  type="button"
                  disabled={harvestingCropId !== null}
                  onClick={() => setCropToHarvest(null)}
                >
                  Cancel
                </button>
                <button type="submit" disabled={harvestingCropId !== null}>
                  {harvestingCropId === cropToHarvest.id ? "Recording…" : "Save harvest"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </>
  );
}
