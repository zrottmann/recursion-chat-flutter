import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'screens/dashboard_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/users_screen.dart';
import 'screens/projects_screen.dart';
import 'screens/functions_screen.dart';
import 'screens/databases_screen.dart';
import 'screens/storage_screen.dart';
import 'screens/settings_screen.dart';
import 'providers/admin_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/theme_provider.dart';
import '../shared/lib/services/appwrite_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Set system UI overlay style for mobile
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
      statusBarBrightness: Brightness.light,
    ),
  );
  
  AppwriteService().initialize();
  runApp(const ConsoleAdminApp());
}

class ConsoleAdminApp extends StatelessWidget {
  const ConsoleAdminApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => AdminProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            title: 'Console Admin',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.indigo,
                brightness: Brightness.light,
              ),
              cardTheme: CardTheme(
                elevation: 2,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              inputDecorationTheme: InputDecorationTheme(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
              ),
            ),
            darkTheme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.indigo,
                brightness: Brightness.dark,
              ),
              cardTheme: CardTheme(
                elevation: 4,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16),
                ),
              ),
              elevatedButtonTheme: ElevatedButtonThemeData(
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              inputDecorationTheme: InputDecorationTheme(
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
              ),
            ),
            themeMode: themeProvider.themeMode,
            home: const SplashScreen(),
          );
        },
      ),
    );
  }
}

