import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function HomePage() {
  return (
    <div className="frame-nocturne" style={{ minHeight: "100vh" }}>
      <Navbar />

      <section
        style={{
          padding: "88px 64px 96px",
          display: "grid",
          gridTemplateColumns: "1.1fr 0.9fr",
          gap: 56,
          alignItems: "center",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        <div>
          <span className="tag tag-outline">For students &amp; new grads</span>
          <h1 style={{ marginTop: 16, maxWidth: "9.5ch" }}>
            Walk into your next interview already having done it.
          </h1>
          <p style={{ fontSize: 17, opacity: 0.8, maxWidth: "46ch" }}>
            Interviewly is an AI interviewer that runs you through real technical, behavioral, and
            case-style questions — then tells you exactly what to fix.
          </p>
          <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
            <Link className="btn btn-primary" to="/register" style={{ padding: "12px 22px", fontSize: 15 }}>
              Start practicing free
            </Link>
            <a className="btn btn-secondary" href="#how-it-works" style={{ padding: "12px 22px", fontSize: 15 }}>
              See how it works
            </a>
          </div>
        </div>
        <div
          className="lighten stripe-placeholder"
          style={{ aspectRatio: "4/3.1", borderRadius: "var(--radius-lg)", color: "var(--color-neutral-600)" }}
        >
          mock interview session — screen capture
        </div>
      </section>

      <hr className="hr" style={{ margin: "0 64px" }} />

      <section style={{ padding: "72px 64px", maxWidth: 1280, margin: "0 auto" }}>
        <h6 style={{ color: "var(--color-accent)" }}>Why Interviewly</h6>
        <h2 style={{ maxWidth: "20ch", marginBottom: 40 }}>Everything you need to walk in ready.</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 20 }}>
          <div className="card elev-sm">
            <span className="card-kicker">Technical</span>
            <h3 className="card-title">Coding &amp; system design</h3>
            <p className="card-body">
              Live-coded questions and whiteboard-style system design, graded the way engineering
              interviewers actually grade.
            </p>
          </div>
          <div className="card elev-sm">
            <span className="card-kicker">Behavioral</span>
            <h3 className="card-title">Story-based prompts</h3>
            <p className="card-body">
              STAR-formatted behavioral questions with follow-ups, so you're not caught flat by
              "tell me about a time..."
            </p>
          </div>
          <div className="card elev-sm">
            <span className="card-kicker">Feedback</span>
            <h3 className="card-title">Instant, specific notes</h3>
            <p className="card-body">
              Every answer gets scored on clarity, structure and content — with a rewrite you can
              compare against.
            </p>
          </div>
        </div>
      </section>

      <hr className="hr" style={{ margin: "0 64px" }} />

      <section id="how-it-works" style={{ padding: "72px 64px", background: "var(--color-surface)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <h6 style={{ color: "var(--color-accent)" }}>Process</h6>
          <h2 style={{ marginBottom: 40 }}>How it works</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
            <div>
              <div className="tag tag-accent" style={{ marginBottom: 14 }}>01</div>
              <h4>Pick a track</h4>
              <p className="text-muted" style={{ fontSize: 14 }}>
                Choose the role, level and interview type you're prepping for.
              </p>
            </div>
            <div>
              <div className="tag tag-accent" style={{ marginBottom: 14 }}>02</div>
              <h4>Interview the AI</h4>
              <p className="text-muted" style={{ fontSize: 14 }}>
                Talk or type through a full session — the AI adapts its follow-ups to your answers.
              </p>
            </div>
            <div>
              <div className="tag tag-accent" style={{ marginBottom: 14 }}>03</div>
              <h4>Review &amp; improve</h4>
              <p className="text-muted" style={{ fontSize: 14 }}>
                Get a scorecard and a rewrite for every answer, then retry the ones that need work.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="faq" style={{ padding: "72px 64px 96px", maxWidth: 1280, margin: "0 auto" }}>
        <h6 style={{ color: "var(--color-accent)" }}>Questions</h6>
        <h2 style={{ marginBottom: 32 }}>FAQ</h2>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <details style={{ padding: "18px 0", borderTop: "1px solid var(--color-divider)" }}>
            <summary style={{ cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 500 }}>
              Is this actually useful if I've never interviewed before?
            </summary>
            <p className="text-muted" style={{ marginTop: 10, fontSize: 14, maxWidth: "60ch" }}>
              Yes — most students who use Interviewly are prepping for their first internship or
              job interview. The AI walks you through structure before it grades content.
            </p>
          </details>
          <details style={{ padding: "18px 0", borderTop: "1px solid var(--color-divider)" }}>
            <summary style={{ cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 500 }}>
              What kinds of interviews can I practice?
            </summary>
            <p className="text-muted" style={{ marginTop: 10, fontSize: 14, maxWidth: "60ch" }}>
              Technical (coding + system design), behavioral, and general case/fit interviews
              across most entry-level tracks.
            </p>
          </details>
          <details
            style={{
              padding: "18px 0",
              borderTop: "1px solid var(--color-divider)",
              borderBottom: "1px solid var(--color-divider)",
            }}
          >
            <summary style={{ cursor: "pointer", fontFamily: "var(--font-heading)", fontWeight: 500 }}>
              Is it free to start?
            </summary>
            <p className="text-muted" style={{ marginTop: 10, fontSize: 14, maxWidth: "60ch" }}>
              Yes, you can run your first few sessions at no cost before choosing a plan.
            </p>
          </details>
        </div>
      </section>

      <footer
        style={{
          padding: "32px 64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderTop: "1px solid var(--color-divider)",
        }}
      >
        <span className="text-muted" style={{ fontSize: 13 }}>© 2026 Interviewly</span>
        <div style={{ display: "flex", gap: 20 }}>
          <a href="#" style={{ fontSize: 13 }}>Privacy</a>
          <a href="#" style={{ fontSize: 13 }}>Terms</a>
        </div>
      </footer>
    </div>
  );
}
