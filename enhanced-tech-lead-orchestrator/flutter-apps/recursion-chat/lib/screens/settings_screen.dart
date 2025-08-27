import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/theme_provider.dart';
import '../providers/auth_provider.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({Key? key}) : super(key: key);

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  bool _pushNotifications = true;
  bool _messageNotifications = true;
  bool _mentionNotifications = true;
  bool _soundEnabled = true;
  bool _vibrationEnabled = true;
  bool _showOnlineStatus = true;
  bool _readReceipts = true;
  double _textSize = 16.0;
  String _language = 'English';
  String _mediaQuality = 'High';

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final themeProvider = Provider.of<ThemeProvider>(context);
    final authProvider = Provider.of<AuthProvider>(context);
    
    return Scaffold(
      backgroundColor: colorScheme.surface,
      appBar: AppBar(
        title: const Text('Settings'),
        backgroundColor: colorScheme.surface,
        elevation: 0,
      ),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Account Section
          _buildSectionHeader('Account', Icons.person_outline),
          _buildAccountSection(colorScheme, authProvider),
          
          const SizedBox(height: 24),
          
          // Appearance Section
          _buildSectionHeader('Appearance', Icons.palette_outlined),
          _buildAppearanceSection(colorScheme, themeProvider),
          
          const SizedBox(height: 24),
          
          // Notifications Section
          _buildSectionHeader('Notifications', Icons.notifications_outlined),
          _buildNotificationsSection(colorScheme),
          
          const SizedBox(height: 24),
          
          // Privacy Section
          _buildSectionHeader('Privacy & Safety', Icons.security_outlined),
          _buildPrivacySection(colorScheme),
          
          const SizedBox(height: 24),
          
          // Media & Storage Section
          _buildSectionHeader('Media & Storage', Icons.storage_outlined),
          _buildMediaSection(colorScheme),
          
          const SizedBox(height: 24),
          
          // Advanced Section
          _buildSectionHeader('Advanced', Icons.settings_outlined),
          _buildAdvancedSection(colorScheme),
          
          const SizedBox(height: 24),
          
          // About Section
          _buildSectionHeader('About', Icons.info_outline),
          _buildAboutSection(colorScheme),
          
          const SizedBox(height: 32),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(
            icon,
            size: 20,
            color: colorScheme.primary,
          ),
          const SizedBox(width: 8),
          Text(
            title,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: colorScheme.primary,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAccountSection(ColorScheme colorScheme, AuthProvider authProvider) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          ListTile(
            leading: CircleAvatar(
              backgroundColor: colorScheme.primary,
              child: Text(
                authProvider.userName.isNotEmpty 
                    ? authProvider.userName[0].toUpperCase()
                    : 'U',
                style: TextStyle(
                  color: colorScheme.onPrimary,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            title: Text(authProvider.userName.isNotEmpty ? authProvider.userName : 'User'),
            subtitle: Text(authProvider.userEmail),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              Navigator.pushNamed(context, '/profile');
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.account_circle_outlined),
            title: const Text('Account Settings'),
            subtitle: const Text('Manage your account preferences'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              Navigator.pushNamed(context, '/profile');
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAppearanceSection(ColorScheme colorScheme, ThemeProvider themeProvider) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          // Theme selection
          ListTile(
            leading: Icon(themeProvider.getThemeIcon()),
            title: const Text('Theme'),
            subtitle: Text('Current: ${themeProvider.getThemeModeDisplayName()}'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showThemeDialog(themeProvider);
            },
          ),
          const Divider(height: 1),
          // Text size
          Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    const Icon(Icons.text_fields),
                    const SizedBox(width: 16),
                    const Expanded(
                      child: Text(
                        'Text Size',
                        style: TextStyle(fontSize: 16),
                      ),
                    ),
                    Text(
                      '${_textSize.round()}px',
                      style: TextStyle(
                        color: colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Slider(
                  value: _textSize,
                  min: 12.0,
                  max: 24.0,
                  divisions: 12,
                  onChanged: (value) {
                    HapticFeedback.selectionClick();
                    setState(() {
                      _textSize = value;
                    });
                  },
                ),
                Text(
                  'Preview: Hello, World!',
                  style: TextStyle(fontSize: _textSize),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotificationsSection(ColorScheme colorScheme) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          SwitchListTile(
            secondary: const Icon(Icons.notifications),
            title: const Text('Push Notifications'),
            subtitle: const Text('Receive notifications when app is closed'),
            value: _pushNotifications,
            onChanged: (value) {
              HapticFeedback.lightImpact();
              setState(() {
                _pushNotifications = value;
              });
            },
          ),
          const Divider(height: 1),
          SwitchListTile(
            secondary: const Icon(Icons.message),
            title: const Text('Message Notifications'),
            subtitle: const Text('Get notified of new messages'),
            value: _messageNotifications,
            onChanged: (value) {
              HapticFeedback.lightImpact();
              setState(() {
                _messageNotifications = value;
              });
            },
          ),
          const Divider(height: 1),
          SwitchListTile(
            secondary: const Icon(Icons.alternate_email),
            title: const Text('Mention Notifications'),
            subtitle: const Text('Get notified when you are mentioned'),
            value: _mentionNotifications,
            onChanged: (value) {
              HapticFeedback.lightImpact();
              setState(() {
                _mentionNotifications = value;
              });
            },
          ),
          const Divider(height: 1),
          SwitchListTile(
            secondary: const Icon(Icons.volume_up),
            title: const Text('Sound'),
            subtitle: const Text('Play sound for notifications'),
            value: _soundEnabled,
            onChanged: (value) {
              HapticFeedback.lightImpact();
              setState(() {
                _soundEnabled = value;
              });
            },
          ),
          const Divider(height: 1),
          SwitchListTile(
            secondary: const Icon(Icons.vibration),
            title: const Text('Vibration'),
            subtitle: const Text('Vibrate for notifications'),
            value: _vibrationEnabled,
            onChanged: (value) {
              HapticFeedback.lightImpact();
              setState(() {
                _vibrationEnabled = value;
              });
            },
          ),
        ],
      ),
    );
  }

  Widget _buildPrivacySection(ColorScheme colorScheme) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          SwitchListTile(
            secondary: const Icon(Icons.visibility),
            title: const Text('Show Online Status'),
            subtitle: const Text('Let others see when you\'re online'),
            value: _showOnlineStatus,
            onChanged: (value) {
              HapticFeedback.lightImpact();
              setState(() {
                _showOnlineStatus = value;
              });
            },
          ),
          const Divider(height: 1),
          SwitchListTile(
            secondary: const Icon(Icons.done_all),
            title: const Text('Read Receipts'),
            subtitle: const Text('Let others know when you\'ve read their messages'),
            value: _readReceipts,
            onChanged: (value) {
              HapticFeedback.lightImpact();
              setState(() {
                _readReceipts = value;
              });
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.block),
            title: const Text('Blocked Users'),
            subtitle: const Text('Manage blocked users'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showBlockedUsers();
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.security),
            title: const Text('Privacy Policy'),
            subtitle: const Text('Read our privacy policy'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showPrivacyPolicy();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildMediaSection(ColorScheme colorScheme) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.high_quality),
            title: const Text('Media Quality'),
            subtitle: Text('Current: $_mediaQuality'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showMediaQualityDialog();
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.download),
            title: const Text('Auto-download'),
            subtitle: const Text('Choose what to download automatically'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showAutoDownloadSettings();
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.storage),
            title: const Text('Storage Usage'),
            subtitle: const Text('See how much storage is being used'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showStorageUsage();
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.clear_all),
            title: const Text('Clear Cache'),
            subtitle: const Text('Free up space by clearing cache'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showClearCacheDialog();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAdvancedSection(ColorScheme colorScheme) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.language),
            title: const Text('Language'),
            subtitle: Text('Current: $_language'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showLanguageDialog();
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.backup),
            title: const Text('Backup & Restore'),
            subtitle: const Text('Backup your chat history'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showBackupOptions();
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.bug_report),
            title: const Text('Report a Bug'),
            subtitle: const Text('Help us improve the app'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showBugReport();
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.science),
            title: const Text('Beta Features'),
            subtitle: const Text('Try experimental features'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showBetaFeatures();
            },
          ),
        ],
      ),
    );
  }

  Widget _buildAboutSection(ColorScheme colorScheme) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          ListTile(
            leading: const Icon(Icons.info),
            title: const Text('App Version'),
            subtitle: const Text('1.0.0 (Build 1)'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showAppInfo();
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.description),
            title: const Text('Terms of Service'),
            subtitle: const Text('Read our terms and conditions'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showTermsOfService();
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.help_outline),
            title: const Text('Help & Support'),
            subtitle: const Text('Get help using the app'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showHelpSupport();
            },
          ),
          const Divider(height: 1),
          ListTile(
            leading: const Icon(Icons.star_outline),
            title: const Text('Rate the App'),
            subtitle: const Text('Share your feedback'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {
              HapticFeedback.lightImpact();
              _showRateApp();
            },
          ),
        ],
      ),
    );
  }

  void _showThemeDialog(ThemeProvider themeProvider) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Choose Theme'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: ThemeMode.values.map((mode) {
            return RadioListTile<ThemeMode>(
              title: Text(_getThemeDisplayName(mode)),
              subtitle: Text(_getThemeDescription(mode)),
              value: mode,
              groupValue: themeProvider.themeMode,
              onChanged: (value) {
                if (value != null) {
                  themeProvider.setThemeMode(value);
                  Navigator.pop(context);
                }
              },
            );
          }).toList(),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
        ],
      ),
    );
  }

  String _getThemeDisplayName(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.light:
        return 'Light';
      case ThemeMode.dark:
        return 'Dark';
      case ThemeMode.system:
        return 'System';
    }
  }

  String _getThemeDescription(ThemeMode mode) {
    switch (mode) {
      case ThemeMode.light:
        return 'Always use light theme';
      case ThemeMode.dark:
        return 'Always use dark theme';
      case ThemeMode.system:
        return 'Follow system setting';
    }
  }

  void _showMediaQualityDialog() {
    final options = ['High', 'Medium', 'Low'];
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Media Quality'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: options.map((option) {
            return RadioListTile<String>(
              title: Text(option),
              value: option,
              groupValue: _mediaQuality,
              onChanged: (value) {
                if (value != null) {
                  setState(() {
                    _mediaQuality = value;
                  });
                  Navigator.pop(context);
                }
              },
            );
          }).toList(),
        ),
      ),
    );
  }

  void _showLanguageDialog() {
    final languages = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Language'),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: languages.length,
            itemBuilder: (context, index) {
              final language = languages[index];
              return RadioListTile<String>(
                title: Text(language),
                value: language,
                groupValue: _language,
                onChanged: (value) {
                  if (value != null) {
                    setState(() {
                      _language = value;
                    });
                    Navigator.pop(context);
                  }
                },
              );
            },
          ),
        ),
      ),
    );
  }

  void _showClearCacheDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Clear Cache'),
        content: const Text('This will delete all cached images and files. Continue?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Cache cleared successfully')),
              );
            },
            child: const Text('Clear'),
          ),
        ],
      ),
    );
  }

  void _showBlockedUsers() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Blocked users feature not implemented')),
    );
  }

  void _showPrivacyPolicy() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Privacy policy not implemented')),
    );
  }

  void _showAutoDownloadSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Auto-download settings not implemented')),
    );
  }

  void _showStorageUsage() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Storage usage not implemented')),
    );
  }

  void _showBackupOptions() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Backup options not implemented')),
    );
  }

  void _showBugReport() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Bug report not implemented')),
    );
  }

  void _showBetaFeatures() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Beta features not implemented')),
    );
  }

  void _showAppInfo() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('App Information'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Version: 1.0.0'),
            Text('Build: 1'),
            Text('Platform: Flutter'),
            SizedBox(height: 16),
            Text('Developer: Recursion Systems'),
            Text('© 2024 All rights reserved'),
          ],
        ),
        actions: [
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  void _showTermsOfService() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Terms of service not implemented')),
    );
  }

  void _showHelpSupport() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Help & support not implemented')),
    );
  }

  void _showRateApp() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Rate app not implemented')),
    );
  }
}