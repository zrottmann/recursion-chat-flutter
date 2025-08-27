import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../../core/widgets/glassmorphic_card.dart';
import '../../../core/widgets/animated_gradient_background.dart';
import '../widgets/agent_status_grid.dart';
import '../widgets/real_time_metrics_chart.dart';
import '../widgets/task_queue_widget.dart';
import '../widgets/agent_control_panel.dart';
import '../widgets/system_performance_panel.dart';

class DashboardHomeScreen extends ConsumerStatefulWidget {
  const DashboardHomeScreen({super.key});

  @override
  ConsumerState<DashboardHomeScreen> createState() => _DashboardHomeScreenState();
}

class _DashboardHomeScreenState extends ConsumerState<DashboardHomeScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  int _selectedIndex = 0;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // Animated background
          const AnimatedGradientBackground(),
          
          // Main content
          SafeArea(
            child: Column(
              children: [
                // Custom App Bar
                _buildCustomAppBar(theme),
                
                // Dashboard Stats Overview
                _buildStatsOverview(theme),
                
                // Tab Navigation
                _buildTabNavigation(theme),
                
                // Tab Content
                Expanded(
                  child: TabBarView(
                    controller: _tabController,
                    children: [
                      _buildAgentsTab(),
                      _buildTasksTab(),
                      _buildMetricsTab(),
                      _buildControlTab(),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      
      // Floating Action Button for Quick Actions
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          _showQuickActionDialog(context);
        },
        icon: Icon(Icons.add_rounded),
        label: Text('New Task'),
      )
          .animate()
          .fadeIn(delay: 1000.ms)
          .scaleX(delay: 1000.ms, begin: 0.0, curve: Curves.elasticOut),
      
      floatingActionButtonLocation: FloatingActionButtonLocation.centerFloat,
    );
  }

  Widget _buildCustomAppBar(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          // Profile Section
          GlassmorphicCard(
            padding: const EdgeInsets.all(12),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 40,
                  height: 40,
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
                    Icons.person_rounded,
                    color: theme.colorScheme.onPrimary,
                    size: 20,
                  ),
                ),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      'Administrator',
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    Text(
                      'Platform Manager',
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          )
              .animate()
              .fadeIn(duration: 600.ms)
              .slideX(begin: -0.3, curve: Curves.easeOut),
          
          const Spacer(),
          
          // Real-time Status Indicator
          GlassmorphicCard(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: Colors.green,
                  ),
                )
                    .animate(onPlay: (controller) => controller.repeat())
                    .fadeIn(duration: 1000.ms)
                    .then()
                    .fadeOut(duration: 1000.ms),
                const SizedBox(width: 8),
                Text(
                  'Online',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
              ],
            ),
          )
              .animate()
              .fadeIn(delay: 200.ms, duration: 600.ms)
              .slideX(begin: 0.3, curve: Curves.easeOut),
        ],
      ),
    );
  }

  Widget _buildStatsOverview(ThemeData theme) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: Row(
        children: [
          // Active Agents
          Expanded(
            child: _buildStatCard(
              theme,
              icon: Icons.psychology_rounded,
              title: 'Active Agents',
              value: '6',
              subtitle: '+2 from yesterday',
              color: theme.colorScheme.primary,
              delay: 0,
            ),
          ),
          const SizedBox(width: 12),
          
          // Running Tasks
          Expanded(
            child: _buildStatCard(
              theme,
              icon: Icons.play_arrow_rounded,
              title: 'Running Tasks',
              value: '12',
              subtitle: '3 in queue',
              color: theme.colorScheme.secondary,
              delay: 100,
            ),
          ),
          const SizedBox(width: 12),
          
          // Success Rate
          Expanded(
            child: _buildStatCard(
              theme,
              icon: Icons.trending_up_rounded,
              title: 'Success Rate',
              value: '94%',
              subtitle: '+5% this week',
              color: Colors.green,
              delay: 200,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(
    ThemeData theme, {
    required IconData icon,
    required String title,
    required String value,
    required String subtitle,
    required Color color,
    required int delay,
  }) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(
            icon,
            color: color,
            size: 24,
          ),
          const SizedBox(height: 8),
          Text(
            value,
            style: GoogleFonts.orbitron(
              fontSize: 24,
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: GoogleFonts.inter(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: theme.colorScheme.onSurface.withOpacity(0.8),
            ),
          ),
          const SizedBox(height: 2),
          Text(
            subtitle,
            style: GoogleFonts.inter(
              fontSize: 10,
              color: color,
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: Duration(milliseconds: 400 + delay), duration: 600.ms)
        .slideY(
          delay: Duration(milliseconds: 400 + delay),
          begin: 0.3,
          curve: Curves.easeOut,
        );
  }

  Widget _buildTabNavigation(ThemeData theme) {
    final tabs = [
      {'icon': Icons.psychology_rounded, 'label': 'Agents'},
      {'icon': Icons.task_rounded, 'label': 'Tasks'},
      {'icon': Icons.analytics_rounded, 'label': 'Metrics'},
      {'icon': Icons.settings_rounded, 'label': 'Control'},
    ];

    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: GlassmorphicCard(
        padding: const EdgeInsets.all(8),
        child: TabBar(
          controller: _tabController,
          indicator: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            gradient: LinearGradient(
              colors: [
                theme.colorScheme.primary,
                theme.colorScheme.secondary,
              ],
            ),
          ),
          labelColor: theme.colorScheme.onPrimary,
          unselectedLabelColor: theme.colorScheme.onSurface.withOpacity(0.7),
          dividerColor: Colors.transparent,
          tabs: tabs.map((tab) => Tab(
            icon: Icon(tab['icon'] as IconData, size: 20),
            text: tab['label'] as String,
          )).toList(),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: 800.ms, duration: 600.ms)
        .slideY(begin: 0.2, delay: 800.ms, curve: Curves.easeOut);
  }

  Widget _buildAgentsTab() {
    return const AgentStatusGrid();
  }

  Widget _buildTasksTab() {
    return const TaskQueueWidget();
  }

  Widget _buildMetricsTab() {
    return Column(
      children: [
        const Expanded(
          flex: 2,
          child: RealTimeMetricsChart(),
        ),
        const Expanded(
          flex: 1,
          child: SystemPerformancePanel(),
        ),
      ],
    );
  }

  Widget _buildControlTab() {
    return const AgentControlPanel();
  }

  void _showQuickActionDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        backgroundColor: Colors.transparent,
        child: GlassmorphicCard(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Quick Actions',
                style: GoogleFonts.orbitron(
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 20),
              
              // Quick action buttons
              _buildQuickActionButton(
                context,
                icon: Icons.code_rounded,
                title: 'Generate Code',
                subtitle: 'Start new code generation task',
                onTap: () => Navigator.pop(context),
              ),
              
              _buildQuickActionButton(
                context,
                icon: Icons.bug_report_rounded,
                title: 'Run Tests',
                subtitle: 'Execute test generation agent',
                onTap: () => Navigator.pop(context),
              ),
              
              _buildQuickActionButton(
                context,
                icon: Icons.article_rounded,
                title: 'Create Docs',
                subtitle: 'Generate project documentation',
                onTap: () => Navigator.pop(context),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActionButton(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(
              color: Theme.of(context).colorScheme.outline.withOpacity(0.2),
            ),
          ),
          child: Row(
            children: [
              Icon(icon, size: 24),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.inter(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    Text(
                      subtitle,
                      style: GoogleFonts.inter(
                        fontSize: 12,
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 16,
                color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}