import { useState, useEffect } from "react";

const PROFICIENCY_COLORS = {
  5: "#4caf50", // Expert - Green
  4: "#8bc34a", // Advanced - Light Green
  3: "#ffc107", // Intermediate - Yellow
  2: "#ff9800", // Beginner - Orange
  1: "#f44336", // Learning - Red
};

const PROFICIENCY_LABELS = {
  5: "Expert",
  4: "Advanced",
  3: "Intermediate",
  2: "Beginner",
  1: "Learning",
};

export default function SkillHeatmap({ organizationId, teamId, visible = true, refreshTrigger = null }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterSkill, setFilterSkill] = useState("");
  const [minProficiency, setMinProficiency] = useState(1);

  useEffect(() => {
    if (visible && organizationId && teamId) {
      loadSkillHeatmap();
    }
  }, [organizationId, teamId, visible, refreshTrigger]);

  const loadSkillHeatmap = async () => {
    try {
      setLoading(true);
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const res = await fetch(
        `${apiUrl}/api/org/skill-heatmap?organizationId=${organizationId}&teamId=${teamId}`
      );
      if (!res.ok) throw new Error("Failed to load skill heatmap");
      const data = await res.json();
      setHeatmapData(data.heatmap || []);
      setError("");
    } catch (err) {
      setError(err.message);
      console.error("Error loading skill heatmap:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!visible) return null;

  if (loading) {
    return (
      <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
        <div style={{ fontSize: "18px", marginBottom: "10px" }}>🎯</div>
        Loading skill heatmap...
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
        }}
      >
        ❌ {error}
      </div>
    );
  }

  // Get unique skills
  const allSkills = [...new Set(heatmapData.map((item) => item.skill))];

  // Filter data
  const filteredData = heatmapData.filter(
    (item) =>
      item.proficiency >= minProficiency &&
      (!filterSkill || item.skill.toLowerCase().includes(filterSkill.toLowerCase()))
  );

  // Group by member
  const memberMap = {};
  filteredData.forEach((item) => {
    if (!memberMap[item.memberName]) {
      memberMap[item.memberName] = {
        name: item.memberName,
        role: item.memberRole,
        skills: {},
      };
    }
    memberMap[item.memberName].skills[item.skill] = item.proficiency;
  });

  const members = Object.values(memberMap);

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
      <h2 style={{ marginTop: 0, fontSize: "18px", color: "#10a37f" }}>
        🎯 Team Skill Heatmap
      </h2>
      <p style={{ color: "#999", fontSize: "13px", marginBottom: "15px" }}>
        Proficiency levels across team members
      </p>

      {/* Filters */}
      <div
        style={{
          display: "flex",
          gap: "15px",
          marginBottom: "20px",
          flexWrap: "wrap",
        }}
      >
        <input
          type="text"
          placeholder="Filter skills..."
          value={filterSkill}
          onChange={(e) => setFilterSkill(e.target.value)}
          style={{
            padding: "8px 12px",
            background: "#262626",
            border: "1px solid #444",
            borderRadius: "6px",
            color: "#ddd",
            fontSize: "13px",
          }}
        />

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <label style={{ fontSize: "12px", color: "#999" }}>
            Min Level: {minProficiency}
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={minProficiency}
            onChange={(e) => setMinProficiency(parseInt(e.target.value))}
            style={{ width: "100px" }}
          />
        </div>

        <button
          onClick={loadSkillHeatmap}
          style={{
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

      {/* Legend */}
      <div style={{ display: "flex", gap: "20px", marginBottom: "20px", flexWrap: "wrap", fontSize: "12px" }}>
        {Object.entries(PROFICIENCY_LABELS).map(([level, label]) => (
          <div key={level} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "2px",
                background: PROFICIENCY_COLORS[level],
              }}
            />
            <span style={{ color: "#999" }}>{label}</span>
          </div>
        ))}
      </div>

      {members.length === 0 ? (
        <div style={{ padding: "20px", textAlign: "center", color: "#999" }}>
          No skills recorded yet
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #333" }}>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#10a37f",
                  }}
                >
                  Member
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "12px",
                    fontWeight: "600",
                    color: "#10a37f",
                  }}
                >
                  Role
                </th>
                {allSkills
                  .filter(
                    (skill) =>
                      !filterSkill ||
                      skill.toLowerCase().includes(filterSkill.toLowerCase())
                  )
                  .map((skill) => (
                    <th
                      key={skill}
                      style={{
                        padding: "12px",
                        textAlign: "center",
                        fontSize: "11px",
                        fontWeight: "600",
                        color: "#999",
                        maxWidth: "80px",
                      }}
                    >
                      {skill}
                    </th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {members.map((member, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #333",
                    background: i % 2 === 0 ? "transparent" : "#262626",
                  }}
                >
                  <td
                    style={{
                      padding: "12px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "#ddd",
                    }}
                  >
                    {member.name}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      fontSize: "12px",
                      color: "#999",
                    }}
                  >
                    {member.role}
                  </td>
                  {allSkills
                    .filter(
                      (skill) =>
                        !filterSkill ||
                        skill.toLowerCase().includes(filterSkill.toLowerCase())
                    )
                    .map((skill) => (
                      <td
                        key={skill}
                        style={{
                          padding: "12px",
                          textAlign: "center",
                          fontSize: "11px",
                        }}
                      >
                        {member.skills[skill] ? (
                          <div
                            style={{
                              display: "inline-block",
                              background:
                                PROFICIENCY_COLORS[member.skills[skill]],
                              color: "white",
                              padding: "4px 8px",
                              borderRadius: "4px",
                              fontWeight: "600",
                            }}
                          >
                            {member.skills[skill]}
                          </div>
                        ) : (
                          <span style={{ color: "#666" }}>—</span>
                        )}
                      </td>
                    ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
