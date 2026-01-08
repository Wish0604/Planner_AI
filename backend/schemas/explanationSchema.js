import { v4 as uuidv4 } from "uuid";

/**
 * XAI (Explainable AI) Schema for Phase 12
 * Captures reasoning traces, confidence scores, and audit trails for all agent decisions
 */

/**
 * Create a reasoning trace document
 * Logs WHY an agent made a specific decision with confidence score
 */
export function createReasoningTrace({
  agentName,
  decision,
  reasoning,
  confidenceScore = 0.8,
  inputContext = {},
  outputData = {},
  domain = "general",
  metadata = {}
}) {
  return {
    id: uuidv4(),
    agentName,
    decision, // e.g., "task reassignment", "risk classification", "timeline adjustment"
    reasoning, // Natural language explanation of WHY
    confidenceScore: Math.min(1, Math.max(0, confidenceScore)), // 0-1
    inputContext, // What data was available when decision was made
    outputData, // What the agent output
    domain,
    metadata,
    timestamp: new Date().toISOString(),
    createdAt: new Date(),
  };
}

/**
 * Create an audit trail entry for agent actions
 * Tracks state changes, task reassignments, resource allocation
 */
export function createAuditLogEntry({
  actionType, // "task_reassigned", "agent_activated", "risk_escalated", "priority_changed", etc.
  agentName,
  affectedResources = [],
  oldState = {},
  newState = {},
  reason = "",
  confidence = 0.8,
  userId = "",
  projectId = "",
  metadata = {}
}) {
  return {
    id: uuidv4(),
    actionType,
    agentName,
    affectedResources, // List of task IDs, agent IDs, etc.
    oldState,
    newState,
    reason, // Human-readable reason for the action
    confidence,
    userId,
    projectId,
    metadata,
    timestamp: new Date().toISOString(),
    createdAt: new Date(),
  };
}

/**
 * Create a confidence score record for a recommendation
 * Tracks model confidence on predictions (timeline, budget, risk)
 */
export function createConfidenceScore({
  metric, // "timeline_days", "budget_estimate", "risk_level", "task_complexity"
  predicted, // The value/prediction
  confidence, // 0-1 score
  factors = [], // List of factors that influenced confidence (e.g., ["historical data", "domain match"])
  threshold = 0.7, // Confidence threshold for acceptance
  agentName = "",
  domain = "general"
}) {
  return {
    id: uuidv4(),
    metric,
    predicted,
    confidence: Math.min(1, Math.max(0, confidence)),
    factors,
    threshold,
    meetsThreshold: confidence >= threshold,
    agentName,
    domain,
    timestamp: new Date().toISOString(),
    createdAt: new Date(),
  };
}

/**
 * Create an explanation record for a complete decision
 * Combines reasoning, confidence, and context into a unified explanation
 */
export function createExplanation({
  projectId = "",
  userId = "",
  agentName,
  decisionType, // "roadmap_generation", "risk_assessment", "timeline_estimation"
  decision,
  explanation, // Natural language explanation
  confidenceScore = 0.8,
  reasoning_steps = [], // Array of steps leading to decision
  alternatives = [], // Other options considered
  key_factors = [], // Most important factors
  evidence = [], // Supporting data/references
  metadata = {}
}) {
  return {
    id: uuidv4(),
    projectId,
    userId,
    agentName,
    decisionType,
    decision,
    explanation,
    confidenceScore: Math.min(1, Math.max(0, confidenceScore)),
    reasoning_steps,
    alternatives,
    key_factors,
    evidence,
    metadata,
    timestamp: new Date().toISOString(),
    createdAt: new Date(),
  };
}

/**
 * Calculate overall explanation quality score
 * Based on confidence, completeness of reasoning, evidence quality
 */
export function calculateExplanationQuality(explanation) {
  let score = 0;

  // Confidence component (40%)
  score += explanation.confidenceScore * 0.4;

  // Reasoning steps completeness (30%)
  const stepsQuality = Math.min(1, explanation.reasoning_steps?.length / 5);
  score += stepsQuality * 0.3;

  // Evidence quality (20%)
  const evidenceQuality = Math.min(1, explanation.evidence?.length / 3);
  score += evidenceQuality * 0.2;

  // Alternative consideration (10%)
  const altQuality = Math.min(1, explanation.alternatives?.length / 2);
  score += altQuality * 0.1;

  return Math.min(1, score);
}

/**
 * Format confidence score for display (percentage)
 */
export function formatConfidence(score) {
  return `${(score * 100).toFixed(0)}%`;
}

/**
 * Determine confidence level category
 */
export function getConfidenceLevel(score) {
  if (score >= 0.9) return "Very High";
  if (score >= 0.75) return "High";
  if (score >= 0.6) return "Medium";
  if (score >= 0.4) return "Low";
  return "Very Low";
}

/**
 * Color code for confidence visualization
 */
export function getConfidenceColor(score) {
  if (score >= 0.9) return "#4caf50"; // Green
  if (score >= 0.75) return "#8bc34a"; // Light green
  if (score >= 0.6) return "#ffeb3b"; // Yellow
  if (score >= 0.4) return "#ff9800"; // Orange
  return "#f44336"; // Red
}

/**
 * Audit trail categories with icons
 */
export const AUDIT_CATEGORIES = {
  task_reassigned: { icon: "🔄", label: "Task Reassigned", color: "#2196F3" },
  agent_activated: { icon: "🤖", label: "Agent Activated", color: "#9C27B0" },
  risk_escalated: { icon: "⚠️", label: "Risk Escalated", color: "#F44336" },
  priority_changed: { icon: "📌", label: "Priority Changed", color: "#FF9800" },
  resource_allocated: { icon: "📦", label: "Resource Allocated", color: "#00BCD4" },
  deadline_adjusted: { icon: "⏰", label: "Deadline Adjusted", color: "#FFC107" },
  dependency_detected: { icon: "🔗", label: "Dependency Detected", color: "#4CAF50" },
  blocker_resolved: { icon: "✅", label: "Blocker Resolved", color: "#8BC34A" },
  escalation_triggered: { icon: "🚨", label: "Escalation Triggered", color: "#E91E63" },
  status_update: { icon: "📊", label: "Status Update", color: "#3F51B5" },
};
