/**
 * ===========================================
 * SEARCH PAGE
 * ===========================================
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { FiSearch, FiX } from 'react-icons/fi';
import { productService } from '../services/api';
import ProductCard from '../components/common/ProductCard';
import Pagination from '../components/common/Pagination';
import Loading from '../components/common/Loading';
import './SearchPage.css';

const SearchPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [searchInput, setSearchInput] = useState(query);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalProducts: 0
  });

  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    const searchProducts = async () => {
      if (!query.trim()) {
        setProducts([]);
        return;
      }

      setLoading(true);
      try {
        const response = await productService.searchProducts(query, {
          page: searchParams.get('page') || 1,
          limit: 12
        });

        const { products: results, pagination: pag } = response.data.data;
        setProducts(results || []);
        setPagination({
          currentPage: pag?.currentPage || 1,
          totalPages: pag?.totalPages || 1,
          totalProducts: pag?.totalProducts || 0
        });
      } catch (error) {
        console.error('Search failed:', error);
        // Don't clear products on error - keep existing results
      } finally {
        setLoading(false);
      }
    };

    searchProducts();
  }, [query, searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) {
      setSearchParams({ q: searchInput.trim() });
    }
  };

  const handleClearSearch = () => {
    setSearchInput('');
    setSearchParams({});
  };

  const handlePageChange = (page) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('page', page.toString());
    setSearchParams(newParams);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="search-page">
      <div className="container">
        {/* Search Header */}
        <div className="search-header">
          <form className="search-form" onSubmit={handleSearch}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search for products..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              autoFocus
            />
            {searchInput && (
              <button type="button" className="clear-btn" onClick={handleClearSearch}>
                <FiX />
              </button>
            )}
            <button type="submit" className="btn btn-primary">
              Search
            </button>
          </form>

          {query && (
            <p className="search-info">
              {loading ? (
                'Searching...'
              ) : (
                <>
                  Found <strong>{pagination.totalProducts}</strong> results for "<strong>{query}</strong>"
                </>
              )}
            </p>
          )}
        </div>

        {/* Results */}
        {!query ? (
          <div className="search-empty">
            <FiSearch className="empty-icon" />
            <h2>Search Products</h2>
            <p>Enter a search term to find products</p>
            <div className="popular-searches">
              <span>Popular searches:</span>
              {['Electronics', 'Clothing', 'Home', 'Sports'].map((term) => (
                <Link 
                  key={term} 
                  to={`/search?q=${term}`}
                  className="search-tag"
                >
                  {term}
                </Link>
              ))}
            </div>
          </div>
        ) : loading ? (
          <Loading />
        ) : products.length === 0 ? (
          <div className="search-no-results">
            <h2>No results found</h2>
            <p>We couldn't find any products matching "{query}"</p>
            <div className="suggestions">
              <p>Suggestions:</p>
              <ul>
                <li>Check your spelling</li>
                <li>Try more general keywords</li>
                <li>Try different keywords</li>
              </ul>
            </div>
            <Link to="/products" className="btn btn-primary">
              Browse All Products
            </Link>
          </div>
        ) : (
          <>
            <div className="search-results">
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
      </div>
    </div>
  );
};

export default SearchPage;
