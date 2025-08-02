import { supabase } from './supabase'
import { errorUtils, analyticsUtils } from './auth-utils'

// ========================================
// 🌐 PRODUCTION API CLIENT
// ========================================

/**
 * API Configuration
 */
const API_CONFIG = {
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
  cacheTimeout: 300000, // 5 minutes
}

/**
 * Simple in-memory cache
 */
class APICache {
  constructor() {
    this.cache = new Map()
  }

  get(key) {
    const item = this.cache.get(key)
    if (item && Date.now() - item.timestamp < API_CONFIG.cacheTimeout) {
      return item.data
    }
    this.cache.delete(key)
    return null
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clear() {
    this.cache.clear()
  }

  delete(key) {
    this.cache.delete(key)
  }
}

const cache = new APICache()

/**
 * Retry wrapper for API calls
 */
const withRetry = async (fn, attempts = API_CONFIG.retryAttempts) => {
  try {
    return await fn()
  } catch (error) {
    if (attempts > 1 && isRetryableError(error)) {
      await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay))
      return withRetry(fn, attempts - 1)
    }
    throw error
  }
}

/**
 * Check if error is retryable
 */
const isRetryableError = (error) => {
  const retryableCodes = ['NETWORK_ERROR', 'TIMEOUT', 'SERVER_ERROR']
  return retryableCodes.some(code => error.message?.includes(code)) ||
         error.status >= 500 ||
         error.code === 'ECONNRESET'
}

/**
 * Generic API request wrapper
 */
const apiRequest = async (operation, cacheKey = null, skipCache = false) => {
  try {
    // Check cache first
    if (cacheKey && !skipCache) {
      const cached = cache.get(cacheKey)
      if (cached) {
        return cached
      }
    }

    // Execute with retry logic
    const result = await withRetry(operation)

    // Handle Supabase response
    if (result.error) {
      throw new Error(errorUtils.parseSupabaseError(result.error))
    }

    // Cache successful results
    if (cacheKey && result.data) {
      cache.set(cacheKey, result)
    }

    return result
  } catch (error) {
    errorUtils.logError(error, { context: 'api_request', cacheKey })
    throw error
  }
}

// ========================================
// 👤 USER PROFILE API
// ========================================

