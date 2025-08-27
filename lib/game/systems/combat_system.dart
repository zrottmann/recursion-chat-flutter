import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../models/game_models.dart';

enum CombatState { idle, engaging, fighting, victory, defeat }
enum AttackType { melee, ranged, magic, special }
enum EnemyType { thug, rival, inspector, boss }

class CombatSystem {
  CombatState _state = CombatState.idle;
  final List<Enemy> _activeEnemies = [];
  final List<CombatEffect> _activeEffects = [];
  final math.Random _random = math.Random();
  
  // Combat stats
  int _comboCount = 0;
  double _damageMultiplier = 1.0;
  int _dodgeCharges = 3;
  DateTime _lastDodgeTime = DateTime.now();
  
  CombatState get state => _state;
  List<Enemy> get activeEnemies => List.unmodifiable(_activeEnemies);
  int get comboCount => _comboCount;
  
  void update(double deltaTime, Player player) {
    // Update all enemies
    for (final enemy in _activeEnemies) {
      _updateEnemy(enemy, deltaTime, player);
    }
    
    // Update combat effects
    _activeEffects.removeWhere((effect) {
      effect.duration -= deltaTime;
      return effect.duration <= 0;
    });
    
    // Check combat state
    if (_activeEnemies.isNotEmpty && _state == CombatState.idle) {
      _state = CombatState.engaging;
    } else if (_activeEnemies.isEmpty && _state != CombatState.idle) {
      _endCombat(true);
    }
    
    // Regenerate dodge charges
    if (DateTime.now().difference(_lastDodgeTime).inSeconds > 5) {
      _dodgeCharges = math.min(_dodgeCharges + 1, 3);
    }
  }
  
  void _updateEnemy(Enemy enemy, double deltaTime, Player player) {
    switch (enemy.aiPattern) {
      case AIPattern.aggressive:
        _aggressiveAI(enemy, player, deltaTime);
        break;
      case AIPattern.defensive:
        _defensiveAI(enemy, player, deltaTime);
        break;
      case AIPattern.ranged:
        _rangedAI(enemy, player, deltaTime);
        break;
      case AIPattern.boss:
        _bossAI(enemy, player, deltaTime);
        break;
    }
    
    // Update enemy cooldowns
    enemy.attackCooldown = math.max(0, enemy.attackCooldown - deltaTime);
    enemy.specialCooldown = math.max(0, enemy.specialCooldown - deltaTime);
  }
  
  void _aggressiveAI(Enemy enemy, Player player, double deltaTime) {
    final distance = _getDistance(enemy.x, enemy.y, player.x, player.y);
    
    if (distance > 50) {
      // Move towards player
      _moveTowardsTarget(enemy, player.x, player.y, enemy.speed * deltaTime);
    } else if (enemy.attackCooldown <= 0) {
      // Attack!
      _enemyAttack(enemy, player, AttackType.melee);
      enemy.attackCooldown = 1000; // 1 second cooldown
    }
  }
  
  void _defensiveAI(Enemy enemy, Player player, double deltaTime) {
    final distance = _getDistance(enemy.x, enemy.y, player.x, player.y);
    
    if (distance < 100) {
      // Back away from player
      _moveAwayFromTarget(enemy, player.x, player.y, enemy.speed * deltaTime * 0.5);
    }
    
    if (distance > 80 && distance < 200 && enemy.attackCooldown <= 0) {
      // Counter attack at medium range
      _enemyAttack(enemy, player, AttackType.ranged);
      enemy.attackCooldown = 1500;
    }
  }
  
  void _rangedAI(Enemy enemy, Player player, double deltaTime) {
    final distance = _getDistance(enemy.x, enemy.y, player.x, player.y);
    
    // Maintain optimal distance
    if (distance < 150) {
      _moveAwayFromTarget(enemy, player.x, player.y, enemy.speed * deltaTime);
    } else if (distance > 250) {
      _moveTowardsTarget(enemy, player.x, player.y, enemy.speed * deltaTime);
    }
    
    // Shoot projectiles
    if (enemy.attackCooldown <= 0 && distance < 300) {
      _enemyAttack(enemy, player, AttackType.ranged);
      enemy.attackCooldown = 800;
    }
  }
  
  void _bossAI(Enemy enemy, Player player, double deltaTime) {
    // Complex boss patterns
    enemy.phaseTimer += deltaTime;
    
    switch (enemy.currentPhase) {
      case 0: // Aggressive phase
        _aggressiveAI(enemy, player, deltaTime);
        if (enemy.phaseTimer > 5000) {
          enemy.currentPhase = 1;
          enemy.phaseTimer = 0;
        }
        break;
        
      case 1: // Special attack phase
        if (enemy.specialCooldown <= 0) {
          _enemySpecialAttack(enemy, player);
          enemy.specialCooldown = 3000;
        }
        if (enemy.phaseTimer > 3000) {
          enemy.currentPhase = 2;
          enemy.phaseTimer = 0;
        }
        break;
        
      case 2: // Summon minions phase
        if (enemy.phaseTimer == 0) {
          _summonMinions(enemy);
        }
        _defensiveAI(enemy, player, deltaTime);
        if (enemy.phaseTimer > 4000) {
          enemy.currentPhase = 0;
          enemy.phaseTimer = 0;
        }
        break;
    }
  }
  
