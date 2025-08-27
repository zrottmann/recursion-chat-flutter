import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:percent_indicator/percent_indicator.dart';
import 'package:fl_chart/fl_chart.dart';
import 'dart:math' as math;

import '../../../core/widgets/glassmorphic_card.dart';
import '../models/agent_model.dart';

class SystemPerformancePanel extends StatefulWidget {
  const SystemPerformancePanel({super.key});

  @override
  State<SystemPerformancePanel> createState() => _SystemPerformancePanelState();
}

class _SystemPerformancePanelState extends State<SystemPerformancePanel>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _dataController;
  
  SystemMetrics? _currentMetrics;
  List<SystemMetrics> _metricsHistory = [];
  
  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _dataController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    );
    
    _pulseController.repeat();
    _initializeMetrics();
    _startMetricsUpdates();
  }

  void _initializeMetrics() {
    _currentMetrics = SystemMetrics(
      totalAgents: 6,
      activeAgents: 3,
      busyAgents: 2,
      idleAgents: 1,
      errorAgents: 1,
      totalTasks: 147,
      runningTasks: 8,
      queuedTasks: 12,
      completedTasks: 125,
      failedTasks: 2,
      systemLoad: 0.68,
      memoryUsage: 0.45,
      cpuUsage: 0.52,
      networkLatency: 87.5,
      lastUpdated: DateTime.now(),
    );
    
    _metricsHistory.add(_currentMetrics!);
  }

  void _startMetricsUpdates() {
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        _updateMetrics();
        _startMetricsUpdates();
      }
    });
  }

  void _updateMetrics() {
    final random = math.Random();
    final previous = _currentMetrics!;
    
    setState(() {
      _currentMetrics = SystemMetrics(
        totalAgents: previous.totalAgents,
        activeAgents: math.max(1, previous.activeAgents + (random.nextBool() ? 1 : -1)),
        busyAgents: math.max(0, previous.busyAgents + (random.nextBool() ? 1 : -1)),
        idleAgents: math.max(0, previous.idleAgents + (random.nextBool() ? 1 : -1)),
        errorAgents: math.max(0, previous.errorAgents + (random.nextBool() ? 1 : 0)),
        totalTasks: previous.totalTasks + random.nextInt(3),
        runningTasks: math.max(0, previous.runningTasks + (random.nextBool() ? 1 : -1)),
        queuedTasks: math.max(0, previous.queuedTasks + (random.nextBool() ? 2 : -1)),
        completedTasks: previous.completedTasks + random.nextInt(2),
        failedTasks: previous.failedTasks + (random.nextDouble() < 0.1 ? 1 : 0),
        systemLoad: math.max(0.1, math.min(1.0, previous.systemLoad + (random.nextDouble() - 0.5) * 0.1)),
        memoryUsage: math.max(0.1, math.min(0.9, previous.memoryUsage + (random.nextDouble() - 0.5) * 0.05)),
        cpuUsage: math.max(0.1, math.min(0.9, previous.cpuUsage + (random.nextDouble() - 0.5) * 0.08)),
        networkLatency: math.max(10, math.min(200, previous.networkLatency + (random.nextDouble() - 0.5) * 20)),
        lastUpdated: DateTime.now(),
      );
      
      _metricsHistory.add(_currentMetrics!);
      if (_metricsHistory.length > 20) {
        _metricsHistory.removeAt(0);
      }
    });
    
    _dataController.reset();
    _dataController.forward();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _dataController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    if (_currentMetrics == null) {
      return const Center(child: CircularProgressIndicator());
    }
    
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Row(
        children: [
          // Left Panel - System Overview
          Expanded(
            flex: 2,
            child: Column(
              children: [
                Expanded(
                  child: _buildSystemOverview(theme),
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: _buildResourceUsage(theme),
                ),
              ],
            ),
          ),
          
          const SizedBox(width: 16),
          
          // Right Panel - Agent Distribution & Health
          Expanded(
            child: Column(
              children: [
                Expanded(
                  child: _buildAgentDistribution(theme),
                ),
                const SizedBox(height: 16),
                Expanded(
                  child: _buildSystemHealth(theme),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSystemOverview(ThemeData theme) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.dashboard_rounded,
                color: theme.colorScheme.primary,
                size: 24,
              ),
              const SizedBox(width: 12),
              Text(
                'System Overview',
                style: GoogleFonts.orbitron(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const Spacer(),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: _getHealthColor(_currentMetrics!.healthRating).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: _getHealthColor(_currentMetrics!.healthRating).withOpacity(0.3),
                  ),
                ),
                child: Text(
                  _currentMetrics!.healthRating,
                  style: GoogleFonts.inter(
                    fontSize: 10,
                    fontWeight: FontWeight.w600,
                    color: _getHealthColor(_currentMetrics!.healthRating),
                  ),
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Quick Stats Grid
          Expanded(
            child: GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 12,
              mainAxisSpacing: 12,
              childAspectRatio: 1.8,
              children: [
                _buildQuickStat(
                  theme,
                  'Active Tasks',
                  '${_currentMetrics!.runningTasks}',
                  Icons.play_arrow_rounded,
                  theme.colorScheme.primary,
                  '+${_getTaskGrowth()} today',
                ),
                _buildQuickStat(
                  theme,
                  'Success Rate',
                  '${(_currentMetrics!.overallSuccessRate * 100).toInt()}%',
                  Icons.trending_up_rounded,
                  Colors.green,
                  _getSuccessRateTrend(),
                ),
                _buildQuickStat(
                  theme,
                  'Queue Length',
                  '${_currentMetrics!.queuedTasks}',
                  Icons.queue_rounded,
                  Colors.orange,
                  _getQueueTrend(),
                ),
                _buildQuickStat(
                  theme,
                  'Network Latency',
                  '${_currentMetrics!.networkLatency.toInt()}ms',
                  Icons.network_check_rounded,
                  _getLatencyColor(_currentMetrics!.networkLatency),
                  _getLatencyTrend(),
                ),
              ],
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 600.ms)
        .slideY(begin: 0.3, curve: Curves.easeOut);
  }

  Widget _buildQuickStat(ThemeData theme, String label, String value, IconData icon, Color color, String trend) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: color.withOpacity(0.05),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: color.withOpacity(0.1),
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, color: color, size: 16),
              const Spacer(),
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
              fontSize: 18,
              fontWeight: FontWeight.w700,
              color: theme.colorScheme.onSurface,
            ),
          ),
          Text(
            trend,
            style: GoogleFonts.inter(
              fontSize: 9,
              color: color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildResourceUsage(ThemeData theme) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Resource Usage',
            style: GoogleFonts.orbitron(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          
          const SizedBox(height: 20),
          
          // CPU Usage
          _buildResourceMeter(
            theme,
            'CPU Usage',
            _currentMetrics!.cpuUsage,
            Icons.memory_rounded,
            _getUsageColor(_currentMetrics!.cpuUsage),
          ),
          
          const SizedBox(height: 16),
          
          // Memory Usage
          _buildResourceMeter(
            theme,
            'Memory Usage',
            _currentMetrics!.memoryUsage,
            Icons.storage_rounded,
            _getUsageColor(_currentMetrics!.memoryUsage),
          ),
          
          const SizedBox(height: 16),
          
          // System Load
          _buildResourceMeter(
            theme,
            'System Load',
            _currentMetrics!.systemLoad,
            Icons.speed_rounded,
            _getUsageColor(_currentMetrics!.systemLoad),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: 200.ms, duration: 600.ms)
        .slideY(begin: 0.3, delay: 200.ms, curve: Curves.easeOut);
  }

  Widget _buildResourceMeter(ThemeData theme, String label, double value, IconData icon, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 16, color: color),
            const SizedBox(width: 8),
            Text(
              label,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: theme.colorScheme.onSurface.withOpacity(0.8),
              ),
            ),
            const Spacer(),
            Text(
              '${(value * 100).toInt()}%',
              style: GoogleFonts.orbitron(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        LinearPercentIndicator(
          lineHeight: 8.0,
          percent: value,
          backgroundColor: theme.colorScheme.surfaceVariant.withOpacity(0.3),
          progressColor: color,
          barRadius: const Radius.circular(4),
          animation: true,
          animationDuration: 1000,
        ),
      ],
    );
  }

  Widget _buildAgentDistribution(ThemeData theme) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Agent Distribution',
            style: GoogleFonts.orbitron(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          
          const SizedBox(height: 20),
          
          // Pie Chart
          Expanded(
            child: PieChart(
              PieChartData(
                sections: _buildPieChartSections(theme),
                centerSpaceRadius: 40,
                sectionsSpace: 2,
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Legend
          _buildAgentLegend(theme),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: 400.ms, duration: 600.ms)
        .slideY(begin: 0.3, delay: 400.ms, curve: Curves.easeOut);
  }

  List<PieChartSectionData> _buildPieChartSections(ThemeData theme) {
    final metrics = _currentMetrics!;
    final total = metrics.totalAgents.toDouble();
    
    return [
      PieChartSectionData(
        color: Colors.green,
        value: metrics.activeAgents.toDouble(),
        title: '${metrics.activeAgents}',
        radius: 60,
        titleStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      PieChartSectionData(
        color: theme.colorScheme.primary,
        value: metrics.busyAgents.toDouble(),
        title: '${metrics.busyAgents}',
        radius: 60,
        titleStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      PieChartSectionData(
        color: Colors.orange,
        value: metrics.idleAgents.toDouble(),
        title: '${metrics.idleAgents}',
        radius: 60,
        titleStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
      PieChartSectionData(
        color: Colors.red,
        value: metrics.errorAgents.toDouble(),
        title: '${metrics.errorAgents}',
        radius: 60,
        titleStyle: GoogleFonts.inter(
          fontSize: 12,
          fontWeight: FontWeight.bold,
          color: Colors.white,
        ),
      ),
    ];
  }

  Widget _buildAgentLegend(ThemeData theme) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceAround,
      children: [
        _buildLegendItem(theme, 'Active', Colors.green, _currentMetrics!.activeAgents),
        _buildLegendItem(theme, 'Busy', theme.colorScheme.primary, _currentMetrics!.busyAgents),
        _buildLegendItem(theme, 'Idle', Colors.orange, _currentMetrics!.idleAgents),
        _buildLegendItem(theme, 'Error', Colors.red, _currentMetrics!.errorAgents),
      ],
    );
  }

  Widget _buildLegendItem(ThemeData theme, String label, Color color, int count) {
    return Column(
      children: [
        Container(
          width: 12,
          height: 12,
          decoration: BoxDecoration(
            color: color,
            shape: BoxShape.circle,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 10,
            color: theme.colorScheme.onSurface.withOpacity(0.7),
          ),
        ),
        Text(
          '$count',
          style: GoogleFonts.orbitron(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
        ),
      ],
    );
  }

  Widget _buildSystemHealth(ThemeData theme) {
    final healthScore = _calculateHealthScore();
    
    return GlassmorphicCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.health_and_safety_rounded,
                color: _getHealthColor(_currentMetrics!.healthRating),
                size: 20,
              ),
              const SizedBox(width: 8),
              Text(
                'System Health',
                style: GoogleFonts.orbitron(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ],
          ),
          
          const SizedBox(height: 20),
          
          // Health Score Circle
          Center(
            child: CircularPercentIndicator(
              radius: 60.0,
              lineWidth: 12.0,
              percent: healthScore,
              center: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(
                    '${(healthScore * 100).toInt()}%',
                    style: GoogleFonts.orbitron(
                      fontSize: 20,
                      fontWeight: FontWeight.w700,
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  Text(
                    _currentMetrics!.healthRating,
                    style: GoogleFonts.inter(
                      fontSize: 10,
                      color: _getHealthColor(_currentMetrics!.healthRating),
                    ),
                  ),
                ],
              ),
              progressColor: _getHealthColor(_currentMetrics!.healthRating),
              backgroundColor: theme.colorScheme.surfaceVariant.withOpacity(0.3),
              animation: true,
              animationDuration: 1500,
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Health Details
          _buildHealthDetail(theme, 'Uptime', '99.8%', Icons.access_time_rounded),
          _buildHealthDetail(theme, 'Response Time', '< 100ms', Icons.speed_rounded),
          _buildHealthDetail(theme, 'Error Rate', '0.2%', Icons.error_outline_rounded),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: 600.ms, duration: 600.ms)
        .slideY(begin: 0.3, delay: 600.ms, curve: Curves.easeOut);
  }

  Widget _buildHealthDetail(ThemeData theme, String label, String value, IconData icon) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(icon, size: 14, color: theme.colorScheme.outline),
          const SizedBox(width: 8),
          Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 11,
              color: theme.colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          const Spacer(),
          Text(
            value,
            style: GoogleFonts.orbitron(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
        ],
      ),
    );
  }

  // Helper methods
  Color _getHealthColor(String healthRating) {
    switch (healthRating) {
      case 'Excellent':
        return Colors.green;
      case 'Good':
        return Colors.blue;
      case 'Fair':
        return Colors.orange;
      case 'Poor':
        return Colors.red;
      case 'Critical':
        return Colors.red.shade700;
      default:
        return Colors.grey;
    }
  }

  Color _getUsageColor(double usage) {
    if (usage < 0.6) return Colors.green;
    if (usage < 0.8) return Colors.orange;
    return Colors.red;
  }

  Color _getLatencyColor(double latency) {
    if (latency < 50) return Colors.green;
    if (latency < 100) return Colors.orange;
    return Colors.red;
  }

  double _calculateHealthScore() {
    final metrics = _currentMetrics!;
    final cpuScore = 1.0 - metrics.cpuUsage;
    final memoryScore = 1.0 - metrics.memoryUsage;
    final loadScore = 1.0 - metrics.systemLoad;
    final errorScore = metrics.errorAgents == 0 ? 1.0 : 0.7;
    
    return (cpuScore + memoryScore + loadScore + errorScore) / 4;
  }

  int _getTaskGrowth() {
    return math.Random().nextInt(10) + 5;
  }

  String _getSuccessRateTrend() {
    return math.Random().nextBool() ? '+2.1%' : '-0.8%';
  }

  String _getQueueTrend() {
    return _currentMetrics!.queuedTasks > 10 ? 'High load' : 'Normal';
  }

  String _getLatencyTrend() {
    return _currentMetrics!.networkLatency < 100 ? 'Good' : 'High';
  }
}