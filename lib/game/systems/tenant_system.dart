import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../models/game_models.dart';

enum TenantType { student, family, professional, artist, elderly, criminal }
enum TenantMood { happy, content, neutral, unhappy, angry }
enum ComplaintType { noise, repairs, rent, neighbors, pests, safety }

class TenantManagementSystem {
  final List<Tenant> _tenants = [];
  final List<TenantComplaint> _activeComplaints = [];
  final math.Random _random = math.Random();
  
  // System settings
  static const int maxTenantsPerBuilding = 4;
  static const double baseHappinessDecay = 0.1;
  static const double complaintChancePerDay = 0.05;
  
  List<Tenant> get tenants => List.unmodifiable(_tenants);
  List<TenantComplaint> get activeComplaints => List.unmodifiable(_activeComplaints);
  
  void update(double deltaTime, List<Building> buildings) {
    for (final tenant in _tenants) {
      _updateTenant(tenant, deltaTime);
    }
    
    // Process complaints
    _processComplaints(deltaTime);
    
    // Generate new tenants for empty units
    _generateNewTenants(buildings);
    
    // Random events
    if (_random.nextDouble() < 0.001 * deltaTime) {
      _triggerRandomEvent();
    }
  }
  
  void _updateTenant(Tenant tenant, double deltaTime) {
    // Decay happiness over time
    tenant.happiness -= baseHappinessDecay * deltaTime * 0.001;
    
    // Apply building condition effect
    final building = _getBuildingById(tenant.buildingId);
    if (building != null) {
      final conditionEffect = (building.condition - 50) / 100; // -0.5 to 0.5
      tenant.happiness += conditionEffect * deltaTime * 0.001;
    }
    
    // Update mood based on happiness
    tenant.mood = _calculateMood(tenant.happiness);
    
    // Generate complaints if unhappy
    if (tenant.mood == TenantMood.unhappy || tenant.mood == TenantMood.angry) {
      if (_random.nextDouble() < complaintChancePerDay * deltaTime * 0.001) {
        _generateComplaint(tenant);
      }
    }
    
    // Check for eviction conditions
    if (tenant.rentOwed > tenant.rentAmount * 3) {
      tenant.isEvictionNotice = true;
    }
    
    // Leave if too unhappy
    if (tenant.happiness <= 0 || tenant.isEvicted) {
      _evictTenant(tenant);
    }
  }
  
  void _generateComplaint(Tenant tenant) {
    final complaintTypes = ComplaintType.values;
    final type = complaintTypes[_random.nextInt(complaintTypes.length)];
    
    final complaint = TenantComplaint(
      id: 'complaint_${DateTime.now().millisecondsSinceEpoch}',
      tenantId: tenant.id,
      buildingId: tenant.buildingId,
      type: type,
      severity: _calculateComplaintSeverity(tenant.mood),
      description: _getComplaintDescription(type, tenant),
      createdAt: DateTime.now(),
    );
    
    _activeComplaints.add(complaint);
    tenant.activeComplaints++;
    
    // Happiness penalty for new complaint
    tenant.happiness -= 5;
  }
  
  String _getComplaintDescription(ComplaintType type, Tenant tenant) {
    switch (type) {
      case ComplaintType.noise:
        return '${tenant.name} complains about noise from neighbors';
      case ComplaintType.repairs:
        return '${tenant.name} needs repairs: ${_getRandomRepair()}';
      case ComplaintType.rent:
        return '${tenant.name} is struggling with rent payments';
      case ComplaintType.neighbors:
        return '${tenant.name} has issues with other tenants';
      case ComplaintType.pests:
        return '${tenant.name} reports pest problems';
      case ComplaintType.safety:
        return '${tenant.name} has safety concerns';
    }
  }
  
  String _getRandomRepair() {
    final repairs = [
      'Leaking faucet', 'Broken window', 'Heating issues',
      'Electrical problems', 'Door lock broken', 'Appliance failure'
    ];
    return repairs[_random.nextInt(repairs.length)];
  }
  
  void resolveComplaint(String complaintId, ComplaintResolution resolution) {
    final complaint = _activeComplaints.firstWhere(
      (c) => c.id == complaintId,
      orElse: () => TenantComplaint.empty(),
    );
    
    if (complaint.id.isEmpty) return;
    
    final tenant = _getTenantById(complaint.tenantId);
    if (tenant == null) return;
    
    switch (resolution) {
      case ComplaintResolution.fixed:
        tenant.happiness += 20;
        tenant.loyalty += 10;
        break;
      case ComplaintResolution.compensated:
        tenant.happiness += 15;
        tenant.rentOwed -= tenant.rentAmount * 0.5;
        break;
      case ComplaintResolution.ignored:
        tenant.happiness -= 15;
        tenant.loyalty -= 20;
        break;
      case ComplaintResolution.evicted:
        _evictTenant(tenant);
        break;
    }
    
    complaint.isResolved = true;
    tenant.activeComplaints--;
    _activeComplaints.remove(complaint);
  }
  
