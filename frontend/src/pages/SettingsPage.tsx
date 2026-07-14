import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import * as settingsApi from "../api/settings";
import { useAuth } from "../context/AuthContext";

const EXPERIENCE_OPTIONS = [
  "Student / no experience",
  "Entry level (0-2 years)",
  "Mid level (2-5 years)",
  "Senior (5+ years)",
];

function errorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err) && err.response?.data?.detail) {
    return String(err.response.data.detail);
  }
  return fallback;
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Profile
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);

  // Additional info
  const [targetRole, setTargetRole] = useState("");
  const [experience, setExperience] = useState("");
  const [industry, setIndustry] = useState("");
  const [hasResume, setHasResume] = useState(false);
  const [resume, setResume] = useState<File | null>(null);
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoSuccess, setInfoSuccess] = useState<string | null>(null);

  // Delete account
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([settingsApi.getProfile(), settingsApi.getAdditionalInfo()])
      .then(([profile, info]) => {
        if (cancelled) return;
        setName(profile.name);
        setUsername(profile.username);
        setEmail(profile.email);
        setTargetRole(info.target_role ?? "");
        setExperience(info.experience ?? "");
        setIndustry(info.industry ?? "");
        setHasResume(info.has_resume);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Couldn't load your settings. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSaveProfile = async (event: FormEvent) => {
    event.preventDefault();
    setProfileError(null);
    setProfileSuccess(null);
    setProfileSaving(true);
    try {
      const updated = await settingsApi.updateProfile({ name, username, email });
      setName(updated.name);
      setUsername(updated.username);
      setEmail(updated.email);
      setProfileSuccess("Profile saved.");
    } catch (err) {
      setProfileError(errorMessage(err, "Couldn't save your profile. Please try again."));
    } finally {
      setProfileSaving(false);
    }
  };

  const handleUpdatePassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("New password and confirmation don't match.");
      return;
    }

    setPasswordSaving(true);
    try {
      await settingsApi.updatePassword({ current_password: currentPassword, new_password: newPassword });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordSuccess("Password updated.");
    } catch (err) {
      setPasswordError(errorMessage(err, "Couldn't update your password. Please try again."));
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleSaveAdditionalInfo = async (event: FormEvent) => {
    event.preventDefault();
    setInfoError(null);
    setInfoSuccess(null);
    setInfoSaving(true);
    try {
      const updated = await settingsApi.updateAdditionalInfo({ target_role: targetRole, experience, industry, resume });
      setTargetRole(updated.target_role ?? "");
      setExperience(updated.experience ?? "");
      setIndustry(updated.industry ?? "");
      setHasResume(updated.has_resume);
      setResume(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setInfoSuccess("Additional information saved.");
    } catch (err) {
      setInfoError(errorMessage(err, "Couldn't save this information. Please try again."));
    } finally {
      setInfoSaving(false);
    }
  };

  const handleResumeChange = (file: File | null) => {
    if (file && file.type !== "application/pdf") {
      setInfoError("Resume must be a PDF file.");
      return;
    }
    setInfoError(null);
    setResume(file);
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Are you sure you want to permanently delete your account? This can't be undone.")) return;
    setDeleteError(null);
    setDeleting(true);
    try {
      await settingsApi.deleteAccount();
      logout();
      navigate("/");
    } catch (err) {
      setDeleteError(errorMessage(err, "Couldn't delete your account. Please try again."));
      setDeleting(false);
    }
  };

  return (
    <div className="frame-nocturne" style={{ minHeight: "100vh" }}>
      <Navbar />

      <div style={{ padding: "48px 64px", maxWidth: 780, margin: "0 auto" }}>
        <h1 style={{ marginBottom: 4 }}>Settings</h1>
        <p className="text-muted" style={{ fontSize: 14, marginBottom: 40 }}>
          Manage your account and preferences.
        </p>

        {loading && <div className="spinner-row">Loading your settings…</div>}
        {loadError && <div className="error-banner" style={{ marginBottom: 24 }}>{loadError}</div>}

        {!loading && !loadError && (
          <>
            <div className="settings-section">
              <h3>Profile</h3>
              <p className="text-muted section-desc" style={{ fontSize: 13 }}>
                This is how you'll appear across Interviewly.
              </p>
              <form style={{ display: "flex", flexDirection: "column", gap: 20 }} onSubmit={handleSaveProfile}>
                {profileError && <div className="error-banner">{profileError}</div>}
                {profileSuccess && <div className="success-banner">{profileSuccess}</div>}
                <div className="settings-row">
                  <div className="field">
                    <label htmlFor="profile-name">Full name</label>
                    <input
                      className="input"
                      id="profile-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="profile-username">Username</label>
                    <input
                      className="input"
                      id="profile-username"
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="profile-email">Email</label>
                  <input
                    className="input"
                    id="profile-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <button className="btn btn-primary" type="submit" disabled={profileSaving} style={{ padding: "10px 20px", fontSize: 14 }}>
                    {profileSaving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>

            <div className="settings-section">
              <h3>Password</h3>
              <p className="text-muted section-desc" style={{ fontSize: 13 }}>
                Update your password to keep your account secure.
              </p>
              <form style={{ display: "flex", flexDirection: "column", gap: 20 }} onSubmit={handleUpdatePassword}>
                {passwordError && <div className="error-banner">{passwordError}</div>}
                {passwordSuccess && <div className="success-banner">{passwordSuccess}</div>}
                <div className="field">
                  <label htmlFor="current-password">Current password</label>
                  <input
                    className="input"
                    id="current-password"
                    type="password"
                    placeholder="••••••••"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="settings-row">
                  <div className="field">
                    <label htmlFor="new-password">New password</label>
                    <input
                      className="input"
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="confirm-password">Confirm new password</label>
                    <input
                      className="input"
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div>
                  <button className="btn btn-primary" type="submit" disabled={passwordSaving} style={{ padding: "10px 20px", fontSize: 14 }}>
                    {passwordSaving ? "Updating…" : "Update password"}
                  </button>
                </div>
              </form>
            </div>

            <div className="settings-section">
              <h3>Additional information</h3>
              <p className="text-muted section-desc" style={{ fontSize: 13 }}>
                Helps us tailor your interview questions and feedback.
              </p>
              <form style={{ display: "flex", flexDirection: "column", gap: 20 }} onSubmit={handleSaveAdditionalInfo}>
                {infoError && <div className="error-banner">{infoError}</div>}
                {infoSuccess && <div className="success-banner">{infoSuccess}</div>}
                <div className="settings-row">
                  <div className="field">
                    <label htmlFor="target-role">Target role</label>
                    <input
                      className="input"
                      id="target-role"
                      type="text"
                      placeholder="e.g. Software Engineer"
                      value={targetRole}
                      onChange={(e) => setTargetRole(e.target.value)}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="experience">Experience level</label>
                    <select
                      className="input"
                      id="experience"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                    >
                      <option value="">Select level</option>
                      {EXPERIENCE_OPTIONS.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="field">
                  <label htmlFor="industry">Industry</label>
                  <input
                    className="input"
                    id="industry"
                    type="text"
                    placeholder="e.g. Technology, Finance, Healthcare"
                    value={industry}
                    onChange={(e) => setIndustry(e.target.value)}
                  />
                </div>
                <div className="field">
                  <label>Resume</label>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span className="text-muted" style={{ fontSize: 13 }}>
                      {resume ? resume.name : hasResume ? "Resume on file" : "No resume uploaded"}
                    </span>
                    <button
                      className="btn btn-secondary"
                      type="button"
                      style={{ padding: "8px 16px", fontSize: 13 }}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Upload new
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="application/pdf"
                      style={{ display: "none" }}
                      onChange={(e) => handleResumeChange(e.target.files?.[0] ?? null)}
                    />
                  </div>
                </div>
                <div>
                  <button className="btn btn-primary" type="submit" disabled={infoSaving} style={{ padding: "10px 20px", fontSize: 14 }}>
                    {infoSaving ? "Saving…" : "Save changes"}
                  </button>
                </div>
              </form>
            </div>

            <div className="settings-section danger-section">
              <h3>Delete account</h3>
              <p className="text-muted section-desc" style={{ fontSize: 13 }}>
                Permanently delete your account and all interview history. This can't be undone.
              </p>
              {deleteError && <div className="error-banner" style={{ marginBottom: 16 }}>{deleteError}</div>}
              <button
                className="btn btn-danger"
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                style={{ padding: "10px 20px", fontSize: 14 }}
              >
                {deleting ? "Deleting…" : "Delete my account"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
