import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/user_model.dart';
import '../services/appwrite_service.dart';

class RoomSelectionScreen extends StatefulWidget {
  final Function(ChatRoom) onRoomSelected;

  const RoomSelectionScreen({
    super.key,
    required this.onRoomSelected,
  });

  @override
  State<RoomSelectionScreen> createState() => _RoomSelectionScreenState();
}

class _RoomSelectionScreenState extends State<RoomSelectionScreen> {
  List<ChatRoom> _rooms = [];
  bool _isLoading = true;
  String _errorMessage = '';

  @override
  void initState() {
    super.initState();
    _loadRooms();
  }

  Future<void> _loadRooms() async {
    try {
      setState(() {
        _isLoading = true;
        _errorMessage = '';
      });

      final appwriteService = context.read<AppwriteService>();
      final rooms = await appwriteService.getRooms();
      
      setState(() {
        _rooms = rooms;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load rooms: $e';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Header
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [
                  Theme.of(context).primaryColor,
                  Theme.of(context).primaryColor.withOpacity(0.8),
                ],
              ),
            ),
            child: SafeArea(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Select a Chat Room',
                    style: TextStyle(
                      fontSize: 28,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Choose a room to start chatting',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
              ),
            ),
          ),
          
          // Content
          Expanded(
            child: _buildContent(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: _loadRooms,
        tooltip: 'Refresh Rooms',
        child: const Icon(Icons.refresh),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Loading chat rooms...'),
          ],
        ),
      );
    }

    if (_errorMessage.isNotEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red[300],
            ),
            const SizedBox(height: 16),
            Text(
              _errorMessage,
              style: TextStyle(
                color: Colors.red[700],
                fontSize: 16,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadRooms,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_rooms.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.chat_bubble_outline,
              size: 64,
              color: Colors.grey[400],
            ),
            const SizedBox(height: 16),
            Text(
              'No chat rooms available',
              style: TextStyle(
                color: Colors.grey[600],
                fontSize: 18,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              'Check back later or contact support',
              style: TextStyle(
                color: Colors.grey[500],
                fontSize: 14,
              ),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadRooms,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _rooms.length,
        itemBuilder: (context, index) {
          final room = _rooms[index];
          return _buildRoomCard(room);
        },
      ),
    );
  }

  Widget _buildRoomCard(ChatRoom room) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: InkWell(
        onTap: () => widget.onRoomSelected(room),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              // Room icon
              Container(
                width: 48,
                height: 48,
                decoration: BoxDecoration(
                  color: Theme.of(context).primaryColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(24),
                ),
                child: Icon(
                  _getRoomIcon(room.name),
                  color: Theme.of(context).primaryColor,
                  size: 24,
                ),
              ),
              const SizedBox(width: 16),
              
              // Room details
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      room.name,
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    if (room.description.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        room.description,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.grey[600],
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                    ],
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.people,
                          size: 16,
                          color: Colors.grey[500],
                        ),
                        const SizedBox(width: 4),
                        Text(
                          '${room.memberCount} members',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[500],
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              
              // Arrow icon
              Icon(
                Icons.arrow_forward_ios,
                color: Colors.grey[400],
                size: 16,
              ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getRoomIcon(String roomName) {
    final name = roomName.toLowerCase();
    if (name.contains('general') || name.contains('main')) {
      return Icons.forum;
    } else if (name.contains('tech') || name.contains('development')) {
      return Icons.computer;
    } else if (name.contains('random') || name.contains('off-topic')) {
      return Icons.shuffle;
    } else if (name.contains('help') || name.contains('support')) {
      return Icons.help;
    } else if (name.contains('announcements')) {
      return Icons.announcement;
    } else {
      return Icons.chat_bubble;
    }
  }
}