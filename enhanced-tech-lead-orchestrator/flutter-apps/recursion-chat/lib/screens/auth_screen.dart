import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';

class AuthScreen extends StatefulWidget {
  const AuthScreen({Key? key}) : super(key: key);

  @override
  State<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends State<AuthScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final _loginFormKey = GlobalKey<FormState>();
  final _registerFormKey = GlobalKey<FormState>();
  
  // Controllers
  final _loginEmailController = TextEditingController();
  final _loginPasswordController = TextEditingController();
  final _registerNameController = TextEditingController();
  final _registerEmailController = TextEditingController();
  final _registerPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  
  // Focus nodes
  final _loginEmailFocus = FocusNode();
  final _loginPasswordFocus = FocusNode();
  final _registerNameFocus = FocusNode();
  final _registerEmailFocus = FocusNode();
  final _registerPasswordFocus = FocusNode();
  final _confirmPasswordFocus = FocusNode();
  
  bool _obscureLoginPassword = true;
  bool _obscureRegisterPassword = true;
  bool _obscureConfirmPassword = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _loginEmailController.dispose();
    _loginPasswordController.dispose();
    _registerNameController.dispose();
    _registerEmailController.dispose();
    _registerPasswordController.dispose();
    _confirmPasswordController.dispose();
    _loginEmailFocus.dispose();
    _loginPasswordFocus.dispose();
    _registerNameFocus.dispose();
    _registerEmailFocus.dispose();
    _registerPasswordFocus.dispose();
    _confirmPasswordFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final colorScheme = Theme.of(context).colorScheme;
    final size = MediaQuery.of(context).size;
    
