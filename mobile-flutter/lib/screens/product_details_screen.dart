import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../providers/marketplace_provider.dart';
import '../widgets/image_carousel.dart';
import 'chat_screen.dart';

class ProductDetailsScreen extends StatefulWidget {
  final String productId;

  const ProductDetailsScreen({
    Key? key,
    required this.productId,
  }) : super(key: key);

  @override
  State<ProductDetailsScreen> createState() => _ProductDetailsScreenState();
}

class _ProductDetailsScreenState extends State<ProductDetailsScreen>
    with TickerProviderStateMixin {
  late TabController _tabController;
  late AnimationController _animationController;
  late Animation<double> _slideAnimation;
  
  Map<String, dynamic>? _product;
  bool _isLoading = true;
  bool _isFavorited = false;
  
  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _animationController = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
    _slideAnimation = Tween<double>(
      begin: 0.0,
      end: 1.0,
    ).animate(CurvedAnimation(
      parent: _animationController,
      curve: Curves.easeOutCubic,
    ));
    
    _loadProduct();
    _animationController.forward();
  }
  
  @override
  void dispose() {
    _tabController.dispose();
    _animationController.dispose();
    super.dispose();
  }
  
  Future<void> _loadProduct() async {
    final provider = Provider.of<MarketplaceProvider>(context, listen: false);
    final product = await provider.getProductById(widget.productId);
    
    if (mounted) {
      setState(() {
        _product = product;
        _isFavorited = provider.favorites.contains(widget.productId);
        _isLoading = false;
      });
      
      // Track product view
      provider.incrementProductViews(widget.productId);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    if (_product == null) {
      return Scaffold(
        appBar: AppBar(title: const Text('Product Not Found')),
        body: const Center(
          child: Text('Product not found'),
        ),
      );
    }

    return Scaffold(
      body: AnimatedBuilder(
        animation: _slideAnimation,
        builder: (context, child) {
          return Transform.translate(
            offset: Offset(0, 50 * (1 - _slideAnimation.value)),
            child: Opacity(
              opacity: _slideAnimation.value,
              child: _buildProductDetails(),
            ),
          );
        },
      ),
      bottomNavigationBar: _buildBottomActionBar(),
    );
  }

  Widget _buildProductDetails() {
    final images = _product!['images'] as List<String>? ?? [];
    
    return CustomScrollView(
      slivers: [
        // Image Carousel App Bar
        SliverAppBar(
          expandedHeight: 300,
          pinned: true,
          flexibleSpace: FlexibleSpaceBar(
            background: images.isNotEmpty
                ? ImageCarousel(
                    images: images,
                    height: 300,
                  )
                : Container(
                    color: Colors.grey.shade200,
                    child: const Icon(
                      Icons.image_not_supported,
                      size: 80,
                      color: Colors.grey,
                    ),
                  ),
          ),
          actions: [
            IconButton(
              icon: Icon(
                _isFavorited ? Icons.favorite : Icons.favorite_border,
                color: _isFavorited ? Colors.red : Colors.white,
              ),
              onPressed: _toggleFavorite,
            ),
            IconButton(
              icon: const Icon(Icons.share),
              onPressed: _shareProduct,
            ),
          ],
        ),
        
        // Product Info
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.all(16.0),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildProductHeader(),
                const SizedBox(height: 16),
                _buildSellerInfo(),
                const SizedBox(height: 16),
                _buildTabSection(),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProductHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _product!['title'] ?? 'Untitled',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Text(
              '\$${_product!['price']}',
              style: TextStyle(
                fontSize: 28,
                fontWeight: FontWeight.bold,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            const Spacer(),
            _buildConditionBadge(_product!['condition'] ?? 'Used'),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Icon(
              Icons.location_on,
              size: 16,
              color: Colors.grey.shade600,
            ),
            const SizedBox(width: 4),
            Text(
              _product!['location'] ?? 'Unknown location',
              style: TextStyle(
                color: Colors.grey.shade600,
              ),
            ),
            const Spacer(),
            Icon(
              Icons.visibility,
              size: 16,
              color: Colors.grey.shade600,
            ),
            const SizedBox(width: 4),
            Text(
              '${_product!['views'] ?? 0} views',
              style: TextStyle(
                color: Colors.grey.shade600,
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildConditionBadge(String condition) {
    Color badgeColor;
    switch (condition.toLowerCase()) {
      case 'new':
        badgeColor = Colors.green;
        break;
      case 'like new':
        badgeColor = Colors.blue;
        break;
      case 'good':
        badgeColor = Colors.orange;
        break;
      case 'fair':
        badgeColor = Colors.amber;
        break;
      case 'poor':
        badgeColor = Colors.red;
        break;
      default:
        badgeColor = Colors.grey;
    }
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor,
        borderRadius: BorderRadius.circular(16),
      ),
      child: Text(
        condition,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildSellerInfo() {
    final seller = _product!['seller'] as Map<String, dynamic>? ?? {};
    
    return Card(
      child: ListTile(
        leading: CircleAvatar(
          backgroundImage: seller['avatar'] != null 
              ? NetworkImage(seller['avatar'])
              : null,
          child: seller['avatar'] == null
              ? const Icon(Icons.person)
              : null,
        ),
        title: Text(seller['name'] ?? 'Unknown Seller'),
        subtitle: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(
                  Icons.star,
                  size: 16,
                  color: Colors.amber.shade600,
                ),
                const SizedBox(width: 4),
                Text('${seller['rating'] ?? 0.0}'),
                const SizedBox(width: 8),
                Text('(${seller['reviewCount'] ?? 0} reviews)'),
              ],
            ),
            Text('Joined ${seller['joinDate'] ?? 'Unknown'}'),
          ],
        ),
        trailing: TextButton(
          onPressed: () {
            // Navigate to seller profile
          },
          child: const Text('View Profile'),
        ),
      ),
    );
  }

  Widget _buildTabSection() {
    return Column(
      children: [
        TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Description'),
            Tab(text: 'Details'),
            Tab(text: 'Reviews'),
          ],
        ),
        const SizedBox(height: 16),
        SizedBox(
          height: 300,
          child: TabBarView(
            controller: _tabController,
            children: [
              _buildDescriptionTab(),
              _buildDetailsTab(),
              _buildReviewsTab(),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildDescriptionTab() {
    return SingleChildScrollView(
      child: Text(
        _product!['description'] ?? 'No description available.',
        style: const TextStyle(fontSize: 16, height: 1.5),
      ),
    );
  }

  Widget _buildDetailsTab() {
    final details = _product!['details'] as Map<String, dynamic>? ?? {};
    
    return SingleChildScrollView(
      child: Column(
        children: details.entries.map((entry) {
          return Padding(
            padding: const EdgeInsets.symmetric(vertical: 8.0),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                SizedBox(
                  width: 100,
                  child: Text(
                    entry.key,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                ),
                Expanded(
                  child: Text(entry.value.toString()),
                ),
              ],
            ),
          );
        }).toList(),
      ),
    );
  }

  Widget _buildReviewsTab() {
    final reviews = _product!['reviews'] as List<dynamic>? ?? [];
    
    if (reviews.isEmpty) {
      return const Center(
        child: Text('No reviews yet'),
      );
    }
    
    return ListView.builder(
      itemCount: reviews.length,
      itemBuilder: (context, index) {
        final review = reviews[index] as Map<String, dynamic>;
        return ListTile(
          leading: CircleAvatar(
            child: Text(review['reviewerName'][0].toUpperCase()),
          ),
          title: Text(review['reviewerName']),
          subtitle: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: List.generate(5, (i) {
                  return Icon(
                    i < (review['rating'] ?? 0)
                        ? Icons.star
                        : Icons.star_border,
                    size: 16,
                    color: Colors.amber,
                  );
                }),
              ),
              const SizedBox(height: 4),
              Text(review['comment'] ?? ''),
            ],
          ),
          trailing: Text(review['date'] ?? ''),
        );
      },
    );
  }

  Widget _buildBottomActionBar() {
    return Container(
      padding: EdgeInsets.only(
        left: 16,
        right: 16,
        top: 16,
        bottom: MediaQuery.of(context).padding.bottom + 16,
      ),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: OutlinedButton.icon(
              onPressed: _contactSeller,
              icon: const Icon(Icons.message),
              label: const Text('Message'),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: FilledButton.icon(
              onPressed: _makeOffer,
              icon: const Icon(Icons.local_offer),
              label: const Text('Make Offer'),
            ),
          ),
        ],
      ),
    );
  }

  void _toggleFavorite() {
    HapticFeedback.lightImpact();
    final provider = Provider.of<MarketplaceProvider>(context, listen: false);
    provider.toggleFavorite(widget.productId);
    setState(() {
      _isFavorited = !_isFavorited;
    });
  }

  void _shareProduct() {
    HapticFeedback.mediumImpact();
    // Implement share functionality
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Share functionality not implemented')),
    );
  }

  void _contactSeller() {
    HapticFeedback.mediumImpact();
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ChatScreen(
          sellerId: _product!['sellerId'],
          sellerName: _product!['seller']['name'],
          productId: widget.productId,
        ),
      ),
    );
  }

  void _makeOffer() {
    HapticFeedback.mediumImpact();
    _showMakeOfferDialog();
  }

  void _showMakeOfferDialog() {
    final offerController = TextEditingController();
    final currentPrice = double.tryParse(_product!['price'].toString()) ?? 0.0;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Make an Offer'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Current price: \$${currentPrice.toStringAsFixed(2)}'),
            const SizedBox(height: 16),
            TextField(
              controller: offerController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: 'Your Offer',
                prefixText: '\$',
                border: OutlineInputBorder(),
              ),
              autofocus: true,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final offer = double.tryParse(offerController.text);
              if (offer != null && offer > 0) {
                Navigator.pop(context);
                _submitOffer(offer);
              }
            },
            child: const Text('Send Offer'),
          ),
        ],
      ),
    );
  }

  void _submitOffer(double offer) {
    // Implement offer submission
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Offer of \$${offer.toStringAsFixed(2)} sent!'),
      ),
    );
  }
}