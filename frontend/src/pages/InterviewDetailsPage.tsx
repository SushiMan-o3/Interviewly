import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import * as interviewsApi from "../api/interviews";
import type { Interview } from "../types";

function formatDateTime(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function InterviewDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [interview, setInterview] = useState<Interview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    interviewsApi
      .getInterview(Number(id))
      .then((data) => {
        if (!cancelled) {
          setInterview(data);
          setOpenId(data.QuestionAnswer[0]?.id ?? null);
        }
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load this interview.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return (
    <div className="frame-nocturne" style={{ minHeight: "100vh" }}>
      <Navbar />

      <div style={{ padding: "48px 64px", maxWidth: 1000, margin: "0 auto" }}>
        <Link to="/interviews" style={{ fontSize: 13, color: "var(--color-neutral-500)", textDecoration: "none" }}>
          ← Back to dashboard
        </Link>

        {loading && <div className="spinner-row">Loading interview…</div>}
        {error && <div className="error-banner" style={{ marginTop: 16 }}>{error}</div>}

        {interview && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", margin: "16px 0 32px 0" }}>
              <div>
                <h1 style={{ margin: "0 0 6px 0" }}>{interview.role}</h1>
                <p className="text-muted" style={{ fontSize: 15, margin: 0 }}>{interview.company}</p>
              </div>
              <div style={{ textAlign: "right" }}>
                <div className="score-badge">
                  {interview.overall_score ?? "—"}
                  <span style={{ fontSize: 14, color: "var(--color-neutral-500)", fontWeight: 400 }}>/ 10</span>
                </div>
                <p className="text-muted" style={{ fontSize: 12, margin: "4px 0 0 0" }}>Overall score</p>
              </div>
            </div>

            <div className="detail-grid">
              <div className="stat-box">
                <div className="label">Type</div>
                <div className="value">{interview.interview_type}</div>
              </div>
              <div className="stat-box">
                <div className="label">Difficulty</div>
                <div className="value">{interview.difficulty}</div>
              </div>
              <div className="stat-box">
                <div className="label">Planned duration</div>
                <div className="value">{interview.planned_duration} min</div>
              </div>
              <div className="stat-box">
                <div className="label">Actual duration</div>
                <div className="value">
                  {interview.start_time && interview.end_time
                    ? `${Math.round((new Date(interview.end_time).getTime() - new Date(interview.start_time).getTime()) / 60000)} min`
                    : "—"}
                </div>
              </div>
              <div className="stat-box">
                <div className="label">Started</div>
                <div className="value">{formatDateTime(interview.start_time)}</div>
              </div>
              <div className="stat-box">
                <div className="label">Ended</div>
                <div className="value">{formatDateTime(interview.end_time)}</div>
              </div>
              <div className="stat-box">
                <div className="label">Status</div>
                <div className="value">{interview.completed ? "Completed" : "In progress"}</div>
              </div>
              <div className="stat-box">
                <div className="label">Questions</div>
                <div className="value">{interview.QuestionAnswer.length}</div>
              </div>
            </div>

            <h3 style={{ marginBottom: 12 }}>Overall feedback</h3>
            <div className="feedback-box">
              <p style={{ margin: 0, fontSize: 14, lineHeight: 1.6, color: "var(--color-neutral-300)" }}>
                {interview.feedback ?? "Feedback hasn't been generated for this interview yet."}
              </p>
            </div>

            <h3 style={{ marginBottom: 12 }}>Questions &amp; answers</h3>
            {interview.QuestionAnswer.length === 0 && (
              <p className="text-muted" style={{ fontSize: 14 }}>No questions recorded for this interview yet.</p>
            )}
            <div>
              {interview.QuestionAnswer.map((q) => {
                const isOpen = openId === q.id;
                return (
                  <div className="qa-item" key={q.id}>
                    <button
                      type="button"
                      className="qa-question"
                      onClick={() => setOpenId(isOpen ? null : q.id)}
                    >
                      <span className="qa-question-text">{q.question_text}</span>
                      <svg
                        className={`qa-chevron${isOpen ? " open" : ""}`}
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>
                    <div className={`qa-body${isOpen ? " open" : ""}`}>
                      <div className="qa-body-inner">
                        {q.responses.length === 0 && (
                          <p className="text-muted" style={{ fontSize: 13, margin: 0 }}>No response recorded.</p>
                        )}
                        {q.responses.map((response) => (
                          <div key={response.id} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                            <div>
                              <div className="qa-section-label">Your answer (transcript)</div>
                              <div className="qa-transcript">{response.transcript_text ?? "—"}</div>
                            </div>
                            <div>
                              <div className="qa-section-label">
                                Feedback{response.score != null ? ` · Score: ${response.score}/10` : ""}
                              </div>
                              <div className="qa-feedback">{response.feedback ?? "—"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
