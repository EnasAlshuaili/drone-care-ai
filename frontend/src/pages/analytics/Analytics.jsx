import { useCallback, useEffect, useState } from "react";
import { getMaintenanceStats, getPredictionVolume, getRiskDistribution } from "../../api/analytics.js";
import { getErrorMessage } from "../../api/errors.js";
import { MaintenanceCompletionMeter, PredictionVolumeChart, RiskDistributionChart } from "./charts.jsx";

const VOLUME_DAY_OPTIONS = [7, 30, 90];

const CARD_STYLE = {
  border: "1px solid #ddd",
  borderRadius: 6,
  padding: "1rem",
  marginBottom: "1.5rem",
  maxWidth: 640,
};

// FR-ANLY-01: risk distribution across the fleet, prediction volume over
// time, and maintenance completion rate — using only real stored data.
export default function Analytics() {
  const [riskItems, setRiskItems] = useState([]);
  const [riskError, setRiskError] = useState(null);
  const [isLoadingRisk, setIsLoadingRisk] = useState(true);

  const [days, setDays] = useState(30);
  const [volumeItems, setVolumeItems] = useState([]);
  const [volumeError, setVolumeError] = useState(null);
  const [isLoadingVolume, setIsLoadingVolume] = useState(true);

  const [maintenanceStats, setMaintenanceStats] = useState(null);
  const [maintenanceError, setMaintenanceError] = useState(null);
  const [isLoadingMaintenance, setIsLoadingMaintenance] = useState(true);

  useEffect(() => {
    setIsLoadingRisk(true);
    setRiskError(null);
    getRiskDistribution()
      .then((data) => setRiskItems(data.items))
      .catch((err) => setRiskError(getErrorMessage(err, "Could not load risk distribution.")))
      .finally(() => setIsLoadingRisk(false));
  }, []);

  useEffect(() => {
    setIsLoadingMaintenance(true);
    setMaintenanceError(null);
    getMaintenanceStats()
      .then(setMaintenanceStats)
      .catch((err) => setMaintenanceError(getErrorMessage(err, "Could not load maintenance stats.")))
      .finally(() => setIsLoadingMaintenance(false));
  }, []);

  const fetchVolume = useCallback(() => {
    setIsLoadingVolume(true);
    setVolumeError(null);
    return getPredictionVolume({ days })
      .then((data) => setVolumeItems(data.items))
      .catch((err) => setVolumeError(getErrorMessage(err, "Could not load prediction volume.")))
      .finally(() => setIsLoadingVolume(false));
  }, [days]);

  useEffect(() => {
    fetchVolume();
  }, [fetchVolume]);

  return (
    <div>
      <h1>Analytics</h1>

      <div style={CARD_STYLE}>
        <h2 style={{ marginTop: 0 }}>Risk distribution</h2>
        <p style={{ color: "#52514e", fontSize: "0.9rem" }}>
          Each drone's most recent prediction, across your fleet.
        </p>
        {isLoadingRisk && <p>Loading…</p>}
        {riskError && <p style={{ color: "crimson" }}>{riskError}</p>}
        {!isLoadingRisk && !riskError && riskItems.length === 0 && <p>No drones yet.</p>}
        {!isLoadingRisk && !riskError && riskItems.length > 0 && <RiskDistributionChart items={riskItems} />}
      </div>

      <div style={CARD_STYLE}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ marginTop: 0 }}>Prediction volume</h2>
          <div>
            {VOLUME_DAY_OPTIONS.map((option) => (
              <button
                key={option}
                onClick={() => setDays(option)}
                disabled={days === option}
                style={{ marginLeft: "0.25rem" }}
              >
                {option}d
              </button>
            ))}
          </div>
        </div>
        <p style={{ color: "#52514e", fontSize: "0.9rem" }}>Predictions run per day, last {days} days.</p>
        {isLoadingVolume && <p>Loading…</p>}
        {volumeError && <p style={{ color: "crimson" }}>{volumeError}</p>}
        {!isLoadingVolume && !volumeError && <PredictionVolumeChart items={volumeItems} />}
      </div>

      <div style={CARD_STYLE}>
        <h2 style={{ marginTop: 0 }}>Maintenance completion rate</h2>
        <p style={{ color: "#52514e", fontSize: "0.9rem" }}>Across all maintenance records for your fleet.</p>
        {isLoadingMaintenance && <p>Loading…</p>}
        {maintenanceError && <p style={{ color: "crimson" }}>{maintenanceError}</p>}
        {!isLoadingMaintenance && !maintenanceError && maintenanceStats && (
          <MaintenanceCompletionMeter stats={maintenanceStats} />
        )}
      </div>
    </div>
  );
}
