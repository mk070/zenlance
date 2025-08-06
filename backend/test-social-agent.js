import SocialContentAgent from './agents/socialContentAgent.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testSocialContentAgent() {
  console.log('🧪 Testing Social Content Agent...\n');
  
  const agent = new SocialContentAgent();
  
  try {
    // Test 1: Generate Content
    console.log('1️⃣ Testing Content Generation...');
    const generateResult = await agent.generateContent(
      'Our new product launch is revolutionizing the industry',
      'professional',
      ['twitter', 'linkedin'],
      2
    );
    
    if (generateResult.success) {
      console.log('✅ Content Generation: SUCCESS');
      console.log('Generated variations:');
      generateResult.data.forEach((variation, index) => {
        console.log(`   ${index + 1}. ${variation.content}`);
        console.log(`      Hashtags: ${variation.hashtags}`);
        console.log(`      Characters: ${variation.characterCount}\n`);
      });
    } else {
      console.log('❌ Content Generation: FAILED');
      console.log('Error:', generateResult.error);
    }

    // Test 2: Rephrase Content
    console.log('\n2️⃣ Testing Content Rephrasing...');
    const rephraseResult = await agent.rephraseContent(
      'We are excited to announce our new partnership with leading tech companies',
      'engaging',
      ['facebook', 'instagram'],
      2
    );
    
    if (rephraseResult.success) {
      console.log('✅ Content Rephrasing: SUCCESS');
      console.log('Rephrased variations:');
      rephraseResult.data.forEach((variation, index) => {
        console.log(`   ${index + 1}. ${variation.content}`);
        console.log(`      Hashtags: ${variation.hashtags}`);
        console.log(`      Characters: ${variation.characterCount}\n`);
      });
    } else {
      console.log('❌ Content Rephrasing: FAILED');
      console.log('Error:', rephraseResult.error);
    }

    // Test 3: Platform-specific Generation
    console.log('\n3️⃣ Testing Platform-specific Generation...');
    const platformResult = await agent.generateForPlatform(
      'Share tips for remote work productivity',
      'linkedin',
      'professional'
    );
    
    if (platformResult.success) {
      console.log('✅ Platform-specific Generation: SUCCESS');
      console.log('LinkedIn-optimized content:');
      platformResult.data.forEach((variation, index) => {
        console.log(`   ${index + 1}. ${variation.content}`);
        console.log(`      Hashtags: ${variation.hashtags}`);
        console.log(`      Characters: ${variation.characterCount}\n`);
      });
    } else {
      console.log('❌ Platform-specific Generation: FAILED');
      console.log('Error:', platformResult.error);
    }

    // Test 4: Content Analysis
    console.log('\n4️⃣ Testing Content Analysis...');
    const testContent = 'Check out our amazing new product! 🚀 It will revolutionize how you work. Learn more at our website. #innovation #productivity #tech';
    const analysisResult = agent.analyzeContent(testContent);
    
    console.log('✅ Content Analysis: SUCCESS');
    console.log('Analysis results:');
    console.log(`   Word count: ${analysisResult.wordCount}`);
    console.log(`   Character count: ${analysisResult.characterCount}`);
    console.log(`   Hashtag count: ${analysisResult.hashtagCount}`);
    console.log(`   URL count: ${analysisResult.urlCount}`);
    console.log(`   Twitter compliant: ${analysisResult.twitterCompliant}`);
    console.log(`   LinkedIn compliant: ${analysisResult.linkedinCompliant}`);
    console.log(`   Readability: ${analysisResult.readabilityScore}`);

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
testSocialContentAgent()
  .then(() => {
    console.log('\n🎉 Testing completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Testing failed:', error);
    process.exit(1);
  }); 