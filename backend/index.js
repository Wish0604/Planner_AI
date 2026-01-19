import 'dotenv/config';
import express from "express";
import cors from "cors";
import { createOrchestrator } from "./services/orchestrator.js";
import { getGemini } from "./config/gemini.js";
import { telemetryTracker } from "./services/telemetryTracker.js";
import { routeModel } from "./services/modelRouter.js";
import { submitFeedback, getFeedbackAnalytics, getPromptVersionHistory, getAffinityScores } from "./services/feedbackService.js";
import { logDecision, logTaskReassignment, logAgentAction, logConfidenceScore, getExplanations, getAuditTrail, getConfidenceScores, getXAIAnalytics } from "./services/explanationService.js";
import { createOrgTeam, addTeamMember, assignTaskToTeam, getTeamCapacityStatus, getTeamSkillHeatmap, getOrgCapacityStatus, updateMemberSkills } from "./services/roleAssignmentService.js";
import { createSLAForMilestone, checkSLAHealth, getSLABreachAnalytics, getProjectSLASummary } from "./services/slaMonitoringService.js";

const app = express();
app.use(cors());
app.use(express.json());

console.log("GEMINI_API_KEY loaded:", process.env.GEMINI_API_KEY ? "YES" : "NO");

// Initialize multi-agent orchestrator
const orchestrator = createOrchestrator({ issueReporter: null });

app.get("/", (req, res) => {
  res.send("AI Project Planner Backend is running 🚀");
});

