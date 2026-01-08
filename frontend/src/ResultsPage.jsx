import { useLocation, useNavigate } from "react-router-dom";
import { useContext, useEffect, useState, useCallback } from "react";
import { AuthContext } from "./context/AuthContext.jsx";
import { saveAnalysis } from "./services/firestoreService.jsx";
import HistorySidebar from "./components/HistorySidebar.jsx";
import { 
  RoadmapRenderer, 
  TechStackRenderer, 
  TimelineRenderer, 
  RisksRenderer, 
  DeliverablesRenderer 
} from "./components/AgentOutputRenderer.jsx";

export default function ResultsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState("roadmap");
  const [report, setReport] = useState(null);
  const [projectIdea, setProjectIdea] = useState("");
  const [saving, setSaving] = useState(false);

  const initialReport = location.state?.report;
  const initialIdea = location.state?.projectIdea;

  const autoSave = useCallback(async (idea, data) => {
    if (!user) return;
    setSaving(true);
    try {
      await saveAnalysis(user.uid, idea, data);
    } catch (err) {
      console.error("Auto-save failed:", err);
    } finally {
      setSaving(false);
    }
  }, [user]);

  useEffect(() => {
    if (initialReport) {
      setReport(initialReport);
      setProjectIdea(initialIdea);
      // Auto-save to Firestore
      if (user && initialReport) {
        autoSave(initialIdea, initialReport);
      }
    }
  }, [initialReport, initialIdea, user, autoSave]);

  const handleSelectAnalysis = (analysis) => {
    setReport(analysis.report);
    setProjectIdea(analysis.projectIdea);
    setActiveTab("roadmap");
  };

  if (!report || !user) {
    return (
      <div style={{ padding: 40, fontFamily: 'Arial, sans-serif', textAlign: 'center' }}>
        <h2>No results found</h2>
        <button
          onClick={() => navigate("/")}
          style={{
            padding: '10px 20px',
            fontSize: '14px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          ← Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'Arial, sans-serif' }}>
      <HistorySidebar onSelectAnalysis={handleSelectAnalysis} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Top Navigation */}
        <div style={{
          padding: '15px 40px',
          backgroundColor: '#f8f9fa',
          borderBottom: '1px solid #ddd',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              <strong>Project:</strong> {projectIdea}
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: '8px 16px',
                fontSize: '14px',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              ← Back to Dashboard
            </button>
          </div>
        </div>

        {/* Main Content Area */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '40px',
          maxWidth: '1200px'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: '10px', 
            borderBottom: '2px solid #ddd', 
            marginBottom: '20px',
            overflowX: 'auto'
          }}>
            {['roadmap', 'techstack', 'timeline', 'risks', 'deliverables'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: activeTab === tab ? '#007bff' : '#f5f5f5',
                  color: activeTab === tab ? 'white' : '#333',
                  border: 'none',
                  borderRadius: '5px 5px 0 0',
                  cursor: 'pointer',
                  textTransform: 'capitalize',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab === 'roadmap' && '📋 Roadmap'}
                {tab === 'techstack' && '🔧 TechStack'}
                {tab === 'timeline' && '📅 Timeline'}
                {tab === 'risks' && '⚠️ Risks'}
                {tab === 'deliverables' && '📦 Deliverables'}
              </button>
            ))}
          </div>

          <div style={{ 
            backgroundColor: '#f9f9f9', 
            padding: 20, 
            borderRadius: '8px',
            minHeight: '400px'
          }}>
            

            {activeTab === 'roadmap' && (
              <div>
                <h2>📋 Project Roadmap (Planner Agent)</h2>
                <RoadmapRenderer data={report.agentOutputs.planner} />
              </div>
            )}

            {activeTab === 'techstack' && (
              <div>
                <h2>🔧 Technology Stack (TechStack Specialist)</h2>
                <TechStackRenderer 
                  data={report.agentOutputs.executors.find(e => e.agent === 'TechStack Specialist')?.output} 
                />
              </div>
            )}

            {activeTab === 'timeline' && (
              <div>
                <h2>📅 Project Timeline (Timeline Specialist)</h2>
                <TimelineRenderer 
                  data={report.agentOutputs.executors.find(e => e.agent === 'Timeline Specialist')?.output} 
                />
              </div>
            )}

            {activeTab === 'risks' && (
              <div>
                <h2>⚠️ Risk Assessment (Risk Specialist)</h2>
                <RisksRenderer 
                  data={report.agentOutputs.executors.find(e => e.agent === 'Risk Specialist')?.output} 
                />
              </div>
            )}

            {activeTab === 'deliverables' && (
              <div>
                <h2>📦 Deliverables (Deliverables Specialist)</h2>
                <DeliverablesRenderer 
                  data={report.agentOutputs.executors.find(e => e.agent === 'Deliverables Specialist')?.output} 
                />
              </div>
            )}
          </div>

          <div style={{ 
            marginTop: 20, 
            padding: 15, 
            backgroundColor: '#d4edda', 
            borderRadius: 5,
            color: '#155724'
          }}>
            ✅ <strong>Report Generated:</strong> {new Date(report.summary.executionTime).toLocaleString()}
            {saving && ' (saving...)'}
          </div>
        </div>
      </div>
    </div>
  );
}
