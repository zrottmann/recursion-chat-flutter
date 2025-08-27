// Flutter Template Generator - Agent-Optimized Project Templates
import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';

export class FlutterTemplateGenerator {
  constructor(logger) {
    this.logger = logger;
    
    this.templates = {
      'slumlord-arpg': {
        name: 'Slumlord Survival ARPG',
        description: 'Baltimore-themed mobile-first multiplayer ARPG',
        type: 'game',
        platforms: ['android', 'ios', 'web'],
        dependencies: {
          'bonfire': '^3.0.0',
          'provider': '^6.0.5',
          'appwrite': '^11.0.0',
          'audioplayers': '^5.0.0',
          'vibration': '^1.8.4',
          'shared_preferences': '^2.2.2',
          'http': '^1.1.0',
          'path_provider': '^2.1.1'
        },
        devDependencies: {
          'flutter_test': 'sdk: flutter',
          'flutter_lints': '^3.0.1',
          'test': '^1.24.6',
          'mockito': '^5.4.2'
        }
      },
      'chat-app': {
        name: 'Real-time Chat Application',
        description: 'WebSocket-based chat with Appwrite backend',
        type: 'chat',
        platforms: ['android', 'ios', 'web'],
        dependencies: {
          'provider': '^6.0.5',
          'appwrite': '^11.0.0',
          'web_socket_channel': '^2.4.0',
          'shared_preferences': '^2.2.2',
          'image_picker': '^1.0.4',
          'cached_network_image': '^3.3.0'
        }
      },
      'trading-platform': {
        name: 'Trading Platform',
        description: 'E-commerce marketplace with real-time features',
        type: 'ecommerce',
        platforms: ['android', 'ios', 'web'],
        dependencies: {
          'provider': '^6.0.5',
          'appwrite': '^11.0.0',
          'stripe_payment': '^1.1.4',
          'image_picker': '^1.0.4',
          'cached_network_image': '^3.3.0',
          'carousel_slider': '^4.2.1'
        }
      }
    };
  }

  async generateProject(templateName, projectName, options = {}) {
    const template = this.templates[templateName];
    if (!template) {
      throw new Error(`Template '${templateName}' not found. Available: ${Object.keys(this.templates).join(', ')}`);
    }

    this.logger.info(chalk.blue(`🎨 Generating ${template.name} project: ${projectName}`));
    
    const projectPath = `./flutter-apps/${projectName}`;
    
    try {
      // Create project structure
      await this.createProjectStructure(projectPath, template, options);
      
      // Generate pubspec.yaml
      await this.generatePubspecYaml(projectPath, template, projectName, options);
      
      // Generate main.dart with template-specific code
      await this.generateMainDart(projectPath, template, projectName);
      
      // Generate additional files based on template
      await this.generateTemplateSpecificFiles(projectPath, template, projectName);
      
      // Generate agent coordination files
      await this.generateAgentCoordinationFiles(projectPath, template, projectName);
      
      this.logger.info(chalk.green(`✅ ${template.name} project generated: ${projectPath}`));
      
      return {
        projectPath,
        template: templateName,
        name: projectName,
        platforms: template.platforms,
        dependencies: Object.keys(template.dependencies).length
      };
    } catch (error) {
      this.logger.error(chalk.red(`❌ Project generation failed: ${error.message}`));
      throw error;
    }
  }

