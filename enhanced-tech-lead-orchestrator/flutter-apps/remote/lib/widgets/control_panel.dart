import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../shared/lib/services/appwrite_service.dart';

class ControlPanel extends StatefulWidget {
  const ControlPanel({Key? key}) : super(key: key);

  @override
  State<ControlPanel> createState() => _ControlPanelState();
}

class _ControlPanelState extends State<ControlPanel> 
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final AppwriteService _appwrite = AppwriteService();
  
  // Control states
  bool _isSystemOnline = true;
  double _cpuUsage = 45.0;
  double _memoryUsage = 62.0;
  double _diskUsage = 38.0;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isTablet = size.width > 600;
    
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            // Quick Actions Bar
            Container(
              height: 80,
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: ListView(
                scrollDirection: Axis.horizontal,
                children: [
                  _QuickActionChip(
                    icon: Icons.power_settings_new,
                    label: 'Power',
                    color: _isSystemOnline ? Colors.green : Colors.red,
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      setState(() {
                        _isSystemOnline = !_isSystemOnline;
                      });
                    },
                  ),
                  _QuickActionChip(
                    icon: Icons.refresh,
                    label: 'Restart',
                    color: Colors.orange,
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      _showRestartDialog();
                    },
                  ),
                  _QuickActionChip(
                    icon: Icons.backup,
                    label: 'Backup',
                    color: Colors.blue,
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      _startBackup();
                    },
                  ),
                  _QuickActionChip(
                    icon: Icons.security,
                    label: 'Security',
                    color: Colors.purple,
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      _openSecurityPanel();
                    },
                  ),
                  _QuickActionChip(
                    icon: Icons.terminal,
                    label: 'Terminal',
                    color: Colors.grey,
                    onTap: () {
                      HapticFeedback.mediumImpact();
                      _openTerminal();
                    },
                  ),
                ],
              ),
            ),
            
            // Tab Bar
            Container(
              color: Theme.of(context).colorScheme.surfaceVariant,
              child: TabBar(
                controller: _tabController,
                indicatorSize: TabBarIndicatorSize.label,
                tabs: const [
                  Tab(text: 'System', icon: Icon(Icons.computer)),
                  Tab(text: 'Network', icon: Icon(Icons.wifi)),
                  Tab(text: 'Services', icon: Icon(Icons.apps)),
                ],
              ),
            ),
            
            // Tab Views
            Expanded(
              child: TabBarView(
                controller: _tabController,
                children: [
                  _SystemView(
                    isOnline: _isSystemOnline,
                    cpuUsage: _cpuUsage,
                    memoryUsage: _memoryUsage,
                    diskUsage: _diskUsage,
                  ),
                  const _NetworkView(),
                  const _ServicesView(),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  void _showRestartDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Restart System?'),
        content: const Text('This will restart all services. Continue?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              _performRestart();
            },
            child: const Text('Restart'),
          ),
        ],
      ),
    );
  }
  
  void _performRestart() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('System restart initiated...')),
    );
  }
  
  void _startBackup() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Backup started...')),
    );
  }
  
  void _openSecurityPanel() {
    // Navigate to security screen
  }
  
  void _openTerminal() {
    // Open terminal screen
  }
}

class _QuickActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;
  
  const _QuickActionChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });
  
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(right: 8.0),
      child: ActionChip(
        avatar: Icon(icon, color: color, size: 20),
        label: Text(label),
        onPressed: onTap,
        backgroundColor: color.withOpacity(0.1),
        side: BorderSide(color: color.withOpacity(0.5)),
      ),
    );
  }
}

class _SystemView extends StatelessWidget {
  final bool isOnline;
  final double cpuUsage;
  final double memoryUsage;
  final double diskUsage;
  
  const _SystemView({
    required this.isOnline,
    required this.cpuUsage,
    required this.memoryUsage,
    required this.diskUsage,
  });
  
  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Status Card
          Card(
            child: ListTile(
              leading: Icon(
                Icons.circle,
                color: isOnline ? Colors.green : Colors.red,
                size: 32,
              ),
              title: Text(
                isOnline ? 'System Online' : 'System Offline',
                style: const TextStyle(fontWeight: FontWeight.bold),
              ),
              subtitle: Text(
                isOnline 
                  ? 'All systems operational' 
                  : 'System is currently offline',
              ),
              trailing: Switch(
                value: isOnline,
                onChanged: (value) {
                  // Handle system toggle
                },
              ),
            ),
          ),
          
