import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getDrone, updateDrone } from "../../api/drones.js";
import { getErrorMessage } from "../../api/errors.js";
import DroneForm from "./DroneForm.jsx";

function toFormValues(drone) {
  return {
    name: drone.name,
    serial_number: drone.serial_number,
    manufacturer: drone.manufacturer ?? "",
    model: drone.model ?? "",
    drone_size: drone.drone_size ?? "",
    propeller_count: drone.propeller_count ?? "",
    max_carry_weight: drone.max_carry_weight ?? "",
    purchase_date: drone.purchase_date ?? "",
    status: drone.status,
  };
}

export default function EditDrone() {
  const { droneId } = useParams();
  const navigate = useNavigate();
  const [initialValues, setInitialValues] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    getDrone(droneId)
      .then((drone) => {
        if (!cancelled) setInitialValues(toFormValues(drone));
      })
      .catch((err) => {
        if (!cancelled) setLoadError(getErrorMessage(err, "Could not load drone."));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [droneId]);

  async function handleSubmit(payload) {
    setIsSubmitting(true);
    try {
      await updateDrone(droneId, payload);
      navigate(`/drones/${droneId}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dc-page">
      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">Fleet</span>
          <h1>Edit drone</h1>
        </div>
      </div>

      {isLoading && <div className="dc-skeleton" style={{ height: 300, maxWidth: 440 }} />}
      {loadError && <p className="dc-error-text">{loadError}</p>}

      {!isLoading && !loadError && (
        <DroneForm
          initialValues={initialValues}
          showStatus
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Save changes"
        />
      )}
    </div>
  );
}