    return Scaffold(
      backgroundColor: colorScheme.surface,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: EdgeInsets.symmetric(
            horizontal: size.width > 600 ? 48 : 24,
            vertical: 32,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              // Header
              _buildHeader(colorScheme, themeProvider),
              
              SizedBox(height: size.height * 0.05),
              
              // Tab Bar
              _buildTabBar(colorScheme),
              
              SizedBox(height: size.height * 0.03),
              
              // Tab Views
              Container(
                height: size.height * 0.6,
                child: TabBarView(
                  controller: _tabController,
                  children: [
                    _buildLoginForm(colorScheme),
                    _buildRegisterForm(colorScheme),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader(ColorScheme colorScheme, ThemeProvider themeProvider) {
    return Column(
      children: [
        // Theme toggle
        Align(
          alignment: Alignment.centerRight,
          child: IconButton(
            onPressed: () {
              HapticFeedback.lightImpact();
              themeProvider.toggleTheme();
            },
            icon: Icon(themeProvider.getThemeIcon()),
            iconSize: 28,
          ),
        ),
        
        const SizedBox(height: 20),
        
        // Logo
        Container(
          width: 100,
          height: 100,
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
          child: Icon(
            Icons.chat_bubble,
            size: 50,
            color: colorScheme.onPrimary,
          ),
        ),
        
        const SizedBox(height: 24),
        
        // Title
        Text(
          'Welcome to\nRecursion Chat',
          textAlign: TextAlign.center,
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
            color: colorScheme.onSurface,
            height: 1.2,
          ),
        ),
        
        const SizedBox(height: 12),
        
        // Subtitle
        Text(
          'Connect with your community',
          style: TextStyle(
            fontSize: 16,
            color: colorScheme.onSurface.withOpacity(0.7),
          ),
        ),
      ],
    );
  }

  Widget _buildTabBar(ColorScheme colorScheme) {
    return Container(
      decoration: BoxDecoration(
        color: colorScheme.surfaceVariant.withOpacity(0.3),
        borderRadius: BorderRadius.circular(25),
      ),
      child: TabBar(
        controller: _tabController,
        indicatorSize: TabBarIndicatorSize.tab,
        dividerColor: Colors.transparent,
        indicator: BoxDecoration(
          color: colorScheme.primary,
          borderRadius: BorderRadius.circular(25),
        ),
        labelColor: colorScheme.onPrimary,
        unselectedLabelColor: colorScheme.onSurface.withOpacity(0.7),
        labelStyle: const TextStyle(
          fontWeight: FontWeight.w600,
          fontSize: 16,
        ),
        unselectedLabelStyle: const TextStyle(
          fontWeight: FontWeight.w500,
          fontSize: 16,
        ),
        onTap: (_) => HapticFeedback.selectionClick(),
        tabs: const [
          Tab(text: 'Sign In'),
          Tab(text: 'Sign Up'),
        ],
      ),
    );
  }

  Widget _buildLoginForm(ColorScheme colorScheme) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        return Form(
          key: _loginFormKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Email field
              TextFormField(
                controller: _loginEmailController,
                focusNode: _loginEmailFocus,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.email_outlined),
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
                onFieldSubmitted: (_) => _loginPasswordFocus.requestFocus(),
              ),
              
              const SizedBox(height: 20),
              
              // Password field
              TextFormField(
                controller: _loginPasswordController,
                focusNode: _loginPasswordFocus,
                obscureText: _obscureLoginPassword,
                textInputAction: TextInputAction.done,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      setState(() {
                        _obscureLoginPassword = !_obscureLoginPassword;
                      });
                    },
                    icon: Icon(
                      _obscureLoginPassword 
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                    ),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Password is required';
                  }
                  if (value.length < 6) {
                    return 'Password must be at least 6 characters';
                  }
                  return null;
                },
                onFieldSubmitted: (_) => _handleLogin(),
              ),
              
              const SizedBox(height: 12),
              
              // Forgot password
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: () {
                    HapticFeedback.lightImpact();
                    _showForgotPasswordDialog();
                  },
                  child: Text(
                    'Forgot Password?',
                    style: TextStyle(
                      color: colorScheme.primary,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Sign in button
              FilledButton(
                onPressed: authProvider.isLoading ? null : _handleLogin,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: authProvider.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Sign In',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
              
              const SizedBox(height: 24),
              
              // SSO buttons
              _buildSSOButtons(),
              
              // Error message
              if (authProvider.error != null)
                Container(
                  margin: const EdgeInsets.only(top: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    authProvider.error!,
                    style: TextStyle(
                      color: colorScheme.onErrorContainer,
                      fontSize: 14,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildRegisterForm(ColorScheme colorScheme) {
    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        return Form(
          key: _registerFormKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Name field
              TextFormField(
                controller: _registerNameController,
                focusNode: _registerNameFocus,
                textInputAction: TextInputAction.next,
                textCapitalization: TextCapitalization.words,
                decoration: const InputDecoration(
                  labelText: 'Full Name',
                  prefixIcon: Icon(Icons.person_outline),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Name is required';
                  }
                  if (value.trim().length < 2) {
                    return 'Name must be at least 2 characters';
                  }
                  return null;
                },
                onFieldSubmitted: (_) => _registerEmailFocus.requestFocus(),
              ),
              
              const SizedBox(height: 20),
              
              // Email field
              TextFormField(
                controller: _registerEmailController,
                focusNode: _registerEmailFocus,
                keyboardType: TextInputType.emailAddress,
                textInputAction: TextInputAction.next,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.email_outlined),
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
                onFieldSubmitted: (_) => _registerPasswordFocus.requestFocus(),
              ),
              
              const SizedBox(height: 20),
              
              // Password field
              TextFormField(
                controller: _registerPasswordController,
                focusNode: _registerPasswordFocus,
                obscureText: _obscureRegisterPassword,
                textInputAction: TextInputAction.next,
                decoration: InputDecoration(
                  labelText: 'Password',
                  prefixIcon: const Icon(Icons.lock_outline),
                  suffixIcon: IconButton(
                    onPressed: () {
                      HapticFeedback.lightImpact();
                      setState(() {
                        _obscureRegisterPassword = !_obscureRegisterPassword;
                      });
                    },
                    icon: Icon(
                      _obscureRegisterPassword 
                          ? Icons.visibility_off_outlined
                          : Icons.visibility_outlined,
                    ),
                  ),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Password is required';
                  }
                  if (value.length < 8) {
                    return 'Password must be at least 8 characters';
                  }
                  return null;
                },
                onFieldSubmitted: (_) => _confirmPasswordFocus.requestFocus(),
              ),
              
              const SizedBox(height: 20),
              
              // Confirm password field
              TextFormField(
                controller: _confirmPasswordController,
                focusNode: _confirmPasswordFocus,
                obscureText: _obscureConfirmPassword,
                textInputAction: TextInputAction.done,
                decoration: InputDecoration(
                  labelText: 'Confirm Password',
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
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please confirm your password';
                  }
                  if (value != _registerPasswordController.text) {
                    return 'Passwords do not match';
                  }
                  return null;
                },
                onFieldSubmitted: (_) => _handleRegister(),
              ),
              
              const SizedBox(height: 32),
              
              // Sign up button
              FilledButton(
                onPressed: authProvider.isLoading ? null : _handleRegister,
                style: FilledButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: authProvider.isLoading
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                        ),
                      )
                    : const Text(
                        'Sign Up',
                        style: TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
              ),
              
              // Error message
              if (authProvider.error != null)
                Container(
                  margin: const EdgeInsets.only(top: 16),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colorScheme.errorContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    authProvider.error!,
                    style: TextStyle(
                      color: colorScheme.onErrorContainer,
                      fontSize: 14,
                    ),
                  ),
                ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildSSOButtons() {
    return Column(
      children: [
        // Divider
        Row(
          children: [
            const Expanded(child: Divider()),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(
                'or continue with',
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.6),
                  fontSize: 14,
                ),
              ),
            ),
            const Expanded(child: Divider()),
          ],
        ),
        
        const SizedBox(height: 20),
        
        // SSO buttons
        Row(
          children: [
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _handleSSO('google'),
                icon: const Icon(Icons.g_mobiledata, size: 24),
                label: const Text('Google'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: OutlinedButton.icon(
                onPressed: () => _handleSSO('github'),
                icon: const Icon(Icons.code, size: 20),
                label: const Text('GitHub'),
                style: OutlinedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _handleLogin() async {
    HapticFeedback.lightImpact();
    
    if (!_loginFormKey.currentState!.validate()) {
      HapticFeedback.mediumImpact();
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.login(
      _loginEmailController.text.trim(),
      _loginPasswordController.text,
    );

    if (success && mounted) {
      HapticFeedback.heavyImpact();
      Navigator.of(context).pushReplacementNamed('/rooms');
    } else {
      HapticFeedback.mediumImpact();
    }
  }

  void _handleRegister() async {
    HapticFeedback.lightImpact();
    
    if (!_registerFormKey.currentState!.validate()) {
      HapticFeedback.mediumImpact();
      return;
    }

    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.register(
      _registerNameController.text.trim(),
      _registerEmailController.text.trim(),
      _registerPasswordController.text,
    );

    if (success && mounted) {
      HapticFeedback.heavyImpact();
      Navigator.of(context).pushReplacementNamed('/rooms');
    } else {
      HapticFeedback.mediumImpact();
    }
  }

  void _handleSSO(String provider) async {
    HapticFeedback.lightImpact();
    
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final success = await authProvider.loginWithSSO(provider);

    if (success && mounted) {
      HapticFeedback.heavyImpact();
      Navigator.of(context).pushReplacementNamed('/rooms');
    } else {
      HapticFeedback.mediumImpact();
    }
  }

  void _showForgotPasswordDialog() {
    final emailController = TextEditingController();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reset Password'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('Enter your email to receive a password reset link.'),
            const SizedBox(height: 16),
            TextFormField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(
                labelText: 'Email',
                prefixIcon: Icon(Icons.email_outlined),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () async {
              if (emailController.text.isNotEmpty) {
                final authProvider = Provider.of<AuthProvider>(context, listen: false);
                await authProvider.resetPassword(emailController.text.trim());
                Navigator.pop(context);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Password reset email sent!'),
                    ),
                  );
                }
              }
            },
            child: const Text('Send Reset Link'),
          ),
        ],
      ),
    );
  }
}