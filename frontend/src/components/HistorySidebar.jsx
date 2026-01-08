import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { getUserAnalyses } from "../services/firestoreService.jsx";

export default function HistorySidebar({ onSelectAnalysis }) {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadAnalyses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const loadAnalyses = async () => {
    setLoading(true);
    try {
      const data = await getUserAnalyses(user.uid);
      setAnalyses(data);
    } catch (err) {
      console.error("Failed to load analyses:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  return (
    <div style={{
      width: '280px',
      backgroundColor: '#f8f9fa',
      borderRight: '1px solid #ddd',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh'
    }}>
      {/* Header */}
      <div style={{
        padding: '15px',
        borderBottom: '1px solid #ddd'
      }}>
        <h2 style={{ margin: '0 0 10px 0', fontSize: '18px' }}>📋 History</h2>
        <button
          onClick={() => navigate("/")}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            marginBottom: '10px',
            fontSize: '14px'
          }}
        >
          + New Analysis
        </button>
      </div>

      {/* Analyses List */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: '10px'
      }}>
        {loading ? (
          <div style={{ padding: '15px', color: '#666', fontSize: '14px' }}>
            Loading history...
          </div>
        ) : analyses.length === 0 ? (
          <div style={{ padding: '15px', color: '#666', fontSize: '14px' }}>
            No analyses yet. Start a new one!
          </div>
        ) : (
          analyses.map((analysis) => (
            <div
              key={analysis.id}
              onClick={() => onSelectAnalysis(analysis)}
              style={{
                padding: '12px',
                marginBottom: '8px',
                backgroundColor: 'white',
                border: '1px solid #ddd',
                borderRadius: '5px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                ':hover': {
                  backgroundColor: '#e3f2fd'
                }
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#e3f2fd';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              <div style={{
                fontWeight: 'bold',
                fontSize: '14px',
                marginBottom: '5px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {analysis.projectIdea.substring(0, 30)}
                {analysis.projectIdea.length > 30 ? '...' : ''}
              </div>
              <div style={{
                fontSize: '12px',
                color: '#999'
              }}>
                {new Date(analysis.createdAt).toLocaleDateString()} {new Date(analysis.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div style={{
        padding: '15px',
        borderTop: '1px solid #ddd',
        backgroundColor: 'white'
      }}>
        <div style={{
          fontSize: '12px',
          color: '#666',
          marginBottom: '10px',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {user?.email}
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '8px',
            backgroundColor: '#dc3545',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}
