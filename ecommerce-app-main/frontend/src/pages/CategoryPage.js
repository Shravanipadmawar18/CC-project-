/**
 * ===========================================
 * CATEGORY PAGE COMPONENT
 * Displays products in a specific category
 * ===========================================
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { categoryService } from '../services/api';
import Loading from '../components/common/Loading';
import ProductCard from '../components/common/ProductCard';
import Pagination from '../components/common/Pagination';
import { FaFilter, FaSortAmountDown, FaTh, FaList, FaChevronRight } from 'react-icons/fa';
import './CategoryPage.css';

const CategoryPage = () => {
  const { id } = useParams();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });
  const [sortBy, setSortBy] = useState('-createdAt');
  const [viewMode, setViewMode] = useState('grid');
  const [priceRange, setPriceRange] = useState({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

  const fetchCategory = useCallback(async () => {
    try {
      const response = await categoryService.getCategory(id);
      // Handle both response formats
      const categoryData = response.data.data?.category || response.data.category || response.data;
      setCategory(categoryData);
    } catch (error) {
      console.error('Error fetching category:', error);
      setLoading(false);
    }
  }, [id]);

  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // Use category ID (not slug) for the API call
      const categoryId = category?._id || id;
      
      // Use getCategoryProducts endpoint for proper category filtering
      const params = {
        page,
        limit: 12,
        sort: sortBy
      };

      if (priceRange.min) params.minPrice = priceRange.min;
      if (priceRange.max) params.maxPrice = priceRange.max;

      const response = await categoryService.getCategoryProducts(categoryId, params);
      const data = response.data.data || response.data;
      
      setProducts(data.products || []);
      setPagination({
        page: data.page || data.pagination?.currentPage || 1,
        pages: data.pages || data.pagination?.totalPages || 1,
        total: data.total || data.pagination?.totalProducts || 0
      });
    } catch (error) {
      console.error('Error fetching products:', error);
      // Don't clear products on error - keep existing data visible
    } finally {
      setLoading(false);
    }
  }, [category, id, sortBy, priceRange]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  useEffect(() => {
    if (category) {
      fetchProducts(1);
    }
  }, [category, sortBy, fetchProducts]);

  const handlePageChange = (page) => {
    fetchProducts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePriceFilter = () => {
    fetchProducts(1);
    setShowFilters(false);
  };

  const sortOptions = [
    { value: '-createdAt', label: 'Newest' },
    { value: 'createdAt', label: 'Oldest' },
    { value: 'price', label: 'Price: Low to High' },
    { value: '-price', label: 'Price: High to Low' },
    { value: '-averageRating', label: 'Top Rated' },
    { value: '-sold', label: 'Best Selling' }
  ];

  return (
    <div className="category-page">
      <div className="container">
        {/* Breadcrumb */}
        <nav className="breadcrumb">
          <Link to="/">Home</Link>
          <FaChevronRight />
          <Link to="/products">Products</Link>
          <FaChevronRight />
          <span>{category?.name || 'Category'}</span>
        </nav>

        {/* Category Header */}
        <div className="category-header">
          {category?.image && (
            <div className="category-banner">
              <img src={category.image} alt={category.name} />
              <div className="banner-overlay">
                <h1>{category.name}</h1>
                {category.description && <p>{category.description}</p>}
              </div>
            </div>
          )}

          {!category?.image && (
            <div className="category-title">
              <h1>{category?.name || 'Category'}</h1>
              {category?.description && <p>{category.description}</p>}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="category-toolbar">
          <div className="results-info">
            <span>{pagination.total} products found</span>
          </div>

          <div className="toolbar-actions">
            <button
              className={`filter-toggle ${showFilters ? 'active' : ''}`}
              onClick={() => setShowFilters(!showFilters)}
            >
              <FaFilter /> Filter
            </button>

            <div className="sort-wrapper">
              <FaSortAmountDown />
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="view-toggle">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
                title="Grid View"
              >
                <FaTh />
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <FaList />
              </button>
            </div>
          </div>
        </div>

        {/* Price Filter Panel */}
        {showFilters && (
          <div className="filter-panel">
            <div className="filter-group">
              <label>Price Range</label>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={priceRange.min}
                  onChange={(e) => setPriceRange((prev) => ({ ...prev, min: e.target.value }))}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={priceRange.max}
                  onChange={(e) => setPriceRange((prev) => ({ ...prev, max: e.target.value }))}
                />
                <button className="btn btn-sm" onClick={handlePriceFilter}>
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Products Grid */}
        {loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <div className="no-products">
            <h3>No products found</h3>
            <p>Try adjusting your filters or check back later</p>
            <Link to="/products" className="btn btn-primary">
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            <div className={`products-grid ${viewMode}`}>
              {products.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <Pagination
                currentPage={pagination.page}
                totalPages={pagination.pages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default CategoryPage;
