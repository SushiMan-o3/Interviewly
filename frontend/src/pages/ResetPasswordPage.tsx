import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import axios from "axios";
import * as authApi from "../api/auth";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!token) {
      setError("This reset link is missing its token. Request a new one.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setDone(true);
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.data?.detail) {
        setError(String(err.response.data.detail));
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="frame-nocturne" style={{ minHeight: "100vh", display: "grid", gridTemplateColumns: "1fr 1fr" }}>
      <div style={{ padding: "48px 64px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Link className="brand-link" to="/">
          <span className="nav-brand">Interviewly</span>
        </Link>
        <div style={{ maxWidth: "34ch" }}>
          <h6 style={{ color: "var(--color-accent)" }}>Almost there</h6>
          <h1 style={{ maxWidth: "10ch" }}>Choose a new password.</h1>
        </div>
        <p className="text-muted" style={{ fontSize: 13 }}>© 2026 Interviewly</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", padding: "48px 64px", borderLeft: "1px solid var(--color-divider)" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ marginBottom: 4 }}>Set a new password</h2>
          <p className="text-muted" style={{ fontSize: 14, marginBottom: 28 }}>
            <Link to="/login">Back to log in</Link>
          </p>

          {done ? (
            <div className="success-banner">
              Your password has been reset. <Link to="/login">Log in</Link> with your new password.
            </div>
          ) : !token ? (
            <div className="error-banner">
              This reset link is invalid. <Link to="/forgot-password">Request a new one</Link>.
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {error && <div className="error-banner">{error}</div>}

              <div className="field">
                <label htmlFor="reset-pw">New password</label>
                <input
                  className="input"
                  id="reset-pw"
                  type="password"
                  placeholder="At least 8 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="reset-pw-confirm">Confirm password</label>
                <input
                  className="input"
                  id="reset-pw-confirm"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>

              <button
                className="btn btn-primary btn-block"
                type="submit"
                disabled={submitting}
                style={{ padding: 11, fontSize: 15 }}
              >
                {submitting ? "Resetting…" : "Reset password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
