import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:math' as math;

import '../../../core/widgets/glassmorphic_card.dart';
import '../models/agent_model.dart';

class TaskQueueWidget extends StatefulWidget {
  const TaskQueueWidget({super.key});

  @override
  State<TaskQueueWidget> createState() => _TaskQueueWidgetState();
}

class _TaskQueueWidgetState extends State<TaskQueueWidget>
    with TickerProviderStateMixin {
  late AnimationController _listController;
  late List<AgentTask> _tasks;
  String _selectedFilter = 'All';
  final List<String> _filters = ['All', 'Running', 'Queued', 'Completed', 'Failed'];

  @override
  void initState() {
    super.initState();
    _listController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    _initializeTasks();
    _listController.forward();
  }

  void _initializeTasks() {
    _tasks = [
      AgentTask(
        id: 'task-001',
        title: 'Generate Authentication System',
        description: 'Create secure JWT-based authentication with role-based access control',
        agentId: 'code-gen-1',
        status: TaskStatus.running,
        priority: TaskPriority.high,
        createdAt: DateTime.now().subtract(const Duration(minutes: 15)),
        startedAt: DateTime.now().subtract(const Duration(minutes: 12)),
        progress: 0.75,
        parameters: {
          'framework': 'React',
          'database': 'PostgreSQL',
          'features': ['JWT', 'RBAC', '2FA']
        },
        outputs: ['auth.js', 'middleware/auth.js', 'models/User.js'],
      ),
      AgentTask(
        id: 'task-002',
        title: 'Generate Unit Tests',
        description: 'Comprehensive test suite for authentication system',
        agentId: 'test-gen-1',
        status: TaskStatus.queued,
        priority: TaskPriority.medium,
        createdAt: DateTime.now().subtract(const Duration(minutes: 8)),
        progress: 0.0,
        parameters: {
          'test_framework': 'Jest',
          'coverage_target': '95%'
        },
      ),
      AgentTask(
        id: 'task-003',
        title: 'API Documentation',
        description: 'Generate comprehensive API documentation with examples',
        agentId: 'doc-gen-1',
        status: TaskStatus.running,
        priority: TaskPriority.medium,
        createdAt: DateTime.now().subtract(const Duration(hours: 1)),
        startedAt: DateTime.now().subtract(const Duration(minutes: 45)),
        progress: 0.60,
        parameters: {
          'format': 'OpenAPI 3.0',
          'include_examples': true
        },
        outputs: ['openapi.yaml', 'postman_collection.json'],
      ),
      AgentTask(
        id: 'task-004',
        title: 'Database Migration Scripts',
        description: 'Generate migration scripts for user management tables',
        agentId: 'code-gen-1',
        status: TaskStatus.completed,
        priority: TaskPriority.high,
        createdAt: DateTime.now().subtract(const Duration(hours: 2)),
        startedAt: DateTime.now().subtract(const Duration(hours: 2)),
        completedAt: DateTime.now().subtract(const Duration(minutes: 30)),
        progress: 1.0,
        parameters: {
          'database': 'PostgreSQL',
          'version': '13'
        },
        outputs: [
          '001_create_users_table.sql',
          '002_create_roles_table.sql',
          '003_create_permissions_table.sql'
        ],
      ),
      AgentTask(
        id: 'task-005',
        title: 'Performance Optimization',
        description: 'Optimize database queries and API response times',
        agentId: 'enhancer-1',
        status: TaskStatus.failed,
        priority: TaskPriority.critical,
        createdAt: DateTime.now().subtract(const Duration(minutes: 20)),
        startedAt: DateTime.now().subtract(const Duration(minutes: 18)),
        progress: 0.25,
        parameters: {
          'target_response_time': '< 200ms',
          'optimize_queries': true
        },
      ),
      AgentTask(
        id: 'task-006',
        title: 'Security Analysis',
        description: 'Comprehensive security audit of authentication flow',
        agentId: 'analyzer-1',
        status: TaskStatus.queued,
        priority: TaskPriority.high,
        createdAt: DateTime.now().subtract(const Duration(minutes: 5)),
        progress: 0.0,
        parameters: {
          'scope': 'authentication',
          'standards': ['OWASP', 'NIST']
        },
      ),
    ];
  }

  List<AgentTask> get _filteredTasks {
    if (_selectedFilter == 'All') return _tasks;
    return _tasks.where((task) {
      switch (_selectedFilter) {
        case 'Running':
          return task.status == TaskStatus.running;
        case 'Queued':
          return task.status == TaskStatus.queued;
        case 'Completed':
          return task.status == TaskStatus.completed;
        case 'Failed':
          return task.status == TaskStatus.failed;
        default:
          return true;
      }
    }).toList();
  }

  @override
  void dispose() {
    _listController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final filteredTasks = _filteredTasks;
    
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          // Header with filters
          _buildHeader(theme),
          
          const SizedBox(height: 16),
          
          // Task Statistics
          _buildTaskStatistics(theme),
          
          const SizedBox(height: 16),
          
          // Task List
          Expanded(
            child: filteredTasks.isEmpty
                ? _buildEmptyState(theme)
                : _buildTaskList(filteredTasks, theme),
          ),
        ],
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(
            Icons.task_rounded,
            color: theme.colorScheme.primary,
            size: 24,
          ),
          const SizedBox(width: 12),
          Text(
            'Task Queue',
            style: GoogleFonts.orbitron(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          const Spacer(),
          _buildFilterDropdown(theme),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 600.ms)
        .slideY(begin: -0.3, curve: Curves.easeOut);
  }

  Widget _buildFilterDropdown(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: theme.colorScheme.outline.withOpacity(0.2),
        ),
      ),
      child: DropdownButton<String>(
        value: _selectedFilter,
        underline: const SizedBox(),
        icon: Icon(
          Icons.keyboard_arrow_down_rounded,
          color: theme.colorScheme.onSurface,
        ),
        style: GoogleFonts.inter(
          fontSize: 12,
          color: theme.colorScheme.onSurface,
        ),
        items: _filters.map((String filter) {
          return DropdownMenuItem<String>(
            value: filter,
            child: Text(filter),
          );
        }).toList(),
        onChanged: (String? value) {
          if (value != null) {
            setState(() {
              _selectedFilter = value;
            });
          }
        },
      ),
    );
  }

  Widget _buildTaskStatistics(ThemeData theme) {
    final runningCount = _tasks.where((t) => t.status == TaskStatus.running).length;
    final queuedCount = _tasks.where((t) => t.status == TaskStatus.queued).length;
    final completedCount = _tasks.where((t) => t.status == TaskStatus.completed).length;
    final failedCount = _tasks.where((t) => t.status == TaskStatus.failed).length;
    
    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            theme,
            'Running',
            runningCount.toString(),
            theme.colorScheme.primary,
            Icons.play_arrow_rounded,
            0,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            theme,
            'Queued',
            queuedCount.toString(),
            Colors.orange,
            Icons.schedule_rounded,
            100,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            theme,
            'Completed',
            completedCount.toString(),
            Colors.green,
            Icons.check_circle_rounded,
            200,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildStatCard(
            theme,
            'Failed',
            failedCount.toString(),
            Colors.red,
            Icons.error_rounded,
            300,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(ThemeData theme, String label, String value, Color color, IconData icon, int delay) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          Icon(icon, color: color, size: 20),
          const SizedBox(height: 6),
          Text(
            value,
            style: GoogleFonts.orbitron(
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onSurface,
            ),
          ),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: 200 + delay), duration: 600.ms)
        .slideY(
          delay: Duration(milliseconds: 200 + delay),
          begin: 0.3,
          curve: Curves.easeOut,
        );
  }

  Widget _buildTaskList(List<AgentTask> tasks, ThemeData theme) {
    return ListView.builder(
      itemCount: tasks.length,
      itemBuilder: (context, index) {
        return Padding(
          padding: const EdgeInsets.only(bottom: 12),
          child: _buildTaskCard(tasks[index], theme, index),
        );
      },
    );
  }

  Widget _buildTaskCard(AgentTask task, ThemeData theme, int index) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Task Header
          Row(
            children: [
              _buildStatusIndicator(task.status, theme),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      task.title,
                      style: GoogleFonts.inter(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    Text(
                      task.description,
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              _buildPriorityBadge(task.priority, theme),
            ],
          ),
          
          const SizedBox(height: 12),
          
          // Progress Bar (for running tasks)
          if (task.status == TaskStatus.running) ...[
            Row(
              children: [
                Expanded(
                  child: LinearProgressIndicator(
                    value: task.progress,
                    backgroundColor: theme.colorScheme.surfaceVariant,
                    valueColor: AlwaysStoppedAnimation<Color>(
                      _getStatusColor(task.status, theme),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Text(
                  '${(task.progress * 100).toInt()}%',
                  style: GoogleFonts.orbitron(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
          ],
          
          // Task Details
          Row(
            children: [
              _buildDetailChip(
                theme,
                Icons.psychology_rounded,
                'Agent: ${task.agentId}',
                theme.colorScheme.secondary,
              ),
              const SizedBox(width: 8),
              _buildDetailChip(
                theme,
                Icons.access_time_rounded,
                _formatDuration(task.createdAt),
                theme.colorScheme.outline,
              ),
              if (task.outputs.isNotEmpty) ...[
                const SizedBox(width: 8),
                _buildDetailChip(
                  theme,
                  Icons.file_present_rounded,
                  '${task.outputs.length} files',
                  Colors.green,
                ),
              ],
            ],
          ),
          
          // Outputs (for completed tasks)
          if (task.outputs.isNotEmpty && task.status == TaskStatus.completed) ...[
            const SizedBox(height: 12),
            Text(
              'Generated Files:',
              style: GoogleFonts.inter(
                fontSize: 12,
                fontWeight: FontWeight.w500,
                color: theme.colorScheme.primary,
              ),
            ),
            const SizedBox(height: 4),
            Wrap(
              spacing: 8,
              runSpacing: 4,
              children: task.outputs.map((output) {
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    output,
                    style: GoogleFonts.jetBrainsMono(
                      fontSize: 10,
                      color: theme.colorScheme.onSurface.withOpacity(0.8),
                    ),
                  ),
                );
              }).toList(),
            ),
          ],
          
          // Action Buttons
          if (task.status == TaskStatus.failed || task.status == TaskStatus.queued) ...[
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                if (task.status == TaskStatus.failed)
                  TextButton.icon(
                    onPressed: () {
                      // Retry task functionality
                    },
                    icon: Icon(Icons.refresh_rounded, size: 16),
                    label: Text(
                      'Retry',
                      style: GoogleFonts.inter(fontSize: 12),
                    ),
                  ),
                if (task.status == TaskStatus.queued)
                  TextButton.icon(
                    onPressed: () {
                      // Cancel task functionality
                    },
                    icon: Icon(Icons.close_rounded, size: 16),
                    label: Text(
                      'Cancel',
                      style: GoogleFonts.inter(fontSize: 12),
                    ),
                  ),
              ],
            ),
          ],
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

  Widget _buildStatusIndicator(TaskStatus status, ThemeData theme) {
    Color color = _getStatusColor(status, theme);
    IconData icon = _getStatusIcon(status);
    
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color.withOpacity(0.1),
        border: Border.all(
          color: color.withOpacity(0.3),
          width: 2,
        ),
      ),
      child: Icon(
        icon,
        size: 16,
        color: color,
      ),
    );
  }

  Widget _buildPriorityBadge(TaskPriority priority, ThemeData theme) {
    Color color = _getPriorityColor(priority);
    String label = priority.name.toUpperCase();
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: color.withOpacity(0.3),
        ),
      ),
      child: Text(
        label,
        style: GoogleFonts.inter(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: color,
        ),
      ),
    );
  }

  Widget _buildDetailChip(ThemeData theme, IconData icon, String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 12, color: color),
          const SizedBox(width: 4),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: theme.colorScheme.onSurface.withOpacity(0.8),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState(ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.task_alt_rounded,
            size: 64,
            color: theme.colorScheme.outline.withOpacity(0.5),
          ),
          const SizedBox(height: 16),
          Text(
            'No tasks found',
            style: GoogleFonts.inter(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Tasks will appear here when agents start working',
            style: GoogleFonts.inter(
              fontSize: 14,
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  Color _getStatusColor(TaskStatus status, ThemeData theme) {
    switch (status) {
      case TaskStatus.running:
        return theme.colorScheme.primary;
      case TaskStatus.queued:
        return Colors.orange;
      case TaskStatus.completed:
        return Colors.green;
      case TaskStatus.failed:
        return Colors.red;
      case TaskStatus.cancelled:
        return theme.colorScheme.outline;
    }
  }

  IconData _getStatusIcon(TaskStatus status) {
    switch (status) {
      case TaskStatus.running:
        return Icons.play_arrow_rounded;
      case TaskStatus.queued:
        return Icons.schedule_rounded;
      case TaskStatus.completed:
        return Icons.check_circle_rounded;
      case TaskStatus.failed:
        return Icons.error_rounded;
      case TaskStatus.cancelled:
        return Icons.cancel_rounded;
    }
  }

  Color _getPriorityColor(TaskPriority priority) {
    switch (priority) {
      case TaskPriority.low:
        return Colors.blue;
      case TaskPriority.medium:
        return Colors.orange;
      case TaskPriority.high:
        return Colors.red;
      case TaskPriority.critical:
        return Colors.purple;
    }
  }

  String _formatDuration(DateTime createdAt) {
    final now = DateTime.now();
    final difference = now.difference(createdAt);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else {
      return '${difference.inDays}d ago';
    }
  }
}