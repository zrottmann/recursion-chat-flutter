import '../models/game_models.dart';

class CollisionSystem {
  GameMap? _gameMap;
  List<Building> _buildings = [];

  void initializeWithMap(GameMap gameMap) {
    _gameMap = gameMap;
  }

  void setBuildings(List<Building> buildings) {
    _buildings = buildings;
  }

  bool checkCollision(double x, double y, double size) {
    if (_gameMap == null) return false;

    final halfSize = size / 2;
    
    // Check 4 corners of the player
    return _checkTileCollision(x - halfSize, y - halfSize) ||
           _checkTileCollision(x + halfSize, y - halfSize) ||
           _checkTileCollision(x - halfSize, y + halfSize) ||
           _checkTileCollision(x + halfSize, y + halfSize);
  }

  bool _checkTileCollision(double x, double y) {
    if (_gameMap == null) return false;
    
    // Convert world coordinates to tile coordinates
    final tileSize = 32.0;
    final tileX = (x / tileSize).floor();
    final tileY = (y / tileSize).floor();
    
    // Check map boundary collision
    if (tileX < 0 || tileX >= _gameMap!.width || 
        tileY < 0 || tileY >= _gameMap!.height) {
      return true;
    }
    
    // Check tile collision
    if (_gameMap!.isSolid(tileX, tileY)) {
      return true;
    }
    
    // Check building collision
    for (final building in _buildings) {
      if (_isPointInBuilding(x, y, building)) {
        return true;
      }
    }
    
    return false;
  }

  bool _isPointInBuilding(double x, double y, Building building) {
    return x >= building.x && 
           x < building.x + building.width * 32 &&
           y >= building.y &&
           y < building.y + building.height * 32;
  }

  bool checkBuildingCollision(double x, double y, double size, Building building) {
    final halfSize = size / 2;
    
    // Check if player overlaps with building bounds
    return !(x + halfSize < building.x ||
             x - halfSize > building.x + building.width * 32 ||
             y + halfSize < building.y ||
             y - halfSize > building.y + building.height * 32);
  }

  List<Building> getNearbyBuildings(double x, double y, double radius) {
    return _buildings.where((building) {
      final centerX = building.x + (building.width * 32) / 2;
      final centerY = building.y + (building.height * 32) / 2;
      final dx = centerX - x;
      final dy = centerY - y;
      final distance = (dx * dx + dy * dy);
      return distance <= (radius * radius);
    }).toList();
  }

  bool isValidPosition(double x, double y, double size) {
    return !checkCollision(x, y, size);
  }
}