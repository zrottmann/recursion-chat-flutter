import 'package:flutter/material.dart';
import 'package:glassmorphism_ui/glassmorphism_ui.dart';

class GlassmorphicCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double blur;
  final double opacity;
  final BorderRadiusGeometry? borderRadius;
  final VoidCallback? onTap;
  final Color? backgroundColor;

  const GlassmorphicCard({
    super.key,
    required this.child,
    this.padding,
    this.margin,
    this.blur = 20.0,
    this.opacity = 0.1,
    this.borderRadius,
    this.onTap,
    this.backgroundColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    Widget content = GlassContainer(
      blur: blur,
      color: backgroundColor ?? theme.colorScheme.surface.withOpacity(opacity),
      gradient: LinearGradient(
        begin: Alignment.topLeft,
        end: Alignment.bottomRight,
        colors: [
          theme.colorScheme.surface.withOpacity(opacity + 0.05),
          theme.colorScheme.surface.withOpacity(opacity - 0.02),
        ],
      ),
      borderRadius: borderRadius ?? BorderRadius.circular(20),
      border: Border.all(
        color: theme.colorScheme.outline.withOpacity(0.2),
        width: 1,
      ),
      child: padding != null 
          ? Padding(padding: padding!, child: child)
          : child,
    );

    if (onTap != null) {
      content = InkWell(
        onTap: onTap,
        borderRadius: borderRadius ?? BorderRadius.circular(20),
        child: content,
      );
    }

    if (margin != null) {
      content = Padding(padding: margin!, child: content);
    }

    return content;
  }
}

/// Specialized glassmorphic card for product displays
class GlassmorphicProductCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final bool isSelected;
  final String? heroTag;

  const GlassmorphicProductCard({
    super.key,
    required this.child,
    this.onTap,
    this.isSelected = false,
    this.heroTag,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    Widget card = GlassmorphicCard(
      padding: const EdgeInsets.all(16),
      opacity: isSelected ? 0.15 : 0.1,
      blur: isSelected ? 25.0 : 20.0,
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      backgroundColor: isSelected 
          ? theme.colorScheme.primary.withOpacity(0.1)
          : null,
      child: child,
    );

    if (heroTag != null) {
      card = Hero(tag: heroTag!, child: card);
    }

    return card;
  }
}

/// Specialized glassmorphic card for categories
class GlassmorphicCategoryCard extends StatelessWidget {
  final Widget child;
  final VoidCallback? onTap;
  final Color? accentColor;

  const GlassmorphicCategoryCard({
    super.key,
    required this.child,
    this.onTap,
    this.accentColor,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final color = accentColor ?? theme.colorScheme.primary;
    
    return GlassmorphicCard(
      padding: const EdgeInsets.all(20),
      onTap: onTap,
      borderRadius: BorderRadius.circular(20),
      backgroundColor: color.withOpacity(0.08),
      child: child,
    );
  }
}

/// Glassmorphic card with gradient border effect
class GlassmorphicGradientCard extends StatelessWidget {
  final Widget child;
  final List<Color> gradientColors;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;

  const GlassmorphicGradientCard({
    super.key,
    required this.child,
    required this.gradientColors,
    this.padding,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: gradientColors,
        ),
      ),
      padding: const EdgeInsets.all(2), // Border width
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(18),
          color: theme.colorScheme.surface.withOpacity(0.9),
        ),
        child: Material(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(18),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(18),
            child: padding != null 
                ? Padding(padding: padding!, child: child)
                : child,
          ),
        ),
      ),
    );
  }
}

/// Floating glassmorphic card with shadow
class FloatingGlassmorphicCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final VoidCallback? onTap;

  const FloatingGlassmorphicCard({
    super.key,
    required this.child,
    this.padding,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: theme.colorScheme.primary.withOpacity(0.1),
            blurRadius: 20,
            spreadRadius: 5,
            offset: const Offset(0, 10),
          ),
        ],
      ),
      child: GlassmorphicCard(
        padding: padding,
        onTap: onTap,
        blur: 30.0,
        opacity: 0.15,
        child: child,
      ),
    );
  }
}