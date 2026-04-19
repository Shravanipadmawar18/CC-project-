/**
 * ===========================================
 * AUTHENTICATION CONTEXT
 * ===========================================
 * 
 * Manages user authentication state globally.
 * Provides login, logout, and auth check functions.
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';
import toast from 'react-hot-toast';

// Create context
const AuthContext = createContext(null);

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is admin
  const isAdmin = user?.role === 'admin';

  // Load user from localStorage on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          // Verify token is still valid
          const response = await authService.getMe();
          setUser(response.data.data.user);
          setIsAuthenticated(true);
        } catch (error) {
          // Only clear auth if it's NOT a network error (server might be temporarily down)
          if (error.isNetworkError) {
            // Network error - use cached user data
            try {
              const cachedUser = JSON.parse(savedUser);
              setUser(cachedUser);
              setIsAuthenticated(true);
            } catch {
              // Invalid cached user
              setUser(null);
              setIsAuthenticated(false);
            }
          } else {
            // Token actually invalid - clear storage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  // Register new user
  const register = useCallback(async (userData) => {
    try {
      const response = await authService.register(userData);
      const { user: newUser, token } = response.data.data;

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(newUser));

      // Update state
      setUser(newUser);
      setIsAuthenticated(true);

      toast.success('Registration successful! Welcome!');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Registration failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Login user
  const login = useCallback(async (credentials) => {
    try {
      const response = await authService.login(credentials);
      const { user: loggedInUser, token } = response.data.data;

      // Save to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(loggedInUser));

      // Update state
      setUser(loggedInUser);
      setIsAuthenticated(true);

      toast.success(`Welcome back, ${loggedInUser.name}!`);
      return { success: true, user: loggedInUser };
    } catch (error) {
      const message = error.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      // Continue with logout even if API call fails
    }

    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');

    // Clear state
    setUser(null);
    setIsAuthenticated(false);

    toast.success('Logged out successfully');
  }, []);

  // Update user profile
  const updateProfile = useCallback(async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData);
      const updatedUser = response.data.data.user;

      // Update localStorage
      localStorage.setItem('user', JSON.stringify(updatedUser));

      // Update state
      setUser(updatedUser);

      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Failed to update profile';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Update password
  const updatePassword = useCallback(async (passwordData) => {
    try {
      await authService.updatePassword(passwordData);
      toast.success('Password updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Failed to update password';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Context value
  const value = {
    user,
    loading,
    isAuthenticated,
    isAdmin,
    register,
    login,
    logout,
    updateProfile,
    updatePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