  async createProjectStructure(projectPath, template, options) {
    // Core Flutter structure
    const directories = [
      'lib',
      'lib/models',
      'lib/providers',
      'lib/screens',
      'lib/services',
      'lib/widgets',
      'lib/utils',
      'test',
      'test/unit',
      'test/widget',
      'test/integration',
      'assets',
      'assets/images',
      'assets/audio'
    ];

    // Add template-specific directories
    if (template.type === 'game') {
      directories.push(
        'lib/game',
        'lib/game/components',
        'lib/game/enemies',
        'lib/game/npcs',
        'lib/game/items',
        'lib/game/maps',
        'assets/game',
        'assets/game/sprites',
        'assets/game/sounds'
      );
    }

    // Create all directories
    for (const dir of directories) {
      await fs.mkdir(path.join(projectPath, dir), { recursive: true });
    }

    // Create platform directories based on template
    for (const platform of template.platforms) {
      if (platform === 'android') {
        await fs.mkdir(path.join(projectPath, 'android', 'app', 'src', 'main'), { recursive: true });
      } else if (platform === 'ios') {
        await fs.mkdir(path.join(projectPath, 'ios', 'Runner'), { recursive: true });
      } else if (platform === 'web') {
        await fs.mkdir(path.join(projectPath, 'web'), { recursive: true });
      }
    }
  }

  async generatePubspecYaml(projectPath, template, projectName, options) {
    const pubspec = {
      name: projectName.replace(/-/g, '_'),
      description: template.description,
      version: options.version || '1.0.0+1',
      environment: {
        sdk: ">=3.0.0 <4.0.0",
        flutter: ">=3.0.0"
      },
      dependencies: {
        flutter: { sdk: 'flutter' },
        ...template.dependencies
      },
      dev_dependencies: {
        flutter_test: { sdk: 'flutter' },
        flutter_lints: '^3.0.1',
        ...template.devDependencies
      },
      flutter: {
        uses_material_design: true,
        assets: [
          'assets/images/',
          'assets/audio/'
        ]
      }
    };

    if (template.type === 'game') {
      pubspec.flutter.assets.push('assets/game/');
    }

    // Convert to YAML format
    const yamlContent = this.objectToYaml(pubspec);
    await fs.writeFile(path.join(projectPath, 'pubspec.yaml'), yamlContent);
  }

