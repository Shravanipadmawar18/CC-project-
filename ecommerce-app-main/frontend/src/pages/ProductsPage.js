/**
 * ===========================================
 * PRODUCTS PAGE
 * ===========================================
 * 
 * Product listing with filters and pagination.
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'react-router-dom';
import { FiFilter, FiX, FiGrid, FiList } from 'react-icons/fi';
import { productService, categoryService } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import Pagination from '../components/common/Pagination';
import Loading from '../components/common/Loading';
import './ProductsPage.css';

const ProductsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { slug: categorySlug } = useParams();

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  
  // Pagination
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0
  });

  // Filters
  const [filters, setFilters] = useState({
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    rating: searchParams.get('rating') || '',
    sort: searchParams.get('sort') || '-createdAt',
    isFeatured: searchParams.get('isFeatured') || ''
  });

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoryService.getCategories();
        setCategories(response.data.data.categories);
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch products - use searchParams as the source of truth
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const params = {
          page: searchParams.get('page') || 1,
          limit: 12,
          sort: searchParams.get('sort') || '-createdAt'
        };

        if (categorySlug) {
          params.category = categorySlug;
        } else if (searchParams.get('category')) {
          params.category = searchParams.get('category');
        }

        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const rating = searchParams.get('rating');
        const isFeatured = searchParams.get('isFeatured');

        if (minPrice) params.minPrice = minPrice;
        if (maxPrice) params.maxPrice = maxPrice;
        if (rating) params.rating = rating;
        if (isFeatured) params.isFeatured = isFeatured;

        const response = await productService.getProducts(params);
        const { products: fetchedProducts, pagination: pag } = response.data.data;

        setProducts(fetchedProducts || []);
        setPagination({
          currentPage: pag?.currentPage || 1,
          totalPages: pag?.totalPages || 1,
          totalProducts: pag?.totalProducts || 0
        });
      } catch (error) {
        console.error('Failed to fetch products:', error);
        // Don't clear products on error - keep existing data
        // Only show error toast if it's not a network error during initial load
        if (!error.isNetworkError) {
          // Optionally show a toast here
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [searchParams, categorySlug]); // Removed filters from dependencies

  // Handle filter change
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    
    const newParams = new URLSearchParams(searchParams);
    if (value) {
      newParams.set(key, value);
    } else {
      newParams.delete(key);
    }
    newParams.set('page', '1');
    setSearchParams(newParams);
  };

  // Handle page change
  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      category: '',
      minPrice: '',
      maxPrice: '',
      rating: '',
      sort: '-createdAt',
      isFeatured: ''
    });
    setSearchParams({});
  };

  // Get active filter count
  const activeFilterCount = Object.values(filters).filter(v => v && v !== '-createdAt').length;

  // Get category name for page title
  const currentCategory = categorySlug 
    ? categories.find(c => c.slug === categorySlug)
    : filters.category 
      ? categories.find(c => c.slug === filters.category)
      : null;

  return (
    <div className="products-page">
      <div className="container">
        {/* Page Header */}
        <div className="products-header">
          <div className="products-title-section">
            <h1>{currentCategory?.name || 'All Products'}</h1>
            <p>{pagination.totalProducts} products found</p>
          </div>

          <div className="products-controls">
            {/* Sort */}
            <select
              value={filters.sort}
              onChange={(e) => handleFilterChange('sort', e.target.value)}
              className="sort-select"
            >
              <option value="-createdAt">Newest First</option>
              <option value="createdAt">Oldest First</option>
              <option value="price">Price: Low to High</option>
              <option value="-price">Price: High to Low</option>
              <option value="-rating">Highest Rated</option>
              <option value="name">Name: A to Z</option>
              <option value="-name">Name: Z to A</option>
            </select>

            {/* View Mode Toggle */}
            <div className="view-toggle">
              <button
                className={viewMode === 'grid' ? 'active' : ''}
                onClick={() => setViewMode('grid')}
              >
                <FiGrid />
              </button>
              <button
                className={viewMode === 'list' ? 'active' : ''}
                onClick={() => setViewMode('list')}
              >
                <FiList />
              </button>
            </div>

            {/* Filter Toggle (Mobile) */}
            <button
              className="filter-toggle btn btn-outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <FiFilter />
              Filters
              {activeFilterCount > 0 && (
                <span className="filter-count">{activeFilterCount}</span>
              )}
            </button>
          </div>
        </div>

        <div className="products-layout">
          {/* Filters Sidebar */}
          <aside className={`products-filters ${showFilters ? 'show' : ''}`}>
            <div className="filters-header">
              <h2>Filters</h2>
              <button className="filters-close" onClick={() => setShowFilters(false)}>
                <FiX />
              </button>
            </div>

            {/* Categories */}
            {!categorySlug && (
              <div className="filter-group">
                <h3>Category</h3>
                <div className="filter-options">
                  <label className="filter-option">
                    <input
                      type="radio"
                      name="category"
                      checked={!filters.category}
                      onChange={() => handleFilterChange('category', '')}
                    />
                    <span>All Categories</span>
                  </label>
                  {categories.map((category) => (
                    <label key={category._id} className="filter-option">
                      <input
                        type="radio"
                        name="category"
                        checked={filters.category === category.slug}
                        onChange={() => handleFilterChange('category', category.slug)}
                      />
                      <span>{category.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div className="filter-group">
              <h3>Price Range</h3>
              <div className="price-inputs">
                <input
                  type="number"
                  placeholder="Min"
                  value={filters.minPrice}
                  onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                />
                <span>-</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filters.maxPrice}
                  onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                />
              </div>
            </div>

            {/* Rating */}
            <div className="filter-group">
              <h3>Rating</h3>
              <div className="filter-options">
                <label className="filter-option">
                  <input
                    type="radio"
                    name="rating"
                    checked={!filters.rating}
                    onChange={() => handleFilterChange('rating', '')}
                  />
                  <span>Any Rating</span>
                </label>
                {[4, 3, 2, 1].map((rating) => (
                  <label key={rating} className="filter-option">
                    <input
                      type="radio"
                      name="rating"
                      checked={filters.rating === rating.toString()}
                      onChange={() => handleFilterChange('rating', rating.toString())}
                    />
                    <span>{rating}+ Stars</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Featured */}
            <div className="filter-group">
              <h3>Featured</h3>
              <label className="filter-option">
                <input
                  type="checkbox"
                  checked={filters.isFeatured === 'true'}
                  onChange={(e) => handleFilterChange('isFeatured', e.target.checked ? 'true' : '')}
                />
                <span>Featured Products Only</span>
              </label>
            </div>

            {/* Clear Filters */}
            {activeFilterCount > 0 && (
              <button className="clear-filters btn btn-outline" onClick={clearFilters}>
                Clear All Filters
              </button>
            )}
          </aside>

          {/* Products Grid */}
          <main className="products-main">
            {loading ? (
              <Loading />
            ) : products.length === 0 ? (
              <div className="no-products">
                <h2>No products found</h2>
                <p>Try adjusting your filters or search criteria</p>
                {activeFilterCount > 0 && (
                  <button className="btn btn-primary" onClick={clearFilters}>
                    Clear Filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className={`products-grid ${viewMode === 'list' ? 'list-view' : ''}`}>
                  {products.map((product) => (
                    <ProductCard key={product._id} product={product} />
                  ))}
                </div>

                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.totalPages}
                  onPageChange={handlePageChange}
                />
              </>
            )}
          </main>
        </div>
      </div>

      {/* Overlay for mobile filters */}
      {showFilters && (
        <div className="filters-overlay" onClick={() => setShowFilters(false)} />
      )}
    </div>
  );
};

export default ProductsPage;
