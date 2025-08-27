import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_staggered_grid_view/flutter_staggered_grid_view.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:percent_indicator/percent_indicator.dart';

import '../../../core/widgets/glassmorphic_card.dart';
import '../models/agent_model.dart';

class AgentStatusGrid extends StatefulWidget {
  const AgentStatusGrid({super.key});

  @override
  State<AgentStatusGrid> createState() => _AgentStatusGridState();
}

class _AgentStatusGridState extends State<AgentStatusGrid>
    with TickerProviderStateMixin {
  late List<AgentModel> _agents;
  late AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _pulseController.repeat();
    _initializeAgents();
  }

  void _initializeAgents() {
    _agents = [
      AgentModel(
        id: 'code-gen-1',
        name: 'Code Generator',
        type: AgentType.codeGenerator,
        status: AgentStatus.active,
        description: 'Generates React, Node.js, and Python code with modern patterns',
        currentTask: 'Building authentication system',
        progress: 0.78,
        performance: 0.94,
        lastActivity: DateTime.now().subtract(const Duration(minutes: 2)),
        tasksCompleted: 127,
        successRate: 0.96,
      ),
      AgentModel(
        id: 'test-gen-1',
        name: 'Test Generator',
        type: AgentType.testGenerator,
        status: AgentStatus.idle,
        description: 'Creates comprehensive unit and integration tests',
        currentTask: null,
        progress: 0.0,
        performance: 0.89,
        lastActivity: DateTime.now().subtract(const Duration(minutes: 15)),
        tasksCompleted: 89,
        successRate: 0.91,
      ),
      AgentModel(
        id: 'doc-gen-1',
        name: 'Documentation Generator',
        type: AgentType.documentationGenerator,
        status: AgentStatus.busy,
        description: 'Generates technical documentation and API guides',
        currentTask: 'Creating API documentation',
        progress: 0.45,
        performance: 0.92,
        lastActivity: DateTime.now().subtract(const Duration(minutes: 1)),
        tasksCompleted: 156,
        successRate: 0.93,
      ),
      AgentModel(
        id: 'enhancer-1',
        name: 'Code Enhancer',
        type: AgentType.codeEnhancer,
        status: AgentStatus.active,
        description: 'Improves code quality, performance, and maintainability',
        currentTask: 'Optimizing database queries',
        progress: 0.62,
        performance: 0.97,
        lastActivity: DateTime.now().subtract(const Duration(seconds: 30)),
        tasksCompleted: 203,
        successRate: 0.98,
      ),
      AgentModel(
        id: 'analyzer-1',
        name: 'Code Analyzer',
        type: AgentType.analyzer,
        status: AgentStatus.active,
        description: 'Analyzes code quality and suggests improvements',
        currentTask: 'Security vulnerability scan',
        progress: 0.33,
        performance: 0.91,
        lastActivity: DateTime.now().subtract(const Duration(minutes: 3)),
        tasksCompleted: 98,
        successRate: 0.94,
      ),
      AgentModel(
        id: 'deployer-1',
        name: 'Deployment Agent',
        type: AgentType.deployer,
        status: AgentStatus.error,
        description: 'Handles automated deployment and CI/CD processes',
        currentTask: 'Deployment pipeline failed',
        progress: 0.0,
        performance: 0.87,
        lastActivity: DateTime.now().subtract(const Duration(minutes: 8)),
        tasksCompleted: 67,
        successRate: 0.89,
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
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: MasonryGridView.count(
        crossAxisCount: 2,
        mainAxisSpacing: 16,
        crossAxisSpacing: 16,
        itemCount: _agents.length,
        itemBuilder: (context, index) {
          return _buildAgentCard(_agents[index], index);
        },
      ),
    );
  }

  Widget _buildAgentCard(AgentModel agent, int index) {
    final theme = Theme.of(context);
    
    return GlassmorphicCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header with status indicator
          Row(
            children: [
              _buildStatusIndicator(agent.status, theme),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      agent.name,
                      style: GoogleFonts.orbitron(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    Text(
                      _getAgentTypeLabel(agent.type),
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
              _buildAgentIcon(agent.type, theme),
            ],
          ),
          
          const SizedBox(height: 16),
          
          // Description
          Text(
            agent.description,
            style: GoogleFonts.inter(
              fontSize: 13,
              color: theme.colorScheme.onSurface.withOpacity(0.8),
              height: 1.4,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          
          const SizedBox(height: 16),
          
          // Current task or idle status
          if (agent.currentTask != null) ...[
            Text(
              'Current Task:',
              style: GoogleFonts.inter(
                fontSize: 11,
                fontWeight: FontWeight.w500,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              agent.currentTask!,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: theme.colorScheme.onSurface.withOpacity(0.9),
              ),
              maxLines: 2,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 12),
            
            // Progress indicator
            LinearPercentIndicator(
              lineHeight: 6.0,
              percent: agent.progress,
              backgroundColor: theme.colorScheme.surfaceVariant,
              progressColor: _getStatusColor(agent.status, theme),
              barRadius: const Radius.circular(3),
              animation: true,
              animationDuration: 1000,
            ),
            const SizedBox(height: 8),
            Text(
              '${(agent.progress * 100).toInt()}% Complete',
              style: GoogleFonts.inter(
                fontSize: 11,
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ] else ...[
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
              decoration: BoxDecoration(
                color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Text(
                'Waiting for tasks',
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: theme.colorScheme.onSurface.withOpacity(0.7),
                ),
              ),
            ),
          ],
          
          const SizedBox(height: 16),
          
          // Performance metrics
          Row(
            children: [
              Expanded(
                child: _buildMetricItem(
                  'Performance',
                  '${(agent.performance * 100).toInt()}%',
                  Icons.speed_rounded,
                  theme.colorScheme.secondary,
                  theme,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildMetricItem(
                  'Success Rate',
                  '${(agent.successRate * 100).toInt()}%',
                  Icons.check_circle_rounded,
                  Colors.green,
                  theme,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 12),
          
          Row(
            children: [
              Expanded(
                child: _buildMetricItem(
                  'Completed',
                  '${agent.tasksCompleted}',
                  Icons.task_alt_rounded,
                  theme.colorScheme.primary,
                  theme,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: _buildMetricItem(
                  'Last Active',
                  _formatLastActivity(agent.lastActivity),
                  Icons.access_time_rounded,
                  theme.colorScheme.outline,
                  theme,
                ),
              ),
            ],
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: 100 * index), duration: 600.ms)
        .slideY(
          delay: Duration(milliseconds: 100 * index),
          begin: 0.3,
          curve: Curves.easeOut,
        );
  }

  Widget _buildStatusIndicator(AgentStatus status, ThemeData theme) {
    Color color = _getStatusColor(status, theme);
    
    Widget indicator = Container(
      width: 12,
      height: 12,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color,
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.3),
            blurRadius: 8,
            spreadRadius: 2,
          ),
        ],
      ),
    );

    // Add pulsing animation for active status
    if (status == AgentStatus.active || status == AgentStatus.busy) {
      indicator = AnimatedBuilder(
        animation: _pulseController,
        builder: (context, child) {
          return Transform.scale(
            scale: 1.0 + (_pulseController.value * 0.2),
            child: indicator,
          );
        },
      );
    }

    return indicator;
  }

  Widget _buildAgentIcon(AgentType type, ThemeData theme) {
    IconData icon;
    Color color;

    switch (type) {
      case AgentType.codeGenerator:
        icon = Icons.code_rounded;
        color = theme.colorScheme.primary;
        break;
      case AgentType.testGenerator:
        icon = Icons.bug_report_rounded;
        color = theme.colorScheme.secondary;
        break;
      case AgentType.documentationGenerator:
        icon = Icons.article_rounded;
        color = Colors.orange;
        break;
      case AgentType.codeEnhancer:
        icon = Icons.auto_fix_high_rounded;
        color = Colors.purple;
        break;
      case AgentType.analyzer:
        icon = Icons.analytics_rounded;
        color = Colors.cyan;
        break;
      case AgentType.deployer:
        icon = Icons.rocket_launch_rounded;
        color = Colors.green;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withOpacity(0.1),
      ),
      child: Icon(
        icon,
        size: 20,
        color: color,
      ),
    );
  }

  Widget _buildMetricItem(String label, String value, IconData icon, Color color, ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(
              icon,
              size: 14,
              color: color,
            ),
            const SizedBox(width: 4),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 10,
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
          ],
        ),
        const SizedBox(height: 2),
        Text(
          value,
          style: GoogleFonts.orbitron(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(AgentStatus status, ThemeData theme) {
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

  String _formatLastActivity(DateTime lastActivity) {
    final now = DateTime.now();
    final difference = now.difference(lastActivity);

    if (difference.inMinutes < 1) {
      return 'Now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }
}