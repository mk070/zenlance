import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { 
  validateEmail, 
  validatePassword, 
  validateBusinessName,
  validatePasswordMatch,
  sanitizeInput,
  sessionUtils,
  errorUtils,
  securityUtils,
  analyticsUtils,
  authRateLimiter,
  otpRateLimiter
} from '../lib/auth-utils'
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
  const [authAttempts, setAuthAttempts] = useState([])

  // Session management with automatic refresh
  useEffect(() => {
    let refreshTimer

    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        
        if (session?.user) {
          setUser(session.user)
          await fetchUserProfile(session.user.id)
          setupSessionRefresh(session)
          analyticsUtils.trackAuthEvent('session_restored')
        }
        
        setSessionChecked(true)
        setLoading(false)
      } catch (error) {
        console.error('Error initializing auth:', error)
        errorUtils.logError(error, { context: 'auth_initialization' })
        setLoading(false)
      }
    }

    const setupSessionRefresh = (session) => {
      if (!session?.expires_at) return

      const expiresAt = new Date(session.expires_at)
      const now = new Date()
      const timeUntilRefresh = expiresAt.getTime() - now.getTime() - 300000 // Refresh 5 minutes before expiry

      if (timeUntilRefresh > 0) {
        refreshTimer = setTimeout(async () => {
          const refreshResult = await sessionUtils.refreshSessionIfNeeded()
          if (refreshResult.success) {
            setupSessionRefresh(refreshResult.session)
          }
        }, timeUntilRefresh)
      }
    }

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event)
        
        try {
          if (event === 'SIGNED_IN') {
            setUser(session?.user ?? null)
            if (session?.user) {
              await fetchUserProfile(session.user.id)
              setupSessionRefresh(session)
              analyticsUtils.trackAuthEvent('user_signed_in', {
                user_id: session.user.id,
                method: 'password'
              })
            }
          } else if (event === 'SIGNED_OUT') {
            setUser(null)
            setUserProfile(null)
            if (refreshTimer) clearTimeout(refreshTimer)
            analyticsUtils.trackAuthEvent('user_signed_out')
          } else if (event === 'TOKEN_REFRESHED') {
            if (session) {
              setUser(session.user)
              setupSessionRefresh(session)
            }
          } else if (event === 'USER_UPDATED') {
            setUser(session?.user ?? null)
            if (session?.user) {
              await fetchUserProfile(session.user.id)
            }
          }
          
          setLoading(false)
        } catch (error) {
          console.error('Error handling auth state change:', error)
          errorUtils.logError(error, { context: 'auth_state_change', event })
          setLoading(false)
        }
      }
    )

    initializeAuth()

    return () => {
      subscription?.unsubscribe()
      if (refreshTimer) clearTimeout(refreshTimer)
    }
  }, [])

  const fetchUserProfile = useCallback(async (userId) => {
    try {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching user profile:', error)
        errorUtils.logError(error, { context: 'fetch_user_profile', userId })
        return
      }

      setUserProfile(profile)
    } catch (error) {
      console.error('Error in fetchUserProfile:', error)
      errorUtils.logError(error, { context: 'fetch_user_profile_catch', userId })
    }
  }, [])

  const createUserProfile = async (userId, metadata) => {
    try {
      // Sanitize inputs
      const sanitizedMetadata = {
        first_name: sanitizeInput(metadata.first_name, 50),
        last_name: sanitizeInput(metadata.last_name, 50),
        full_name: sanitizeInput(metadata.full_name, 100),
        business_name: sanitizeInput(metadata.business_name, 100),
        business_type: sanitizeInput(metadata.business_type, 50),
        industry: sanitizeInput(metadata.industry, 100),
        location: sanitizeInput(metadata.location, 100),
        team_size: sanitizeInput(metadata.team_size, 20),
        primary_goal: sanitizeInput(metadata.primary_goal, 50),
        experience_level: sanitizeInput(metadata.experience_level, 50),
        monthly_revenue: sanitizeInput(metadata.monthly_revenue, 20),
        current_tools: Array.isArray(metadata.current_tools) ? metadata.current_tools : []
      }

      const profileData = {
        id: userId,
        email: user?.email,
        ...sanitizedMetadata,
        subscription_tier: 'free',
        onboarding_completed: metadata.onboarding_completed || true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single()

      if (error) {
        console.error('Error creating user profile:', error)
        errorUtils.logError(error, { context: 'create_user_profile', userId })
        return { success: false, error: errorUtils.parseSupabaseError(error) }
      }

      setUserProfile(data)
      analyticsUtils.trackAuthEvent('profile_created', {
        user_id: userId,
        business_type: sanitizedMetadata.business_type,
        industry: sanitizedMetadata.industry
      })

      return { success: true, data }
    } catch (error) {
      console.error('Error in createUserProfile:', error)
      errorUtils.logError(error, { context: 'create_user_profile_catch', userId })
      return { success: false, error: 'Failed to create user profile' }
    }
  }

  const updateUserProfile = async (updates) => {
    if (!user) return { success: false, error: 'No user logged in' }

    try {
      // Sanitize updates
      const sanitizedUpdates = {}
      Object.keys(updates).forEach(key => {
        if (typeof updates[key] === 'string') {
          sanitizedUpdates[key] = sanitizeInput(updates[key], 255)
        } else {
          sanitizedUpdates[key] = updates[key]
        }
      })

      const { data, error } = await supabase
        .from('user_profiles')
        .update({
          ...sanitizedUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user profile:', error)
        errorUtils.logError(error, { context: 'update_user_profile', userId: user.id })
        return { success: false, error: errorUtils.parseSupabaseError(error) }
      }

      setUserProfile(data)
      toast.success('Profile updated successfully!')
      analyticsUtils.trackAuthEvent('profile_updated', { user_id: user.id })
      
      return { success: true, data }
    } catch (error) {
      console.error('Error in updateUserProfile:', error)
      errorUtils.logError(error, { context: 'update_user_profile_catch', userId: user?.id })
      return { success: false, error: 'Failed to update profile' }
    }
  }

  const signUp = async (email, password, metadata = {}) => {
    try {
      setLoading(true)

      // Rate limiting check
      const clientId = `signup_${email}`
      if (!authRateLimiter.isAllowed(clientId)) {
        const resetTime = authRateLimiter.getResetTime(clientId)
        const waitMinutes = Math.ceil((resetTime - Date.now()) / 60000)
        const errorMsg = `Too many signup attempts. Please wait ${waitMinutes} minutes.`
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      // Validate inputs
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        toast.error(emailValidation.errors[0])
        return { success: false, error: emailValidation.errors[0] }
      }

      const passwordValidation = validatePassword(password)
      if (!passwordValidation.isValid) {
        toast.error(passwordValidation.errors[0])
        return { success: false, error: passwordValidation.errors[0] }
      }

      if (metadata.business_name) {
        const businessNameValidation = validateBusinessName(metadata.business_name)
        if (!businessNameValidation.isValid) {
          toast.error(businessNameValidation.errors[0])
          return { success: false, error: businessNameValidation.errors[0] }
        }
      }

      // Track signup attempt
      analyticsUtils.trackAuthEvent('signup_attempted', {
        email: email,
        business_type: metadata.business_type,
        industry: metadata.industry
      })

      // Use OTP-based signup (not confirmation URL)
      const { data, error } = await supabase.auth.signUp({
        email: email.toLowerCase().trim(),
        password,
        options: {
          data: metadata,
          // Force OTP verification method
          emailRedirectTo: undefined
        }
      })

      if (error) {
        const friendlyError = errorUtils.parseSupabaseError(error)
        toast.error(friendlyError)
        errorUtils.logError(error, { context: 'signup', email })
        analyticsUtils.trackAuthEvent('signup_failed', { error: error.message })
        return { success: false, error: friendlyError }
      }

      // If user is created and confirmed immediately
      if (data.user && data.user.email_confirmed_at) {
        await createUserProfile(data.user.id, metadata)
        toast.success('Account created successfully!')
        analyticsUtils.trackAuthEvent('signup_completed', { user_id: data.user.id })
        return { success: true, needsVerification: false }
      }
      
      // If email confirmation is required
      if (data.user && !data.user.email_confirmed_at) {
        toast.success('Please check your email to verify your account')
        analyticsUtils.trackAuthEvent('signup_verification_sent', { email })
        return { success: true, needsVerification: true }
      }

      return { success: false, error: 'Unexpected signup response' }
    } catch (error) {
      console.error('Signup error:', error)
      errorUtils.logError(error, { context: 'signup_catch', email })
      toast.error('An error occurred during sign up')
      analyticsUtils.trackAuthEvent('signup_error', { error: error.message })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)

      // Rate limiting check
      const clientId = `signin_${email}`
      if (!authRateLimiter.isAllowed(clientId)) {
        const resetTime = authRateLimiter.getResetTime(clientId)
        const waitMinutes = Math.ceil((resetTime - Date.now()) / 60000)
        const errorMsg = `Too many login attempts. Please wait ${waitMinutes} minutes.`
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      // Validate inputs
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        toast.error(emailValidation.errors[0])
        return { success: false, error: emailValidation.errors[0] }
      }

      if (!password) {
        toast.error('Password is required')
        return { success: false, error: 'Password is required' }
      }

      // Track signin attempt
      const attemptData = {
        email,
        timestamp: Date.now(),
        success: false
      }
      setAuthAttempts(prev => [...prev.slice(-9), attemptData]) // Keep last 10 attempts

      analyticsUtils.trackAuthEvent('signin_attempted', { email })

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password
      })

      if (error) {
        // Update attempt as failed
        setAuthAttempts(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...attemptData, error: error.message }
          return updated
        })

        // Check for suspicious activity
        if (securityUtils.detectSuspiciousActivity(authAttempts)) {
          analyticsUtils.trackAuthEvent('suspicious_activity_detected', { email })
          console.warn('Suspicious login activity detected for:', email)
        }

        const friendlyError = errorUtils.parseSupabaseError(error)
        toast.error(friendlyError)
        errorUtils.logError(error, { context: 'signin', email })
        analyticsUtils.trackAuthEvent('signin_failed', { error: error.message })
        return { success: false, error: friendlyError }
      }

      if (data.user) {
        // Update attempt as successful
        setAuthAttempts(prev => {
          const updated = [...prev]
          updated[updated.length - 1] = { ...attemptData, success: true }
          return updated
        })

        await fetchUserProfile(data.user.id)
        toast.success('Welcome back!')
        analyticsUtils.trackAuthEvent('signin_completed', { user_id: data.user.id })
        return { success: true }
      }

      return { success: false, error: 'No user data received' }
    } catch (error) {
      console.error('Signin error:', error)
      errorUtils.logError(error, { context: 'signin_catch', email })
      toast.error('An error occurred during sign in')
      analyticsUtils.trackAuthEvent('signin_error', { error: error.message })
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const signInWithOTP = async (email) => {
    try {
      setLoading(true)

      // Rate limiting check
      const clientId = `otp_${email}`
      if (!otpRateLimiter.isAllowed(clientId)) {
        const resetTime = otpRateLimiter.getResetTime(clientId)
        const waitMinutes = Math.ceil((resetTime - Date.now()) / 60000)
        const errorMsg = `Too many OTP requests. Please wait ${waitMinutes} minutes.`
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        toast.error(emailValidation.errors[0])
        return { success: false, error: emailValidation.errors[0] }
      }

      analyticsUtils.trackAuthEvent('otp_requested', { email })

      const { error } = await supabase.auth.signInWithOtp({
        email: email.toLowerCase().trim(),
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      })

      if (error) {
        const friendlyError = errorUtils.parseSupabaseError(error)
        toast.error(friendlyError)
        errorUtils.logError(error, { context: 'otp_signin', email })
        analyticsUtils.trackAuthEvent('otp_failed', { error: error.message })
        return { success: false, error: friendlyError }
      }

      toast.success('Check your email for the login link!')
      analyticsUtils.trackAuthEvent('otp_sent', { email })
      return { success: true }
    } catch (error) {
      console.error('OTP signin error:', error)
      errorUtils.logError(error, { context: 'otp_signin_catch', email })
      toast.error('An error occurred sending the OTP')
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

      analyticsUtils.trackAuthEvent('otp_verification_attempted', { email, type })

      console.log('🔍 AuthContext: Calling supabase.auth.verifyOtp...')
      
      const { data, error } = await supabase.auth.verifyOtp({
        email: email.toLowerCase().trim(),
        token,
        type: type === 'signup' ? 'signup' : 'email'
      })

      console.log('🔍 AuthContext: Supabase response:', { data: !!data, error: error?.message })

      if (error) {
        console.log('🔍 AuthContext: Supabase error:', error)
        const friendlyError = errorUtils.parseSupabaseError(error)
        errorUtils.logError(error, { context: 'verify_otp', email, type })
        analyticsUtils.trackAuthEvent('otp_verification_failed', { error: error.message })
        return { success: false, error: friendlyError }
      }

      if (data?.user) {
        console.log('🔍 AuthContext: User verified successfully:', data.user.id)
        
        try {
          // Fetch existing profile first
          console.log('🔍 AuthContext: Fetching user profile...')
          await fetchUserProfile(data.user.id)
          
          console.log('🔍 AuthContext: OTP verification completed successfully')
          analyticsUtils.trackAuthEvent('otp_verification_completed', { 
            user_id: data.user.id, 
            type 
          })
          
          return { success: true, user: data.user }
        } catch (profileError) {
          console.error('🔍 AuthContext: Profile fetch error:', profileError)
          // Don't fail the verification if profile fetch fails
          return { success: true, user: data.user }
        }
      }

      console.log('🔍 AuthContext: No user data received')
      return { success: false, error: 'Verification failed. Please try again.' }
      
    } catch (error) {
      console.error('🔍 AuthContext: OTP verification error:', error)
      errorUtils.logError(error, { context: 'verify_otp_catch', email, type })
      return { success: false, error: 'Something went wrong. Please try again.' }
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      
      const userId = user?.id
      analyticsUtils.trackAuthEvent('signout_attempted', { user_id: userId })

      const { error } = await supabase.auth.signOut()
      
      if (error) {
        const friendlyError = errorUtils.parseSupabaseError(error)
        toast.error(friendlyError)
        errorUtils.logError(error, { context: 'signout', userId })
        return { success: false, error: friendlyError }
      }

      // Clear local state
      setUser(null)
      setUserProfile(null)
      setAuthAttempts([])
      
      toast.success('Signed out successfully')
      analyticsUtils.trackAuthEvent('signout_completed', { user_id: userId })
      return { success: true }
    } catch (error) {
      console.error('Signout error:', error)
      errorUtils.logError(error, { context: 'signout_catch', userId: user?.id })
      toast.error('An error occurred during sign out')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email) => {
    try {
      setLoading(true)

      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        toast.error(emailValidation.errors[0])
        return { success: false, error: emailValidation.errors[0] }
      }

      // Rate limiting check
      const clientId = `reset_${email}`
      if (!otpRateLimiter.isAllowed(clientId)) {
        const resetTime = otpRateLimiter.getResetTime(clientId)
        const waitMinutes = Math.ceil((resetTime - Date.now()) / 60000)
        const errorMsg = `Too many reset requests. Please wait ${waitMinutes} minutes.`
        toast.error(errorMsg)
        return { success: false, error: errorMsg }
      }

      analyticsUtils.trackAuthEvent('password_reset_requested', { email })

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.toLowerCase().trim(), 
        {
          redirectTo: `${window.location.origin}/auth/reset-password`
        }
      )

      if (error) {
        const friendlyError = errorUtils.parseSupabaseError(error)
        toast.error(friendlyError)
        errorUtils.logError(error, { context: 'reset_password', email })
        analyticsUtils.trackAuthEvent('password_reset_failed', { error: error.message })
        return { success: false, error: friendlyError }
      }

      toast.success('Password reset email sent!')
      analyticsUtils.trackAuthEvent('password_reset_sent', { email })
      return { success: true }
    } catch (error) {
      console.error('Password reset error:', error)
      errorUtils.logError(error, { context: 'reset_password_catch', email })
      toast.error('An error occurred sending the reset email')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      setLoading(true)

      if (!user) {
        toast.error('You must be logged in to update your password')
        return { success: false, error: 'Not authenticated' }
      }

      const passwordValidation = validatePassword(newPassword)
      if (!passwordValidation.isValid) {
        toast.error(passwordValidation.errors[0])
        return { success: false, error: passwordValidation.errors[0] }
      }

      analyticsUtils.trackAuthEvent('password_update_attempted', { user_id: user.id })

      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        const friendlyError = errorUtils.parseSupabaseError(error)
        toast.error(friendlyError)
        errorUtils.logError(error, { context: 'update_password', userId: user.id })
        analyticsUtils.trackAuthEvent('password_update_failed', { error: error.message })
        return { success: false, error: friendlyError }
      }

      toast.success('Password updated successfully!')
      analyticsUtils.trackAuthEvent('password_update_completed', { user_id: user.id })
      return { success: true }
    } catch (error) {
      console.error('Password update error:', error)
      errorUtils.logError(error, { context: 'update_password_catch', userId: user?.id })
      toast.error('An error occurred updating password')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async (password) => {
    try {
      setLoading(true)

      if (!user) {
        toast.error('You must be logged in to delete your account')
        return { success: false, error: 'Not authenticated' }
      }

      if (!password) {
        toast.error('Password is required to delete your account')
        return { success: false, error: 'Password required' }
      }

      // Verify password before deletion
      const { error: verifyError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password
      })

      if (verifyError) {
        toast.error('Invalid password')
        return { success: false, error: 'Invalid password' }
      }

      analyticsUtils.trackAuthEvent('account_deletion_attempted', { user_id: user.id })

      // Delete user profile first (cascade should handle related data)
      const { error: profileError } = await supabase
        .from('user_profiles')
        .delete()
        .eq('id', user.id)

      if (profileError) {
        console.error('Error deleting user profile:', profileError)
        // Continue with account deletion even if profile deletion fails
      }

      // Delete the auth user
      const { error } = await supabase.auth.admin.deleteUser(user.id)

      if (error) {
        const friendlyError = errorUtils.parseSupabaseError(error)
        toast.error(friendlyError)
        errorUtils.logError(error, { context: 'delete_account', userId: user.id })
        analyticsUtils.trackAuthEvent('account_deletion_failed', { error: error.message })
        return { success: false, error: friendlyError }
      }

      // Clear local state
      setUser(null)
      setUserProfile(null)
      setAuthAttempts([])

      toast.success('Account deleted successfully')
      analyticsUtils.trackAuthEvent('account_deletion_completed', { user_id: user.id })
      return { success: true }
    } catch (error) {
      console.error('Account deletion error:', error)
      errorUtils.logError(error, { context: 'delete_account_catch', userId: user?.id })
      toast.error('An error occurred deleting your account')
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
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
    signInWithOTP,
    verifyOTP,
    signOut,
    resetPassword,
    updatePassword,
    deleteAccount,
    
    // Profile methods
    updateUserProfile,
    fetchUserProfile,
    
    // Utility methods
    refreshSession: sessionUtils.refreshSessionIfNeeded,
    
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