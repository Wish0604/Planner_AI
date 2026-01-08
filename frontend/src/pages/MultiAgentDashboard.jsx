import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { saveAnalysis } from "../services/firestoreService.jsx";

export default function MultiAgentDashboard() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const generate = async () => {
    if (!idea.trim()) {
      alert("Please enter a project idea");
      return;
    }

    setLoading(true);
    setError("");

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

      // Navigate to results page with report data
      navigate("/results", { state: { report: data.report, projectIdea: idea } });
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1>🤖 Multi-Agent AI Project Planner</h1>
          <p style={{ color: '#666', margin: 0 }}>
            Powered by 5 specialized AI agents working in parallel
          </p>
        </div>
        <div style={{ textAlign: 'right', fontSize: '14px', color: '#666' }}>
          <p style={{ margin: 0 }}>👤 {user?.email}</p>
        </div>
      </div>

      <textarea
        rows="4"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Describe your project... (e.g., 'E-commerce platform with AI recommendations')"
        style={{ 
          fontSize: '14px', 
          padding: '10px', 
          width: '100%', 
          borderRadius: '5px',
          border: '1px solid #ddd'
        }}
      />

      <br /><br />

      <button
        onClick={generate}
        disabled={loading || saving}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          backgroundColor: loading || saving ? '#ccc' : '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: loading || saving ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? "🔄 Multi-Agent Processing... (30-60s)" : "🚀 Generate Multi-Agent Roadmap"}
      </button>

      {error && (
        <div style={{ 
          color: "red", 
          marginTop: 20, 
          padding: '15px', 
          backgroundColor: '#ffe6e6', 
          borderRadius: '5px' 
        }}>
          ⚠️ Error: {error}
        </div>
      )}

      {loading && (
        <div style={{ marginTop: 30, padding: '20px', backgroundColor: '#f0f8ff', borderRadius: '8px' }}>
          <h3>🤖 Active Agents:</h3>
          <ul style={{ lineHeight: '2' }}>
            <li>📋 Planner Agent - Creating project structure</li>
            <li>🔧 TechStack Specialist - Analyzing technologies</li>
            <li>📅 Timeline Specialist - Scheduling tasks</li>
            <li>⚠️ Risk Specialist - Assessing risks</li>
            <li>📦 Deliverables Specialist - Defining outputs</li>
          </ul>
        </div>
      )}

      {saving && (
        <div style={{ marginTop: 20, padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '5px', color: '#1976d2' }}>
          💾 Saving your analysis to history...
        </div>
      )}
    </div>
  );
}
