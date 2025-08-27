import 'package:flutter/material.dart';
import '../slumlord_game_engine.dart';

class GameUIOverlay extends StatelessWidget {
  final SlumlordGameEngine gameEngine;

  const GameUIOverlay({super.key, required this.gameEngine});

  @override
  Widget build(BuildContext context) {
    return Stack(
      children: [
        // Player Stats (Top Left)
        Positioned(
          top: 16,
          left: 16,
          child: _buildPlayerStats(),
        ),
        
        // Notifications (Top Center)
        Positioned(
          top: 16,
          left: MediaQuery.of(context).size.width * 0.3,
          right: MediaQuery.of(context).size.width * 0.3,
          child: _buildNotifications(),
        ),
        
        // Quest Info (Top Right)
        if (gameEngine.currentQuest != null)
          Positioned(
            top: 16,
            right: 16,
            child: _buildQuestInfo(),
          ),
        
        // Controls Help (Bottom Left)
        Positioned(
          bottom: 16,
          left: 16,
          child: _buildControlsHelp(),
        ),
        
        // Building Info (Bottom Right)
        Positioned(
          bottom: 16,
          right: 16,
          child: _buildBuildingInfo(),
        ),
      ],
    );
  }

  Widget _buildPlayerStats() {
    final player = gameEngine.player;
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.8),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Level ${player.level}',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          
          // Health Bar
          _buildStatBar(
            'HP',
            player.health,
            player.maxHealth,
            Colors.red,
            Colors.red.withOpacity(0.3),
          ),
          
          // Experience Bar
          _buildStatBar(
            'EXP',
            player.exp,
            player.expToNext,
            Colors.blue,
            Colors.blue.withOpacity(0.3),
          ),
          
          const SizedBox(height: 8),
          
          // Resources
          Row(
            children: [
              Icon(Icons.attach_money, color: Colors.yellow, size: 16),
              const SizedBox(width: 4),
              Text(
                '${player.gold}',
                style: const TextStyle(color: Colors.white, fontSize: 14),
              ),
              const SizedBox(width: 16),
              Icon(Icons.home, color: Colors.green, size: 16),
              const SizedBox(width: 4),
              Text(
                '${player.properties}',
                style: const TextStyle(color: Colors.white, fontSize: 14),
              ),
            ],
          ),
          
          const SizedBox(height: 4),
          
          // Reputation & Heat
          Row(
            children: [
              Icon(Icons.favorite, color: Colors.pink, size: 16),
              const SizedBox(width: 4),
              Text(
                '${player.reputation}',
                style: const TextStyle(color: Colors.white, fontSize: 14),
              ),
              const SizedBox(width: 16),
              Icon(Icons.whatshot, color: Colors.orange, size: 16),
              const SizedBox(width: 4),
              Text(
                '${player.heat}',
                style: const TextStyle(color: Colors.white, fontSize: 14),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatBar(String label, int current, int max, Color fillColor, Color backgroundColor) {
    final percentage = current / max;
    
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            '$label: $current/$max',
            style: const TextStyle(color: Colors.white70, fontSize: 12),
          ),
          const SizedBox(height: 2),
          Container(
            width: 120,
            height: 6,
            decoration: BoxDecoration(
              color: backgroundColor,
              borderRadius: BorderRadius.circular(3),
            ),
            child: FractionallySizedBox(
              alignment: Alignment.centerLeft,
              widthFactor: percentage.clamp(0.0, 1.0),
              child: Container(
                decoration: BoxDecoration(
                  color: fillColor,
                  borderRadius: BorderRadius.circular(3),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildNotifications() {
    if (gameEngine.notifications.isEmpty) {
      return const SizedBox.shrink();
    }

    return Column(
      children: gameEngine.notifications.map((notification) {
        return Container(
          margin: const EdgeInsets.only(bottom: 8),
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: notification.color.withOpacity(0.9),
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.white24),
          ),
          child: Text(
            notification.text,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
        );
      }).toList(),
    );
  }

  Widget _buildQuestInfo() {
    final quest = gameEngine.currentQuest!;
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.purple.withOpacity(0.8),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white24),
      ),
      constraints: const BoxConstraints(maxWidth: 200),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            quest.title,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 14,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            quest.description,
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 12,
            ),
          ),
          const SizedBox(height: 8),
          
          // Progress
          LinearProgressIndicator(
            value: quest.progress / quest.objectives.length,
            backgroundColor: Colors.white24,
            valueColor: const AlwaysStoppedAnimation<Color>(Colors.white),
          ),
          
          const SizedBox(height: 4),
          Text(
            'Progress: ${quest.progress}/${quest.objectives.length}',
            style: const TextStyle(
              color: Colors.white70,
              fontSize: 10,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildControlsHelp() {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.black.withOpacity(0.6),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white24),
      ),
      child: const Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Controls:',
            style: TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 4),
          Text(
            'WASD/Arrows: Move',
            style: TextStyle(color: Colors.white70, fontSize: 10),
          ),
          Text(
            'Space: Interact',
            style: TextStyle(color: Colors.white70, fontSize: 10),
          ),
          Text(
            'Click: Move to location',
            style: TextStyle(color: Colors.white70, fontSize: 10),
          ),
        ],
      ),
    );
  }

  Widget _buildBuildingInfo() {
    final ownedBuildings = gameEngine.buildings.where((b) => b.owned).length;
    final forSaleBuildings = gameEngine.buildings.where((b) => b.forSale && !b.owned).length;
    
    if (ownedBuildings == 0 && forSaleBuildings == 0) {
      return const SizedBox.shrink();
    }
    
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green.withOpacity(0.8),
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.white24),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Properties:',
            style: TextStyle(
              color: Colors.white,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          
          if (ownedBuildings > 0) ...[
            Text(
              'Owned: $ownedBuildings',
              style: const TextStyle(color: Colors.white, fontSize: 10),
            ),
            Text(
              'Monthly Income: \$${_calculateTotalRent()}',
              style: const TextStyle(color: Colors.white, fontSize: 10),
            ),
          ],
          
          if (forSaleBuildings > 0)
            Text(
              'For Sale: $forSaleBuildings',
              style: const TextStyle(color: Colors.white70, fontSize: 10),
            ),
        ],
      ),
    );
  }

  int _calculateTotalRent() {
    int total = 0;
    for (final building in gameEngine.buildings) {
      if (building.owned) {
        total += building.getRentAmount();
      }
    }
    return total;
  }
}