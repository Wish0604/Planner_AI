// Executor Agent: Timeline Specialist
export function timelinePrompt(projectDescription, tasks) {
  return `
You are a Project Timeline & Scheduling Specialist AI.

Project: ${projectDescription}

**CRITICAL: Return ONLY valid JSON in this EXACT structure:**

{
  "totalDuration": "12 weeks",
  "startDate": "Week 1",
  "endDate": "Week 12",
  "phases": [
    {
      "id": "phase1",
      "name": "Planning & Setup",
      "startWeek": 1,
      "endWeek": 2,
      "duration": "2 weeks",
      "tasks": [
        {
          "name": "Requirements gathering",
          "duration": "3 days",
          "assignedTo": "Team Lead"
        }
      ],
      "dependencies": [],
      "deliverables": ["Requirements doc", "Architecture design"]
    }
  ],
  "criticalPath": ["phase1", "phase2", "phase5"],
  "parallelTasks": ["Frontend dev + Backend dev", "Testing + Documentation"],
  "bufferTime": "15% (2 weeks total)"
}

Return ONLY the JSON object.
`;
}

export const timelineAgent = {
  name: "Timeline Specialist",
  skills: ["planning", "scheduling", "project-management"],
  currentWorkload: 0,
  timezone: "UTC",
  experienceLevel: 5,
  
  async execute(task, model) {
    const prompt = timelinePrompt(task.project, task.tasks);
    const result = await model.generateContent(prompt);
    return {
      agent: this.name,
      task: task.name,
      result: result.response.text(),
      timestamp: new Date().toISOString()
    };
  }
};
