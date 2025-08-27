import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
// Removed flutter_staggered_grid_view for compatibility
import 'package:google_fonts/google_fonts.dart';
// Removed glassmorphic_card for compatibility
import '../../../core/widgets/animated_gradient_background.dart';
import '../../home/presentation/home_screen.dart';
import '../../product/presentation/product_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen>
    with TickerProviderStateMixin {
  late AnimationController _searchController;
  final TextEditingController _textController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  
  bool _isSearching = false;
  String _searchQuery = '';
  
  final List<String> _trendingSearches = [
    'Electronics',
    'Fashion',
    'Home & Garden',
    'Sports',
    'Books',
    'Art & Collectibles',
    'Automotive',
    'Gaming',
  ];
  
  final List<String> _recentSearches = [
    'Nike shoes',
    'Vintage camera',
    'MacBook Pro',
    'Designer handbag',
  ];

  final List<MarketplaceItem> _searchResults = [
    MarketplaceItem(
      id: '5',
      title: 'Nike Air Jordan',
      price: 189.99,
      image: 'assets/images/shoes.jpg',
      category: 'Fashion',
      rating: 4.7,
      isNew: false,
      isTrending: true,
    ),
    MarketplaceItem(
      id: '6',
      title: 'Canon EOS R5',
      price: 3899.99,
      image: 'assets/images/camera2.jpg',
      category: 'Photography',
      rating: 4.9,
      isNew: true,
      isTrending: false,
    ),
    MarketplaceItem(
      id: '7',
      title: 'MacBook Pro M3',
      price: 1999.99,
      image: 'assets/images/laptop.jpg',
      category: 'Electronics',
      rating: 4.8,
      isNew: true,
      isTrending: true,
    ),
  ];

  @override
  void initState() {
    super.initState();
    _searchController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    
    _textController.addListener(_onSearchChanged);
    _searchFocusNode.addListener(_onFocusChanged);
  }

  void _onSearchChanged() {
    setState(() {
      _searchQuery = _textController.text;
      _isSearching = _searchQuery.isNotEmpty;
    });
    
    if (_isSearching) {
      _searchController.forward();
    } else {
      _searchController.reverse();
    }
  }

  void _onFocusChanged() {
    if (_searchFocusNode.hasFocus) {
      _searchController.forward();
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    _textController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      body: Stack(
        children: [
          // Animated background
          const AnimatedGradientBackground(),
          
          // Main content
          SafeArea(
            child: Column(
              children: [
                // Search Header with Animation
                _buildSearchHeader(context, theme),
                
                // Search Content
                Expanded(
                  child: _isSearching 
                      ? _buildSearchResults(context, theme)
                      : _buildSearchSuggestions(context, theme),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSearchHeader(BuildContext context, ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          // Back button
          Card(
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: GestureDetector(
                onTap: () => Navigator.of(context).pop(),
                child: Icon(
                  Icons.arrow_back_ios_new,
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ),
          )
              .animate()
              .fadeIn()
              .scale(delay: 100.ms),
          
          const SizedBox(width: 16),
          
          // Search Bar
          Expanded(
            child: Card(
              child: TextField(
                controller: _textController,
                focusNode: _searchFocusNode,
                autofocus: true,
                style: GoogleFonts.poppins(
                  color: theme.colorScheme.onSurface,
                ),
                decoration: InputDecoration(
                  hintText: 'Search for anything...',
                  hintStyle: GoogleFonts.poppins(
                    color: theme.colorScheme.onSurface.withOpacity(0.5),
                  ),
                  prefixIcon: Icon(
                    Icons.search_rounded,
                    color: theme.colorScheme.primary,
                  ),
                  suffixIcon: _searchQuery.isNotEmpty
                      ? GestureDetector(
                          onTap: () {
                            _textController.clear();
                          },
                          child: Icon(
                            Icons.clear_rounded,
                            color: theme.colorScheme.onSurface.withOpacity(0.6),
                          ),
                        )
                      : null,
                  border: InputBorder.none,
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 16,
                  ),
                ),
              ),
            )
                .animate()
                .fadeIn(delay: 200.ms)
                .slideX(begin: 0.3, end: 0),
          ),
          
          // Filter button
          if (_isSearching) ...[
            const SizedBox(width: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(12),
                child: Icon(
                  Icons.filter_list_rounded,
                  color: theme.colorScheme.primary,
                ),
              ),
            )
                .animate()
                .fadeIn()
                .scale(delay: 300.ms),
          ],
        ],
      ),
    );
  }

  Widget _buildSearchSuggestions(BuildContext context, ThemeData theme) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Recent Searches
          if (_recentSearches.isNotEmpty) ...[
            Text(
              'Recent Searches',
              style: GoogleFonts.poppins(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: theme.colorScheme.onSurface,
              ),
            )
                .animate()
                .fadeIn(delay: 300.ms)
                .slideX(),
            
            const SizedBox(height: 16),
            
            ...List.generate(_recentSearches.length, (index) {
              final search = _recentSearches[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 8),
                child: ListTile(
                  leading: Icon(
                    Icons.history_rounded,
                    color: theme.colorScheme.onSurface.withOpacity(0.6),
                  ),
                  title: Text(
                    search,
                    style: GoogleFonts.poppins(
                      color: theme.colorScheme.onSurface,
                    ),
                  ),
                  trailing: GestureDetector(
                    onTap: () {
                      // Remove from recent searches
                    },
                    child: Icon(
                      Icons.close_rounded,
                      color: theme.colorScheme.onSurface.withOpacity(0.4),
                      size: 20,
                    ),
                  ),
                  onTap: () {
                    _textController.text = search;
                    _searchFocusNode.unfocus();
                  },
                ),
              )
                  .animate()
                  .fadeIn(delay: (400 + index * 50).ms)
                  .slideX(begin: 0.2, end: 0);
            }),
            
            const SizedBox(height: 32),
          ],
          
          // Trending Searches
          Text(
            'Trending',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.onSurface,
            ),
          )
              .animate()
              .fadeIn(delay: 600.ms)
              .slideX(),
          
          const SizedBox(height: 16),
          
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: List.generate(_trendingSearches.length, (index) {
              final trending = _trendingSearches[index];
              return GestureDetector(
                onTap: () {
                  _textController.text = trending;
                  _searchFocusNode.unfocus();
                },
                child: Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 16,
                    vertical: 12,
                  ),
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      colors: [
                        theme.colorScheme.primary.withOpacity(0.1),
                        theme.colorScheme.secondary.withOpacity(0.1),
                      ],
                    ),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(
                      color: theme.colorScheme.outline.withOpacity(0.1),
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.trending_up_rounded,
                        size: 16,
                        color: theme.colorScheme.primary,
                      ),
                      const SizedBox(width: 8),
                      Text(
                        trending,
                        style: GoogleFonts.poppins(
                          color: theme.colorScheme.onSurface,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                ),
              )
                  .animate()
                  .fadeIn(delay: (700 + index * 100).ms)
                  .scale(
                    begin: const Offset(0.8, 0.8),
                    end: const Offset(1.0, 1.0),
                    curve: Curves.easeOutBack,
                  );
            }),
          ),
          
          const SizedBox(height: 32),
          
          // Popular Categories
          Text(
            'Popular Categories',
            style: GoogleFonts.poppins(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: theme.colorScheme.onSurface,
            ),
          )
              .animate()
              .fadeIn(delay: 1000.ms)
              .slideX(),
          
          const SizedBox(height: 16),
          
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            mainAxisSpacing: 16,
            crossAxisSpacing: 16,
            childAspectRatio: 1.5,
            children: [
              _buildCategoryCard(
                context,
                'Electronics',
                Icons.devices_rounded,
                theme.colorScheme.primary,
                1100,
              ),
              _buildCategoryCard(
                context,
                'Fashion',
                Icons.checkroom_rounded,
                theme.colorScheme.secondary,
                1200,
              ),
              _buildCategoryCard(
                context,
                'Home',
                Icons.home_rounded,
                theme.colorScheme.tertiary,
                1300,
              ),
              _buildCategoryCard(
                context,
                'Sports',
                Icons.sports_basketball_rounded,
                Colors.orange,
                1400,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryCard(
    BuildContext context,
    String title,
    IconData icon,
    Color color,
    int delay,
  ) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: () {
        _textController.text = title;
        _searchFocusNode.unfocus();
      },
      child: Card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Icon(
                  icon,
                  size: 32,
                  color: color,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              ),
            ],
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: delay.ms)
        .scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1.0, 1.0),
          curve: Curves.easeOutBack,
        );
  }

  Widget _buildSearchResults(BuildContext context, ThemeData theme) {
    if (_searchQuery.isEmpty) {
      return const SizedBox.shrink();
    }
    
    // Filter results based on search query (mock implementation)
    final filteredResults = _searchResults.where((item) {
      return item.title.toLowerCase().contains(_searchQuery.toLowerCase()) ||
             item.category.toLowerCase().contains(_searchQuery.toLowerCase());
    }).toList();
    
    return Column(
      children: [
        // Results header
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${filteredResults.length} results for "$_searchQuery"',
                style: GoogleFonts.poppins(
                  fontSize: 16,
                  fontWeight: FontWeight.w600,
                  color: theme.colorScheme.onSurface,
                ),
              )
                  .animate()
                  .fadeIn()
                  .slideX(),
              
              Row(
                children: [
                  Icon(
                    Icons.sort_rounded,
                    color: theme.colorScheme.onSurface.withOpacity(0.6),
                    size: 20,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    'Sort',
                    style: GoogleFonts.poppins(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              )
                  .animate()
                  .fadeIn(delay: 100.ms),
            ],
          ),
        ),
        
        const SizedBox(height: 16),
        
        // Results grid
        Expanded(
          child: GridView.builder(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              mainAxisSpacing: 16,
              crossAxisSpacing: 16,
              childAspectRatio: 0.8,
            ),
            itemCount: filteredResults.length,
            itemBuilder: (context, index) {
              final item = filteredResults[index];
              return _buildSearchResultCard(item, index);
            },
          ),
        ),
      ],
    );
  }

  Widget _buildSearchResultCard(MarketplaceItem item, int index) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                ProductDetailScreen(
                  productId: item.id,
                  heroTag: 'search_product_${item.id}',
                ),
            transitionsBuilder: (context, animation, secondaryAnimation, child) {
              const begin = Offset(1.0, 0.0);
              const end = Offset.zero;
              const curve = Curves.easeInOutCubic;
              
              var tween = Tween(begin: begin, end: end).chain(
                CurveTween(curve: curve),
              );
              
              return SlideTransition(
                position: animation.drive(tween),
                child: FadeTransition(
                  opacity: animation,
                  child: child,
                ),
              );
            },
            transitionDuration: const Duration(milliseconds: 500),
          ),
        );
      },
      child: Hero(
        tag: 'search_product_${item.id}',
        child: Card(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  decoration: BoxDecoration(
                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                    image: DecorationImage(
                      image: NetworkImage('https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500'),
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.title,
                      style: GoogleFonts.poppins(
                        fontWeight: FontWeight.w600,
                        color: Theme.of(context).colorScheme.onSurface,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.category,
                      style: GoogleFonts.poppins(
                        fontSize: 12,
                        color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '\$${item.price}',
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.bold,
                            color: Theme.of(context).colorScheme.primary,
                          ),
                        ),
                        Icon(
                          Icons.favorite_border,
                          size: 18,
                          color: Theme.of(context).colorScheme.onSurface.withOpacity(0.5),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: (200 + index * 100).ms)
        .slideY(
          begin: 0.3,
          end: 0.0,
          curve: Curves.easeOutBack,
        );
  }
}