import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Mobile-optimized button with haptic feedback and loading states
class MobileButton extends StatefulWidget {
  final String text;
  final VoidCallback? onPressed;
  final IconData? icon;
  final bool isLoading;
  final bool isDisabled;
  final MobileButtonType type;
  final MobileButtonSize size;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? width;
  final EdgeInsetsGeometry? padding;
  final BorderRadius? borderRadius;
  final bool enableHapticFeedback;
  final Duration animationDuration;
  final Widget? child;
  
  const MobileButton({
    Key? key,
    required this.text,
    this.onPressed,
    this.icon,
    this.isLoading = false,
    this.isDisabled = false,
    this.type = MobileButtonType.primary,
    this.size = MobileButtonSize.medium,
    this.backgroundColor,
    this.foregroundColor,
    this.width,
    this.padding,
    this.borderRadius,
    this.enableHapticFeedback = true,
    this.animationDuration = const Duration(milliseconds: 150),
    this.child,
  }) : super(key: key);

  @override
  State<MobileButton> createState() => _MobileButtonState();
}

class _MobileButtonState extends State<MobileButton>
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
      end: 0.96,
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

  bool get _isEnabled => !widget.isDisabled && !widget.isLoading && widget.onPressed != null;

  Future<void> _handleTap() async {
    if (!_isEnabled) return;
    
    if (widget.enableHapticFeedback) {
      await HapticFeedback.lightImpact();
    }
    
    setState(() => _isPressed = true);
    _animationController.forward();
    
    await Future.delayed(const Duration(milliseconds: 50));
    
    _animationController.reverse();
    setState(() => _isPressed = false);
    
    widget.onPressed?.call();
  }

  Color _getBackgroundColor(ColorScheme colorScheme) {
    if (widget.backgroundColor != null) return widget.backgroundColor!;
    
    switch (widget.type) {
      case MobileButtonType.primary:
        return colorScheme.primary;
      case MobileButtonType.secondary:
        return colorScheme.secondary;
      case MobileButtonType.outlined:
        return Colors.transparent;
      case MobileButtonType.text:
        return Colors.transparent;
      case MobileButtonType.danger:
        return colorScheme.error;
      case MobileButtonType.success:
        return Colors.green;
    }
  }

  Color _getForegroundColor(ColorScheme colorScheme) {
    if (widget.foregroundColor != null) return widget.foregroundColor!;
    
    switch (widget.type) {
      case MobileButtonType.primary:
        return colorScheme.onPrimary;
      case MobileButtonType.secondary:
        return colorScheme.onSecondary;
      case MobileButtonType.outlined:
        return colorScheme.primary;
      case MobileButtonType.text:
        return colorScheme.primary;
      case MobileButtonType.danger:
        return colorScheme.onError;
      case MobileButtonType.success:
        return Colors.white;
    }
  }

  EdgeInsetsGeometry _getPadding() {
    if (widget.padding != null) return widget.padding!;
    
    switch (widget.size) {
      case MobileButtonSize.small:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 8);
      case MobileButtonSize.medium:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 12);
      case MobileButtonSize.large:
        return const EdgeInsets.symmetric(horizontal: 32, vertical: 16);
    }
  }

  double _getFontSize() {
    switch (widget.size) {
      case MobileButtonSize.small:
        return 14;
      case MobileButtonSize.medium:
        return 16;
      case MobileButtonSize.large:
        return 18;
    }
  }

  Border? _getBorder(ColorScheme colorScheme) {
    if (widget.type == MobileButtonType.outlined) {
      return Border.all(
        color: _isEnabled ? colorScheme.primary : colorScheme.outline,
        width: 1.5,
      );
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final backgroundColor = _getBackgroundColor(colorScheme);
    final foregroundColor = _getForegroundColor(colorScheme);
    final borderRadius = widget.borderRadius ?? BorderRadius.circular(12);
    
    Widget buttonChild = widget.child ?? Row(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        if (widget.isLoading)
          SizedBox(
            width: _getFontSize(),
            height: _getFontSize(),
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: foregroundColor,
            ),
          )
        else if (widget.icon != null) ...[
          Icon(
            widget.icon,
            size: _getFontSize() + 2,
            color: foregroundColor,
          ),
          const SizedBox(width: 8),
        ],
        if (!widget.isLoading)
          Text(
            widget.text,
            style: TextStyle(
              fontSize: _getFontSize(),
              fontWeight: FontWeight.w600,
              color: foregroundColor,
            ),
          ),
      ],
    );
    
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: AnimatedContainer(
            duration: widget.animationDuration,
            width: widget.width,
            padding: _getPadding(),
            decoration: BoxDecoration(
              color: _isEnabled ? backgroundColor : backgroundColor.withOpacity(0.4),
              borderRadius: borderRadius,
              border: _getBorder(colorScheme),
              boxShadow: _isEnabled && widget.type != MobileButtonType.text && widget.type != MobileButtonType.outlined ? [
                BoxShadow(
                  color: backgroundColor.withOpacity(0.3),
                  offset: const Offset(0, 4),
                  blurRadius: 8,
                  spreadRadius: 0,
                ),
              ] : null,
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: _isEnabled ? _handleTap : null,
                borderRadius: borderRadius,
                splashColor: foregroundColor.withOpacity(0.1),
                highlightColor: foregroundColor.withOpacity(0.05),
                child: Container(
                  alignment: Alignment.center,
                  child: buttonChild,
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}

enum MobileButtonType {
  primary,
  secondary,
  outlined,
  text,
  danger,
  success,
}

enum MobileButtonSize {
  small,
  medium,
  large,
}

/// Mobile-optimized floating action button
class MobileFloatingButton extends StatefulWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final String? tooltip;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? size;
  final bool enableHapticFeedback;
  final bool extended;
  final String? label;
  
  const MobileFloatingButton({
    Key? key,
    required this.icon,
    this.onPressed,
    this.tooltip,
    this.backgroundColor,
    this.foregroundColor,
    this.size,
    this.enableHapticFeedback = true,
    this.extended = false,
    this.label,
  }) : super(key: key);

  @override
  State<MobileFloatingButton> createState() => _MobileFloatingButtonState();
}

class _MobileFloatingButtonState extends State<MobileFloatingButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<double> _rotationAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.9,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    _rotationAnimation = Tween<double>(
      begin: 0.0,
      end: 0.1,
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

  Future<void> _handleTap() async {
    if (widget.onPressed == null) return;
    
    if (widget.enableHapticFeedback) {
      await HapticFeedback.mediumImpact();
    }
    
    _animationController.forward().then((_) {
      _animationController.reverse();
    });
    
    widget.onPressed?.call();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final backgroundColor = widget.backgroundColor ?? colorScheme.primary;
    final foregroundColor = widget.foregroundColor ?? colorScheme.onPrimary;
    final buttonSize = widget.size ?? 56.0;
    
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Transform.rotate(
            angle: _rotationAnimation.value,
            child: widget.extended && widget.label != null
                ? FloatingActionButton.extended(
                    onPressed: widget.onPressed != null ? _handleTap : null,
                    icon: Icon(widget.icon, color: foregroundColor),
                    label: Text(
                      widget.label!,
                      style: TextStyle(
                        color: foregroundColor,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    backgroundColor: backgroundColor,
                    tooltip: widget.tooltip,
                    elevation: 8,
                    heroTag: null,
                  )
                : FloatingActionButton(
                    onPressed: widget.onPressed != null ? _handleTap : null,
                    backgroundColor: backgroundColor,
                    foregroundColor: foregroundColor,
                    tooltip: widget.tooltip,
                    elevation: 8,
                    heroTag: null,
                    child: Icon(
                      widget.icon,
                      size: buttonSize * 0.4,
                    ),
                  ),
          ),
        );
      },
    );
  }
}

