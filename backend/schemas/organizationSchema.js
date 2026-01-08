import { v4 as uuidv4 } from "uuid";

/**
 * PHASE 11: Organization Mode (Enterprise)
 * Multi-team support, role-based assignment, skill heatmaps, SLA tracking
 */

/**
 * Role definitions (fixed set of enterprise roles)
 */
export const ENTERPRISE_ROLES = {
  frontend_lead: {
    id: "frontend_lead",
    label: "Frontend Lead",
    icon: "🎨",
    skills: ["React", "Vue", "Angular", "CSS", "UI/UX"],
    seniority: "senior",
  },
  backend_lead: {
    id: "backend_lead",
    label: "Backend Lead",
    icon: "⚙️",
    skills: ["Node.js", "Python", "Java", "Databases", "APIs"],
    seniority: "senior",
  },
  devops_engineer: {
    id: "devops_engineer",
    label: "DevOps Engineer",
    icon: "🚀",
    skills: ["Docker", "Kubernetes", "CI/CD", "AWS", "GCP"],
    seniority: "mid",
  },
  qa_engineer: {
    id: "qa_engineer",
    label: "QA Engineer",
    icon: "✅",
    skills: ["Testing", "Automation", "Performance", "Security"],
    seniority: "mid",
  },
  product_manager: {
    id: "product_manager",
    label: "Product Manager",
    icon: "📊",
    skills: ["Strategy", "Requirements", "Roadmap", "UX Research"],
    seniority: "senior",
  },
  junior_dev: {
    id: "junior_dev",
    label: "Junior Developer",
    icon: "👶",
    skills: ["Frontend", "Backend", "Testing", "Documentation"],
    seniority: "junior",
  },
};

/**
 * Skill proficiency levels
 */
export const PROFICIENCY_LEVELS = {
  expert: { level: 5, label: "Expert", color: "#4caf50" },
  advanced: { level: 4, label: "Advanced", color: "#8bc34a" },
  intermediate: { level: 3, label: "Intermediate", color: "#ffc107" },
  beginner: { level: 2, label: "Beginner", color: "#ff9800" },
  learning: { level: 1, label: "Learning", color: "#f44336" },
};

/**
 * Create a team member with skills and role assignment
 */
export function createTeamMember({
  userId,
  organizationId,
  name,
  email,
  role, // Role ID from ENTERPRISE_ROLES
  skills = {}, // { skillName: proficiencyLevel }
  capacity = 40, // Hours per week
  timezone = "UTC",
  metadata = {},
}) {
  return {
    id: uuidv4(),
    userId,
    organizationId,
    name,
    email,
    role, // e.g., "frontend_lead", "backend_lead"
    skills, // { "React": 5, "Vue": 3, "CSS": 4 }
    capacity,
    currentWorkload: 0, // Calculated dynamically
    timezone,
    availability: true, // On/off team
    joinedAt: new Date().toISOString(),
    createdAt: new Date(),
    metadata,
  };
}

/**
 * Create a team within an organization
 */
