import { useState } from "react";

export default function Dashboard() {
  const [idea, setIdea] = useState("");
  const [roadmap, setRoadmap] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    if (!idea.trim()) {
      alert("Please enter a project idea");
      return;
    }

    setLoading(true);
    setError("");
    
    try {
      const res = await fetch("/api/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: idea, userId: "user-123" })
      });

      if (!res.ok) {
        throw new Error(`API error: ${res.status}`);
      }

      const data = await res.json();
      setRoadmap(data.roadmap);
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40, fontFamily: 'Arial, sans-serif' }}>
      <h1>AI Project Planner Dashboard</h1>

      <textarea
        rows="4"
        cols="50"
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        placeholder="Describe your project... (e.g., 'E-commerce platform with AI recommendations')"
        style={{ fontSize: '14px', padding: '10px', width: '100%', maxWidth: '600px' }}
      />

      <br /><br />

      <button 
        onClick={generate} 
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          fontSize: '16px', 
          backgroundColor: loading ? '#ccc' : '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer'
        }}
      >
        {loading ? "🔄 Generating... (this may take 10-30 seconds)" : "✨ Generate Roadmap"}
      </button>

      {error && (
        <div style={{ color: "red", marginTop: 10, padding: '10px', backgroundColor: '#ffe6e6', borderRadius: '5px' }}>
          ⚠️ Error: {error}
        </div>
      )}

      {loading && (
        <div style={{ marginTop: 20, color: '#666' }}>
          <div style={{ fontSize: '18px' }}>⏳ AI is analyzing your project...</div>
          <div style={{ fontSize: '14px', marginTop: '5px' }}>Creating detailed phases, milestones, and deliverables</div>
        </div>
      )}

      {roadmap && !loading && (
        <div style={{ marginTop: 20 }}>
          <h2>📋 Your Project Roadmap</h2>
          <pre style={{ 
            backgroundColor: "#f5f5f5", 
            padding: 20, 
            borderRadius: '8px',
            whiteSpace: 'pre-wrap',
            lineHeight: '1.6',
            fontSize: '14px'
          }}>
            {roadmap}
          </pre>
        </div>
      )}
    </div>
  );
}