  async generateMainDart(projectPath, template, projectName) {
    let mainContent = '';

    const className = this.toPascalCase(projectName);
    const displayName = template.name;

    if (template.type === 'game') {
      mainContent = `// ${displayName} - Generated by Enhanced Tech-Lead Orchestrator
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:bonfire/bonfire.dart';
import 'screens/game_screen.dart';
import 'screens/lobby_screen.dart';
import 'screens/auth_screen.dart';
import 'providers/game_provider.dart';
import 'services/appwrite_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Configure for gaming experience
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
    DeviceOrientation.portraitUp,
  ]);
  
  // Hide system UI for immersive gaming
  SystemChrome.setEnabledSystemUIMode(SystemUiMode.immersiveSticky);
  
  AppwriteService().initialize();
  runApp(${className}App());
}

class ${className}App extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => GameProvider()),
      ],
      child: MaterialApp(
        title: '${displayName}',
        theme: ThemeData(
          primarySwatch: Colors.deepOrange,
          useMaterial3: true,
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.deepOrange,
            brightness: Brightness.dark,
          ),
          scaffoldBackgroundColor: Colors.black,
          fontFamily: 'Roboto',
        ),
        debugShowCheckedModeBanner: false,
        home: SplashScreen(),
        routes: {
          '/auth': (context) => AuthScreen(),
          '/lobby': (context) => LobbyScreen(),
          '/game': (context) => GameScreen(),
        },
      ),
    );
  }
}

class SplashScreen extends StatefulWidget {
  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> 
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _fadeAnimation;
  
  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: Duration(seconds: 2),
      vsync: this,
    );
    
    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0)
        .animate(CurvedAnimation(parent: _controller, curve: Curves.easeIn));
    
    _controller.forward();
    _checkAuth();
  }
  
  Future<void> _checkAuth() async {
    await Future.delayed(Duration(seconds: 2));
    
    final isAuth = await AppwriteService().isAuthenticated();
    if (mounted) {
      Navigator.of(context).pushReplacementNamed(
        isAuth ? '/lobby' : '/auth',
      );
    }
  }
  
  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Center(
        child: FadeTransition(
          opacity: _fadeAnimation,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                width: 120,
                height: 120,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  gradient: RadialGradient(
                    colors: [Colors.deepOrange.shade400, Colors.deepOrange.shade800],
                  ),
                ),
                child: Icon(Icons.castle, size: 60, color: Colors.white),
              ),
              SizedBox(height: 24),
              Text(
                '${displayName.toUpperCase()}',
                style: TextStyle(
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                  letterSpacing: 4,
                ),
              ),
              SizedBox(height: 48),
              CircularProgressIndicator(
                valueColor: AlwaysStoppedAnimation(Colors.deepOrange),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`;
    } else {
      mainContent = `// ${displayName} - Generated by Enhanced Tech-Lead Orchestrator
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'screens/home_screen.dart';
import 'screens/auth_screen.dart';
import 'providers/app_provider.dart';
import 'services/appwrite_service.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  AppwriteService().initialize();
  runApp(${className}App());
}

class ${className}App extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AppProvider()),
      ],
      child: MaterialApp(
        title: '${displayName}',
        theme: ThemeData(
          primarySwatch: Colors.blue,
          useMaterial3: true,
        ),
        debugShowCheckedModeBanner: false,
        home: SplashScreen(),
        routes: {
          '/auth': (context) => AuthScreen(),
          '/home': (context) => HomeScreen(),
        },
      ),
    );
  }
}

class SplashScreen extends StatefulWidget {
  @override
  _SplashScreenState createState() => _SplashScreenState();
}

class _SplashScreenState extends State<SplashScreen> {
  @override
  void initState() {
    super.initState();
    _checkAuth();
  }
  
  Future<void> _checkAuth() async {
    await Future.delayed(Duration(seconds: 1));
    
    final isAuth = await AppwriteService().isAuthenticated();
    if (mounted) {
      Navigator.of(context).pushReplacementNamed(
        isAuth ? '/home' : '/auth',
      );
    }
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 24),
            Text('${displayName}', style: Theme.of(context).textTheme.headlineSmall),
          ],
        ),
      ),
    );
  }
}
`;
    }

    await fs.writeFile(path.join(projectPath, 'lib', 'main.dart'), mainContent);
  }

  async generateTemplateSpecificFiles(projectPath, template, projectName) {
    if (template.type === 'game') {
      await this.generateGameSpecificFiles(projectPath, projectName);
    } else if (template.type === 'chat') {
      await this.generateChatSpecificFiles(projectPath, projectName);
    } else if (template.type === 'ecommerce') {
      await this.generateEcommerceSpecificFiles(projectPath, projectName);
    }
  }

