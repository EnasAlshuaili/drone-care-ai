import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

// Minimal shell layout for Phase 1/2/3. Full sidebar navigation and styling
// are built out once more of the application's pages exist.
export default function AppLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div>
      <header
        style={{
          padding: "1rem",
          borderBottom: "1px solid #ddd",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span style={{ display: "flex", gap: "1.5rem", alignItems: "center" }}>
          <Link to="/" style={{ fontWeight: "bold", textDecoration: "none" }}>
            DroneCare
          </Link>
          {isAuthenticated && <Link to="/drones">My Drones</Link>}
          {isAuthenticated && <Link to="/flights">Flights</Link>}
        </span>
        {isAuthenticated && (
          <span>
            {user.full_name} · <button onClick={handleLogout}>Log out</button>
          </span>
        )}
      </header>
      <main style={{ padding: "1rem" }}>{children}</main>
    </div>
  );
}
