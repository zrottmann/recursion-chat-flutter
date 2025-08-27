import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../../core/widgets/animated_gradient_background.dart';
import '../../product/presentation/product_detail_screen.dart';
import '../../search/presentation/search_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  int _selectedIndex = 0;
  final ScrollController _scrollController = ScrollController();
  
  final List<MarketplaceItem> _featuredItems = [
    MarketplaceItem(
      id: '1',
      title: 'Premium Headphones',
      price: 299.99,
      image: 'assets/images/headphones.jpg',
      category: 'Electronics',
      rating: 4.8,
      isNew: true,
      isTrending: true,
    ),
    MarketplaceItem(
      id: '2',
      title: 'Vintage Camera',
      price: 899.99,
      image: 'assets/images/camera.jpg',
      category: 'Photography',
      rating: 4.9,
      isNew: false,
      isTrending: true,
    ),
    MarketplaceItem(
      id: '3',
      title: 'Smart Watch',
      price: 399.99,
      image: 'assets/images/watch.jpg',
      category: 'Electronics',
      rating: 4.6,
      isNew: true,
      isTrending: false,
    ),
    MarketplaceItem(
      id: '4',
      title: 'Designer Bag',
      price: 1299.99,
      image: 'assets/images/bag.jpg',
      category: 'Fashion',
      rating: 4.7,
      isNew: false,
      isTrending: true,
    ),
  ];
  
  final List<String> _categories = [
    'All',
    'Electronics',
    'Fashion',
    'Home',
    'Sports',
    'Books',
    'Photography',
    'Gaming',
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: _categories.length, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    
    return Scaffold(
      extendBodyBehindAppBar: true,
      body: Stack(
        children: [
          // Animated gradient background
          const AnimatedGradientBackground(),
          
          // Main content
          CustomScrollView(
            controller: _scrollController,
            physics: const BouncingScrollPhysics(),
            slivers: [
              // Custom App Bar with glassmorphism
              SliverAppBar(
                expandedHeight: 120,
                floating: true,
                pinned: true,
                backgroundColor: theme.colorScheme.surface.withOpacity(0.8),
                flexibleSpace: FlexibleSpaceBar(
                  title: Text(
                    'Trading Post',
                    style: GoogleFonts.poppins(
                      fontWeight: FontWeight.bold,
                      color: theme.colorScheme.onSurface,
                    ),
                  ).animate().fadeIn(duration: 600.ms),
                  background: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topLeft,
                        end: Alignment.bottomRight,
                        colors: [
                          theme.colorScheme.primary.withOpacity(0.3),
                          theme.colorScheme.secondary.withOpacity(0.3),
                        ],
                      ),
                    ),
                  ),
                ),
                actions: [
                  IconButton(
                    icon: const Icon(Icons.search_rounded),
                    onPressed: () {
                      Navigator.of(context).push(
                        PageRouteBuilder(
                          pageBuilder: (context, animation, secondaryAnimation) =>
                              const SearchScreen(),
                          transitionsBuilder: (context, animation, secondaryAnimation, child) {
                            const begin = Offset(0.0, -1.0);
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
                          transitionDuration: const Duration(milliseconds: 400),
                        ),
                      );
                    },
                  ).animate().fadeIn(delay: 200.ms).scale(),
                  IconButton(
                    icon: const Icon(Icons.notifications_outlined),
                    onPressed: () {},
                  ).animate().fadeIn(delay: 300.ms).scale(),
                  const SizedBox(width: 8),
                ],
              ),
              
              // Welcome Section with User Info
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Container(
                    decoration: BoxDecoration(
                      color: theme.colorScheme.surface.withOpacity(0.9),
                      borderRadius: BorderRadius.circular(24),
                      boxShadow: [
                        BoxShadow(
                          color: theme.colorScheme.shadow.withOpacity(0.1),
                          blurRadius: 10,
                          spreadRadius: 2,
                        ),
                      ],
                    ),
                    child: Padding(
                      padding: const EdgeInsets.all(20.0),
                      child: Row(
                        children: [
                          Container(
                            width: 60,
                            height: 60,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  theme.colorScheme.primary,
                                  theme.colorScheme.secondary,
                                ],
                              ),
                              borderRadius: BorderRadius.circular(20),
                            ),
                            child: const Icon(
                              Icons.person_rounded,
                              color: Colors.white,
                              size: 30,
                            ),
                          ).animate().scale(delay: 400.ms, duration: 600.ms),
                          const SizedBox(width: 16),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  'Welcome back!',
                                  style: GoogleFonts.poppins(
                                    fontSize: 14,
                                    color: theme.colorScheme.onSurface.withOpacity(0.7),
                                  ),
                                ).animate().fadeIn(delay: 500.ms),
                                Text(
                                  'John Doe',
                                  style: GoogleFonts.poppins(
                                    fontSize: 20,
                                    fontWeight: FontWeight.bold,
                                    color: theme.colorScheme.onSurface,
                                  ),
                                ).animate().fadeIn(delay: 600.ms),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 16,
                              vertical: 8,
                            ),
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  theme.colorScheme.tertiary,
                                  theme.colorScheme.tertiaryContainer,
                                ],
                              ),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Row(
                              children: [
                                const Icon(
                                  Icons.account_balance_wallet_rounded,
                                  color: Colors.white,
                                  size: 18,
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  '\$1,234',
                                  style: GoogleFonts.poppins(
                                    fontWeight: FontWeight.bold,
                                    color: Colors.white,
                                  ),
                                ),
                              ],
                            ),
                          ).animate().fadeIn(delay: 700.ms).slideX(),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
              
              // Categories Tab Bar
              SliverPersistentHeader(
                pinned: true,
                delegate: _CategoryTabBarDelegate(
                  tabController: _tabController,
                  categories: _categories,
                ),
              ),
              
              // Stats Cards with Animations
              SliverToBoxAdapter(
                child: SizedBox(
                  height: 120,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    children: [
                      _buildStatCard(
                        icon: Icons.trending_up_rounded,
                        title: 'Total Sales',
                        value: '\$12.5K',
                        color: theme.colorScheme.primary,
                        delay: 100,
                      ),
                      _buildStatCard(
                        icon: Icons.shopping_bag_rounded,
                        title: 'Active Listings',
                        value: '48',
                        color: theme.colorScheme.secondary,
                        delay: 200,
                      ),
                      _buildStatCard(
                        icon: Icons.star_rounded,
                        title: 'Rating',
                        value: '4.9',
                        color: theme.colorScheme.tertiary,
                        delay: 300,
                      ),
                    ],
                  ),
                ),
              ),
              
              // Section Title - Featured Items
              SliverToBoxAdapter(
                child: Padding(
                  padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Featured Items',
                        style: GoogleFonts.poppins(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ).animate().fadeIn(delay: 400.ms).slideX(),
                      TextButton(
                        onPressed: () {},
                        child: const Text('See all'),
                      ).animate().fadeIn(delay: 500.ms),
                    ],
                  ),
                ),
              ),
              
              // Featured Items Grid with Staggered Animation
              SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                sliver: SliverGrid(
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    mainAxisSpacing: 16,
                    crossAxisSpacing: 16,
                    childAspectRatio: 0.75,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      return _buildProductCard(_featuredItems[index], index);
                    },
                    childCount: _featuredItems.length,
                  ),
                ),
              ),
              
              // Bottom Padding
              const SliverToBoxAdapter(
                child: SizedBox(height: 100),
              ),
            ],
          ),
        ],
      ),
      
      // Beautiful Bottom Navigation Bar
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: theme.colorScheme.surface.withOpacity(0.95),
          boxShadow: [
            BoxShadow(
              color: theme.colorScheme.shadow.withOpacity(0.1),
              blurRadius: 20,
              offset: const Offset(0, -5),
            ),
          ],
        ),
        child: NavigationBar(
          selectedIndex: _selectedIndex,
          onDestinationSelected: (index) {
            setState(() {
              _selectedIndex = index;
            });
          },
          destinations: [
            const NavigationDestination(
              icon: Icon(Icons.home_outlined),
              selectedIcon: Icon(Icons.home_rounded),
              label: 'Home',
            ).animate().fadeIn(delay: 100.ms).scale(),
            const NavigationDestination(
              icon: Icon(Icons.explore_outlined),
              selectedIcon: Icon(Icons.explore_rounded),
              label: 'Explore',
            ).animate().fadeIn(delay: 200.ms).scale(),
            const NavigationDestination(
              icon: Icon(Icons.add_box_outlined),
              selectedIcon: Icon(Icons.add_box_rounded),
              label: 'Sell',
            ).animate().fadeIn(delay: 300.ms).scale(),
            const NavigationDestination(
              icon: Icon(Icons.chat_bubble_outline_rounded),
              selectedIcon: Icon(Icons.chat_bubble_rounded),
              label: 'Messages',
            ).animate().fadeIn(delay: 400.ms).scale(),
            const NavigationDestination(
              icon: Icon(Icons.person_outline_rounded),
              selectedIcon: Icon(Icons.person_rounded),
              label: 'Profile',
            ).animate().fadeIn(delay: 500.ms).scale(),
          ],
        ),
      ),
      
      // Floating Action Button with animation
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {},
        icon: const Icon(Icons.add_rounded),
        label: const Text('New Listing'),
      )
          .animate()
          .fadeIn(delay: 800.ms)
          .scale()
          .then()
          .animate(onPlay: (controller) => controller.repeat(reverse: true))
          .scale(
            begin: const Offset(1.0, 1.0),
            end: const Offset(1.05, 1.05),
            duration: 2.seconds,
          ),
    );
  }
  
  Widget _buildStatCard({
    required IconData icon,
    required String title,
    required String value,
    required Color color,
    required int delay,
  }) {
    return Container(
      width: 150,
      margin: const EdgeInsets.only(right: 12),
      child: Container(
        decoration: BoxDecoration(
          color: Theme.of(context).colorScheme.surface.withOpacity(0.9),
          borderRadius: BorderRadius.circular(20),
          boxShadow: [
            BoxShadow(
              color: Theme.of(context).colorScheme.shadow.withOpacity(0.1),
              blurRadius: 10,
              spreadRadius: 2,
            ),
          ],
        ),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  icon,
                  color: color,
                  size: 24,
                ),
              ),
              const Spacer(),
              Text(
                title,
                style: GoogleFonts.poppins(
                  fontSize: 12,
                  color: Theme.of(context).colorScheme.onSurface.withOpacity(0.7),
                ),
              ),
              Text(
                value,
                style: GoogleFonts.poppins(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    )
        .animate()
        .fadeIn(delay: delay.ms)
        .slideX(begin: 0.2, end: 0);
  }
  
  Widget _buildProductCard(MarketplaceItem item, int index) {
    final theme = Theme.of(context);
    
    return GestureDetector(
      onTap: () {
        Navigator.of(context).push(
          PageRouteBuilder(
            pageBuilder: (context, animation, secondaryAnimation) =>
                ProductDetailScreen(
                  productId: item.id,
                  heroTag: 'product_${item.id}',
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
        tag: 'product_${item.id}',
        child: Container(
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surface.withOpacity(0.9),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Theme.of(context).colorScheme.shadow.withOpacity(0.1),
                blurRadius: 8,
                spreadRadius: 2,
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Image with gradient overlay
              Expanded(
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: const BorderRadius.vertical(
                          top: Radius.circular(24),
                        ),
                        gradient: LinearGradient(
                          colors: [
                            theme.colorScheme.primary.withOpacity(0.3),
                            theme.colorScheme.secondary.withOpacity(0.3),
                          ],
                        ),
                      ),
                      child: const Center(
                        child: Icon(
                          Icons.image_rounded,
                          size: 48,
                          color: Colors.white54,
                        ),
                      ),
                    ),
                    if (item.isNew)
                      Positioned(
                        top: 8,
                        left: 8,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 8,
                            vertical: 4,
                          ),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.primary,
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            'NEW',
                            style: GoogleFonts.poppins(
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                    if (item.isTrending)
                      Positioned(
                        top: 8,
                        right: 8,
                        child: Container(
                          padding: const EdgeInsets.all(4),
                          decoration: BoxDecoration(
                            color: theme.colorScheme.tertiary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.trending_up_rounded,
                            size: 16,
                            color: Colors.white,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              
              // Product Details
              Padding(
                padding: const EdgeInsets.all(12),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      item.category,
                      style: GoogleFonts.poppins(
                        fontSize: 10,
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      item.title,
                      style: GoogleFonts.poppins(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                      ),
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          '\$${item.price}',
                          style: GoogleFonts.poppins(
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                            color: theme.colorScheme.primary,
                          ),
                        ),
                        Row(
                          children: [
                            Icon(
                              Icons.star_rounded,
                              size: 16,
                              color: Colors.amber[600],
                            ),
                            const SizedBox(width: 2),
                            Text(
                              '${item.rating}',
                              style: GoogleFonts.poppins(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
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
        .fadeIn(delay: (100 * index).ms)
        .scale(
          begin: const Offset(0.8, 0.8),
          end: const Offset(1.0, 1.0),
          duration: 400.ms,
          curve: Curves.easeOutBack,
        );
  }
}

// Category Tab Bar Delegate
class _CategoryTabBarDelegate extends SliverPersistentHeaderDelegate {
  final TabController tabController;
  final List<String> categories;

  _CategoryTabBarDelegate({
    required this.tabController,
    required this.categories,
  });

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    final theme = Theme.of(context);
    
    return Container(
      color: theme.colorScheme.surface.withOpacity(0.95),
      child: TabBar(
        controller: tabController,
        isScrollable: true,
        padding: const EdgeInsets.symmetric(horizontal: 16),
        labelStyle: GoogleFonts.poppins(
          fontWeight: FontWeight.w600,
        ),
        unselectedLabelStyle: GoogleFonts.poppins(
          fontWeight: FontWeight.w500,
        ),
        indicator: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: theme.colorScheme.primary,
        ),
        indicatorPadding: const EdgeInsets.symmetric(vertical: 8),
        labelColor: Colors.white,
        unselectedLabelColor: theme.colorScheme.onSurface.withOpacity(0.6),
        tabs: categories.map((category) {
          return Tab(
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(category),
            ),
          );
        }).toList(),
      ),
    );
  }

  @override
  double get maxExtent => 60;

  @override
  double get minExtent => 60;

  @override
  bool shouldRebuild(covariant SliverPersistentHeaderDelegate oldDelegate) => false;
}

// Marketplace Item Model
class MarketplaceItem {
  final String id;
  final String title;
  final double price;
  final String image;
  final String category;
  final double rating;
  final bool isNew;
  final bool isTrending;

  MarketplaceItem({
    required this.id,
    required this.title,
    required this.price,
    required this.image,
    required this.category,
    required this.rating,
    required this.isNew,
    required this.isTrending,
  });
}