import 'package:flutter/material.dart';
import 'dart:math' as math;
import '../slumlord_game_engine.dart';
import '../models/game_models.dart';

class GamePainter extends CustomPainter {
  final SlumlordGameEngine gameEngine;
  final Paint _paint = Paint();
  static const double tileSize = 32.0;

  GamePainter(this.gameEngine);

  @override
  void paint(Canvas canvas, Size size) {
    // Clear canvas
    canvas.drawRect(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Paint()..color = Colors.black,
    );

    // Apply camera transformation
    canvas.save();
    canvas.translate(-gameEngine.camera.x, -gameEngine.camera.y);
    
    // Apply camera shake
    if (gameEngine.camera.shake > 0) {
      final random = math.Random();
      final shakeX = (random.nextDouble() - 0.5) * gameEngine.camera.shake;
      final shakeY = (random.nextDouble() - 0.5) * gameEngine.camera.shake;
      canvas.translate(shakeX, shakeY);
    }

    // Draw map
    _drawMap(canvas, size);
    
    // Draw buildings
    _drawBuildings(canvas);
    
    // Draw allies
    _drawAllies(canvas);
    
    // Draw player
    _drawPlayer(canvas);
    
    // Draw particles
    _drawParticles(canvas);

    canvas.restore();
  }

  void _drawMap(Canvas canvas, Size size) {
    final map = gameEngine.currentMap;
    
    for (int y = 0; y < map.height; y++) {
      for (int x = 0; x < map.width; x++) {
        final tileType = map.getTile(x, y);
        final rect = Rect.fromLTWH(
          x * tileSize, 
          y * tileSize, 
          tileSize, 
          tileSize
        );
        
        _paint.color = _getTileColor(tileType);
        canvas.drawRect(rect, _paint);
        
        // Add tile borders for clarity
        _paint.color = Colors.black26;
        _paint.style = PaintingStyle.stroke;
        _paint.strokeWidth = 0.5;
        canvas.drawRect(rect, _paint);
        _paint.style = PaintingStyle.fill;
      }
    }
  }

  Color _getTileColor(TileType tileType) {
    switch (tileType) {
      case TileType.grass:
        return const Color(0xFF4CAF50);
      case TileType.wall:
        return const Color(0xFF795548);
      case TileType.tree:
        return const Color(0xFF2E7D32);
      case TileType.water:
        return const Color(0xFF2196F3);
      case TileType.road:
        return const Color(0xFF9E9E9E);
      case TileType.floor:
        return const Color(0xFFE0E0E0);
      case TileType.house:
        return const Color(0xFFFF9800);
      case TileType.rock:
        return const Color(0xFF607D8B);
      case TileType.fountain:
        return const Color(0xFF00BCD4);
    }
  }

  void _drawBuildings(Canvas canvas) {
    for (final building in gameEngine.buildings) {
      final rect = Rect.fromLTWH(
        building.x, 
        building.y, 
        building.width * tileSize, 
        building.height * tileSize
      );
      
      // Building base
      _paint.color = building.owned ? building.type.color : building.type.color.withOpacity(0.6);
      canvas.drawRect(rect, _paint);
      
      // Building border
      _paint.color = building.owned ? Colors.green : Colors.grey;
      _paint.style = PaintingStyle.stroke;
      _paint.strokeWidth = 2.0;
      canvas.drawRect(rect, _paint);
      _paint.style = PaintingStyle.fill;
      
      // For sale indicator
      if (building.forSale && !building.owned) {
        _paint.color = Colors.yellow;
        canvas.drawCircle(
          Offset(building.x + 10, building.y + 10), 
          5, 
          _paint
        );
      }
      
      // Condition indicator for owned buildings
      if (building.owned) {
        final conditionColor = building.condition > 70 
          ? Colors.green 
          : building.condition > 40 
            ? Colors.orange 
            : Colors.red;
        
        _paint.color = conditionColor;
        final conditionRect = Rect.fromLTWH(
          building.x, 
          building.y - 6, 
          (building.width * tileSize) * (building.condition / 100), 
          4
        );
        canvas.drawRect(conditionRect, _paint);
      }
    }
  }