  void playerAttack(Player player, AttackType type) {
    if (_state != CombatState.fighting && _state != CombatState.engaging) return;
    
    _state = CombatState.fighting;
    
    // Calculate damage based on attack type
    int baseDamage = player.level * 5 + 10;
    
    switch (type) {
      case AttackType.melee:
        baseDamage += 15;
        break;
      case AttackType.ranged:
        baseDamage += 10;
        break;
      case AttackType.magic:
        baseDamage += 20;
        break;
      case AttackType.special:
        baseDamage += 30;
        _comboCount = 0; // Special attacks reset combo
        break;
    }
    
    // Apply combo multiplier
    baseDamage = (baseDamage * (1 + _comboCount * 0.1) * _damageMultiplier).round();
    _comboCount++;
    
    // Damage all enemies in range
    final attackRange = type == AttackType.melee ? 60 : 200;
    
    for (final enemy in _activeEnemies.toList()) {
      final distance = _getDistance(enemy.x, enemy.y, player.x, player.y);
      if (distance <= attackRange) {
        _damageEnemy(enemy, baseDamage, type);
      }
    }
  }
  
  void playerDodge(Player player) {
    if (_dodgeCharges <= 0) return;
    
    _dodgeCharges--;
    _lastDodgeTime = DateTime.now();
    
    // Grant temporary invincibility
    _activeEffects.add(CombatEffect(
      type: EffectType.invincibility,
      duration: 500, // 0.5 seconds
      power: 1.0,
    ));
    
    // Add dodge movement boost
    player.speed += 2;
    Future.delayed(const Duration(milliseconds: 500), () {
      player.speed -= 2;
    });
  }
  
  void _damageEnemy(Enemy enemy, int damage, AttackType type) {
    // Apply enemy defense
    final finalDamage = math.max(1, damage - enemy.defense);
    enemy.health -= finalDamage;
    
    // Create damage effect
    _createDamageEffect(enemy.x, enemy.y, finalDamage, type);
    
    // Check if enemy is defeated
    if (enemy.health <= 0) {
      _defeatEnemy(enemy);
    } else {
      // Stun briefly on hit
      enemy.stunDuration = 100;
    }
  }
  
  void _enemyAttack(Enemy enemy, Player player, AttackType type) {
    // Check if player is invincible
    if (_hasEffect(EffectType.invincibility)) return;
    
    final distance = _getDistance(enemy.x, enemy.y, player.x, player.y);
    final attackRange = type == AttackType.melee ? 60 : 200;
    
    if (distance <= attackRange) {
      int damage = enemy.attack;
      
      // Apply damage to player
      player.health = math.max(0, player.health - damage);
      
      // Reset combo on player hit
      _comboCount = 0;
      
      // Screen shake effect
      _createScreenShake(5);
    }
  }
  
  void _enemySpecialAttack(Enemy enemy, Player player) {
    // Boss special attacks
    switch (enemy.type) {
      case EnemyType.boss:
        // Area of effect attack
        for (int i = 0; i < 8; i++) {
          final angle = (math.pi * 2 / 8) * i;
          _createProjectile(
            enemy.x,
            enemy.y,
            math.cos(angle) * 5,
            math.sin(angle) * 5,
            enemy.attack * 2,
          );
        }
        break;
      default:
        _enemyAttack(enemy, player, AttackType.special);
    }
  }
  
  void _summonMinions(Enemy boss) {
    // Spawn 2-3 smaller enemies around the boss
    final count = 2 + _random.nextInt(2);
    
    for (int i = 0; i < count; i++) {
      final angle = (math.pi * 2 / count) * i;
      final enemy = Enemy(
        id: 'minion_${DateTime.now().millisecondsSinceEpoch}_$i',
        type: EnemyType.thug,
        x: boss.x + math.cos(angle) * 100,
        y: boss.y + math.sin(angle) * 100,
        health: 50,
        maxHealth: 50,
        attack: 10,
        defense: 5,
        speed: 3,
        aiPattern: AIPattern.aggressive,
      );
      _activeEnemies.add(enemy);
    }
  }
  
  void _defeatEnemy(Enemy enemy) {
    _activeEnemies.remove(enemy);
    
    // Drop rewards
    _dropRewards(enemy);
    
    // Check for victory
    if (_activeEnemies.isEmpty) {
      _endCombat(true);
    }
  }
  
