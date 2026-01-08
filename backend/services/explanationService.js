import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  createReasoningTrace,
  createAuditLogEntry,
  createConfidenceScore,
  createExplanation,
  calculateExplanationQuality,
} from "../schemas/explanationSchema.js";

let db = null;

// Initialize Firebase if credentials available
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log("✅ Firebase initialized for explanation service");
  } else {
    console.warn("⚠️  Firebase not configured - XAI logging will be limited");
  }
} catch (err) {
  console.warn("⚠️  Could not initialize Firebase for XAI:", err.message);
}

/**
 * Log an agent decision with reasoning and confidence
 */
export async function logDecision(userId, projectId, decisionData) {
  if (!db) {
    console.warn("Firebase not available - decision not logged");
    return null;
  }

  try {
    const explanation = createExplanation({
      projectId,
      userId,
      ...decisionData,
    });

    // Calculate quality score
    explanation.qualityScore = calculateExplanationQuality(explanation);

    // Store in Firestore
    const docRef = doc(
      collection(db, "users", userId, "projects", projectId, "explanations"),
      explanation.id
    );
    await setDoc(docRef, explanation);

    console.log(
      `✅ Decision logged: ${decisionData.agentName} - ${decisionData.decisionType}`
    );
    return explanation;
  } catch (err) {
    console.error("Error logging decision:", err);
    throw err;
  }
}

/**
 * Log a task reassignment with reasoning
 */
export async function logTaskReassignment(
  userId,
  projectId,
  taskId,
  oldAgent,
  newAgent,
  reason,
  confidenceScore = 0.8
) {
  if (!db) {
    console.warn("Firebase not available - reassignment not logged");
    return null;
  }

  try {
    const auditEntry = createAuditLogEntry({
      actionType: "task_reassigned",
      agentName: oldAgent,
      affectedResources: [taskId],
      oldState: { assignedAgent: oldAgent },
      newState: { assignedAgent: newAgent },
      reason,
      confidence: confidenceScore,
      userId,
      projectId,
    });

    // Store audit entry
    await addDoc(
      collection(db, "users", userId, "projects", projectId, "auditTrail"),
      auditEntry
    );

    console.log(`🔄 Task ${taskId} reassigned from ${oldAgent} to ${newAgent}`);
    return auditEntry;
  } catch (err) {
    console.error("Error logging reassignment:", err);
    throw err;
  }
}

/**
 * Log an agent action (activation, escalation, etc.)
 */
export async function logAgentAction(
  userId,
  projectId,
  actionType,
  agentName,
  details = {}
) {
  if (!db) {
    console.warn("Firebase not available - agent action not logged");
    return null;
  }

  try {
    const auditEntry = createAuditLogEntry({
      actionType,
      agentName,
      userId,
      projectId,
      ...details,
    });

    await addDoc(
      collection(db, "users", userId, "projects", projectId, "auditTrail"),
      auditEntry
    );

    console.log(`📊 Agent action logged: ${actionType} by ${agentName}`);
    return auditEntry;
  } catch (err) {
    console.error("Error logging agent action:", err);
    throw err;
  }
}

/**
 * Log a confidence score for a metric
 */
export async function logConfidenceScore(userId, projectId, scoreData) {
  if (!db) {
    console.warn("Firebase not available - confidence score not logged");
    return null;
  }

  try {
    const confidenceScore = createConfidenceScore(scoreData);

    await addDoc(
      collection(
        db,
        "users",
        userId,
        "projects",
        projectId,
        "confidenceScores"
      ),
      confidenceScore
    );

    console.log(
      `📈 Confidence score logged: ${scoreData.metric} = ${(confidenceScore.confidence * 100).toFixed(0)}%`
    );
    return confidenceScore;
  } catch (err) {
    console.error("Error logging confidence score:", err);
    throw err;
  }
}

/**
 * Get all explanations for a project
 */
export async function getExplanations(userId, projectId, limit_count = 50) {
  if (!db) {
    return [];
  }

  try {
    const q = query(
      collection(db, "users", userId, "projects", projectId, "explanations"),
      orderBy("timestamp", "desc"),
      limit(limit_count)
    );

    const docs = await getDocs(q);
    return docs.map((doc) => doc.data());
  } catch (err) {
    console.error("Error getting explanations:", err);
    return [];
  }
}

/**
 * Get audit trail for a project
 */
