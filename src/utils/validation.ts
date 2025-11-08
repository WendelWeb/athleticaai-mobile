/**
 * Validation Utilities
 *
 * Strict validation for auth forms
 */

/**
 * Validate email with strict rules
 * - Must match email format
 * - Must have valid domain
 * - Blocks common fake emails (test@test, fake@fake, etc.)
 */
export const validateEmail = (email: string): { isValid: boolean; error?: string } => {
  // Check if empty
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  // Trim and lowercase
  const cleanEmail = email.trim().toLowerCase();

  // Basic format validation (RFC 5322 simplified)
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!emailRegex.test(cleanEmail)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  // Extract domain
  const domain = cleanEmail.split('@')[1];

  // Blocked fake domains
  const fakeDomains = [
    'test.com',
    'test',
    'fake.com',
    'fake',
    'example.com',
    'demo.com',
    'temp.com',
    'throwaway.com',
    'mailinator.com',
    'guerrillamail.com',
    '10minutemail.com',
  ];

  if (fakeDomains.includes(domain)) {
    return { isValid: false, error: 'Please use a real email address' };
  }

  // Check domain has valid TLD (at least 2 characters)
  const domainParts = domain.split('.');
  const tld = domainParts[domainParts.length - 1];

  if (!tld || tld.length < 2) {
    return { isValid: false, error: 'Invalid email domain' };
  }

  // All checks passed
  return { isValid: true };
};

/**
 * Validate password strength
 * - At least 8 characters
 * - At least 1 uppercase
 * - At least 1 lowercase
 * - At least 1 number
 * - Optional: At least 1 special character
 */
export const validatePassword = (
  password: string,
  requireSpecialChar: boolean = false
): { isValid: boolean; error?: string; strength?: 'weak' | 'medium' | 'strong' } => {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters', strength: 'weak' };
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  // Check minimum requirements
  if (!hasUpperCase || !hasLowerCase || !hasNumber) {
    return {
      isValid: false,
      error: 'Password must contain uppercase, lowercase, and number',
      strength: 'weak',
    };
  }

  if (requireSpecialChar && !hasSpecialChar) {
    return {
      isValid: false,
      error: 'Password must contain a special character',
      strength: 'medium',
    };
  }

  // Determine strength
  let strength: 'weak' | 'medium' | 'strong' = 'medium';

  if (password.length >= 12 && hasSpecialChar) {
    strength = 'strong';
  } else if (password.length >= 10) {
    strength = 'medium';
  }

  return { isValid: true, strength };
};

/**
 * Validate full name
 * - At least 2 characters
 * - Only letters and spaces
 * - At least first and last name
 */
export const validateFullName = (name: string): { isValid: boolean; error?: string } => {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Full name is required' };
  }

  const cleanName = name.trim();

  if (cleanName.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters' };
  }

  // Check for at least first and last name
  const nameParts = cleanName.split(' ').filter((part) => part.length > 0);

  if (nameParts.length < 2) {
    return { isValid: false, error: 'Please enter your first and last name' };
  }

  // Check for invalid characters (allow letters, spaces, hyphens, apostrophes)
  const nameRegex = /^[a-zA-Z\s'-]+$/;

  if (!nameRegex.test(cleanName)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens' };
  }

  return { isValid: true };
};

/**
 * Get password strength color
 */
export const getPasswordStrengthColor = (
  strength: 'weak' | 'medium' | 'strong' | undefined
): string => {
  switch (strength) {
    case 'weak':
      return '#FF3B30'; // Red
    case 'medium':
      return '#FF9500'; // Orange
    case 'strong':
      return '#10B981'; // Green
    default:
      return '#8E8E93'; // Gray
  }
};

/**
 * Get password strength label
 */
export const getPasswordStrengthLabel = (
  strength: 'weak' | 'medium' | 'strong' | undefined
): string => {
  switch (strength) {
    case 'weak':
      return 'Weak';
    case 'medium':
      return 'Medium';
    case 'strong':
      return 'Strong';
    default:
      return '';
  }
};
