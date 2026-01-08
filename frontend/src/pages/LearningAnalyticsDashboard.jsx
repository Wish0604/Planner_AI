import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export default function LearningAnalyticsDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [analytics, setAnalytics] = useState(null);
  const [affinityScores, setAffinityScores] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState("api");
  const [promptVersions, setPromptVersions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadAnalytics();
  }, [user?.uid]);

  const loadAnalytics = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

      // Load feedback analytics
      const analyticsRes = await fetch(
        `${apiUrl}/api/feedback/analytics?userId=${user.uid}`
      );
      if (!analyticsRes.ok) throw new Error("Failed to load analytics");
      const analyticsData = await analyticsRes.json();
      setAnalytics(analyticsData.analytics);

      // Load affinity scores
      const affinityRes = await fetch(`${apiUrl}/api/learning/affinity-scores`);
      if (!affinityRes.ok) throw new Error("Failed to load affinity scores");
      const affinityData = await affinityRes.json();
      setAffinityScores(affinityData.scores);

      // Load prompt versions
      const versionsRes = await fetch(
        `${apiUrl}/api/learning/prompt-versions?domain=${selectedDomain}`
      );
      if (!versionsRes.ok) throw new Error("Failed to load prompt versions");
      const versionsData = await versionsRes.json();
      setPromptVersions(versionsData.history);
    } catch (err) {
      setError(err.message);
      console.error("Error loading analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#ddd",
        padding: "20px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "40px", marginBottom: "20px" }}>📊</div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0d",
      color: "#ddd",
      padding: "20px",
      fontFamily: "Arial, sans-serif",
    }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "30px",
          paddingBottom: "20px",
          borderBottom: "2px solid #333",
        }}>
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", color: "#10a37f" }}>
              📊 Learning Analytics
            </h1>
            <p style={{ color: "#999", margin: "5px 0 0 0" }}>
              AI model performance & feedback insights
            </p>
          </div>
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

        {error && (
          <div style={{
            padding: "15px",
            background: "#fee",
            border: "1px solid #fcc",
            borderRadius: "8px",
            color: "#c33",
            marginBottom: "20px",
          }}>
            ❌ {error}
          </div>
        )}

        {/* Summary Cards */}
        {analytics && (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}>
            <Card
              title="Total Feedback"
              value={analytics.totalFeedback}
              icon="📋"
              color="#2196F3"
            />
            <Card
              title="Avg Rating"
              value={analytics.averageRating.toFixed(2)}
              icon="⭐"
              color="#FFD700"
            />
            <Card
              title="Quality Score"
              value={(analytics.averageQuality * 100).toFixed(1) + "%"}
              icon="✨"
              color="#10a37f"
            />
            <Card
              title="Success Rate"
              value={analytics.successRate + "%"}
              icon="🎯"
              color="#4CAF50"
            />
          </div>
        )}

        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "30px",
          marginBottom: "30px",
        }}>
          {/* Model Performance */}
          {analytics && (
            <div style={{
              background: "#262626",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #333",
            }}>
              <h2 style={{ marginTop: 0, fontSize: "18px", color: "#10a37f" }}>
                🤖 Model Performance
              </h2>
              <div style={{ marginTop: "15px" }}>
                {Object.entries(analytics.modelPerformance || {}).map(
                  ([model, stats]) => (
                    <div
                      key={model}
                      style={{
                        background: "#1f1f1f",
                        padding: "12px",
                        borderRadius: "8px",
                        marginBottom: "10px",
                      }}
                    >
                      <div style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginBottom: "8px",
                        fontWeight: "600",
                      }}>
                        <span>{model.toUpperCase()}</span>
                        <span style={{ color: "#10a37f" }}>
                          {stats.averageRating}/5.0
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#999" }}>
                        Success: {stats.successRate} • Count: {stats.count}
                      </div>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Common Blockers */}
          {analytics && (
            <div style={{
              background: "#262626",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #333",
            }}>
              <h2 style={{ marginTop: 0, fontSize: "18px", color: "#ff4757" }}>
                🚧 Common Blockers
              </h2>
              <div style={{ marginTop: "15px" }}>
                {analytics.commonBlockers && analytics.commonBlockers.length > 0 ? (
                  analytics.commonBlockers.map((item, i) => (
                    <div
                      key={i}
                      style={{
                        background: "#1f1f1f",
                        padding: "12px",
                        borderRadius: "8px",
                        marginBottom: "10px",
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span>{item.blocker}</span>
                      <span style={{ background: "#ff4757", color: "white", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>
                        {item.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#999" }}>No blockers recorded yet</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Affinity Scores */}
        {affinityScores && (
          <div style={{
            background: "#262626",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #333",
            marginBottom: "30px",
          }}>
            <h2 style={{ marginTop: 0, fontSize: "18px", color: "#2196F3" }}>
              📈 Model-Domain Affinity
            </h2>
            <p style={{ color: "#999", fontSize: "13px", marginBottom: "15px" }}>
              How well each model performs in different domains
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
              gap: "15px",
            }}>
              {affinityScores.topCombinations?.slice(0, 8).map((score, i) => (
                <div
                  key={i}
                  style={{
                    background: "#1f1f1f",
                    padding: "15px",
                    borderRadius: "8px",
                    border: "1px solid #333",
                  }}
                >
                  <div style={{
                    fontSize: "12px",
                    color: "#10a37f",
                    fontWeight: "600",
                    marginBottom: "8px",
                  }}>
                    {score.model?.toUpperCase()}
                  </div>
                  <div style={{ fontSize: "13px", marginBottom: "10px" }}>
                    {score.domain}
                  </div>
                  <div style={{
                    background: "#333",
                    height: "4px",
                    borderRadius: "2px",
                    overflow: "hidden",
                  }}>
                    <div
                      style={{
                        height: "100%",
                        background: "#10a37f",
                        width: `${(score.score || 0) * 100}%`,
                      }}
                    />
                  </div>
                  <div style={{
                    fontSize: "11px",
                    color: "#999",
                    marginTop: "6px",
                  }}>
                    Score: {(score.score * 100).toFixed(0)}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Feedback */}
        {analytics?.feedbacks && (
          <div style={{
            background: "#262626",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #333",
          }}>
            <h2 style={{ marginTop: 0, fontSize: "18px", color: "#FFD700" }}>
              💬 Recent Feedback
            </h2>
            <div style={{ marginTop: "15px" }}>
              {analytics.feedbacks.slice(0, 5).map((feedback, i) => (
                <div
                  key={i}
                  style={{
                    background: "#1f1f1f",
                    padding: "15px",
                    borderRadius: "8px",
                    marginBottom: "10px",
                    borderLeft: "3px solid #10a37f",
                  }}
                >
                  <div style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "8px",
                  }}>
                    <span style={{ fontWeight: "600" }}>
                      Rating: {feedback.rating}/5
                    </span>
                    <span style={{ fontSize: "12px", color: "#999" }}>
                      {feedback.usedModel?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ fontSize: "12px", color: "#999" }}>
                    Status: {feedback.projectStatus}
                  </div>
                  {feedback.comments && (
                    <div style={{
                      fontSize: "12px",
                      color: "#ccc",
                      marginTop: "8px",
                      fontStyle: "italic",
                    }}>
                      "{feedback.comments}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, value, icon, color }) {
  return (
    <div style={{
      background: "#262626",
      padding: "20px",
      borderRadius: "12px",
      border: "1px solid #333",
      textAlign: "center",
    }}>
      <div style={{ fontSize: "32px", marginBottom: "10px" }}>{icon}</div>
      <div style={{ fontSize: "13px", color: "#999", marginBottom: "8px" }}>
        {title}
      </div>
      <div style={{
        fontSize: "28px",
        fontWeight: "bold",
        color: color,
      }}>
        {value}
      </div>
    </div>
  );
}
