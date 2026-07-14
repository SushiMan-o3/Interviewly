import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login({ identifier, password });
      navigate("/interviews");
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
          <h6 style={{ color: "var(--color-accent)" }}>Welcome back</h6>
          <h1 style={{ maxWidth: "8ch" }}>Pick up where you left off.</h1>
          <p style={{ fontSize: 15, opacity: 0.75 }}>
            Your saved tracks, scorecards and past sessions are waiting.
          </p>
        </div>
        <p className="text-muted" style={{ fontSize: 13 }}>© 2026 Interviewly</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", padding: "48px 64px", borderLeft: "1px solid var(--color-divider)" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ marginBottom: 4 }}>Log in</h2>
          <p className="text-muted" style={{ fontSize: 14, marginBottom: 28 }}>
            New here? <Link to="/register">Create an account</Link>
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {error && <div className="error-banner">{error}</div>}

            <div className="field">
              <label htmlFor="login-id">Username or email</label>
              <input
                className="input"
                id="login-id"
                type="text"
                placeholder="you@example.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="login-pw">Password</label>
              <input
                className="input"
                id="login-pw"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={submitting}
              style={{ padding: 11, fontSize: 15 }}
            >
              {submitting ? "Logging in…" : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
