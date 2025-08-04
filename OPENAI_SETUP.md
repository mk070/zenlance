# OpenAI Integration Setup Guide

## ✅ Integration Complete

The OpenAI DALL-E image generation has been successfully integrated into the social media backend.

## 🔧 Environment Configuration Required

Add these variables to your `backend/.env` file:

```env
# OpenAI Configuration
OPENAI_API=your-openai-api-key-here
AZURE_OPENAI_ENDPOINT=https://cts-vibeopenai01.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=dalle-3
```

## ⚠️ Important Endpoint Note

**Issue Detected:** The endpoint you provided is for chat completions:
```
https://cts-vibeopenai01.openai.azure.com/openai/deployments/cts-vibecode-gpt-4.1/chat/completions
```

**For DALL-E image generation, the endpoint should be:**
```
https://cts-vibeopenai01.openai.azure.com/openai/deployments/{your-dalle-deployment-name}/images/generations
```

You'll need to:
1. Create a DALL-E deployment in your Azure OpenAI service
2. Update the `AZURE_OPENAI_DEPLOYMENT` variable with your DALL-E deployment name

## 📦 Dependencies

The integration uses `axios` for HTTP requests. If not installed, run:

```bash
cd backend
npm install axios
```

## 🚀 Features Implemented

### 1. Real OpenAI DALL-E Integration
- **Style Enhancement**: Prompts are enhanced based on selected style (realistic, artistic, minimal, vibrant)
- **Error Handling**: Proper error handling for API key issues, rate limits, and invalid requests
- **Response Processing**: Converts OpenAI response to consistent format
- **Logging**: Detailed logging for debugging

### 2. API Endpoints Active

**Generate Images:**
```bash
POST /api/social/generate-image
Content-Type: application/json
Authorization: Bearer {jwt-token}

{
  "prompt": "A beautiful sunset over mountains",
  "style": "realistic",
  "count": 2
}
```

**Response:**
```json
{
  "success": true,
  "message": "Images generated successfully",
  "data": {
    "images": [
      {
        "id": "openai_1703123456789_0",
        "url": "https://oaidalleapiprodscus.blob.core.windows.net/...",
        "thumbnail": "https://oaidalleapiprodscus.blob.core.windows.net/...",
        "metadata": {
          "style": "realistic",
          "prompt": "A beautiful sunset over mountains. Style: photorealistic, high quality, detailed",
          "generatedAt": "2024-12-21T10:30:45.123Z",
          "aiService": "openai-dalle",
          "revisedPrompt": "A photorealistic, high quality..."
        }
      }
    ],
    "cost": 0.08,
    "remainingCredits": 100
  }
}
```

## 🔐 Security Features

- **API Key Validation**: Checks for API key presence
- **Error Sanitization**: Doesn't expose sensitive API details
- **Rate Limiting**: Handles OpenAI rate limits gracefully
- **Input Validation**: Validates prompt length and parameters

## 💰 Cost Information

- **DALL-E 3**: ~$0.04 per 1024x1024 image
- **DALL-E 2**: ~$0.02 per 1024x1024 image
- **Quality**: Standard quality (HD available for higher cost)

## 🛠️ Configuration Options

The service is configured with:
- **Image Size**: 1024x1024 (optimal for social media)
- **Quality**: Standard (can be upgraded to HD)
- **Style**: Vivid (can be changed to Natural)
- **Max Images**: 4 per request (DALL-E 3 limitation)

## 🧪 Testing

Test the integration with:

```bash
curl -X POST http://localhost:5000/api/social/generate-image \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "prompt": "A modern office space with plants",
    "style": "minimal",
    "count": 2
  }'
```

## 🚨 Troubleshooting

### Common Issues:

1. **401 Unauthorized**: Check `OPENAI_API` key in .env
2. **404 Not Found**: Verify `AZURE_OPENAI_DEPLOYMENT` name
3. **Endpoint Error**: Ensure DALL-E deployment exists (not just GPT-4)

### Logs to Check:
```bash
# Backend logs will show:
Making request to: https://cts-vibeopenai01.openai.azure.com/openai/deployments/dalle-3/images/generations?api-version=2024-02-01
Request body: {...}
```

## 📋 Next Steps

1. **Set up DALL-E deployment** in Azure OpenAI
2. **Update environment variables** with correct deployment name
3. **Test image generation** with a sample post
4. **Implement credit system** for production usage
5. **Add image storage** to cloud service for permanence

## 💡 Frontend Integration

The frontend is already configured to use these endpoints. No frontend changes needed! 