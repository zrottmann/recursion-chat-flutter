import 'package:flutter/material.dart';
import '../models/game_models.dart';

enum QuestType { main, side, daily, achievement }
enum QuestStatus { locked, available, active, completed, failed }

class QuestSystem {
  final List<QuestData> _allQuests = [];
  final List<QuestData> _activeQuests = [];
  final Map<String, dynamic> _questVariables = {};
  final List<DialogueChoice> _dialogueHistory = [];
  
  // Story progression
  int _mainQuestIndex = 0;
  int _karma = 0; // -100 (evil) to +100 (good)
  
  List<QuestData> get activeQuests => List.unmodifiable(_activeQuests);
  List<QuestData> get availableQuests => _allQuests.where((q) => q.status == QuestStatus.available).toList();
  int get karma => _karma;
  
  void initialize() {
    _initializeMainQuests();
    _initializeSideQuests();
    _initializeDailyQuests();
  }
  
  void _initializeMainQuests() {
    _allQuests.addAll([
      QuestData(
        id: 'main_001',
        type: QuestType.main,
        title: 'From Rags to Riches',
        description: 'You\'ve been evicted and lost everything. Time to rebuild from scratch.',
        status: QuestStatus.available,
        objectives: [
          QuestObjective(
            id: 'earn_first_500',
            description: 'Earn your first \$500',
            type: ObjectiveType.earnGold,
            targetValue: 500,
            currentValue: 0,
          ),
          QuestObjective(
            id: 'buy_first_property',
            description: 'Purchase your first property',
            type: ObjectiveType.buyProperty,
            targetValue: 1,
            currentValue: 0,
          ),
        ],
        rewards: QuestRewards(
          gold: 1000,
          exp: 500,
          items: ['starter_toolkit'],
          unlockedQuests: ['main_002'],
        ),
        dialogue: [
          DialogueNode(
            id: 'intro',
            speaker: 'Narrator',
            text: 'You stand on the street, evicted from your home. The city sprawls before you - full of opportunity and danger.',
            choices: [
              DialogueChoice(
                text: 'I\'ll show them all!',
                karmaChange: -10,
                nextNode: 'determined',
              ),
              DialogueChoice(
                text: 'I just want a fresh start.',
                karmaChange: 10,
                nextNode: 'hopeful',
              ),
            ],
          ),
        ],
      ),
      
      QuestData(
        id: 'main_002',
        type: QuestType.main,
        title: 'The Slumlord Rises',
        description: 'Build your property empire and establish dominance.',
        status: QuestStatus.locked,
        objectives: [
          QuestObjective(
            id: 'own_5_properties',
            description: 'Own 5 properties',
            type: ObjectiveType.buyProperty,
            targetValue: 5,
            currentValue: 0,
          ),
          QuestObjective(
            id: 'reach_level_10',
            description: 'Reach Level 10',
            type: ObjectiveType.reachLevel,
            targetValue: 10,
            currentValue: 0,
          ),
          QuestObjective(
            id: 'defeat_rival',
            description: 'Defeat your rival landlord',
            type: ObjectiveType.defeatEnemy,
            targetValue: 1,
            currentValue: 0,
            targetId: 'rival_boss',
          ),
        ],
        rewards: QuestRewards(
          gold: 5000,
          exp: 2000,
          items: ['golden_key', 'property_deed'],
          unlockedQuests: ['main_003'],
          specialReward: 'Unlock Luxury Properties',
        ),
      ),
      
      QuestData(
        id: 'main_003',
        type: QuestType.main,
        title: 'Empire of Shadows',
        description: 'Choose your path: Become a benevolent landlord or a ruthless mogul.',
        status: QuestStatus.locked,
        hasBranching: true,
        objectives: [
          QuestObjective(
            id: 'final_choice',
            description: 'Make the final choice',
            type: ObjectiveType.makeChoice,
            targetValue: 1,
            currentValue: 0,
          ),
        ],
        rewards: QuestRewards(
          gold: 10000,
          exp: 5000,
          specialReward: 'Multiple Endings Based on Karma',
        ),
      ),
    ]);
  }
  
