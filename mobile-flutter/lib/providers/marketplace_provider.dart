import 'package:flutter/foundation.dart';
import '../../../shared/lib/services/appwrite_service.dart';

class MarketplaceProvider extends ChangeNotifier {
  final AppwriteService _appwrite = AppwriteService();
  
  List<Map<String, dynamic>> _products = [];
  List<String> _favorites = [];
  bool _isLoading = false;
  String? _error;

  // Getters
  List<Map<String, dynamic>> get products => _products;
  List<String> get favorites => _favorites;
  bool get isLoading => _isLoading;
  String? get error => _error;

  // Mock data for demo purposes - replace with real Appwrite data
  final List<Map<String, dynamic>> _mockProducts = [
    {
      'id': '1',
      'title': 'iPhone 13 Pro Max',
      'price': 899.99,
      'description': 'Excellent condition iPhone 13 Pro Max with 256GB storage. Includes original box, charger, and protective case. No scratches or damage.',
      'category': 'Electronics',
      'condition': 'Like New',
      'location': 'New York, NY',
      'sellerId': 'user123',
      'imageUrl': 'https://images.unsplash.com/photo-1632633173522-852b05bc9600?w=400',
      'images': [
        'https://images.unsplash.com/photo-1632633173522-852b05bc9600?w=400',
        'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
      ],
      'views': 245,
      'createdAt': DateTime.now().subtract(const Duration(days: 2)),
      'seller': {
        'name': 'John Doe',
        'rating': 4.8,
        'reviewCount': 47,
        'avatar': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
        'joinDate': 'March 2023',
      },
      'details': {
        'Brand': 'Apple',
        'Model': 'iPhone 13 Pro Max',
        'Storage': '256GB',
        'Color': 'Graphite',
        'Carrier': 'Unlocked',
        'Battery Health': '96%',
      },
      'reviews': [
        {
          'reviewerName': 'Sarah M.',
          'rating': 5,
          'comment': 'Great seller, item exactly as described!',
          'date': '2 days ago',
        },
      ],
    },
    {
      'id': '2',
      'title': 'MacBook Air M2',
      'price': 1199.99,
      'description': 'Brand new MacBook Air with M2 chip. Still sealed in original packaging.',
      'category': 'Electronics',
      'condition': 'New',
      'location': 'Los Angeles, CA',
      'sellerId': 'user456',
      'imageUrl': 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
      'images': [
        'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
      ],
      'views': 189,
      'createdAt': DateTime.now().subtract(const Duration(days: 1)),
      'seller': {
        'name': 'Tech Store',
        'rating': 4.9,
        'reviewCount': 152,
        'joinDate': 'January 2022',
      },
      'details': {
        'Brand': 'Apple',
        'Model': 'MacBook Air',
        'Processor': 'M2',
        'RAM': '8GB',
        'Storage': '256GB SSD',
        'Screen': '13.6-inch',
      },
      'reviews': [],
    },
    {
      'id': '3',
      'title': 'Vintage Leather Jacket',
      'price': 125.00,
      'description': 'Genuine leather jacket from the 90s. Size M, great condition with minimal wear.',
      'category': 'Clothing',
      'condition': 'Good',
      'location': 'Chicago, IL',
      'sellerId': 'user789',
      'imageUrl': 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      'images': [
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
      ],
      'views': 67,
      'createdAt': DateTime.now().subtract(const Duration(days: 5)),
      'seller': {
        'name': 'Vintage Collector',
        'rating': 4.6,
        'reviewCount': 23,
        'joinDate': 'June 2023',
      },
      'details': {
        'Size': 'Medium',
        'Material': 'Genuine Leather',
        'Era': '1990s',
        'Brand': 'Unknown',
        'Care': 'Dry clean only',
      },
      'reviews': [
        {
          'reviewerName': 'Mike R.',
          'rating': 4,
          'comment': 'Nice quality leather, fits well.',
          'date': '1 week ago',
        },
      ],
    },
    {
      'id': '4',
      'title': 'Coffee Table Set',
      'price': 250.00,
      'description': 'Beautiful oak coffee table with matching side tables. Perfect for living room.',
      'category': 'Home & Garden',
      'condition': 'Good',
      'location': 'Austin, TX',
      'sellerId': 'user321',
      'imageUrl': 'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400',
      'images': [
        'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400',
      ],
      'views': 134,
      'createdAt': DateTime.now().subtract(const Duration(days: 3)),
      'seller': {
        'name': 'Home Decor Plus',
        'rating': 4.7,
        'reviewCount': 89,
        'joinDate': 'August 2022',
      },
      'details': {
        'Material': 'Oak Wood',
        'Dimensions': '48" x 24" x 18"',
        'Weight': '45 lbs',
        'Assembly': 'Required',
      },
      'reviews': [],
    },
  ];

  // Initialize and load products
  Future<void> loadProducts() async {
    _setLoading(true);
    _setError(null);
    
    try {
      // For now, use mock data - replace with Appwrite database call
      await Future.delayed(const Duration(seconds: 1)); // Simulate network delay
      _products = List.from(_mockProducts);
      
      // TODO: Replace with actual Appwrite call
      // final result = await _appwrite.getMarketplaceProducts();
      // if (result['success'] == true) {
      //   _products = List<Map<String, dynamic>>.from(result['products'] ?? []);
      // } else {
      //   _setError(result['error'] ?? 'Failed to load products');
      // }
    } catch (e) {
      _setError('Failed to load products: $e');
    } finally {
      _setLoading(false);
    }
  }