class MainScreen extends StatefulWidget {
  const MainScreen({Key? key}) : super(key: key);

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> with TickerProviderStateMixin {
  int _selectedIndex = 0;
  bool _isLoading = true;
  bool _isAdmin = false;
  String? _error;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  
  final List<Widget> _pages = [
    const DashboardScreen(),
    const UsersScreen(),
    const ProjectsScreen(),
    const FunctionsScreen(),
    const DatabasesScreen(),
    const StorageScreen(),
    const SettingsScreen(),
  ];
  
  final List<NavigationDestination> _destinations = const [
    NavigationDestination(
      icon: Icon(Icons.dashboard_outlined),
      selectedIcon: Icon(Icons.dashboard),
      label: 'Dashboard',
    ),
    NavigationDestination(
      icon: Icon(Icons.people_outline),
      selectedIcon: Icon(Icons.people),
      label: 'Users',
    ),
    NavigationDestination(
      icon: Icon(Icons.folder_outlined),
      selectedIcon: Icon(Icons.folder),
      label: 'Projects',
    ),
    NavigationDestination(
      icon: Icon(Icons.functions_outlined),
      selectedIcon: Icon(Icons.functions),
      label: 'Functions',
    ),
    NavigationDestination(
      icon: Icon(Icons.storage_outlined),
      selectedIcon: Icon(Icons.storage),
      label: 'Databases',
    ),
    NavigationDestination(
      icon: Icon(Icons.cloud_outlined),
      selectedIcon: Icon(Icons.cloud),
      label: 'Storage',
    ),
    NavigationDestination(
      icon: Icon(Icons.settings_outlined),
      selectedIcon: Icon(Icons.settings),
      label: 'Settings',
    ),
  ];
  
  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
    _checkAuthAndAdminStatus();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  Future<void> _checkAuthAndAdminStatus() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });
      
      // Check authentication first
      final isAuth = await AppwriteService().isAuthenticated();
      if (!isAuth) {
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const AuthScreen()),
          );
        }
        return;
      }
      
      // Check admin privileges
      final currentUser = await AppwriteService().getCurrentUser();
      final isAdminUser = currentUser?['labels']?.contains('admin') ?? false;
      
      if (!isAdminUser) {
        setState(() {
          _error = 'Access denied. Admin privileges required.';
          _isLoading = false;
        });
        return;
      }
      
      setState(() {
        _isAdmin = true;
        _isLoading = false;
      });
      
      // Start fade in animation
      _animationController.forward();
      
      // Provide haptic feedback
      if (context.mounted) {
        await HapticFeedback.lightImpact();
      }
      
    } catch (e) {
      setState(() {
        _error = 'Failed to verify admin access: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  Future<void> _handleLogout() async {
    try {
      // Show confirmation dialog
      final shouldLogout = await showDialog<bool>(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Logout'),
          content: const Text('Are you sure you want to logout?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              child: const Text('Logout'),
            ),
          ],
        ),
      );
      
      if (shouldLogout == true && mounted) {
        await HapticFeedback.lightImpact();
        await AppwriteService().logout();
        
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const AuthScreen()),
          );
        }
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Logout failed: ${e.toString()}'),
            backgroundColor: Theme.of(context).colorScheme.error,
          ),
        );
      }
    }
  }
  
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isTablet = MediaQuery.of(context).size.width > 600;
    final isDesktop = MediaQuery.of(context).size.width > 1200;
    
    if (_isLoading) {
      return Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              SizedBox(
                width: 64,
                height: 64,
                child: CircularProgressIndicator(
                  strokeWidth: 3,
                  color: colorScheme.primary,
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Verifying admin access...',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: colorScheme.onSurface.withOpacity(0.7),
                ),
              ),
            ],
          ),
        ),
      );
    }
    
    if (_error != null) {
      return Scaffold(
        body: Center(
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.error_outline,
                  size: 64,
                  color: colorScheme.error,
                ),
                const SizedBox(height: 24),
                Text(
                  'Access Denied',
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    color: colorScheme.error,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  _error!,
                  textAlign: TextAlign.center,
                  style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                    color: colorScheme.onSurface.withOpacity(0.7),
                  ),
                ),
                const SizedBox(height: 32),
                ElevatedButton.icon(
                  onPressed: () {
                    Navigator.of(context).pushReplacement(
                      MaterialPageRoute(builder: (_) => const AuthScreen()),
                    );
                  },
                  icon: const Icon(Icons.arrow_back),
                  label: const Text('Back to Login'),
                ),
              ],
            ),
          ),
        ),
      );
    }
    
    if (!_isAdmin) {
      return const Scaffold(
        body: Center(
          child: Text('Unauthorized access'),
        ),
      );
    }
    
    return FadeTransition(
      opacity: _fadeAnimation,
      child: Scaffold(
        appBar: isDesktop ? null : AppBar(
          title: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: colorScheme.primary,
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.admin_panel_settings,
                  size: 20,
                  color: colorScheme.onPrimary,
                ),
              ),
              const SizedBox(width: 12),
              const Text('Console Admin'),
            ],
          ),
          backgroundColor: colorScheme.surface,
          foregroundColor: colorScheme.onSurface,
          elevation: 0,
          actions: [
            IconButton(
              icon: Badge(
                backgroundColor: colorScheme.error,
                child: const Icon(Icons.notifications_outlined),
              ),
              onPressed: () async {
                await HapticFeedback.lightImpact();
                // TODO: Show notifications
              },
            ),
            PopupMenuButton(
              icon: CircleAvatar(
                backgroundColor: colorScheme.primary,
                child: Icon(
                  Icons.person,
                  color: colorScheme.onPrimary,
                  size: 20,
                ),
              ),
              offset: const Offset(0, 50),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(16),
              ),
              itemBuilder: (context) => [
                PopupMenuItem(
                  enabled: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        AppwriteService().currentUserName ?? 'Admin',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        AppwriteService().currentUserEmail ?? '',
                        style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: colorScheme.onSurface.withOpacity(0.6),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: colorScheme.primary.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              Icons.admin_panel_settings,
                              size: 14,
                              color: colorScheme.primary,
                            ),
                            const SizedBox(width: 4),
                            Text(
                              'Admin',
                              style: Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: colorScheme.primary,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                const PopupMenuDivider(),
                PopupMenuItem(
                  child: const ListTile(
                    leading: Icon(Icons.person_outline),
                    title: Text('Profile'),
                    contentPadding: EdgeInsets.zero,
                  ),
                  onTap: () async {
                    await HapticFeedback.lightImpact();
                    // TODO: Navigate to profile
                  },
                ),
                PopupMenuItem(
                  child: const ListTile(
                    leading: Icon(Icons.logout, color: Colors.red),
                    title: Text('Logout', style: TextStyle(color: Colors.red)),
                    contentPadding: EdgeInsets.zero,
                  ),
                  onTap: _handleLogout,
                ),
              ],
            ),
            const SizedBox(width: 8),
          ],
        ),
        body: Row(
          children: [
            if (isTablet || isDesktop)
              NavigationRail(
                extended: isDesktop,
                selectedIndex: _selectedIndex,
                onDestinationSelected: (index) async {
                  await HapticFeedback.selectionClick();
                  setState(() {
                    _selectedIndex = index;
                  });
                },
                backgroundColor: colorScheme.surface,
                leading: isDesktop
                    ? Padding(
                        padding: const EdgeInsets.all(16.0),
                        child: Column(
                          children: [
                            Container(
                              width: 48,
                              height: 48,
                              decoration: BoxDecoration(
                                color: colorScheme.primary,
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.admin_panel_settings,
                                color: colorScheme.onPrimary,
                                size: 24,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Console Admin',
                              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ],
                        ),
                      )
                    : Padding(
                        padding: const EdgeInsets.all(8.0),
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            color: colorScheme.primary,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.admin_panel_settings,
                            color: colorScheme.onPrimary,
                            size: 20,
                          ),
                        ),
                      ),
                destinations: _destinations.take(7).map((dest) => NavigationRailDestination(
                  icon: dest.icon,
                  selectedIcon: dest.selectedIcon,
                  label: dest.label,
                )).toList(),
              ),
            if (isTablet || isDesktop)
              VerticalDivider(
                thickness: 1,
                width: 1,
                color: colorScheme.outlineVariant,
              ),
            Expanded(
              child: AnimatedSwitcher(
                duration: const Duration(milliseconds: 300),
                transitionBuilder: (child, animation) {
                  return FadeTransition(
                    opacity: animation,
                    child: SlideTransition(
                      position: Tween<Offset>(
                        begin: const Offset(0.05, 0),
                        end: Offset.zero,
                      ).animate(animation),
                      child: child,
                    ),
                  );
                },
                child: Container(
                  key: ValueKey(_selectedIndex),
                  child: _pages[_selectedIndex],
                ),
              ),
            ),
          ],
        ),
        bottomNavigationBar: isTablet || isDesktop
            ? null
            : NavigationBar(
                selectedIndex: _selectedIndex,
                onDestinationSelected: (index) async {
                  await HapticFeedback.selectionClick();
                  setState(() {
                    _selectedIndex = index;
                  });
                },
                backgroundColor: colorScheme.surface,
                indicatorColor: colorScheme.primary.withOpacity(0.1),
                destinations: _destinations.take(5).toList(), // Show only 5 on mobile
              ),
      ),
    );
  }
}