// Unit tests for OrchestrationEngine using modern Vitest + Happy-DOM
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { OrchestrationEngine } from '../../src/core/orchestrationEngine.js';

describe('OrchestrationEngine', () => {
  let orchestrator;

  beforeEach(() => {
    orchestrator = new OrchestrationEngine();
  });

  describe('initialization', () => {
    it('should initialize successfully', async () => {
      await orchestrator.initialize();

      expect(orchestrator.initialized).toBe(true);
      expect(orchestrator.agents.size).toBeGreaterThan(0);
      expect(orchestrator.missions.size).toBe(0);
    });

    it('should load predefined agents', async () => {
      await orchestrator.initialize();

      const backendArchitect = orchestrator.agents.get('backend-architect');
      expect(backendArchitect).toBeValidAgent();
      expect(backendArchitect.capabilities).toContain('architecture');
      expect(backendArchitect.capabilities).toContain('backend');

      const securityAuditor = orchestrator.agents.get('security-auditor');
      expect(securityAuditor).toBeValidAgent();
      expect(securityAuditor.capabilities).toContain('security');
    });

    it('should not reinitialize if already initialized', async () => {
      const loadAgentsSpy = vi.spyOn(orchestrator, 'loadAgents');

      await orchestrator.initialize();
      await orchestrator.initialize(); // Second call

      expect(loadAgentsSpy).toHaveBeenCalledOnce();
    });
  });

  describe('complexity analysis', () => {
    it('should classify simple requirements correctly', () => {
      const simpleRequirements = {
        features: [{ name: 'Basic Login' }],
        technologies: ['javascript'],
        performance: {}
      };

      const complexity = orchestrator.analyzeComplexity(simpleRequirements);
      expect(complexity).toBe('simple');
    });

    it('should classify complex requirements correctly', () => {
      const complexRequirements = {
        features: Array.from({ length: 12 }, (_, i) => ({ name: `Feature ${i}` })),
        technologies: ['react', 'nodejs', 'postgresql', 'redis', 'docker'],
        performance: { highLoad: true, realTime: true },
        security: { compliance: true, encryption: true },
        timeline: { urgent: true }
      };

      const complexity = orchestrator.analyzeComplexity(complexRequirements);
      expect(complexity).toBe('complex');
    });

    it('should handle missing properties gracefully', () => {
      const minimalRequirements = {};

      const complexity = orchestrator.analyzeComplexity(minimalRequirements);
      expect(['simple', 'medium', 'complex']).toContain(complexity);
    });
  });

  describe('task breakdown', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should create standard tasks for all missions', async () => {
      const requirements = {
        name: 'Test Mission',
        features: [{ name: 'Test Feature' }]
      };

      const tasks = await orchestrator.createTaskBreakdown(requirements, 'medium');

      expect(tasks).toBeDefined();
      expect(tasks.length).toBeGreaterThan(0);

      // Check for standard tasks
      const archTask = tasks.find(t => t.id === 'architecture-design');
      expect(archTask).toBeDefined();
      expect(archTask.requiredCapabilities).toContain('architecture');

      const securityTask = tasks.find(t => t.id === 'security-review');
      expect(securityTask).toBeDefined();
      expect(securityTask.dependencies).toContain('architecture-design');
    });

    it('should create feature-specific tasks', async () => {
      const requirements = {
        features: [
          { name: 'User Authentication', authentication: true },
          { name: 'Payment Processing', payment: true }
        ]
      };

      const tasks = await orchestrator.createTaskBreakdown(requirements, 'medium');

      const authTask = tasks.find(t => t.name.includes('User Authentication'));
      expect(authTask).toBeDefined();
      expect(authTask.type).toBe('development');

      const paymentTask = tasks.find(t => t.name.includes('Payment Processing'));
      expect(paymentTask).toBeDefined();
    });

    it('should adjust task estimates based on complexity', async () => {
      const requirements = {
        features: [{ name: 'Test Feature', database: true, api: true }]
      };

      const simpleTasks = await orchestrator.createTaskBreakdown(requirements, 'simple');
      const complexTasks = await orchestrator.createTaskBreakdown(requirements, 'complex');

      const simpleArchTask = simpleTasks.find(t => t.id === 'architecture-design');
      const complexArchTask = complexTasks.find(t => t.id === 'architecture-design');

      expect(complexArchTask.estimatedHours).toBeGreaterThan(simpleArchTask.estimatedHours);
    });
  });

  describe('agent assignment', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should assign suitable agents to tasks', () => {
      const tasks = [
        {
          id: 'backend-task',
          requiredCapabilities: ['backend'],
          estimatedHours: 8,
          dependencies: []
        },
        {
          id: 'security-task',
          requiredCapabilities: ['security'],
          estimatedHours: 4,
          dependencies: []
        }
      ];

      const resourcePlan = { agents: Array.from(orchestrator.agents.values()) };
      const assignedTasks = orchestrator.assignTasksToAgents(tasks, resourcePlan);

      expect(assignedTasks).toHaveLength(2);

      const backendTask = assignedTasks.find(t => t.id === 'backend-task');
      expect(backendTask.assignedAgent).toBeDefined();
      expect(backendTask.agentId).toBeDefined();

      const securityTask = assignedTasks.find(t => t.id === 'security-task');
      expect(securityTask.assignedAgent).toBe('security-auditor');
    });

    it('should handle unassignable tasks gracefully', () => {
      const tasks = [
        {
          id: 'impossible-task',
          requiredCapabilities: ['non-existent-capability'],
          estimatedHours: 8,
          dependencies: []
        }
      ];

      const resourcePlan = { agents: Array.from(orchestrator.agents.values()) };
      const assignedTasks = orchestrator.assignTasksToAgents(tasks, resourcePlan);

      expect(assignedTasks).toHaveLength(1);
      expect(assignedTasks[0].assignedAgent).toBeNull();
      expect(assignedTasks[0].status).toBe('unassigned');
    });

    it('should respect task dependencies in assignment order', () => {
      const tasks = [
        {
          id: 'dependent-task',
          requiredCapabilities: ['backend'],
          estimatedHours: 4,
          dependencies: ['prerequisite-task']
        },
        {
          id: 'prerequisite-task',
          requiredCapabilities: ['architecture'],
          estimatedHours: 2,
          dependencies: []
        }
      ];

      const resourcePlan = { agents: Array.from(orchestrator.agents.values()) };
      const assignedTasks = orchestrator.assignTasksToAgents(tasks, resourcePlan);

      const prereqTask = assignedTasks.find(t => t.id === 'prerequisite-task');
      const dependentTask = assignedTasks.find(t => t.id === 'dependent-task');

      expect(prereqTask).toBeDefined();
      expect(dependentTask).toBeDefined();
      expect(dependentTask.estimatedStartTime >= prereqTask.estimatedEndTime).toBe(true);
    });
  });

  describe('mission planning', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should create a complete mission plan', async () => {
      const requirements = {
        name: 'Test E-commerce Platform',
        features: [
          { name: 'User Registration', authentication: true },
          { name: 'Product Catalog', database: true, api: true }
        ],
        technologies: ['react', 'nodejs', 'postgresql'],
        performance: { highLoad: false },
        security: { encryption: true }
      };

      const mockRiskAssessment = global.testUtils.mockRiskAssessment('medium');
      const mockResourcePlan = { agents: Array.from(orchestrator.agents.values()) };

      const missionPlan = await orchestrator.createMissionPlan({
        requirements,
        riskAssessment: mockRiskAssessment,
        resourcePlan: mockResourcePlan
      });

      expect(missionPlan).toBeValidMission();
      expect(missionPlan.name).toBe('Test E-commerce Platform');
      expect(missionPlan.complexity).toBeDefined();
      expect(missionPlan.tasks).toBeDefined();
      expect(missionPlan.tasks.length).toBeGreaterThan(0);
      expect(missionPlan.qualityGates).toBeDefined();
      expect(missionPlan.timeline).toBeDefined();
      expect(missionPlan.timeline.estimatedDays).toBeGreaterThan(0);
    });

    it('should store mission plan for retrieval', async () => {
      const requirements = { name: 'Stored Mission Test' };
      const mockRiskAssessment = global.testUtils.mockRiskAssessment('low');
      const mockResourcePlan = { agents: [] };

      const missionPlan = await orchestrator.createMissionPlan({
        requirements,
        riskAssessment: mockRiskAssessment,
        resourcePlan: mockResourcePlan
      });

      const retrievedMission = orchestrator.getMission(missionPlan.id);
      expect(retrievedMission).toEqual(missionPlan);
    });
  });

  describe('timeline estimation', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should calculate timeline based on task estimates', () => {
      const tasks = [
        { id: 'task1', estimatedHours: 8, dependencies: [] },
        { id: 'task2', estimatedHours: 6, dependencies: ['task1'] },
        { id: 'task3', estimatedHours: 4, dependencies: [] }
      ];

      const timeline = orchestrator.estimateTimeline(tasks);

      expect(timeline.totalHours).toBe(18);
      expect(timeline.estimatedDays).toBeGreaterThan(0);
      expect(timeline.criticalPath).toContain('task1');
      expect(timeline.criticalPath).toContain('task2');
    });

    it('should handle empty task list', () => {
      const timeline = orchestrator.estimateTimeline([]);

      expect(timeline.totalHours).toBe(0);
      expect(timeline.estimatedDays).toBe(0);
    });

    it('should identify critical path correctly', () => {
      const tasks = [
        { id: 'a', estimatedHours: 2, dependencies: [] },
        { id: 'b', estimatedHours: 4, dependencies: ['a'] },
        { id: 'c', estimatedHours: 1, dependencies: [] },
        { id: 'd', estimatedHours: 3, dependencies: ['b', 'c'] }
      ];

      const criticalPath = orchestrator.findCriticalPath(tasks);

      expect(criticalPath.map(t => t.id)).toEqual(['a', 'b', 'd']);
      expect(criticalPath.reduce((sum, t) => sum + t.estimatedHours, 0)).toBe(9);
    });
  });

  describe('quality gates', () => {
    it('should create appropriate quality gates based on complexity', () => {
      const simpleTasks = [{ id: 'simple-task', type: 'development' }];
      const complexTasks = [{ id: 'complex-task', type: 'development' }];

      const simpleGates = orchestrator.createQualityGates(simpleTasks, 'simple');
      const complexGates = orchestrator.createQualityGates(complexTasks, 'complex');

      expect(simpleGates.length).toBeGreaterThan(0);
      expect(complexGates.length).toBeGreaterThan(0);

      const simpleCodeGate = simpleGates.find(g => g.id === 'code-quality');
      const complexCodeGate = complexGates.find(g => g.id === 'code-quality');

      expect(complexCodeGate.criteria.testCoverage).toBeGreaterThan(simpleCodeGate.criteria.testCoverage);
      expect(complexCodeGate.minimumScore).toBeGreaterThan(simpleCodeGate.minimumScore);
    });
  });

  describe('mission execution', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should start mission execution', async () => {
      const missionPlan = global.testUtils.mockMission('medium');
      missionPlan.tasks = [{ 
        id: 'test-task', 
        name: 'Test Task',
        assignedAgent: 'backend-architect',
        estimatedHours: 4,
        dependencies: []
      }];
      missionPlan.qualityGates = [];

      orchestrator.missions.set(missionPlan.id, missionPlan);

      const execution = await orchestrator.executeMission(missionPlan);

      expect(execution).toBeDefined();
      expect(execution.missionId).toBe(missionPlan.id);
      expect(execution.status).toBe('active');
      expect(execution.progress).toBeGreaterThanOrEqual(0);
      expect(execution.startTime).toBeDefined();
    });

    it('should track active executions', async () => {
      const missionPlan = global.testUtils.mockMission('simple');
      missionPlan.tasks = [{ 
        id: 'simple-task', 
        name: 'Simple Task',
        assignedAgent: 'backend-architect',
        estimatedHours: 2,
        dependencies: []
      }];
      missionPlan.qualityGates = [];
      orchestrator.missions.set(missionPlan.id, missionPlan);

      const execution = await orchestrator.executeMission(missionPlan);

      const retrievedExecution = orchestrator.getExecution(execution.id);
      expect(retrievedExecution).toEqual(execution);

      const status = orchestrator.getStatus();
      expect(status.activeExecutions).toBe(1);
    });
  });

  describe('status reporting', () => {
    beforeEach(async () => {
      await orchestrator.initialize();
    });

    it('should provide comprehensive status information', () => {
      const status = orchestrator.getStatus();

      expect(status).toHaveProperty('initialized', true);
      expect(status).toHaveProperty('totalMissions');
      expect(status).toHaveProperty('activeExecutions');
      expect(status).toHaveProperty('availableAgents');
      expect(status).toHaveProperty('totalAgents');
      expect(typeof status.totalAgents).toBe('number');
    });
  });
});
