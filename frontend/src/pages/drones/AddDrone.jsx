import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createDrone } from "../../api/drones.js";
import DroneForm from "./DroneForm.jsx";

export default function AddDrone() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(payload) {
    setIsSubmitting(true);
    try {
      const drone = await createDrone(payload);
      navigate(`/drones/${drone.id}`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h1>Add drone</h1>
      <DroneForm onSubmit={handleSubmit} isSubmitting={isSubmitting} submitLabel="Add drone" />
    </div>
  );
}
