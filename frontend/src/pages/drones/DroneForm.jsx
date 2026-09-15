import { useState } from "react";

const STATUS_OPTIONS = ["active", "inactive", "maintenance", "retired"];

const EMPTY_VALUES = {
  name: "",
  serial_number: "",
  manufacturer: "",
  model: "",
  drone_size: "",
  propeller_count: "",
  max_carry_weight: "",
  purchase_date: "",
  status: "active",
};

// Shared by AddDrone and EditDrone — only the presence of `showStatus`
// (edit mode) and the caller's onSubmit/isSubmitting differ.
export default function DroneForm({ initialValues, showStatus = false, onSubmit, isSubmitting, submitLabel }) {
  const [values, setValues] = useState({ ...EMPTY_VALUES, ...initialValues });
  const [error, setError] = useState(null);

  function handleChange(field) {
    return (event) => setValues((prev) => ({ ...prev, [field]: event.target.value }));
  }

  function toPayload() {
    // Empty strings mean "not provided" for optional fields — send null/undefined
    // rather than an empty string, and convert numeric fields.
    const payload = {
      name: values.name,
      serial_number: values.serial_number,
      manufacturer: values.manufacturer || null,
      model: values.model || null,
      drone_size: values.drone_size || null,
      propeller_count: values.propeller_count === "" ? null : Number(values.propeller_count),
      max_carry_weight: values.max_carry_weight === "" ? null : Number(values.max_carry_weight),
      purchase_date: values.purchase_date || null,
    };
    if (showStatus) {
      payload.status = values.status;
    }
    return payload;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    try {
      await onSubmit(toPayload());
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Could not save drone.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="dc-form dc-card">
      <div className="dc-form-row">
        <div className="dc-field">
          <label className="dc-label" htmlFor="name">
            Name <span className="dc-required">*</span>
          </label>
          <input
            id="name"
            type="text"
            required
            maxLength={100}
            className="dc-input"
            value={values.name}
            onChange={handleChange("name")}
          />
        </div>

        <div className="dc-field">
          <label className="dc-label" htmlFor="serial_number">
            Serial number <span className="dc-required">*</span>
          </label>
          <input
            id="serial_number"
            type="text"
            required
            maxLength={100}
            className="dc-input"
            value={values.serial_number}
            onChange={handleChange("serial_number")}
          />
        </div>
      </div>

      <div className="dc-form-row">
        <div className="dc-field">
          <label className="dc-label" htmlFor="manufacturer">
            Manufacturer
          </label>
          <input
            id="manufacturer"
            type="text"
            maxLength={100}
            className="dc-input"
            value={values.manufacturer}
            onChange={handleChange("manufacturer")}
          />
        </div>

        <div className="dc-field">
          <label className="dc-label" htmlFor="model">
            Model
          </label>
          <input
            id="model"
            type="text"
            maxLength={100}
            className="dc-input"
            value={values.model}
            onChange={handleChange("model")}
          />
        </div>
      </div>

      <div className="dc-form-row">
        <div className="dc-field">
          <label className="dc-label" htmlFor="drone_size">
            Drone size
          </label>
          <input
            id="drone_size"
            type="text"
            maxLength={30}
            placeholder="e.g. Small, Medium, Large"
            className="dc-input"
            value={values.drone_size}
            onChange={handleChange("drone_size")}
          />
        </div>

        <div className="dc-field">
          <label className="dc-label" htmlFor="propeller_count">
            Propeller count
          </label>
          <input
            id="propeller_count"
            type="number"
            min="0"
            step="1"
            className="dc-input"
            value={values.propeller_count}
            onChange={handleChange("propeller_count")}
          />
        </div>
      </div>

      <div className="dc-form-row">
        <div className="dc-field">
          <label className="dc-label" htmlFor="max_carry_weight">
            Max carry weight (kg)
          </label>
          <input
            id="max_carry_weight"
            type="number"
            min="0"
            step="0.1"
            className="dc-input"
            value={values.max_carry_weight}
            onChange={handleChange("max_carry_weight")}
          />
        </div>

        <div className="dc-field">
          <label className="dc-label" htmlFor="purchase_date">
            Purchase date
          </label>
          <input
            id="purchase_date"
            type="date"
            className="dc-input"
            value={values.purchase_date}
            onChange={handleChange("purchase_date")}
          />
        </div>
      </div>

      {showStatus && (
        <div className="dc-field">
          <label className="dc-label" htmlFor="status">
            Status
          </label>
          <select id="status" className="dc-select" value={values.status} onChange={handleChange("status")}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p className="dc-error-text" style={{ marginBottom: "1rem" }}>{error}</p>}

      <button type="submit" className="dc-btn dc-btn-primary" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
