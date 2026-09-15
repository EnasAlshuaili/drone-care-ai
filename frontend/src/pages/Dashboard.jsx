import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../api/analytics.js";
import { getErrorMessage } from "../api/errors.js";
import { useAuth } from "../context/AuthContext.jsx";
import { riskColor } from "./predictions/riskLevel.js";

const TILE_STYLE = {
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: "1rem",
  minWidth: 140,
  flex: "1 1 140px",
};

// FR-DASH-01: fleet overview using live data, refreshed on load. "Recent
// alerts" (also in FR-DASH-01's acceptance criteria) is intentionally
// still omitted — it belongs to the Notification Center's own surface, not
// a Dashboard field, and Phase 10's scope only covers closing the
// maintenance-related gap ("upcoming maintenance count", added below); see
// backend/app/schemas/analytics.py.
export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    getDashboardSummary()
      .then((data) => !cancelled && setSummary(data))
      .catch((err) => !cancelled && setError(getErrorMessage(err, "Could not load dashboard.")))
      .finally(() => !cancelled && setIsLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1>DroneCare</h1>
      <p>Signed in as {user?.email}.</p>

      {isLoading && <p>Loading dashboard…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!isLoading && !error && summary && summary.total_drones === 0 && (
        <p>
          No drones yet. <Link to="/drones/new">Add your first drone</Link> to get started.
        </p>
      )}

      {!isLoading && !error && summary && summary.total_drones > 0 && (
        <>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", margin: "1rem 0" }}>
            <div style={TILE_STYLE}>
              <div style={{ color: "#52514e", fontSize: "0.85rem" }}>Total drones</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 600 }}>{summary.total_drones}</div>
            </div>
            <div style={TILE_STYLE}>
              <div style={{ color: "#52514e", fontSize: "0.85rem" }}>Active drones</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 600 }}>{summary.active_drones}</div>
            </div>
            <div style={TILE_STYLE}>
              <div style={{ color: "#52514e", fontSize: "0.85rem" }}>Requiring attention</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 600 }}>{summary.drones_requiring_attention}</div>
            </div>
            <div style={TILE_STYLE}>
              <div style={{ color: "#52514e", fontSize: "0.85rem" }}>High risk</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 600, color: summary.high_risk_drones > 0 ? "#d03b3b" : "inherit" }}>
                {summary.high_risk_drones}
              </div>
            </div>
            <div style={TILE_STYLE}>
              <div style={{ color: "#52514e", fontSize: "0.85rem" }}>Upcoming maintenance</div>
              <div style={{ fontSize: "1.75rem", fontWeight: 600 }}>{summary.upcoming_maintenance_count}</div>
            </div>
          </div>

          <p>
            <Link to="/drones">My Drones</Link> · <Link to="/maintenance">Maintenance</Link> ·{" "}
            <Link to="/analytics">Analytics</Link>
          </p>

          <h2>Recent predictions</h2>
          {summary.recent_predictions.length === 0 && (
            <p>
              No predictions yet. <Link to="/predictions/new">Run your first prediction</Link>.
            </p>
          )}
          {summary.recent_predictions.length > 0 && (
            <table style={{ width: "100%", borderCollapse: "collapse", maxWidth: 640 }}>
              <thead>
                <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                  <th>Date/time</th>
                  <th>Risk level</th>
                  <th>Failure probability</th>
                </tr>
              </thead>
              <tbody>
                {summary.recent_predictions.map((prediction) => (
                  <tr key={prediction.id} style={{ borderBottom: "1px solid #eee" }}>
                    <td>
                      <Link to={`/predictions/${prediction.id}`}>
                        {new Date(prediction.created_at).toLocaleString()}
                      </Link>
                    </td>
                    <td style={{ color: riskColor(prediction.risk_level), fontWeight: "bold" }}>
                      {prediction.risk_level}
                    </td>
                    <td>{(prediction.failure_probability * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p>
            <Link to="/predictions">View all predictions</Link>
          </p>
        </>
      )}
    </div>
  );
}
