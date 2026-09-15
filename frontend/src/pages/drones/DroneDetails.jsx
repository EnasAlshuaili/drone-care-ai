import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deactivateDrone, getDrone } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";

// Shows the drone entity's own fields plus a lightweight link into its
// flight history (Phase 4). Predictions, maintenance history, and alerts are
// added to this page in later phases once those modules exist (see System
// Specification §7, FR-DRONE-05).
export default function DroneDetails() {
  const { droneId } = useParams();
  const navigate = useNavigate();
  const [drone, setDrone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDeactivating, setIsDeactivating] = useState(false);

  const fetchDrone = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return getDrone(droneId)
      .then(setDrone)
      .catch((err) => setError(getErrorMessage(err, "Could not load drone.")))
      .finally(() => setIsLoading(false));
  }, [droneId]);

  useEffect(() => {
    fetchDrone();
  }, [fetchDrone]);

  async function handleDeactivate() {
    if (!window.confirm(`Deactivate "${drone.name}"? It will be hidden from active use but its history is kept.`)) {
      return;
    }
    setIsDeactivating(true);
    try {
      const updated = await deactivateDrone(droneId);
      setDrone(updated);
    } catch (err) {
      setError(getErrorMessage(err, "Could not deactivate drone."));
    } finally {
      setIsDeactivating(false);
    }
  }

  if (isLoading) return <p>Loading drone…</p>;
  if (error) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!drone) return null;

  return (
    <div>
      <p>
        <Link to="/drones">&larr; Back to My Drones</Link>
      </p>
      <h1>{drone.name}</h1>

      <dl>
        <dt>Serial number</dt>
        <dd>{drone.serial_number}</dd>
        <dt>Manufacturer</dt>
        <dd>{drone.manufacturer || "—"}</dd>
        <dt>Model</dt>
        <dd>{drone.model || "—"}</dd>
        <dt>Size</dt>
        <dd>{drone.drone_size || "—"}</dd>
        <dt>Propeller count</dt>
        <dd>{drone.propeller_count ?? "—"}</dd>
        <dt>Max carry weight</dt>
        <dd>{drone.max_carry_weight != null ? `${drone.max_carry_weight} kg` : "—"}</dd>
        <dt>Purchase date</dt>
        <dd>{drone.purchase_date || "—"}</dd>
        <dt>Status</dt>
        <dd>{drone.status}</dd>
        <dt>Health status</dt>
        <dd>{drone.health_status}</dd>
        <dt>Added</dt>
        <dd>{new Date(drone.created_at).toLocaleString()}</dd>
        <dt>Last updated</dt>
        <dd>{new Date(drone.updated_at).toLocaleString()}</dd>
      </dl>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Link to={`/drones/${drone.id}/edit`}>
          <button>Edit</button>
        </Link>
        <button onClick={handleDeactivate} disabled={isDeactivating || drone.status === "inactive"}>
          {drone.status === "inactive" ? "Deactivated" : isDeactivating ? "Deactivating…" : "Deactivate"}
        </button>
        <Link to={`/flights?droneId=${drone.id}`}>
          <button>View flights</button>
        </Link>
        <Link to={`/flights/new?droneId=${drone.id}`}>
          <button>Add flight</button>
        </Link>
      </div>
    </div>
  );
}
