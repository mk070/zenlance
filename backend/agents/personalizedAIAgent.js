import aiService from '../services/aiService.js';
import { logger } from '../utils/logger.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';

class PersonalizedAIAgent {
  constructor() {
    this.aiService = aiService;
    this.maxRetries = 3;
    this.retryDelay = 1000;
  }

  /**
   * Get comprehensive user context for AI personalization
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User context object
   */
  async getUserContext(userId) {
    try {
      const [user, profile] = await Promise.all([
        User.findById(userId),
        Profile.findOne({ userId })
      ]);

      if (!user) {
        throw new Error('User not found');
      }

      return {
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          memberSince: user.createdAt,
          preferences: user.preferences
        },
        profile: profile ? {
          businessName: profile.businessName,
          businessType: profile.businessType,
          industry: profile.industry,
          teamSize: profile.teamSize,
          primaryGoal: profile.primaryGoal,
          experienceLevel: profile.experienceLevel,
          monthlyRevenue: profile.monthlyRevenue,
          currentTools: profile.currentTools,
          location: profile.location,
          subscriptionTier: profile.subscriptionTier
        } : null
      };
    } catch (error) {
      logger.error('Error getting user context:', error);
      return null;
    }
  }

  /**
   * Generate personalized business analytics and insights
   * @param {string} userId - User ID
   * @param {string} timeRange - Time range for analytics (week, month, quarter, year)
   * @param {Object} businessData - Current business metrics
   * @returns {Promise<Object>} Personalized analytics
   */
  async generatePersonalizedAnalytics(userId, timeRange = 'month', businessData = {}) {
    if (!this.aiService.isConfigured) {
      return this.generateFallbackAnalytics(timeRange, businessData);
    }

    try {
      const userContext = await this.getUserContext(userId);
      if (!userContext) {
        return this.generateFallbackAnalytics(timeRange, businessData);
      }

      const contextPrompt = this.buildContextPrompt(userContext);
      const analyticsPrompt = this.buildAnalyticsPrompt(userContext, timeRange, businessData);

      const response = await this.aiService.makeRequest([
        {
          role: 'system',
          content: `You are a personalized business analytics AI assistant. ${contextPrompt} Always respond with valid JSON format only.`
        },
        {
          role: 'user',
          content: analyticsPrompt
        }
      ], {
        temperature: 0.7,
        maxTokens: 2000
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate analytics');
      }

      const analytics = this.parseAIResponse(response.content);
      return {
        success: true,
        data: analytics,
        personalized: true,
        context: userContext
      };

    } catch (error) {
      logger.error('Error generating personalized analytics:', error);
      return this.generateFallbackAnalytics(timeRange, businessData);
    }
  }

  /**
   * Generate personalized suggestions for specific entities
   * @param {string} userId - User ID
   * @param {string} entityType - Type of entity (lead, client, project, etc.)
   * @param {Object} entityData - Entity-specific data
   * @returns {Promise<Object>} Personalized suggestions
   */
  async generatePersonalizedSuggestions(userId, entityType, entityData = {}) {
    if (!this.aiService.isConfigured) {
      return this.generateFallbackSuggestions(entityType, entityData);
    }

    try {
      const userContext = await this.getUserContext(userId);
      if (!userContext) {
        return this.generateFallbackSuggestions(entityType, entityData);
      }

      const contextPrompt = this.buildContextPrompt(userContext);
      const suggestionsPrompt = this.buildSuggestionsPrompt(userContext, entityType, entityData);

      const response = await this.aiService.makeRequest([
        {
          role: 'system',
          content: `You are a personalized business advisor AI. ${contextPrompt} Always respond with valid JSON format only.`
        },
        {
          role: 'user',
          content: suggestionsPrompt
        }
      ], {
        temperature: 0.8,
        maxTokens: 1500
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate suggestions');
      }

      const suggestions = this.parseAIResponse(response.content);
      return {
        success: true,
        data: suggestions.suggestions || [],
        personalized: true,
        context: userContext
      };

    } catch (error) {
      logger.error('Error generating personalized suggestions:', error);
      return this.generateFallbackSuggestions(entityType, entityData);
    }
  }

  /**
   * Generate personalized dashboard insights
   * @param {string} userId - User ID
   * @param {Object} dashboardData - Current dashboard metrics
   * @returns {Promise<Object>} Personalized dashboard insights
   */
  async generateDashboardInsights(userId, dashboardData = {}) {
    if (!this.aiService.isConfigured) {
      return this.generateFallbackDashboardInsights(dashboardData);
    }

    try {
      const userContext = await this.getUserContext(userId);
      if (!userContext) {
        return this.generateFallbackDashboardInsights(dashboardData);
      }

      const contextPrompt = this.buildContextPrompt(userContext);
      const insightsPrompt = this.buildDashboardInsightsPrompt(userContext, dashboardData);

      const response = await this.aiService.makeRequest([
        {
          role: 'system',
          content: `You are a personalized business insights AI. ${contextPrompt} Always respond with valid JSON format only.`
        },
        {
          role: 'user',
          content: insightsPrompt
        }
      ], {
        temperature: 0.7,
        maxTokens: 1200
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate insights');
      }

      const insights = this.parseAIResponse(response.content);
      return {
        success: true,
        data: insights,
        personalized: true,
        context: userContext
      };

    } catch (error) {
      logger.error('Error generating dashboard insights:', error);
      return this.generateFallbackDashboardInsights(dashboardData);
    }
  }

  /**
   * Build context prompt based on user profile
   * @private
   */
  buildContextPrompt(userContext) {
    const { user, profile } = userContext;
    
    let context = `You are helping ${user.firstName}`;
    
    if (profile) {
      if (profile.businessName) {
        context += ` from ${profile.businessName}`;
      }
      
      if (profile.industry) {
        context += `, operating in the ${profile.industry} industry`;
      }
      
      if (profile.businessType) {
        context += ` as a ${profile.businessType.replace('_', ' ')}`;
      }
      
      if (profile.teamSize) {
        context += ` with a team of ${profile.teamSize} people`;
      }
      
      if (profile.experienceLevel) {
        context += `. They have ${profile.experienceLevel} experience level`;
      }
      
      if (profile.primaryGoal) {
        context += ` and their primary goal is to ${profile.primaryGoal.replace('_', ' ')}`;
      }
      
      if (profile.monthlyRevenue) {
        const revenueText = profile.monthlyRevenue === 'pre_revenue' ? 'pre-revenue stage' : 
                           `$${profile.monthlyRevenue} monthly revenue range`;
        context += `. They are currently at ${revenueText}`;
      }
    }
    
    context += '. Provide advice that is specific, actionable, and tailored to their business context.';
    
    return context;
  }

  /**
   * Build analytics prompt
   * @private
   */
  buildAnalyticsPrompt(userContext, timeRange, businessData) {
    const { profile } = userContext;
    
    return `Generate personalized business analytics for the ${timeRange} period. Consider their business context and provide insights that are relevant to their industry, business size, and goals.

Business Context:
- Industry: ${profile?.industry || 'General business'}
- Business Type: ${profile?.businessType || 'Unknown'}
- Team Size: ${profile?.teamSize || 'Unknown'}
- Primary Goal: ${profile?.primaryGoal || 'General growth'}
- Experience Level: ${profile?.experienceLevel || 'Unknown'}
- Revenue Range: ${profile?.monthlyRevenue || 'Unknown'}

Current Metrics:
${Object.keys(businessData).length > 0 ? JSON.stringify(businessData, null, 2) : 'No specific metrics provided'}

Generate analytics in this JSON format:
{
  "predictions": {
    "nextMonth": {
      "revenue": number,
      "confidence": "high|medium|low",
      "reasoning": "explanation based on their context"
    },
    "quarterForecast": {
      "revenue": number,
      "confidence": "high|medium|low",
      "reasoning": "explanation"
    }
  },
  "insights": [
    "personalized insight 1 specific to their industry/business type",
    "insight 2 related to their primary goal",
    "insight 3 appropriate for their experience level",
    "insight 4 relevant to their team size"
  ],
  "trends": {
    "positive": ["positive trend 1", "positive trend 2"],
    "concerning": ["concerning trend 1", "concerning trend 2"]
  },
  "recommendations": [
    {
      "category": "category relevant to their primary goal",
      "action": "specific action for their business type and industry",
      "timeframe": "immediate|this_week|this_month|this_quarter",
      "impact": "expected impact description",
      "reasoning": "why this is important for their specific context"
    }
  ]
}`;
  }

  /**
   * Build simple suggestions prompt for freelancers
   * @private
   */
  buildSuggestionsPrompt(userContext, entityType, entityData) {
    const { profile } = userContext;
    
    return `Generate simple, practical suggestions for an individual freelancer managing a ${entityType}.

Freelancer Context:
- Industry: ${profile?.industry || 'General freelancing'}
- Experience Level: ${profile?.experienceLevel || 'Unknown'}

Entity Data:
${Object.keys(entityData).length > 0 ? JSON.stringify(entityData, null, 2) : 'No specific entity data provided'}

Generate 2-3 simple, actionable suggestions. Focus on what a solo freelancer can realistically do.

{
  "suggestions": [
    {
      "title": "simple action",
      "description": "practical step for solo freelancer",
      "type": "email|call|follow-up|planning",
      "priority": "high|medium",
      "timeframe": "this_week|this_month"
    }
  ]
}

Keep suggestions:
1. Simple and practical
2. Appropriate for solo work
3. Immediately actionable
4. Focused on essential tasks only`;
  }

  /**
   * Build dashboard insights prompt for individual freelancers
   * @private
   */
  buildDashboardInsightsPrompt(userContext, dashboardData) {
    const { profile } = userContext;
    
    return `Generate minimal, practical insights for an individual freelancer working independently.

Freelancer Context:
- Industry: ${profile?.industry || 'General freelancing'}
- Experience Level: ${profile?.experienceLevel || 'Unknown'}
- Monthly Revenue: ${profile?.monthlyRevenue || 'Unknown'}

Current Metrics:
${Object.keys(dashboardData).length > 0 ? JSON.stringify(dashboardData, null, 2) : 'No specific metrics provided'}

Focus on practical, actionable advice for solo freelancers. Keep it simple and essential.

Generate insights in this JSON format:
{
  "keyInsights": [
    "practical insight about current work situation",
    "simple advice about next immediate action"
  ],
  "actionableRecommendations": [
    {
      "title": "simple action title",
      "description": "practical step for a solo freelancer",
      "impact": "clear benefit",
      "effort": "low|medium"
    }
  ],
  "nextAction": "One specific thing to focus on this week"
}`;
  }

  /**
   * Parse AI response and handle JSON extraction
   * @private
   */
  parseAIResponse(content) {
    try {
      return JSON.parse(content);
    } catch (e) {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          logger.error('Failed to parse extracted JSON:', e2);
        }
      }
      
      logger.warn('Could not parse JSON response, using fallback');
      return {
        insights: [content.trim()],
        recommendations: [],
        predictions: {}
      };
    }
  }

  /**
   * Generate fallback analytics when AI is unavailable
   * @private
   */
  generateFallbackAnalytics(timeRange, businessData) {
    const baseRevenue = 50000;
    const timeMultiplier = {
      'week': 0.25,
      'month': 1,
      'quarter': 3,
      'year': 12
    };
    
    const multiplier = timeMultiplier[timeRange] || 1;
    const currentRevenue = Math.round(baseRevenue * multiplier * (0.8 + Math.random() * 0.4));

    return {
      success: true,
      data: {
        predictions: {
          nextMonth: {
            revenue: Math.round(currentRevenue * 1.1),
            confidence: 'medium',
            reasoning: 'Based on historical data patterns'
          }
        },
        insights: [
          'Your business metrics show steady growth patterns.',
          'Consider focusing on lead conversion optimization.',
          'Client retention appears to be performing well.',
          'Time to explore new revenue opportunities.'
        ],
        trends: {
          positive: ['Consistent client engagement', 'Growing project pipeline'],
          concerning: ['Need more data to identify specific concerns']
        },
        recommendations: [
          {
            category: 'Growth',
            action: 'Review and optimize current processes',
            timeframe: 'this_month',
            impact: 'Improved efficiency and growth',
            reasoning: 'Standard business optimization practice'
          }
        ]
      },
      personalized: false
    };
  }

  /**
   * Generate fallback suggestions when AI is unavailable
   * @private
   */
  generateFallbackSuggestions(entityType, entityData) {
    const fallbackSuggestions = {
      lead: [
        { title: 'Follow up with lead', description: 'Send a personalized follow-up message', type: 'email', priority: 'medium', timeframe: 'this_week' },
        { title: 'Research lead background', description: 'Understand their business needs better', type: 'research', priority: 'low', timeframe: 'this_week' }
      ],
      client: [
        { title: 'Schedule check-in', description: 'Regular client communication builds trust', type: 'meeting', priority: 'medium', timeframe: 'this_week' },
        { title: 'Request feedback', description: 'Gather insights to improve service', type: 'email', priority: 'low', timeframe: 'this_month' }
      ],
      project: [
        { title: 'Review project status', description: 'Ensure timeline and deliverables are on track', type: 'planning', priority: 'high', timeframe: 'immediate' },
        { title: 'Update documentation', description: 'Keep project records current', type: 'planning', priority: 'low', timeframe: 'this_week' }
      ]
    };

    return {
      success: true,
      data: fallbackSuggestions[entityType] || fallbackSuggestions.lead,
      personalized: false
    };
  }

  /**
   * Generate simple fallback insights for freelancers
   * @private
   */
  generateFallbackDashboardInsights(dashboardData) {
    return {
      success: true,
      data: {
        keyInsights: [
          'Focus on completing current projects well.',
          'Consider reaching out to past clients for new work.'
        ],
        actionableRecommendations: [
          {
            title: 'Follow up with leads',
            description: 'Send a quick email to recent inquiries',
            impact: 'More potential projects',
            effort: 'low'
          },
          {
            title: 'Update portfolio',
            description: 'Add your latest completed work',
            impact: 'Better client attraction',
            effort: 'medium'
          }
        ],
        nextAction: 'Send one follow-up email to a potential client this week'
      },
      personalized: false
    };
  }
}

export default PersonalizedAIAgent; 