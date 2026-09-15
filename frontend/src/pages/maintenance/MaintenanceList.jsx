import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listDrones } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { listMaintenance } from "../../api/maintenance.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { IconWrench } from "../../components/icons.jsx";

const PAGE_SIZE = 20;

// Global "Maintenance" list (optionally narrowed to one drone via
// ?droneId=), sorted by scheduled date. Also serves as the schedule view —
// System Specification §16 doesn't define a separate calendar UI, so this
// sortable/filterable list is the schedule view for this phase.
export default function MaintenanceList() {
  const [searchParams, setSearchParams] = useSearchParams();
  const droneId = searchParams.get("droneId") || "";
  const [offset, setOffset] = useState(0);

  const [drones, setDrones] = useState([]);
  const [records, setRecords] = useState([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    listDrones().then(setDrones).catch(() => setDrones([]));
  }, []);

  const fetchMaintenance = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return listMaintenance({ droneId: droneId || undefined, limit: PAGE_SIZE, offset })
      .then((data) => {
        setRecords(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load maintenance records.")))
      .finally(() => setIsLoading(false));
  }, [droneId, offset]);

  useEffect(() => {
    fetchMaintenance();
  }, [fetchMaintenance]);

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
          <span className="dc-eyebrow">Service & Care</span>
          <h1>Maintenance</h1>
          <p>Service history and scheduled maintenance for your fleet.</p>
        </div>
        <div className="dc-actions">
          <Link to={droneId ? `/maintenance/new?droneId=${droneId}` : "/maintenance/new"} className="dc-btn dc-btn-primary">
            + Add record
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

      {!isLoading && !error && records.length === 0 && (
        <div className="dc-card dc-state">
          <div className="dc-state-icon">
            <IconWrench />
          </div>
          <h2 style={{ fontSize: "1.1rem" }}>No maintenance records yet</h2>
          <p>Add your first record to get started.</p>
        </div>
      )}

      {!isLoading && !error && records.length > 0 && (
        <>
          <div className="dc-table-wrap">
            <table className="dc-table">
              <thead>
                <tr>
                  <th>Scheduled date</th>
                  <th>Drone</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id}>
                    <td>
                      <Link to={`/maintenance/${record.id}`}>{record.scheduled_date || "—"}</Link>
                    </td>
                    <td className="dc-muted">{droneName(record.drone_id)}</td>
                    <td className="dc-muted">{record.maintenance_type}</td>
                    <td>
                      <StatusBadge status={record.status} kind="maintenance" />
                    </td>
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
