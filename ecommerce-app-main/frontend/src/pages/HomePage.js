/**
 * ===========================================
 * HOME PAGE
 * ===========================================
 * 
 * Landing page with hero, featured products, and categories.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowRight, FiTruck, FiShield, FiRefreshCw, FiHeadphones } from 'react-icons/fi';
import { productService, categoryService, recommendationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getCategoryImage } from '../utils/imageUtils';
import ProductCard from '../components/common/ProductCard';
import ProductImage from '../components/common/ProductImage';
import Loading from '../components/common/Loading';
import './HomePage.css';

const HomePage = () => {
  const { isAuthenticated } = useAuth();
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [categories, setCategories] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [featuredRes, newRes, categoriesRes] = await Promise.all([
          productService.getProducts({ isFeatured: true, limit: 8 }),
          productService.getProducts({ sort: '-createdAt', limit: 8 }),
          categoryService.getCategories()
        ]);

        setFeaturedProducts(featuredRes.data.data.products);
        setNewArrivals(newRes.data.data.products);
        setCategories(categoriesRes.data.data.categories);

        // Fetch personalized recommendations if authenticated
        if (isAuthenticated) {
          try {
            const recRes = await recommendationService.getPersonalized(8);
            setRecommendations(recRes.data.data.products);
          } catch (error) {
            console.error('Failed to fetch recommendations:', error);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Shop the Best <span>Products</span> for Your Lifestyle
            </h1>
            <p className="hero-description">
              Discover amazing deals on electronics, fashion, home goods, and more. 
              Quality products delivered right to your doorstep.
            </p>
            <div className="hero-buttons">
              <Link to="/products" className="btn btn-primary btn-lg">
                Shop Now <FiArrowRight />
              </Link>
              <Link to="/products?isFeatured=true" className="btn btn-outline btn-lg">
                View Featured
              </Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="/images/hero_image.webp" alt="Shopping" />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <FiTruck />
              </div>
              <h3>Free Shipping</h3>
              <p>On orders over $100</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiShield />
              </div>
              <h3>Secure Payment</h3>
              <p>100% secure checkout</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiRefreshCw />
              </div>
              <h3>Easy Returns</h3>
              <p>30-day return policy</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <FiHeadphones />
              </div>
              <h3>24/7 Support</h3>
              <p>Dedicated support team</p>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="section categories-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Shop by Category</h2>
            <Link to="/products" className="section-link">
              View All <FiArrowRight />
            </Link>
          </div>
          <div className="categories-grid">
            {categories.slice(0, 6).map((category) => (
              <Link
                key={category._id}
                to={`/category/${category.slug}`}
                className="category-card"
              >
                <div className="category-icon">
                  {category.image ? (
                    <img src={category.image} alt={category.name} />
                  ) : (
                    <span>{category.name.charAt(0)}</span>
                  )}
                </div>
                <h3>{category.name}</h3>
                <p>{category.productCount || 0} Products</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Featured Products</h2>
            <Link to="/products?isFeatured=true" className="section-link">
              View All <FiArrowRight />
            </Link>
          </div>
          <div className="products-grid">
            {featuredProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Personalized Recommendations */}
      {isAuthenticated && recommendations.length > 0 && (
        <section className="section section-alt">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Recommended for You</h2>
              <p className="section-subtitle">Based on your browsing history</p>
            </div>
            <div className="products-grid">
              {recommendations.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* New Arrivals */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">New Arrivals</h2>
            <Link to="/products?sort=-createdAt" className="section-link">
              View All <FiArrowRight />
            </Link>
          </div>
          <div className="products-grid">
            {newArrivals.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Start Shopping?</h2>
            <p>Join thousands of happy customers and find your perfect products today.</p>
            <Link to="/register" className="btn btn-white btn-lg">
              Create an Account <FiArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
