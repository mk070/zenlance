import { useContext, useEffect, useState, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { AuthContext } from '../contexts/AuthContext'
import { roleUtils, sessionUtils, securityUtils, analyticsUtils } from '../lib/auth-utils'
import { userProfileAPI } from '../lib/api-client'

/**
 * Enhanced authentication hook with production features
 */
export const useAuth = () => {
  const context = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()
  
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }

  return context
}

/**
 * Hook for role-based access control
 */
export const useRole = () => {
  const { user, userProfile } = useAuth()
  
  const hasRole = useCallback((role) => {
    return roleUtils.hasRole(user, role)
  }, [user])
  
  const canAccessFeature = useCallback((feature) => {
    return roleUtils.canAccessFeature(userProfile, feature)
  }, [userProfile])
  
  const getSubscriptionTier = useCallback(() => {
    return roleUtils.getSubscriptionTier(userProfile)
  }, [userProfile])
  
  return {
    hasRole,
    canAccessFeature,
    getSubscriptionTier,
    currentRole: user?.user_metadata?.role || 'user',
    subscriptionTier: getSubscriptionTier()
  }
}

/**
 * Hook for protected routes
 */
export const useProtectedRoute = (requiredRole = null, requiredFeature = null) => {
  const { user, loading, sessionChecked } = useAuth()
  const { hasRole, canAccessFeature } = useRole()
  const navigate = useNavigate()
  const location = useLocation()
  const [isAuthorized, setIsAuthorized] = useState(false)
  
  useEffect(() => {
    if (!sessionChecked || loading) return
    
    // Check authentication
    if (!user) {
      navigate('/signin', { 
        state: { from: location.pathname },
        replace: true 
      })
      return
    }
    
    // Check role authorization
    if (requiredRole && !hasRole(requiredRole)) {
      navigate('/unauthorized', { replace: true })
      return
    }
    
    // Check feature authorization
    if (requiredFeature && !canAccessFeature(requiredFeature)) {
      navigate('/upgrade', { replace: true })
      return
    }
    
    setIsAuthorized(true)
  }, [user, sessionChecked, loading, requiredRole, requiredFeature, hasRole, canAccessFeature, navigate, location])
  
  return {
    isAuthorized,
    isLoading: loading || !sessionChecked
  }
}

/**
 * Hook for session management
 */
export const useSession = () => {
  const { user } = useAuth()
  const [sessionInfo, setSessionInfo] = useState(null)
  const [isExpiringSoon, setIsExpiringSoon] = useState(false)
  
  const checkSession = useCallback(async () => {
    if (!user) {
      setSessionInfo(null)
      setIsExpiringSoon(false)
      return
    }
    
    try {
      const result = await sessionUtils.refreshSessionIfNeeded()
      setSessionInfo(result.session)
      
      if (result.session) {
        const expiresAt = new Date(result.session.expires_at)
        const now = new Date()
        const timeUntilExpiry = expiresAt.getTime() - now.getTime()
        
        // Warn if session expires in less than 10 minutes
        setIsExpiringSoon(timeUntilExpiry < 600000) // 10 minutes
      }
    } catch (error) {
      console.error('Error checking session:', error)
    }
  }, [user])
  
  useEffect(() => {
    checkSession()
    
    // Check session every 5 minutes
    const interval = setInterval(checkSession, 300000)
    return () => clearInterval(interval)
  }, [checkSession])
  
  return {
    sessionInfo,
    isExpiringSoon,
    refreshSession: checkSession
  }
}

/**
 * Hook for user profile management
 */
export const useUserProfile = () => {
  const { user, userProfile, updateUserProfile, fetchUserProfile } = useAuth()
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState(null)
  
  const refreshProfile = useCallback(async () => {
    if (!user) return
    
    try {
      setProfileLoading(true)
      setProfileError(null)
      await fetchUserProfile(user.id)
    } catch (error) {
      setProfileError(error.message)
    } finally {
      setProfileLoading(false)
    }
  }, [user, fetchUserProfile])
  
  const updateProfile = useCallback(async (updates) => {
    try {
      setProfileLoading(true)
      setProfileError(null)
      const result = await updateUserProfile(updates)
      
      if (result.success) {
        analyticsUtils.trackAuthEvent('profile_updated', {
          user_id: user?.id,
          updated_fields: Object.keys(updates)
        })
      }
      
      return result
    } catch (error) {
      setProfileError(error.message)
      return { success: false, error: error.message }
    } finally {
      setProfileLoading(false)
    }
  }, [updateUserProfile, user])
  
  const getEngagementMetrics = useCallback(async () => {
    if (!user) return null
    
    try {
      const result = await userProfileAPI.getEngagementMetrics(user.id)
      return result.data
    } catch (error) {
      console.error('Error fetching engagement metrics:', error)
      return null
    }
  }, [user])
  
  return {
    profile: userProfile,
    loading: profileLoading,
    error: profileError,
    refreshProfile,
    updateProfile,
    getEngagementMetrics
  }
}

