"use client";

import { useEffect, useState } from "react";
import { endpoints } from "@/api/client";
import { useFetch } from "@/api/useFetch";
import PageHeader from "@/components/PageHeader";

export default function RecommendationsPage() {
  const { data, loading, error } = useFetch(() => endpoints.ownedFarms(), []);
  const farms = Array.isArray(data) ? data : [];
  const [selectedFarmId, setSelectedFarmId] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generationError, setGenerationError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    if (farms.length && !farms.some((farm) => String(farm.id) === String(selectedFarmId))) {
      setSelectedFarmId(String(farms[0].id));
    }
  }, [farms, selectedFarmId]);

  const generate = async (event) => {
    event.preventDefault();
    if (!selectedFarmId || generating) return;
    setGenerating(true);
    setGenerationError("");
    setNotice("");
    try {
      const result = await endpoints.generateRecommendations(selectedFarmId);
      setNotice(result.detail);
    } catch (requestError) {
      setGenerationError(requestError.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Monthly farm operations"
        title="Generate AI recommendations"
        subtitle="Choose one of your farms to generate recommendations from its recorded activities this month."
      />

      {loading && <div className="loading-text">Loading your farms...</div>}
      {error && <p className="auth-error" role="alert">Unable to load your farms: {error.message}</p>}

      {!loading && !error && farms.length === 0 && (
        <div className="card">
          <p className="muted">You do not have any farms yet. Create a farm before generating recommendations.</p>
        </div>
      )}

      {!loading && !error && farms.length > 0 && (
        <div className="card">
          <form onSubmit={generate} className="profile-form">
            <label htmlFor="recommendation-farm">
              Select farm
              <select
                id="recommendation-farm"
                value={selectedFarmId}
                onChange={(event) => {
                  setSelectedFarmId(event.target.value);
                  setGenerationError("");
                  setNotice("");
                }}
                disabled={generating}
                required
              >
                {farms.map((farm) => (
                  <option key={farm.id} value={farm.id}>{farm.name}</option>
                ))}
              </select>
            </label>
            <p className="muted" style={{ fontSize: 13, margin: 0 }}>
              Recommendations are based only on this farm&apos;s recorded activities for the current month.
            </p>
            {generationError && <p className="auth-error" role="alert">{generationError}</p>}
            {notice && <p className="profile-success" role="status">{notice}</p>}
            <button className="auth-submit" type="submit" disabled={generating || !selectedFarmId}>
              {generating ? "Generating..." : "Generate recommendations"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
