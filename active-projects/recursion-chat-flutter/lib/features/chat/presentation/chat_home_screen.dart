import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:glassmorphism_ui/glassmorphism_ui.dart';
import '../../../core/theme/chat_theme.dart';
import 'chat_conversation_screen.dart';
import '../../settings/presentation/settings_screen.dart';

class ChatHomeScreen extends StatefulWidget {
  const ChatHomeScreen({super.key});

  @override
  State<ChatHomeScreen> createState() => _ChatHomeScreenState();
}

class _ChatHomeScreenState extends State<ChatHomeScreen>
    with TickerProviderStateMixin {
  late AnimationController _headerController;
  late AnimationController _fabController;
  int _selectedIndex = 0;
  
  final List<ChatItem> _chats = [
    ChatItem(
      id: '1',
      name: 'Claude AI',
      lastMessage: 'I\'m here to help with any questions you have!',
      lastMessageTime: DateTime.now().subtract(const Duration(minutes: 2)),
      isOnline: true,
      unreadCount: 0,
      avatarColor: const Color(0xFF667EEA),
      isAI: true,
    ),
    ChatItem(
      id: '2',
      name: 'GPT-4',
      lastMessage: 'Let me help you solve that problem step by step.',
      lastMessageTime: DateTime.now().subtract(const Duration(hours: 1)),
      isOnline: true,
      unreadCount: 2,
      avatarColor: const Color(0xFF10A37F),
      isAI: true,
    ),
    ChatItem(
      id: '3',
      name: 'Recursion Support',
      lastMessage: 'Thanks for reaching out! We\'ll get back to you soon.',
      lastMessageTime: DateTime.now().subtract(const Duration(hours: 3)),
      isOnline: false,
      unreadCount: 0,
      avatarColor: const Color(0xFF764BA2),
      isAI: false,
    ),
    ChatItem(
      id: '4',
      name: 'AI Assistant',
      lastMessage: 'Would you like me to explain that concept differently?',
      lastMessageTime: DateTime.now().subtract(const Duration(days: 1)),
      isOnline: true,
      unreadCount: 1,
      avatarColor: const Color(0xFF6B73FF),
      isAI: true,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _headerController = AnimationController(
      duration: const Duration(milliseconds: 1200),
      vsync: this,
    );
    _fabController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _headerController.forward();
    Future.delayed(const Duration(milliseconds: 600), () {
      if (mounted) _fabController.forward();
    });
  }

  @override
  void dispose() {
    _headerController.dispose();
    _fabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;
    
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
              // Chat Header with glassmorphism
              _buildChatHeader(context, theme),
              
              // Quick Actions Row
              _buildQuickActions(context, theme),
              
              // Chat List
              Expanded(
                child: _buildChatList(context, theme),
              ),
            ],
          ),
        ),
      ),
      
      // Floating Action Button for new chat
      floatingActionButton: AnimatedBuilder(
        animation: _fabController,
        builder: (context, child) {
          return Transform.scale(
            scale: _fabController.value,
            child: FloatingActionButton.extended(
              onPressed: _showNewChatBottomSheet,
              icon: const Icon(Icons.add_comment_rounded),
              label: Text(
                'New Chat',
                style: GoogleFonts.poppins(fontWeight: FontWeight.w600),
              ),
              backgroundColor: theme.colorScheme.primary,
              foregroundColor: theme.colorScheme.onPrimary,
            ),
          );
        },
      )
          .animate()
          .slideY(begin: 1.0, end: 0.0)
          .fadeIn(delay: 600.ms),
      
      // Bottom Navigation Bar
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface.withOpacity(0.95),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.shadow.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: NavigationBar(
          selectedIndex: _selectedIndex,
          onDestinationSelected: (index) {
            setState(() {
              _selectedIndex = index;
            });
            // Navigate to Settings screen when settings tab is tapped
            if (index == 2) {
              Navigator.of(context).push(
                PageRouteBuilder(
                  pageBuilder: (context, animation, secondaryAnimation) =>
                      const SettingsScreen(),
                  transitionsBuilder: (context, animation, secondaryAnimation, child) {
                    const begin = Offset(1.0, 0.0);
                    const end = Offset.zero;
                    const curve = Curves.easeInOutCubic;
                    
                    var tween = Tween(begin: begin, end: end).chain(
                      CurveTween(curve: curve),
                    );
                    
                    return SlideTransition(
                      position: animation.drive(tween),
                      child: FadeTransition(
                        opacity: animation,
                        child: child,
                      ),
                    );
                  },
                  transitionDuration: const Duration(milliseconds: 500),
                ),
              );
            }
          },
          destinations: [
            const NavigationDestination(
              icon: Icon(Icons.chat_outlined),
              selectedIcon: Icon(Icons.chat_rounded),
              label: 'Chats',
            ),
            const NavigationDestination(
              icon: Icon(Icons.explore_outlined),
              selectedIcon: Icon(Icons.explore_rounded),
              label: 'Discover',
            ),
            const NavigationDestination(
              icon: Icon(Icons.settings_outlined),
              selectedIcon: Icon(Icons.settings_rounded),
              label: 'Settings',
            ),
          ]
              .map((dest) => dest)
              .toList()
              .asMap()
              .entries
              .map((entry) {
                final index = entry.key;
                final dest = entry.value;
                return dest;
              })
              .toList(),
        ),
      )
          .animate()
          .slideY(begin: 1.0, end: 0.0)
          .fadeIn(delay: 800.ms),
    );
  }

  Widget _buildChatHeader(BuildContext context, ThemeData theme) {
    return AnimatedBuilder(
      animation: _headerController,
      builder: (context, child) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
          child: Row(
            children: [
              // Profile Avatar
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
                  Icons.person_rounded,
                  color: Colors.white,
                  size: 24,
                ),
              )
                  .animate()
                  .scale(delay: 200.ms)
                  .fadeIn(),
              
              const SizedBox(width: 16),
              
              // Welcome Text
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Welcome back!',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    )
                        .animate()
                        .fadeIn(delay: 300.ms)
                        .slideX(begin: -0.2, end: 0),
                    
                    Text(
                      'Your AI Conversations',
                      style: GoogleFonts.poppins(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                    )
                        .animate()
                        .fadeIn(delay: 400.ms)
                        .slideX(begin: -0.2, end: 0),
                  ],
                ),
              ),
              
              // Search Button
              GlassContainer(
                width: 45,
                height: 45,
                blur: 10,
                color: theme.colorScheme.surface.withOpacity(0.8),
                borderRadius: BorderRadius.circular(22.5),
                child: IconButton(
                  icon: Icon(
                    Icons.search_rounded,
                    color: theme.colorScheme.primary,
                  ),
                  onPressed: () {},
                ),
              )
                  .animate()
                  .fadeIn(delay: 500.ms)
                  .scale(),
            ],
          ),
        );
      },
    );
  }

  Widget _buildQuickActions(BuildContext context, ThemeData theme) {
    final quickActions = [
      {'icon': Icons.psychology_rounded, 'label': 'AI Help', 'color': Colors.purple},
      {'icon': Icons.code_rounded, 'label': 'Code', 'color': Colors.blue},
      {'icon': Icons.text_snippet_rounded, 'label': 'Writing', 'color': Colors.green},
      {'icon': Icons.calculate_rounded, 'label': 'Math', 'color': Colors.orange},
    ];

    return Container(
      height: 100,
      padding: const EdgeInsets.symmetric(horizontal: 20),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: quickActions.length,
        itemBuilder: (context, index) {
          final action = quickActions[index];
          return Container(
            width: 80,
            margin: const EdgeInsets.only(right: 16),
            child: GestureDetector(
              onTap: () => _startNewChat(action['label'] as String),
              child: GlassContainer(
                blur: 8,
                color: theme.colorScheme.surface.withOpacity(0.6),
                borderRadius: BorderRadius.circular(20),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: (action['color'] as Color).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: Icon(
                        action['icon'] as IconData,
                        color: action['color'] as Color,
                        size: 24,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      action['label'] as String,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        color: theme.colorScheme.onSurface,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ],
                ),
              ),
            ),
          );
        },
      )
          .animate()
          .slideX(begin: -0.5, end: 0, delay: 400.ms)
          .fadeIn(delay: 400.ms),
    );
  }

  Widget _buildChatList(BuildContext context, ThemeData theme) {
    return ListView.builder(
      padding: const EdgeInsets.fromLTRB(20, 10, 20, 20),
      itemCount: _chats.length,
      itemBuilder: (context, index) {
        final chat = _chats[index];
        return _buildChatListItem(context, theme, chat, index);
      },
    );
  }

  Widget _buildChatListItem(BuildContext context, ThemeData theme, ChatItem chat, int index) {
    return GestureDetector(
      onTap: () => _openChat(chat),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        child: GlassContainer(
          blur: 8,
          color: theme.colorScheme.surface.withOpacity(0.8),
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                // Avatar with online indicator
                Stack(
                  children: [
                    Container(
                      width: 55,
                      height: 55,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [
                            chat.avatarColor,
                            chat.avatarColor.withOpacity(0.7),
                          ],
                        ),
                        borderRadius: BorderRadius.circular(27.5),
                        boxShadow: [
                          BoxShadow(
                            color: chat.avatarColor.withOpacity(0.3),
                            blurRadius: 10,
                            offset: const Offset(0, 3),
                          ),
                        ],
                      ),
                      child: Icon(
                        chat.isAI ? Icons.psychology_rounded : Icons.person_rounded,
                        color: Colors.white,
                        size: 28,
                      ),
                    ),
                    if (chat.isOnline)
                      Positioned(
                        bottom: 2,
                        right: 2,
                        child: Container(
                          width: 14,
                          height: 14,
                          decoration: BoxDecoration(
                            color: ChatTheme.onlineDotColor,
                            borderRadius: BorderRadius.circular(7),
                            border: Border.all(
                              color: theme.colorScheme.surface,
                              width: 2,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
                
                const SizedBox(width: 16),
                
                // Chat Info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Expanded(
                            child: Text(
                              chat.name,
                              style: GoogleFonts.poppins(
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                color: theme.colorScheme.onSurface,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          Text(
                            _formatTime(chat.lastMessageTime),
                            style: GoogleFonts.poppins(
                              fontSize: 12,
                              color: theme.colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          Expanded(
                            child: Text(
                              chat.lastMessage,
                              style: GoogleFonts.poppins(
                                fontSize: 14,
                                color: theme.colorScheme.onSurface.withOpacity(0.7),
                              ),
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                          if (chat.unreadCount > 0)
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color: theme.colorScheme.primary,
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text(
                                '${chat.unreadCount}',
                                style: GoogleFonts.poppins(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w600,
                                  color: theme.colorScheme.onPrimary,
                                ),
                              ),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: (600 + index * 100).ms)
        .slideX(
          begin: 0.3,
          end: 0,
          curve: Curves.easeOutBack,
        );
  }

  String _formatTime(DateTime time) {
    final now = DateTime.now();
    final difference = now.difference(time);
    
    if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h';
    } else {
      return '${difference.inDays}d';
    }
  }

  void _openChat(ChatItem chat) {
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            ChatConversationScreen(chat: chat),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          const begin = Offset(1.0, 0.0);
          const end = Offset.zero;
          const curve = Curves.easeInOutCubic;
          
          var tween = Tween(begin: begin, end: end).chain(
            CurveTween(curve: curve),
          );
          
          return SlideTransition(
            position: animation.drive(tween),
            child: FadeTransition(
              opacity: animation,
              child: child,
            ),
          );
        },
        transitionDuration: const Duration(milliseconds: 500),
      ),
    );
  }

  void _startNewChat(String type) {
    final newChat = ChatItem(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      name: 'Claude AI',
      lastMessage: 'Hello! How can I help you with $type today?',
      lastMessageTime: DateTime.now(),
      isOnline: true,
      unreadCount: 0,
      avatarColor: const Color(0xFF667EEA),
      isAI: true,
    );
    
    _openChat(newChat);
  }

  void _showNewChatBottomSheet() {
    final theme = Theme.of(context);
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => GlassContainer(
        height: MediaQuery.of(context).size.height * 0.6,
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
                'Start New Conversation',
                style: GoogleFonts.poppins(
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 16),
              
              // AI Options
              Expanded(
                child: GridView.count(
                  crossAxisCount: 2,
                  mainAxisSpacing: 16,
                  crossAxisSpacing: 16,
                  children: [
                    _buildAIOption(context, 'Claude AI', Icons.psychology_rounded, const Color(0xFF667EEA)),
                    _buildAIOption(context, 'GPT-4', Icons.smart_toy_rounded, const Color(0xFF10A37F)),
                    _buildAIOption(context, 'Gemini', Icons.auto_awesome_rounded, const Color(0xFF4285F4)),
                    _buildAIOption(context, 'Custom AI', Icons.settings_rounded, const Color(0xFF764BA2)),
                  ],
                ),
              ),
            ],
          ),
        ),
      )
          .animate()
          .slideY(begin: 1.0, end: 0.0)
          .fadeIn(),
    );
  }

  Widget _buildAIOption(BuildContext context, String name, IconData icon, Color color) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        _startNewChat(name);
      },
      child: GlassContainer(
        blur: 8,
        color: theme.colorScheme.surface.withOpacity(0.6),
        borderRadius: BorderRadius.circular(20),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: color.withOpacity(0.2),
                borderRadius: BorderRadius.circular(25),
              ),
              child: Icon(
                icon,
                size: 32,
                color: color,
              ),
            ),
            const SizedBox(height: 12),
            Text(
              name,
              style: GoogleFonts.poppins(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: theme.colorScheme.onSurface,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// Chat Item Model
class ChatItem {
  final String id;
  final String name;
  final String lastMessage;
  final DateTime lastMessageTime;
  final bool isOnline;
  final int unreadCount;
  final Color avatarColor;
  final bool isAI;

  ChatItem({
    required this.id,
    required this.name,
    required this.lastMessage,
    required this.lastMessageTime,
    required this.isOnline,
    required this.unreadCount,
    required this.avatarColor,
    required this.isAI,
  });
}