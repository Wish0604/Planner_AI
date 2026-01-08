/**
 * PHASE 12: XAI - Generate reasoning explanation for planner decisions
 */
export function generatePlannerExplanation(projectOverview, milestones, resourceAllocation) {
  const milestoneCount = milestones?.length || 0;
  const taskCount = milestones?.reduce((sum, m) => sum + (m.tasks?.length || 0), 0) || 0;
  const skillRequirements = resourceAllocation?.skillRequirements || {};
  
  // Calculate confidence based on factors
  let confidence = 0.75; // Base confidence
  if (milestoneCount >= 3) confidence += 0.05; // Good decomposition
  if (taskCount >= 5) confidence += 0.05; // Adequate granularity
  if (Object.keys(skillRequirements).length >= 3) confidence += 0.05; // Diverse skills
  confidence = Math.min(1, confidence);

  return {
    agentName: "Planner",
    decisionType: "roadmap_generation",
    decision: `Decomposed project into ${milestoneCount} milestones with ${taskCount} tasks`,
    explanation: `The Planner agent analyzed the project requirements and created a phased breakdown to manage complexity and risk.`,
    confidenceScore: confidence,
    reasoning_steps: [
      "Parsed project objectives and success criteria",
      `Decomposed into ${milestoneCount} sequential milestones`,
      `Created ${taskCount} atomic tasks with clear dependencies`,
      `Identified skill requirements: ${Object.keys(skillRequirements).join(", ")}`,
      "Suggested balanced resource allocation across team",
    ],
    key_factors: [
      "Project complexity and scope",
      "Task interdependencies",
      "Required skill diversity",
      "Timeline constraints",
      "Risk factors identified",
    ],
    alternatives: [
      "Single-phase waterfall approach (risky for complex projects)",
      "Agile sprint-based approach (requires more iterations)",
      "Feature-driven development (good for parallel work)",
    ],
    evidence: [
      `${milestoneCount} well-sequenced milestones created`,
      `${taskCount} detailed tasks with effort estimates`,
      `${Object.keys(skillRequirements).length} skill categories identified`,
    ],
  };
}

// Planner Agent: Decomposes project into milestones and tasks
export function plannerPrompt(input) {
  return `
You are a Senior Software Architect and Project Planner AI.

Analyze this project request: "${input}"

**CRITICAL: Return ONLY valid JSON in this EXACT structure. No markdown, no explanations, just JSON:**

{
  "projectOverview": {
    "name": "Project Name",
    "description": "Brief description",
    "objectives": ["Objective 1", "Objective 2"],
    "successCriteria": ["Criterion 1", "Criterion 2"]
  },
  "milestones": [
    {
      "id": "m1",
      "name": "Milestone Name",
      "description": "Description",
      "duration": "2 weeks",
      "dependencies": [],
      "priority": "High",
      "requiredSkills": ["Frontend", "Backend"],
      "tasks": [
        {
          "id": "t1",
          "name": "Task name",
          "effort": 16,
          "skills": ["Frontend"],
          "canParallel": true,
          "dependencies": []
        }
      ]
    }
  ],
  "resourceAllocation": {
    "teamComposition": ["1 Senior Frontend", "1 Backend Developer"],
    "skillRequirements": {
      "frontend": 2,
      "backend": 2,
      "devops": 1
    },
    "workloadDistribution": "Balanced across team"
  },
  "risks": [
    {
      "id": "r1",
      "name": "Risk name",
      "severity": "High",
      "mitigation": "Mitigation strategy"
    }
  ]
}

Return ONLY the JSON object, nothing else.
`;
}

export function affinityScore(task, agent) {
  // Calculate affinity score based on skills, workload, and availability
  let score = 0;
  
  // Skill matching (0-40 points)
  const skillMatch = task.requiredSkills?.some(skill => 
    agent.skills?.includes(skill)
  );
  score += skillMatch ? 40 : 0;
  
  // Workload factor (0-30 points) - prefer less loaded agents
  const workloadScore = Math.max(0, 30 - (agent.currentWorkload || 0) * 3);
  score += workloadScore;
  
  // Location/timezone match (0-15 points)
  if (task.preferredTimezone === agent.timezone) {
    score += 15;
  }
  
  // Experience level (0-15 points)
  score += (agent.experienceLevel || 1) * 3;
  
  return score;
}

/**
 * PHASE 12: XAI - Generate task allocation explanation
 */
export function generateAllocationExplanation(task, agent, affinityScoreVal) {
  return {
    agentName: "Planner",
    decisionType: "task_allocation",
    decision: `Assigned task "${task.name}" to ${agent.name}`,
    explanation: `Task was allocated to ${agent.name} based on skill match, current workload, and experience level.`,
    confidenceScore: Math.min(1, affinityScoreVal / 100), // Normalize 0-100 to 0-1
    reasoning_steps: [
      `Analyzed task requirements: ${task.requiredSkills?.join(", ") || "general"}`,
      `Evaluated ${agent.name} skill fit: ${task.requiredSkills?.some(s => agent.skills?.includes(s)) ? "MATCH" : "PARTIAL"}`,
      `Checked workload: ${agent.currentWorkload || 0} hours assigned`,
      `Verified timezone alignment: ${task.preferredTimezone === agent.timezone ? "YES" : "NO"}`,
      `Affinity score: ${affinityScoreVal}/100`,
    ],
    key_factors: [
      "Skill match",
      "Current workload",
      "Experience level",
      "Timezone compatibility",
      "Task priority",
    ],
    alternatives: [
      `Allocate to backup agent (lower affinity: ${(affinityScoreVal * 0.8).toFixed(0)}/100)`,
      "Split task across multiple agents (coordination overhead)",
      "Wait for higher-skilled agent availability",
    ],
    evidence: [
      `Task requires: ${task.requiredSkills?.join(", ")}`,
      `Agent skills: ${agent.skills?.join(", ")}`,
      `Agent workload: ${agent.currentWorkload || 0}h / ${agent.capacity || 40}h`,
      `Affinity score: ${affinityScoreVal}/100`,
    ],
  };
}

export function allocateTasks(tasks, agents) {
  const allocations = [];
  
  for (const task of tasks) {
    // Calculate affinity scores for all available agents
    const scores = agents.map(agent => ({
      agent,
      score: affinityScore(task, agent)
    }));
    
    // Sort by score descending
    scores.sort((a, b) => b.score - a.score);
    
    // Assign to best match
    const bestMatch = scores[0];
    allocations.push({
      task,
      assignedAgent: bestMatch.agent,
      affinityScore: bestMatch.score,
      timestamp: new Date().toISOString()
    });
  }
  
  return allocations;
}
