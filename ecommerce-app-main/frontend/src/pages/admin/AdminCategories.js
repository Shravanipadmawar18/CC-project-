/**
 * ===========================================
 * ADMIN CATEGORIES PAGE COMPONENT
 * Category management with CRUD operations
 * ===========================================
 */

import React, { useState, useEffect } from 'react';
import { adminService, categoryService } from '../../services/api';
import Loading from '../../components/common/Loading';
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaImage,
  FaSave,
  FaTimes,
  FaFolder
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import './AdminCategories.css';

const AdminCategories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(null);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: null
  });
  const [imagePreview, setImagePreview] = useState(null);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const openModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        image: null
      });
      setImagePreview(category.image || null);
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        image: null
      });
      setImagePreview(null);
    }
    setErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', image: null });
    setImagePreview(null);
    setErrors({});
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData((prev) => ({ ...prev, image: file }));
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    try {
      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('description', formData.description.trim());
      if (formData.image) {
        submitData.append('image', formData.image);
      }

      if (editingCategory) {
        await adminService.updateCategory(editingCategory._id, submitData);
        toast.success('Category updated successfully');
      } else {
        await adminService.createCategory(submitData);
        toast.success('Category created successfully');
      }

      closeModal();
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (categoryId) => {
    if (!window.confirm('Are you sure you want to delete this category? Products in this category will become uncategorized.')) {
      return;
    }

    setDeleteLoading(categoryId);
    try {
      await adminService.deleteCategory(categoryId);
      setCategories((prev) => prev.filter((cat) => cat._id !== categoryId));
      toast.success('Category deleted successfully');
    } catch (error) {
      toast.error('Failed to delete category');
    } finally {
      setDeleteLoading(null);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="admin-categories">
      <div className="container">
        {/* Page Header */}
        <div className="admin-header">
          <div>
            <h1>Categories</h1>
            <p>{categories.length} total categories</p>
          </div>
          <div className="header-actions">
            <button className="btn btn-primary" onClick={() => openModal()}>
              <FaPlus /> Add Category
            </button>
          </div>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <div className="no-categories">
            <FaFolder />
            <h3>No categories yet</h3>
            <p>Create categories to organize your products</p>
            <button className="btn btn-primary" onClick={() => openModal()}>
              <FaPlus /> Add First Category
            </button>
          </div>
        ) : (
          <div className="categories-grid">
            {categories.map((category) => (
              <div key={category._id} className="category-card">
                <div className="category-image">
                  {category.image ? (
                    <img src={category.image} alt={category.name} />
                  ) : (
                    <FaImage />
                  )}
                </div>
                <div className="category-content">
                  <h3>{category.name}</h3>
                  <p className="category-description">
                    {category.description || 'No description'}
                  </p>
                  <p className="product-count">
                    {category.productCount || 0} products
                  </p>
                </div>
                <div className="category-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => openModal(category)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(category._id)}
                    disabled={deleteLoading === category._id}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="modal-overlay" onClick={closeModal}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>{editingCategory ? 'Edit Category' : 'Add Category'}</h2>
                <button className="close-btn" onClick={closeModal}>
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="modal-body">
                  {/* Image Upload */}
                  <div className="image-upload-section">
                    <label className="image-upload-label">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" />
                      ) : (
                        <div className="upload-placeholder">
                          <FaImage />
                          <span>Upload Image</span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        hidden
                      />
                    </label>
                  </div>

                  {/* Name */}
                  <div className="form-group">
                    <label htmlFor="name">Category Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter category name"
                      className={errors.name ? 'error' : ''}
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                  </div>

                  {/* Description */}
                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Enter category description"
                      rows={3}
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={closeModal}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    <FaSave />
                    {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminCategories;
