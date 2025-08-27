import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:fl_chart/fl_chart.dart';
import 'dart:math' as math;

import '../../../core/widgets/glassmorphic_card.dart';
import '../models/agent_model.dart';

class RealTimeMetricsChart extends StatefulWidget {
  const RealTimeMetricsChart({super.key});

  @override
  State<RealTimeMetricsChart> createState() => _RealTimeMetricsChartState();
}

class _RealTimeMetricsChartState extends State<RealTimeMetricsChart>
    with TickerProviderStateMixin {
  late AnimationController _chartController;
  late AnimationController _dataUpdateController;
  
  List<FlSpot> _cpuData = [];
  List<FlSpot> _memoryData = [];
  List<FlSpot> _networkData = [];
  List<FlSpot> _taskCompletionData = [];
  
  int _currentIndex = 0;
  final int _maxDataPoints = 50;

  @override
  void initState() {
    super.initState();
    
    _chartController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    );
    
    _dataUpdateController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    );
    
    _chartController.forward();
    _initializeData();
    _startDataSimulation();
  }

  void _initializeData() {
    // Initialize with some sample data
    for (int i = 0; i < _maxDataPoints; i++) {
      double x = i.toDouble();
      _cpuData.add(FlSpot(x, 20 + math.Random().nextDouble() * 30));
      _memoryData.add(FlSpot(x, 40 + math.Random().nextDouble() * 20));
      _networkData.add(FlSpot(x, 10 + math.Random().nextDouble() * 40));
      _taskCompletionData.add(FlSpot(x, 60 + math.Random().nextDouble() * 35));
    }
    _currentIndex = _maxDataPoints;
  }

  void _startDataSimulation() {
    // Simulate real-time data updates
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        _updateData();
        _startDataSimulation();
      }
    });
  }

  void _updateData() {
    setState(() {
      double x = _currentIndex.toDouble();
      
      // Add new data points with realistic variations
      _cpuData.add(FlSpot(x, _generateNextValue(_cpuData.last.y, 20, 70, 5)));
      _memoryData.add(FlSpot(x, _generateNextValue(_memoryData.last.y, 30, 80, 3)));
      _networkData.add(FlSpot(x, _generateNextValue(_networkData.last.y, 5, 60, 8)));
      _taskCompletionData.add(FlSpot(x, _generateNextValue(_taskCompletionData.last.y, 50, 100, 6)));
      
      // Remove old data points to maintain performance
      if (_cpuData.length > _maxDataPoints) {
        _cpuData.removeAt(0);
        _memoryData.removeAt(0);
        _networkData.removeAt(0);
        _taskCompletionData.removeAt(0);
      }
      
      _currentIndex++;
    });
    
    _dataUpdateController.reset();
    _dataUpdateController.forward();
  }

  double _generateNextValue(double current, double min, double max, double volatility) {
    double change = (math.Random().nextDouble() - 0.5) * volatility;
    double newValue = current + change;
    return math.max(min, math.min(max, newValue));
  }

  @override
  void dispose() {
    _chartController.dispose();
    _dataUpdateController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        children: [
          // Chart Header
          _buildChartHeader(theme),
          
          const SizedBox(height: 16),
          
          // Main Charts Grid
          Expanded(
            child: Row(
              children: [
                // Primary Chart (System Performance)
                Expanded(
                  flex: 2,
                  child: _buildSystemPerformanceChart(theme),
                ),
                
                const SizedBox(width: 16),
                
                // Secondary Charts
                Expanded(
                  child: Column(
                    children: [
                      Expanded(
                        child: _buildTaskCompletionChart(theme),
                      ),
                      const SizedBox(height: 16),
                      Expanded(
                        child: _buildNetworkActivityChart(theme),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Metrics Legend
          _buildMetricsLegend(theme),
        ],
      ),
    );
  }

  Widget _buildChartHeader(ThemeData theme) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Icon(
            Icons.analytics_rounded,
            color: theme.colorScheme.primary,
            size: 24,
          ),
          const SizedBox(width: 12),
          Text(
            'Real-Time System Metrics',
            style: GoogleFonts.orbitron(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          const Spacer(),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: Colors.green.withOpacity(0.1),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(
                color: Colors.green.withOpacity(0.3),
              ),
            ),
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
                  'LIVE',
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: Colors.green,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(duration: 600.ms)
        .slideY(begin: -0.3, curve: Curves.easeOut);
  }

  Widget _buildSystemPerformanceChart(ThemeData theme) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'System Performance',
            style: GoogleFonts.inter(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 16),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(
                  show: true,
                  drawVerticalLine: false,
                  horizontalInterval: 20,
                  getDrawingHorizontalLine: (value) {
                    return FlLine(
                      color: theme.colorScheme.outline.withOpacity(0.1),
                      strokeWidth: 1,
                    );
                  },
                ),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                    sideTitles: SideTitles(
                      showTitles: true,
                      reservedSize: 40,
                      interval: 25,
                      getTitlesWidget: (value, meta) {
                        return Text(
                          '${value.toInt()}%',
                          style: GoogleFonts.inter(
                            fontSize: 10,
                            color: theme.colorScheme.onSurface.withOpacity(0.6),
                          ),
                        );
                      },
                    ),
                  ),
                  bottomTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  rightTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                  topTitles: AxisTitles(sideTitles: SideTitles(showTitles: false)),
                ),
                borderData: FlBorderData(show: false),
                minX: _cpuData.isEmpty ? 0 : _cpuData.first.x,
                maxX: _cpuData.isEmpty ? 50 : _cpuData.last.x,
                minY: 0,
                maxY: 100,
                lineBarsData: [
                  // CPU Usage Line
                  LineChartBarData(
                    spots: _cpuData,
                    isCurved: true,
                    gradient: LinearGradient(
                      colors: [
                        theme.colorScheme.primary.withOpacity(0.8),
                        theme.colorScheme.primary.withOpacity(0.3),
                      ],
                    ),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          theme.colorScheme.primary.withOpacity(0.2),
                          theme.colorScheme.primary.withOpacity(0.05),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                  // Memory Usage Line
                  LineChartBarData(
                    spots: _memoryData,
                    isCurved: true,
                    gradient: LinearGradient(
                      colors: [
                        theme.colorScheme.secondary.withOpacity(0.8),
                        theme.colorScheme.secondary.withOpacity(0.3),
                      ],
                    ),
                    barWidth: 3,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(show: false),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: 200.ms, duration: 800.ms)
        .slideY(begin: 0.3, delay: 200.ms, curve: Curves.easeOut);
  }

  Widget _buildTaskCompletionChart(ThemeData theme) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Task Completion Rate',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                minX: _taskCompletionData.isEmpty ? 0 : _taskCompletionData.first.x,
                maxX: _taskCompletionData.isEmpty ? 50 : _taskCompletionData.last.x,
                minY: 0,
                maxY: 100,
                lineBarsData: [
                  LineChartBarData(
                    spots: _taskCompletionData,
                    isCurved: true,
                    gradient: LinearGradient(
                      colors: [
                        Colors.green.withOpacity(0.8),
                        Colors.green.withOpacity(0.3),
                      ],
                    ),
                    barWidth: 2,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          Colors.green.withOpacity(0.2),
                          Colors.green.withOpacity(0.05),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${_taskCompletionData.isNotEmpty ? _taskCompletionData.last.y.toInt() : 0}% Success Rate',
            style: GoogleFonts.orbitron(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: Colors.green,
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: 400.ms, duration: 800.ms)
        .slideY(begin: 0.3, delay: 400.ms, curve: Curves.easeOut);
  }

  Widget _buildNetworkActivityChart(ThemeData theme) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Network Activity',
            style: GoogleFonts.inter(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          const SizedBox(height: 12),
          Expanded(
            child: LineChart(
              LineChartData(
                gridData: FlGridData(show: false),
                titlesData: FlTitlesData(show: false),
                borderData: FlBorderData(show: false),
                minX: _networkData.isEmpty ? 0 : _networkData.first.x,
                maxX: _networkData.isEmpty ? 50 : _networkData.last.x,
                minY: 0,
                maxY: 60,
                lineBarsData: [
                  LineChartBarData(
                    spots: _networkData,
                    isCurved: true,
                    gradient: LinearGradient(
                      colors: [
                        theme.colorScheme.tertiary.withOpacity(0.8),
                        theme.colorScheme.tertiary.withOpacity(0.3),
                      ],
                    ),
                    barWidth: 2,
                    isStrokeCapRound: true,
                    dotData: FlDotData(show: false),
                    belowBarData: BarAreaData(
                      show: true,
                      gradient: LinearGradient(
                        colors: [
                          theme.colorScheme.tertiary.withOpacity(0.2),
                          theme.colorScheme.tertiary.withOpacity(0.05),
                        ],
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${_networkData.isNotEmpty ? _networkData.last.y.toInt() : 0} MB/s',
            style: GoogleFonts.orbitron(
              fontSize: 12,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.tertiary,
            ),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: 600.ms, duration: 800.ms)
        .slideY(begin: 0.3, delay: 600.ms, curve: Curves.easeOut);
  }

  Widget _buildMetricsLegend(ThemeData theme) {
    return GlassmorphicCard(
      padding: const EdgeInsets.all(16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _buildLegendItem(
            theme,
            color: theme.colorScheme.primary,
            label: 'CPU Usage',
            value: '${_cpuData.isNotEmpty ? _cpuData.last.y.toInt() : 0}%',
          ),
          _buildLegendItem(
            theme,
            color: theme.colorScheme.secondary,
            label: 'Memory',
            value: '${_memoryData.isNotEmpty ? _memoryData.last.y.toInt() : 0}%',
          ),
          _buildLegendItem(
            theme,
            color: Colors.green,
            label: 'Tasks/min',
            value: '${_taskCompletionData.isNotEmpty ? (_taskCompletionData.last.y / 10).toInt() : 0}',
          ),
          _buildLegendItem(
            theme,
            color: theme.colorScheme.tertiary,
            label: 'Network',
            value: '${_networkData.isNotEmpty ? _networkData.last.y.toInt() : 0} MB/s',
          ),
        ],
      ),
    )
        .animate()
        .fadeIn(delay: 800.ms, duration: 600.ms)
        .slideY(begin: 0.2, delay: 800.ms, curve: Curves.easeOut);
  }

  Widget _buildLegendItem(ThemeData theme, {
    required Color color,
    required String label,
    required String value,
  }) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 12,
          height: 3,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(2),
          ),
        ),
        const SizedBox(height: 6),
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: 10,
            color: theme.colorScheme.onSurface.withOpacity(0.7),
          ),
        ),
        Text(
          value,
          style: GoogleFonts.orbitron(
            fontSize: 12,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.onSurface,
          ),
        ),
      ],
    );
  }
}