  void _processComplaints(double deltaTime) {
    for (final complaint in _activeComplaints) {
      if (!complaint.isResolved) {
        complaint.age += deltaTime;
        
        // Complaints get worse over time
        if (complaint.age > 3000) { // 3 seconds
          final tenant = _getTenantById(complaint.tenantId);
          if (tenant != null) {
            tenant.happiness -= 1 * deltaTime * 0.001;
          }
        }
      }
    }
    
    // Remove old resolved complaints
    _activeComplaints.removeWhere((c) => c.isResolved && c.age > 5000);
  }
  
  void addTenantToBuilding(String buildingId, Building building) {
    final currentTenants = _tenants.where((t) => t.buildingId == buildingId).length;
    
    if (currentTenants >= maxTenantsPerBuilding) return;
    
    final tenant = _generateTenant(buildingId, building.type);
    _tenants.add(tenant);
  }
  
  Tenant _generateTenant(String buildingId, BuildingType buildingType) {
    final types = TenantType.values;
    final type = types[_random.nextInt(types.length)];
    
    final names = _getTenantNames();
    final name = names[_random.nextInt(names.length)];
    
    return Tenant(
      id: 'tenant_${DateTime.now().millisecondsSinceEpoch}',
      name: name,
      type: type,
      buildingId: buildingId,
      unitNumber: _random.nextInt(maxTenantsPerBuilding) + 1,
      rentAmount: _calculateRent(buildingType, type),
      rentOwed: 0,
      happiness: 50 + _random.nextInt(30),
      loyalty: 50,
      mood: TenantMood.neutral,
      moveInDate: DateTime.now(),
      traits: _generateTraits(type),
    );
  }
  
  List<String> _getTenantNames() {
    return [
      'John Smith', 'Jane Doe', 'Mike Johnson', 'Sarah Wilson',
      'Tom Brown', 'Emily Davis', 'Chris Miller', 'Lisa Anderson',
      'David Taylor', 'Amy Thomas', 'Robert Jackson', 'Maria Garcia'
    ];
  }
  
  int _calculateRent(BuildingType buildingType, TenantType tenantType) {
    int baseRent = buildingType.baseRent;
    
    // Adjust based on tenant type
    switch (tenantType) {
      case TenantType.professional:
        baseRent = (baseRent * 1.2).round();
        break;
      case TenantType.student:
        baseRent = (baseRent * 0.8).round();
        break;
      case TenantType.family:
        baseRent = (baseRent * 1.1).round();
        break;
      case TenantType.elderly:
        baseRent = (baseRent * 0.9).round();
        break;
      case TenantType.artist:
        baseRent = (baseRent * 0.85).round();
        break;
      case TenantType.criminal:
        baseRent = (baseRent * 0.7).round();
        break;
    }
    
    return baseRent;
  }
  
  List<TenantTrait> _generateTraits(TenantType type) {
    final traits = <TenantTrait>[];
    
    switch (type) {
      case TenantType.student:
        traits.add(TenantTrait.noisy);
        if (_random.nextBool()) traits.add(TenantTrait.latePayer);
        break;
      case TenantType.professional:
        traits.add(TenantTrait.quiet);
        traits.add(TenantTrait.reliable);
        break;
      case TenantType.family:
        traits.add(TenantTrait.longTerm);
        if (_random.nextBool()) traits.add(TenantTrait.demanding);
        break;
      case TenantType.elderly:
        traits.add(TenantTrait.quiet);
        traits.add(TenantTrait.longTerm);
        break;
      case TenantType.artist:
        traits.add(TenantTrait.creative);
        if (_random.nextBool()) traits.add(TenantTrait.latePayer);
        break;
      case TenantType.criminal:
        traits.add(TenantTrait.trouble);
        traits.add(TenantTrait.cashPayer);
        break;
    }
    
    return traits;
  }
  
  TenantMood _calculateMood(double happiness) {
    if (happiness >= 80) return TenantMood.happy;
    if (happiness >= 60) return TenantMood.content;
    if (happiness >= 40) return TenantMood.neutral;
    if (happiness >= 20) return TenantMood.unhappy;
    return TenantMood.angry;
  }
  
  int _calculateComplaintSeverity(TenantMood mood) {
    switch (mood) {
      case TenantMood.happy:
      case TenantMood.content:
        return 1;
      case TenantMood.neutral:
        return 2;
      case TenantMood.unhappy:
        return 3;
      case TenantMood.angry:
        return 5;
    }
  }
  
