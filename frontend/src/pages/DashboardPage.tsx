import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import * as interviewsApi from "../api/interviews";
import type { InterviewSummary } from "../types";

type SortOption = "recent" | "oldest" | "completed" | "hard" | "medium" | "easy";

const PAGE_SIZE = 6;

export default function DashboardPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState<InterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sort, setSort] = useState<SortOption>("recent");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    interviewsApi
      .getInterviews(0, 200)
      .then((data) => {
        if (!cancelled) setInterviews(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your interviews. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(() => {
    const list = [...interviews];
    switch (sort) {
      case "oldest":
        return list.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "completed":
        return list.sort((a, b) => Number(b.completed) - Number(a.completed));
      case "hard":
        return list.filter((iv) => iv.difficulty.toLowerCase() === "hard");
      case "medium":
        return list.filter((iv) => iv.difficulty.toLowerCase() === "medium");
      case "easy":
        return list.filter((iv) => iv.difficulty.toLowerCase() === "easy");
      case "recent":
      default:
        return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
  }, [interviews, sort]);

  const displayed = sorted.slice(0, visibleCount);
  const completedCount = interviews.filter((iv) => iv.completed).length;

  const handleDelete = async (id: number) => {
    if (!window.confirm("Delete this interview? This can't be undone.")) return;
    setDeletingId(id);
    try {
      await interviewsApi.deleteInterview(id);
      setInterviews((prev) => prev.filter((iv) => iv.id !== id));
    } catch {
      setError("Couldn't delete that interview. Please try again.");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="frame-nocturne" style={{ minHeight: "100vh" }}>
      <Navbar />

      <div style={{ padding: "48px 64px", maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 40 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>Ready to practice again?</h1>
            <p className="text-muted" style={{ fontSize: 14 }}>
              You have {interviews.length} session{interviews.length === 1 ? "" : "s"}. {completedCount} completed.
            </p>
          </div>
          <Link className="btn btn-primary" to="/interviews/new" style={{ padding: "11px 20px", fontSize: 15 }}>
            + Create interview
          </Link>
        </div>

        {error && <div className="error-banner" style={{ marginBottom: 24 }}>{error}</div>}

        {!loading && interviews.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <label style={{ fontSize: 14, fontWeight: 500 }}>Sort by:</label>
              <select
                className="input"
                style={{ width: 180, padding: "8px 12px", fontSize: 14 }}
                value={sort}
                onChange={(e) => setSort(e.target.value as SortOption)}
              >
                <option value="recent">Most recent</option>
                <option value="oldest">Oldest first</option>
                <option value="completed">Completed first</option>
                <option value="hard">Difficulty: Hard</option>
                <option value="medium">Difficulty: Medium</option>
                <option value="easy">Difficulty: Easy</option>
              </select>
            </div>
          </div>
        )}

        {loading && <div className="spinner-row">Loading your interviews…</div>}

        {!loading && interviews.length > 0 && (
          <>
            <div className="interview-grid">
              {displayed.map((interview) => (
                <div className="interview-card" key={interview.id}>
                  <div className="interview-card-header">
                    <div>
                      <h4 style={{ margin: "0 0 6px 0" }}>{interview.role}</h4>
                      <p className="text-muted" style={{ margin: 0, fontSize: 13 }}>{interview.company}</p>
                    </div>
                    <span className={`interview-status ${interview.completed ? "completed" : "pending"}`}>
                      {interview.completed ? "Completed" : "In progress"}
                    </span>
                  </div>

                  <div className="interview-meta">
                    <div><span className="text-muted">Type:</span> {interview.interview_type}</div>
                    <div><span className="text-muted">Difficulty:</span> {interview.difficulty}</div>
                    <div><span className="text-muted">Duration:</span> {interview.planned_duration}m</div>
                  </div>

                  <p className="text-muted" style={{ fontSize: 12, margin: 0 }}>
                    {new Date(interview.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>

                  <div className="interview-card-actions">
                    {interview.completed ? (
                      <button
                        className="btn btn-secondary"
                        type="button"
                        style={{ padding: "9px 16px", fontSize: 13 }}
                        onClick={() => navigate(`/interviews/${interview.id}`)}
                      >
                        View details
                      </button>
                    ) : (
                      <button
                        className="btn btn-primary"
                        type="button"
                        style={{ padding: "9px 16px", fontSize: 13 }}
                        onClick={() => navigate(`/interviews/${interview.id}/session`)}
                      >
                        Join now
                      </button>
                    )}
                    <button
                      className="btn btn-danger"
                      type="button"
                      style={{ padding: "9px 16px", fontSize: 13 }}
                      disabled={deletingId === interview.id}
                      onClick={() => handleDelete(interview.id)}
                    >
                      {deletingId === interview.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {visibleCount < sorted.length && (
              <div style={{ display: "flex", justifyContent: "center", marginTop: 40 }}>
                <button
                  className="btn btn-secondary"
                  type="button"
                  style={{ padding: "11px 24px", fontSize: 15 }}
                  onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                >
                  Show more
                </button>
              </div>
            )}
          </>
        )}

        {!loading && interviews.length === 0 && !error && (
          <div className="empty-state">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: "var(--color-neutral-500)", marginBottom: 16 }}>
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <h3 style={{ margin: "0 0 8px 0" }}>No interviews yet</h3>
            <p className="text-muted" style={{ fontSize: 14, margin: "0 0 24px 0", maxWidth: 340 }}>
              Create your first practice session to start prepping for technical, behavioral, or
              any job interview.
            </p>
            <Link className="btn btn-primary" to="/interviews/new" style={{ padding: "11px 20px", fontSize: 15 }}>
              + Create interview
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
