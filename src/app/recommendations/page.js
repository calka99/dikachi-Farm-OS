"use client";

import { useState } from "react";
import { endpoints, DEFAULT_FARM_ID } from "@/api/client";
import { useFetch } from "@/api/useFetch";
import PageHeader from "@/components/PageHeader";
import Badge from "@/components/Badge";

export default function RecommendationsPage() {
  const { data, loading, reload } = useFetch(() => endpoints.recommendations(DEFAULT_FARM_ID), []);
  const [generating, setGenerating] = useState(false);

  const generate = async () => {
    setGenerating(true);
    await endpoints.generateRecommendations(DEFAULT_FARM_ID);
    setGenerating(false);
    reload();
  };

  return (
    <>
      <PageHeader
        eyebrow="AI Recommendation Engine"
        title="Farm recommendations"
        subtitle="Prioritized actions generated from your latest soil, weather, crop, and pest signals."
        action={<button className="auth-submit" type="button" onClick={generate} disabled={generating}>{generating ? "Generating..." : "Generate recommendations"}</button>}
      />
      {loading && <div className="loading-text">Loading recommendations...</div>}
      <div className="grid grid-2">
        {data?.map((recommendation) => (
          <div className="card" key={recommendation.id || recommendation.title}>
            <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <span className="page-eyebrow" style={{ marginBottom: 0 }}>{recommendation.category}</span>
              <Badge tone={recommendation.priority}>{recommendation.priority}</Badge>
            </div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>{recommendation.title}</h3>
            <p className="muted" style={{ fontSize: 13, lineHeight: 1.6 }}>{recommendation.message}</p>
          </div>
        ))}
      </div>
    </>
  );
}