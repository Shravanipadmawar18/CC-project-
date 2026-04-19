/**
 * ===========================================
 * ADMIN PRODUCTS PAGE COMPONENT
 * Product management with CRUD operations
 * ===========================================
 */

import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminService, categoryService } from '../../services/api';
import { getProductImage } from '../../utils/imageUtils';
import { formatPrice } from '../../utils/currencyUtils';
import Loading from '../../components/common/Loading';
import Pagination from '../../components/common/Pagination';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaSearch,
  FaFilter,
  FaEye,
  FaSort,
  FaImage,
  FaExclamationTriangle
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import './AdminProducts.css';

const AdminProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    sort: searchParams.get('sort') || '-createdAt'
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deleteLoading, setDeleteLoading] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchParams]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = {
        page: searchParams.get('page') || 1,
        limit: 10,
        search: searchParams.get('search') || '',
        category: searchParams.get('category') || '',
        sort: searchParams.get('sort') || '-createdAt'
      };

      const response = await adminService.getProducts(params);
      setProducts(response.data.products || []);
      setPagination({
        page: response.data.page,
        pages: response.data.pages,
        total: response.data.total
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Failed to load products');
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

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;

    setDeleteLoading(productId);
    try {
      await adminService.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success('Product deleted successfully');
    } catch (error) {
      toast.error('Failed to delete product');
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedProducts.length === 0) return;
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) return;

    try {
      await Promise.all(selectedProducts.map((id) => adminService.deleteProduct(id)));
      setProducts((prev) => prev.filter((p) => !selectedProducts.includes(p._id)));
      setSelectedProducts([]);
      toast.success('Products deleted successfully');
    } catch (error) {
      toast.error('Failed to delete some products');
    }
  };

  const toggleSelectAll = () => {
    if (selectedProducts.length === products.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(products.map((p) => p._id));
    }
  };

  const toggleSelectProduct = (productId) => {
    setSelectedProducts((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const sortOptions = [
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
    { value: 'name', label: 'Name A-Z' },
    { value: '-name', label: 'Name Z-A' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-sold', label: 'Best Selling' }
  ];

  return (
    <div className="admin-products">
      <div className="container">
        {/* Page Header */}
        <div className="admin-header">
          <div>
            <h1>Products</h1>
            <p>{pagination.total} total products</p>
          </div>
          <div className="header-actions">
            <Link to="/admin/products/new" className="btn btn-primary">
              <FaPlus /> Add Product
            </Link>
          </div>
        </div>

        {/* Filters Bar */}
        <div className="filters-bar">
          <form className="search-form" onSubmit={handleSearch}>
            <FaSearch />
            <input
              type="text"
              placeholder="Search products..."
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
            <button type="submit" className="btn btn-sm">
              Search
            </button>
          </form>

          <div className="filter-actions">
            <button
              className={`btn btn-outline btn-sm ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filters
            </button>

            <select
              className="sort-select"
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="expanded-filters">
            <div className="filter-group">
              <label>Category</label>
              <select
                value={filters.category}
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Bulk Actions */}
        {selectedProducts.length > 0 && (
          <div className="bulk-actions">
            <span>{selectedProducts.length} selected</span>
            <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
              <FaTrash /> Delete Selected
            </button>
          </div>
        )}

        {/* Products Table */}
        <div className="table-section">
          {loading ? (
            <Loading />
          ) : products.length === 0 ? (
            <div className="no-products">
              <FaExclamationTriangle />
              <h3>No products found</h3>
              <p>Try adjusting your search or filters</p>
              <Link to="/admin/products/new" className="btn btn-primary">
                Add Your First Product
              </Link>
            </div>
          ) : (
            <>
              <div className="table-wrapper">
                <table className="admin-table products-table">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          checked={selectedProducts.length === products.length}
                          onChange={toggleSelectAll}
                        />
                      </th>
                      <th>Product</th>
                      <th>SKU</th>
                      <th>Category</th>
                      <th>
                        <button
                          className="sort-btn"
                          onClick={() => handleFilterChange('sort', filters.sort === 'price' ? '-price' : 'price')}
                        >
                          Price <FaSort />
                        </button>
                      </th>
                      <th>Stock</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((product) => (
                      <tr key={product._id}>
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedProducts.includes(product._id)}
                            onChange={() => toggleSelectProduct(product._id)}
                          />
                        </td>
                        <td>
                          <div className="product-info">
                            <div className="product-image">
                              <img src={getProductImage(product)} alt={product.name} />
                            </div>
                            <div>
                              <span className="product-name">{product.name}</span>
                              <span className="product-brand">{product.brand}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="sku">{product.sku || '-'}</span>
                        </td>
                        <td>{product.category?.name || '-'}</td>
                        <td>
                          <div className="price-cell">
                            {product.salePrice ? (
                              <>
                                <span className="sale-price">{formatPrice(product.salePrice)}</span>
                                <span className="original-price">{formatPrice(product.price)}</span>
                              </>
                            ) : (
                              <span>{formatPrice(product.price)}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`stock-badge ${product.stock <= 10 ? 'low' : ''}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${product.isActive ? 'active' : 'inactive'}`}>
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <Link
                              to={`/products/${product._id}`}
                              className="action-btn view"
                              title="View"
                              target="_blank"
                            >
                              <FaEye />
                            </Link>
                            <Link
                              to={`/admin/products/${product._id}/edit`}
                              className="action-btn edit"
                              title="Edit"
                            >
                              <FaEdit />
                            </Link>
                            <button
                              className="action-btn delete"
                              title="Delete"
                              onClick={() => handleDelete(product._id)}
                              disabled={deleteLoading === product._id}
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
                  {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} products
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

export default AdminProducts;
