/**
 * ===========================================
 * CURRENCY UTILITIES
 * ===========================================
 * 
 * Helper functions for formatting currency
 * in Indian Rupees (INR) format.
 */

/**
 * Format a number as Indian Rupees
 * @param {number} amount - The amount to format
 * @param {boolean} showSymbol - Whether to show ₹ symbol (default: true)
 * @returns {string} - Formatted currency string
 */
export const formatPrice = (amount, showSymbol = true) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return showSymbol ? '₹0.00' : '0.00';
  }
  
  const number = Number(amount);
  
  // Format with Indian locale (en-IN) for proper comma placement
  const formatted = number.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return showSymbol ? `₹${formatted}` : formatted;
};

/**
 * Format price with currency symbol
 * Alias for formatPrice for backward compatibility
 */
export const formatCurrency = formatPrice;

/**
 * Format price without decimal places (for whole numbers)
 * @param {number} amount - The amount to format
 * @returns {string} - Formatted currency string
 */
export const formatPriceWhole = (amount) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  
  const number = Number(amount);
  
  return `₹${number.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })}`;
};

/**
 * Currency symbol
 */
export const CURRENCY_SYMBOL = '₹';

/**
 * Currency code
 */
export const CURRENCY_CODE = 'INR';

export default {
  formatPrice,
  formatCurrency,
  formatPriceWhole,
  CURRENCY_SYMBOL,
  CURRENCY_CODE
};
