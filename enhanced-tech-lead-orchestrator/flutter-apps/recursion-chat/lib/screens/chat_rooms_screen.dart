import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/chat_provider.dart';

class ChatRoomsScreen extends StatefulWidget {
  const ChatRoomsScreen({Key? key}) : super(key: key);

  @override
  State<ChatRoomsScreen> createState() => _ChatRoomsScreenState();
}

class _ChatRoomsScreenState extends State<ChatRoomsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  // Mock data for demo
  final List<Map<String, dynamic>> _mockRooms = [
    {
      'id': 'general',
      'name': 'General Discussion',
      'description': 'Open chat for everyone',
      'memberCount': 156,
      'isPublic': true,
      'lastMessage': 'Hey everyone! How\'s the weather?',
      'lastMessageTime': DateTime.now().subtract(const Duration(minutes: 5)),
      'unreadCount': 3,
      'avatar': '💬',
    },
    {
      'id': 'tech',
      'name': 'Tech Talk',
      'description': 'Discuss the latest in technology',
      'memberCount': 89,
      'isPublic': true,
      'lastMessage': 'Anyone tried the new Flutter 3.16?',
      'lastMessageTime': DateTime.now().subtract(const Duration(minutes: 15)),
      'unreadCount': 0,
      'avatar': '💻',
    },
    {
      'id': 'random',
      'name': 'Random',
      'description': 'Off-topic discussions',
      'memberCount': 234,
      'isPublic': true,
      'lastMessage': 'Check out this amazing sunset!',
      'lastMessageTime': DateTime.now().subtract(const Duration(hours: 1)),
      'unreadCount': 12,
      'avatar': '🎲',
    },
    {
      'id': 'gaming',
      'name': 'Gaming Corner',
      'description': 'All things gaming',
      'memberCount': 67,
      'isPublic': true,
      'lastMessage': 'New RPG released today!',
      'lastMessageTime': DateTime.now().subtract(const Duration(hours: 2)),
      'unreadCount': 0,
      'avatar': '🎮',
    },
    {
      'id': 'music',
      'name': 'Music Lovers',
      'description': 'Share and discover music',
      'memberCount': 145,
      'isPublic': true,
      'lastMessage': '🎵 Now playing: Awesome Song',
      'lastMessageTime': DateTime.now().subtract(const Duration(hours: 3)),
      'unreadCount': 1,
      'avatar': '🎵',
    },
  ];

  final List<Map<String, dynamic>> _mockDirectMessages = [
    {
      'id': 'dm_1',
      'name': 'Sarah Chen',
      'username': '@sarahc',
      'lastMessage': 'Thanks for the help with the project!',
      'lastMessageTime': DateTime.now().subtract(const Duration(minutes: 30)),
      'unreadCount': 0,
      'isOnline': true,
      'avatar': '👩‍💻',
    },
    {
      'id': 'dm_2',
      'name': 'Mike Johnson',
      'username': '@mikej',
      'lastMessage': 'Are we still on for the meeting tomorrow?',
      'lastMessageTime': DateTime.now().subtract(const Duration(hours: 4)),
      'unreadCount': 2,
      'isOnline': false,
      'avatar': '👨‍💼',
    },
    {
      'id': 'dm_3',
      'name': 'Team Lead',
      'username': '@teamlead',
      'lastMessage': 'Great work on the presentation!',
      'lastMessageTime': DateTime.now().subtract(const Duration(days: 1)),
      'unreadCount': 0,
      'isOnline': true,
      'avatar': '👔',
    },
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final authProvider = Provider.of<AuthProvider>(context);
    
    return Scaffold(
      backgroundColor: colorScheme.surface,
      appBar: AppBar(
        title: const Text('Recursion Chat'),
        backgroundColor: colorScheme.surface,
        elevation: 0,
        actions: [
          IconButton(
            onPressed: _showSearchDialog,
            icon: const Icon(Icons.search),
            tooltip: 'Search',
          ),
          IconButton(
            onPressed: () => Navigator.pushNamed(context, '/settings'),
            icon: const Icon(Icons.settings),
            tooltip: 'Settings',
          ),
          PopupMenuButton<String>(
            onSelected: (value) {
              switch (value) {
                case 'profile':
                  Navigator.pushNamed(context, '/profile');
                  break;
                case 'logout':
                  _handleLogout();
                  break;
              }
            },
            itemBuilder: (context) => [
              PopupMenuItem(
                value: 'profile',
                child: ListTile(
                  leading: const Icon(Icons.person),
                  title: const Text('Profile'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
              PopupMenuItem(
                value: 'logout',
                child: ListTile(
                  leading: const Icon(Icons.logout),
                  title: const Text('Logout'),
                  contentPadding: EdgeInsets.zero,
                ),
              ),
            ],
            child: CircleAvatar(
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
          ),
          const SizedBox(width: 8),
        ],
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: colorScheme.primary,
          labelColor: colorScheme.primary,
          unselectedLabelColor: colorScheme.onSurface.withOpacity(0.6),
          onTap: (_) => HapticFeedback.selectionClick(),
          tabs: const [
            Tab(
              icon: Icon(Icons.forum),
              text: 'Channels',
            ),
            Tab(
              icon: Icon(Icons.message),
              text: 'Direct Messages',
            ),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildChannelsList(),
          _buildDirectMessagesList(),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _showCreateRoomDialog,
        tooltip: 'Create Channel',
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildChannelsList() {
    final filteredRooms = _mockRooms.where((room) {
      return room['name'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
             room['description'].toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    if (filteredRooms.isEmpty && _searchQuery.isNotEmpty) {
      return _buildEmptyState('No channels found', 'Try a different search term');
    }

    return RefreshIndicator(
      onRefresh: _refreshRooms,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: filteredRooms.length,
        itemBuilder: (context, index) {
          final room = filteredRooms[index];
          return _buildRoomCard(room);
        },
      ),
    );
  }

  Widget _buildDirectMessagesList() {
    final filteredDMs = _mockDirectMessages.where((dm) {
      return dm['name'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
             dm['username'].toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();

    if (filteredDMs.isEmpty && _searchQuery.isNotEmpty) {
      return _buildEmptyState('No conversations found', 'Try a different search term');
    }

    return RefreshIndicator(
      onRefresh: _refreshDirectMessages,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: filteredDMs.length,
        itemBuilder: (context, index) {
          final dm = filteredDMs[index];
          return _buildDirectMessageCard(dm);
        },
      ),
    );
  }

  Widget _buildRoomCard(Map<String, dynamic> room) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: () {
          HapticFeedback.lightImpact();
          Navigator.pushNamed(context, '/chat', arguments: room['id']);
        },
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  // Avatar
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Center(
                      child: Text(
                        room['avatar'],
                        style: const TextStyle(fontSize: 24),
                      ),
                    ),
                  ),
                  
                  const SizedBox(width: 12),
                  
                  // Room info
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Expanded(
                              child: Text(
                                room['name'],
                                style: const TextStyle(
                                  fontSize: 18,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                            if (room['unreadCount'] > 0)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: colorScheme.primary,
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  room['unreadCount'].toString(),
                                  style: TextStyle(
                                    color: colorScheme.onPrimary,
                                    fontSize: 12,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        Text(
                          room['description'],
                          style: TextStyle(
                            fontSize: 14,
                            color: colorScheme.onSurface.withOpacity(0.7),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 12),
              
              // Last message
              if (room['lastMessage'] != null)
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: colorScheme.surfaceVariant.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Row(
                    children: [
                      Expanded(
                        child: Text(
                          room['lastMessage'],
                          style: TextStyle(
                            fontSize: 14,
                            color: colorScheme.onSurface.withOpacity(0.8),
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Text(
                        _formatTime(room['lastMessageTime']),
                        style: TextStyle(
                          fontSize: 12,
                          color: colorScheme.onSurface.withOpacity(0.5),
                        ),
                      ),
                    ],
                  ),
                ),
              
              const SizedBox(height: 8),
              
              // Footer
              Row(
                children: [
                  Icon(
                    room['isPublic'] ? Icons.public : Icons.lock,
                    size: 16,
                    color: colorScheme.onSurface.withOpacity(0.5),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    room['isPublic'] ? 'Public' : 'Private',
                    style: TextStyle(
                      fontSize: 12,
                      color: colorScheme.onSurface.withOpacity(0.5),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Icon(
                    Icons.people,
                    size: 16,
                    color: colorScheme.onSurface.withOpacity(0.5),
                  ),
                  const SizedBox(width: 4),
                  Text(
                    '${room['memberCount']} members',
                    style: TextStyle(
                      fontSize: 12,
                      color: colorScheme.onSurface.withOpacity(0.5),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDirectMessageCard(Map<String, dynamic> dm) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListTile(
        onTap: () {
          HapticFeedback.lightImpact();
          Navigator.pushNamed(context, '/chat', arguments: dm['id']);
        },
        contentPadding: const EdgeInsets.all(16),
        leading: Stack(
          children: [
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: colorScheme.primaryContainer,
                borderRadius: BorderRadius.circular(24),
              ),
              child: Center(
                child: Text(
                  dm['avatar'],
                  style: const TextStyle(fontSize: 20),
                ),
              ),
            ),
            if (dm['isOnline'])
              Positioned(
                bottom: 0,
                right: 0,
                child: Container(
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    color: Colors.green,
                    shape: BoxShape.circle,
                    border: Border.all(
                      color: colorScheme.surface,
                      width: 2,
                    ),
                  ),
                ),
              ),
          ],
        ),
        title: Row(
          children: [
            Expanded(
              child: Text(
                dm['name'],
                style: const TextStyle(
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            if (dm['unreadCount'] > 0)
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 6,
                  vertical: 2,
                ),
                decoration: BoxDecoration(
                  color: colorScheme.primary,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  dm['unreadCount'].toString(),
                  style: TextStyle(
                    color: colorScheme.onPrimary,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
          ],
        ),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              dm['username'],
              style: TextStyle(
                fontSize: 12,
                color: colorScheme.primary,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              dm['lastMessage'],
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: TextStyle(
                color: colorScheme.onSurface.withOpacity(0.7),
              ),
            ),
          ],
        ),
        trailing: Text(
          _formatTime(dm['lastMessageTime']),
          style: TextStyle(
            fontSize: 12,
            color: colorScheme.onSurface.withOpacity(0.5),
          ),
        ),
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.forum_outlined,
            size: 80,
            color: colorScheme.onSurface.withOpacity(0.3),
          ),
          const SizedBox(height: 16),
          Text(
            title,
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: colorScheme.onSurface.withOpacity(0.7),
            ),
          ),
          const SizedBox(height: 8),
          Text(
            subtitle,
            style: TextStyle(
              fontSize: 16,
              color: colorScheme.onSurface.withOpacity(0.5),
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime dateTime) {
    final now = DateTime.now();
    final difference = now.difference(dateTime);
    
    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d';
    } else {
      return '${dateTime.month}/${dateTime.day}';
    }
  }

  Future<void> _refreshRooms() async {
    HapticFeedback.lightImpact();
    // Simulate refresh delay
    await Future.delayed(const Duration(seconds: 1));
    // TODO: Refresh rooms from Appwrite
  }

  Future<void> _refreshDirectMessages() async {
    HapticFeedback.lightImpact();
    // Simulate refresh delay
    await Future.delayed(const Duration(seconds: 1));
    // TODO: Refresh DMs from Appwrite
  }

  void _showSearchDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Search'),
        content: TextField(
          controller: _searchController,
          decoration: const InputDecoration(
            labelText: 'Search channels and messages',
            prefixIcon: Icon(Icons.search),
          ),
          onChanged: (value) {
            setState(() {
              _searchQuery = value;
            });
          },
        ),
        actions: [
          TextButton(
            onPressed: () {
              _searchController.clear();
              setState(() {
                _searchQuery = '';
              });
              Navigator.pop(context);
            },
            child: const Text('Clear'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  void _showCreateRoomDialog() {
    final nameController = TextEditingController();
    final descriptionController = TextEditingController();
    bool isPublic = true;
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Create Channel'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Channel Name',
                  prefixIcon: Icon(Icons.tag),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: descriptionController,
                decoration: const InputDecoration(
                  labelText: 'Description',
                  prefixIcon: Icon(Icons.description),
                ),
              ),
              const SizedBox(height: 16),
              CheckboxListTile(
                title: const Text('Public Channel'),
                subtitle: const Text('Anyone can join'),
                value: isPublic,
                onChanged: (value) {
                  setState(() {
                    isPublic = value ?? true;
                  });
                },
                controlAffinity: ListTileControlAffinity.leading,
                contentPadding: EdgeInsets.zero,
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () {
                if (nameController.text.isNotEmpty) {
                  // TODO: Create channel in Appwrite
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Channel "${nameController.text}" created!'),
                    ),
                  );
                }
              },
              child: const Text('Create'),
            ),
          ],
        ),
      ),
    );
  }

  void _handleLogout() async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    await authProvider.logout();
    if (mounted) {
      Navigator.of(context).pushReplacementNamed('/auth');
    }
  }
}