/**
 * Hook for security monitoring
 */
export const useSecurity = () => {
  const { user } = useAuth()
  const [securityAlerts, setSecurityAlerts] = useState([])
  const [securityScore, setSecurityScore] = useState(0)
  
  const checkSecurity = useCallback(async () => {
    if (!user) return
    
    try {
      // Check for suspicious activity
      const suspiciousActivity = securityUtils.detectSuspiciousActivity([])
      
      // Calculate security score based on profile completeness and activity
      let score = 0
      
      // Base score for verified email
      if (user.email_confirmed_at) score += 25
      
      // Score for profile completion
      if (user.user_metadata?.first_name) score += 15
      if (user.user_metadata?.business_name) score += 15
      if (user.user_metadata?.business_type) score += 15
      
      // Score for recent activity
      const lastLogin = new Date(user.last_sign_in_at)
      const daysSinceLogin = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24)
      if (daysSinceLogin < 7) score += 15
      if (daysSinceLogin < 1) score += 15
      
      setSecurityScore(Math.min(score, 100))
      
      // Check for security alerts
      const alerts = []
      if (suspiciousActivity) {
        alerts.push({
          type: 'warning',
          message: 'Suspicious login activity detected',
          timestamp: new Date()
        })
      }
      
      if (daysSinceLogin > 30) {
        alerts.push({
          type: 'info',
          message: 'Long time since last login - consider updating your password',
          timestamp: new Date()
        })
      }
      
      setSecurityAlerts(alerts)
      
    } catch (error) {
      console.error('Error checking security:', error)
    }
  }, [user])
  
  useEffect(() => {
    checkSecurity()
  }, [checkSecurity])
  
  const generateSecurePassword = useCallback(() => {
    return securityUtils.generateSecurePassword()
  }, [])
  
  return {
    securityScore,
    securityAlerts,
    checkSecurity,
    generateSecurePassword
  }
}

/**
 * Hook for authentication state management
 */
export const useAuthState = () => {
  const { user, loading, sessionChecked } = useAuth()
  const [authState, setAuthState] = useState('loading')
  
  useEffect(() => {
    if (!sessionChecked) {
      setAuthState('loading')
    } else if (loading) {
      setAuthState('loading')
    } else if (user) {
      setAuthState('authenticated')
    } else {
      setAuthState('unauthenticated')
    }
  }, [user, loading, sessionChecked])
  
  return {
    state: authState,
    isAuthenticated: authState === 'authenticated',
    isUnauthenticated: authState === 'unauthenticated',
    isLoading: authState === 'loading'
  }
}

/**
 * Hook for logout with cleanup
 */
export const useLogout = () => {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  
  const logout = useCallback(async (redirect = '/signin') => {
    try {
      analyticsUtils.trackAuthEvent('logout_initiated')
      
      // Clear any local storage
      localStorage.removeItem('freelancehub_preferences')
      sessionStorage.clear()
      
      // Sign out
      const result = await signOut()
      
      if (result.success && redirect) {
        navigate(redirect, { replace: true })
      }
      
      return result
    } catch (error) {
      console.error('Error during logout:', error)
      return { success: false, error: error.message }
    }
  }, [signOut, navigate])
  
  return logout
}

/**
 * Hook for authentication with redirect
 */
export const useAuthRedirect = (redirectTo = '/dashboard') => {
  const { user, sessionChecked } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  
  useEffect(() => {
    if (sessionChecked && user) {
      const intended = location.state?.from || redirectTo
      navigate(intended, { replace: true })
    }
  }, [user, sessionChecked, navigate, location, redirectTo])
  
  return {
    shouldRedirect: sessionChecked && !!user
  }
}

// Export all hooks
export default {
  useAuth,
  useRole,
  useProtectedRoute,
  useSession,
  useUserProfile,
  useSecurity,
  useAuthState,
  useLogout,
  useAuthRedirect
} 