  async generateGameSpecificFiles(projectPath, projectName) {
    // Game Provider
    const gameProviderContent = `import 'package:flutter/material.dart';
import '../services/appwrite_service.dart';

class GameProvider extends ChangeNotifier {
  bool _isInGame = false;
  String _playerId = '';
  Map<String, dynamic> _gameState = {};
  
  bool get isInGame => _isInGame;
  String get playerId => _playerId;
  Map<String, dynamic> get gameState => _gameState;
  
  Future<void> startGame() async {
    _isInGame = true;
    _playerId = DateTime.now().millisecondsSinceEpoch.toString();
    notifyListeners();
  }
  
  Future<void> endGame() async {
    _isInGame = false;
    _playerId = '';
    _gameState.clear();
    notifyListeners();
  }
  
  void updateGameState(Map<String, dynamic> state) {
    _gameState = state;
    notifyListeners();
  }
}
`;
    await fs.writeFile(path.join(projectPath, 'lib', 'providers', 'game_provider.dart'), gameProviderContent);

    // Game Screen placeholder
    const gameScreenContent = `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/game_provider.dart';

class GameScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Consumer<GameProvider>(
        builder: (context, gameProvider, child) {
          return Stack(
            children: [
              // Game canvas will go here
              Container(
                width: double.infinity,
                height: double.infinity,
                color: Colors.black,
                child: Center(
                  child: Text(
                    'Game Canvas Area\\nPlayer ID: \${gameProvider.playerId}',
                    style: TextStyle(color: Colors.white, fontSize: 18),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
              // Game UI overlay
              Positioned(
                top: 40,
                left: 20,
                child: Container(
                  padding: EdgeInsets.all(8),
                  decoration: BoxDecoration(
                    color: Colors.black54,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Text(
                    'HP: 100/100',
                    style: TextStyle(color: Colors.white),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}
`;
    await fs.writeFile(path.join(projectPath, 'lib', 'screens', 'game_screen.dart'), gameScreenContent);

    // Lobby Screen
    const lobbyScreenContent = `import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/game_provider.dart';

class LobbyScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[900],
      appBar: AppBar(
        title: Text('Game Lobby'),
        backgroundColor: Colors.deepOrange,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Ready to Play?',
              style: TextStyle(fontSize: 24, color: Colors.white),
            ),
            SizedBox(height: 32),
            ElevatedButton(
              onPressed: () async {
                await context.read<GameProvider>().startGame();
                Navigator.of(context).pushNamed('/game');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.deepOrange,
                padding: EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
              child: Text('Start Game', style: TextStyle(fontSize: 18)),
            ),
          ],
        ),
      ),
    );
  }
}
`;
    await fs.writeFile(path.join(projectPath, 'lib', 'screens', 'lobby_screen.dart'), lobbyScreenContent);
  }

  async generateChatSpecificFiles(projectPath, projectName) {
    // Chat-specific files would go here
    const homeScreenContent = `import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Chat Home')),
      body: Center(
        child: Text('Chat functionality will be implemented here'),
      ),
    );
  }
}
`;
    await fs.writeFile(path.join(projectPath, 'lib', 'screens', 'home_screen.dart'), homeScreenContent);
  }

  async generateEcommerceSpecificFiles(projectPath, projectName) {
    // E-commerce specific files would go here
    const homeScreenContent = `import 'package:flutter/material.dart';

class HomeScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Marketplace')),
      body: Center(
        child: Text('E-commerce functionality will be implemented here'),
      ),
    );
  }
}
`;
    await fs.writeFile(path.join(projectPath, 'lib', 'screens', 'home_screen.dart'), homeScreenContent);
  }

