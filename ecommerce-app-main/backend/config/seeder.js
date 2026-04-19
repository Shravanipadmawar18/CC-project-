/**
 * ===========================================
 * DATABASE SEEDER
 * ===========================================
 * 
 * Seeds the database with sample data for testing.
 * Uses high-quality images from Unsplash.
 * 
 * Usage:
 *   npm run seed        - Import data
 *   npm run seed:destroy - Delete all data
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');

// Load environment variables
dotenv.config();

// Import models
const User = require('../models/User');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Cart = require('../models/Cart');
const Order = require('../models/Order');

// Import image helper
const { getCuratedProductImages } = require('../utils/imageHelper');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce');

// ===========================================
// SAMPLE DATA
// ===========================================

const categories = [
  {
    name: 'Electronics',
    description: 'Latest electronic gadgets and devices',
    icon: 'laptop',
    displayOrder: 1
  },
  {
    name: 'Fashion',
    description: 'Trendy clothing and accessories',
    icon: 'shirt',
    displayOrder: 2
  },
  {
    name: 'Home & Kitchen',
    description: 'Home appliances and kitchen essentials',
    icon: 'home',
    displayOrder: 3
  },
  {
    name: 'Books',
    description: 'Books across all genres',
    icon: 'book',
    displayOrder: 4
  },
  {
    name: 'Sports & Fitness',
    description: 'Sports equipment and fitness gear',
    icon: 'dumbbell',
    displayOrder: 5
  },
  {
    name: 'Beauty & Health',
    description: 'Beauty products and health essentials',
    icon: 'heart',
    displayOrder: 6
  }
];

const users = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin@123',
    role: 'admin',
    phone: '9876543210',
    address: {
      street: '123 Admin Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      zipCode: '400001',
      country: 'India'
    }
  },
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'User@123',
    role: 'user',
    phone: '9876543211',
    address: {
      street: '456 User Avenue',
      city: 'Delhi',
      state: 'Delhi',
      zipCode: '110001',
      country: 'India'
    }
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'User@123',
    role: 'user',
    phone: '9876543212',
    address: {
      street: '789 Customer Road',
      city: 'Bangalore',
      state: 'Karnataka',
      zipCode: '560001',
      country: 'India'
    }
  }
];

// Products will be created with category references
const getProducts = (categoryMap) => [
  // Electronics
  {
    name: 'iPhone 15 Pro Max',
    description: 'The most powerful iPhone ever with A17 Pro chip, titanium design, and advanced camera system. Features a 6.7-inch Super Retina XDR display with ProMotion technology.',
    shortDescription: 'Latest iPhone with titanium design',
    price: 159900,
    originalPrice: 169900,
    category: categoryMap['Electronics'],
    brand: 'Apple',
    stock: 50,
    images: [
      { url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800&h=800&fit=crop', alt: 'iPhone 15 Pro Max', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?w=800&h=800&fit=crop', alt: 'iPhone 15 Pro Max Side View', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1565849904461-04a58ad377e0?w=800&h=800&fit=crop', alt: 'iPhone 15 Pro Max Back', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1591337676887-a217a6970a8a?w=800&h=800&fit=crop', alt: 'iPhone 15 Pro Max Display', isPrimary: false },
    ],
    tags: ['smartphone', 'apple', 'iphone', '5g', 'premium'],
    isFeatured: true,
    rating: 4.8,
    numReviews: 125
  },
  {
    name: 'Samsung Galaxy S24 Ultra',
    description: 'Experience the ultimate Galaxy with AI-powered features, S Pen, and advanced camera. 200MP camera system and Snapdragon 8 Gen 3 processor.',
    shortDescription: 'AI-powered Galaxy flagship',
    price: 134999,
    originalPrice: 144999,
    category: categoryMap['Electronics'],
    brand: 'Samsung',
    stock: 45,
    images: [
      { url: 'https://images.unsplash.com/photo-1610945265064-0e34e5519bbf?w=800&h=800&fit=crop', alt: 'Samsung Galaxy S24 Ultra', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1585060544812-6b45742d762f?w=800&h=800&fit=crop', alt: 'Samsung Galaxy S24 Ultra Side', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&h=800&fit=crop', alt: 'Samsung Galaxy S24 Ultra Display', isPrimary: false },
    ],
    tags: ['smartphone', 'samsung', 'android', '5g', 'ai'],
    isFeatured: true,
    rating: 4.7,
    numReviews: 98
  },
  {
    name: 'MacBook Pro 16" M3 Max',
    description: 'Supercharged by M3 Max chip with up to 128GB unified memory. Features Liquid Retina XDR display and up to 22 hours battery life.',
    shortDescription: 'Powerful laptop for professionals',
    price: 349900,
    originalPrice: 369900,
    category: categoryMap['Electronics'],
    brand: 'Apple',
    stock: 25,
    images: [
      { url: 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&h=800&fit=crop', alt: 'MacBook Pro 16', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&h=800&fit=crop', alt: 'MacBook Pro Side View', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800&h=800&fit=crop', alt: 'MacBook Pro Open', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1531297484001-80022131f5a1?w=800&h=800&fit=crop', alt: 'MacBook Pro on Desk', isPrimary: false },
    ],
    tags: ['laptop', 'apple', 'macbook', 'professional', 'm3'],
    isFeatured: true,
    rating: 4.9,
    numReviews: 76
  },
  {
    name: 'Sony WH-1000XM5 Headphones',
    description: 'Industry-leading noise cancellation with Auto NC Optimizer. 30-hour battery life and crystal clear hands-free calling.',
    shortDescription: 'Premium noise-cancelling headphones',
    price: 29990,
    originalPrice: 34990,
    category: categoryMap['Electronics'],
    brand: 'Sony',
    stock: 100,
    images: [
      { url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop', alt: 'Sony WH-1000XM5', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop', alt: 'Sony Headphones Side', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800&h=800&fit=crop', alt: 'Sony Headphones Flat', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&h=800&fit=crop', alt: 'Sony Headphones Lifestyle', isPrimary: false },
    ],
    tags: ['headphones', 'sony', 'wireless', 'noise-cancelling', 'audio'],
    isFeatured: true,
    rating: 4.6,
    numReviews: 234
  },
  {
    name: 'iPad Air M2',
    description: '11-inch Liquid Retina display with M2 chip. Perfect for creativity, productivity, and entertainment on the go.',
    shortDescription: 'Powerful and portable iPad',
    price: 69900,
    originalPrice: 74900,
    category: categoryMap['Electronics'],
    brand: 'Apple',
    stock: 60,
    images: [
      { url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop', alt: 'iPad Air M2', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&h=800&fit=crop', alt: 'iPad Air Side View', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=800&fit=crop', alt: 'iPad Air with Pencil', isPrimary: false },
    ],
    tags: ['tablet', 'apple', 'ipad', 'm2', 'portable'],
    rating: 4.7,
    numReviews: 89
  },
  // Fashion
  {
    name: 'Nike Air Jordan 1 Retro High',
    description: 'The iconic Air Jordan 1 Retro High brings back classic style with premium leather and Air cushioning. A timeless basketball sneaker.',
    shortDescription: 'Classic basketball sneakers',
    price: 15995,
    originalPrice: 18995,
    category: categoryMap['Fashion'],
    brand: 'Nike',
    stock: 80,
    images: [
      { url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=800&fit=crop', alt: 'Nike Air Jordan 1', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=800&h=800&fit=crop', alt: 'Air Jordan Side View', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800&h=800&fit=crop', alt: 'Air Jordan Top View', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800&h=800&fit=crop', alt: 'Air Jordan Detail', isPrimary: false },
    ],
    tags: ['shoes', 'sneakers', 'nike', 'jordan', 'basketball'],
    isFeatured: true,
    attributes: { size: ['7', '8', '9', '10', '11'], color: ['Red', 'Black', 'White'] },
    rating: 4.8,
    numReviews: 312
  },
  {
    name: 'Levi\'s 501 Original Jeans',
    description: 'The original blue jean since 1873. Straight leg, button fly, and iconic fit that defined style for generations.',
    shortDescription: 'Classic straight-fit jeans',
    price: 4999,
    originalPrice: 5999,
    category: categoryMap['Fashion'],
    brand: 'Levi\'s',
    stock: 150,
    images: [
      { url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=800&h=800&fit=crop', alt: 'Levi\'s 501 Jeans', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?w=800&h=800&fit=crop', alt: 'Levi\'s Jeans Folded', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&h=800&fit=crop', alt: 'Levi\'s Jeans Detail', isPrimary: false },
    ],
    tags: ['jeans', 'denim', 'levis', 'classic', 'pants'],
    attributes: { size: ['28', '30', '32', '34', '36'], color: ['Blue', 'Black', 'Grey'] },
    rating: 4.5,
    numReviews: 456
  },
  {
    name: 'Ray-Ban Aviator Classic',
    description: 'The timeless Ray-Ban Aviator. Gold frame with green G-15 lenses. 100% UV protection.',
    shortDescription: 'Iconic aviator sunglasses',
    price: 12990,
    originalPrice: 14990,
    category: categoryMap['Fashion'],
    brand: 'Ray-Ban',
    stock: 75,
    images: [
      { url: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800&h=800&fit=crop', alt: 'Ray-Ban Aviator', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&h=800&fit=crop', alt: 'Ray-Ban Side View', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1577803645773-f96470509666?w=800&h=800&fit=crop', alt: 'Ray-Ban Collection', isPrimary: false },
    ],
    tags: ['sunglasses', 'rayban', 'aviator', 'accessories', 'classic'],
    isFeatured: true,
    rating: 4.7,
    numReviews: 189
  },
  // Home & Kitchen
  {
    name: 'Instant Pot Duo 7-in-1',
    description: '7-in-1 electric pressure cooker: pressure cooker, slow cooker, rice cooker, steamer, sauté pan, yogurt maker, and warmer.',
    shortDescription: 'Multi-functional pressure cooker',
    price: 8999,
    originalPrice: 11999,
    category: categoryMap['Home & Kitchen'],
    brand: 'Instant Pot',
    stock: 120,
    images: [
      { url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=800&fit=crop', alt: 'Instant Pot Duo', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1565538810643-b5bdb714032a?w=800&h=800&fit=crop', alt: 'Kitchen Appliance', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1585837146751-a44118595086?w=800&h=800&fit=crop', alt: 'Cooking with Instant Pot', isPrimary: false },
    ],
    tags: ['kitchen', 'cooker', 'appliance', 'instant-pot', 'electric'],
    isFeatured: true,
    rating: 4.6,
    numReviews: 567
  },
  {
    name: 'Dyson V15 Detect Vacuum',
    description: 'Reveals microscopic dust with laser. Powerful suction with HEPA filtration. Up to 60 minutes runtime.',
    shortDescription: 'Advanced cordless vacuum',
    price: 56900,
    originalPrice: 64900,
    category: categoryMap['Home & Kitchen'],
    brand: 'Dyson',
    stock: 35,
    images: [
      { url: 'https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800&h=800&fit=crop', alt: 'Dyson V15 Vacuum', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?w=800&h=800&fit=crop', alt: 'Vacuum Cleaner Home', isPrimary: false },
    ],
    tags: ['vacuum', 'dyson', 'cordless', 'cleaning', 'home'],
    isFeatured: true,
    rating: 4.8,
    numReviews: 234
  },
  {
    name: 'Philips Air Fryer XXL',
    description: 'Rapid Air technology for healthier frying with up to 90% less fat. Family-size capacity for up to 6 servings.',
    shortDescription: 'Healthy cooking air fryer',
    price: 14999,
    originalPrice: 18999,
    category: categoryMap['Home & Kitchen'],
    brand: 'Philips',
    stock: 90,
    images: [
      { url: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=800&h=800&fit=crop', alt: 'Philips Air Fryer', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1585837146751-a44118595086?w=800&h=800&fit=crop', alt: 'Air Fryer Kitchen', isPrimary: false },
    ],
    tags: ['airfryer', 'kitchen', 'philips', 'cooking', 'healthy'],
    rating: 4.5,
    numReviews: 423
  },
  // Books
  {
    name: 'Atomic Habits by James Clear',
    description: 'An Easy & Proven Way to Build Good Habits & Break Bad Ones. The #1 New York Times bestseller with over 10 million copies sold.',
    shortDescription: 'Bestselling self-help book',
    price: 499,
    originalPrice: 699,
    category: categoryMap['Books'],
    brand: 'Penguin',
    stock: 500,
    images: [
      { url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=800&fit=crop', alt: 'Atomic Habits Book', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=800&fit=crop', alt: 'Books Stack', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&h=800&fit=crop', alt: 'Reading Books', isPrimary: false },
    ],
    tags: ['book', 'self-help', 'habits', 'bestseller', 'motivation'],
    isFeatured: true,
    rating: 4.9,
    numReviews: 1234
  },
  {
    name: 'The Psychology of Money',
    description: 'Timeless lessons on wealth, greed, and happiness by Morgan Housel. A modern classic on finance and behavior.',
    shortDescription: 'Finance and behavior insights',
    price: 399,
    originalPrice: 599,
    category: categoryMap['Books'],
    brand: 'Jaico Publishing',
    stock: 400,
    images: [
      { url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?w=800&h=800&fit=crop', alt: 'Psychology of Money', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&h=800&fit=crop', alt: 'Book Stack', isPrimary: false },
    ],
    tags: ['book', 'finance', 'money', 'psychology', 'investing'],
    rating: 4.8,
    numReviews: 876
  },
  // Sports & Fitness
  {
    name: 'Fitbit Charge 6',
    description: 'Advanced health and fitness tracker with built-in GPS, heart rate monitoring, sleep tracking, and stress management.',
    shortDescription: 'Smart fitness tracker',
    price: 14999,
    originalPrice: 17999,
    category: categoryMap['Sports & Fitness'],
    brand: 'Fitbit',
    stock: 85,
    images: [
      { url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&h=800&fit=crop', alt: 'Fitbit Charge 6', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=800&h=800&fit=crop', alt: 'Smart Watch', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?w=800&h=800&fit=crop', alt: 'Fitness Tracker', isPrimary: false },
    ],
    tags: ['fitness', 'tracker', 'fitbit', 'health', 'wearable'],
    isFeatured: true,
    rating: 4.4,
    numReviews: 345
  },
  {
    name: 'Yoga Mat Premium 6mm',
    description: 'Eco-friendly TPE yoga mat with alignment lines. Non-slip surface, extra cushioning, and carrying strap included.',
    shortDescription: 'Premium eco-friendly yoga mat',
    price: 1499,
    originalPrice: 2499,
    category: categoryMap['Sports & Fitness'],
    brand: 'Boldfit',
    stock: 200,
    images: [
      { url: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=800&fit=crop', alt: 'Yoga Mat', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1575052814086-f385e2e2ad1b?w=800&h=800&fit=crop', alt: 'Yoga Practice', isPrimary: false },
    ],
    tags: ['yoga', 'fitness', 'mat', 'exercise', 'eco-friendly'],
    attributes: { color: ['Purple', 'Blue', 'Black', 'Green'] },
    rating: 4.3,
    numReviews: 567
  },
  {
    name: 'Adjustable Dumbbell Set 24kg',
    description: 'Space-saving adjustable dumbbells. Quick-change weight system from 2.5kg to 24kg. Perfect for home gym.',
    shortDescription: 'Adjustable home gym dumbbells',
    price: 12999,
    originalPrice: 16999,
    category: categoryMap['Sports & Fitness'],
    brand: 'Bowflex',
    stock: 45,
    images: [
      { url: 'https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=800&h=800&fit=crop', alt: 'Adjustable Dumbbells', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1534368959876-26bf04f2c947?w=800&h=800&fit=crop', alt: 'Dumbbells Gym', isPrimary: false },
    ],
    tags: ['dumbbells', 'weights', 'fitness', 'home-gym', 'strength'],
    rating: 4.6,
    numReviews: 234
  },
  // Beauty & Health
  {
    name: 'Dyson Supersonic Hair Dryer',
    description: 'Engineered for fast drying with no extreme heat. Intelligent heat control to protect hair from damage.',
    shortDescription: 'Premium intelligent hair dryer',
    price: 34900,
    originalPrice: 39900,
    category: categoryMap['Beauty & Health'],
    brand: 'Dyson',
    stock: 40,
    images: [
      { url: 'https://images.unsplash.com/photo-1522338140262-f46f5913618a?w=800&h=800&fit=crop', alt: 'Dyson Supersonic', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?w=800&h=800&fit=crop', alt: 'Hair Styling', isPrimary: false },
    ],
    tags: ['hairdryer', 'dyson', 'beauty', 'hair-care', 'premium'],
    isFeatured: true,
    rating: 4.7,
    numReviews: 456
  },
  {
    name: 'The Ordinary Skincare Set',
    description: 'Complete skincare routine with Niacinamide, Hyaluronic Acid, and Retinol. Science-backed formulas at affordable prices.',
    shortDescription: 'Science-based skincare routine',
    price: 2499,
    originalPrice: 3499,
    category: categoryMap['Beauty & Health'],
    brand: 'The Ordinary',
    stock: 150,
    images: [
      { url: 'https://images.unsplash.com/photo-1570194065650-d99fb4b8ccb0?w=800&h=800&fit=crop', alt: 'Skincare Set', isPrimary: true },
      { url: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&h=800&fit=crop', alt: 'Skincare Products', isPrimary: false },
      { url: 'https://images.unsplash.com/photo-1608248543803-ba4f8c70ae0b?w=800&h=800&fit=crop', alt: 'Skincare Routine', isPrimary: false },
    ],
    tags: ['skincare', 'beauty', 'serum', 'anti-aging', 'natural'],
    rating: 4.5,
    numReviews: 678
  }
];

// ===========================================
// SEEDER FUNCTIONS
// ===========================================

const importData = async () => {
  try {
    console.log('🌱 Starting database seeding...\n');

    // Clear existing data
    console.log('🗑️  Clearing existing data...');
    await Order.deleteMany();
    await Cart.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();

    // Create categories (one by one to trigger pre-save hooks)
    console.log('📁 Creating categories...');
    const categoryMap = {};
    for (const categoryData of categories) {
      const category = new Category(categoryData);
      await category.save();
      categoryMap[category.name] = category._id;
    }
    console.log(`   ✅ Created ${Object.keys(categoryMap).length} categories`);

    // Create users (passwords will be hashed by pre-save hook)
    console.log('👥 Creating users...');
    const createdUsers = [];
    for (const userData of users) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
    }
    console.log(`   ✅ Created ${createdUsers.length} users`);

    // Create products (one by one to trigger pre-save hooks for images)
    console.log('📦 Creating products...');
    const productsData = getProducts(categoryMap);
    const createdProducts = [];
    for (const productData of productsData) {
      const product = new Product(productData);
      await product.save();
      createdProducts.push(product);
    }
    console.log(`   ✅ Created ${createdProducts.length} products`);

    // Create empty carts for users
    console.log('🛒 Creating carts...');
    for (const user of createdUsers) {
      await Cart.create({ user: user._id, items: [] });
    }
    console.log(`   ✅ Created ${createdUsers.length} carts`);

    console.log('\n════════════════════════════════════════════');
    console.log('✅ DATABASE SEEDED SUCCESSFULLY!');
    console.log('════════════════════════════════════════════\n');
    console.log('📧 Test Accounts:');
    console.log('   Admin: admin@example.com / Admin@123');
    console.log('   User:  john@example.com / User@123');
    console.log('   User:  jane@example.com / User@123\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
};

const destroyData = async () => {
  try {
    console.log('🗑️  Destroying all data...\n');

    await Order.deleteMany();
    await Cart.deleteMany();
    await Product.deleteMany();
    await Category.deleteMany();
    await User.deleteMany();

    console.log('✅ All data destroyed successfully!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error destroying data:', error);
    process.exit(1);
  }
};

// Run based on command line argument
if (process.argv[2] === '-d') {
  destroyData();
} else {
  importData();
}
