import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default function StatCard({ icon: Icon, label, value, meta }) {
  let iconEl = null;
  if (Icon) {
    if (typeof Icon === "object") {
      iconEl = <FontAwesomeIcon icon={Icon} style={{ fontSize: 14 }} />;
    } else if (typeof Icon === "function") {
      iconEl = <Icon size={14} strokeWidth={2.2} />;
    }
  }

  return (
    <div className="stat-card">
      <div className="stat-label">
        {iconEl}
        {label}
      </div>
      <div className="stat-value">{value}</div>
      {meta && <div className="stat-meta">{meta}</div>}
    </div>
  );
}
