import apiClient from '../lib/api-client';
import toast from 'react-hot-toast';

class AIService {
  constructor() {
    this.isLoading = false;
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  // Generic method for AI requests with loading states and error handling
  async makeAIRequest(endpoint, data = {}, options = {}) {
    const {
      showLoading = true,
      showSuccess = true,
      showError = true,
      useCache = false,
      cacheKey = null
    } = options;

    // Check cache if enabled
    if (useCache && cacheKey) {
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      this.isLoading = true;
      
      if (showLoading) {
        toast.loading('AI is working...', { id: 'ai-loading' });
      }

      const result = await apiClient.request(endpoint, {
        method: 'POST',
        body: JSON.stringify(data)
      });

      if (showLoading) {
        toast.dismiss('ai-loading');
      }

      if (result.success) {
        if (showSuccess && options.successMessage) {
          toast.success(options.successMessage);
        }

        // Cache result if enabled
        if (useCache && cacheKey) {
          this.cache.set(cacheKey, {
            data: result,
            timestamp: Date.now()
          });
        }

        return result;
      } else {
        throw new Error(result.error || 'AI request failed');
      }
    } catch (error) {
      if (showLoading) {
        toast.dismiss('ai-loading');
      }

      if (showError) {
        const errorMessage = this.getErrorMessage(error);
        toast.error(errorMessage);
      }

      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  getErrorMessage(error) {
    if (error.status === 429) {
      return 'AI request limit reached. Please try again in a few minutes.';
    } else if (error.status === 503) {
      return 'AI service is temporarily unavailable. Please try again later.';
    } else if (error.message?.includes('Network error')) {
      return 'Connection error. Please check your internet and try again.';
    } else if (error.message?.includes('AI service not configured')) {
      return 'AI features are not available. Please contact support.';
    }
    
    return error.message || 'AI request failed. Please try again.';
  }

  // Generate AI proposal for a lead
  async generateProposal(leadId, projectRequirements = {}, customInstructions = '') {
    try {
      return await this.makeAIRequest(`/ai/generate-proposal/${leadId}`, {
        projectRequirements,
        customInstructions
      }, {
        successMessage: 'AI proposal generated successfully!',
        showLoading: true
      });
    } catch (error) {
      console.error('AI proposal generation error:', error);
      throw error;
    }
  }

  // Generate follow-up email for a lead
  async generateFollowUpEmail(leadId, context = {}, emailType = 'follow_up') {
    try {
      return await this.makeAIRequest(`/ai/generate-followup/${leadId}`, {
        context,
        emailType
      }, {
        successMessage: 'Follow-up email generated!',
        showLoading: true
      });
    } catch (error) {
      console.error('AI follow-up generation error:', error);
      throw error;
    }
  }

  // Enrich lead data with AI
  async enrichLeadData(leadId, autoApply = false) {
    try {
      return await this.makeAIRequest(`/ai/enrich-lead/${leadId}`, {
        autoApply
      }, {
        successMessage: 'Lead data enriched successfully!',
        showLoading: true,
        useCache: true,
        cacheKey: `enrich-${leadId}`
      });
    } catch (error) {
      console.error('AI lead enrichment error:', error);
      throw error;
    }
  }

  // Get AI action suggestions
  async getSuggestions(entityType, entityId) {
    try {
      return await this.makeAIRequest(`/ai/suggest-actions/${entityType}/${entityId}`, {}, {
        successMessage: 'AI suggestions generated!',
        showLoading: true,
        useCache: true,
        cacheKey: `suggestions-${entityType}-${entityId}`
      });
    } catch (error) {
      console.error('AI suggestions error:', error);
      throw error;
    }
  }

  // Summarize document content
  async summarizeDocument(content, documentType = 'general') {
    try {
      return await this.makeAIRequest('/ai/summarize', {
        content,
        documentType
      }, {
        successMessage: 'Document summarized!',
        showLoading: true,
        useCache: true,
        cacheKey: `summary-${documentType}-${content.slice(0, 100)}`
      });
    } catch (error) {
      console.error('AI document summary error:', error);
      throw error;
    }
  }

  // Generate social media content
  async generateSocialContent(context = {}) {
    try {
      return await this.makeAIRequest('/ai/generate-social-content', {
        context
      }, {
        successMessage: 'Social content generated!',
        showLoading: true
      });
    } catch (error) {
      console.error('AI social content generation error:', error);
      throw error;
    }
  }

  // Get business analytics and insights
  async getBusinessAnalytics(timeRange = 'month', includeForecasting = true) {
    try {
      return await this.makeAIRequest('/ai/analyze-business-metrics', {
        timeRange,
        includeForecasting
      }, {
        successMessage: 'Business analysis completed!',
        showLoading: true,
        useCache: true,
        cacheKey: `analytics-${timeRange}-${Date.now()}`
      });
    } catch (error) {
      console.error('AI business analytics error:', error);
      throw error;
    }
  }

  // Generate payment reminder
  async generatePaymentReminder(invoiceId, reminderType = 'gentle', daysOverdue = 0) {
    try {
      return await this.makeAIRequest(`/ai/generate-payment-reminder/${invoiceId}`, {
        reminderType,
        daysOverdue
      }, {
        successMessage: 'Payment reminder generated!',
        showLoading: true
      });
    } catch (error) {
      console.error('AI payment reminder error:', error);
      throw error;
    }
  }

  // Check AI service health
  async healthCheck() {
    try {
      return await apiClient.request('/ai/health');
    } catch (error) {
      console.error('AI health check error:', error);
      return {
        success: false,
        data: {
          status: 'error',
          message: error.message
        }
      };
    }
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }

  // Get cache size for debugging
  getCacheInfo() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export default new AIService(); 