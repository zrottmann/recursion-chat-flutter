import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../widgets/control_panel.dart';
import '../widgets/chat_widget.dart';
import '../widgets/status_widget.dart';
import '../../shared/lib/services/appwrite_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  int _selectedIndex = 0;
  final AppwriteService _appwrite = AppwriteService();
  
  final List<Widget> _pages = [
    const ControlPanel(),
    const ChatWidget(),
    const StatusWidget(),
  ];
  
  final List<NavigationDestination> _destinations = const [
    NavigationDestination(
      icon: Icon(Icons.dashboard),
      selectedIcon: Icon(Icons.dashboard_outlined),
      label: 'Control',
    ),
    NavigationDestination(
      icon: Icon(Icons.chat_bubble_outline),
      selectedIcon: Icon(Icons.chat_bubble),
      label: 'Chat',
    ),
    NavigationDestination(
      icon: Icon(Icons.analytics_outlined),
      selectedIcon: Icon(Icons.analytics),
      label: 'Status',
    ),
  ];
  
  @override
  Widget build(BuildContext context) {
    final isTablet = MediaQuery.of(context).size.width > 600;
    
    return Scaffold(
      appBar: AppBar(
        title: const Text('Remote Control'),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              // Show notifications
            },
          ),
          PopupMenuButton(
            icon: const CircleAvatar(
              child: Icon(Icons.person),
            ),
            itemBuilder: (context) => [
              PopupMenuItem(
                child: ListTile(
                  leading: const Icon(Icons.person),
                  title: Text(_appwrite.currentUserName ?? 'User'),
                  subtitle: Text(_appwrite.currentUserEmail ?? ''),
                ),
              ),
              const PopupMenuDivider(),
              PopupMenuItem(
                child: const ListTile(
                  leading: Icon(Icons.settings),
                  title: Text('Settings'),
                ),
                onTap: () {
                  // Navigate to settings
                },
              ),
              PopupMenuItem(
                child: const ListTile(
                  leading: Icon(Icons.logout),
                  title: Text('Logout'),
                ),
                onTap: () async {
                  await _appwrite.logout();
                  if (mounted) {
                    Navigator.of(context).pushReplacementNamed('/auth');
                  }
                },
              ),
            ],
          ),
        ],
      ),
      body: SafeArea(
        child: isTablet
            ? Row(
                children: [
                  NavigationRail(
                    selectedIndex: _selectedIndex,
                    onDestinationSelected: (index) {
                      setState(() {
                        _selectedIndex = index;
                      });
                    },
                    extended: MediaQuery.of(context).size.width > 800,
                    destinations: _destinations.map((dest) {
                      return NavigationRailDestination(
                        icon: dest.icon,
                        selectedIcon: dest.selectedIcon,
                        label: Text(dest.label),
                      );
                    }).toList(),
                  ),
                  const VerticalDivider(thickness: 1, width: 1),
                  Expanded(
                    child: _pages[_selectedIndex],
                  ),
                ],
              )
            : _pages[_selectedIndex],
      ),
      bottomNavigationBar: isTablet
          ? null
          : NavigationBar(
              selectedIndex: _selectedIndex,
              onDestinationSelected: (index) {
                setState(() {
                  _selectedIndex = index;
                });
              },
              destinations: _destinations,
            ),
    );
  }
}