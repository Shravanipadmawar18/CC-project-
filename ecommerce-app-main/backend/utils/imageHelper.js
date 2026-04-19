/**
 * ===========================================
 * IMAGE HELPER UTILITY
 * ===========================================
 * 
 * Generates placeholder images from public APIs
 * based on product name and category.
 */

// Image sources configuration
const IMAGE_SOURCES = {
  // Unsplash Source - Free, high-quality images
  unsplash: (keyword, width = 800, height = 800) => 
    `https://source.unsplash.com/${width}x${height}/?${encodeURIComponent(keyword)}`,
  
  // Lorem Picsum - Random beautiful images
  picsum: (seed, width = 800, height = 800) => 
    `https://picsum.photos/seed/${seed}/${width}/${height}`,
  
  // Placeholder.com - Simple placeholder with text
  placeholder: (text, width = 800, height = 800) => 
    `https://via.placeholder.com/${width}x${height}/667eea/ffffff?text=${encodeURIComponent(text)}`,
  
  // DiceBear - For avatars and icons
  dicebear: (seed) => 
    `https://api.dicebear.com/7.x/shapes/svg?seed=${seed}`,
};

// Category to keyword mapping for better image relevance
const CATEGORY_KEYWORDS = {
  'electronics': ['technology', 'gadget', 'device', 'tech', 'electronic'],
  'fashion': ['fashion', 'clothing', 'style', 'apparel', 'wear'],
  'home & kitchen': ['home', 'kitchen', 'interior', 'furniture', 'appliance'],
  'books': ['book', 'reading', 'library', 'literature'],
  'sports & fitness': ['fitness', 'sport', 'exercise', 'gym', 'athletic'],
  'beauty & health': ['beauty', 'skincare', 'cosmetics', 'wellness', 'health'],
};

// Product type specific keywords for better matching
const PRODUCT_KEYWORDS = {
  // Electronics
  'iphone': 'iphone smartphone mobile',
  'samsung': 'samsung smartphone android',
  'macbook': 'macbook laptop apple',
  'laptop': 'laptop computer notebook',
  'headphones': 'headphones audio music',
  'earbuds': 'earbuds wireless audio',
  'tablet': 'tablet ipad digital',
  'watch': 'smartwatch wearable tech',
  'camera': 'camera photography digital',
  'speaker': 'speaker audio bluetooth',
  'tv': 'television tv screen',
  'monitor': 'monitor display screen',
  'keyboard': 'keyboard computer tech',
  'mouse': 'mouse computer tech',
  
  // Fashion
  'shoes': 'shoes footwear sneakers',
  'sneakers': 'sneakers shoes athletic',
  'jordan': 'jordan sneakers basketball',
  'jeans': 'jeans denim fashion',
  'shirt': 'shirt clothing fashion',
  't-shirt': 'tshirt casual fashion',
  'dress': 'dress fashion elegant',
  'jacket': 'jacket outerwear fashion',
  'sunglasses': 'sunglasses eyewear fashion',
  'bag': 'bag handbag fashion',
  'backpack': 'backpack bag carry',
  
  // Home & Kitchen
  'vacuum': 'vacuum cleaner home',
  'blender': 'blender kitchen appliance',
  'coffee': 'coffee maker kitchen',
  'air fryer': 'air fryer cooking',
  'cooker': 'pressure cooker kitchen',
  'pot': 'cooking pot kitchen',
  'pan': 'frying pan kitchen',
  'furniture': 'furniture home interior',
  'lamp': 'lamp lighting home',
  'bed': 'bed bedroom furniture',
  'sofa': 'sofa furniture living room',
  'chair': 'chair furniture seating',
  
  // Sports & Fitness
  'dumbbell': 'dumbbell weights gym',
  'yoga': 'yoga mat fitness',
  'fitness': 'fitness exercise gym',
  'treadmill': 'treadmill exercise cardio',
  'bicycle': 'bicycle cycling sport',
  'ball': 'sports ball athletic',
  
  // Beauty
  'skincare': 'skincare beauty cosmetics',
  'makeup': 'makeup beauty cosmetics',
  'hair dryer': 'hair dryer beauty',
  'perfume': 'perfume fragrance beauty',
  'lipstick': 'lipstick makeup beauty',
  
  // Books
  'book': 'book reading literature',
  'novel': 'novel book fiction',
};

/**
 * Generate keywords from product name and category
 */
const generateKeywords = (productName, categoryName = '') => {
  const nameLower = productName.toLowerCase();
  const categoryLower = categoryName.toLowerCase();
  
  // Check for specific product type matches
  for (const [key, value] of Object.entries(PRODUCT_KEYWORDS)) {
    if (nameLower.includes(key)) {
      return value;
    }
  }
  
  // Use category keywords
  for (const [cat, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (categoryLower.includes(cat) || cat.includes(categoryLower)) {
      return keywords[0] + ' ' + nameLower.split(' ')[0];
    }
  }
  
  // Default to product name
  return nameLower.split(' ').slice(0, 2).join(' ');
};

/**
 * Generate a unique seed from string
 */
const generateSeed = (str) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString();
};

