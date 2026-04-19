/**
 * ===========================================
 * FRONTEND IMAGE UTILITIES
 * ===========================================
 * 
 * Helper functions for handling product images
 * on the frontend with fallbacks and formatting.
 */

// Default fallback image
export const FALLBACK_IMAGE = 'https://via.placeholder.com/800x800/667eea/ffffff?text=Product+Image';
export const FALLBACK_CATEGORY_IMAGE = 'https://via.placeholder.com/400x400/667eea/ffffff?text=Category';

/**
 * Get the primary image URL from a product
 * @param {Object} product - Product object
 * @returns {string} - Image URL
 */
export const getProductImage = (product) => {
  if (!product) return FALLBACK_IMAGE;
  
  // Check for images array
  if (product.images && product.images.length > 0) {
    // Find primary image or use first
    const primaryImage = product.images.find(img => img.isPrimary);
    const imageUrl = primaryImage ? primaryImage.url : product.images[0].url || product.images[0];
    
    // Validate URL
    return isValidImageUrl(imageUrl) ? imageUrl : FALLBACK_IMAGE;
  }
  
  // Check for single image field
  if (product.image) {
    return isValidImageUrl(product.image) ? product.image : FALLBACK_IMAGE;
  }
  
  // Check for thumbnail
  if (product.thumbnail) {
    return isValidImageUrl(product.thumbnail) ? product.thumbnail : FALLBACK_IMAGE;
  }
  
  // Check for primaryImage virtual
  if (product.primaryImage) {
    return isValidImageUrl(product.primaryImage) ? product.primaryImage : FALLBACK_IMAGE;
  }
  
  return FALLBACK_IMAGE;
};

/**
 * Get all images from a product
 * @param {Object} product - Product object
 * @returns {Array} - Array of image URLs
 */
export const getProductImages = (product) => {
  if (!product) return [FALLBACK_IMAGE];
  
  // Check for images array
  if (product.images && product.images.length > 0) {
    return product.images.map(img => {
      const url = typeof img === 'string' ? img : img.url;
      return isValidImageUrl(url) ? url : FALLBACK_IMAGE;
    });
  }
  
  // Check for imageUrls virtual
  if (product.imageUrls && product.imageUrls.length > 0) {
    return product.imageUrls.map(url => 
      isValidImageUrl(url) ? url : FALLBACK_IMAGE
    );
  }
  
  // Fallback to single image
  const singleImage = getProductImage(product);
  return [singleImage];
};

/**
 * Check if a URL is valid (not a local path that doesn't exist)
 * @param {string} url - URL to validate
 * @returns {boolean}
 */
export const isValidImageUrl = (url) => {
  if (!url) return false;
  
  // Check if it's a full URL (http/https)
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return true;
  }
  
  // Local paths that don't exist should be treated as invalid
  if (url.startsWith('/uploads/') || url.startsWith('/images/')) {
    // These might not exist, return false to use fallback
    return false;
  }
  
  return false;
};

/**
 * Get optimized image URL with size parameters
 * @param {string} url - Original image URL
 * @param {number} width - Desired width
 * @param {number} height - Desired height
 * @returns {string}
 */
export const getOptimizedImageUrl = (url, width = 400, height = 400) => {
  if (!url || !isValidImageUrl(url)) return FALLBACK_IMAGE;
  
  // Handle Unsplash URLs
  if (url.includes('unsplash.com')) {
    // Add or update w and h parameters
    const urlObj = new URL(url);
    urlObj.searchParams.set('w', width.toString());
    urlObj.searchParams.set('h', height.toString());
    urlObj.searchParams.set('fit', 'crop');
    urlObj.searchParams.set('q', '80');
    return urlObj.toString();
  }
  
  // Handle Picsum URLs
  if (url.includes('picsum.photos')) {
    // Picsum format: https://picsum.photos/seed/xxx/width/height
    const parts = url.split('/');
    if (parts.length >= 5) {
      parts[parts.length - 2] = width.toString();
      parts[parts.length - 1] = height.toString();
      return parts.join('/');
    }
  }
  
  // Handle placeholder.com URLs
  if (url.includes('placeholder.com') || url.includes('via.placeholder')) {
    return `https://via.placeholder.com/${width}x${height}/667eea/ffffff?text=Product`;
  }
  
  return url;
};

/**
 * Get thumbnail URL (smaller version)
 * @param {string} url - Original image URL
 * @returns {string}
 */
export const getThumbnailUrl = (url) => {
  return getOptimizedImageUrl(url, 150, 150);
};

/**
 * Get category image URL
 * @param {Object} category - Category object
 * @returns {string}
 */
export const getCategoryImage = (category) => {
  if (!category) return FALLBACK_CATEGORY_IMAGE;
  
  if (category.image && isValidImageUrl(category.image)) {
    return category.image;
  }
  
  // Generate based on category name
  const categoryKeywords = {
    'electronics': 'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=400&h=400&fit=crop',
    'fashion': 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop',
    'home & kitchen': 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400&h=400&fit=crop',
    'books': 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&h=400&fit=crop',
    'sports & fitness': 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=400&fit=crop',
    'beauty & health': 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop',
  };
  
  const name = category.name?.toLowerCase() || '';
  return categoryKeywords[name] || FALLBACK_CATEGORY_IMAGE;
};

/**
 * Preload an image
 * @param {string} url - Image URL to preload
 * @returns {Promise}
 */
export const preloadImage = (url) => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(url);
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
};

/**
 * Preload multiple images
 * @param {Array} urls - Array of image URLs
 * @returns {Promise}
 */
export const preloadImages = (urls) => {
  return Promise.all(urls.map(url => preloadImage(url).catch(() => FALLBACK_IMAGE)));
};

/**
 * Generate placeholder data URL
 * @param {number} width 
 * @param {number} height 
 * @param {string} color 
 * @returns {string}
 */
export const generatePlaceholderDataUrl = (width = 100, height = 100, color = '#667eea') => {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="${color}"/>
      <text x="50%" y="50%" font-family="Arial" font-size="14" fill="white" text-anchor="middle" dominant-baseline="middle">
        Loading...
      </text>
    </svg>
  `;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};

export default {
  FALLBACK_IMAGE,
  FALLBACK_CATEGORY_IMAGE,
  getProductImage,
  getProductImages,
  isValidImageUrl,
  getOptimizedImageUrl,
  getThumbnailUrl,
  getCategoryImage,
  preloadImage,
  preloadImages,
  generatePlaceholderDataUrl
};
