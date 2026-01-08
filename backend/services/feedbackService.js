import {
  collection,
  doc,
  setDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  updateDoc,
  addDoc,
  getDoc,
  writeBatch
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { createFeedbackDoc, calculateQualityScore } from "../schemas/feedbackSchema.js";

let db = null;

// Initialize Firebase if credentials are available
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
    console.log("✅ Firebase initialized for feedback service");
  } else {
    console.warn("⚠️  Firebase not configured - feedback service will be limited");
  }
} catch (err) {
  console.warn("⚠️  Could not initialize Firebase:", err.message);
}

/**
 * Submit feedback on a generated roadmap
 */
export async function submitFeedback(userId, projectId, feedbackData) {
  if (!db) {
    console.warn("Firebase not available - feedback not persisted");
    return { success: false, message: "Feedback service not available" };
  }

  try {
    const feedback = createFeedbackDoc({
      userId,
      projectId,
      ...feedbackData
    });

    // Calculate quality score
    feedback.qualityScore = calculateQualityScore(feedback);

    // Store feedback
    const feedbackRef = doc(
      collection(db, "users", userId, "projects", projectId, "feedback"),
      feedback.id
    );
    await setDoc(feedbackRef, feedback);

    // Update project metrics
    await updateProjectMetrics(userId, projectId, feedback);

    // Update affinity scores
    await updateAffinityScores(feedback);

    // Detect failure patterns
    await detectAndLogFailurePatterns(feedback);

    return feedback;
  } catch (err) {
    console.error("Error submitting feedback:", err);
    throw err;
  }
}

/**
 * Get feedback analytics for a project or user
 */
export async function getFeedbackAnalytics(userId, projectId = null) {
  if (!db) {
    return {
      totalFeedback: 0,
      averageRating: 0,
      averageQuality: 0,
      modelPerformance: {},
      successRate: 0,
      commonBlockers: [],
      feedbacks: [],
    };
  }

  try {
    let feedbackDocs;

    if (projectId) {
      // Get feedback for specific project
      const q = query(
        collection(db, "users", userId, "projects", projectId, "feedback"),
        orderBy("timestamp", "desc")
      );
      feedbackDocs = await getDocs(q);
    } else {
      // Get all feedback for user (scan all projects)
      const projectsRef = collection(db, "users", userId, "projects");
      const projects = await getDocs(projectsRef);
      feedbackDocs = [];

      for (const proj of projects.docs) {
        const q = query(
          collection(db, "users", userId, "projects", proj.id, "feedback"),
          orderBy("timestamp", "desc"),
          limit(10)
        );
        const feedback = await getDocs(q);
        feedbackDocs.push(...feedback.docs);
      }
    }

    const feedbacks = feedbackDocs.map(doc => doc.data());

    // Calculate aggregates
    const analytics = {
      totalFeedback: feedbacks.length,
      averageRating: feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length
        : 0,
      averageQuality: feedbacks.length > 0
        ? feedbacks.reduce((sum, f) => sum + f.qualityScore, 0) / feedbacks.length
        : 0,
      modelPerformance: getModelPerformance(feedbacks),
      successRate: getSuccessRate(feedbacks),
      commonBlockers: getCommonBlockers(feedbacks),
      feedbacks: feedbacks.slice(0, 10), // Latest 10
    };

    return analytics;
  } catch (err) {
    console.error("Error getting feedback analytics:", err);
    throw err;
  }
}

/**
 * Get prompt version history and performance
 */
export async function getPromptVersionHistory(domain) {
  if (!db) {
    return {
      domain,
      versions: [],
      currentBest: null,
      improvements: [],
    };
  }

  try {
    const q = query(
      collection(db, "learning", "promptVersions"),
      where("domain", "==", domain),
      orderBy("timestamp", "desc")
    );

    const docs = await getDocs(q);
    const versions = docs.map(doc => doc.data());

    return {
      domain,
      versions,
      currentBest: versions[0] || null,
      improvements: versions.slice(0, 5).map((v, i) => {
        const improvement = i > 0
          ? ((v.averageRating - versions[i + 1].averageRating) / versions[i + 1].averageRating * 100).toFixed(1)
          : 0;
        return { ...v, improvement: `${improvement}%` };
      }),
    };
  } catch (err) {
    console.error("Error getting prompt versions:", err);
    throw err;
  }
}

/**
 * Get affinity scores for model/domain pairs
 */
export async function getAffinityScores() {
  if (!db) {
    return {
      all: [],
      byDomain: {},
      topCombinations: [],
    };
  }

  try {
    const q = query(
      collection(db, "learning", "affinityScores"),
      orderBy("score", "desc")
    );

    const docs = await getDocs(q);
    const scores = docs.map(doc => doc.data());

    // Group by domain
    const byDomain = {};
    scores.forEach(score => {
      if (!byDomain[score.domain]) byDomain[score.domain] = [];
      byDomain[score.domain].push(score);
    });

    return {
      all: scores,
      byDomain,
      topCombinations: scores.slice(0, 10),
    };
  } catch (err) {
    console.error("Error getting affinity scores:", err);
    throw err;
  }
}

