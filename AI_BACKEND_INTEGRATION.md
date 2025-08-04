# AI Image Generation - Backend Integration Guide

## Overview
The AI image generation feature is currently implemented with local storage for development purposes. This document outlines what needs to be moved to the backend for production deployment.

## Current Implementation (Frontend Only)

### Local Storage Functions
Currently using `localStorage` for:
- Storing generated image history
- Caching generated images
- Managing user preferences

### Mock AI Service
Currently using placeholder images from `picsum.photos` to simulate AI generation.

## Required Backend Integration

### 1. AI Image Generation API Endpoint

**Endpoint:** `POST /api/social/generate-image`

**Request Body:**
```json
{
  "prompt": "string (post content)",
  "style": "realistic|artistic|minimal|vibrant",
  "userId": "string",
  "count": "number (default: 4)"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "images": [
      {
        "id": "string",
        "url": "string",
        "thumbnail": "string",
        "metadata": {
          "style": "string",
          "prompt": "string",
          "generatedAt": "ISO string",
          "aiService": "openai|midjourney|stable-diffusion"
        }
      }
    ],
    "cost": "number",
    "remainingCredits": "number"
  }
}
```

### 2. Image Storage Service

**Cloud Storage Integration:**
- AWS S3 / Google Cloud Storage / Azure Blob
- CDN for fast image delivery
- Automatic image optimization and compression
- Multiple resolution generation (thumbnail, medium, full)

**Database Schema:**
```sql
CREATE TABLE ai_generated_images (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  prompt TEXT NOT NULL,
  style VARCHAR(50) NOT NULL,
  original_url VARCHAR(255) NOT NULL,
  thumbnail_url VARCHAR(255),
  file_size INTEGER,
  dimensions JSONB, -- {width: 800, height: 600}
  ai_service VARCHAR(50) NOT NULL,
  generation_cost DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_ai_images_user_created ON ai_generated_images(user_id, created_at DESC);
CREATE INDEX idx_ai_images_prompt ON ai_generated_images(prompt);
```

### 3. AI Service Integration

**Option A: OpenAI DALL-E**
```javascript
// Backend implementation
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function generateImage(prompt, style, count = 4) {
  const response = await openai.images.generate({
    model: "dall-e-3",
    prompt: enhancePrompt(prompt, style),
    n: count,
    size: "1024x1024",
    quality: "standard"
  });
  
  return response.data;
}
```

**Option B: Stable Diffusion**
```javascript
// Backend implementation using Stability AI
import StabilityAI from 'stability-ai';

const stability = new StabilityAI({
  apiKey: process.env.STABILITY_API_KEY,
});

async function generateImage(prompt, style, count = 4) {
  const response = await stability.generateImage({
    prompt: enhancePrompt(prompt, style),
    samples: count,
    width: 1024,
    height: 1024,
    cfg_scale: 7,
    steps: 30
  });
  
  return response.artifacts;
}
```

### 4. User Management & Credits

**Credit System:**
```sql
CREATE TABLE user_ai_credits (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  total_credits INTEGER DEFAULT 0,
  used_credits INTEGER DEFAULT 0,
  remaining_credits INTEGER GENERATED ALWAYS AS (total_credits - used_credits) STORED,
  last_purchase_date TIMESTAMP,
  subscription_tier VARCHAR(50) DEFAULT 'free' -- free, basic, premium
);
```

**Usage Tracking:**
```sql
CREATE TABLE ai_usage_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action_type VARCHAR(50) NOT NULL, -- 'image_generation', 'image_download'
  credits_consumed INTEGER NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 5. Required Backend Routes

#### Image Generation
```javascript
// routes/ai.js
router.post('/generate-image', authenticate, [
  body('prompt').isLength({ min: 1, max: 500 }),
  body('style').isIn(['realistic', 'artistic', 'minimal', 'vibrant']),
  body('count').optional().isInt({ min: 1, max: 4 })
], async (req, res) => {
  // 1. Check user credits
  // 2. Call AI service
  // 3. Store images in cloud storage
  // 4. Save to database
  // 5. Deduct credits
  // 6. Return response
});
```

#### Image History
```javascript
router.get('/generated-images', authenticate, [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
  // Return user's generated images with pagination
});
```

#### Download Image
```javascript
router.post('/download-image/:id', authenticate, async (req, res) => {
  // 1. Verify image ownership
  // 2. Generate download URL
  // 3. Log usage
  // 4. Return download link
});
```

### 6. Environment Variables Required

```env
# AI Service Configuration
OPENAI_API_KEY=your_openai_key
STABILITY_API_KEY=your_stability_key

# Cloud Storage
AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_S3_BUCKET=your_bucket_name
AWS_REGION=us-east-1

# CDN
CLOUDFRONT_DOMAIN=your_cdn_domain

# Feature Flags
AI_GENERATION_ENABLED=true
MAX_IMAGES_PER_GENERATION=4
DEFAULT_USER_CREDITS=10
```

### 7. Frontend Changes Required

**API Client Updates:**
```javascript
// lib/api-client.js
export const aiService = {
  generateImages: (prompt, style, count) => 
    apiClient.post('/api/ai/generate-image', { prompt, style, count }),
  
  getImageHistory: (page, limit) => 
    apiClient.get('/api/ai/generated-images', { params: { page, limit } }),
  
  downloadImage: (imageId) => 
    apiClient.post(`/api/ai/download-image/${imageId}`)
};
```

**Replace Mock Service:**
```javascript
// In CreateSocialPost.jsx - Replace AIImageService with:
const generateAIImages = async (style = 'realistic') => {
  try {
    setAiGenerating(true);
    
    const response = await aiService.generateImages(
      formData.content.trim(), 
      style, 
      4
    );
    
    if (response.data.success) {
      setAiGeneratedImages(response.data.data.images);
      toast.success(`Generated ${response.data.data.images.length} images!`);
    }
  } catch (error) {
    toast.error('Failed to generate images');
  } finally {
    setAiGenerating(false);
  }
};
```

### 8. Security Considerations

1. **Rate Limiting:** Implement rate limiting for AI generation endpoints
2. **Content Filtering:** Filter inappropriate prompts before sending to AI
3. **Image Moderation:** Implement automated content moderation for generated images
4. **User Verification:** Verify user identity for high-cost operations
5. **API Key Security:** Secure storage and rotation of AI service API keys

### 9. Cost Management

1. **Credit System:** Implement pay-per-use or subscription-based credits
2. **Usage Analytics:** Track AI generation costs and user behavior
3. **Optimization:** Cache similar prompts to reduce API calls
4. **Tier Limits:** Different generation limits based on subscription tier

### 10. Performance Optimization

1. **Async Processing:** Use job queues for image generation
2. **Caching:** Cache generated images with similar prompts
3. **CDN:** Use CDN for fast image delivery
4. **Compression:** Automatically optimize image sizes
5. **Progressive Loading:** Implement progressive image loading in UI

## Migration Steps

1. **Phase 1:** Set up AI service integration and basic endpoints
2. **Phase 2:** Implement cloud storage and database schema
3. **Phase 3:** Add credit system and user management
4. **Phase 4:** Replace frontend mock service with real API calls
5. **Phase 5:** Add advanced features (caching, moderation, analytics)

## Testing Strategy

1. **Unit Tests:** Test AI service integration and image processing
2. **Integration Tests:** Test complete workflow from prompt to stored image
3. **Load Tests:** Test performance under high generation volume
4. **Cost Tests:** Monitor and optimize AI service costs
5. **Security Tests:** Test for prompt injection and content filtering 