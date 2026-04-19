/**
 * ===========================================
 * ORDER CONFIRMATION PAGE
 * ===========================================
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FiCheckCircle, FiPackage, FiMail, FiMapPin } from 'react-icons/fi';
import { orderService } from '../services/api';
import { getProductImage } from '../utils/imageUtils';
import { formatPrice } from '../utils/currencyUtils';
import Loading from '../components/common/Loading';
import './OrderConfirmationPage.css';

const OrderConfirmationPage = () => {
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

  if (loading) {
    return <Loading fullScreen />;
  }

  if (!order) {
    return (
      <div className="confirmation-page">
        <div className="container">
          <div className="confirmation-error">
            <h2>Order not found</h2>
            <p>We couldn't find the order you're looking for.</p>
            <Link to="/orders" className="btn btn-primary">
              View All Orders
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="container">
        <div className="confirmation-card">
          {/* Success Header */}
          <div className="confirmation-header">
            <div className="success-icon">
              <FiCheckCircle />
            </div>
            <h1>Order Confirmed!</h1>
            <p>Thank you for your purchase. Your order has been received.</p>
          </div>

          {/* Order Info */}
          <div className="order-info">
            <div className="info-item">
              <span className="label">Order Number</span>
              <span className="value">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>
            </div>
            <div className="info-item">
              <span className="label">Date</span>
              <span className="value">{new Date(order.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="info-item">
              <span className="label">Total</span>
              <span className="value">{formatPrice(order.total)}</span>
            </div>
            <div className="info-item">
              <span className="label">Payment</span>
              <span className="value status-badge paid">Paid</span>
            </div>
          </div>

          {/* Order Items */}
          <div className="confirmation-section">
            <h2><FiPackage /> Order Items</h2>
            <div className="order-items">
              {order.items?.map((item, index) => (
                <div key={index} className="order-item">
                  <div className="item-image">
                    <img 
                      src={getProductImage(item.product)} 
                      alt={item.product?.name || 'Product'} 
                    />
                  </div>
                  <div className="item-details">
                    <h4>{item.product?.name || 'Product'}</h4>
                    <p>Qty: {item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <div className="item-total">
                    {formatPrice(item.quantity * item.price)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="confirmation-section">
            <h2><FiMapPin /> Shipping Address</h2>
            <div className="address-card">
              <p><strong>{order.shippingAddress?.fullName}</strong></p>
              <p>{order.shippingAddress?.address}</p>
              <p>
                {order.shippingAddress?.city}, {order.shippingAddress?.state} {order.shippingAddress?.zipCode}
              </p>
              <p>{order.shippingAddress?.country}</p>
              <p>{order.shippingAddress?.phone}</p>
            </div>
          </div>

          {/* Order Summary */}
          <div className="confirmation-summary">
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

          {/* Email Notice */}
          <div className="email-notice">
            <FiMail />
            <p>
              A confirmation email has been sent to <strong>{order.user?.email}</strong> 
              with your order details.
            </p>
          </div>

          {/* Actions */}
          <div className="confirmation-actions">
            <Link to={`/order/${order._id}`} className="btn btn-primary">
              View Order Details
            </Link>
            <Link to="/products" className="btn btn-outline">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPage;
