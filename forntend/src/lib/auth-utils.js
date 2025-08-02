import { supabase } from './supabase'

// ========================================
// 🔐 AUTHENTICATION UTILITIES
// ========================================

/**
 * Password validation rules
 */
export const PASSWORD_RULES = {
  minLength: parseInt(import.meta.env.VITE_MIN_PASSWORD_LENGTH) || 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: import.meta.env.VITE_REQUIRE_SPECIAL_CHARS === 'true',
  commonPasswords: [
    'password', '123456', '123456789', 'qwerty', 'abc123', 
    'password123', 'admin', 'letmein', 'welcome', 'monkey'
  ]
}

/**
 * Email validation regex
 */
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/

/**
 * Business name validation
 */
export const BUSINESS_NAME_RULES = {
  minLength: 2,
  maxLength: 100,
  allowedChars: /^[a-zA-Z0-9\s\-\.\&\'\,]+$/
}

/**
 * Validate email address
 */
export const validateEmail = (email) => {
  const errors = []
  
  if (!email) {
    errors.push('Email is required')
    return { isValid: false, errors }
  }
  
  if (email.length > 254) {
    errors.push('Email is too long')
  }
  
  if (!EMAIL_REGEX.test(email)) {
    errors.push('Please enter a valid email address')
  }
  
  // Check for common typos
  const commonDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com']
  const domain = email.toLowerCase().split('@')[1]
  if (domain) {
    const suggestions = commonDomains.filter(d => 
      d.includes(domain) || domain.includes(d.slice(0, -4))
    )
    if (suggestions.length > 0 && !commonDomains.includes(domain)) {
      errors.push(`Did you mean ${suggestions[0]}?`)
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    suggestions: errors.filter(e => e.includes('Did you mean'))
  }
}

/**
 * Validate password strength
 */
export const validatePassword = (password) => {
  const errors = []
  const warnings = []
  
  if (!password) {
    errors.push('Password is required')
    return { isValid: false, errors, warnings, strength: 0 }
  }
  
  // Length check
  if (password.length < PASSWORD_RULES.minLength) {
    errors.push(`Password must be at least ${PASSWORD_RULES.minLength} characters`)
  }
  
  if (password.length > PASSWORD_RULES.maxLength) {
    errors.push(`Password must be less than ${PASSWORD_RULES.maxLength} characters`)
  }
  
  // Character requirements
  if (PASSWORD_RULES.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter')
  }
  
  if (PASSWORD_RULES.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter')
  }
  
  if (PASSWORD_RULES.requireNumbers && !/\d/.test(password)) {
    errors.push('Password must contain at least one number')
  }
  
  if (PASSWORD_RULES.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character')
  }
  
  // Common password check
  if (PASSWORD_RULES.commonPasswords.includes(password.toLowerCase())) {
    errors.push('This password is too common. Please choose a more secure password')
  }
  
  // Sequential characters check
  if (/(.)\1{2,}/.test(password)) {
    warnings.push('Avoid repeating characters')
  }
  
  if (/123|abc|qwe|asd/i.test(password)) {
    warnings.push('Avoid sequential characters')
  }
  
  // Calculate strength score
  let strength = 0
  if (password.length >= 8) strength += 1
  if (password.length >= 12) strength += 1
  if (/[A-Z]/.test(password)) strength += 1
  if (/[a-z]/.test(password)) strength += 1
  if (/\d/.test(password)) strength += 1
  if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) strength += 1
  if (password.length >= 16) strength += 1
  
  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong', 'Excellent']
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    strength: Math.min(strength, 6),
    strengthLabel: strengthLabels[Math.min(strength, 6)],
    strengthColor: ['red', 'orange', 'yellow', 'blue', 'green', 'emerald', 'emerald'][Math.min(strength, 6)]
  }
}

/**
 * Validate business name
 */
