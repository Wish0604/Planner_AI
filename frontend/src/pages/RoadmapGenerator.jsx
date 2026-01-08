import { useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";

export default function RoadmapGenerator() {
  const { user, logout } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const generateRoadmap = async () => {
    if (!input.trim()) {
      alert("Please enter a project description");
      return;
    }

    setLoading(true);
    setError("");
    setResult(null);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/generate-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: input.trim() })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResult(data);
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && e.ctrlKey) {
      generateRoadmap();
    }
  };

  return (
    <div style={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        background: 'white',
        borderRadius: '12px',
        padding: '30px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          marginBottom: '30px',
          borderBottom: '2px solid #f0f0f0',
          paddingBottom: '20px'
        }}>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '28px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontWeight: 'bold'
            }}>
              🚀 AI Roadmap Generator
            </h1>
            <p style={{ color: '#666', margin: '5px 0 0 0', fontSize: '14px' }}>
              Multi-LLM routing: Gemini + Llama fallback
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 5px 0', fontSize: '14px', color: '#666' }}>
              👤 {user?.email}
            </p>
            <button
              onClick={logout}
              style={{
                padding: '6px 12px',
                fontSize: '12px',
                background: '#ff4757',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer'
              }}
            >
              Logout
            </button>
          </div>
        </div>

        {/* Input Section */}
        <div style={{ marginBottom: '30px' }}>
          <label style={{ 
            display: 'block', 
            marginBottom: '10px', 
            fontWeight: 'bold',
            color: '#333'
          }}>
            Project Description
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe your project... e.g., 'Build a Node.js API for e-commerce with React frontend, PostgreSQL database, and Docker deployment'"
            rows="5"
            style={{
              width: '100%',
              padding: '15px',
              fontSize: '14px',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              fontFamily: 'inherit',
              resize: 'vertical',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => e.target.style.borderColor = '#667eea'}
            onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
          />
          <p style={{ fontSize: '12px', color: '#999', margin: '5px 0 0 0' }}>
            Tip: Press Ctrl+Enter to generate
          </p>
        </div>

        {/* Generate Button */}
        <button
          onClick={generateRoadmap}
          disabled={loading || !input.trim()}
          style={{
            width: '100%',
            padding: '15px',
            fontSize: '16px',
            fontWeight: 'bold',
            background: loading ? '#ccc' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'transform 0.2s',
            marginBottom: '30px'
          }}
          onMouseEnter={(e) => !loading && (e.target.style.transform = 'translateY(-2px)')}
          onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
        >
          {loading ? '🤖 Generating...' : '✨ Generate Roadmap'}
        </button>

        {/* Error Display */}
        {error && (
          <div style={{
            padding: '15px',
            background: '#fee',
            border: '1px solid #fcc',
            borderRadius: '8px',
            color: '#c33',
            marginBottom: '20px'
          }}>
            ❌ Error: {error}
          </div>
        )}

        {/* Result Display */}
        {result && (
          <div style={{
            padding: '20px',
            background: '#f9f9f9',
            borderRadius: '8px',
            border: '1px solid #e0e0e0'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '15px',
              paddingBottom: '15px',
              borderBottom: '2px solid #e0e0e0'
            }}>
              <span style={{
                padding: '6px 12px',
                background: result.usedModel === 'llama' ? '#4CAF50' : '#2196F3',
                color: 'white',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                🤖 {result.usedModel?.toUpperCase()}
              </span>
              <span style={{ color: '#666', fontSize: '14px' }}>
                Model used for generation
              </span>
            </div>

            <div style={{
              background: 'white',
              padding: '20px',
              borderRadius: '8px',
              maxHeight: '600px',
              overflowY: 'auto',
              whiteSpace: 'pre-wrap',
              fontFamily: '"Segoe UI", Tahoma, Geneva, Verdana, sans-serif',
              fontSize: '14px',
              lineHeight: '1.6',
              color: '#333'
            }}>
              {result.result}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
