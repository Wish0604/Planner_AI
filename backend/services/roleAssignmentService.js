import { initializeApp, applicationDefault } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import {
  createTeam,
  createTeamMember,
  calculateTeamCapacity,
  calculateTeamUtilization,
  findBestMemberForTask,
} from "../schemas/organizationSchema.js";

let db = null;

// Initialize Firebase Admin SDK (bypasses client security rules)
try {
  if (process.env.FIREBASE_PROJECT_ID) {
    initializeApp({
      credential: applicationDefault(),
      projectId: process.env.FIREBASE_PROJECT_ID,
    });
    db = getFirestore();
    console.log("✅ Firebase Admin initialized for organization service");
  } else {
    console.warn("⚠️  Firebase not configured - org service will be limited");
  }
} catch (err) {
  console.warn("⚠️  Could not initialize Firebase Admin for org service:", err.message);
}

/**
 * Create a team for an organization
 */
export async function createOrgTeam(organizationId, teamData) {
  if (!db) {
    console.warn("Firebase not available - team not created");
    return null;
  }

  try {
    const team = createTeam({
      organizationId,
      ...teamData,
    });

    const teamRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("teams")
      .doc(team.id);
    await teamRef.set(team);

    console.log(`✅ Team created: ${team.name} (${team.id})`);
    return team;
  } catch (err) {
    console.error("Error creating team:", err);
    throw err;
  }
}

/**
 * Add a member to a team
 */
export async function addTeamMember(organizationId, teamId, memberData) {
  if (!db) {
    console.warn("Firebase not available - member not added");
    return null;
  }

  try {
    const member = createTeamMember({
      organizationId,
      ...memberData,
    });

    // Ensure team exists - create if missing
    const teamRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("teams")
      .doc(teamId);
    const teamDoc = await teamRef.get();
    if (!teamDoc.exists) {
      // Create team on first member add
      await teamRef.set({
        id: teamId,
        organizationId,
        name: `Team ${teamId}`,
        description: "Auto-created team",
        members: [],
        owner: memberData.userId,
        capacity: 0,
        currentWorkload: 0,
        createdAt: new Date().toISOString(),
      });
      console.log(`✅ Team auto-created: ${teamId}`);
    }

    // Store member
    const membersCol = teamRef.collection("members");
    const memberRef = membersCol.doc(member.id);
    await memberRef.set(member);

    // Update team member list
    const teamSnap = await membersCol.get();
    const memberCount = teamSnap.size;

    await teamRef.update({
      members: teamSnap.docs.map((d) => d.id),
      capacity: memberCount * 40, // Assume 40 hours per week default
    });

    console.log(`✅ Member added: ${member.name} to team ${teamId}`);
    return member;
  } catch (err) {
    console.error("Error adding member:", err);
    throw err;
  }
}

/**
 * Get all teams for an organization
 */
export async function getOrgTeams(organizationId) {
  if (!db) {
    return [];
  }

  try {
    const snapshot = await db
      .collection("organizations")
      .doc(organizationId)
      .collection("teams")
      .orderBy("createdAt", "desc")
      .get();
    return snapshot.docs.map((doc) => doc.data());
  } catch (err) {
    console.error("Error getting teams:", err);
    return [];
  }
}

/**
 * Get team members with their skills and workload
 */
export async function getTeamMembers(organizationId, teamId) {
  if (!db) {
    return [];
  }

  try {
    const snapshot = await db
      .collection("organizations")
      .doc(organizationId)
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .where("availability", "==", true)
      .get();
    return snapshot.docs.map((doc) => doc.data());
  } catch (err) {
    console.error("Error getting team members:", err);
    return [];
  }
}

/**
 * Assign a task to best-fit team member
 */
export async function assignTaskToTeam(
  organizationId,
  teamId,
  taskData
) {
  if (!db) {
    console.warn("Firebase not available - task not assigned");
    return null;
  }

  try {
    const members = await getTeamMembers(organizationId, teamId);

    if (members.length === 0) {
      throw new Error("No available team members");
    }

    // Find best member for task
    const { member, score } = findBestMemberForTask(taskData, members);

    if (!member) {
      throw new Error("No suitable member found for task");
    }

    // Update member workload
    const memberRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .doc(member.id);

    const newWorkload = (member.currentWorkload || 0) + (taskData.effort || 0);
    await memberRef.update({
      currentWorkload: newWorkload,
    });

    console.log(`✅ Task assigned to ${member.name} (score: ${score.toFixed(1)})`);

    return {
      assignedMemberId: member.id,
      assignedMemberName: member.name,
      assignmentScore: score,
      newWorkload,
      capacity: member.capacity,
    };
  } catch (err) {
    console.error("Error assigning task:", err);
    throw err;
  }
}

