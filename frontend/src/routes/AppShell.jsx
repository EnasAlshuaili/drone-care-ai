import { Outlet } from "react-router-dom";
import AppLayout from "../components/layout/AppLayout.jsx";
import ProtectedRoute from "./ProtectedRoute.jsx";

// Wraps every authenticated app route in the sidebar/topbar shell. Auth
// pages (/login, /register) are NOT nested under this route — they render
// full-bleed with their own layout (see pages/Login.jsx, pages/Register.jsx).
export default function AppShell() {
  return (
    <ProtectedRoute>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </ProtectedRoute>
  );
}
