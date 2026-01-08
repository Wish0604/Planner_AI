import { useState, useEffect } from "react";

export default function ExplanationViewer({ projectId, userId, visible = true }) {
  const [explanations, setExplanations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    if (visible && userId && projectId) {
      loadExplanations();
    }
  }, [userId, projectId, visible]);

  const loadExplanations = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const res = await fetch(
        `${apiUrl}/api/xai/explanations?userId=${userId}&projectId=${projectId}`
      );
      if (!res.ok) throw new Error("Failed to load explanations");
      const data = await res.json();
      setExplanations(data.explanations || []);
      setError("");
    } catch (err) {
      setError(err.message);
      console.error("Error loading explanations:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
        <div style={{ fontSize: "18px", marginBottom: "10px" }}>🔍</div>
        Loading explanations...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "15px",
          background: "#fee",
          border: "1px solid #fcc",
          borderRadius: "8px",
          color: "#c33",
        }}
      >
        ❌ {error}
      </div>
    );
  }

  if (!explanations || explanations.length === 0) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
        No explanations recorded yet
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#1a1a1a",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #333",
        marginTop: "20px",
      }}
    >
      <h2 style={{ marginTop: 0, fontSize: "18px", color: "#10a37f" }}>
        🔍 AI Reasoning & Explanations
      </h2>
      <p style={{ color: "#999", fontSize: "13px", marginBottom: "15px" }}>
        Why each agent made its decisions
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {explanations.slice(0, 5).map((exp) => (
          <div
            key={exp.id}
            style={{
              background: "#262626",
              padding: "15px",
              borderRadius: "8px",
              border: "1px solid #333",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onClick={() =>
              setExpandedId(expandedId === exp.id ? null : exp.id)
            }
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "10px",
              }}
            >
              <div>
                <div style={{ fontWeight: "600", fontSize: "14px" }}>
                  🤖 {exp.agentName?.toUpperCase()}
                </div>
                <div style={{ fontSize: "12px", color: "#999" }}>
                  {exp.decisionType}
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {/* Confidence Badge */}
                <div
                  style={{
                    background: getConfidenceColor(exp.confidenceScore),
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    fontWeight: "600",
                  }}
                >
                  {(exp.confidenceScore * 100).toFixed(0)}% confidence
                </div>
                <span style={{ color: "#999" }}>
                  {expandedId === exp.id ? "▼" : "▶"}
                </span>
              </div>
            </div>

            {/* Decision Summary */}
            <div style={{ fontSize: "13px", color: "#ddd", marginBottom: "10px" }}>
              {exp.decision}
            </div>

            {/* Expandable Details */}
            {expandedId === exp.id && (
              <div style={{ marginTop: "15px", borderTop: "1px solid #333", paddingTop: "15px" }}>
                {/* Explanation */}
                <div style={{ marginBottom: "15px" }}>
                  <div
                    style={{
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#10a37f",
                      marginBottom: "6px",
                    }}
                  >
                    💭 Explanation
                  </div>
                  <div style={{ fontSize: "12px", color: "#ccc", lineHeight: "1.5" }}>
                    {exp.explanation}
                  </div>
                </div>

                {/* Reasoning Steps */}
                {exp.reasoning_steps && exp.reasoning_steps.length > 0 && (
                  <div style={{ marginBottom: "15px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#2196F3",
                        marginBottom: "6px",
                      }}
                    >
                      📋 Reasoning Steps
                    </div>
                    <ol
                      style={{
                        margin: 0,
                        paddingLeft: "20px",
                        fontSize: "12px",
                        color: "#999",
                      }}
                    >
                      {exp.reasoning_steps.map((step, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>
                          {step}
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* Key Factors */}
                {exp.key_factors && exp.key_factors.length > 0 && (
                  <div style={{ marginBottom: "15px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#FFD700",
                        marginBottom: "6px",
                      }}
                    >
                      ⭐ Key Factors
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "6px",
                      }}
                    >
                      {exp.key_factors.map((factor, i) => (
                        <span
                          key={i}
                          style={{
                            background: "#333",
                            padding: "4px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                            color: "#ccc",
                          }}
                        >
                          {factor}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Alternatives */}
                {exp.alternatives && exp.alternatives.length > 0 && (
                  <div style={{ marginBottom: "15px" }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#ff9800",
                        marginBottom: "6px",
                      }}
                    >
                      🔀 Alternatives Considered
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "20px",
                        fontSize: "12px",
                        color: "#999",
                      }}
                    >
                      {exp.alternatives.map((alt, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>
                          {alt}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Evidence */}
                {exp.evidence && exp.evidence.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "#4CAF50",
                        marginBottom: "6px",
                      }}
                    >
                      ✅ Evidence
                    </div>
                    <ul
                      style={{
                        margin: 0,
                        paddingLeft: "20px",
                        fontSize: "12px",
                        color: "#999",
                      }}
                    >
                      {exp.evidence.map((ev, i) => (
                        <li key={i} style={{ marginBottom: "4px" }}>
                          {ev}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Timestamp */}
                <div
                  style={{
                    marginTop: "15px",
                    paddingTop: "15px",
                    borderTop: "1px solid #333",
                    fontSize: "11px",
                    color: "#666",
                  }}
                >
                  {new Date(exp.timestamp).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        onClick={loadExplanations}
        style={{
          marginTop: "15px",
          padding: "8px 12px",
          background: "#10a37f",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        🔄 Refresh
      </button>
    </div>
  );
}

function getConfidenceColor(score) {
  if (score >= 0.9) return "#4caf50"; // Green
  if (score >= 0.75) return "#8bc34a"; // Light green
  if (score >= 0.6) return "#ffeb3b"; // Yellow
  if (score >= 0.4) return "#ff9800"; // Orange
  return "#f44336"; // Red
}
