# 🛒 Full-Stack E-Commerce Application

A comprehensive, production-ready full-stack E-Commerce web application built with modern technologies and industry best practices. Features include user authentication, product management, shopping cart, secure payments, AI-powered recommendations, and a complete admin dashboard.

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![React](https://img.shields.io/badge/React-v18+-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-v6+-brightgreen)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Admin Dashboard](#admin-dashboard)
- [AI Recommendations](#ai-recommendations)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

### Customer Features
- **User Authentication**: Secure registration and login with JWT tokens
- **Product Browsing**: Filter by category, price range, rating, and search
- **Product Details**: Image gallery, specifications, reviews, and ratings
- **Shopping Cart**: Add, update, remove items with persistent storage
- **Wishlist**: Save favorite products for later
- **Secure Checkout**: Multi-step checkout with Stripe payment integration
- **Order Management**: View order history, track order status
- **AI Recommendations**: Personalized product recommendations based on browsing and purchase history
- **User Profile**: Update personal information and change password
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

### Admin Features
- **Dashboard**: Overview with statistics, charts, and recent activity
- **Product Management**: Full CRUD operations with image upload
- **Category Management**: Create, edit, and delete product categories
- **Order Management**: View all orders, update order status
- **User Management**: View users, update roles, manage accounts
- **Inventory Tracking**: Monitor stock levels and low-stock alerts

## 🛠 Tech Stack

### Frontend
- **React 18** - UI library with functional components and hooks
- **React Router v6** - Client-side routing
- **Context API** - State management for auth and cart
- **Axios** - HTTP client for API requests
- **React Icons** - Icon library
- **React Hot Toast** - Toast notifications
- **Stripe Elements** - Payment form components

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **MongoDB** - NoSQL database
- **Mongoose** - ODM for MongoDB
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **Multer** - File upload handling
- **Stripe** - Payment processing

### Security
- **Helmet** - Security headers
- **express-rate-limit** - Rate limiting
- **express-validator** - Input validation
- **CORS** - Cross-origin resource sharing

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** (v9 or higher) or **yarn**
- **MongoDB** (v6 or higher) - Local installation or MongoDB Atlas
- **Git**

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ecommerce-app.git
cd ecommerce-app
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# MongoDB Configuration (Local)
MONGODB_URI=mongodb://localhost:27017/ecommerce

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_change_in_production
JWT_EXPIRE=30d

# Stripe Configuration (Test Mode)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000
```

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
```

### Stripe Setup

1. Create a [Stripe account](https://stripe.com)
2. Get your test API keys from the Stripe Dashboard
3. Add the secret key to backend `.env`
4. Add the publishable key to frontend `.env`

## 🏃 Running the Application

### Development Mode

#### Start MongoDB (if running locally)

```bash
# Windows
mongod

# macOS/Linux
sudo systemctl start mongod
```

#### Seed the Database (Optional)

```bash
cd backend
npm run seed
```

This will populate the database with sample categories, products, and a demo admin user.

#### Start the Backend Server

```bash
cd backend
npm run dev
```

The backend will run on `http://localhost:5000`

#### Start the Frontend Development Server

```bash
cd frontend
npm start
```

The frontend will run on `http://localhost:3000`

### Production Mode

#### Build the Frontend

```bash
cd frontend
npm run build
```

#### Start the Production Server

```bash
cd backend
npm start
```

## 📁 Project Structure

```
ecommerce-app/
├── backend/
│   ├── config/
│   │   ├── db.js              # Database connection
│   │   └── seeder.js          # Database seeder
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── productController.js
│   │   ├── categoryController.js
│   │   ├── cartController.js
│   │   ├── orderController.js
│   │   ├── paymentController.js
│   │   ├── adminController.js
│   │   ├── recommendationController.js
│   │   └── userController.js
│   ├── middleware/
│   │   ├── auth.js            # JWT authentication
│   │   ├── error.js           # Error handling
│   │   ├── validate.js        # Input validation
│   │   └── upload.js          # File upload
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Category.js
│   │   ├── Cart.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── categoryRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── orderRoutes.js
│   │   ├── paymentRoutes.js
│   │   ├── adminRoutes.js
│   │   ├── recommendationRoutes.js
│   │   └── userRoutes.js
│   ├── uploads/               # Uploaded images
│   ├── server.js              # Entry point
│   └── package.json
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   ├── Loading.js
│   │   │   │   ├── Pagination.js
│   │   │   │   └── ProductCard.js
│   │   │   └── layout/
│   │   │       ├── Header.js
│   │   │       └── Footer.js
│   │   ├── context/
│   │   │   ├── AuthContext.js
│   │   │   └── CartContext.js
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   │   ├── AdminDashboard.js
│   │   │   │   ├── AdminProducts.js
│   │   │   │   ├── AdminProductForm.js
│   │   │   │   ├── AdminOrders.js
│   │   │   │   ├── AdminUsers.js
│   │   │   │   └── AdminCategories.js
│   │   │   ├── HomePage.js
│   │   │   ├── ProductsPage.js
│   │   │   ├── ProductDetailPage.js
│   │   │   ├── CartPage.js
│   │   │   ├── CheckoutPage.js
│   │   │   ├── LoginPage.js
│   │   │   ├── RegisterPage.js
│   │   │   ├── ProfilePage.js
│   │   │   ├── OrdersPage.js
│   │   │   ├── OrderDetailPage.js
│   │   │   ├── WishlistPage.js
│   │   │   └── SearchPage.js
│   │   ├── services/
│   │   │   └── api.js         # API service modules
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   └── index.css          # Global styles & CSS variables
│   └── package.json
│
└── README.md
```

## 📖 API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/logout` | Logout user |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get all products (with filters) |
| GET | `/api/products/:id` | Get single product |
| GET | `/api/products/featured` | Get featured products |
| GET | `/api/products/:id/reviews` | Get product reviews |
| POST | `/api/products/:id/reviews` | Add product review |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/:id` | Get single category |

### Cart

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/cart` | Get user's cart |
| POST | `/api/cart` | Add item to cart |
| PUT | `/api/cart/:itemId` | Update cart item quantity |
| DELETE | `/api/cart/:itemId` | Remove item from cart |
| DELETE | `/api/cart` | Clear cart |

### Orders

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | Get user's orders |
| GET | `/api/orders/:id` | Get single order |
| POST | `/api/orders` | Create new order |

### Payments

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payments/create-payment-intent` | Create Stripe payment intent |
| POST | `/api/payments/webhook` | Handle Stripe webhooks |

### Recommendations

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/recommendations` | Get personalized recommendations |
| GET | `/api/recommendations/similar/:productId` | Get similar products |

### Admin Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard` | Get dashboard statistics |
| GET | `/api/admin/products` | Get all products (admin) |
| POST | `/api/admin/products` | Create product |
| PUT | `/api/admin/products/:id` | Update product |
| DELETE | `/api/admin/products/:id` | Delete product |
| GET | `/api/admin/orders` | Get all orders |
| PUT | `/api/admin/orders/:id/status` | Update order status |
| GET | `/api/admin/users` | Get all users |
| PUT | `/api/admin/users/:id/role` | Update user role |
| DELETE | `/api/admin/users/:id` | Delete user |
| POST | `/api/admin/categories` | Create category |
| PUT | `/api/admin/categories/:id` | Update category |
| DELETE | `/api/admin/categories/:id` | Delete category |

## 👨‍💼 Admin Dashboard

Access the admin dashboard at `/admin` (requires admin role).

### Default Admin Credentials (after seeding)

```
Email: admin@example.com
Password: admin123
```

### Dashboard Features

- **Overview**: Total revenue, orders, products, users
- **Order Status Summary**: Pending, processing, shipped, delivered
- **Recent Orders**: Latest orders with quick status updates
- **Recent Users**: Newly registered customers
- **Product Management**: Add, edit, delete products with images
- **Category Management**: Organize products into categories
- **User Management**: View and manage user accounts

## 🤖 AI Recommendations

The application includes an AI-powered recommendation system that uses a hybrid approach:

### Collaborative Filtering
- Analyzes purchase patterns across users
- Recommends products that similar users have bought
- Improves recommendations as more data is collected

### Content-Based Filtering
- Analyzes product attributes (category, tags, brand)
- Recommends similar products based on user's browsing history
- Works well for new users with limited purchase history

### Implementation

The recommendation engine calculates scores based on:
- User's purchase history
- Product views
- Category preferences
- Similarity with other users
- Product popularity and ratings

## 🚀 Deployment

### Deploy to Heroku

1. Create a Heroku account and install Heroku CLI
2. Create a new Heroku app

```bash
heroku create your-app-name
```

3. Set environment variables

```bash
heroku config:set NODE_ENV=production
heroku config:set MONGODB_URI=your_mongodb_atlas_uri
heroku config:set JWT_SECRET=your_production_jwt_secret
heroku config:set STRIPE_SECRET_KEY=sk_live_your_stripe_key
```

4. Deploy

```bash
git push heroku main
```

### Deploy to AWS/DigitalOcean/VPS

1. Set up Node.js environment
2. Install and configure Nginx as reverse proxy
3. Set up SSL certificate (Let's Encrypt)
4. Use PM2 for process management

```bash
npm install -g pm2
pm2 start server.js --name "ecommerce-api"
pm2 startup
pm2 save
```

### MongoDB Atlas Setup

1. Create a [MongoDB Atlas](https://www.mongodb.com/atlas) account
2. Create a new cluster
3. Create a database user
4. Get the connection string
5. Update `MONGODB_URI` in production environment

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code Style

- Use ES6+ syntax
- Follow React best practices (functional components, hooks)
- Write meaningful commit messages
- Add comments for complex logic

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [Stripe Documentation](https://stripe.com/docs)
- [React Icons](https://react-icons.github.io/react-icons/)

---

Made with ❤️ by Your Name

For support, email support@yourstore.com or open an issue on GitHub.
