import { useCallback, useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { listNotifications } from "../../api/notifications.js";
import { useAuth } from "../../context/AuthContext.jsx";
import {
  IconBell,
  IconChart,
  IconClose,
  IconDrone,
  IconFlight,
  IconHome,
  IconLogout,
  IconMenu,
  IconPulse,
  IconWrench,
} from "../icons.jsx";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: IconHome, end: true },
  { to: "/drones", label: "Drones", icon: IconDrone },
  { to: "/flights", label: "Flights", icon: IconFlight },
  { to: "/predictions", label: "Predictions", icon: IconPulse },
  { to: "/analytics", label: "Analytics", icon: IconChart },
  { to: "/notifications", label: "Notifications", icon: IconBell },
  { to: "/maintenance", label: "Maintenance", icon: IconWrench },
];

function initials(fullName) {
  if (!fullName) return "?";
  const parts = fullName.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase() || "?";
}

export default function AppLayout({ children }) {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnread = useCallback(() => {
    if (!isAuthenticated) return;
    listNotifications({ limit: 1 })
      .then((data) => setUnreadCount(data.unread_count))
      .catch(() => {});
  }, [isAuthenticated]);

  useEffect(() => {
    fetchUnread();
  }, [fetchUnread, location.pathname]);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  return (
    <div className="dc-shell">
      <div
        className={`dc-scrim${isSidebarOpen ? " is-open" : ""}`}
        onClick={() => setIsSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside className={`dc-sidebar${isSidebarOpen ? " is-open" : ""}`} aria-label="Primary navigation">
        <Link to="/" className="dc-brand">
          <img src="/branding/dronecare-mark-128.png" alt="" className="dc-brand-mark" />
          <span className="dc-brand-name">
            Drone<span>Care</span>
          </span>
        </Link>

        {isAuthenticated && (
          <>
            <nav className="dc-nav">
              {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) => `dc-nav-link${isActive ? " is-active" : ""}`}
                >
                  <span className="dc-nav-icon">
                    <Icon />
                  </span>
                  {label}
                  {to === "/notifications" && unreadCount > 0 && (
                    <span className="dc-nav-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
                  )}
                </NavLink>
              ))}
            </nav>

            <div className="dc-sidebar-footer">
              <div className="dc-avatar">{initials(user?.full_name)}</div>
              <div className="dc-sidebar-user">
                <div className="dc-sidebar-user-name">{user?.full_name}</div>
                <div className="dc-sidebar-user-role">Drone Operator</div>
              </div>
              <button
                type="button"
                className="dc-btn dc-btn-ghost dc-btn-sm"
                onClick={handleLogout}
                aria-label="Log out"
                title="Log out"
              >
                <IconLogout />
              </button>
            </div>
          </>
        )}
      </aside>

      <div className="dc-main">
        {isAuthenticated && (
          <header className="dc-topbar">
            <button
              type="button"
              className="dc-menu-btn"
              onClick={() => setIsSidebarOpen((v) => !v)}
              aria-label="Toggle navigation"
              aria-expanded={isSidebarOpen}
            >
              {isSidebarOpen ? <IconClose /> : <IconMenu />}
            </button>
            <Link to="/" className="dc-brand" style={{ padding: 0 }}>
              <img src="/branding/dronecare-mark-128.png" alt="" className="dc-brand-mark" style={{ width: 28, height: 28 }} />
              <span className="dc-brand-name" style={{ fontSize: "0.98rem" }}>
                Drone<span>Care</span>
              </span>
            </Link>
          </header>
        )}
        <main>{children}</main>
      </div>
    </div>
  );
}
