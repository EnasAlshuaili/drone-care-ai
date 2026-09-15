import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listDrones } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { listPredictions } from "../../api/predictions.js";
import { IconPulse } from "../../components/icons.jsx";
import { riskBadgeClass } from "./riskLevel.js";

const PAGE_SIZE = 20;

// Global "Predictions" list (optionally narrowed to one drone via
// ?droneId=, e.g. when reached from Drone Details), per FR-PRED-05.
export default function PredictionList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const droneId = searchParams.get("droneId") || "";
  const [offset, setOffset] = useState(0);

  const [drones, setDrones] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listDrones().then(setDrones).catch(() => setDrones([]));
  }, []);

  const fetchPredictions = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return listPredictions({ droneId: droneId || undefined, limit: PAGE_SIZE, offset })
      .then((data) => {
        setPredictions(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load predictions.")))
      .finally(() => setIsLoading(false));
  }, [droneId, offset]);

  useEffect(() => {
    fetchPredictions();
  }, [fetchPredictions]);

  function handleDroneFilterChange(event) {
    const value = event.target.value;
    setOffset(0);
    setSearchParams(value ? { droneId: value } : {});
  }

  const droneName = (id) => drones.find((d) => d.id === id)?.name || id;

  return (
    <div className="dc-page">
      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">AI Monitoring</span>
          <h1>Predictions</h1>
          <p>AI failure-risk assessments across your fleet.</p>
        </div>
        <div className="dc-actions">
          <Link to={droneId ? `/predictions/new?droneId=${droneId}` : "/predictions/new"} className="dc-btn dc-btn-primary">
            + New prediction
          </Link>
        </div>
      </div>

      <div className="dc-card" style={{ marginBottom: "1.5rem", padding: "1rem" }}>
        <label className="dc-label" htmlFor="droneFilter" style={{ marginRight: "0.75rem" }}>
          Drone
        </label>
        <select id="droneFilter" className="dc-select" style={{ width: 240, display: "inline-block" }} value={droneId} onChange={handleDroneFilterChange}>
          <option value="">All my drones</option>
          {drones.map((drone) => (
            <option key={drone.id} value={drone.id}>
              {drone.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <div className="dc-skeleton" style={{ height: 220 }} />}
      {error && <p className="dc-error-text">{error}</p>}

      {!isLoading && !error && predictions.length === 0 && (
        <div className="dc-card dc-state">
          <div className="dc-state-icon">
            <IconPulse />
          </div>
          <h2 style={{ fontSize: "1.1rem" }}>No predictions yet</h2>
          <p>Run your first prediction to get started.</p>
          <Link to="/predictions/new" className="dc-btn dc-btn-primary" style={{ marginTop: "0.5rem" }}>
            New prediction
          </Link>
        </div>
      )}

      {!isLoading && !error && predictions.length > 0 && (
        <>
          <div className="dc-table-wrap">
            <table className="dc-table">
              <thead>
                <tr>
                  <th>Date/time</th>
                  <th>Drone</th>
                  <th>Risk level</th>
                  <th>Failure probability</th>
                </tr>
              </thead>
              <tbody>
                {predictions.map((prediction) => (
                  <tr key={prediction.id}>
                    <td>
                      <Link to={`/predictions/${prediction.id}`}>{new Date(prediction.created_at).toLocaleString()}</Link>
                    </td>
                    <td className="dc-muted">{droneName(prediction.drone_id)}</td>
                    <td>
                      <span className={`dc-badge ${riskBadgeClass(prediction.risk_level)}`}>{prediction.risk_level}</span>
                    </td>
                    <td className="dc-muted">{(prediction.failure_probability * 100).toFixed(1)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button className="dc-btn dc-btn-secondary dc-btn-sm" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </button>
            <span className="dc-muted" style={{ fontSize: "0.85rem" }}>
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <button className="dc-btn dc-btn-secondary dc-btn-sm" disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
