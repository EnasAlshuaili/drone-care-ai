import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  IconChart,
  IconEye,
  IconEyeOff,
  IconLock,
  IconMail,
  IconPulse,
  IconShieldCheck,
  IconUser,
  IconWrench,
} from "../components/icons.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const FEATURES = [
  { label: "MONITOR", sub: "Real-time data", icon: IconChart },
  { label: "PREDICT", sub: "AI-powered insights", icon: IconPulse },
  { label: "PREVENT", sub: "Reduce failures", icon: IconShieldCheck },
  { label: "MAINTAIN", sub: "Longer operations", icon: IconWrench },
];

// PROVISIONAL: registration does not auto-login (matches the backend's
// documented provisional decision — see backend/app/api/v1/auth.py). The
// user is redirected to /login with a success message instead.
export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);

    if (password !== passwordConfirm) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await register({ fullName, email, password, passwordConfirm });
      navigate("/login", { state: { justRegistered: true } });
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setError(typeof detail === "string" ? detail : "Registration failed.");
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
          Join the fleet <span>intelligence</span> layer.
        </h1>
        <p className="dc-auth-subtext">
          Create your DroneCare account to start monitoring, predicting, and preventing drone failures.
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
            Create <span>account</span>
          </h1>
          <p className="dc-auth-card-subtitle">Create your DroneCare account to get started</p>

          <form onSubmit={handleSubmit}>
            <div className="dc-field">
              <label className="dc-label" htmlFor="fullName">
                Full name
              </label>
              <div className="dc-input-icon-wrap">
                <span className="dc-input-icon">
                  <IconUser />
                </span>
                <input
                  id="fullName"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Jane Doe"
                  className="dc-input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            </div>

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

            <div className="dc-form-row">
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
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
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
              <div className="dc-field">
                <label className="dc-label" htmlFor="passwordConfirm">
                  Confirm
                </label>
                <div className="dc-input-icon-wrap">
                  <span className="dc-input-icon">
                    <IconLock />
                  </span>
                  <input
                    id="passwordConfirm"
                    type={showPasswordConfirm ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    className="dc-input"
                    value={passwordConfirm}
                    onChange={(e) => setPasswordConfirm(e.target.value)}
                  />
                  <button
                    type="button"
                    className="dc-input-toggle"
                    onClick={() => setShowPasswordConfirm((v) => !v)}
                    aria-label={showPasswordConfirm ? "Hide password" : "Show password"}
                  >
                    {showPasswordConfirm ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="dc-error-text" style={{ marginBottom: "1rem" }}>{error}</p>}

            <button type="submit" className="dc-btn dc-btn-primary" style={{ width: "100%" }} disabled={isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="dc-auth-footer">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
