// Resource Management System - Agent allocation and workload optimization
export class ResourceManagementSystem {
  constructor() {
    this.agents = new Map();
    this.allocations = new Map();
    this.workloadHistory = [];
    this.performanceMetrics = new Map();
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;

    await this.loadAgentProfiles();
    await this.initializeWorkloadTracking();
    await this.setupPerformanceMonitoring();

    this.initialized = true;
  }

  async loadAgentProfiles() {
    const agentProfiles = [
      {
        name: 'test-automator',
        type: 'qa',
        capabilities: ['unit-testing', 'integration-testing', 'e2e-testing', 'test-automation'],
        specializations: ['vitest', 'happy-dom', 'puppeteer', 'react-testing-library'],
        experience: 'senior',
        maxWorkload: 40, // hours per week
        currentWorkload: 0,
        efficiency: 0.92,
        qualityScore: 94,
        testingExpertise: {
          'vitest': 95,
          'puppeteer': 88,
          'react-testing-library': 90,
          'happy-dom': 85,
          'accessibility-testing': 82
        }
      },
      {
        name: 'backend-architect',
        type: 'architecture',
        capabilities: ['system-design', 'backend-architecture', 'api-design', 'database-design'],
        specializations: ['microservices', 'nodejs', 'postgresql', 'redis'],
        experience: 'senior',
        maxWorkload: 40,
        currentWorkload: 0,
        efficiency: 0.89,
        qualityScore: 92
      },
      {
        name: 'security-auditor',
        type: 'security',
        capabilities: ['security-audit', 'penetration-testing', 'compliance-review', 'vulnerability-assessment'],
        specializations: ['owasp', 'pci-dss', 'security-testing', 'puppeteer-security'],
        experience: 'senior',
        maxWorkload: 35,
        currentWorkload: 0,
        efficiency: 0.95,
        qualityScore: 96,
        securityExpertise: {
          'automated-security-testing': 93,
          'puppeteer-security-scans': 87,
          'vulnerability-detection': 95
        }
      },
      {
        name: 'react-expert',
        type: 'frontend',
        capabilities: ['frontend-development', 'react', 'component-testing', 'ui-development'],
        specializations: ['react', 'typescript', 'component-libraries', 'accessibility'],
        experience: 'senior',
        maxWorkload: 40,
        currentWorkload: 0,
        efficiency: 0.91,
        qualityScore: 90,
        testingSkills: {
          'react-testing-library': 95,
          'component-testing': 92,
          'accessibility-testing': 88
        }
      },
      {
        name: 'performance-engineer',
        type: 'performance',
        capabilities: ['performance-optimization', 'load-testing', 'monitoring', 'benchmarking'],
        specializations: ['puppeteer-performance', 'lighthouse', 'web-vitals', 'performance-testing'],
        experience: 'senior',
        maxWorkload: 35,
        currentWorkload: 0,
        efficiency: 0.94,
        qualityScore: 93,
        performanceExpertise: {
          'puppeteer-performance-testing': 96,
          'lighthouse-audits': 94,
          'load-testing': 89,
          'performance-monitoring': 92
        }
      }
    ];

    for (const profile of agentProfiles) {
      this.agents.set(profile.name, {
        ...profile,
        id: `agent-${profile.name}`,
        status: 'available',
        lastActive: new Date().toISOString(),
        projects: [],
        skills: this.calculateSkillMatrix(profile)
      });
    }
  }

  calculateSkillMatrix(profile) {
    const skills = new Map();

    // Base capabilities
    for (const capability of profile.capabilities) {
      skills.set(capability, 80 + Math.random() * 20); // 80-100 base score
    }

    // Specializations get higher scores
    for (const spec of profile.specializations) {
      skills.set(spec, 85 + Math.random() * 15); // 85-100 for specializations
    }

    // Add testing-specific skills
    if (profile.testingExpertise) {
      for (const [skill, score] of Object.entries(profile.testingExpertise)) {
        skills.set(skill, score);
      }
    }

    if (profile.securityExpertise) {
      for (const [skill, score] of Object.entries(profile.securityExpertise)) {
        skills.set(skill, score);
      }
    }

    if (profile.testingSkills) {
      for (const [skill, score] of Object.entries(profile.testingSkills)) {
        skills.set(skill, score);
      }
    }

    if (profile.performanceExpertise) {
      for (const [skill, score] of Object.entries(profile.performanceExpertise)) {
        skills.set(skill, score);
      }
    }

    return skills;
  }

