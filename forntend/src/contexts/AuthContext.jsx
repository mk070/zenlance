import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import apiClient from '../lib/api-client.js'
import toast from 'react-hot-toast'
import { getAccessToken, isAuthenticated, setTokens, removeTokens } from '../lib/auth-utils'

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

  // Initialize authentication state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const accessToken = getAccessToken()
        
        if (accessToken && isAuthenticated()) {
          // Try to get current user
          const userResult = await apiClient.getCurrentUser()
          
          if (userResult.success) {
            setUser(userResult.user)
            
            // Get user profile
            const profileResult = await apiClient.getUserProfile()
            if (profileResult.success) {
              setUserProfile(profileResult.profile)
            }
          } else {
            // Token might be expired, clear it
            removeTokens()
          }
        }
        
        setSessionChecked(true)
        setLoading(false)
      } catch (error) {
        console.error('Error initializing auth:', error)
        setLoading(false)
        setSessionChecked(true)
      }
    }

    initializeAuth()
  }, [])

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
        toast.error(result.error || 'Failed to create account')
        return { success: false, error: result.error, validationErrors: result.validationErrors }
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Network error. Please try again.')
      return { success: false, error: 'Network error' }
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
        setUserProfile(result.user.profile)
        
        toast.success('Welcome back!')
        return { success: true, user: result.user }
      } else {
        toast.error(result.error || 'Failed to sign in')
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Signin error:', error)
      toast.error('Network error. Please try again.')
      return { success: false, error: 'Network error' }
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

  // Update user profile function
  const updateUserProfile = async (profileData) => {
    try {
      const result = await apiClient.updateUserProfile(profileData)

      if (result.success) {
        setUserProfile(result.profile)
        toast.success('Profile updated successfully!')
        return { success: true, profile: result.profile }
      } else {
        toast.error(result.error || 'Failed to update profile')
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Update profile error:', error)
      toast.error('Network error. Please try again.')
      return { success: false, error: 'Network error' }
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
