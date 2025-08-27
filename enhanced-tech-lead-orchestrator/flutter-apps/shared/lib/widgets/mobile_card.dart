import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Mobile-optimized card widget with haptic feedback and animations
class MobileCard extends StatefulWidget {
  final Widget child;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final Color? backgroundColor;
  final double? elevation;
  final BorderRadius? borderRadius;
  final bool enableHapticFeedback;
  final bool enableScaleAnimation;
  final Duration animationDuration;
  final List<BoxShadow>? boxShadows;
  final Gradient? gradient;
  final Border? border;
  
  const MobileCard({
    Key? key,
    required this.child,
    this.onTap,
    this.onLongPress,
    this.padding = const EdgeInsets.all(16),
    this.margin = const EdgeInsets.all(8),
    this.backgroundColor,
    this.elevation = 2,
    this.borderRadius,
    this.enableHapticFeedback = true,
    this.enableScaleAnimation = true,
    this.animationDuration = const Duration(milliseconds: 150),
    this.boxShadows,
    this.gradient,
    this.border,
  }) : super(key: key);

  @override
  State<MobileCard> createState() => _MobileCardState();
}

class _MobileCardState extends State<MobileCard>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: widget.animationDuration,
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.95,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    if (widget.enableScaleAnimation && widget.onTap != null) {
      setState(() => _isPressed = true);
      _animationController.forward();
    }
  }

  void _handleTapUp(TapUpDetails details) {
    if (widget.enableScaleAnimation) {
      setState(() => _isPressed = false);
      _animationController.reverse();
    }
  }

  void _handleTapCancel() {
    if (widget.enableScaleAnimation) {
      setState(() => _isPressed = false);
      _animationController.reverse();
    }
  }

  Future<void> _handleTap() async {
    if (widget.enableHapticFeedback) {
      await HapticFeedback.lightImpact();
    }
    widget.onTap?.call();
  }

  Future<void> _handleLongPress() async {
    if (widget.enableHapticFeedback) {
      await HapticFeedback.mediumImpact();
    }
    widget.onLongPress?.call();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final borderRadius = widget.borderRadius ?? BorderRadius.circular(16);
    
    Widget card = Container(
      margin: widget.margin,
      decoration: BoxDecoration(
        color: widget.backgroundColor ?? colorScheme.surface,
        gradient: widget.gradient,
        borderRadius: borderRadius,
        border: widget.border,
        boxShadow: widget.boxShadows ?? [
          if (widget.elevation != null && widget.elevation! > 0)
            BoxShadow(
              color: colorScheme.shadow.withOpacity(0.1),
              offset: Offset(0, widget.elevation! * 0.5),
              blurRadius: widget.elevation! * 2,
              spreadRadius: 0,
            ),
        ],
      ),
      child: ClipRRect(
        borderRadius: borderRadius,
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: widget.onTap != null ? _handleTap : null,
            onLongPress: widget.onLongPress != null ? _handleLongPress : null,
            onTapDown: _handleTapDown,
            onTapUp: _handleTapUp,
            onTapCancel: _handleTapCancel,
            borderRadius: borderRadius,
            splashColor: colorScheme.primary.withOpacity(0.1),
            highlightColor: colorScheme.primary.withOpacity(0.05),
            child: Padding(
              padding: widget.padding ?? EdgeInsets.zero,
              child: widget.child,
            ),
          ),
        ),
      ),
    );

    if (widget.enableScaleAnimation && widget.onTap != null) {
      return AnimatedBuilder(
        animation: _scaleAnimation,
        builder: (context, child) {
          return Transform.scale(
            scale: _scaleAnimation.value,
            child: card,
          );
        },
      );
    }

    return card;
  }
}

/// Mobile-optimized card with loading state
class LoadingCard extends StatelessWidget {
  final double? height;
  final double? width;
  final EdgeInsetsGeometry? margin;
  final BorderRadius? borderRadius;
  
  const LoadingCard({
    Key? key,
    this.height = 120,
    this.width,
    this.margin = const EdgeInsets.all(8),
    this.borderRadius,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Container(
      height: height,
      width: width,
      margin: margin,
      decoration: BoxDecoration(
        color: colorScheme.surface,
        borderRadius: borderRadius ?? BorderRadius.circular(16),
      ),
      child: _ShimmerLoading(
        child: Container(
          decoration: BoxDecoration(
            color: colorScheme.onSurface.withOpacity(0.1),
            borderRadius: borderRadius ?? BorderRadius.circular(16),
          ),
        ),
      ),
    );
  }
}

/// Shimmer loading animation widget
class _ShimmerLoading extends StatefulWidget {
  final Widget child;
  
  const _ShimmerLoading({required this.child});

  @override
  State<_ShimmerLoading> createState() => __ShimmerLoadingState();
}

class __ShimmerLoadingState extends State<_ShimmerLoading>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _animation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(seconds: 2),
      vsync: this,
    )..repeat();
    _animation = Tween<double>(begin: -1, end: 2).animate(
      CurvedAnimation(parent: _animationController, curve: Curves.easeInOut),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return AnimatedBuilder(
      animation: _animation,
      builder: (context, child) {
        return ShaderMask(
          shaderCallback: (bounds) {
            return LinearGradient(
              colors: [
                colorScheme.onSurface.withOpacity(0.1),
                colorScheme.onSurface.withOpacity(0.3),
                colorScheme.onSurface.withOpacity(0.1),
              ],
              stops: const [0.0, 0.5, 1.0],
              begin: Alignment.centerLeft,
              end: Alignment.centerRight,
              transform: GradientRotation(_animation.value),
            ).createShader(bounds);
          },
          child: widget.child,
        );
      },
    );
  }
}

/// Mobile-optimized card with badge/notification
class BadgeCard extends StatelessWidget {
  final Widget child;
  final String? badgeText;
  final int? badgeCount;
  final Color? badgeColor;
  final VoidCallback? onTap;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  
  const BadgeCard({
    Key? key,
    required this.child,
    this.badgeText,
    this.badgeCount,
    this.badgeColor,
    this.onTap,
    this.padding = const EdgeInsets.all(16),
    this.margin = const EdgeInsets.all(8),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final hasBadge = badgeText != null || (badgeCount != null && badgeCount! > 0);
    
    return Stack(
      clipBehavior: Clip.none,
      children: [
        MobileCard(
          onTap: onTap,
          padding: padding,
          margin: margin,
          child: child,
        ),
        if (hasBadge)
          Positioned(
            top: (margin?.resolve(TextDirection.ltr).top ?? 8) - 8,
            right: (margin?.resolve(TextDirection.ltr).right ?? 8) - 8,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: badgeColor ?? colorScheme.error,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: colorScheme.shadow.withOpacity(0.2),
                    offset: const Offset(0, 2),
                    blurRadius: 4,
                  ),
                ],
              ),
              child: Text(
                badgeText ?? badgeCount.toString(),
                style: TextStyle(
                  color: colorScheme.onError,
                  fontSize: 12,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ),
      ],
    );
  }
}