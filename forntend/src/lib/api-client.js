import { getAccessToken, setAccessToken, removeAccessToken, getRefreshToken, setRefreshToken, removeTokens } from './auth-utils'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    let token = getAccessToken()
    
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
      let response = await fetch(url, config)
      
      // Handle 401 Unauthorized - token might be expired
      if (response.status === 401 && token) {
        console.log('Token expired, attempting to refresh...')
        
        try {
          const newToken = await this.refreshAccessToken()
          if (newToken) {
            // Retry the original request with new token
            config.headers.Authorization = `Bearer ${newToken}`
            response = await fetch(url, config)
            console.log('Request retried with new token')
          } else {
            throw new Error('Token refresh returned no token')
          }
        } catch (refreshError) {
          console.warn('Token refresh failed:', refreshError)
          removeTokens()
          
          // Check if we're not already on the signin page to avoid infinite redirects
          if (!window.location.pathname.includes('/signin')) {
            window.location.href = '/signin'
          }
          
          throw new Error('Session expired. Please sign in again.')
        }
      }

      return await this.handleResponse(response)
    } catch (error) {
      console.error('API request failed:', error)
      
      // Add more context to the error
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your connection and try again.')
      }

      // Improve error message display
      if (error.message === '[object Object]') {
        const betterMessage = error.data?.error || error.data?.message || `Request failed with status ${error.status || 'unknown'}`;
        error.message = betterMessage;
      }
      
      throw error
    }
  }

  async handleResponse(response) {
    const contentType = response.headers.get('content-type')
    
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json()
      
      // If response is not ok, throw an error with the parsed data
      if (!response.ok) {

        // Debug: Log all error responses
        console.error(`${response.status} Error - Full response:`, {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          data: data
        })
        
        // Better error message extraction
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        if (data) {
          if (typeof data === 'string') {
            errorMessage = data
          } else if (data.message) {
            errorMessage = data.message
          } else if (data.error) {
            errorMessage = data.error
          } else if (data.validationErrors && Array.isArray(data.validationErrors)) {
            // Handle custom validation errors
            errorMessage = data.validationErrors.join(', ')
          } else if (data.details) {
            if (Array.isArray(data.details)) {
              // Handle express-validator errors
              errorMessage = data.details.map(d => {
                if (d.msg) return `${d.param}: ${d.msg}`
                if (d.message) return `${d.param}: ${d.message}`
                return JSON.stringify(d)
              }).join(', ')
            } else {
              errorMessage = data.details
            }
          } else if (typeof data === 'object') {
            // Try to extract meaningful information from complex objects
            errorMessage = JSON.stringify(data)
          } else {
            errorMessage = String(data)
          }
        }
        

        // Debug: Log validation errors
        console.error(`${response.status} Error - Full response:`, data)
        
        const errorMessage = data.error || data.message || data.errors?.[0]?.message || `HTTP ${response.status}: ${response.statusText}`;
        const error = new Error(errorMessage);
        error.status = response.status;
        error.data = data;
        throw error;
      }
      
      return data
    } else {
      // For non-JSON responses, check if it's an error
      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(errorText || `HTTP ${response.status}`)
        error.status = response.status
        throw error
      }
      
      // For successful non-JSON responses (like file downloads)
      return response
    }
  }

    async refreshAccessToken() {
    try {
      const refreshToken = getRefreshToken()
      
      if (!refreshToken) {
        console.warn('No refresh token available')
        throw new Error('No refresh token available')
      }

      console.log('Attempting to refresh access token...')
      
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      })

      if (response.ok) {
        const data = await response.json()
        
        if (data.success && data.tokens && data.tokens.accessToken) {
          console.log('Token refresh successful')
          setAccessToken(data.tokens.accessToken)
          
          // Update refresh token if a new one is provided
          if (data.tokens.refreshToken) {
            setRefreshToken(data.tokens.refreshToken)
          }
          
          return data.tokens.accessToken
        } else {
          console.error('Invalid token refresh response:', data)
          throw new Error(data.error || 'Invalid token refresh response')
        }
      } else {
        const errorData = await response.json().catch(() => ({}))
        console.error('Token refresh failed with status:', response.status, errorData)
        const errorMessage = errorData.error || errorData.message || `Token refresh failed with status ${response.status}`
        throw new Error(errorMessage)
      }
      
    } catch (error) {
      console.error('Token refresh error:', error)
      // Clear tokens if refresh fails
      removeTokens()
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
  async getProfile() {
    return this.request('/profile/me')
  }

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

  // Proposals methods
  async generateProposal(proposalData) {
    console.log('API Client: Generating proposal with data:', proposalData)
    try {
      const result = await this.request('/proposals/generate', {
        method: 'POST',
        body: JSON.stringify(proposalData)
      })
      console.log('API Client: Proposal generation result:', result)
      return result
    } catch (error) {
      console.error('API Client: Error generating proposal:', error)
      throw error
    }
  }

  async getLeadProposals(leadId) {
    return this.request(`/proposals/lead/${leadId}`)
  }

  async getProposal(id) {
    return this.request(`/proposals/${id}`)
  }

  async downloadProposal(id) {
    const response = await fetch(`${this.baseURL}/proposals/${id}/download`, {
      headers: {
        'Authorization': `Bearer ${getAccessToken()}`
      }
    })
    
    if (!response.ok) {
      throw new Error('Failed to download proposal')
    }
    
    return response.blob()
  }

  async viewProposal(id) {
    // Create a URL with authentication token for viewing the proposal
    const token = getAccessToken();
    const url = `${this.baseURL}/proposals/${id}/view`;
    
    // Open the URL in a new tab with authentication
    const newWindow = window.open('', '_blank');
    
    // Fetch the PDF with authentication and create a blob URL
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to load proposal');
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      // Navigate the new window to the blob URL
      newWindow.location.href = blobUrl;
      
      return blobUrl;
    } catch (error) {
      newWindow.close();
      throw error;
    }
  }

  async sendProposal(id, emailData) {
    return this.request(`/proposals/${id}/send`, {
      method: 'POST',
      body: JSON.stringify(emailData)
    })
  }

  async updateProposalStatus(id, status) {
    return this.request(`/proposals/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  }

  async deleteProposal(id) {
    return this.request(`/proposals/${id}`, {
      method: 'DELETE'
    })
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

  // AI-powered Social Media methods
  async generateAIImages(prompt, style = 'realistic', count = 4) {
    return this.request('/social/generate-image', {
      method: 'POST',
      body: JSON.stringify({ prompt, style, count })
    })
  }

  async generateAIText(prompt, tone = 'professional', type = 'generate') {
    return this.request('/social/generate-text', {
      method: 'POST',
      body: JSON.stringify({ prompt, tone, type })
    })
  }

  async getAIGeneratedImages(page = 1, limit = 12) {
    return this.request(`/social/generated-images?page=${page}&limit=${limit}`)
  }

  async downloadAIImage(imageId) {
    return this.request(`/social/download-image/${imageId}`, {
      method: 'POST'
    })
  }

  // Quotes methods
  async getQuotes(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/quotes${queryString ? `?${queryString}` : ''}`)
  }

  async getQuote(quoteId) {
    return this.request(`/quotes/${quoteId}`)
  }

  async createQuote(quoteData) {
    return this.request('/quotes', {
      method: 'POST',
      body: JSON.stringify(quoteData)
    })
  }

  async updateQuote(quoteId, quoteData) {
    return this.request(`/quotes/${quoteId}`, {
      method: 'PUT',
      body: JSON.stringify(quoteData)
    })
  }

  async deleteQuote(quoteId) {
    return this.request(`/quotes/${quoteId}`, {
      method: 'DELETE'
    })
  }

  async duplicateQuote(quoteId) {
    return this.request(`/quotes/${quoteId}/duplicate`, {
      method: 'POST'
    })
  }

  async sendQuote(quoteId) {
    return this.request(`/quotes/${quoteId}/send`, {
      method: 'POST'
    })
  }

  async convertQuoteToInvoice(quoteId) {
    return this.request(`/quotes/${quoteId}/convert`, {
      method: 'POST'
    })
  }

  // Projects methods
  async getProjects(params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`/projects${queryString ? `?${queryString}` : ''}`)
  }

  async getProject(projectId) {
    return this.request(`/projects/${projectId}`)
  }

  async createProject(projectData) {
    return this.request('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData)
    })
  }

  async updateProject(projectId, projectData) {
    return this.request(`/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    })
  }

  async deleteProject(projectId) {
    return this.request(`/projects/${projectId}`, {
      method: 'DELETE'
    })
  }

  async addProjectTask(projectId, taskData) {
    return this.request(`/projects/${projectId}/tasks`, {
      method: 'POST',
      body: JSON.stringify(taskData)
    })
  }

  async updateProjectTask(projectId, taskId, taskData) {
    return this.request(`/projects/${projectId}/tasks/${taskId}`, {
      method: 'PUT',
      body: JSON.stringify(taskData)
    })
  }

  async deleteProjectTask(projectId, taskId) {
    return this.request(`/projects/${projectId}/tasks/${taskId}`, {
      method: 'DELETE'
    })
  }

  async updateProjectStatus(projectId, status) {
    return this.request(`/projects/${projectId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status })
    })
  }

  async addProjectNote(projectId, noteData) {
    return this.request(`/projects/${projectId}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData)
    })
  }

  // Milestone methods
  async addProjectMilestone(projectId, milestoneData) {
    return this.request(`/projects/${projectId}/milestones`, {
      method: 'POST',
      body: JSON.stringify(milestoneData)
    })
  }

  async updateProjectMilestone(projectId, milestoneId, milestoneData) {
    return this.request(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'PUT',
      body: JSON.stringify(milestoneData)
    })
  }

  async deleteProjectMilestone(projectId, milestoneId) {
    return this.request(`/projects/${projectId}/milestones/${milestoneId}`, {
      method: 'DELETE'
    })
  }

  async updateProjectProgress(projectId, progress) {
    return this.request(`/projects/${projectId}/progress`, {
      method: 'PATCH',
      body: JSON.stringify({ progress })
    })
  }

  // Client notification methods
  async notifyClient(projectId, notificationData) {
    return this.request(`/projects/${projectId}/notify-client`, {
      method: 'POST',
      body: JSON.stringify(notificationData)
    })
  }

  // Public project view
  async getPublicProject(projectId) {
    return this.request(`/public/projects/${projectId}`)
  }

  // Generic HTTP methods for convenience
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString()
    return this.request(`${endpoint}${queryString ? `?${queryString}` : ''}`)
  }

  async post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async patch(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data)
    })
  }

  async delete(endpoint) {
    return this.request(endpoint, {
      method: 'DELETE'
    })
  }

  // Health check
  async healthCheck() {
    return this.request('/health')
  }
}

const apiClient = new ApiClient()
export default apiClient 