export function createTeam({
  organizationId,
  name,
  description = "",
  members = [],
  owner,
  capacity = 0, // Sum of member capacities
}) {
  return {
    id: uuidv4(),
    organizationId,
    name,
    description,
    members, // Array of member IDs
    owner, // User ID
    capacity,
    currentWorkload: 0,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create an SLA contract for a project
 */
export function createSLAContract({
  projectId,
  organizationId,
  milestoneName,
  deadline, // ISO date string
  priority = "medium", // low, medium, high, critical
  bufferDays = 3, // Alert when this many days before deadline
  assignedTeam = "",
  acceptanceCriteria = [],
}) {
  return {
    id: uuidv4(),
    projectId,
    organizationId,
    milestoneName,
    deadline,
    priority,
    bufferDays,
    assignedTeam,
    acceptanceCriteria,
    status: "active", // active, breached, completed
    breachAlertSent: false,
    actualCompletionDate: null,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Create a skill assessment/heatmap entry
 */
export function createSkillAssessment({
  memberId,
  teamId,
  organizationId,
  skillName,
  proficiencyLevel, // 1-5
  lastAssessedAt = null,
  endorsements = 0,
}) {
  return {
    id: uuidv4(),
    memberId,
    teamId,
    organizationId,
    skillName,
    proficiencyLevel: Math.min(5, Math.max(1, proficiencyLevel)),
    lastAssessedAt: lastAssessedAt || new Date().toISOString(),
    endorsements,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Calculate team capacity (sum of member capacities)
 */
export function calculateTeamCapacity(members) {
  return members.reduce((total, member) => total + (member.capacity || 0), 0);
}

/**
 * Calculate team utilization percentage
 */
export function calculateTeamUtilization(members) {
  const totalCapacity = calculateTeamCapacity(members);
  if (totalCapacity === 0) return 0;

  const totalWorkload = members.reduce(
    (total, member) => total + (member.currentWorkload || 0),
    0
  );

  return (totalWorkload / totalCapacity) * 100;
}

/**
 * Find best team member for a task by role/skills
 */
export function findBestMemberForTask(task, teamMembers) {
  let bestMember = null;
  let bestScore = -1;

  for (const member of teamMembers) {
    if (!member.availability || !member.skills) continue;

    let score = 0;

    // Role match (40 points)
    if (task.requiredRole && member.role === task.requiredRole) {
      score += 40;
    }

    // Skill match (40 points)
    if (task.requiredSkills) {
      const matchedSkills = task.requiredSkills.filter(
        (skill) => member.skills[skill]
      );
      score += (matchedSkills.length / task.requiredSkills.length) * 40;
    }

    // Workload/capacity (20 points) - prefer less loaded
    const utilization = member.currentWorkload / member.capacity;
    const capacityScore = Math.max(0, 20 * (1 - utilization));
    score += capacityScore;

    if (score > bestScore) {
      bestScore = score;
      bestMember = member;
    }
  }

  return { member: bestMember, score: bestScore };
}

/**
 * Check if SLA deadline is approaching
 */
export function isDeadlineApproaching(slaContract, bufferDays = null) {
  const deadline = new Date(slaContract.deadline);
  const now = new Date();
  const daysUntilDeadline = Math.ceil(
    (deadline - now) / (1000 * 60 * 60 * 24)
  );

  const buffer = bufferDays || slaContract.bufferDays || 3;
  return daysUntilDeadline <= buffer && daysUntilDeadline > 0;
}

/**
 * Check if SLA deadline has been breached
 */
export function isDeadlineBreach(slaContract) {
  const deadline = new Date(slaContract.deadline);
  const now = new Date();
  return now > deadline && !slaContract.actualCompletionDate;
}

/**
 * Get risk level for SLA
 */
export function getSLARiskLevel(slaContract) {
  if (isDeadlineBreach(slaContract)) return "critical"; // Red
  if (isDeadlineApproaching(slaContract)) return "high"; // Orange
  
  const deadline = new Date(slaContract.deadline);
  const now = new Date();
  const daysUntilDeadline = (deadline - now) / (1000 * 60 * 60 * 24);

  if (daysUntilDeadline > slaContract.bufferDays * 2) return "low"; // Green
  return "medium"; // Yellow
}

/**
 * Get color for risk level
 */
export function getRiskLevelColor(riskLevel) {
  const colors = {
    low: "#4caf50", // Green
    medium: "#ffc107", // Yellow
    high: "#ff9800", // Orange
    critical: "#f44336", // Red
  };
  return colors[riskLevel] || "#999";
}

/**
 * Get color for proficiency level
 */
export function getProficiencyColor(level) {
  return Object.values(PROFICIENCY_LEVELS).find((p) => p.level === level)
    ?.color || "#999";
}

/**
 * Format days until deadline
 */
export function formatDaysUntilDeadline(slaContract) {
  const deadline = new Date(slaContract.deadline);
  const now = new Date();
  const daysUntil = Math.ceil(
    (deadline - now) / (1000 * 60 * 60 * 24)
  );

  if (daysUntil < 0) {
    return `${Math.abs(daysUntil)} days overdue`;
  } else if (daysUntil === 0) {
    return "Due today";
  } else if (daysUntil === 1) {
    return "Due tomorrow";
  } else {
    return `${daysUntil} days left`;
  }
}
