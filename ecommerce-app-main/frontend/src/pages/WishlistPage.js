/**
 * ===========================================
 * WISHLIST PAGE COMPONENT
 * Full wishlist management functionality
 * ===========================================
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { wishlistService, cartService } from '../services/api';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductImage } from '../utils/imageUtils';
import { formatPrice } from '../utils/currencyUtils';
import Loading from '../components/common/Loading';
import { FaHeart, FaShoppingCart, FaTrash, FaShoppingBag } from 'react-icons/fa';
import toast from 'react-hot-toast';
import './WishlistPage.css';

const WishlistPage = () => {
  const { user } = useAuth();
  const { fetchCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      const response = await wishlistService.getWishlist();
      // Backend returns { data: { wishlist: [...products] } }
      // Transform to { product: ... } format expected by the component
      const wishlist = response.data.data?.wishlist || response.data.wishlist || [];
      const formattedItems = wishlist.map(product => ({ product }));
      setWishlistItems(formattedItems);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFromWishlist = async (productId) => {
    setActionLoading((prev) => ({ ...prev, [productId]: 'remove' }));
    try {
      await wishlistService.removeFromWishlist(productId);
      setWishlistItems((prev) => prev.filter((item) => item.product._id !== productId));
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error('Failed to remove from wishlist');
    } finally {
      setActionLoading((prev) => ({ ...prev, [productId]: null }));
    }
  };

  const handleMoveToCart = async (product) => {
    if (product.stock === 0) {
      toast.error('Product is out of stock');
      return;
    }

    setActionLoading((prev) => ({ ...prev, [product._id]: 'move' }));
    try {
      await cartService.addToCart(product._id, 1);
      await wishlistService.removeFromWishlist(product._id);
      setWishlistItems((prev) => prev.filter((item) => item.product._id !== product._id));
      await fetchCart();
      toast.success('Moved to cart');
    } catch (error) {
      toast.error('Failed to move to cart');
    } finally {
      setActionLoading((prev) => ({ ...prev, [product._id]: null }));
    }
  };

  const handleClearWishlist = async () => {
    if (!window.confirm('Are you sure you want to clear your wishlist?')) return;

    setLoading(true);
    try {
      await wishlistService.clearWishlist();
      setWishlistItems([]);
      toast.success('Wishlist cleared');
    } catch (error) {
      toast.error('Failed to clear wishlist');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!user) {
    return (
      <div className="wishlist-page">
        <div className="container">
          <div className="wishlist-login-prompt">
            <FaHeart className="prompt-icon" />
            <h2>Sign in to view your wishlist</h2>
            <p>Save your favorite items and access them from any device</p>
            <Link to="/login?redirect=/wishlist" className="btn btn-primary">
              Sign In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="wishlist-page">
      <div className="container">
        {/* Page Header */}
        <div className="wishlist-header">
          <div>
            <h1>
              <FaHeart /> My Wishlist
            </h1>
            <p>{wishlistItems.length} {wishlistItems.length === 1 ? 'item' : 'items'}</p>
          </div>
          {wishlistItems.length > 0 && (
            <button className="btn btn-outline btn-sm" onClick={handleClearWishlist}>
              Clear All
            </button>
          )}
        </div>

        {/* Empty Wishlist */}
        {wishlistItems.length === 0 ? (
          <div className="wishlist-empty">
            <FaHeart className="empty-icon" />
            <h2>Your wishlist is empty</h2>
            <p>Start adding items you love to your wishlist</p>
            <Link to="/products" className="btn btn-primary">
              <FaShoppingBag /> Browse Products
            </Link>
          </div>
        ) : (
          <>
            {/* Wishlist Grid */}
            <div className="wishlist-grid">
              {wishlistItems.map((item) => (
                <div key={item.product._id} className="wishlist-card">
                  <Link to={`/products/${item.product._id}`} className="wishlist-image">
                    <img
                      src={getProductImage(item.product)}
                      alt={item.product.name}
                    />
                    {item.product.stock === 0 && (
                      <span className="out-of-stock-badge">Out of Stock</span>
                    )}
                  </Link>

                  <div className="wishlist-content">
                    <Link to={`/products/${item.product._id}`} className="wishlist-name">
                      {item.product.name}
                    </Link>

                    {item.product.brand && (
                      <p className="wishlist-brand">{item.product.brand}</p>
                    )}

                    <div className="wishlist-price">
                      {item.product.salePrice ? (
                        <>
                          <span className="sale-price">{formatPrice(item.product.salePrice)}</span>
                          <span className="original-price">{formatPrice(item.product.price)}</span>
                          <span className="discount">
                            {Math.round((1 - item.product.salePrice / item.product.price) * 100)}% OFF
                          </span>
                        </>
                      ) : (
                        <span className="current-price">{formatPrice(item.product.price)}</span>
                      )}
                    </div>

                    <div className="wishlist-actions">
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleMoveToCart(item.product)}
                        disabled={item.product.stock === 0 || actionLoading[item.product._id]}
                      >
                        {actionLoading[item.product._id] === 'move' ? (
                          'Moving...'
                        ) : (
                          <>
                            <FaShoppingCart /> Move to Cart
                          </>
                        )}
                      </button>
                      <button
                        className="btn btn-icon"
                        onClick={() => handleRemoveFromWishlist(item.product._id)}
                        disabled={actionLoading[item.product._id]}
                        title="Remove from wishlist"
                      >
                        <FaTrash />
                      </button>
                    </div>

                    <p className="added-date">
                      Added {new Date(item.addedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Continue Shopping */}
            <div className="wishlist-footer">
              <Link to="/products" className="btn btn-outline">
                Continue Shopping
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default WishlistPage;
