/**
 * ===========================================
 * AUTHENTICATION CONTROLLER
 * ===========================================
 * 
 * Handles user registration, login, and
 * authentication-related operations.
 */

const User = require('../models/User');
const Cart = require('../models/Cart');
const { asyncHandler, ApiError } = require('../middleware/errorMiddleware');

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body;

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new ApiError('User already exists with this email', 400);
  }

  // Create new user
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    phone
  });

  // Create empty cart for new user
  await Cart.create({ user: user._id, items: [] });

  // Generate token
  const token = user.generateAuthToken();

  // Send response
  res.status(201).json({
    success: true,
    message: 'Registration successful',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar
      },
      token
    }
  });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email (include password for comparison)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    throw new ApiError('Invalid email or password', 401);
  }

  // Check if user is active
  if (!user.isActive) {
    throw new ApiError('Your account has been deactivated. Please contact support.', 401);
  }

  // Compare password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new ApiError('Invalid email or password', 401);
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generate token
  const token = user.generateAuthToken();

  // Send response
  res.status(200).json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address
      },
      token
    }
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .populate('wishlist', 'name price images');

  res.status(200).json({
    success: true,
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address,
        wishlist: user.wishlist,
        createdAt: user.createdAt
      }
    }
  });
});

/**
 * @desc    Update user profile
 * @route   PUT /api/auth/update-profile
 * @access  Private
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body;

  const user = await User.findById(req.user._id);

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Update fields
  if (name) user.name = name;
  if (phone) user.phone = phone;
  if (address) user.address = { ...user.address, ...address };

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully',
    data: {
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        phone: user.phone,
        address: user.address
      }
    }
  });
});

/**
 * @desc    Update password
 * @route   PUT /api/auth/update-password
 * @access  Private
 */
const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await User.findById(req.user._id).select('+password');

  // Check current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError('Current password is incorrect', 401);
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Generate new token
  const token = user.generateAuthToken();

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    data: { token }
  });
});

/**
 * @desc    Upload user avatar
 * @route   PUT /api/auth/avatar
 * @access  Private
 */
const uploadAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new ApiError('Please upload an image', 400);
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: req.file.url },
    { new: true }
  );

  res.status(200).json({
    success: true,
    message: 'Avatar uploaded successfully',
    data: {
      avatar: user.avatar
    }
  });
});

/**
 * @desc    Logout user (client-side)
 * @route   POST /api/auth/logout
 * @access  Private
 * @note    Since JWT is stateless, actual logout happens client-side by deleting the token
 */
const logout = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  uploadAvatar,
  logout
};
