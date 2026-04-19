/**
 * ===========================================
 * CART PAGE
 * ===========================================
 * 
 * Shopping cart view with items, quantity controls, and checkout.
 */

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiTrash2, FiMinus, FiPlus, FiShoppingBag, FiTag } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { getProductImage } from '../utils/imageUtils';
import { formatPrice } from '../utils/currencyUtils';
import { CartItemImage } from '../components/common/ProductImage';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';
import './CartPage.css';

const CartPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { 
    cart, 
    loading, 
    updateQuantity, 
    removeFromCart, 
    clearCart,
    applyCoupon,
    removeCoupon 
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleQuantityChange = async (productId, newQuantity, stock) => {
    if (newQuantity < 1) {
      return;
    }
    if (newQuantity > stock) {
      toast.error(`Only ${stock} items available`);
      return;
    }
    await updateQuantity(productId, newQuantity);
  };

  const handleRemoveItem = async (productId, productName) => {
    await removeFromCart(productId);
    toast.success(`${productName} removed from cart`);
  };

  const handleClearCart = async () => {
    if (window.confirm('Are you sure you want to clear your cart?')) {
      await clearCart();
      toast.success('Cart cleared');
    }
  };

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode.trim()) {
      toast.error('Please enter a coupon code');
      return;
    }

    setApplyingCoupon(true);
    const success = await applyCoupon(couponCode.trim());
    if (success) {
      toast.success('Coupon applied successfully');
      setCouponCode('');
    }
    setApplyingCoupon(false);
  };

  const handleRemoveCoupon = async () => {
    await removeCoupon();
    toast.success('Coupon removed');
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      toast.error('Please login to checkout');
      navigate('/login', { state: { from: '/checkout' } });
      return;
    }
    navigate('/checkout');
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (cart.items.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty">
            <FiShoppingBag className="empty-icon" />
            <h2>Your cart is empty</h2>
            <p>Looks like you haven't added any products yet.</p>
            <Link to="/products" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <div className="container">
        <h1>Shopping Cart</h1>

        <div className="cart-layout">
          {/* Cart Items */}
          <div className="cart-items">
            <div className="cart-header">
              <span className="cart-header-product">Product</span>
              <span className="cart-header-price">Price</span>
              <span className="cart-header-quantity">Quantity</span>
              <span className="cart-header-total">Total</span>
              <span className="cart-header-action"></span>
            </div>

            {cart.items.map((item) => {
              if (!item.product) return null;
              return (
              <div key={item.product._id} className="cart-item">
                <div className="cart-item-product">
                  <Link to={`/products/${item.product.slug || item.product._id}`} className="item-image">
                    <CartItemImage 
                      src={getProductImage(item.product)} 
                      alt={item.product.name}
                      size="md"
                    />
                  </Link>
                  <div className="item-details">
                    <Link to={`/products/${item.product.slug || item.product._id}`} className="item-name">
                      {item.product.name}
                    </Link>
                    <p className="item-stock">
                      {(item.product.stock || 0) > 0 ? (
                        <span className="in-stock">In Stock</span>
                      ) : (
                        <span className="out-of-stock">Out of Stock</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="cart-item-price">
                  {formatPrice(item.product.price)}
                </div>

                <div className="cart-item-quantity">
                  <div className="quantity-selector">
                    <button 
                      onClick={() => handleQuantityChange(item.product._id, item.quantity - 1, item.product.stock || 0)}
                      disabled={item.quantity <= 1}
                    >
                      <FiMinus />
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item.product._id, item.quantity + 1, item.product.stock || 0)}
                      disabled={item.quantity >= (item.product.stock || 0)}
                    >
                      <FiPlus />
                    </button>
                  </div>
                </div>

                <div className="cart-item-total">
                  {formatPrice((item.product.price || 0) * item.quantity)}
                </div>

                <div className="cart-item-action">
                  <button 
                    className="remove-btn"
                    onClick={() => handleRemoveItem(item.product._id, item.product.name)}
                    title="Remove item"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            )})}

            <div className="cart-actions">
              <Link to="/products" className="btn btn-outline">
                Continue Shopping
              </Link>
              <button className="btn btn-danger-outline" onClick={handleClearCart}>
                Clear Cart
              </button>
            </div>
          </div>

          {/* Cart Summary */}
          <div className="cart-summary">
            <h2>Order Summary</h2>

            <div className="summary-row">
              <span>Subtotal ({cart.totalItems || 0} items)</span>
              <span>{formatPrice(cart.subtotal || 0)}</span>
            </div>

            {(cart.discount || 0) > 0 && (
              <div className="summary-row discount">
                <span>Discount</span>
                <span>-{formatPrice(cart.discount || 0)}</span>
              </div>
            )}

            <div className="summary-row">
              <span>Shipping</span>
              <span>{(cart.shipping || 0) > 0 ? formatPrice(cart.shipping || 0) : 'Free'}</span>
            </div>

            <div className="summary-row">
              <span>Tax</span>
              <span>{formatPrice(cart.tax || 0)}</span>
            </div>

            <div className="summary-divider"></div>

            <div className="summary-row total">
              <span>Total</span>
              <span>{formatPrice(cart.total || 0)}</span>
            </div>

            {/* Coupon */}
            <div className="coupon-section">
              {cart.coupon ? (
                <div className="coupon-applied">
                  <div className="coupon-info">
                    <FiTag />
                    <span>{cart.coupon.code}</span>
                  </div>
                  <button className="remove-coupon" onClick={handleRemoveCoupon}>
                    Remove
                  </button>
                </div>
              ) : (
                <form className="coupon-form" onSubmit={handleApplyCoupon}>
                  <input
                    type="text"
                    placeholder="Coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button type="submit" className="btn btn-outline" disabled={applyingCoupon}>
                    {applyingCoupon ? 'Applying...' : 'Apply'}
                  </button>
                </form>
              )}
            </div>

            <button className="btn btn-primary btn-lg checkout-btn" onClick={handleCheckout}>
              Proceed to Checkout
            </button>

            <p className="secure-checkout">
              🔒 Secure checkout powered by Stripe
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
