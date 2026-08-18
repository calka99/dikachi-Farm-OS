export default function Badge({ tone = "info", children }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}