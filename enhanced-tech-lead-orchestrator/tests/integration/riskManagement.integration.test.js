// Integration tests for Risk Management System
import { describe, it, expect, beforeEach } from 'vitest';
import { RiskManagementSystem } from '../../src/systems/riskManagement.js';
import { OrchestrationEngine } from '../../src/core/orchestrationEngine.js';

describe('Risk Management System - Integration Tests', () => {
  let riskManager;
  let orchestrator;

  beforeEach(async () => {
    riskManager = new RiskManagementSystem();
    orchestrator = new OrchestrationEngine();

    await riskManager.initialize();
    await orchestrator.initialize();
  });

  describe('Mission Risk Assessment Integration', () => {
    it('should integrate with orchestration engine for comprehensive risk analysis', async () => {
      const complexRequirements = {
        name: 'High-Risk E-commerce Platform',
        features: Array.from({ length: 15 }, (_, i) => ({
          name: `Feature ${i + 1}`,
          database: i % 3 === 0,
          api: i % 2 === 0,
          realtime: i % 5 === 0
        })),
        technologies: ['react', 'nodejs', 'postgresql', 'redis', 'kubernetes', 'newtech-xyz'],
        performance: {
          highLoad: true,
          realTime: true,
          sla: '99.9%'
        },
        security: {
          compliance: 'PCI-DSS',
          encryption: true
        },
        timeline: {
          urgent: true,
          daysAvailable: 10
        },
        integrations: [
          'stripe-api', 'aws-services', 'third-party-inventory',
          'email-service', 'analytics-platform'
        ]
      };

      // Test risk assessment
      const riskAssessment = await riskManager.assessMissionRisk(complexRequirements);

      expect(['medium', 'high']).toContain(riskAssessment.overall);
      expect(riskAssessment.score).toBeGreaterThan(0.5);
      expect(riskAssessment.factors).toHaveProperty('technical');
      expect(riskAssessment.factors).toHaveProperty('resource');
      expect(riskAssessment.factors).toHaveProperty('timeline');
      expect(riskAssessment.factors).toHaveProperty('quality');

      // Test mitigation generation
      expect(riskAssessment.mitigations).toBeDefined();
      expect(riskAssessment.mitigations.length).toBeGreaterThan(0);

      // Test recommendations
      expect(riskAssessment.recommendations).toBeDefined();
      expect(riskAssessment.recommendations.length).toBeGreaterThan(0);

      // Test integration with mission planning
      const mockResourcePlan = { agents: Array.from(orchestrator.agents.values()) };
      const missionPlan = await orchestrator.createMissionPlan({
        requirements: complexRequirements,
        riskAssessment,
        resourcePlan: mockResourcePlan
      });

      expect(missionPlan.riskAssessment).toEqual(riskAssessment);
      expect(missionPlan.complexity).toBe('complex'); // Should align with high risk
    });

    it('should provide different risk levels for different mission types', async () => {
      const lowRiskRequirements = {
        name: 'Simple CRUD Application',
        features: [
          { name: 'User Login' },
          { name: 'Data Entry Form' }
        ],
        technologies: ['react', 'nodejs'],
        timeline: { daysAvailable: 30 }
      };

      const mediumRiskRequirements = {
        name: 'Medium Complexity Platform',
        features: Array.from({ length: 8 }, (_, i) => ({
          name: `Feature ${i + 1}`,
          database: true
        })),
        technologies: ['react', 'nodejs', 'postgresql'],
        performance: { highLoad: true },
        timeline: { daysAvailable: 20 }
      };

      const lowRisk = await riskManager.assessMissionRisk(lowRiskRequirements);
      const mediumRisk = await riskManager.assessMissionRisk(mediumRiskRequirements);

      expect(lowRisk.overall).toBe('low');
      expect(['low', 'medium']).toContain(mediumRisk.overall);
      expect(mediumRisk.score).toBeGreaterThan(lowRisk.score);
    });
  });

  describe('Historical Pattern Recognition', () => {
    it('should provide insights based on similar historical missions', async () => {
      const ecommerceRequirements = {
        name: 'E-commerce Marketplace',
        features: [
          { name: 'Product Catalog', database: true },
          { name: 'Shopping Cart' },
          { name: 'Payment Processing', payment: true }
        ],
        technologies: ['react', 'nodejs', 'postgresql']
      };

      const riskAssessment = await riskManager.assessMissionRisk(ecommerceRequirements);

      if (riskAssessment.historicalInsights) {
        expect(riskAssessment.historicalInsights).toHaveProperty('similarMissions');
        expect(riskAssessment.historicalInsights).toHaveProperty('averageQualityScore');
        expect(riskAssessment.historicalInsights).toHaveProperty('successRate');
        expect(riskAssessment.historicalInsights.successRate).toBeGreaterThan(0);
        expect(riskAssessment.historicalInsights.successRate).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('Resource Risk Assessment', () => {
    it('should accurately assess resource availability risks', async () => {
      // Mock high-demand scenario
      const highDemandRequirements = {
        name: 'Multi-Technology Platform',
        technologies: ['react', 'python', 'go', 'rust', 'kubernetes'],
        features: [
          { name: 'Frontend Dashboard', frontend: true },
          { name: 'Backend API', backend: true, api: true },
          { name: 'Database Layer', database: true },
          { name: 'Security Module', security: true },
          { name: 'Mobile App', mobile: true }
        ]
      };

      const riskAssessment = await riskManager.assessMissionRisk(highDemandRequirements);

      expect(riskAssessment.factors.resource).toBeDefined();
      expect(['medium', 'high']).toContain(riskAssessment.factors.resource.level);

      // Should identify specific resource constraints
      const resourceMitigations = riskAssessment.mitigations.filter(
        m => m.riskType === 'resource'
      );

      if (resourceMitigations.length > 0) {
        expect(resourceMitigations[0].strategies).toContain(
          'Identify backup agents for critical capabilities'
        );
      }
    });
  });

  describe('Timeline Risk Assessment', () => {
    it('should escalate risk level for urgent timelines', async () => {
      const urgentRequirements = {
        name: 'Emergency Security Fix',
        timeline: {
          urgent: true,
          daysAvailable: 3
        },
        features: [
          { name: 'Security Patch', security: true },
          { name: 'System Testing' }
        ],
        dependencies: {
          external: ['third-party-api', 'compliance-review']
        }
      };

      const normalRequirements = {
        ...urgentRequirements,
        timeline: {
          daysAvailable: 30
        }
      };

      const urgentRisk = await riskManager.assessMissionRisk(urgentRequirements);
      const normalRisk = await riskManager.assessMissionRisk(normalRequirements);

      expect(urgentRisk.factors.timeline.level).toBe('high');
      expect(urgentRisk.factors.timeline.score).toBeGreaterThan(
        normalRisk.factors.timeline.score
      );
    });
  });

  describe('Quality Risk Assessment', () => {
    it('should account for quality requirements in risk scoring', async () => {
      const highQualityRequirements = {
        name: 'Mission-Critical System',
        quality: {
          coverage: 95,
          performanceRequirements: 'strict'
        },
        security: {
          compliance: 'SOC2'
        },
        testing: ['unit', 'integration', 'e2e', 'load', 'security'],
        features: [
          { name: 'Core Feature' }
        ]
      };

      const standardRequirements = {
        name: 'Standard System',
        features: [
          { name: 'Core Feature' }
        ]
      };

      const highQualityRisk = await riskManager.assessMissionRisk(highQualityRequirements);
      const standardRisk = await riskManager.assessMissionRisk(standardRequirements);

      expect(highQualityRisk.factors.quality.score).toBeGreaterThan(
        standardRisk.factors.quality.score
      );
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle malformed requirements gracefully', async () => {
      const malformedRequirements = {
        // Missing required fields
        features: null,
        technologies: undefined
      };

      const riskAssessment = await riskManager.assessMissionRisk(malformedRequirements);

      expect(riskAssessment).toBeDefined();
      expect(['low', 'medium', 'high']).toContain(riskAssessment.overall);
      expect(riskAssessment.score).toBeGreaterThanOrEqual(0);
      expect(riskAssessment.score).toBeLessThanOrEqual(1);
    });

    it('should handle empty requirements', async () => {
      const emptyRequirements = {};

      const riskAssessment = await riskManager.assessMissionRisk(emptyRequirements);

      expect(riskAssessment).toBeDefined();
      expect(riskAssessment.factors).toHaveProperty('technical');
      expect(riskAssessment.factors).toHaveProperty('resource');
      expect(riskAssessment.factors).toHaveProperty('timeline');
      expect(riskAssessment.factors).toHaveProperty('quality');
    });
  });

  describe('Performance Benchmarks', () => {
    it('should complete risk assessment within performance targets', async () => {
      const largeRequirements = {
        name: 'Enterprise Platform',
        features: Array.from({ length: 50 }, (_, i) => ({
          name: `Feature ${i + 1}`,
          database: Math.random() > 0.5,
          api: Math.random() > 0.5,
          security: Math.random() > 0.7
        })),
        technologies: [
          'react', 'nodejs', 'python', 'go', 'postgresql',
          'redis', 'kubernetes', 'docker', 'aws', 'terraform'
        ],
        integrations: Array.from({ length: 20 }, (_, i) => `integration-${i + 1}`)
      };

      const startTime = performance.now();
      const riskAssessment = await riskManager.assessMissionRisk(largeRequirements);
      const endTime = performance.now();

      const processingTime = endTime - startTime;

      expect(riskAssessment).toBeDefined();
      expect(processingTime).toBeLessThan(1000); // Should complete within 1 second
    });
  });
});
