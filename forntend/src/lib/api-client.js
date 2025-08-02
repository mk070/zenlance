import { getAccessToken, setAccessToken, removeAccessToken } from './auth-utils'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    const token = getAccessToken()
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    try {
      const response = await fetch(url, config)
      
      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401) {
        try {
          const newToken = await this.refreshAccessToken()
          if (newToken) {
            // Retry the original request with new token
            config.headers.Authorization = `Bearer ${newToken}`
            const retryResponse = await fetch(url, config)
            return await this.handleResponse(retryResponse)
          }
        } catch (refreshError) {
          // Refresh failed, redirect to login
          removeAccessToken()
          window.location.href = '/signin'
          throw new Error('Session expired. Please sign in again.')
        }
      }

      return await this.handleResponse(response)
  } catch (error) {
      console.error('API request failed:', error)
    throw error
  }
}

  async handleResponse(response) {
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      return data
    } else {
      // For non-JSON responses (like file downloads)
      return response
    }
  }

    async refreshAccessToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        credentials: 'include',
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success && data.tokens && data.tokens.accessToken) {
          setAccessToken(data.tokens.accessToken)
          return data.tokens.accessToken
        }
      }
      
      throw new Error('Token refresh failed')
    } catch (error) {
      console.error('Token refresh error:', error)
      throw error
    }
  }

  // Authentication methods
  async signUp(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    })
  }

  async signIn(email, password) {
    return this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    })
  }

  async verifyOTP(email, otp) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    })
  }

  async resendOTP(email) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    })
  }

  async resetPassword(token, password) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    })
  }

  async signOut() {
    return this.request('/auth/logout', {
      method: 'POST'
    })
  }

  async signOutAll() {
    return this.request('/auth/logout-all', {
      method: 'POST'
    })
  }

  // User methods
  async getCurrentUser() {
    return this.request('/users/me')
  }

  async updateUserPreferences(preferences) {
    return this.request('/users/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences)
    })
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/users/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword })
    })
  }

  async deactivateAccount(password) {
    return this.request('/users/deactivate', {
      method: 'POST',
      body: JSON.stringify({ password })
    })
  }

  // Profile methods
  async getUserProfile() {
    return this.request('/profile/me')
  }

  async updateUserProfile(profileData) {
    return this.request('/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    })
  }

  async updateProfileSettings(settings) {
    return this.request('/profile/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    })
  }

  async completeOnboardingStep(step) {
    return this.request('/profile/onboarding', {
      method: 'PATCH',
      body: JSON.stringify({ step })
    })
  }

  async getOnboardingStatus() {
    return this.request('/profile/onboarding')
  }

  async getProfileAnalytics() {
    return this.request('/profile/analytics')
  }

  async exportUserData() {
    return this.request('/profile/export', {
      method: 'POST'
    })
  }

  async deleteAccount() {
    return this.request('/users/delete', {
      method: 'DELETE'
    })
  }

  // Leads methods
  async getLeads(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/leads${queryString ? `?${queryString}` : ''}`)
  }

  async getLead(id) {
    return this.request(`/leads/${id}`)
  }

  async createLead(leadData) {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData)
    })
  }

  async updateLead(id, leadData) {
    return this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData)
    })
  }

  async deleteLead(id) {
    return this.request(`/leads/${id}`, {
      method: 'DELETE'
    })
  }

  async addLeadNote(id, noteData) {
    return this.request(`/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData)
    })
  }

  async addLeadCommunication(id, communicationData) {
    return this.request(`/leads/${id}/communications`, {
      method: 'POST',
      body: JSON.stringify(communicationData)
    })
  }

  async updateLeadStatus(id, status) {
    return this.request(`/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
  }

  async convertLeadToClient(id, clientData = {}) {
    return this.request(`/leads/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify(clientData)
    })
  }

  async getLeadStatistics(days = 30) {
    return this.request(`/leads/statistics?days=${days}`)
  }

  async getLeadsForFollowUp() {
    return this.request('/leads/follow-up')
  }

  // Clients methods
  async getClients(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/clients${queryString ? `?${queryString}` : ''}`)
  }

  async getClient(id) {
    return this.request(`/clients/${id}`)
  }

  async createClient(clientData) {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    })
  }

  async updateClient(id, clientData) {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData)
    })
  }

  async deleteClient(id) {
    return this.request(`/clients/${id}`, {
      method: 'DELETE'
    })
  }

  async addClientNote(id, noteData) {
    return this.request(`/clients/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData)
    })
  }

  async addClientProject(id, projectData) {
    return this.request(`/clients/${id}/projects`, {
      method: 'POST',
      body: JSON.stringify(projectData)
    })
  }

  async updateClientProject(id, projectId, projectData) {
    return this.request(`/clients/${id}/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    })
  }

  async addClientContract(id, contractData) {
    return this.request(`/clients/${id}/contracts`, {
      method: 'POST',
      body: JSON.stringify(contractData)
    })
  }

  async updateClientStatus(id, status) {
    return this.request(`/clients/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    })
  }

  async updateClientPriority(id, priority) {
    return this.request(`/clients/${id}/priority`, {
      method: 'PUT',
      body: JSON.stringify({ priority })
    })
  }

  async getClientStatistics(days = 30) {
    return this.request(`/clients/statistics?days=${days}`)
  }

  async getHighValueClients(minValue = 10000) {
    return this.request(`/clients/high-value?minValue=${minValue}`)
  }

  async getRevenueByMonth(months = 12) {
    return this.request(`/clients/revenue-by-month?months=${months}`)
  }

  async getClientsForReview() {
    return this.request('/clients/review')
  }

  // Invoices methods
  async getInvoices(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/invoices${queryString ? `?${queryString}` : ''}`)
  }

  async getInvoice(invoiceId) {
    return this.request(`/invoices/${invoiceId}`)
  }

  async createInvoice(invoiceData) {
    return this.request('/invoices', {
      method: 'POST',
      body: JSON.stringify(invoiceData)
    })
  }

  async updateInvoice(invoiceId, invoiceData) {
    return this.request(`/invoices/${invoiceId}`, {
      method: 'PUT',
      body: JSON.stringify(invoiceData)
    })
  }

  async deleteInvoice(invoiceId) {
    return this.request(`/invoices/${invoiceId}`, {
      method: 'DELETE'
    })
  }

  async sendInvoice(invoiceId) {
    return this.request(`/invoices/${invoiceId}/send`, {
      method: 'POST'
    })
  }

  async downloadInvoice(invoiceId) {
    return this.request(`/invoices/${invoiceId}/download`)
  }

  async getInvoiceStatistics() {
    return this.request('/invoices/statistics')
  }

  async markInvoiceAsPaid(invoiceId) {
    return this.request(`/invoices/${invoiceId}/paid`, {
      method: 'POST'
    })
  }

  async viewInvoice(invoiceId) {
    return this.request(`/invoices/${invoiceId}/view`, {
      method: 'POST'
    })
  }

  async duplicateInvoice(invoiceId) {
    return this.request(`/invoices/${invoiceId}/duplicate`, {
      method: 'POST'
    })
  }

  async getOverdueInvoices() {
    return this.request('/invoices/overdue')
  }

  async getTopClientsByRevenue(limit = 10) {
    return this.request(`/invoices/analytics/top-clients?limit=${limit}`)
  }

  // Social Media methods
  async getSocialPosts(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/social${queryString ? `?${queryString}` : ''}`)
  }

  async getSocialPost(postId) {
    return this.request(`/social/${postId}`)
  }

  async createSocialPost(postData) {
    return this.request('/social', {
      method: 'POST',
      body: JSON.stringify(postData)
    })
  }

  async updateSocialPost(postId, postData) {
    return this.request(`/social/${postId}`, {
      method: 'PUT',
      body: JSON.stringify(postData)
    })
  }

  async deleteSocialPost(postId) {
    return this.request(`/social/${postId}`, {
      method: 'DELETE'
    })
  }

  async publishSocialPost(postId) {
    return this.request(`/social/${postId}/publish`, {
      method: 'POST'
    })
  }

  async getConnectedSocialAccounts() {
    return this.request('/social/accounts')
  }

  async connectSocialAccount(platform, accountData) {
    return this.request(`/social/accounts/${platform}/connect`, {
      method: 'POST',
      body: JSON.stringify(accountData)
    })
  }

  async disconnectSocialAccount(platform) {
    return this.request(`/social/accounts/${platform}/disconnect`, {
      method: 'DELETE'
    })
  }

  async getSocialAnalytics(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/social/analytics${queryString ? `?${queryString}` : ''}`)
  }

  async getScheduledSocialPosts() {
    return this.request('/social/scheduled/pending')
  }

  async updateSocialPostPerformance(postId, performanceData) {
    return this.request(`/social/${postId}/performance`, {
      method: 'POST',
      body: JSON.stringify(performanceData)
    })
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

const apiClient = new ApiClient()
export default apiClient 