  void _dropRewards(Enemy enemy) {
    // Gold drops
    final goldAmount = enemy.maxHealth + (enemy.type.index * 50);
    
    // XP drops
    final xpAmount = enemy.maxHealth ~/ 2 + (enemy.type.index * 25);
    
    // Chance for rare items
    if (_random.nextDouble() < 0.1) {
      // 10% chance for rare drop
    }
  }
  
  void _endCombat(bool victory) {
    _state = victory ? CombatState.victory : CombatState.defeat;
    
    // Reset combat variables
    _comboCount = 0;
    _damageMultiplier = 1.0;
    _activeEffects.clear();
    
    // Clear enemies on defeat too (respawn elsewhere)
    _activeEnemies.clear();
    
    // Transition back to idle after a delay
    Future.delayed(const Duration(seconds: 2), () {
      _state = CombatState.idle;
    });
  }
  
  void spawnEnemy(EnemyType type, double x, double y) {
    final enemy = _createEnemy(type, x, y);
    _activeEnemies.add(enemy);
  }
  
  Enemy _createEnemy(EnemyType type, double x, double y) {
    switch (type) {
      case EnemyType.thug:
        return Enemy(
          id: 'thug_${DateTime.now().millisecondsSinceEpoch}',
          type: type,
          x: x,
          y: y,
          health: 50,
          maxHealth: 50,
          attack: 15,
          defense: 5,
          speed: 2.5,
          aiPattern: AIPattern.aggressive,
        );
        
      case EnemyType.rival:
        return Enemy(
          id: 'rival_${DateTime.now().millisecondsSinceEpoch}',
          type: type,
          x: x,
          y: y,
          health: 100,
          maxHealth: 100,
          attack: 20,
          defense: 10,
          speed: 3,
          aiPattern: AIPattern.defensive,
        );
        
      case EnemyType.inspector:
        return Enemy(
          id: 'inspector_${DateTime.now().millisecondsSinceEpoch}',
          type: type,
          x: x,
          y: y,
          health: 80,
          maxHealth: 80,
          attack: 25,
          defense: 8,
          speed: 2,
          aiPattern: AIPattern.ranged,
        );
        
      case EnemyType.boss:
        return Enemy(
          id: 'boss_${DateTime.now().millisecondsSinceEpoch}',
          type: type,
          x: x,
          y: y,
          health: 500,
          maxHealth: 500,
          attack: 40,
          defense: 20,
          speed: 1.5,
          aiPattern: AIPattern.boss,
        );
    }
  }
  
  // Utility functions
  double _getDistance(double x1, double y1, double x2, double y2) {
    final dx = x2 - x1;
    final dy = y2 - y1;
    return math.sqrt(dx * dx + dy * dy);
  }
  
  void _moveTowardsTarget(Enemy enemy, double targetX, double targetY, double speed) {
    final dx = targetX - enemy.x;
    final dy = targetY - enemy.y;
    final distance = math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      enemy.x += (dx / distance) * speed;
      enemy.y += (dy / distance) * speed;
    }
  }
  
  void _moveAwayFromTarget(Enemy enemy, double targetX, double targetY, double speed) {
    final dx = enemy.x - targetX;
    final dy = enemy.y - targetY;
    final distance = math.sqrt(dx * dx + dy * dy);
    
    if (distance > 0) {
      enemy.x += (dx / distance) * speed;
      enemy.y += (dy / distance) * speed;
    }
  }
  
  bool _hasEffect(EffectType type) {
    return _activeEffects.any((effect) => effect.type == type);
  }
  
  void _createDamageEffect(double x, double y, int damage, AttackType type) {
    // This would create visual damage numbers in the game
  }
  
  void _createProjectile(double x, double y, double vx, double vy, int damage) {
    // This would create projectile entities in the game
  }
  
  void _createScreenShake(double intensity) {
    // This would trigger camera shake
  }
}

// Enemy model
class Enemy {
  final String id;
  final EnemyType type;
  double x;
  double y;
  int health;
  int maxHealth;
  int attack;
  int defense;
  double speed;
  AIPattern aiPattern;
  
  // Combat state
  double attackCooldown = 0;
  double specialCooldown = 0;
  double stunDuration = 0;
  
  // Boss specific
  int currentPhase = 0;
  double phaseTimer = 0;
  
  Enemy({
    required this.id,
    required this.type,
    required this.x,
    required this.y,
    required this.health,
    required this.maxHealth,
    required this.attack,
    required this.defense,
    required this.speed,
    required this.aiPattern,
  });
}

enum AIPattern { aggressive, defensive, ranged, boss }

// Combat effects
class CombatEffect {
  final EffectType type;
  double duration;
  final double power;
  
  CombatEffect({
    required this.type,
    required this.duration,
    required this.power,
  });
}

enum EffectType { invincibility, speedBoost, damageBoost, poison, slow }