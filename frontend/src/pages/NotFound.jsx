import { Link } from "react-router-dom";
import { IconAlertTriangle } from "../components/icons.jsx";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--dc-navy-950)" }}>
      <div className="dc-state">
        <div className="dc-state-icon">
          <IconAlertTriangle />
        </div>
        <h1 style={{ fontSize: "1.4rem" }}>Page not found</h1>
        <p>The page you're looking for doesn't exist or has moved.</p>
        <Link to="/" className="dc-btn dc-btn-primary" style={{ marginTop: "0.5rem" }}>
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
