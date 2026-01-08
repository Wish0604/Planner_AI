import { useState, useEffect } from "react";

const RISK_COLORS = {
  low: "#4caf50",      // Green
  medium: "#ffc107",   // Yellow
  high: "#ff9800",     // Orange
  critical: "#f44336", // Red
};

const PRIORITY_ICONS = {
  low: "📋",
  medium: "📌",
  high: "⚠️",
  critical: "🚨",
};

export default function SLAMonitor({ organizationId, visible = true }) {
  const [slaHealth, setSLAHealth] = useState(null);
  const [breachAnalytics, setBreachAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("health"); // health, breaches

  useEffect(() => {
    if (visible && organizationId) {
      loadSLAData();
    }
  }, [organizationId, visible]);

  const loadSLAData = async () => {
    try {
      setLoading(true);
      setError("");
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

      console.log("Loading SLA data from:", apiUrl, "OrgID:", organizationId);

      // Load health
      const healthRes = await fetch(
        `${apiUrl}/api/org/sla-health?organizationId=${organizationId}`
      );
      
      if (!healthRes.ok) {
        const errData = await healthRes.text();
        console.error("Health response error:", errData);
        throw new Error(`Failed to load SLA health: ${healthRes.status}`);
      }
      
      const healthData = await healthRes.json();
      console.log("Health data received:", healthData);
      
      const health = healthData.health || {
        healthy: [],
        atRisk: [],
        breached: [],
        totalSLAs: 0,
        healthScore: 100,
      };
      
      console.log("Setting health state:", health);
      setSLAHealth(health);

      // Load breaches
      const breachRes = await fetch(
        `${apiUrl}/api/org/sla-breaches?organizationId=${organizationId}`
      );
      
      if (!breachRes.ok) {
        const errData = await breachRes.text();
        console.error("Breach response error:", errData);
        throw new Error(`Failed to load breaches: ${breachRes.status}`);
      }
      
      const breachData = await breachRes.json();
      console.log("Breach data received:", breachData);
      
      const analytics = breachData.analytics || {
        totalBreaches: 0,
        breachRate: 0,
        avgDaysOverdue: 0,
        breachesByPriority: {},
      };
      
      console.log("Setting breach analytics:", analytics);
      setBreachAnalytics(analytics);
    } catch (err) {
      console.error("Error loading SLA data:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
        <div style={{ fontSize: "18px", marginBottom: "10px" }}>⏰</div>
        Loading SLA monitoring...
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          padding: "15px",
          background: "#fee",
          border: "1px solid #fcc",
          borderRadius: "8px",
          color: "#c33",
          marginTop: "20px",
        }}
      >
        ❌ Error: {error}
        <button
          onClick={loadSLAData}
          style={{
            marginTop: "10px",
            padding: "6px 12px",
            background: "#10a37f",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            fontSize: "12px",
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  // If data hasn't loaded yet, show loading
  if (!slaHealth) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
        <div style={{ fontSize: "18px", marginBottom: "10px" }}>⏰</div>
        Initializing SLA data...
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#1a1a1a",
        padding: "20px",
        borderRadius: "12px",
        border: "1px solid #333",
        marginTop: "20px",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
        <h2 style={{ margin: 0, fontSize: "18px", color: "#ff9800" }}>
          ⏰ SLA Monitoring & Deadline Tracking
        </h2>
        <button
          onClick={loadSLAData}
          style={{
            padding: "6px 12px",
            background: "#10a37f",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "11px",
            fontWeight: "600",
          }}
        >
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: "12px",
          marginBottom: "20px",
        }}
      >
        <Card
          label="On Track"
          value={slaHealth.healthy?.length || 0}
          color="#4caf50"
          icon="✅"
        />
        <Card
          label="At Risk"
          value={slaHealth.atRisk?.length || 0}
          color="#ffc107"
          icon="⚠️"
        />
        <Card
          label="Breached"
          value={slaHealth.breached?.length || 0}
          color="#f44336"
          icon="🚨"
        />
        <Card
          label="Health Score"
          value={`${(slaHealth.healthScore || 100).toFixed(0)}%`}
          color="#10a37f"
          icon="📊"
        />
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid #333", paddingBottom: "10px" }}>
        <button
          onClick={() => setActiveTab("health")}
          style={{
            padding: "8px 16px",
            background: activeTab === "health" ? "#10a37f" : "transparent",
            color: activeTab === "health" ? "white" : "#999",
            border: "none",
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          📋 SLA Status
        </button>
        <button
          onClick={() => setActiveTab("breaches")}
          style={{
            padding: "8px 16px",
            background: activeTab === "breaches" ? "#ff9800" : "transparent",
            color: activeTab === "breaches" ? "white" : "#999",
            border: "none",
            borderRadius: "6px 6px 0 0",
            cursor: "pointer",
            fontSize: "12px",
            fontWeight: "600",
          }}
        >
          🚨 Breach History
        </button>
      </div>

      {/* SLA Health Tab */}
      {activeTab === "health" && (
        <div>
          {(!slaHealth.breached?.length && !slaHealth.atRisk?.length && !slaHealth.healthy?.length) ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#999" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>📭</div>
              <p>No SLA data available yet. Create SLAs to start monitoring deadlines.</p>
            </div>
          ) : (
            <>
              {/* Breached SLAs */}
              {slaHealth.breached && slaHealth.breached.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#f44336",
                      marginBottom: "12px",
                    }}
                  >
                    🚨 Breached Deadlines
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {slaHealth.breached.map((sla, i) => (
                      <SLAItem
                        key={i}
                        sla={sla}
                        status={`${sla.daysOverdue} days overdue`}
                        riskColor="#f44336"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* At Risk SLAs */}
              {slaHealth.atRisk && slaHealth.atRisk.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#ffc107",
                      marginBottom: "12px",
                    }}
                  >
                    ⚠️ At Risk (Approaching Deadline)
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {slaHealth.atRisk.map((sla, i) => (
                      <SLAItem
                        key={i}
                        sla={sla}
                        status={`${sla.daysRemaining} days left`}
                        riskColor="#ffc107"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Healthy SLAs */}
              {slaHealth.healthy && slaHealth.healthy.length > 0 && (
                <div>
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#4caf50",
                      marginBottom: "12px",
                    }}
                  >
                    ✅ On Track
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {slaHealth.healthy.slice(0, 5).map((sla, i) => (
                      <SLAItem
                        key={i}
                        sla={sla}
                        status={`${sla.daysRemaining} days left`}
                        riskColor="#4caf50"
                      />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Breach Analytics Tab */}
      {activeTab === "breaches" && (
        <div>
          {!breachAnalytics || breachAnalytics.totalBreaches === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#999" }}>
              <div style={{ fontSize: "36px", marginBottom: "10px" }}>✅</div>
              <p>No SLA breaches recorded. All deadlines are being met!</p>
            </div>
          ) : (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <Card
                  label="Total Breaches (30d)"
                  value={breachAnalytics.totalBreaches}
                  color="#f44336"
                  icon="🚨"
                />
                <Card
                  label="Breach Rate"
                  value={`${breachAnalytics.breachRate}%`}
                  color="#ff9800"
                  icon="📉"
                />
                <Card
                  label="Avg Days Overdue"
                  value={breachAnalytics.avgDaysOverdue}
                  color="#ffc107"
                  icon="⏰"
                />
              </div>

              {/* Breaches by Priority */}
              {breachAnalytics.breachesByPriority && (
                <div>
                  <h3 style={{ fontSize: "14px", fontWeight: "600", marginBottom: "12px" }}>
                    Breaches by Priority
                  </h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {Object.entries(breachAnalytics.breachesByPriority).map(
                      ([priority, count]) => (
                        <div
                          key={priority}
                          style={{
                            background: "#262626",
                            padding: "12px",
                            borderRadius: "6px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <span>
                            {PRIORITY_ICONS[priority]} {priority.toUpperCase()}
                          </span>
                          <span
                            style={{
                              background: RISK_COLORS[priority],
                              color: "white",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontWeight: "600",
                            }}
                          >
                            {count}
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      <button
        onClick={loadSLAData}
        style={{
          marginTop: "15px",
          padding: "8px 12px",
          background: "#10a37f",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        🔄 Refresh
      </button>
    </div>
  );
}

function SLAItem({ sla, status, riskColor }) {
  return (
    <div
      style={{
        background: "#262626",
        padding: "12px",
        borderRadius: "6px",
        borderLeft: `4px solid ${riskColor}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "start",
      }}
    >
      <div>
        <div style={{ fontWeight: "600", fontSize: "13px", color: "#ddd" }}>
          {sla.milestoneName}
        </div>
        <div style={{ fontSize: "12px", color: "#999", marginTop: "4px" }}>
          Deadline: {new Date(sla.deadline).toLocaleDateString()}
        </div>
        {sla.assignedTeam && (
          <div style={{ fontSize: "11px", color: "#999" }}>
            Team: {sla.assignedTeam}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right" }}>
        <div
          style={{
            background: riskColor,
            color: "white",
            padding: "4px 8px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: "600",
            marginBottom: "4px",
          }}
        >
          {status}
        </div>
        <div style={{ fontSize: "11px", color: "#999" }}>
          {PRIORITY_ICONS[sla.priority]} {sla.priority?.toUpperCase()}
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, color, icon }) {
  return (
    <div
      style={{
        background: "#262626",
        padding: "12px",
        borderRadius: "6px",
        border: `1px solid ${color}33`,
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "18px", marginBottom: "6px" }}>{icon}</div>
      <div style={{ fontSize: "11px", color: "#999", marginBottom: "4px" }}>
        {label}
      </div>
      <div style={{ fontSize: "20px", fontWeight: "bold", color }}>{value}</div>
    </div>
  );
}