/**
 * Get product image URL
 * @param {string} productName - Product name
 * @param {string} categoryName - Category name
 * @param {number} index - Image index (for multiple images)
 * @param {string} source - Image source ('unsplash', 'picsum', 'placeholder')
 */
const getProductImageUrl = (productName, categoryName = '', index = 0, source = 'unsplash') => {
  const keywords = generateKeywords(productName, categoryName);
  const seed = generateSeed(productName + index);
  
  switch (source) {
    case 'unsplash':
      return IMAGE_SOURCES.unsplash(keywords, 800, 800);
    case 'picsum':
      return IMAGE_SOURCES.picsum(seed, 800, 800);
    case 'placeholder':
      return IMAGE_SOURCES.placeholder(productName.substring(0, 20), 800, 800);
    default:
      return IMAGE_SOURCES.unsplash(keywords, 800, 800);
  }
};

/**
 * Get multiple product images
 * @param {string} productName - Product name
 * @param {string} categoryName - Category name
 * @param {number} count - Number of images
 */
const getProductImages = (productName, categoryName = '', count = 4) => {
  const images = [];
  const keywords = generateKeywords(productName, categoryName);
  
  for (let i = 0; i < count; i++) {
    const seed = generateSeed(productName + i);
    images.push({
      url: i === 0 
        ? IMAGE_SOURCES.unsplash(keywords, 800, 800)
        : IMAGE_SOURCES.picsum(seed, 800, 800),
      alt: `${productName} - Image ${i + 1}`,
      isPrimary: i === 0
    });
  }
  
  return images;
};

/**
 * Get fallback image URL
 */
const getFallbackImageUrl = () => {
  return 'https://via.placeholder.com/800x800/667eea/ffffff?text=Product+Image';
};

/**
 * Get category image URL
 */
const getCategoryImageUrl = (categoryName) => {
  const keywords = CATEGORY_KEYWORDS[categoryName.toLowerCase()]?.[0] || categoryName;
  return IMAGE_SOURCES.unsplash(keywords, 400, 400);
};

/**
 * Curated high-quality product images from Unsplash
 * These are real, reliable image URLs that work
 */
const CURATED_IMAGES = {
  // Electronics
  'iphone': [
    'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&h=800&fit=crop',
  ],
  'samsung': [
    'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=800&fit=crop',
  ],
  'macbook': [
    'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=800&fit=crop',
  ],
  'headphones': [
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop',
  ],
  'ipad': [
    'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=800&fit=crop',
  ],
  
  // Fashion
  'sneakers': [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop',
  ],
  'jeans': [
    'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&h=800&fit=crop',
  ],
  'sunglasses': [
    'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&h=800&fit=crop',
  ],
  
  // Home & Kitchen
  'kitchen': [
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1585837146751-a44118595086?w=800&h=800&fit=crop',
  ],
  'vacuum': [
    'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&h=800&fit=crop',
  ],
  'airfryer': [
    'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1643488564430-4e7c0e8b5c4b?w=800&h=800&fit=crop',
  ],
  
  // Books
  'book': [
    'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=800&fit=crop',
  ],
  
  // Sports & Fitness
  'fitness': [
    'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&h=800&fit=crop',
  ],
  'yoga': [
    'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&h=800&fit=crop',
  ],
  'dumbbell': [
    'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=800&h=800&fit=crop',
  ],
  'watch': [
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&h=800&fit=crop',
  ],
  
  // Beauty & Health
  'beauty': [
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&h=800&fit=crop',
  ],
  'skincare': [
    'https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop',
  ],
  'hairdryer': [
    'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800&h=800&fit=crop',
    'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&h=800&fit=crop',
  ],
};

/**
 * Get curated image for a product based on keywords in name
 */
const getCuratedProductImages = (productName, count = 4) => {
  const nameLower = productName.toLowerCase();
  
  // Find matching curated images
  for (const [keyword, images] of Object.entries(CURATED_IMAGES)) {
    if (nameLower.includes(keyword)) {
      const selectedImages = images.slice(0, count).map((url, index) => ({
        url,
        alt: `${productName} - Image ${index + 1}`,
        isPrimary: index === 0
      }));
      
      // If we need more images, generate them
      while (selectedImages.length < count) {
        const seed = generateSeed(productName + selectedImages.length);
        selectedImages.push({
          url: IMAGE_SOURCES.picsum(seed, 800, 800),
          alt: `${productName} - Image ${selectedImages.length + 1}`,
          isPrimary: false
        });
      }
      
      return selectedImages;
    }
  }
  
  // Fallback to generated images
  return getProductImages(productName, '', count);
};

module.exports = {
  getProductImageUrl,
  getProductImages,
  getFallbackImageUrl,
  getCategoryImageUrl,
  getCuratedProductImages,
  generateKeywords,
  CURATED_IMAGES,
  IMAGE_SOURCES
};
