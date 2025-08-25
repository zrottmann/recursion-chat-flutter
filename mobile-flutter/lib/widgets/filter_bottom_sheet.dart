import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class FilterBottomSheet extends StatefulWidget {
  final String selectedCategory;
  final String sortBy;
  final Function(String) onCategoryChanged;
  final Function(String) onSortChanged;
  final Map<String, dynamic>? priceRange;
  final Function(double, double)? onPriceRangeChanged;

  const FilterBottomSheet({
    Key? key,
    required this.selectedCategory,
    required this.sortBy,
    required this.onCategoryChanged,
    required this.onSortChanged,
    this.priceRange,
    this.onPriceRangeChanged,
  }) : super(key: key);

  @override
  State<FilterBottomSheet> createState() => _FilterBottomSheetState();
}

class _FilterBottomSheetState extends State<FilterBottomSheet> {
  late String _selectedCategory;
  late String _sortBy;
  late RangeValues _priceRange;
  
  final List<String> _categories = [
    'All',
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Books',
    'Sports',
    'Toys & Games',
    'Automotive',
    'Health & Beauty',
    'Other'
  ];
  
  final List<Map<String, String>> _sortOptions = [
    {'key': 'recent', 'label': 'Most Recent'},
    {'key': 'oldest', 'label': 'Oldest First'},
    {'key': 'price_low', 'label': 'Price: Low to High'},
    {'key': 'price_high', 'label': 'Price: High to Low'},
    {'key': 'popular', 'label': 'Most Popular'},
    {'key': 'distance', 'label': 'Nearest First'},
  ];
  
  final List<String> _conditions = [
    'All Conditions',
    'New',
    'Like New',
    'Good',
    'Fair',
    'Poor',
  ];
  
  String _selectedCondition = 'All Conditions';
  double _maxDistance = 50;
  
  @override
  void initState() {
    super.initState();
    _selectedCategory = widget.selectedCategory;
    _sortBy = widget.sortBy;
    _priceRange = RangeValues(
      widget.priceRange?['min']?.toDouble() ?? 0,
      widget.priceRange?['max']?.toDouble() ?? 1000,
    );
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    
    return Container(
      height: size.height * 0.8,
      decoration: const BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.vertical(
          top: Radius.circular(20),
        ),
      ),
      child: Column(
        children: [
          // Handle Bar
          Container(
            margin: const EdgeInsets.only(top: 8),
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: Colors.grey.shade300,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          
          // Header
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                const Text(
                  'Filters',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const Spacer(),
                TextButton(
                  onPressed: _resetFilters,
                  child: const Text('Reset'),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: _applyFilters,
                  child: const Text('Apply'),
                ),
              ],
            ),
          ),
          
          const Divider(height: 1),
          
          // Filter Content
          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category Section
                  _buildSectionTitle('Category'),
                  const SizedBox(height: 12),
                  _buildCategoryChips(),
                  
                  const SizedBox(height: 24),
                  
                  // Sort By Section
                  _buildSectionTitle('Sort By'),
                  const SizedBox(height: 12),
                  _buildSortOptions(),
                  
                  const SizedBox(height: 24),
                  
                  // Price Range Section
                  _buildSectionTitle('Price Range'),
                  const SizedBox(height: 12),
                  _buildPriceRangeSlider(),
                  
                  const SizedBox(height: 24),
                  
                  // Condition Section
                  _buildSectionTitle('Condition'),
                  const SizedBox(height: 12),
                  _buildConditionSelector(),
                  
                  const SizedBox(height: 24),
                  
                  // Distance Section
                  _buildSectionTitle('Distance'),
                  const SizedBox(height: 12),
                  _buildDistanceSlider(),
                  
                  const SizedBox(height: 32),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 16,
        fontWeight: FontWeight.bold,
      ),
    );
  }

  Widget _buildCategoryChips() {
    return Wrap(
      spacing: 8,
      runSpacing: 8,
      children: _categories.map((category) {
        final isSelected = category == _selectedCategory;
        return FilterChip(
          label: Text(category),
          selected: isSelected,
          onSelected: (selected) {
            HapticFeedback.selectionClick();
            setState(() {
              _selectedCategory = category;
            });
          },
          backgroundColor: Colors.grey.shade100,
          selectedColor: Theme.of(context).colorScheme.primaryContainer,
        );
      }).toList(),
    );
  }

  Widget _buildSortOptions() {
    return Column(
      children: _sortOptions.map((option) {
        final isSelected = option['key'] == _sortBy;
        return RadioListTile<String>(
          title: Text(option['label']!),
          value: option['key']!,
          groupValue: _sortBy,
          onChanged: (value) {
            HapticFeedback.selectionClick();
            setState(() {
              _sortBy = value!;
            });
          },
          contentPadding: EdgeInsets.zero,
          dense: true,
        );
      }).toList(),
    );
  }

  Widget _buildPriceRangeSlider() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              '\$${_priceRange.start.round()}',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
            Text(
              '\$${_priceRange.end.round()}',
              style: TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        RangeSlider(
          values: _priceRange,
          min: 0,
          max: 2000,
          divisions: 40,
          onChanged: (values) {
            HapticFeedback.selectionClick();
            setState(() {
              _priceRange = values;
            });
          },
        ),
      ],
    );
  }

  Widget _buildConditionSelector() {
    return Column(
      children: _conditions.map((condition) {
        final isSelected = condition == _selectedCondition;
        return RadioListTile<String>(
          title: Text(condition),
          value: condition,
          groupValue: _selectedCondition,
          onChanged: (value) {
            HapticFeedback.selectionClick();
            setState(() {
              _selectedCondition = value!;
            });
          },
          contentPadding: EdgeInsets.zero,
          dense: true,
        );
      }).toList(),
    );
  }

  Widget _buildDistanceSlider() {
    return Column(
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Within'),
            Text(
              '${_maxDistance.round()} miles',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Theme.of(context).colorScheme.primary,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Slider(
          value: _maxDistance,
          min: 1,
          max: 100,
          divisions: 20,
          onChanged: (value) {
            HapticFeedback.selectionClick();
            setState(() {
              _maxDistance = value;
            });
          },
        ),
      ],
    );
  }

  void _resetFilters() {
    HapticFeedback.mediumImpact();
    setState(() {
      _selectedCategory = 'All';
      _sortBy = 'recent';
      _priceRange = const RangeValues(0, 1000);
      _selectedCondition = 'All Conditions';
      _maxDistance = 50;
    });
  }

  void _applyFilters() {
    HapticFeedback.mediumImpact();
    widget.onCategoryChanged(_selectedCategory);
    widget.onSortChanged(_sortBy);
    widget.onPriceRangeChanged?.call(_priceRange.start, _priceRange.end);
    Navigator.pop(context);
  }
}