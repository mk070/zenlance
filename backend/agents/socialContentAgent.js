import aiService from '../services/aiService.js';
import { logger } from '../utils/logger.js';

class SocialContentAgent {
  constructor() {
    this.aiService = aiService;
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  /**
   * Generate fresh social media content based on a topic or prompt
   * @param {string} topic - The topic or brief description to generate content about
   * @param {string} tone - The tone for the content (professional, casual, engaging, inspirational)
   * @param {Array} platforms - Target platforms for optimization
   * @param {number} variations - Number of content variations to generate (default: 3)
   * @returns {Promise<Object>} Generated content variations
   */
  async generateContent(topic, tone = 'professional', platforms = [], variations = 3) {
    if (!this.aiService.isConfigured) {
      throw new Error('AI service is not configured. Please check your Azure OpenAI settings.');
    }

    try {
      logger.info(`Generating social content for topic: "${topic}" with tone: ${tone}`);

      const platformContext = platforms.length > 0 
        ? `This content is for: ${platforms.join(', ')}. `
        : '';

      const toneInstructions = this.getToneInstructions(tone);
      const platformOptimization = this.getPlatformOptimization(platforms);

      const prompt = `You are a social media content expert. Generate ${variations} different social media post variations based on the following:

Topic/Theme: "${topic}"

${platformContext}${toneInstructions}

${platformOptimization}

Requirements:
- Each variation should be unique and engaging
- Keep posts concise and impactful (under 280 characters for Twitter compatibility)
- Include relevant hashtag suggestions (don't count hashtags in character limit)
- Make content actionable and shareable
- Avoid overly promotional language
- Focus on providing value to the audience

Please provide exactly ${variations} content variations in the following JSON format:
{
  "variations": [
    {
      "content": "Main post content here",
      "hashtags": "#relevant #hashtags #here",
      "tone": "${tone}",
      "characterCount": 0,
      "platform_optimized": ["twitter", "linkedin"]
    }
  ]
}

Important: Return ONLY the JSON response, no additional text or formatting.`;

      const response = await this.aiService.makeRequest([
        {
          role: 'system',
          content: 'You are a professional social media content creator. Always respond with valid JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.8,
        maxTokens: 1500
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to generate content');
      }

      const parsedContent = this.parseAIResponse(response.content);
      
      // Add character counts and validate
      parsedContent.variations = parsedContent.variations.map(variation => ({
        ...variation,
        characterCount: variation.content.length,
        generatedAt: new Date().toISOString(),
        cost: response.usage?.total_tokens || 0
      }));

      logger.info(`Successfully generated ${parsedContent.variations.length} content variations`);
      
      return {
        success: true,
        data: parsedContent.variations,
        metadata: {
          originalTopic: topic,
          requestedTone: tone,
          platforms: platforms,
          usage: response.usage
        }
      };

    } catch (error) {
      logger.error('Error generating social content:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate content',
        data: []
      };
    }
  }

  /**
   * Rephrase existing content with different tone or style
   * @param {string} originalContent - The original content to rephrase
   * @param {string} tone - Target tone for rephrasing
   * @param {Array} platforms - Target platforms for optimization
   * @param {number} variations - Number of rephrased variations (default: 3)
   * @returns {Promise<Object>} Rephrased content variations
   */
  async rephraseContent(originalContent, tone = 'professional', platforms = [], variations = 3) {
    if (!this.aiService.isConfigured) {
      throw new Error('AI service is not configured. Please check your Azure OpenAI settings.');
    }

    if (!originalContent || originalContent.trim().length === 0) {
      throw new Error('Original content is required for rephrasing');
    }

    try {
      logger.info(`Rephrasing content with tone: ${tone}`);

      const platformContext = platforms.length > 0 
        ? `Optimize for: ${platforms.join(', ')}. `
        : '';

      const toneInstructions = this.getToneInstructions(tone);
      const platformOptimization = this.getPlatformOptimization(platforms);

      const prompt = `You are a social media content expert. Rephrase the following content in ${variations} different ways while maintaining the core message and value.

Original Content: "${originalContent}"

${platformContext}${toneInstructions}

${platformOptimization}

Requirements:
- Maintain the original meaning and key points
- Improve engagement and readability
- Keep posts concise (under 280 characters for broad compatibility)
- Make each variation distinct while staying true to the original message
- Include relevant hashtag suggestions
- Enhance call-to-action elements if present
- Improve overall flow and impact

Please provide exactly ${variations} rephrased variations in the following JSON format:
{
  "variations": [
    {
      "content": "Rephrased content here",
      "hashtags": "#relevant #hashtags",
      "tone": "${tone}",
      "characterCount": 0,
      "improvements": ["What was improved in this version"],
      "platform_optimized": ["platforms this works best for"]
    }
  ]
}

Important: Return ONLY the JSON response, no additional text or formatting.`;

      const response = await this.aiService.makeRequest([
        {
          role: 'system',
          content: 'You are a professional social media content editor. Always respond with valid JSON format only.'
        },
        {
          role: 'user',
          content: prompt
        }
      ], {
        temperature: 0.7,
        maxTokens: 1500
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to rephrase content');
      }

      const parsedContent = this.parseAIResponse(response.content);
      
      // Add metadata
      parsedContent.variations = parsedContent.variations.map(variation => ({
        ...variation,
        characterCount: variation.content.length,
        originalContent: originalContent,
        generatedAt: new Date().toISOString(),
        cost: response.usage?.total_tokens || 0
      }));

      logger.info(`Successfully rephrased content into ${parsedContent.variations.length} variations`);
      
      return {
        success: true,
        data: parsedContent.variations,
        metadata: {
          originalContent: originalContent,
          requestedTone: tone,
          platforms: platforms,
          usage: response.usage
        }
      };

    } catch (error) {
      logger.error('Error rephrasing content:', error);
      return {
        success: false,
        error: error.message || 'Failed to rephrase content',
        data: []
      };
    }
  }

  /**
   * Generate content with specific platform optimization
   * @param {string} topic - The topic to generate content about
   * @param {string} platform - Specific platform to optimize for
   * @param {string} tone - Content tone
   * @returns {Promise<Object>} Platform-optimized content
   */
  async generateForPlatform(topic, platform, tone = 'professional') {
    const platformSpecs = {
      twitter: {
        maxLength: 280,
        style: 'concise, hashtag-friendly, trending-aware',
        features: 'threads, retweets, trending topics'
      },
      linkedin: {
        maxLength: 1300,
        style: 'professional, thought-leadership, industry-focused',
        features: 'professional networking, business insights'
      },
      facebook: {
        maxLength: 500,
        style: 'conversational, community-focused, story-driven',
        features: 'community engagement, visual storytelling'
      },
      instagram: {
        maxLength: 150,
        style: 'visual-first, story-driven, lifestyle-focused',
        features: 'visual content, stories, reels'
      }
    };

    const spec = platformSpecs[platform.toLowerCase()] || platformSpecs.twitter;

    return await this.generateContent(
      `${topic} (optimized specifically for ${platform}: ${spec.style})`,
      tone,
      [platform],
      2
    );
  }

  /**
   * Get tone-specific instructions for content generation
   * @private
   */
  getToneInstructions(tone) {
    const toneMap = {
      professional: 'Use a professional, authoritative tone. Focus on expertise, credibility, and business value. Suitable for B2B content.',
      casual: 'Use a friendly, conversational tone. Be approachable and relatable. Use everyday language that connects with people.',
      engaging: 'Use an interactive, energetic tone. Include questions, calls-to-action, and elements that encourage participation.',
      inspirational: 'Use an uplifting, motivational tone. Focus on positive messaging, growth mindset, and encouraging action.',
      humorous: 'Use light humor and wit. Keep it appropriate and brand-safe. Make content memorable and shareable.',
      educational: 'Use an informative, helpful tone. Focus on teaching and providing valuable insights or tips.'
    };

    return toneMap[tone] || toneMap.professional;
  }

  /**
   * Get platform-specific optimization guidelines
   * @private
   */
  getPlatformOptimization(platforms) {
    if (platforms.length === 0) return '';

    const optimizations = platforms.map(platform => {
      switch (platform.toLowerCase()) {
        case 'twitter':
          return '- Twitter: Concise, hashtag-friendly, trending-aware content under 280 characters';
        case 'linkedin':
          return '- LinkedIn: Professional, thought-leadership content with industry insights';
        case 'facebook':
          return '- Facebook: Community-focused, conversational content that encourages discussion';
        case 'instagram':
          return '- Instagram: Visual-focused, lifestyle content with strong visual appeal';
        default:
          return `- ${platform}: General social media best practices`;
      }
    }).join('\n');

    return `Platform Optimization:\n${optimizations}\n`;
  }

  /**
   * Parse AI response and handle JSON extraction
   * @private
   */
  parseAIResponse(content) {
    try {
      // Try to parse directly first
      return JSON.parse(content);
    } catch (e) {
      // If direct parsing fails, try to extract JSON from the response
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch (e2) {
          logger.error('Failed to parse extracted JSON:', e2);
        }
      }
      
      // Fallback: create structured response from text
      logger.warn('Could not parse JSON response, creating fallback structure');
      return {
        variations: [{
          content: content.trim(),
          hashtags: '',
          tone: 'professional',
          characterCount: content.trim().length,
          platform_optimized: []
        }]
      };
    }
  }

  /**
   * Retry mechanism for failed requests
   * @private
   */
  async retryOperation(operation, retries = this.maxRetries) {
    for (let i = 0; i < retries; i++) {
      try {
        return await operation();
      } catch (error) {
        if (i === retries - 1) throw error;
        
        logger.warn(`Operation failed, retrying... (${i + 1}/${retries})`);
        await new Promise(resolve => setTimeout(resolve, this.retryDelay * (i + 1)));
      }
    }
  }

  /**
   * Get content statistics and analysis
   * @param {string} content - Content to analyze
   * @returns {Object} Content statistics
   */
  analyzeContent(content) {
    const words = content.trim().split(/\s+/).length;
    const characters = content.length;
    const hashtags = (content.match(/#\w+/g) || []).length;
    const mentions = (content.match(/@\w+/g) || []).length;
    const urls = (content.match(/https?:\/\/[^\s]+/g) || []).length;

    return {
      wordCount: words,
      characterCount: characters,
      hashtagCount: hashtags,
      mentionCount: mentions,
      urlCount: urls,
      twitterCompliant: characters <= 280,
      linkedinCompliant: characters <= 1300,
      readabilityScore: this.calculateReadabilityScore(content)
    };
  }

  /**
   * Simple readability score calculation
   * @private
   */
  calculateReadabilityScore(content) {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const words = content.trim().split(/\s+/);
    const avgWordsPerSentence = words.length / sentences.length;
    
    // Simple scoring: lower score = more readable
    if (avgWordsPerSentence <= 15) return 'high';
    if (avgWordsPerSentence <= 20) return 'medium';
    return 'low';
  }
}

export default SocialContentAgent; 