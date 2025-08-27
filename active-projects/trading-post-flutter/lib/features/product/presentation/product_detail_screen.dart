import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
// Removed glassmorphism_ui for compatibility
// Removed glassmorphic_card for compatibility
import '../../../core/widgets/animated_gradient_background.dart';

class ProductDetailScreen extends StatefulWidget {
  final String productId;
  final String heroTag;

  const ProductDetailScreen({
    super.key,
    required this.productId,
    required this.heroTag,
  });

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen>
    with TickerProviderStateMixin {
  late AnimationController _scrollController;
  late AnimationController _fabController;
  final ScrollController _pageScrollController = ScrollController();
  
  bool _isFavorite = false;
  int _selectedImageIndex = 0;
  int _quantity = 1;

  // Mock product data - in real app this would come from state management
  final List<String> _productImages = [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=500',
  ];

  @override
  void initState() {
    super.initState();
    _scrollController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _fabController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _pageScrollController.addListener(_onScroll);
    
    // Animate FAB in after a delay
    Future.delayed(const Duration(milliseconds: 800), () {
      if (mounted) _fabController.forward();
    });
  }

  void _onScroll() {
    final scrollOffset = _pageScrollController.offset;
    final progress = (scrollOffset / 200).clamp(0.0, 1.0);
    _scrollController.value = progress;
  }

  @override
  void dispose() {
    _scrollController.dispose();
    _fabController.dispose();
    _pageScrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final size = MediaQuery.of(context).size;

    return Scaffold(
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: AnimatedBuilder(
          animation: _scrollController,
          builder: (context, child) {
            return Container(
              margin: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface.withOpacity(
                  0.1 + _scrollController.value * 0.8,
                ),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: theme.colorScheme.outline.withOpacity(0.1),
                ),
              ),
              child: IconButton(
                icon: Icon(
                  Icons.arrow_back_ios_new,
                  color: theme.colorScheme.onSurface,
                ),
                onPressed: () => Navigator.of(context).pop(),
              ),
            );
          },
        ),
        actions: [
          AnimatedBuilder(
            animation: _scrollController,
            builder: (context, child) {
              return Container(
                margin: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface.withOpacity(
                    0.1 + _scrollController.value * 0.8,
                  ),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: theme.colorScheme.outline.withOpacity(0.1),
                  ),
                ),
                child: IconButton(
                  icon: Icon(
                    Icons.share_rounded,
                    color: theme.colorScheme.onSurface,
                  ),
                  onPressed: () {},
                ),
              );
            },
          ),
        ],
      ),
      body: Stack(
        children: [
          // Animated background
          const AnimatedGradientBackground(),
          
          // Main content
          CustomScrollView(
            controller: _pageScrollController,
            slivers: [
              // Product image gallery
              SliverToBoxAdapter(
                child: _buildImageGallery(context, size),
              ),
              
              // Product details
              SliverToBoxAdapter(
                child: _buildProductDetails(context),
              ),
            ],
          ),
        ],
      ),
      floatingActionButton: AnimatedBuilder(
        animation: _fabController,
        builder: (context, child) {
          return Transform.scale(
            scale: _fabController.value,
            child: FloatingActionButton.extended(
              onPressed: () => _showAddToCartBottomSheet(context),
              icon: const Icon(Icons.shopping_cart_rounded),
              label: Text(
                'Add to Cart',
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                ),
              ),
              backgroundColor: theme.colorScheme.primary,
              foregroundColor: theme.colorScheme.onPrimary,
            ).animate().slideY(begin: 1.0, end: 0.0),
          );
        },
      ),
    );
  }

  Widget _buildImageGallery(BuildContext context, Size size) {
    final theme = Theme.of(context);
    
    return Container(
      height: size.height * 0.5,
      child: Stack(
        children: [
          // Main product image with hero animation
          Hero(
            tag: widget.heroTag,
            child: PageView.builder(
              itemCount: _productImages.length,
              onPageChanged: (index) {
                setState(() {
                  _selectedImageIndex = index;
                });
              },
              itemBuilder: (context, index) {
                return Container(
                  margin: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    boxShadow: [
                      BoxShadow(
                        color: theme.colorScheme.shadow.withOpacity(0.1),
                        blurRadius: 20,
                        spreadRadius: 5,
                      ),
                    ],
                  ),
                  child: ClipRRect(
                    borderRadius: BorderRadius.circular(24),
                    child: Image.network(
                      _productImages[index],
                      fit: BoxFit.cover,
                      width: double.infinity,
                    ),
                  ),
                );
              },
            ),
          ),
          
          // Image indicators
          Positioned(
            bottom: 20,
            left: 0,
            right: 0,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(
                _productImages.length,
                (index) => Container(
                  width: index == _selectedImageIndex ? 24 : 8,
                  height: 8,
                  margin: const EdgeInsets.symmetric(horizontal: 4),
                  decoration: BoxDecoration(
                    color: index == _selectedImageIndex
                        ? theme.colorScheme.primary
                        : theme.colorScheme.outline.withOpacity(0.3),
                    borderRadius: BorderRadius.circular(4),
                  ),
                )
                    .animate()
                    .scaleX(
                      duration: 300.ms,
                      curve: Curves.easeInOut,
                    ),
              ),
            ),
          ),
          
          // Favorite button
          Positioned(
            top: kToolbarHeight + 20,
            right: 20,
            child: Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: GestureDetector(
                  onTap: () {
                    setState(() {
                      _isFavorite = !_isFavorite;
                    });
                  },
                  child: Icon(
                    _isFavorite ? Icons.favorite : Icons.favorite_border,
                    color: _isFavorite
                        ? Colors.red
                        : theme.colorScheme.onSurface,
                  ),
                ),
              ),
            )
                .animate()
                .fadeIn(delay: 500.ms)
                .scale(delay: 500.ms),
          ),
        ],
      ),
    );
  }

  Widget _buildProductDetails(BuildContext context) {
    final theme = Theme.of(context);
    
    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product title and rating
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Premium Nike Sneakers',
                            style: theme.textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                              color: theme.colorScheme.onSurface,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'High-quality running shoes with advanced cushioning technology',
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.7),
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 16),
                    Text(
                      '\$159.99',
                      style: theme.textTheme.headlineMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Row(
                      children: List.generate(5, (index) {
                        return Icon(
                          Icons.star,
                          size: 20,
                          color: index < 4
                              ? Colors.amber
                              : theme.colorScheme.outline.withOpacity(0.3),
                        );
                      }),
                    ),
                    const SizedBox(width: 8),
                    Text(
                      '4.5 (128 reviews)',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        )
            .animate()
            .fadeIn(delay: 200.ms)
            .slideY(begin: 0.3, end: 0),
          
          const SizedBox(height: 24),
          
          // Size selector
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                Text(
                  'Size',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 12),
                Wrap(
                  spacing: 8,
                  children: ['7', '8', '8.5', '9', '9.5', '10', '10.5', '11']
                      .map((size) => _buildSizeChip(context, size))
                      .toList(),
                ),
              ],
            ),
          ),
        )
            .animate()
            .fadeIn(delay: 400.ms)
            .slideY(begin: 0.3, end: 0),
          
          const SizedBox(height: 24),
          
          // Product description
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                Text(
                  'Description',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: theme.colorScheme.onSurface,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Experience superior comfort and performance with these premium running shoes. Featuring advanced cushioning technology, breathable mesh upper, and durable rubber outsole for maximum traction.',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: theme.colorScheme.onSurface.withOpacity(0.8),
                    height: 1.6,
                  ),
                ),
              ],
            ),
          ),
        )
            .animate()
            .fadeIn(delay: 600.ms)
            .slideY(begin: 0.3, end: 0),
          
          const SizedBox(height: 100), // Space for FAB
        ],
      ),
    );
  }

  Widget _buildSizeChip(BuildContext context, String size) {
    final theme = Theme.of(context);
    final isSelected = size == '9'; // Mock selected size
    
    return GestureDetector(
      onTap: () {
        // Handle size selection
      },
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected
              ? theme.colorScheme.primary
              : theme.colorScheme.surface.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? theme.colorScheme.primary
                : theme.colorScheme.outline.withOpacity(0.2),
          ),
        ),
        child: Text(
          size,
          style: theme.textTheme.bodyMedium?.copyWith(
            color: isSelected
                ? theme.colorScheme.onPrimary
                : theme.colorScheme.onSurface,
            fontWeight: FontWeight.w500,
          ),
        ),
      ),
    );
  }

  void _showAddToCartBottomSheet(BuildContext context) {
    final theme = Theme.of(context);
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.4,
        width: double.infinity,
        decoration: BoxDecoration(
          color: theme.colorScheme.surface.withOpacity(0.95),
          borderRadius: const BorderRadius.vertical(top: Radius.circular(32)),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.shadow.withOpacity(0.1),
              blurRadius: 20,
              spreadRadius: 5,
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Handle bar
              Center(
                child: Container(
                  width: 48,
                  height: 4,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.outline.withOpacity(0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 24),
              
              // Title
              Text(
                'Add to Cart',
                style: theme.textTheme.headlineSmall?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: theme.colorScheme.onSurface,
                ),
              ),
              const SizedBox(height: 16),
              
              // Quantity selector
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Quantity',
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  Row(
                    children: [
                      IconButton(
                        onPressed: _quantity > 1 ? () {
                          setState(() {
                            _quantity--;
                          });
                        } : null,
                        icon: const Icon(Icons.remove),
                        style: IconButton.styleFrom(
                          backgroundColor: theme.colorScheme.primaryContainer,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        child: Text(
                          '$_quantity',
                          style: theme.textTheme.titleLarge?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.onSurface,
                          ),
                        ),
                      ),
                      IconButton(
                        onPressed: () {
                          setState(() {
                            _quantity++;
                          });
                        },
                        icon: const Icon(Icons.add),
                        style: IconButton.styleFrom(
                          backgroundColor: theme.colorScheme.primaryContainer,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
              
              const Spacer(),
              
              // Total and add button
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Total',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: theme.colorScheme.onSurface.withOpacity(0.7),
                        ),
                      ),
                      Text(
                        '\$${(159.99 * _quantity).toStringAsFixed(2)}',
                        style: theme.textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: theme.colorScheme.primary,
                        ),
                      ),
                    ],
                  ),
                  ElevatedButton(
                    onPressed: () {
                      Navigator.of(context).pop();
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text('Added $_quantity item(s) to cart!'),
                          behavior: SnackBarBehavior.floating,
                        ),
                      );
                    },
                    child: const Text('Add to Cart'),
                  ),
                ],
              ),
            ],
          ),
        ),
      )
          .animate()
          .slideY(begin: 1.0, end: 0.0)
          .fadeIn(),
    );
  }
}