// Multi-Agent Orchestrator
import { modelConfig } from "../config/models.js";
import { ModelRouter } from "./modelRouter.js";
import { classifyDomain } from "./domainClassifier.js";
import { plannerPrompt } from "../agents/planner.js";
import { techStackAgent } from "../agents/techstack.js";
import { timelineAgent } from "../agents/timeline.js";
import { riskAgent } from "../agents/risks.js";
import { deliverablesAgent } from "../agents/deliverables.js";
import { telemetryTracker } from "./telemetryTracker.js";

export class MultiAgentOrchestrator {
  constructor({ issueReporter, modelRouter } = {}) {
    this.executorAgents = [
      techStackAgent,
      timelineAgent,
      riskAgent,
      deliverablesAgent
    ];
    this.issueReporter = issueReporter;
    this.modelRouter = modelRouter || new ModelRouter(modelConfig);
    this.projectState = {
      roadmap: null,
      allocations: [],
      executions: []
    };
    
    // No monitor/reallocator event listeners
  }

  setupEventListeners() {}

  // Main orchestration flow
  async execute(userInput) {
    console.log('🚀 Starting multi-agent orchestration...');
    
    try {
      // Step 1: Planner creates initial roadmap
      const roadmap = await this.runPlanner(userInput);
      this.projectState.roadmap = roadmap;
      
      // Step 2: Allocate tasks to executor agents
      const allocations = this.allocateToExecutors(roadmap);
      this.projectState.allocations = allocations;
      
      // Step 3: Execute tasks in parallel
      const results = await this.executeInParallel(allocations);
      this.projectState.executions = results;
      
      // Step 4: Compile comprehensive report
      const report = this.compileReport();
      
      return report;
      
    } catch (error) {
      console.error('❌ Orchestration error:', error);
      throw error;
    }
  }

  // Step 1: Run Planner Agent
  async runPlanner(userInput) {
    console.log('📋 Planner Agent: Creating roadmap...');
    const domain = classifyDomain({ userInput, taskName: 'planner' });
    const { model } = await this.modelRouter.getModelForTask({ taskType: 'planning', domain });
    
    const prompt = plannerPrompt(userInput);
    const result = await model.generateContent(prompt);
    const roadmapText = result.response.text();
    
    // Parse JSON response from planner
    try {
      const cleanedResult = roadmapText.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
      const roadmap = JSON.parse(cleanedResult);
      
      // Track risks from roadmap
      if (roadmap.risks && Array.isArray(roadmap.risks)) {
        roadmap.risks.forEach(risk => {
          const severity = risk.severity?.toLowerCase() || 'medium';
          const category = risk.category || 'technical';
          telemetryTracker.trackRisk(
            risk.id || `risk-${Date.now()}`,
            risk.name || 'Unknown Risk',
            severity,
            category,
            'identified'
          );
        });
      }
      
      return roadmap;
    } catch (error) {
      console.error('❌ Error parsing Planner JSON:', error.message);
      // Return raw text if parsing fails
      return { raw: roadmapText, parseError: true };
    }
  }

  // Step 2: Allocate tasks to executors
  allocateToExecutors(roadmap) {
    console.log('🎯 Allocating tasks to executor agents...');
    
    // Create tasks for each executor
    const tasks = [
      {
        id: 'techstack',
        name: 'Technology Stack Analysis',
        requiredSkills: ['architecture', 'devops'],
        agent: techStackAgent
      },
      {
        id: 'timeline',
        name: 'Timeline & Scheduling',
        requiredSkills: ['planning', 'scheduling'],
        agent: timelineAgent
      },
      {
        id: 'risks',
        name: 'Risk Assessment',
        requiredSkills: ['risk-analysis', 'security'],
        agent: riskAgent
      },
      {
        id: 'deliverables',
        name: 'Deliverables Definition',
        requiredSkills: ['documentation', 'qa'],
        agent: deliverablesAgent
      }
    ];
    
    return tasks;
  }

