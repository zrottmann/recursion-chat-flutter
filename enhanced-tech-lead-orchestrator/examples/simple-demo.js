#!/usr/bin/env node

import chalk from 'chalk';
import { EnhancedTechLeadOrchestrator } from './src/index.js';

console.log(chalk.cyan.bold('\n🚀 Enhanced Tech-Lead Orchestrator - Simple Demo\n'));
console.log(chalk.gray('=' .repeat(50)));

async function runSimpleDemo() {
  try {
    // Initialize the orchestrator
    console.log(chalk.blue('\n📦 Initializing Orchestrator Systems...'));
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
    console.log(chalk.green('✅ All systems initialized'));
    
    // Example 1: Simple Web App
    console.log(chalk.yellow('\n\n📋 Example 1: Planning a Simple Web App'));
    console.log(chalk.gray('-'.repeat(40)));
    
    const simpleRequirements = {
      name: 'Blog Platform',
      description: 'A simple blog with user authentication',
      features: {
        api: true,
        database: true,
        authentication: true,
        frontend: true,
        realTime: false,
        mobile: false
      },
      scale: 'simple',
      timeline: {
        deadline: '2025-03-01',
        urgent: false
      }
    };
    
    const simplePlan = await orchestrator.planMission(simpleRequirements);
    
    console.log(chalk.green('\n✅ Simple Mission Plan:'));
    console.log(chalk.white(`  • Mission ID: ${simplePlan.id}`));
    console.log(chalk.white(`  • Name: ${simplePlan.name}`));
    console.log(chalk.white(`  • Complexity: ${chalk.green(simplePlan.complexity)}`));
    console.log(chalk.white(`  • Risk Level: ${chalk.green(simplePlan.riskLevel)}`));
    console.log(chalk.white(`  • Estimated Time: ${simplePlan.estimatedTime} hours`));
    console.log(chalk.white(`  • Tasks: ${simplePlan.tasks.length}`));
    
    // Example 2: Complex Enterprise System
    console.log(chalk.yellow('\n\n📋 Example 2: Planning an Enterprise System'));
    console.log(chalk.gray('-'.repeat(40)));
    
    const complexRequirements = {
      name: 'Banking System',
      description: 'Secure banking platform with real-time transactions',
      features: {
        api: true,
        database: true,
        authentication: true,
        frontend: true,
        realTime: true,
        mobile: true
      },
      scale: 'large',
      performance: {
        highLoad: true,
        realTime: true
      },
      security: {
        compliance: true,
        encryption: true
      },
      timeline: {
        deadline: '2025-12-01',
        urgent: false
      }
    };
    
    const complexPlan = await orchestrator.planMission(complexRequirements);
    
    console.log(chalk.green('\n✅ Complex Mission Plan:'));
    console.log(chalk.white(`  • Mission ID: ${complexPlan.id}`));
    console.log(chalk.white(`  • Name: ${complexPlan.name}`));
    console.log(chalk.white(`  • Complexity: ${chalk.red(complexPlan.complexity)}`));
    console.log(chalk.white(`  • Risk Level: ${chalk.yellow(complexPlan.riskLevel)}`));
    console.log(chalk.white(`  • Estimated Time: ${complexPlan.estimatedTime} hours (${Math.round(complexPlan.estimatedTime/8)} days)`));
    console.log(chalk.white(`  • Tasks: ${complexPlan.tasks.length}`));
    
    // Show task breakdown for complex project
    console.log(chalk.blue('\n📝 Task Breakdown (First 5 tasks):'));
    complexPlan.tasks.slice(0, 5).forEach((task, index) => {
      console.log(chalk.white(`  ${index + 1}. ${task.name}`));
      console.log(chalk.gray(`     - Type: ${task.type}`));
      console.log(chalk.gray(`     - Agent: ${task.assignedAgent || 'Unassigned'}`));
      console.log(chalk.gray(`     - Hours: ${task.estimatedHours}`));
    });
    
    // Show quality gates
    console.log(chalk.blue('\n🚦 Quality Gates:'));
    complexPlan.qualityGates.forEach((gate, index) => {
      console.log(chalk.white(`  ${index + 1}. ${gate.name}`));
      const criteria = Array.isArray(gate.criteria) ? gate.criteria : Object.values(gate.criteria || {});
      console.log(chalk.gray(`     - Criteria: ${criteria.join(', ')}`));
    });
    
    // Show timeline
    console.log(chalk.blue('\n⏱️ Timeline Analysis:'));
    console.log(chalk.white(`  • Total Hours: ${complexPlan.timeline.totalHours}`));
    console.log(chalk.white(`  • Estimated Days: ${complexPlan.timeline.estimatedDays}`));
    console.log(chalk.white(`  • Critical Path: ${complexPlan.timeline.criticalPath.slice(0, 3).join(' → ')}...`));
    
    // Example 3: Urgent Fix
    console.log(chalk.yellow('\n\n📋 Example 3: Urgent Security Fix'));
    console.log(chalk.gray('-'.repeat(40)));
    
    const urgentRequirements = {
      name: 'Security Patch',
      description: 'Critical security vulnerability fix',
      features: {
        api: true,
        database: false,
        authentication: true,
        frontend: false,
        realTime: false,
        mobile: false
      },
      scale: 'simple',
      security: {
        compliance: true,
        encryption: true
      },
      timeline: {
        deadline: '2025-01-20',
        urgent: true
      }
    };
    
    const urgentPlan = await orchestrator.planMission(urgentRequirements);
    
    console.log(chalk.green('\n✅ Urgent Fix Plan:'));
    console.log(chalk.white(`  • Mission ID: ${urgentPlan.id}`));
    console.log(chalk.white(`  • Name: ${urgentPlan.name}`));
    console.log(chalk.white(`  • Complexity: ${chalk.yellow(urgentPlan.complexity)}`));
    console.log(chalk.white(`  • Risk Level: ${chalk.red(urgentPlan.riskLevel)} (due to urgency)`));
    console.log(chalk.white(`  • Estimated Time: ${urgentPlan.estimatedTime} hours`));
    console.log(chalk.red(`  • ⚠️ URGENT: Requires immediate attention`));
    
    // Show system status
    console.log(chalk.blue('\n\n📊 System Status:'));
    console.log(chalk.gray('-'.repeat(40)));
    const status = orchestrator.getStatus();
    console.log(chalk.white(`  • Version: ${status.version}`));
    console.log(chalk.white(`  • Systems Online:`));
    console.log(chalk.green(`    ✓ Orchestration Engine: ${status.systems.orchestrationEngine.status}`));
    console.log(chalk.green(`    ✓ Risk Management: ${status.systems.riskManagement.status}`));
    console.log(chalk.green(`    ✓ Quality Gate: ${status.systems.qualityGate.status}`));
    console.log(chalk.green(`    ✓ Resource Management: ${status.systems.resourceManagement.status}`));
    
    // Summary
    console.log(chalk.gray('\n' + '='.repeat(50)));
    console.log(chalk.green.bold('\n✨ Demo Complete!'));
    console.log(chalk.cyan('\n📚 What you just saw:'));
    console.log(chalk.white('  1. Simple project planning (Blog Platform)'));
    console.log(chalk.white('  2. Complex enterprise planning (Banking System)'));
    console.log(chalk.white('  3. Urgent security fix planning'));
    console.log(chalk.white('  4. Task assignment to specialized AI agents'));
    console.log(chalk.white('  5. Risk assessment and quality gates'));
    console.log(chalk.white('  6. Timeline estimation and critical path analysis'));
    
    console.log(chalk.cyan('\n💡 Next Steps:'));
    console.log(chalk.white('  • Create your own requirements.json file'));
    console.log(chalk.white('  • Run: node src/index.js plan --file your-requirements.json'));
    console.log(chalk.white('  • Integrate with your CI/CD pipeline'));
    console.log(chalk.white('  • Connect monitoring dashboards via WebSocket (port 8080)'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Demo Error:'), error);
    process.exit(1);
  }
}

// Run the demo
runSimpleDemo().then(() => {
  console.log(chalk.gray('\n👋 Thanks for trying the Enhanced Tech-Lead Orchestrator!\n'));
  process.exit(0);
}).catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});