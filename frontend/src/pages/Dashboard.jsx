import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getDashboardSummary } from "../api/analytics.js";
import { getErrorMessage } from "../api/errors.js";
import { listNotifications } from "../api/notifications.js";
import { IconAlertTriangle, IconBell, IconChart, IconClock, IconDrone, IconShieldCheck } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { notificationIconFor } from "./notifications/notificationMeta.js";
import { riskBadgeClass } from "./predictions/riskLevel.js";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

// FR-DASH-01: fleet overview using live data, refreshed on load. "Recent
// alerts" (also in FR-DASH-01's acceptance criteria) is intentionally
// still omitted as its own KPI — it belongs to the Notification Center's
// own surface — but a lightweight real-data preview is shown below,
// reusing the existing GET /notifications endpoint (Phase 9).
export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [recentNotifications, setRecentNotifications] = useState([]);

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

  useEffect(() => {
    listNotifications({ limit: 5 })
      .then((data) => setRecentNotifications(data.items))
      .catch(() => setRecentNotifications([]));
  }, []);

  return (
    <div className="dc-page">
      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">Fleet Overview</span>
          <h1>
            {greeting()}
            {user?.full_name ? `, ${user.full_name.split(" ")[0]}` : ""}
          </h1>
          <p>Monitor your fleet and predict failures with AI.</p>
        </div>
      </div>

      {isLoading && (
        <div className="dc-grid dc-grid-cards" style={{ marginBottom: "1.5rem" }}>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="dc-skeleton" style={{ height: 96 }} />
          ))}
        </div>
      )}

      {error && <p className="dc-error-text">{error}</p>}

      {!isLoading && !error && summary && summary.total_drones === 0 && (
        <div className="dc-card dc-state">
          <div className="dc-state-icon">
            <IconDrone />
          </div>
          <h2 style={{ fontSize: "1.1rem" }}>No drones yet</h2>
          <p>Add your first drone to start monitoring and predicting failures.</p>
          <Link to="/drones/new" className="dc-btn dc-btn-primary" style={{ marginTop: "0.5rem" }}>
            Add your first drone
          </Link>
        </div>
      )}

      {!isLoading && !error && summary && summary.total_drones > 0 && (
        <>
          <div className="dc-grid dc-grid-cards" style={{ marginBottom: "1.5rem" }}>
            <StatCard icon={IconDrone} label="Total drones" value={summary.total_drones} to="/drones" />
            <StatCard icon={IconShieldCheck} label="Active drones" value={summary.active_drones} to="/drones" tone="success" />
            <StatCard
              icon={IconAlertTriangle}
              label="Requiring attention"
              value={summary.drones_requiring_attention}
              to="/drones"
              tone={summary.drones_requiring_attention > 0 ? "warning" : undefined}
            />
            <StatCard
              icon={IconAlertTriangle}
              label="High risk"
              value={summary.high_risk_drones}
              to="/predictions"
              tone={summary.high_risk_drones > 0 ? "danger" : undefined}
            />
            <StatCard
              icon={IconClock}
              label="Upcoming maintenance"
              value={summary.upcoming_maintenance_count}
              to="/maintenance"
            />
          </div>

          <div className="dc-two-col">
            <div className="dc-card">
              <div className="dc-card-header">
                <h2>Recent predictions</h2>
                <Link to="/predictions" className="dc-btn dc-btn-ghost dc-btn-sm">
                  View all
                </Link>
              </div>

              {summary.recent_predictions.length === 0 && (
                <div className="dc-state">
                  <div className="dc-state-icon">
                    <IconChart />
                  </div>
                  <p>
                    No predictions yet. <Link to="/predictions/new">Run your first prediction</Link>.
                  </p>
                </div>
              )}

              {summary.recent_predictions.length > 0 && (
                <div className="dc-table-wrap">
                  <table className="dc-table">
                    <thead>
                      <tr>
                        <th>Date/time</th>
                        <th>Risk</th>
                        <th>Probability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.recent_predictions.map((prediction) => (
                        <tr key={prediction.id}>
                          <td>
                            <Link to={`/predictions/${prediction.id}`}>
                              {new Date(prediction.created_at).toLocaleString()}
                            </Link>
                          </td>
                          <td>
                            <span className={`dc-badge ${riskBadgeClass(prediction.risk_level)}`}>
                              {prediction.risk_level}
                            </span>
                          </td>
                          <td>{(prediction.failure_probability * 100).toFixed(1)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="dc-card">
              <div className="dc-card-header">
                <h2>Recent notifications</h2>
                <Link to="/notifications" className="dc-btn dc-btn-ghost dc-btn-sm">
                  View all
                </Link>
              </div>

              {recentNotifications.length === 0 && (
                <div className="dc-state">
                  <div className="dc-state-icon">
                    <IconBell />
                  </div>
                  <p>No notifications yet.</p>
                </div>
              )}

              {recentNotifications.map((notification) => {
                const meta = notificationIconFor(notification.type);
                return (
                  <div key={notification.id} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid var(--dc-border)" }}>
                    <span className="dc-notif-icon" style={{ background: meta.soft, color: meta.color }}>
                      <meta.Icon />
                    </span>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--dc-text)" }}>{notification.title}</div>
                      <div style={{ fontSize: "0.78rem", color: "var(--dc-text-faint)" }}>
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, to, tone }) {
  return (
    <Link to={to} className="dc-stat" style={{ textDecoration: "none" }}>
      <div className="dc-stat-label">
        <span className="dc-stat-icon">
          <Icon />
        </span>
        {label}
      </div>
      <div className={`dc-stat-value${tone ? ` is-${tone}` : ""}`}>{value}</div>
    </Link>
  );
}