  // Step 3: Execute tasks in parallel
  async executeInParallel(allocations) {
    console.log('⚡ Executing tasks in parallel...');
    
    const executions = allocations.map(async (task) => {
      const startTime = Date.now();
      const taskId = `task-${task.id}-${Date.now()}`;
      const domain = classifyDomain({
        userInput: this.projectState?.roadmap?.projectOverview?.description || '',
        taskName: task.name
      });
      const { model } = await this.modelRouter.getModelForTask({ taskType: 'execution', domain });
      
      // Track agent start
      telemetryTracker.trackAgentStart(task.agent.name, taskId, task.name);
      telemetryTracker.trackTaskProgress(taskId, task.name, 'started', 0, task.agent.name);
      
      try {
        // Execute task
        const execOut = await task.agent.execute({
          name: task.name,
          project: this.projectState.roadmap,
          milestone: 'Initial Planning'
        }, model);
        
        const duration = Date.now() - startTime;
        
        // Track progress
        telemetryTracker.trackTaskProgress(taskId, task.name, 'processing', 50, task.agent.name);
        
        // Parse JSON response from executor agent
        let parsedPayload = execOut?.result;
        let parsedResult = execOut;
        try {
          if (typeof parsedPayload === 'string') {
            const cleaned = parsedPayload.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const parsed = JSON.parse(cleaned);
            parsedResult = { ...execOut, result: parsed };
          } else if (typeof execOut === 'string') {
            const cleaned = execOut.trim().replace(/```json\n?/g, '').replace(/```\n?/g, '');
            const parsed = JSON.parse(cleaned);
            parsedResult = { agent: task.agent.name, task: task.name, result: parsed };
          } else {
            parsedResult = execOut;
          }
        } catch (error) {
          console.error(`⚠️ Warning: Could not parse ${task.agent.name} JSON:`, error.message);
          // Keep raw result if parsing fails
          parsedResult = typeof execOut === 'string' 
            ? { agent: task.agent.name, task: task.name, result: { raw: execOut, parseError: true } }
            : { ...execOut, result: { raw: execOut?.result ?? execOut, parseError: true } };
        }

        // Track successful completion
        telemetryTracker.trackTaskProgress(taskId, task.name, 'completed', 100, task.agent.name);
        telemetryTracker.trackAgentComplete(task.agent.name, taskId, task.name, duration);

        return parsedResult;
        
      } catch (error) {
        console.error(`❌ Task ${task.id} failed:`, error);
        
        // Track error
        telemetryTracker.trackAgentError(task.agent.name, taskId, task.name, error);
        telemetryTracker.trackTaskProgress(taskId, task.name, 'failed', 0, task.agent.name);
        
        await this.reportBlocker(task, error);
        throw error;
      }
    });
    
    // Wait for all tasks
    return Promise.all(executions);
  }

  // Step 4: Compile comprehensive report
  compileReport() {
    const { roadmap, executions } = this.projectState;
    
    const report = {
      summary: {
        projectRoadmap: roadmap,
        totalAgents: this.executorAgents.length + 1, // +1 for planner
        tasksCompleted: executions.filter(e => e).length,
        executionTime: new Date().toISOString()
      },
      agentOutputs: {
        planner: roadmap,
        executors: executions.map(e => ({
          agent: e.agent,
          task: e.task,
          output: e.result
        }))
      },
      metadata: {
        architecture: 'Multi-Agent System',
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    };
    
    return report;
  }

  // Get current project state
  getState() {
    return this.projectState;
  }

  async reportBlocker(task, error) {
    if (!this.issueReporter || typeof this.issueReporter.createIssue !== 'function') return;

    const title = `[Blocker] ${task.name} failed during orchestration`;
    const body = [
      '## Summary',
      `Task: ${task.id} (${task.name})`,
      '',
      '## Error',
      `Message: ${error?.message || 'Unknown error'}`,
      '',
      '## Context',
      '- Orchestrator: Multi-agent planning',
      '- Phase: Executor',
      '',
      '<details>',
      '<summary>Stack trace</summary>',
      '',
      error?.stack || '(no stack)',
      '',
      '</details>'
    ].join('\n');

    try {
      await this.issueReporter.createIssue({
        title,
        body,
        labels: ['ai-blocker', 'auto-filed']
      });
    } catch (err) {
      console.warn('Failed to create blocker issue:', err.message);
    }
  }

  // No simulate delay/failure without monitor/reallocator
}

export function createOrchestrator(opts = {}) {
  return new MultiAgentOrchestrator(opts);
}
