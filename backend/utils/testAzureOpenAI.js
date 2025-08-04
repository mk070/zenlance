import { OpenAI } from 'openai';

export const testAzureOpenAIConnection = async () => {
  try {
    console.log('\n🧪 =======================================');
    console.log('🧪 TESTING AZURE OPENAI CONNECTION...');
    console.log('🧪 =======================================');
    
    console.log('🔑 API Key exists:', !!process.env.GPT_KEY);
    console.log('🔑 API Key (first 10 chars):', process.env.GPT_KEY?.substring(0, 10) + '...');
    console.log('🌐 Endpoint:', process.env.GPT_ENDPOINT);
    
    if (!process.env.GPT_KEY || !process.env.GPT_ENDPOINT) {
      console.log('❌ Missing GPT_KEY or GPT_ENDPOINT environment variables');
      return { success: false, error: 'Missing environment variables' };
    }
    
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
    console.log('🔗 Full URL:', `${baseURL}/chat/completions?api-version=2025-01-01-preview`);
    
    const completion = await openai.chat.completions.create({
      model: deploymentName,
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant. Respond with just 'Azure OpenAI connected successfully!' and nothing else."
        },
        {
          role: "user",
          content: "Test connection"
        }
      ],
      temperature: 0.1,
      max_tokens: 50
    });
    
    console.log('✅ SUCCESS! Azure OpenAI Response:', completion.choices[0].message.content);
    console.log('✅ Token usage:', completion.usage);
    console.log('🧪 =======================================');
    console.log('🧪 AZURE OPENAI CONNECTION TEST PASSED!');
    console.log('🧪 =======================================\n');
    
    return {
      success: true,
      response: completion.choices[0].message.content,
      config: {
        resourceName,
        deploymentName,
        baseURL,
        apiVersion: '2025-01-01-preview'
      }
    };
    
  } catch (error) {
    console.log('❌ AZURE OPENAI CONNECTION FAILED!');
    console.log('❌ Error type:', error.constructor.name);
    console.log('❌ Error message:', error.message);
    console.log('❌ Error status:', error.status);
    console.log('❌ Error code:', error.code);
    
    if (error.response) {
      console.log('❌ Response status:', error.response.status);
      console.log('❌ Response data:', error.response.data);
    }
    
    console.log('🧪 =======================================');
    console.log('🧪 AZURE OPENAI CONNECTION TEST FAILED!');
    console.log('🧪 =======================================\n');
    
    return {
      success: false,
      error: error.message,
      details: {
        name: error.constructor.name,
        status: error.status,
        code: error.code
      }
    };
  }
}; 