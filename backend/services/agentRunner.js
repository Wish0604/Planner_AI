import { getGemini } from "../config/gemini.js";
import { plannerPrompt } from "../agents/planner.js";

export async function runPlannerAgent(userInput) {
  const genAI = await getGemini();

  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

  const result = await model.generateContent(plannerPrompt(userInput));
  const text = result.response.text();

  // Try to parse structured JSON and format as readable markdown for Simple Mode
  try {
    const cleaned = text.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
    const data = JSON.parse(cleaned);

    const objectives = Array.isArray(data.projectOverview?.objectives) ? data.projectOverview.objectives : [];
    const milestones = Array.isArray(data.milestones) ? data.milestones : [];
    const allocation = Array.isArray(data.resourceAllocation) ? data.resourceAllocation : [];
    const risks = Array.isArray(data.risks) ? data.risks : [];

    const md = [
      `# Project Roadmap`,
      `\n## Project Overview`,
      `- **Name:** ${data.projectOverview?.name || 'N/A'}`,
      `- **Description:** ${data.projectOverview?.description || 'N/A'}`,
      `- **Estimated Duration:** ${data.projectOverview?.estimatedDuration || 'N/A'}`,
      objectives.length ? `- **Objectives:**\n${objectives.map(o => `  - ${o}`).join('\n')}` : '',
      `\n## Milestones`,
      milestones.length ? milestones.map(m => (
        `- **${m.name}** (${m.duration || 'N/A'})\n  ${m.description || ''}\n  Deliverables: ${(m.deliverables || []).join(', ')}`
      )).join('\n') : '- None',
      `\n## Resource Allocation`,
      allocation.length ? allocation.map(r => (`- ${r.role}: ${r.count} (${r.allocation || '100%'})`)).join('\n') : '- None',
      `\n## Key Risks`,
      risks.length ? risks.map(r => (`- ${r.name} (${r.severity || 'N/A'}): ${r.mitigation || ''}`)).join('\n') : '- None'
    ].filter(Boolean).join('\n');

    return md;
  } catch {
    // Fallback: return original text
    return text;
  }
}
