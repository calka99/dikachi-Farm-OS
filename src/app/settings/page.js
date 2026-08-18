'use client';

import { useState, useEffect } from "react";
import { endpoints, DEFAULT_FARM_ID } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";

function Toggle({ on, onClick }) {
  return (
    <button className={`toggle${on ? " on" : ""}`} onClick={onClick} aria-pressed={on}>
      <span className="toggle-knob" />
    </button>
  );
}

export default function SettingsPage() {
  const { data, loading } = useFetch(() => endpoints.settings(DEFAULT_FARM_ID), []);
  const [local, setLocal] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) setLocal(data);
  }, [data]);

  const save = async (patch) => {
    const next = { ...local, ...patch };
    setLocal(next);
    setSaving(true);
    await endpoints.updateSettings(DEFAULT_FARM_ID, next);
    setSaving(false);
  };

  if (loading || !local) {
    return <div className="loading-text">Loading settings…</div>;
  }

  return (
    <>
      <PageHeader
        eyebrow="Settings & Infrastructure"
        title="System configuration"
        subtitle="User permissions, device connectivity, AI configuration, notifications, and data synchronization."
      />

      <div className="card">
        <div className="card-title">Notifications & AI</div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">Push notifications</div>
            <div className="settings-row-desc">Alerts for pest risk, soil degradation, and irrigation events.</div>
          </div>
          <Toggle on={local.notifications_enabled} onClick={() => save({ notifications_enabled: !local.notifications_enabled })} />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">AI recommendations</div>
            <div className="settings-row-desc">Enable AI-assisted planting, irrigation, and pest guidance.</div>
          </div>
          <Toggle on={local.ai_recommendations_enabled} onClick={() => save({ ai_recommendations_enabled: !local.ai_recommendations_enabled })} />
        </div>

        <div className="settings-row">
          <div>
            <div className="settings-row-label">SMS alerts</div>
            <div className="settings-row-desc">Send critical alerts via SMS for low-connectivity areas.</div>
          </div>
          <Toggle on={local.sms_alerts_enabled} onClick={() => save({ sms_alerts_enabled: !local.sms_alerts_enabled })} />
        </div>
      </div>

      <div className="card section-gap">
        <div className="card-title">Data & devices</div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Data sync interval</div>
            <div className="settings-row-desc">How often sensor data refreshes.</div>
          </div>
          <div className="mono" style={{ fontSize: 13 }}>{local.data_sync_interval_minutes} min</div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Connected devices</div>
            <div className="settings-row-desc">Sensors, cameras, and irrigation controllers online.</div>
          </div>
          <div className="mono" style={{ fontSize: 13 }}>{local.connected_devices}</div>
        </div>
        <div className="settings-row">
          <div>
            <div className="settings-row-label">Language</div>
            <div className="settings-row-desc">Interface and alert language.</div>
          </div>
          <div className="mono" style={{ fontSize: 13, textTransform: "uppercase" }}>{local.language}</div>
        </div>
      </div>

      {saving && <p className="muted" style={{ marginTop: 12, fontSize: 12 }}>Saving…</p>}
    </>
  );
}
