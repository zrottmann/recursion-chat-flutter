#!/usr/bin/env node

import chalk from 'chalk';
import { EnhancedTechLeadOrchestrator } from './src/index.js';
import { WebSocketManager } from './src/services/websocketManager.js';

console.log(chalk.cyan.bold('\n🚀 Enhanced Tech-Lead Orchestrator Demo\n'));
console.log(chalk.gray('=' .repeat(50)));

async function runDemo() {
  try {
    // Initialize the orchestrator
    console.log(chalk.blue('\n📦 Initializing Orchestrator Systems...'));
    const orchestrator = new EnhancedTechLeadOrchestrator();
    await orchestrator.initialize();
    
    // Start WebSocket server for real-time communication
    console.log(chalk.blue('\n🌐 Starting WebSocket Server...'));
    const wsManager = new WebSocketManager();
    await wsManager.start(8080);
    console.log(chalk.green('✅ WebSocket server running on port 8080'));
    
    // Create a sample mission
    console.log(chalk.blue('\n🎯 Creating Sample Mission...'));
    const requirements = {
      name: 'E-Commerce Platform v2.0',
      description: 'Build a modern e-commerce platform with real-time features',
      features: {
        api: true,
        database: true,
        authentication: true,
        frontend: true,
        realTime: true,
        mobile: false
      },
      scale: 'medium',
      performance: {
        highLoad: true,
        realTime: true
      },
      security: {
        compliance: true,
        encryption: true
      },
      timeline: {
        deadline: '2025-03-01',
        urgent: false
      }
    };
    
    console.log(chalk.yellow('\n📋 Requirements:'));
    console.log(JSON.stringify(requirements, null, 2));
    
    // Plan the mission
    console.log(chalk.blue('\n🧠 Planning Mission...'));
    const missionPlan = await orchestrator.planMission(requirements);
    
    console.log(chalk.green('\n✅ Mission Plan Created:'));
    console.log(chalk.white(`  • Mission ID: ${missionPlan.id}`));
    console.log(chalk.white(`  • Name: ${missionPlan.name}`));
    console.log(chalk.white(`  • Complexity: ${chalk.yellow(missionPlan.complexity)}`));
    console.log(chalk.white(`  • Risk Level: ${chalk.yellow(missionPlan.riskLevel)}`));
    console.log(chalk.white(`  • Estimated Time: ${missionPlan.estimatedTime} hours`));
    console.log(chalk.white(`  • Tasks Created: ${missionPlan.tasks.length}`));
    console.log(chalk.white(`  • Quality Gates: ${missionPlan.qualityGates.length}`));
    
    // Show task breakdown
    console.log(chalk.blue('\n📝 Task Breakdown:'));
    missionPlan.tasks.slice(0, 5).forEach((task, index) => {
      console.log(chalk.white(`  ${index + 1}. ${task.name}`));
      console.log(chalk.gray(`     - Type: ${task.type}`));
      console.log(chalk.gray(`     - Assigned to: ${task.assignedAgent || 'Unassigned'}`));
      console.log(chalk.gray(`     - Estimated: ${task.estimatedHours} hours`));
    });
    if (missionPlan.tasks.length > 5) {
      console.log(chalk.gray(`  ... and ${missionPlan.tasks.length - 5} more tasks`));
    }
    
    // Show quality gates
    console.log(chalk.blue('\n🚦 Quality Gates:'));
    missionPlan.qualityGates.forEach((gate, index) => {
      console.log(chalk.white(`  ${index + 1}. ${gate.name}`));
      console.log(chalk.gray(`     - Criteria: ${gate.criteria.join(', ')}`));
    });
    
    // Show timeline
    console.log(chalk.blue('\n⏱️ Timeline:'));
    console.log(chalk.white(`  • Total Hours: ${missionPlan.timeline.totalHours}`));
    console.log(chalk.white(`  • Estimated Days: ${missionPlan.timeline.estimatedDays}`));
    console.log(chalk.white(`  • Critical Path: ${missionPlan.timeline.criticalPath.join(' → ')}`));
    
    // Execute the mission
    console.log(chalk.blue('\n⚡ Starting Mission Execution...'));
    const execution = await orchestrator.executeMission(missionPlan);
    console.log(chalk.green('✅ Mission execution started'));
    console.log(chalk.white(`  • Execution ID: ${execution.id}`));
    console.log(chalk.white(`  • Status: ${execution.status}`));
    
    // Show system status
    console.log(chalk.blue('\n📊 System Status:'));
    const status = orchestrator.getStatus();
    console.log(chalk.white(`  • Version: ${status.version}`));
    console.log(chalk.white(`  • Orchestration Engine: ${status.systems.orchestrationEngine.status}`));
    console.log(chalk.white(`  • Risk Management: ${status.systems.riskManagement.status}`));
    console.log(chalk.white(`  • Quality Gate: ${status.systems.qualityGate.status}`));
    console.log(chalk.white(`  • Resource Management: ${status.systems.resourceManagement.status}`));
    
    // WebSocket stats
    console.log(chalk.blue('\n🌐 WebSocket Server Stats:'));
    const wsStats = wsManager.getStats();
    console.log(chalk.white(`  • Connected Clients: ${wsStats.totalClients}`));
    console.log(chalk.white(`  • Authenticated: ${wsStats.authenticatedClients}`));
    console.log(chalk.white(`  • Active Rooms: ${wsStats.totalRooms}`));
    console.log(chalk.white(`  • Total Subscriptions: ${wsStats.totalSubscriptions}`));
    
    // Broadcast mission update
    console.log(chalk.blue('\n📡 Broadcasting Mission Update...'));
    wsManager.broadcast({
      type: 'mission:update',
      missionId: missionPlan.id,
      status: 'in_progress',
      progress: 0,
      message: 'Mission execution started'
    });
    console.log(chalk.green('✅ Update broadcast to all connected clients'));
    
    console.log(chalk.gray('\n' + '='.repeat(50)));
    console.log(chalk.green.bold('\n✨ Demo Complete!'));
    console.log(chalk.cyan('\nThe Enhanced Tech-Lead Orchestrator is now ready to:'));
    console.log(chalk.white('  • Plan and execute complex software development missions'));
    console.log(chalk.white('  • Coordinate AI agents for various tasks'));
    console.log(chalk.white('  • Manage risks and quality gates'));
    console.log(chalk.white('  • Provide real-time updates via WebSocket'));
    console.log(chalk.white('  • Track and optimize resource allocation'));
    
    console.log(chalk.gray('\n💡 Tip: Connect to ws://localhost:8080 to receive real-time updates'));
    
    // Keep the demo running for 5 seconds to show WebSocket is active
    console.log(chalk.gray('\n⏳ Keeping services running for 5 seconds...'));
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Cleanup
    console.log(chalk.blue('\n🧹 Cleaning up...'));
    await wsManager.stop();
    console.log(chalk.green('✅ Demo cleanup complete'));
    
  } catch (error) {
    console.error(chalk.red('\n❌ Demo Error:'), error);
    process.exit(1);
  }
}

// Run the demo
runDemo().then(() => {
  process.exit(0);
}).catch(error => {
  console.error(chalk.red('Fatal error:'), error);
  process.exit(1);
});