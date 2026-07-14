import Navbar from "../components/Navbar";

export default function ProgressPage() {
  return (
    <div className="frame-nocturne" style={{ minHeight: "100vh" }}>
      <Navbar />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          minHeight: "70vh",
          padding: "48px 24px",
        }}
      >
        <span style={{ fontSize: 64, marginBottom: 16 }}>:)</span>
        <h1>Under development</h1>
      </div>
    </div>
  );
}
