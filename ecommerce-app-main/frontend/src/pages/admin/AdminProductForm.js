/**
 * ===========================================
 * ADMIN PRODUCT FORM COMPONENT
 * Add/Edit product with image upload
 * ===========================================
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService, categoryService } from '../../services/api';
import Loading from '../../components/common/Loading';
import {
  FaSave,
  FaArrowLeft,
  FaImage,
  FaPlus,
  FaTrash,
  FaTimes
} from 'react-icons/fa';
import toast from 'react-hot-toast';
import './AdminProductForm.css';

const AdminProductForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState([]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    shortDescription: '',
    price: '',
    salePrice: '',
    category: '',
    brand: '',
    sku: '',
    stock: '',
    tags: '',
    specifications: [{ key: '', value: '' }],
    isActive: true,
    isFeatured: false
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchCategories();
    if (isEditing) {
      fetchProduct();
    }
  }, [id]);

  const fetchCategories = async () => {
    try {
      const response = await categoryService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      const response = await adminService.getProduct(id);
      const product = response.data;

      setFormData({
        name: product.name || '',
        description: product.description || '',
        shortDescription: product.shortDescription || '',
        price: product.price?.toString() || '',
        salePrice: product.salePrice?.toString() || '',
        category: product.category?._id || '',
        brand: product.brand || '',
        sku: product.sku || '',
        stock: product.stock?.toString() || '',
        tags: product.tags?.join(', ') || '',
        specifications: product.specifications?.length > 0
          ? product.specifications
          : [{ key: '', value: '' }],
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false
      });

      setExistingImages(product.images || []);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product');
      navigate('/admin/products');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSpecificationChange = (index, field, value) => {
    const newSpecs = [...formData.specifications];
    newSpecs[index][field] = value;
    setFormData((prev) => ({ ...prev, specifications: newSpecs }));
  };

  const addSpecification = () => {
    setFormData((prev) => ({
      ...prev,
      specifications: [...prev.specifications, { key: '', value: '' }]
    }));
  };

  const removeSpecification = (index) => {
    setFormData((prev) => ({
      ...prev,
      specifications: prev.specifications.filter((_, i) => i !== index)
    }));
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length + existingImages.length > 5) {
      toast.error('Maximum 5 images allowed');
      return;
    }

    const newFiles = [...imageFiles, ...files];
    setImageFiles(newFiles);

    // Create previews
    const newPreviews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeNewImage = (index) => {
    const newFiles = imageFiles.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(newFiles);
    setImagePreviews(newPreviews);
  };

  const removeExistingImage = (index) => {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = 'Valid price is required';
    }
    if (formData.salePrice && parseFloat(formData.salePrice) >= parseFloat(formData.price)) {
      newErrors.salePrice = 'Sale price must be less than regular price';
    }
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = 'Valid stock quantity is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors below');
      return;
    }

    setSaving(true);

    try {
      const submitData = new FormData();

      // Append text fields
      submitData.append('name', formData.name.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('shortDescription', formData.shortDescription.trim());
      submitData.append('price', parseFloat(formData.price));
      if (formData.salePrice) {
        submitData.append('salePrice', parseFloat(formData.salePrice));
      }
      submitData.append('category', formData.category);
      submitData.append('brand', formData.brand.trim());
      submitData.append('sku', formData.sku.trim());
      submitData.append('stock', parseInt(formData.stock));
      submitData.append('isActive', formData.isActive);
      submitData.append('isFeatured', formData.isFeatured);

      // Tags
      if (formData.tags) {
        const tagsArray = formData.tags.split(',').map((tag) => tag.trim()).filter(Boolean);
        submitData.append('tags', JSON.stringify(tagsArray));
      }

      // Specifications
      const validSpecs = formData.specifications.filter(
        (spec) => spec.key.trim() && spec.value.trim()
      );
      if (validSpecs.length > 0) {
        submitData.append('specifications', JSON.stringify(validSpecs));
      }

      // Existing images (for editing)
      if (isEditing && existingImages.length > 0) {
        submitData.append('existingImages', JSON.stringify(existingImages));
      }

      // New images
      imageFiles.forEach((file) => {
        submitData.append('images', file);
      });

      if (isEditing) {
        await adminService.updateProduct(id, submitData);
        toast.success('Product updated successfully');
      } else {
        await adminService.createProduct(submitData);
        toast.success('Product created successfully');
      }

      navigate('/admin/products');
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.response?.data?.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <div className="admin-product-form">
      <div className="container">
        {/* Page Header */}
        <div className="form-header">
          <button className="back-btn" onClick={() => navigate('/admin/products')}>
            <FaArrowLeft /> Back to Products
          </button>
          <h1>{isEditing ? 'Edit Product' : 'Add New Product'}</h1>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            {/* Main Content */}
            <div className="form-main">
              {/* Basic Information */}
              <div className="form-section">
                <h2>Basic Information</h2>

                <div className="form-group">
                  <label htmlFor="name">Product Name *</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="shortDescription">Short Description</label>
                  <input
                    type="text"
                    id="shortDescription"
                    name="shortDescription"
                    value={formData.shortDescription}
                    onChange={handleChange}
                    placeholder="Brief description for listings"
                    maxLength={200}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="description">Full Description *</label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Detailed product description"
                    rows={6}
                    className={errors.description ? 'error' : ''}
                  />
                  {errors.description && <span className="error-text">{errors.description}</span>}
                </div>
              </div>

              {/* Images */}
              <div className="form-section">
                <h2>Product Images</h2>
                <p className="section-description">
                  Upload up to 5 images. First image will be the main product image.
                </p>

                <div className="images-grid">
                  {/* Existing Images */}
                  {existingImages.map((image, index) => (
                    <div key={`existing-${index}`} className="image-preview">
                      <img src={image} alt={`Product ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => removeExistingImage(index)}
                      >
                        <FaTimes />
                      </button>
                      {index === 0 && <span className="main-badge">Main</span>}
                    </div>
                  ))}

                  {/* New Image Previews */}
                  {imagePreviews.map((preview, index) => (
                    <div key={`new-${index}`} className="image-preview">
                      <img src={preview} alt={`New ${index + 1}`} />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => removeNewImage(index)}
                      >
                        <FaTimes />
                      </button>
                      {existingImages.length === 0 && index === 0 && (
                        <span className="main-badge">Main</span>
                      )}
                    </div>
                  ))}

                  {/* Upload Button */}
                  {existingImages.length + imagePreviews.length < 5 && (
                    <label className="image-upload">
                      <FaPlus />
                      <span>Add Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        multiple
                        hidden
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Specifications */}
              <div className="form-section">
                <h2>Specifications</h2>
                <p className="section-description">
                  Add product specifications like dimensions, weight, materials, etc.
                </p>

                <div className="specifications-list">
                  {formData.specifications.map((spec, index) => (
                    <div key={index} className="specification-row">
                      <input
                        type="text"
                        placeholder="Specification name"
                        value={spec.key}
                        onChange={(e) => handleSpecificationChange(index, 'key', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Value"
                        value={spec.value}
                        onChange={(e) => handleSpecificationChange(index, 'value', e.target.value)}
                      />
                      {formData.specifications.length > 1 && (
                        <button
                          type="button"
                          className="remove-spec"
                          onClick={() => removeSpecification(index)}
                        >
                          <FaTrash />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <button type="button" className="add-spec-btn" onClick={addSpecification}>
                  <FaPlus /> Add Specification
                </button>
              </div>
            </div>

            {/* Sidebar */}
            <div className="form-sidebar">
              {/* Status */}
              <div className="form-section">
                <h2>Status</h2>

                <div className="toggle-group">
                  <label className="toggle-label">
                    <span>Active</span>
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={formData.isActive}
                      onChange={handleChange}
                    />
                    <span className="toggle"></span>
                  </label>
                  <p className="toggle-description">
                    Product will be visible on the store
                  </p>
                </div>

                <div className="toggle-group">
                  <label className="toggle-label">
                    <span>Featured</span>
                    <input
                      type="checkbox"
                      name="isFeatured"
                      checked={formData.isFeatured}
                      onChange={handleChange}
                    />
                    <span className="toggle"></span>
                  </label>
                  <p className="toggle-description">
                    Show in featured products section
                  </p>
                </div>
              </div>

              {/* Pricing */}
              <div className="form-section">
                <h2>Pricing</h2>

                <div className="form-group">
                  <label htmlFor="price">Regular Price *</label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input
                      type="number"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={errors.price ? 'error' : ''}
                    />
                  </div>
                  {errors.price && <span className="error-text">{errors.price}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="salePrice">Sale Price</label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input
                      type="number"
                      id="salePrice"
                      name="salePrice"
                      value={formData.salePrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      className={errors.salePrice ? 'error' : ''}
                    />
                  </div>
                  {errors.salePrice && <span className="error-text">{errors.salePrice}</span>}
                </div>
              </div>

              {/* Organization */}
              <div className="form-section">
                <h2>Organization</h2>

                <div className="form-group">
                  <label htmlFor="category">Category *</label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={errors.category ? 'error' : ''}
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat._id} value={cat._id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.category && <span className="error-text">{errors.category}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="brand">Brand</label>
                  <input
                    type="text"
                    id="brand"
                    name="brand"
                    value={formData.brand}
                    onChange={handleChange}
                    placeholder="Product brand"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="tags">Tags</label>
                  <input
                    type="text"
                    id="tags"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="tag1, tag2, tag3"
                  />
                  <span className="help-text">Separate tags with commas</span>
                </div>
              </div>

              {/* Inventory */}
              <div className="form-section">
                <h2>Inventory</h2>

                <div className="form-group">
                  <label htmlFor="sku">SKU</label>
                  <input
                    type="text"
                    id="sku"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="Stock Keeping Unit"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="stock">Stock Quantity *</label>
                  <input
                    type="number"
                    id="stock"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="0"
                    min="0"
                    className={errors.stock ? 'error' : ''}
                  />
                  {errors.stock && <span className="error-text">{errors.stock}</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/admin/products')}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              <FaSave />
              {saving ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdminProductForm;