  void _drawAllies(Canvas canvas) {
    for (final ally in gameEngine.allies) {
      // Ally body
      _paint.color = ally.color;
      final bobOffset = math.sin(ally.bob) * 2;
      canvas.drawCircle(
        Offset(ally.x, ally.y + bobOffset), 
        ally.size, 
        _paint
      );
      
      // Ally border
      _paint.color = Colors.black;
      _paint.style = PaintingStyle.stroke;
      _paint.strokeWidth = 1.0;
      canvas.drawCircle(
        Offset(ally.x, ally.y + bobOffset), 
        ally.size, 
        _paint
      );
      _paint.style = PaintingStyle.fill;
      
      // Level indicator
      _drawText(
        canvas, 
        ally.level.toString(), 
        Offset(ally.x - 5, ally.y - ally.size - 15), 
        Colors.white, 
        12
      );
      
      // State indicator
      if (ally.state == AllyState.evolving) {
        _paint.color = Colors.purple.withOpacity(0.7);
        canvas.drawCircle(
          Offset(ally.x, ally.y + bobOffset), 
          ally.size + 5, 
          _paint
        );
      }
    }
  }

  void _drawPlayer(Canvas canvas) {
    final player = gameEngine.player;
    
    // Player glow effect
    if (player.glowIntensity > 0) {
      _paint.color = Colors.white.withOpacity(player.glowIntensity * 0.3);
      canvas.drawCircle(
        Offset(player.x, player.y), 
        player.size + (player.glowIntensity * 10), 
        _paint
      );
    }
    
    // Player body
    _paint.color = player.color;
    canvas.drawCircle(Offset(player.x, player.y), player.size, _paint);
    
    // Player border
    _paint.color = Colors.black;
    _paint.style = PaintingStyle.stroke;
    _paint.strokeWidth = 2.0;
    canvas.drawCircle(Offset(player.x, player.y), player.size, _paint);
    _paint.style = PaintingStyle.fill;
    
    // Direction indicator
    final directionOffset = _getDirectionOffset(player.direction);
    _paint.color = Colors.white;
    canvas.drawCircle(
      Offset(
        player.x + directionOffset.dx * 8, 
        player.y + directionOffset.dy * 8
      ), 
      3, 
      _paint
    );
    
    // Walking animation
    if (player.isMoving) {
      final walkOffset = math.sin(player.walkFrame) * 2;
      canvas.save();
      canvas.translate(0, walkOffset);
      canvas.restore();
    }
  }

  Offset _getDirectionOffset(Direction direction) {
    switch (direction) {
      case Direction.up:
        return const Offset(0, -1);
      case Direction.down:
        return const Offset(0, 1);
      case Direction.left:
        return const Offset(-1, 0);
      case Direction.right:
        return const Offset(1, 0);
    }
  }

  void _drawParticles(Canvas canvas) {
    for (final particle in gameEngine.particles) {
      _paint.color = particle.color.withOpacity(particle.alpha);
      
      switch (particle.type) {
        case ParticleType.spark:
          canvas.drawCircle(
            Offset(particle.x, particle.y), 
            particle.size, 
            _paint
          );
          break;
        case ParticleType.money:
          _drawMoneyParticle(canvas, particle);
          break;
        case ParticleType.xp:
          _drawXPParticle(canvas, particle);
          break;
      }
    }
  }

  void _drawMoneyParticle(Canvas canvas, Particle particle) {
    _paint.color = Colors.green.withOpacity(particle.alpha);
    canvas.drawRect(
      Rect.fromCenter(
        center: Offset(particle.x, particle.y),
        width: particle.size,
        height: particle.size * 0.6,
      ),
      _paint,
    );
  }

  void _drawXPParticle(Canvas canvas, Particle particle) {
    _paint.color = Colors.blue.withOpacity(particle.alpha);
    final points = <Offset>[];
    final center = Offset(particle.x, particle.y);
    final radius = particle.size;
    
    for (int i = 0; i < 6; i++) {
      final angle = (i * math.pi * 2) / 6;
      points.add(Offset(
        center.dx + math.cos(angle) * radius,
        center.dy + math.sin(angle) * radius,
      ));
    }
    
    final path = Path();
    path.addPolygon(points, true);
    canvas.drawPath(path, _paint);
  }

  void _drawText(Canvas canvas, String text, Offset position, Color color, double fontSize) {
    final textPainter = TextPainter(
      text: TextSpan(
        text: text,
        style: TextStyle(
          color: color,
          fontSize: fontSize,
          fontWeight: FontWeight.bold,
        ),
      ),
      textDirection: TextDirection.ltr,
    );
    
    textPainter.layout();
    textPainter.paint(canvas, position);
  }

  @override
  bool shouldRepaint(CustomPainter oldDelegate) => true;
}