/**
 * Image Optimization Service
 * Provides lazy loading, compression, and responsive image handling
 */

class ImageOptimizationService {
  constructor() {
    this.observer = null;
    this.imageCache = new Map();
    this.compressionWorker = null;
    this.config = {
      // Lazy loading settings
      rootMargin: '50px',
      threshold: 0.1,
      
      // Compression settings
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1080,
      
      // WebP support
      webpSupported: null,
      
      // Responsive breakpoints
      breakpoints: {
        xs: 576,
        sm: 768,
        md: 992,
        lg: 1200,
        xl: 1400
      }
    };
    
    this.initializeService();
  }

  /**
   * Initialize the service
   */
  async initializeService() {
    try {
      // Check WebP support
      this.config.webpSupported = await this.checkWebPSupport();
      
      // Initialize Intersection Observer for lazy loading
      this.initializeLazyLoading();
      
      // Initialize compression worker if available
      this.initializeCompressionWorker();
      
      console.log('🖼️ Image Optimization Service initialized');
      
    } catch (error) {
      console.error('Failed to initialize Image Optimization Service:', error);
    }
  }

  /**
   * Initialize lazy loading with Intersection Observer
   */
  initializeLazyLoading() {
    if (!('IntersectionObserver' in window)) {
      console.warn('Intersection Observer not supported, falling back to immediate loading');
      return;
    }

    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.loadImage(entry.target);
            this.observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: this.config.rootMargin,
        threshold: this.config.threshold
      }
    );
  }

  /**
   * Initialize Web Worker for image compression
   */
  initializeCompressionWorker() {
    if ('Worker' in window) {
      try {
        const workerCode = `
          self.onmessage = function(e) {
            const { imageData, quality, maxWidth, maxHeight } = e.data;
            
            // Create canvas for compression
            const canvas = new OffscreenCanvas(maxWidth, maxHeight);
            const ctx = canvas.getContext('2d');
            
            // Create image bitmap
            createImageBitmap(imageData).then(bitmap => {
              // Calculate new dimensions
              const { width, height } = calculateDimensions(
                bitmap.width, 
                bitmap.height, 
                maxWidth, 
                maxHeight
              );
              
              canvas.width = width;
              canvas.height = height;
              
              // Draw and compress
              ctx.drawImage(bitmap, 0, 0, width, height);
              
              canvas.convertToBlob({ 
                type: 'image/jpeg', 
                quality: quality 
              }).then(blob => {
                self.postMessage({ success: true, blob });
              }).catch(error => {
                self.postMessage({ success: false, error: error.message });
              });
            });
            
            function calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
              let { width, height } = { width: originalWidth, height: originalHeight };
              
              if (width > maxWidth) {
                height = (height * maxWidth) / width;
                width = maxWidth;
              }
              
              if (height > maxHeight) {
                width = (width * maxHeight) / height;
                height = maxHeight;
              }
              
              return { width: Math.round(width), height: Math.round(height) };
            }
          };
        `;
        
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        this.compressionWorker = new Worker(URL.createObjectURL(blob));
        
      } catch (error) {
        console.warn('Failed to initialize compression worker:', error);
      }
    }
  }

  /**
   * Check WebP support
   */
  async checkWebPSupport() {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => resolve(webP.height === 2);
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }

  /**
   * Enable lazy loading for an image element
   */
  enableLazyLoading(imgElement, options = {}) {
    if (!imgElement || !this.observer) {
      return this.loadImageImmediately(imgElement);
    }

    // Store original src and set placeholder
    const originalSrc = imgElement.src || imgElement.dataset.src;
    imgElement.dataset.originalSrc = originalSrc;
    
    // Set placeholder
    if (!imgElement.src) {
      imgElement.src = this.generatePlaceholder(
        imgElement.width || 300,
        imgElement.height || 200,
        options.placeholderColor || '#f0f0f0'
      );
    }

    // Add loading class
    imgElement.classList.add('lazy-loading');
    
    // Start observing
    this.observer.observe(imgElement);
    
    return imgElement;
  }

  /**
   * Load image when it becomes visible
   */
  async loadImage(imgElement) {
    try {
      const originalSrc = imgElement.dataset.originalSrc;
      if (!originalSrc) return;

      // Add loading indicator
      imgElement.classList.add('loading');
      
      // Optimize the image URL
      const optimizedSrc = this.getOptimizedImageUrl(originalSrc, {
        width: imgElement.clientWidth || imgElement.width,
        height: imgElement.clientHeight || imgElement.height,
        quality: this.config.quality
      });

      // Preload the image
      const preloadImg = new Image();
      preloadImg.crossOrigin = 'anonymous';
      
      await new Promise((resolve, reject) => {
        preloadImg.onload = resolve;
        preloadImg.onerror = reject;
        preloadImg.src = optimizedSrc;
      });

      // Update the actual image
      imgElement.src = optimizedSrc;
      imgElement.classList.remove('lazy-loading', 'loading');
      imgElement.classList.add('loaded');

      // Trigger load event
      imgElement.dispatchEvent(new Event('lazyloaded'));
      
    } catch (error) {
      console.error('Failed to load image:', error);
      imgElement.classList.remove('loading');
      imgElement.classList.add('error');
      
      // Set error placeholder
      imgElement.src = this.generateErrorPlaceholder();
    }
  }

  /**
   * Load image immediately (fallback)
   */
  loadImageImmediately(imgElement) {
    if (!imgElement) return;
    
    const src = imgElement.dataset.src || imgElement.src;
    if (src) {
      imgElement.src = this.getOptimizedImageUrl(src);
      imgElement.classList.add('loaded');
    }
  }

  /**
   * Get optimized image URL
   */
  getOptimizedImageUrl(originalUrl, options = {}) {
    try {
      const url = new URL(originalUrl, window.location.origin);
      
      // Add optimization parameters
      if (options.width) {
        url.searchParams.set('w', Math.round(options.width));
      }
      
      if (options.height) {
        url.searchParams.set('h', Math.round(options.height));
      }
      
      if (options.quality) {
        url.searchParams.set('q', Math.round(options.quality * 100));
      }
      
      // Use WebP if supported
      if (this.config.webpSupported && !url.pathname.endsWith('.gif')) {
        url.searchParams.set('f', 'webp');
      }
      
      return url.toString();
      
    } catch (error) {
      console.error('Failed to optimize image URL:', error);
      return originalUrl;
    }
  }

  /**
   * Generate responsive image srcset
   */
  generateSrcSet(baseUrl, options = {}) {
    const srcSet = [];
    const { breakpoints } = this.config;
    
    Object.entries(breakpoints).forEach(([name, width]) => {
      const optimizedUrl = this.getOptimizedImageUrl(baseUrl, {
        width: width,
        quality: options.quality || this.config.quality
      });
      
      srcSet.push(`${optimizedUrl} ${width}w`);
    });
    
    return srcSet.join(', ');
  }

  /**
   * Generate sizes attribute for responsive images
   */
  generateSizes(sizes = {}) {
    const defaultSizes = {
      xs: '100vw',
      sm: '100vw',
      md: '50vw',
      lg: '33vw',
      xl: '25vw'
    };
    
    const mergedSizes = { ...defaultSizes, ...sizes };
    const sizeQueries = [];
    
    Object.entries(mergedSizes).forEach(([breakpoint, size]) => {
      const minWidth = this.config.breakpoints[breakpoint];
      if (minWidth) {
        sizeQueries.push(`(min-width: ${minWidth}px) ${size}`);
      }
    });
    
    sizeQueries.push(mergedSizes.xs || '100vw'); // Default fallback
    
    return sizeQueries.join(', ');
  }

  /**
   * Compress image file
   */
  async compressImage(file, options = {}) {
    const {
      quality = this.config.quality,
      maxWidth = this.config.maxWidth,
      maxHeight = this.config.maxHeight,
      outputFormat = 'image/jpeg'
    } = options;

    try {
      // Use Web Worker if available
      if (this.compressionWorker) {
        return this.compressWithWorker(file, { quality, maxWidth, maxHeight });
      }
      
      // Fallback to main thread compression
      return this.compressWithCanvas(file, { quality, maxWidth, maxHeight, outputFormat });
      
    } catch (error) {
      console.error('Image compression failed:', error);
      return file; // Return original file if compression fails
    }
  }

  /**
   * Compress image using Web Worker
   */
  async compressWithWorker(file, options) {
    return new Promise((resolve, reject) => {
      const { quality, maxWidth, maxHeight } = options;
      
      this.compressionWorker.onmessage = (e) => {
        const { success, blob, error } = e.data;
        if (success) {
          resolve(blob);
        } else {
          reject(new Error(error));
        }
      };
      
      this.compressionWorker.postMessage({
        imageData: file,
        quality,
        maxWidth,
        maxHeight
      });
    });
  }

  /**
   * Compress image using Canvas (main thread)
   */
  async compressWithCanvas(file, options) {
    const { quality, maxWidth, maxHeight, outputFormat } = options;
    
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Calculate new dimensions
          const { width, height } = this.calculateDimensions(
            img.width, 
            img.height, 
            maxWidth, 
            maxHeight
          );
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to blob
          canvas.toBlob(resolve, outputFormat, quality);
          
        } catch (error) {
          reject(error);
        }
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal dimensions
   */
  calculateDimensions(originalWidth, originalHeight, maxWidth, maxHeight) {
    let { width, height } = { width: originalWidth, height: originalHeight };
    
    // Scale down if needed
    if (width > maxWidth) {
      height = (height * maxWidth) / width;
      width = maxWidth;
    }
    
    if (height > maxHeight) {
      width = (width * maxHeight) / height;
      height = maxHeight;
    }
    
    return { 
      width: Math.round(width), 
      height: Math.round(height) 
    };
  }

  /**
   * Generate placeholder image
   */
  generatePlaceholder(width, height, color = '#f0f0f0') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = width;
    canvas.height = height;
    
    // Fill with color
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);
    
    // Add loading indicator
    ctx.fillStyle = '#ccc';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Loading...', width / 2, height / 2);
    
    return canvas.toDataURL();
  }

  /**
   * Generate error placeholder
   */
  generateErrorPlaceholder() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 300;
    canvas.height = 200;
    
    // Fill with gray
    ctx.fillStyle = '#e0e0e0';
    ctx.fillRect(0, 0, 300, 200);
    
    // Add error text
    ctx.fillStyle = '#999';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Image not found', 150, 100);
    
    return canvas.toDataURL();
  }

  /**
   * Preload critical images
   */
  preloadImages(urls) {
    urls.forEach(url => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = this.getOptimizedImageUrl(url);
      document.head.appendChild(link);
    });
  }

  /**
   * Create responsive image element
   */
  createResponsiveImage(src, options = {}) {
    const img = document.createElement('img');
    
    // Set basic attributes
    img.src = this.generatePlaceholder(options.width || 300, options.height || 200);
    img.dataset.src = src;
    img.alt = options.alt || '';
    img.loading = 'lazy'; // Native lazy loading as fallback
    
    // Set responsive attributes
    if (options.responsive !== false) {
      img.srcset = this.generateSrcSet(src, options);
      img.sizes = this.generateSizes(options.sizes);
    }
    
    // Enable lazy loading
    this.enableLazyLoading(img, options);
    
    return img;
  }

  /**
   * Get image optimization stats
   */
  getStats() {
    return {
      webpSupported: this.config.webpSupported,
      observerSupported: !!this.observer,
      workerSupported: !!this.compressionWorker,
      imagesLoaded: document.querySelectorAll('img.loaded').length,
      imagesLoading: document.querySelectorAll('img.loading').length,
      imagesPending: document.querySelectorAll('img.lazy-loading').length
    };
  }

  /**
   * Clean up service
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    if (this.compressionWorker) {
      this.compressionWorker.terminate();
      this.compressionWorker = null;
    }
    
    this.imageCache.clear();
  }
}

// Export singleton instance
const imageOptimizationService = new ImageOptimizationService();

// Auto-cleanup on page unload
window.addEventListener('beforeunload', () => {
  imageOptimizationService.destroy();
});

export default imageOptimizationService;