/**
 * Helper: Update project metrics after feedback
 */
async function updateProjectMetrics(userId, projectId, feedback) {
  try {
    const projectRef = doc(db, "users", userId, "projects", projectId);
    await updateDoc(projectRef, {
      lastFeedbackTime: serverTimestamp(),
      overallRating: feedback.rating,
      qualityScore: feedback.qualityScore,
      projectStatus: feedback.projectStatus,
      feedbackCount: +1, // Increment
    });
  } catch (err) {
    console.warn("Could not update project metrics:", err);
  }
}

/**
 * Helper: Update affinity scores based on feedback
 */
async function updateAffinityScores(feedback) {
  try {
    const scoreId = `${feedback.usedModel}_${extractDomain(feedback.generatedPrompt)}`;
    const scoreRef = doc(db, "learning", "affinityScores", scoreId);
    const scoreDoc = await getDoc(scoreRef);

    let currentScore = scoreDoc.exists() ? scoreDoc.data() : {
      domain: extractDomain(feedback.generatedPrompt),
      model: feedback.usedModel,
      totalUses: 0,
      ratings: [],
      successCount: 0,
    };

    // Add new feedback
    currentScore.totalUses += 1;
    currentScore.ratings = (currentScore.ratings || []).concat(feedback.rating);
    if (feedback.projectStatus === "completed") currentScore.successCount += 1;

    // Calculate metrics
    currentScore.score = Math.min(1, currentScore.successCount / currentScore.totalUses);
    currentScore.averageRating = currentScore.ratings.reduce((a, b) => a + b, 0) / currentScore.ratings.length;
    currentScore.successRate = currentScore.successCount / currentScore.totalUses;
    currentScore.lastUpdated = serverTimestamp();

    await setDoc(scoreRef, currentScore);
  } catch (err) {
    console.warn("Could not update affinity scores:", err);
  }
}

/**
 * Helper: Detect and log failure patterns
 */
async function detectAndLogFailurePatterns(feedback) {
  if (feedback.projectStatus === "abandoned" || feedback.rating <= 2) {
    try {
      const pattern = {
        timestamp: serverTimestamp(),
        pattern: `Failed: ${extractDomain(feedback.generatedPrompt)} with ${feedback.usedModel}`,
        blockers: feedback.blockers,
        domain: extractDomain(feedback.generatedPrompt),
        model: feedback.usedModel,
        comments: feedback.comments,
        resolved: false,
      };

      await addDoc(collection(db, "learning", "failurePatterns"), pattern);
    } catch (err) {
      console.warn("Could not log failure pattern:", err);
    }
  }
}

/**
 * Helper: Extract domain from prompt text
 */
function extractDomain(prompt) {
  const domains = {
    api: /api|backend|node|express|rest/i,
    frontend: /react|vue|angular|frontend|ui|html|css/i,
    mobile: /react native|flutter|ios|android|mobile/i,
    ecommerce: /ecommerce|shopping|product|cart|payment/i,
    devops: /docker|kubernetes|deployment|ci\/cd|infrastructure/i,
  };

  for (const [domain, regex] of Object.entries(domains)) {
    if (regex.test(prompt)) return domain;
  }

  return "general";
}

/**
 * Helper: Get model performance from feedbacks
 */
function getModelPerformance(feedbacks) {
  const byModel = {};

  feedbacks.forEach(f => {
    if (!byModel[f.usedModel]) {
      byModel[f.usedModel] = { count: 0, totalRating: 0, successCount: 0 };
    }
    byModel[f.usedModel].count += 1;
    byModel[f.usedModel].totalRating += f.rating;
    if (f.projectStatus === "completed") byModel[f.usedModel].successCount += 1;
  });

  const result = {};
  for (const [model, stats] of Object.entries(byModel)) {
    result[model] = {
      averageRating: (stats.totalRating / stats.count).toFixed(2),
      successRate: (stats.successCount / stats.count * 100).toFixed(1) + "%",
      count: stats.count,
    };
  }

  return result;
}

/**
 * Helper: Get success rate from feedbacks
 */
function getSuccessRate(feedbacks) {
  if (feedbacks.length === 0) return 0;
  const completed = feedbacks.filter(f => f.projectStatus === "completed").length;
  return ((completed / feedbacks.length) * 100).toFixed(1);
}

/**
 * Helper: Get common blockers from feedbacks
 */
function getCommonBlockers(feedbacks) {
  const blockerMap = {};

  feedbacks.forEach(f => {
    (f.blockers || []).forEach(blocker => {
      blockerMap[blocker] = (blockerMap[blocker] || 0) + 1;
    });
  });

  return Object.entries(blockerMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([blocker, count]) => ({ blocker, count }));
}
