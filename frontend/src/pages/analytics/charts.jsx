// Lightweight, dependency-free bar charts for the Analytics/Dashboard pages.
// No charting library is used anywhere else in this app, so these are built
// from plain HTML/CSS rather than adding a new dependency.
//
// Colors follow status semantics, not generic categorical hues: risk levels
// are states (good/warning/critical), not interchangeable series, so LOW /
// MEDIUM / HIGH map to the fixed brand status palette and are always paired
// with a text label (never color alone). Prediction volume is a single time
// series, so it uses the brand's primary accent hue rather than a
// categorical set.

const RISK_ORDER = ["LOW", "MEDIUM", "HIGH", "NONE"];

const RISK_META = {
  LOW: { label: "Low risk", color: "var(--dc-success)" },
  MEDIUM: { label: "Medium risk", color: "var(--dc-warning)" },
  HIGH: { label: "High risk", color: "var(--dc-danger)" },
  NONE: { label: "No prediction yet", color: "var(--dc-neutral)" },
};

const ACCENT = "var(--dc-accent)";

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
          <div key={level} className="dc-bar-row" title={`${meta.label}: ${count} drone${count === 1 ? "" : "s"}`}>
            <span className="dc-bar-label">{meta.label}</span>
            <div className="dc-bar-track">
              <div
                className="dc-bar-fill"
                style={{ width: `${widthPct}%`, minWidth: count > 0 ? 4 : 0, background: meta.color }}
              />
            </div>
            <span className="dc-bar-count">{count}</span>
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
          borderBottom: "1px solid var(--dc-border)",
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
                <span style={{ fontSize: "0.7rem", color: "var(--dc-text-muted)", marginBottom: 2 }}>{point.count}</span>
              )}
              <div
                style={{
                  width: "100%",
                  height: heightPx,
                  background: `linear-gradient(180deg, ${ACCENT}, var(--dc-accent-2))`,
                  borderRadius: "4px 4px 0 0",
                }}
              />
            </div>
          );
        })}
      </div>

      <details style={{ marginTop: "0.75rem" }}>
        <summary style={{ cursor: "pointer", color: "var(--dc-text-muted)", fontSize: "0.85rem" }}>View as table</summary>
        <div className="dc-table-wrap" style={{ marginTop: "0.5rem" }}>
          <table className="dc-table">
            <thead>
              <tr>
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
        </div>
      </details>
    </div>
  );
}

// A single ratio against a limit is a meter, not a bar chart (dataviz form
// heuristic) — the fill and unfilled track are two steps of the brand
// accent, since completion rate is a magnitude, not a severity state.
export function MaintenanceCompletionMeter({ stats }) {
  if (stats.total === 0) {
    return <p>No maintenance records yet.</p>;
  }

  const rate = stats.completion_rate ?? 0;

  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "0.5rem", marginBottom: "0.75rem" }}>
        <span style={{ fontSize: "2rem", fontWeight: 700, color: "var(--dc-text)" }}>{rate}%</span>
        <span className="dc-muted" style={{ fontSize: "0.9rem" }}>completed</span>
      </div>
      <div className="dc-progress-track" style={{ margin: "0 0 1rem", maxWidth: "none" }} title={`${stats.completed} of ${stats.total} maintenance records completed`}>
        <div className="dc-progress-fill" style={{ width: `${rate}%`, background: `linear-gradient(90deg, ${ACCENT}, var(--dc-accent-2))` }} />
      </div>

      <div className="dc-table-wrap">
        <table className="dc-table">
          <thead>
            <tr>
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
              <td style={{ color: "var(--dc-danger)" }}>Overdue</td>
              <td>{stats.overdue}</td>
            </tr>
            <tr>
              <td>Cancelled</td>
              <td>{stats.cancelled}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
