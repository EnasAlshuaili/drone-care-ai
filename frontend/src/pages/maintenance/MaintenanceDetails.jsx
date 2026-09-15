import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getDrone } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { getMaintenance, updateMaintenance } from "../../api/maintenance.js";

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

  if (isLoading) return <p>Loading maintenance record…</p>;
  if (error && !record) return <p style={{ color: "crimson" }}>{error}</p>;
  if (!record) return null;

  const isTerminal = TERMINAL_STATUSES.includes(record.status);

  return (
    <div>
      <p>
        <Link to="/maintenance">&larr; Back to Maintenance</Link>
      </p>
      <h1>
        {record.maintenance_type} — {drone ? <Link to={`/drones/${drone.id}`}>{drone.name}</Link> : record.drone_id}
      </h1>

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {!isEditing && (
        <>
          <dl>
            <dt>Status</dt>
            <dd>
              <strong>{record.status}</strong>
            </dd>
            <dt>Scheduled date</dt>
            <dd>{record.scheduled_date || "—"}</dd>
            <dt>Completed date</dt>
            <dd>{record.completed_date || "—"}</dd>
            <dt>Technician</dt>
            <dd>{record.technician || "—"}</dd>
            <dt>Cost</dt>
            <dd>{record.cost != null ? `$${record.cost}` : "—"}</dd>
            <dt>Notes</dt>
            <dd>{record.notes || "—"}</dd>
            <dt>Recorded</dt>
            <dd>{new Date(record.created_at).toLocaleString()}</dd>
          </dl>

          {!isTerminal && (
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <button onClick={startEditing}>Edit details</button>
              {record.status === "Scheduled" && (
                <button disabled={isTransitioning} onClick={() => transitionTo("In Progress")}>
                  Mark in progress
                </button>
              )}
              <button disabled={isTransitioning} onClick={() => setIsEditing("complete")}>
                Mark completed
              </button>
              <button
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
        <div style={{ maxWidth: 420, marginBottom: "1rem" }}>
          <label htmlFor="completed_date">Completed date *</label>
          <br />
          <input
            id="completed_date"
            type="date"
            required
            value={completedDateInput}
            onChange={(e) => setCompletedDateInput(e.target.value)}
            style={{ width: "100%" }}
          />
          <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem" }}>
            <button
              disabled={isTransitioning || !completedDateInput}
              onClick={async () => {
                await transitionTo("Completed", { completed_date: completedDateInput });
                setIsEditing(false);
              }}
            >
              Confirm completion
            </button>
            <button onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        </div>
      )}

      {isEditing === true && editValues && (
        <form onSubmit={handleSaveEdit} style={{ maxWidth: 420 }}>
          <div style={{ marginBottom: "0.75rem" }}>
            <label htmlFor="maintenance_type">Type *</label>
            <br />
            <input
              id="maintenance_type"
              type="text"
              required
              maxLength={50}
              value={editValues.maintenance_type}
              onChange={handleEditChange("maintenance_type")}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label htmlFor="scheduled_date">Scheduled date</label>
            <br />
            <input
              id="scheduled_date"
              type="date"
              value={editValues.scheduled_date}
              onChange={handleEditChange("scheduled_date")}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label htmlFor="technician">Technician</label>
            <br />
            <input
              id="technician"
              type="text"
              maxLength={100}
              value={editValues.technician}
              onChange={handleEditChange("technician")}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label htmlFor="cost">Cost</label>
            <br />
            <input
              id="cost"
              type="number"
              min="0"
              step="0.01"
              value={editValues.cost}
              onChange={handleEditChange("cost")}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ marginBottom: "0.75rem" }}>
            <label htmlFor="notes">Notes</label>
            <br />
            <textarea
              id="notes"
              rows={3}
              value={editValues.notes}
              onChange={handleEditChange("notes")}
              style={{ width: "100%" }}
            />
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button type="submit" disabled={isSaving}>
              {isSaving ? "Saving…" : "Save changes"}
            </button>
            <button type="button" onClick={() => setIsEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