/**
 * Get team capacity and utilization
 */
export async function getTeamCapacityStatus(organizationId, teamId) {
  if (!db) {
    return {
      capacity: 0,
      utilization: 0,
      memberCount: 0,
      available: 0,
    };
  }

  try {
    const members = await getTeamMembers(organizationId, teamId);

    const totalCapacity = calculateTeamCapacity(members);
    const utilization = calculateTeamUtilization(members);
    const availableCapacity = totalCapacity - members.reduce((sum, m) => sum + (m.currentWorkload || 0), 0);

    return {
      capacity: totalCapacity,
      utilization: utilization.toFixed(1),
      memberCount: members.length,
      available: Math.max(0, availableCapacity),
      members: members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
        workload: m.currentWorkload || 0,
        capacity: m.capacity,
        utilization: ((m.currentWorkload || 0) / m.capacity) * 100,
      })),
    };
  } catch (err) {
    console.error("Error getting team capacity:", err);
    return {
      capacity: 0,
      utilization: 0,
      memberCount: 0,
      available: 0,
    };
  }
}

/**
 * Get skill heatmap for team
 */
export async function getTeamSkillHeatmap(organizationId, teamId) {
  if (!db) {
    return [];
  }

  try {
    const members = await getTeamMembers(organizationId, teamId);

    const heatmap = [];
    for (const member of members) {
      if (member.skills && Object.keys(member.skills).length > 0) {
        for (const [skill, proficiency] of Object.entries(member.skills)) {
          heatmap.push({
            memberId: member.id,
            memberName: member.name,
            memberRole: member.role,
            skill,
            proficiency, // 1-5
            endorsements: 0,
          });
        }
      }
    }

    return heatmap;
  } catch (err) {
    console.error("Error getting skill heatmap:", err);
    return [];
  }
}

/**
 * Update member workload when task completes
 */
export async function updateMemberWorkload(
  organizationId,
  teamId,
  memberId,
  hoursToRelease
) {
  if (!db) {
    console.warn("Firebase not available - workload not updated");
    return null;
  }

  try {
    const memberRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .doc(memberId);

    const docSnap = await memberRef.get();
    const member = docSnap.data();

    if (!member) throw new Error("Member not found");

    const newWorkload = Math.max(
      0,
      (member.currentWorkload || 0) - hoursToRelease
    );

    await memberRef.update({
      currentWorkload: newWorkload,
      lastUpdated: FieldValue.serverTimestamp(),
    });

    console.log(`✅ Workload updated: ${newWorkload}h`);
    return newWorkload;
  } catch (err) {
    console.error("Error updating workload:", err);
    throw err;
  }
}

/**
 * Get organization-wide capacity status
 */
export async function getOrgCapacityStatus(organizationId) {
  if (!db) {
    return {
      totalCapacity: 0,
      totalUtilization: 0,
      teamCount: 0,
      memberCount: 0,
      teams: [],
    };
  }

  try {
    const teams = await getOrgTeams(organizationId);
    let totalCapacity = 0;
    let totalWorkload = 0;
    let totalMembers = 0;

    const teamStatusList = [];

    for (const team of teams) {
      const capacity = await getTeamCapacityStatus(organizationId, team.id);
      totalCapacity += capacity.capacity;
      totalMembers += capacity.memberCount;
      totalWorkload += capacity.capacity - capacity.available;
      teamStatusList.push({
        ...team,
        ...capacity,
      });
    }

    const utilization =
      totalCapacity > 0 ? ((totalWorkload / totalCapacity) * 100).toFixed(1) : 0;

    return {
      totalCapacity,
      totalUtilization: utilization,
      teamCount: teams.length,
      memberCount: totalMembers,
      teams: teamStatusList,
    };
  } catch (err) {
    console.error("Error getting org capacity:", err);
    return {
      totalCapacity: 0,
      totalUtilization: 0,
      teamCount: 0,
      memberCount: 0,
      teams: [],
    };
  }
}

/**
 * Update member skills
 */
export async function updateMemberSkills(organizationId, teamId, memberId, skills) {
  if (!db) {
    throw new Error("Firebase not initialized");
  }

  try {
    const memberRef = db
      .collection("organizations")
      .doc(organizationId)
      .collection("teams")
      .doc(teamId)
      .collection("members")
      .doc(memberId);

    await memberRef.update({ skills });

    return { success: true, message: "Skills updated successfully" };
  } catch (err) {
    console.error("Error updating member skills:", err);
    throw err;
  }
}
