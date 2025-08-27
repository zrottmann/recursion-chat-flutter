import 'package:flutter/material.dart';

/// Responsive layout utility for handling different screen sizes
class ResponsiveLayout extends StatelessWidget {
  final Widget mobile;
  final Widget? tablet;
  final Widget? desktop;
  final Widget? tv;
  final double mobileBreakpoint;
  final double tabletBreakpoint;
  final double desktopBreakpoint;
  
  const ResponsiveLayout({
    Key? key,
    required this.mobile,
    this.tablet,
    this.desktop,
    this.tv,
    this.mobileBreakpoint = 600,
    this.tabletBreakpoint = 1024,
    this.desktopBreakpoint = 1440,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    
    if (screenWidth >= desktopBreakpoint && tv != null) {
      return tv!;
    } else if (screenWidth >= tabletBreakpoint && desktop != null) {
      return desktop!;
    } else if (screenWidth >= mobileBreakpoint && tablet != null) {
      return tablet!;
    } else {
      return mobile;
    }
  }
}

/// Screen size detection utility
class ScreenSize {
  static const double mobileMaxWidth = 600;
  static const double tabletMaxWidth = 1024;
  static const double desktopMaxWidth = 1440;
  
  static bool isMobile(BuildContext context) {
    return MediaQuery.of(context).size.width < mobileMaxWidth;
  }
  
  static bool isTablet(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return width >= mobileMaxWidth && width < tabletMaxWidth;
  }
  
  static bool isDesktop(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    return width >= tabletMaxWidth && width < desktopMaxWidth;
  }
  
  static bool isTV(BuildContext context) {
    return MediaQuery.of(context).size.width >= desktopMaxWidth;
  }
  
  static ResponsiveScreenType getScreenType(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    
    if (width >= desktopMaxWidth) {
      return ResponsiveScreenType.tv;
    } else if (width >= tabletMaxWidth) {
      return ResponsiveScreenType.desktop;
    } else if (width >= mobileMaxWidth) {
      return ResponsiveScreenType.tablet;
    } else {
      return ResponsiveScreenType.mobile;
    }
  }
}

enum ResponsiveScreenType {
  mobile,
  tablet,
  desktop,
  tv,
}

/// Responsive grid layout that adapts to screen size
class ResponsiveGrid extends StatelessWidget {
  final List<Widget> children;
  final double spacing;
  final double runSpacing;
  final int? mobileColumns;
  final int? tabletColumns;
  final int? desktopColumns;
  final double? maxWidth;
  final EdgeInsetsGeometry? padding;
  final WrapAlignment alignment;
  final WrapCrossAlignment crossAxisAlignment;
  
  const ResponsiveGrid({
    Key? key,
    required this.children,
    this.spacing = 16,
    this.runSpacing = 16,
    this.mobileColumns = 1,
    this.tabletColumns = 2,
    this.desktopColumns = 3,
    this.maxWidth,
    this.padding,
    this.alignment = WrapAlignment.start,
    this.crossAxisAlignment = WrapCrossAlignment.start,
  }) : super(key: key);

  int _getColumns(BuildContext context) {
    if (ScreenSize.isDesktop(context) || ScreenSize.isTV(context)) {
      return desktopColumns ?? 3;
    } else if (ScreenSize.isTablet(context)) {
      return tabletColumns ?? 2;
    } else {
      return mobileColumns ?? 1;
    }
  }

  @override
  Widget build(BuildContext context) {
    final columns = _getColumns(context);
    final screenWidth = MediaQuery.of(context).size.width;
    final contentWidth = maxWidth != null 
        ? (maxWidth! < screenWidth ? maxWidth! : screenWidth)
        : screenWidth;
    
    final horizontalPadding = padding?.resolve(TextDirection.ltr).horizontal ?? 0;
    final availableWidth = contentWidth - horizontalPadding - (spacing * (columns - 1));
    final itemWidth = availableWidth / columns;
    
    return Container(
      width: maxWidth,
      padding: padding,
      child: Wrap(
        spacing: spacing,
        runSpacing: runSpacing,
        alignment: alignment,
        crossAxisAlignment: crossAxisAlignment,
        children: children.map((child) {
          return SizedBox(
            width: itemWidth,
            child: child,
          );
        }).toList(),
      ),
    );
  }
}

/// Responsive column layout with different configurations per screen size
class ResponsiveColumns extends StatelessWidget {
  final List<Widget> children;
  final double spacing;
  final int? mobileColumns;
  final int? tabletColumns;
  final int? desktopColumns;
  final EdgeInsetsGeometry? padding;
  final MainAxisAlignment mainAxisAlignment;
  final CrossAxisAlignment crossAxisAlignment;
  
  const ResponsiveColumns({
    Key? key,
    required this.children,
    this.spacing = 16,
    this.mobileColumns = 1,
    this.tabletColumns = 2,
    this.desktopColumns = 3,
    this.padding,
    this.mainAxisAlignment = MainAxisAlignment.start,
    this.crossAxisAlignment = CrossAxisAlignment.start,
  }) : super(key: key);

