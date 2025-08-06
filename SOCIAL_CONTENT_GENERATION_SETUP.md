# Social Media Content Generation with Azure OpenAI

## ✅ Feature Complete

The social media content generation and rephrasing feature has been successfully implemented using Azure OpenAI integration.

## 🚀 Features Implemented

### 1. AI Content Generation Agent
- **Location**: `backend/agents/socialContentAgent.js`
- **Capabilities**:
  - Generate fresh social media content from topics
  - Rephrase existing content with different tones
  - Platform-specific optimization (Twitter, LinkedIn, Facebook, Instagram)
  - Content analysis and statistics
  - Multiple tone options (professional, casual, engaging, inspirational, humorous, educational)

### 2. Backend API Endpoints
- **POST** `/api/social/generate-content` - Generate fresh content
- **POST** `/api/social/rephrase-content` - Rephrase existing content
- **POST** `/api/social/generate-for-platform` - Platform-specific generation
- **POST** `/api/social/analyze-content` - Content analysis

### 3. Frontend Integration
- **Generate Button**: AI-powered content generation modal
- **Rephrase Button**: AI-powered content rephrasing
- **Real-time Integration**: Uses Azure OpenAI backend APIs
- **Platform Awareness**: Considers selected platforms for optimization

## 🔧 Environment Configuration

Add these variables to your `backend/.env` file:

```env
# Azure OpenAI Configuration (Required for AI features)
AZURE_OPENAI_ENDPOINT=https://your-azure-openai-resource.openai.azure.com
AZURE_OPENAI_API_KEY=your-azure-openai-api-key
AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4
AZURE_OPENAI_API_VERSION=2024-02-01
```

## 📋 API Documentation

### Generate Content
```bash
POST /api/social/generate-content
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "topic": "Our new product launch is revolutionizing the industry",
  "tone": "professional",
  "platforms": ["twitter", "linkedin"],
  "variations": 3
}
```

**Response:**
```json
{
  "success": true,
  "message": "Generated 3 content variations successfully",
  "data": [
    {
      "content": "🚀 Excited to unveil our groundbreaking product that's set to revolutionize the industry! Innovation meets excellence.",
      "hashtags": "#innovation #productlaunch #technology",
      "tone": "professional",
      "characterCount": 127,
      "platform_optimized": ["twitter", "linkedin"],
      "generatedAt": "2024-01-15T10:30:00.000Z",
      "cost": 150
    }
  ],
  "metadata": {
    "originalTopic": "Our new product launch is revolutionizing the industry",
    "requestedTone": "professional",
    "platforms": ["twitter", "linkedin"],
    "usage": { "total_tokens": 150 }
  }
}
```

### Rephrase Content
```bash
POST /api/social/rephrase-content
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "content": "We are excited to announce our new partnership",
  "tone": "engaging",
  "platforms": ["facebook", "instagram"],
  "variations": 3
}
```

### Platform-Specific Generation
```bash
POST /api/social/generate-for-platform
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "topic": "Remote work productivity tips",
  "platform": "linkedin",
  "tone": "professional"
}
```

### Content Analysis
```bash
POST /api/social/analyze-content
Authorization: Bearer {jwt-token}
Content-Type: application/json

{
  "content": "Check out our amazing new product! 🚀 #innovation #tech"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "wordCount": 8,
    "characterCount": 58,
    "hashtagCount": 2,
    "mentionCount": 0,
    "urlCount": 0,
    "twitterCompliant": true,
    "linkedinCompliant": true,
    "readabilityScore": "high"
  }
}
```

## 🎯 Tone Options

| Tone | Description | Best For |
|------|-------------|----------|
| **professional** | Business-focused, authoritative | B2B content, corporate announcements |
| **casual** | Friendly, conversational | Community engagement, personal brands |
| **engaging** | Interactive, energetic | Social engagement, calls-to-action |
| **inspirational** | Uplifting, motivational | Personal development, team building |
| **humorous** | Light humor, witty | Entertainment, brand personality |
| **educational** | Informative, helpful | Tips, tutorials, knowledge sharing |

## 🎨 Platform Optimizations

### Twitter
- Maximum 280 characters
- Hashtag-friendly format
- Trending-aware content
- Concise and impactful

