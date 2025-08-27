import '../models/game_models.dart';
import 'dart:math' as math;

class BuildingSystem {
  final List<Building> _buildings = [];
  final math.Random _random = math.Random();

  List<Building> getBuildings() => List.unmodifiable(_buildings);

  void initializeBuildings(List<Building> buildings) {
    _buildings.clear();
    _buildings.addAll(buildings);
  }

  void update(double deltaTime) {
    for (final building in _buildings) {
      _updateBuilding(building, deltaTime);
    }
  }

  void _updateBuilding(Building building, double deltaTime) {
    if (building.owned) {
      // Decay building condition over time
      final decayRate = 0.001; // Very slow decay
      building.condition = math.max(0, building.condition - decayRate);
      
      // Buildings with very low condition might become unavailable for rent collection
      if (building.condition < 20) {
        // Could add maintenance requirements here
      }
    }
  }

  Building? getBuildingAtPosition(double x, double y, {double tolerance = 50.0}) {
    for (final building in _buildings) {
      if (building.contains(x, y, tolerance)) {
        return building;
      }
    }
    return null;
  }

  Building? getBuildingById(String id) {
    try {
      return _buildings.firstWhere((building) => building.id == id);
    } catch (e) {
      return null;
    }
  }

  List<Building> getOwnedBuildings() {
    return _buildings.where((building) => building.owned).toList();
  }

  List<Building> getBuildingsForSale() {
    return _buildings.where((building) => building.forSale && !building.owned).toList();
  }

  int getTotalRentIncome() {
    int total = 0;
    for (final building in _buildings) {
      if (building.owned) {
        total += building.getRentAmount();
      }
    }
    return total;
  }

  void addBuilding(Building building) {
    _buildings.add(building);
  }

  void removeBuilding(String buildingId) {
    _buildings.removeWhere((building) => building.id == buildingId);
  }

  bool purchaseBuilding(String buildingId, Player player) {
    final building = getBuildingById(buildingId);
    if (building == null || building.owned || !building.forSale) {
      return false;
    }
    
    if (player.gold < building.price) {
      return false;
    }
    
    player.gold -= building.price;
    player.properties++;
    building.owned = true;
    building.forSale = false;
    
    return true;
  }

  int collectRentFromBuilding(String buildingId) {
    final building = getBuildingById(buildingId);
    if (building == null || !building.owned) {
      return 0;
    }
    
    return building.getRentAmount();
  }

  void maintainBuilding(String buildingId, int maintenanceCost, Player player) {
    final building = getBuildingById(buildingId);
    if (building == null || !building.owned || player.gold < maintenanceCost) {
      return;
    }
    
    player.gold -= maintenanceCost;
    building.condition = math.min(100.0, building.condition + 20.0);
    building.lastMaintenance = DateTime.now().millisecondsSinceEpoch;
  }

  List<Building> getBuildingsNeedingMaintenance({double threshold = 50.0}) {
    return _buildings.where((building) {
      return building.owned && building.condition < threshold;
    }).toList();
  }

  void sellBuilding(String buildingId, Player player) {
    final building = getBuildingById(buildingId);
    if (building == null || !building.owned) {
      return;
    }
    
    // Sell for 70% of original price based on condition
    final conditionMultiplier = building.condition / 100.0;
    final sellPrice = (building.price * 0.7 * conditionMultiplier).round();
    
    player.gold += sellPrice;
    player.properties--;
    building.owned = false;
    building.forSale = true;
  }

  Map<BuildingType, int> getBuildingTypeCount() {
    final counts = <BuildingType, int>{};
    
    for (final building in _buildings) {
      if (building.owned) {
        counts[building.type] = (counts[building.type] ?? 0) + 1;
      }
    }
    
    return counts;
  }

  double getAverageCondition() {
    if (_buildings.isEmpty) return 0.0;
    
    final ownedBuildings = getOwnedBuildings();
    if (ownedBuildings.isEmpty) return 0.0;
    
    double totalCondition = 0.0;
    for (final building in ownedBuildings) {
      totalCondition += building.condition;
    }
    
    return totalCondition / ownedBuildings.length;
  }

  int calculateUpgradePrice(Building building, BuildingType newType) {
    final currentTypeIndex = BuildingType.values.indexOf(building.type);
    final newTypeIndex = BuildingType.values.indexOf(newType);
    
    if (newTypeIndex <= currentTypeIndex) {
      return 0; // Cannot downgrade
    }
    
    // Base upgrade cost increases exponentially
    final upgradeLevels = newTypeIndex - currentTypeIndex;
    return building.price * upgradeLevels * 2;
  }

  bool upgradeBuilding(String buildingId, BuildingType newType, Player player) {
    final building = getBuildingById(buildingId);
    if (building == null || !building.owned) {
      return false;
    }
    
    final upgradeCost = calculateUpgradePrice(building, newType);
    if (upgradeCost <= 0 || player.gold < upgradeCost) {
      return false;
    }
    
    player.gold -= upgradeCost;
    building.type = newType;
    building.condition = math.max(building.condition, 80.0); // Upgrade refreshes condition
    
    return true;
  }

  List<Building> getBuildingsInRadius(double x, double y, double radius) {
    return _buildings.where((building) {
      final centerX = building.x + building.width / 2;
      final centerY = building.y + building.height / 2;
      final dx = centerX - x;
      final dy = centerY - y;
      final distance = math.sqrt(dx * dx + dy * dy);
      return distance <= radius;
    }).toList();
  }
}