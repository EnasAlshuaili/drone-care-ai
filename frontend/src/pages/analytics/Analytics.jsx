import { useCallback, useEffect, useState } from "react";
import { getMaintenanceStats, getPredictionVolume, getRiskDistribution } from "../../api/analytics.js";
import { getErrorMessage } from "../../api/errors.js";
import { MaintenanceCompletionMeter, PredictionVolumeChart, RiskDistributionChart } from "./charts.jsx";

const VOLUME_DAY_OPTIONS = [7, 30, 90];

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
    <div className="dc-page">
      <div className="dc-page-header">
        <div>
          <span className="dc-eyebrow">Insights</span>
          <h1>Analytics</h1>
          <p>Fleet-wide risk, prediction, and maintenance insights.</p>
        </div>
      </div>

      <div className="dc-stack">
        <div className="dc-card">
          <div className="dc-card-header">
            <h2>Risk distribution</h2>
          </div>
          <p className="dc-card-subtitle">Each drone's most recent prediction, across your fleet.</p>
          {isLoadingRisk && <div className="dc-skeleton" style={{ height: 140 }} />}
          {riskError && <p className="dc-error-text">{riskError}</p>}
          {!isLoadingRisk && !riskError && riskItems.length === 0 && <p>No drones yet.</p>}
          {!isLoadingRisk && !riskError && riskItems.length > 0 && <RiskDistributionChart items={riskItems} />}
        </div>

        <div className="dc-card">
          <div className="dc-flex-between" style={{ marginBottom: "0.25rem" }}>
            <h2 style={{ fontSize: "1.05rem" }}>Prediction volume</h2>
            <div className="dc-actions">
              {VOLUME_DAY_OPTIONS.map((option) => (
                <button
                  key={option}
                  className={`dc-btn dc-btn-sm ${days === option ? "dc-btn-primary" : "dc-btn-secondary"}`}
                  onClick={() => setDays(option)}
                  disabled={days === option}
                >
                  {option}d
                </button>
              ))}
            </div>
          </div>
          <p className="dc-card-subtitle">Predictions run per day, last {days} days.</p>
          {isLoadingVolume && <div className="dc-skeleton" style={{ height: 140 }} />}
          {volumeError && <p className="dc-error-text">{volumeError}</p>}
          {!isLoadingVolume && !volumeError && <PredictionVolumeChart items={volumeItems} />}
        </div>

        <div className="dc-card">
          <div className="dc-card-header">
            <h2>Maintenance completion rate</h2>
          </div>
          <p className="dc-card-subtitle">Across all maintenance records for your fleet.</p>
          {isLoadingMaintenance && <div className="dc-skeleton" style={{ height: 140 }} />}
          {maintenanceError && <p className="dc-error-text">{maintenanceError}</p>}
          {!isLoadingMaintenance && !maintenanceError && maintenanceStats && (
            <MaintenanceCompletionMeter stats={maintenanceStats} />
          )}
        </div>
      </div>
    </div>
  );
}
