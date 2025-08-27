import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/theme/archon_theme.dart';

class TerminalApp extends StatefulWidget {
  const TerminalApp({super.key});

  @override
  State<TerminalApp> createState() => _TerminalAppState();
}

class _TerminalAppState extends State<TerminalApp> with TickerProviderStateMixin {
  late AnimationController _cursorController;
  late ScrollController _scrollController;
  
  final TextEditingController _commandController = TextEditingController();
  final FocusNode _commandFocus = FocusNode();
  
  final List<TerminalLine> _terminalLines = [];
  final List<String> _commandHistory = [];
  int _historyIndex = -1;
  
  @override
  void initState() {
    super.initState();
    _cursorController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    _scrollController = ScrollController();
    
    _cursorController.repeat(reverse: true);
    _initializeTerminal();
    
    // Auto-focus the command input
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _commandFocus.requestFocus();
    });
  }
  
  @override
  void dispose() {
    _cursorController.dispose();
    _scrollController.dispose();
    _commandController.dispose();
    _commandFocus.dispose();
    super.dispose();
  }

  void _initializeTerminal() {
    _terminalLines.addAll([
      TerminalLine(
        text: 'ARCHON NEURAL TERMINAL v3.7.2',
        color: ArchonTheme.primaryCyan,
        type: TerminalLineType.system,
        timestamp: DateTime.now(),
      ),
      TerminalLine(
        text: 'Quantum Core Initialized | Neural Networks Online',
        color: ArchonTheme.successGreen,
        type: TerminalLineType.system,
        timestamp: DateTime.now(),
      ),
      TerminalLine(
        text: 'Type "help" for available commands',
        color: Colors.white.withOpacity(0.7),
        type: TerminalLineType.info,
        timestamp: DateTime.now(),
      ),
      TerminalLine(
        text: '',
        color: Colors.white,
        type: TerminalLineType.empty,
        timestamp: DateTime.now(),
      ),
    ]);
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      color: ArchonTheme.voidBlack.withOpacity(0.95),
      child: Column(
        children: [
          // Terminal Header
          Container(
            height: 40,
            padding: const EdgeInsets.symmetric(horizontal: 16),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  ArchonTheme.primaryCyan.withOpacity(0.1),
                  Colors.transparent,
                ],
              ),
              border: const Border(
                bottom: BorderSide(
                  color: ArchonTheme.primaryCyan,
                  width: 0.5,
                ),
              ),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.terminal_rounded,
                  size: 16,
                  color: ArchonTheme.primaryCyan,
                ),
                const SizedBox(width: 8),
                Text(
                  'root@archon:~',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 12,
                    color: ArchonTheme.primaryCyan,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                Text(
                  'NEURAL CORE',
                  style: GoogleFonts.jetBrainsMono(
                    fontSize: 10,
                    color: Colors.white.withOpacity(0.6),
                  ),
                ),
              ],
            ),
          ),
          
          // Terminal Content
          Expanded(
            child: Stack(
              children: [
                // Terminal Lines
                ListView.builder(
                  controller: _scrollController,
                  padding: const EdgeInsets.all(16),
                  itemCount: _terminalLines.length + 1, // +1 for input line
                  itemBuilder: (context, index) {
                    if (index == _terminalLines.length) {
                      return _buildInputLine();
                    }
                    
                    final line = _terminalLines[index];
                    return _buildTerminalLine(line, index);
                  },
                ),
                
                // Matrix-like background effect
                Positioned.fill(
                  child: _buildMatrixBackground(),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTerminalLine(TerminalLine line, int index) {
    Widget content;
    
    switch (line.type) {
      case TerminalLineType.command:
        content = Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'root@archon:~# ',
              style: GoogleFonts.jetBrainsMono(
                fontSize: 14,
                color: ArchonTheme.primaryCyan,
                fontWeight: FontWeight.bold,
              ),
            ),
            Expanded(
              child: Text(
                line.text,
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 14,
                  color: Colors.white,
                ),
              ),
            ),
          ],
        );
        break;
      
      case TerminalLineType.output:
        content = Padding(
          padding: const EdgeInsets.only(left: 16),
          child: Text(
            line.text,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 14,
              color: line.color,
            ),
          ),
        );
        break;
        
      case TerminalLineType.error:
        content = Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 16,
              color: ArchonTheme.errorRed,
            ),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                line.text,
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 14,
                  color: ArchonTheme.errorRed,
                ),
              ),
            ),
          ],
        );
        break;
        
      case TerminalLineType.system:
        content = Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 4,
              height: 4,
              margin: const EdgeInsets.only(top: 8, right: 8),
              decoration: BoxDecoration(
                color: line.color,
                shape: BoxShape.circle,
              ),
            ),
            Expanded(
              child: Text(
                line.text,
                style: GoogleFonts.jetBrainsMono(
                  fontSize: 14,
                  color: line.color,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        );
        break;
        
      default:
        content = Text(
          line.text,
          style: GoogleFonts.jetBrainsMono(
            fontSize: 14,
            color: line.color,
          ),
        );
    }
    
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: content,
    )
        .animate()
        .fadeIn(delay: (index * 50).ms)
        .slideX(begin: -0.1, end: 0);
  }

  Widget _buildInputLine() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.center,
      children: [
        Text(
          'root@archon:~# ',
          style: GoogleFonts.jetBrainsMono(
            fontSize: 14,
            color: ArchonTheme.primaryCyan,
            fontWeight: FontWeight.bold,
          ),
        ),
        Expanded(
          child: TextField(
            controller: _commandController,
            focusNode: _commandFocus,
            style: GoogleFonts.jetBrainsMono(
              fontSize: 14,
              color: Colors.white,
            ),
            decoration: const InputDecoration(
              border: InputBorder.none,
              isDense: true,
              contentPadding: EdgeInsets.zero,
            ),
            onSubmitted: _executeCommand,
            onChanged: (_) => setState(() {}),
          ),
        ),
        // Animated cursor
        AnimatedBuilder(
          animation: _cursorController,
          builder: (context, child) {
            return Container(
              width: 8,
              height: 16,
              color: ArchonTheme.primaryCyan.withOpacity(
                _commandFocus.hasFocus ? _cursorController.value : 0.0,
              ),
            );
          },
        ),
      ],
    );
  }

  Widget _buildMatrixBackground() {
    return CustomPaint(
      painter: MatrixPainter(),
      size: Size.infinite,
    );
  }

  void _executeCommand(String command) {
    if (command.isEmpty) return;
    
    // Add command to history
    _commandHistory.insert(0, command);
    _historyIndex = -1;
    
    // Add command line to terminal
    _addTerminalLine(TerminalLine(
      text: command,
      color: Colors.white,
      type: TerminalLineType.command,
      timestamp: DateTime.now(),
    ));
    
    // Process command
    _processCommand(command.toLowerCase().trim());
    
    // Clear input
    _commandController.clear();
    
    // Scroll to bottom
    _scrollToBottom();
  }

  void _processCommand(String command) {
    final parts = command.split(' ');
    final cmd = parts[0];
    final args = parts.length > 1 ? parts.sublist(1) : <String>[];
    
    switch (cmd) {
      case 'help':
        _showHelp();
        break;
      
      case 'status':
        _showSystemStatus();
        break;
        
      case 'neural':
        _handleNeuralCommands(args);
        break;
        
      case 'quantum':
        _handleQuantumCommands(args);
        break;
        
      case 'clear':
        _clearTerminal();
        break;
        
      case 'ls':
        _listFiles(args);
        break;
        
      case 'cd':
        _changeDirectory(args);
        break;
        
      case 'echo':
        _echoText(args);
        break;
        
      case 'date':
        _showDate();
        break;
        
      case 'whoami':
        _showWhoami();
        break;
        
      default:
        _addTerminalLine(TerminalLine(
          text: 'Command not found: $cmd',
          color: ArchonTheme.errorRed,
          type: TerminalLineType.error,
          timestamp: DateTime.now(),
        ));
    }
  }

  void _showHelp() {
    final helpCommands = [
      'Available Neural Terminal Commands:',
      '',
      'help         - Show this help message',
      'status       - Display system status',
      'neural       - Neural network operations',
      'quantum      - Quantum core controls',
      'clear        - Clear terminal screen',
      'ls [path]    - List directory contents',
      'cd [path]    - Change directory',
      'echo [text]  - Display text',
      'date         - Show current date/time',
      'whoami       - Display user information',
      '',
      'Neural Commands:',
      '  neural scan      - Scan neural pathways',
      '  neural optimize  - Optimize neural networks',
      '  neural status    - Show neural core status',
      '',
      'Quantum Commands:',
      '  quantum link     - Establish quantum link',
      '  quantum sync     - Synchronize quantum state',
      '  quantum status   - Show quantum core status',
    ];
    
    for (String line in helpCommands) {
      _addTerminalLine(TerminalLine(
        text: line,
        color: line.isEmpty 
            ? Colors.white 
            : line.contains('Commands:')
                ? ArchonTheme.primaryCyan
                : line.startsWith('  ')
                    ? ArchonTheme.successGreen
                    : Colors.white.withOpacity(0.8),
        type: TerminalLineType.output,
        timestamp: DateTime.now(),
      ));
    }
  }

  void _showSystemStatus() {
    final status = [
      'ARCHON SYSTEM STATUS',
      '━━━━━━━━━━━━━━━━━━━━━━',
      'Neural Core:     ONLINE',
      'Quantum Link:    ACTIVE',
      'Memory Usage:    64%',
      'CPU Load:        78%',
      'Neural Load:     45%',
      'Uptime:          72h 34m 16s',
      'Quantum State:   SYNCHRONIZED',
      'Security Level:  MAXIMUM',
      '',
    ];
    
    for (int i = 0; i < status.length; i++) {
      Color color = Colors.white.withOpacity(0.8);
      if (i == 0) color = ArchonTheme.primaryCyan;
      if (status[i].contains('ONLINE') || status[i].contains('ACTIVE') || status[i].contains('SYNCHRONIZED')) {
        color = ArchonTheme.successGreen;
      }
      
      _addTerminalLine(TerminalLine(
        text: status[i],
        color: color,
        type: TerminalLineType.output,
        timestamp: DateTime.now(),
      ));
    }
  }

  void _handleNeuralCommands(List<String> args) {
    if (args.isEmpty) {
      _addTerminalLine(TerminalLine(
        text: 'Neural command requires an argument. Try: neural scan',
        color: ArchonTheme.warningOrange,
        type: TerminalLineType.output,
        timestamp: DateTime.now(),
      ));
      return;
    }
    
    switch (args[0]) {
      case 'scan':
        _simulateNeuralScan();
        break;
      case 'optimize':
        _simulateNeuralOptimization();
        break;
      case 'status':
        _showNeuralStatus();
        break;
      default:
        _addTerminalLine(TerminalLine(
          text: 'Unknown neural command: ${args[0]}',
          color: ArchonTheme.errorRed,
          type: TerminalLineType.error,
          timestamp: DateTime.now(),
        ));
    }
  }

  void _handleQuantumCommands(List<String> args) {
    if (args.isEmpty) {
      _addTerminalLine(TerminalLine(
        text: 'Quantum command requires an argument. Try: quantum link',
        color: ArchonTheme.warningOrange,
        type: TerminalLineType.output,
        timestamp: DateTime.now(),
      ));
      return;
    }
    
    switch (args[0]) {
      case 'link':
        _simulateQuantumLink();
        break;
      case 'sync':
        _simulateQuantumSync();
        break;
      case 'status':
        _showQuantumStatus();
        break;
      default:
        _addTerminalLine(TerminalLine(
          text: 'Unknown quantum command: ${args[0]}',
          color: ArchonTheme.errorRed,
          type: TerminalLineType.error,
          timestamp: DateTime.now(),
        ));
    }
  }

  void _simulateNeuralScan() {
    _addTerminalLine(TerminalLine(
      text: 'Initiating neural pathway scan...',
      color: ArchonTheme.primaryCyan,
      type: TerminalLineType.output,
      timestamp: DateTime.now(),
    ));
    
    Future.delayed(const Duration(milliseconds: 500), () {
      _addTerminalLine(TerminalLine(
        text: 'Scanning neural networks... [████████░░] 80%',
        color: ArchonTheme.successGreen,
        type: TerminalLineType.output,
        timestamp: DateTime.now(),
      ));
      
      Future.delayed(const Duration(milliseconds: 800), () {
        _addTerminalLine(TerminalLine(
          text: 'Neural scan complete. 847 pathways analyzed.',
          color: ArchonTheme.successGreen,
          type: TerminalLineType.output,
          timestamp: DateTime.now(),
        ));
        _scrollToBottom();
      });
      _scrollToBottom();
    });
  }

  void _simulateNeuralOptimization() {
    _addTerminalLine(TerminalLine(
      text: 'Starting neural network optimization...',
      color: ArchonTheme.primaryCyan,
      type: TerminalLineType.output,
      timestamp: DateTime.now(),
    ));
    
    Future.delayed(const Duration(milliseconds: 1000), () {
      _addTerminalLine(TerminalLine(
        text: 'Optimization complete. Performance increased by 23%.',
        color: ArchonTheme.successGreen,
        type: TerminalLineType.output,
        timestamp: DateTime.now(),
      ));
      _scrollToBottom();
    });
  }

  void _simulateQuantumLink() {
    _addTerminalLine(TerminalLine(
      text: 'Establishing quantum entanglement link...',
      color: ArchonTheme.accentPurple,
      type: TerminalLineType.output,
      timestamp: DateTime.now(),
    ));
    
    Future.delayed(const Duration(milliseconds: 1200), () {
      _addTerminalLine(TerminalLine(
        text: 'Quantum link established. Bandwidth: 847.3 QBPS',
        color: ArchonTheme.successGreen,
        type: TerminalLineType.output,
        timestamp: DateTime.now(),
      ));
      _scrollToBottom();
    });
  }

  void _simulateQuantumSync() {
    _addTerminalLine(TerminalLine(
      text: 'Synchronizing quantum state...',
      color: ArchonTheme.accentPurple,
      type: TerminalLineType.output,
      timestamp: DateTime.now(),
    ));
    
    Future.delayed(const Duration(milliseconds: 900), () {
      _addTerminalLine(TerminalLine(
        text: 'Quantum synchronization complete.',
        color: ArchonTheme.successGreen,
        type: TerminalLineType.output,
        timestamp: DateTime.now(),
      ));
      _scrollToBottom();
    });
  }

  void _showNeuralStatus() {
    final status = [
      'Neural Core Status:',
      '  Active Pathways: 847',
      '  Processing Load: 45%',
      '  Learning Rate: 0.023',
      '  Memory Usage: 2.3TB',
      '  Status: OPTIMAL',
    ];
    
    for (String line in status) {
      _addTerminalLine(TerminalLine(
        text: line,
        color: line.contains('Status:') 
            ? ArchonTheme.primaryCyan 
            : line.contains('OPTIMAL')
                ? ArchonTheme.successGreen
                : Colors.white.withOpacity(0.8),
        type: TerminalLineType.output,
        timestamp: DateTime.now(),
      ));
    }
  }

  void _showQuantumStatus() {
    final status = [
      'Quantum Core Status:',
      '  Entanglement Links: 4',
      '  Quantum Bandwidth: 847.3 QBPS',
      '  Coherence Time: ∞',
      '  Phase Stability: 99.97%',
      '  Status: SYNCHRONIZED',
    ];
    
    for (String line in status) {
      _addTerminalLine(TerminalLine(
        text: line,
        color: line.contains('Status:') 
            ? ArchonTheme.accentPurple 
            : line.contains('SYNCHRONIZED')
                ? ArchonTheme.successGreen
                : Colors.white.withOpacity(0.8),
        type: TerminalLineType.output,
        timestamp: DateTime.now(),
      ));
    }
  }

  void _clearTerminal() {
    setState(() {
      _terminalLines.clear();
    });
  }

  void _listFiles(List<String> args) {
    final files = [
      'drwxr-xr-x  neural_core/',
      'drwxr-xr-x  quantum_data/',
      'drwxr-xr-x  system_logs/',
      '-rw-r--r--  archon_config.json',
      '-rw-r--r--  neural_weights.dat',
      '-rwxr-xr-x  quantum_sync.exe',
    ];
    
    for (String file in files) {
      Color color = Colors.white.withOpacity(0.8);
      if (file.contains('drwxr-xr-x')) color = ArchonTheme.secondaryBlue;
      if (file.contains('-rwxr-xr-x')) color = ArchonTheme.successGreen;
      
      _addTerminalLine(TerminalLine(
        text: file,
        color: color,
        type: TerminalLineType.output,
        timestamp: DateTime.now(),
      ));
    }
  }

  void _changeDirectory(List<String> args) {
    final path = args.isNotEmpty ? args[0] : '~';
    _addTerminalLine(TerminalLine(
      text: 'Changed directory to: $path',
      color: ArchonTheme.successGreen,
      type: TerminalLineType.output,
      timestamp: DateTime.now(),
    ));
  }

  void _echoText(List<String> args) {
    final text = args.join(' ');
    _addTerminalLine(TerminalLine(
      text: text,
      color: Colors.white,
      type: TerminalLineType.output,
      timestamp: DateTime.now(),
    ));
  }

  void _showDate() {
    final now = DateTime.now();
    _addTerminalLine(TerminalLine(
      text: now.toString(),
      color: ArchonTheme.primaryCyan,
      type: TerminalLineType.output,
      timestamp: DateTime.now(),
    ));
  }

  void _showWhoami() {
    _addTerminalLine(TerminalLine(
      text: 'root - Neural Administrator',
      color: ArchonTheme.primaryCyan,
      type: TerminalLineType.output,
      timestamp: DateTime.now(),
    ));
  }

  void _addTerminalLine(TerminalLine line) {
    setState(() {
      _terminalLines.add(line);
    });
    _scrollToBottom();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeOut,
        );
      }
    });
  }
}

// Terminal line model
class TerminalLine {
  final String text;
  final Color color;
  final TerminalLineType type;
  final DateTime timestamp;

  TerminalLine({
    required this.text,
    required this.color,
    required this.type,
    required this.timestamp,
  });
}

enum TerminalLineType {
  command,
  output,
  error,
  system,
  info,
  empty,
}

// Matrix background painter
class MatrixPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = ArchonTheme.primaryCyan.withOpacity(0.05)
      ..strokeWidth = 1;

    // Draw subtle matrix-like vertical lines
    for (double x = 0; x < size.width; x += 20) {
      canvas.drawLine(
        Offset(x, 0),
        Offset(x, size.height),
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}