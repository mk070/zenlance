#!/usr/bin/env node

/**
 * Azure OpenAI Configuration Test Script
 * Run this to test your Azure OpenAI setup before starting the main application
 */

import dotenv from 'dotenv';
import OpenAI from 'openai';

// Load environment variables
dotenv.config();

console.log('🔍 Testing Azure OpenAI Configuration...\n');

// Check environment variables
console.log('📋 Environment Variables:');
console.log('✓ AZURE_OPENAI_ENDPOINT:', process.env.AZURE_OPENAI_ENDPOINT || '❌ Missing');
console.log('✓ AZURE_OPENAI_API_KEY:', process.env.AZURE_OPENAI_API_KEY ? '✓ Set' : '❌ Missing');
console.log('✓ AZURE_OPENAI_DEPLOYMENT_NAME:', process.env.AZURE_OPENAI_DEPLOYMENT_NAME || '❌ Missing');
console.log('✓ AZURE_OPENAI_API_VERSION:', process.env.AZURE_OPENAI_API_VERSION || '❌ Missing (will use default)');

const hasRequiredVars = process.env.AZURE_OPENAI_ENDPOINT && 
                       process.env.AZURE_OPENAI_API_KEY && 
                       process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

if (!hasRequiredVars) {
  console.log('\n❌ Missing required environment variables!');
  console.log('\n📝 Add these to your .env file:');
  console.log('AZURE_OPENAI_API_KEY=your-api-key-here');
  console.log('AZURE_OPENAI_DEPLOYMENT_NAME=gpt-4');
  console.log('AZURE_OPENAI_API_VERSION=2024-02-01');
  process.exit(1);
}

console.log('\n🚀 Testing Azure OpenAI Connection...');

try {
  // Create OpenAI client with Azure configuration
  const openai = new OpenAI({
    apiKey: process.env.AZURE_OPENAI_API_KEY,
    baseURL: `${process.env.AZURE_OPENAI_ENDPOINT}/openai/deployments/${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`,
    defaultQuery: { 'api-version': process.env.AZURE_OPENAI_API_VERSION || '2024-02-01' },
    defaultHeaders: {
      'api-key': process.env.AZURE_OPENAI_API_KEY,
    },
  });

  console.log('📡 Making test request to Azure OpenAI...');

  const response = await openai.chat.completions.create({
    model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
    messages: [
      {
        role: 'user',
        content: 'Say "Azure OpenAI is working correctly" if you can respond.'
      }
    ],
    max_tokens: 20,
    temperature: 0.1
  });

  console.log('\n✅ SUCCESS! Azure OpenAI is working correctly!');
  console.log('📝 Response:', response.choices[0]?.message?.content || 'No response content');
  console.log('🏷️  Model:', response.model);
  console.log('📊 Usage:', response.usage);
  
  console.log('\n🎉 Your FreelanceHub AI features are ready to use!');
  console.log('🚀 Start your application with: npm run dev');

} catch (error) {
  console.log('\n❌ FAILED! Error testing Azure OpenAI:');
  
  if (error.status === 401) {
    console.log('🔑 Authentication Error: Invalid API key');
    console.log('💡 Solution: Check your AZURE_OPENAI_API_KEY in .env file');
  } else if (error.status === 404) {
    console.log('🎯 Deployment Error: Model deployment not found');
    console.log('💡 Solution: Check your AZURE_OPENAI_DEPLOYMENT_NAME in .env file');
    console.log('💡 Common names: gpt-4, gpt-35-turbo, gpt-4-turbo');
  } else if (error.status === 429) {
    console.log('⏳ Rate Limit: Too many requests');
    console.log('💡 Solution: Wait a moment and try again');
  } else if (error.code === 'ENOTFOUND' || error.code === 'ETIMEDOUT') {
    console.log('🌐 Network Error: Cannot connect to Azure OpenAI');
    console.log('💡 Solution: Check your internet connection and firewall settings');
  } else {
    console.log('❓ Unknown Error:', error.message);
    console.log('📋 Full Error:', error);
  }
  
  console.log('\n🔧 Troubleshooting Steps:');
  console.log('1. Verify your Azure OpenAI resource is active');
  console.log('2. Check API key in Azure Portal → Keys and Endpoint');
  console.log('3. Verify deployment name in Azure Portal → Model deployments');
  console.log('4. Ensure your IP is not blocked by Azure firewall');
  
  process.exit(1);
} 