          const SizedBox(height: 16),
          
          // Resource Usage
          Text(
            'Resource Usage',
            style: Theme.of(context).textTheme.titleLarge,
          ),
          const SizedBox(height: 16),
          
          _ResourceCard(
            title: 'CPU Usage',
            value: cpuUsage,
            color: Colors.blue,
            icon: Icons.memory,
          ),
          
          _ResourceCard(
            title: 'Memory',
            value: memoryUsage,
            color: Colors.green,
            icon: Icons.storage,
          ),
          
          _ResourceCard(
            title: 'Disk Space',
            value: diskUsage,
            color: Colors.orange,
            icon: Icons.folder,
          ),
          
          const SizedBox(height: 16),
          
          // System Info
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'System Information',
                    style: Theme.of(context).textTheme.titleMedium,
                  ),
                  const SizedBox(height: 12),
                  _InfoRow('OS', 'Ubuntu 22.04 LTS'),
                  _InfoRow('Kernel', '5.15.0-91-generic'),
                  _InfoRow('Uptime', '15 days, 3 hours'),
                  _InfoRow('Last Backup', '2 hours ago'),
                  _InfoRow('IP Address', '192.168.1.100'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ResourceCard extends StatelessWidget {
  final String title;
  final double value;
  final Color color;
  final IconData icon;
  
  const _ResourceCard({
    required this.title,
    required this.value,
    required this.color,
    required this.icon,
  });
  
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Text(title, style: const TextStyle(fontWeight: FontWeight.bold)),
                const Spacer(),
                Text('${value.toInt()}%'),
              ],
            ),
            const SizedBox(height: 8),
            ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: value / 100,
                minHeight: 8,
                backgroundColor: color.withOpacity(0.2),
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  
  const _InfoRow(this.label, this.value);
  
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4.0),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: TextStyle(color: Colors.grey.shade600)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }
}

class _NetworkView extends StatelessWidget {
  const _NetworkView();
  
  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Card(
          child: ListTile(
            leading: const Icon(Icons.wifi, color: Colors.green),
            title: const Text('Network Status'),
            subtitle: const Text('Connected - 1 Gbps'),
            trailing: IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: () {},
            ),
          ),
        ),
        const SizedBox(height: 16),
        ...List.generate(5, (index) => Card(
          margin: const EdgeInsets.only(bottom: 8),
          child: ListTile(
            leading: Icon(
              index == 0 ? Icons.router : Icons.devices,
              color: Colors.blue,
            ),
            title: Text('Device ${index + 1}'),
            subtitle: Text('192.168.1.${100 + index}'),
            trailing: const Icon(Icons.check_circle, color: Colors.green),
          ),
        )),
      ],
    );
  }
}

class _ServicesView extends StatelessWidget {
  const _ServicesView();
  
  @override
  Widget build(BuildContext context) {
    final services = [
      {'name': 'Web Server', 'status': 'Running', 'icon': Icons.web},
      {'name': 'Database', 'status': 'Running', 'icon': Icons.storage},
      {'name': 'Cache', 'status': 'Running', 'icon': Icons.cached},
      {'name': 'Queue', 'status': 'Stopped', 'icon': Icons.queue},
      {'name': 'Mail Server', 'status': 'Running', 'icon': Icons.email},
    ];
    
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: services.length,
      itemBuilder: (context, index) {
        final service = services[index];
        final isRunning = service['status'] == 'Running';
        
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: Icon(
              service['icon'] as IconData,
              color: isRunning ? Colors.green : Colors.red,
            ),
            title: Text(service['name'] as String),
            subtitle: Text(service['status'] as String),
            trailing: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                IconButton(
                  icon: Icon(isRunning ? Icons.stop : Icons.play_arrow),
                  onPressed: () {},
                ),
                IconButton(
                  icon: const Icon(Icons.restart_alt),
                  onPressed: () {},
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}