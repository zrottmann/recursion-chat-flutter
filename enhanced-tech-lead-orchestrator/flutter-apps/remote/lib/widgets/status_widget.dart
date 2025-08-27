import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:math' as math;

class StatusWidget extends StatefulWidget {
  const StatusWidget({Key? key}) : super(key: key);

  @override
  State<StatusWidget> createState() => _StatusWidgetState();
}

class _StatusWidgetState extends State<StatusWidget>
    with TickerProviderStateMixin {
  late AnimationController _pulseController;
  late AnimationController _chartController;
  late Animation<double> _pulseAnimation;
  
  // Mock data for demonstration
  final List<double> _cpuData = [45, 52, 38, 65, 44, 33, 55, 67, 42, 58];
  final List<double> _memoryData = [62, 64, 59, 70, 68, 72, 69, 73, 71, 75];
  final List<double> _networkData = [23, 45, 67, 34, 56, 78, 43, 65, 87, 54];
  
  @override
  void initState() {
    super.initState();
    
    _pulseController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat(reverse: true);
    
    _chartController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    );
    
    _pulseAnimation = Tween<double>(
      begin: 0.7,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _pulseController,
      curve: Curves.easeInOut,
    ));
    
    _chartController.forward();
  }
  
  @override
  void dispose() {
    _pulseController.dispose();
    _chartController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: RefreshIndicator(
        onRefresh: _refreshData,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Overall Status Card
              _buildStatusCard(),
              
              const SizedBox(height: 16),
              
              // Quick Metrics Row
              _buildQuickMetrics(),
              
              const SizedBox(height: 16),
              
              // Performance Charts
              Text(
                'Performance Charts',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 12),
              
              _buildChartCard('CPU Usage', _cpuData, Colors.blue),
              _buildChartCard('Memory Usage', _memoryData, Colors.green),
              _buildChartCard('Network I/O', _networkData, Colors.orange),
              
              const SizedBox(height: 16),
              
              // System Logs
              _buildSystemLogs(),
              
              const SizedBox(height: 16),
              
              // Connected Devices
              _buildConnectedDevices(),
            ],
          ),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          HapticFeedback.lightImpact();
          _refreshData();
        },
        child: const Icon(Icons.refresh),
      ),
    );
  }
  
  Widget _buildStatusCard() {
    return AnimatedBuilder(
      animation: _pulseAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _pulseAnimation.value,
          child: Card(
            elevation: 4,
            child: Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(12),
                gradient: LinearGradient(
                  colors: [
                    Colors.green.shade400,
                    Colors.green.shade600,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.check_circle,
                        color: Colors.white,
                        size: 32,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'System Status',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'All systems operational',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.9),
                                fontSize: 14,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text(
                          'Online',
                          style: TextStyle(
                            color: Colors.white,
                            fontSize: 12,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildStatusMetric('Uptime', '15d 3h', Icons.schedule),
                      _buildStatusMetric('Load', '0.45', Icons.speed),
                      _buildStatusMetric('Temp', '42°C', Icons.thermostat),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildStatusMetric(String label, String value, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white, size: 20),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: Colors.white,
            fontSize: 16,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            color: Colors.white.withOpacity(0.8),
            fontSize: 12,
          ),
        ),
      ],
    );
  }
  
  Widget _buildQuickMetrics() {
    final metrics = [
      {'title': 'CPU', 'value': 45, 'color': Colors.blue, 'icon': Icons.memory},
      {'title': 'RAM', 'value': 62, 'color': Colors.green, 'icon': Icons.storage},
      {'title': 'Disk', 'value': 38, 'color': Colors.orange, 'icon': Icons.folder},
      {'title': 'Net', 'value': 23, 'color': Colors.purple, 'icon': Icons.wifi},
    ];
    
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.5,
      ),
      itemCount: metrics.length,
      itemBuilder: (context, index) {
        final metric = metrics[index];
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(
                      metric['icon'] as IconData,
                      color: metric['color'] as Color,
                      size: 20,
                    ),
                    const SizedBox(width: 8),
                    Text(
                      metric['title'] as String,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                Text(
                  '${metric['value']}%',
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 4),
                ClipRRect(
                  borderRadius: BorderRadius.circular(2),
                  child: LinearProgressIndicator(
                    value: (metric['value'] as int) / 100,
                    backgroundColor: (metric['color'] as Color).withOpacity(0.2),
                    valueColor: AlwaysStoppedAnimation<Color>(
                      metric['color'] as Color,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
  
  Widget _buildChartCard(String title, List<double> data, Color color) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              title,
              style: const TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 100,
              child: AnimatedBuilder(
                animation: _chartController,
                builder: (context, child) {
                  return CustomPaint(
                    size: Size.infinite,
                    painter: _ChartPainter(
                      data: data,
                      color: color,
                      progress: _chartController.value,
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  Widget _buildSystemLogs() {
    final logs = [
      {'time': '14:23:45', 'level': 'INFO', 'message': 'System backup completed'},
      {'time': '14:20:12', 'level': 'WARN', 'message': 'High memory usage detected'},
      {'time': '14:15:33', 'level': 'INFO', 'message': 'User authentication successful'},
      {'time': '14:10:01', 'level': 'ERROR', 'message': 'Failed to connect to external API'},
      {'time': '14:05:22', 'level': 'INFO', 'message': 'Service restart completed'},
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              'System Logs',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const Spacer(),
            TextButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.open_in_new, size: 16),
              label: const Text('View All'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        Card(
          child: ListView.separated(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: logs.length,
            separatorBuilder: (context, index) => const Divider(height: 1),
            itemBuilder: (context, index) {
              final log = logs[index];
              Color levelColor;
              IconData levelIcon;
              
              switch (log['level']) {
                case 'ERROR':
                  levelColor = Colors.red;
                  levelIcon = Icons.error;
                  break;
                case 'WARN':
                  levelColor = Colors.orange;
                  levelIcon = Icons.warning;
                  break;
                default:
                  levelColor = Colors.blue;
                  levelIcon = Icons.info;
              }
              
              return ListTile(
                dense: true,
                leading: Icon(levelIcon, color: levelColor, size: 16),
                title: Text(
                  log['message']!,
                  style: const TextStyle(fontSize: 14),
                ),
                subtitle: Text(
                  log['time']!,
                  style: const TextStyle(fontSize: 12),
                ),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 8,
                    vertical: 2,
                  ),
                  decoration: BoxDecoration(
                    color: levelColor.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    log['level']!,
                    style: TextStyle(
                      color: levelColor,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
  
  Widget _buildConnectedDevices() {
    final devices = [
      {'name': 'Laptop-01', 'ip': '192.168.1.101', 'status': 'Online'},
      {'name': 'Mobile-01', 'ip': '192.168.1.102', 'status': 'Online'},
      {'name': 'Server-01', 'ip': '192.168.1.100', 'status': 'Online'},
      {'name': 'IoT-Device', 'ip': '192.168.1.103', 'status': 'Offline'},
    ];
    
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Connected Devices',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        Card(
          child: ListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: devices.length,
            itemBuilder: (context, index) {
              final device = devices[index];
              final isOnline = device['status'] == 'Online';
              
              return ListTile(
                leading: CircleAvatar(
                  backgroundColor: isOnline 
                      ? Colors.green.withOpacity(0.1)
                      : Colors.red.withOpacity(0.1),
                  child: Icon(
                    Icons.devices,
                    color: isOnline ? Colors.green : Colors.red,
                  ),
                ),
                title: Text(device['name']!),
                subtitle: Text(device['ip']!),
                trailing: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: isOnline ? Colors.green : Colors.red,
                    shape: BoxShape.circle,
                  ),
                ),
              );
            },
          ),
        ),
      ],
    );
  }
  
  Future<void> _refreshData() async {
    HapticFeedback.lightImpact();
    await Future.delayed(const Duration(seconds: 1));
    // Simulate data refresh
    setState(() {});
  }
}

class _ChartPainter extends CustomPainter {
  final List<double> data;
  final Color color;
  final double progress;
  
  _ChartPainter({
    required this.data,
    required this.color,
    required this.progress,
  });
  
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = color
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;
    
    final fillPaint = Paint()
      ..color = color.withOpacity(0.2)
      ..style = PaintingStyle.fill;
    
    final path = Path();
    final fillPath = Path();
    
    final maxValue = data.reduce(math.max);
    final minValue = data.reduce(math.min);
    final range = maxValue - minValue;
    
    for (int i = 0; i < data.length; i++) {
      if (i / data.length > progress) break;
      
      final x = (i / (data.length - 1)) * size.width;
      final y = size.height - ((data[i] - minValue) / range) * size.height;
      
      if (i == 0) {
        path.moveTo(x, y);
        fillPath.moveTo(x, size.height);
        fillPath.lineTo(x, y);
      } else {
        path.lineTo(x, y);
        fillPath.lineTo(x, y);
      }
    }
    
    fillPath.lineTo(size.width * progress, size.height);
    fillPath.close();
    
    canvas.drawPath(fillPath, fillPaint);
    canvas.drawPath(path, paint);
  }
  
  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => true;
}