  int _getColumns(BuildContext context) {
    if (ScreenSize.isDesktop(context) || ScreenSize.isTV(context)) {
      return desktopColumns ?? 3;
    } else if (ScreenSize.isTablet(context)) {
      return tabletColumns ?? 2;
    } else {
      return mobileColumns ?? 1;
    }
  }

  List<List<Widget>> _groupChildren(int columns) {
    final List<List<Widget>> groups = [];
    for (int i = 0; i < children.length; i += columns) {
      groups.add(
        children.sublist(i, i + columns > children.length ? children.length : i + columns),
      );
    }
    return groups;
  }

  @override
  Widget build(BuildContext context) {
    final columns = _getColumns(context);
    final groups = _groupChildren(columns);
    
    return Container(
      padding: padding,
      child: Column(
        mainAxisAlignment: mainAxisAlignment,
        crossAxisAlignment: crossAxisAlignment,
        children: groups.map((group) {
          return Padding(
            padding: EdgeInsets.only(bottom: spacing),
            child: Row(
              crossAxisAlignment: crossAxisAlignment,
              children: group.asMap().entries.map((entry) {
                final index = entry.key;
                final child = entry.value;
                
                return Expanded(
                  child: Container(
                    margin: EdgeInsets.only(
                      right: index < group.length - 1 ? spacing : 0,
                    ),
                    child: child,
                  ),
                );
              }).toList(),
            ),
          );
        }).toList(),
      ),
    );
  }
}

/// Responsive scaffold that adapts its layout based on screen size
class ResponsiveScaffold extends StatelessWidget {
  final Widget body;
  final PreferredSizeWidget? appBar;
  final Widget? drawer;
  final Widget? bottomNavigationBar;
  final Widget? floatingActionButton;
  final FloatingActionButtonLocation? floatingActionButtonLocation;
  final List<Widget>? persistentFooterButtons;
  final bool extendBody;
  final bool extendBodyBehindAppBar;
  final Color? backgroundColor;
  final Widget? bottomSheet;
  final bool resizeToAvoidBottomInset;
  final Widget? endDrawer;
  final bool drawerEnableOpenDragGesture;
  final bool endDrawerEnableOpenDragGesture;
  
  // Responsive specific properties
  final Widget? tabletSidebar;
  final Widget? desktopSidebar;
  final bool showBottomNavOnTablet;
  final bool showBottomNavOnDesktop;
  final double sidebarWidth;
  
  const ResponsiveScaffold({
    Key? key,
    required this.body,
    this.appBar,
    this.drawer,
    this.bottomNavigationBar,
    this.floatingActionButton,
    this.floatingActionButtonLocation,
    this.persistentFooterButtons,
    this.extendBody = false,
    this.extendBodyBehindAppBar = false,
    this.backgroundColor,
    this.bottomSheet,
    this.resizeToAvoidBottomInset = true,
    this.endDrawer,
    this.drawerEnableOpenDragGesture = true,
    this.endDrawerEnableOpenDragGesture = true,
    this.tabletSidebar,
    this.desktopSidebar,
    this.showBottomNavOnTablet = false,
    this.showBottomNavOnDesktop = false,
    this.sidebarWidth = 280,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final screenType = ScreenSize.getScreenType(context);
    
    // Mobile layout - standard scaffold
    if (screenType == ResponsiveScreenType.mobile) {
      return Scaffold(
        appBar: appBar,
        body: body,
        drawer: drawer,
        bottomNavigationBar: bottomNavigationBar,
        floatingActionButton: floatingActionButton,
        floatingActionButtonLocation: floatingActionButtonLocation,
        persistentFooterButtons: persistentFooterButtons,
        extendBody: extendBody,
        extendBodyBehindAppBar: extendBodyBehindAppBar,
        backgroundColor: backgroundColor,
        bottomSheet: bottomSheet,
        resizeToAvoidBottomInset: resizeToAvoidBottomInset,
        endDrawer: endDrawer,
        drawerEnableOpenDragGesture: drawerEnableOpenDragGesture,
        endDrawerEnableOpenDragGesture: endDrawerEnableOpenDragGesture,
      );
    }
    
    // Tablet/Desktop layout with sidebar
    final sidebar = screenType == ResponsiveScreenType.desktop || screenType == ResponsiveScreenType.tv
        ? desktopSidebar ?? tabletSidebar
        : tabletSidebar;
    
    final showBottomNav = screenType == ResponsiveScreenType.desktop || screenType == ResponsiveScreenType.tv
        ? showBottomNavOnDesktop
        : showBottomNavOnTablet;
    
    return Scaffold(
      appBar: appBar,
      backgroundColor: backgroundColor,
      bottomSheet: bottomSheet,
      resizeToAvoidBottomInset: resizeToAvoidBottomInset,
      extendBody: extendBody,
      extendBodyBehindAppBar: extendBodyBehindAppBar,
      floatingActionButton: floatingActionButton,
      floatingActionButtonLocation: floatingActionButtonLocation,
      persistentFooterButtons: persistentFooterButtons,
      bottomNavigationBar: showBottomNav ? bottomNavigationBar : null,
      body: Row(
        children: [
          if (sidebar != null)
            Container(
              width: sidebarWidth,
              child: sidebar,
            ),
          if (sidebar != null)
            const VerticalDivider(width: 1, thickness: 1),
          Expanded(child: body),
        ],
      ),
    );
  }
}

/// Responsive padding utility
class ResponsivePadding extends EdgeInsets {
  const ResponsivePadding._({
    required double left,
    required double top,
    required double right,
    required double bottom,
  }) : super.fromLTRB(left, top, right, bottom);
  
