import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Sparkles, 
  Copy, 
  Send,
  Hash,
  MessageCircle,
  Share,
  Calendar
} from 'lucide-react';
import AIButton from './AIButton';
import aiService from '../../services/aiService';
import toast from 'react-hot-toast';

const AISocialContentGenerator = ({ 
  isOpen, 
  onClose, 
  onContentGenerated,
  prefilledContext = {} 
}) => {
  const [context, setContext] = useState({
    platform: 'linkedin',
    contentType: 'general',
    businessType: 'Freelance/Agency',
    industry: 'General',
    recentProject: '',
    tone: 'Professional',
    ...prefilledContext
  });
  
  const [generatedContent, setGeneratedContent] = useState(null);
  const [loading, setLoading] = useState(false);

  const platformOptions = [
    { value: 'linkedin', label: 'LinkedIn', color: 'bg-blue-600' },
    { value: 'twitter', label: 'Twitter', color: 'bg-sky-500' },
    { value: 'facebook', label: 'Facebook', color: 'bg-blue-700' },
    { value: 'instagram', label: 'Instagram', color: 'bg-pink-600' }
  ];

  const contentTypeOptions = [
    { value: 'general', label: 'General Update' },
    { value: 'achievement', label: 'Achievement/Success' },
    { value: 'tip', label: 'Industry Tip' },
    { value: 'case_study', label: 'Case Study' },
    { value: 'thought_leadership', label: 'Thought Leadership' },
    { value: 'promotion', label: 'Service Promotion' }
  ];

  const toneOptions = [
    { value: 'Professional', label: 'Professional' },
    { value: 'Casual', label: 'Casual' },
    { value: 'Enthusiastic', label: 'Enthusiastic' },
    { value: 'Informative', label: 'Informative' },
    { value: 'Inspiring', label: 'Inspiring' }
  ];

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const result = await aiService.generateSocialContent(context);
      
      if (result.success) {
        setGeneratedContent(result.data.content);
        toast.success('AI social content generated!');
      }
    } catch (error) {
      console.error('Error generating social content:', error);
      toast.error('Failed to generate social content');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyContent = () => {
    if (generatedContent?.content) {
      const fullText = `${generatedContent.content}\n\n${generatedContent.hashtags?.map(tag => `#${tag}`).join(' ') || ''}`;
      navigator.clipboard.writeText(fullText);
      toast.success('Content copied to clipboard!');
    }
  };

  const handleUseContent = () => {
    if (onContentGenerated && generatedContent) {
      onContentGenerated({
        content: generatedContent.content,
        hashtags: generatedContent.hashtags,
        platform: context.platform
      });
    }
    onClose();
    toast.success('Content added to social post!');
  };

  const handleClose = () => {
    setGeneratedContent(null);
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
          className="relative bg-slate-900 border border-white/10 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-xl">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <h2 className="text-xl font-semibold text-white">AI Social Content Generator</h2>
                <p className="text-sm text-slate-400">Generate engaging social media posts with AI</p>
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
            <div className="p-6 space-y-6">
              {/* Configuration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">Platform</label>
                  <div className="grid grid-cols-2 gap-2">
                    {platformOptions.map(platform => (
                      <button
                        key={platform.value}
                        onClick={() => setContext(prev => ({ ...prev, platform: platform.value }))}
                        className={`flex items-center space-x-2 p-3 rounded-xl border transition-all ${
                          context.platform === platform.value
                            ? 'border-purple-400 bg-purple-500/10 text-white'
                            : 'border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'
                        }`}
                      >
                        <div className={`w-3 h-3 rounded-full ${platform.color}`}></div>
                        <span className="text-sm">{platform.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Content Type</label>
                  <select
                    value={context.contentType}
                    onChange={(e) => setContext(prev => ({ ...prev, contentType: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all"
                  >
                    {contentTypeOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-gray-800">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Industry</label>
                  <input
                    type="text"
                    value={context.industry}
                    onChange={(e) => setContext(prev => ({ ...prev, industry: e.target.value }))}
                    placeholder="e.g., Web Development, Marketing"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">Tone</label>
                  <select
                    value={context.tone}
                    onChange={(e) => setContext(prev => ({ ...prev, tone: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all"
                  >
                    {toneOptions.map(option => (
                      <option key={option.value} value={option.value} className="bg-gray-800">
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Recent Project or Achievement (Optional)</label>
                <textarea
                  value={context.recentProject}
                  onChange={(e) => setContext(prev => ({ ...prev, recentProject: e.target.value }))}
                  placeholder="Describe a recent project, client success, or achievement to highlight..."
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-400/50 focus:border-purple-400/50 transition-all resize-none"
                  rows={3}
                />
              </div>

              {/* Generated Content */}
              {generatedContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/5 rounded-xl p-6 border border-white/10"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-white">Generated Content</h3>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleCopyContent}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4 text-slate-400" />
                      </button>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-slate-300 mb-2">Post Content</h4>
                      <div className="p-4 bg-black/20 rounded-lg">
                        <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                          {generatedContent.content}
                        </p>
                      </div>
                    </div>
                    
                    {generatedContent.hashtags && generatedContent.hashtags.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Hashtags</h4>
                        <div className="flex flex-wrap gap-2">
                          {generatedContent.hashtags.map((hashtag, index) => (
                            <span
                              key={index}
                              className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-sm"
                            >
                              #{hashtag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {generatedContent.callToAction && (
                      <div>
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Call to Action</h4>
                        <p className="text-slate-400 text-sm">{generatedContent.callToAction}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10">
            <div className="text-sm text-slate-400">
              {generatedContent ? 'Ready to use this content?' : 'Configure your preferences and generate content'}
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              
              {!generatedContent ? (
                <AIButton
                  onClick={handleGenerate}
                  loading={loading}
                >
                  Generate Content
                </AIButton>
              ) : (
                <div className="flex items-center space-x-2">
                  <AIButton
                    onClick={handleGenerate}
                    loading={loading}
                    variant="secondary"
                    size="sm"
                  >
                    Regenerate
                  </AIButton>
                  <AIButton
                    onClick={handleUseContent}
                    icon={Send}
                    variant="primary"
                  >
                    Use This Content
                  </AIButton>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default AISocialContentGenerator; 