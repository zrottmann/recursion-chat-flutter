import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'dart:math' as math;

/// Enhanced swipe gesture detector with haptic feedback
class SwipeGestureDetector extends StatefulWidget {
  final Widget child;
  final VoidCallback? onSwipeLeft;
  final VoidCallback? onSwipeRight;
  final VoidCallback? onSwipeUp;
  final VoidCallback? onSwipeDown;
  final double swipeThreshold;
  final bool enableHapticFeedback;
  final Duration hapticDelay;
  
  const SwipeGestureDetector({
    Key? key,
    required this.child,
    this.onSwipeLeft,
    this.onSwipeRight,
    this.onSwipeUp,
    this.onSwipeDown,
    this.swipeThreshold = 50.0,
    this.enableHapticFeedback = true,
    this.hapticDelay = const Duration(milliseconds: 100),
  }) : super(key: key);

  @override
  State<SwipeGestureDetector> createState() => _SwipeGestureDetectorState();
}

class _SwipeGestureDetectorState extends State<SwipeGestureDetector> {
  Offset? _startPosition;
  bool _hasFiredHaptic = false;

  void _onPanStart(DragStartDetails details) {
    _startPosition = details.localPosition;
    _hasFiredHaptic = false;
  }

  void _onPanUpdate(DragUpdateDetails details) {
    if (_startPosition == null) return;
    
    final currentPosition = details.localPosition;
    final distance = (currentPosition - _startPosition!).distance;
    
    // Provide haptic feedback when crossing threshold
    if (widget.enableHapticFeedback && !_hasFiredHaptic && distance > widget.swipeThreshold) {
      HapticFeedback.lightImpact();
      _hasFiredHaptic = true;
    }
  }

  void _onPanEnd(DragEndDetails details) {
    if (_startPosition == null) return;

    final velocity = details.velocity.pixelsPerSecond;
    final distance = velocity.distance;
    
    if (distance < 300) return; // Minimum velocity threshold
    
    final dx = velocity.dx;
    final dy = velocity.dy;
    
    // Determine swipe direction based on velocity
    if (dx.abs() > dy.abs()) {
      // Horizontal swipe
      if (dx > 0) {
        widget.onSwipeRight?.call();
      } else {
        widget.onSwipeLeft?.call();
      }
    } else {
      // Vertical swipe
      if (dy > 0) {
        widget.onSwipeDown?.call();
      } else {
        widget.onSwipeUp?.call();
      }
    }
    
    _startPosition = null;
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanStart: _onPanStart,
      onPanUpdate: _onPanUpdate,
      onPanEnd: _onPanEnd,
      child: widget.child,
    );
  }
}

/// Pull-to-refresh gesture with custom animations
class PullToRefreshGesture extends StatefulWidget {
  final Widget child;
  final Future<void> Function() onRefresh;
  final double refreshTriggerDistance;
  final Color? indicatorColor;
  final Color? backgroundColor;
  final bool enableHapticFeedback;
  
  const PullToRefreshGesture({
    Key? key,
    required this.child,
    required this.onRefresh,
    this.refreshTriggerDistance = 80.0,
    this.indicatorColor,
    this.backgroundColor,
    this.enableHapticFeedback = true,
  }) : super(key: key);

  @override
  State<PullToRefreshGesture> createState() => _PullToRefreshGestureState();
}

