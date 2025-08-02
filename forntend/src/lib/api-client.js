// API client for MongoDB backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Set authentication tokens
  setTokens(accessToken, refreshToken) {
    this.token = accessToken;
    this.refreshToken = refreshToken;
    
    if (accessToken) {
      localStorage.setItem('accessToken', accessToken);
    } else {
      localStorage.removeItem('accessToken');
    }
    
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    } else {
      localStorage.removeItem('refreshToken');
    }
  }

  // Clear authentication tokens
  clearTokens() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Get stored tokens
  getStoredTokens() {
    return {
      accessToken: localStorage.getItem('accessToken'),
      refreshToken: localStorage.getItem('refreshToken')
    };
  }

  // Make HTTP request with automatic token refresh
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add authorization header if token exists
    if (this.token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      let response = await fetch(url, config);

      // If token expired, try to refresh
      if (response.status === 401 && this.refreshToken && !endpoint.includes('/refresh-token')) {
        const refreshResult = await this.refreshAccessToken();
        
        if (refreshResult.success) {
          // Retry original request with new token
          config.headers.Authorization = `Bearer ${this.token}`;
          response = await fetch(url, config);
        } else {
          // Refresh failed, clear tokens and redirect to login
          this.clearTokens();
          window.location.href = '/signin';
          return { success: false, error: 'Authentication expired' };
        }
      }

      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data.error || 'Request failed',
          validationErrors: data.validationErrors,
          statusCode: response.status
        };
      }

      return {
        success: true,
        data: data.data || data,
        message: data.message
      };
    } catch (error) {
      console.error('API request failed:', error);
      return {
        success: false,
        error: 'Network error. Please check your connection.',
        originalError: error
      };
    }
  }

  // Refresh access token
  async refreshAccessToken() {
    if (!this.refreshToken) {
      return { success: false, error: 'No refresh token available' };
    }

    try {
      const response = await fetch(`${this.baseURL}/auth/refresh-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          refreshToken: this.refreshToken
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        this.setTokens(data.tokens.accessToken, data.tokens.refreshToken);
        return { success: true };
      } else {
        this.clearTokens();
        return { success: false, error: data.error || 'Token refresh failed' };
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return { success: false, error: 'Token refresh failed' };
    }
  }

  // Authentication methods
  async signUp(userData) {
    return this.request('/auth/signup', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  }

  async signIn(email, password) {
    const result = await this.request('/auth/signin', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (result.success && result.data.tokens) {
      this.setTokens(result.data.tokens.accessToken, result.data.tokens.refreshToken);
    }

    return result;
  }

  async verifyOTP(email, otp) {
    const result = await this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp })
    });

    if (result.success && result.data.tokens) {
      this.setTokens(result.data.tokens.accessToken, result.data.tokens.refreshToken);
    }

    return result;
  }

  async resendOTP(email) {
    return this.request('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async forgotPassword(email) {
    return this.request('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email })
    });
  }

  async resetPassword(token, password) {
    return this.request('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, password })
    });
  }

  async signOut() {
    const result = await this.request('/auth/logout', {
      method: 'POST',
      body: JSON.stringify({ refreshToken: this.refreshToken })
    });

    this.clearTokens();
    return result;
  }

  async signOutAll() {
    const result = await this.request('/auth/logout-all', {
      method: 'POST'
    });

    this.clearTokens();
    return result;
  }

  // User methods
  async getCurrentUser() {
    return this.request('/user/me');
  }

  async updateUserPreferences(preferences) {
    return this.request('/user/preferences', {
      method: 'PATCH',
      body: JSON.stringify(preferences)
    });
  }

  async changePassword(currentPassword, newPassword) {
    return this.request('/user/change-password', {
      method: 'PATCH',
      body: JSON.stringify({ currentPassword, newPassword })
    });
  }

  async deactivateAccount(password) {
    return this.request('/user/deactivate', {
      method: 'PATCH',
      body: JSON.stringify({ password })
    });
  }

  // Profile methods
  async getUserProfile() {
    return this.request('/profile/me');
  }

  async updateUserProfile(profileData) {
    return this.request('/profile/me', {
      method: 'PATCH',
      body: JSON.stringify(profileData)
    });
  }

  async updateProfileSettings(settings) {
    return this.request('/profile/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings)
    });
  }

  async completeOnboardingStep(step) {
    return this.request(`/profile/onboarding/${step}`, {
      method: 'PATCH'
    });
  }

  async getOnboardingStatus() {
    return this.request('/profile/onboarding');
  }

  async getProfileAnalytics() {
    return this.request('/profile/analytics');
  }

  // Password management
  async changePassword(passwordData) {
    return this.request('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(passwordData)
    });
  }

  // Data export
  async exportUserData() {
    return this.request('/user/export-data');
  }

  // Account deletion
  async deleteAccount() {
    return this.request('/user/delete-account', {
      method: 'DELETE'
    });
  }

  // Leads API methods
  async getLeads(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/leads${queryString ? `?${queryString}` : ''}`);
  }

  async getLead(id) {
    return this.request(`/leads/${id}`);
  }

  async createLead(leadData) {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData)
    });
  }

  async updateLead(id, leadData) {
    return this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData)
    });
  }

  async deleteLead(id) {
    return this.request(`/leads/${id}`, {
      method: 'DELETE'
    });
  }

  async addLeadNote(id, noteData) {
    return this.request(`/leads/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
  }

  async addLeadCommunication(id, communicationData) {
    return this.request(`/leads/${id}/communications`, {
      method: 'POST',
      body: JSON.stringify(communicationData)
    });
  }

  async updateLeadStatus(id, status) {
    return this.request(`/leads/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async convertLeadToClient(id, clientData = {}) {
    return this.request(`/leads/${id}/convert`, {
      method: 'POST',
      body: JSON.stringify({ clientData })
    });
  }

  async getLeadStatistics(days = 30) {
    return this.request(`/leads/statistics?days=${days}`);
  }

  async getLeadsForFollowUp() {
    return this.request('/leads/follow-up');
  }

  // Clients API methods
  async getClients(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/clients${queryString ? `?${queryString}` : ''}`);
  }

  async getClient(id) {
    return this.request(`/clients/${id}`);
  }

  async createClient(clientData) {
    return this.request('/clients', {
      method: 'POST',
      body: JSON.stringify(clientData)
    });
  }

  async updateClient(id, clientData) {
    return this.request(`/clients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(clientData)
    });
  }

  async deleteClient(id) {
    return this.request(`/clients/${id}`, {
      method: 'DELETE'
    });
  }

  async addClientNote(id, noteData) {
    return this.request(`/clients/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify(noteData)
    });
  }

  async addClientProject(id, projectData) {
    return this.request(`/clients/${id}/projects`, {
      method: 'POST',
      body: JSON.stringify(projectData)
    });
  }

  async updateClientProject(id, projectId, projectData) {
    return this.request(`/clients/${id}/projects/${projectId}`, {
      method: 'PUT',
      body: JSON.stringify(projectData)
    });
  }

  async addClientContract(id, contractData) {
    return this.request(`/clients/${id}/contracts`, {
      method: 'POST',
      body: JSON.stringify(contractData)
    });
  }

  async updateClientStatus(id, status) {
    return this.request(`/clients/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async updateClientPriority(id, priority) {
    return this.request(`/clients/${id}/priority`, {
      method: 'PUT',
      body: JSON.stringify({ priority })
    });
  }

  async getClientStatistics(days = 30) {
    return this.request(`/clients/statistics?days=${days}`);
  }

  async getHighValueClients(minValue = 10000) {
    return this.request(`/clients/high-value?minValue=${minValue}`);
  }

  async getRevenueByMonth(months = 12) {
    return this.request(`/clients/revenue-by-month?months=${months}`);
  }

  async getClientsForReview() {
    return this.request('/clients/for-review');
  }

  // Utility methods
  isAuthenticated() {
    return !!this.token;
  }

  getToken() {
    return this.token;
  }

  // Health check
  async healthCheck() {
    return this.request('/health');
  }
}

// Create and export singleton instance
const apiClient = new ApiClient();

export default apiClient; 