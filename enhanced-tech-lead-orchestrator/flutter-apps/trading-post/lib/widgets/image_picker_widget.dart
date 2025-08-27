import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class ImagePickerWidget extends StatefulWidget {
  final List<String> selectedImages;
  final Function(List<String>) onImagesChanged;
  final int maxImages;

  const ImagePickerWidget({
    Key? key,
    required this.selectedImages,
    required this.onImagesChanged,
    this.maxImages = 10,
  }) : super(key: key);

  @override
  State<ImagePickerWidget> createState() => _ImagePickerWidgetState();
}

class _ImagePickerWidgetState extends State<ImagePickerWidget> {
  // Mock image URLs for demo purposes - replace with actual image picker
  final List<String> _mockImages = [
    'https://images.unsplash.com/photo-1632633173522-852b05bc9600?w=400',
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=400',
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    'https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=400',
    'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400',
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400',
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
  ];

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Selected Images Grid
        if (widget.selectedImages.isNotEmpty)
          Container(
            height: 120,
            margin: const EdgeInsets.only(bottom: 16),
            child: ReorderableListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: widget.selectedImages.length,
              onReorder: _onReorder,
              itemBuilder: (context, index) {
                final image = widget.selectedImages[index];
                return Container(
                  key: ValueKey(image),
                  width: 100,
                  margin: const EdgeInsets.only(right: 8),
                  child: Stack(
                    children: [
                      // Image
                      Container(
                        width: 100,
                        height: 100,
                        decoration: BoxDecoration(
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: index == 0 
                                ? Theme.of(context).colorScheme.primary
                                : Colors.grey.shade300,
                            width: index == 0 ? 2 : 1,
                          ),
                        ),
                        child: ClipRRect(
                          borderRadius: BorderRadius.circular(8),
                          child: Image.network(
                            image,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stackTrace) {
                              return Container(
                                color: Colors.grey.shade200,
                                child: const Icon(
                                  Icons.broken_image,
                                  color: Colors.grey,
                                ),
                              );
                            },
                          ),
                        ),
                      ),
                      
                      // Cover Badge
                      if (index == 0)
                        Positioned(
                          top: 4,
                          left: 4,
                          child: Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 6,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Theme.of(context).colorScheme.primary,
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'COVER',
                              style: TextStyle(
                                color: Colors.white,
                                fontSize: 8,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                      
                      // Remove Button
                      Positioned(
                        top: 4,
                        right: 4,
                        child: GestureDetector(
                          onTap: () => _removeImage(index),
                          child: Container(
                            width: 24,
                            height: 24,
                            decoration: const BoxDecoration(
                              color: Colors.red,
                              shape: BoxShape.circle,
                            ),
                            child: const Icon(
                              Icons.close,
                              color: Colors.white,
                              size: 16,
                            ),
                          ),
                        ),
                      ),
                      
                      // Drag Handle
                      Positioned(
                        bottom: 4,
                        right: 4,
                        child: Container(
                          padding: const EdgeInsets.all(2),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.7),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: const Icon(
                            Icons.drag_handle,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),

        // Add Photos Button
        if (widget.selectedImages.length < widget.maxImages)
          InkWell(
            onTap: _showImagePicker,
            borderRadius: BorderRadius.circular(8),
            child: Container(
              height: 100,
              decoration: BoxDecoration(
                border: Border.all(
                  color: Colors.grey.shade300,
                  style: BorderStyle.solid,
                ),
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.add_photo_alternate,
                    size: 32,
                    color: Colors.grey.shade600,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.selectedImages.isEmpty 
                        ? 'Add Photos'
                        : 'Add More Photos',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                  if (widget.selectedImages.isEmpty)
                    Text(
                      'Tap to select',
                      style: TextStyle(
                        color: Colors.grey.shade500,
                        fontSize: 12,
                      ),
                    ),
                ],
              ),
            ),
          ),

        // Reorder Instructions
        if (widget.selectedImages.length > 1)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Row(
              children: [
                Icon(
                  Icons.info_outline,
                  size: 16,
                  color: Colors.grey.shade600,
                ),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    'Long press and drag to reorder. First image is your cover photo.',
                    style: TextStyle(
                      color: Colors.grey.shade600,
                      fontSize: 12,
                    ),
                  ),
                ),
              ],
            ),
          ),
      ],
    );
  }

  void _showImagePicker() {
    HapticFeedback.lightImpact();
    
    // For demo purposes, show a dialog with mock images
    // In a real app, this would open the device's image picker
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Select Images'),
        content: SizedBox(
          width: double.maxFinite,
          height: 300,
          child: GridView.builder(
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 8,
              mainAxisSpacing: 8,
            ),
            itemCount: _mockImages.length,
            itemBuilder: (context, index) {
              final image = _mockImages[index];
              final isSelected = widget.selectedImages.contains(image);
              
              return GestureDetector(
                onTap: () => _toggleImageSelection(image),
                child: Stack(
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(4),
                        border: Border.all(
                          color: isSelected 
                              ? Theme.of(context).colorScheme.primary
                              : Colors.grey.shade300,
                          width: isSelected ? 2 : 1,
                        ),
                      ),
                      child: ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: Image.network(
                          image,
                          fit: BoxFit.cover,
                          width: double.infinity,
                          height: double.infinity,
                        ),
                      ),
                    ),
                    if (isSelected)
                      Positioned(
                        top: 4,
                        right: 4,
                        child: Container(
                          width: 20,
                          height: 20,
                          decoration: BoxDecoration(
                            color: Theme.of(context).colorScheme.primary,
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.check,
                            color: Colors.white,
                            size: 16,
                          ),
                        ),
                      ),
                  ],
                ),
              );
            },
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Done'),
          ),
        ],
      ),
    );
  }

  void _toggleImageSelection(String image) {
    HapticFeedback.selectionClick();
    
    List<String> newImages = List.from(widget.selectedImages);
    
    if (newImages.contains(image)) {
      newImages.remove(image);
    } else if (newImages.length < widget.maxImages) {
      newImages.add(image);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Maximum ${widget.maxImages} images allowed'),
        ),
      );
      return;
    }
    
    widget.onImagesChanged(newImages);
  }

  void _removeImage(int index) {
    HapticFeedback.lightImpact();
    List<String> newImages = List.from(widget.selectedImages);
    newImages.removeAt(index);
    widget.onImagesChanged(newImages);
  }

  void _onReorder(int oldIndex, int newIndex) {
    HapticFeedback.selectionClick();
    
    if (newIndex > oldIndex) {
      newIndex -= 1;
    }
    
    List<String> newImages = List.from(widget.selectedImages);
    final item = newImages.removeAt(oldIndex);
    newImages.insert(newIndex, item);
    widget.onImagesChanged(newImages);
  }
}