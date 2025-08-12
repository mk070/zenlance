import aiService from './services/aiService.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testAzureOpenAIFix() {
  console.log('🧪 Testing Azure OpenAI Parameter Fix...\n');
  
  try {
    console.log('Testing AI Service with camelCase parameters...');
    const response = await aiService.makeRequest([
      {
        role: 'system',
        content: 'You are a helpful assistant. Respond briefly.'
      },
      {
        role: 'user',
        content: 'Say hello and confirm you are working!'
      }
    ], {
      maxTokens: 100,
      temperature: 0.7
    });

    if (response.success) {
      console.log('✅ Azure OpenAI Fix: SUCCESS');
      console.log('Response:', response.content);
      console.log('Model:', response.model);
      console.log('Usage:', response.usage);
    } else {
      console.log('❌ Azure OpenAI Fix: FAILED');
      console.log('Error:', response.error);
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    
    if (error.message.includes('not configured')) {
      console.log('\n📝 Setup Instructions:');
      console.log('Make sure your .env file contains:');
      console.log('AZURE_OPENAI_ENDPOINT=your-endpoint');
      console.log('AZURE_OPENAI_API_KEY=your-api-key');
      console.log('AZURE_OPENAI_DEPLOYMENT_NAME=your-deployment-name');
      console.log('AZURE_OPENAI_API_VERSION=2024-02-01');
    }
  }
}

// Run the test
testAzureOpenAIFix()
  .then(() => {
    console.log('\n🎉 Testing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Testing failed:', error);
    process.exit(1);
  }); 