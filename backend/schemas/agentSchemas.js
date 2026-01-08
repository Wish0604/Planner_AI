// JSON Schemas for Agent Outputs

export const schemas = {
  planner: {
    type: "object",
    properties: {
      projectOverview: {
        type: "object",
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          objectives: { type: "array", items: { type: "string" } },
          successCriteria: { type: "array", items: { type: "string" } }
        }
      },
      milestones: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            description: { type: "string" },
            duration: { type: "string" },
            dependencies: { type: "array", items: { type: "string" } },
            priority: { type: "string", enum: ["High", "Medium", "Low"] },
            requiredSkills: { type: "array", items: { type: "string" } },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  name: { type: "string" },
                  effort: { type: "number" },
                  skills: { type: "array", items: { type: "string" } },
                  canParallel: { type: "boolean" },
                  dependencies: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      },
      resourceAllocation: {
        type: "object",
        properties: {
          teamComposition: { type: "array", items: { type: "string" } },
          skillRequirements: { type: "object" },
          workloadDistribution: { type: "string" }
        }
      },
      risks: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            severity: { type: "string", enum: ["High", "Medium", "Low"] },
            mitigation: { type: "string" }
          }
        }
      }
    }
  },

  techStack: {
    type: "object",
    properties: {
      frontend: {
        type: "object",
        properties: {
          framework: { type: "string" },
          version: { type: "string" },
          uiLibraries: { type: "array", items: { type: "string" } },
          stateManagement: { type: "string" },
          buildTools: { type: "array", items: { type: "string" } }
        }
      },
      backend: {
        type: "object",
        properties: {
          runtime: { type: "string" },
          framework: { type: "string" },
          database: { type: "string" },
          apiArchitecture: { type: "string" },
          authentication: { type: "string" }
        }
      },
      devops: {
        type: "object",
        properties: {
          hosting: { type: "string" },
          cicd: { type: "array", items: { type: "string" } },
          monitoring: { type: "array", items: { type: "string" } },
          versionControl: { type: "string" }
        }
      },
      justifications: {
        type: "array",
        items: {
          type: "object",
          properties: {
            technology: { type: "string" },
            reason: { type: "string" },
            tradeoffs: { type: "string" }
          }
        }
      }
    }
  },

  timeline: {
    type: "object",
    properties: {
      totalDuration: { type: "string" },
      startDate: { type: "string" },
      endDate: { type: "string" },
      phases: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            startWeek: { type: "number" },
            endWeek: { type: "number" },
            duration: { type: "string" },
            tasks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  duration: { type: "string" },
                  assignedTo: { type: "string" }
                }
              }
            },
            dependencies: { type: "array", items: { type: "string" } },
            deliverables: { type: "array", items: { type: "string" } }
          }
        }
      },
      criticalPath: { type: "array", items: { type: "string" } },
      parallelTasks: { type: "array", items: { type: "string" } },
      bufferTime: { type: "string" }
    }
  },

  risks: {
    type: "object",
    properties: {
      technical: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            severity: { type: "string", enum: ["High", "Medium", "Low"] },
            probability: { type: "string", enum: ["High", "Medium", "Low"] },
            impact: { type: "string" },
            mitigation: { type: "array", items: { type: "string" } },
            contingency: { type: "string" }
          }
        }
      },
      business: { type: "array", items: { type: "object" } },
      team: { type: "array", items: { type: "object" } },
      overallRiskLevel: { type: "string" },
      topRisks: { type: "array", items: { type: "string" } }
    }
  },

  deliverables: {
    type: "object",
    properties: {
      code: {
        type: "array",
        items: {
          type: "object",
          properties: {
            id: { type: "string" },
            name: { type: "string" },
            type: { type: "string" },
            description: { type: "string" },
            qualityStandards: { type: "object" },
            acceptanceCriteria: { type: "array", items: { type: "string" } }
          }
        }
      },
      documentation: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: { type: "string" },
            format: { type: "string" },
            sections: { type: "array", items: { type: "string" } }
          }
        }
      },
      testing: {
        type: "object",
        properties: {
          unitTestCoverage: { type: "number" },
          integrationTests: { type: "boolean" },
          performanceTests: { type: "boolean" }
        }
      },
      definitionOfDone: { type: "array", items: { type: "string" } }
    }
  }
};

// State schema for agent coordination
export const agentState = {
  type: "object",
  properties: {
    agentId: { type: "string" },
    status: { type: "string", enum: ["idle", "processing", "completed", "failed"] },
    progress: { type: "number", minimum: 0, maximum: 100 },
    output: { type: "object" },
    dependencies: { type: "array", items: { type: "string" } },
    timestamp: { type: "string" },
    metadata: { type: "object" }
  }
};
