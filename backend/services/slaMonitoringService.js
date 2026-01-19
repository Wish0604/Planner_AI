import { initializeApp, applicationDefault, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  createSLAContract,
  isDeadlineBreach,
  isDeadlineApproaching,
  getSLARiskLevel,
  formatDaysUntilDeadline,
} from "../schemas/organizationSchema.js";

let db = null;

// Initialize Firebase Admin SDK (or use existing instance)
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    // Check if Firebase Admin is already initialized
    if (getApps().length === 0) {
      initializeApp({
        credential: applicationDefault(),
        projectId: process.env.FIREBASE_PROJECT_ID,
      });
      console.log("✅ Firebase Admin initialized for SLA monitoring service");
    } else {
      console.log("✅ Firebase Admin already initialized, reusing for SLA service");
    }
    db = getFirestore();
  } else {
    console.warn("⚠️  Firebase not configured - SLA monitoring will be limited");
  }
} catch (err) {
  console.warn(
    "⚠️  Could not initialize Firebase Admin for SLA service:",
    err.message
  );
}

/**
 * Create an SLA contract for a milestone
 */
export async function createSLAForMilestone(organizationId, projectId, slaData) {
  if (!db) {
    console.warn("Firebase not available - SLA not created");
    return null;
  }

  try {
    const sla = createSLAContract({
      projectId,
      organizationId,
      ...slaData,
    });

    const slaRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("slas")
      .doc(sla.id);
    await slaRef.set(sla);

    console.log(`✅ SLA created: ${sla.milestoneName} due ${sla.deadline}`);
    return sla;
  } catch (err) {
    console.error("Error creating SLA:", err);
    throw err;
  }
}

/**
 * Check SLA health for all active SLAs in organization
 */
export async function checkSLAHealth(organizationId) {
  if (!db) {
    return {
      healthy: [],
      atRisk: [],
      breached: [],
      totalSLAs: 0,
    };
  }

  try {
    const slasCol = db
      .collection("organizations")
      .doc(organizationId)
      .collection("slas");
    
    const snapshot = await slasCol.where("status", "==", "active").get();
    const slas = snapshot.docs.map((doc) => doc.data());

    const healthy = [];
    const atRisk = [];
    const breached = [];

    for (const sla of slas) {
      const riskLevel = getSLARiskLevel(sla);

      if (isDeadlineBreach(sla)) {
        breached.push({
          ...sla,
          riskLevel: "critical",
          daysOverdue: Math.ceil(
            (new Date() - new Date(sla.deadline)) / (1000 * 60 * 60 * 24)
          ),
        });

        // Mark as breached and send alert
        if (!sla.breachAlertSent) {
          await logSLABreach(organizationId, sla);
        }
      } else if (isDeadlineApproaching(sla)) {
        atRisk.push({
          ...sla,
          riskLevel,
          daysRemaining: Math.ceil(
            (new Date(sla.deadline) - new Date()) / (1000 * 60 * 60 * 24)
          ),
        });
      } else {
        healthy.push({
          ...sla,
          riskLevel,
          daysRemaining: Math.ceil(
            (new Date(sla.deadline) - new Date()) / (1000 * 60 * 60 * 24)
          ),
        });
      }
    }

    return {
      healthy,
      atRisk,
      breached,
      totalSLAs: slas.length,
      healthScore:
        ((healthy.length + atRisk.length * 0.5) / slas.length) * 100 || 100,
    };
  } catch (err) {
    console.error("Error checking SLA health:", err);
    return {
      healthy: [],
      atRisk: [],
      breached: [],
      totalSLAs: 0,
    };
  }
}

/**
 * Log an SLA breach event
 */
export async function logSLABreach(organizationId, sla) {
  if (!db) {
    console.warn("Firebase not available - breach not logged");
    return null;
  }

  try {
    const breach = {
      id: `breach_${sla.id}_${Date.now()}`,
      slaId: sla.id,
      projectId: sla.projectId,
      organizationId,
      milestoneName: sla.milestoneName,
      deadline: sla.deadline,
      detectedAt: new Date().toISOString(),
      priority: sla.priority,
      daysOverdue: Math.ceil(
        (new Date() - new Date(sla.deadline)) / (1000 * 60 * 60 * 24)
      ),
      alertSent: true,
      acknowledged: false,
    };

    await db
      .collection("organizations")
      .doc(organizationId)
      .collection("slaBreaches")
      .add(breach);

    // Update SLA status
    const slaRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("slas")
      .doc(sla.id);
    await slaRef.update({
      status: "breached",
      breachAlertSent: true,
    });

    console.log(`🚨 SLA BREACH logged: ${sla.milestoneName}`);
    return breach;
  } catch (err) {
    console.error("Error logging SLA breach:", err);
    throw err;
  }
}

