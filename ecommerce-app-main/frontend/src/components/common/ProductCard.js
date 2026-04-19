/**
 * ===========================================
 * PRODUCT CARD COMPONENT
 * ===========================================
 * 
 * Reusable product card for listings with:
 * - Lazy loading images
 * - Fallback image handling
 * - Amazon-style card design
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FiHeart, FiShoppingCart, FiEye, FiStar } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { userService } from '../../services/api';
import { getProductImage } from '../../utils/imageUtils';
import { formatPrice } from '../../utils/currencyUtils';
import ProductImage from './ProductImage';
import toast from 'react-hot-toast';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const { addToCart } = useCart();
  const [isWishlisted, setIsWishlisted] = useState(product?.isWishlisted || false);

  // Return null if product is undefined
  if (!product) return null;

  const {
    _id,
    name,
    slug,
    price = 0,
    compareAtPrice = 0,
    rating = 0,
    numReviews = 0,
    stock = 0,
    isFeatured = false
  } = product;

  // Get the product image URL with fallback handling
  const imageUrl = getProductImage(product);
  const imageCount = product.images?.length || 1;

  const discount = compareAtPrice > price 
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) 
    : 0;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (stock === 0) {
      toast.error('This product is out of stock');
      return;
    }

    const success = await addToCart(_id, 1);
    if (success) {
      toast.success(`${name} added to cart`);
    }
  };

  const handleToggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      return;
    }

    try {
      if (isWishlisted) {
        await userService.removeFromWishlist(_id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await userService.addToWishlist(_id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update wishlist');
    }
  };

  return (
    <div className="product-card">
      <Link to={`/products/${slug || _id}`} className="product-card-link">
        {/* Image with lazy loading */}
        <div className="product-card-image">
          <ProductImage
            src={imageUrl}
            alt={name}
            aspectRatio="1/1"
            lazy={true}
            showSkeleton={true}
          />
          
          {/* Image count badge */}
          {imageCount > 1 && (
            <span className="image-count-badge">{imageCount} photos</span>
          )}
          
          {/* Badges */}
          <div className="product-card-badges">
            {discount > 0 && (
              <span className="badge badge-sale">-{discount}%</span>
            )}
            {isFeatured && (
              <span className="badge badge-featured">Featured</span>
            )}
            {stock === 0 && (
              <span className="badge badge-out">Out of Stock</span>
            )}
          </div>

          {/* Quick Actions */}
          <div className="product-card-actions">
            <button
              className={`action-btn ${isWishlisted ? 'active' : ''}`}
              onClick={handleToggleWishlist}
              title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <FiHeart />
            </button>
            <Link to={`/products/${slug || _id}`} className="action-btn" title="Quick view">
              <FiEye />
            </Link>
            <button
              className="action-btn"
              onClick={handleAddToCart}
              disabled={stock === 0}
              title="Add to cart"
            >
              <FiShoppingCart />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="product-card-content">
          <h3 className="product-card-title">{name}</h3>
          
          {/* Rating */}
          <div className="product-card-rating">
            <div className="stars">
              {[...Array(5)].map((_, index) => (
                <FiStar
                  key={index}
                  className={index < Math.round(rating) ? 'star filled' : 'star'}
                />
              ))}
            </div>
            <span className="rating-text">
              {rating?.toFixed(1)} ({numReviews} reviews)
            </span>
          </div>

          {/* Price */}
          <div className="product-card-price">
            <span className="current-price">{formatPrice(price)}</span>
            {compareAtPrice > price && (
              <span className="compare-price">{formatPrice(compareAtPrice)}</span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};

export default ProductCard;
