import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

/// Mobile-optimized input field with enhanced UX features
class MobileInput extends StatefulWidget {
  final String? label;
  final String? hint;
  final String? helperText;
  final String? errorText;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onTap;
  final ValueChanged<String>? onSubmitted;
  final FocusNode? focusNode;
  final TextInputType? keyboardType;
  final TextInputAction? textInputAction;
  final List<TextInputFormatter>? inputFormatters;
  final bool obscureText;
  final bool readOnly;
  final bool enabled;
  final int? maxLines;
  final int? minLines;
  final int? maxLength;
  final String? prefixText;
  final IconData? prefixIcon;
  final Widget? suffixIcon;
  final VoidCallback? onSuffixIconTap;
  final EdgeInsetsGeometry? contentPadding;
  final BorderRadius? borderRadius;
  final Color? fillColor;
  final bool autofocus;
  final bool enableHapticFeedback;
  final MobileInputStyle style;
  final AutovalidateMode? autovalidateMode;
  final FormFieldValidator<String>? validator;
  
  const MobileInput({
    Key? key,
    this.label,
    this.hint,
    this.helperText,
    this.errorText,
    this.controller,
    this.onChanged,
    this.onTap,
    this.onSubmitted,
    this.focusNode,
    this.keyboardType,
    this.textInputAction,
    this.inputFormatters,
    this.obscureText = false,
    this.readOnly = false,
    this.enabled = true,
    this.maxLines = 1,
    this.minLines,
    this.maxLength,
    this.prefixText,
    this.prefixIcon,
    this.suffixIcon,
    this.onSuffixIconTap,
    this.contentPadding,
    this.borderRadius,
    this.fillColor,
    this.autofocus = false,
    this.enableHapticFeedback = true,
    this.style = MobileInputStyle.outlined,
    this.autovalidateMode,
    this.validator,
  }) : super(key: key);

  @override
  State<MobileInput> createState() => _MobileInputState();
}

