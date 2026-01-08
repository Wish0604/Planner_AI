import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";

const AUDIT_CATEGORIES = {
  task_reassigned: { icon: "🔄", label: "Task Reassigned", color: "#2196F3" },
  agent_activated: { icon: "🤖", label: "Agent Activated", color: "#9C27B0" },
  risk_escalated: { icon: "⚠️", label: "Risk Escalated", color: "#F44336" },
  priority_changed: { icon: "📌", label: "Priority Changed", color: "#FF9800" },
  resource_allocated: { icon: "📦", label: "Resource Allocated", color: "#00BCD4" },
  deadline_adjusted: { icon: "⏰", label: "Deadline Adjusted", color: "#FFC107" },
  dependency_detected: { icon: "🔗", label: "Dependency Detected", color: "#4CAF50" },
  blocker_resolved: { icon: "✅", label: "Blocker Resolved", color: "#8BC34A" },
  escalation_triggered: { icon: "🚨", label: "Escalation Triggered", color: "#E91E63" },
  status_update: { icon: "📊", label: "Status Update", color: "#3F51B5" },
};

export default function AuditTrailDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [projectId, setProjectId] = useState("");
  const [auditTrail, auditTrailData] = useState([]);
  const [confidenceScores, setConfidenceScores] = useState([]);
  const [xaiAnalytics, setXaiAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterAgent, setFilterAgent] = useState("");
  const [minConfidence, setMinConfidence] = useState(0);

  useEffect(() => {
    if (user?.uid) {
      // Auto-load from localStorage or URL param
      const stored = localStorage.getItem("currentProjectId");
      if (stored) {
        setProjectId(stored);
        loadAuditData(stored);
      }
    }
  }, [user?.uid]);

  const loadAuditData = async (pId) => {
    if (!pId || !user?.uid) return;

    setLoading(true);
    setError("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

      // Load audit trail
      const auditRes = await fetch(
        `${apiUrl}/api/xai/audit-trail?userId=${user.uid}&projectId=${pId}`
      );
      if (!auditRes.ok) throw new Error("Failed to load audit trail");
      const auditData = await auditRes.json();
      auditTrailData(auditData.auditTrail || []);

      // Load confidence scores
      const confRes = await fetch(
        `${apiUrl}/api/xai/confidence-scores?userId=${user.uid}&projectId=${pId}`
      );
      if (!confRes.ok) throw new Error("Failed to load confidence scores");
      const confData = await confRes.json();
      setConfidenceScores(confData.scores || []);

      // Load XAI analytics
      const analyticsRes = await fetch(
        `${apiUrl}/api/xai/analytics?userId=${user.uid}&projectId=${pId}`
      );
      if (!analyticsRes.ok) throw new Error("Failed to load XAI analytics");
      const analyticsData = await analyticsRes.json();
      setXaiAnalytics(analyticsData.analytics);
    } catch (err) {
      setError(err.message);
      console.error("Error loading audit data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadProject = () => {
    if (projectId) {
      localStorage.setItem("currentProjectId", projectId);
      loadAuditData(projectId);
    }
  };

  const exportAuditLog = () => {
    const csv = [
      ["Timestamp", "Action Type", "Agent", "Affected Resources", "Reason", "Confidence"],
      ...auditTrail.map((entry) => [
        new Date(entry.timestamp).toLocaleString(),
        entry.actionType,
        entry.agentName,
        entry.affectedResources?.join(";") || "",
        entry.reason,
        entry.confidence?.toFixed(2),
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-trail-${projectId}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  // Filter audit trail
  const filteredAudit = auditTrail.filter((entry) => {
    if (filterAction && entry.actionType !== filterAction) return false;
    if (filterAgent && entry.agentName !== filterAgent) return false;
    if (entry.confidence < minConfidence) return false;
    return true;
  });

  const agents = [...new Set(auditTrail.map((e) => e.agentName))];
  const actions = [...new Set(auditTrail.map((e) => e.actionType))];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#ddd",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            paddingBottom: "20px",
            borderBottom: "2px solid #333",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", color: "#10a37f" }}>
              🔍 Audit Trail & Explainability
            </h1>
            <p style={{ color: "#999", margin: "5px 0 0 0" }}>
              Complete transparency of AI decisions and agent actions
            </p>
          </div>
          <div style={{ textAlign: "right", display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                background: "#10a37f",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              ← Back to Project
            </button>
            <div style={{ textAlign: "right" }}>
              <p style={{ margin: "0 0 5px 0", fontSize: "14px" }}>
                👤 {user?.email}
              </p>
              <button
                onClick={logout}
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  background: "#ff4757",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>

        {/* Project Selector */}
        <div
          style={{
            background: "#262626",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #333",
            marginBottom: "20px",
          }}
        >
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Enter Project ID..."
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              style={{
                flex: 1,
                padding: "10px",
                background: "#1f1f1f",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "#ddd",
              }}
            />
            <button
              onClick={handleLoadProject}
              style={{
                padding: "10px 20px",
                background: "#10a37f",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Load Project
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "15px",
              background: "#fee",
              border: "1px solid #fcc",
              borderRadius: "8px",
              color: "#c33",
              marginBottom: "20px",
            }}
          >
            ❌ {error}
          </div>
        )}

        {!projectId && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#999",
              background: "#262626",
              borderRadius: "12px",
              border: "1px solid #333",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>🔍</div>
            <p>Enter a project ID to view audit trail and explanations</p>
          </div>
        )}

        {projectId && loading && (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#999",
              background: "#262626",
              borderRadius: "12px",
              border: "1px solid #333",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>⏳</div>
            <p>Loading audit data...</p>
          </div>
        )}

        {projectId && !loading && (
          <>
            {/* XAI Analytics Summary */}
            {xaiAnalytics && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "15px",
                  marginBottom: "30px",
                }}
              >
                <Card
                  title="Total Decisions"
                  value={xaiAnalytics.totalDecisions}
                  icon="📋"
                  color="#2196F3"
                />
                <Card
                  title="Avg Confidence"
                  value={(xaiAnalytics.avgConfidence * 100).toFixed(0) + "%"}
                  icon="📈"
                  color="#10a37f"
                />
                <Card
                  title="Explanation Quality"
                  value={(xaiAnalytics.avgExplanationQuality * 100).toFixed(0) + "%"}
                  icon="✨"
                  color="#FFD700"
                />
                <Card
                  title="Audit Events"
                  value={xaiAnalytics.auditTrailLength}
                  icon="📊"
                  color="#4CAF50"
                />
              </div>
            )}

            {/* Filters */}
            <div
              style={{
                background: "#262626",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #333",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ marginTop: 0, fontSize: "16px", color: "#10a37f" }}>
                🔎 Filters
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "15px",
                }}
              >
                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "5px", color: "#999" }}>
                    Action Type
                  </label>
                  <select
                    value={filterAction}
                    onChange={(e) => setFilterAction(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "#1f1f1f",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      color: "#ddd",
                    }}
                  >
                    <option value="">All Actions</option>
                    {actions.map((action) => (
                      <option key={action} value={action}>
                        {AUDIT_CATEGORIES[action]?.label || action}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "5px", color: "#999" }}>
                    Agent
                  </label>
                  <select
                    value={filterAgent}
                    onChange={(e) => setFilterAgent(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "#1f1f1f",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      color: "#ddd",
                    }}
                  >
                    <option value="">All Agents</option>
                    {agents.map((agent) => (
                      <option key={agent} value={agent}>
                        {agent?.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "12px", marginBottom: "5px", color: "#999" }}>
                    Min Confidence: {(minConfidence * 100).toFixed(0)}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={minConfidence}
                    onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
                    style={{ width: "100%" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    onClick={exportAuditLog}
                    style={{
                      width: "100%",
                      padding: "8px",
                      background: "#2196F3",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    📥 Export CSV
                  </button>
                </div>
              </div>
            </div>

            {/* Audit Trail */}
            <div
              style={{
                background: "#262626",
                padding: "20px",
                borderRadius: "12px",
                border: "1px solid #333",
                marginBottom: "20px",
              }}
            >
              <h2 style={{ marginTop: 0, fontSize: "18px", color: "#10a37f" }}>
                📋 Audit Trail ({filteredAudit.length} events)
              </h2>

              {filteredAudit.length === 0 ? (
                <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
                  No audit events match the current filters
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {filteredAudit.map((entry, i) => {
                    const cat = AUDIT_CATEGORIES[entry.actionType] || {
                      icon: "📝",
                      label: entry.actionType,
                      color: "#999",
                    };

                    return (
                      <div
                        key={i}
                        style={{
                          background: "#1f1f1f",
                          padding: "15px",
                          borderRadius: "8px",
                          borderLeft: `4px solid ${cat.color}`,
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "start",
                            marginBottom: "8px",
                          }}
                        >
                          <div>
                            <div style={{ fontSize: "14px", fontWeight: "600" }}>
                              {cat.icon} {cat.label}
                            </div>
                            <div style={{ fontSize: "12px", color: "#999" }}>
                              Agent: {entry.agentName?.toUpperCase()}
                            </div>
                          </div>
                          <div
                            style={{
                              background:
                                entry.confidence >= 0.8
                                  ? "#2a4a2b"
                                  : entry.confidence >= 0.6
                                  ? "#2a3a4a"
                                  : "#4a2a2b",
                              color:
                                entry.confidence >= 0.8
                                  ? "#4caf50"
                                  : entry.confidence >= 0.6
                                  ? "#64b5f6"
                                  : "#f44336",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontSize: "11px",
                              fontWeight: "600",
                            }}
                          >
                            {(entry.confidence * 100).toFixed(0)}% confident
                          </div>
                        </div>

                        {entry.reason && (
                          <div
                            style={{
                              fontSize: "12px",
                              color: "#ccc",
                              marginBottom: "8px",
                              fontStyle: "italic",
                            }}
                          >
                            {entry.reason}
                          </div>
                        )}

                        {entry.affectedResources && entry.affectedResources.length > 0 && (
                          <div style={{ fontSize: "11px", color: "#999", marginBottom: "8px" }}>
                            Resources: {entry.affectedResources.join(", ")}
                          </div>
                        )}

                        <div style={{ fontSize: "11px", color: "#666" }}>
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Confidence Scores Chart */}
            {confidenceScores.length > 0 && (
              <div
                style={{
                  background: "#262626",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "1px solid #333",
                }}
              >
                <h2 style={{ marginTop: 0, fontSize: "18px", color: "#2196F3" }}>
                  📊 Confidence Scores by Metric
                </h2>

                <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
                  {confidenceScores.slice(0, 10).map((score, i) => (
                    <div key={i}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <span style={{ fontSize: "13px", fontWeight: "600" }}>
                          {score.metric}
                        </span>
                        <span
                          style={{
                            background: getConfidenceColor(score.confidence),
                            color: "white",
                            padding: "2px 8px",
                            borderRadius: "4px",
                            fontSize: "11px",
                          }}
                        >
                          {(score.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                      <div
                        style={{
                          background: "#333",
                          height: "6px",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: getConfidenceColor(score.confidence),
                            width: `${score.confidence * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, icon, color }) {
  return (
    <div
      style={{
        background: "#1a1a1a",
        padding: "15px",
        borderRadius: "12px",
        border: "1px solid #333",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "28px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "12px", color: "#999", marginBottom: "6px" }}>{title}</div>
      <div style={{ fontSize: "24px", fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}

function getConfidenceColor(score) {
  if (score >= 0.9) return "#4caf50";
  if (score >= 0.75) return "#8bc34a";
  if (score >= 0.6) return "#ffeb3b";
  if (score >= 0.4) return "#ff9800";
  return "#f44336";
}
