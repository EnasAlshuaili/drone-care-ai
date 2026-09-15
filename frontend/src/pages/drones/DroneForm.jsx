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
    <form onSubmit={handleSubmit} style={{ maxWidth: 420 }}>
      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="name">Name *</label>
        <br />
        <input
          id="name"
          type="text"
          required
          maxLength={100}
          value={values.name}
          onChange={handleChange("name")}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="serial_number">Serial number *</label>
        <br />
        <input
          id="serial_number"
          type="text"
          required
          maxLength={100}
          value={values.serial_number}
          onChange={handleChange("serial_number")}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="manufacturer">Manufacturer</label>
        <br />
        <input
          id="manufacturer"
          type="text"
          maxLength={100}
          value={values.manufacturer}
          onChange={handleChange("manufacturer")}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="model">Model</label>
        <br />
        <input
          id="model"
          type="text"
          maxLength={100}
          value={values.model}
          onChange={handleChange("model")}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="drone_size">Drone size</label>
        <br />
        <input
          id="drone_size"
          type="text"
          maxLength={30}
          placeholder="e.g. Small, Medium, Large"
          value={values.drone_size}
          onChange={handleChange("drone_size")}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="propeller_count">Propeller count</label>
        <br />
        <input
          id="propeller_count"
          type="number"
          min="0"
          step="1"
          value={values.propeller_count}
          onChange={handleChange("propeller_count")}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="max_carry_weight">Max carry weight (kg)</label>
        <br />
        <input
          id="max_carry_weight"
          type="number"
          min="0"
          step="0.1"
          value={values.max_carry_weight}
          onChange={handleChange("max_carry_weight")}
          style={{ width: "100%" }}
        />
      </div>

      <div style={{ marginBottom: "0.75rem" }}>
        <label htmlFor="purchase_date">Purchase date</label>
        <br />
        <input
          id="purchase_date"
          type="date"
          value={values.purchase_date}
          onChange={handleChange("purchase_date")}
          style={{ width: "100%" }}
        />
      </div>

      {showStatus && (
        <div style={{ marginBottom: "0.75rem" }}>
          <label htmlFor="status">Status</label>
          <br />
          <select id="status" value={values.status} onChange={handleChange("status")} style={{ width: "100%" }}>
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      )}

      {error && <p style={{ color: "crimson" }}>{error}</p>}

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
