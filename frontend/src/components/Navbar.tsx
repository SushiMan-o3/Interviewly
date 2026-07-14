import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav
      className="nav"
      style={{ background: "var(--color-surface)", boxShadow: "var(--shadow-sm)", position: "sticky", top: 0, zIndex: 20 }}
    >
      <Link className="brand-link" to="/">
        <span className="nav-brand">Interviewly</span>
      </Link>

      {isAuthenticated ? (
        <>
          <Link to="/dashboard">Dashboard</Link>
          <Link to="/interviews">Interviews</Link>
          <Link to="/settings">Settings</Link>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
            <button className="btn btn-secondary" type="button" onClick={handleLogout}>
              Log out
            </button>
          </div>
        </>
      ) : (
        <>
          <Link to="/">Product</Link>
          <a href="/#how-it-works">How it works</a>
          <a href="/#faq">FAQ</a>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
            <Link className="btn btn-secondary" to="/login">
              Log in
            </Link>
            <Link className="btn btn-primary" to="/register">
              Get started
            </Link>
          </div>
        </>
      )}
    </nav>
  );
}
