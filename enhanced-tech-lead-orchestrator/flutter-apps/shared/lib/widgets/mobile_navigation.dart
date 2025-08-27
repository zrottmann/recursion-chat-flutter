import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Mobile-optimized bottom navigation bar with haptic feedback
class MobileBottomNavigation extends StatefulWidget {
  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final List<NavigationDestination> destinations;
  final Color? backgroundColor;
  final double? elevation;
  final bool enableHapticFeedback;
  final Duration animationDuration;
  
  const MobileBottomNavigation({
    Key? key,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.destinations,
    this.backgroundColor,
    this.elevation = 8,
    this.enableHapticFeedback = true,
    this.animationDuration = const Duration(milliseconds: 300),
  }) : super(key: key);

  @override
  State<MobileBottomNavigation> createState() => _MobileBottomNavigationState();
}

class _MobileBottomNavigationState extends State<MobileBottomNavigation>
    with TickerProviderStateMixin {
  late List<AnimationController> _animationControllers;
  late List<Animation<double>> _scaleAnimations;
  late List<Animation<double>> _rotationAnimations;

  @override
  void initState() {
    super.initState();
    _initializeAnimations();
  }

  void _initializeAnimations() {
    _animationControllers = List.generate(
      widget.destinations.length,
      (index) => AnimationController(
        duration: widget.animationDuration,
        vsync: this,
      ),
    );

    _scaleAnimations = _animationControllers.map((controller) =>
        Tween<double>(begin: 1.0, end: 1.2).animate(CurvedAnimation(
          parent: controller,
          curve: Curves.elasticOut,
        ))).toList();

    _rotationAnimations = _animationControllers.map((controller) =>
        Tween<double>(begin: 0.0, end: 0.1).animate(CurvedAnimation(
          parent: controller,
          curve: Curves.easeInOut,
        ))).toList();
  }

  @override
  void dispose() {
    for (var controller in _animationControllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  void didUpdateWidget(MobileBottomNavigation oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.destinations.length != widget.destinations.length) {
      for (var controller in _animationControllers) {
        controller.dispose();
      }
      _initializeAnimations();
    }
  }

  Future<void> _handleTap(int index) async {
    if (index == widget.selectedIndex) return;
    
    if (widget.enableHapticFeedback) {
      await HapticFeedback.selectionClick();
    }

    // Animate the selected item
    _animationControllers[index].forward().then((_) {
      _animationControllers[index].reverse();
    });

    widget.onDestinationSelected(index);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return Container(
      decoration: BoxDecoration(
        color: widget.backgroundColor ?? colorScheme.surface,
        boxShadow: [
          if (widget.elevation != null && widget.elevation! > 0)
            BoxShadow(
              color: colorScheme.shadow.withOpacity(0.1),
              offset: Offset(0, -widget.elevation! * 0.5),
              blurRadius: widget.elevation! * 2,
            ),
        ],
      ),
      child: SafeArea(
        child: Container(
          height: 80,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
          child: Row(
            children: widget.destinations.asMap().entries.map((entry) {
              final index = entry.key;
              final destination = entry.value;
              final isSelected = index == widget.selectedIndex;
              
              return Expanded(
                child: AnimatedBuilder(
                  animation: _animationControllers[index],
                  builder: (context, child) {
                    return Transform.scale(
                      scale: _scaleAnimations[index].value,
                      child: Transform.rotate(
                        angle: _rotationAnimations[index].value,
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () => _handleTap(index),
                            borderRadius: BorderRadius.circular(16),
                            splashColor: colorScheme.primary.withOpacity(0.1),
                            highlightColor: colorScheme.primary.withOpacity(0.05),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              decoration: BoxDecoration(
                                color: isSelected 
                                    ? colorScheme.primary.withOpacity(0.1)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(16),
                              ),
                              child: Column(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  AnimatedSwitcher(
                                    duration: const Duration(milliseconds: 200),
                                    child: isSelected
                                        ? destination.selectedIcon
                                        : destination.icon,
                                  ),
                                  const SizedBox(height: 4),
                                  AnimatedDefaultTextStyle(
                                    duration: const Duration(milliseconds: 200),
                                    style: Theme.of(context).textTheme.labelSmall!.copyWith(
                                      color: isSelected
                                          ? colorScheme.primary
                                          : colorScheme.onSurface.withOpacity(0.6),
                                      fontWeight: isSelected 
                                          ? FontWeight.w600 
                                          : FontWeight.normal,
                                    ),
                                    child: destination.label,
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ),
                    );
                  },
                ),
              );
            }).toList(),
          ),
        ),
      ),
    );
  }
}

/// Mobile-optimized tab bar with enhanced animations
class MobileTabBar extends StatefulWidget {
  final List<String> tabs;
  final int selectedIndex;
  final ValueChanged<int> onTabSelected;
  final Color? backgroundColor;
  final Color? selectedColor;
  final Color? unselectedColor;
  final EdgeInsetsGeometry? padding;
  final bool enableHapticFeedback;
  
  const MobileTabBar({
    Key? key,
    required this.tabs,
    required this.selectedIndex,
    required this.onTabSelected,
    this.backgroundColor,
    this.selectedColor,
    this.unselectedColor,
    this.padding,
    this.enableHapticFeedback = true,
  }) : super(key: key);

  @override
  State<MobileTabBar> createState() => _MobileTabBarState();
}

class _MobileTabBarState extends State<MobileTabBar>
    with TickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _indicatorAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _indicatorAnimation = Tween<double>(
      begin: widget.selectedIndex.toDouble(),
      end: widget.selectedIndex.toDouble(),
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

  @override
  void didUpdateWidget(MobileTabBar oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.selectedIndex != widget.selectedIndex) {
      _indicatorAnimation = Tween<double>(
        begin: oldWidget.selectedIndex.toDouble(),
        end: widget.selectedIndex.toDouble(),
      ).animate(CurvedAnimation(
        parent: _animationController,
        curve: Curves.easeInOut,
      ));
      _animationController.forward(from: 0);
    }
  }

  Future<void> _handleTap(int index) async {
    if (index == widget.selectedIndex) return;
    
    if (widget.enableHapticFeedback) {
      await HapticFeedback.selectionClick();
    }

    widget.onTabSelected(index);
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final selectedColor = widget.selectedColor ?? colorScheme.primary;
    final unselectedColor = widget.unselectedColor ?? colorScheme.onSurface.withOpacity(0.6);
    
    return Container(
      padding: widget.padding ?? const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: widget.backgroundColor ?? colorScheme.surfaceVariant.withOpacity(0.3),
        borderRadius: BorderRadius.circular(25),
      ),
      child: Stack(
        children: [
          // Animated indicator
          AnimatedBuilder(
            animation: _indicatorAnimation,
            builder: (context, child) {
              final tabWidth = (MediaQuery.of(context).size.width - 32) / widget.tabs.length;
              return Positioned(
                left: _indicatorAnimation.value * tabWidth,
                child: Container(
                  width: tabWidth,
                  height: 40,
                  decoration: BoxDecoration(
                    color: selectedColor,
                    borderRadius: BorderRadius.circular(20),
                    boxShadow: [
                      BoxShadow(
                        color: selectedColor.withOpacity(0.3),
                        offset: const Offset(0, 2),
                        blurRadius: 8,
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
          
          // Tab buttons
          Row(
            children: widget.tabs.asMap().entries.map((entry) {
              final index = entry.key;
              final tab = entry.value;
              final isSelected = index == widget.selectedIndex;
              
              return Expanded(
                child: Material(
                  color: Colors.transparent,
                  child: InkWell(
                    onTap: () => _handleTap(index),
                    borderRadius: BorderRadius.circular(20),
                    child: Container(
                      height: 40,
                      alignment: Alignment.center,
                      child: AnimatedDefaultTextStyle(
                        duration: const Duration(milliseconds: 200),
                        style: Theme.of(context).textTheme.titleSmall!.copyWith(
                          color: isSelected ? colorScheme.onPrimary : unselectedColor,
                          fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                        ),
                        child: Text(tab),
                      ),
                    ),
                  ),
                ),
              );
            }).toList(),
          ),
        ],
      ),
    );
  }
}

/// Mobile-optimized drawer with gesture support
class MobileDrawer extends StatefulWidget {
  final Widget child;
  final double width;
  final Color? backgroundColor;
  final EdgeInsetsGeometry? padding;
  final bool enableSwipeGesture;
  final VoidCallback? onClose;
  
  const MobileDrawer({
    Key? key,
    required this.child,
    this.width = 280,
    this.backgroundColor,
    this.padding,
    this.enableSwipeGesture = true,
    this.onClose,
  }) : super(key: key);

  @override
  State<MobileDrawer> createState() => _MobileDrawerState();
}

class _MobileDrawerState extends State<MobileDrawer>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<Offset> _slideAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _slideAnimation = Tween<Offset>(
      begin: const Offset(-1.0, 0.0),
      end: Offset.zero,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _fadeAnimation = Tween<double>(
      begin: 0.0,
      end: 0.5,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
    
    _animationController.forward();
  }

  @override
  void dispose() {
    _animationController.dispose();
    super.dispose();
  }

  Future<void> _handleClose() async {
    await HapticFeedback.lightImpact();
    await _animationController.reverse();
    widget.onClose?.call();
    if (mounted) {
      Navigator.of(context).pop();
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    
    return AnimatedBuilder(
      animation: _animationController,
      builder: (context, child) {
        return Material(
          color: Colors.transparent,
          child: Stack(
            children: [
              // Backdrop
              GestureDetector(
                onTap: _handleClose,
                child: Container(
                  color: Colors.black.withOpacity(_fadeAnimation.value),
                ),
              ),
              
              // Drawer content
              SlideTransition(
                position: _slideAnimation,
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Container(
                    width: widget.width,
                    height: double.infinity,
                    decoration: BoxDecoration(
                      color: widget.backgroundColor ?? colorScheme.surface,
                      boxShadow: [
                        BoxShadow(
                          color: colorScheme.shadow.withOpacity(0.2),
                          offset: const Offset(2, 0),
                          blurRadius: 8,
                        ),
                      ],
                    ),
                    child: SafeArea(
                      child: Padding(
                        padding: widget.padding ?? EdgeInsets.zero,
                        child: widget.child,
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

/// Mobile-optimized page indicator for page views
class MobilePageIndicator extends StatelessWidget {
  final int pageCount;
  final int currentPage;
  final Color? activeColor;
  final Color? inactiveColor;
  final double size;
  final double spacing;
  final Duration animationDuration;
  
  const MobilePageIndicator({
    Key? key,
    required this.pageCount,
    required this.currentPage,
    this.activeColor,
    this.inactiveColor,
    this.size = 8,
    this.spacing = 8,
    this.animationDuration = const Duration(milliseconds: 300),
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final activeCol = activeColor ?? colorScheme.primary;
    final inactiveCol = inactiveColor ?? colorScheme.onSurface.withOpacity(0.3);
    
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(pageCount, (index) {
        final isActive = index == currentPage;
        
        return Container(
          margin: EdgeInsets.symmetric(horizontal: spacing / 2),
          child: AnimatedContainer(
            duration: animationDuration,
            curve: Curves.easeInOut,
            width: isActive ? size * 2 : size,
            height: size,
            decoration: BoxDecoration(
              color: isActive ? activeCol : inactiveCol,
              borderRadius: BorderRadius.circular(size / 2),
              boxShadow: isActive ? [
                BoxShadow(
                  color: activeCol.withOpacity(0.3),
                  offset: const Offset(0, 2),
                  blurRadius: 4,
                ),
              ] : null,
            ),
          ),
        );
      }),
    );
  }
}