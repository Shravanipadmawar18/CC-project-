/**
 * ===========================================
 * HEADER COMPONENT
 * ===========================================
 * 
 * Main navigation header with search, cart, and user menu.
 */

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FiSearch, FiShoppingCart, FiUser, FiMenu, FiX, FiHeart, FiPackage, FiLogOut, FiSettings } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { categoryService } from '../../services/api';
import './Header.css';

const Header = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { cart } = useCart();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const userMenuRef = useRef(null);
  const categoryRef = useRef(null);

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

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
      if (categoryRef.current && !categoryRef.current.contains(event.target)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowMobileMenu(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    setShowUserMenu(false);
    navigate('/');
  };

  return (
    <header className="header">
      <div className="header-container container">
        {/* Logo */}
        <Link to="/" className="header-logo">
          <span className="logo-icon">🛒</span>
          <span className="logo-text">ShopEase</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="header-nav hide-mobile">
          <div className="nav-item" ref={categoryRef}>
            <button
              className="nav-link"
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              Categories
              <svg className={`nav-arrow ${showCategoryDropdown ? 'open' : ''}`} width="10" height="6" viewBox="0 0 10 6">
                <path d="M1 1L5 5L9 1" stroke="currentColor" strokeWidth="1.5" fill="none" />
              </svg>
            </button>
            
            {showCategoryDropdown && (
              <div className="category-dropdown">
                {categories.map((category) => (
                  <Link
                    key={category._id}
                    to={`/category/${category.slug}`}
                    className="category-link"
                    onClick={() => setShowCategoryDropdown(false)}
                  >
                    {category.name}
                  </Link>
                ))}
              </div>
            )}
          </div>
          
          <Link to="/products" className="nav-link">All Products</Link>
          <Link to="/products?isFeatured=true" className="nav-link">Featured</Link>
        </nav>

        {/* Search Bar */}
        <form className="header-search hide-mobile" onSubmit={handleSearch}>
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </form>

        {/* Header Actions */}
        <div className="header-actions">
          {/* Wishlist */}
          {isAuthenticated && (
            <Link to="/wishlist" className="header-action-btn hide-mobile" title="Wishlist">
              <FiHeart />
            </Link>
          )}

          {/* Cart */}
          <Link to="/cart" className="header-action-btn cart-btn">
            <FiShoppingCart />
            {cart.totalItems > 0 && (
              <span className="cart-badge">{cart.totalItems}</span>
            )}
          </Link>

          {/* User Menu */}
          {isAuthenticated ? (
            <div className="user-menu-container" ref={userMenuRef}>
              <button
                className="header-action-btn user-btn"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <FiUser />
                <span className="user-name hide-mobile">{user?.name?.split(' ')[0]}</span>
              </button>

              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="user-dropdown-header">
                    <p className="user-dropdown-name">{user?.name}</p>
                    <p className="user-dropdown-email">{user?.email}</p>
                  </div>
                  
                  <div className="user-dropdown-divider" />
                  
                  <Link to="/profile" className="user-dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <FiUser /> Profile
                  </Link>
                  <Link to="/orders" className="user-dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <FiPackage /> My Orders
                  </Link>
                  <Link to="/wishlist" className="user-dropdown-item" onClick={() => setShowUserMenu(false)}>
                    <FiHeart /> Wishlist
                  </Link>
                  
                  {isAdmin && (
                    <>
                      <div className="user-dropdown-divider" />
                      <Link to="/admin" className="user-dropdown-item" onClick={() => setShowUserMenu(false)}>
                        <FiSettings /> Admin Dashboard
                      </Link>
                    </>
                  )}
                  
                  <div className="user-dropdown-divider" />
                  
                  <button className="user-dropdown-item logout" onClick={handleLogout}>
                    <FiLogOut /> Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary btn-sm hide-mobile">
              Login
            </Link>
          )}

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-toggle hide-desktop"
            onClick={() => setShowMobileMenu(!showMobileMenu)}
          >
            {showMobileMenu ? <FiX /> : <FiMenu />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {showMobileMenu && (
        <div className="mobile-menu">
          {/* Mobile Search */}
          <form className="mobile-search" onSubmit={handleSearch}>
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>

          {/* Mobile Navigation */}
          <nav className="mobile-nav">
            <Link to="/products" onClick={() => setShowMobileMenu(false)}>All Products</Link>
            <Link to="/products?isFeatured=true" onClick={() => setShowMobileMenu(false)}>Featured</Link>
            
            <div className="mobile-nav-divider" />
            <p className="mobile-nav-title">Categories</p>
            
            {categories.map((category) => (
              <Link
                key={category._id}
                to={`/category/${category.slug}`}
                onClick={() => setShowMobileMenu(false)}
              >
                {category.name}
              </Link>
            ))}
          </nav>

          {/* Mobile Auth */}
          <div className="mobile-auth">
            {isAuthenticated ? (
              <>
                <Link to="/profile" className="mobile-auth-link" onClick={() => setShowMobileMenu(false)}>
                  <FiUser /> Profile
                </Link>
                <Link to="/orders" className="mobile-auth-link" onClick={() => setShowMobileMenu(false)}>
                  <FiPackage /> My Orders
                </Link>
                {isAdmin && (
                  <Link to="/admin" className="mobile-auth-link" onClick={() => setShowMobileMenu(false)}>
                    <FiSettings /> Admin
                  </Link>
                )}
                <button className="mobile-auth-link logout" onClick={handleLogout}>
                  <FiLogOut /> Logout
                </button>
              </>
            ) : (
              <div className="mobile-auth-buttons">
                <Link to="/login" className="btn btn-primary" onClick={() => setShowMobileMenu(false)}>
                  Login
                </Link>
                <Link to="/register" className="btn btn-outline" onClick={() => setShowMobileMenu(false)}>
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
