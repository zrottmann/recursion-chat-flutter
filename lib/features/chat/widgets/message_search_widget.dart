import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:glassmorphism_ui/glassmorphism_ui.dart';

// Search result model
class SearchResult {
  final String messageId;
  final String text;
  final DateTime timestamp;
  final bool isCurrentUser;
  final String highlightedText;

  const SearchResult({
    required this.messageId,
    required this.text,
    required this.timestamp,
    required this.isCurrentUser,
    required this.highlightedText,
  });
}

class MessageSearchWidget extends StatefulWidget {
  final List<dynamic> messages; // Replace with your message type
  final Function(String messageId) onMessageTap;
  final VoidCallback onClose;

  const MessageSearchWidget({
    super.key,
    required this.messages,
    required this.onMessageTap,
    required this.onClose,
  });

  @override
  State<MessageSearchWidget> createState() => _MessageSearchWidgetState();
}

class _MessageSearchWidgetState extends State<MessageSearchWidget>
    with TickerProviderStateMixin {
  late AnimationController _headerController;
  late AnimationController _resultsController;
  
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  
  List<SearchResult> _searchResults = [];
  bool _isSearching = false;
  String _currentQuery = '';

  @override
  void initState() {
    super.initState();
    _headerController = AnimationController(
      duration: const Duration(milliseconds: 600),
      vsync: this,
    );
    _resultsController = AnimationController(
      duration: const Duration(milliseconds: 400),
      vsync: this,
    );
    
    _headerController.forward();
    
    // Focus search field after animation
    Future.delayed(const Duration(milliseconds: 300), () {
      if (mounted) {
        _searchFocusNode.requestFocus();
      }
    });
  }

  @override
  void dispose() {
    _headerController.dispose();
    _resultsController.dispose();
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: theme.colorScheme.surface.withOpacity(0.95),
      body: SafeArea(
        child: Column(
          children: [
            // Search Header
            _buildSearchHeader(context, theme),
            
            // Search Results
            Expanded(
              child: _buildSearchResults(context, theme),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSearchHeader(BuildContext context, ThemeData theme) {
    return AnimatedBuilder(
      animation: _headerController,
      builder: (context, child) {
        return Container(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 16),
          decoration: BoxDecoration(
            color: theme.colorScheme.surface.withOpacity(0.95),
            boxShadow: [
              BoxShadow(
                color: theme.colorScheme.shadow.withOpacity(0.1),
                blurRadius: 10,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header with back button
              Row(
                children: [
                  GestureDetector(
                    onTap: widget.onClose,
                    child: Container(
                      width: 40,
                      height: 40,
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Icon(
                        Icons.arrow_back_rounded,
                        color: theme.colorScheme.primary,
                        size: 20,
                      ),
                    ),
                  )
                      .animate()
                      .fadeIn(delay: 100.ms)
                      .slideX(begin: -0.5, end: 0),
                  
                  const SizedBox(width: 16),
                  
                  Expanded(
                    child: Text(
                      'Search Messages',
                      style: GoogleFonts.poppins(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.onSurface,
                      ),
                    )
                        .animate()
                        .fadeIn(delay: 200.ms)
                        .slideX(begin: -0.3, end: 0),
                  ),
                ],
              ),
              
              const SizedBox(height: 20),
              
              // Search Input
              Container(
                decoration: BoxDecoration(
                  color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
                  borderRadius: BorderRadius.circular(25),
                  border: Border.all(
                    color: theme.colorScheme.outline.withOpacity(0.2),
                  ),
                ),
                child: TextField(
                  controller: _searchController,
                  focusNode: _searchFocusNode,
                  style: GoogleFonts.poppins(
                    fontSize: 16,
                    color: theme.colorScheme.onSurface,
                  ),
                  decoration: InputDecoration(
                    hintText: 'Search in messages...',
                    hintStyle: GoogleFonts.poppins(
                      color: theme.colorScheme.onSurface.withOpacity(0.5),
                    ),
                    prefixIcon: Icon(
                      Icons.search_rounded,
                      color: theme.colorScheme.primary,
                    ),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? GestureDetector(
                            onTap: _clearSearch,
                            child: Icon(
                              Icons.clear_rounded,
                              color: theme.colorScheme.onSurface.withOpacity(0.5),
                            ),
                          )
                        : null,
                    border: InputBorder.none,
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 20,
                      vertical: 16,
                    ),
                  ),
                  onChanged: _performSearch,
                  textInputAction: TextInputAction.search,
                ),
              )
                  .animate()
                  .fadeIn(delay: 300.ms)
                  .slideY(begin: -0.3, end: 0),
              
              if (_searchResults.isNotEmpty || _currentQuery.isNotEmpty) ...[
                const SizedBox(height: 12),
                Text(
                  _isSearching 
                      ? 'Searching...'
                      : _searchResults.isEmpty && _currentQuery.isNotEmpty
                          ? 'No messages found'
                          : '${_searchResults.length} result${_searchResults.length != 1 ? 's' : ''} found',
                  style: GoogleFonts.poppins(
                    fontSize: 14,
                    color: theme.colorScheme.onSurface.withOpacity(0.6),
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildSearchResults(BuildContext context, ThemeData theme) {
    if (_searchResults.isEmpty && _currentQuery.isEmpty) {
      return _buildEmptyState(context, theme);
    }

    if (_searchResults.isEmpty && _currentQuery.isNotEmpty) {
      return _buildNoResultsState(context, theme);
    }

    return AnimatedBuilder(
      animation: _resultsController,
      builder: (context, child) {
        return ListView.builder(
          padding: const EdgeInsets.all(20),
          itemCount: _searchResults.length,
          itemBuilder: (context, index) {
            final result = _searchResults[index];
            return _buildSearchResultItem(context, theme, result, index);
          },
        );
      },
    );
  }

  Widget _buildSearchResultItem(BuildContext context, ThemeData theme, 
      SearchResult result, int index) {
    return GestureDetector(
      onTap: () {
        HapticFeedback.lightImpact();
        widget.onMessageTap(result.messageId);
        widget.onClose();
      },
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        child: GlassContainer(
          blur: 8,
          color: theme.colorScheme.surface.withOpacity(0.8),
          borderRadius: BorderRadius.circular(16),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Sender and timestamp
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      result.isCurrentUser ? 'You' : 'AI Assistant',
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: result.isCurrentUser 
                            ? theme.colorScheme.primary 
                            : theme.colorScheme.secondary,
                      ),
                    ),
                    Text(
                      _formatTimestamp(result.timestamp),
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: theme.colorScheme.onSurface.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
                
                const SizedBox(height: 8),
                
                // Message text with highlighting
                RichText(
                  text: _buildHighlightedText(
                    result.text,
                    _currentQuery,
                    theme,
                  ),
                  maxLines: 3,
                  overflow: TextOverflow.ellipsis,
                ),
              ],
            ),
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: (index * 50).ms)
        .slideX(begin: 0.3, end: 0, curve: Curves.easeOutBack);
  }

  Widget _buildEmptyState(BuildContext context, ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: theme.colorScheme.primaryContainer,
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.search_rounded,
              size: 40,
              color: theme.colorScheme.primary,
            ),
          )
              .animate()
              .scale(duration: 600.ms, curve: Curves.elasticOut)
              .fadeIn(),
          
          const SizedBox(height: 24),
          
          Text(
            'Search Messages',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          )
              .animate()
              .fadeIn(delay: 300.ms),
          
          const SizedBox(height: 8),
          
          Text(
            'Type in the search box above to find messages',
            style: GoogleFonts.poppins(
              fontSize: 16,
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
            textAlign: TextAlign.center,
          )
              .animate()
              .fadeIn(delay: 400.ms),
        ],
      ),
    );
  }

  Widget _buildNoResultsState(BuildContext context, ThemeData theme) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: theme.colorScheme.surfaceVariant.withOpacity(0.5),
              shape: BoxShape.circle,
            ),
            child: Icon(
              Icons.search_off_rounded,
              size: 40,
              color: theme.colorScheme.onSurface.withOpacity(0.5),
            ),
          ),
          
          const SizedBox(height: 24),
          
          Text(
            'No Results Found',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.w600,
              color: theme.colorScheme.onSurface,
            ),
          ),
          
          const SizedBox(height: 8),
          
          Text(
            'Try searching with different keywords',
            style: GoogleFonts.poppins(
              fontSize: 16,
              color: theme.colorScheme.onSurface.withOpacity(0.6),
            ),
          ),
        ],
      ),
    );
  }

  TextSpan _buildHighlightedText(String text, String query, ThemeData theme) {
    if (query.isEmpty) {
      return TextSpan(
        text: text,
        style: GoogleFonts.poppins(
          fontSize: 14,
          color: theme.colorScheme.onSurface.withOpacity(0.8),
          height: 1.4,
        ),
      );
    }

    final List<TextSpan> spans = [];
    final lowerText = text.toLowerCase();
    final lowerQuery = query.toLowerCase();
    
    int start = 0;
    int index = lowerText.indexOf(lowerQuery);
    
    while (index != -1) {
      // Add text before the match
      if (index > start) {
        spans.add(
          TextSpan(
            text: text.substring(start, index),
            style: GoogleFonts.poppins(
              fontSize: 14,
              color: theme.colorScheme.onSurface.withOpacity(0.8),
              height: 1.4,
            ),
          ),
        );
      }
      
      // Add the highlighted match
      spans.add(
        TextSpan(
          text: text.substring(index, index + query.length),
          style: GoogleFonts.poppins(
            fontSize: 14,
            fontWeight: FontWeight.w600,
            color: theme.colorScheme.primary,
            backgroundColor: theme.colorScheme.primaryContainer.withOpacity(0.3),
            height: 1.4,
          ),
        ),
      );
      
      start = index + query.length;
      index = lowerText.indexOf(lowerQuery, start);
    }
    
    // Add remaining text
    if (start < text.length) {
      spans.add(
        TextSpan(
          text: text.substring(start),
          style: GoogleFonts.poppins(
            fontSize: 14,
            color: theme.colorScheme.onSurface.withOpacity(0.8),
            height: 1.4,
          ),
        ),
      );
    }
    
    return TextSpan(children: spans);
  }

  void _performSearch(String query) {
    setState(() {
      _currentQuery = query.trim();
      _isSearching = true;
    });

    if (query.trim().isEmpty) {
      setState(() {
        _searchResults = [];
        _isSearching = false;
      });
      _resultsController.reset();
      return;
    }

    // Simulate search delay
    Future.delayed(const Duration(milliseconds: 300), () {
      if (!mounted || _currentQuery != query.trim()) return;
      
      // Perform actual search through messages
      final results = _searchInMessages(query.trim());
      
      setState(() {
        _searchResults = results;
        _isSearching = false;
      });
      
      _resultsController.forward();
    });
  }

  List<SearchResult> _searchInMessages(String query) {
    final results = <SearchResult>[];
    final lowerQuery = query.toLowerCase();

    // This is a mock implementation - replace with your actual message data
    final mockMessages = [
      {'id': '1', 'text': 'Hello! How can I help you today? 😊', 'isMe': false, 'timestamp': DateTime.now().subtract(const Duration(minutes: 5))},
      {'id': '2', 'text': 'I need help with Flutter animations. Can you show me some examples?', 'isMe': true, 'timestamp': DateTime.now().subtract(const Duration(minutes: 4))},
      {'id': '3', 'text': 'Absolutely! Flutter has amazing animation capabilities...', 'isMe': false, 'timestamp': DateTime.now().subtract(const Duration(minutes: 3))},
      {'id': '4', 'text': 'Yes, please show me how to create smooth page transitions!', 'isMe': true, 'timestamp': DateTime.now().subtract(const Duration(minutes: 1))},
    ];

    for (final message in mockMessages) {
      final text = message['text'] as String;
      if (text.toLowerCase().contains(lowerQuery)) {
        results.add(
          SearchResult(
            messageId: message['id'] as String,
            text: text,
            timestamp: message['timestamp'] as DateTime,
            isCurrentUser: message['isMe'] as bool,
            highlightedText: text,
          ),
        );
      }
    }

    return results;
  }

  void _clearSearch() {
    _searchController.clear();
    _performSearch('');
    _searchFocusNode.requestFocus();
  }

  String _formatTimestamp(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);
    
    if (difference.inDays > 0) {
      return '${difference.inDays}d ago';
    } else if (difference.inHours > 0) {
      return '${difference.inHours}h ago';
    } else if (difference.inMinutes > 0) {
      return '${difference.inMinutes}m ago';
    } else {
      return 'Just now';
    }
  }
}