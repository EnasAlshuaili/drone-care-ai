import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listDrones } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { listPredictions } from "../../api/predictions.js";
import { riskColor } from "./riskLevel.js";

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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Predictions</h1>
        <Link to={droneId ? `/predictions/new?droneId=${droneId}` : "/predictions/new"}>
          <button>New prediction</button>
        </Link>
      </div>

      <div style={{ margin: "1rem 0" }}>
        <label htmlFor="droneFilter">Drone: </label>
        <select id="droneFilter" value={droneId} onChange={handleDroneFilterChange}>
          <option value="">All my drones</option>
          {drones.map((drone) => (
            <option key={drone.id} value={drone.id}>
              {drone.name}
            </option>
          ))}
        </select>
      </div>

      {isLoading && <p>Loading predictions…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!isLoading && !error && predictions.length === 0 && (
        <p>No predictions yet. Run your first prediction to get started.</p>
      )}

      {!isLoading && !error && predictions.length > 0 && (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th>Date/time</th>
                <th>Drone</th>
                <th>Risk level</th>
                <th>Failure probability</th>
              </tr>
            </thead>
            <tbody>
              {predictions.map((prediction) => (
                <tr key={prediction.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>
                    <Link to={`/predictions/${prediction.id}`}>
                      {new Date(prediction.created_at).toLocaleString()}
                    </Link>
                  </td>
                  <td>{droneName(prediction.drone_id)}</td>
                  <td style={{ color: riskColor(prediction.risk_level), fontWeight: "bold" }}>
                    {prediction.risk_level}
                  </td>
                  <td>{(prediction.failure_probability * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
            <button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}>
              Previous
            </button>
            <span>
              {offset + 1}–{Math.min(offset + PAGE_SIZE, total)} of {total}
            </span>
            <button disabled={offset + PAGE_SIZE >= total} onClick={() => setOffset(offset + PAGE_SIZE)}>
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
