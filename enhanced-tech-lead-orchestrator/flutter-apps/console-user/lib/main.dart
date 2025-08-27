import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'screens/dashboard_screen.dart';
import 'screens/auth_screen.dart';
import 'screens/splash_screen.dart';
import 'screens/projects_screen.dart';
import 'screens/functions_screen.dart';
import 'screens/databases_screen.dart';
import 'screens/storage_screen.dart';
import 'screens/api_keys_screen.dart';
import 'screens/usage_screen.dart';
import 'screens/settings_screen.dart';
import 'providers/user_provider.dart';
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
      systemNavigationBarColor: Colors.transparent,
      systemNavigationBarIconBrightness: Brightness.dark,
    ),
  );
  
  // Set preferred orientations for mobile
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.portraitDown,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  
  AppwriteService().initialize();
  runApp(const ConsoleUserApp());
}

class ConsoleUserApp extends StatelessWidget {
  const ConsoleUserApp({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: Consumer<ThemeProvider>(
        builder: (context, themeProvider, child) {
          return MaterialApp(
            title: 'Console User',
            debugShowCheckedModeBanner: false,
            theme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.blue,
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
              bottomNavigationBarTheme: BottomNavigationBarThemeData(
                type: BottomNavigationBarType.fixed,
                elevation: 8,
                backgroundColor: Colors.white,
                selectedItemColor: Colors.blue,
                unselectedItemColor: Colors.grey[600],
              ),
            ),
            darkTheme: ThemeData(
              useMaterial3: true,
              colorScheme: ColorScheme.fromSeed(
                seedColor: Colors.blue,
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
              bottomNavigationBarTheme: BottomNavigationBarThemeData(
                type: BottomNavigationBarType.fixed,
                elevation: 8,
                backgroundColor: Colors.grey[900],
                selectedItemColor: Colors.blue,
                unselectedItemColor: Colors.grey[400],
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
  bool _isAuthenticated = false;
  String? _error;
  late AnimationController _animationController;
  late Animation<double> _fadeAnimation;
  
  final List<Widget> _pages = [
    const DashboardScreen(),
    const ProjectsScreen(),
    const FunctionsScreen(),
    const DatabasesScreen(),
    const StorageScreen(),
    const ApiKeysScreen(),
    const UsageScreen(),
    const SettingsScreen(),
  ];
  
  final List<NavigationDestination> _destinations = const [
    NavigationDestination(
      icon: Icon(Icons.dashboard_outlined),
      selectedIcon: Icon(Icons.dashboard),
      label: 'Dashboard',
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
      icon: Icon(Icons.key_outlined),
      selectedIcon: Icon(Icons.key),
      label: 'API Keys',
    ),
    NavigationDestination(
      icon: Icon(Icons.analytics_outlined),
      selectedIcon: Icon(Icons.analytics),
      label: 'Usage',
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
    _checkAuthentication();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }
  
  Future<void> _checkAuthentication() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });
      
      // Check authentication status
      final isAuth = await AppwriteService().isAuthenticated();
      if (!isAuth) {
        if (mounted) {
          Navigator.of(context).pushReplacement(
            MaterialPageRoute(builder: (_) => const AuthScreen()),
          );
        }
        return;
      }
      
      // Load user data
      await context.read<UserProvider>().loadUserData();
      
      setState(() {
        _isAuthenticated = true;
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
        _error = 'Failed to authenticate: ${e.toString()}';
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
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          title: const Text('Logout'),
          content: const Text('Are you sure you want to logout?'),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () => Navigator.of(context).pop(true),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
              ),
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
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
        );
      }
    }
  }

  Future<void> _showProfileBottomSheet() async {
    await HapticFeedback.lightImpact();
    
    if (!mounted) return;
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        final colorScheme = Theme.of(context).colorScheme;
        final userProvider = context.read<UserProvider>();
        
        return DraggableScrollableSheet(
          expand: false,
          initialChildSize: 0.5,
          minChildSize: 0.3,
          maxChildSize: 0.9,
          builder: (context, scrollController) {
            return Container(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  // Handle bar
                  Container(
                    width: 40,
                    height: 4,
                    margin: const EdgeInsets.only(bottom: 20),
                    decoration: BoxDecoration(
                      color: colorScheme.onSurface.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(2),
                    ),
                  ),
                  
                  // Profile header
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 30,
                        backgroundColor: colorScheme.primary,
                        child: Text(
                          (userProvider.user?.name?.substring(0, 1).toUpperCase() ?? 'U'),
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: colorScheme.onPrimary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              userProvider.user?.name ?? 'User',
                              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Text(
                              userProvider.user?.email ?? '',
                              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                                color: colorScheme.onSurface.withOpacity(0.7),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 24),
                  
                  // Profile options
                  Expanded(
                    child: ListView(
                      controller: scrollController,
                      children: [
                        _buildProfileOption(
                          icon: Icons.person_outline,
                          title: 'Edit Profile',
                          onTap: () {
                            Navigator.pop(context);
                            // TODO: Navigate to profile edit
                          },
                        ),
                        _buildProfileOption(
                          icon: Icons.security_outlined,
                          title: 'Security',
                          onTap: () {
                            Navigator.pop(context);
                            // TODO: Navigate to security settings
                          },
                        ),
                        _buildProfileOption(
                          icon: Icons.notifications_outlined,
                          title: 'Notifications',
                          onTap: () {
                            Navigator.pop(context);
                            // TODO: Navigate to notifications
                          },
                        ),
                        _buildProfileOption(
                          icon: Icons.help_outline,
                          title: 'Help & Support',
                          onTap: () {
                            Navigator.pop(context);
                            // TODO: Navigate to help
                          },
                        ),
                        const Divider(height: 32),
                        _buildProfileOption(
                          icon: Icons.logout,
                          title: 'Logout',
                          textColor: Colors.red,
                          onTap: () {
                            Navigator.pop(context);
                            _handleLogout();
                          },
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildProfileOption({
    required IconData icon,
    required String title,
    required VoidCallback onTap,
    Color? textColor,
  }) {
    return ListTile(
      leading: Icon(icon, color: textColor),
      title: Text(
        title,
        style: TextStyle(color: textColor),
      ),
      trailing: const Icon(Icons.arrow_forward_ios, size: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      onTap: onTap,
    );
  }
  
  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final isTablet = MediaQuery.of(context).size.width > 600;
    final isDesktop = MediaQuery.of(context).size.width > 1200;
    
    if (_isLoading) {
      return Scaffold(
        backgroundColor: colorScheme.background,
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
                'Loading your console...',
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
        backgroundColor: colorScheme.background,
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
                  'Authentication Failed',
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
    
    if (!_isAuthenticated) {
      return const AuthScreen();
    }
    
    return FadeTransition(
      opacity: _fadeAnimation,
      child: Scaffold(
        backgroundColor: colorScheme.background,
        appBar: isDesktop ? null : AppBar(
          title: Row(
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [colorScheme.primary, colorScheme.secondary],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.developer_board,
                  size: 20,
                  color: colorScheme.onPrimary,
                ),
              ),
              const SizedBox(width: 12),
              const Text('Console'),
            ],
          ),
          backgroundColor: colorScheme.surface,
          foregroundColor: colorScheme.onSurface,
          elevation: 0,
          scrolledUnderElevation: 4,
          actions: [
            IconButton(
              icon: Badge(
                isLabelVisible: true,
                label: const Text('2'),
                backgroundColor: colorScheme.error,
                child: const Icon(Icons.notifications_outlined),
              ),
              onPressed: () async {
                await HapticFeedback.lightImpact();
                // TODO: Show notifications
              },
            ),
            const SizedBox(width: 8),
            GestureDetector(
              onTap: _showProfileBottomSheet,
              child: Consumer<UserProvider>(
                builder: (context, userProvider, child) {
                  return CircleAvatar(
                    radius: 18,
                    backgroundColor: colorScheme.primary,
                    child: Text(
                      (userProvider.user?.name?.substring(0, 1).toUpperCase() ?? 'U'),
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                        color: colorScheme.onPrimary,
                      ),
                    ),
                  );
                },
              ),
            ),
            const SizedBox(width: 16),
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
                                gradient: LinearGradient(
                                  colors: [colorScheme.primary, colorScheme.secondary],
                                  begin: Alignment.topLeft,
                                  end: Alignment.bottomRight,
                                ),
                                shape: BoxShape.circle,
                              ),
                              child: Icon(
                                Icons.developer_board,
                                color: colorScheme.onPrimary,
                                size: 24,
                              ),
                            ),
                            const SizedBox(height: 12),
                            Text(
                              'Console',
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
                            gradient: LinearGradient(
                              colors: [colorScheme.primary, colorScheme.secondary],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.developer_board,
                            color: colorScheme.onPrimary,
                            size: 20,
                          ),
                        ),
                      ),
                destinations: _destinations.take(6).map((dest) => NavigationRailDestination(
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
                height: 80,
                labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
                destinations: _destinations.take(5).toList(), // Show only 5 on mobile
              ),
      ),
    );
  }
}