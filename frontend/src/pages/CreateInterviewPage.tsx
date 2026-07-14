import { useRef, useState } from "react";
import type { DragEvent, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "../components/Navbar";
import * as interviewsApi from "../api/interviews";

export default function CreateInterviewPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [duration, setDuration] = useState(45);
  const [resume, setResume] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleFile = (file: File | null) => {
    if (file && file.type !== "application/pdf") {
      setError("Resume must be a PDF file.");
      return;
    }
    setError(null);
    setResume(file);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragActive(false);
    handleFile(event.dataTransfer.files[0] ?? null);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);

    setSubmitting(true);
    try {
      const interview = await interviewsApi.createInterview({
        company,
        role,
        interview_type: interviewType,
        difficulty,
        planned_duration: duration,
        resume,
      });
      navigate(`/interviews/${interview.id}/session`);
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
    <div className="frame-nocturne" style={{ minHeight: "100vh" }}>
      <Navbar />

      <div style={{ padding: "48px 64px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ marginBottom: 40 }}>
          <Link to="/interviews" style={{ fontSize: 13, color: "var(--color-neutral-500)", textDecoration: "none" }}>
            ← Back to dashboard
          </Link>
          <h1 style={{ margin: "16px 0 8px 0" }}>Create interview session</h1>
          <p className="text-muted" style={{ fontSize: 14 }}>
            Set up your next practice interview. Upload your resume so the AI can tailor questions.
          </p>
        </div>

        <form className="form-container" onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 28 }}>
          {error && <div className="error-banner">{error}</div>}

          <div className="form-grid">
            <div className="field">
              <label htmlFor="company">Company</label>
              <input
                className="input"
                id="company"
                type="text"
                placeholder="e.g. Google, Meta, Apple"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="role">Role</label>
              <input
                className="input"
                id="role"
                type="text"
                placeholder="e.g. Backend Engineer, PM"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-grid">
            <div className="field">
              <label htmlFor="interview-type">Interview type</label>
              <select
                className="input"
                id="interview-type"
                value={interviewType}
                onChange={(e) => setInterviewType(e.target.value)}
                required
              >
                <option value="">Select type</option>
                <option value="Technical">Technical</option>
                <option value="Behavioral">Behavioral</option>
                <option value="System Design">System Design</option>
                <option value="Case Study">Case Study</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
            <div className="field">
              <label htmlFor="difficulty">Difficulty</label>
              <select
                className="input"
                id="difficulty"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                required
              >
                <option value="">Select level</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="duration">Planned duration (minutes)</label>
            <input
              className="input"
              id="duration"
              type="number"
              min={15}
              max={180}
              step={5}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              required
            />
            <p className="text-muted" style={{ fontSize: 12, marginTop: 6 }}>Typical interview: 45–60 minutes</p>
          </div>

          <div className="field">
            <label>Resume (optional)</label>
            <div
              className={`file-upload-box${dragActive ? " drag-active" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={handleDrop}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
              <p style={{ margin: "0 0 8px 0", fontWeight: 500 }}>Click to upload or drag and drop</p>
              <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>
                PDF only. Leave blank to use the resume on file from your profile settings, if any.
              </p>
              {resume && (
                <p className="text-muted" style={{ marginTop: 10, fontSize: 12 }}>Selected: {resume.name}</p>
              )}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginTop: 12 }}>
            <button className="btn btn-primary" type="submit" disabled={submitting} style={{ padding: "11px 24px", fontSize: 15 }}>
              {submitting ? "Creating…" : "Start interview"}
            </button>
            <Link className="btn btn-secondary" to="/interviews" style={{ padding: "11px 24px", fontSize: 15, textAlign: "center" }}>
              Cancel
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}
