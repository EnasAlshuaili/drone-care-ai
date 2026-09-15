import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDrone } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { getMaintenance, updateMaintenance } from "../../api/maintenance.js";
import { StatusBadge } from "../../components/StatusBadge.jsx";
import { IconArrowLeft } from "../../components/icons.jsx";

const TERMINAL_STATUSES = ["Completed", "Cancelled"];

// FR-MAINT-01 (edit) / FR-MAINT-02 (complete): view + edit the record's own
// fields, and separately transition its status (Start / Complete / Cancel).
// The two are kept as distinct actions rather than folded into one form, so
// completing (which also resets the drone's health_status — see
// backend/app/services/maintenance_service.py) is always a deliberate step.
export default function MaintenanceDetails() {
  const { maintenanceId } = useParams();
  const [record, setRecord] = useState(null);
  const [drone, setDrone] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  const [completedDateInput, setCompletedDateInput] = useState("");
  const [isTransitioning, setIsTransitioning] = useState(false);

  const fetchRecord = useCallback(() => {
    setIsLoading(true);
    setError(null);
    return getMaintenance(maintenanceId)
      .then((r) => {
        setRecord(r);
        setCompletedDateInput(r.completed_date || new Date().toISOString().slice(0, 10));
        return getDrone(r.drone_id)
          .then(setDrone)
          .catch(() => {});
      })
      .catch((err) => setError(getErrorMessage(err, "Could not load maintenance record.")))
      .finally(() => setIsLoading(false));
  }, [maintenanceId]);

  useEffect(() => {
    fetchRecord();
  }, [fetchRecord]);

  function startEditing() {
    setEditValues({
      maintenance_type: record.maintenance_type,
      scheduled_date: record.scheduled_date || "",
      technician: record.technician || "",
      cost: record.cost ?? "",
      notes: record.notes || "",
    });
    setIsEditing(true);
  }

  function handleEditChange(field) {
    return (event) => setEditValues((prev) => ({ ...prev, [field]: event.target.value }));
  }

  async function handleSaveEdit(event) {
    event.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const updated = await updateMaintenance(maintenanceId, {
        maintenance_type: editValues.maintenance_type,
        scheduled_date: editValues.scheduled_date || null,
        technician: editValues.technician || null,
        cost: editValues.cost === "" ? null : Number(editValues.cost),
        notes: editValues.notes || null,
      });
      setRecord(updated);
      setIsEditing(false);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save changes."));
    } finally {
      setIsSaving(false);
    }
  }

  async function transitionTo(status, extra = {}) {
    setIsTransitioning(true);
    setError(null);
    try {
      const updated = await updateMaintenance(maintenanceId, { status, ...extra });
      setRecord(updated);
    } catch (err) {
      setError(getErrorMessage(err, "Could not update status."));
    } finally {
      setIsTransitioning(false);
    }
  }

  if (isLoading) {
    return (
      <div className="dc-page">
        <div className="dc-skeleton" style={{ height: 280 }} />
      </div>
    );
  }
  if (error && !record) {
    return (
      <div className="dc-page">
        <p className="dc-error-text">{error}</p>
      </div>
    );
  }
  if (!record) return null;

  const isTerminal = TERMINAL_STATUSES.includes(record.status);

  return (
    <div className="dc-page">
      <Link to="/maintenance" className="dc-link-back">
        <IconArrowLeft /> Back to Maintenance
      </Link>

      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">Service record</span>
          <h1>{record.maintenance_type}</h1>
          <p style={{ marginTop: "0.25rem" }}>
            {drone ? <Link to={`/drones/${drone.id}`}>{drone.name}</Link> : record.drone_id}
          </p>
          <div style={{ marginTop: "0.5rem" }}>
            <StatusBadge status={record.status} kind="maintenance" />
          </div>
        </div>
      </div>

      {error && <p className="dc-error-text" style={{ marginBottom: "1rem" }}>{error}</p>}

      {!isEditing && (
        <>
          <div className="dc-card" style={{ marginBottom: "1.5rem" }}>
            <div className="dc-card-header">
              <h2>Record details</h2>
            </div>
            <dl className="dc-detail-list">
              <div className="dc-detail-item">
                <dt>Scheduled date</dt>
                <dd>{record.scheduled_date || "—"}</dd>
              </div>
              <div className="dc-detail-item">
                <dt>Completed date</dt>
                <dd>{record.completed_date || "—"}</dd>
              </div>
              <div className="dc-detail-item">
                <dt>Technician</dt>
                <dd>{record.technician || "—"}</dd>
              </div>
              <div className="dc-detail-item">
                <dt>Cost</dt>
                <dd>{record.cost != null ? `$${record.cost}` : "—"}</dd>
              </div>
              <div className="dc-detail-item">
                <dt>Recorded</dt>
                <dd>{new Date(record.created_at).toLocaleString()}</dd>
              </div>
            </dl>
            {record.notes && (
              <>
                <hr className="dc-divider" />
                <div className="dc-detail-item">
                  <dt>Notes</dt>
                  <dd style={{ fontWeight: 400 }}>{record.notes}</dd>
                </div>
              </>
            )}
          </div>

          {!isTerminal && (
            <div className="dc-actions">
              <button className="dc-btn dc-btn-secondary" onClick={startEditing}>
                Edit details
              </button>
              {record.status === "Scheduled" && (
                <button className="dc-btn dc-btn-secondary" disabled={isTransitioning} onClick={() => transitionTo("In Progress")}>
                  Mark in progress
                </button>
              )}
              <button className="dc-btn dc-btn-primary" disabled={isTransitioning} onClick={() => setIsEditing("complete")}>
                Mark completed
              </button>
              <button
                className="dc-btn dc-btn-danger"
                disabled={isTransitioning}
                onClick={() => {
                  if (window.confirm("Cancel this maintenance record?")) transitionTo("Cancelled");
                }}
              >
                Cancel record
              </button>
            </div>
          )}
        </>
      )}

      {isEditing === "complete" && (
        <div className="dc-card" style={{ maxWidth: 420 }}>
          <div className="dc-field">
            <label className="dc-label" htmlFor="completed_date">
              Completed date <span className="dc-required">*</span>
            </label>
            <input
              id="completed_date"
              type="date"
              required
              className="dc-input"
              value={completedDateInput}
              onChange={(e) => setCompletedDateInput(e.target.value)}
            />
          </div>
          <div className="dc-actions">
            <button
              className="dc-btn dc-btn-primary"
              disabled={isTransitioning || !completedDateInput}
              onClick={async () => {
                await transitionTo("Completed", { completed_date: completedDateInput });
                setIsEditing(false);
              }}
            >
              Confirm completion
            </button>
            <button className="dc-btn dc-btn-ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {isEditing === true && editValues && (
        <form onSubmit={handleSaveEdit} className="dc-form dc-card">
          <div className="dc-field">
            <label className="dc-label" htmlFor="maintenance_type">
              Type <span className="dc-required">*</span>
            </label>
            <input
              id="maintenance_type"
              type="text"
              required
              maxLength={50}
              className="dc-input"
              value={editValues.maintenance_type}
              onChange={handleEditChange("maintenance_type")}
            />
          </div>
          <div className="dc-field">
            <label className="dc-label" htmlFor="scheduled_date">
              Scheduled date
            </label>
            <input id="scheduled_date" type="date" className="dc-input" value={editValues.scheduled_date} onChange={handleEditChange("scheduled_date")} />
          </div>
          <div className="dc-form-row">
            <div className="dc-field">
              <label className="dc-label" htmlFor="technician">
                Technician
              </label>
              <input id="technician" type="text" maxLength={100} className="dc-input" value={editValues.technician} onChange={handleEditChange("technician")} />
            </div>
            <div className="dc-field">
              <label className="dc-label" htmlFor="cost">
                Cost
              </label>
              <input id="cost" type="number" min="0" step="0.01" className="dc-input" value={editValues.cost} onChange={handleEditChange("cost")} />
            </div>
          </div>
          <div className="dc-field">
            <label className="dc-label" htmlFor="notes">
              Notes
            </label>
            <textarea id="notes" rows={3} className="dc-textarea" value={editValues.notes} onChange={handleEditChange("notes")} />
          </div>
          <div className="dc-actions">
            <button type="submit" className="dc-btn dc-btn-primary" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" className="dc-btn dc-btn-ghost" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
