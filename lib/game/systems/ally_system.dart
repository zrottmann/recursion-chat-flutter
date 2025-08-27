import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../models/game_models.dart';

class AllySystem {
  final List<Ally> _allies = [];
  final math.Random _random = math.Random();

  List<Ally> getAllies() => List.unmodifiable(_allies);

  void update(double deltaTime, Player player, Camera camera) {
    for (final ally in _allies) {
      _updateAlly(ally, deltaTime, player);
    }
  }

  void _updateAlly(Ally ally, double deltaTime, Player player) {
    ally.update(deltaTime);
    
    switch (ally.state) {
      case AllyState.idle:
        _handleIdleState(ally, player);
        break;
      case AllyState.following:
        _handleFollowingState(ally, player, deltaTime);
        break;
      case AllyState.attacking:
        _handleAttackingState(ally, deltaTime);
        break;
      case AllyState.fainted:
        _handleFaintedState(ally);
        break;
      case AllyState.evolving:
        _handleEvolvingState(ally);
        break;
    }
  }

  void _handleIdleState(Ally ally, Player player) {
    // Check if player is nearby to start following
    final distance = ally.getDistanceTo(player.x, player.y);
    if (distance > 150) {
      ally.state = AllyState.following;
    }
    
    // Random idle movement
    if (_random.nextDouble() < 0.01) {
      ally.x += (_random.nextDouble() - 0.5) * 20;
      ally.y += (_random.nextDouble() - 0.5) * 20;
    }
  }

  void _handleFollowingState(Ally ally, Player player, double deltaTime) {
    final distance = ally.getDistanceTo(player.x, player.y);
    
    if (distance < 80) {
      ally.state = AllyState.idle;
      return;
    }
    
    // Move towards player
    final dx = player.x - ally.x;
    final dy = player.y - ally.y;
    final moveRatio = ally.speed / distance;
    
    ally.x += dx * moveRatio;
    ally.y += dy * moveRatio;
    
    // Set direction based on movement
    if (dx.abs() > dy.abs()) {
      ally.direction = dx > 0 ? Direction.right : Direction.left;
    } else {
      ally.direction = dy > 0 ? Direction.down : Direction.up;
    }
  }

  void _handleAttackingState(Ally ally, double deltaTime) {
    // Attack animation and logic would go here
    // For now, just return to idle after a short time
    ally.state = AllyState.idle;
  }

  void _handleFaintedState(Ally ally) {
    // Ally is unconscious - could implement revival mechanics
  }

  void _handleEvolvingState(Ally ally) {
    // Evolution animation and transformation logic
    if (ally.canEvolve() && ally.evolutionTarget != null) {
      _evolveAlly(ally);
    }
    ally.state = AllyState.idle;
  }

  void _evolveAlly(Ally ally) {
    final evolutionTarget = ally.evolutionTarget!;
    final template = AllyTemplates.getTemplate(evolutionTarget);
    
    if (template != null) {
      // Update ally properties based on evolution template
      ally.species = template.species;
      ally.tier = template.tier;
      ally.maxHealth = template.baseHealth + (ally.level * 5);
      ally.health = ally.maxHealth;
      ally.attack = template.baseAttack + (ally.level * 2);
      ally.defense = template.baseDefense + (ally.level * 2);
      ally.speed = template.baseSpeed;
      ally.color = template.color;
      ally.evolutionTarget = template.evolutionTarget;
      ally.evolutionLevel = template.evolutionLevel;
    }
  }

  void spawnAllyForBuilding(Building building) {
    // Spawn an ally near the building
    final species = _getRandomTier1Species();
    final template = AllyTemplates.getTemplate(species);
    
    if (template != null) {
      final ally = Ally(
        id: 'ally_${building.id}_${DateTime.now().millisecondsSinceEpoch}',
        name: template.name,
        species: species,
        x: building.x + building.width * 16,
        y: building.y + building.height * 16,
        health: template.baseHealth,
        maxHealth: template.baseHealth,
        attack: template.baseAttack,
        defense: template.baseDefense,
        speed: template.baseSpeed,
        color: template.color,
        evolutionTarget: template.evolutionTarget,
        evolutionLevel: template.evolutionLevel,
      );
      
      _allies.add(ally);
    }
  }

  String _getRandomTier1Species() {
    final tier1Templates = AllyTemplates.getTier1Templates();
    final randomIndex = _random.nextInt(tier1Templates.length);
    return tier1Templates[randomIndex].species;
  }

  void addAlly(Ally ally) {
    _allies.add(ally);
  }

  void removeAlly(String allyId) {
    _allies.removeWhere((ally) => ally.id == allyId);
  }

  Ally? getAllyById(String id) {
    try {
      return _allies.firstWhere((ally) => ally.id == id);
    } catch (e) {
      return null;
    }
  }

  Ally? getAllyAtPosition(double x, double y, {double radius = 50.0}) {
    for (final ally in _allies) {
      final distance = ally.getDistanceTo(x, y);
      if (distance <= radius) {
        return ally;
      }
    }
    return null;
  }

  List<Ally> getAlliesInRadius(double x, double y, double radius) {
    return _allies.where((ally) {
      final distance = ally.getDistanceTo(x, y);
      return distance <= radius;
    }).toList();
  }

  void healAlly(String allyId, int amount) {
    final ally = getAllyById(allyId);
    if (ally != null) {
      ally.health = math.min(ally.health + amount, ally.maxHealth);
      if (ally.state == AllyState.fainted && ally.health > 0) {
        ally.state = AllyState.idle;
      }
    }
  }

  void giveExpToAlly(String allyId, int expAmount) {
    final ally = getAllyById(allyId);
    if (ally != null) {
      ally.exp += expAmount;
      
      // Check for level up
      final expNeeded = ally.level * 50;
      if (ally.exp >= expNeeded) {
        ally.level++;
        ally.exp -= expNeeded;
        ally.maxHealth += 10;
        ally.health = ally.maxHealth;
        ally.attack += 3;
        ally.defense += 2;
        
        // Check for evolution
        if (ally.canEvolve()) {
          ally.state = AllyState.evolving;
        }
      }
    }
  }
}