  // Get product by ID
  Future<Map<String, dynamic>?> getProductById(String productId) async {
    try {
      // For now, search in mock data
      return _products.firstWhere(
        (product) => product['id'] == productId,
        orElse: () => {},
      );
      
      // TODO: Replace with Appwrite call
      // final result = await _appwrite.getProductById(productId);
      // return result['success'] == true ? result['product'] : null;
    } catch (e) {
      return null;
    }
  }

  // Toggle favorite status
  void toggleFavorite(String productId) {
    if (_favorites.contains(productId)) {
      _favorites.remove(productId);
    } else {
      _favorites.add(productId);
    }
    notifyListeners();
    
    // TODO: Sync with Appwrite
    // _appwrite.toggleFavorite(productId);
  }

  // Increment product views
  Future<void> incrementProductViews(String productId) async {
    // Update local data
    final productIndex = _products.indexWhere((p) => p['id'] == productId);
    if (productIndex != -1) {
      _products[productIndex]['views'] = (_products[productIndex]['views'] ?? 0) + 1;
      notifyListeners();
    }
    
    // TODO: Update in Appwrite
    // await _appwrite.incrementProductViews(productId);
  }

  // Create new listing
  Future<bool> createListing({
    required String title,
    required String description,
    required double price,
    required String category,
    required String condition,
    required String location,
    List<String> images = const [],
    Map<String, dynamic> details = const {},
  }) async {
    _setLoading(true);
    _setError(null);
    
    try {
      // TODO: Implement Appwrite function call
      // final result = await _appwrite.createListing({
      //   'title': title,
      //   'description': description,
      //   'price': price,
      //   'category': category,
      //   'condition': condition,
      //   'location': location,
      //   'images': images,
      //   'details': details,
      // });
      
      // For now, add to mock data
      final newProduct = {
        'id': DateTime.now().millisecondsSinceEpoch.toString(),
        'title': title,
        'description': description,
        'price': price,
        'category': category,
        'condition': condition,
        'location': location,
        'sellerId': 'current_user_id',
        'imageUrl': images.isNotEmpty ? images.first : '',
        'images': images,
        'views': 0,
        'createdAt': DateTime.now(),
        'seller': {
          'name': 'Current User',
          'rating': 5.0,
          'reviewCount': 0,
          'joinDate': 'Today',
        },
        'details': details,
        'reviews': [],
      };
      
      _products.insert(0, newProduct);
      notifyListeners();
      
      return true;
    } catch (e) {
      _setError('Failed to create listing: $e');
      return false;
    } finally {
      _setLoading(false);
    }
  }

  // Search products
  List<Map<String, dynamic>> searchProducts({
    String? query,
    String? category,
    double? minPrice,
    double? maxPrice,
    String? condition,
    String? sortBy,
  }) {
    List<Map<String, dynamic>> filtered = List.from(_products);
    
    // Apply filters
    if (query != null && query.isNotEmpty) {
      filtered = filtered.where((product) {
        final title = product['title']?.toString().toLowerCase() ?? '';
        final description = product['description']?.toString().toLowerCase() ?? '';
        final queryLower = query.toLowerCase();
        return title.contains(queryLower) || description.contains(queryLower);
      }).toList();
    }
    
    if (category != null && category != 'All') {
      filtered = filtered.where((product) => product['category'] == category).toList();
    }
    
    if (minPrice != null) {
      filtered = filtered.where((product) {
        final price = double.tryParse(product['price'].toString()) ?? 0.0;
        return price >= minPrice;
      }).toList();
    }
    
    if (maxPrice != null) {
      filtered = filtered.where((product) {
        final price = double.tryParse(product['price'].toString()) ?? 0.0;
        return price <= maxPrice;
      }).toList();
    }
    
    if (condition != null && condition != 'All Conditions') {
      filtered = filtered.where((product) => product['condition'] == condition).toList();
    }
    
    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        filtered.sort((a, b) {
          final priceA = double.tryParse(a['price'].toString()) ?? 0.0;
          final priceB = double.tryParse(b['price'].toString()) ?? 0.0;
          return priceA.compareTo(priceB);
        });
        break;
      case 'price_high':
        filtered.sort((a, b) {
          final priceA = double.tryParse(a['price'].toString()) ?? 0.0;
          final priceB = double.tryParse(b['price'].toString()) ?? 0.0;
          return priceB.compareTo(priceA);
        });
        break;
      case 'popular':
        filtered.sort((a, b) {
          final viewsA = a['views'] ?? 0;
          final viewsB = b['views'] ?? 0;
          return viewsB.compareTo(viewsA);
        });
        break;
      case 'oldest':
        filtered.sort((a, b) {
          final dateA = a['createdAt'] as DateTime? ?? DateTime.now();
          final dateB = b['createdAt'] as DateTime? ?? DateTime.now();
          return dateA.compareTo(dateB);
        });
        break;
      case 'recent':
      default:
        filtered.sort((a, b) {
          final dateA = a['createdAt'] as DateTime? ?? DateTime.now();
          final dateB = b['createdAt'] as DateTime? ?? DateTime.now();
          return dateB.compareTo(dateA);
        });
        break;
    }
    
    return filtered;
  }

  // Get categories with counts
  Map<String, int> getCategoryCounts() {
    final Map<String, int> counts = {};
    for (final product in _products) {
      final category = product['category'] as String? ?? 'Other';
      counts[category] = (counts[category] ?? 0) + 1;
    }
    return counts;
  }

  // Helper methods
  void _setLoading(bool loading) {
    _isLoading = loading;
    notifyListeners();
  }

  void _setError(String? error) {
    _error = error;
    notifyListeners();
  }

  // Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  // Refresh data
  Future<void> refresh() async {
    await loadProducts();
  }
}