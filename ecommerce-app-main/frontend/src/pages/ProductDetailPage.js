/**
 * ===========================================
 * PRODUCT DETAIL PAGE
 * ===========================================
 * 
 * Individual product view with images, details, and reviews.
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  FiStar, FiHeart, FiShoppingCart, FiMinus, FiPlus, 
  FiTruck, FiShield, FiRefreshCw, FiChevronRight 
} from 'react-icons/fi';
import { productService, userService, recommendationService } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { getProductImages } from '../utils/imageUtils';
import { formatPrice } from '../utils/currencyUtils';
import { ProductGallery } from '../components/common/ProductImage';
import ProductCard from '../components/common/ProductCard';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';
import './ProductDetailPage.css';

const ProductDetailPage = () => {
  // Note: Route param is "id" but can be either ObjectId or slug
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  
  // Review form
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      try {
        const response = await productService.getProduct(id);
        // Handle different response formats
        const productData = response.data.data?.product || response.data.product || response.data;
        setProduct(productData);
        setIsWishlisted(productData.isWishlisted || false);

        // Track view for recommendations
        if (isAuthenticated) {
          try {
            await recommendationService.trackView(productData._id);
          } catch (error) {
            // Silent fail
          }
        }

        // Fetch similar products
        try {
          const similarRes = await recommendationService.getSimilar(productData._id, 4);
          const similarData = similarRes.data.data?.products || similarRes.data.products || [];
          setSimilarProducts(similarData);
        } catch (error) {
          console.error('Failed to fetch similar products:', error);
        }
      } catch (error) {
        console.error('Failed to fetch product:', error);
        toast.error('Product not found');
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id, isAuthenticated, navigate]);

  const handleQuantityChange = (delta) => {
    const newQuantity = quantity + delta;
    if (newQuantity >= 1 && newQuantity <= (product?.stock || 10)) {
      setQuantity(newQuantity);
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    const success = await addToCart(product._id, quantity);
    if (success) {
      toast.success(`${product.name} added to cart`);
    }
  };

  const handleBuyNow = async () => {
    const success = await addToCart(product._id, quantity);
    if (success) {
      navigate('/checkout');
    }
  };

  const handleToggleWishlist = async () => {
    if (!isAuthenticated) {
      toast.error('Please login to add to wishlist');
      navigate('/login');
      return;
    }

    try {
      if (isWishlisted) {
        await userService.removeFromWishlist(product._id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await userService.addToWishlist(product._id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update wishlist');
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      toast.error('Please login to write a review');
      navigate('/login');
      return;
    }

    if (!reviewComment.trim()) {
      toast.error('Please write a comment');
      return;
    }

    setSubmittingReview(true);
    try {
      await productService.addReview(product._id, {
        rating: reviewRating,
        comment: reviewComment
      });

      // Refresh product to get updated reviews
      const response = await productService.getProduct(id);
      const updatedProduct = response.data.data?.product || response.data.product || response.data;
      setProduct(updatedProduct);
      
      setShowReviewForm(false);
      setReviewComment('');
      setReviewRating(5);
      toast.success('Review submitted successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to submit review');
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!product) {
    return null;
  }

  const discount = product.compareAtPrice > product.price
    ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
    : 0;

  const hasReviewed = product.reviews?.some(r => r.user?._id === user?._id);

  return (
    <div className="product-detail-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <FiChevronRight />
          <Link to="/products">Products</Link>
          <FiChevronRight />
          {product.category && (
            <>
              <Link to={`/category/${product.category.slug}`}>{product.category.name}</Link>
              <FiChevronRight />
            </>
          )}
          <span>{product.name}</span>
        </nav>

        {/* Product Main Section */}
        <div className="product-main">
          {/* Images - Amazon-style gallery */}
          <div className="product-images">
            <ProductGallery
              images={getProductImages(product)}
              productName={product.name}
            />
            {discount > 0 && (
              <span className="discount-badge">-{discount}%</span>
            )}
          </div>

          {/* Product Info - Middle Column */}
          <div className="product-info">
            <h1 className="product-title">{product.name}</h1>

            {/* Rating */}
            <div className="product-rating">
              <div className="stars">
                {[...Array(5)].map((_, index) => (
                  <FiStar
                    key={index}
                    className={index < Math.round(product.rating) ? 'star filled' : 'star'}
                  />
                ))}
              </div>
              <span className="rating-text">
                {product.rating?.toFixed(1)} ({product.numReviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="product-price">
              <span className="current-price">{formatPrice(product.price)}</span>
              {product.compareAtPrice > product.price && (
                <span className="compare-price">{formatPrice(product.compareAtPrice)}</span>
              )}
              {discount > 0 && (
                <span className="save-badge">Save {discount}%</span>
              )}
            </div>

            {/* Short Description */}
            <p className="product-short-desc">{product.shortDescription || product.description?.substring(0, 200)}</p>

            {/* Meta Info */}
            <div className="product-meta">
              <p><strong>SKU:</strong> {product.sku}</p>
              <p><strong>Category:</strong> <Link to={`/category/${product.category?.slug}`}>{product.category?.name}</Link></p>
              {product.brand && <p><strong>Brand:</strong> {product.brand}</p>}
              {product.tags?.length > 0 && (
                <p><strong>Tags:</strong> {product.tags.join(', ')}</p>
              )}
            </div>
          </div>

          {/* Buy Box - Right Column */}
          <div className="product-buy-box">
            {/* Price in buy box */}
            <div className="buy-box-price">
              <span className="current-price">{formatPrice(product.price)}</span>
            </div>

            {/* Stock Status */}
            <div className="stock-status">
              {product.stock > 0 ? (
                <span className="in-stock">✓ In Stock ({product.stock} available)</span>
              ) : (
                <span className="out-of-stock">✗ Out of Stock</span>
              )}
            </div>

            {/* Quantity Selector */}
            <div className="quantity-section">
              <label>Quantity:</label>
              <div className="quantity-selector">
                <button onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1}>
                  <FiMinus />
                </button>
                <span>{quantity}</span>
                <button onClick={() => handleQuantityChange(1)} disabled={quantity >= product.stock}>
                  <FiPlus />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="product-actions">
              <button
                className="btn btn-primary btn-lg add-to-cart"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <FiShoppingCart />
                Add to Cart
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={handleBuyNow}
                disabled={product.stock === 0}
              >
                Buy Now
              </button>
            </div>

            {/* Wishlist */}
            <button
              className={`btn btn-outline wishlist-btn ${isWishlisted ? 'active' : ''}`}
              onClick={handleToggleWishlist}
            >
              <FiHeart />
              {isWishlisted ? 'Remove from Wishlist' : 'Add to Wishlist'}
            </button>

            {/* Features */}
            <div className="product-features">
              <div className="feature">
                <FiTruck />
                <div>
                  <strong>Free Shipping</strong>
                  <span>On orders over ₹1000</span>
                </div>
              </div>
              <div className="feature">
                <FiShield />
                <div>
                  <strong>Secure Payment</strong>
                  <span>100% secure checkout</span>
                </div>
              </div>
              <div className="feature">
                <FiRefreshCw />
                <div>
                  <strong>Easy Returns</strong>
                  <span>30-day return policy</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="product-tabs">
          <div className="tabs-header">
            <button
              className={activeTab === 'description' ? 'active' : ''}
              onClick={() => setActiveTab('description')}
            >
              Description
            </button>
            <button
              className={activeTab === 'reviews' ? 'active' : ''}
              onClick={() => setActiveTab('reviews')}
            >
              Reviews ({product.numReviews})
            </button>
          </div>

          <div className="tabs-content">
            {activeTab === 'description' && (
              <div className="tab-description">
                <p>{product.description}</p>
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="tab-reviews">
                {/* Review Summary */}
                <div className="reviews-summary">
                  <div className="rating-overview">
                    <span className="rating-number">{product.rating?.toFixed(1)}</span>
                    <div className="rating-stars">
                      {[...Array(5)].map((_, index) => (
                        <FiStar
                          key={index}
                          className={index < Math.round(product.rating) ? 'star filled' : 'star'}
                        />
                      ))}
                    </div>
                    <span className="rating-count">Based on {product.numReviews} reviews</span>
                  </div>

                  {isAuthenticated && !hasReviewed && (
                    <button
                      className="btn btn-primary"
                      onClick={() => setShowReviewForm(!showReviewForm)}
                    >
                      Write a Review
                    </button>
                  )}
                </div>

                {/* Review Form */}
                {showReviewForm && (
                  <form className="review-form" onSubmit={handleSubmitReview}>
                    <div className="form-group">
                      <label>Your Rating</label>
                      <div className="rating-input">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            className={star <= reviewRating ? 'active' : ''}
                            onClick={() => setReviewRating(star)}
                          >
                            <FiStar />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="form-group">
                      <label>Your Review</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Write your review here..."
                        rows={4}
                        required
                      />
                    </div>
                    <div className="form-actions">
                      <button type="submit" className="btn btn-primary" disabled={submittingReview}>
                        {submittingReview ? 'Submitting...' : 'Submit Review'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => setShowReviewForm(false)}
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                {/* Reviews List */}
                <div className="reviews-list">
                  {product.reviews?.length === 0 ? (
                    <p className="no-reviews">No reviews yet. Be the first to review!</p>
                  ) : (
                    product.reviews?.map((review) => (
                      <div key={review._id} className="review-card">
                        <div className="review-header">
                          <div className="review-user">
                            <div className="user-avatar">
                              {review.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <strong>{review.user?.name || 'Anonymous'}</strong>
                              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                          <div className="review-rating">
                            {[...Array(5)].map((_, index) => (
                              <FiStar
                                key={index}
                                className={index < review.rating ? 'star filled' : 'star'}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="review-comment">{review.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Similar Products */}
        {similarProducts.length > 0 && (
          <section className="similar-products">
            <h2>You May Also Like</h2>
            <div className="products-grid">
              {similarProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ProductDetailPage;
