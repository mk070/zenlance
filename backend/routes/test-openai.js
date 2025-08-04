import express from 'express';
import { OpenAI } from 'openai';

const router = express.Router();

// Simple test endpoint for Azure OpenAI
router.get('/test-azure-openai', async (req, res) => {
  try {
    console.log('🧪 Testing Azure OpenAI Connection...');
    console.log('🔑 API Key (first 10 chars):', process.env.GPT_KEY?.substring(0, 10) + '...');
    console.log('🌐 Endpoint:', process.env.GPT_ENDPOINT);
    
    // Extract parts from endpoint
    const urlParts = process.env.GPT_ENDPOINT.split('/');
    const resourceName = urlParts[2].split('.')[0]; // cts-vibeopenai01
    const deploymentName = urlParts[5]; // cts-vibecode-gpt-4.1
    
    // Test different base URL configurations
    const baseURL = `https://${resourceName}.openai.azure.com/openai/deployments/${deploymentName}`;
    
    console.log('🔧 Resource Name:', resourceName);
    console.log('🔧 Deployment Name:', deploymentName);
    console.log('🔧 Base URL:', baseURL);
    
    const openai = new OpenAI({
      apiKey: process.env.GPT_KEY,
      baseURL: baseURL,
      defaultQuery: { 'api-version': '2025-01-01-preview' },
      defaultHeaders: {
        'api-key': process.env.GPT_KEY
      }
    });
    
    console.log('🤖 Making test API call...');
    
    const completion = await openai.chat.completions.create({
      model: deploymentName,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Respond with just 'Hello from Azure OpenAI!' and nothing else."
        },
        {
          role: "user",
          content: "Say hello"
        }
      ],
      temperature: 0.1,
      max_tokens: 20
    });
    
    console.log('✅ Success! Response:', completion.choices[0].message.content);
    
    res.json({
      success: true,
      message: 'Azure OpenAI connection successful!',
      response: completion.choices[0].message.content,
      config: {
        resourceName,
        deploymentName,
        baseURL,
        apiVersion: '2025-01-01-preview'
      }
    });
    
  } catch (error) {
    console.error('❌ Azure OpenAI Test Failed:', error);
    console.error('❌ Error details:', {
      name: error.name,
      message: error.message,
      status: error.status,
      code: error.code
    });
    
    res.status(500).json({
      success: false,
      error: error.message,
      details: {
        name: error.name,
        status: error.status,
        code: error.code
      }
    });
  }
});

// Test with different API versions
router.get('/test-azure-api-versions', async (req, res) => {
  const apiVersions = [
    '2023-05-15',
    '2023-06-01-preview', 
    '2023-07-01-preview',
    '2023-08-01-preview',
    '2023-09-01-preview',
    '2023-10-01-preview',
    '2023-12-01-preview',
    '2024-02-15-preview',
    '2024-06-01'
  ];
  
  const results = [];
  
  const urlParts = process.env.GPT_ENDPOINT.split('/');
  const resourceName = urlParts[2].split('.')[0];
  const deploymentName = urlParts[5];
  const baseURL = `https://${resourceName}.openai.azure.com/openai/deployments/${deploymentName}`;
  
  for (const version of apiVersions) {
    try {
      console.log(`🧪 Testing API version: ${version}`);
      
      const openai = new OpenAI({
        apiKey: process.env.GPT_KEY,
        baseURL: baseURL,
        defaultQuery: { 'api-version': version },
        defaultHeaders: {
          'api-key': process.env.GPT_KEY
        }
      });
      
      const completion = await openai.chat.completions.create({
        model: deploymentName,
        messages: [{ role: "user", content: "Hi" }],
        max_tokens: 10
      });
      
      results.push({
        version,
        success: true,
        response: completion.choices[0].message.content
      });
      
    } catch (error) {
      results.push({
        version,
        success: false,
        error: error.message,
        status: error.status
      });
    }
  }
  
  res.json({
    success: true,
    message: 'API version testing completed',
    results
  });
});

export default router; 