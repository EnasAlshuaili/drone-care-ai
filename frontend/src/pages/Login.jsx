import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { IconChart, IconEye, IconEyeOff, IconLock, IconMail, IconPulse, IconShieldCheck, IconWrench } from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const FEATURES = [
  { label: "MONITOR", sub: "Real-time data", icon: IconChart },
  { label: "PREDICT", sub: "AI-powered insights", icon: IconPulse },
  { label: "PREVENT", sub: "Reduce failures", icon: IconShieldCheck },
  { label: "MAINTAIN", sub: "Longer operations", icon: IconWrench },
];

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await login({ email, password });
      navigate("/");
    } catch {
      // Generic message — the backend intentionally doesn't reveal which
      // field was wrong (SRS FR-AUTH-02).
      setError("Incorrect email or password.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dc-auth">
      <div className="dc-auth-visual">
        <div className="dc-auth-brand">
          <img src="/branding/dronecare-mark-128.png" alt="DroneCare" />
          <span className="dc-auth-brand-name">
            Drone<span>Care</span>
          </span>
        </div>

        <h1 className="dc-auth-tagline">
          Intelligence keeps <span>drones flying</span>.
        </h1>
        <p className="dc-auth-subtext">
          AI-powered monitoring, failure prediction, and maintenance management for your entire drone fleet.
        </p>

        <div className="dc-auth-features">
          {FEATURES.map(({ label, sub, icon: Icon }) => (
            <div className="dc-auth-feature" key={label}>
              <div className="dc-auth-feature-icon">
                <Icon />
              </div>
              <div>
                <div className="dc-auth-feature-label">{label}</div>
                <div className="dc-auth-feature-sub">{sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dc-auth-form-side">
        <div className="dc-auth-card">
          <h1>
            Welcome <span>Back</span>
          </h1>
          <p className="dc-auth-card-subtitle">Sign in to your DroneCare account</p>

          <form onSubmit={handleSubmit}>
            <div className="dc-field">
              <label className="dc-label" htmlFor="email">
                Email
              </label>
              <div className="dc-input-icon-wrap">
                <span className="dc-input-icon">
                  <IconMail />
                </span>
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="you@company.com"
                  className="dc-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="dc-field">
              <label className="dc-label" htmlFor="password">
                Password
              </label>
              <div className="dc-input-icon-wrap">
                <span className="dc-input-icon">
                  <IconLock />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="dc-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="dc-input-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
            </div>

            <div className="dc-auth-row">
              <label className="dc-checkbox-row">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember me
              </label>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            {error && <p className="dc-error-text" style={{ marginBottom: "1rem" }}>{error}</p>}

            <button type="submit" className="dc-btn dc-btn-primary" style={{ width: "100%" }} disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="dc-auth-footer">
            No account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
