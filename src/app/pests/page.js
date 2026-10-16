'use client';

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBug } from "@fortawesome/free-solid-svg-icons";
import { endpoints } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/Badge";
import ExpandableList from "../../components/ExpandableList";

export default function Pests() {
  const { data, loading, reload } = useFetch(() => endpoints.pests(), []);
  const { data: dashboard } = useFetch(() => endpoints.dashboardOverview(), []);
  const [resolving, setResolving] = useState(null);
  const [form, setForm] = useState({ farm_id: "", crop_name: "", issue_type: "pest", issue_name: "", risk_level: "low", detection_method: "manual", recommended_action: "" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const farms = dashboard?.farms || [];
  const { data: farmCrops, loading: cropsLoading } = useFetch(
    () => form.farm_id ? endpoints.crops(form.farm_id) : Promise.resolve([]),
    [form.farm_id]
  );

  const createAlert = async (event) => {
    event.preventDefault(); setSaving(true); setFormError("");
    try {
      await endpoints.createPest({
        ...form,
        pest_or_disease: `${form.issue_type === "disease" ? "Disease" : "Pest"}: ${form.issue_name}`,
        detected_at: new Date().toISOString(),
      });
      setForm({ farm_id: "", crop_name: "", issue_type: "pest", issue_name: "", risk_level: "low", detection_method: "manual", recommended_action: "" });
      reload();
    }
    catch (requestError) { setFormError(requestError.message); } finally { setSaving(false); }
  };

  const resolve = async (id) => {
    setResolving(id);
    await endpoints.resolvePest(id);
    setResolving(null);
    reload();
  };

  const list = Array.isArray(data) ? data : [];
  const open = list.filter((p) => !p?.resolved);
  const resolved = list.filter((p) => p?.resolved);

  return (
    <>
      <PageHeader
        eyebrow="Pest Alert"
        title="Pest & disease alerts"
        subtitle="Image recognition, outbreak history, and environmental variables flag risk before infestations spread."
      />

      {loading && <div className="loading-text">Loading pest alerts…</div>}

      <div className="card section-gap">
        <div className="card-title">Record pest alert</div>
        <form onSubmit={createAlert} style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <select required value={form.farm_id} onChange={(event) => setForm({ ...form, farm_id: event.target.value, crop_name: "" })}><option value="">Select farm</option>{farms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}</select>
          <select required value={form.crop_name} disabled={!form.farm_id || cropsLoading} onChange={(event) => setForm({ ...form, crop_name: event.target.value })}>
            <option value="">{cropsLoading ? "Loading farm crops…" : "Select crop"}</option>
            {(farmCrops || []).map((crop) => <option key={crop.id} value={crop.name}>{crop.name}</option>)}
          </select>
          <select required value={form.issue_type} onChange={(event) => setForm({ ...form, issue_type: event.target.value })}>
            <option value="pest">Pest</option>
          </select>
          <input required placeholder="Pest name" value={form.issue_name} onChange={(event) => setForm({ ...form, issue_name: event.target.value })} />
          <select value={form.risk_level} onChange={(event) => setForm({ ...form, risk_level: event.target.value })}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select>
          <textarea placeholder="Recommended action" value={form.recommended_action} onChange={(event) => setForm({ ...form, recommended_action: event.target.value })} />
          <button type="submit" disabled={saving || farms.length === 0}>{saving ? "Saving…" : "Save pest alert"}</button>
        </form>
        {formError && <p className="auth-error" style={{ marginTop: 10 }}>{formError}</p>}
      </div>

      <div className="card-title" style={{ marginTop: 4 }}>Active ({open.length})</div>
      <ExpandableList
        items={open}
        className="grid grid-2"
        renderItem={(p) => (
          <div className="card" key={p.id}>
            <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
              <div className="flex-row">
                <span className="icon-tile"><FontAwesomeIcon icon={faBug} style={{ fontSize: 16 }} /></span>
                <div>
                  <div style={{ fontWeight: 700 }}>{p?.pest_or_disease || "Unknown issue"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{p?.crop_name || "Unknown crop"}</div>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>Farm: {p?.farm_name || "Unknown farm"}</div>
                </div>
              </div>
              <Badge tone={p?.risk_level || "info"}>{p?.risk_level || "info"} risk</Badge>
            </div>
            <p style={{ fontSize: 13, margin: "10px 0 14px" }}>{p?.recommended_action || "No action recorded yet."}</p>
            <div className="flex-row" style={{ justifyContent: "space-between" }}>
              <span className="muted" style={{ fontSize: 11.5 }}>
                Detected via {p?.detection_method?.replace("_", " ") || "unknown method"}
              </span>
              <button
                onClick={() => resolve(p.id)}
                disabled={resolving === p.id}
                style={{
                  border: "1px solid var(--line)",
                  background: "var(--paper)",
                  borderRadius: 6,
                  padding: "5px 10px",
                  fontSize: 12,
                  cursor: "pointer",
                  color: "var(--leaf-600)",
                  fontWeight: 600,
                }}
              >
                {resolving === p.id ? "…" : "Mark resolved"}
              </button>
            </div>
          </div>
        )}
      />
        {open.length === 0 && !loading && <p className="muted">No active pest alerts. Nice work.</p>}

      {resolved.length > 0 && (
        <>
          <div className="card-title section-gap">Resolved</div>
          <div className="card">
            <div className="table-wrap">
              <table className="table">
                <thead><tr><th>Farm</th><th>Crop</th><th>Issue</th><th>Risk</th><th>Detected</th></tr></thead>
                <ExpandableList
                  as="tbody"
                  items={resolved}
                  colSpan={5}
                  renderItem={(p) => (
                    <tr key={p.id}>
                      <td>{p?.farm_name || "—"}</td>
                      <td>{p?.crop_name || "—"}</td>
                      <td>{p?.pest_or_disease || "—"}</td>
                      <td><Badge tone={p?.risk_level || "info"}>{p?.risk_level || "—"}</Badge></td>
                      <td className="muted">{p?.detected_at ? new Date(p.detected_at).toLocaleDateString() : "—"}</td>
                    </tr>
                  )}
                />
              </table>
            </div>
          </div>
        </>
      )}
    </>
  );
}