// Simple multi-LLM routed endpoint
app.post("/generate-roadmap", async (req, res) => {
  try {
    const { input } = req.body || {};
    if (!input) return res.status(400).json({ error: "'input' is required" });

    const response = await routeModel(input);
    res.json({ success: true, usedModel: response.model, result: response.output });
  } catch (err) {
    console.error("ROUTE_MODEL_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});


// Multi-agent architecture endpoint
app.post("/api/multi-agent-roadmap", async (req, res) => {
  try {
    const { input, userId, teamContext } = req.body;
    
    console.log(`🤖 Multi-agent processing for user: ${userId}`);
    
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("GEMINI_API_KEY environment variable not set on server");
    }
    
    // Build enhanced context with team data
    let enhancedInput = input;
    
    if (teamContext && teamContext.teamMembers && teamContext.teamMembers.length > 0) {
      enhancedInput += `\n\n## Team Context:\n`;
      enhancedInput += `- Team Size: ${teamContext.memberCount} member(s)\n`;
      enhancedInput += `- Total Capacity: ${teamContext.totalCapacity} hours/week\n`;
      enhancedInput += `- Current Utilization: ${teamContext.utilization}%\n`;
      
      if (teamContext.skills && teamContext.skills.length > 0) {
        const skillSummary = teamContext.skills.map(s => s.skill).filter((v, i, a) => a.indexOf(v) === i);
        enhancedInput += `- Available Skills: ${skillSummary.join(', ')}\n`;
      }
      
      enhancedInput += `\n**Please consider the team's capacity, available skills, and current workload when creating the roadmap. Suggest realistic timelines based on the team size and ensure required skills match available expertise.**`;
    }
    
    // Execute multi-agent orchestration with enhanced input
    const report = await orchestrator.execute(enhancedInput);
    
    res.json({
      success: true,
      report,
      usedModel: 'gemini',
      result: report,
      architecture: {
        agents: [
          'Planner',
          'TechStack Specialist',
          'Timeline Specialist',
          'Risk Specialist',
          'Deliverables Specialist'
        ],
        flow: 'User → Planner → Executors (parallel)',
        teamContextApplied: !!teamContext
      }
    });
  } catch (err) {
    console.error("MULTI_AGENT_ERROR:", err);
    res.status(500).json({
      error: err.message,
      stack: err.stack
    });
  }
});



// Project chat endpoint (single-assistant chat over project context)
app.post("/api/project-chat", async (req, res) => {
  try {
    const { message, projectTitle, projectReport } = req.body;
    if (!message) {
      return res.status(400).json({ error: "'message' is required" });
    }

    const genAI = await getGemini();
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const contextSnippet = projectReport
      ? (typeof projectReport === 'string' ? projectReport : JSON.stringify(projectReport))
      : '';

    const prompt = `You are a helpful assistant for a software project. Answer concisely and helpfully.\n\nProject Title: ${projectTitle || 'Unknown'}\nProject Context (JSON or text):\n${contextSnippet}\n\nUser question: ${message}\n\nAnswer:`;

    const result = await model.generateContent(prompt);
    const text = result.response.text();

    res.json({ success: true, reply: text });
  } catch (err) {
    console.error("PROJECT_CHAT_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// PHASE 10: Feedback & Learning Endpoints

// Submit feedback on a generated roadmap
app.post("/api/feedback", async (req, res) => {
  try {
    const { userId, projectId, rating, usability, completeness, accuracy, comments, projectStatus, completedPhases, blockers, generatedPrompt, usedModel, generatedRoadmap } = req.body;

    if (!userId || !projectId) {
      return res.status(400).json({ error: "'userId' and 'projectId' are required" });
    }

    const feedback = await submitFeedback(userId, projectId, {
      rating: rating || 0,
      usability: usability || 0,
      completeness: completeness || 0,
      accuracy: accuracy || 0,
      comments: comments || "",
      projectStatus: projectStatus || "planning",
      completedPhases: completedPhases || [],
      blockers: blockers || [],
      generatedPrompt,
      usedModel,
      generatedRoadmap,
    });

    res.json({ success: true, feedback });
  } catch (err) {
    console.error("FEEDBACK_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get feedback analytics
app.get("/api/feedback/analytics", async (req, res) => {
  try {
    const { userId, projectId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: "'userId' is required" });
    }

    const analytics = await getFeedbackAnalytics(userId, projectId);
    res.json({ success: true, analytics });
  } catch (err) {
    console.error("ANALYTICS_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get prompt version history for a domain
app.get("/api/learning/prompt-versions", async (req, res) => {
  try {
    const { domain } = req.query;

    if (!domain) {
      return res.status(400).json({ error: "'domain' is required" });
    }

    const history = await getPromptVersionHistory(domain);
    res.json({ success: true, history });
  } catch (err) {
    console.error("PROMPT_HISTORY_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get affinity scores (model/domain performance)
app.get("/api/learning/affinity-scores", async (req, res) => {
  try {
    const scores = await getAffinityScores();
    res.json({ success: true, scores });
  } catch (err) {
    console.error("AFFINITY_SCORES_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// PHASE 12: XAI (Explainable AI) Endpoints

// Log a decision with reasoning
app.post("/api/xai/log-decision", async (req, res) => {
  try {
    const { userId, projectId, agentName, decisionType, decision, explanation, confidenceScore, reasoning_steps, alternatives, key_factors, evidence } = req.body;

    if (!userId || !projectId || !agentName) {
      return res.status(400).json({ error: "'userId', 'projectId', and 'agentName' are required" });
    }

    const exp = await logDecision(userId, projectId, {
      agentName,
      decisionType,
      decision,
      explanation,
      confidenceScore,
      reasoning_steps,
      alternatives,
      key_factors,
      evidence,
    });

    res.json({ success: true, explanation: exp });
  } catch (err) {
    console.error("LOG_DECISION_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get all explanations for a project
app.get("/api/xai/explanations", async (req, res) => {
  try {
    const { userId, projectId, agentName } = req.query;

    if (!userId || !projectId) {
      return res.status(400).json({ error: "'userId' and 'projectId' are required" });
    }

    const explanations = await getExplanations(userId, projectId);
    res.json({ success: true, explanations });
  } catch (err) {
    console.error("GET_EXPLANATIONS_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get audit trail
app.get("/api/xai/audit-trail", async (req, res) => {
  try {
    const { userId, projectId, actionType } = req.query;

    if (!userId || !projectId) {
      return res.status(400).json({ error: "'userId' and 'projectId' are required" });
    }

    const auditTrail = await getAuditTrail(userId, projectId, actionType);
    res.json({ success: true, auditTrail });
  } catch (err) {
    console.error("GET_AUDIT_TRAIL_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get confidence scores
app.get("/api/xai/confidence-scores", async (req, res) => {
  try {
    const { userId, projectId } = req.query;

    if (!userId || !projectId) {
      return res.status(400).json({ error: "'userId' and 'projectId' are required" });
    }

    const scores = await getConfidenceScores(userId, projectId);
    res.json({ success: true, scores });
  } catch (err) {
    console.error("GET_CONFIDENCE_SCORES_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get XAI analytics
app.get("/api/xai/analytics", async (req, res) => {
  try {
    const { userId, projectId } = req.query;

    if (!userId || !projectId) {
      return res.status(400).json({ error: "'userId' and 'projectId' are required" });
    }

    const analytics = await getXAIAnalytics(userId, projectId);
    res.json({ success: true, analytics });
  } catch (err) {
    console.error("GET_XAI_ANALYTICS_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get project state
app.get("/api/state", (req, res) => {
  const state = orchestrator.getState();
  res.json(state);
});

// Telemetry endpoints
app.get("/api/telemetry/metrics", (req, res) => {
  const metrics = telemetryTracker.getMetricsSnapshot();
  res.json({ success: true, metrics });
});

app.get("/api/telemetry/agent-load", (req, res) => {
  const minutes = parseInt(req.query.minutes) || 30;
  const loadHistory = telemetryTracker.getAgentLoadHistory(minutes);
  res.json({ success: true, loadHistory });
});

app.get("/api/telemetry/risk-heatmap", (req, res) => {
  const heatmap = telemetryTracker.getRiskHeatmap();
  res.json({ success: true, heatmap });
});

// Server-Sent Events for real-time updates
app.get("/api/telemetry/stream", (req, res) => {
  console.log('📡 New SSE client connected');
  
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send initial snapshot
  const initialData = telemetryTracker.getMetricsSnapshot();
  console.log('📊 Sending initial snapshot:', initialData.agentMetrics.length, 'agents');
  const snapshotMsg = `data: ${JSON.stringify({ type: 'snapshot', data: initialData })}\n\n`;
  const writeOk = res.write(snapshotMsg);
  console.log('📊 Snapshot write ok:', writeOk);

  // Add listener for new events
  const removeListener = telemetryTracker.addListener((event) => {
    try {
      const msg = `data: ${JSON.stringify({ type: 'event', data: event })}\n\n`;
      const ok = res.write(msg);
      if (ok) {
        console.log('📨 Broadcast success:', event.type);
      } else {
        console.log('⚠️  Write buffer full for:', event.type);
      }
    } catch (err) {
      console.error('❌ Write error:', err.message);
    }
  });

  // Send heartbeat every 30 seconds
  const heartbeat = setInterval(() => {
    try {
      res.write(`data: ${JSON.stringify({ type: 'heartbeat', timestamp: new Date().toISOString() })}\n\n`);
    } catch (err) {
      console.error('❌ Heartbeat write error:', err.message);
      clearInterval(heartbeat);
      removeListener();
    }
  }, 30000);

  // Handle client errors
  res.on('error', (err) => {
    console.error('❌ SSE response error:', err.message);
    clearInterval(heartbeat);
    removeListener();
  });

  // Clean up on client disconnect
  req.on('close', () => {
    console.log('📡 SSE client disconnected');
    clearInterval(heartbeat);
    removeListener();
  });
});
// PHASE 11: Organization Mode (Enterprise) Endpoints

// Create a team
app.post("/api/org/teams", async (req, res) => {
  try {
    const { organizationId, name, description, owner } = req.body;

    if (!organizationId || !name || !owner) {
      return res.status(400).json({ error: "'organizationId', 'name', and 'owner' are required" });
    }

    const team = await createOrgTeam(organizationId, {
      name,
      description,
      owner,
      members: [],
    });

    if (!team) {
      return res.status(500).json({ error: "Firebase not initialized - unable to create team" });
    }

    res.json({ success: true, team });
  } catch (err) {
    console.error("CREATE_TEAM_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Add member to team
app.post("/api/org/team-members", async (req, res) => {
  try {
    const { organizationId, teamId, name, email, role, skills, capacity } = req.body;

    if (!organizationId || !teamId || !name || !email) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const member = await addTeamMember(organizationId, teamId, {
      userId: email, // Use email as temp ID
      name,
      email,
      role,
      skills: skills || {},
      capacity: capacity || 40,
    });

    if (!member) {
      return res.status(500).json({ error: "Firebase not initialized - unable to add member" });
    }

    res.json({ success: true, member });
  } catch (err) {
    console.error("ADD_MEMBER_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Assign task to team
app.post("/api/org/assign-task", async (req, res) => {
  try {
    const { organizationId, teamId, taskName, effort, requiredRole, requiredSkills } = req.body;

    if (!organizationId || !teamId) {
      return res.status(400).json({ error: "'organizationId' and 'teamId' are required" });
    }

    const assignment = await assignTaskToTeam(organizationId, teamId, {
      name: taskName,
      effort: effort || 8,
      requiredRole,
      requiredSkills: requiredSkills || [],
    });

    res.json({ success: true, assignment });
  } catch (err) {
    console.error("ASSIGN_TASK_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get team capacity status
app.get("/api/org/team-capacity", async (req, res) => {
  try {
    const { organizationId, teamId } = req.query;

    if (!organizationId || !teamId) {
      return res.status(400).json({ error: "'organizationId' and 'teamId' are required" });
    }

    const capacity = await getTeamCapacityStatus(organizationId, teamId);
    res.json({ success: true, capacity });
  } catch (err) {
    console.error("GET_CAPACITY_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get skill heatmap
app.get("/api/org/skill-heatmap", async (req, res) => {
  try {
    const { organizationId, teamId } = req.query;

    if (!organizationId || !teamId) {
      return res.status(400).json({ error: "'organizationId' and 'teamId' are required" });
    }

    const heatmap = await getTeamSkillHeatmap(organizationId, teamId);
    res.json({ success: true, heatmap });
  } catch (err) {
    console.error("GET_HEATMAP_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update member skills
app.put("/api/org/member-skills", async (req, res) => {
  try {
    const { organizationId, teamId, memberId, skills } = req.body;

    if (!organizationId || !teamId || !memberId || !skills) {
      return res.status(400).json({ error: "Missing required fields: organizationId, teamId, memberId, skills" });
    }

    await updateMemberSkills(organizationId, teamId, memberId, skills);

    res.json({ success: true, message: "Skills updated successfully" });
  } catch (err) {
    console.error("UPDATE_SKILLS_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get organization capacity status
app.get("/api/org/capacity-status", async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: "'organizationId' is required" });
    }

    const status = await getOrgCapacityStatus(organizationId);
    res.json({ success: true, status });
  } catch (err) {
    console.error("GET_ORG_CAPACITY_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Create SLA for milestone
app.post("/api/org/slas", async (req, res) => {
  try {
    const { organizationId, projectId, milestoneName, deadline, priority, bufferDays, assignedTeam } = req.body;

    if (!organizationId || !projectId || !milestoneName || !deadline) {
      return res.status(400).json({ error: "Missing required SLA fields" });
    }

    const sla = await createSLAForMilestone(organizationId, projectId, {
      milestoneName,
      deadline,
      priority: priority || "medium",
      bufferDays: bufferDays || 3,
      assignedTeam,
    });

    res.json({ success: true, sla });
  } catch (err) {
    console.error("CREATE_SLA_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Check SLA health
app.get("/api/org/sla-health", async (req, res) => {
  try {
    const { organizationId } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: "'organizationId' is required" });
    }

    const health = await checkSLAHealth(organizationId);
    res.json({ success: true, health });
  } catch (err) {
    console.error("CHECK_SLA_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get SLA breach analytics
app.get("/api/org/sla-breaches", async (req, res) => {
  try {
    const { organizationId, days } = req.query;

    if (!organizationId) {
      return res.status(400).json({ error: "'organizationId' is required" });
    }

    const analytics = await getSLABreachAnalytics(organizationId, parseInt(days) || 30);
    res.json({ success: true, analytics });
  } catch (err) {
    console.error("GET_BREACH_ANALYTICS_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get project SLA summary
app.get("/api/org/project-slas", async (req, res) => {
  try {
    const { organizationId, projectId } = req.query;

    if (!organizationId || !projectId) {
      return res.status(400).json({ error: "'organizationId' and 'projectId' are required" });
    }

    const summary = await getProjectSLASummary(organizationId, projectId);
    res.json({ success: true, summary });
  } catch (err) {
    console.error("GET_PROJECT_SLA_ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 8080;

const server = app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  console.error('Unhandled rejection:', reason);
  process.exit(1);
});
