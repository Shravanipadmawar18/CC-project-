/**
 * ===========================================
 * ORDER DETAIL PAGE
 * ===========================================
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiPackage, FiTruck, FiCheckCircle, FiClock, FiMapPin, FiCreditCard, FiArrowLeft } from 'react-icons/fi';
import { orderService } from '../services/api';
import { getProductImage } from '../utils/imageUtils';
import { formatPrice } from '../utils/currencyUtils';
import Loading from '../components/common/Loading';
import './OrderDetailPage.css';

const OrderDetailPage = () => {
  const { id } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await orderService.getOrder(id);
        setOrder(response.data.data.order);
      } catch (error) {
        console.error('Failed to fetch order:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [id]);

  const getStatusIndex = (status) => {
    const statuses = ['pending', 'processing', 'shipped', 'delivered'];
    return statuses.indexOf(status);
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FiClock />,
      processing: <FiPackage />,
      shipped: <FiTruck />,
      delivered: <FiCheckCircle />
    };
    return icons[status] || <FiClock />;
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!order) {
    return (
      <div className="order-detail-page">
        <div className="container">
          <div className="order-not-found">
            <h2>Order not found</h2>
            <p>The order you're looking for doesn't exist.</p>
            <Link to="/orders" className="btn btn-primary">
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const currentStatusIndex = getStatusIndex(order.status);

  return (
    <div className="order-detail-page">
      <div className="container">
        {/* Back Link */}
        <Link to="/orders" className="back-link">
          <FiArrowLeft />
          Back to Orders
        </Link>

        {/* Order Header */}
        <div className="order-detail-header">
          <div>
            <h1>Order #{order.orderNumber || order._id.slice(-8).toUpperCase()}</h1>
            <p>Placed on {new Date(order.createdAt).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</p>
          </div>
          <span className={`order-status status-${order.status}`}>
            {order.status}
          </span>
        </div>

        {/* Order Progress */}
        {order.status !== 'cancelled' && (
          <div className="order-progress">
            <div className="progress-steps">
              {['pending', 'processing', 'shipped', 'delivered'].map((status, index) => (
                <div 
                  key={status}
                  className={`progress-step ${index <= currentStatusIndex ? 'completed' : ''} ${index === currentStatusIndex ? 'current' : ''}`}
                >
                  <div className="step-icon">
                    {getStatusIcon(status)}
                  </div>
                  <span className="step-label">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                </div>
              ))}
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${(currentStatusIndex / 3) * 100}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="order-detail-layout">
          {/* Order Items */}
          <div className="order-items-section">
            <h2><FiPackage /> Order Items</h2>
            <div className="order-items-list">
              {order.items?.map((item, index) => (
                <div key={index} className="order-item">
                  <Link to={`/product/${item.product?.slug}`} className="item-image">
                    <img 
                      src={getProductImage(item.product)} 
                      alt={item.product?.name || 'Product'} 
                    />
                  </Link>
                  <div className="item-info">
                    <Link to={`/product/${item.product?.slug}`} className="item-name">
                      {item.product?.name || 'Product'}
                    </Link>
                    <div className="item-meta">
                      <span>Qty: {item.quantity}</span>
                      <span>Price: {formatPrice(item.price)}</span>
                    </div>
                  </div>
                  <div className="item-total">
                    {formatPrice(item.quantity * item.price)}
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="order-summary-inline">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="summary-row discount">
                  <span>Discount</span>
                  <span>-{formatPrice(order.discount)}</span>
                </div>
              )}
              <div className="summary-row">
                <span>Shipping</span>
                <span>{order.shipping > 0 ? formatPrice(order.shipping) : 'Free'}</span>
              </div>
              <div className="summary-row">
                <span>Tax</span>
                <span>{formatPrice(order.tax)}</span>
              </div>
              <div className="summary-row total">
                <span>Total</span>
                <span>{formatPrice(order.total)}</span>
              </div>
            </div>
          </div>

          {/* Order Details Sidebar */}
          <div className="order-detail-sidebar">
            {/* Shipping Address */}
            <div className="detail-card">
              <h3><FiMapPin /> Shipping Address</h3>
              <div className="detail-content">
                <p><strong>{order.shippingAddress?.fullName}</strong></p>
                <p>{order.shippingAddress?.address}</p>
                <p>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
                </p>
                <p>{order.shippingAddress?.country}</p>
                <p>{order.shippingAddress?.phone}</p>
              </div>
            </div>

            {/* Payment Info */}
            <div className="detail-card">
              <h3><FiCreditCard /> Payment Information</h3>
              <div className="detail-content">
                <p><strong>Method:</strong> {order.paymentMethod?.toUpperCase() || 'Stripe'}</p>
                <p><strong>Status:</strong> <span className="paid-badge">Paid</span></p>
                {order.paymentResult?.id && (
                  <p className="payment-id"><strong>Transaction:</strong> {order.paymentResult.id}</p>
                )}
              </div>
            </div>

            {/* Need Help */}
            <div className="detail-card help-card">
              <h3>Need Help?</h3>
              <p>If you have questions about your order, please contact our support team.</p>
              <Link to="/contact" className="btn btn-outline btn-sm">
                Contact Support
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
