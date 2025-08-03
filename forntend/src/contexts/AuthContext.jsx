import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import apiClient from '../lib/api-client.js'
import toast from 'react-hot-toast'
import { getAccessToken, isAuthenticated, setTokens, removeTokens, isAccessTokenExpired } from '../lib/auth-utils'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionChecked, setSessionChecked] = useState(false)

  // Initialize auth state
  const initializeAuth = async () => {
    try {
      const token = getAccessToken()
      if (!token) {
        setLoading(false)
        return
      }

      // Check if token is expired
      if (isAccessTokenExpired()) {
        try {
          // Try to refresh the token
          const newToken = await apiClient.refreshAccessToken()
          if (!newToken) {
            throw new Error('Token refresh failed')
          }
        } catch (refreshError) {
          console.warn('Token refresh failed during initialization:', refreshError)
          removeTokens()
          setLoading(false)
          return
        }
      }

      // Get current user
      try {
        const result = await apiClient.getCurrentUser()
        if (result.success && result.user) {
          setUser(result.user)
          
          // Try to get profile
          try {
            const profileResult = await apiClient.getProfile()
            if (profileResult.success && profileResult.profile) {
              setUserProfile(profileResult.profile)
            } else {
              // Set default profile if none found
              setUserProfile({
                onboardingCompleted: false,
                firstName: result.user.firstName || '',
                lastName: result.user.lastName || ''
              })
            }
          } catch (profileError) {
            console.warn('Profile fetch failed during initialization:', profileError)
            // Set default profile
            setUserProfile({
              onboardingCompleted: false,
              firstName: result.user.firstName || '',
              lastName: result.user.lastName || ''
            })
          }
        } else {
          removeTokens()
        }
      } catch (userError) {
        console.warn('User fetch failed during initialization:', userError)
        removeTokens()
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
      removeTokens()
    } finally {
      setLoading(false)
    }
  }

  // Sign up function
  const signUp = async (email, password, firstName, lastName) => {
    try {
      const result = await apiClient.signUp({
        email,
        password,
        firstName,
        lastName
      })

      if (result.success) {
        toast.success('Account created successfully! Please check your email for verification.')
        return { success: true }
      } else {
        // Handle validation errors
        if (result.validationErrors && result.validationErrors.length > 0) {
          // Display each validation error
          result.validationErrors.forEach(error => {
            toast.error(`${error.field}: ${error.message}`)
          })
        } else {
          // Display general error
          toast.error(result.error || 'Failed to create account')
        }
        return { success: false, error: result.error, validationErrors: result.validationErrors }
      }
    } catch (error) {
      console.error('Signup error:', error)
      const errorMessage = error.message || 'Network error. Please check your connection and try again.'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Sign in function
  const signIn = async (email, password) => {
    try {
      const result = await apiClient.signIn(email, password)

      if (result.success) {
        // Store tokens
        setTokens(result.tokens.accessToken, result.tokens.refreshToken)
        
        // Set user data
        setUser(result.user)
        
        // Try to fetch profile, but don't fail signin if it fails
        try {
          const profileResult = await apiClient.getProfile()
          if (profileResult.success && profileResult.profile) {
            setUserProfile(profileResult.profile)
          } else {
            console.warn('Profile fetch returned unsuccessful result:', profileResult)
            // Set a default profile if none exists
            setUserProfile({
              onboardingCompleted: false,
              firstName: result.user.firstName || '',
              lastName: result.user.lastName || ''
            })
          }
        } catch (profileError) {
          console.warn('Failed to fetch profile during signin:', profileError)
          // Set a default profile if fetch fails
          setUserProfile({
            onboardingCompleted: false,
            firstName: result.user.firstName || '',
            lastName: result.user.lastName || ''
          })
        }
        
        toast.success('Welcome back!')
        return { success: true, user: result.user }
      } else {
        const errorMessage = result.error || 'Failed to sign in'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      console.error('Signin error:', error)
      
      let errorMessage = 'Sign in failed. Please try again.'
      
      // Handle specific error types
      if (error.status === 403) {
        errorMessage = 'Please verify your email address before signing in.'
      } else if (error.status === 401) {
        errorMessage = 'Invalid email or password.'
      } else if (error.status === 423) {
        errorMessage = 'Account temporarily locked. Please try again later.'
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network error. Please check your connection.'
      } else if (error.data?.error) {
        errorMessage = error.data.error
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // OTP verification function
  const verifyOTP = async (email, otp) => {
    try {
      const result = await apiClient.verifyOTP(email, otp)

      if (result.success) {
        // Store tokens
        setTokens(result.tokens.accessToken, result.tokens.refreshToken)
        
        // Set user data
        setUser(result.user)
        setUserProfile(result.user.profile)
        
        toast.success('Email verified successfully!')
        return { success: true, user: result.user, profile: result.user.profile }
      } else {
        toast.error(result.error || 'Failed to verify OTP')
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('OTP verification error:', error)
      toast.error('Network error. Please try again.')
      return { success: false, error: 'Network error' }
    }
  }

  // Resend OTP function
  const resendOTP = async (email) => {
    try {
      const result = await apiClient.resendOTP(email)

      if (result.success) {
        toast.success('Verification code sent to your email!')
        return { success: true }
      } else {
        toast.error(result.error || 'Failed to send verification code')
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      toast.error('Network error. Please try again.')
      return { success: false, error: 'Network error' }
    }
  }

  // Forgot password function
  const forgotPassword = async (email) => {
    try {
      const result = await apiClient.forgotPassword(email)

      if (result.success) {
        toast.success('Password reset link sent to your email!')
        return { success: true }
      } else {
        toast.error(result.error || 'Failed to send reset link')
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Forgot password error:', error)
      toast.error('Network error. Please try again.')
      return { success: false, error: 'Network error' }
    }
  }

  // Reset password function
  const resetPassword = async (token, newPassword) => {
    try {
      const result = await apiClient.resetPassword(token, newPassword)

      if (result.success) {
        toast.success('Password reset successfully!')
        return { success: true }
      } else {
        toast.error(result.error || 'Failed to reset password')
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Reset password error:', error)
      toast.error('Network error. Please try again.')
      return { success: false, error: 'Network error' }
    }
  }

  // Update user profile
  const updateUserProfile = async (profileData) => {
    try {
      // Check if user is logged in
      if (!user) {
        throw new Error('User not logged in')
      }

      // Check if we have a valid access token
      const token = getAccessToken()
      if (!token) {
        throw new Error('No access token available')
      }

      console.log('Updating user profile...', profileData)
      
      const result = await apiClient.updateUserProfile(profileData)

      if (result.success) {
        // Update local user profile state
        setUserProfile(result.profile)
        toast.success('Profile updated successfully!')
        return { success: true, profile: result.profile }
      } else {
        const errorMessage = result.error || 'Failed to update profile'
        toast.error(errorMessage)
        return { success: false, error: errorMessage }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      
      let errorMessage = 'Failed to update profile. Please try again.'
      
      // Handle specific error types
      if (error.message.includes('Session expired')) {
        errorMessage = 'Your session has expired. Please sign in again.'
        // Don't show toast here as user will be redirected
      } else if (error.status === 401) {
        errorMessage = 'Authentication failed. Please sign in again.'
      } else if (error.status === 403) {
        errorMessage = 'You don\'t have permission to update this profile.'
      } else if (error.status === 400) {
        errorMessage = error.data?.error || 'Invalid profile data provided.'
      } else if (error.message.includes('Network error')) {
        errorMessage = 'Network error. Please check your connection.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Only show toast if not a session expiry (as user will be redirected)
      if (!error.message.includes('Session expired')) {
        toast.error(errorMessage)
      }
      
      return { success: false, error: errorMessage }
    }
  }

  // Complete business setup function
  const completeBusinessSetup = async (businessData) => {
    try {
      const result = await apiClient.updateUserProfile({
        ...businessData,
        onboardingCompleted: true
      })

      if (result.success) {
        setUserProfile(result.profile)
        toast.success('Business setup completed!')
        return { success: true, profile: result.profile }
      } else {
        toast.error(result.error || 'Failed to complete business setup')
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Business setup error:', error)
      toast.error('Network error. Please try again.')
      return { success: false, error: 'Network error' }
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      await apiClient.signOut()
    } catch (error) {
      console.error('Error during signout:', error)
    } finally {
      // Clear local state regardless of API response
      setUser(null)
      setUserProfile(null)
      removeTokens()
      toast.success('Signed out successfully')
    }
  }

  // Password validation function
  const validatePassword = (password) => {
    const checks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecialChar: /[@$!%*?&]/.test(password)
    }

    const errors = []
    const warnings = []

    if (!checks.minLength) errors.push('At least 8 characters')
    if (!checks.hasUppercase) errors.push('One uppercase letter')
    if (!checks.hasLowercase) errors.push('One lowercase letter')
    if (!checks.hasNumber) errors.push('One number')
    if (!checks.hasSpecialChar) errors.push('One special character (@$!%*?&)')

    // Calculate strength
    const passedChecks = Object.values(checks).filter(Boolean).length
    let strength = 0
    let strengthLabel = 'Very Weak'
    let strengthColor = 'text-red-500'

    if (passedChecks >= 5) {
      strength = 100
      strengthLabel = 'Very Strong'
      strengthColor = 'text-emerald-500'
    } else if (passedChecks >= 4) {
      strength = 80
      strengthLabel = 'Strong'
      strengthColor = 'text-green-500'
    } else if (passedChecks >= 3) {
      strength = 60
      strengthLabel = 'Medium'
      strengthColor = 'text-yellow-500'
    } else if (passedChecks >= 2) {
      strength = 40
      strengthLabel = 'Weak'
      strengthColor = 'text-orange-500'
    } else if (passedChecks >= 1) {
      strength = 20
      strengthLabel = 'Very Weak'
      strengthColor = 'text-red-500'
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      strength,
      strengthLabel,
      strengthColor
    }
  }

  // Password match validation
  const validatePasswordMatch = (password, confirmPassword) => {
    const isMatch = password === confirmPassword
    return {
      isValid: isMatch,
      error: isMatch ? null : 'Passwords do not match'
    }
  }

  // Email validation function
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return {
      isValid: emailRegex.test(email),
      error: emailRegex.test(email) ? null : 'Please enter a valid email address'
    }
  }

  // Check if user is authenticated
  const isUserAuthenticated = () => {
    return isAuthenticated() && user !== null
  }

  // Initialize auth on component mount
  useEffect(() => {
    initializeAuth()
  }, [])

  const value = {
    user,
    userProfile,
    loading,
    sessionChecked,
    signUp,
    signIn,
    verifyOTP,
    resendOTP,
    forgotPassword,
    resetPassword,
    signOut,
    updateUserProfile,
    completeBusinessSetup,
    validatePassword,
    validatePasswordMatch,
    validateEmail,
    isAuthenticated: isUserAuthenticated
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
} 
