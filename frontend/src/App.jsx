import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthProvider, AuthContext } from "./context/AuthContext.jsx";
import LoginPage from "./LoginPage.jsx";
import ChatStylePage from "./pages/ChatStylePage.jsx";
import TelemetryDashboard from "./pages/TelemetryDashboard.jsx";
import RoadmapGenerator from "./pages/RoadmapGenerator.jsx";
import LearningAnalyticsDashboard from "./pages/LearningAnalyticsDashboard.jsx";
import AuditTrailDashboard from "./pages/AuditTrailDashboard.jsx";
import TeamManagementDashboard from "./pages/TeamManagementDashboard.jsx";

function ProtectedRoute({ children }) {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function AppContent() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center" }}>Loading...</div>;
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={user ? <Navigate to="/" /> : <LoginPage />} 
      />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <ChatStylePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/telemetry"
        element={
          <ProtectedRoute>
            <TelemetryDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/roadmap"
        element={
          <ProtectedRoute>
            <RoadmapGenerator />
          </ProtectedRoute>
        }
      />
      <Route
        path="/analytics"
        element={
          <ProtectedRoute>
            <LearningAnalyticsDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/audit"
        element={
          <ProtectedRoute>
            <AuditTrailDashboard />
          </ProtectedRoute>
        }
      />
      <Route
        path="/team-management"
        element={
          <ProtectedRoute>
            <TeamManagementDashboard />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}
