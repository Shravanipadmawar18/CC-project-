/**
 * ===========================================
 * ADMIN DASHBOARD COMPONENT
 * Main admin dashboard with stats and overview
 * ===========================================
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminService } from '../../services/api';
import { formatPrice } from '../../utils/currencyUtils';
import Loading from '../../components/common/Loading';
import {
  FaUsers,
  FaShoppingBag,
  FaBox,
  FaDollarSign,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaClock,
  FaTruck,
  FaCheck,
  FaTag
} from 'react-icons/fa';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [recentUsers, setRecentUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, ordersRes, usersRes] = await Promise.all([
        adminService.getDashboardStats(),
        adminService.getOrders({ page: 1, limit: 5 }),
        adminService.getUsers({ page: 1, limit: 5 })
      ]);

      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.orders || []);
      setRecentUsers(usersRes.data.users || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: '#f59e0b',
      processing: '#3b82f6',
      shipped: '#8b5cf6',
      delivered: '#10b981',
      cancelled: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <FaClock />,
      processing: <FaBox />,
      shipped: <FaTruck />,
      delivered: <FaCheck />,
      cancelled: <FaTag />
    };
    return icons[status] || <FaClock />;
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="admin-dashboard">
      <div className="container">
        {/* Page Header */}
        <div className="admin-header">
          <div>
            <h1>Dashboard</h1>
            <p>Welcome back! Here's what's happening with your store.</p>
          </div>
          <div className="header-actions">
            <Link to="/admin/products/new" className="btn btn-primary">
              Add New Product
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon revenue">
              <FaDollarSign />
            </div>
            <div className="stat-info">
              <h3>Total Revenue</h3>
              <p className="stat-value">
                {formatPrice(stats?.totalRevenue || 0)}
              </p>
              <span className="stat-change positive">
                <FaArrowUp /> 12.5% from last month
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon orders">
              <FaShoppingBag />
            </div>
            <div className="stat-info">
              <h3>Total Orders</h3>
              <p className="stat-value">{stats?.totalOrders || 0}</p>
              <span className="stat-change positive">
                <FaArrowUp /> 8.2% from last month
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon products">
              <FaBox />
            </div>
            <div className="stat-info">
              <h3>Total Products</h3>
              <p className="stat-value">{stats?.totalProducts || 0}</p>
              <span className="stat-change">
                {stats?.lowStockProducts || 0} low in stock
              </span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon users">
              <FaUsers />
            </div>
            <div className="stat-info">
              <h3>Total Users</h3>
              <p className="stat-value">{stats?.totalUsers || 0}</p>
              <span className="stat-change positive">
                <FaArrowUp /> 5.3% from last month
              </span>
            </div>
          </div>
        </div>

        {/* Order Status Summary */}
        <div className="order-status-summary">
          <h2>Order Overview</h2>
          <div className="status-cards">
            <div className="status-card pending">
              <FaClock />
              <div>
                <span className="status-count">{stats?.ordersByStatus?.pending || 0}</span>
                <span className="status-label">Pending</span>
              </div>
            </div>
            <div className="status-card processing">
              <FaBox />
              <div>
                <span className="status-count">{stats?.ordersByStatus?.processing || 0}</span>
                <span className="status-label">Processing</span>
              </div>
            </div>
            <div className="status-card shipped">
              <FaTruck />
              <div>
                <span className="status-count">{stats?.ordersByStatus?.shipped || 0}</span>
                <span className="status-label">Shipped</span>
              </div>
            </div>
            <div className="status-card delivered">
              <FaCheck />
              <div>
                <span className="status-count">{stats?.ordersByStatus?.delivered || 0}</span>
                <span className="status-label">Delivered</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders & Users */}
        <div className="dashboard-tables">
          {/* Recent Orders */}
          <div className="table-section">
            <div className="table-header">
              <h2>Recent Orders</h2>
              <Link to="/admin/orders" className="view-all">
                View All <FaEye />
              </Link>
            </div>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td>
                          <Link to={`/admin/orders/${order._id}`}>
                            #{order._id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td>
                          <div className="customer-info">
                            <span className="customer-name">{order.user?.name}</span>
                            <span className="customer-email">{order.user?.email}</span>
                          </div>
                        </td>
                        <td>{formatPrice(order.totalAmount)}</td>
                        <td>
                          <span
                            className="status-badge"
                            style={{ backgroundColor: getStatusColor(order.status) }}
                          >
                            {getStatusIcon(order.status)}
                            {order.status}
                          </span>
                        </td>
                        <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="no-data">No orders yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Users */}
          <div className="table-section">
            <div className="table-header">
              <h2>New Customers</h2>
              <Link to="/admin/users" className="view-all">
                View All <FaEye />
              </Link>
            </div>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Role</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {recentUsers.length > 0 ? (
                    recentUsers.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-info">
                            <div className="user-avatar">
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <span className="user-name">{user.name}</span>
                              <span className="user-email">{user.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${user.role}`}>
                            {user.role}
                          </span>
                        </td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="no-data">No users yet</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
