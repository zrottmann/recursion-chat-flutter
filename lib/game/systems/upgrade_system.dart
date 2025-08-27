import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../models/game_models.dart';

enum UpgradeType {
  security, parking, pool, gym, laundry, elevator,
  heating, airConditioning, internet, solar, garden,
  renovations, luxury, automation, maintenance
}

enum UpgradeCategory { basic, comfort, luxury, income, efficiency }

class PropertyUpgradeSystem {
  final Map<String, List<PropertyUpgrade>> _buildingUpgrades = {};
  final Map<UpgradeType, UpgradeTemplate> _upgradeTemplates = {};
  final math.Random _random = math.Random();
  
  // Economy factors
  double inflationRate = 1.0;
  double marketDemandMultiplier = 1.0;
  
  void initialize() {
    _initializeUpgradeTemplates();
  }
  
  void _initializeUpgradeTemplates() {
    _upgradeTemplates.addAll({
      UpgradeType.security: UpgradeTemplate(
        type: UpgradeType.security,
        name: 'Security System',
        category: UpgradeCategory.basic,
        baseCost: 2000,
        maintenanceCost: 50,
        levels: [
          UpgradeLevel(
            level: 1,
            name: 'Basic Locks',
            description: 'Reinforced doors and windows',
            cost: 2000,
            effects: {
              'tenant_happiness': 5,
              'crime_reduction': 20,
              'rent_increase': 5,
            },
          ),
          UpgradeLevel(
            level: 2,
            name: 'Security Cameras',
            description: 'CCTV system throughout property',
            cost: 5000,
            effects: {
              'tenant_happiness': 10,
              'crime_reduction': 40,
              'rent_increase': 10,
            },
          ),
          UpgradeLevel(
            level: 3,
            name: 'Guard Service',
            description: '24/7 security guard patrol',
            cost: 10000,
            effects: {
              'tenant_happiness': 20,
              'crime_reduction': 80,
              'rent_increase': 20,
            },
          ),
        ],
      ),
      
      UpgradeType.parking: UpgradeTemplate(
        type: UpgradeType.parking,
        name: 'Parking Facilities',
        category: UpgradeCategory.comfort,
        baseCost: 5000,
        maintenanceCost: 20,
        levels: [
          UpgradeLevel(
            level: 1,
            name: 'Street Parking',
            description: 'Reserved street parking spots',
            cost: 5000,
            effects: {
              'tenant_happiness': 8,
              'rent_increase': 10,
              'capacity_increase': 1,
            },
          ),
          UpgradeLevel(
            level: 2,
            name: 'Parking Lot',
            description: 'Dedicated parking lot',
            cost: 15000,
            effects: {
              'tenant_happiness': 15,
              'rent_increase': 20,
              'capacity_increase': 2,
            },
          ),
          UpgradeLevel(
            level: 3,
            name: 'Parking Garage',
            description: 'Multi-level covered parking',
            cost: 30000,
            effects: {
              'tenant_happiness': 25,
              'rent_increase': 35,
              'capacity_increase': 4,
            },
          ),
        ],
      ),
      
      UpgradeType.pool: UpgradeTemplate(
        type: UpgradeType.pool,
        name: 'Swimming Pool',
        category: UpgradeCategory.luxury,
        baseCost: 20000,
        maintenanceCost: 100,
        levels: [
          UpgradeLevel(
            level: 1,
            name: 'Community Pool',
            description: 'Basic outdoor pool',
            cost: 20000,
            effects: {
              'tenant_happiness': 15,
              'rent_increase': 25,
              'attracts_families': true,
            },
          ),
          UpgradeLevel(
            level: 2,
            name: 'Heated Pool',
            description: 'Year-round heated pool',
            cost: 35000,
            effects: {
              'tenant_happiness': 25,
              'rent_increase': 40,
              'attracts_professionals': true,
            },
          ),
          UpgradeLevel(
            level: 3,
            name: 'Resort Pool',
            description: 'Resort-style pool with amenities',
            cost: 50000,
            effects: {
              'tenant_happiness': 40,
              'rent_increase': 60,
              'property_value': 1.5,
            },
          ),
        ],
      ),
      
      UpgradeType.gym: UpgradeTemplate(
        type: UpgradeType.gym,
        name: 'Fitness Center',
        category: UpgradeCategory.comfort,
        baseCost: 10000,
        maintenanceCost: 80,
        levels: [
          UpgradeLevel(
            level: 1,
            name: 'Basic Gym',
            description: 'Basic workout equipment',
            cost: 10000,
            effects: {
              'tenant_happiness': 10,
              'rent_increase': 15,
              'tenant_health': 5,
            },
          ),
          UpgradeLevel(
            level: 2,
            name: 'Full Gym',
            description: 'Complete fitness facility',
            cost: 25000,
            effects: {
              'tenant_happiness': 20,
              'rent_increase': 30,
              'tenant_health': 15,
            },
          ),
          UpgradeLevel(
            level: 3,
            name: 'Spa & Wellness',
            description: 'Full spa and wellness center',
            cost: 45000,
            effects: {
              'tenant_happiness': 35,
              'rent_increase': 50,
              'tenant_health': 25,
            },
          ),
        ],
      ),
      
      UpgradeType.internet: UpgradeTemplate(
        type: UpgradeType.internet,
        name: 'High-Speed Internet',
        category: UpgradeCategory.basic,
        baseCost: 3000,
        maintenanceCost: 40,
        levels: [
          UpgradeLevel(
            level: 1,
            name: 'Basic WiFi',
            description: 'Shared WiFi network',
            cost: 3000,
            effects: {
              'tenant_happiness': 5,
              'rent_increase': 5,
              'attracts_students': true,
            },
          ),
          UpgradeLevel(
            level: 2,
            name: 'Fiber Internet',
            description: 'High-speed fiber connection',
            cost: 8000,
            effects: {
              'tenant_happiness': 15,
              'rent_increase': 15,
              'attracts_professionals': true,
            },
          ),
          UpgradeLevel(
            level: 3,
            name: 'Smart Building',
            description: 'IoT integrated smart home',
            cost: 20000,
            effects: {
              'tenant_happiness': 30,
              'rent_increase': 35,
              'energy_efficiency': 20,
            },
          ),
        ],
      ),
      
      UpgradeType.solar: UpgradeTemplate(
        type: UpgradeType.solar,
        name: 'Solar Panels',
        category: UpgradeCategory.efficiency,
        baseCost: 15000,
        maintenanceCost: 10,
        levels: [
          UpgradeLevel(
            level: 1,
            name: 'Solar Water Heating',
            description: 'Solar-powered water heating',
            cost: 15000,
            effects: {
              'energy_savings': 20,
              'eco_friendly': true,
              'maintenance_reduction': 10,
            },
          ),
          UpgradeLevel(
            level: 2,
            name: 'Partial Solar',
            description: '50% solar power coverage',
            cost: 30000,
            effects: {
              'energy_savings': 50,
              'rent_increase': 10,
              'tax_benefits': true,
            },
          ),
          UpgradeLevel(
            level: 3,
            name: 'Full Solar Grid',
            description: '100% renewable energy',
            cost: 50000,
            effects: {
              'energy_savings': 100,
              'rent_increase': 25,
              'sells_excess_power': true,
            },
          ),
        ],
      ),
    });
  }
  
