'use client';

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileAlt, faDownload } from "@fortawesome/free-solid-svg-icons";
import { endpoints } from "../../api/client";
import { useFetch } from "../../api/useFetch";
import PageHeader from "../../components/PageHeader";
import ExpandableList from "../../components/ExpandableList";

const ACTIVITY_LABELS = {
  crop_plantings: "Crop plantings",
  soil_readings: "Soil readings",
  weather_logs: "Weather logs",
  irrigation_events: "Irrigation events",
  pest_alerts: "Pest alerts",
  livestock_health_alerts: "Livestock health alerts",
  farm_alerts: "Farm alerts",
  livestock_snapshot: "Livestock snapshot",
  analytics_snapshots: "Analytics snapshots",
};

const MEASUREMENT_LABELS = {
  rainfall_mm: "Rainfall",
  irrigation_water_liters: "Irrigation water",
  irrigation_minutes: "Irrigation duration",
  average_soil_moisture_pct: "Average soil moisture",
  average_soil_ph: "Average soil pH",
};

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatActivity(type, item) {
  switch (type) {
    case "crop_plantings":
      return `${item.name}${item.variety ? ` (${item.variety})` : ""} · ${item.planted_at ? new Date(item.planted_at).toLocaleDateString() : "Date not recorded"}`;
    case "soil_readings":
      return `${item.moisture_pct}% moisture · pH ${item.ph_level} · ${item.degradation_risk} risk`;
    case "weather_logs":
      return `${item.temperature_c}°C · ${item.humidity_pct}% humidity · ${item.rainfall_mm} mm rain`;
    case "irrigation_events":
      return `${item.zone} · ${item.duration_minutes} min · ${item.water_liters ?? "No"} L · ${item.status}`;
    case "pest_alerts":
      return `${item.pest_or_disease} on ${item.crop_name} · ${item.risk_level} risk · ${item.resolved ? "Resolved" : "Open"}`;
    case "livestock_health_alerts":
      return `${item.disease_name} — ${item.livestock_name} · ${item.severity} · ${item.resolved ? "Resolved" : "Open"}`;
    case "farm_alerts":
      return `${item.message} · ${item.severity} · ${item.acknowledged ? "Acknowledged" : "Unacknowledged"}`;
    case "livestock_snapshot":
      return `${item.count} × ${item.species} · ${item.health_status}${item.productivity_metric ? ` · ${item.productivity_metric}` : ""}`;
    default:
      return JSON.stringify(item);
  }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

function exportReportPDF(report) {
  const printWindow = window.open("", "_blank", "width=900,height=700");
  if (!printWindow) {
    throw new Error("Allow pop-ups for this site to export the report as a PDF.");
  }

  const activityData = report.activity_data || {};
  const activityCounts = activityData.activity_counts || {};
  const measurements = activityData.measurements || {};
  const activities = activityData.activities || {};
  const reportMonth = report.month?.slice(0, 7) || "Unknown month";
  const monthLabel = report.month
    ? new Date(`${reportMonth}-01T12:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })
    : reportMonth;
  const countRows = Object.entries(ACTIVITY_LABELS).map(([key, label]) => {
    const count = activityCounts[key] ?? (key === "livestock_snapshot" ? activities.livestock_snapshot?.length ?? 0 : 0);
    return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(count)}</td></tr>`;
  }).join("");
  const measurementRows = Object.entries(MEASUREMENT_LABELS).map(([key, label]) => {
    const suffix = key === "rainfall_mm" ? " mm" : key === "irrigation_water_liters" ? " L" : key === "irrigation_minutes" ? " min" : key === "average_soil_moisture_pct" ? "%" : "";
    const value = measurements[key] == null ? "No data" : `${measurements[key]}${suffix}`;
    return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value)}</td></tr>`;
  }).join("");
  const activitySections = Object.entries(activities)
    .filter(([, records]) => Array.isArray(records) && records.length > 0)
    .map(([key, records]) => `
      <section>
        <h2>${escapeHtml(ACTIVITY_LABELS[key] || key.replaceAll("_", " "))}</h2>
        <ul>${records.map((item) => `<li>${escapeHtml(formatActivity(key, item))}</li>`).join("")}</ul>
      </section>
    `).join("");
  const feedback = (activityData.feedback_signals || []).length
    ? `<section><h2>Follow-up signals</h2><ul>${activityData.feedback_signals.map((signal) => `<li>${escapeHtml(signal)}</li>`).join("")}</ul></section>`
    : "";
  const generatedAt = report.generated_at ? new Date(report.generated_at).toLocaleString() : "Unknown";
  const safeFarmName = escapeHtml(report.farm_name || "Farm");
  const safeMonthLabel = escapeHtml(monthLabel);
  const html = `<!doctype html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <title>${safeFarmName} activity report - ${safeMonthLabel}</title>
        <style>
          body { font: 14px Arial, sans-serif; color: #182018; margin: 36px; }
          h1 { color: #123c26; margin-bottom: 4px; }
          h2 { color: #123c26; font-size: 16px; margin: 22px 0 8px; }
          .muted { color: #586258; font-size: 12px; }
          table { border-collapse: collapse; width: 100%; margin-top: 8px; }
          th, td { border-bottom: 1px solid #e2e8dc; padding: 7px 9px; text-align: left; }
          th { font-weight: 600; width: 65%; }
          ul { margin: 6px 0 0; padding-left: 22px; }
          li { margin: 0 0 6px; line-height: 1.4; }
          section { break-inside: avoid; }
          @page { size: A4; margin: 16mm; }
        </style>
      </head>
      <body>
        <h1>Farm Activity Report</h1>
        <div><strong>${safeFarmName}</strong> · ${safeMonthLabel}</div>
        <p class="muted">Generated ${escapeHtml(generatedAt)}</p>
        <section><h2>Activity counts</h2><table>${countRows}</table></section>
        <section><h2>Measurements</h2><table>${measurementRows}</table></section>
        ${feedback}
        ${activitySections || '<p class="muted">No detailed activity was recorded for this period.</p>'}
      </body>
    </html>`;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.setTimeout(() => printWindow.print(), 250);
}

export default function Reports() {
  const [month, setMonth] = useState(currentMonth);
  const { data, loading, error, reload } = useFetch(() => endpoints.reports(undefined, month), [month]);
  const [generating, setGenerating] = useState(false);
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const reports = Array.isArray(data) ? data : [];

  const generateReports = async (event) => {
    event.preventDefault();
    setGenerating(true);
    setActionError("");
    setNotice("");
    try {
      const generated = await endpoints.generateReports(month);
      setNotice(generated.length
        ? `Generated or refreshed activity reports for ${generated.length} farm${generated.length === 1 ? "" : "s"}.`
        : "No farms are associated with your account yet.");
      reload();
    } catch (requestError) {
      setActionError(requestError.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Reports"
        title="Farm activity reports"
        subtitle="Monthly operations snapshots for every farm you own, including activities, measurements, and follow-up signals."
      />

      <div className="card section-gap">
        <div className="card-title">Generate monthly activity reports</div>
        <form onSubmit={generateReports} className="flex-row" style={{ flexWrap: "wrap", marginTop: 12 }}>
          <label className="muted" htmlFor="report-month">Reporting month</label>
          <input
            id="report-month"
            required
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value)}
          />
          <button type="submit" disabled={generating || !month}>
            {generating ? "Generating…" : "Generate reports for my farms"}
          </button>
        </form>
        {actionError && <p className="auth-error" role="alert" style={{ marginTop: 10 }}>{actionError}</p>}
        {notice && <p className="muted" role="status" style={{ marginTop: 10 }}>{notice}</p>}
      </div>

      {loading && <div className="loading-text">Loading your reports…</div>}
      {error && <p className="auth-error" role="alert">{error.message}</p>}

      {!loading && !error && reports.length === 0 && (
        <div className="card section-gap">
          <p className="muted">No activity reports yet. Choose a month above to generate reports for all farms you own.</p>
        </div>
      )}

      <ExpandableList
        items={reports}
        style={{ display: "flex", flexDirection: "column", gap: 12 }}
        renderItem={(report) => {
          const activityData = report.activity_data || {};
          const activityCounts = activityData.activity_counts || {};
          const measurements = activityData.measurements || {};
          const activities = activityData.activities || {};
          const populatedActivities = Object.entries(activities)
            .filter(([, records]) => Array.isArray(records) && records.length > 0);
          const reportMonth = report.month?.slice(0, 7) || "Unknown month";
          const monthLabel = report.month
            ? new Date(`${reportMonth}-01T12:00:00`).toLocaleDateString(undefined, { month: "long", year: "numeric" })
            : reportMonth;

          return (
            <div key={report.id} className="card" style={{ padding: "16px 20px" }}>
              <div className="flex-row" style={{ justifyContent: "space-between", flexWrap: "wrap", marginBottom: 14 }}>
                <div className="flex-row">
                  <span className="icon-tile"><FontAwesomeIcon icon={faFileAlt} style={{ width: 16, height: 16 }} /></span>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14.5 }}>{report.farm_name} · {monthLabel}</div>
                    <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>
                      Generated {new Date(report.generated_at).toLocaleString()}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      exportReportPDF(report);
                      setActionError("");
                    } catch (exportError) {
                      setActionError(exportError.message);
                    }
                  }}
                  style={{ display: "flex", alignItems: "center", gap: 5 }}
                >
                  <FontAwesomeIcon icon={faDownload} style={{ width: 13, height: 13 }} /> Export PDF
                </button>
              </div>

              <div className="card-title" style={{ fontSize: 13 }}>Activity counts</div>
              <div className="grid grid-2" style={{ gap: 10, marginTop: 8 }}>
                {Object.entries(ACTIVITY_LABELS).map(([key, label]) => (
                  <div key={key}>
                    <div className="muted" style={{ fontSize: 11 }}>{label}</div>
                    <div style={{ fontWeight: 600 }}>{activityCounts[key] ?? (key === "livestock_snapshot" ? activities.livestock_snapshot?.length ?? 0 : 0)}</div>
                  </div>
                ))}
              </div>

              <div className="card-title" style={{ fontSize: 13, marginTop: 16 }}>Measurements</div>
              <div className="grid grid-2" style={{ gap: 10, marginTop: 8 }}>
                {Object.entries(MEASUREMENT_LABELS).map(([key, label]) => {
                  const value = measurements[key];
                  const suffix = key === "rainfall_mm" ? " mm" : key === "irrigation_water_liters" ? " L" : key === "irrigation_minutes" ? " min" : key === "average_soil_moisture_pct" ? "%" : "";
                  return (
                    <div key={key}>
                      <div className="muted" style={{ fontSize: 11 }}>{label}</div>
                      <div style={{ fontWeight: 600 }}>{value == null ? "No data" : `${value}${suffix}`}</div>
                    </div>
                  );
                })}
              </div>

              {activityData.feedback_signals?.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div className="card-title" style={{ fontSize: 13 }}>Follow-up signals</div>
                  <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                    {activityData.feedback_signals.map((signal) => <li key={signal} style={{ fontSize: 13, marginBottom: 4 }}>{signal}</li>)}
                  </ul>
                </div>
              )}

              {populatedActivities.length > 0 && (
                <div style={{ display: "grid", gap: 8, marginTop: 16 }}>
                  {populatedActivities.map(([key, records]) => (
                    <details key={key}>
                      <summary style={{ cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                        {ACTIVITY_LABELS[key] || key.replaceAll("_", " ")} ({records.length})
                      </summary>
                      <ul style={{ margin: "8px 0 0", paddingLeft: 20 }}>
                        {records.map((record, index) => <li key={record.id || index} style={{ fontSize: 12, marginBottom: 5 }}>{formatActivity(key, record)}</li>)}
                      </ul>
                    </details>
                  ))}
                </div>
              )}
            </div>
          );
        }}
      />
    </>
  );
}
