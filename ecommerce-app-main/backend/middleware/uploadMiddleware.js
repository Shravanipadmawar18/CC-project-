/**
 * ===========================================
 * FILE UPLOAD MIDDLEWARE
 * ===========================================
 * 
 * Handles file uploads using Multer.
 * Supports product images and user avatars.
 */

const multer = require('multer');
const path = require('path');
const { ApiError } = require('./errorMiddleware');

// ===========================================
// STORAGE CONFIGURATION
// ===========================================

/**
 * Configure disk storage for uploaded files
 */
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Determine upload folder based on file type
    let uploadPath = 'uploads/';
    
    if (file.fieldname === 'avatar') {
      uploadPath += 'avatars/';
    } else if (file.fieldname === 'images' || file.fieldname === 'image') {
      uploadPath += 'products/';
    } else if (file.fieldname === 'categoryImage') {
      uploadPath += 'categories/';
    } else {
      uploadPath += 'misc/';
    }
    
    cb(null, uploadPath);
  },
  filename: function(req, file, cb) {
    // Generate unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const baseName = file.fieldname;
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  }
});

// ===========================================
// FILE FILTER
// ===========================================

/**
 * Filter files by type
 */
const imageFileFilter = (req, file, cb) => {
  // Allowed image types
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  
  // Check extension
  const extname = allowedTypes.test(
    path.extname(file.originalname).toLowerCase()
  );
  
  // Check mime type
  const mimetype = allowedTypes.test(file.mimetype);
  
  if (extname && mimetype) {
    cb(null, true);
  } else {
    cb(new ApiError('Only image files (jpeg, jpg, png, gif, webp) are allowed', 400), false);
  }
};

// ===========================================
// MULTER CONFIGURATION
// ===========================================

/**
 * Configure Multer with storage and limits
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_UPLOAD) || 5 * 1024 * 1024, // 5MB default
    files: 10 // Maximum 10 files per upload
  },
  fileFilter: imageFileFilter
});

// ===========================================
// UPLOAD MIDDLEWARE FUNCTIONS
// ===========================================

/**
 * Upload single product image
 */
const uploadProductImage = upload.single('image');

/**
 * Upload multiple product images (up to 5)
 */
const uploadProductImages = upload.array('images', 5);

/**
 * Upload user avatar
 */
const uploadAvatar = upload.single('avatar');

/**
 * Upload category image
 */
const uploadCategoryImage = upload.single('categoryImage');

/**
 * Handle multer errors
 */
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size too large. Maximum size is 5MB'
      });
    }
    if (err.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Too many files. Maximum is 10 files per upload'
      });
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Unexpected file field'
      });
    }
  }
  
  if (err) {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message || 'Error uploading file'
    });
  }
  
  next();
};

/**
 * Format uploaded file URLs
 */
const formatFileUrls = (req, res, next) => {
  if (req.file) {
    req.file.url = `/${req.file.path.replace(/\\/g, '/')}`;
  }
  
  if (req.files && Array.isArray(req.files)) {
    req.files = req.files.map(file => ({
      ...file,
      url: `/${file.path.replace(/\\/g, '/')}`
    }));
  }
  
  next();
};

module.exports = {
  upload,
  uploadProductImage,
  uploadProductImages,
  uploadAvatar,
  uploadCategoryImage,
  handleUploadError,
  formatFileUrls
};
