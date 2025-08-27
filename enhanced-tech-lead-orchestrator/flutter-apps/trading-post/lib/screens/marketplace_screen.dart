import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/marketplace_provider.dart';
import '../widgets/product_card.dart';
import '../widgets/filter_bottom_sheet.dart';
import 'product_details_screen.dart';
import 'listing_screen.dart';
import 'chat_screen.dart';

class MarketplaceScreen extends StatefulWidget {
  const MarketplaceScreen({Key? key}) : super(key: key);

  @override
  State<MarketplaceScreen> createState() => _MarketplaceScreenState();
}

class _MarketplaceScreenState extends State<MarketplaceScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  final TextEditingController _searchController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  
  String _searchQuery = '';
  String _selectedCategory = 'All';
  String _sortBy = 'recent';
  
  final List<String> _categories = [
    'All', 'Electronics', 'Clothing', 'Home', 'Books', 'Sports', 'Other'
  ];
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadProducts();
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    _searchController.dispose();
    _scrollController.dispose();
    super.dispose();
  }
  
  Future<void> _loadProducts() async {
    final provider = Provider.of<MarketplaceProvider>(context, listen: false);
    await provider.loadProducts();
  }
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: NestedScrollView(
        controller: _scrollController,
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              title: const Text('Trading Post'),
              centerTitle: true,
              floating: true,
              pinned: true,
              expandedHeight: 120,
              flexibleSpace: FlexibleSpaceBar(
                background: Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Theme.of(context).colorScheme.primary,
                        Theme.of(context).colorScheme.primaryContainer,
                      ],
                    ),
                  ),
                ),
              ),
              actions: [
                IconButton(
                  icon: const Icon(Icons.notifications_outlined),
                  onPressed: () {},
                ),
                PopupMenuButton(
                  icon: const CircleAvatar(
                    child: Icon(Icons.person),
                  ),
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      child: ListTile(
                        leading: Icon(Icons.account_circle),
                        title: Text('Profile'),
                      ),
                    ),
                    const PopupMenuItem(
                      child: ListTile(
                        leading: Icon(Icons.favorite),
                        title: Text('Favorites'),
                      ),
                    ),
                    const PopupMenuItem(
                      child: ListTile(
                        leading: Icon(Icons.settings),
                        title: Text('Settings'),
                      ),
                    ),
                    const PopupMenuItem(
                      child: ListTile(
                        leading: Icon(Icons.logout),
                        title: Text('Logout'),
                      ),
                    ),
                  ],
                ),
              ],
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(60),
                child: Container(
                  padding: const EdgeInsets.all(16),
                  child: _buildSearchBar(),
                ),
              ),
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildMarketplaceView(),
            _buildFavoritesView(),
            _buildMyListingsView(),
            const ChatScreen(),
          ],
        ),
      ),
      bottomNavigationBar: TabBar(
        controller: _tabController,
        type: TabBarType.fixed,
        tabs: const [
          Tab(icon: Icon(Icons.store), text: 'Browse'),
          Tab(icon: Icon(Icons.favorite), text: 'Favorites'),
          Tab(icon: Icon(Icons.inventory), text: 'My Items'),
          Tab(icon: Icon(Icons.chat), text: 'Chat'),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          HapticFeedback.mediumImpact();
          Navigator.push(
            context,
            MaterialPageRoute(builder: (context) => const ListingScreen()),
          );
        },
        icon: const Icon(Icons.add),
        label: const Text('Sell Item'),
      ),
    );
  }
  
  Widget _buildSearchBar() {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search products...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.filter_list),
                onPressed: _showFilterSheet,
              ),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide.none,
              ),
              filled: true,
              fillColor: Theme.of(context).colorScheme.surface,
            ),
            onChanged: (value) {
              setState(() {
                _searchQuery = value;
              });
              _performSearch();
            },
          ),
        ),
      ],
    );
  }
  
  Widget _buildMarketplaceView() {
    return Consumer<MarketplaceProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading) {
          return const Center(child: CircularProgressIndicator());
        }
        
        final filteredProducts = provider.products.where((product) {
          final matchesSearch = _searchQuery.isEmpty ||
              product['title'].toLowerCase().contains(_searchQuery.toLowerCase()) ||
              product['description'].toLowerCase().contains(_searchQuery.toLowerCase());
          
          final matchesCategory = _selectedCategory == 'All' ||
              product['category'] == _selectedCategory;
          
          return matchesSearch && matchesCategory;
        }).toList();
        
        if (filteredProducts.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.search_off,
                  size: 64,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                Text(
                  'No products found',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Try adjusting your search or filters',
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          );
        }
        
        return RefreshIndicator(
          onRefresh: _loadProducts,
          child: CustomScrollView(
            slivers: [
              // Categories
              SliverToBoxAdapter(
                child: Container(
                  height: 50,
                  padding: const EdgeInsets.symmetric(vertical: 8),
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: _categories.length,
                    itemBuilder: (context, index) {
                      final category = _categories[index];
                      final isSelected = category == _selectedCategory;
                      
                      return Padding(
                        padding: const EdgeInsets.only(right: 8),
                        child: FilterChip(
                          label: Text(category),
                          selected: isSelected,
                          onSelected: (selected) {
                            HapticFeedback.selectionClick();
                            setState(() {
                              _selectedCategory = category;
                            });
                          },
                        ),
                      );
                    },
                  ),
                ),
              ),
              
              // Products Grid
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverGrid(
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: MediaQuery.of(context).size.width > 600 ? 3 : 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.75,
                  ),
                  delegate: SliverChildBuilderDelegate(
                    (context, index) {
                      final product = filteredProducts[index];
                      return ProductCard(
                        product: product,
                        onTap: () {
                          HapticFeedback.lightImpact();
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ProductDetailsScreen(
                                productId: product['id'],
                              ),
                            ),
                          );
                        },
                        onFavorite: () {
                          HapticFeedback.lightImpact();
                          provider.toggleFavorite(product['id']);
                        },
                      );
                    },
                    childCount: filteredProducts.length,
                  ),
                ),
              ),
            ],
          ),
        );
      },
    );
  }
  
  Widget _buildFavoritesView() {
    return Consumer<MarketplaceProvider>(
      builder: (context, provider, child) {
        final favoriteProducts = provider.products
            .where((product) => provider.favorites.contains(product['id']))
            .toList();
        
        if (favoriteProducts.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.favorite_border,
                  size: 64,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                Text(
                  'No favorites yet',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Heart items to save them here',
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 14,
                  ),
                ),
              ],
            ),
          );
        }
        
        return GridView.builder(
          padding: const EdgeInsets.all(16),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: MediaQuery.of(context).size.width > 600 ? 3 : 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 0.75,
          ),
          itemCount: favoriteProducts.length,
          itemBuilder: (context, index) {
            final product = favoriteProducts[index];
            return ProductCard(
              product: product,
              onTap: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (context) => ProductDetailsScreen(
                      productId: product['id'],
                    ),
                  ),
                );
              },
              onFavorite: () {
                provider.toggleFavorite(product['id']);
              },
            );
          },
        );
      },
    );
  }
  
  Widget _buildMyListingsView() {
    return Consumer<MarketplaceProvider>(
      builder: (context, provider, child) {
        final myListings = provider.products
            .where((product) => product['sellerId'] == 'current_user_id')
            .toList();
        
        if (myListings.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(
                  Icons.inventory_2_outlined,
                  size: 64,
                  color: Colors.grey.shade400,
                ),
                const SizedBox(height: 16),
                Text(
                  'No listings yet',
                  style: TextStyle(
                    color: Colors.grey.shade600,
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Start selling by creating a listing',
                  style: TextStyle(
                    color: Colors.grey.shade500,
                    fontSize: 14,
                  ),
                ),
                const SizedBox(height: 24),
                FilledButton.icon(
                  onPressed: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const ListingScreen(),
                      ),
                    );
                  },
                  icon: const Icon(Icons.add),
                  label: const Text('Create Listing'),
                ),
              ],
            ),
          );
        }
        
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: myListings.length,
          itemBuilder: (context, index) {
            final listing = myListings[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              child: ListTile(
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: AspectRatio(
                    aspectRatio: 1,
                    child: Image.network(
                      listing['imageUrl'],
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) {
                        return Container(
                          color: Colors.grey.shade200,
                          child: const Icon(Icons.image_not_supported),
                        );
                      },
                    ),
                  ),
                ),
                title: Text(listing['title']),
                subtitle: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('\$${listing['price']}'),
                    Text(
                      '${listing['views']} views',
                      style: TextStyle(
                        color: Colors.grey.shade600,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
                trailing: PopupMenuButton(
                  itemBuilder: (context) => [
                    const PopupMenuItem(
                      value: 'edit',
                      child: ListTile(
                        leading: Icon(Icons.edit),
                        title: Text('Edit'),
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'share',
                      child: ListTile(
                        leading: Icon(Icons.share),
                        title: Text('Share'),
                      ),
                    ),
                    const PopupMenuItem(
                      value: 'delete',
                      child: ListTile(
                        leading: Icon(Icons.delete, color: Colors.red),
                        title: Text('Delete'),
                      ),
                    ),
                  ],
                  onSelected: (value) {
                    // Handle menu actions
                  },
                ),
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => ProductDetailsScreen(
                        productId: listing['id'],
                      ),
                    ),
                  );
                },
              ),
            );
          },
        );
      },
    );
  }
  
  void _performSearch() {
    // Debounce search
    Future.delayed(const Duration(milliseconds: 500), () {
      if (mounted) {
        setState(() {});
      }
    });
  }
  
  void _showFilterSheet() {
    HapticFeedback.mediumImpact();
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FilterBottomSheet(
        selectedCategory: _selectedCategory,
        sortBy: _sortBy,
        onCategoryChanged: (category) {
          setState(() {
            _selectedCategory = category;
          });
        },
        onSortChanged: (sort) {
          setState(() {
            _sortBy = sort;
          });
        },
      ),
    );
  }
}