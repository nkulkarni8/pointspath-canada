import { Component } from "react";

/**
 * Keeps a render failure in one tab from blanking the whole app. Reloading is
 * offered rather than a silent retry because the cached country data that most
 * likely triggered it is re-read on boot.
 */
export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("PointsPath crashed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div style={{
        minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
        background: "#0C0A09", color: "#FAFAF9", fontFamily: "'DM Sans',sans-serif", padding: 24,
      }}>
        <div style={{
          maxWidth: 420, textAlign: "center", background: "#1C1917",
          border: "1px solid #44403C", borderRadius: 16, padding: 32,
        }}>
          <div style={{ fontSize: 34, marginBottom: 14 }}>✈</div>
          <h1 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Something went wrong</h1>
          <p style={{ fontSize: 14, color: "#A8A29E", lineHeight: 1.6, marginBottom: 22 }}>
            PointsPath hit an unexpected error. Reloading usually clears it.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "linear-gradient(135deg,#A16207,#854D0E)", border: "none", borderRadius: 11,
              padding: "12px 24px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer",
              fontFamily: "'DM Sans',sans-serif",
            }}
          >
            Reload PointsPath
          </button>
        </div>
      </div>
    );
  }
}