  async generateAgentCoordinationFiles(projectPath, template, projectName) {
    // Create AGENT_COORDINATION.md file
    const agentCoordContent = `# Agent Coordination Guide - ${template.name}

## Project Structure
Generated by Enhanced Tech-Lead Orchestrator for optimal parallel development.

## Agent Assignment Areas

### Team Alpha - Core Infrastructure (Files 1-10)
- \`lib/main.dart\` - App entry point and routing
- \`lib/services/appwrite_service.dart\` - Backend integration
- \`lib/providers/\` - State management
- \`lib/utils/\` - Shared utilities
- \`pubspec.yaml\` - Dependencies management

### Team Beta - UI Components (Files 11-20)
- \`lib/screens/\` - Screen implementations
- \`lib/widgets/\` - Reusable UI components
- \`assets/\` - Static assets management
- Platform-specific UI adaptations

### Team Gamma - Business Logic (Files 21-30)
- \`lib/models/\` - Data models
- Business logic implementation
- API integration layers
- Data persistence

### Team Delta - Testing & Quality (Files 31-40)
- \`test/unit/\` - Unit tests
- \`test/widget/\` - Widget tests
- \`test/integration/\` - Integration tests
- Performance optimization
- Code quality assurance

## Development Guidelines

1. **Mobile-First Design**: 320px-480px screen priority
2. **Accessibility**: WCAG 2.1 AA compliance
3. **Performance**: 60 FPS target, <100ms response time
4. **Testing**: Minimum 80% code coverage
5. **Code Style**: Follow Effective Dart guidelines

## Parallel Development Rules

- Each team works on independent file sets
- Use placeholder interfaces for cross-team dependencies
- Regular integration checkpoints every 4 hours
- Continuous integration for conflict resolution

## Quality Gates

- [ ] All tests passing
- [ ] Code coverage > 80%
- [ ] Performance benchmarks met
- [ ] Accessibility compliance verified
- [ ] Security review completed
`;

    await fs.writeFile(path.join(projectPath, 'AGENT_COORDINATION.md'), agentCoordContent);

    // Create shared service templates
    const appwriteServiceContent = `import 'package:appwrite/appwrite.dart';

class AppwriteService {
  static final AppwriteService _instance = AppwriteService._internal();
  factory AppwriteService() => _instance;
  AppwriteService._internal();

  late Client client;
  late Account account;
  late Databases databases;
  late Storage storage;
  late Realtime realtime;

  void initialize() {
    client = Client()
        .setEndpoint('https://cloud.appwrite.io/v1')
        .setProject('your-project-id')
        .setSelfSigned(status: true);

    account = Account(client);
    databases = Databases(client);
    storage = Storage(client);
    realtime = Realtime(client);
  }

  Future<bool> isAuthenticated() async {
    try {
      await account.getSession('current');
      return true;
    } catch (e) {
      return false;
    }
  }

  Future<User?> getCurrentUser() async {
    try {
      return await account.get();
    } catch (e) {
      return null;
    }
  }
}
`;
    await fs.writeFile(path.join(projectPath, 'lib', 'services', 'appwrite_service.dart'), appwriteServiceContent);

    // Create auth screen template
    const authScreenContent = `import 'package:flutter/material.dart';
import '../services/appwrite_service.dart';

class AuthScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Padding(
          padding: EdgeInsets.all(32),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'Welcome',
                style: Theme.of(context).textTheme.headlineLarge,
              ),
              SizedBox(height: 48),
              ElevatedButton(
                onPressed: () {
                  // TODO: Implement authentication
                  Navigator.of(context).pushReplacementNamed('/home');
                },
                child: Text('Get Started'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
`;
    await fs.writeFile(path.join(projectPath, 'lib', 'screens', 'auth_screen.dart'), authScreenContent);

    // Create basic provider template
    const appProviderContent = `import 'package:flutter/material.dart';

class AppProvider extends ChangeNotifier {
  bool _isLoading = false;
  String _error = '';

  bool get isLoading => _isLoading;
  String get error => _error;

  void setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void setError(String error) {
    _error = error;
    notifyListeners();
  }

  void clearError() {
    _error = '';
    notifyListeners();
  }
}
`;
    await fs.writeFile(path.join(projectPath, 'lib', 'providers', 'app_provider.dart'), appProviderContent);
  }

  objectToYaml(obj, indent = 0) {
    let yaml = '';
    const spaces = '  '.repeat(indent);
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) continue;
      
      if (typeof value === 'object' && !Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        yaml += this.objectToYaml(value, indent + 1);
      } else if (Array.isArray(value)) {
        yaml += `${spaces}${key}:\n`;
        value.forEach(item => {
          yaml += `${spaces}  - ${item}\n`;
        });
      } else if (typeof value === 'object' && value.sdk) {
        yaml += `${spaces}${key}:\n${spaces}  sdk: ${value.sdk}\n`;
      } else {
        yaml += `${spaces}${key}: ${value}\n`;
      }
    }
    
    return yaml;
  }

  toPascalCase(str) {
    return str.replace(/(^\w|[-_]\w)/g, (match) => 
      match.replace(/[-_]/, '').toUpperCase()
    );
  }

  getAvailableTemplates() {
    return Object.entries(this.templates).map(([key, template]) => ({
      id: key,
      name: template.name,
      description: template.description,
      type: template.type,
      platforms: template.platforms
    }));
  }
}