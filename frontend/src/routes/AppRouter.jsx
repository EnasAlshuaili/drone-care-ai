import { Route, Routes } from "react-router-dom";
import Dashboard from "../pages/Dashboard.jsx";
import ForgotPassword from "../pages/ForgotPassword.jsx";
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
import AppShell from "./AppShell.jsx";

// Auth routes render full-bleed (no sidebar shell). Every other route is
// nested under AppShell, which handles both the ProtectedRoute redirect and
// the sidebar/topbar chrome in one place.
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      <Route element={<AppShell />}>
        <Route path="/" element={<Dashboard />} />

        <Route path="/drones" element={<DroneList />} />
        <Route path="/drones/new" element={<AddDrone />} />
        <Route path="/drones/:droneId" element={<DroneDetails />} />
        <Route path="/drones/:droneId/edit" element={<EditDrone />} />

        <Route path="/flights" element={<FlightList />} />
        <Route path="/flights/new" element={<AddFlight />} />
        <Route path="/flights/:flightId" element={<FlightDetails />} />

        <Route path="/predictions" element={<PredictionList />} />
        <Route path="/predictions/new" element={<NewPrediction />} />
        <Route path="/predictions/:predictionId" element={<PredictionDetails />} />

        <Route path="/analytics" element={<Analytics />} />
        <Route path="/notifications" element={<NotificationList />} />

        <Route path="/maintenance" element={<MaintenanceList />} />
        <Route path="/maintenance/new" element={<AddMaintenance />} />
        <Route path="/maintenance/:maintenanceId" element={<MaintenanceDetails />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