class _PullToRefreshGestureState extends State<PullToRefreshGesture>
    with TickerProviderStateMixin {
  late AnimationController _rotationController;
  late AnimationController _scaleController;
  late Animation<double> _rotationAnimation;
  late Animation<double> _scaleAnimation;
  
  bool _isRefreshing = false;
  bool _hasTriggeredHaptic = false;
  double _pullDistance = 0.0;

  @override
  void initState() {
    super.initState();
    _rotationController = AnimationController(
      duration: const Duration(seconds: 1),
      vsync: this,
    );
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _rotationAnimation = Tween<double>(begin: 0, end: 2 * math.pi)
        .animate(_rotationController);
    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.2)
        .animate(CurvedAnimation(parent: _scaleController, curve: Curves.elasticOut));
  }

  @override
  void dispose() {
    _rotationController.dispose();
    _scaleController.dispose();
    super.dispose();
  }

  Future<void> _handleRefresh() async {
    if (_isRefreshing) return;
    
    setState(() => _isRefreshing = true);
    _rotationController.repeat();
    
    if (widget.enableHapticFeedback) {
      await HapticFeedback.mediumImpact();
    }
    
    try {
      await widget.onRefresh();
    } finally {
      if (mounted) {
        setState(() => _isRefreshing = false);
        _rotationController.stop();
        _rotationController.reset();
        _scaleController.forward().then((_) => _scaleController.reverse());
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return RefreshIndicator(
      onRefresh: _handleRefresh,
      color: widget.indicatorColor ?? colorScheme.primary,
      backgroundColor: widget.backgroundColor ?? colorScheme.surface,
      child: NotificationListener<ScrollNotification>(
        onNotification: (notification) {
          if (notification is ScrollUpdateNotification) {
            final metrics = notification.metrics;
            if (metrics.atEdge && metrics.pixels < 0) {
              _pullDistance = metrics.pixels.abs();
              
              if (widget.enableHapticFeedback && 
                  !_hasTriggeredHaptic && 
                  _pullDistance > widget.refreshTriggerDistance * 0.7) {
                HapticFeedback.lightImpact();
                _hasTriggeredHaptic = true;
              }
            } else {
              _hasTriggeredHaptic = false;
            }
          }
          return false;
        },
        child: widget.child,
      ),
    );
  }
}

/// Long press gesture with visual feedback and haptics
class LongPressGesture extends StatefulWidget {
  final Widget child;
  final VoidCallback? onLongPress;
  final Duration longPressDuration;
  final bool enableVisualFeedback;
  final bool enableHapticFeedback;
  final double scaleOnPress;
  final Color? highlightColor;
  
  const LongPressGesture({
    Key? key,
    required this.child,
    this.onLongPress,
    this.longPressDuration = const Duration(milliseconds: 500),
    this.enableVisualFeedback = true,
    this.enableHapticFeedback = true,
    this.scaleOnPress = 0.95,
    this.highlightColor,
  }) : super(key: key);

  @override
  State<LongPressGesture> createState() => _LongPressGestureState();
}

class _LongPressGestureState extends State<LongPressGesture>
    with TickerProviderStateMixin {
  late AnimationController _scaleController;
  late AnimationController _progressController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _progressAnimation;
  
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _scaleController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _progressController = AnimationController(
      duration: widget.longPressDuration,
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: widget.scaleOnPress,
    ).animate(CurvedAnimation(parent: _scaleController, curve: Curves.easeInOut));
    
    _progressAnimation = Tween<double>(begin: 0.0, end: 1.0)
        .animate(CurvedAnimation(parent: _progressController, curve: Curves.easeInOut));
  }

  @override
  void dispose() {
    _scaleController.dispose();
    _progressController.dispose();
    super.dispose();
  }

  void _onLongPressStart(LongPressStartDetails details) {
    setState(() => _isPressed = true);
    _scaleController.forward();
    
    if (widget.enableVisualFeedback) {
      _progressController.forward();
    }
    
    if (widget.enableHapticFeedback) {
      HapticFeedback.lightImpact();
    }
  }

  void _onLongPressEnd(LongPressEndDetails details) {
    setState(() => _isPressed = false);
    _scaleController.reverse();
    _progressController.reset();
    
    if (widget.enableHapticFeedback) {
      HapticFeedback.mediumImpact();
    }
    
    widget.onLongPress?.call();
  }

  void _onLongPressCancel() {
    setState(() => _isPressed = false);
    _scaleController.reverse();
    _progressController.reset();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return GestureDetector(
      onLongPressStart: _onLongPressStart,
      onLongPressEnd: _onLongPressEnd,
      onLongPressCancel: _onLongPressCancel,
      child: AnimatedBuilder(
        animation: Listenable.merge([_scaleAnimation, _progressAnimation]),
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: Stack(
              children: [
                widget.child,
                if (widget.enableVisualFeedback && _isPressed)
                  Positioned.fill(
                    child: Container(
                      decoration: BoxDecoration(
                        color: (widget.highlightColor ?? colorScheme.primary)
                            .withOpacity(0.1 * _progressAnimation.value),
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                  ),
                if (widget.enableVisualFeedback && _isPressed)
                  Positioned.fill(
                    child: CircularProgressIndicator(
                      value: _progressAnimation.value,
                      strokeWidth: 2,
                      color: widget.highlightColor ?? colorScheme.primary,
                      backgroundColor: colorScheme.outline.withOpacity(0.3),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Double tap gesture detector with animation
class DoubleTapGesture extends StatefulWidget {
  final Widget child;
  final VoidCallback? onDoubleTap;
  final bool enableVisualFeedback;
  final bool enableHapticFeedback;
  final Duration animationDuration;
  final double scaleAmount;
  
  const DoubleTapGesture({
    Key? key,
    required this.child,
    this.onDoubleTap,
    this.enableVisualFeedback = true,
    this.enableHapticFeedback = true,
    this.animationDuration = const Duration(milliseconds: 200),
    this.scaleAmount = 1.1,
  }) : super(key: key);

  @override
  State<DoubleTapGesture> createState() => _DoubleTapGestureState();
}

class _DoubleTapGestureState extends State<DoubleTapGesture>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: widget.animationDuration,
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: widget.scaleAmount,
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.elasticOut));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _onDoubleTap() async {
    if (widget.enableHapticFeedback) {
      await HapticFeedback.lightImpact();
    }
    
    if (widget.enableVisualFeedback) {
      _animationController.forward().then((_) => _animationController.reverse());
    }
    
    widget.onDoubleTap?.call();
  }

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onDoubleTap: _onDoubleTap,
      child: AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: widget.child,
          );
        },
      ),
    );
  }
}

/// Drag and drop gesture with visual feedback
class DragDropGesture extends StatefulWidget {
  final Widget child;
  final bool Function(dynamic data)? onWillAccept;
  final void Function(dynamic data)? onAccept;
  final VoidCallback? onLeave;
  final dynamic data;
  final Widget Function(BuildContext, List<dynamic>, List<dynamic>)? builder;
  final bool enableFeedback;
  
  const DragDropGesture({
    Key? key,
    required this.child,
    this.onWillAccept,
    this.onAccept,
    this.onLeave,
    this.data,
    this.builder,
    this.enableFeedback = true,
  }) : super(key: key);

  @override
  State<DragDropGesture> createState() => _DragDropGestureState();
}

class _DragDropGestureState extends State<DragDropGesture>
    with TickerProviderStateMixin {
  late AnimationController _dragController;
  late AnimationController _dropController;
  late Animation<double> _dragAnimation;
  late Animation<double> _dropAnimation;
  
  bool _isDragging = false;
  bool _isHovering = false;

  @override
  void initState() {
    super.initState();
    _dragController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _dropController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _dragAnimation = Tween<double>(begin: 1.0, end: 1.05)
        .animate(CurvedAnimation(parent: _dragController, curve: Curves.easeInOut));
    _dropAnimation = Tween<double>(begin: 1.0, end: 0.95)
        .animate(CurvedAnimation(parent: _dropController, curve: Curves.elasticOut));
  }

  @override
  void dispose() {
    _dragController.dispose();
    _dropController.dispose();
    super.dispose();
  }

  Widget _buildDragTarget() {
    return DragTarget(
      onWillAccept: (data) {
        if (widget.onWillAccept?.call(data) == true) {
          setState(() => _isHovering = true);
          _dropController.forward();
          if (widget.enableFeedback) {
            HapticFeedback.lightImpact();
          }
          return true;
        }
        return false;
      },
      onAccept: (data) {
        setState(() => _isHovering = false);
        _dropController.reverse();
        if (widget.enableFeedback) {
          HapticFeedback.mediumImpact();
        }
        widget.onAccept?.call(data);
      },
      onLeave: (data) {
        setState(() => _isHovering = false);
        _dropController.reverse();
        widget.onLeave?.call();
      },
      builder: widget.builder ?? (context, candidateData, rejectedData) {
        return AnimatedBuilder(
          animation: _dropAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: _dropAnimation.value,
              child: Container(
                decoration: _isHovering ? BoxDecoration(
                  border: Border.all(
                    color: Theme.of(context).colorScheme.primary,
                    width: 2,
                  ),
                  borderRadius: BorderRadius.circular(8),
                ) : null,
                child: widget.child,
              ),
            );
          },
        );
      },
    );
  }

  Widget _buildDraggable() {
    return Draggable(
      data: widget.data,
      feedback: Material(
        color: Colors.transparent,
        child: Transform.scale(
          scale: 1.1,
          child: Opacity(
            opacity: 0.8,
            child: widget.child,
          ),
        ),
      ),
      childWhenDragging: Opacity(
        opacity: 0.5,
        child: widget.child,
      ),
      onDragStarted: () {
        setState(() => _isDragging = true);
        _dragController.forward();
        if (widget.enableFeedback) {
          HapticFeedback.lightImpact();
        }
      },
      onDragEnd: (details) {
        setState(() => _isDragging = false);
        _dragController.reverse();
      },
      child: AnimatedBuilder(
        animation: _dragAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _dragAnimation.value,
            child: widget.child,
          );
        },
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.data != null) {
      return _buildDraggable();
    } else {
      return _buildDragTarget();
    }
  }
}

