import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import * as authApi from "../api/auth";

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await authApi.forgetPassword(identifier);
    } catch {
      // Intentionally ignored: we show the same confirmation either way
      // so this form can't be used to check which accounts exist.
    } finally {
      setSubmitting(false);
      setSent(true);
    }
  };

  return (
    <div className="frame-nocturne" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <div style={{ padding: "48px 64px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Link className="brand-link" to="/">
          <span className="nav-brand">Interviewly</span>
        </Link>
        <div style={{ maxWidth: "34ch" }}>
          <h6 style={{ color: "var(--color-accent)" }}>Locked out?</h6>
          <h1 style={{ maxWidth: "10ch" }}>Let's get you back in.</h1>
          <p style={{ fontSize: 15, opacity: 0.75 }}>
            Enter your username or email and we'll send a link to reset your password.
          </p>
        </div>
        <p className="text-muted" style={{ fontSize: 13 }}>© 2026 Interviewly</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", padding: "48px 64px", borderLeft: "1px solid var(--color-divider)" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ marginBottom: 4 }}>Reset your password</h2>
          <p className="text-muted" style={{ fontSize: 14, marginBottom: 28 }}>
            Remembered it? <Link to="/login">Log in</Link>
          </p>

          {sent ? (
            <div className="success-banner">
              If an account matches, we've sent a reset link to its email address. Check your inbox
              — and your spam/junk folder, since it can end up there.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div className="field">
                <label htmlFor="forgot-id">Username or email</label>
                <input
                  className="input"
                  id="forgot-id"
                  type="text"
                  placeholder="you@example.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>

              <button
                className="btn btn-primary btn-block"
                type="submit"
                disabled={submitting}
                style={{ padding: 11, fontSize: 15 }}
              >
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