  bool canPurchaseUpgrade(Building building, UpgradeType type, int level, int playerGold) {
    final template = _upgradeTemplates[type];
    if (template == null || level > template.levels.length) return false;
    
    final currentUpgrades = _buildingUpgrades[building.id] ?? [];
    final existingUpgrade = currentUpgrades.firstWhere(
      (u) => u.type == type,
      orElse: () => PropertyUpgrade.empty(),
    );
    
    // Check if already at or above this level
    if (existingUpgrade.id.isNotEmpty && existingUpgrade.level >= level) {
      return false;
    }
    
    // Check if can afford
    final cost = _calculateUpgradeCost(template.levels[level - 1], building);
    return playerGold >= cost;
  }
  
  int _calculateUpgradeCost(UpgradeLevel level, Building building) {
    double cost = level.cost.toDouble();
    
    // Apply building type multiplier
    switch (building.type) {
      case BuildingType.warehouse:
        cost *= 1.5;
        break;
      case BuildingType.largeHouse:
        cost *= 1.3;
        break;
      case BuildingType.tavern:
        cost *= 1.2;
        break;
      default:
        break;
    }
    
    // Apply market factors
    cost *= inflationRate;
    cost *= marketDemandMultiplier;
    
    return cost.round();
  }
  
  bool purchaseUpgrade(Building building, UpgradeType type, int level, Player player) {
    if (!canPurchaseUpgrade(building, type, level, player.gold)) {
      return false;
    }
    
    final template = _upgradeTemplates[type]!;
    final upgradeLevel = template.levels[level - 1];
    final cost = _calculateUpgradeCost(upgradeLevel, building);
    
    player.gold -= cost;
    
    // Add or update the upgrade
    final upgrades = _buildingUpgrades[building.id] ?? [];
    final existingIndex = upgrades.indexWhere((u) => u.type == type);
    
    final upgrade = PropertyUpgrade(
      id: 'upgrade_${building.id}_${type.name}_${DateTime.now().millisecondsSinceEpoch}',
      type: type,
      name: upgradeLevel.name,
      level: level,
      effects: upgradeLevel.effects,
      maintenanceCost: template.maintenanceCost * level,
      purchaseDate: DateTime.now(),
    );
    
    if (existingIndex >= 0) {
      upgrades[existingIndex] = upgrade;
    } else {
      upgrades.add(upgrade);
    }
    
    _buildingUpgrades[building.id] = upgrades;
    
    // Apply immediate effects
    _applyUpgradeEffects(building, upgradeLevel.effects);
    
    return true;
  }
  