/// Pinch zoom gesture with smooth animations
class PinchZoomGesture extends StatefulWidget {
  final Widget child;
  final double minScale;
  final double maxScale;
  final bool enableFeedback;
  final VoidCallback? onScaleStart;
  final ValueChanged<double>? onScaleUpdate;
  final VoidCallback? onScaleEnd;
  
  const PinchZoomGesture({
    Key? key,
    required this.child,
    this.minScale = 0.5,
    this.maxScale = 3.0,
    this.enableFeedback = true,
    this.onScaleStart,
    this.onScaleUpdate,
    this.onScaleEnd,
  }) : super(key: key);

  @override
  State<PinchZoomGesture> createState() => _PinchZoomGestureState();
}

class _PinchZoomGestureState extends State<PinchZoomGesture>
    with TickerProviderStateMixin {
  late TransformationController _transformationController;
  late AnimationController _animationController;
  Animation<Matrix4>? _animation;
  
  double _currentScale = 1.0;
  bool _isScaling = false;

  @override
  void initState() {
    super.initState();
    _transformationController = TransformationController();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _transformationController.dispose();
    _animationController.dispose();
    super.dispose();
  }

  void _onScaleStart(ScaleStartDetails details) {
    setState(() => _isScaling = true);
    if (widget.enableFeedback) {
      HapticFeedback.lightImpact();
    }
    widget.onScaleStart?.call();
  }

  void _onScaleUpdate(ScaleUpdateDetails details) {
    final newScale = (_currentScale * details.scale)
        .clamp(widget.minScale, widget.maxScale);
    
    if (newScale != _currentScale) {
      _currentScale = newScale;
      widget.onScaleUpdate?.call(_currentScale);
      
      // Provide haptic feedback at scale boundaries
      if (widget.enableFeedback && 
          (_currentScale == widget.minScale || _currentScale == widget.maxScale)) {
        HapticFeedback.lightImpact();
      }
    }
  }

  void _onScaleEnd(ScaleEndDetails details) {
    setState(() => _isScaling = false);
    widget.onScaleEnd?.call();
    
    // Snap back to 1.0 if close
    if ((_currentScale - 1.0).abs() < 0.1) {
      _animateToScale(1.0);
    }
  }

  void _animateToScale(double targetScale) {
    _animation?.removeListener(_onAnimationUpdate);
    _animationController.reset();
    
    _animation = Matrix4Tween(
      begin: _transformationController.value,
      end: Matrix4.identity()..scale(targetScale),
    ).animate(CurvedAnimation(parent: _animationController, curve: Curves.easeInOut));
    
    _animation!.addListener(_onAnimationUpdate);
    _animationController.forward();
  }

  void _onAnimationUpdate() {
    _transformationController.value = _animation!.value;
  }

  @override
  Widget build(BuildContext context) {
    return InteractiveViewer(
      transformationController: _transformationController,
      minScale: widget.minScale,
      maxScale: widget.maxScale,
      onInteractionStart: _onScaleStart,
      onInteractionUpdate: _onScaleUpdate,
      onInteractionEnd: _onScaleEnd,
      child: widget.child,
    );
  }
}