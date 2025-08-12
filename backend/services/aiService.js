import OpenAI from 'openai';
import { logger } from '../utils/logger.js';

class AIService {
  constructor() {
    // Check if using Azure OpenAI or standard OpenAI
    const isAzure = process.env.AZURE_OPENAI_ENDPOINT && process.env.AZURE_OPENAI_API_KEY;
    const isOpenAI = process.env.OPENAI_API_KEY;
    
    if (isAzure) {
      // Azure OpenAI configuration
      this.openai = new OpenAI({
        apiKey: process.env.AZURE_OPENAI_API_KEY,
        baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
        defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-01' },
        defaultHeaders: {
          'api-key': process.env.AZURE_OPENAI_API_KEY,
        },
      });
      this.isConfigured = true;
      this.isAzure = true;
      logger.info('Azure OpenAI service configured successfully');
    } else if (isOpenAI) {
      // Standard OpenAI configuration
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      this.isConfigured = true;
      this.isAzure = false;
      logger.info('OpenAI service configured successfully');
    } else {
      this.isConfigured = false;
      this.isAzure = false;
      logger.warn('Neither Azure OpenAI nor OpenAI API configured. AI features will be disabled.');
    }
  }

  async makeRequest(messages, options = {}) {
    if (!this.isConfigured) {
      const configType = this.isAzure ? 'Azure OpenAI' : 'OpenAI';
      throw new Error(`AI service not configured. Please set ${configType} environment variables.`);
    }

    try {
      // Use deployment name for Azure, model name for standard OpenAI
      const modelOrDeployment = this.isAzure 
        ? (options.deployment || process.env.AZURE_OPENAI_DEPLOYMENT_NAME || 'gpt-4')
        : (options.model || 'gpt-4o-mini');

      // Prepare API parameters, converting camelCase to snake_case for Azure OpenAI
      const apiParams = {
        model: modelOrDeployment,
        messages,
        max_tokens: options.maxTokens || options.max_tokens || 2000,
        temperature: options.temperature || 0.7,
        top_p: options.topP || options.top_p || 1,
        frequency_penalty: options.frequencyPenalty || options.frequency_penalty || 0,
        presence_penalty: options.presencePenalty || options.presence_penalty || 0
      };

      // Add any additional options (excluding our processed ones)
      const processedKeys = ['maxTokens', 'max_tokens', 'topP', 'top_p', 'frequencyPenalty', 'frequency_penalty', 'presencePenalty', 'presence_penalty'];
      Object.keys(options).forEach(key => {
        if (!processedKeys.includes(key) && !apiParams.hasOwnProperty(key)) {
          apiParams[key] = options[key];
        }
      });

      const response = await this.openai.chat.completions.create(apiParams);

      return {
        success: true,
        content: response.choices[0]?.message?.content || '',
        usage: response.usage,
        model: response.model
      };
    } catch (error) {
      logger.error('OpenAI API error:', error);
      
      // Handle specific AI service errors
      const serviceType = this.isAzure ? 'Azure OpenAI' : 'OpenAI';
      
      if (error.status === 401) {
        throw new Error(`Invalid ${serviceType} API key or authentication failed`);
      } else if (error.status === 429) {
        throw new Error(`${serviceType} API rate limit exceeded. Please try again later.`);
      } else if (error.status === 500) {
        throw new Error(`${serviceType} service is temporarily unavailable`);
      } else if (error.status === 404 && this.isAzure) {
        throw new Error('Azure OpenAI deployment not found. Check your deployment name.');
      } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
        throw new Error(`Network error connecting to ${serviceType} service`);
      }
      
      throw new Error(`${serviceType} service error: ${error.message}`);
    }
  }

  async generateProposal(leadData, clientData, projectRequirements = {}) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a professional business proposal writer for a freelance/agency business. Create compelling, detailed proposals that win clients. Always include: project overview, scope of work, timeline, pricing breakdown, terms & conditions, and next steps.`
        },
        {
          role: 'user',
          content: `Create a professional business proposal for:

LEAD INFORMATION:
- Name: ${leadData.firstName} ${leadData.lastName}
- Company: ${leadData.company || 'Not specified'}
- Industry: ${leadData.industry || 'Not specified'}
- Email: ${leadData.email}
- Phone: ${leadData.phone || 'Not provided'}
- Lead Source: ${leadData.source || 'Not specified'}
- Priority: ${leadData.priority || 'Medium'}
- Budget Range: ${leadData.budget ? `$${leadData.budget.min || 0} - $${leadData.budget.max || 'Open'}` : 'Not specified'}
- Project Type: ${leadData.projectType || 'Not specified'}
- Description: ${leadData.description || 'No description provided'}
- Timeline: ${leadData.timeline ? `${leadData.timeline.urgency || 'Flexible'} - Start: ${leadData.timeline.startDate || 'TBD'}, End: ${leadData.timeline.endDate || 'TBD'}` : 'Flexible'}

PROJECT REQUIREMENTS:
${JSON.stringify(projectRequirements, null, 2)}

