import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'responsive_layout.dart';

/// Adaptive app bar that changes based on screen size
class AdaptiveAppBar extends StatelessWidget implements PreferredSizeWidget {
  final Widget? title;
  final List<Widget>? actions;
  final Widget? leading;
  final bool automaticallyImplyLeading;
  final Color? backgroundColor;
  final Color? foregroundColor;
  final double? elevation;
  final double? scrolledUnderElevation;
  final bool centerTitle;
  final VoidCallback? onDrawerPressed;
  final bool showBackButton;
  
  // Mobile specific
  final Widget? mobileTitle;
  final List<Widget>? mobileActions;
  
  // Desktop specific  
  final Widget? desktopTitle;
  final List<Widget>? desktopActions;
  final bool showOnDesktop;
  
  const AdaptiveAppBar({
    Key? key,
    this.title,
    this.actions,
    this.leading,
    this.automaticallyImplyLeading = true,
    this.backgroundColor,
    this.foregroundColor,
    this.elevation,
    this.scrolledUnderElevation,
    this.centerTitle = false,
    this.onDrawerPressed,
    this.showBackButton = true,
    this.mobileTitle,
    this.mobileActions,
    this.desktopTitle,
    this.desktopActions,
    this.showOnDesktop = false,
  }) : super(key: key);

  @override
  Size get preferredSize {
    return const Size.fromHeight(kToolbarHeight);
  }

  @override
  Widget build(BuildContext context) {
    final screenType = ScreenSize.getScreenType(context);
    
    // Don't show app bar on desktop unless explicitly requested
    if (!showOnDesktop && (screenType == ResponsiveScreenType.desktop || screenType == ResponsiveScreenType.tv)) {
      return const SizedBox.shrink();
    }
    
    Widget? adaptiveTitle = title;
    List<Widget>? adaptiveActions = actions;
    
    // Use screen-specific overrides if provided
    switch (screenType) {
      case ResponsiveScreenType.mobile:
        adaptiveTitle = mobileTitle ?? title;
        adaptiveActions = mobileActions ?? actions;
        break;
      case ResponsiveScreenType.tablet:
      case ResponsiveScreenType.desktop:
      case ResponsiveScreenType.tv:
        adaptiveTitle = desktopTitle ?? title;
        adaptiveActions = desktopActions ?? actions;
        break;
    }
    
    return AppBar(
      title: adaptiveTitle,
      actions: adaptiveActions,
      leading: leading,
      automaticallyImplyLeading: automaticallyImplyLeading && showBackButton,
      backgroundColor: backgroundColor,
      foregroundColor: foregroundColor,
      elevation: elevation,
      scrolledUnderElevation: scrolledUnderElevation,
      centerTitle: centerTitle,
    );
  }
}

/// Adaptive navigation that switches between bottom nav, rail, and drawer
class AdaptiveNavigation extends StatefulWidget {
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final List<NavigationDestination> destinations;
  final Color? backgroundColor;
  final bool enableHapticFeedback;
  
  // Navigation rail specific
  final Widget? railHeader;
  final Widget? railFooter;
  final bool extendedRail;
  
  // Drawer specific
  final Widget? drawerHeader;
  final Widget? drawerFooter;
  
  const AdaptiveNavigation({
    Key? key,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.destinations,
    this.backgroundColor,
    this.enableHapticFeedback = true,
    this.railHeader,
    this.railFooter,
    this.extendedRail = false,
    this.drawerHeader,
    this.drawerFooter,
  }) : super(key: key);

  @override
  State<AdaptiveNavigation> createState() => _AdaptiveNavigationState();
}

class _AdaptiveNavigationState extends State<AdaptiveNavigation> {
  Future<void> _handleSelection(int index) async {
    if (widget.enableHapticFeedback) {
      await HapticFeedback.selectionClick();
    }
    widget.onDestinationSelected(index);
  }

  Widget _buildBottomNavigation() {
    return NavigationBar(
      selectedIndex: widget.selectedIndex,
      onDestinationSelected: _handleSelection,
      backgroundColor: widget.backgroundColor,
      destinations: widget.destinations.take(5).toList(), // Limit to 5 on mobile
    );
  }

  Widget _buildNavigationRail() {
    return NavigationRail(
      selectedIndex: widget.selectedIndex,
      onDestinationSelected: _handleSelection,
      backgroundColor: widget.backgroundColor,
      extended: widget.extendedRail,
      leading: widget.railHeader,
      trailing: widget.railFooter,
      destinations: widget.destinations.map((dest) => NavigationRailDestination(
        icon: dest.icon,
        selectedIcon: dest.selectedIcon,
        label: dest.label,
      )).toList(),
    );
  }