  void _applyUpgradeEffects(Building building, Map<String, dynamic> effects) {
    effects.forEach((key, value) {
      switch (key) {
        case 'rent_increase':
          // This would increase the building's base rent
          break;
        case 'tenant_happiness':
          // This would boost all tenant happiness in the building
          break;
        case 'energy_savings':
          // This would reduce maintenance costs
          break;
        case 'property_value':
          // This would increase the building's resale value
          break;
        // Add more effect handlers as needed
      }
    });
  }
  
  Map<String, dynamic> getBuildingUpgradeStats(String buildingId) {
    final upgrades = _buildingUpgrades[buildingId] ?? [];
    
    if (upgrades.isEmpty) {
      return {
        'totalUpgrades': 0,
        'totalMaintenanceCost': 0,
        'totalRentBonus': 0,
        'categories': <String>[],
      };
    }
    
    int totalMaintenance = 0;
    int totalRentBonus = 0;
    final categories = <String>{};
    
    for (final upgrade in upgrades) {
      totalMaintenance += upgrade.maintenanceCost;
      totalRentBonus += (upgrade.effects['rent_increase'] ?? 0) as int;
      
      final template = _upgradeTemplates[upgrade.type];
      if (template != null) {
        categories.add(template.category.name);
      }
    }
    
    return {
      'totalUpgrades': upgrades.length,
      'totalMaintenanceCost': totalMaintenance,
      'totalRentBonus': totalRentBonus,
      'categories': categories.toList(),
      'upgrades': upgrades.map((u) => {
        'name': u.name,
        'level': u.level,
        'type': u.type.name,
      }).toList(),
    };
  }
  
  List<UpgradeRecommendation> getRecommendedUpgrades(Building building) {
    final recommendations = <UpgradeRecommendation>[];
    final currentUpgrades = _buildingUpgrades[building.id] ?? [];
    
    // Recommend based on building type and current state
    if (!_hasUpgrade(currentUpgrades, UpgradeType.security)) {
      recommendations.add(UpgradeRecommendation(
        type: UpgradeType.security,
        reason: 'Improve tenant safety and reduce crime',
        priority: 3,
      ));
    }
    
    if (building.condition < 50 && !_hasUpgrade(currentUpgrades, UpgradeType.maintenance)) {
      recommendations.add(UpgradeRecommendation(
        type: UpgradeType.maintenance,
        reason: 'Building condition is poor',
        priority: 5,
      ));
    }
    
    if (!_hasUpgrade(currentUpgrades, UpgradeType.internet)) {
      recommendations.add(UpgradeRecommendation(
        type: UpgradeType.internet,
        reason: 'Attract modern tenants',
        priority: 2,
      ));
    }
    
    return recommendations;
  }
  
  bool _hasUpgrade(List<PropertyUpgrade> upgrades, UpgradeType type) {
    return upgrades.any((u) => u.type == type);
  }
}

// Upgrade models
class UpgradeTemplate {
  final UpgradeType type;
  final String name;
  final UpgradeCategory category;
  final int baseCost;
  final int maintenanceCost;
  final List<UpgradeLevel> levels;
  
  UpgradeTemplate({
    required this.type,
    required this.name,
    required this.category,
    required this.baseCost,
    required this.maintenanceCost,
    required this.levels,
  });
}

class UpgradeLevel {
  final int level;
  final String name;
  final String description;
  final int cost;
  final Map<String, dynamic> effects;
  
  UpgradeLevel({
    required this.level,
    required this.name,
    required this.description,
    required this.cost,
    required this.effects,
  });
}

class PropertyUpgrade {
  final String id;
  final UpgradeType type;
  final String name;
  final int level;
  final Map<String, dynamic> effects;
  final int maintenanceCost;
  final DateTime purchaseDate;
  
  PropertyUpgrade({
    required this.id,
    required this.type,
    required this.name,
    required this.level,
    required this.effects,
    required this.maintenanceCost,
    required this.purchaseDate,
  });
  
  factory PropertyUpgrade.empty() => PropertyUpgrade(
    id: '',
    type: UpgradeType.security,
    name: '',
    level: 0,
    effects: {},
    maintenanceCost: 0,
    purchaseDate: DateTime.now(),
  );
}

class UpgradeRecommendation {
  final UpgradeType type;
  final String reason;
  final int priority;
  
  UpgradeRecommendation({
    required this.type,
    required this.reason,
    required this.priority,
  });
}