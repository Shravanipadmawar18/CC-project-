/**
 * ===========================================
 * ORDERS PAGE
 * ===========================================
 * 
 * User's order history.
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiPackage, FiChevronRight, FiSearch } from 'react-icons/fi';
import { orderService } from '../services/api';
import { getProductImage } from '../utils/imageUtils';
import { formatPrice } from '../utils/currencyUtils';
import Pagination from '../components/common/Pagination';
import Loading from '../components/common/Loading';
import './OrdersPage.css';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1
  });
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      try {
        const params = {
          page: pagination.currentPage,
          limit: 10
        };

        if (filter !== 'all') {
          params.status = filter;
        }

        const response = await orderService.getMyOrders(params);
        setOrders(response.data.data.orders);
        setPagination(prev => ({
          ...prev,
          totalPages: response.data.data.pagination?.totalPages || 1
        }));
      } catch (error) {
        console.error('Failed to fetch orders:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [pagination.currentPage, filter]);

  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'status-pending',
      processing: 'status-processing',
      shipped: 'status-shipped',
      delivered: 'status-delivered',
      cancelled: 'status-cancelled'
    };
    return colors[status] || 'status-pending';
  };

  const filteredOrders = orders.filter(order => {
    if (!searchQuery) return true;
    const orderNumber = order.orderNumber || order._id.slice(-8);
    return orderNumber.toLowerCase().includes(searchQuery.toLowerCase());
  });

  if (loading && pagination.currentPage === 1) {
    return <Loading fullScreen />;
  }

  return (
    <div className="orders-page">
      <div className="container">
        <div className="orders-header">
          <h1>My Orders</h1>
          <p>Track and manage your orders</p>
        </div>

        {/* Filters */}
        <div className="orders-filters">
          <div className="filter-tabs">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => {
                  setFilter(status);
                  setPagination(prev => ({ ...prev, currentPage: 1 }));
                }}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>

          <div className="search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by order number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Orders List */}
        {filteredOrders.length === 0 ? (
          <div className="no-orders">
            <FiPackage className="no-orders-icon" />
            <h2>No orders found</h2>
            <p>
              {filter === 'all' 
                ? "You haven't placed any orders yet."
                : `No ${filter} orders found.`}
            </p>
            <Link to="/products" className="btn btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <>
            <div className="orders-list">
              {filteredOrders.map((order) => (
                <Link key={order._id} to={`/order/${order._id}`} className="order-card">
                  <div className="order-card-header">
                    <div className="order-number">
                      <span className="label">Order</span>
                      <span className="value">#{order.orderNumber || order._id.slice(-8).toUpperCase()}</span>
                    </div>
                    <span className={`order-status ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="order-card-body">
                    <div className="order-items-preview">
                      {order.items?.slice(0, 3).map((item, index) => (
                        <div key={index} className="item-preview">
                          <img 
                            src={getProductImage(item.product)} 
                            alt={item.product?.name || 'Product'} 
                          />
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="item-preview more">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>

                    <div className="order-meta">
                      <div className="meta-item">
                        <span className="label">Date</span>
                        <span className="value">{new Date(order.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="meta-item">
                        <span className="label">Items</span>
                        <span className="value">{order.items?.length || 0}</span>
                      </div>
                      <div className="meta-item">
                        <span className="label">Total</span>
                        <span className="value total">{formatPrice(order.total)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="order-card-footer">
                    <span>View Details</span>
                    <FiChevronRight />
                  </div>
                </Link>
              ))}
            </div>

            <Pagination
              currentPage={pagination.currentPage}
              totalPages={pagination.totalPages}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