  void collectRent(String buildingId) {
    final buildingTenants = _tenants.where((t) => t.buildingId == buildingId);
    
    for (final tenant in buildingTenants) {
      if (!tenant.isEvicted) {
        tenant.lastRentPayment = DateTime.now();
        tenant.rentOwed = 0;
        
        // Happy tenants pay on time
        if (tenant.mood == TenantMood.happy || tenant.mood == TenantMood.content) {
          tenant.loyalty += 2;
        }
      }
    }
  }
  
  void _evictTenant(Tenant tenant) {
    tenant.isEvicted = true;
    _tenants.remove(tenant);
    
    // Remove their complaints
    _activeComplaints.removeWhere((c) => c.tenantId == tenant.id);
  }
  
  void _generateNewTenants(List<Building> buildings) {
    for (final building in buildings.where((b) => b.owned)) {
      final currentTenants = _tenants.where((t) => t.buildingId == building.id).length;
      
      if (currentTenants < maxTenantsPerBuilding) {
        // Chance to attract new tenant based on building condition
        final attractionChance = building.condition / 1000;
        if (_random.nextDouble() < attractionChance) {
          addTenantToBuilding(building.id, building);
        }
      }
    }
  }
  
  void _triggerRandomEvent() {
    final events = [
      'Party complaint', 'Pipe burst', 'Tenant dispute',
      'Inspection notice', 'Tenant recommendation', 'Media coverage'
    ];
    
    final event = events[_random.nextInt(events.length)];
    // This would trigger event handling
    print('Random event: $event');
  }
  
  Map<String, dynamic> getBuildingStatistics(String buildingId) {
    final buildingTenants = _tenants.where((t) => t.buildingId == buildingId);
    
    if (buildingTenants.isEmpty) {
      return {'occupancy': 0, 'avgHappiness': 0, 'totalRent': 0};
    }
    
    final avgHappiness = buildingTenants.map((t) => t.happiness).reduce((a, b) => a + b) / buildingTenants.length;
    final totalRent = buildingTenants.map((t) => t.rentAmount).reduce((a, b) => a + b);
    final occupancy = (buildingTenants.length / maxTenantsPerBuilding * 100).round();
    
    return {
      'occupancy': occupancy,
      'avgHappiness': avgHappiness.round(),
      'totalRent': totalRent,
      'tenantCount': buildingTenants.length,
      'complaints': _activeComplaints.where((c) => c.buildingId == buildingId).length,
    };
  }
  
  Tenant? _getTenantById(String id) {
    try {
      return _tenants.firstWhere((t) => t.id == id);
    } catch (e) {
      return null;
    }
  }
  
  Building? _getBuildingById(String id) {
    // This would need to be connected to the building system
    return null;
  }
}

// Tenant model
class Tenant {
  final String id;
  final String name;
  final TenantType type;
  final String buildingId;
  final int unitNumber;
  final int rentAmount;
  int rentOwed;
  double happiness;
  double loyalty;
  TenantMood mood;
  final DateTime moveInDate;
  DateTime lastRentPayment;
  final List<TenantTrait> traits;
  int activeComplaints;
  bool isEvictionNotice;
  bool isEvicted;
  
  Tenant({
    required this.id,
    required this.name,
    required this.type,
    required this.buildingId,
    required this.unitNumber,
    required this.rentAmount,
    required this.rentOwed,
    required this.happiness,
    required this.loyalty,
    required this.mood,
    required this.moveInDate,
    required this.traits,
    DateTime? lastRentPayment,
    this.activeComplaints = 0,
    this.isEvictionNotice = false,
    this.isEvicted = false,
  }) : lastRentPayment = lastRentPayment ?? moveInDate;
}

enum TenantTrait {
  quiet, noisy, reliable, latePayer, longTerm,
  demanding, creative, trouble, cashPayer
}

class TenantComplaint {
  final String id;
  final String tenantId;
  final String buildingId;
  final ComplaintType type;
  final int severity;
  final String description;
  final DateTime createdAt;
  bool isResolved;
  double age;
  
  TenantComplaint({
    required this.id,
    required this.tenantId,
    required this.buildingId,
    required this.type,
    required this.severity,
    required this.description,
    required this.createdAt,
    this.isResolved = false,
    this.age = 0,
  });
  
  factory TenantComplaint.empty() => TenantComplaint(
    id: '',
    tenantId: '',
    buildingId: '',
    type: ComplaintType.noise,
    severity: 0,
    description: '',
    createdAt: DateTime.now(),
  );
}

enum ComplaintResolution { fixed, compensated, ignored, evicted }