  void _initializeSideQuests() {
    _allQuests.addAll([
      QuestData(
        id: 'side_tenant_trouble',
        type: QuestType.side,
        title: 'Tenant Troubles',
        description: 'One of your tenants hasn\'t paid rent in months. Handle the situation.',
        status: QuestStatus.available,
        objectives: [
          QuestObjective(
            id: 'investigate_tenant',
            description: 'Investigate the tenant\'s situation',
            type: ObjectiveType.investigate,
            targetValue: 1,
            currentValue: 0,
          ),
        ],
        rewards: QuestRewards(
          gold: 500,
          exp: 200,
          karmaChoices: true, // Rewards depend on how you handle it
        ),
        dialogue: [
          DialogueNode(
            id: 'tenant_door',
            speaker: 'You',
            text: 'You knock on apartment 3B. No answer.',
            choices: [
              DialogueChoice(
                text: 'Break down the door',
                karmaChange: -20,
                nextNode: 'force_entry',
              ),
              DialogueChoice(
                text: 'Talk to neighbors',
                karmaChange: 5,
                nextNode: 'investigate',
              ),
              DialogueChoice(
                text: 'Leave an eviction notice',
                karmaChange: -10,
                nextNode: 'evict',
              ),
            ],
          ),
        ],
      ),
      
      QuestData(
        id: 'side_protection_money',
        type: QuestType.side,
        title: 'Protection Racket',
        description: 'Local thugs are demanding protection money from your properties.',
        status: QuestStatus.available,
        objectives: [
          QuestObjective(
            id: 'deal_with_thugs',
            description: 'Deal with the protection racket',
            type: ObjectiveType.combat,
            targetValue: 3,
            currentValue: 0,
          ),
        ],
        rewards: QuestRewards(
          gold: 1500,
          exp: 500,
          items: ['thug_repellent'],
        ),
      ),
    ]);
  }
  
  void _initializeDailyQuests() {
    _allQuests.add(
      QuestData(
        id: 'daily_rent_collection',
        type: QuestType.daily,
        title: 'Daily Collections',
        description: 'Collect rent from 3 properties today.',
        status: QuestStatus.available,
        objectives: [
          QuestObjective(
            id: 'collect_rent_3',
            description: 'Collect rent from 3 properties',
            type: ObjectiveType.collectRent,
            targetValue: 3,
            currentValue: 0,
          ),
        ],
        rewards: QuestRewards(
          gold: 300,
          exp: 100,
        ),
        resetDaily: true,
      ),
    );
  }
  
  void startQuest(String questId) {
    final quest = _allQuests.firstWhere((q) => q.id == questId);
    if (quest.status == QuestStatus.available) {
      quest.status = QuestStatus.active;
      _activeQuests.add(quest);
      
      // Play starting dialogue if exists
      if (quest.dialogue.isNotEmpty) {
        _playDialogue(quest.dialogue.first);
      }
    }
  }
  
  void updateObjective(ObjectiveType type, {String? targetId, int value = 1}) {
    for (final quest in _activeQuests) {
      for (final objective in quest.objectives) {
        if (objective.type == type && 
            (targetId == null || objective.targetId == targetId)) {
          objective.currentValue = (objective.currentValue + value).clamp(0, objective.targetValue);
          
          // Check if quest is complete
          if (_isQuestComplete(quest)) {
            _completeQuest(quest);
          }
        }
      }
    }
  }
  
  bool _isQuestComplete(QuestData quest) {
    return quest.objectives.every((obj) => obj.currentValue >= obj.targetValue);
  }
  