export const validateBusinessName = (name) => {
  const errors = []
  
  if (!name || !name.trim()) {
    errors.push('Business name is required')
    return { isValid: false, errors }
  }
  
  const trimmedName = name.trim()
  
  if (trimmedName.length < BUSINESS_NAME_RULES.minLength) {
    errors.push(`Business name must be at least ${BUSINESS_NAME_RULES.minLength} characters`)
  }
  
  if (trimmedName.length > BUSINESS_NAME_RULES.maxLength) {
    errors.push(`Business name must be less than ${BUSINESS_NAME_RULES.maxLength} characters`)
  }
  
  if (!BUSINESS_NAME_RULES.allowedChars.test(trimmedName)) {
    errors.push('Business name contains invalid characters')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Check if passwords match
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!password || !confirmPassword) {
    return { isValid: false, error: 'Both password fields are required' }
  }
  
  if (password !== confirmPassword) {
    return { isValid: false, error: 'Passwords do not match' }
  }
  
  return { isValid: true, error: null }
}

/**
 * Sanitize user input
 */
export const sanitizeInput = (input, maxLength = 255) => {
  if (typeof input !== 'string') return ''
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/javascript:/gi, '') // Remove javascript: protocols
}

/**
 * Generate secure random token
 */
export const generateSecureToken = (length = 32) => {
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Rate limiting helper
 */
export class RateLimiter {
  constructor(maxRequests = 5, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = new Map()
  }
  
  isAllowed(identifier) {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
      return false
    }
    
    // Add current request
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    return true
  }
  
  getRemainingRequests(identifier) {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []
    const validRequests = userRequests.filter(time => now - time < this.windowMs)
    
    return Math.max(0, this.maxRequests - validRequests.length)
  }
  
  getResetTime(identifier) {
    const userRequests = this.requests.get(identifier) || []
    if (userRequests.length === 0) return 0
    
    const oldestRequest = Math.min(...userRequests)
    return oldestRequest + this.windowMs
  }
}

/**
 * Session management utilities
 */
export const sessionUtils = {
  /**
   * Check if session is valid and not expired
   */
  isSessionValid: (session) => {
    if (!session || !session.expires_at) return false
    
    const expiresAt = new Date(session.expires_at)
    const now = new Date()
    
    // Check if session expires within 5 minutes (refresh threshold)
    const fiveMinutes = 5 * 60 * 1000
    return expiresAt.getTime() - now.getTime() > fiveMinutes
  },
  
  /**
   * Refresh session if needed
   */
  refreshSessionIfNeeded: async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('Error getting session:', error)
        return { success: false, error: error.message }
      }
      
      if (!session) {
        return { success: false, error: 'No active session' }
      }
      
      // If session is close to expiry, refresh it
      if (!sessionUtils.isSessionValid(session)) {
        const { data, error: refreshError } = await supabase.auth.refreshSession()
        
        if (refreshError) {
          console.error('Error refreshing session:', refreshError)
          return { success: false, error: refreshError.message }
        }
        
        return { success: true, session: data.session }
      }
      
      return { success: true, session }
    } catch (error) {
      console.error('Error in refreshSessionIfNeeded:', error)
      return { success: false, error: error.message }
    }
  }
}

/**
 * User role and permission utilities
 */
export const roleUtils = {
  /**
   * Check if user has required role
   */
  hasRole: (user, requiredRole) => {
    if (!user || !user.user_metadata) return false
    
    const userRole = user.user_metadata.role || 'user'
    const roles = ['user', 'pro', 'business', 'enterprise', 'admin']
    
    const userRoleIndex = roles.indexOf(userRole)
    const requiredRoleIndex = roles.indexOf(requiredRole)
    
    return userRoleIndex >= requiredRoleIndex
  },
  
  /**
   * Get user's subscription tier
   */
  getSubscriptionTier: (userProfile) => {
    return userProfile?.subscription_tier || 'free'
  },
  
  /**
   * Check if user can access feature
   */
  canAccessFeature: (userProfile, feature) => {
    const tier = roleUtils.getSubscriptionTier(userProfile)
    
    const featureAccess = {
      'basic_projects': ['free', 'pro', 'business', 'enterprise'],
      'unlimited_projects': ['business', 'enterprise'],
      'advanced_analytics': ['pro', 'business', 'enterprise'],
      'team_collaboration': ['business', 'enterprise'],
      'white_label': ['enterprise'],
      'api_access': ['business', 'enterprise'],
      'priority_support': ['pro', 'business', 'enterprise']
    }
    
    return featureAccess[feature]?.includes(tier) || false
  }
}

/**
 * Error handling utilities
 */
