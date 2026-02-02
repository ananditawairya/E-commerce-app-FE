// CHANGE: Create centralized validation utilities for form fields

/**
 * Email validation
 * @param {string} email - Email address to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateEmail = (email) => {
  if (!email || email.trim().length === 0) {
    return { isValid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, error: 'Please enter a valid email address' };
  }

  return { isValid: true, error: '' };
};

/**
 * Password validation
 * @param {string} password - Password to validate
 * @param {object} options - Validation options
 * @returns {object} { isValid: boolean, error: string }
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecialChar = true,
  } = options;

  if (!password || password.length === 0) {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return { isValid: false, error: `Password must be at least ${minLength} characters` };
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (requireNumber && !/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  if (requireSpecialChar && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character' };
  }

  return { isValid: true, error: '' };
};

/**
 * Name validation
 * @param {string} name - Name to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateName = (name) => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.trim().length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  if (name.trim().length > 50) {
    return { isValid: false, error: 'Name must not exceed 50 characters' };
  }

  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(name.trim())) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true, error: '' };
};

/**
 * Required field validation
 * @param {string} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (!value || value.trim().length === 0) {
    return { isValid: false, error: `${fieldName} is required` };
  }

  return { isValid: true, error: '' };
};

/**
 * Street address validation
 * @param {string} street - Street address to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateStreet = (street) => {
  if (!street || street.trim().length === 0) {
    return { isValid: false, error: 'Street address is required' };
  }

  if (street.trim().length < 5) {
    return { isValid: false, error: 'Street address must be at least 5 characters' };
  }

  if (street.trim().length > 100) {
    return { isValid: false, error: 'Street address must not exceed 100 characters' };
  }

  return { isValid: true, error: '' };
};

/**
 * City validation
 * @param {string} city - City to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateCity = (city) => {
  if (!city || city.trim().length === 0) {
    return { isValid: false, error: 'City is required' };
  }

  if (city.trim().length < 2) {
    return { isValid: false, error: 'City must be at least 2 characters' };
  }

  const cityRegex = /^[a-zA-Z\s'-]+$/;
  if (!cityRegex.test(city.trim())) {
    return { isValid: false, error: 'City can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true, error: '' };
};

/**
 * State validation
 * @param {string} state - State to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateState = (state) => {
  if (!state || state.trim().length === 0) {
    return { isValid: false, error: 'State is required' };
  }

  if (state.trim().length < 2) {
    return { isValid: false, error: 'State must be at least 2 characters' };
  }

  return { isValid: true, error: '' };
};

/**
 * ZIP code validation
 * @param {string} zipCode - ZIP code to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateZipCode = (zipCode) => {
  if (!zipCode || zipCode.trim().length === 0) {
    return { isValid: false, error: 'ZIP code is required' };
  }

  // Support US ZIP codes (5 digits or 5+4 format) and international postal codes
  const zipRegex = /^[0-9]{5}(-[0-9]{4})?$|^[A-Z0-9]{3,10}$/i;
  if (!zipRegex.test(zipCode.trim())) {
    return { isValid: false, error: 'Please enter a valid ZIP/postal code' };
  }

  return { isValid: true, error: '' };
};

/**
 * Country validation
 * @param {string} country - Country to validate
 * @returns {object} { isValid: boolean, error: string }
 */
export const validateCountry = (country) => {
  if (!country || country.trim().length === 0) {
    return { isValid: false, error: 'Country is required' };
  }

  if (country.trim().length < 2) {
    return { isValid: false, error: 'Country must be at least 2 characters' };
  }

  return { isValid: true, error: '' };
};

/**
 * Password confirmation validation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Confirmation password
 * @returns {object} { isValid: boolean, error: string }
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword || confirmPassword.length === 0) {
    return { isValid: false, error: 'Please confirm your password' };
  }

  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' };
  }

  return { isValid: true, error: '' };
};