import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  FileText, 
  Sparkles, 
  Copy, 
  Download,
  Send,
  Edit3,
  Eye
} from 'lucide-react';
import AIButton from './AIButton';
import aiService from '../../services/aiService';
import toast from 'react-hot-toast';

const AIProposalGenerator = ({ 
  isOpen, 
  onClose, 
  leadId, 
  leadData = {}, 
  onProposalGenerated 
}) => {
  const [step, setStep] = useState(1); // 1: Configure, 2: Preview, 3: Complete
  const [projectRequirements, setProjectRequirements] = useState({
    scope: '',
    deliverables: '',
    timeline: '',
    budget: '',
    specialRequirements: ''
  });
  const [customInstructions, setCustomInstructions] = useState('');
  const [generatedProposal, setGeneratedProposal] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    if (!leadId) {
      toast.error('Lead ID is required');
      return;
    }

    setLoading(true);
    try {
      const result = await aiService.generateProposal(
        leadId, 
        projectRequirements, 
        customInstructions
      );
      
      if (result.success) {
        setGeneratedProposal(result.data.proposal);
        setStep(2);
        toast.success('AI proposal generated successfully!');
      }
    } catch (error) {
      console.error('Error generating proposal:', error);
      toast.error('Failed to generate proposal');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyProposal = () => {
    navigator.clipboard.writeText(generatedProposal);
    toast.success('Proposal copied to clipboard!');
  };

  const handleUseProposal = () => {
    if (onProposalGenerated) {
      onProposalGenerated(generatedProposal);
    }
    onClose();
    toast.success('Proposal added to quote form!');
  };

  const handleClose = () => {
    setStep(1);
    setProjectRequirements({
      scope: '',
      deliverables: '',
      timeline: '',
      budget: '',
      specialRequirements: ''
    });
    setCustomInstructions('');
    setGeneratedProposal('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          onClick={handleClose}
        />
        
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">AI Proposal Generator</h2>
                <p className="text-sm text-slate-400">
                  {step === 1 && 'Configure your proposal requirements'}
                  {step === 2 && 'Review and edit your AI-generated proposal'}
                  {step === 3 && 'Proposal ready to use'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleClose}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <X className="w-6 h-6 text-slate-400" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
            {/* Step 1: Configuration */}
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6 space-y-6"
              >
                {/* Lead Summary */}
                <div className="bg-white/5 rounded-xl p-4">
                  <h3 className="text-lg font-medium text-white mb-3">Lead Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Name:</span>
                      <span className="text-white ml-2">
                        {leadData.firstName} {leadData.lastName}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400">Company:</span>
                      <span className="text-white ml-2">{leadData.company || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Industry:</span>
                      <span className="text-white ml-2">{leadData.industry || 'Not specified'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Budget:</span>
                      <span className="text-white ml-2">
                        {leadData.budget ? `$${leadData.budget.min} - $${leadData.budget.max}` : 'Open'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Project Requirements */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-white">Project Requirements</h3>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Project Scope
                    </label>
                    <textarea
                      value={projectRequirements.scope}
                      onChange={(e) => setProjectRequirements(prev => ({ ...prev, scope: e.target.value }))}
                      placeholder="Describe the overall project scope and objectives..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all resize-none"
                      rows={3}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Key Deliverables
                    </label>
                    <textarea
                      value={projectRequirements.deliverables}
                      onChange={(e) => setProjectRequirements(prev => ({ ...prev, deliverables: e.target.value }))}
                      placeholder="List the main deliverables and outcomes..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all resize-none"
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Timeline
                      </label>
                      <input
                        type="text"
                        value={projectRequirements.timeline}
                        onChange={(e) => setProjectRequirements(prev => ({ ...prev, timeline: e.target.value }))}
                        placeholder="e.g., 6-8 weeks"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-2">
                        Budget Range
                      </label>
                      <input
                        type="text"
                        value={projectRequirements.budget}
                        onChange={(e) => setProjectRequirements(prev => ({ ...prev, budget: e.target.value }))}
                        placeholder="e.g., $5,000 - $10,000"
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Special Requirements
                    </label>
                    <textarea
                      value={projectRequirements.specialRequirements}
                      onChange={(e) => setProjectRequirements(prev => ({ ...prev, specialRequirements: e.target.value }))}
                      placeholder="Any special requirements, constraints, or preferences..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all resize-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-2">
                      Custom Instructions for AI
                    </label>
                    <textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="Any specific instructions for the AI (tone, focus areas, etc.)..."
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Preview */}
            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-6"
              >
                <div className="bg-white/5 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Generated Proposal</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCopyProposal}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="prose prose-invert max-w-none">
                    <div className="whitespace-pre-wrap text-slate-300 leading-relaxed">
                      {generatedProposal}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <div className="flex items-center space-x-2">
              {step === 2 && (
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
                >
                  ← Back to Configure
                </button>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              
              {step === 1 && (
                <AIButton
                  onClick={handleGenerate}
                  loading={loading}
                  disabled={!leadId}
                >
                  Generate AI Proposal
                </AIButton>
              )}
              
              {step === 2 && (
                <AIButton
                  onClick={handleUseProposal}
                  icon={FileText}
                  variant="primary"
                >
                  Use This Proposal
                </AIButton>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AIProposalGenerator; 