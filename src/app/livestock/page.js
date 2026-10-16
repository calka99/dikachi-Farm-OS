'use client';

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPaw } from "@fortawesome/free-solid-svg-icons";
import { endpoints } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import Badge from "../../components/Badge";
import ExpandableList from "../../components/ExpandableList";

const dateInputValue = (value) => {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

export default function LivestockPage() {
  const { data, loading, reload } = useFetch(() => endpoints.livestock(), []);
  const { data: livestockTypes, loading: livestockTypesLoading, error: livestockTypesError } = useFetch(() => endpoints.livestockTypes(), []);
  const { data: healthAlerts, reload: reloadAlerts } = useFetch(() => endpoints.livestockHealthAlerts(), []);
  const { data: dashboard, reload: reloadDashboard } = useFetch(() => endpoints.dashboardOverview(), []);
  const [form, setForm] = useState({ farm_id: "", species: "", tag_id: "", count: "1", health_status: "healthy", last_vaccination: "", feeding_schedule: "", productivity_metric: "" });
  const [newFarmForm, setNewFarmForm] = useState({ name: "", location: "", size_hectares: "" });
  const [diseaseForm, setDiseaseForm] = useState({ farm_id: "", livestock_id: "", disease_name: "", severity: "medium", recommended_action: "" });
  const [saving, setSaving] = useState(false);
  const [editingLivestockId, setEditingLivestockId] = useState(null);
  const [livestockEditForm, setLivestockEditForm] = useState(null);
  const [savingLivestockEdit, setSavingLivestockEdit] = useState(false);
  const [livestockEditError, setLivestockEditError] = useState("");
  const [savingFarm, setSavingFarm] = useState(false);
  const [savingDisease, setSavingDisease] = useState(false);
  const [formError, setFormError] = useState("");
  const [farmError, setFarmError] = useState("");
  const [diseaseError, setDiseaseError] = useState("");
  const farms = dashboard?.farms || [];
  const livestockFarms = farms.filter((farm) => ["livestock", "mixed", "aquaculture"].includes((farm.farm_type || "").trim().toLowerCase()));
  const selectedFarmLivestock = Array.isArray(data) ? data.filter((entry) => String(entry.farm) === String(diseaseForm.farm_id) || String(entry.farm_id) === String(diseaseForm.farm_id)) : [];

  const createLivestockFarm = async (event) => {
    event.preventDefault();
    setSavingFarm(true);
    setFarmError("");
    try {
      const farm = await endpoints.createFarm({
        ...newFarmForm,
        size_hectares: Number(newFarmForm.size_hectares),
        farm_type: "livestock",
      });
      setForm({ ...form, farm_id: String(farm.id) });
      setNewFarmForm({ name: "", location: "", size_hectares: "" });
      reloadDashboard();
    } catch (requestError) {
      setFarmError(requestError.message);
    } finally {
      setSavingFarm(false);
    }
  };

  const createLivestock = async (event) => {
    event.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      await endpoints.createLivestock({ ...form, count: Number(form.count), last_vaccination: form.last_vaccination ? `${form.last_vaccination}T00:00:00Z` : null });
      setForm({ farm_id: "", species: "", tag_id: "", count: "1", health_status: "healthy", last_vaccination: "", feeding_schedule: "", productivity_metric: "" });
      reload();
    } catch (requestError) {
      setFormError(requestError.message);
    } finally {
      setSaving(false);
    }
  };

  const startLivestockEdit = (livestock) => {
    setEditingLivestockId(livestock.id);
    setLivestockEditForm({
      farm_id: String(livestock.farm),
      species: livestock.species || "",
      tag_id: livestock.tag_id || "",
      count: String(livestock.count ?? 1),
      health_status: livestock.health_status || "healthy",
      last_vaccination: dateInputValue(livestock.last_vaccination),
      feeding_schedule: livestock.feeding_schedule || "",
      productivity_metric: livestock.productivity_metric || "",
    });
    setLivestockEditError("");
  };

  const cancelLivestockEdit = () => {
    setEditingLivestockId(null);
    setLivestockEditForm(null);
    setLivestockEditError("");
  };

  const updateLivestock = async (event, livestockId) => {
    event.preventDefault();
    setSavingLivestockEdit(true);
    setLivestockEditError("");
    try {
      await endpoints.updateLivestock(livestockId, {
        ...livestockEditForm,
        farm_id: Number(livestockEditForm.farm_id),
        count: Number(livestockEditForm.count),
        last_vaccination: livestockEditForm.last_vaccination ? `${livestockEditForm.last_vaccination}T00:00:00Z` : null,
      });
      cancelLivestockEdit();
      reload();
    } catch (requestError) {
      setLivestockEditError(requestError.message);
    } finally {
      setSavingLivestockEdit(false);
    }
  };

  const createLivestockHealthAlert = async (event) => {
    event.preventDefault();
    setSavingDisease(true);
    setDiseaseError("");
    try {
      await endpoints.createLivestockHealthAlert({
        ...diseaseForm,
        farm_id: diseaseForm.farm_id,
        livestock_id: diseaseForm.livestock_id,
        detected_at: new Date().toISOString(),
      });
      setDiseaseForm({ farm_id: "", livestock_id: "", disease_name: "", severity: "medium", recommended_action: "" });
      reloadAlerts();
    } catch (requestError) {
      setDiseaseError(requestError.message);
    } finally {
      setSavingDisease(false);
    }
  };
  const list = Array.isArray(data) ? data : [];

  return (
    <>
      <PageHeader
        eyebrow="Livestock Management"
        title="Livestock & aquaculture"
        subtitle="Animal health, feeding schedules, vaccination history, and productivity for mixed urban farms."
      />

      {loading && <div className="loading-text">Loading livestock records…</div>}

      <div className="card section-gap">
        <div className="card-title">Add livestock</div>
        {livestockFarms.length === 0 && (
          <div style={{ marginBottom: 14 }}>
            <p className="muted" style={{ marginBottom: 10 }}>You don’t have a livestock-capable farm yet. Create a livestock farm to continue.</p>
            <form onSubmit={createLivestockFarm} style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
              <input required placeholder="Farm name" aria-label="New farm name" value={newFarmForm.name} onChange={(event) => setNewFarmForm({ ...newFarmForm, name: event.target.value })} />
              <input required placeholder="Location" aria-label="New farm location" value={newFarmForm.location} onChange={(event) => setNewFarmForm({ ...newFarmForm, location: event.target.value })} />
              <input required min="0" step="0.1" type="number" placeholder="Size (hectares)" aria-label="New farm size in hectares" value={newFarmForm.size_hectares} onChange={(event) => setNewFarmForm({ ...newFarmForm, size_hectares: event.target.value })} />
              <button type="submit" disabled={savingFarm}>{savingFarm ? "Creating…" : "Create livestock farm"}</button>
            </form>
            {farmError && <p className="auth-error" role="alert" style={{ marginTop: 10 }}>{farmError}</p>}
          </div>
        )}
        <form onSubmit={createLivestock} style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <select required value={form.farm_id} onChange={(event) => setForm({ ...form, farm_id: event.target.value })}>
            <option value="">Select livestock farm</option>
            {livestockFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
          </select>
          <select required value={form.species} onChange={(event) => setForm({ ...form, species: event.target.value })}>
            <option value="">{livestockTypesLoading ? "Loading livestock options…" : "Select livestock species"}</option>
            {(livestockTypes || []).map((livestockType) => (
              <option key={livestockType.id} value={livestockType.name}>{livestockType.name}</option>
            ))}
          </select>
          <input placeholder="Tag ID" value={form.tag_id} onChange={(event) => setForm({ ...form, tag_id: event.target.value })} />
          <input required min="0" type="number" placeholder="Count" value={form.count} onChange={(event) => setForm({ ...form, count: event.target.value })} />
          <select value={form.health_status} onChange={(event) => setForm({ ...form, health_status: event.target.value })}>
            <option value="healthy">Healthy</option><option value="watch">Watch</option><option value="critical">Critical</option>
          </select>
          <input type="date" value={form.last_vaccination} onChange={(event) => setForm({ ...form, last_vaccination: event.target.value })} />
          <input placeholder="Feeding schedule" value={form.feeding_schedule} onChange={(event) => setForm({ ...form, feeding_schedule: event.target.value })} />
          <input placeholder="Productivity metric" value={form.productivity_metric} onChange={(event) => setForm({ ...form, productivity_metric: event.target.value })} />
          <button type="submit" disabled={saving || livestockTypesLoading || livestockFarms.length === 0 || !livestockTypes?.length}>{saving ? "Adding…" : "Add livestock"}</button>
        </form>
        {livestockTypesError && <p className="auth-error" role="alert" style={{ marginTop: 10 }}>Unable to load livestock species: {livestockTypesError.message}</p>}
        {formError && <p className="auth-error" style={{ marginTop: 10 }}>{formError}</p>}
      </div>

      <div className="card section-gap">
        <div className="card-title">Record livestock disease alert</div>
        <form onSubmit={createLivestockHealthAlert} style={{ display: "grid", gap: 10, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
          <select required value={diseaseForm.farm_id} onChange={(event) => setDiseaseForm({ ...diseaseForm, farm_id: event.target.value, livestock_id: "" })}>
            <option value="">Select livestock farm</option>
            {livestockFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
          </select>
          <select required value={diseaseForm.livestock_id} disabled={!diseaseForm.farm_id} onChange={(event) => setDiseaseForm({ ...diseaseForm, livestock_id: event.target.value })}>
            <option value="">Select livestock</option>
            {selectedFarmLivestock.map((entry) => <option key={entry.id} value={entry.id}>{entry.species} {entry.tag_id ? `(${entry.tag_id})` : ""}</option>)}
          </select>
          <input required placeholder="Disease name" value={diseaseForm.disease_name} onChange={(event) => setDiseaseForm({ ...diseaseForm, disease_name: event.target.value })} />
          <select value={diseaseForm.severity} onChange={(event) => setDiseaseForm({ ...diseaseForm, severity: event.target.value })}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <textarea placeholder="Recommended action" value={diseaseForm.recommended_action} onChange={(event) => setDiseaseForm({ ...diseaseForm, recommended_action: event.target.value })} />
          <button type="submit" disabled={savingDisease || livestockFarms.length === 0}>{savingDisease ? "Saving…" : "Save disease alert"}</button>
        </form>
        {livestockFarms.length === 0 && <p className="muted" style={{ marginTop: 10 }}>Create a livestock, mixed, or aquaculture farm above before recording a disease alert.</p>}
        {diseaseError && <p className="auth-error" style={{ marginTop: 10 }}>{diseaseError}</p>}
      </div>

      {Array.isArray(healthAlerts) && healthAlerts.length > 0 && (
        <div className="card section-gap">
          <div className="card-title">Livestock disease alerts</div>
          <ExpandableList
            items={healthAlerts}
            className="grid grid-2"
            renderItem={(alert) => (
              <div className="card" key={alert.id}>
                <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: 6 }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{alert.disease_name}</div>
                    <div className="muted" style={{ fontSize: 12 }}>{alert.livestock_name || "Livestock"}</div>
                  </div>
                  <Badge tone={alert.severity || "info"}>{alert.severity || "unknown"}</Badge>
                </div>
                <p style={{ fontSize: 13, margin: "10px 0 14px" }}>{alert.recommended_action || "No action recorded yet."}</p>
                <div className="muted" style={{ fontSize: 11.5 }}>Farm: {alert.farm_name}</div>
              </div>
            )}
          />
        </div>
      )}

      <ExpandableList
        items={list}
        className="grid grid-2"
        renderItem={(l) => (
          <div className="card" key={l.id}>
            <div className="flex-row" style={{ justifyContent: "space-between", marginBottom: 10 }}>
              <div className="flex-row">
                <span className="icon-tile"><FontAwesomeIcon icon={faPaw} style={{ fontSize: 16 }} /></span>
                <div>
                  <div style={{ fontWeight: 700 }}>{l.species || "Unknown species"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{l.tag_id || "—"}</div>
                  <div className="muted" style={{ fontSize: 11.5, marginTop: 3 }}>Farm: {l.farm_name}</div>
                </div>
              </div>
              <div className="flex-row">
                <Badge tone={l.health_status || "info"}>{l.health_status || "Unknown"}</Badge>
                {editingLivestockId !== l.id && <button type="button" onClick={() => startLivestockEdit(l)}>Edit</button>}
              </div>
            </div>

            {editingLivestockId === l.id ? (
              <form onSubmit={(event) => updateLivestock(event, l.id)} style={{ display: "grid", gap: 10 }}>
                <label className="muted" style={{ display: "grid", gap: 4, fontSize: 12 }}>
                  Farm
                  <select required value={livestockEditForm.farm_id} onChange={(event) => setLivestockEditForm({ ...livestockEditForm, farm_id: event.target.value })}>
                    {!livestockFarms.some((farm) => String(farm.id) === livestockEditForm.farm_id) && <option value={livestockEditForm.farm_id}>{l.farm_name}</option>}
                    {livestockFarms.map((farm) => <option key={farm.id} value={farm.id}>{farm.name}</option>)}
                  </select>
                </label>
                <label className="muted" style={{ display: "grid", gap: 4, fontSize: 12 }}>
                  Species
                  <select required value={livestockEditForm.species} onChange={(event) => setLivestockEditForm({ ...livestockEditForm, species: event.target.value })}>
                    {!livestockTypes?.some((type) => type.name === livestockEditForm.species) && <option value={livestockEditForm.species}>{livestockEditForm.species}</option>}
                    {(livestockTypes || []).map((type) => <option key={type.id} value={type.name}>{type.name}</option>)}
                  </select>
                </label>
                <label className="muted" style={{ display: "grid", gap: 4, fontSize: 12 }}>
                  Tag ID
                  <input value={livestockEditForm.tag_id} onChange={(event) => setLivestockEditForm({ ...livestockEditForm, tag_id: event.target.value })} />
                </label>
                <label className="muted" style={{ display: "grid", gap: 4, fontSize: 12 }}>
                  Count
                  <input required min="0" type="number" value={livestockEditForm.count} onChange={(event) => setLivestockEditForm({ ...livestockEditForm, count: event.target.value })} />
                </label>
                <label className="muted" style={{ display: "grid", gap: 4, fontSize: 12 }}>
                  Health status
                  <select value={livestockEditForm.health_status} onChange={(event) => setLivestockEditForm({ ...livestockEditForm, health_status: event.target.value })}>
                    {!["healthy", "watch", "critical"].includes(livestockEditForm.health_status) && <option value={livestockEditForm.health_status}>{livestockEditForm.health_status}</option>}
                    <option value="healthy">Healthy</option><option value="watch">Watch</option><option value="critical">Critical</option>
                  </select>
                </label>
                <label className="muted" style={{ display: "grid", gap: 4, fontSize: 12 }}>
                  Productivity
                  <input value={livestockEditForm.productivity_metric} onChange={(event) => setLivestockEditForm({ ...livestockEditForm, productivity_metric: event.target.value })} />
                </label>
                <label className="muted" style={{ display: "grid", gap: 4, fontSize: 12 }}>
                  Feeding schedule
                  <input value={livestockEditForm.feeding_schedule} onChange={(event) => setLivestockEditForm({ ...livestockEditForm, feeding_schedule: event.target.value })} />
                </label>
                <label className="muted" style={{ display: "grid", gap: 4, fontSize: 12 }}>
                  Last vaccination
                  <input type="date" value={livestockEditForm.last_vaccination} onChange={(event) => setLivestockEditForm({ ...livestockEditForm, last_vaccination: event.target.value })} />
                </label>
                {livestockEditError && <p className="auth-error" role="alert" style={{ margin: 0 }}>{livestockEditError}</p>}
                <div className="flex-row">
                  <button type="submit" disabled={savingLivestockEdit}>{savingLivestockEdit ? "Saving…" : "Save changes"}</button>
                  <button type="button" onClick={cancelLivestockEdit} disabled={savingLivestockEdit}>Cancel</button>
                </div>
              </form>
            ) : (
              <div className="grid grid-2" style={{ gap: 10 }}>
                <div>
                  <div className="muted" style={{ fontSize: 11 }}>Count</div>
                  <div style={{ fontWeight: 600, fontSize: 15 }}>{Number(l.count || 0).toLocaleString()}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11 }}>Productivity</div>
                  <div style={{ fontWeight: 600, fontSize: 13.5 }}>{l.productivity_metric || "—"}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11 }}>Feeding schedule</div>
                  <div style={{ fontSize: 13 }}>{l.feeding_schedule || "—"}</div>
                </div>
                <div>
                  <div className="muted" style={{ fontSize: 11 }}>Last vaccination</div>
                  <div style={{ fontSize: 13 }}>
                    {l.last_vaccination ? new Date(l.last_vaccination).toLocaleDateString() : "N/A"}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      />
    </>
  );
}