export async function getAuditTrail(
  userId,
  projectId,
  actionType = null,
  limit_count = 100
) {
  if (!db) {
    return [];
  }

  try {
    let q;
    if (actionType) {
      q = query(
        collection(db, "users", userId, "projects", projectId, "auditTrail"),
        where("actionType", "==", actionType),
        orderBy("timestamp", "desc"),
        limit(limit_count)
      );
    } else {
      q = query(
        collection(db, "users", userId, "projects", projectId, "auditTrail"),
        orderBy("timestamp", "desc"),
        limit(limit_count)
      );
    }

    const docs = await getDocs(q);
    return docs.map((doc) => doc.data());
  } catch (err) {
    console.error("Error getting audit trail:", err);
    return [];
  }
}

/**
 * Get confidence scores for a project
 */
export async function getConfidenceScores(userId, projectId, limit_count = 50) {
  if (!db) {
    return [];
  }

  try {
    const q = query(
      collection(
        db,
        "users",
        userId,
        "projects",
        projectId,
        "confidenceScores"
      ),
      orderBy("timestamp", "desc"),
      limit(limit_count)
    );

    const docs = await getDocs(q);
    return docs.map((doc) => doc.data());
  } catch (err) {
    console.error("Error getting confidence scores:", err);
    return [];
  }
}

/**
 * Get explanations by agent
 */
export async function getExplanationsByAgent(
  userId,
  projectId,
  agentName,
  limit_count = 20
) {
  if (!db) {
    return [];
  }

  try {
    const q = query(
      collection(db, "users", userId, "projects", projectId, "explanations"),
      where("agentName", "==", agentName),
      orderBy("timestamp", "desc"),
      limit(limit_count)
    );

    const docs = await getDocs(q);
    return docs.map((doc) => doc.data());
  } catch (err) {
    console.error("Error getting explanations by agent:", err);
    return [];
  }
}

/**
 * Get average confidence by agent (for performance tracking)
 */
export async function getAgentConfidenceStats(userId, projectId) {
  if (!db) {
    return {};
  }

  try {
    const explanations = await getExplanations(userId, projectId, 100);

    const statsByAgent = {};
    explanations.forEach((exp) => {
      if (!statsByAgent[exp.agentName]) {
        statsByAgent[exp.agentName] = {
          count: 0,
          totalConfidence: 0,
          totalQuality: 0,
        };
      }
      statsByAgent[exp.agentName].count += 1;
      statsByAgent[exp.agentName].totalConfidence += exp.confidenceScore || 0;
      statsByAgent[exp.agentName].totalQuality += exp.qualityScore || 0;
    });

    const stats = {};
    for (const [agent, data] of Object.entries(statsByAgent)) {
      stats[agent] = {
        count: data.count,
        avgConfidence: (data.totalConfidence / data.count).toFixed(2),
        avgQuality: (data.totalQuality / data.count).toFixed(2),
      };
    }

    return stats;
  } catch (err) {
    console.error("Error getting agent confidence stats:", err);
    return {};
  }
}

/**
 * Get XAI analytics summary for a project
 */
export async function getXAIAnalytics(userId, projectId) {
  if (!db) {
    return {
      totalDecisions: 0,
      avgConfidence: 0,
      avgExplanationQuality: 0,
      auditTrailLength: 0,
      agentStats: {},
    };
  }

  try {
    const explanations = await getExplanations(userId, projectId, 100);
    const auditTrail = await getAuditTrail(userId, projectId, null, 100);
    const confidenceScores = await getConfidenceScores(userId, projectId, 50);
    const agentStats = await getAgentConfidenceStats(userId, projectId);

    const avgConfidence =
      explanations.length > 0
        ? (
            explanations.reduce((sum, e) => sum + (e.confidenceScore || 0), 0) /
            explanations.length
          ).toFixed(2)
        : 0;

    const avgQuality =
      explanations.length > 0
        ? (
            explanations.reduce((sum, e) => sum + (e.qualityScore || 0), 0) /
            explanations.length
          ).toFixed(2)
        : 0;

    return {
      totalDecisions: explanations.length,
      avgConfidence,
      avgExplanationQuality: avgQuality,
      auditTrailLength: auditTrail.length,
      agentStats,
      recentExplanations: explanations.slice(0, 5),
      recentAuditEvents: auditTrail.slice(0, 10),
    };
  } catch (err) {
    console.error("Error getting XAI analytics:", err);
    return {
      totalDecisions: 0,
      avgConfidence: 0,
      avgExplanationQuality: 0,
      auditTrailLength: 0,
      agentStats: {},
    };
  }
}
