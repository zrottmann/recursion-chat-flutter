import 'package:flutter/material.dart';
import 'dart:math' as math;

/// Core game models for the Slumlord Flutter game
/// Direct port from JavaScript with enhanced Flutter integration

enum Direction { up, down, left, right }
enum TileType { grass, wall, tree, water, road, floor, house, rock, fountain }
enum ParticleType { spark, money, xp }
enum BuildingType { 
  smallHouse, 
  mediumHouse, 
  largeHouse, 
  shop, 
  tavern, 
  warehouse 
}

extension BuildingTypeExtension on BuildingType {
  String get name {
    switch (this) {
      case BuildingType.smallHouse:
        return 'Small House';
      case BuildingType.mediumHouse:
        return 'Medium House';
      case BuildingType.largeHouse:
        return 'Large House';
      case BuildingType.shop:
        return 'Shop';
      case BuildingType.tavern:
        return 'Tavern';
      case BuildingType.warehouse:
        return 'Warehouse';
    }
  }

  int get baseRent {
    switch (this) {
      case BuildingType.smallHouse:
        return 150;
      case BuildingType.mediumHouse:
        return 300;
      case BuildingType.largeHouse:
        return 500;
      case BuildingType.shop:
        return 250;
      case BuildingType.tavern:
        return 400;
      case BuildingType.warehouse:
        return 600;
    }
  }

  Color get color {
    switch (this) {
      case BuildingType.smallHouse:
        return Colors.amber;
      case BuildingType.mediumHouse:
        return Colors.green;
      case BuildingType.largeHouse:
        return Colors.blue;
      case BuildingType.shop:
        return Colors.purple;
      case BuildingType.tavern:
        return Colors.orange;
      case BuildingType.warehouse:
        return Colors.cyan;
    }
  }
}

class Player {
  double x;
  double y;
  double size;
  double speed;
  int health;
  int maxHealth;
  int level;
  int exp;
  int expToNext;
  int gold;
  int properties;
  int reputation;
  int heat;
  Direction direction;
  double walkFrame;
  bool isMoving;
  int lastMoveTime;
  double glowIntensity;
  Color color;

  Player({
    required this.x,
    required this.y,
    required this.size,
    required this.speed,
    required this.health,
    required this.maxHealth,
    required this.level,
    required this.exp,
    required this.expToNext,
    required this.gold,
    required this.properties,
    required this.reputation,
    required this.heat,
    this.direction = Direction.down,
    this.walkFrame = 0.0,
    this.isMoving = false,
    this.lastMoveTime = 0,
    this.glowIntensity = 0.0,
    this.color = Colors.green,
  });
}

class Camera {
  double x;
  double y;
  double shake;

  Camera({
    required this.x,
    required this.y,
    required this.shake,
  });
}

class GameMap {
  final String name;
  final int width;
  final int height;
  final List<List<TileType>> tiles;

  GameMap({
    required this.name,
    required this.width,
    required this.height,
    required this.tiles,
  });

  TileType getTile(int x, int y) {
    if (x < 0 || x >= width || y < 0 || y >= height) {
      return TileType.wall; // Out of bounds
    }
    return tiles[y][x];
  }

  bool isSolid(int x, int y) {
    final tile = getTile(x, y);
    const solidTiles = {
      TileType.wall,
      TileType.tree,
      TileType.house,
      TileType.rock,
      TileType.water,
      TileType.fountain,
    };
    return solidTiles.contains(tile);
  }
}

class Building {
  final String id;
  final BuildingType type;
  final double x;
  final double y;
  final double width;
  final double height;
  final int price;
  bool owned;
  bool forSale;
  double condition;
  int lastMaintenance;

  Building({
    required this.id,
    required this.type,
    required this.x,
    required this.y,
    required this.width,
    required this.height,
    required this.price,
    this.owned = false,
    this.forSale = true,
    this.condition = 80.0,
    int? lastMaintenance,
  }) : lastMaintenance = lastMaintenance ?? DateTime.now().millisecondsSinceEpoch;

  int getRentAmount() {
    final baseRent = type.baseRent;
    final conditionMultiplier = condition / 100.0;
    return (baseRent * conditionMultiplier).round();
  }

  bool contains(double px, double py, double playerSize) {
    return px + playerSize > x - 25 &&
           px - playerSize < x + width + 25 &&
           py + playerSize > y - 25 &&
           py - playerSize < y + height + 25;
  }
}

class Ally {
  final String id;
  final String name;
  final String species;
  double x;
  double y;
  double size;
  int level;
  int exp;
  int tier;
  int health;
  int maxHealth;
  int attack;
  int defense;
  double speed;
  Color color;
  String? evolutionTarget;
  int? evolutionLevel;
  AllyState state;
  Direction direction;
  double animationFrame;
  double bob;
  int lastUpdate;

  Ally({
    required this.id,
    required this.name,
    required this.species,
    required this.x,
    required this.y,
    this.size = 16.0,
    this.level = 1,
    this.exp = 0,
    this.tier = 1,
    required this.health,
    required this.maxHealth,
    required this.attack,
    required this.defense,
    this.speed = 2.0,
    required this.color,
    this.evolutionTarget,
    this.evolutionLevel,
    this.state = AllyState.idle,
    this.direction = Direction.down,
    this.animationFrame = 0.0,
    this.bob = 0.0,
    int? lastUpdate,
  }) : lastUpdate = lastUpdate ?? DateTime.now().millisecondsSinceEpoch;

  bool canEvolve() {
    return evolutionTarget != null && 
           evolutionLevel != null && 
           level >= evolutionLevel!;
  }

  void update(double deltaTime) {
    animationFrame += deltaTime * 0.05;
    bob += deltaTime * 0.002;
    lastUpdate = DateTime.now().millisecondsSinceEpoch;
  }