/**
 * Get SLA breach analytics for organization
 */
export async function getSLABreachAnalytics(organizationId, days = 30) {
  if (!db) {
    return {
      totalBreaches: 0,
      breachRate: 0,
      avgDaysOverdue: 0,
      recentBreaches: [],
      breachesByPriority: {},
    };
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const breachesCol = db
      .collection("organizations")
      .doc(organizationId)
      .collection("slaBreaches");
    
    const snapshot = await breachesCol
      .where("detectedAt", ">=", cutoffDate.toISOString())
      .orderBy("detectedAt", "desc")
      .get();
    
    const breaches = snapshot.docs.map((doc) => doc.data());

    const breachesByPriority = {};
    let totalDaysOverdue = 0;

    for (const breach of breaches) {
      const priority = breach.priority || "medium";
      breachesByPriority[priority] = (breachesByPriority[priority] || 0) + 1;
      totalDaysOverdue += breach.daysOverdue || 0;
    }

    // Calculate breach rate
    const totalSLAs = await db
      .collection("organizations")
      .doc(organizationId)
      .collection("slas")
      .get();
    const breachRate =
      totalSLAs.size > 0 ? ((breaches.length / totalSLAs.size) * 100).toFixed(1) : 0;

    return {
      totalBreaches: breaches.length,
      breachRate,
      avgDaysOverdue:
        breaches.length > 0
          ? (totalDaysOverdue / breaches.length).toFixed(1)
          : 0,
      recentBreaches: breaches.slice(0, 10),
      breachesByPriority,
    };
  } catch (err) {
    console.error("Error getting breach analytics:", err);
    return {
      totalBreaches: 0,
      breachRate: 0,
      avgDaysOverdue: 0,
      recentBreaches: [],
      breachesByPriority: {},
    };
  }
}

/**
 * Acknowledge an SLA breach
 */
export async function acknowledgeSLABreach(organizationId, breachId) {
  if (!db) {
    console.warn("Firebase not available - breach not acknowledged");
    return null;
  }

  try {
    const breachRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("slaBreaches")
      .doc(breachId);

    await breachRef.update({
      acknowledged: true,
      acknowledgedAt: FieldValue.serverTimestamp(),
    });

    console.log(`✅ SLA breach acknowledged: ${breachId}`);
    return true;
  } catch (err) {
    console.error("Error acknowledging breach:", err);
    throw err;
  }
}

/**
 * Mark SLA as completed
 */
export async function completeSLA(organizationId, slaId, actualCompletionDate) {
  if (!db) {
    console.warn("Firebase not available - SLA not marked complete");
    return null;
  }

  try {
    const slaRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("slas")
      .doc(slaId);

    const wasOnTime =
      new Date(actualCompletionDate) <= new Date(slaId.deadline);

    await slaRef.update({
      status: "completed",
      actualCompletionDate,
      wasOnTime,
    });

    console.log(`✅ SLA marked complete: ${slaId.milestoneName}`);
    return wasOnTime;
  } catch (err) {
    console.error("Error completing SLA:", err);
    throw err;
  }
}

/**
 * Get SLA summary for a project
 */
export async function getProjectSLASummary(organizationId, projectId) {
  if (!db) {
    return {
      totalSLAs: 0,
      onTrack: 0,
      atRisk: 0,
      breached: 0,
      slas: [],
    };
  }

  try {
    const slasCol = db
      .collection("organizations")
      .doc(organizationId)
      .collection("slas");
    
    const snapshot = await slasCol.where("projectId", "==", projectId).get();
    const slas = snapshot.docs.map((doc) => ({
      ...doc.data(),
      riskLevel: getSLARiskLevel(doc.data()),
      daysRemaining: Math.ceil(
        (new Date(doc.data().deadline) - new Date()) / (1000 * 60 * 60 * 24)
      ),
      statusText: formatDaysUntilDeadline(doc.data()),
    }));

    const onTrack = slas.filter((s) => s.riskLevel === "low").length;
    const atRisk = slas.filter(
      (s) => s.riskLevel === "medium" || s.riskLevel === "high"
    ).length;
    const breached = slas.filter((s) => s.riskLevel === "critical").length;

    return {
      totalSLAs: slas.length,
      onTrack,
      atRisk,
      breached,
      slas,
    };
  } catch (err) {
    console.error("Error getting project SLA summary:", err);
    return {
      totalSLAs: 0,
      onTrack: 0,
      atRisk: 0,
      breached: 0,
      slas: [],
    };
  }
}