/// Mobile-optimized icon button
class MobileIconButton extends StatefulWidget {
  final IconData icon;
  final VoidCallback? onPressed;
  final String? tooltip;
  final Color? color;
  final Color? backgroundColor;
  final double? size;
  final EdgeInsetsGeometry? padding;
  final bool enableHapticFeedback;
  final Border? border;
  final BorderRadius? borderRadius;
  
  const MobileIconButton({
    Key? key,
    required this.icon,
    this.onPressed,
    this.tooltip,
    this.color,
    this.backgroundColor,
    this.size = 24,
    this.padding = const EdgeInsets.all(12),
    this.enableHapticFeedback = true,
    this.border,
    this.borderRadius,
  }) : super(key: key);

  @override
  State<MobileIconButton> createState() => _MobileIconButtonState();
}

class _MobileIconButtonState extends State<MobileIconButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 100),
      vsync: this,
    );
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 0.85,
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

  Future<void> _handleTap() async {
    if (widget.onPressed == null) return;
    
    if (widget.enableHapticFeedback) {
      await HapticFeedback.lightImpact();
    }
    
    _animationController.forward().then((_) {
      _animationController.reverse();
    });
    
    widget.onPressed?.call();
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final iconColor = widget.color ?? colorScheme.onSurface;
    
    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Container(
            padding: widget.padding,
            decoration: BoxDecoration(
              color: widget.backgroundColor,
              border: widget.border,
              borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: widget.onPressed != null ? _handleTap : null,
                borderRadius: widget.borderRadius ?? BorderRadius.circular(8),
                splashColor: iconColor.withOpacity(0.1),
                highlightColor: iconColor.withOpacity(0.05),
                child: Icon(
                  widget.icon,
                  size: widget.size,
                  color: widget.onPressed != null ? iconColor : iconColor.withOpacity(0.4),
                ),
              ),
            ),
          ),
        );
      },
    );
  }
}