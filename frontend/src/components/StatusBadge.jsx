// Generic status badge — maps a backend status string to a badge color.
// Purely presentational: the status values themselves always come from the
// API, never invented here.
const DRONE_STATUS_CLASS = {
  active: "dc-badge-success",
  maintenance: "dc-badge-warning",
  inactive: "dc-badge-neutral",
  retired: "dc-badge-neutral",
};

const MAINTENANCE_STATUS_CLASS = {
  Scheduled: "dc-badge-accent",
  "In Progress": "dc-badge-warning",
  Completed: "dc-badge-success",
  Overdue: "dc-badge-danger",
  Cancelled: "dc-badge-neutral",
};

const FLIGHT_STATUS_CLASS = {
  completed: "dc-badge-success",
  aborted: "dc-badge-warning",
  incident: "dc-badge-danger",
};

export function StatusBadge({ status, kind = "drone" }) {
  const map = kind === "maintenance" ? MAINTENANCE_STATUS_CLASS : kind === "flight" ? FLIGHT_STATUS_CLASS : DRONE_STATUS_CLASS;
  const cls = map[status] || "dc-badge-neutral";
  return <span className={`dc-badge ${cls}`}>{status}</span>;
}
