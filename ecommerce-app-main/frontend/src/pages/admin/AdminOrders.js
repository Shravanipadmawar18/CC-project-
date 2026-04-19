/**
 * ===========================================
 * ADMIN ORDERS PAGE COMPONENT
 * Order management with status updates
 * ===========================================
 */

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/api';
import { formatPrice } from '../../utils/currencyUtils';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import {
  FaSearch,
  FaFilter,
  FaEye,
  FaClock,
  FaBox,
  FaTruck,
  FaCheck,
  FaTimes,
  FaDownload
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import './AdminOrders.css';

const AdminOrders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    status: searchParams.get('status') || ''
  });
  const [updateLoading, setUpdateLoading] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, [searchParams]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = {
        page: searchParams.get('page') || 1,
        limit: 10,
        search: searchParams.get('search') || '',
        status: searchParams.get('status') || ''
      };

      const response = await adminService.getOrders(params);
      setOrders(response.data.orders || []);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams);
    if (filters.search) {
      params.set('search', filters.search);
    } else {
      params.delete('search');
    }
    params.delete('page');
    setSearchParams(params);
  };

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete('page');
    setSearchParams(params);
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page);
    setSearchParams(params);
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdateLoading(orderId);
    try {
      await adminService.updateOrderStatus(orderId, newStatus);
      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error('Failed to update order status');
    } finally {
      setUpdateLoading(null);
    }
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FaClock />,
      processing: <FaBox />,
      shipped: <FaTruck />,
      delivered: <FaCheck />,
      cancelled: <FaTimes />
    };
    return icons[status] || <FaClock />;
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'pending',
      processing: 'processing',
      shipped: 'shipped',
      delivered: 'delivered',
      cancelled: 'cancelled'
    };
    return colors[status] || 'pending';
  };

  const statusOptions = [
    { value: '', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'Shipped' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ];

  const getNextStatuses = (currentStatus) => {
    const statusFlow = {
      pending: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: []
    };
    return statusFlow[currentStatus] || [];
  };

  return (
    <div className="admin-orders">
      <div className="container">
        {/* Page Header */}
        <div className="admin-header">
          <div>
            <h1>Orders</h1>
            <p>{pagination.total} total orders</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline">
              <FaDownload /> Export
            </button>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="filters-bar">
          <form className="search-form" onSubmit={handleSearch}>
            <FaSearch />
            <input
              type="text"
              placeholder="Search by order ID or customer..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
            <button type="submit" className="btn btn-sm">
              Search
            </button>
          </form>

          <div className="filter-actions">
            <select
              className="status-filter"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Status Summary */}
        <div className="status-summary">
          {['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
            <button
              key={status}
              className={`status-tab ${filters.status === status ? 'active' : ''}`}
              onClick={() => handleFilterChange('status', filters.status === status ? '' : status)}
            >
              {getStatusIcon(status)}
              <span className="status-name">{status}</span>
              <span className={`status-count ${status}`}>
                {orders.filter((o) => o.status === status).length || 0}
              </span>
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <div className="table-section">
          {loading ? (
            <Loading />
          ) : orders.length === 0 ? (
            <div className="no-orders">
              <FaBox />
              <h3>No orders found</h3>
              <p>Orders will appear here once customers start placing them</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="admin-table orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order._id}>
                        <td>
                          <Link to={`/admin/orders/${order._id}`} className="order-id">
                            #{order._id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td>
                          <div className="customer-info">
                            <span className="customer-name">{order.user?.name}</span>
                            <span className="customer-email">{order.user?.email}</span>
                          </div>
                        </td>
                        <td>
                          <div className="items-preview">
                            {order.items?.slice(0, 2).map((item, index) => (
                              <span key={index} className="item-name">
                                {item.product?.name}
                                {item.quantity > 1 && ` (x${item.quantity})`}
                              </span>
                            ))}
                            {order.items?.length > 2 && (
                              <span className="more-items">
                                +{order.items.length - 2} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="order-total">
                            {formatPrice(order.totalAmount)}
                          </span>
                        </td>
                        <td>
                          <span className={`payment-badge ${order.paymentStatus}`}>
                            {order.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <div className="status-cell">
                            <span className={`status-badge ${getStatusColor(order.status)}`}>
                              {getStatusIcon(order.status)}
                              {order.status}
                            </span>
                            {getNextStatuses(order.status).length > 0 && (
                              <select
                                className="status-select"
                                value=""
                                onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                                disabled={updateLoading === order._id}
                              >
                                <option value="" disabled>
                                  Update
                                </option>
                                {getNextStatuses(order.status).map((status) => (
                                  <option key={status} value={status}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="order-date">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <Link
                            to={`/admin/orders/${order._id}`}
                            className="action-btn view"
                            title="View Details"
                          >
                            <FaEye />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="table-footer">
                <p className="showing-info">
                  Showing {(pagination.page - 1) * 10 + 1} to{' '}
                  {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} orders
                </p>
                <Pagination
                  currentPage={pagination.page}
                  totalPages={pagination.pages}
                  onPageChange={handlePageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOrders;