export const userProfileAPI = {
  /**
   * Get current user profile
   */
  getProfile: async (userId, useCache = true) => {
    const cacheKey = `profile_${userId}`
    
    return apiRequest(
      () => supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single(),
      useCache ? cacheKey : null
    )
  },

  /**
   * Update user profile
   */
  updateProfile: async (userId, updates) => {
    // Clear cache
    cache.delete(`profile_${userId}`)
    
    return apiRequest(() => supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    )
  },

  /**
   * Get user engagement metrics
   */
  getEngagementMetrics: async (userId) => {
    return apiRequest(
      () => supabase.rpc('get_user_engagement_metrics', { 
        user_id: userId 
      }),
      `engagement_${userId}`
    )
  },

  /**
   * Update subscription tier
   */
  updateSubscription: async (userId, tier) => {
    cache.delete(`profile_${userId}`)
    
    return apiRequest(() => supabase
      .from('user_profiles')
      .update({
        subscription_tier: tier,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    )
  }
}

// ========================================
// 📊 PROJECTS API
// ========================================

export const projectsAPI = {
  /**
   * Get user projects
   */
  getProjects: async (userId, filters = {}) => {
    const cacheKey = `projects_${userId}_${JSON.stringify(filters)}`
    
    let query = supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.search) {
      query = query.ilike('name', `%${filters.search}%`)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    return apiRequest(() => query, cacheKey)
  },

  /**
   * Create new project
   */
  createProject: async (userId, projectData) => {
    // Clear projects cache
    cache.delete(`projects_${userId}_{}`)
    
    return apiRequest(() => supabase
      .from('projects')
      .insert([{
        ...projectData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    )
  },

  /**
   * Update project
   */
  updateProject: async (userId, projectId, updates) => {
    // Clear cache
    cache.delete(`projects_${userId}_{}`)
    cache.delete(`project_${projectId}`)
    
    return apiRequest(() => supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single()
    )
  },

  /**
   * Delete project
   */
  deleteProject: async (userId, projectId) => {
    // Clear cache
    cache.delete(`projects_${userId}_{}`)
    cache.delete(`project_${projectId}`)
    
    return apiRequest(() => supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId)
    )
  },

  /**
   * Get project by ID
   */
  getProject: async (userId, projectId) => {
    const cacheKey = `project_${projectId}`
    
    return apiRequest(
      () => supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .eq('user_id', userId)
        .single(),
      cacheKey
    )
  }
}

// ========================================
// 👥 CLIENTS API
// ========================================

export const clientsAPI = {
  /**
   * Get user clients
   */
  getClients: async (userId, filters = {}) => {
    const cacheKey = `clients_${userId}_${JSON.stringify(filters)}`
    
    let query = supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,company.ilike.%${filters.search}%`)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    return apiRequest(() => query, cacheKey)
  },

  /**
   * Create new client
   */
  createClient: async (userId, clientData) => {
    cache.delete(`clients_${userId}_{}`)
    
    return apiRequest(() => supabase
      .from('clients')
      .insert([{
        ...clientData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    )
  },

  /**
   * Update client
   */
  updateClient: async (userId, clientId, updates) => {
    cache.delete(`clients_${userId}_{}`)
    cache.delete(`client_${clientId}`)
    
    return apiRequest(() => supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .eq('user_id', userId)
      .select()
      .single()
    )
  },

  /**
   * Delete client
   */
  deleteClient: async (userId, clientId) => {
    cache.delete(`clients_${userId}_{}`)
    cache.delete(`client_${clientId}`)
    
    return apiRequest(() => supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', userId)
    )
  }
}

// ========================================
// 🧾 INVOICES API
// ========================================

export const invoicesAPI = {
  /**
   * Get user invoices
   */
  getInvoices: async (userId, filters = {}) => {
    const cacheKey = `invoices_${userId}_${JSON.stringify(filters)}`
    
    let query = supabase
      .from('invoices')
      .select(`
        *,
        projects (name),
        clients (name, company)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.date_from) {
      query = query.gte('issue_date', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('issue_date', filters.date_to)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    return apiRequest(() => query, cacheKey)
  },

  /**
   * Create new invoice
   */
  createInvoice: async (userId, invoiceData) => {
    cache.delete(`invoices_${userId}_{}`)
    
    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`
    
    return apiRequest(() => supabase
      .from('invoices')
      .insert([{
        ...invoiceData,
        user_id: userId,
        invoice_number: invoiceNumber,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    )
  },

  /**
   * Update invoice
   */
  updateInvoice: async (userId, invoiceId, updates) => {
    cache.delete(`invoices_${userId}_{}`)
    cache.delete(`invoice_${invoiceId}`)
    
    return apiRequest(() => supabase
      .from('invoices')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .select()
      .single()
    )
  },

  /**
   * Mark invoice as paid
   */
  markAsPaid: async (userId, invoiceId, paymentData = {}) => {
    cache.delete(`invoices_${userId}_{}`)
    cache.delete(`invoice_${invoiceId}`)
    
    return apiRequest(() => supabase
      .from('invoices')
      .update({
        status: 'paid',
        paid_date: new Date().toISOString(),
        payment_method: paymentData.method,
        payment_reference: paymentData.reference,
        updated_at: new Date().toISOString()
      })
      .eq('id', invoiceId)
      .eq('user_id', userId)
      .select()
      .single()
    )
  }
}

// ========================================
// ⏱️ TIME TRACKING API
// ========================================

export const timeTrackingAPI = {
  /**
   * Get time entries
   */
  getTimeEntries: async (userId, filters = {}) => {
    const cacheKey = `time_entries_${userId}_${JSON.stringify(filters)}`
    
    let query = supabase
      .from('time_entries')
      .select(`
        *,
        projects (name, client_name)
      `)
      .eq('user_id', userId)
      .order('date', { ascending: false })

    if (filters.project_id) {
      query = query.eq('project_id', filters.project_id)
    }
    if (filters.date_from) {
      query = query.gte('date', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('date', filters.date_to)
    }
    if (filters.billable !== undefined) {
      query = query.eq('billable', filters.billable)
    }
    if (filters.limit) {
      query = query.limit(filters.limit)
    }

    return apiRequest(() => query, cacheKey)
  },

  /**
   * Create time entry
   */
  createTimeEntry: async (userId, entryData) => {
    cache.delete(`time_entries_${userId}_{}`)
    
    return apiRequest(() => supabase
      .from('time_entries')
      .insert([{
        ...entryData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    )
  },

  /**
   * Start timer
   */
  startTimer: async (userId, projectId, description = '') => {
    return apiRequest(() => supabase
      .from('time_entries')
      .insert([{
        user_id: userId,
        project_id: projectId,
        description,
        start_time: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }])
      .select()
      .single()
    )
  },

  /**
   * Stop timer
   */
  stopTimer: async (userId, entryId) => {
    cache.delete(`time_entries_${userId}_{}`)
    
    return apiRequest(() => supabase
      .from('time_entries')
      .update({
        end_time: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .eq('user_id', userId)
      .select()
      .single()
    )
  }
}

// ========================================
// 📈 ANALYTICS API
// ========================================

export const analyticsAPI = {
  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (userId) => {
    const cacheKey = `dashboard_stats_${userId}`
    
    return apiRequest(async () => {
      const [projects, clients, invoices, timeEntries] = await Promise.all([
        supabase.from('projects').select('id, status, budget').eq('user_id', userId),
        supabase.from('clients').select('id, status').eq('user_id', userId),
        supabase.from('invoices').select('id, status, total_amount').eq('user_id', userId),
        supabase.from('time_entries').select('id, duration_minutes, billable').eq('user_id', userId)
      ])

      return {
        data: {
          projects: {
            total: projects.data?.length || 0,
            active: projects.data?.filter(p => ['planning', 'in_progress'].includes(p.status)).length || 0,
            completed: projects.data?.filter(p => p.status === 'completed').length || 0,
            total_budget: projects.data?.reduce((sum, p) => sum + (p.budget || 0), 0) || 0
          },
          clients: {
            total: clients.data?.length || 0,
            active: clients.data?.filter(c => c.status === 'active').length || 0
          },
          invoices: {
            total: invoices.data?.length || 0,
            paid: invoices.data?.filter(i => i.status === 'paid').length || 0,
            pending: invoices.data?.filter(i => ['draft', 'sent', 'viewed'].includes(i.status)).length || 0,
            total_revenue: invoices.data?.reduce((sum, i) => sum + (i.total_amount || 0), 0) || 0
          },
          time: {
            total_entries: timeEntries.data?.length || 0,
            total_hours: timeEntries.data?.reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / 60 || 0,
            billable_hours: timeEntries.data?.filter(t => t.billable).reduce((sum, t) => sum + (t.duration_minutes || 0), 0) / 60 || 0
          }
        }
      }
    }, cacheKey)
  },

  /**
   * Get revenue analytics
   */
  getRevenueAnalytics: async (userId, dateRange = '30d') => {
    const cacheKey = `revenue_analytics_${userId}_${dateRange}`
    
    return apiRequest(() => supabase
      .from('invoices')
      .select('total_amount, status, issue_date, currency')
      .eq('user_id', userId)
      .gte('issue_date', getDateRangeStart(dateRange))
      .order('issue_date', { ascending: true }), 
      cacheKey
    )
  },

  /**
   * Get project analytics
   */
  getProjectAnalytics: async (userId) => {
    const cacheKey = `project_analytics_${userId}`
    
    return apiRequest(() => supabase
      .from('projects')
      .select('status, budget, actual_hours, estimated_hours, created_at')
      .eq('user_id', userId),
      cacheKey
    )
  }
}

// ========================================
// 🛠️ UTILITY FUNCTIONS
// ========================================

/**
 * Get date range start based on period
 */
const getDateRangeStart = (range) => {
  const now = new Date()
  switch (range) {
    case '7d':
      return new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    case '30d':
      return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    case '90d':
      return new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    case '1y':
      return new Date(now - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    default:
      return new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  }
}

/**
 * Clear all caches
 */
export const clearCache = () => {
  cache.clear()
  analyticsUtils.trackAuthEvent('cache_cleared')
}

/**
 * Clear user-specific caches
 */
export const clearUserCache = (userId) => {
  const keys = Array.from(cache.cache.keys())
  keys.forEach(key => {
    if (key.includes(userId)) {
      cache.delete(key)
    }
  })
}

// Export API client
export default {
  userProfileAPI,
  projectsAPI,
  clientsAPI,
  invoicesAPI,
  timeTrackingAPI,
  analyticsAPI,
  clearCache,
  clearUserCache
} 