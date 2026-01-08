import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { saveAnalysis } from "../services/firestoreService.jsx";
import HistorySidebar from "../components/HistorySidebar.jsx";
import {
  RoadmapRenderer,
  TechStackRenderer,
  TimelineRenderer,
  RisksRenderer,
  DeliverablesRenderer
} from "../components/AgentOutputRenderer.jsx";

export default function ProjectPlannerPage() {
  const { user } = useContext(AuthContext);
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [report, setReport] = useState(null);
  const [activeTab, setActiveTab] = useState("roadmap");

  const generate = async () => {
    if (!idea.trim()) {
      alert("Please enter a project idea");
      return;
    }

    setLoading(true);
    setError("");
    setReport(null);

    try {
      const res = await fetch("/api/multi-agent-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: idea, userId: user.uid })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();

      // Save to Firestore
      if (user) {
        setSaving(true);
        try {
          await saveAnalysis(user.uid, idea, data.report);
        } catch (saveErr) {
          console.error("Failed to save analysis:", saveErr);
        } finally {
          setSaving(false);
        }
      }

      setReport(data.report);
      setActiveTab("roadmap");
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleNewAnalysis = () => {
    setReport(null);
    setIdea("");
    setError("");
    setActiveTab("roadmap");
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif" }}>
      <HistorySidebar
        onSelectAnalysis={(analysis) => {
          setReport(analysis.report);
          setIdea(analysis.projectIdea);
          setActiveTab("roadmap");
        }}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <div
          style={{
            padding: "15px 40px",
            backgroundColor: "#f8f9fa",
            borderBottom: "1px solid #ddd",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <h1 style={{ margin: "0 0 5px 0" }}>🤖 Multi-Agent AI Project Planner</h1>
            <p style={{ margin: 0, color: "#666", fontSize: "14px" }}>
              Powered by 5 specialized AI agents working in parallel
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: "14px", color: "#666" }}>
            <p style={{ margin: 0 }}>👤 {user?.email}</p>
          </div>
        </div>

        {/* Main Content Area */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: report ? "350px 1fr" : "1fr",
            overflow: "hidden",
            gap: 0
          }}
        >
          {/* Left Panel - Input Form */}
          <div
            style={{
              backgroundColor: "#f5f5f5",
              borderRight: report ? "1px solid #ddd" : "none",
              overflowY: "auto",
              padding: 20,
              display: "flex",
              flexDirection: "column"
            }}
          >
            <h2 style={{ marginTop: 0, fontSize: 16 }}>📝 Project Description</h2>

            <textarea
              rows="6"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              disabled={loading}
              placeholder="Describe your project... (e.g., 'E-commerce platform with AI recommendations')"
              style={{
                fontSize: "14px",
                padding: "10px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                fontFamily: "Arial, sans-serif",
                marginBottom: 15,
                resize: "vertical",
                opacity: loading ? 0.6 : 1
              }}
            />

            <button
              onClick={generate}
              disabled={loading || saving}
              style={{
                padding: "12px 24px",
                fontSize: "14px",
                backgroundColor: loading || saving ? "#ccc" : "#007bff",
                color: "white",
                border: "none",
                borderRadius: "5px",
                cursor: loading || saving ? "not-allowed" : "pointer",
                fontWeight: "600",
                marginBottom: 15
              }}
            >
              {loading ? "🔄 Processing..." : "🚀 Generate Roadmap"}
            </button>

            {report && (
              <button
                onClick={handleNewAnalysis}
                style={{
                  padding: "10px 20px",
                  fontSize: "13px",
                  backgroundColor: "#6c757d",
                  color: "white",
                  border: "none",
                  borderRadius: "5px",
                  cursor: "pointer"
                }}
              >
                + New Analysis
              </button>
            )}

            {error && (
              <div
                style={{
                  color: "red",
                  marginTop: 15,
                  padding: "12px",
                  backgroundColor: "#ffe6e6",
                  borderRadius: "5px",
                  fontSize: "13px"
                }}
              >
                ⚠️ Error: {error}
              </div>
            )}

            {saving && (
              <div
                style={{
                  marginTop: 15,
                  padding: "12px",
                  backgroundColor: "#e3f2fd",
                  borderRadius: "5px",
                  color: "#1976d2",
                  fontSize: "13px"
                }}
              >
                💾 Saving to history...
              </div>
            )}

            {loading && (
              <div
                style={{
                  marginTop: 20,
                  padding: "15px",
                  backgroundColor: "#f0f8ff",
                  borderRadius: "8px"
                }}
              >
                <h3 style={{ margin: "0 0 10px 0", fontSize: 14 }}>🤖 Active Agents:</h3>
                <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: "1.8" }}>
                  <li>📋 Planner Agent</li>
                  <li>🔧 TechStack Specialist</li>
                  <li>📅 Timeline Specialist</li>
                  <li>⚠️ Risk Specialist</li>
                  <li>📦 Deliverables Specialist</li>
                </ul>
              </div>
            )}
          </div>

          {/* Right Panel - Results */}
          {report && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                overflow: "hidden"
              }}
            >
              {/* Results Header */}
              <div
                style={{
                  padding: "15px 20px",
                  backgroundColor: "#f8f9fa",
                  borderBottom: "1px solid #ddd",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center"
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: 14 }}>Analysis Results</h3>
                  <p style={{ margin: "5px 0 0 0", fontSize: 12, color: "#666" }}>
                    {idea.substring(0, 50)}
                    {idea.length > 50 ? "..." : ""}
                  </p>
                </div>
              </div>

              {/* Tabs */}
              <div
                style={{
                  display: "flex",
                  gap: "8px",
                  borderBottom: "2px solid #ddd",
                  padding: "10px 20px",
                  overflowX: "auto",
                  backgroundColor: "#fff"
                }}
              >
                {["roadmap", "techstack", "timeline", "risks", "deliverables"].map(
                  (tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      style={{
                        padding: "8px 16px",
                        backgroundColor: activeTab === tab ? "#007bff" : "#f5f5f5",
                        color: activeTab === tab ? "white" : "#333",
                        border: "none",
                        borderRadius: "4px 4px 0 0",
                        cursor: "pointer",
                        fontSize: "12px",
                        fontWeight: "600",
                        whiteSpace: "nowrap"
                      }}
                    >
                      {tab === "roadmap" && "📋"}
                      {tab === "techstack" && "🔧"}
                      {tab === "timeline" && "📅"}
                      {tab === "risks" && "⚠️"}
                      {tab === "deliverables" && "📦"}
                    </button>
                  )
                )}
              </div>

              {/* Content */}
              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px",
                  backgroundColor: "#f9f9f9"
                }}
              >
                

                {activeTab === "roadmap" && (
                  <div>
                    <h2>📋 Project Roadmap (Planner Agent)</h2>
                    <RoadmapRenderer data={report.agentOutputs.planner} />
                  </div>
                )}

                {activeTab === "techstack" && (
                  <div>
                    <h2>🔧 Technology Stack (TechStack Specialist)</h2>
                    <TechStackRenderer
                      data={report.agentOutputs.executors.find((e) => e.agent === "TechStack Specialist")?.output}
                    />
                  </div>
                )}

                {activeTab === "timeline" && (
                  <div>
                    <h2>📅 Project Timeline (Timeline Specialist)</h2>
                    <TimelineRenderer
                      data={report.agentOutputs.executors.find((e) => e.agent === "Timeline Specialist")?.output}
                    />
                  </div>
                )}

                {activeTab === "risks" && (
                  <div>
                    <h2>⚠️ Risk Assessment (Risk Specialist)</h2>
                    <RisksRenderer
                      data={report.agentOutputs.executors.find((e) => e.agent === "Risk Specialist")?.output}
                    />
                  </div>
                )}

                {activeTab === "deliverables" && (
                  <div>
                    <h2>📦 Deliverables (Deliverables Specialist)</h2>
                    <DeliverablesRenderer
                      data={report.agentOutputs.executors.find((e) => e.agent === "Deliverables Specialist")?.output}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!report && !loading && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#999",
                fontSize: 16
              }}
            >
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>📊</div>
                <div>Enter a project idea and click "Generate Roadmap"</div>
                <div style={{ fontSize: 13, marginTop: 10, color: "#bbb" }}>
                  Results will appear here
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
