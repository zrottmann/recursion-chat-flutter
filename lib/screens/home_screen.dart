import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/auth_service.dart';
import '../models/user_model.dart';
import 'room_selection_screen.dart';
import 'chat_screen.dart';
import 'game_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  ChatRoom? _selectedRoom;

  void _onRoomSelected(ChatRoom room) {
    setState(() {
      _selectedRoom = room;
    });
  }

  void _onBackToRooms() {
    setState(() {
      _selectedRoom = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(_selectedRoom != null ? _selectedRoom!.name : 'Recursion Chat'),
        actions: [
          if (_selectedRoom != null)
            IconButton(
              icon: const Icon(Icons.arrow_back),
              onPressed: _onBackToRooms,
              tooltip: 'Back to Rooms',
            ),
          Consumer<AuthService>(
            builder: (context, authService, child) {
              return PopupMenuButton<String>(
                icon: CircleAvatar(
                  backgroundColor: Colors.white24,
                  child: Text(
                    authService.currentUser?.displayName[0].toUpperCase() ?? 'U',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                onSelected: (value) {
                  if (value == 'signout') {
                    _signOut();
                  } else if (value == 'game') {
                    _launchGame();
                  }
                },
                itemBuilder: (context) => [
                  PopupMenuItem(
                    child: Row(
                      children: [
                        const Icon(Icons.person, size: 20),
                        const SizedBox(width: 12),
                        Text(authService.currentUser?.displayName ?? 'User'),
                      ],
                    ),
                  ),
                  const PopupMenuDivider(),
                  const PopupMenuItem(
                    value: 'game',
                    child: Row(
                      children: [
                        Icon(Icons.games, size: 20),
                        SizedBox(width: 12),
                        Text('Play Slumlord'),
                      ],
                    ),
                  ),
                  const PopupMenuItem(
                    value: 'signout',
                    child: Row(
                      children: [
                        Icon(Icons.logout, size: 20),
                        SizedBox(width: 12),
                        Text('Sign Out'),
                      ],
                    ),
                  ),
                ],
              );
            },
          ),
        ],
      ),
      body: _selectedRoom == null
        ? RoomSelectionScreen(onRoomSelected: _onRoomSelected)
        : ChatScreen(
            room: _selectedRoom!,
            onBackPressed: _onBackToRooms,
          ),
    );
  }

  void _launchGame() {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (context) => const GameScreen(),
        fullscreenDialog: true,
      ),
    );
  }

  Future<void> _signOut() async {
    final shouldSignOut = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Sign Out'),
        content: const Text('Are you sure you want to sign out?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(false),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.of(context).pop(true),
            child: const Text('Sign Out'),
          ),
        ],
      ),
    );

    if (shouldSignOut == true) {
      final authService = context.read<AuthService>();
      await authService.signOut();
    }
  }
}