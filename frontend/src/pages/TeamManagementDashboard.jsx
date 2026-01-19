import { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import SkillHeatmap from "../components/SkillHeatmap.jsx";
import SLAMonitor from "../components/SLAMonitor.jsx";

export default function TeamManagementDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [organizationId, setOrganizationId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [teams, setTeams] = useState([]);
  const [teamCapacity, setTeamCapacity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeSection, setActiveSection] = useState("capacity"); // capacity, skills, sla

  const [newTeamName, setNewTeamName] = useState("");
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("junior_dev");
  
  // Skill editing
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [memberSkills, setMemberSkills] = useState({});
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillLevel, setNewSkillLevel] = useState("3");

  useEffect(() => {
    // Load from localStorage
    const stored = localStorage.getItem("currentOrganizationId");
    if (stored) {
      setOrganizationId(stored);
    }
  }, [user?.uid]);

  const loadTeamData = async () => {
    if (!organizationId || !teamId) return;

    setLoading(true);
    setError("");

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

      const res = await fetch(
        `${apiUrl}/api/org/team-capacity?organizationId=${organizationId}&teamId=${teamId}`
      );
      if (!res.ok) throw new Error("Failed to load team data");
      const data = await res.json();
      setTeamCapacity(data.capacity);
      
      // Save to localStorage for use in project planner
      localStorage.setItem("currentTeamId", teamId);
    } catch (err) {
      setError(err.message);
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!newTeamName) {
      alert("Team name is required");
      return;
    }

    if (!organizationId) {
      alert("Organization ID is required");
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

      const res = await fetch(`${apiUrl}/api/org/teams`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          name: newTeamName,
          owner: user?.uid,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to create team");
      }

      const data = await res.json();
      if (!data.team) {
        throw new Error("Team was not created - check server logs");
      }

      const createdTeamId = data.team.id;
      setTeamId(createdTeamId);
      setNewTeamName("");
      alert("Team created successfully!");
      // Auto-load team data after creation
      setTimeout(() => {
        loadTeamData();
      }, 500);
    } catch (err) {
      alert("Error: " + err.message);
      console.error("Create team error:", err);
    }
  };

  const handleAddMember = async () => {
    if (!newMemberName || !newMemberEmail) {
      alert("Name and email are required");
      return;
    }

    if (!organizationId || !teamId) {
      alert("Organization ID and Team ID are required. Please create or select a team first.");
      return;
    }

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

      const res = await fetch(`${apiUrl}/api/org/team-members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId,
          teamId,
          name: newMemberName,
          email: newMemberEmail,
          role: newMemberRole,
          skills: {},
          capacity: 40,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        const errMsg = errorData.error || "Failed to add member";
        if (errMsg.includes("NOT_FOUND")) {
          throw new Error("Team does not exist. Please create the team first by clicking 'Load Team' button.");
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      if (!data.member) {
        throw new Error("Member was not created - check server logs");
      }

      setNewMemberName("");
      setNewMemberEmail("");
      setNewMemberRole("junior_dev");
      loadTeamData();
      alert("Member added successfully!");
    } catch (err) {
      alert("Error: " + err.message);
      console.error("Add member error:", err);
    }
  };

  const saveSkills = async (memberId, orgId, tId) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";

      const res = await fetch(`${apiUrl}/api/org/member-skills`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          teamId: tId,
          memberId,
          skills: memberSkills,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to save skills");
      }

      setEditingMemberId(null);
      loadTeamData();
      alert("Skills saved successfully!");
    } catch (err) {
      alert("Error: " + err.message);
      console.error("Save skills error:", err);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        color: "#ddd",
        padding: "20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "30px",
            paddingBottom: "20px",
            borderBottom: "2px solid #333",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: "32px", color: "#10a37f" }}>
              👥 Team Management
            </h1>
            <p style={{ color: "#999", margin: "5px 0 0 0" }}>
              Multi-team coordination, skill tracking, SLA monitoring
            </p>
          </div>
          <div style={{ textAlign: "right", display: "flex", gap: "8px", alignItems: "center" }}>
            <button
              onClick={() => navigate("/")}
              style={{
                padding: "8px 16px",
                fontSize: "13px",
                background: "#10a37f",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              ← Back to Project
            </button>
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
        </div>

        {/* Organization Setup */}
        <div
          style={{
            background: "#262626",
            padding: "20px",
            borderRadius: "12px",
            border: "1px solid #333",
            marginBottom: "20px",
          }}
        >
          <h2 style={{ marginTop: 0, fontSize: "16px", color: "#10a37f" }}>
            🏢 Organization Setup
          </h2>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            <input
              type="text"
              placeholder="Organization ID..."
              value={organizationId}
              onChange={(e) => {
                setOrganizationId(e.target.value);
                localStorage.setItem("currentOrganizationId", e.target.value);
              }}
              style={{
                padding: "8px 12px",
                background: "#1f1f1f",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "#ddd",
              }}
            />
            <input
              type="text"
              placeholder="Team ID..."
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              style={{
                padding: "8px 12px",
                background: "#1f1f1f",
                border: "1px solid #444",
                borderRadius: "6px",
                color: "#ddd",
              }}
            />
            <button
              onClick={loadTeamData}
              style={{
                padding: "8px 16px",
                background: "#10a37f",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              Load Team
            </button>
          </div>
        </div>

        {error && (
          <div
            style={{
              padding: "15px",
              background: "#fee",
              border: "1px solid #fcc",
              borderRadius: "8px",
              color: "#c33",
              marginBottom: "20px",
            }}
          >
            ❌ {error}
          </div>
        )}

        {!organizationId || !teamId ? (
          <div
            style={{
              padding: "40px",
              textAlign: "center",
              color: "#999",
              background: "#262626",
              borderRadius: "12px",
              border: "1px solid #333",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "10px" }}>👥</div>
            <p>Enter Organization ID and Team ID to manage teams</p>
          </div>
        ) : (
          <>
            {/* Team Capacity */}
            {teamCapacity && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "15px",
                  marginBottom: "30px",
                }}
              >
                <CapacityCard
                  label="Total Capacity"
                  value={`${teamCapacity.capacity}h`}
                  icon="⏱️"
                />
                <CapacityCard
                  label="Utilization"
                  value={`${teamCapacity.utilization}%`}
                  icon="📊"
                  color={teamCapacity.utilization > 80 ? "#ff9800" : "#10a37f"}
                />
                <CapacityCard
                  label="Team Members"
                  value={teamCapacity.memberCount}
                  icon="👥"
                />
                <CapacityCard
                  label="Available"
                  value={`${teamCapacity.available}h`}
                  icon="✅"
                />
              </div>
            )}

            {/* Sections */}
            <div
              style={{
                display: "flex",
                gap: "10px",
                marginBottom: "20px",
                borderBottom: "1px solid #333",
                paddingBottom: "10px",
              }}
            >
              {["capacity", "skills", "sla"].map((section) => (
                <button
                  key={section}
                  onClick={() => setActiveSection(section)}
                  style={{
                    padding: "8px 16px",
                    background: activeSection === section ? "#10a37f" : "transparent",
                    color: activeSection === section ? "white" : "#999",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "12px",
                    fontWeight: "600",
                  }}
                >
                  {section === "capacity" && "📋 Team Members"}
                  {section === "skills" && "🎯 Skills"}
                  {section === "sla" && "⏰ SLA"}
                </button>
              ))}
            </div>

            {/* Capacity/Members Section */}
            {activeSection === "capacity" && (
              <div
                style={{
                  background: "#262626",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "1px solid #333",
                  marginBottom: "30px",
                }}
              >
                <h2 style={{ marginTop: 0, fontSize: "16px", color: "#10a37f" }}>
                  👥 Add Team Member
                </h2>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
                    gap: "10px",
                    marginBottom: "15px",
                  }}
                >
                  <input
                    type="text"
                    placeholder="Name..."
                    value={newMemberName}
                    onChange={(e) => setNewMemberName(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      background: "#1f1f1f",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      color: "#ddd",
                    }}
                  />
                  <input
                    type="email"
                    placeholder="Email..."
                    value={newMemberEmail}
                    onChange={(e) => setNewMemberEmail(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      background: "#1f1f1f",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      color: "#ddd",
                    }}
                  />
                  <select
                    value={newMemberRole}
                    onChange={(e) => setNewMemberRole(e.target.value)}
                    style={{
                      padding: "8px 12px",
                      background: "#1f1f1f",
                      border: "1px solid #444",
                      borderRadius: "6px",
                      color: "#ddd",
                    }}
                  >
                    <option value="frontend_lead">Frontend Lead</option>
                    <option value="backend_lead">Backend Lead</option>
                    <option value="devops_engineer">DevOps Engineer</option>
                    <option value="qa_engineer">QA Engineer</option>
                    <option value="product_manager">Product Manager</option>
                    <option value="junior_dev">Junior Developer</option>
                  </select>
                  <button
                    onClick={handleAddMember}
                    style={{
                      padding: "8px 16px",
                      background: "#10a37f",
                      color: "white",
                      border: "none",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    Add Member
                  </button>
                </div>

                {teamCapacity && teamCapacity.members && (
                  <div>
                    <h3 style={{ fontSize: "14px", marginBottom: "12px" }}>
                      Team Members
                    </h3>
                    <div
                      style={{ display: "flex", flexDirection: "column", gap: "8px" }}
                    >
                      {teamCapacity.members.map((member) => (
                        <div
                          key={member.id}
                          style={{
                            background: "#1f1f1f",
                            padding: "12px",
                            borderRadius: "6px",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: "600" }}>{member.name}</div>
                            <div style={{ fontSize: "12px", color: "#999" }}>
                              {member.role}
                            </div>
                          </div>
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: "12px", color: "#999" }}>
                              {member.workload}h / {member.capacity}h
                            </div>
                            <div
                              style={{
                                width: "60px",
                                height: "4px",
                                background: "#333",
                                borderRadius: "2px",
                                marginTop: "4px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  height: "100%",
                                  background:
                                    member.utilization > 80
                                      ? "#ff9800"
                                      : "#10a37f",
                                  width: `${member.utilization}%`,
                                }}
                              />
                            </div>
                            <div
                              style={{ fontSize: "11px", color: "#999", marginTop: "2px" }}
                            >
                              {member.utilization.toFixed(0)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Skills Section */}
            {activeSection === "skills" && (
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                {/* Skills Editor */}
                <div
                  style={{
                    background: "#262626",
                    padding: "20px",
                    borderRadius: "12px",
                    border: "1px solid #333",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                    <h2 style={{ margin: 0, fontSize: "16px", color: "#10a37f" }}>
                      🎯 Edit Member Skills
                    </h2>
                    <button
                      onClick={() => {
                        loadTeamData();
                        setEditingMemberId(null);
                      }}
                      style={{
                        padding: "6px 12px",
                        background: "#444",
                        color: "#ddd",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px",
                      }}
                    >
                      🔄 Refresh
                    </button>
                  </div>
                  
                  {teamCapacity && teamCapacity.members && teamCapacity.members.length > 0 ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {teamCapacity.members.map((member) => (
                        <div
                          key={member.id}
                          style={{
                            background: "#1f1f1f",
                            padding: "12px",
                            borderRadius: "6px",
                            border: editingMemberId === member.id ? "1px solid #10a37f" : "1px solid #333",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            if (editingMemberId === member.id) {
                              setEditingMemberId(null);
                            } else {
                              setEditingMemberId(member.id);
                              setMemberSkills(member.skills || {});
                              setNewSkillName("");
                              setNewSkillLevel("3");
                            }
                          }}
                        >
                          <div style={{ fontWeight: "600", marginBottom: "8px" }}>
                            {member.name}
                          </div>
                          
                          {editingMemberId === member.id && (
                            <div style={{ marginTop: "12px" }}>
                              {Object.entries(memberSkills).length > 0 && (
                                <div style={{ marginBottom: "12px" }}>
                                  <div style={{ fontSize: "12px", color: "#999", marginBottom: "8px" }}>
                                    Current Skills:
                                  </div>
                                  {Object.entries(memberSkills).map(([skillName, level]) => (
                                    <div
                                      key={skillName}
                                      style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        alignItems: "center",
                                        padding: "6px 0",
                                        fontSize: "12px",
                                        borderBottom: "1px solid #333",
                                      }}
                                    >
                                      <span>{skillName}</span>
                                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                                        <span style={{ color: "#10a37f", fontWeight: "bold" }}>
                                          {level}/5
                                        </span>
                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            const updated = { ...memberSkills };
                                            delete updated[skillName];
                                            setMemberSkills(updated);
                                          }}
                                          style={{
                                            background: "#ff4757",
                                            border: "none",
                                            color: "white",
                                            padding: "2px 6px",
                                            borderRadius: "3px",
                                            cursor: "pointer",
                                            fontSize: "11px",
                                          }}
                                        >
                                          Remove
                                        </button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                              
                              <div style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                                <input
                                  type="text"
                                  placeholder="Skill name (e.g., React)"
                                  value={newSkillName}
                                  onChange={(e) => setNewSkillName(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    flex: 1,
                                    padding: "6px 8px",
                                    background: "#1f1f1f",
                                    border: "1px solid #444",
                                    borderRadius: "4px",
                                    color: "#ddd",
                                    fontSize: "12px",
                                  }}
                                />
                                <select
                                  value={newSkillLevel}
                                  onChange={(e) => setNewSkillLevel(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  style={{
                                    padding: "6px 8px",
                                    background: "#1f1f1f",
                                    border: "1px solid #444",
                                    borderRadius: "4px",
                                    color: "#ddd",
                                    fontSize: "12px",
                                    minWidth: "50px",
                                  }}
                                >
                                  <option value="1">1 ⭐</option>
                                  <option value="2">2 ⭐</option>
                                  <option value="3">3 ⭐</option>
                                  <option value="4">4 ⭐</option>
                                  <option value="5">5 ⭐</option>
                                </select>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (newSkillName) {
                                      setMemberSkills({
                                        ...memberSkills,
                                        [newSkillName]: parseInt(newSkillLevel),
                                      });
                                      setNewSkillName("");
                                      setNewSkillLevel("3");
                                    }
                                  }}
                                  style={{
                                    padding: "6px 12px",
                                    background: "#10a37f",
                                    color: "white",
                                    border: "none",
                                    borderRadius: "4px",
                                    cursor: "pointer",
                                    fontSize: "12px",
                                    fontWeight: "600",
                                  }}
                                >
                                  Add
                                </button>
                              </div>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  saveSkills(member.id, organizationId, teamId);
                                }}
                                style={{
                                  width: "100%",
                                  padding: "8px 12px",
                                  background: "#10a37f",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                  fontSize: "12px",
                                  fontWeight: "600",
                                }}
                              >
                                Save Skills
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={{ color: "#999", fontSize: "12px" }}>
                      No team members. Add members in the Team Members tab first.
                    </div>
                  )}
                </div>

                {/* Heatmap Display */}
                <SkillHeatmap
                  organizationId={organizationId}
                  teamId={teamId}
                  visible={true}
                  refreshTrigger={editingMemberId === null}
                />
              </div>
            )}

            {/* SLA Section */}
            {activeSection === "sla" && (
              <SLAMonitor organizationId={organizationId} visible={true} />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CapacityCard({ label, value, icon, color = "#10a37f" }) {
  return (
    <div
      style={{
        background: "#1a1a1a",
        padding: "15px",
        borderRadius: "12px",
        border: "1px solid #333",
        textAlign: "center",
      }}
    >
      <div style={{ fontSize: "24px", marginBottom: "8px" }}>{icon}</div>
      <div style={{ fontSize: "12px", color: "#999", marginBottom: "6px" }}>
        {label}
      </div>
      <div style={{ fontSize: "22px", fontWeight: "bold", color }}>
        {value}
      </div>
    </div>
  );
}
