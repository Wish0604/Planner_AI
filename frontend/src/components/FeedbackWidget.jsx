import { useState } from "react";

export default function FeedbackWidget({ projectId, userId, roadmapContent, usedModel, onSubmit, onClose, projectTitle }) {
  const [showFeedback, setShowFeedback] = useState(true);
  const [rating, setRating] = useState(0);
  const [usability, setUsability] = useState(0);
  const [completeness, setCompleteness] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [comments, setComments] = useState("");
  const [projectStatus, setProjectStatus] = useState("planning");
  const [completedPhases, setCompletedPhases] = useState("");
  const [blockers, setBlockers] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!projectId || !userId) {
      alert("Please select a project first");
      return;
    }
    
    if (!rating || !usability || !completeness || !accuracy) {
      alert("Please rate all criteria");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      console.log("Submitting feedback with:", { userId, projectId, rating, usability, completeness, accuracy });
      
      const response = await fetch(`${apiUrl}/api/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          projectId,
          rating,
          usability,
          completeness,
          accuracy,
          comments,
          projectStatus,
          completedPhases: completedPhases.split(",").filter(p => p.trim()),
          blockers: blockers.split(",").filter(b => b.trim()),
          generatedPrompt: projectId,
          usedModel,
          generatedRoadmap: roadmapContent,
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        console.error("Response error:", errText);
        throw new Error(`Failed to submit feedback: ${response.status}`);
      }

      const data = await response.json();
      
      setSubmitted(true);
      setShowFeedback(false);
      
      // Reset form
      setTimeout(() => {
        setRating(0);
        setUsability(0);
        setCompleteness(0);
        setAccuracy(0);
        setComments("");
        setProjectStatus("planning");
        setCompletedPhases("");
        setBlockers("");
        setSubmitted(false);
        if (onClose) onClose();
      }, 2000);

      if (onSubmit) onSubmit(data.feedback);
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const StarRating = ({ label, value, onChange }) => (
    <div style={{ marginBottom: "12px" }}>
      <label style={{ display: "block", fontSize: "13px", marginBottom: "6px", fontWeight: "600" }}>
        {label}
      </label>
      <div style={{ display: "flex", gap: "6px" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onChange(star)}
            style={{
              width: "32px",
              height: "32px",
              border: "none",
              borderRadius: "6px",
              background: value >= star ? "#10a37f" : "#262626",
              color: value >= star ? "white" : "#666",
              cursor: "pointer",
              fontSize: "16px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              if (!loading) e.target.style.background = "#10a37f";
            }}
            onMouseLeave={(e) => {
              e.target.style.background = value >= star ? "#10a37f" : "#262626";
            }}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  );

  if (submitted) {
    return (
      <div style={{
        padding: "16px",
        background: "#10a37f",
        color: "white",
        borderRadius: "8px",
        textAlign: "center",
        marginTop: "16px",
      }}>
        ✅ Thank you! Your feedback helps improve roadmaps.
      </div>
    );
  }

  return (
    <div style={{ marginTop: "20px" }}>
      {!showFeedback ? (
        <button
          onClick={() => setShowFeedback(true)}
          style={{
            width: "100%",
            padding: "12px",
            background: "#262626",
            color: "#ddd",
            border: "1px solid #444",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "600",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "#333";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "#262626";
          }}
        >
          📊 Provide Feedback on This Roadmap
        </button>
      ) : (
        <div style={{
          background: "#1f1f1f",
          border: "1px solid #333",
          borderRadius: "12px",
          padding: "20px",
          marginTop: "12px",
        }}>
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
          }}>
            <div>
              <h3 style={{ margin: 0, color: "#fff", fontSize: "16px" }}>
                📋 How did we do?
              </h3>
              {projectTitle && (
                <p style={{ margin: "6px 0 0 0", color: "#999", fontSize: "13px" }}>
                  Project: <span style={{ color: "#10a37f", fontWeight: "600" }}>{projectTitle}</span>
                </p>
              )}
            </div>
            <button
              onClick={() => {
                setShowFeedback(false);
                if (onClose) onClose();
              }}
              style={{
                background: "none",
                border: "none",
                color: "#999",
                cursor: "pointer",
                fontSize: "20px",
              }}
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {/* Ratings */}
            <div style={{
              background: "#262626",
              padding: "16px",
              borderRadius: "8px",
              marginBottom: "16px",
            }}>
              <StarRating label="Overall Satisfaction" value={rating} onChange={setRating} />
              <StarRating label="Usability / Practicality" value={usability} onChange={setUsability} />
              <StarRating label="Completeness" value={completeness} onChange={setCompleteness} />
              <StarRating label="Technical Accuracy" value={accuracy} onChange={setAccuracy} />
            </div>

            {/* Project Status */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", marginBottom: "6px", fontWeight: "600", color: "#ddd" }}>
                Project Status
              </label>
              <select
                value={projectStatus}
                onChange={(e) => setProjectStatus(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#262626",
                  color: "#ddd",
                  border: "1px solid #444",
                  borderRadius: "6px",
                  fontSize: "13px",
                }}
              >
                <option value="planning">Planning</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="abandoned">Abandoned</option>
              </select>
            </div>

            {/* Completed Phases */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", marginBottom: "6px", fontWeight: "600", color: "#ddd" }}>
                Completed Phases (comma-separated)
              </label>
              <textarea
                value={completedPhases}
                onChange={(e) => setCompletedPhases(e.target.value)}
                placeholder="e.g., Setup, Core API, Testing"
                rows="2"
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#262626",
                  color: "#ddd",
                  border: "1px solid #444",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Blockers */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", marginBottom: "6px", fontWeight: "600", color: "#ddd" }}>
                Blockers/Issues (comma-separated)
              </label>
              <textarea
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                placeholder="e.g., Unclear tech requirements, Missing timeline"
                rows="2"
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#262626",
                  color: "#ddd",
                  border: "1px solid #444",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Comments */}
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "13px", marginBottom: "6px", fontWeight: "600", color: "#ddd" }}>
                Additional Comments
              </label>
              <textarea
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                placeholder="Tell us what could be improved..."
                rows="3"
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#262626",
                  color: "#ddd",
                  border: "1px solid #444",
                  borderRadius: "6px",
                  fontSize: "13px",
                  fontFamily: "inherit",
                  resize: "vertical",
                }}
              />
            </div>

            {/* Submit Button */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                type="button"
                onClick={() => {
                  setShowFeedback(false);
                  if (onClose) onClose();
                }}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: "#262626",
                  color: "#ddd",
                  border: "1px solid #444",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.target.style.background = "#333";
                }}
                onMouseLeave={(e) => {
                  e.target.style.background = "#262626";
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 1,
                  padding: "10px",
                  background: loading ? "#666" : "#10a37f",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: loading ? "not-allowed" : "pointer",
                  fontSize: "14px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!loading) e.target.style.background = "#0d9270";
                }}
                onMouseLeave={(e) => {
                  if (!loading) e.target.style.background = "#10a37f";
                }}
              >
                {loading ? "Submitting..." : "Submit"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
