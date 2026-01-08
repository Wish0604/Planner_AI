// Executor Agent: Deliverables & Documentation Specialist
export function deliverablesPrompt(projectDescription, milestone) {
  return `
You are a Deliverables & Documentation Specialist AI.

Project: ${projectDescription}

**CRITICAL: Return ONLY valid JSON in this EXACT structure:**

{
  "code": [
    {
      "id": "code-1",
      "name": "User Authentication Module",
      "type": "Backend",
      "description": "Complete auth system with JWT",
      "qualityStandards": {
        "testCoverage": "80%",
        "codeReview": true,
        "documentation": true
      },
      "acceptanceCriteria": [
        "Users can register and login",
        "JWT tokens expire after 24h",
        "Password reset functionality works"
      ]
    }
  ],
  "documentation": [
    {
      "type": "Technical Documentation",
      "format": "Markdown + Diagrams",
      "sections": ["Architecture", "API Reference", "Database Schema", "Setup Guide"]
    },
    {
      "type": "User Documentation",
      "format": "Online Help Center",
      "sections": ["Getting Started", "Features", "FAQ", "Troubleshooting"]
    }
  ],
  "testing": {
    "unitTestCoverage": 80,
    "integrationTests": true,
    "performanceTests": true
  },
  "definitionOfDone": [
    "Code reviewed and approved",
    "All tests passing",
    "Documentation complete",
    "Deployed to staging",
    "Stakeholder sign-off"
  ]
}

Return ONLY the JSON object.
`;
}

export const deliverablesAgent = {
  name: "Deliverables Specialist",
  skills: ["documentation", "qa", "testing"],
  currentWorkload: 0,
  timezone: "UTC",
  experienceLevel: 4,
  
  async execute(task, model) {
    const prompt = deliverablesPrompt(task.project, task.milestone);
    const result = await model.generateContent(prompt);
    return {
      agent: this.name,
      task: task.name,
      result: result.response.text(),
      timestamp: new Date().toISOString()
    };
  }
};
