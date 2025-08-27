import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:percent_indicator/percent_indicator.dart';
import 'dart:math' as math;

import '../../../core/widgets/glassmorphic_card.dart';
import '../models/agent_model.dart';

class AgentControlPanel extends StatefulWidget {
  const AgentControlPanel({super.key});

  @override
  State<AgentControlPanel> createState() => _AgentControlPanelState();
}

class _AgentControlPanelState extends State<AgentControlPanel>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late List<AgentModel> _agents;
  bool _isOrchestrationMode = false;
  String _selectedAgent = '';

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 3),
      vsync: this,
    );
    _pulseController.repeat();
    _initializeAgents();
  }

  void _initializeAgents() {
    _agents = [
      AgentModel(
        id: 'code-gen-1',
        name: 'Code Generator Prime',
        type: AgentType.codeGenerator,
        status: AgentStatus.active,
        description: 'Advanced code generation with AI-powered architecture patterns',
        currentTask: 'Generating microservices architecture',
        progress: 0.68,
        performance: 0.94,
        lastActivity: DateTime.now().subtract(const Duration(minutes: 2)),
        tasksCompleted: 157,
        successRate: 0.96,
        capabilities: ['React', 'Node.js', 'TypeScript', 'Python', 'Go', 'Rust'],
        configuration: {
          'model': 'GPT-4',
          'temperature': 0.7,
          'max_tokens': 4000,
        },
      ),
      AgentModel(
        id: 'test-gen-1',
        name: 'Test Generator Alpha',
        type: AgentType.testGenerator,
        status: AgentStatus.idle,
        description: 'Comprehensive testing suite generation with edge case coverage',
        currentTask: null,
        progress: 0.0,
        performance: 0.91,
        lastActivity: DateTime.now().subtract(const Duration(minutes: 18)),
        tasksCompleted: 89,
        successRate: 0.93,
        capabilities: ['Jest', 'Cypress', 'Playwright', 'Unit Tests', 'E2E Tests'],
        configuration: {
          'coverage_target': 95,
          'include_edge_cases': true,
        },
      ),
      AgentModel(
        id: 'doc-gen-1',
        name: 'Documentation Master',
        type: AgentType.documentationGenerator,
        status: AgentStatus.busy,
        description: 'Technical documentation and API specification generation',
        currentTask: 'Creating OpenAPI specifications',
        progress: 0.45,
        performance: 0.88,
        lastActivity: DateTime.now().subtract(const Duration(minutes: 5)),
        tasksCompleted: 203,
        successRate: 0.89,
        capabilities: ['OpenAPI', 'Markdown', 'Technical Writing', 'Code Comments'],
        configuration: {
          'format': 'OpenAPI 3.0',
          'include_examples': true,
        },
      ),
      AgentModel(
        id: 'enhancer-1',
        name: 'Code Enhancer Pro',
        type: AgentType.codeEnhancer,
        status: AgentStatus.active,
        description: 'Performance optimization and code quality improvement',
        currentTask: 'Optimizing database queries',
        progress: 0.82,
        performance: 0.97,
        lastActivity: DateTime.now().subtract(const Duration(seconds: 45)),
        tasksCompleted: 134,
        successRate: 0.98,
        capabilities: ['Performance', 'Security', 'Refactoring', 'Best Practices'],
        configuration: {
          'optimization_level': 'aggressive',
          'preserve_functionality': true,
        },
      ),
      AgentModel(
        id: 'analyzer-1',
        name: 'Security Analyzer',
        type: AgentType.analyzer,
        status: AgentStatus.active,
        description: 'Comprehensive security analysis and vulnerability detection',
        currentTask: 'OWASP security audit',
        progress: 0.31,
        performance: 0.92,
        lastActivity: DateTime.now().subtract(const Duration(minutes: 1)),
        tasksCompleted: 76,
        successRate: 0.95,
        capabilities: ['Security Audit', 'OWASP', 'Penetration Testing', 'Code Review'],
        configuration: {
          'scan_depth': 'deep',
          'include_dependencies': true,
        },
      ),
      AgentModel(
        id: 'deployer-1',
        name: 'Deployment Agent',
        type: AgentType.deployer,
        status: AgentStatus.error,
        description: 'Automated deployment and CI/CD pipeline management',
        currentTask: 'Pipeline configuration failed',
        progress: 0.0,
        performance: 0.85,
        lastActivity: DateTime.now().subtract(const Duration(minutes: 12)),
        tasksCompleted: 45,
        successRate: 0.87,
        capabilities: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'Monitoring'],
        configuration: {
          'environment': 'production',
          'auto_rollback': true,
        },
      ),
    ];
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          // Control Panel Header
          _buildControlHeader(theme),
          
          const SizedBox(height: 16),
          
          // System Controls
          _buildSystemControls(theme),
          
          const SizedBox(height: 16),
          
          // Agent Management Grid
          Expanded(
            child: Row(
              children: [
                // Agent List
                Expanded(
                  flex: 2,
                  child: _buildAgentList(theme),
                ),
                
                const SizedBox(width: 16),
                
                // Agent Details & Controls
                Expanded(
                  child: _buildAgentDetails(theme),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlHeader(ThemeData theme) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(20),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              gradient: LinearGradient(
                colors: [
                  theme.colorScheme.primary,
                  theme.colorScheme.secondary,
                ],
              ),
            ),
            child: Icon(
              Icons.settings_rounded,
              color: theme.colorScheme.onPrimary,
              size: 24,
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Agent Control Center',
                  style: GoogleFonts.orbitron(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                Text(
                  'Orchestrate and monitor AI agents in real-time',
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: theme.colorScheme.onSurface.withOpacity(0.7),
                  ),
                ),
              ],
            ),
          ),
          _buildOrchestrationToggle(theme),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 600.ms)
        .slideY(begin: -0.3, curve: Curves.easeOut);
  }

  Widget _buildOrchestrationToggle(ThemeData theme) {
    return GestureDetector(
      onTap: () {
        setState(() {
          _isOrchestrationMode = !_isOrchestrationMode;
        });
      },
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: _isOrchestrationMode 
              ? theme.colorScheme.primary.withOpacity(0.2)
              : theme.colorScheme.surfaceVariant.withOpacity(0.5),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: _isOrchestrationMode 
                ? theme.colorScheme.primary
                : theme.colorScheme.outline.withOpacity(0.3),
          ),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(
              _isOrchestrationMode 
                  ? Icons.hub_rounded 
                  : Icons.hub_outlined,
              size: 16,
              color: _isOrchestrationMode 
                  ? theme.colorScheme.primary 
                  : theme.colorScheme.onSurface.withOpacity(0.7),
            ),
            const SizedBox(width: 8),
            Text(
              'Orchestration Mode',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: _isOrchestrationMode 
                    ? theme.colorScheme.primary 
                    : theme.colorScheme.onSurface.withOpacity(0.7),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSystemControls(ThemeData theme) {
    return Row(
      children: [
        Expanded(
          child: _buildControlButton(
            theme,
            'Start All Agents',
            Icons.play_arrow_rounded,
            Colors.green,
            () => _handleSystemAction('start_all'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildControlButton(
            theme,
            'Pause All',
            Icons.pause_rounded,
            Colors.orange,
            () => _handleSystemAction('pause_all'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildControlButton(
            theme,
            'Emergency Stop',
            Icons.stop_rounded,
            Colors.red,
            () => _handleSystemAction('emergency_stop'),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildControlButton(
            theme,
            'System Health',
            Icons.health_and_safety_rounded,
            theme.colorScheme.secondary,
            () => _handleSystemAction('health_check'),
          ),
        ),
      ],
    );
  }

  Widget _buildControlButton(ThemeData theme, String label, IconData icon, Color color, VoidCallback onPressed) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(16),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(16),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: theme.colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    )
        .animate()
        .fadeIn(delay: 200.ms, duration: 600.ms)
        .slideY(begin: 0.3, delay: 200.ms, curve: Curves.easeOut);
  }

  Widget _buildAgentList(ThemeData theme) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Agent Fleet',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: ListView.builder(
              itemCount: _agents.length,
              itemBuilder: (context, index) {
                return _buildAgentListItem(_agents[index], theme, index);
              },
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: 400.ms, duration: 800.ms)
        .slideX(begin: -0.3, delay: 400.ms, curve: Curves.easeOut);
  }

  Widget _buildAgentListItem(AgentModel agent, ThemeData theme, int index) {
    final isSelected = _selectedAgent == agent.id;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: GestureDetector(
        onTap: () {
          setState(() {
            _selectedAgent = isSelected ? '' : agent.id;
          });
        },
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: isSelected 
                ? theme.colorScheme.primary.withOpacity(0.1)
                : Colors.transparent,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: isSelected 
                  ? theme.colorScheme.primary.withOpacity(0.3)
                  : theme.colorScheme.outline.withOpacity(0.1),
            ),
          ),
          child: Row(
            children: [
              // Status Indicator
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: _getAgentStatusColor(agent.status, theme),
                ),
              )
                  .animate(onPlay: (controller) => controller.repeat())
                  .fadeIn(duration: 1000.ms)
                  .then()
                  .fadeOut(duration: 1000.ms),
              
              const SizedBox(width: 12),
              
              // Agent Info
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      agent.name,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    Text(
                      _getAgentTypeLabel(agent.type),
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: theme.colorScheme.onSurface.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ),
              
              // Performance Indicator
              CircularPercentIndicator(
                radius: 16.0,
                lineWidth: 3.0,
                percent: agent.performance,
                center: Text(
                  '${(agent.performance * 100).toInt()}',
                  style: GoogleFonts.inter(
                    fontSize: 8,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                progressColor: _getPerformanceColor(agent.performance, theme),
                backgroundColor: theme.colorScheme.surfaceVariant,
              ),
            ],
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: 100 * index), duration: 600.ms)
        .slideX(
          begin: -0.5,
          delay: Duration(milliseconds: 100 * index),
          curve: Curves.easeOut,
        );
  }

  Widget _buildAgentDetails(ThemeData theme) {
    if (_selectedAgent.isEmpty) {
      return _buildNoSelectionState(theme);
    }
    
    final agent = _agents.firstWhere((a) => a.id == _selectedAgent);
    
    return GlassmorphicCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Agent Header
          _buildAgentDetailsHeader(agent, theme),
          
          const SizedBox(height: 20),
          
          // Performance Metrics
          _buildPerformanceMetrics(agent, theme),
          
          const SizedBox(height: 20),
          
          // Capabilities
          _buildCapabilities(agent, theme),
          
          const SizedBox(height: 20),
          
          // Configuration
          _buildConfiguration(agent, theme),
          
          const Spacer(),
          
          // Control Actions
          _buildAgentActions(agent, theme),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: 600.ms, duration: 800.ms)
        .slideX(begin: 0.3, delay: 600.ms, curve: Curves.easeOut);
  }

  Widget _buildAgentDetailsHeader(AgentModel agent, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: _getAgentTypeColor(agent.type, theme).withOpacity(0.2),
              ),
              child: Icon(
                _getAgentTypeIcon(agent.type),
                color: _getAgentTypeColor(agent.type, theme),
                size: 20,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    agent.name,
                    style: GoogleFonts.orbitron(
                      fontSize: 18,
                      fontWeight: FontWeight.w600,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  Text(
                    agent.description,
                    style: GoogleFonts.inter(
                      fontSize: 12,
                      color: theme.colorScheme.onSurface.withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        
        if (agent.currentTask != null) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Current Task',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: theme.colorScheme.primary,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  agent.currentTask!,
                  style: GoogleFonts.inter(
                    fontSize: 14,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 8),
                LinearProgressIndicator(
                  value: agent.progress,
                  backgroundColor: theme.colorScheme.surfaceVariant,
                  valueColor: AlwaysStoppedAnimation<Color>(
                    _getAgentStatusColor(agent.status, theme),
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPerformanceMetrics(AgentModel agent, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Performance Metrics',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 12),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                theme,
                'Performance',
                '${(agent.performance * 100).toInt()}%',
                _getPerformanceColor(agent.performance, theme),
                Icons.speed_rounded,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                theme,
                'Success Rate',
                '${(agent.successRate * 100).toInt()}%',
                Colors.green,
                Icons.check_circle_rounded,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _buildMetricCard(
                theme,
                'Tasks Done',
                '${agent.tasksCompleted}',
                theme.colorScheme.secondary,
                Icons.task_alt_rounded,
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: _buildMetricCard(
                theme,
                'Status',
                agent.statusDisplayText,
                _getAgentStatusColor(agent.status, theme),
                _getAgentStatusIcon(agent.status),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildMetricCard(ThemeData theme, String label, String value, Color color, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: color.withOpacity(0.3),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color),
              const SizedBox(width: 6),
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  color: theme.colorScheme.onSurface.withOpacity(0.7),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.orbitron(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCapabilities(AgentModel agent, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Capabilities',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 6,
          runSpacing: 6,
          children: agent.capabilities.map((capability) {
            return Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: theme.colorScheme.primary.withOpacity(0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                capability,
                style: GoogleFonts.inter(
                  fontSize: 10,
                  color: theme.colorScheme.primary,
                ),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildConfiguration(AgentModel agent, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Configuration',
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
        ),
        const SizedBox(height: 8),
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Column(
            children: agent.configuration.entries.map((entry) {
              return Padding(
                padding: const EdgeInsets.symmetric(vertical: 2),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      entry.key,
                      style: GoogleFonts.inter(
                        fontSize: 11,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                    Text(
                      entry.value.toString(),
                      style: GoogleFonts.jetBrainsMono(
                        fontSize: 11,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                  ],
                ),
              );
            }).toList(),
          ),
        ),
      ],
    );
  }

  Widget _buildAgentActions(AgentModel agent, ThemeData theme) {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: agent.status == AgentStatus.active || agent.status == AgentStatus.busy
                ? () => _handleAgentAction(agent.id, 'pause')
                : () => _handleAgentAction(agent.id, 'start'),
            icon: Icon(
              agent.status == AgentStatus.active || agent.status == AgentStatus.busy
                  ? Icons.pause_rounded
                  : Icons.play_arrow_rounded,
              size: 18,
            ),
            label: Text(
              agent.status == AgentStatus.active || agent.status == AgentStatus.busy
                  ? 'Pause'
                  : 'Start',
              style: GoogleFonts.inter(fontSize: 12),
            ),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: OutlinedButton.icon(
            onPressed: () => _handleAgentAction(agent.id, 'configure'),
            icon: Icon(Icons.settings_rounded, size: 18),
            label: Text(
              'Configure',
              style: GoogleFonts.inter(fontSize: 12),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildNoSelectionState(ThemeData theme) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(40),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.touch_app_rounded,
              size: 64,
              color: theme.colorScheme.outline.withOpacity(0.5),
            ),
            const SizedBox(height: 16),
            Text(
              'Select an Agent',
              style: GoogleFonts.inter(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface.withOpacity(0.7),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Choose an agent from the list to view details and controls',
              style: GoogleFonts.inter(
                fontSize: 14,
                color: theme.colorScheme.onSurface.withOpacity(0.5),
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  // Helper methods
  Color _getAgentStatusColor(AgentStatus status, ThemeData theme) {
    switch (status) {
      case AgentStatus.active:
        return Colors.green;
      case AgentStatus.busy:
        return theme.colorScheme.primary;
      case AgentStatus.idle:
        return Colors.orange;
      case AgentStatus.error:
        return Colors.red;
    }
  }

  IconData _getAgentStatusIcon(AgentStatus status) {
    switch (status) {
      case AgentStatus.active:
        return Icons.play_arrow_rounded;
      case AgentStatus.busy:
        return Icons.work_rounded;
      case AgentStatus.idle:
        return Icons.pause_rounded;
      case AgentStatus.error:
        return Icons.error_rounded;
    }
  }

  Color _getAgentTypeColor(AgentType type, ThemeData theme) {
    switch (type) {
      case AgentType.codeGenerator:
        return theme.colorScheme.primary;
      case AgentType.testGenerator:
        return theme.colorScheme.secondary;
      case AgentType.documentationGenerator:
        return Colors.orange;
      case AgentType.codeEnhancer:
        return Colors.purple;
      case AgentType.analyzer:
        return Colors.cyan;
      case AgentType.deployer:
        return Colors.green;
    }
  }

  IconData _getAgentTypeIcon(AgentType type) {
    switch (type) {
      case AgentType.codeGenerator:
        return Icons.code_rounded;
      case AgentType.testGenerator:
        return Icons.bug_report_rounded;
      case AgentType.documentationGenerator:
        return Icons.article_rounded;
      case AgentType.codeEnhancer:
        return Icons.auto_fix_high_rounded;
      case AgentType.analyzer:
        return Icons.analytics_rounded;
      case AgentType.deployer:
        return Icons.rocket_launch_rounded;
    }
  }

  String _getAgentTypeLabel(AgentType type) {
    switch (type) {
      case AgentType.codeGenerator:
        return 'Code Generation';
      case AgentType.testGenerator:
        return 'Test Creation';
      case AgentType.documentationGenerator:
        return 'Documentation';
      case AgentType.codeEnhancer:
        return 'Code Enhancement';
      case AgentType.analyzer:
        return 'Code Analysis';
      case AgentType.deployer:
        return 'Deployment';
    }
  }

  Color _getPerformanceColor(double performance, ThemeData theme) {
    if (performance >= 0.9) return Colors.green;
    if (performance >= 0.7) return theme.colorScheme.primary;
    if (performance >= 0.5) return Colors.orange;
    return Colors.red;
  }

  void _handleSystemAction(String action) {
    // System action handling logic
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('System action: $action'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }

  void _handleAgentAction(String agentId, String action) {
    // Agent action handling logic
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Agent $agentId: $action'),
        behavior: SnackBarBehavior.floating,
      ),
    );
  }
}