  Widget _buildDrawerNavigation() {
    return Drawer(
      backgroundColor: widget.backgroundColor,
      child: Column(
        children: [
          if (widget.drawerHeader != null) widget.drawerHeader!,
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: widget.destinations.asMap().entries.map((entry) {
                final index = entry.key;
                final destination = entry.value;
                final isSelected = index == widget.selectedIndex;
                
                return ListTile(
                  leading: isSelected ? destination.selectedIcon : destination.icon,
                  title: destination.label,
                  selected: isSelected,
                  onTap: () => _handleSelection(index),
                );
              }).toList(),
            ),
          ),
          if (widget.drawerFooter != null) widget.drawerFooter!,
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenType = ScreenSize.getScreenType(context);
    
    switch (screenType) {
      case ResponsiveScreenType.mobile:
        return _buildBottomNavigation();
      case ResponsiveScreenType.tablet:
        return _buildNavigationRail();
      case ResponsiveScreenType.desktop:
      case ResponsiveScreenType.tv:
        return _buildDrawerNavigation();
    }
  }
}

/// Adaptive dialog that adjusts its size and position based on screen size
class AdaptiveDialog extends StatelessWidget {
  final Widget child;
  final String? title;
  final List<Widget>? actions;
  final EdgeInsetsGeometry? contentPadding;
  final bool barrierDismissible;
  final Color? backgroundColor;
  final double? elevation;
  final ShapeBorder? shape;
  
  const AdaptiveDialog({
    Key? key,
    required this.child,
    this.title,
    this.actions,
    this.contentPadding,
    this.barrierDismissible = true,
    this.backgroundColor,
    this.elevation,
    this.shape,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final screenType = ScreenSize.getScreenType(context);
    final screenSize = MediaQuery.of(context).size;
    
    // On mobile, use full-screen dialog for large content
    if (screenType == ResponsiveScreenType.mobile && screenSize.height < 700) {
      return Scaffold(
        appBar: AppBar(
          title: title != null ? Text(title!) : null,
          backgroundColor: backgroundColor,
          elevation: elevation,
          actions: actions,
        ),
        backgroundColor: backgroundColor,
        body: Container(
          padding: contentPadding ?? const EdgeInsets.all(16),
          child: child,
        ),
      );
    }
    
    // Calculate dialog constraints based on screen size
    double maxWidth = 400; // Default mobile width
    double maxHeight = screenSize.height * 0.8;
    
    switch (screenType) {
      case ResponsiveScreenType.mobile:
        maxWidth = screenSize.width * 0.9;
        break;
      case ResponsiveScreenType.tablet:
        maxWidth = 500;
        break;
      case ResponsiveScreenType.desktop:
      case ResponsiveScreenType.tv:
        maxWidth = 600;
        break;
    }
    
    return AlertDialog(
      title: title != null ? Text(title!) : null,
      content: ConstrainedBox(
        constraints: BoxConstraints(
          maxWidth: maxWidth,
          maxHeight: maxHeight,
        ),
        child: child,
      ),
      actions: actions,
      contentPadding: contentPadding ?? const EdgeInsets.fromLTRB(24, 20, 24, 24),
      backgroundColor: backgroundColor,
      elevation: elevation,
      shape: shape ?? RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
    );
  }
  
  static Future<T?> show<T>({
    required BuildContext context,
    required Widget child,
    String? title,
    List<Widget>? actions,
    bool barrierDismissible = true,
    Color? backgroundColor,
    double? elevation,
    ShapeBorder? shape,
  }) {
    return showDialog<T>(
      context: context,
      barrierDismissible: barrierDismissible,
      builder: (context) => AdaptiveDialog(
        title: title,
        actions: actions,
        backgroundColor: backgroundColor,
        elevation: elevation,
        shape: shape,
        child: child,
      ),
    );
  }
}

/// Adaptive bottom sheet that becomes a dialog on larger screens
class AdaptiveBottomSheet extends StatelessWidget {
  final Widget child;
  final String? title;
  final bool isScrollControlled;
  final double? height;
  final double initialChildSize;
  final double minChildSize;
  final double maxChildSize;
  final bool enableDrag;
  final bool showDragHandle;
  
  const AdaptiveBottomSheet({
    Key? key,
    required this.child,
    this.title,
    this.isScrollControlled = false,
    this.height,
    this.initialChildSize = 0.5,
    this.minChildSize = 0.25,
    this.maxChildSize = 1.0,
    this.enableDrag = true,
    this.showDragHandle = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final screenType = ScreenSize.getScreenType(context);
    
    // Show as dialog on tablet and desktop
    if (screenType != ResponsiveScreenType.mobile) {
      return AdaptiveDialog(
        title: title,
        child: SizedBox(
          height: height,
          child: child,
        ),
      );
    }
    
    // Mobile bottom sheet
    Widget content = child;
    
    if (showDragHandle) {
      content = Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 40,
            height: 4,
            margin: const EdgeInsets.symmetric(vertical: 12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.onSurface.withOpacity(0.3),
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          if (title != null) ...[
            Text(
              title!,
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
          ],
          Flexible(child: child),
        ],
      );
    }
    
    if (isScrollControlled) {
      return DraggableScrollableSheet(
        initialChildSize: initialChildSize,
        minChildSize: minChildSize,
        maxChildSize: maxChildSize,
        expand: false,
        builder: (context, scrollController) {
          return Container(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
            ),
            child: content,
          );
        },
      );
    }
    
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: content,
    );
  }
  
