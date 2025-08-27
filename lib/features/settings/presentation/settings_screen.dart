import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:glassmorphism_ui/glassmorphism_ui.dart';
import '../../../core/providers/theme_provider.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen>
    with TickerProviderStateMixin {
  late AnimationController _headerController;
  late AnimationController _listController;

  @override
  void initState() {
    super.initState();
    _headerController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    _listController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _headerController.forward();
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) _listController.forward();
    });
  }

  @override
  void dispose() {
    _headerController.dispose();
    _listController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final themeMode = ref.watch(themeModeProvider);
    final themeModeNotifier = ref.watch(themeModeProvider.notifier);
    
    return Scaffold(
      extendBodyBehindAppBar: false,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              theme.colorScheme.surface,
              theme.colorScheme.surface.withOpacity(0.8),
              theme.colorScheme.primaryContainer.withOpacity(0.1),
            ],
          ),
        ),
        child: SafeArea(
          child: Column(
            children: [
              // Settings Header
              _buildSettingsHeader(context, theme),
              
              // Settings Content
              Expanded(
                child: _buildSettingsList(context, theme, themeMode, themeModeNotifier),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSettingsHeader(BuildContext context, ThemeData theme) {
    return AnimatedBuilder(
      animation: _headerController,
      builder: (context, child) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 20),
          child: Row(
            children: [
              // Settings Icon
              Container(
                width: 50,
                height: 50,
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      theme.colorScheme.primary,
                      theme.colorScheme.secondary,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(25),
                  boxShadow: [
                    BoxShadow(
                      color: theme.colorScheme.primary.withOpacity(0.3),
                      blurRadius: 15,
                      offset: const Offset(0, 5),
                    ),
                  ],
                ),
                child: const Icon(
                  Icons.settings_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              )
                  .animate()
                  .scale(delay: 200.ms)
                  .fadeIn(),
              
              const SizedBox(width: 16),
              
              // Title
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Settings',
                      style: GoogleFonts.poppins(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                    )
                        .animate()
                        .fadeIn(delay: 300.ms)
                        .slideX(begin: -0.2, end: 0),
                    
                    const SizedBox(height: 4),
                    
                    Text(
                      'Customize your chat experience',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    )
                        .animate()
                        .fadeIn(delay: 400.ms)
                        .slideX(begin: -0.2, end: 0),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSettingsList(BuildContext context, ThemeData theme, 
      ThemeMode themeMode, ThemeModeNotifier themeModeNotifier) {
    return AnimatedBuilder(
      animation: _listController,
      builder: (context, child) {
        return ListView(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 20),
          children: [
            // Appearance Section
            _buildSectionHeader(context, theme, 'Appearance', Icons.palette_rounded, 0),
            const SizedBox(height: 12),
            
            _buildThemeSelector(context, theme, themeMode, themeModeNotifier, 1),
            
            const SizedBox(height: 24),
            
            // Chat Section
            _buildSectionHeader(context, theme, 'Chat Settings', Icons.chat_bubble_rounded, 2),
            const SizedBox(height: 12),
            
            _buildSettingsTile(
              context, 
              theme, 
              'Message Search', 
              'Search through your chat history',
              Icons.search_rounded,
              onTap: () => _showFeatureComingSoon('Message Search'),
              index: 3,
            ),
            
            const SizedBox(height: 8),
            
            _buildSettingsTile(
              context, 
              theme, 
              'Export Chats', 
              'Save conversations as text or PDF',
              Icons.download_rounded,
              onTap: () => _showFeatureComingSoon('Chat Export'),
              index: 4,
            ),
            
            const SizedBox(height: 8),
            
            _buildSettingsTile(
              context, 
              theme, 
              'Voice Messages', 
              'Record and send voice messages',
              Icons.mic_rounded,
              onTap: () => _showFeatureComingSoon('Voice Messages'),
              index: 5,
            ),
            
            const SizedBox(height: 8),
            
            _buildSettingsTile(
              context, 
              theme, 
              'Message Reactions', 
              'React to messages with emojis',
              Icons.emoji_emotions_rounded,
              onTap: () => _showFeatureComingSoon('Message Reactions'),
              index: 6,
            ),
            
            const SizedBox(height: 24),
            
            // About Section
            _buildSectionHeader(context, theme, 'About', Icons.info_rounded, 7),
            const SizedBox(height: 12),
            
            _buildSettingsTile(
              context, 
              theme, 
              'Version', 
              'Recursion Chat 1.0.0',
              Icons.smartphone_rounded,
              onTap: null,
              index: 8,
            ),
            
            const SizedBox(height: 8),
            
            _buildSettingsTile(
              context, 
              theme, 
              'Privacy Policy', 
              'Learn about our privacy practices',
              Icons.privacy_tip_rounded,
              onTap: () => _showFeatureComingSoon('Privacy Policy'),
              index: 9,
            ),
            
            const SizedBox(height: 40),
          ],
        );
      },
    );
  }

  Widget _buildSectionHeader(BuildContext context, ThemeData theme, 
      String title, IconData icon, int index) {
    return Row(
      children: [
        Icon(
          icon,
          size: 20,
          color: theme.colorScheme.primary,
        ),
        const SizedBox(width: 8),
        Text(
          title,
          style: GoogleFonts.poppins(
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.primary,
          ),
        ),
      ],
    )
        .animate()
        .fadeIn(delay: (300 + index * 100).ms)
        .slideX(begin: -0.3, end: 0);
  }

  Widget _buildThemeSelector(BuildContext context, ThemeData theme, 
      ThemeMode themeMode, ThemeModeNotifier themeModeNotifier, int index) {
    return GestureDetector(
      onTap: () => _showThemeSelector(context, theme, themeMode, themeModeNotifier),
      child: GlassContainer(
        blur: 8,
        color: theme.colorScheme.surface.withOpacity(0.8),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(
                  themeModeNotifier.themeModeIcon,
                  color: theme.colorScheme.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Theme',
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      'Current: ${themeModeNotifier.themeModeDisplayName}',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
              Icon(
                Icons.chevron_right_rounded,
                color: theme.colorScheme.onSurface.withOpacity(0.5),
              ),
            ],
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: (300 + index * 100).ms)
        .slideX(begin: -0.3, end: 0);
  }

  Widget _buildSettingsTile(BuildContext context, ThemeData theme, String title, 
      String subtitle, IconData icon, {VoidCallback? onTap, required int index}) {
    return GestureDetector(
      onTap: onTap,
      child: GlassContainer(
        blur: 8,
        color: theme.colorScheme.surface.withOpacity(0.8),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primaryContainer,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(
                  icon,
                  color: theme.colorScheme.primary,
                  size: 20,
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      title,
                      style: GoogleFonts.poppins(
                        fontSize: 16,
                        fontWeight: FontWeight.w600,
                        color: theme.colorScheme.onSurface,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ),
              if (onTap != null)
                Icon(
                  Icons.chevron_right_rounded,
                  color: theme.colorScheme.onSurface.withOpacity(0.5),
                ),
            ],
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: (300 + index * 100).ms)
        .slideX(begin: -0.3, end: 0);
  }

  void _showThemeSelector(BuildContext context, ThemeData theme, 
      ThemeMode currentMode, ThemeModeNotifier themeModeNotifier) {
    HapticFeedback.lightImpact();
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => GlassContainer(
        height: 280,
        width: double.infinity,
        blur: 20,
        color: theme.colorScheme.surface.withOpacity(0.95),
        borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 48,
                  height: 4,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.outline.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Title
              Text(
                'Choose Theme',
                style: GoogleFonts.poppins(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 20),
              
              // Theme Options
              ...ThemeMode.values.map((themeMode) {
                final isSelected = currentMode == themeMode;
                return GestureDetector(
                  onTap: () {
                    themeModeNotifier.setThemeMode(themeMode);
                    Navigator.pop(context);
                    HapticFeedback.selectionClick();
                  },
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 12),
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: isSelected 
                          ? theme.colorScheme.primaryContainer.withOpacity(0.3)
                          : theme.colorScheme.surface.withOpacity(0.3),
                      borderRadius: BorderRadius.circular(16),
                      border: isSelected
                          ? Border.all(color: theme.colorScheme.primary, width: 2)
                          : null,
                    ),
                    child: Row(
                      children: [
                        Icon(
                          _getThemeModeIcon(themeMode),
                          color: isSelected 
                              ? theme.colorScheme.primary 
                              : theme.colorScheme.onSurface,
                        ),
                        const SizedBox(width: 16),
                        Text(
                          _getThemeModeDisplayName(themeMode),
                          style: GoogleFonts.poppins(
                            fontSize: 16,
                            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
                            color: isSelected 
                                ? theme.colorScheme.primary 
                                : theme.colorScheme.onSurface,
                          ),
                        ),
                        const Spacer(),
                        if (isSelected)
                          Icon(
                            Icons.check_circle_rounded,
                            color: theme.colorScheme.primary,
                          ),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ],
          ),
        ),
      )
          .animate()
          .slideY(begin: 1.0, end: 0.0)
          .fadeIn(),
    );
  }

  IconData _getThemeModeIcon(ThemeMode themeMode) {
    switch (themeMode) {
      case ThemeMode.light:
        return Icons.light_mode_rounded;
      case ThemeMode.dark:
        return Icons.dark_mode_rounded;
      case ThemeMode.system:
        return Icons.brightness_auto_rounded;
    }
  }

  String _getThemeModeDisplayName(ThemeMode themeMode) {
    switch (themeMode) {
      case ThemeMode.light:
        return 'Light';
      case ThemeMode.dark:
        return 'Dark';
      case ThemeMode.system:
        return 'System';
    }
  }

  void _showFeatureComingSoon(String feature) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$feature coming soon! 🚀'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(10),
        ),
      ),
    );
  }
}