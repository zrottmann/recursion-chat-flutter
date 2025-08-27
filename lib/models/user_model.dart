class UserModel {
  final String id;
  final String email;
  final String? username;
  final String? name;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  UserModel({
    required this.id,
    required this.email,
    this.username,
    this.name,
    this.createdAt,
    this.updatedAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['\$id'] ?? json['id'] ?? '',
      email: json['email'] ?? '',
      username: json['username'] ?? json['name']?.toString().split('@')[0],
      name: json['name'],
      createdAt: json['\$createdAt'] != null 
        ? DateTime.tryParse(json['\$createdAt']) 
        : null,
      updatedAt: json['\$updatedAt'] != null 
        ? DateTime.tryParse(json['\$updatedAt']) 
        : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'username': username,
      'name': name,
      'createdAt': createdAt?.toIso8601String(),
      'updatedAt': updatedAt?.toIso8601String(),
    };
  }

  String get displayName => username ?? name ?? email.split('@')[0];
}

class ChatMessage {
  final String id;
  final String content;
  final String userId;
  final String username;
  final DateTime timestamp;
  final bool isAi;
  final bool isSystem;
  final String? roomId;

  ChatMessage({
    required this.id,
    required this.content,
    required this.userId,
    required this.username,
    required this.timestamp,
    this.isAi = false,
    this.isSystem = false,
    this.roomId,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['\$id'] ?? json['id'] ?? '',
      content: json['content'] ?? '',
      userId: json['user_id'] ?? json['userId'] ?? '',
      username: json['username'] ?? 'Unknown User',
      timestamp: json['\$createdAt'] != null 
        ? DateTime.parse(json['\$createdAt'])
        : json['timestamp'] != null 
          ? DateTime.parse(json['timestamp'])
          : DateTime.now(),
      isAi: json['is_ai'] ?? false,
      isSystem: json['isSystem'] ?? false,
      roomId: json['room_id'] ?? json['roomId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'content': content,
      'user_id': userId,
      'username': username,
      'timestamp': timestamp.toIso8601String(),
      'is_ai': isAi,
      'isSystem': isSystem,
      'room_id': roomId,
    };
  }
}

class ChatRoom {
  final String id;
  final String name;
  final String description;
  final int memberCount;
  final DateTime? createdAt;

  ChatRoom({
    required this.id,
    required this.name,
    required this.description,
    required this.memberCount,
    this.createdAt,
  });

  factory ChatRoom.fromJson(Map<String, dynamic> json) {
    return ChatRoom(
      id: json['\$id'] ?? json['id'] ?? '',
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      memberCount: json['member_count'] ?? 0,
      createdAt: json['\$createdAt'] != null 
        ? DateTime.tryParse(json['\$createdAt'])
        : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'description': description,
      'member_count': memberCount,
      'createdAt': createdAt?.toIso8601String(),
    };
  }
}