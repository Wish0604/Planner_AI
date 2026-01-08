// Executor Agent: Tech Stack Specialist
export function techStackPrompt(projectDescription, milestone) {
  return `
You are a Technology Stack Specialist AI.

Project: ${projectDescription}

**CRITICAL: Return ONLY valid JSON in this EXACT structure:**

{
  "frontend": {
    "framework": "React 18",
    "version": "18.2.0",
    "uiLibraries": ["Material-UI", "Tailwind CSS"],
    "stateManagement": "Redux Toolkit",
    "buildTools": ["Vite", "ESBuild"]
  },
  "backend": {
    "runtime": "Node.js 20",
    "framework": "Express 4.18",
    "database": "PostgreSQL 15",
    "apiArchitecture": "RESTful + GraphQL",
    "authentication": "JWT + OAuth2"
  },
  "devops": {
    "hosting": "Google Cloud Run",
    "cicd": ["GitHub Actions", "Cloud Build"],
    "monitoring": ["Cloud Monitoring", "Sentry"],
    "versionControl": "Git + GitHub"
  },
  "justifications": [
    {
      "technology": "React 18",
      "reason": "Best ecosystem, performance, team expertise",
      "tradeoffs": "Steeper learning curve vs alternatives"
    }
  ]
}

Return ONLY the JSON object.
`;
}

export const techStackAgent = {
  name: "TechStack Specialist",
  skills: ["architecture", "devops", "backend", "frontend"],
  currentWorkload: 0,
  timezone: "UTC",
  experienceLevel: 5,
  
  async execute(task, model) {
    const prompt = techStackPrompt(task.project, task.milestone);
    const result = await model.generateContent(prompt);
    return {
      agent: this.name,
      task: task.name,
      result: result.response.text(),
      timestamp: new Date().toISOString()
    };
  }
};
