import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Placeholder shell. Real dashboard widgets (fleet overview, high-risk
// drones, upcoming maintenance) are built in a later phase.
export default function Dashboard() {
  const { user } = useAuth();

  return (
    <div>
      <h1>DroneCare</h1>
      <p>Signed in as {user?.email}.</p>
      <p>
        <Link to="/drones">Go to My Drones</Link>
      </p>
      <p>Further dashboard content comes in a later phase.</p>
    </div>
  );
}