class _MobileInputState extends State<MobileInput>
    with SingleTickerProviderStateMixin {
  late AnimationController _animationController;
  late Animation<double> _scaleAnimation;
  late Animation<Color?> _borderColorAnimation;
  
  late FocusNode _focusNode;
  bool _isFocused = false;
  bool _hasError = false;

  @override
  void initState() {
    super.initState();
    
    _focusNode = widget.focusNode ?? FocusNode();
    _focusNode.addListener(_handleFocusChange);
    
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );
    
    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.02,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    if (widget.focusNode == null) {
      _focusNode.dispose();
    }
    _animationController.dispose();
    super.dispose();
  }

  @override
  void didUpdateWidget(MobileInput oldWidget) {
    super.didUpdateWidget(oldWidget);
    
    if (widget.errorText != oldWidget.errorText) {
      setState(() {
        _hasError = widget.errorText != null;
      });
    }
  }

  void _handleFocusChange() {
    setState(() {
      _isFocused = _focusNode.hasFocus;
    });
    
    if (_isFocused) {
      _animationController.forward();
      if (widget.enableHapticFeedback) {
        HapticFeedback.selectionClick();
      }
    } else {
      _animationController.reverse();
    }
  }

  Future<void> _handleTap() async {
    if (widget.enableHapticFeedback) {
      await HapticFeedback.lightImpact();
    }
    widget.onTap?.call();
  }

  InputBorder _getBorder(ColorScheme colorScheme, {bool isFocused = false, bool hasError = false}) {
    final borderRadius = widget.borderRadius ?? BorderRadius.circular(12);
    
    Color borderColor;
    if (hasError) {
      borderColor = colorScheme.error;
    } else if (isFocused) {
      borderColor = colorScheme.primary;
    } else {
      borderColor = colorScheme.outline;
    }
    
    double borderWidth = isFocused ? 2.0 : 1.0;
    
    switch (widget.style) {
      case MobileInputStyle.outlined:
        return OutlineInputBorder(
          borderRadius: borderRadius,
          borderSide: BorderSide(
            color: borderColor,
            width: borderWidth,
          ),
        );
      case MobileInputStyle.filled:
        return OutlineInputBorder(
          borderRadius: borderRadius,
          borderSide: BorderSide.none,
        );
      case MobileInputStyle.underlined:
        return UnderlineInputBorder(
          borderSide: BorderSide(
            color: borderColor,
            width: borderWidth,
          ),
        );
    }
  }

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    final textTheme = Theme.of(context).textTheme;
    
    _hasError = widget.errorText != null;
    
    Widget? prefixWidget;
    if (widget.prefixIcon != null || widget.prefixText != null) {
      prefixWidget = Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (widget.prefixIcon != null) ...[
            Icon(
              widget.prefixIcon,
              color: _isFocused 
                  ? colorScheme.primary 
                  : colorScheme.onSurface.withOpacity(0.6),
              size: 20,
            ),
            const SizedBox(width: 8),
          ],
          if (widget.prefixText != null) ...[
            Text(
              widget.prefixText!,
              style: textTheme.bodyMedium?.copyWith(
                color: colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
            const SizedBox(width: 4),
          ],
        ],
      );
    }

    Widget? suffixWidget;
    if (widget.suffixIcon != null) {
      suffixWidget = GestureDetector(
        onTap: widget.onSuffixIconTap,
        child: widget.suffixIcon,
      );
    }

    final inputDecoration = InputDecoration(
      labelText: widget.label,
      hintText: widget.hint,
      helperText: widget.helperText,
      errorText: widget.errorText,
      prefixIcon: prefixWidget,
      suffixIcon: suffixWidget,
      filled: widget.style == MobileInputStyle.filled,
      fillColor: widget.fillColor ?? (widget.style == MobileInputStyle.filled 
          ? colorScheme.surfaceVariant 
          : null),
      contentPadding: widget.contentPadding ?? const EdgeInsets.symmetric(
        horizontal: 16,
        vertical: 16,
      ),
      border: _getBorder(colorScheme),
      enabledBorder: _getBorder(colorScheme),
      focusedBorder: _getBorder(colorScheme, isFocused: true),
      errorBorder: _getBorder(colorScheme, hasError: true),
      focusedErrorBorder: _getBorder(colorScheme, isFocused: true, hasError: true),
      labelStyle: TextStyle(
        color: _hasError 
            ? colorScheme.error
            : _isFocused 
                ? colorScheme.primary 
                : colorScheme.onSurface.withOpacity(0.6),
      ),
      hintStyle: TextStyle(
        color: colorScheme.onSurface.withOpacity(0.4),
      ),
      helperStyle: TextStyle(
        color: colorScheme.onSurface.withOpacity(0.6),
        fontSize: 12,
      ),
      errorStyle: TextStyle(
        color: colorScheme.error,
        fontSize: 12,
      ),
    );

    return AnimatedBuilder(
      animation: _scaleAnimation,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (widget.validator != null)
                FormField<String>(
                  autovalidateMode: widget.autovalidateMode,
                  validator: widget.validator,
                  builder: (formFieldState) {
                    return TextFormField(
                      controller: widget.controller,
                      focusNode: _focusNode,
                      decoration: inputDecoration.copyWith(
                        errorText: formFieldState.errorText ?? widget.errorText,
                      ),
                      keyboardType: widget.keyboardType,
                      textInputAction: widget.textInputAction,
                      inputFormatters: widget.inputFormatters,
                      obscureText: widget.obscureText,
                      readOnly: widget.readOnly,
                      enabled: widget.enabled,
                      maxLines: widget.maxLines,
                      minLines: widget.minLines,
                      maxLength: widget.maxLength,
                      autofocus: widget.autofocus,
                      onChanged: (value) {
                        formFieldState.didChange(value);
                        widget.onChanged?.call(value);
                      },
                      onTap: widget.onTap != null ? _handleTap : null,
                      onFieldSubmitted: widget.onSubmitted,
                    );
                  },
                )
              else
                TextField(
                  controller: widget.controller,
                  focusNode: _focusNode,
                  decoration: inputDecoration,
                  keyboardType: widget.keyboardType,
                  textInputAction: widget.textInputAction,
                  inputFormatters: widget.inputFormatters,
                  obscureText: widget.obscureText,
                  readOnly: widget.readOnly,
                  enabled: widget.enabled,
                  maxLines: widget.maxLines,
                  minLines: widget.minLines,
                  maxLength: widget.maxLength,
                  autofocus: widget.autofocus,
                  onChanged: widget.onChanged,
                  onTap: widget.onTap != null ? _handleTap : null,
                  onSubmitted: widget.onSubmitted,
                ),
            ],
          ),
        );
      },
    );
  }
}

