import logger from '../utils/logger.js';
import { generateSampleProposal } from '../utils/sampleProposalTemplate.js';

class AIProposalService {
  constructor() {
    console.log('⚡ Initializing AI Proposal Service (Sample Data Mode)');
    console.log('🔧 Using sample proposal generation - no OpenAI API required');
  }

  async generateProposal(leadData, userProfile, generationParams) {
    try {
      console.log('🔧 AI Service: Starting sample proposal generation');
      console.log('⚡ Using sample data generation (no OpenAI API calls)');
      
      // Use sample proposal template instead of OpenAI
      const sampleResult = generateSampleProposal(leadData, userProfile, generationParams);

      console.log('✅ Sample proposal generated successfully');
      console.log('📊 Generated content keys:', Object.keys(sampleResult.content));
      
      return sampleResult;
      
    } catch (error) {
      logger.error('Sample Proposal Generation Error:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate sample proposal'
      };
    }
  }

  async generateProposalSummary(proposalContent) {
    try {
      // Generate a simple summary from the proposal content
      const title = proposalContent.title || 'Custom Proposal';
      const summary = `Professional proposal for ${proposalContent.clientInfo?.name || 'client'} featuring comprehensive project planning, detailed technical approach, and competitive pricing. Generated using our proven proposal template system.`;
      
      return summary;
    } catch (error) {
      logger.error('Error generating proposal summary:', error);
      return 'Custom proposal generated for your project requirements.';
    }
  }
}

export default new AIProposalService(); 