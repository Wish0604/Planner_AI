import {
  collection,
  doc,
  setDoc,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  createTeam,
  createTeamMember,
  calculateTeamCapacity,
  calculateTeamUtilization,
  findBestMemberForTask,
} from "../schemas/organizationSchema.js";

let db = null;

// Initialize Firebase if available
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
    console.log("✅ Firebase initialized for organization service");
  } else {
    console.warn("⚠️  Firebase not configured - org service will be limited");
  }
} catch (err) {
  console.warn("⚠️  Could not initialize Firebase for org service:", err.message);
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

    const teamRef = doc(
      collection(db, "organizations", organizationId, "teams"),
      team.id
    );
    await setDoc(teamRef, team);

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

    // Store member
    const memberRef = doc(
      collection(
        db,
        "organizations",
        organizationId,
        "teams",
        teamId,
        "members"
      ),
      member.id
    );
    await setDoc(memberRef, member);

    // Update team member list
    const teamRef = doc(db, "organizations", organizationId, "teams", teamId);
    const teamSnap = await getDocs(
      collection(
        db,
        "organizations",
        organizationId,
        "teams",
        teamId,
        "members"
      )
    );
    const memberCount = teamSnap.size;

    await updateDoc(teamRef, {
      members: Array.from(teamSnap.docs).map((d) => d.id),
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
    const q = query(
      collection(db, "organizations", organizationId, "teams"),
      orderBy("createdAt", "desc")
    );

    const docs = await getDocs(q);
    return docs.map((doc) => doc.data());
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
    const q = query(
      collection(
        db,
        "organizations",
        organizationId,
        "teams",
        teamId,
        "members"
      ),
      where("availability", "==", true)
    );

    const docs = await getDocs(q);
    return docs.map((doc) => doc.data());
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
    const memberRef = doc(
      collection(
        db,
        "organizations",
        organizationId,
        "teams",
        teamId,
        "members"
      ),
      member.id
    );

    const newWorkload = (member.currentWorkload || 0) + (taskData.effort || 0);
    await updateDoc(memberRef, {
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
    const memberRef = doc(
      collection(
        db,
        "organizations",
        organizationId,
        "teams",
        teamId,
        "members"
      ),
      memberId
    );

    const snapshot = await getDocs(query(memberRef));
    const member = snapshot.docs[0]?.data();

    if (!member) throw new Error("Member not found");

    const newWorkload = Math.max(
      0,
      (member.currentWorkload || 0) - hoursToRelease
    );

    await updateDoc(memberRef, {
      currentWorkload: newWorkload,
      lastUpdated: serverTimestamp(),
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
