import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({Key? key}) : super(key: key);

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  bool _isEditing = false;
  bool _isChangingPassword = false;
  bool _obscureCurrentPassword = true;
  bool _obscureNewPassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void initState() {
    super.initState();
    _loadUserData();
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _loadUserData() {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    _nameController.text = authProvider.userName;
    _emailController.text = authProvider.userEmail;
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final authProvider = Provider.of<AuthProvider>(context);
    
    return Scaffold(
      backgroundColor: colorScheme.surface,
      appBar: AppBar(
        title: const Text('Profile'),
        backgroundColor: colorScheme.surface,
        elevation: 0,
        actions: [
          if (_isEditing)
            IconButton(
              onPressed: _handleSave,
              icon: const Icon(Icons.check),
              tooltip: 'Save Changes',
            )
          else
            IconButton(
              onPressed: () {
                HapticFeedback.lightImpact();
                setState(() {
                  _isEditing = true;
                });
              },
              icon: const Icon(Icons.edit),
              tooltip: 'Edit Profile',
            ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            // Profile Header
            _buildProfileHeader(colorScheme, authProvider),
            
            const SizedBox(height: 32),
            
            // Profile Form
            _buildProfileForm(colorScheme, authProvider),
            
            const SizedBox(height: 32),
            
            // Password Change Section
            _buildPasswordSection(colorScheme, authProvider),
            
            const SizedBox(height: 32),
            
            // Account Actions
            _buildAccountActions(colorScheme, authProvider),
          ],
        ),
      ),
    );
  }

  Widget _buildProfileHeader(ColorScheme colorScheme, AuthProvider authProvider) {
    return Column(
      children: [
        // Avatar
        Stack(
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: colorScheme.primary,
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: colorScheme.primary.withOpacity(0.3),
                    blurRadius: 15,
                    spreadRadius: 3,
                  ),
                ],
              ),
              child: Center(
                child: Text(
                  authProvider.userName.isNotEmpty
                      ? authProvider.userName[0].toUpperCase()
                      : 'U',
                  style: TextStyle(
                    fontSize: 48,
                    fontWeight: FontWeight.bold,
                    color: colorScheme.onPrimary,
                  ),
                ),
              ),
            ),
            if (_isEditing)
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  decoration: BoxDecoration(
                    color: colorScheme.secondary,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: colorScheme.surface,
                      width: 2,
                    ),
                  ),
                  child: IconButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      _showAvatarOptions();
                    },
                    icon: Icon(
                      Icons.camera_alt,
                      color: colorScheme.onSecondary,
                      size: 20,
                    ),
                  ),
                ),
              ),
          ],
        ),
        
        const SizedBox(height: 16),
        
        // User Info
        Text(
          authProvider.userName.isNotEmpty ? authProvider.userName : 'User',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        
        const SizedBox(height: 4),
        
        Text(
          authProvider.userEmail,
          style: TextStyle(
            fontSize: 16,
            color: colorScheme.onSurface.withOpacity(0.7),
          ),
        ),
        
        const SizedBox(height: 8),
        
        // Status Badge
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
          decoration: BoxDecoration(
            color: Colors.green.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 8,
                height: 8,
                decoration: const BoxDecoration(
                  color: Colors.green,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 6),
              const Text(
                'Online',
                style: TextStyle(
                  color: Colors.green,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildProfileForm(ColorScheme colorScheme, AuthProvider authProvider) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Profile Information',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                  color: colorScheme.onSurface,
                ),
              ),
              
              const SizedBox(height: 20),
              
              // Name field
              TextFormField(
                controller: _nameController,
                enabled: _isEditing,
                decoration: InputDecoration(
                  labelText: 'Display Name',
                  prefixIcon: const Icon(Icons.person_outline),
                  border: _isEditing ? null : InputBorder.none,
                  filled: !_isEditing,
                  fillColor: _isEditing ? null : colorScheme.surfaceVariant.withOpacity(0.3),
                ),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Display name is required';
                  }
                  if (value.trim().length < 2) {
                    return 'Display name must be at least 2 characters';
                  }
                  return null;
                },
              ),
              
              const SizedBox(height: 16),
              
              // Email field
              TextFormField(
                controller: _emailController,
                enabled: _isEditing,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  labelText: 'Email',
                  prefixIcon: const Icon(Icons.email_outlined),
                  border: _isEditing ? null : InputBorder.none,
                  filled: !_isEditing,
                  fillColor: _isEditing ? null : colorScheme.surfaceVariant.withOpacity(0.3),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Email is required';
                  }
                  if (!RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$').hasMatch(value)) {
                    return 'Enter a valid email';
                  }
                  return null;
                },
              ),
              
              if (_isEditing) ...[
                const SizedBox(height: 20),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: _handleCancel,
                        child: const Text('Cancel'),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: FilledButton(
                        onPressed: authProvider.isLoading ? null : _handleSave,
                        child: authProvider.isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                                ),
                              )
                            : const Text('Save'),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPasswordSection(ColorScheme colorScheme, AuthProvider authProvider) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    'Password & Security',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      color: colorScheme.onSurface,
                    ),
                  ),
                ),
                if (!_isChangingPassword)
                  TextButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      setState(() {
                        _isChangingPassword = true;
                      });
                    },
                    child: const Text('Change Password'),
                  ),
              ],
            ),
            
            if (_isChangingPassword) ...[
              const SizedBox(height: 20),
              
              // Current password
              TextFormField(
                controller: _currentPasswordController,
                obscureText: _obscureCurrentPassword,
                decoration: InputDecoration(
                  labelText: 'Current Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      setState(() {
                        _obscureCurrentPassword = !_obscureCurrentPassword;
                      });
                    },
                    icon: Icon(
                      _obscureCurrentPassword 
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // New password
              TextFormField(
                controller: _newPasswordController,
                obscureText: _obscureNewPassword,
                decoration: InputDecoration(
                  labelText: 'New Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      setState(() {
                        _obscureNewPassword = !_obscureNewPassword;
                      });
                    },
                    icon: Icon(
                      _obscureNewPassword 
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 16),
              
              // Confirm password
              TextFormField(
                controller: _confirmPasswordController,
                obscureText: _obscureConfirmPassword,
                decoration: InputDecoration(
                  labelText: 'Confirm New Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      setState(() {
                        _obscureConfirmPassword = !_obscureConfirmPassword;
                      });
                    },
                    icon: Icon(
                      _obscureConfirmPassword 
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 20),
              
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      onPressed: () {
                        _currentPasswordController.clear();
                        _newPasswordController.clear();
                        _confirmPasswordController.clear();
                        setState(() {
                          _isChangingPassword = false;
                        });
                      },
                      child: const Text('Cancel'),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: FilledButton(
                      onPressed: authProvider.isLoading ? null : _handlePasswordChange,
                      child: authProvider.isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(
                                strokeWidth: 2,
                                valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                              ),
                            )
                          : const Text('Update Password'),
                    ),
                  ),
                ],
              ),
            ] else ...[
              const SizedBox(height: 12),
              Text(
                'Your password was last updated recently',
                style: TextStyle(
                  color: colorScheme.onSurface.withOpacity(0.7),
                  fontSize: 14,
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildAccountActions(ColorScheme colorScheme, AuthProvider authProvider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Preferences
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              ListTile(
                leading: const Icon(Icons.notifications_outlined),
                title: const Text('Notifications'),
                subtitle: const Text('Manage notification preferences'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  HapticFeedback.lightImpact();
                  _showNotificationSettings();
                },
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.privacy_tip_outlined),
                title: const Text('Privacy & Safety'),
                subtitle: const Text('Control your privacy settings'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  HapticFeedback.lightImpact();
                  _showPrivacySettings();
                },
              ),
              const Divider(height: 1),
              ListTile(
                leading: const Icon(Icons.storage_outlined),
                title: const Text('Data & Storage'),
                subtitle: const Text('Manage your data and storage'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  HapticFeedback.lightImpact();
                  _showDataSettings();
                },
              ),
            ],
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Danger Zone
        Card(
          elevation: 2,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          child: Column(
            children: [
              ListTile(
                leading: Icon(Icons.logout, color: colorScheme.error),
                title: Text(
                  'Sign Out',
                  style: TextStyle(color: colorScheme.error),
                ),
                subtitle: const Text('Sign out of your account'),
                onTap: _showLogoutDialog,
              ),
              const Divider(height: 1),
              ListTile(
                leading: Icon(Icons.delete_forever, color: colorScheme.error),
                title: Text(
                  'Delete Account',
                  style: TextStyle(color: colorScheme.error),
                ),
                subtitle: const Text('Permanently delete your account'),
                onTap: _showDeleteAccountDialog,
              ),
            ],
          ),
        ),
      ],
    );
  }

  void _handleSave() async {
    HapticFeedback.lightImpact();
    
    if (!_formKey.currentState!.validate()) {
      HapticFeedback.mediumImpact();
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.updateProfile(
      name: _nameController.text.trim(),
      email: _emailController.text.trim(),
    );

    if (success && mounted) {
      HapticFeedback.heavyImpact();
      setState(() {
        _isEditing = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Profile updated successfully!')),
      );
    } else {
      HapticFeedback.mediumImpact();
    }
  }

  void _handleCancel() {
    HapticFeedback.lightImpact();
    _loadUserData(); // Reset form data
    setState(() {
      _isEditing = false;
    });
  }

  void _handlePasswordChange() async {
    HapticFeedback.lightImpact();
    
    if (_currentPasswordController.text.isEmpty ||
        _newPasswordController.text.isEmpty ||
        _confirmPasswordController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all password fields')),
      );
      return;
    }

    if (_newPasswordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('New passwords do not match')),
      );
      return;
    }

    if (_newPasswordController.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('New password must be at least 8 characters')),
      );
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.changePassword(
      _currentPasswordController.text,
      _newPasswordController.text,
    );

    if (success && mounted) {
      HapticFeedback.heavyImpact();
      _currentPasswordController.clear();
      _newPasswordController.clear();
      _confirmPasswordController.clear();
      setState(() {
        _isChangingPassword = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Password changed successfully!')),
      );
    } else {
      HapticFeedback.mediumImpact();
    }
  }

  void _showAvatarOptions() {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Change Avatar',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            ListTile(
              leading: const Icon(Icons.camera),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Camera functionality not implemented')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Choose from Gallery'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Gallery functionality not implemented')),
                );
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete),
              title: const Text('Remove Avatar'),
              onTap: () {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Avatar removed')),
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showNotificationSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Notification settings not implemented')),
    );
  }

  void _showPrivacySettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Privacy settings not implemented')),
    );
  }

  void _showDataSettings() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Data settings not implemented')),
    );
  }

  void _showLogoutDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              Navigator.pop(context);
              final authProvider = Provider.of<AuthProvider>(context, listen: false);
              await authProvider.logout();
              if (mounted) {
                Navigator.of(context).pushReplacementNamed('/auth');
              }
            },
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );
  }

  void _showDeleteAccountDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Account'),
        content: const Text(
          'Are you sure you want to delete your account? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: Theme.of(context).colorScheme.error,
            ),
            onPressed: () {
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Account deletion not implemented')),
              );
            },
            child: const Text('Delete Account'),
          ),
        ],
      ),
    );
  }
}