### LinkedIn
- Professional tone focus
- Thought-leadership style
- Industry insights
- Longer-form content (up to 1300 chars)

### Facebook
- Community-focused
- Conversational style
- Story-driven content
- Discussion encouragement

### Instagram
- Visual-first approach
- Lifestyle-focused
- Story-driven
- Shorter content (under 150 chars)

## 🛠️ Frontend Usage

### Generate New Content
1. User clicks "Generate" button in CreateSocialPost
2. Modal opens with tone selection
3. User selects tone (professional, casual, engaging, etc.)
4. AI generates 3 variations optimized for selected platforms
5. User can preview and select preferred variation

### Rephrase Existing Content
1. User enters content in the text area
2. "Rephrase" button becomes available
3. User clicks "Rephrase"
4. AI rephrases content maintaining core message
5. Multiple variations provided for selection

### Integration Flow
```javascript
// Generate content
const result = await generateTextContent(
  'topic or brief description',
  'professional',  // tone
  ['twitter', 'linkedin'],  // platforms
  3  // number of variations
);

// Rephrase content
const result = await rephraseTextContent(
  'existing content to rephrase',
  'engaging',  // new tone
  ['facebook', 'instagram'],  // platforms
  3  // variations
);
```

## 🧪 Testing

### Test the Agent Directly
```bash
cd backend
node test-social-agent.js
```

### Test via API
```bash
# Start the backend server
cd backend
npm start

# Test generation endpoint
curl -X POST http://localhost:5000/api/social/generate-content \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "topic": "New product launch",
    "tone": "professional",
    "platforms": ["twitter"],
    "variations": 2
  }'
```

## 🔍 Error Handling

### Common Issues

1. **AI Service Not Configured**
   ```
   Error: "AI service is not configured. Please check your Azure OpenAI settings."
   ```
   **Solution**: Verify all Azure OpenAI environment variables are set correctly.

2. **Invalid Tone**
   ```
   Error: "Invalid tone specified"
   ```
   **Solution**: Use one of the supported tones: professional, casual, engaging, inspirational, humorous, educational.

3. **Content Too Short/Long**
   ```
   Error: "Content must be between 10 and 1000 characters"
   ```
   **Solution**: Ensure content length is within acceptable limits.

### Fallback Behavior
- If Azure OpenAI is unavailable, the system falls back to template-based generation
- Frontend shows appropriate error messages with retry options
- Backend logs all errors for debugging

## 📊 Cost Optimization

### Token Usage
- **Generation**: ~100-200 tokens per variation
- **Rephrasing**: ~80-150 tokens per variation
- **Analysis**: ~50-100 tokens per request

### Best Practices
- Use appropriate `variations` count (1-5)
- Consider platform count for optimization
- Monitor usage through response metadata

## 🚀 Future Enhancements

### Planned Features
1. **Content Templates**: Pre-built templates for common use cases
2. **Brand Voice Training**: Custom tone based on brand guidelines
3. **A/B Testing**: Generate variations for performance testing
4. **Scheduled Generation**: Automated content creation
5. **Multi-language Support**: Content generation in different languages

### Performance Improvements
1. **Caching**: Cache generated content for similar requests
2. **Batch Processing**: Generate multiple posts simultaneously
3. **Rate Limiting**: Implement intelligent rate limiting
4. **Response Optimization**: Compress and optimize API responses

## 📝 Notes

- All generated content includes metadata for tracking and analytics
- The system maintains backward compatibility with existing frontend code
- Content analysis is performed locally for fast response times
- Azure OpenAI integration uses the latest API version for optimal performance

## 🎉 Usage Examples

### Example 1: Product Launch
```javascript
const result = await generateTextContent(
  'Launching our revolutionary productivity app',
  'exciting',
  ['twitter', 'linkedin', 'facebook'],
  3
);
```

### Example 2: Educational Content
```javascript
const result = await generateForPlatform(
  'Tips for effective remote team management',
  'linkedin',
  'educational'
);
```

### Example 3: Casual Update
```javascript
const result = await rephraseTextContent(
  'Our team had a great week working on new features',
  'casual',
  ['instagram', 'facebook'],
  2
);
```

This complete implementation provides a robust, scalable solution for AI-powered social media content generation using Azure OpenAI! 