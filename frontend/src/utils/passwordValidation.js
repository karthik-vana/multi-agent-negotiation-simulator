/**
 * Password & Email Validation Utilities
 * 
 * Enforces secure password requirements:
 * 1. At least 8 characters long
 * 2. At least one uppercase letter (A-Z)
 * 3. At least one lowercase letter (a-z)
 * 4. At least one number (0-9)
 * 5. At least one special character (@, #, $, %, !, etc.)
 * 6. Reject passwords consisting entirely of whitespace
 * 7. Trim whitespace from email addresses without silently modifying passwords
 */

export const validatePassword = (password) => {
  if (typeof password !== 'string') {
    return {
      isValid: false,
      checks: {
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false,
        notAllWhitespace: false,
      },
      errors: ['Password must be a valid string.']
    };
  }

  // Individual rule checks
  const minLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[@#$%!&*^~_+\-=\[\]{}|;:,.<>?\\/]/.test(password);
  const notAllWhitespace = password.trim().length > 0;

  const checks = {
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial,
    notAllWhitespace
  };

  const errors = [];
  if (!minLength) errors.push('Password must be at least 8 characters long.');
  if (!hasUpper) errors.push('Password must contain at least one uppercase letter (A–Z).');
  if (!hasLower) errors.push('Password must contain at least one lowercase letter (a–z).');
  if (!hasNumber) errors.push('Password must contain at least one number (0–9).');
  if (!hasSpecial) errors.push('Password must contain at least one special character (@, #, $, %, !, etc.).');
  if (!notAllWhitespace) errors.push('Password cannot consist entirely of whitespace.');

  const isValid = minLength && hasUpper && hasLower && hasNumber && hasSpecial && notAllWhitespace;

  return {
    isValid,
    checks,
    errors
  };
};

/**
 * Validates and sanitizes email address
 * Trims leading/trailing whitespace without modifying case or inner characters
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return {
      isValid: false,
      sanitizedEmail: '',
      error: 'Email address is required.'
    };
  }

  const sanitizedEmail = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(sanitizedEmail)) {
    return {
      isValid: false,
      sanitizedEmail,
      error: 'Please enter a valid email address.'
    };
  }

  return {
    isValid: true,
    sanitizedEmail,
    error: null
  };
};
