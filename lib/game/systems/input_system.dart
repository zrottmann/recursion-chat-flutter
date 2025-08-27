import 'package:flutter/services.dart';
import '../models/game_models.dart';

class InputSystem {
  MovementTarget? _currentMovementTarget;
  final Map<String, bool> _actionCooldowns = {};

  void update(Set<LogicalKeyboardKey> pressedKeys, double deltaTime) {
    // Update cooldowns
    _actionCooldowns.forEach((key, value) {
      if (value) {
        _actionCooldowns[key] = false; // Reset cooldown after one frame
      }
    });
  }

  MovementTarget? getMovementTarget() {
    return _currentMovementTarget?.active == true ? _currentMovementTarget : null;
  }

  void setMovementTarget(double x, double y) {
    _currentMovementTarget = MovementTarget(x: x, y: y, active: true);
  }

  void clearMovementTarget() {
    _currentMovementTarget?.active = false;
    _currentMovementTarget = null;
  }

  bool isKeyPressed(LogicalKeyboardKey key, Set<LogicalKeyboardKey> pressedKeys) {
    return pressedKeys.contains(key);
  }

  bool isMovementKeyPressed(Set<LogicalKeyboardKey> pressedKeys) {
    return pressedKeys.contains(LogicalKeyboardKey.keyW) ||
           pressedKeys.contains(LogicalKeyboardKey.keyA) ||
           pressedKeys.contains(LogicalKeyboardKey.keyS) ||
           pressedKeys.contains(LogicalKeyboardKey.keyD) ||
           pressedKeys.contains(LogicalKeyboardKey.arrowUp) ||
           pressedKeys.contains(LogicalKeyboardKey.arrowDown) ||
           pressedKeys.contains(LogicalKeyboardKey.arrowLeft) ||
           pressedKeys.contains(LogicalKeyboardKey.arrowRight);
  }

  Direction getMovementDirection(Set<LogicalKeyboardKey> pressedKeys) {
    if (pressedKeys.contains(LogicalKeyboardKey.keyW) ||
        pressedKeys.contains(LogicalKeyboardKey.arrowUp)) {
      return Direction.up;
    }
    if (pressedKeys.contains(LogicalKeyboardKey.keyS) ||
        pressedKeys.contains(LogicalKeyboardKey.arrowDown)) {
      return Direction.down;
    }
    if (pressedKeys.contains(LogicalKeyboardKey.keyA) ||
        pressedKeys.contains(LogicalKeyboardKey.arrowLeft)) {
      return Direction.left;
    }
    if (pressedKeys.contains(LogicalKeyboardKey.keyD) ||
        pressedKeys.contains(LogicalKeyboardKey.arrowRight)) {
      return Direction.right;
    }
    return Direction.down; // Default direction
  }

  bool isActionKey(LogicalKeyboardKey key) {
    return key == LogicalKeyboardKey.space ||
           key == LogicalKeyboardKey.enter ||
           key == LogicalKeyboardKey.keyE ||
           key == LogicalKeyboardKey.keyF;
  }

  bool canPerformAction(String actionName) {
    return _actionCooldowns[actionName] != true;
  }

  void setActionCooldown(String actionName) {
    _actionCooldowns[actionName] = true;
  }

  Map<String, dynamic> getInputState(Set<LogicalKeyboardKey> pressedKeys) {
    return {
      'hasMovementInput': isMovementKeyPressed(pressedKeys),
      'movementDirection': getMovementDirection(pressedKeys),
      'hasMovementTarget': _currentMovementTarget?.active == true,
      'movementTarget': _currentMovementTarget,
      'pressedKeys': pressedKeys.map((key) => key.keyLabel).toList(),
    };
  }

  void handleTouchInput(double screenX, double screenY, double cameraX, double cameraY) {
    // Convert screen coordinates to world coordinates
    final worldX = screenX + cameraX;
    final worldY = screenY + cameraY;
    setMovementTarget(worldX, worldY);
  }

  void handleMouseInput(double screenX, double screenY, double cameraX, double cameraY) {
    // Convert screen coordinates to world coordinates  
    final worldX = screenX + cameraX;
    final worldY = screenY + cameraY;
    setMovementTarget(worldX, worldY);
  }

  void reset() {
    clearMovementTarget();
    _actionCooldowns.clear();
  }
}