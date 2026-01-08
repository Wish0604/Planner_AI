// Simple rule-based domain classifier
// Returns one of: planning, code, devops, risk, docs, general
export function classifyDomain({ userInput = '', taskName = '' }) {
  const text = `${taskName} ${userInput}`.toLowerCase();

  const rules = [
    { label: 'planning', keywords: ['plan', 'roadmap', 'strategy', 'milestone'] },
    { label: 'code', keywords: ['code', 'api', 'sdk', 'typescript', 'python', 'implementation'] },
    { label: 'devops', keywords: ['deploy', 'docker', 'k8s', 'kubernetes', 'ci', 'cd', 'pipeline', 'cloud run'] },
    { label: 'risk', keywords: ['risk', 'issue', 'mitigation', 'security', 'privacy'] },
    { label: 'docs', keywords: ['document', 'docs', 'readme', 'spec', 'report'] }
  ];

  for (const rule of rules) {
    if (rule.keywords.some(k => text.includes(k))) {
      return rule.label;
    }
  }

  return 'general';
}
