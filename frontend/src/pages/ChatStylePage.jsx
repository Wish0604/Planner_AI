import { useState, useContext, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { saveAnalysis } from "../services/firestoreService.jsx";
import { subscribeToProjects, saveProject, updateProject, deleteProject } from "../services/projectService.jsx";
import {
  RoadmapRenderer,
  TechStackRenderer,
  TimelineRenderer,
  RisksRenderer,
  DeliverablesRenderer
} from "../components/AgentOutputRenderer.jsx";
import Robot3D from "../components/Robot3D.jsx";
import FeedbackWidget from "../components/FeedbackWidget.jsx";
import ExplanationViewer from "../components/ExplanationViewer.jsx";

export default function ChatStyleProjectPlanner() {
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const [idea, setIdea] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [messages, setMessages] = useState([]);
  const [projectChats, setProjectChats] = useState({});
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true);
  const [activeTab, setActiveTab] = useState("roadmap");
  const [projects, setProjects] = useState([]);
  const [activeProjectId, setActiveProjectId] = useState(null);
  const messagesEndRef = useRef(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [projectMenuOpenId, setProjectMenuOpenId] = useState(null);
  const [hoveredProjectId, setHoveredProjectId] = useState(null);
  const [toast, setToast] = useState(null);
  const currentProject = projects.find((p) => p.id === activeProjectId);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProjectTitle, setNewProjectTitle] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Handle mobile responsiveness
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) {
        setSidebarCollapsed(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Subscribe to user's projects
  useEffect(() => {
    if (!user?.uid) return;

    const unsubscribe = subscribeToProjects(user.uid, (loadedProjects) => {
      setProjects(loadedProjects);
      console.log("Projects updated:", loadedProjects);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // Deep link: activate project from ?projectId=...
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get("projectId");
    if (pid && projects.length > 0) {
      const p = projects.find((prj) => prj.id === pid);
      if (p) {
        loadProject(p);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  // Auto-clear toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2000);
    return () => clearTimeout(t);
  }, [toast]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Persistent chat storage helpers
  const chatStorageKey = (pid) => `chat_v1:${user?.uid || 'guest'}:${pid || '__global__'}`;
  const saveChatToStorage = (pid, msgs) => {
    try {
      localStorage.setItem(chatStorageKey(pid), JSON.stringify(msgs || []));
    } catch (e) {
      console.warn('Failed to persist chat', e);
    }
  };
  const loadChatFromStorage = (pid) => {
    try {
      const raw = localStorage.getItem(chatStorageKey(pid));
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Failed to load chat', e);
      return null;
    }
  };

  const applyMessagesUpdate = (projectKey, next) => {
    if (typeof next === "function") {
      setMessages((prev) => {
        const updated = next(prev);
        setProjectChats((p) => ({ ...p, [projectKey]: updated }));
        saveChatToStorage(projectKey, updated);
        return updated;
      });
    } else {
      setMessages(next);
      setProjectChats((p) => ({ ...p, [projectKey]: next }));
      saveChatToStorage(projectKey, next);
    }
  };

  const setMessagesForProject = (projectId, next) => {
    const key = projectId || "__global__";
    applyMessagesUpdate(key, next);
  };

  const setMessagesForActive = (next) => {
    const key = activeProjectId || "__global__";
    applyMessagesUpdate(key, next);
  };

  // Hydrate chat from storage when switching projects or on load
  useEffect(() => {
    const key = activeProjectId || "__global__";
    const stored = loadChatFromStorage(key);
    if (stored && Array.isArray(stored)) {
      setMessages(stored);
      setProjectChats((p) => ({ ...p, [key]: stored }));
    } else {
      setProjectChats((p) => ({ ...p, [key]: p[key] || [] }));
    }
  }, [activeProjectId, user?.uid]);


  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchTeamContext = async () => {
    if (!user?.uid) return null;
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      
      // Fetch team data from your organization
      const orgId = localStorage.getItem('currentOrganizationId');
      const teamId = localStorage.getItem('currentTeamId');
      
      if (!orgId || !teamId) return null;
      
      const response = await fetch(`${apiUrl}/api/org/team-capacity?organizationId=${orgId}&teamId=${teamId}`);
      if (!response.ok) return null;
      
      const data = await response.json();
      if (!data.capacity) return null;
      
      return {
        teamMembers: data.capacity.members || [],
        totalCapacity: data.capacity.capacity || 0,
        memberCount: data.capacity.memberCount || 0,
        utilization: data.capacity.utilization || 0,
        skills: data.capacity.members?.flatMap(m => 
          Object.keys(m.skills || {}).map(skill => ({ skill, member: m.name }))
        ) || [],
        organizationId: orgId,
        teamId: teamId
      };
    } catch (error) {
      console.error('Failed to fetch team context:', error);
      return null;
    }
  };

  const generate = async () => {
    if (!idea.trim()) {
      alert("Please enter a query or idea");
      return;
    }

    // If project already has a report, treat this as normal chat
    if (currentProject?.report && activeProjectId) {
      await sendChatMessage(idea);
      return;
    }

    // Track which project this exchange belongs to (current or newly created plan)
    let targetProjectId = activeProjectId;

    const userIdea = idea;

    // Fetch team context (skills, capacity, SLA)
    const teamContext = await fetchTeamContext();

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: "user",
      content: userIdea
    };
    setMessagesForActive((prev) => [...prev, userMessage]);
    setIdea("");
    setLoading(true);
    setError("");

    try {
      // Add loading message
      const loadingMessage = {
        id: Date.now() + 1,
        type: "assistant",
        content: "analyzing",
        isLoading: true,
        usedModel: null
      };
      setMessagesForActive((prev) => [...prev, loadingMessage]);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/multi-agent-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          input: userIdea,
          userId: user?.uid || 'anonymous',
          teamContext: teamContext
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${res.status}`);
      }

      const data = await res.json();
      
      // Map new endpoint response to expected format
      const report = data.result || data.report;
      const usedModel = data.usedModel;

      // Save/update project in Firestore
      if (user) {
        setSaving(true);
        try {
          await saveAnalysis(user.uid, userIdea, report);
          if (activeProjectId) {
            await updateProject(user.uid, activeProjectId, { report });
            targetProjectId = activeProjectId;
          } else {
            // Create a new project with the user's idea as title
            const projectId = await saveProject(user.uid, userIdea, report);
            targetProjectId = projectId;
            setActiveProjectId(projectId);
            // Move current chat history from the global key to this new project
            const currentMsgs = projectChats.__global__ || messages;
            setMessagesForProject(projectId, currentMsgs);
            setProjectChats((prev) => {
              if (!prev.__global__) return prev;
              const { __global__, ...rest } = prev;
              return { ...rest, [projectId]: prev.__global__ };
            });
          }
        } catch (saveErr) {
          console.error("Failed to save analysis:", saveErr);
        } finally {
          setSaving(false);
        }
      }

      // Add assistant response with model badge
      const assistantMessage = {
        id: Date.now() + 2,
        type: "assistant",
        content: report,
        isLoading: false,
        usedModel
      };

      const resolvedProjectId = targetProjectId || activeProjectId || null;
      setMessagesForProject(resolvedProjectId, (prev) => prev.filter((m) => !m.isLoading).concat(assistantMessage));
      setActiveTab("roadmap");
    } catch (err) {
      setError(err.message);
      const resolvedProjectId = targetProjectId || activeProjectId || null;
      setMessagesForProject(resolvedProjectId, (prev) => prev.filter((m) => !m.isLoading));
      console.error("Error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Normal chat over existing project context
  const sendChatMessage = async (text) => {
    const msgText = (text ?? idea).trim();
    if (!msgText) return;

    // Validate we have a current project
    if (!currentProject) {
      setError("Please select a project first");
      return;
    }

    // Add user message
    const userMessage = { id: Date.now(), type: "user", content: msgText };
    setMessagesForActive((prev) => [...prev, userMessage]);
    if (text === undefined) setIdea("");
    setLoading(true);
    setError("");

    try {
      const loadingMessage = { id: Date.now() + 1, type: "assistant", content: "thinking", isLoading: true };
      setMessagesForActive((prev) => [...prev, loadingMessage]);

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      console.log("Sending chat to:", `${apiUrl}/api/project-chat`);
      
      const res = await fetch(`${apiUrl}/api/project-chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: msgText,
          projectTitle: currentProject?.title,
          projectReport: currentProject?.report
        })
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(errorData.error || `API error: ${res.status}`);
      }
      
      const data = await res.json();
      
      if (!data.reply) {
        throw new Error("No reply received from API");
      }

      const assistantMessage = { id: Date.now() + 2, type: "assistant", content: data.reply, mode: "chat", isLoading: false };
      setMessagesForActive((prev) => prev.filter((m) => !m.isLoading).concat(assistantMessage));
    } catch (err) {
      console.error("Chat error:", err);
      setError(err.message);
      setMessagesForActive((prev) => prev.filter((m) => !m.isLoading));
    } finally {
      setLoading(false);
    }
  };

  // Generate initial multi-agent plan for a new project title
  const generateInitialPlan = async (initialText, targetProjectId) => {
    const seedText = (initialText || "").trim();
    if (!seedText) return;

    // Seed user message and loading under the target project
    const userMessage = { id: Date.now(), type: "user", content: seedText };
    setMessagesForProject(targetProjectId, (prev) => [...prev, userMessage]);
    setLoading(true);
    setError("");

    try {
      const loadingMessage = { id: Date.now() + 1, type: "assistant", content: "analyzing", isLoading: true, usedModel: null };
      setMessagesForProject(targetProjectId, (prev) => [...prev, loadingMessage]);

      // Fetch team context
      const teamContext = await fetchTeamContext();

      const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:8080";
      const res = await fetch(`${apiUrl}/api/multi-agent-roadmap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          input: seedText,
          userId: user?.uid || 'anonymous',
          teamContext: teamContext
        })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `API error: ${res.status}`);
      }
      const data = await res.json();
      
      const report = data.result || data.report;
      const usedModel = data.usedModel;

      // Persist report to project
      await updateProject(user.uid, targetProjectId, { report });

      const assistantMessage = { id: Date.now() + 2, type: "assistant", content: report, isLoading: false, usedModel };
      setMessagesForProject(targetProjectId, (prev) => prev.filter((m) => !m.isLoading).concat(assistantMessage));
      setActiveTab("roadmap");
    } catch (err) {
      setError(err.message);
      setMessagesForProject(targetProjectId, (prev) => prev.filter((m) => !m.isLoading));
    } finally {
      setLoading(false);
    }
  };

  const loadProject = (project) => {
    setActiveProjectId(project.id);
    const cached = projectChats[project.id];
    if (cached && Array.isArray(cached)) {
      setMessagesForProject(project.id, cached);
    } else if (project.report) {
      const seed = [
        {
          id: Date.now(),
          type: "assistant",
          content: project.report,
          isLoading: false
        }
      ];
      setMessagesForProject(project.id, seed);
    } else {
      setMessagesForProject(project.id, []);
    }
    setActiveTab("roadmap");
    if (isMobile) {
      setSidebarCollapsed(true);
    }
    setProjectMenuOpenId(null);
  };



  const addNewProject = () => {
    if (!user?.uid) return;
    setNewProjectTitle("");
    setShowCreateModal(true);
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    setNewProjectTitle("");
  };

  const createProject = async () => {
    if (!user?.uid) return;
    const title = (newProjectTitle || "New Project").trim();
    if (!title) return;
    try {
      const projectId = await saveProject(user.uid, title, null);
      setActiveProjectId(projectId);
      setMessagesForProject(projectId, []);
      setShowCreateModal(false);
      // Generate initial plan
      await generateInitialPlan(title, projectId);
    } catch (e) {
      console.error("Failed to create project", e);
      setError("Failed to create project");
      setShowCreateModal(false);
    }
  };

  const renameProject = async (project) => {
    const newTitle = (window.prompt("Rename project", project.title) || "").trim();
    if (!newTitle) return;
    try {
      await updateProject(user.uid, project.id, { title: newTitle });
      setProjectMenuOpenId(null);
    } catch (e) {
      console.error("Failed to rename project", e);
      setError("Failed to rename project");
    }
  };

  const removeProject = async (project) => {
    setProjectToDelete(project);
    setShowDeleteModal(true);
    setProjectMenuOpenId(null);
  };

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject(user.uid, projectToDelete.id);
      if (activeProjectId === projectToDelete.id) {
        setActiveProjectId(null);
        setMessagesForProject(null, []);
      }
      setProjectChats((prev) => {
        const cp = { ...prev };
        delete cp[projectToDelete.id];
        return cp;
      });
      setShowDeleteModal(false);
      setProjectToDelete(null);
    } catch (e) {
      console.error("Failed to delete project", e);
      setError("Failed to delete project");
      setShowDeleteModal(false);
      setProjectToDelete(null);
    }
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setProjectToDelete(null);
  };

  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "Arial, sans-serif", backgroundColor: "#0f0f10", color: "white" }}>
      {/* Delete Project Modal */}
      {showDeleteModal && projectToDelete && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeDeleteModal(); }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              width: "min(420px, 92vw)",
              backgroundColor: "#151515",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              padding: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)"
            }}
          >
            <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: 600 }}>Delete project?</h3>
            <p style={{ margin: "0 0 20px 0", fontSize: "14px", color: "#9aa0a6", lineHeight: "1.5" }}>
              This will permanently delete <strong style={{ color: "#e5e7eb" }}>"{projectToDelete.title}"</strong> and all associated chats. This cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button 
                onClick={closeDeleteModal} 
                style={{ 
                  backgroundColor: "#262626", 
                  color: "#ddd", 
                  border: "1px solid #3a3a3b", 
                  borderRadius: "8px", 
                  padding: "10px 16px", 
                  cursor: "pointer",
                  fontWeight: 500
                }}
              >
                Cancel
              </button>
              <button 
                onClick={confirmDeleteProject} 
                style={{ 
                  backgroundColor: "#dc2626", 
                  color: "white", 
                  border: "none", 
                  borderRadius: "8px", 
                  padding: "10px 16px", 
                  cursor: "pointer",
                  fontWeight: 600,
                  transition: "all 0.2s"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#b91c1c";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#dc2626";
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Project Modal */}
      {showCreateModal && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) closeCreateModal(); }}
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
        >
          <div
            style={{
              width: "min(520px, 92vw)",
              backgroundColor: "#151515",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              padding: "18px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.45)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <h3 style={{ margin: 0, fontSize: "16px" }}>Create project</h3>
              <button onClick={closeCreateModal} style={{ background: "none", border: "none", color: "#aaa", fontSize: "18px", cursor: "pointer" }}>×</button>
            </div>
            <div style={{ fontSize: "12px", color: "#9aa0a6", marginBottom: "10px" }}>
              Projects keep chats and plans together. Name your project to get started.
            </div>
            <label style={{ display: "block", fontSize: "12px", color: "#9aa0a6", marginBottom: "6px" }}>Project name</label>
            <input
              autoFocus
              value={newProjectTitle}
              onChange={(e) => setNewProjectTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createProject(); if (e.key === "Escape") closeCreateModal(); }}
              placeholder="Project name"
              style={{
                width: "100%",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid #2f2f2f",
                backgroundColor: "#1c1c1c",
                color: "#e5e7eb",
                outline: "none",
                marginBottom: "14px"
              }}
            />
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={closeCreateModal} style={{ backgroundColor: "#262626", color: "#ddd", border: "1px solid #3a3a3b", borderRadius: "8px", padding: "8px 12px", cursor: "pointer" }}>Cancel</button>
              <button onClick={createProject} disabled={!newProjectTitle.trim()} style={{ backgroundColor: newProjectTitle.trim() ? "#10a37f" : "#2e2e2e", color: "white", border: "none", borderRadius: "8px", padding: "8px 12px", cursor: newProjectTitle.trim() ? "pointer" : "not-allowed", fontWeight: 600 }}>Create project</button>
            </div>
          </div>
        </div>
      )}
      {/* Sidebar - ChatGPT Style */}
      <aside
        style={{
          width: sidebarCollapsed ? "60px" : "260px",
          backgroundColor: "#151515",
          borderRight: "1px solid #262626",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.25s ease",
          position: isMobile ? "fixed" : "relative",
          left: 0,
          top: 0,
          height: "100vh",
          zIndex: isMobile ? (sidebarCollapsed ? 0 : 1000) : "auto",
          transform: isMobile && sidebarCollapsed ? "translateX(-100%)" : "translateX(0)",
          overflow: sidebarCollapsed ? "hidden" : "auto"
        }}
      >
        {/* Sidebar Header */}
        <div
          style={{
            padding: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: "600",
            borderBottom: "1px solid #262626",
            minHeight: "50px"
          }}
        >
          {activeProjectId && !sidebarCollapsed && (
            <button
              onClick={() => {
                setActiveProjectId(null);
                setMessagesForProject(null, projectChats.__global__ || []);
              }}
              style={{
                width: "34px",
                height: "34px",
                backgroundColor: "#1a1a1a",
                border: "1px solid #2a2a2a",
                borderRadius: "8px",
                color: "#e5e7eb",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#222";
                e.currentTarget.style.borderColor = "#3a3a3a";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#1a1a1a";
                e.currentTarget.style.borderColor = "#2a2a2a";
              }}
              title="Home"
              aria-label="Home"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <path d="M12 3l9 8h-2v9a1 1 0 0 1-1 1h-4a1 1 0 0 1-1-1v-6H11v6a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9H3l9-8z"/>
              </svg>
            </button>
          )}
          {!sidebarCollapsed && <span>Planner AI</span>}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            style={{
              background: "none",
              border: "1px solid #3a3a3b",
              color: "#ccc",
              cursor: "pointer",
              fontSize: "16px",
              padding: "6px 10px",
              borderRadius: "6px",
              marginLeft: "auto"
            }}
            title={sidebarCollapsed ? "Expand" : "Collapse"}
          >
            {sidebarCollapsed ? "→" : "←"}
          </button>
        </div>
        {/* Chat List Sections */}
        <div style={{ flex: 1, overflowY: "auto", paddingTop: "10px" }}>
          {/* Projects Section */}
          {!sidebarCollapsed && projects.length > 0 && (
            <>
              <div style={{ padding: "12px 10px 8px", fontSize: "12px", color: "#999", fontWeight: "600", textTransform: "uppercase", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span>Projects</span>
                {(messages.length > 0 || loading || activeProjectId) && (
                  <button onClick={addNewProject} style={{ backgroundColor: "#10a37f", color: "white", border: "none", borderRadius: "6px", padding: "6px 10px", fontSize: "12px", cursor: "pointer" }}>+ New</button>
                )}
              </div>
              <div style={{ paddingBottom: "10px" }}>
                {projects.length === 0 ? (
                  <div style={{ padding: "20px 16px", textAlign: "center", color: "#999", fontSize: "12px" }}>
                    No projects yet
                  </div>
                ) : (
                  projects.map((project) => {
                    const isActive = activeProjectId === project.id;
                    const showTrigger = hoveredProjectId === project.id || projectMenuOpenId === project.id;
                    return (
                    <div
                      key={project.id}
                      style={{
                        position: "relative",
                        margin: "0 8px 8px 8px",
                        backgroundColor: isActive ? "#10a37f" : "#262626",
                        borderRadius: "8px",
                        display: "flex",
                        alignItems: "center",
                        padding: "0 6px 0 0",
                        transition: "all 0.2s"
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "#1f1f1f";
                        }
                        setHoveredProjectId(project.id);
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = "#262626";
                        }
                        setHoveredProjectId(null);
                        if (projectMenuOpenId === project.id) setProjectMenuOpenId(null);
                      }}
                    >
                      <button
                        onClick={() => loadProject(project)}
                        style={{
                          flex: 1,
                          textAlign: "left",
                          padding: "10px 10px",
                          border: "none",
                          background: "transparent",
                          color: "white",
                          fontSize: "13px",
                          cursor: "pointer",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap"
                        }}
                        title={project.title}
                      >
                        {project.title}
                      </button>
                      {showTrigger && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setProjectMenuOpenId(projectMenuOpenId === project.id ? null : project.id);
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ccc",
                            cursor: "pointer",
                            padding: "8px 6px",
                            fontSize: "16px"
                          }}
                          title="Project options"
                        >
                          ⋯
                        </button>
                      )}

                      {projectMenuOpenId === project.id && (
                        <div
                          style={{
                            position: "absolute",
                            right: 0,
                            top: "110%",
                            backgroundColor: "#1f1f1f",
                            border: "1px solid #333",
                            borderRadius: "8px",
                            minWidth: "160px",
                            boxShadow: "0 8px 16px rgba(0,0,0,0.35)",
                            zIndex: 10,
                            overflow: "hidden"
                          }}
                        >
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const shareUrl = `${window.location.origin}/?projectId=${project.id}`;
                              try {
                                await navigator.clipboard.writeText(shareUrl);
                                setToast("Link copied to clipboard");
                              } catch {
                                window.prompt("Copy project link:", shareUrl);
                              }
                              setProjectMenuOpenId(null);
                            }}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 12px",
                              background: "transparent",
                              border: "none",
                              color: "#ddd",
                              cursor: "pointer",
                              fontSize: "13px"
                            }}
                          >
                            Share
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              renameProject(project);
                            }}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 12px",
                              background: "transparent",
                              border: "none",
                              color: "#ddd",
                              cursor: "pointer",
                              fontSize: "13px"
                            }}
                          >
                            Rename project
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeProject(project);
                            }}
                            style={{
                              width: "100%",
                              textAlign: "left",
                              padding: "10px 12px",
                              background: "transparent",
                              border: "none",
                              color: "#f87171",
                              cursor: "pointer",
                              fontSize: "13px"
                            }}
                          >
                            Delete project
                          </button>
                        </div>
                      )}
                    </div>
                  );
                  })
                )}
              </div>
            </>
          )}
        </div>

        {/* Sidebar Footer */}
        <div
          style={{
            borderTop: "1px solid #262626",
            padding: "12px 10px",
            display: "flex",
            gap: "8px",
            alignItems: "center",
            justifyContent: sidebarCollapsed ? "center" : "space-between"
          }}
        >
          <div
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: "#10a37f",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              fontWeight: "600",
              flexShrink: 0
            }}
          >
            {user?.email?.[0]?.toUpperCase()}
          </div>
          {!sidebarCollapsed && (
            <div style={{ display: "flex", gap: "8px", width: "100%", alignItems: "center", justifyContent: "flex-end" }}>
              {activeProjectId && (
                <button
                  onClick={() => setShowFeedbackModal(true)}
                  style={{
                    backgroundColor: "#262626",
                    border: "1px solid #3a3a3b",
                    borderRadius: "6px",
                    color: "#10a37f",
                    cursor: "pointer",
                    padding: "8px 10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "all 0.2s",
                    fontWeight: "500",
                    width: "36px",
                    height: "36px"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#1f1f1f";
                    e.currentTarget.style.borderColor = "#4a4a4b";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#262626";
                    e.currentTarget.style.borderColor = "#3a3a3b";
                  }}
                  title="Submit Feedback"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {/* Chat bubble */}
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                    {/* Thumbs up inside */}
                    <path d="M9 10l1-2 1 2" fill="currentColor" stroke="none"></path>
                    <path d="M10 6v4" strokeWidth="1.5"></path>
                  </svg>
                </button>
              )}
              <button
                onClick={logout}
                style={{
                  backgroundColor: "#262626",
                  border: "1px solid #3a3a3b",
                  borderRadius: "6px",
                  color: "#ccc",
                  cursor: "pointer",
                  padding: "8px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.2s",
                  fontWeight: "500",
                  width: "36px",
                  height: "36px"
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#1f1f1f";
                  e.currentTarget.style.borderColor = "#4a4a4b";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "#262626";
                  e.currentTarget.style.borderColor = "#3a3a3b";
                }}
                title="Logout"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                  <polyline points="16 17 21 12 16 7"></polyline>
                  <line x1="21" y1="12" x2="9" y2="12"></line>
                </svg>
              </button>
            </div>
          )}

          {showFeedbackModal && (
            <div 
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: "rgba(0,0,0,0.7)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 9999,
                backdropFilter: "blur(4px)"
              }}
              onClick={() => setShowFeedbackModal(false)}
            >
              <div onClick={(e) => e.stopPropagation()}>
                <FeedbackWidget
                  projectId={activeProjectId}
                  userId={user?.uid}
                  projectTitle={currentProject?.title || "Untitled Project"}
                  roadmapContent={messages.length > 0 && messages[messages.length - 1]?.type === "assistant" ? String(messages[messages.length - 1]?.content || "") : ""}
                  usedModel={messages.length > 0 && messages[messages.length - 1]?.type === "assistant" ? messages[messages.length - 1]?.usedModel : ""}
                  onSubmit={(feedback) => {
                    console.log("Feedback submitted:", feedback);
                  }}
                  onClose={() => setShowFeedbackModal(false)}
                />
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {isMobile && !sidebarCollapsed && (
        <div
          onClick={() => setSidebarCollapsed(true)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 999
          }}
        />
      )}

      {/* Main Content */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Messages Area */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: isMobile ? "8px 12px" : "16px 20px",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            width: "100%"
          }}
        >


          {messages.length === 0 && !loading && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                height: "100%",
                gap: isMobile ? "20px" : "24px",
                color: "#ccc",
                textAlign: "center",
                padding: isMobile ? "20px" : "40px"
              }}
            >
              <div style={{ 
                width: isMobile ? "200px" : "280px", 
                height: isMobile ? "200px" : "280px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Robot3D />
              </div>
              <div style={{ maxWidth: isMobile ? "90%" : "480px" }}>
                <h2 style={{ 
                  fontSize: isMobile ? "24px" : "32px", 
                  margin: "0 0 12px 0", 
                  color: "#fff",
                  fontWeight: "700"
                }}>
                  Welcome to Planner AI
                </h2>
              </div>
              <button
                onClick={() => setShowCreateModal(true)}
                style={{
                  padding: isMobile ? "12px 24px" : "14px 32px",
                  backgroundColor: "#10a37f",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: isMobile ? "14px" : "16px",
                  fontWeight: "600",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  boxShadow: "0 4px 12px rgba(16, 163, 127, 0.3)"
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = "#0d9270";
                  e.target.style.transform = "translateY(-2px)";
                  e.target.style.boxShadow = "0 6px 16px rgba(16, 163, 127, 0.4)";
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = "#10a37f";
                  e.target.style.transform = "translateY(0)";
                  e.target.style.boxShadow = "0 4px 12px rgba(16, 163, 127, 0.3)";
                }}
              >
                + Create New Project
              </button>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: "10px",
                  justifyContent: "center",
                  marginTop: "12px"
                }}
              >
                <button
                  onClick={() => navigate("/team-management")}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #3a3a3b",
                    borderRadius: "6px",
                    color: "#10a37f",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  title="Manage Teams & Skills"
                >
                  👥 Teams
                </button>
                <button
                  onClick={() => navigate("/audit")}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #3a3a3b",
                    borderRadius: "6px",
                    color: "#10a37f",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  title="View Audit Trail & Explanations"
                >
                  🔍 Audit
                </button>
                <button
                  onClick={() => navigate("/telemetry")}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#2a2a2a",
                    border: "1px solid #3a3a3b",
                    borderRadius: "6px",
                    color: "#10a37f",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "600",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                  title="View Telemetry Dashboard"
                >
                  📊 Telemetry
                </button>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div
              style={{
                backgroundColor: "#7f1d1d",
                borderLeft: "4px solid #dc2626",
                color: "#fca5a5",
                padding: "12px 14px",
                borderRadius: "6px",
                marginBottom: "12px",
                fontSize: isMobile ? "12px" : "13px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px"
              }}
            >
              <span>❌ {error}</span>
              <button
                onClick={() => setError("")}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fca5a5",
                  cursor: "pointer",
                  fontSize: "16px",
                  padding: "0",
                  display: "flex",
                  alignItems: "center"
                }}
              >
                ×
              </button>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: msg.type === "user" ? "flex-end" : "flex-start",
                animation: "fadeIn 0.3s ease-in"
              }}
            >
              {msg.type === "user" ? (
                <div
                  style={{
                    backgroundColor: "#10a37f",
                    color: "white",
                    padding: isMobile ? "10px 14px" : "12px 16px",
                    borderRadius: "16px",
                    maxWidth: isMobile ? "85%" : "60%",
                    wordWrap: "break-word",
                    fontSize: isMobile ? "13px" : "14px"
                  }}
                >
                  {msg.content}
                </div>
              ) : msg.isLoading ? (
                <div
                  style={{
                    display: "flex",
                    gap: "8px",
                    padding: "16px",
                    backgroundColor: "#262626",
                    borderRadius: "16px",
                    fontSize: "14px",
                    color: "#ccc"
                  }}
                >
                  <span>🤖 Analyzing with agents</span>
                  <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
                    <span style={{ animation: "pulse 0.6s infinite" }}>●</span>
                    <span style={{ animation: "pulse 0.6s infinite 0.1s" }}>●</span>
                    <span style={{ animation: "pulse 0.6s infinite 0.2s" }}>●</span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    width: "100%",
                    backgroundColor: "transparent",
                    borderRadius: "16px"
                  }}
                >
                  {/* Model Badge */}
                  {msg.usedModel && (
                    <div style={{ 
                      display: "inline-block",
                      marginBottom: "8px",
                      padding: "4px 10px",
                      borderRadius: "6px",
                      fontSize: "11px",
                      fontWeight: "bold",
                      color: "white",
                      backgroundColor: msg.usedModel === 'llama' ? '#4CAF50' : '#2196F3'
                    }}>
                      🤖 {msg.usedModel.toUpperCase()}
                    </div>
                  )}
                  
                  {/* If this assistant message is a normal chat reply, render as a bubble */}
                  {(!msg.content || !msg.content.agentOutputs) ? (
                    <div
                      style={{
                        backgroundColor: "#262626",
                        color: "#ddd",
                        padding: isMobile ? "10px 14px" : "12px 16px",
                        borderRadius: "12px",
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.5,
                        fontSize: isMobile ? "13px" : "14px"
                      }}
                    >
                      {String(msg.content)}
                    </div>
                  ) : (
                  <>
                  {/* Tabs */}
                  <div
                    style={{
                      display: "flex",
                      gap: "8px",
                      marginBottom: "16px",
                      overflowX: "auto",
                      paddingBottom: "8px"
                    }}
                  >
                    {["roadmap", "techstack", "timeline", "risks", "deliverables"].map(
                      (tab) => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab)}
                          style={{
                            padding: "8px 14px",
                            backgroundColor: activeTab === tab ? "#10a37f" : "#262626",
                            color: activeTab === tab ? "white" : "#ccc",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            whiteSpace: "nowrap",
                            transition: "all 0.2s"
                          }}
                        >
                          {tab === "roadmap" && "📋"}
                          {tab === "techstack" && "🔧"}
                          {tab === "timeline" && "📅"}
                          {tab === "risks" && "⚠️"}
                          {tab === "deliverables" && "📦"}
                        </button>
                      )
                    )}
                  </div>

                  {/* Content */}
                  <div
                    style={{
                      backgroundColor: "#262626",
                      borderRadius: "12px",
                      padding: "14px",
                      maxHeight: "400px",
                      overflowY: "auto",
                      color: "#ccc"
                    }}
                  >
                    {activeTab === "roadmap" && (
                      <div>
                        <h3 style={{ marginTop: 0 }}>📋 Project Roadmap</h3>
                        <RoadmapRenderer data={msg.content.agentOutputs.planner} />
                      </div>
                    )}
                    {activeTab === "techstack" && (
                      <div>
                        <h3 style={{ marginTop: 0 }}>🔧 Technology Stack</h3>
                        <TechStackRenderer
                          data={msg.content.agentOutputs.executors.find((e) => e.agent === "TechStack Specialist")?.output}
                        />
                      </div>
                    )}
                    {activeTab === "timeline" && (
                      <div>
                        <h3 style={{ marginTop: 0 }}>📅 Project Timeline</h3>
                        <TimelineRenderer
                          data={msg.content.agentOutputs.executors.find((e) => e.agent === "Timeline Specialist")?.output}
                        />
                      </div>
                    )}
                    {activeTab === "risks" && (
                      <div>
                        <h3 style={{ marginTop: 0 }}>⚠️ Risk Assessment</h3>
                        <RisksRenderer
                          data={msg.content.agentOutputs.executors.find((e) => e.agent === "Risk Specialist")?.output}
                        />
                      </div>
                    )}
                    {activeTab === "deliverables" && (
                      <div>
                        <h3 style={{ marginTop: 0 }}>📦 Deliverables</h3>
                        <DeliverablesRenderer
                          data={msg.content.agentOutputs.executors.find((e) => e.agent === "Deliverables Specialist")?.output}
                        />
                      </div>
                    )}
                  </div>
                  </>
                  )}
                </div>
              )}
            </div>
          ))}

          {/* PHASE 12: XAI - Explanation Viewer */}
          {messages.length > 0 && messages[messages.length - 1]?.type === "assistant" && (
            <ExplanationViewer
              projectId={activeProjectId}
              userId={user?.uid}
              visible={true}
            />
          )}

        </div>

        {/* Input Area - Only show when there are messages or active project */}
        {(messages.length > 0 || loading || activeProjectId) && (
          <div
            style={{
              padding: isMobile ? "10px 12px" : "12px 20px",
              backgroundColor: "#0f0f10"
            }}
          >
          {toast && (
            <div
              style={{
                marginBottom: isMobile ? "8px" : "10px",
                backgroundColor: "#1f2937",
                color: "#93c5fd",
                padding: "8px 12px",
                borderRadius: "8px",
                fontSize: "13px",
                width: "fit-content"
              }}
            >
              {toast}
            </div>
          )}
          <div
            style={{
              display: "flex",
              gap: isMobile ? "8px" : "12px"
            }}
          >
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  generate();
                }
              }}
              placeholder={currentProject?.title ? (isMobile ? `Search in ${currentProject.title}...` : `Ask about ${currentProject.title}... (Enter to send)`) : (isMobile ? "Your project idea..." : "Describe your project... (Enter to send)")}
              style={{
                flex: 1,
                padding: isMobile ? "8px 10px" : "10px 14px",
                borderRadius: "8px",
                border: "1px solid #262626",
                backgroundColor: "#262626",
                color: "#ccc",
                fontFamily: "Arial, sans-serif",
                fontSize: isMobile ? "16px" : "14px",
                resize: "none",
                height: isMobile ? "40px" : "45px",
                opacity: loading ? 0.6 : 1
              }}
            />
            <button
              onClick={generate}
              disabled={loading || !idea.trim()}
              style={{
                padding: isMobile ? "10px 14px" : "10px 20px",
                backgroundColor: loading || !idea.trim() ? "#404040" : "#10a37f",
                color: "white",
                border: "none",
                borderRadius: "8px",
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: "600",
                fontSize: isMobile ? "16px" : "14px",
                minWidth: isMobile ? "40px" : "auto"
              }}
            >
              {loading ? "⏳" : "→"}
            </button>
          </div>
          </div>
        )}
      </main>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes pulse {
          0%, 100% {
            opacity: 0.3;
          }
          50% {
            opacity: 1;
          }
        }

        ::-webkit-scrollbar {
          width: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: #404040;
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: #565656;
        }
      `}</style>
    </div>
  );
}