  static Future<T?> show<T>({
    required BuildContext context,
    required Widget child,
    String? title,
    bool isScrollControlled = false,
    double? height,
    double initialChildSize = 0.5,
    double minChildSize = 0.25,
    double maxChildSize = 1.0,
    bool enableDrag = true,
    bool showDragHandle = true,
  }) {
    final screenType = ScreenSize.getScreenType(context);
    
    // Show as dialog on larger screens
    if (screenType != ResponsiveScreenType.mobile) {
      return AdaptiveDialog.show<T>(
        context: context,
        title: title,
        child: SizedBox(
          height: height,
          child: child,
        ),
      );
    }
    
    // Show as bottom sheet on mobile
    return showModalBottomSheet<T>(
      context: context,
      isScrollControlled: isScrollControlled,
      enableDrag: enableDrag,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => AdaptiveBottomSheet(
        title: title,
        height: height,
        isScrollControlled: isScrollControlled,
        initialChildSize: initialChildSize,
        minChildSize: minChildSize,
        maxChildSize: maxChildSize,
        enableDrag: enableDrag,
        showDragHandle: showDragHandle,
        child: child,
      ),
    );
  }
}

/// Adaptive card layout that adjusts its appearance based on screen size
class AdaptiveCard extends StatelessWidget {
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final EdgeInsetsGeometry? margin;
  final double? elevation;
  final Color? backgroundColor;
  final BorderRadius? borderRadius;
  final VoidCallback? onTap;
  final bool enableHover;
  
  const AdaptiveCard({
    Key? key,
    required this.child,
    this.padding,
    this.margin,
    this.elevation,
    this.backgroundColor,
    this.borderRadius,
    this.onTap,
    this.enableHover = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final screenType = ScreenSize.getScreenType(context);
    final colorScheme = Theme.of(context).colorScheme;
    
    // Adjust properties based on screen size
    EdgeInsetsGeometry cardPadding = padding ?? const EdgeInsets.all(16);
    EdgeInsetsGeometry cardMargin = margin ?? const EdgeInsets.all(8);
    double cardElevation = elevation ?? 2;
    
    switch (screenType) {
      case ResponsiveScreenType.mobile:
        // Mobile cards have less padding and elevation
        cardPadding = padding ?? const EdgeInsets.all(12);
        cardElevation = elevation ?? 1;
        break;
      case ResponsiveScreenType.tablet:
        cardPadding = padding ?? const EdgeInsets.all(16);
        cardElevation = elevation ?? 2;
        break;
      case ResponsiveScreenType.desktop:
      case ResponsiveScreenType.tv:
        // Desktop cards have more padding and can have hover effects
        cardPadding = padding ?? const EdgeInsets.all(20);
        cardElevation = elevation ?? 4;
        break;
    }
    
    Widget card = Card(
      margin: cardMargin,
      elevation: cardElevation,
      color: backgroundColor ?? colorScheme.surface,
      shape: RoundedRectangleBorder(
        borderRadius: borderRadius ?? BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: borderRadius ?? BorderRadius.circular(16),
        child: Padding(
          padding: cardPadding,
          child: child,
        ),
      ),
    );
    
    // Add hover effects on desktop
    if (enableHover && (screenType == ResponsiveScreenType.desktop || screenType == ResponsiveScreenType.tv)) {
      card = MouseRegion(
        cursor: onTap != null ? SystemMouseCursors.click : SystemMouseCursors.basic,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          child: card,
        ),
      );
    }
    
    return card;
  }
}

/// Adaptive list tile that adjusts its density and spacing
class AdaptiveListTile extends StatelessWidget {
  final Widget? leading;
  final Widget? title;
  final Widget? subtitle;
  final Widget? trailing;
  final VoidCallback? onTap;
  final VoidCallback? onLongPress;
  final bool enabled;
  final bool selected;
  final EdgeInsetsGeometry? contentPadding;
  
  const AdaptiveListTile({
    Key? key,
    this.leading,
    this.title,
    this.subtitle,
    this.trailing,
    this.onTap,
    this.onLongPress,
    this.enabled = true,
    this.selected = false,
    this.contentPadding,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final screenType = ScreenSize.getScreenType(context);
    
    // Adjust density based on screen size
    VisualDensity density = VisualDensity.standard;
    EdgeInsetsGeometry padding = contentPadding ?? const EdgeInsets.symmetric(horizontal: 16);
    
    switch (screenType) {
      case ResponsiveScreenType.mobile:
        density = VisualDensity.comfortable;
        break;
      case ResponsiveScreenType.tablet:
        density = VisualDensity.standard;
        break;
      case ResponsiveScreenType.desktop:
      case ResponsiveScreenType.tv:
        density = VisualDensity.compact;
        padding = contentPadding ?? const EdgeInsets.symmetric(horizontal: 24, vertical: 4);
        break;
    }
    
    return ListTile(
      leading: leading,
      title: title,
      subtitle: subtitle,
      trailing: trailing,
      onTap: onTap,
      onLongPress: onLongPress,
      enabled: enabled,
      selected: selected,
      contentPadding: padding,
      visualDensity: density,
    );
  }
}