  double getDistanceTo(double px, double py) {
    final dx = x - px;
    final dy = y - py;
    return math.sqrt(dx * dx + dy * dy);
  }
}

enum AllyState { idle, following, attacking, fainted, evolving }

class AllyTemplate {
  final String name;
  final String species;
  final int baseHealth;
  final int baseAttack;
  final int baseDefense;
  final double baseSpeed;
  final Color color;
  final String? evolutionTarget;
  final int? evolutionLevel;
  final int tier;

  const AllyTemplate({
    required this.name,
    required this.species,
    required this.baseHealth,
    required this.baseAttack,
    required this.baseDefense,
    required this.baseSpeed,
    required this.color,
    this.evolutionTarget,
    this.evolutionLevel,
    this.tier = 1,
  });
}

// Ally creature templates (ported from JavaScript)
class AllyTemplates {
  static const Map<String, AllyTemplate> templates = {
    'pixie': AllyTemplate(
      name: 'Forest Pixie',
      species: 'pixie',
      baseHealth: 25,
      baseAttack: 12,
      baseDefense: 8,
      baseSpeed: 3.5,
      color: Colors.pink,
      evolutionTarget: 'sprite',
      evolutionLevel: 5,
    ),
    'sprite': AllyTemplate(
      name: 'Nature Sprite',
      species: 'sprite',
      baseHealth: 40,
      baseAttack: 18,
      baseDefense: 12,
      baseSpeed: 4.0,
      color: Colors.lightGreen,
      tier: 2,
      evolutionTarget: 'guardian',
      evolutionLevel: 12,
    ),
    'guardian': AllyTemplate(
      name: 'Forest Guardian',
      species: 'guardian',
      baseHealth: 80,
      baseAttack: 35,
      baseDefense: 25,
      baseSpeed: 3.0,
      color: Colors.green,
      tier: 3,
    ),
    'imp': AllyTemplate(
      name: 'Shadow Imp',
      species: 'imp',
      baseHealth: 20,
      baseAttack: 15,
      baseDefense: 6,
      baseSpeed: 4.0,
      color: Colors.red,
      evolutionTarget: 'demon',
      evolutionLevel: 6,
    ),
    'demon': AllyTemplate(
      name: 'Lesser Demon',
      species: 'demon',
      baseHealth: 60,
      baseAttack: 30,
      baseDefense: 15,
      baseSpeed: 3.5,
      color: Colors.deepOrange,
      tier: 2,
    ),
    'wisp': AllyTemplate(
      name: 'Will-o-Wisp',
      species: 'wisp',
      baseHealth: 15,
      baseAttack: 20,
      baseDefense: 5,
      baseSpeed: 5.0,
      color: Colors.lightBlue,
      evolutionTarget: 'elemental',
      evolutionLevel: 8,
    ),
    'elemental': AllyTemplate(
      name: 'Air Elemental',
      species: 'elemental',
      baseHealth: 55,
      baseAttack: 40,
      baseDefense: 12,
      baseSpeed: 4.5,
      color: Colors.cyan,
      tier: 2,
    ),
  };

  static AllyTemplate? getTemplate(String species) {
    return templates[species];
  }

  static List<String> getAllSpecies() {
    return templates.keys.toList();
  }

  static List<AllyTemplate> getTier1Templates() {
    return templates.values.where((t) => t.tier == 1).toList();
  }
}

class Particle {
  double x;
  double y;
  double vx;
  double vy;
  double life;
  double maxLife;
  Color color;
  ParticleType type;
  double size;

  Particle({
    required this.x,
    required this.y,
    double? vx,
    double? vy,
    this.life = 1.0,
    this.maxLife = 1.0,
    required this.color,
    this.type = ParticleType.spark,
    double? size,
  }) : vx = vx ?? (math.Random().nextDouble() - 0.5) * 4,
       vy = vy ?? (math.Random().nextDouble() - 0.5) * 4,
       size = size ?? math.Random().nextDouble() * 4 + 2;

  void update(double deltaTime) {
    x += vx * deltaTime * 0.1;
    y += vy * deltaTime * 0.1;
    life -= deltaTime * 0.001;
    vy += deltaTime * 0.002; // gravity
    
    if (type == ParticleType.money) {
      vy = math.sin(x * 0.1 + DateTime.now().millisecondsSinceEpoch * 0.005) * 0.5;
    }
  }

  bool isDead() => life <= 0;

  double get alpha => life / maxLife;
}

class GameNotification {
  final String text;
  final Color color;
  final int duration;
  int _createdAt;
  
  GameNotification({
    required this.text,
    required this.color,
    required this.duration,
  }) : _createdAt = DateTime.now().millisecondsSinceEpoch;

  void update(double deltaTime) {
    // Notifications handle their own lifecycle
  }

  bool isDead() {
    return DateTime.now().millisecondsSinceEpoch - _createdAt > duration;
  }

  double get alpha {
    final elapsed = DateTime.now().millisecondsSinceEpoch - _createdAt;
    final fadeStart = duration - 500; // Start fading 500ms before death
    
    if (elapsed < fadeStart) {
      return 1.0;
    } else {
      final fadeProgress = (elapsed - fadeStart) / 500.0;
      return 1.0 - fadeProgress.clamp(0.0, 1.0);
    }
  }
}

class Quest {
  final String id;
  final String title;
  final String description;
  final List<String> objectives;
  final Map<String, int> rewards;
  int progress;

  Quest({
    required this.id,
    required this.title,
    required this.description,
    required this.objectives,
    required this.rewards,
    this.progress = 0,
  });
}

// Input system models
class MovementTarget {
  final double x;
  final double y;
  bool active;

  MovementTarget({
    required this.x,
    required this.y,
    this.active = true,
  });
}