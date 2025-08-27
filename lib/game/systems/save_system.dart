import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/game_models.dart';

class SaveSystem {
  static const String _saveKeyPrefix = 'slumlord_save_';
  static const String _autoSaveKey = 'slumlord_autosave';
  static const int maxSaveSlots = 5;

  Future<bool> saveGame(String slotName, GameSaveData saveData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saveKey = _saveKeyPrefix + slotName;
      
      final saveJson = saveData.toJson();
      final saveString = jsonEncode(saveJson);
      
      final success = await prefs.setString(saveKey, saveString);
      
      if (success) {
        // Also update the save metadata
        await _updateSaveMetadata(slotName, saveData);
        print('[SaveSystem] Game saved to slot: $slotName');
      }
      
      return success;
    } catch (e) {
      print('[SaveSystem] Failed to save game: $e');
      return false;
    }
  }

  Future<GameSaveData?> loadGame(String slotName) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saveKey = _saveKeyPrefix + slotName;
      
      final saveString = prefs.getString(saveKey);
      if (saveString == null) {
        print('[SaveSystem] No save found for slot: $slotName');
        return null;
      }
      
      final saveJson = jsonDecode(saveString) as Map<String, dynamic>;
      final saveData = GameSaveData.fromJson(saveJson);
      
      print('[SaveSystem] Game loaded from slot: $slotName');
      return saveData;
    } catch (e) {
      print('[SaveSystem] Failed to load game: $e');
      return null;
    }
  }

  Future<bool> autoSave(GameSaveData saveData) async {
    return await saveGame('autosave', saveData);
  }

  Future<GameSaveData?> loadAutoSave() async {
    return await loadGame('autosave');
  }

  Future<bool> deleteSave(String slotName) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saveKey = _saveKeyPrefix + slotName;
      
      final success = await prefs.remove(saveKey);
      
      if (success) {
        // Also remove metadata
        await _removeSaveMetadata(slotName);
        print('[SaveSystem] Save deleted: $slotName');
      }
      
      return success;
    } catch (e) {
      print('[SaveSystem] Failed to delete save: $e');
      return false;
    }
  }

  Future<List<SaveSlotInfo>> getAllSaves() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saves = <SaveSlotInfo>[];
      
      for (int i = 1; i <= maxSaveSlots; i++) {
        final slotName = 'slot$i';
        final saveKey = _saveKeyPrefix + slotName;
        
        if (prefs.containsKey(saveKey)) {
          final metadata = await _getSaveMetadata(slotName);
          if (metadata != null) {
            saves.add(metadata);
          }
        }
      }
      
      // Check for autosave
      if (prefs.containsKey(_saveKeyPrefix + 'autosave')) {
        final metadata = await _getSaveMetadata('autosave');
        if (metadata != null) {
          saves.add(metadata);
        }
      }
      
      return saves;
    } catch (e) {
      print('[SaveSystem] Failed to get saves list: $e');
      return [];
    }
  }

  Future<bool> saveExists(String slotName) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final saveKey = _saveKeyPrefix + slotName;
      return prefs.containsKey(saveKey);
    } catch (e) {
      return false;
    }
  }

  Future<void> _updateSaveMetadata(String slotName, GameSaveData saveData) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final metadataKey = '${_saveKeyPrefix}metadata_$slotName';
      
      final metadata = SaveSlotInfo(
        slotName: slotName,
        playerName: 'Player', // Could be customized
        level: saveData.player['level'] ?? 1,
        gold: saveData.player['gold'] ?? 0,
        properties: saveData.player['properties'] ?? 0,
        saveTime: DateTime.now(),
        playtime: Duration(milliseconds: saveData.gameTime ?? 0),
      );
      
      final metadataJson = metadata.toJson();
      await prefs.setString(metadataKey, jsonEncode(metadataJson));
    } catch (e) {
      print('[SaveSystem] Failed to update metadata: $e');
    }
  }

  Future<SaveSlotInfo?> _getSaveMetadata(String slotName) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final metadataKey = '${_saveKeyPrefix}metadata_$slotName';
      
      final metadataString = prefs.getString(metadataKey);
      if (metadataString == null) return null;
      
      final metadataJson = jsonDecode(metadataString) as Map<String, dynamic>;
      return SaveSlotInfo.fromJson(metadataJson);
    } catch (e) {
      print('[SaveSystem] Failed to get metadata: $e');
      return null;
    }
  }

  Future<void> _removeSaveMetadata(String slotName) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final metadataKey = '${_saveKeyPrefix}metadata_$slotName';
      await prefs.remove(metadataKey);
    } catch (e) {
      print('[SaveSystem] Failed to remove metadata: $e');
    }
  }
}

class GameSaveData {
  final Map<String, dynamic> player;
  final Map<String, dynamic> camera;
  final List<Map<String, dynamic>> buildings;
  final List<Map<String, dynamic>> allies;
  final Map<String, dynamic>? currentQuest;
  final int gameTime;
  final Map<String, dynamic> weatherData;
  final int version;

  GameSaveData({
    required this.player,
    required this.camera,
    required this.buildings,
    required this.allies,
    this.currentQuest,
    required this.gameTime,
    required this.weatherData,
    this.version = 1,
  });

  Map<String, dynamic> toJson() {
    return {
      'player': player,
      'camera': camera,
      'buildings': buildings,
      'allies': allies,
      'currentQuest': currentQuest,
      'gameTime': gameTime,
      'weatherData': weatherData,
      'version': version,
      'saveTime': DateTime.now().toIso8601String(),
    };
  }

  factory GameSaveData.fromJson(Map<String, dynamic> json) {
    return GameSaveData(
      player: json['player'] as Map<String, dynamic>,
      camera: json['camera'] as Map<String, dynamic>,
      buildings: List<Map<String, dynamic>>.from(json['buildings'] ?? []),
      allies: List<Map<String, dynamic>>.from(json['allies'] ?? []),
      currentQuest: json['currentQuest'] as Map<String, dynamic>?,
      gameTime: json['gameTime'] as int? ?? 0,
      weatherData: json['weatherData'] as Map<String, dynamic>? ?? {},
      version: json['version'] as int? ?? 1,
    );
  }
}

class SaveSlotInfo {
  final String slotName;
  final String playerName;
  final int level;
  final int gold;
  final int properties;
  final DateTime saveTime;
  final Duration playtime;

  SaveSlotInfo({
    required this.slotName,
    required this.playerName,
    required this.level,
    required this.gold,
    required this.properties,
    required this.saveTime,
    required this.playtime,
  });

  Map<String, dynamic> toJson() {
    return {
      'slotName': slotName,
      'playerName': playerName,
      'level': level,
      'gold': gold,
      'properties': properties,
      'saveTime': saveTime.toIso8601String(),
      'playtime': playtime.inMilliseconds,
    };
  }

  factory SaveSlotInfo.fromJson(Map<String, dynamic> json) {
    return SaveSlotInfo(
      slotName: json['slotName'] as String,
      playerName: json['playerName'] as String,
      level: json['level'] as int,
      gold: json['gold'] as int,
      properties: json['properties'] as int,
      saveTime: DateTime.parse(json['saveTime'] as String),
      playtime: Duration(milliseconds: json['playtime'] as int),
    );
  }

  String getPlaytimeString() {
    final hours = playtime.inHours;
    final minutes = playtime.inMinutes.remainder(60);
    return '${hours}h ${minutes}m';
  }
}