// Telemetry Tracker - Real-time agent monitoring and event tracking

export class TelemetryTracker {
  constructor() {
    this.events = [];
    this.agentMetrics = new Map();
    this.taskTimeline = [];
    this.riskEvents = [];
    this.reallocationEvents = [];
    this.listeners = [];
    this.maxEvents = 1000; // Keep last 1000 events
  }

  // Add event listener for SSE
  addListener(listener) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Broadcast event to all listeners
  broadcast(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (err) {
        console.error('Error broadcasting event:', err);
      }
    });
  }

  // Track agent activity
  trackAgentStart(agentName, taskId, taskName) {
    console.log(`🚀 Telemetry: Agent START - ${agentName} (Task: ${taskId})`);
    const event = {
      type: 'agent_start',
      agentName,
      taskId,
      taskName,
      timestamp: new Date().toISOString(),
      id: `${Date.now()}-${Math.random()}`
    };

    if (!this.agentMetrics.has(agentName)) {
      this.agentMetrics.set(agentName, {
        name: agentName,
        tasksCompleted: 0,
        tasksInProgress: 0,
        tasksFailed: 0,
        currentLoad: 0,
        averageTaskTime: 0,
        totalProcessingTime: 0
      });
    }

    const metrics = this.agentMetrics.get(agentName);
    metrics.tasksInProgress++;
    metrics.currentLoad = metrics.tasksInProgress;

    this.addEvent(event);
    this.broadcast(event);
  }

  trackAgentComplete(agentName, taskId, taskName, duration) {
    console.log(`✅ Telemetry: Agent COMPLETE - ${agentName} (${duration}ms)`);
    const event = {
      type: 'agent_complete',
      agentName,
      taskId,
      taskName,
      duration,
      timestamp: new Date().toISOString(),
      id: `${Date.now()}-${Math.random()}`
    };

    const metrics = this.agentMetrics.get(agentName);
    if (metrics) {
      metrics.tasksInProgress = Math.max(0, metrics.tasksInProgress - 1);
      metrics.tasksCompleted++;
      metrics.currentLoad = metrics.tasksInProgress;
      metrics.totalProcessingTime += duration;
      metrics.averageTaskTime = metrics.totalProcessingTime / metrics.tasksCompleted;
    }

    this.addEvent(event);
    this.broadcast(event);
  }

  trackAgentError(agentName, taskId, taskName, error) {
    const event = {
      type: 'agent_error',
      agentName,
      taskId,
      taskName,
      error: error.message,
      timestamp: new Date().toISOString(),
      id: `${Date.now()}-${Math.random()}`
    };

    const metrics = this.agentMetrics.get(agentName);
    if (metrics) {
      metrics.tasksInProgress = Math.max(0, metrics.tasksInProgress - 1);
      metrics.tasksFailed++;
      metrics.currentLoad = metrics.tasksInProgress;
    }

    this.addEvent(event);
    this.broadcast(event);
  }

  // Track task timeline
  trackTaskProgress(taskId, taskName, phase, progress, agentName) {
    const event = {
      type: 'task_progress',
      taskId,
      taskName,
      phase,
      progress, // 0-100
      agentName,
      timestamp: new Date().toISOString(),
      id: `${Date.now()}-${Math.random()}`
    };

    this.taskTimeline.push(event);
    this.addEvent(event);
    this.broadcast(event);
  }

  // Track risk events
  trackRisk(riskId, riskName, severity, category, status = 'identified') {
    const event = {
      type: 'risk_event',
      riskId,
      riskName,
      severity, // 'low', 'medium', 'high', 'critical'
      category, // 'technical', 'timeline', 'resource'
      status, // 'identified', 'mitigated', 'escalated'
      timestamp: new Date().toISOString(),
      id: `${Date.now()}-${Math.random()}`
    };

    this.riskEvents.push(event);
    this.addEvent(event);
    this.broadcast(event);
  }

  // Track task reallocation
  trackReallocation(taskId, taskName, fromAgent, toAgent, reason) {
    const event = {
      type: 'reallocation',
      taskId,
      taskName,
      fromAgent,
      toAgent,
      reason,
      timestamp: new Date().toISOString(),
      id: `${Date.now()}-${Math.random()}`
    };

    this.reallocationEvents.push(event);
    this.addEvent(event);
    this.broadcast(event);
  }

  // Add event to history
  addEvent(event) {
    this.events.push(event);
    // Keep only last N events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents);
    }
  }

  // Get current metrics snapshot
  getMetricsSnapshot() {
    const agents = Array.from(this.agentMetrics.values());
    
    return {
      timestamp: new Date().toISOString(),
      agentMetrics: agents,
      totalTasksCompleted: agents.reduce((sum, a) => sum + a.tasksCompleted, 0),
      totalTasksInProgress: agents.reduce((sum, a) => sum + a.tasksInProgress, 0),
      totalTasksFailed: agents.reduce((sum, a) => sum + a.tasksFailed, 0),
      recentEvents: this.events.slice(-50), // Last 50 events
      taskTimeline: this.taskTimeline.slice(-100),
      riskEvents: this.riskEvents.slice(-50),
      reallocationEvents: this.reallocationEvents.slice(-20)
    };
  }

  // Get agent load over time (for visualization)
  getAgentLoadHistory(minutes = 30) {
    const cutoff = Date.now() - (minutes * 60 * 1000);
    const events = this.events.filter(e => new Date(e.timestamp).getTime() > cutoff);
    
    // Group by time intervals (1 minute buckets)
    const buckets = new Map();
    
    events.forEach(event => {
      const time = new Date(event.timestamp);
      const bucket = new Date(Math.floor(time.getTime() / 60000) * 60000).toISOString();
      
      if (!buckets.has(bucket)) {
        buckets.set(bucket, new Map());
      }
      
      const agentLoads = buckets.get(bucket);
      if (!agentLoads.has(event.agentName)) {
        agentLoads.set(event.agentName, 0);
      }
      
      if (event.type === 'agent_start') {
        agentLoads.set(event.agentName, agentLoads.get(event.agentName) + 1);
      } else if (event.type === 'agent_complete' || event.type === 'agent_error') {
        agentLoads.set(event.agentName, Math.max(0, agentLoads.get(event.agentName) - 1));
      }
    });
    
    return Array.from(buckets.entries()).map(([time, loads]) => ({
      time,
      ...Object.fromEntries(loads)
    }));
  }

  // Get risk heatmap data
  getRiskHeatmap() {
    const categories = ['technical', 'timeline', 'resource', 'business'];
    const severities = ['low', 'medium', 'high', 'critical'];
    
    const heatmap = {};
    
    categories.forEach(category => {
      heatmap[category] = {};
      severities.forEach(severity => {
        heatmap[category][severity] = 0;
      });
    });
    
    this.riskEvents.forEach(event => {
      if (heatmap[event.category] && event.severity) {
        heatmap[event.category][event.severity]++;
      }
    });
    
    return heatmap;
  }

  // Reset all metrics
  reset() {
    this.events = [];
    this.agentMetrics.clear();
    this.taskTimeline = [];
    this.riskEvents = [];
    this.reallocationEvents = [];
  }
}

// Global singleton instance
export const telemetryTracker = new TelemetryTracker();
