import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setEmailError(null);

    if (!EMAIL_REGEX.test(email)) {
      setEmailError("Invalid email");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      await register({ name, username, email, password });
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
          <h6 style={{ color: "var(--color-accent)" }}>Get started</h6>
          <h1 style={{ maxWidth: "9ch" }}>Start practicing in the next two minutes.</h1>
          <p style={{ fontSize: 15, opacity: 0.75 }}>
            Free to try — no card required to run your first session.
          </p>
        </div>
        <p className="text-muted" style={{ fontSize: 13 }}>© 2026 Interviewly</p>
      </div>

      <div style={{ display: "flex", alignItems: "center", padding: "48px 64px", borderLeft: "1px solid var(--color-divider)" }}>
        <div style={{ width: "100%", maxWidth: 380 }}>
          <h2 style={{ marginBottom: 4 }}>Create an account</h2>
          <p className="text-muted" style={{ fontSize: 14, marginBottom: 28 }}>
            Already have one? <Link to="/login">Log in</Link>
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {error && <div className="error-banner">{error}</div>}

            <div className="field">
              <label htmlFor="reg-name">Full name</label>
              <input
                className="input"
                id="reg-name"
                type="text"
                placeholder="Jordan Lee"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="reg-username">Username</label>
              <input
                className="input"
                id="reg-username"
                type="text"
                placeholder="jordanlee"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="reg-email">Email</label>
              <input
                className="input"
                id="reg-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError(null);
                }}
                required
              />
              {emailError && (
                <p style={{ color: "#ef4444", fontSize: 12, marginTop: 6 }}>{emailError}</p>
              )}
            </div>
            <div className="field">
              <label htmlFor="reg-pw">Password</label>
              <input
                className="input"
                id="reg-pw"
                type="password"
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <button
              className="btn btn-primary btn-block"
              type="submit"
              disabled={submitting}
              style={{ padding: 11, fontSize: 15 }}
            >
              {submitting ? "Creating account…" : "Create account"}
            </button>

            <p className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>
              By creating an account you agree to our <a href="#">Terms</a> and{" "}
              <a href="#">Privacy Policy</a>.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
