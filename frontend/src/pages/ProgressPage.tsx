import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import * as interviewsApi from "../api/interviews";
import type { InterviewSummary } from "../types";

function startOfDay(date: Date): Date {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function dateKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function computeStats(interviews: InterviewSummary[]) {
  const completed = interviews.filter((iv) => iv.completed);
  const scored = completed.filter(
    (iv): iv is InterviewSummary & { overall_score: number } => iv.overall_score != null,
  );

  const totalHours = completed.reduce((sum, iv) => {
    if (iv.start_time && iv.end_time) {
      const hours = (new Date(iv.end_time).getTime() - new Date(iv.start_time).getTime()) / 3_600_000;
      return sum + Math.max(hours, 0);
    }
    return sum + iv.planned_duration / 60;
  }, 0);

  const avgScore = scored.length ? scored.reduce((sum, iv) => sum + iv.overall_score, 0) / scored.length : null;

  const activeDays = new Set(completed.map((iv) => dateKey(startOfDay(new Date(iv.start_time ?? iv.created_at)))));
  let cursor = startOfDay(new Date());
  if (!activeDays.has(dateKey(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (activeDays.has(dateKey(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }

  const scoreHistory = scored
    .map((iv) => ({ date: new Date(iv.start_time ?? iv.created_at), score: iv.overall_score }))
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(-8);

  const typeCounts = new Map<string, number>();
  interviews.forEach((iv) => typeCounts.set(iv.interview_type, (typeCounts.get(iv.interview_type) ?? 0) + 1));
  const byType = Array.from(typeCounts.entries()).sort((a, b) => b[1] - a[1]);

  const weekStart = addDays(startOfDay(new Date()), -35);
  const weeklyActivity = Array.from({ length: 6 }, (_, i) => {
    const start = addDays(weekStart, i * 7);
    const end = addDays(start, 7);
    const count = interviews.filter((iv) => {
      const created = new Date(iv.created_at);
      return created >= start && created < end;
    }).length;
    return { start, count };
  });

  return {
    completedCount: completed.length,
    avgScore,
    totalHours,
    streak,
    scoreHistory,
    byType,
    weeklyActivity,
  };
}

function ScoreOverTimeChart({ history }: { history: { date: Date; score: number }[] }) {
  if (history.length === 0) {
    return <div className="chart-empty">Complete an interview to start tracking your score.</div>;
  }

  const width = 560;
  const height = 200;
  const top = 20;
  const baseline = 160;
  const scoreToY = (score: number) => baseline - (Math.max(0, Math.min(10, score)) / 10) * (baseline - top);
  const xFor = (i: number) => (history.length === 1 ? width / 2 : (i / (history.length - 1)) * width);

  const points = history.map((h, i) => ({ x: xFor(i), y: scoreToY(h.score), ...h }));
  const linePoints = points.map((p) => `${p.x},${p.y}`).join(" ");
  const areaPoints = `${points[0].x},${baseline} ${linePoints} ${points[points.length - 1].x},${baseline}`;
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height} style={{ overflow: "visible" }}>
      <line x1={0} y1={baseline} x2={width} y2={baseline} stroke="var(--color-divider)" strokeWidth={1} />
      <polygon points={areaPoints} fill="var(--color-accent)" opacity={0.1} />
      <polyline
        points={linePoints}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {points.map((p, i) => (
        <g key={i}>
          <title>
            {p.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: {p.score.toFixed(1)} / 10
          </title>
          <circle cx={p.x} cy={p.y} r={6} fill="var(--color-surface)" />
          <circle cx={p.x} cy={p.y} r={4} fill="var(--color-accent)" />
        </g>
      ))}
      <text x={last.x} y={last.y - 14} textAnchor="end" fill="var(--color-text)" fontSize={13} fontWeight={500}>
        {last.score.toFixed(1)}
      </text>
    </svg>
  );
}

function WeeklyActivityChart({ weeks }: { weeks: { start: Date; count: number }[] }) {
  const width = 480;
  const height = 160;
  const baseline = 140;
  const maxCount = Math.max(1, ...weeks.map((w) => w.count));
  const bandWidth = width / weeks.length;
  const barWidth = 24;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} width="100%" height={height}>
      <line x1={0} y1={baseline} x2={width} y2={baseline} stroke="var(--color-divider)" strokeWidth={1} />
      {weeks.map((w, i) => {
        const cx = bandWidth * i + bandWidth / 2;
        const barHeight = w.count === 0 ? 0 : Math.max(6, (w.count / maxCount) * (baseline - 10));
        const isLast = i === weeks.length - 1;
        return (
          <g key={i}>
            <title>
              Week of {w.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}: {w.count} session
              {w.count === 1 ? "" : "s"}
            </title>
            {barHeight > 0 && (
              <>
                <rect
                  x={cx - barWidth / 2}
                  y={baseline - barHeight}
                  width={barWidth}
                  height={barHeight}
                  rx={4}
                  fill="var(--color-accent)"
                  opacity={isLast ? 1 : 0.55}
                />
                <rect
                  x={cx - barWidth / 2}
                  y={baseline - 4}
                  width={barWidth}
                  height={4}
                  fill="var(--color-accent)"
                  opacity={isLast ? 1 : 0.55}
                />
              </>
            )}
            {isLast && w.count > 0 && (
              <text x={cx} y={baseline - barHeight - 8} textAnchor="middle" fill="var(--color-text)" fontSize={12} fontWeight={500}>
                {w.count}
              </text>
            )}
            <text x={cx} y={baseline + 16} textAnchor="middle" fill="var(--color-neutral-500)" fontSize={10}>
              {w.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ProgressPage() {
  const [interviews, setInterviews] = useState<InterviewSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    interviewsApi
      .getInterviews(0, 500)
      .then((data) => {
        if (!cancelled) setInterviews(data);
      })
      .catch(() => {
        if (!cancelled) setError("Couldn't load your progress. Please refresh.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => computeStats(interviews), [interviews]);
  const maxTypeCount = Math.max(1, ...stats.byType.map(([, count]) => count));

  return (
    <div className="frame-nocturne" style={{ minHeight: "100vh" }}>
      <Navbar />

      <div style={{ position: "relative", padding: "48px 64px", maxWidth: 1280, margin: "0 auto" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(10, 11, 20, 0.85)",
            backdropFilter: "blur(6px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 30,
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 56, marginBottom: 12 }}>:)</div>
          <h1 style={{ margin: 0, fontSize: 40 }}>Under development</h1>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <h1 style={{ marginBottom: 4 }}>Your progress</h1>
            <p className="text-muted" style={{ fontSize: 14, margin: 0 }}>
              A look at how your practice is trending.
            </p>
          </div>
          <Link className="btn btn-primary" to="/interviews/new" style={{ padding: "11px 20px", fontSize: 15, whiteSpace: "nowrap" }}>
            + Create interview
          </Link>
        </div>

        {loading && <div className="spinner-row">Loading your progress…</div>}
        {error && <div className="error-banner" style={{ marginBottom: 24 }}>{error}</div>}

        {!loading && !error && interviews.length === 0 && (
          <div className="empty-state">
            <h3 style={{ margin: "0 0 8px 0" }}>Nothing to show yet</h3>
            <p className="text-muted" style={{ fontSize: 14, margin: "0 0 24px 0", maxWidth: 340 }}>
              Complete a few practice interviews and your stats and trends will show up here.
            </p>
            <Link className="btn btn-primary" to="/interviews/new" style={{ padding: "11px 20px", fontSize: 15 }}>
              + Create interview
            </Link>
          </div>
        )}

        {!loading && !error && interviews.length > 0 && (
          <>
            <div className="detail-grid">
              <div className="stat-box">
                <div className="label">Total interviews</div>
                <div className="value">{interviews.length}</div>
              </div>
              <div className="stat-box">
                <div className="label">Average score</div>
                <div className="value">{stats.avgScore != null ? `${stats.avgScore.toFixed(1)} / 10` : "—"}</div>
              </div>
              <div className="stat-box">
                <div className="label">Practice time</div>
                <div className="value">{stats.totalHours.toFixed(1)} hrs</div>
              </div>
              <div className="stat-box">
                <div className="label">Current streak</div>
                <div className="value">
                  {stats.streak} {stats.streak === 1 ? "day" : "days"}
                </div>
              </div>
            </div>

            <div className="chart-grid">
              <div className="chart-card">
                <h3>Score over time</h3>
                <p className="chart-sub">Overall score per completed interview, most recent sessions</p>
                <ScoreOverTimeChart history={stats.scoreHistory} />
              </div>

              <div className="chart-card">
                <h3>Average score</h3>
                <p className="chart-sub">
                  Across {stats.completedCount} completed interview{stats.completedCount === 1 ? "" : "s"}
                </p>
                {stats.avgScore != null ? (
                  <>
                    <div className="meter-track">
                      <div className="meter-fill" style={{ width: `${(stats.avgScore / 10) * 100}%` }} />
                    </div>
                    <div style={{ marginTop: 10, fontSize: 20, fontWeight: 500 }}>
                      {stats.avgScore.toFixed(1)}
                      <span style={{ fontSize: 13, color: "var(--color-neutral-500)" }}> / 10</span>
                    </div>
                  </>
                ) : (
                  <div className="chart-empty">Complete an interview to see your average score.</div>
                )}
              </div>
            </div>

            <div className="two-col">
              <div className="chart-card">
                <h3>Interviews by type</h3>
                <p className="chart-sub">Sessions started per category</p>
                {stats.byType.map(([type, count]) => (
                  <div className="bar-row" key={type}>
                    <span className="bar-label">{type}</span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(count / maxTypeCount) * 100}%` }} />
                    </div>
                    <span className="bar-value">{count}</span>
                  </div>
                ))}
              </div>

              <div className="chart-card">
                <h3>Weekly activity</h3>
                <p className="chart-sub">Sessions started per week, last 6 weeks</p>
                <WeeklyActivityChart weeks={stats.weeklyActivity} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