  void _completeQuest(QuestData quest) {
    quest.status = QuestStatus.completed;
    _activeQuests.remove(quest);
    
    // Give rewards
    _grantRewards(quest.rewards);
    
    // Unlock new quests
    for (final unlockedId in quest.rewards.unlockedQuests) {
      final unlockedQuest = _allQuests.firstWhere(
        (q) => q.id == unlockedId,
        orElse: () => QuestData.empty(),
      );
      if (unlockedQuest.id.isNotEmpty) {
        unlockedQuest.status = QuestStatus.available;
      }
    }
    
    // Progress main story
    if (quest.type == QuestType.main) {
      _mainQuestIndex++;
    }
  }
  
  void _grantRewards(QuestRewards rewards) {
    // This would interact with the game engine to grant rewards
    print('Granting rewards: ${rewards.gold} gold, ${rewards.exp} exp');
  }
  
  void makeChoice(DialogueChoice choice) {
    _karma += choice.karmaChange;
    _karma = _karma.clamp(-100, 100);
    _dialogueHistory.add(choice);
    
    // Store choice for quest branching
    if (choice.variableName != null) {
      _questVariables[choice.variableName!] = choice.variableValue;
    }
    
    // Play next dialogue node if specified
    if (choice.nextNode != null) {
      // Find and play next node
    }
  }
  
  void _playDialogue(DialogueNode node) {
    // This would trigger the dialogue UI
  }
  
  String getStoryEnding() {
    if (_karma > 50) {
      return 'benevolent_ending';
    } else if (_karma < -50) {
      return 'ruthless_ending';
    } else {
      return 'neutral_ending';
    }
  }
  
  void resetDailyQuests() {
    for (final quest in _allQuests.where((q) => q.resetDaily)) {
      quest.status = QuestStatus.available;
      for (final objective in quest.objectives) {
        objective.currentValue = 0;
      }
    }
  }
}

// Quest data models
class QuestData {
  final String id;
  final QuestType type;
  final String title;
  final String description;
  QuestStatus status;
  final List<QuestObjective> objectives;
  final QuestRewards rewards;
  final List<DialogueNode> dialogue;
  final bool hasBranching;
  final bool resetDaily;
  
  QuestData({
    required this.id,
    required this.type,
    required this.title,
    required this.description,
    required this.status,
    required this.objectives,
    required this.rewards,
    this.dialogue = const [],
    this.hasBranching = false,
    this.resetDaily = false,
  });
  
  factory QuestData.empty() => QuestData(
    id: '',
    type: QuestType.side,
    title: '',
    description: '',
    status: QuestStatus.locked,
    objectives: [],
    rewards: QuestRewards(gold: 0, exp: 0),
  );
}

class QuestObjective {
  final String id;
  final String description;
  final ObjectiveType type;
  final int targetValue;
  int currentValue;
  final String? targetId;
  
  QuestObjective({
    required this.id,
    required this.description,
    required this.type,
    required this.targetValue,
    required this.currentValue,
    this.targetId,
  });
}

enum ObjectiveType {
  earnGold,
  buyProperty,
  collectRent,
  defeatEnemy,
  reachLevel,
  investigate,
  makeChoice,
  combat,
  talkTo,
  deliver,
}

class QuestRewards {
  final int gold;
  final int exp;
  final List<String> items;
  final List<String> unlockedQuests;
  final String? specialReward;
  final bool karmaChoices;
  
  QuestRewards({
    required this.gold,
    required this.exp,
    this.items = const [],
    this.unlockedQuests = const [],
    this.specialReward,
    this.karmaChoices = false,
  });
}

class DialogueNode {
  final String id;
  final String speaker;
  final String text;
  final List<DialogueChoice> choices;
  
  DialogueNode({
    required this.id,
    required this.speaker,
    required this.text,
    this.choices = const [],
  });
}

class DialogueChoice {
  final String text;
  final int karmaChange;
  final String? nextNode;
  final String? variableName;
  final dynamic variableValue;
  
  DialogueChoice({
    required this.text,
    this.karmaChange = 0,
    this.nextNode,
    this.variableName,
    this.variableValue,
  });
}