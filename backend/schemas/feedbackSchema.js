/**
 * Feedback Schema for Autonomous Learning
 * Stores outcomes, user ratings, and learning vectors
 */

export const feedbackSchema = {
  // Collection path: /users/{uid}/projects/{projectId}/feedback
  feedback: {
    id: "string (auto)", // Generated UUID
    timestamp: "timestamp", // When feedback was submitted
    projectId: "string", // Reference to project
    userId: "string", // User who gave feedback
    
    // Rating metrics
    rating: "number (1-5)", // Overall satisfaction
    usability: "number (1-5)", // How practical the roadmap was
    completeness: "number (1-5)", // Did it cover everything needed
    accuracy: "number (1-5)", // How accurate was the tech stack/timeline
    comments: "string", // User feedback text
    
    // Outcome tracking
    projectStatus: "enum (planning|in_progress|completed|abandoned)", // How far the project got
    completedPhases: "array<string>", // Phases that were executed
    blockers: "array<string>", // What didn't work
    
    // Learning data
    generatedPrompt: "string", // Original prompt sent to model
    usedModel: "enum (gemini|llama|claude|gpt4)", // Which model was used
    generatedRoadmap: "string", // Full roadmap text for analysis
    
    // AI analysis
    promptVersion: "number", // Version of prompt template used
    affinity: "number (0-1)", // How well this prompt fits user's domain
    qualityScore: "number (0-1)", // AI-assessed quality
    
    // Improvements
    suggestedImprovements: "array<string>", // Auto-generated improvement suggestions
    nextPromptVersion: "number", // Version to try next
  },
  
  // Collection path: /learning/promptVersions
  promptVersions: {
    id: "string (version_X_Y_Z)", // e.g., "version_1_2_0"
    timestamp: "timestamp",
    domain: "string", // e.g., "api", "ecommerce", "mobile"
    template: "string", // The actual prompt template
    description: "string", // What changed from previous version
    
    // Performance metrics
    totalUses: "number",
    averageRating: "number (0-5)",
    successRate: "number (0-1)", // % of projects that completed
    usabilityScore: "number (0-1)",
    accuracyScore: "number (0-1)",
    
    // Metadata
    createdBy: "enum (system|user_feedback|auto_tuning)",
    previousVersionId: "string", // Parent version
    improvements: "array<string>", // What was improved
  },
  
  // Collection path: /learning/affinityScores
  affinityScores: {
    id: "string", // "{domain}_{model}"
    domain: "string", // e.g., "nodejs_api", "react_frontend"
    model: "enum (gemini|llama|claude|gpt4)",
    
    // Affinity metrics
    score: "number (0-1)", // How well this model works for this domain
    sampleSize: "number", // How many projects evaluated
    successRate: "number (0-1)",
    confidence: "number (0-1)", // Statistical confidence
    
    // Learning vectors
    strengths: "array<string>", // What this model does well
    weaknesses: "array<string>", // Common failure patterns
    recommendedPromptVersion: "number",
    
    lastUpdated: "timestamp",
  },
  
  // Collection path: /learning/failurePatterns
  failurePatterns: {
    id: "string (auto)",
    timestamp: "timestamp",
    
    // Pattern detection
    pattern: "string", // Description of the failure
    occurrences: "number", // How many times seen
    domains: "array<string>", // Which domains affected
    models: "array<string>", // Which models failed
    
    // Resolution
    cause: "string", // Root cause analysis
    solution: "string", // How to fix it
    relatedPromptVersion: "number", // Prompt version to address this
    
    resolved: "boolean",
    resolutionDetails: "string",
  },
};

/**
 * Helper to create feedback document
 */
export function createFeedbackDoc(data) {
  return {
    id: generateId(),
    timestamp: new Date(),
    projectId: data.projectId,
    userId: data.userId,
    
    // Ratings
    rating: data.rating || 0,
    usability: data.usability || 0,
    completeness: data.completeness || 0,
    accuracy: data.accuracy || 0,
    comments: data.comments || "",
    
    // Project status
    projectStatus: data.projectStatus || "planning",
    completedPhases: data.completedPhases || [],
    blockers: data.blockers || [],
    
    // Model info
    generatedPrompt: data.generatedPrompt,
    usedModel: data.usedModel,
    generatedRoadmap: data.generatedRoadmap,
    promptVersion: data.promptVersion || 1,
    
    // Learning
    affinity: 0, // Will be calculated
    qualityScore: 0, // Will be calculated
    suggestedImprovements: [],
    nextPromptVersion: data.promptVersion + 1,
  };
}

/**
 * Calculate quality score from feedback
 */
export function calculateQualityScore(feedback) {
  const weights = {
    rating: 0.3,
    usability: 0.25,
    completeness: 0.25,
    accuracy: 0.2,
  };
  
  const score = (
    (feedback.rating / 5) * weights.rating +
    (feedback.usability / 5) * weights.usability +
    (feedback.completeness / 5) * weights.completeness +
    (feedback.accuracy / 5) * weights.accuracy
  );
  
  return Math.min(1, Math.max(0, score));
}

/**
 * Helper to generate unique IDs
 */
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