Please generate a comprehensive proposal with:
1. Executive Summary
2. Project Understanding & Objectives  
3. Proposed Solution & Approach
4. Detailed Scope of Work
5. Timeline & Milestones
6. Investment & Pricing
7. Why Choose Us
8. Next Steps
9. Terms & Conditions

Format as structured text with clear sections.`
        }
      ];

      const result = await this.makeRequest(messages, {
        maxTokens: 3000,
        temperature: 0.8
      });

      return {
        success: true,
        proposal: result.content,
        usage: result.usage
      };
    } catch (error) {
      logger.error('Error generating proposal:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateFollowUpEmail(leadData, context = {}) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a professional sales communication specialist. Write personalized, engaging follow-up emails that move leads through the sales funnel. Keep emails concise, friendly, and action-oriented.`
        },
        {
          role: 'user',
          content: `Create a follow-up email for:

LEAD DETAILS:
- Name: ${leadData.firstName} ${leadData.lastName}
- Company: ${leadData.company || 'Not specified'}
- Status: ${leadData.status}
- Last Contact: ${context.lastContactDate || 'Unknown'}
- Days Since Contact: ${context.daysSinceContact || 'Unknown'}
- Project: ${leadData.projectType || 'General inquiry'}
- Budget: ${leadData.budget ? `$${leadData.budget.min || 0} - $${leadData.budget.max || 'Open'}` : 'Not specified'}

CONTEXT:
- Follow-up reason: ${context.reason || 'General follow-up'}
- Previous interactions: ${context.previousInteractions || 'Initial contact'}
- Specific notes: ${context.notes || 'None'}

Generate a professional, personalized follow-up email with:
- Engaging subject line
- Personal greeting
- Reference to previous conversation
- Value proposition
- Clear call-to-action
- Professional signature placeholder

Format as:
SUBJECT: [subject line]
EMAIL: [email body]`
        }
      ];

      const result = await this.makeRequest(messages, {
        maxTokens: 1000,
        temperature: 0.8
      });

      const content = result.content;
      const subjectMatch = content.match(/SUBJECT:\s*(.+)/);
      const emailMatch = content.match(/EMAIL:\s*([\s\S]+)/);

      return {
        success: true,
        subject: subjectMatch ? subjectMatch[1].trim() : 'Follow-up on your project inquiry',
        email: emailMatch ? emailMatch[1].trim() : content,
        usage: result.usage
      };
    } catch (error) {
      logger.error('Error generating follow-up email:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async enrichLeadData(basicData) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a data enrichment specialist. Based on the provided company and contact information, suggest likely industry classifications, company size estimates, and potential project types. Provide realistic, professional estimates.`
        },
        {
          role: 'user',
          content: `Enrich this lead data with professional estimates:

BASIC DATA:
- Name: ${basicData.firstName} ${basicData.lastName}
- Company: ${basicData.company || 'Not provided'}
- Email: ${basicData.email}
- Phone: ${basicData.phone || 'Not provided'}
- Existing Industry: ${basicData.industry || 'Not specified'}
- Project Type: ${basicData.projectType || 'Not specified'}

Please provide educated estimates for:
1. Industry (if not specified or to improve existing)
2. Company size estimate
3. Likely project types they might need
4. Budget range estimate
5. Decision-making urgency
6. Potential pain points

Return as JSON format:
{
  "industry": "estimated industry",
  "companySize": "size estimate",
  "likelyProjects": ["project1", "project2"],
  "budgetRange": {"min": 0, "max": 0},
  "urgency": "high/medium/low",
  "painPoints": ["pain1", "pain2"],
  "confidence": "high/medium/low"
}`
        }
      ];

      const result = await this.makeRequest(messages, {
        maxTokens: 800,
        temperature: 0.6
      });

      try {
        const enrichedData = JSON.parse(result.content);
        return {
          success: true,
          enrichedData,
          usage: result.usage
        };
      } catch (parseError) {
        logger.error('Error parsing AI enrichment response:', parseError);
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }
    } catch (error) {
      logger.error('Error enriching lead data:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async suggestNextActions(entityData, entityType = 'lead') {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a CRM automation specialist. Analyze ${entityType} data and suggest the most effective next actions to move the business relationship forward. Focus on practical, actionable steps.`
        },
        {
          role: 'user',
          content: `Suggest next actions for this ${entityType}:

DATA:
${JSON.stringify(entityData, null, 2)}

Consider:
- Current status and priority
- Time since last contact
- Project timeline and urgency
- Communication history
- Business context

Provide 3-5 specific, actionable next steps in order of priority.
Return as JSON:
{
  "actions": [
    {
      "title": "Action title",
      "description": "Detailed description",
      "priority": "high/medium/low",
      "timeframe": "immediate/this_week/this_month",
      "type": "email/call/meeting/follow_up/proposal"
    }
  ],
  "reasoning": "Brief explanation of strategy"
}`
        }
      ];

      const result = await this.makeRequest(messages, {
        maxTokens: 1000,
        temperature: 0.7
      });

      try {
        const suggestions = JSON.parse(result.content);
        return {
          success: true,
          suggestions,
          usage: result.usage
        };
      } catch (parseError) {
        logger.error('Error parsing AI suggestions response:', parseError);
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }
    } catch (error) {
      logger.error('Error generating action suggestions:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async summarizeDocument(content, documentType = 'general') {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a document analysis expert. Create concise, actionable summaries that highlight key points, decisions, and action items. Focus on what's most important for business context.`
        },
        {
          role: 'user',
          content: `Summarize this ${documentType} document:

CONTENT:
${content}

Provide:
1. Key Summary (2-3 sentences)
2. Important Points (bullet points)
3. Action Items (if any)
4. Deadlines/Dates (if mentioned)
5. Financial Information (if any)

Keep it concise but comprehensive.`
        }
      ];

      const result = await this.makeRequest(messages, {
        maxTokens: 1000,
        temperature: 0.5
      });

      return {
        success: true,
        summary: result.content,
        usage: result.usage
      };
    } catch (error) {
      logger.error('Error summarizing document:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async generateSocialContent(context = {}) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a social media content specialist for freelance/agency businesses. Create engaging, professional content that showcases expertise and attracts potential clients. Include relevant hashtags and maintain a professional yet approachable tone.`
        },
        {
          role: 'user',
          content: `Generate social media content for:

CONTEXT:
- Business Type: ${context.businessType || 'Freelance/Agency'}
- Industry Focus: ${context.industry || 'General'}
- Recent Project: ${context.recentProject || 'Not specified'}
- Content Type: ${context.contentType || 'general'}
- Platform: ${context.platform || 'LinkedIn'}
- Tone: ${context.tone || 'Professional'}

Create engaging content that:
1. Showcases expertise
2. Provides value to potential clients
3. Includes appropriate hashtags
4. Has a clear call-to-action

Return as JSON:
{
  "content": "post content",
  "hashtags": ["hashtag1", "hashtag2"],
  "callToAction": "specific CTA",
  "suggestedTime": "best time to post"
}`
        }
      ];

      const result = await this.makeRequest(messages, {
        maxTokens: 800,
        temperature: 0.8
      });

      try {
        const socialContent = JSON.parse(result.content);
        return {
          success: true,
          content: socialContent,
          usage: result.usage
        };
      } catch (parseError) {
        logger.error('Error parsing social content response:', parseError);
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }
    } catch (error) {
      logger.error('Error generating social content:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async analyzeBusinessMetrics(metricsData) {
    try {
      const messages = [
        {
          role: 'system',
          content: `You are a business analytics expert specializing in freelance/agency businesses. Analyze performance metrics and provide actionable insights, predictions, and recommendations for growth.`
        },
        {
          role: 'user',
          content: `Analyze these business metrics:

METRICS DATA:
${JSON.stringify(metricsData, null, 2)}

Provide analysis including:
1. Key Performance Insights
2. Trends and Patterns
3. Areas for Improvement
4. Revenue Predictions (next 3 months)
5. Actionable Recommendations

Return as JSON:
{
  "insights": ["insight1", "insight2"],
  "trends": {
    "positive": ["trend1"],
    "concerning": ["trend1"]
  },
  "predictions": {
    "nextMonth": {"revenue": 0, "confidence": "high/medium/low"},
    "quarterForecast": {"revenue": 0, "confidence": "high/medium/low"}
  },
  "recommendations": [
    {
      "category": "category",
      "action": "specific action",
      "impact": "expected impact",
      "timeframe": "timeframe"
    }
  ]
}`
        }
      ];

      const result = await this.makeRequest(messages, {
        maxTokens: 1500,
        temperature: 0.6
      });

      try {
        const analysis = JSON.parse(result.content);
        return {
          success: true,
          analysis,
          usage: result.usage
        };
      } catch (parseError) {
        logger.error('Error parsing analytics response:', parseError);
        return {
          success: false,
          error: 'Failed to parse AI response'
        };
      }
    } catch (error) {
      logger.error('Error analyzing business metrics:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Health check method
  async healthCheck() {
    if (!this.isConfigured) {
      const serviceType = this.isAzure ? 'Azure OpenAI' : 'OpenAI';
      return {
        status: 'disabled',
        message: `${serviceType} service not configured`,
        service: serviceType.toLowerCase().replace(' ', '_')
      };
    }

    try {
      const response = await this.makeRequest([
        {
          role: 'user',
          content: 'Say "AI service is working" if you can respond.'
        }
      ], { maxTokens: 10 });

      const serviceType = this.isAzure ? 'Azure OpenAI' : 'OpenAI';
      return {
        status: 'healthy',
        message: `${serviceType} service is operational`,
        service: serviceType.toLowerCase().replace(' ', '_'),
        model: response.model,
        endpoint: this.isAzure ? process.env.AZURE_OPENAI_ENDPOINT : 'https://api.openai.com'
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message,
        service: this.isAzure ? 'azure_openai' : 'openai'
      };
    }
  }
}

export default new AIService(); 