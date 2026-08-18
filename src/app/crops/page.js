'use client';

import React from "react";
import { endpoints, DEFAULT_FARM_ID } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import "../globals.css"

const STAGE_PROGRESS = {
  seedling: 15,
  vegetative: 40,
  flowering: 65,
  fruiting: 85,
  harvest_ready: 100,
};

function daysUntil(iso) {
  if (!iso) return null;
  const days = Math.round((new Date(iso).getTime() - Date.now()) / 86400000);
  return days;
}

export default function Crops() {
  const { data, loading } = useFetch(() => endpoints.crops(DEFAULT_FARM_ID), []);

  return (
    <>
      <PageHeader
        eyebrow="Crops"
        title="Planted crops"
        subtitle="Growth stages, planting density, expected harvest dates, and AI-generated planting recommendations."
      />

      {loading && <div className="loading-text">Loading crops…</div>}


      <div className="grid grid-2">
        {data?.map((crop) => {
          const progress = STAGE_PROGRESS[crop.growth_stage] ?? 30;
          const days = daysUntil(crop.expected_harvest_date);
          return (
            <div className="card" key={crop.id}>
              <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: 4 }}>
                <h3 style={{ fontSize: 17 }}>{crop.name}</h3>
                <span className="badge badge-info" style={{ textTransform: "capitalize" }}>
                  {crop.growth_stage.replace("_", " ")}
                </span>
              </div>
              <p className="muted" style={{ fontSize: 12.5, marginBottom: 14 }}>
                {crop.variety} · {crop.area_hectares} ha · {crop.planting_density}
              </p>

              <div className="progress-track" style={{ marginBottom: 6 }}>
                <div className="progress-fill" style={{ width: `${progress}%` }} />
              </div>
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

              {crop.historical_yield_kg && (
                <div className="muted" style={{ fontSize: 11.5, marginTop: 12 }}>
                  Historical yield: {crop.historical_yield_kg.toLocaleString()} kg
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
