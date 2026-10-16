'use client';

import { useState } from "react";
import { endpoints } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";

function Toggle({ on, onClick, disabled }) {
  return (
    <button type="button" className={`toggle${on ? " on" : ""}`} onClick={onClick} aria-pressed={on} disabled={disabled}>
      <span className="toggle-knob" />
    </button>
  );
}

export default function SettingsPage() {
  const { data, loading, error: loadError } = useFetch(
    () => endpoints.settings(),
    []
  );
  const [savedPreference, setSavedPreference] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const local = savedPreference || data;

  const save = async (patch) => {
    if (!local || saving) return;
    const previous = local;
    const next = { ...local, ...patch };
    setSavedPreference(next);
    setSaving(true);
    setSaveError("");
    try {
      const saved = await endpoints.updateSettings(patch);
      setSavedPreference(saved);
    } catch (requestError) {
      setSavedPreference(previous);
      setSaveError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="loading-text">Loading settings…</div>;
  }

  if (loadError) {
    return <p className="auth-error" role="alert">Unable to load your farm settings: {loadError.message}</p>;
  }

  if (!local) return <div className="loading-text">Preparing settings…</div>;

  return (
    <>
      <PageHeader
        eyebrow="Account-wide farm preferences"
        title="Farm settings"
        subtitle="These preferences apply to all farms you own, including farms you add later."
      />

      <div className="card">
        <div className="card-title">AI recommendations</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Allow AI recommendations</div>
            <div className="settings-row-desc">When enabled, generate monthly farm guidance from recorded activities. Turning this off blocks recommendations and hides existing ones across all your farms.</div>
          </div>
          <Toggle on={local.ai_recommendations_enabled} disabled={saving} onClick={() => save({ ai_recommendations_enabled: !local.ai_recommendations_enabled })} />
        </div>
      </div>

      {saving && <p className="muted" style={{ marginTop: 12, fontSize: 12 }} role="status">Saving…</p>}
      {saveError && <p className="auth-error" style={{ marginTop: 12 }} role="alert">Unable to save settings: {saveError}</p>}
    </>
  );
}
