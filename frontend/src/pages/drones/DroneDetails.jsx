import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { deactivateDrone, getDrone } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { IconArrowLeft, IconFlight, IconPulse, IconWrench } from "../../components/icons.jsx";

// Shows the drone entity's own fields plus lightweight links into its
// flight history, prediction history, and maintenance history. Alerts are
// added to this page in a later phase (see System Specification §7,
// FR-DRONE-05).
export default function DroneDetails() {
  const { droneId } = useParams();
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

  if (isLoading) {
    return (
      <div className="dc-page">
        <div className="dc-skeleton" style={{ height: 280 }} />
      </div>
    );
  }
  if (error) {
    return (
      <div className="dc-page">
        <p className="dc-error-text">{error}</p>
      </div>
    );
  }
  if (!drone) return null;

  return (
    <div className="dc-page">
      <Link to="/drones" className="dc-link-back">
        <IconArrowLeft /> Back to My Drones
      </Link>

      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">Drone profile</span>
          <h1>{drone.name}</h1>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
            <StatusBadge status={drone.status} kind="drone" />
            <span className="dc-badge dc-badge-accent">{drone.health_status}</span>
          </div>
        </div>
        <div className="dc-actions">
          <Link to={`/drones/${drone.id}/edit`} className="dc-btn dc-btn-secondary">
            Edit
          </Link>
          <button
            className="dc-btn dc-btn-danger"
            onClick={handleDeactivate}
            disabled={isDeactivating || drone.status === "inactive"}
          >
            {drone.status === "inactive" ? "Deactivated" : isDeactivating ? "Deactivating…" : "Deactivate"}
          </button>
        </div>
      </div>

      <div className="dc-card" style={{ marginBottom: "1.5rem" }}>
        <div className="dc-card-header">
          <h2>Drone information</h2>
        </div>
        <dl className="dc-detail-list">
          <div className="dc-detail-item">
            <dt>Serial number</dt>
            <dd>{drone.serial_number}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Manufacturer</dt>
            <dd>{drone.manufacturer || "—"}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Model</dt>
            <dd>{drone.model || "—"}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Size</dt>
            <dd>{drone.drone_size || "—"}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Propeller count</dt>
            <dd>{drone.propeller_count ?? "—"}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Max carry weight</dt>
            <dd>{drone.max_carry_weight != null ? `${drone.max_carry_weight} kg` : "—"}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Purchase date</dt>
            <dd>{drone.purchase_date || "—"}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Added</dt>
            <dd>{new Date(drone.created_at).toLocaleDateString()}</dd>
          </div>
          <div className="dc-detail-item">
            <dt>Last updated</dt>
            <dd>{new Date(drone.updated_at).toLocaleDateString()}</dd>
          </div>
        </dl>
      </div>

      <div className="dc-grid dc-grid-cards">
        <RelatedCard
          icon={IconFlight}
          title="Flights"
          description="Flight history and telemetry"
          viewTo={`/flights?droneId=${drone.id}`}
          addTo={`/flights/new?droneId=${drone.id}`}
          addLabel="Add flight"
        />
        <RelatedCard
          icon={IconPulse}
          title="Predictions"
          description="AI failure-risk history"
          viewTo={`/predictions?droneId=${drone.id}`}
          addTo={`/predictions/new?droneId=${drone.id}`}
          addLabel="New prediction"
        />
        <RelatedCard
          icon={IconWrench}
          title="Maintenance"
          description="Service records & schedule"
          viewTo={`/maintenance?droneId=${drone.id}`}
          addTo={`/maintenance/new?droneId=${drone.id}`}
          addLabel="Add record"
        />
      </div>
    </div>
  );
}

function RelatedCard({ icon: Icon, title, description, viewTo, addTo, addLabel }) {
  return (
    <div className="dc-card">
      <div className="dc-stat-icon" style={{ marginBottom: "0.75rem" }}>
        <Icon />
      </div>
      <h2 style={{ fontSize: "1rem", marginBottom: "2px" }}>{title}</h2>
      <p style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>{description}</p>
      <div className="dc-actions">
        <Link to={viewTo} className="dc-btn dc-btn-secondary dc-btn-sm">
          View
        </Link>
        <Link to={addTo} className="dc-btn dc-btn-ghost dc-btn-sm">
          {addLabel}
        </Link>
      </div>
    </div>
  );
}
