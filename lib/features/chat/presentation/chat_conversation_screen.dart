import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:glassmorphism_ui/glassmorphism_ui.dart';
import 'package:chat_bubbles/bubbles/bubble_special_three.dart';
import 'package:animated_text_kit/animated_text_kit.dart';
import 'package:emoji_picker_flutter/emoji_picker_flutter.dart';
import '../../../core/theme/chat_theme.dart';
import '../../../core/providers/message_reactions_provider.dart';
import '../../../core/providers/voice_message_provider.dart';
import '../widgets/message_reactions_widget.dart';
import '../widgets/voice_message_widget.dart';
import '../widgets/message_search_widget.dart';
import '../widgets/chat_export_dialog.dart';
import '../../splash/presentation/animated_splash_screen.dart';

class ChatConversationScreen extends ConsumerStatefulWidget {
  final ChatItem chat;

  const ChatConversationScreen({super.key, required this.chat});

  @override
  ConsumerState<ChatConversationScreen> createState() => _ChatConversationScreenState();
}

class _ChatConversationScreenState extends ConsumerState<ChatConversationScreen>
    with TickerProviderStateMixin {
  late AnimationController _headerController;
  late AnimationController _messageController;
  late AnimationController _inputController;
  late AnimationController _typingController;
  
  final TextEditingController _messageTextController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  final FocusNode _messageFocusNode = FocusNode();
  
  bool _showEmojiPicker = false;
  bool _isTyping = false;
  bool _isRecording = false;
  
  final List<MessageItem> _messages = [];
  
  @override
  void initState() {
    super.initState();
    
    _headerController = AnimationController(
      duration: const Duration(milliseconds: 1000),
      vsync: this,
    );
    
    _messageController = AnimationController(
      duration: const Duration(milliseconds: 800),
      vsync: this,
    );
    
    _inputController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    
    _typingController = AnimationController(
      duration: const Duration(milliseconds: 1500),
      vsync: this,
    );
    
    _loadInitialMessages();
    _startAnimations();
  }
  
  void _startAnimations() {
    _headerController.forward();
    Future.delayed(const Duration(milliseconds: 200), () {
      if (mounted) _messageController.forward();
    });
    Future.delayed(const Duration(milliseconds: 400), () {
      if (mounted) _inputController.forward();
    });
  }
  
  void _loadInitialMessages() {
    _messages.addAll([
      MessageItem(
        id: '1',
        text: 'Hello! How can I help you today? 😊',
        isMe: false,
        timestamp: DateTime.now().subtract(const Duration(minutes: 5)),
        type: MessageType.text,
      ),
      MessageItem(
        id: '2',
        text: 'I need help with Flutter animations. Can you show me some examples?',
        isMe: true,
        timestamp: DateTime.now().subtract(const Duration(minutes: 4)),
        type: MessageType.text,
      ),
      MessageItem(
        id: '3',
        text: 'Absolutely! Flutter has amazing animation capabilities. Here are some key concepts:\n\n• ImplicitAnimations for simple effects\n• ExplicitAnimations for complex control\n• flutter_animate for declarative animations\n• Custom painters for unique visuals\n\nWould you like me to show you a specific example?',
        isMe: false,
        timestamp: DateTime.now().subtract(const Duration(minutes: 3)),
        type: MessageType.text,
      ),
      MessageItem(
        id: '4',
        text: 'Yes, please show me how to create smooth page transitions!',
        isMe: true,
        timestamp: DateTime.now().subtract(const Duration(minutes: 1)),
        type: MessageType.text,
      ),
    ]);
    
    setState(() {});
    _scrollToBottom();
  }
  
  @override
  void dispose() {
    _headerController.dispose();
    _messageController.dispose();
    _inputController.dispose();
    _typingController.dispose();
    _messageTextController.dispose();
    _scrollController.dispose();
    _messageFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;
    
    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              theme.colorScheme.surface,
              theme.colorScheme.surface.withOpacity(0.95),
              theme.colorScheme.primaryContainer.withOpacity(0.1),
            ],
          ),
        ),
        child: Column(
          children: [
            // Custom App Bar with glassmorphism
            _buildChatAppBar(context, theme),
            
            // Messages List
            Expanded(
              child: _buildMessagesList(context, theme),
            ),
            
            // AI Typing Indicator
            if (_isTyping) _buildTypingIndicator(context, theme),
            
            // Message Input Area
            _buildMessageInput(context, theme),
            
            // Emoji Picker
            if (_showEmojiPicker) _buildEmojiPicker(context, theme),
          ],
        ),
      ),
    );
  }

  Widget _buildChatAppBar(BuildContext context, ThemeData theme) {
    return AnimatedBuilder(
      animation: _headerController,
      builder: (context, child) {
        return Container(
          height: 110,
          decoration: BoxDecoration(
            color: theme.colorScheme.surface.withOpacity(0.95),
            boxShadow: [
              BoxShadow(
                color: theme.colorScheme.shadow.withOpacity(0.1),
                blurRadius: 20,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: SafeArea(
            bottom: false,
            child: Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Row(
                children: [
                  // Back Button with glass effect
                  GlassContainer(
                    width: 44,
                    height: 44,
                    blur: 10,
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(22),
                    child: IconButton(
                      icon: Icon(
                        Icons.arrow_back_ios_new_rounded,
                        size: 20,
                        color: theme.colorScheme.primary,
                      ),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 100.ms)
                      .slideX(begin: -0.5, end: 0),
                  
                  const SizedBox(width: 12),
                  
                  // Avatar with online status
                  Stack(
                    children: [
                      Container(
                        width: 50,
                        height: 50,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                            colors: [
                              widget.chat.avatarColor,
                              widget.chat.avatarColor.withOpacity(0.7),
                            ],
                          ),
                          borderRadius: BorderRadius.circular(25),
                          boxShadow: [
                            BoxShadow(
                              color: widget.chat.avatarColor.withOpacity(0.4),
                              blurRadius: 15,
                              offset: const Offset(0, 5),
                            ),
                          ],
                        ),
                        child: Icon(
                          widget.chat.isAI ? Icons.psychology_rounded : Icons.person_rounded,
                          color: Colors.white,
                          size: 28,
                        ),
                      )
                          .animate()
                          .scale(delay: 200.ms, duration: 600.ms, curve: Curves.elasticOut),
                      
                      if (widget.chat.isOnline)
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
                                width: 2.5,
                              ),
                            ),
                          )
                              .animate()
                              .fadeIn(delay: 400.ms)
                              .then()
                              .animate(onPlay: (controller) => controller.repeat(reverse: true))
                              .scale(
                                begin: 1.0,
                                end: 1.2,
                                duration: 2.seconds,
                              ),
                        ),
                    ],
                  ),
                  
                  const SizedBox(width: 16),
                  
                  // Chat Info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Text(
                          widget.chat.name,
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.onSurface,
                          ),
                        )
                            .animate()
                            .fadeIn(delay: 300.ms)
                            .slideX(begin: -0.3, end: 0),
                        
                        const SizedBox(height: 2),
                        
                        Row(
                          children: [
                            if (widget.chat.isOnline)
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: ChatTheme.onlineDotColor,
                                  borderRadius: BorderRadius.circular(4),
                                ),
                              ),
                            if (widget.chat.isOnline) const SizedBox(width: 6),
                            Text(
                              widget.chat.isOnline 
                                  ? (widget.chat.isAI ? 'AI Active' : 'Online')
                                  : 'Last seen recently',
                              style: GoogleFonts.poppins(
                                fontSize: 13,
                                color: theme.colorScheme.onSurface.withOpacity(0.7),
                              ),
                            ),
                          ],
                        )
                            .animate()
                            .fadeIn(delay: 400.ms)
                            .slideX(begin: -0.3, end: 0),
                      ],
                    ),
                  ),
                  
                  // Action Buttons
                  Row(
                    children: [
                      // Search Button
                      GlassContainer(
                        width: 44,
                        height: 44,
                        blur: 10,
                        color: theme.colorScheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(22),
                        child: IconButton(
                          icon: Icon(
                            Icons.search_rounded,
                            size: 20,
                            color: theme.colorScheme.primary,
                          ),
                          onPressed: _openMessageSearch,
                        ),
                      )
                          .animate()
                          .fadeIn(delay: 500.ms)
                          .scale(),
                      
                      const SizedBox(width: 8),
                      
                      // More Options Button
                      GlassContainer(
                        width: 44,
                        height: 44,
                        blur: 10,
                        color: theme.colorScheme.primary.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(22),
                        child: PopupMenuButton<String>(
                          icon: Icon(
                            Icons.more_vert_rounded,
                            size: 20,
                            color: theme.colorScheme.primary,
                          ),
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12),
                          ),
                          itemBuilder: (context) => [
                            PopupMenuItem(
                              value: 'export',
                              child: Row(
                                children: [
                                  Icon(Icons.download_rounded, size: 18),
                                  SizedBox(width: 12),
                                  Text('Export Chat'),
                                ],
                              ),
                            ),
                            PopupMenuItem(
                              value: 'video',
                              child: Row(
                                children: [
                                  Icon(Icons.videocam_rounded, size: 18),
                                  SizedBox(width: 12),
                                  Text('Video Call'),
                                ],
                              ),
                            ),
                            PopupMenuItem(
                              value: 'call',
                              child: Row(
                                children: [
                                  Icon(Icons.call_rounded, size: 18),
                                  SizedBox(width: 12),
                                  Text('Voice Call'),
                                ],
                              ),
                            ),
                          ],
                          onSelected: (value) {
                            switch (value) {
                              case 'export':
                                _showExportDialog();
                                break;
                              case 'video':
                                _showFeatureComingSoon('Video Call');
                                break;
                              case 'call':
                                _showFeatureComingSoon('Voice Call');
                                break;
                            }
                          },
                        ),
                      )
                          .animate()
                          .fadeIn(delay: 600.ms)
                          .scale(),
                    ],
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildMessagesList(BuildContext context, ThemeData theme) {
    return AnimatedBuilder(
      animation: _messageController,
      builder: (context, child) {
        return ListView.builder(
          controller: _scrollController,
          padding: const EdgeInsets.fromLTRB(16, 20, 16, 10),
          itemCount: _messages.length,
          itemBuilder: (context, index) {
            final message = _messages[index];
            return _buildMessageBubble(context, theme, message, index);
          },
        );
      },
    );
  }

  Widget _buildMessageBubble(BuildContext context, ThemeData theme, MessageItem message, int index) {
    final isMe = message.isMe;
    final bubbleColor = isMe 
        ? theme.colorScheme.primary 
        : theme.colorScheme.surface;
    final textColor = isMe 
        ? theme.colorScheme.onPrimary 
        : theme.colorScheme.onSurface;

    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      child: Row(
        mainAxisAlignment: isMe ? MainAxisAlignment.end : MainAxisAlignment.start,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          if (!isMe) ...[
            // Avatar for other person
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    widget.chat.avatarColor,
                    widget.chat.avatarColor.withOpacity(0.7),
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Icon(
                widget.chat.isAI ? Icons.psychology_rounded : Icons.person_rounded,
                color: Colors.white,
                size: 18,
              ),
            ),
            const SizedBox(width: 8),
          ],
          
          // Message Bubble
          Flexible(
            child: Container(
              constraints: BoxConstraints(
                maxWidth: MediaQuery.of(context).size.width * 0.75,
              ),
              child: Column(
                crossAxisAlignment: isMe ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                children: [
                  // Message Content
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                    decoration: BoxDecoration(
                      color: bubbleColor,
                      borderRadius: BorderRadius.only(
                        topLeft: const Radius.circular(20),
                        topRight: const Radius.circular(20),
                        bottomLeft: Radius.circular(isMe ? 20 : 4),
                        bottomRight: Radius.circular(isMe ? 4 : 20),
                      ),
                      boxShadow: [
                        BoxShadow(
                          color: theme.colorScheme.shadow.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 2),
                        ),
                      ],
                    ),
                    child: message.type == MessageType.typing
                        ? _buildTypingAnimation(theme)
                        : message.type == MessageType.voice && message.voiceMessageId != null
                            ? VoiceMessageWidget(
                                voiceMessageId: message.voiceMessageId!,
                                isCurrentUser: message.isMe,
                              )
                            : Text(
                                message.text,
                                style: GoogleFonts.poppins(
                                  fontSize: 15,
                                  color: textColor,
                                  height: 1.4,
                                ),
                              ),
                  ),
                  
                  const SizedBox(height: 4),
                  
                  // Timestamp
                  Padding(
                    padding: EdgeInsets.symmetric(horizontal: isMe ? 8 : 16),
                    child: Text(
                      _formatMessageTime(message.timestamp),
                      style: GoogleFonts.poppins(
                        fontSize: 11,
                        color: theme.colorScheme.onSurface.withOpacity(0.5),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          if (isMe) ...[
            const SizedBox(width: 8),
            // My Avatar
            Container(
              width: 32,
              height: 32,
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    theme.colorScheme.primary,
                    theme.colorScheme.secondary,
                  ],
                ),
                borderRadius: BorderRadius.circular(16),
              ),
              child: const Icon(
                Icons.person_rounded,
                color: Colors.white,
                size: 18,
              ),
            ),
          ],
        ],
      ),
      // Message Reactions
      MessageReactionsWidget(
        messageId: message.id,
        isCurrentUser: message.isMe,
      ),
    )
        .animate()
        .fadeIn(delay: (index * 100).ms)
        .slideY(
          begin: 0.3,
          end: 0,
          curve: Curves.easeOutBack,
        );
  }

  Widget _buildTypingIndicator(BuildContext context, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 32,
            height: 32,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  widget.chat.avatarColor,
                  widget.chat.avatarColor.withOpacity(0.7),
                ],
              ),
              borderRadius: BorderRadius.circular(16),
            ),
            child: Icon(
              widget.chat.isAI ? Icons.psychology_rounded : Icons.person_rounded,
              color: Colors.white,
              size: 18,
            ),
          ),
          
          const SizedBox(width: 8),
          
          // Typing Bubble
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: theme.colorScheme.surface,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(20),
                topRight: Radius.circular(20),
                bottomLeft: Radius.circular(4),
                bottomRight: Radius.circular(20),
              ),
              boxShadow: [
                BoxShadow(
                  color: theme.colorScheme.shadow.withOpacity(0.1),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: _buildTypingAnimation(theme),
          ),
        ],
      ),
    )
        .animate()
        .fadeIn()
        .slideY(begin: 0.5, end: 0);
  }

  Widget _buildTypingAnimation(ThemeData theme) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (index) {
        return Container(
          width: 8,
          height: 8,
          margin: EdgeInsets.only(right: index < 2 ? 4 : 0),
          decoration: BoxDecoration(
            color: theme.colorScheme.primary.withOpacity(0.6),
            shape: BoxShape.circle,
          ),
        )
            .animate(onPlay: (controller) => controller.repeat())
            .scaleXY(
              begin: 0.5,
              end: 1.0,
              duration: 600.ms,
              delay: (index * 200).ms,
            )
            .then()
            .scaleXY(
              begin: 1.0,
              end: 0.5,
              duration: 600.ms,
            );
      }),
    );
  }

  Widget _buildMessageInput(BuildContext context, ThemeData theme) {
    final voiceState = ref.watch(voiceMessageProvider);
    
    // Show voice recording widget when recording
    if (voiceState.isRecording) {
      return VoiceRecordingWidget(
        onRecordingComplete: () {
          setState(() {
            _isRecording = false;
          });
        },
        onCancel: () {
          setState(() {
            _isRecording = false;
          });
        },
      );
    }
    
    return AnimatedBuilder(
      animation: _inputController,
      builder: (context, child) {
        return Container(
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
          child: SafeArea(
            top: false,
            child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 12, 16, 12),
              child: Row(
                children: [
                  // Emoji Button
                  GlassContainer(
                    width: 44,
                    height: 44,
                    blur: 10,
                    color: theme.colorScheme.primary.withOpacity(0.1),
                    borderRadius: BorderRadius.circular(22),
                    child: IconButton(
                      icon: Icon(
                        _showEmojiPicker ? Icons.keyboard_rounded : Icons.emoji_emotions_rounded,
                        size: 20,
                        color: theme.colorScheme.primary,
                      ),
                      onPressed: _toggleEmojiPicker,
                    ),
                  )
                      .animate()
                      .fadeIn()
                      .scale(delay: 100.ms),
                  
                  const SizedBox(width: 12),
                  
                  // Message Input Field
                  Expanded(
                    child: Container(
                      decoration: BoxDecoration(
                        color: theme.colorScheme.surfaceVariant.withOpacity(0.3),
                        borderRadius: BorderRadius.circular(25),
                        border: Border.all(
                          color: theme.colorScheme.outline.withOpacity(0.2),
                        ),
                      ),
                      child: TextField(
                        controller: _messageTextController,
                        focusNode: _messageFocusNode,
                        maxLines: null,
                        textCapitalization: TextCapitalization.sentences,
                        style: GoogleFonts.poppins(
                          fontSize: 16,
                          color: theme.colorScheme.onSurface,
                        ),
                        decoration: InputDecoration(
                          hintText: 'Type a message...',
                          hintStyle: GoogleFonts.poppins(
                            color: theme.colorScheme.onSurface.withOpacity(0.5),
                          ),
                          border: InputBorder.none,
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 12,
                          ),
                        ),
                        onChanged: (text) {
                          setState(() {
                            // Could implement typing indicators here
                          });
                        },
                        onSubmitted: (_) => _sendMessage(),
                      ),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 200.ms)
                      .slideX(begin: 0.3, end: 0),
                  
                  const SizedBox(width: 12),
                  
                  // Voice/Send Button
                  GlassContainer(
                    width: 44,
                    height: 44,
                    blur: 10,
                    color: theme.colorScheme.primary.withOpacity(
                      _messageTextController.text.isNotEmpty ? 1.0 : 0.1
                    ),
                    borderRadius: BorderRadius.circular(22),
                    child: IconButton(
                      icon: Icon(
                        _messageTextController.text.isNotEmpty 
                            ? Icons.send_rounded 
                            : _isRecording 
                                ? Icons.stop_rounded 
                                : Icons.mic_rounded,
                        size: 20,
                        color: _messageTextController.text.isNotEmpty 
                            ? Colors.white 
                            : theme.colorScheme.primary,
                      ),
                      onPressed: _messageTextController.text.isNotEmpty 
                          ? _sendMessage 
                          : _toggleVoiceRecording,
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 300.ms)
                      .scale(),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildEmojiPicker(BuildContext context, ThemeData theme) {
    return Container(
      height: 250,
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.shadow.withOpacity(0.2),
            blurRadius: 20,
            offset: const Offset(0, -10),
          ),
        ],
      ),
      child: EmojiPicker(
        onEmojiSelected: (category, emoji) {
          _messageTextController.text += emoji.emoji;
        },
        config: Config(
          height: 250,
          checkPlatformCompatibility: true,
          emojiViewConfig: EmojiViewConfig(
            backgroundColor: theme.colorScheme.surface,
            columns: 7,
            emojiSizeMax: 28,
          ),
          bottomActionBarConfig: BottomActionBarConfig(
            backgroundColor: theme.colorScheme.surface,
          ),
          categoryViewConfig: CategoryViewConfig(
            backgroundColor: theme.colorScheme.surface,
          ),
        ),
      ),
    )
        .animate()
        .slideY(begin: 1.0, end: 0.0)
        .fadeIn();
  }

  void _sendMessage() {
    if (_messageTextController.text.trim().isEmpty) return;
    
    final messageText = _messageTextController.text.trim();
    final userMessage = MessageItem(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: messageText,
      isMe: true,
      timestamp: DateTime.now(),
      type: MessageType.text,
    );
    
    setState(() {
      _messages.add(userMessage);
      _messageTextController.clear();
      _isTyping = true;
    });
    
    _scrollToBottom();
    
    // Simulate AI response
    Future.delayed(const Duration(milliseconds: 1500), () {
      _simulateAIResponse(messageText);
    });
    
    // Hide emoji picker if showing
    if (_showEmojiPicker) {
      setState(() {
        _showEmojiPicker = false;
      });
    }
    
    // Haptic feedback
    HapticFeedback.lightImpact();
  }

  void _simulateAIResponse(String userMessage) {
    if (!mounted) return;
    
    // Generate contextual AI response
    String aiResponse = _generateAIResponse(userMessage);
    
    final aiMessage = MessageItem(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      text: aiResponse,
      isMe: false,
      timestamp: DateTime.now(),
      type: MessageType.text,
    );
    
    setState(() {
      _isTyping = false;
      _messages.add(aiMessage);
    });
    
    _scrollToBottom();
  }

  String _generateAIResponse(String userMessage) {
    final lowercaseMessage = userMessage.toLowerCase();
    
    // Contextual responses based on message content
    if (lowercaseMessage.contains('flutter') || lowercaseMessage.contains('animation')) {
      return "Great question about Flutter! Flutter's animation system is incredibly powerful. Here are some key concepts:\n\n• Use AnimationController for precise control\n• Tween for value interpolation\n• CurvedAnimation for natural motion\n• flutter_animate for declarative animations\n\nWould you like me to show you a specific animation pattern? 🎨";
    } else if (lowercaseMessage.contains('help') || lowercaseMessage.contains('how')) {
      return "I'm here to help! 😊 I can assist with:\n\n• Programming questions\n• Flutter development\n• UI/UX design principles\n• Problem-solving approaches\n• Code reviews and optimization\n\nWhat specific area would you like to explore?";
    } else if (lowercaseMessage.contains('thank')) {
      return "You're very welcome! 🙏 I'm always happy to help. Feel free to ask me anything else - whether it's about coding, design, or any other topic you're curious about!";
    } else if (lowercaseMessage.contains('beautiful') || lowercaseMessage.contains('design')) {
      return "I love talking about beautiful design! ✨ Great UI/UX combines:\n\n• Visual hierarchy and typography\n• Meaningful animations and transitions\n• Consistent color schemes and spacing\n• Intuitive user interactions\n• Accessibility for all users\n\nWhat kind of design are you working on?";
    } else {
      // Default contextual responses
      final responses = [
        "That's an interesting point! Let me elaborate on that... 🤔",
        "I understand what you're asking about. Here's my perspective... 💭",
        "Great question! This reminds me of a similar concept... 🧠",
        "I'd be happy to help with that! Let me break it down... 📝",
        "That's a fascinating topic! Here's what I think... 🌟",
      ];
      return responses[DateTime.now().millisecond % responses.length];
    }
  }

  void _toggleEmojiPicker() {
    setState(() {
      _showEmojiPicker = !_showEmojiPicker;
    });
    
    if (_showEmojiPicker) {
      _messageFocusNode.unfocus();
    } else {
      _messageFocusNode.requestFocus();
    }
  }

  void _toggleVoiceRecording() async {
    final voiceNotifier = ref.read(voiceMessageProvider.notifier);
    
    if (!_isRecording) {
      setState(() {
        _isRecording = true;
      });
      await voiceNotifier.startRecording();
    } else {
      final voiceMessage = await voiceNotifier.stopRecording();
      setState(() {
        _isRecording = false;
      });
      
      if (voiceMessage != null) {
        _addVoiceMessage(voiceMessage);
      }
    }
  }

  void _addVoiceMessage(VoiceMessage voiceMessage) {
    final messageItem = MessageItem(
      id: voiceMessage.id,
      text: '[Voice Message]',
      isMe: true,
      timestamp: voiceMessage.timestamp,
      type: MessageType.voice,
      voiceMessageId: voiceMessage.id,
    );
    
    setState(() {
      _messages.add(messageItem);
    });
    
    _scrollToBottom();
    
    // Simulate AI response
    Future.delayed(const Duration(milliseconds: 1500), () {
      _simulateAIResponse('voice message');
    });
  }

  void _openMessageSearch() {
    Navigator.of(context).push(
      PageRouteBuilder(
        pageBuilder: (context, animation, secondaryAnimation) =>
            MessageSearchWidget(
              messages: _messages,
              onMessageTap: _scrollToMessage,
              onClose: () => Navigator.of(context).pop(),
            ),
        transitionsBuilder: (context, animation, secondaryAnimation, child) {
          const begin = Offset(0.0, 1.0);
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

  void _scrollToMessage(String messageId) {
    // Implementation for scrolling to a specific message
    final messageIndex = _messages.indexWhere((m) => m.id == messageId);
    if (messageIndex >= 0) {
      final position = messageIndex * 100.0; // Approximate message height
      _scrollController.animateTo(
        position,
        duration: const Duration(milliseconds: 500),
        curve: Curves.easeInOutCubic,
      );
    }
  }

  void _showExportDialog() {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => ChatExportDialog(
        chatName: widget.chat.name,
        messages: _messages,
        onClose: () => Navigator.of(context).pop(),
      ),
    );
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOutCubic,
        );
      }
    });
  }

  String _formatMessageTime(DateTime time) {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);
    final messageDate = DateTime(time.year, time.month, time.day);
    
    if (messageDate == today) {
      return '${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
    } else {
      return '${time.day}/${time.month} ${time.hour.toString().padLeft(2, '0')}:${time.minute.toString().padLeft(2, '0')}';
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

// Message Item Model
class MessageItem {
  final String id;
  final String text;
  final bool isMe;
  final DateTime timestamp;
  final MessageType type;
  final String? voiceMessageId;

  MessageItem({
    required this.id,
    required this.text,
    required this.isMe,
    required this.timestamp,
    required this.type,
    this.voiceMessageId,
  });
}

enum MessageType {
  text,
  image,
  voice,
  typing,
}

// Import the ChatItem from chat_home_screen.dart for consistency
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