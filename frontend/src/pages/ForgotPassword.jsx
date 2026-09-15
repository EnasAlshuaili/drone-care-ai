import { useState } from "react";
import { Link } from "react-router-dom";
import { forgotPassword } from "../api/auth.js";
import { getErrorMessage } from "../api/errors.js";
import { IconMail } from "../components/icons.jsx";

// Uses the existing (unmodified) POST /auth/forgot-password endpoint. The
// backend deliberately returns the same generic message whether or not the
// email is registered (SRS §3.1) — this page never claims more than that.
export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setError(getErrorMessage(err, "Could not process that request."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="dc-auth" style={{ gridTemplateColumns: "1fr" }}>
      <div className="dc-auth-form-side">
        <div className="dc-auth-card">
          <div className="dc-auth-brand" style={{ marginBottom: "1.5rem" }}>
            <img src="/branding/dronecare-mark-128.png" alt="DroneCare" style={{ width: 40, height: 40 }} />
            <span className="dc-auth-brand-name" style={{ fontSize: "1.2rem" }}>
              Drone<span>Care</span>
            </span>
          </div>

          <h1>Reset your password</h1>
          <p className="dc-auth-card-subtitle">Enter your account email and we'll start a password reset.</p>

          {message ? (
            <p className="dc-muted">{message}</p>
          ) : (
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

              {error && <p className="dc-error-text" style={{ marginBottom: "1rem" }}>{error}</p>}

              <button type="submit" className="dc-btn dc-btn-primary" style={{ width: "100%" }} disabled={isSubmitting}>
                {isSubmitting ? "Sending…" : "Send reset instructions"}
              </button>
            </form>
          )}

          <p className="dc-auth-footer">
            <Link to="/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
