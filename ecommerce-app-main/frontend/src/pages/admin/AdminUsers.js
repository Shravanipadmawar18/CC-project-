/**
 * ===========================================
 * ADMIN USERS PAGE COMPONENT
 * User management with role updates
 * ===========================================
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { adminService } from '../../services/api';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import {
  FaSearch,
  FaUserShield,
  FaUser,
  FaEdit,
  FaTrash,
  FaDownload,
  FaEnvelope,
  FaCalendar,
  FaShoppingBag
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import './AdminUsers.css';

const AdminUsers = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    role: searchParams.get('role') || ''
  });
  const [updateLoading, setUpdateLoading] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, [searchParams]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        page: searchParams.get('page') || 1,
        limit: 10,
        search: searchParams.get('search') || '',
        role: searchParams.get('role') || ''
      };

      const response = await adminService.getUsers(params);
      setUsers(response.data.users || []);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
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

  const handleRoleUpdate = async (userId, newRole) => {
    setUpdateLoading(userId);
    try {
      await adminService.updateUserRole(userId, newRole);
      setUsers((prev) =>
        prev.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );
      toast.success(`User role updated to ${newRole}`);
    } catch (error) {
      toast.error('Failed to update user role');
    } finally {
      setUpdateLoading(null);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }

    setDeleteLoading(userId);
    try {
      await adminService.deleteUser(userId);
      setUsers((prev) => prev.filter((user) => user._id !== userId));
      toast.success('User deleted successfully');
    } catch (error) {
      toast.error('Failed to delete user');
    } finally {
      setDeleteLoading(null);
    }
  };

  const roleOptions = [
    { value: '', label: 'All Users' },
    { value: 'user', label: 'Customers' },
    { value: 'admin', label: 'Administrators' }
  ];

  return (
    <div className="admin-users">
      <div className="container">
        {/* Page Header */}
        <div className="admin-header">
          <div>
            <h1>Users</h1>
            <p>{pagination.total} total users</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-outline">
              <FaDownload /> Export
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="user-stats">
          <div className="user-stat">
            <FaUser className="stat-icon customer" />
            <div>
              <span className="stat-value">
                {users.filter((u) => u.role === 'user').length}
              </span>
              <span className="stat-label">Customers</span>
            </div>
          </div>
          <div className="user-stat">
            <FaUserShield className="stat-icon admin" />
            <div>
              <span className="stat-value">
                {users.filter((u) => u.role === 'admin').length}
              </span>
              <span className="stat-label">Administrators</span>
            </div>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="filters-bar">
          <form className="search-form" onSubmit={handleSearch}>
            <FaSearch />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
            <button type="submit" className="btn btn-sm">
              Search
            </button>
          </form>

          <div className="filter-actions">
            <select
              className="role-filter"
              value={filters.role}
              onChange={(e) => handleFilterChange('role', e.target.value)}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-section">
          {loading ? (
            <Loading />
          ) : users.length === 0 ? (
            <div className="no-users">
              <FaUser />
              <h3>No users found</h3>
              <p>Try adjusting your search filters</p>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="admin-table users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Orders</th>
                      <th>Joined</th>
                      <th>Last Login</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>
                          <div className="user-info">
                            <div className={`user-avatar ${user.role}`}>
                              {user.name?.charAt(0).toUpperCase()}
                            </div>
                            <span className="user-name">{user.name}</span>
                          </div>
                        </td>
                        <td>
                          <a href={`mailto:${user.email}`} className="user-email">
                            <FaEnvelope />
                            {user.email}
                          </a>
                        </td>
                        <td>
                          <select
                            className={`role-select ${user.role}`}
                            value={user.role}
                            onChange={(e) => handleRoleUpdate(user._id, e.target.value)}
                            disabled={updateLoading === user._id}
                          >
                            <option value="user">Customer</option>
                            <option value="admin">Admin</option>
                          </select>
                        </td>
                        <td>
                          <span className="order-count">
                            <FaShoppingBag />
                            {user.orderCount || 0}
                          </span>
                        </td>
                        <td>
                          <span className="date">
                            <FaCalendar />
                            {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </td>
                        <td>
                          <span className="date">
                            {user.lastLogin
                              ? new Date(user.lastLogin).toLocaleDateString()
                              : 'Never'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button
                              className="action-btn delete"
                              title="Delete User"
                              onClick={() => handleDeleteUser(user._id)}
                              disabled={deleteLoading === user._id || user.role === 'admin'}
                            >
                              <FaTrash />
                            </button>
                          </div>
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
                  {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} users
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

export default AdminUsers;
