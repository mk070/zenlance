import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import apiClient from '../lib/api-client.js'
import toast from 'react-hot-toast'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sessionChecked, setSessionChecked] = useState(false)

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const tokens = apiClient.getStoredTokens()
        
        if (tokens.accessToken) {
          // Try to get current user
          const userResult = await apiClient.getCurrentUser()
          
          if (userResult.success) {
            setUser(userResult.data.user)
            
            // Get user profile
            const profileResult = await apiClient.getUserProfile()
            if (profileResult.success) {
              setUserProfile(profileResult.data.profile)
            }
          } else {
            // Token might be expired, clear it
            apiClient.clearTokens()
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

  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true)

      // Only send basic required fields during signup
      const userData = {
        email,
        password,
        firstName: metadata.first_name || metadata.firstName,
        lastName: metadata.last_name || metadata.lastName
      }

      const result = await apiClient.signUp(userData)

      if (result.success) {
        toast.success('Account created successfully! Please check your email for the verification code.')
        return { success: true, needsVerification: true, userId: result.data.userId }
      } else {
        toast.error(result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('An error occurred during sign up')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)

      const result = await apiClient.signIn(email, password)

      if (result.success) {
        setUser(result.data.user)
        setUserProfile(result.data.user.profile)
        toast.success('Welcome back!')
        return { success: true }
      } else {
        if (result.error.includes('verify your email')) {
          return { success: false, error: result.error, needsVerification: true }
        }
        toast.error(result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Signin error:', error)
      toast.error('An error occurred during sign in')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const verifyOTP = async (email, token, type = 'signup') => {
    try {
      console.log('🔍 AuthContext: Starting OTP verification', { email, token, type })
      
      if (!email || !token) {
        const error = 'Email and verification code are required'
        console.log('🔍 AuthContext: Validation failed:', error)
        return { success: false, error }
      }

      if (token.length !== 6 || !/^\d{6}$/.test(token)) {
        const error = 'Please enter a valid 6-digit verification code'
        console.log('🔍 AuthContext: Token format invalid:', error)
        return { success: false, error }
      }

      console.log('🔍 AuthContext: Calling API to verify OTP...')
      
      const result = await apiClient.verifyOTP(email, token)

      console.log('🔍 AuthContext: API response:', { success: result.success, error: result.error })

      if (result.success) {
        console.log('🔍 AuthContext: OTP verified successfully')
        setUser(result.data.user)
        setUserProfile(result.data.user.profile)
        toast.success('Email verified successfully!')
        return { success: true, user: result.data.user }
      } else {
        console.log('🔍 AuthContext: OTP verification failed:', result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('🔍 AuthContext: OTP verification error:', error)
      return { success: false, error: 'Something went wrong. Please try again.' }
    }
  }

  const resendOTP = async (email) => {
    try {
      const result = await apiClient.resendOTP(email)
      
      if (result.success) {
        toast.success('Verification code sent successfully')
        return { success: true }
      } else {
        toast.error(result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Resend OTP error:', error)
      toast.error('Failed to resend verification code')
      return { success: false, error: error.message }
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      await apiClient.signOut()
      
      // Clear local state
      setUser(null)
      setUserProfile(null)
      
      toast.success('Signed out successfully')
      return { success: true }
    } catch (error) {
      console.error('Signout error:', error)
      toast.error('An error occurred during sign out')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email) => {
    try {
      setLoading(true)

      const result = await apiClient.forgotPassword(email)

      if (result.success) {
        toast.success('Password reset email sent!')
        return { success: true }
      } else {
        toast.error(result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Password reset error:', error)
      toast.error('An error occurred sending the reset email')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (currentPassword, newPassword) => {
    try {
      setLoading(true)

      const result = await apiClient.changePassword(currentPassword, newPassword)

      if (result.success) {
        toast.success('Password updated successfully!')
        // Force sign out since all refresh tokens are cleared
        await signOut()
        return { success: true }
      } else {
        toast.error(result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Password update error:', error)
      toast.error('An error occurred updating password')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const updateUserProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      const result = await apiClient.updateUserProfile(updates)

      if (result.success) {
        setUserProfile(result.data.profile)
        toast.success('Profile updated successfully!')
        return { success: true, data: result.data.profile }
      } else {
        toast.error(result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
      return { success: false, error: error.message }
    }
  }

  const completeBusinessSetup = async (businessData) => {
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      setLoading(true)

      // Transform frontend data to backend format
      const profileData = {
        businessName: businessData.businessName,
        businessType: businessData.businessType,
        industry: businessData.industry,
        location: businessData.location || {},
        teamSize: businessData.teamSize,
        primaryGoal: businessData.primaryGoal,
        experienceLevel: businessData.experienceLevel,
        monthlyRevenue: businessData.monthlyRevenue,
        currentTools: businessData.currentTools || [],
        // Mark business setup as completed
        onboarding: {
          currentStep: 'completed',
          completedSteps: ['email_verification', 'business_setup'],
          completionScore: 100
        }
      }

      const result = await apiClient.updateUserProfile(profileData)
      
      if (result.success) {
        setUserProfile(result.data.profile)
        toast.success('Business setup completed successfully!')
        return { success: true }
      } else {
        toast.error(result.error)
        return { success: false, error: result.error }
      }
    } catch (error) {
      console.error('Business setup error:', error)
      toast.error('Failed to complete business setup')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const fetchUserProfile = useCallback(async () => {
    try {
      const result = await apiClient.getUserProfile()
      
      if (result.success) {
        setUserProfile(result.data.profile)
      } else {
        console.error('Error fetching user profile:', result.error)
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
    }
  }, [])

  const refreshSession = async () => {
    try {
      const result = await apiClient.refreshAccessToken()
      return result
    } catch (error) {
      console.error('Session refresh error:', error)
      return { success: false, error: error.message }
    }
  }

  // Simple validation functions (moved from auth-utils)
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    const isValid = emailRegex.test(email)
    return {
      isValid,
      errors: isValid ? [] : ['Please enter a valid email address']
    }
  }

  const validatePassword = (password) => {
    const errors = []
    const warnings = []
    let strength = 0
    
    if (!password) {
      errors.push('Password is required')
      return {
        isValid: false,
        errors,
        warnings,
        strength: 0,
        strengthLabel: 'No Password',
        strengthColor: 'gray'
      }
    }

    // Check requirements and calculate strength
    if (password.length >= 8) {
      strength += 1
    } else {
      errors.push('Password must be at least 8 characters long')
    }

    if (/(?=.*[a-z])/.test(password)) {
      strength += 1
    } else {
      errors.push('Password must contain at least one lowercase letter')
    }

    if (/(?=.*[A-Z])/.test(password)) {
      strength += 1
    } else {
      errors.push('Password must contain at least one uppercase letter')
    }

    if (/(?=.*\d)/.test(password)) {
      strength += 1
    } else {
      errors.push('Password must contain at least one number')
    }

    if (/(?=.*[@$!%*?&])/.test(password)) {
      strength += 1
    } else {
      errors.push('Password must contain at least one special character')
    }

    // Bonus strength points
    if (password.length >= 12) {
      strength += 1
      warnings.push('Great! Long passwords are more secure')
    }

    // Determine strength label and color
    let strengthLabel, strengthColor
    
    if (strength <= 1) {
      strengthLabel = 'Very Weak'
      strengthColor = 'red'
    } else if (strength === 2) {
      strengthLabel = 'Weak'
      strengthColor = 'orange'
    } else if (strength === 3) {
      strengthLabel = 'Fair'
      strengthColor = 'yellow'
    } else if (strength === 4) {
      strengthLabel = 'Good'
      strengthColor = 'blue'
    } else if (strength === 5) {
      strengthLabel = 'Strong'
      strengthColor = 'green'
    } else {
      strengthLabel = 'Very Strong'
      strengthColor = 'emerald'
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

  const validatePasswordMatch = (password, confirmPassword) => {
    const isValid = password === confirmPassword && password.length > 0
    return {
      isValid,
      errors: isValid ? [] : ['Passwords do not match'],
      error: isValid ? null : 'Passwords do not match'
    }
  }

  const validateBusinessName = (businessName) => {
    const isValid = businessName && businessName.trim().length >= 2
    return {
      isValid,
      errors: isValid ? [] : ['Business name must be at least 2 characters long']
    }
  }

  const value = {
    // State
    user,
    userProfile,
    loading,
    sessionChecked,
    
    // Authentication methods
    signUp,
    signIn,
    verifyOTP,
    resendOTP,
    signOut,
    resetPassword,
    updatePassword,
    
    // Profile methods
    updateUserProfile,
    fetchUserProfile,
    completeBusinessSetup,
    
    // Utility methods
    refreshSession,
    
    // Validation methods
    validateEmail,
    validatePassword,
    validatePasswordMatch,
    validateBusinessName
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export default AuthProvider 