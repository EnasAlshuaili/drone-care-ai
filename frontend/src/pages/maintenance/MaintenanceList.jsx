import { useCallback, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { listDrones } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { listMaintenance } from "../../api/maintenance.js";

const PAGE_SIZE = 20;

const STATUS_COLORS = {
  Scheduled: "inherit",
  "In Progress": "#eda100",
  Completed: "#0ca30c",
  Overdue: "#d03b3b",
  Cancelled: "#898781",
};

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
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Maintenance</h1>
        <Link to={droneId ? `/maintenance/new?droneId=${droneId}` : "/maintenance/new"}>
          <button>Add maintenance record</button>
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

      {isLoading && <p>Loading maintenance records…</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!isLoading && !error && records.length === 0 && (
        <p>No maintenance records yet. Add your first record to get started.</p>
      )}

      {!isLoading && !error && records.length > 0 && (
        <>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", borderBottom: "1px solid #ddd" }}>
                <th>Scheduled date</th>
                <th>Drone</th>
                <th>Type</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => (
                <tr key={record.id} style={{ borderBottom: "1px solid #eee" }}>
                  <td>
                    <Link to={`/maintenance/${record.id}`}>{record.scheduled_date || "—"}</Link>
                  </td>
                  <td>{droneName(record.drone_id)}</td>
                  <td>{record.maintenance_type}</td>
                  <td style={{ color: STATUS_COLORS[record.status] || "inherit", fontWeight: "bold" }}>
                    {record.status}
                  </td>
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