  factory ResponsivePadding.symmetric({
    required BuildContext context,
    double? horizontal,
    double? vertical,
    double? mobileHorizontal,
    double? tabletHorizontal,
    double? desktopHorizontal,
    double? mobileVertical,
    double? tabletVertical,
    double? desktopVertical,
  }) {
    final screenType = ScreenSize.getScreenType(context);
    
    double h = horizontal ?? 16;
    double v = vertical ?? 16;
    
    switch (screenType) {
      case ResponsiveScreenType.mobile:
        h = mobileHorizontal ?? h;
        v = mobileVertical ?? v;
        break;
      case ResponsiveScreenType.tablet:
        h = tabletHorizontal ?? h;
        v = tabletVertical ?? v;
        break;
      case ResponsiveScreenType.desktop:
      case ResponsiveScreenType.tv:
        h = desktopHorizontal ?? h;
        v = desktopVertical ?? v;
        break;
    }
    
    return ResponsivePadding._(
      left: h,
      top: v,
      right: h,
      bottom: v,
    );
  }
  
  factory ResponsivePadding.all(BuildContext context, {
    double? mobile,
    double? tablet,
    double? desktop,
    double defaultValue = 16,
  }) {
    final screenType = ScreenSize.getScreenType(context);
    
    double value = defaultValue;
    switch (screenType) {
      case ResponsiveScreenType.mobile:
        value = mobile ?? value;
        break;
      case ResponsiveScreenType.tablet:
        value = tablet ?? value;
        break;
      case ResponsiveScreenType.desktop:
      case ResponsiveScreenType.tv:
        value = desktop ?? value;
        break;
    }
    
    return ResponsivePadding._(
      left: value,
      top: value,
      right: value,
      bottom: value,
    );
  }
}

/// Responsive spacing utility
class ResponsiveSpacing {
  static double getSpacing(BuildContext context, {
    double? mobile,
    double? tablet,
    double? desktop,
    double defaultValue = 16,
  }) {
    final screenType = ScreenSize.getScreenType(context);
    
    switch (screenType) {
      case ResponsiveScreenType.mobile:
        return mobile ?? defaultValue;
      case ResponsiveScreenType.tablet:
        return tablet ?? defaultValue;
      case ResponsiveScreenType.desktop:
      case ResponsiveScreenType.tv:
        return desktop ?? defaultValue;
    }
  }
  
  static SizedBox vertical(BuildContext context, {
    double? mobile,
    double? tablet,
    double? desktop,
    double defaultValue = 16,
  }) {
    return SizedBox(
      height: getSpacing(
        context,
        mobile: mobile,
        tablet: tablet,
        desktop: desktop,
        defaultValue: defaultValue,
      ),
    );
  }
  
  static SizedBox horizontal(BuildContext context, {
    double? mobile,
    double? tablet,
    double? desktop,
    double defaultValue = 16,
  }) {
    return SizedBox(
      width: getSpacing(
        context,
        mobile: mobile,
        tablet: tablet,
        desktop: desktop,
        defaultValue: defaultValue,
      ),
    );
  }
}

/// Responsive typography utility
class ResponsiveText extends StatelessWidget {
  final String text;
  final TextStyle? style;
  final TextStyle? mobileStyle;
  final TextStyle? tabletStyle;
  final TextStyle? desktopStyle;
  final int? maxLines;
  final TextOverflow? overflow;
  final TextAlign? textAlign;
  
  const ResponsiveText(
    this.text, {
    Key? key,
    this.style,
    this.mobileStyle,
    this.tabletStyle,
    this.desktopStyle,
    this.maxLines,
    this.overflow,
    this.textAlign,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final screenType = ScreenSize.getScreenType(context);
    
    TextStyle? responsiveStyle = style;
    switch (screenType) {
      case ResponsiveScreenType.mobile:
        responsiveStyle = mobileStyle ?? style;
        break;
      case ResponsiveScreenType.tablet:
        responsiveStyle = tabletStyle ?? style;
        break;
      case ResponsiveScreenType.desktop:
      case ResponsiveScreenType.tv:
        responsiveStyle = desktopStyle ?? style;
        break;
    }
    
    return Text(
      text,
      style: responsiveStyle,
      maxLines: maxLines,
      overflow: overflow,
      textAlign: textAlign,
    );
  }
}