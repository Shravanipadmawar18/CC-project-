/**
 * ===========================================
 * CHECKOUT PAGE
 * ===========================================
 * 
 * Checkout flow with shipping, payment, and order confirmation.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FiLock, FiCreditCard, FiTruck, FiUser } from 'react-icons/fi';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderService, paymentService } from '../services/api';
import { getProductImage } from '../utils/imageUtils';
import { formatPrice } from '../utils/currencyUtils';
import Loading from '../components/common/Loading';
import toast from 'react-hot-toast';
import './CheckoutPage.css';

// Initialize Stripe (use test key from env)
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');

// Card Element Styles
const cardStyle = {
  style: {
    base: {
      color: '#1f2937',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: '16px',
      '::placeholder': {
        color: '#9ca3af',
      },
    },
    invalid: {
      color: '#ef4444',
      iconColor: '#ef4444',
    },
  },
};

// Checkout Form Component
const CheckoutForm = () => {
  const navigate = useNavigate();
  const stripe = useStripe();
  const elements = useElements();
  const { user } = useAuth();
  const { cart, clearCart } = useCart();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'card'

  // Form State
  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    phone: ''
  });

  const [billingAddress, setBillingAddress] = useState({
    sameAsShipping: true,
    fullName: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States'
  });

  // Redirect if cart is empty
  useEffect(() => {
    if (cart.items.length === 0) {
      navigate('/cart');
    }
  }, [cart.items.length, navigate]);

  const handleShippingChange = (e) => {
    const { name, value } = e.target;
    setShippingAddress(prev => ({ ...prev, [name]: value }));
  };

  const handleBillingChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setBillingAddress(prev => ({ ...prev, [name]: checked }));
    } else {
      setBillingAddress(prev => ({ ...prev, [name]: value }));
    }
  };

  const validateShipping = () => {
    const { fullName, address, city, state, zipCode, phone } = shippingAddress;
    if (!fullName || !address || !city || !state || !zipCode || !phone) {
      toast.error('Please fill in all shipping fields');
      return false;
    }
    return true;
  };

  const handleContinueToPayment = () => {
    if (validateShipping()) {
      setStep(2);
    }
  };

  // Handle COD Order
  const handleCODOrder = async () => {
    setLoading(true);
    try {
      const orderData = {
        shippingAddress: {
          fullName: shippingAddress.fullName,
          address: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          zipCode: shippingAddress.zipCode,
          country: shippingAddress.country,
          phone: shippingAddress.phone
        },
        paymentMethod: 'cod'
      };

      const response = await orderService.createOrder(orderData);
      const order = response.data.data.order;

      // Clear cart
      await clearCart();

      toast.success('Order placed successfully!');
      navigate(`/order-confirmation/${order._id}`);
    } catch (error) {
      console.error('Order error:', error);
      toast.error(error.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // If COD payment method selected, process COD order
    if (paymentMethod === 'cod') {
      await handleCODOrder();
      return;
    }

    // Card payment flow
    if (!stripe || !elements) {
      toast.error('Payment system not ready. Please try again.');
      return;
    }

    if (!cardComplete) {
      toast.error('Please enter your card details');
      return;
    }

    setLoading(true);

    try {
      // Create payment intent
      const { data } = await paymentService.createPaymentIntent({
        amount: Math.round(cart.total * 100), // Convert to cents
        currency: 'usd'
      });

      const clientSecret = data.data.clientSecret;

      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: billingAddress.sameAsShipping ? shippingAddress.fullName : billingAddress.fullName,
            email: user.email
          }
        }
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      if (paymentIntent.status === 'succeeded') {
        // Create order
        const orderData = {
          shippingAddress,
          paymentMethod: 'stripe',
          paymentResult: {
            id: paymentIntent.id,
            status: paymentIntent.status,
            email: user.email
          }
        };

        const response = await orderService.createOrder(orderData);
        const order = response.data.data.order;

        // Clear cart
        await clearCart();

        // Redirect to confirmation
        toast.success('Order placed successfully!');
        navigate(`/order-confirmation/${order._id}`);
      }
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error.response?.data?.message || 'Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="checkout-layout">
      {/* Checkout Steps */}
      <div className="checkout-steps">
        <div className={`step ${step >= 1 ? 'active' : ''}`}>
          <div className="step-icon"><FiUser /></div>
          <span>Shipping</span>
        </div>
        <div className="step-line"></div>
        <div className={`step ${step >= 2 ? 'active' : ''}`}>
          <div className="step-icon"><FiCreditCard /></div>
          <span>Payment</span>
        </div>
      </div>

      <div className="checkout-content">
        {/* Checkout Form */}
        <div className="checkout-form-section">
          {step === 1 && (
            <div className="form-section">
              <h2><FiTruck /> Shipping Information</h2>
              
              <div className="form-grid">
                <div className="form-group full-width">
                  <label htmlFor="fullName">Full Name *</label>
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    value={shippingAddress.fullName}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="address">Street Address *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={shippingAddress.address}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="city">City *</label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={shippingAddress.city}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="state">State *</label>
                  <input
                    type="text"
                    id="state"
                    name="state"
                    value={shippingAddress.state}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="zipCode">ZIP Code *</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={shippingAddress.zipCode}
                    onChange={handleShippingChange}
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="country">Country *</label>
                  <select
                    id="country"
                    name="country"
                    value={shippingAddress.country}
                    onChange={handleShippingChange}
                  >
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Australia">Australia</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label htmlFor="phone">Phone Number *</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={shippingAddress.phone}
                    onChange={handleShippingChange}
                    required
                  />
                </div>
              </div>

              <button 
                type="button" 
                className="btn btn-primary btn-lg"
                onClick={handleContinueToPayment}
              >
                Continue to Payment
              </button>
            </div>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h2><FiCreditCard /> Payment Information</h2>

                {/* Billing Address */}
                <div className="billing-option">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="sameAsShipping"
                      checked={billingAddress.sameAsShipping}
                      onChange={handleBillingChange}
                    />
                    <span>Billing address same as shipping</span>
                  </label>
                </div>

                {!billingAddress.sameAsShipping && (
                  <div className="form-grid billing-form">
                    <div className="form-group full-width">
                      <label htmlFor="billingFullName">Full Name *</label>
                      <input
                        type="text"
                        id="billingFullName"
                        name="fullName"
                        value={billingAddress.fullName}
                        onChange={handleBillingChange}
                        required
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="billingAddress">Street Address *</label>
                      <input
                        type="text"
                        id="billingAddress"
                        name="address"
                        value={billingAddress.address}
                        onChange={handleBillingChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="billingCity">City *</label>
                      <input
                        type="text"
                        id="billingCity"
                        name="city"
                        value={billingAddress.city}
                        onChange={handleBillingChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="billingState">State *</label>
                      <input
                        type="text"
                        id="billingState"
                        name="state"
                        value={billingAddress.state}
                        onChange={handleBillingChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="billingZipCode">ZIP Code *</label>
                      <input
                        type="text"
                        id="billingZipCode"
                        name="zipCode"
                        value={billingAddress.zipCode}
                        onChange={handleBillingChange}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="billingCountry">Country *</label>
                      <select
                        id="billingCountry"
                        name="country"
                        value={billingAddress.country}
                        onChange={handleBillingChange}
                      >
                        <option value="United States">United States</option>
                        <option value="Canada">Canada</option>
                        <option value="United Kingdom">United Kingdom</option>
                        <option value="Australia">Australia</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Payment Method Selection */}
                <div className="payment-method-selection">
                  <label>Select Payment Method *</label>
                  <div className="payment-options">
                    <label className={`payment-option ${paymentMethod === 'cod' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="cod"
                        checked={paymentMethod === 'cod'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span className="option-content">
                        <FiTruck className="option-icon" />
                        <span className="option-text">
                          <strong>Cash on Delivery (COD)</strong>
                          <small>Pay when you receive your order</small>
                        </span>
                      </span>
                    </label>
                    <label className={`payment-option ${paymentMethod === 'card' ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="card"
                        checked={paymentMethod === 'card'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                      />
                      <span className="option-content">
                        <FiCreditCard className="option-icon" />
                        <span className="option-text">
                          <strong>Credit/Debit Card</strong>
                          <small>Pay securely with Stripe</small>
                        </span>
                      </span>
                    </label>
                  </div>
                </div>

                {/* Card Element - Only show if card payment selected */}
                {paymentMethod === 'card' && (
                  <div className="card-element-wrapper">
                    <label>Card Details *</label>
                    <div className="card-element">
                      <CardElement 
                        options={cardStyle}
                        onChange={(e) => setCardComplete(e.complete)}
                      />
                    </div>
                  </div>
                )}

                <div className="form-actions">
                  <button 
                    type="button" 
                    className="btn btn-outline"
                    onClick={() => setStep(1)}
                  >
                    Back to Shipping
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary btn-lg"
                    disabled={loading || (paymentMethod === 'card' && (!stripe || !cardComplete))}
                  >
                    {loading ? 'Processing...' : (
                      <>
                        <FiLock /> {paymentMethod === 'cod' ? 'Place Order' : `Pay ${formatPrice(cart.total)}`}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>

        {/* Order Summary */}
        <div className="checkout-summary">
          <h3>Order Summary</h3>

          <div className="summary-items">
            {cart.items.map((item) => (
              <div key={item.product._id} className="summary-item">
                <div className="summary-item-image">
                  <img src={getProductImage(item.product)} alt={item.product.name} />
                  <span className="item-qty">{item.quantity}</span>
                </div>
                <div className="summary-item-details">
                  <p className="item-name">{item.product?.name}</p>
                  <p className="item-price">{formatPrice((item.product?.price || 0) * item.quantity)}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="summary-totals">
            <div className="summary-row">
              <span>Subtotal</span>
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
          </div>
        </div>
      </div>
    </div>
  );
};

// Checkout Page Wrapper with Stripe Elements
const CheckoutPage = () => {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login', { state: { from: '/checkout' } });
    }
  }, [isAuthenticated, loading, navigate]);

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="checkout-page">
      <div className="container">
        <h1>Checkout</h1>
        <Elements stripe={stripePromise}>
          <CheckoutForm />
        </Elements>
      </div>
    </div>
  );
};

export default CheckoutPage;