  async initializeWorkloadTracking() {
    this.workloadTracking = {
      updateInterval: 3600000, // 1 hour
      metrics: ['utilization', 'efficiency', 'quality', 'satisfaction'],
      thresholds: {
        overallocation: 0.9, // 90% of max workload
        underutilization: 0.3, // 30% of max workload
        burnoutRisk: 0.95 // 95% of max workload
      }
    };

    // Start periodic workload monitoring
    this.startWorkloadMonitoring();
  }

  async setupPerformanceMonitoring() {
    this.performanceMonitoring = {
      metrics: [
        'task_completion_time',
        'quality_score',
        'bug_rate',
        'rework_percentage',
        'client_satisfaction'
      ],
      updateFrequency: 'daily'
    };
  }

  async optimizeAllocation(requirements) {
    if (!this.initialized) {
      throw new Error('Resource Management System not initialized');
    }

    const requiredSkills = this.extractRequiredSkills(requirements);
    const availableAgents = this.getAvailableAgents();
    const allocationPlan = {
      requirements,
      timestamp: new Date().toISOString(),
      allocations: [],
      conflicts: [],
      recommendations: []
    };

    // Find optimal agent assignments
    for (const skill of requiredSkills) {
      const bestMatch = this.findBestAgentForSkill(skill, availableAgents);

      if (bestMatch) {
        allocationPlan.allocations.push({
          skill: skill.name,
          agent: bestMatch.agent.name,
          match_score: bestMatch.score,
          estimated_hours: skill.estimatedHours,
          priority: skill.priority
        });

        // Update agent availability
        bestMatch.agent.currentWorkload += skill.estimatedHours;
      } else {
        allocationPlan.conflicts.push({
          skill: skill.name,
          issue: 'No suitable agent available',
          estimatedHours: skill.estimatedHours
        });
      }
    }

    // Generate optimization recommendations
    allocationPlan.recommendations = this.generateAllocationRecommendations(allocationPlan);

    // Add agents array for compatibility
    allocationPlan.agents = allocationPlan.allocations.map(a => ({
      name: a.agent,
      skill: a.skill,
      hours: a.estimated_hours
    }));

    return allocationPlan;
  }

  extractRequiredSkills(requirements) {
    const skills = [];

    // Modern testing requirements
    if (requirements.testing || requirements.quality) {
      skills.push({
        name: 'unit-testing',
        framework: 'vitest',
        estimatedHours: 8,
        priority: 'high',
        description: 'Unit testing with Vitest + Happy-DOM'
      });

      skills.push({
        name: 'integration-testing',
        framework: 'vitest',
        estimatedHours: 12,
        priority: 'high',
        description: 'Integration testing with Vitest'
      });

      skills.push({
        name: 'e2e-testing',
        framework: 'vitest + puppeteer',
        estimatedHours: 16,
        priority: 'medium',
        description: 'E2E testing with Vitest and Puppeteer'
      });
    }

    // Frontend development
    if (requirements.frontend || requirements.technologies?.includes('react')) {
      skills.push({
        name: 'react',
        framework: 'react + react-testing-library',
        estimatedHours: 20,
        priority: 'high',
        description: 'React development with component testing'
      });
    }

    // Backend development
    if (requirements.backend || requirements.api) {
      skills.push({
        name: 'backend-architecture',
        estimatedHours: 16,
        priority: 'high',
        description: 'Backend architecture and API design'
      });
    }

    // Security requirements
    if (requirements.security || requirements.compliance) {
      skills.push({
        name: 'security-audit',
        framework: 'automated-security-testing',
        estimatedHours: 10,
        priority: 'high',
        description: 'Security audit with automated testing'
      });
    }

    // Performance requirements
    if (requirements.performance || requirements.load) {
      skills.push({
        name: 'performance-optimization',
        framework: 'puppeteer + lighthouse',
        estimatedHours: 12,
        priority: 'medium',
        description: 'Performance testing with Puppeteer and Lighthouse'
      });
    }

    return skills;
  }

  getAvailableAgents() {
    return Array.from(this.agents.values()).filter(agent => {
      return agent.status === 'available' &&
             agent.currentWorkload < (agent.maxWorkload * 0.9); // Not overallocated
    });
  }

  findBestAgentForSkill(skill, availableAgents) {
    let bestMatch = null;
    let bestScore = 0;

    for (const agent of availableAgents) {
      const score = this.calculateAgentSkillMatch(agent, skill);

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { agent, score };
      }
    }