export const errorUtils = {
  /**
   * Parse Supabase error and return user-friendly message
   */
  parseSupabaseError: (error) => {
    if (!error) return 'An unknown error occurred'
    
    const errorMessage = error.message || error.error_description || ''
    const errorCode = error.code || error.error_code || ''
    
    // Handle OTP-specific errors first
    if (errorCode === 'otp_expired' || errorMessage.includes('Token has expired or is invalid')) {
      return 'Invalid verification code. Please check your email for the latest 6-digit code or request a new one.'
    }
    
    if (errorCode === 'otp_invalid' || errorMessage.includes('Invalid OTP')) {
      return 'Invalid verification code. Please enter the 6-digit code exactly as shown in your email.'
    }
    
    if (errorCode === 'otp_not_found') {
      return 'No verification code found. Please request a new code.'
    }
    
    const errorMappings = {
      'Invalid login credentials': 'Invalid email or password. Please check your credentials and try again.',
      'Email not confirmed': 'Please verify your email address before signing in.',
      'User not found': 'No account found with this email address.',
      'Invalid email': 'Please enter a valid email address.',
      'Password should be at least 6 characters': 'Password must be at least 6 characters long.',
      'User already registered': 'An account with this email already exists.',
      'Signup disabled': 'New registrations are currently disabled.',
      'Email rate limit exceeded': 'Too many emails sent. Please wait before requesting another.',
      'SMS rate limit exceeded': 'Too many SMS messages sent. Please wait before requesting another.',
      'Invalid OTP': 'Invalid verification code. Please check your code and try again.',
      'OTP expired': 'Verification code has expired. Please request a new one.',
      'Token has expired or is invalid': 'Invalid verification code. Please check your email for the latest code.',
      'Database error saving new user': 'Unable to create account. Please try again.'
    }
    
    return errorMappings[errorMessage] || errorMessage || 'An unexpected error occurred'
  },
  
  /**
   * Log error with context
   */
  logError: (error, context = {}) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator?.userAgent,
      url: window?.location?.href
    }
    
    // In production, send to error tracking service
    if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
      // Sentry.captureException(error, { extra: errorData })
    } else {
      console.error('Auth Error:', errorData)
    }
  }
}

/**
 * Security utilities
 */
export const securityUtils = {
  /**
   * Detect suspicious activity
   */
  detectSuspiciousActivity: (attempts, timeWindow = 300000) => { // 5 minutes
    if (!Array.isArray(attempts) || attempts.length < 3) return false
    
    const now = Date.now()
    const recentAttempts = attempts.filter(attempt => now - attempt.timestamp < timeWindow)
    
    // More than 5 failed attempts in 5 minutes
    if (recentAttempts.length > 5) return true
    
    // Check for rapid-fire attempts (less than 1 second apart)
    for (let i = 1; i < recentAttempts.length; i++) {
      if (recentAttempts[i].timestamp - recentAttempts[i-1].timestamp < 1000) {
        return true
      }
    }
    
    return false
  },
  
  /**
   * Generate secure password
   */
  generateSecurePassword: (length = 16) => {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const numbers = '0123456789'
    const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?'
    
    const allChars = uppercase + lowercase + numbers + symbols
    let password = ''
    
    // Ensure at least one character from each set
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]
    
    // Fill the rest randomly
    for (let i = 4; i < length; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('')
  }
}

/**
 * Analytics and tracking utilities
 */
export const analyticsUtils = {
  /**
   * Track authentication events
   */
  trackAuthEvent: (event, properties = {}) => {
    const eventData = {
      event,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        url: window?.location?.href,
        userAgent: navigator?.userAgent
      }
    }
    
    // Send to analytics service
    if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
      // Google Analytics
      if (typeof gtag !== 'undefined') {
        gtag('event', event, properties)
      }
    }
    
    // Custom analytics
    console.log('Auth Event:', eventData)
  }
}

// Create rate limiter instances
export const authRateLimiter = new RateLimiter(5, 300000) // 5 attempts per 5 minutes
export const otpRateLimiter = new RateLimiter(3, 600000) // 3 OTP requests per 10 minutes

export default {
  validateEmail,
  validatePassword,
  validateBusinessName,
  validatePasswordMatch,
  sanitizeInput,
  generateSecureToken,
  RateLimiter,
  sessionUtils,
  roleUtils,
  errorUtils,
  securityUtils,
  analyticsUtils,
  authRateLimiter,
  otpRateLimiter
} 