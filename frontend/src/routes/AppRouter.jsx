import { Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard.jsx";
import Login from "../pages/Login.jsx";
import NotFound from "../pages/NotFound.jsx";
import Register from "../pages/Register.jsx";
import Analytics from "../pages/analytics/Analytics.jsx";
import AddDrone from "../pages/drones/AddDrone.jsx";
import DroneDetails from "../pages/drones/DroneDetails.jsx";
import DroneList from "../pages/drones/DroneList.jsx";
import EditDrone from "../pages/drones/EditDrone.jsx";
import AddFlight from "../pages/flights/AddFlight.jsx";
import FlightDetails from "../pages/flights/FlightDetails.jsx";
import FlightList from "../pages/flights/FlightList.jsx";
import AddMaintenance from "../pages/maintenance/AddMaintenance.jsx";
import MaintenanceDetails from "../pages/maintenance/MaintenanceDetails.jsx";
import MaintenanceList from "../pages/maintenance/MaintenanceList.jsx";
import NotificationList from "../pages/notifications/NotificationList.jsx";
import NewPrediction from "../pages/predictions/NewPrediction.jsx";
import PredictionDetails from "../pages/predictions/PredictionDetails.jsx";
import PredictionList from "../pages/predictions/PredictionList.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

// Additional routes (profile) are added as those pages are built in later
// phases.
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drones"
        element={
          <ProtectedRoute>
            <DroneList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drones/new"
        element={
          <ProtectedRoute>
            <AddDrone />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drones/:droneId"
        element={
          <ProtectedRoute>
            <DroneDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/drones/:droneId/edit"
        element={
          <ProtectedRoute>
            <EditDrone />
          </ProtectedRoute>
        }
      />
      <Route
        path="/flights"
        element={
          <ProtectedRoute>
            <FlightList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/flights/new"
        element={
          <ProtectedRoute>
            <AddFlight />
          </ProtectedRoute>
        }
      />
      <Route
        path="/flights/:flightId"
        element={
          <ProtectedRoute>
            <FlightDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/predictions"
        element={
          <ProtectedRoute>
            <PredictionList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/predictions/new"
        element={
          <ProtectedRoute>
            <NewPrediction />
          </ProtectedRoute>
        }
      />
      <Route
        path="/predictions/:predictionId"
        element={
          <ProtectedRoute>
            <PredictionDetails />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <Analytics />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute>
            <MaintenanceList />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance/new"
        element={
          <ProtectedRoute>
            <AddMaintenance />
          </ProtectedRoute>
        }
      />
      <Route
        path="/maintenance/:maintenanceId"
        element={
          <ProtectedRoute>
            <MaintenanceDetails />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
