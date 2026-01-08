import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "./context/AuthContext.jsx";

export default function LoginPage() {
  const navigate = useNavigate();
  const { loginWithGoogle, error: authError } = useContext(AuthContext);
  
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      setError(err.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f0f10',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: '#1a1a1b',
        padding: '48px 40px',
        borderRadius: '16px',
        border: '1px solid #262626',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        maxWidth: '460px',
        width: '100%',
        textAlign: 'center'
      }}>
        <div style={{ marginBottom: '40px' }}>
          <h1 style={{ marginBottom: '12px', color: '#fff', fontSize: '32px', fontWeight: '700', letterSpacing: '-0.5px' }}>
            Planner AI
          </h1>
          <p style={{ color: '#999', marginBottom: '0', fontSize: '15px', lineHeight: '1.6' }}>
            Transform your project ideas into comprehensive roadmaps with AI-powered analysis
          </p>
        </div>

        {(error || authError) && (
          <div style={{
            backgroundColor: '#2a1a1a',
            color: '#ff6b6b',
            padding: '13px 14px',
            borderRadius: '8px',
            marginBottom: '24px',
            fontSize: '13px',
            border: '1px solid #4a2a2a',
            borderLeft: '4px solid #ef5350',
            lineHeight: '1.5'
          }}>
            ⚠️ {error || authError}
          </div>
        )}

        <div style={{ marginBottom: '32px' }}>
          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            style={{
              width: '100%',
              padding: '13px 16px',
              backgroundColor: loading ? '#2a2a2b' : '#fff',
              color: '#1a1a1b',
              border: loading ? '1px solid #3a3a3b' : '1px solid #e0e0e0',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              opacity: loading ? 0.6 : 1
            }}
            onMouseEnter={(e) => !loading && (e.target.style.backgroundColor = '#f5f5f5')}
            onMouseLeave={(e) => !loading && (e.target.style.backgroundColor = '#fff')}
          >
            <span style={{ fontSize: '18px' }}>🔍</span>
            {loading ? 'Signing in...' : 'Get Started'}
          </button>
        </div>

        <div style={{ 
          backgroundColor: '#151515', 
          padding: '20px', 
          borderRadius: '12px',
          border: '1px solid #262626',
          marginBottom: '32px'
        }}>
          <p style={{ color: '#999', marginBottom: '12px', fontSize: '13px', fontWeight: '500' }}>
            ✨ One-click sign-in with your Google account
          </p>
          <p style={{ color: '#666', marginBottom: '0', fontSize: '12px', lineHeight: '1.5' }}>
            No password needed. Securely sign in with your Google credentials and get started immediately.
          </p>
        </div>

        <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid #262626' }}>
          <p style={{ color: '#666', fontSize: '12px', marginBottom: '0' }}>
            By signing in, you agree to our{' '}
            <span style={{ color: '#999', textDecoration: 'none' }}>Terms of Service</span>
          </p>
        </div>
      </div>
    </div>
  );
}
