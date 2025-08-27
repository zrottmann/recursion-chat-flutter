import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../slumlord_game_engine.dart';
import 'game_painter.dart';
import 'game_ui_overlay.dart';

class GameWidget extends StatefulWidget {
  const GameWidget({super.key});

  @override
  State<GameWidget> createState() => _GameWidgetState();
}

class _GameWidgetState extends State<GameWidget> {
  late SlumlordGameEngine _gameEngine;
  final FocusNode _focusNode = FocusNode();

  @override
  void initState() {
    super.initState();
    _gameEngine = SlumlordGameEngine();
    
    // Request focus for keyboard input
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _focusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _gameEngine.dispose();
    _focusNode.dispose();
    super.dispose();
  }

  void _handleKeyEvent(KeyEvent event) {
    if (event is KeyDownEvent) {
      _gameEngine.onKeyPressed(event.logicalKey);
    } else if (event is KeyUpEvent) {
      _gameEngine.onKeyReleased(event.logicalKey);
    }
  }

  void _handleTapDown(TapDownDetails details) {
    _gameEngine.onTapDown(details.localPosition);
  }

  void _handleTapUp(TapUpDetails details) {
    _gameEngine.onTapUp();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: Focus(
        focusNode: _focusNode,
        onKeyEvent: (node, event) {
          _handleKeyEvent(event);
          return KeyEventResult.handled;
        },
        child: GestureDetector(
          onTapDown: _handleTapDown,
          onTapUp: _handleTapUp,
          child: Stack(
            children: [
              // Game Canvas
              Positioned.fill(
                child: AnimatedBuilder(
                  animation: _gameEngine,
                  builder: (context, child) {
                    return CustomPaint(
                      painter: GamePainter(_gameEngine),
                      size: Size.infinite,
                    );
                  },
                ),
              ),
              
              // UI Overlay
              Positioned.fill(
                child: AnimatedBuilder(
                  animation: _gameEngine,
                  builder: (context, child) {
                    return GameUIOverlay(gameEngine: _gameEngine);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}