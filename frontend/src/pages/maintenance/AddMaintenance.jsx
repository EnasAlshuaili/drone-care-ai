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
    <div>
      <h1>Add maintenance record</h1>
      <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="drone_id">Drone *</label>
          <br />
          <select
            id="drone_id"
            required
            value={values.drone_id}
            onChange={handleChange("drone_id")}
            style={{ width: "100%" }}
          >
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

        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="maintenance_type">Type *</label>
          <br />
          <input
            id="maintenance_type"
            type="text"
            required
            maxLength={50}
            placeholder="e.g. Battery inspection, Motor service"
            value={values.maintenance_type}
            onChange={handleChange("maintenance_type")}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="status">Status *</label>
          <br />
          <select
            id="status"
            required
            value={values.status}
            onChange={handleChange("status")}
            style={{ width: "100%" }}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="scheduled_date">Scheduled date</label>
          <br />
          <input
            id="scheduled_date"
            type="date"
            value={values.scheduled_date}
            onChange={handleChange("scheduled_date")}
            style={{ width: "100%" }}
          />
        </div>

        {values.status === "Completed" && (
          <div style={{ marginBottom: "0.75rem" }}>
            <label htmlFor="completed_date">Completed date *</label>
            <br />
            <input
              id="completed_date"
              type="date"
              required
              value={values.completed_date}
              onChange={handleChange("completed_date")}
              style={{ width: "100%" }}
            />
          </div>
        )}

        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="technician">Technician</label>
          <br />
          <input
            id="technician"
            type="text"
            maxLength={100}
            value={values.technician}
            onChange={handleChange("technician")}
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
            value={values.cost}
            onChange={handleChange("cost")}
            style={{ width: "100%" }}
          />
        </div>

        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="notes">Notes</label>
          <br />
          <textarea
            id="notes"
            rows={3}
            value={values.notes}
            onChange={handleChange("notes")}
            style={{ width: "100%" }}
          />
        </div>

        {error && <p style={{ color: "crimson" }}>{error}</p>}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Add maintenance record"}
        </button>
      </form>
    </div>
  );
}
