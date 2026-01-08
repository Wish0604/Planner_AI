// Executor Agent: Risk Assessment Specialist
export function riskPrompt(projectDescription, milestones) {
  return `
You are a Risk Assessment & Mitigation Specialist AI.

Project: ${projectDescription}

**CRITICAL: Return ONLY valid JSON in this EXACT structure:**

{
  "technical": [
    {
      "id": "tech-1",
      "name": "Technology Learning Curve",
      "severity": "Medium",
      "probability": "High",
      "impact": "May delay development by 1-2 weeks",
      "mitigation": ["Provide training", "Pair programming", "Documentation"],
      "contingency": "Hire consultant if needed"
    }
  ],
  "business": [
    {
      "id": "bus-1",
      "name": "Budget overrun",
      "severity": "High",
      "probability": "Medium",
      "impact": "Project delay or scope reduction",
      "mitigation": ["Weekly budget reviews", "Phased approach"],
      "contingency": "Reduce non-critical features"
    }
  ],
  "team": [
    {
      "id": "team-1",
      "name": "Resource availability",
      "severity": "Medium",
      "probability": "Medium",
      "impact": "Timeline delays",
      "mitigation": ["Cross-train team", "Document everything"],
      "contingency": "Contract additional resources"
    }
  ],
  "overallRiskLevel": "Medium",
  "topRisks": ["Budget overrun", "Technology learning curve", "Resource availability"]
}

Return ONLY the JSON object.
`;
}

export const riskAgent = {
  name: "Risk Specialist",
  skills: ["risk-analysis", "security", "compliance"],
  currentWorkload: 0,
  timezone: "UTC",
  experienceLevel: 5,
  
  async execute(task, model) {
    const prompt = riskPrompt(task.project, task.milestones);
    const result = await model.generateContent(prompt);
    return {
      agent: this.name,
      task: task.name,
      result: result.response.text(),
      timestamp: new Date().toISOString()
    };
  }
};
