// Lightweight, dependency-free bar charts for the Analytics/Dashboard pages.
// No charting library is used anywhere else in this app, so these are built
// from plain HTML/CSS rather than adding a new dependency.
//
// Colors follow status semantics, not generic categorical hues: risk levels
// are states (good/warning/critical), not interchangeable series, so LOW /
// MEDIUM / HIGH map to the fixed status palette and are always paired with a
// text label (never color alone). Prediction volume is a single time series,
// so it uses the sequential default hue (blue) rather than a categorical set.

const RISK_ORDER = ["LOW", "MEDIUM", "HIGH", "NONE"];

const RISK_META = {
  LOW: { label: "Low risk", color: "#0ca30c" },
  MEDIUM: { label: "Medium risk", color: "#fab219" },
  HIGH: { label: "High risk", color: "#d03b3b" },
  NONE: { label: "No prediction yet", color: "#898781" },
};

const SEQUENTIAL_BLUE = "#2a78d6";

export function RiskDistributionChart({ items }) {
  const byLevel = Object.fromEntries(items.map((item) => [item.risk_level, item.drone_count]));
  const counts = RISK_ORDER.map((level) => byLevel[level] || 0);
  const max = Math.max(1, ...counts);

  return (
    <div>
      {RISK_ORDER.map((level) => {
        const count = byLevel[level] || 0;
        const meta = RISK_META[level];
        const widthPct = (count / max) * 100;
        return (
          <div
            key={level}
            title={`${meta.label}: ${count} drone${count === 1 ? "" : "s"}`}
            style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.6rem" }}
          >
            <span style={{ width: 130, flexShrink: 0, fontSize: "0.9rem", color: "#52514e" }}>
              {meta.label}
            </span>
            <div style={{ flex: 1, background: "#f0efec", borderRadius: 4, height: 20 }}>
              <div
                style={{
                  width: `${widthPct}%`,
                  minWidth: count > 0 ? 4 : 0,
                  height: 20,
                  background: meta.color,
                  borderRadius: 4,
                }}
              />
            </div>
            <span style={{ width: 28, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
              {count}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export function PredictionVolumeChart({ items }) {
  if (items.length === 0) {
    return <p>No predictions in this period.</p>;
  }

  const maxCount = Math.max(0, ...items.map((point) => point.count));

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          gap: "2px",
          height: 140,
          borderBottom: "1px solid #c3c2b7",
          padding: "0 4px",
        }}
      >
        {items.map((point) => {
          const heightPx =
            maxCount > 0 ? Math.max(Math.round((point.count / maxCount) * 110), point.count > 0 ? 3 : 0) : 0;
          const isPeak = maxCount > 0 && point.count === maxCount;
          return (
            <div
              key={point.date}
              title={`${point.date}: ${point.count} prediction${point.count === 1 ? "" : "s"}`}
              style={{
                flex: "1 1 0",
                maxWidth: 24,
                minWidth: 3,
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              {isPeak && (
                <span style={{ fontSize: "0.7rem", color: "#52514e", marginBottom: 2 }}>{point.count}</span>
              )}
              <div
                style={{
                  width: "100%",
                  height: heightPx,
                  background: SEQUENTIAL_BLUE,
                  borderRadius: "4px 4px 0 0",
                }}
              />
            </div>
          );
        })}
      </div>

      <details style={{ marginTop: "0.75rem" }}>
        <summary>View as table</summary>
        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "0.5rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
              <th>Date</th>
              <th>Predictions</th>
            </tr>
          </thead>
          <tbody>
            {items.map((point) => (
              <tr key={point.date}>
                <td>{point.date}</td>
                <td>{point.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  );
}

// A single ratio against a limit is a meter, not a bar chart (dataviz form
// heuristic) — the fill and unfilled track are two steps of the same blue
// ramp ("blue-on-blue"), since completion rate is a magnitude, not a
// severity state.
export function MaintenanceCompletionMeter({ stats }) {
  if (stats.total === 0) {
    return <p>No maintenance records yet.</p>;
  }

  const rate = stats.completion_rate ?? 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.5rem" }}>
        <span style={{ fontSize: "2rem", fontWeight: 600 }}>{rate}%</span>
        <span style={{ color: "#52514e", fontSize: "0.9rem" }}>completed</span>
      </div>
      <div
        title={`${stats.completed} of ${stats.total} maintenance records completed`}
        style={{ background: "#cde2fb", borderRadius: 4, height: 20, marginBottom: "0.75rem" }}
      >
        <div style={{ width: `${rate}%`, height: 20, background: "#2a78d6", borderRadius: 4 }} />
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
            <th>Status</th>
            <th>Count</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Scheduled</td>
            <td>{stats.scheduled}</td>
          </tr>
          <tr>
            <td>In Progress</td>
            <td>{stats.in_progress}</td>
          </tr>
          <tr>
            <td>Completed</td>
            <td>{stats.completed}</td>
          </tr>
          <tr>
            <td style={{ color: "#d03b3b" }}>Overdue</td>
            <td>{stats.overdue}</td>
          </tr>
          <tr>
            <td>Cancelled</td>
            <td>{stats.cancelled}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
