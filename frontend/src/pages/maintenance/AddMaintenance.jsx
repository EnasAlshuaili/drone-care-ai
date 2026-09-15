import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { listDrones } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import { createMaintenance } from "../../api/maintenance.js";

// FR-MAINT-01: create a maintenance record. Status defaults to "Scheduled";
// "Overdue" is never offered here — it's system-computed only (see
// backend/app/schemas/maintenance.py).
const STATUS_OPTIONS = ["Scheduled", "In Progress", "Completed", "Cancelled"];

const EMPTY_VALUES = {
  drone_id: "",
  maintenance_type: "",
  scheduled_date: "",
  completed_date: "",
  status: "Scheduled",
  technician: "",
  cost: "",
  notes: "",
};

export default function AddMaintenance() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedDroneId = searchParams.get("droneId") || "";

  const [drones, setDrones] = useState([]);
  const [values, setValues] = useState({ ...EMPTY_VALUES, drone_id: preselectedDroneId });
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    listDrones().then(setDrones).catch(() => setDrones([]));
  }, []);

  function handleChange(field) {
    return (event) => {
      setValues((prev) => ({ ...prev, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const record = await createMaintenance({
        drone_id: values.drone_id,
        maintenance_type: values.maintenance_type,
        scheduled_date: values.scheduled_date || null,
        completed_date: values.completed_date || null,
        status: values.status,
        technician: values.technician || null,
        cost: values.cost === "" ? null : Number(values.cost),
        notes: values.notes || null,
      });
      navigate(`/maintenance/${record.id}`);
    } catch (err) {
      setError(getErrorMessage(err, "Could not save maintenance record."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dc-page">
      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">Service & Care</span>
          <h1>Add maintenance record</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="dc-form dc-card">
        <div className="dc-form-row">
          <div className="dc-field">
            <label className="dc-label" htmlFor="drone_id">
              Drone <span className="dc-required">*</span>
            </label>
            <select id="drone_id" required className="dc-select" value={values.drone_id} onChange={handleChange("drone_id")}>
              <option value="" disabled>
                Select a drone
              </option>
              {drones.map((drone) => (
                <option key={drone.id} value={drone.id}>
                  {drone.name}
                </option>
              ))}
            </select>
          </div>

          <div className="dc-field">
            <label className="dc-label" htmlFor="status">
              Status <span className="dc-required">*</span>
            </label>
            <select id="status" required className="dc-select" value={values.status} onChange={handleChange("status")}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="dc-field">
          <label className="dc-label" htmlFor="maintenance_type">
            Type <span className="dc-required">*</span>
          </label>
          <input
            id="maintenance_type"
            type="text"
            required
            maxLength={50}
            placeholder="e.g. Battery inspection, Motor service"
            className="dc-input"
            value={values.maintenance_type}
            onChange={handleChange("maintenance_type")}
          />
        </div>

        <div className="dc-form-row">
          <div className="dc-field">
            <label className="dc-label" htmlFor="scheduled_date">
              Scheduled date
            </label>
            <input id="scheduled_date" type="date" className="dc-input" value={values.scheduled_date} onChange={handleChange("scheduled_date")} />
          </div>

          {values.status === "Completed" && (
            <div className="dc-field">
              <label className="dc-label" htmlFor="completed_date">
                Completed date <span className="dc-required">*</span>
              </label>
              <input
                id="completed_date"
                type="date"
                required
                className="dc-input"
                value={values.completed_date}
                onChange={handleChange("completed_date")}
              />
            </div>
          )}
        </div>

        <div className="dc-form-row">
          <div className="dc-field">
            <label className="dc-label" htmlFor="technician">
              Technician
            </label>
            <input id="technician" type="text" maxLength={100} className="dc-input" value={values.technician} onChange={handleChange("technician")} />
          </div>
          <div className="dc-field">
            <label className="dc-label" htmlFor="cost">
              Cost
            </label>
            <input id="cost" type="number" min="0" step="0.01" className="dc-input" value={values.cost} onChange={handleChange("cost")} />
          </div>
        </div>

        <div className="dc-field">
          <label className="dc-label" htmlFor="notes">
            Notes
          </label>
          <textarea id="notes" rows={3} className="dc-textarea" value={values.notes} onChange={handleChange("notes")} />
        </div>

        {error && <p className="dc-error-text" style={{ marginBottom: "1rem" }}>{error}</p>}

        <button type="submit" className="dc-btn dc-btn-primary" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Add maintenance record"}
        </button>
      </form>
    </div>
  );
}