enum MobileInputStyle {
  outlined,
  filled,
  underlined,
}

/// Mobile-optimized search input field
class MobileSearchInput extends StatefulWidget {
  final String? hint;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onClear;
  final TextEditingController? controller;
  final bool enabled;
  final bool autofocus;
  final EdgeInsetsGeometry? padding;
  
  const MobileSearchInput({
    Key? key,
    this.hint = 'Search...',
    this.onChanged,
    this.onClear,
    this.controller,
    this.enabled = true,
    this.autofocus = false,
    this.padding,
  }) : super(key: key);

  @override
  State<MobileSearchInput> createState() => _MobileSearchInputState();
}

class _MobileSearchInputState extends State<MobileSearchInput> {
  late TextEditingController _controller;
  bool _hasText = false;

  @override
  void initState() {
    super.initState();
    _controller = widget.controller ?? TextEditingController();
    _controller.addListener(_handleTextChange);
    _hasText = _controller.text.isNotEmpty;
  }

  @override
  void dispose() {
    if (widget.controller == null) {
      _controller.dispose();
    }
    super.dispose();
  }

  void _handleTextChange() {
    final hasText = _controller.text.isNotEmpty;
    if (hasText != _hasText) {
      setState(() {
        _hasText = hasText;
      });
    }
    widget.onChanged?.call(_controller.text);
  }

  void _handleClear() {
    _controller.clear();
    widget.onClear?.call();
    HapticFeedback.lightImpact();
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: widget.padding ?? const EdgeInsets.symmetric(horizontal: 16),
      child: MobileInput(
        controller: _controller,
        hint: widget.hint,
        enabled: widget.enabled,
        autofocus: widget.autofocus,
        prefixIcon: Icons.search,
        style: MobileInputStyle.filled,
        textInputAction: TextInputAction.search,
        keyboardType: TextInputType.text,
        suffixIcon: _hasText
            ? IconButton(
                icon: const Icon(Icons.clear),
                onPressed: _handleClear,
                tooltip: 'Clear search',
              )
            : null,
        borderRadius: BorderRadius.circular(24),
      ),
    );
  }
}

/// Mobile-optimized password input field
class MobilePasswordInput extends StatefulWidget {
  final String? label;
  final String? hint;
  final TextEditingController? controller;
  final ValueChanged<String>? onChanged;
  final ValueChanged<String>? onSubmitted;
  final FormFieldValidator<String>? validator;
  final bool enabled;
  final AutovalidateMode? autovalidateMode;
  
  const MobilePasswordInput({
    Key? key,
    this.label = 'Password',
    this.hint,
    this.controller,
    this.onChanged,
    this.onSubmitted,
    this.validator,
    this.enabled = true,
    this.autovalidateMode,
  }) : super(key: key);

  @override
  State<MobilePasswordInput> createState() => _MobilePasswordInputState();
}

class _MobilePasswordInputState extends State<MobilePasswordInput> {
  bool _isObscured = true;

  void _toggleObscure() {
    setState(() {
      _isObscured = !_isObscured;
    });
    HapticFeedback.lightImpact();
  }

  @override
  Widget build(BuildContext context) {
    return MobileInput(
      label: widget.label,
      hint: widget.hint,
      controller: widget.controller,
      onChanged: widget.onChanged,
      onSubmitted: widget.onSubmitted,
      validator: widget.validator,
      enabled: widget.enabled,
      autovalidateMode: widget.autovalidateMode,
      obscureText: _isObscured,
      keyboardType: TextInputType.visiblePassword,
      textInputAction: TextInputAction.done,
      prefixIcon: Icons.lock_outline,
      suffixIcon: IconButton(
        icon: Icon(
          _isObscured ? Icons.visibility_outlined : Icons.visibility_off_outlined,
        ),
        onPressed: _toggleObscure,
        tooltip: _isObscured ? 'Show password' : 'Hide password',
      ),
    );
  }
}