    return bestScore > 60 ? bestMatch : null; // Minimum 60% match required
  }

  calculateAgentSkillMatch(agent, skill) {
    let score = 0;

    // Direct skill match
    const skillScore = agent.skills.get(skill.name) || 0;
    score += skillScore * 0.6; // 60% weight for direct skill

    // Framework/technology match
    if (skill.framework && agent.skills.has(skill.framework)) {
      score += agent.skills.get(skill.framework) * 0.3; // 30% weight for framework
    }

    // Experience level bonus
    if (agent.experience === 'senior') {
      score += 10;
    } else if (agent.experience === 'mid') {
      score += 5;
    }

    // Current workload penalty
    const workloadRatio = agent.currentWorkload / agent.maxWorkload;
    if (workloadRatio > 0.7) {
      score -= (workloadRatio - 0.7) * 50; // Penalty for high workload
    }

    // Quality score bonus
    score += (agent.qualityScore - 80) * 0.1; // Bonus for high quality

    return Math.max(0, Math.min(100, score));
  }

  generateAllocationRecommendations(allocationPlan) {
    const recommendations = [];

    // Check for conflicts
    if (allocationPlan.conflicts.length > 0) {
      recommendations.push({
        type: 'resource_shortage',
        priority: 'high',
        message: `${allocationPlan.conflicts.length} skills lack suitable agents`,
        action: 'Consider hiring contractors or cross-training existing agents',
        conflicts: allocationPlan.conflicts
      });
    }

    // Check for workload balance
    const workloadDistribution = this.analyzeWorkloadDistribution(allocationPlan.allocations);
    if (workloadDistribution.imbalanced) {
      recommendations.push({
        type: 'workload_imbalance',
        priority: 'medium',
        message: 'Workload distribution is uneven across agents',
        action: 'Consider redistributing tasks to balance workload',
        details: workloadDistribution
      });
    }

    // Modern testing recommendations
    const testingAllocations = allocationPlan.allocations.filter(a =>
      ['unit-testing', 'integration-testing', 'e2e-testing'].includes(a.skill)
    );

    if (testingAllocations.length > 0) {
      recommendations.push({
        type: 'modern_testing',
        priority: 'info',
        message: 'Modern testing stack allocated successfully',
        details: {
          frameworks: ['Vitest', 'Happy-DOM', 'Puppeteer', 'React Testing Library'],
          coverage: 'Expected 85%+ with current allocation',
          timeline: `${testingAllocations.reduce((sum, a) => sum + a.estimated_hours, 0)} hours total`
        }
      });
    }

    return recommendations;
  }

  analyzeWorkloadDistribution(allocations) {
    const agentWorkloads = new Map();

    for (const allocation of allocations) {
      const current = agentWorkloads.get(allocation.agent) || 0;
      agentWorkloads.set(allocation.agent, current + allocation.estimated_hours);
    }

    const workloads = Array.from(agentWorkloads.values());
    const avg = workloads.reduce((sum, w) => sum + w, 0) / workloads.length;
    const variance = workloads.reduce((sum, w) => sum + Math.pow(w - avg, 2), 0) / workloads.length;

    return {
      imbalanced: variance > (avg * 0.3), // More than 30% variance
      averageWorkload: avg,
      variance: variance,
      distribution: Array.from(agentWorkloads.entries())
    };
  }

  startWorkloadMonitoring() {
    // In a real implementation, this would set up periodic monitoring
    setInterval(() => {
      this.updateWorkloadMetrics();
    }, this.workloadTracking.updateInterval);
  }

  updateWorkloadMetrics() {
    const timestamp = new Date().toISOString();

    for (const [agentName, agent] of this.agents) {
      const utilization = agent.currentWorkload / agent.maxWorkload;

      this.performanceMetrics.set(agentName, {
        timestamp,
        utilization,
        efficiency: agent.efficiency,
        qualityScore: agent.qualityScore,
        status: this.determineAgentStatus(utilization),
        recommendations: this.generateAgentRecommendations(agent, utilization)
      });
    }

    this.workloadHistory.push({
      timestamp,
      snapshot: new Map(this.performanceMetrics)
    });

    // Keep only last 30 days of history
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.workloadHistory = this.workloadHistory.filter(
      entry => new Date(entry.timestamp) > cutoff
    );
  }

  determineAgentStatus(utilization) {
    if (utilization >= this.workloadTracking.thresholds.burnoutRisk) {
      return 'burnout_risk';
    } else if (utilization >= this.workloadTracking.thresholds.overallocation) {
      return 'overallocated';
    } else if (utilization <= this.workloadTracking.thresholds.underutilization) {
      return 'underutilized';
    } else {
      return 'optimal';
    }
  }

  generateAgentRecommendations(agent, utilization) {
    const recommendations = [];

    if (utilization >= 0.95) {
      recommendations.push('URGENT: Risk of burnout - reduce workload immediately');
    } else if (utilization >= 0.9) {
      recommendations.push('High workload - monitor closely for stress signs');
    } else if (utilization <= 0.3) {
      recommendations.push('Underutilized - consider additional responsibilities');
    }

    // Skill-specific recommendations
    if (agent.testingExpertise || agent.testingSkills) {
      if (utilization < 0.7) {
        recommendations.push('Available for additional testing tasks (Vitest, Puppeteer)');
      }
    }

    return recommendations;
  }

  async reallocateResources(missionId, changes) {
    // Handle dynamic resource reallocation
    const currentAllocation = this.allocations.get(missionId);
    if (!currentAllocation) {
      throw new Error(`No allocation found for mission: ${missionId}`);
    }

    // Apply changes
    const newAllocation = { ...currentAllocation };

    for (const change of changes) {
      switch (change.type) {
      case 'add_agent':
        newAllocation.agents.push(change.agent);
        break;
      case 'remove_agent':
        newAllocation.agents = newAllocation.agents.filter(a => a !== change.agent);
        break;
      case 'adjust_hours': {
        const allocation = newAllocation.allocations.find(a => a.agent === change.agent);
        if (allocation) {
          allocation.estimated_hours += change.hours;
        }
        break;
      }
      }
    }

    // Validate new allocation
    const validation = this.validateAllocation(newAllocation);

    if (validation.valid) {
      this.allocations.set(missionId, newAllocation);
      return { success: true, allocation: newAllocation };
    } else {
      return { success: false, errors: validation.errors };
    }
  }

  validateAllocation(allocation) {
    const errors = [];

    // Check agent availability
    for (const agentAllocation of allocation.allocations) {
      const agent = this.agents.get(agentAllocation.agent);
      if (!agent) {
        errors.push(`Agent not found: ${agentAllocation.agent}`);
        continue;
      }

      const newWorkload = agent.currentWorkload + agentAllocation.estimated_hours;
      if (newWorkload > agent.maxWorkload) {
        errors.push(`Agent ${agent.name} would be overallocated: ${newWorkload}/${agent.maxWorkload} hours`);
      }
    }

    // Check skill coverage
    const requiredSkills = allocation.requirements ? this.extractRequiredSkills(allocation.requirements) : [];
    const coveredSkills = allocation.allocations.map(a => a.skill);

    for (const skill of requiredSkills) {
      if (!coveredSkills.includes(skill.name)) {
        errors.push(`Required skill not covered: ${skill.name}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  getResourceUtilization() {
    const utilization = {
      overall: 0,
      byAgent: new Map(),
      bySkill: new Map(),
      trends: []
    };

    let totalWorkload = 0;
    let totalCapacity = 0;

    for (const [agentName, agent] of this.agents) {
      const agentUtilization = agent.currentWorkload / agent.maxWorkload;
      utilization.byAgent.set(agentName, {
        utilization: agentUtilization,
        currentWorkload: agent.currentWorkload,
        maxWorkload: agent.maxWorkload,
        status: this.determineAgentStatus(agentUtilization)
      });

      totalWorkload += agent.currentWorkload;
      totalCapacity += agent.maxWorkload;
    }

    utilization.overall = totalCapacity > 0 ? totalWorkload / totalCapacity : 0;

    return utilization;
  }

  getStatus() {
    return {
      initialized: this.initialized,
      totalAgents: this.agents.size,
      availableAgents: this.getAvailableAgents().length,
      totalAllocations: this.allocations.size,
      overallUtilization: this.getResourceUtilization().overall,
      testingCapabilities: {
        'vitest': Array.from(this.agents.values()).filter(a => a.skills.has('vitest')).length,
        'puppeteer': Array.from(this.agents.values()).filter(a => a.skills.has('puppeteer')).length,
        'react-testing-library': Array.from(this.agents.values()).filter(a => a.skills.has('react-testing-library')).length
      }
    };
  }
}
