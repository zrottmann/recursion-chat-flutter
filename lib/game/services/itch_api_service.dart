import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';

class ItchApiService {
  static const String _baseUrl = 'https://itch.io/api/1';
  bool _hdAssetsEnabled = false;
  final Map<String, String> _assetCache = {};
  final Map<String, Image> _imageCache = {};

  bool get hdAssetsEnabled => _hdAssetsEnabled;

  Future<void> initialize() async {
    try {
      // Try to enable HD assets
      await _checkHDAssetAvailability();
      debugPrint('[ItchAPI] Service initialized - HD Assets: $_hdAssetsEnabled');
    } catch (e) {
      debugPrint('[ItchAPI] Initialization failed: $e');
      _hdAssetsEnabled = false;
    }
  }

  Future<void> _checkHDAssetAvailability() async {
    // In a real implementation, this would check if HD assets are available
    // For now, we'll simulate availability based on platform capabilities
    _hdAssetsEnabled = true;
  }

  Future<String> getAssetUrl(String assetType, String assetName) async {
    final cacheKey = '${assetType}_$assetName';
    
    if (_assetCache.containsKey(cacheKey)) {
      return _assetCache[cacheKey]!;
    }

    String assetUrl;
    if (_hdAssetsEnabled) {
      assetUrl = await _getHDAssetUrl(assetType, assetName);
    } else {
      assetUrl = _getFallbackAssetUrl(assetType, assetName);
    }

    _assetCache[cacheKey] = assetUrl;
    return assetUrl;
  }

  Future<String> _getHDAssetUrl(String assetType, String assetName) async {
    // Simulate fetching HD asset URL from itch.io
    // In reality, this would make HTTP requests to the itch.io API
    await Future.delayed(const Duration(milliseconds: 100));
    return 'https://img.itch.zone/aW1nLzEyMzQ1Njc4LnBuZw==/original/${assetType}_${assetName}_hd.png';
  }

  String _getFallbackAssetUrl(String assetType, String assetName) {
    // Return local asset path or low-resolution version
    return 'assets/images/${assetType}_${assetName}.png';
  }

  Future<Image?> getGameImage(String assetType, String assetName) async {
    final cacheKey = '${assetType}_$assetName';
    
    if (_imageCache.containsKey(cacheKey)) {
      return _imageCache[cacheKey];
    }

    try {
      final assetUrl = await getAssetUrl(assetType, assetName);
      Image image;

      if (_hdAssetsEnabled && assetUrl.startsWith('http')) {
        // Load from network
        image = Image.network(
          assetUrl,
          errorBuilder: (context, error, stackTrace) {
            // Fallback to local asset on network error
            return Image.asset(_getFallbackAssetUrl(assetType, assetName));
          },
        );
      } else {
        // Load from local assets
        image = Image.asset(assetUrl);
      }

      _imageCache[cacheKey] = image;
      return image;
    } catch (e) {
      debugPrint('[ItchAPI] Failed to load image $assetType/$assetName: $e');
      return null;
    }
  }

  Future<Map<String, dynamic>?> getGameMetadata() async {
    if (!_hdAssetsEnabled) {
      return _getFallbackMetadata();
    }

    try {
      // Simulate API call to get game metadata
      await Future.delayed(const Duration(milliseconds: 200));
      
      return {
        'name': 'Slumlord RPG',
        'version': '2.0.0',
        'description': 'A property management RPG with creature companions',
        'author': 'Game Developer',
        'hd_assets_available': true,
        'supported_formats': ['png', 'jpg', 'gif'],
        'asset_categories': [
          'characters',
          'buildings', 
          'creatures',
          'particles',
          'ui',
          'terrain'
        ]
      };
    } catch (e) {
      debugPrint('[ItchAPI] Failed to fetch metadata: $e');
      return _getFallbackMetadata();
    }
  }

  Map<String, dynamic> _getFallbackMetadata() {
    return {
      'name': 'Slumlord RPG',
      'version': '1.0.0',
      'description': 'A property management RPG with creature companions',
      'author': 'Game Developer',
      'hd_assets_available': false,
      'supported_formats': ['png'],
      'asset_categories': [
        'characters',
        'buildings',
        'creatures', 
        'particles',
        'ui',
        'terrain'
      ]
    };
  }

  Future<List<String>> getAvailableAssets(String category) async {
    try {
      if (_hdAssetsEnabled) {
        // Simulate fetching asset list from API
        await Future.delayed(const Duration(milliseconds: 150));
        return _getAssetListForCategory(category, isHD: true);
      } else {
        return _getAssetListForCategory(category, isHD: false);
      }
    } catch (e) {
      debugPrint('[ItchAPI] Failed to get available assets for $category: $e');
      return _getAssetListForCategory(category, isHD: false);
    }
  }

  List<String> _getAssetListForCategory(String category, {bool isHD = false}) {
    final suffix = isHD ? '_hd' : '';
    
    switch (category) {
      case 'characters':
        return ['player$suffix', 'npc$suffix'];
      case 'buildings':
        return ['house$suffix', 'shop$suffix', 'warehouse$suffix'];
      case 'creatures':
        return ['pixie$suffix', 'imp$suffix', 'wisp$suffix', 'sprite$suffix'];
      case 'particles':
        return ['spark$suffix', 'money$suffix', 'xp$suffix'];
      case 'ui':
        return ['button$suffix', 'panel$suffix', 'health_bar$suffix'];
      case 'terrain':
        return ['grass$suffix', 'road$suffix', 'tree$suffix', 'water$suffix'];
      default:
        return [];
    }
  }

  Future<void> preloadAssets(List<String> assetPaths) async {
    debugPrint('[ItchAPI] Preloading ${assetPaths.length} assets...');
    
    for (final path in assetPaths) {
      final parts = path.split('/');
      if (parts.length >= 2) {
        final category = parts[0];
        final name = parts[1];
        await getAssetUrl(category, name);
      }
    }
    
    debugPrint('[ItchAPI] Asset preloading complete');
  }

  void clearCache() {
    _assetCache.clear();
    _imageCache.clear();
    debugPrint('[ItchAPI] Cache cleared');
  }

  Map<String, dynamic> getServiceStatus() {
    return {
      'hd_enabled': _hdAssetsEnabled,
      'cached_assets': _assetCache.length,
      'cached_images': _imageCache.length,
      'service_ready': true,
    };
  }
}