import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lightbulb, 
  ChevronRight, 
  Clock,
  AlertTriangle,
  Target,
  X,
  RefreshCw
} from 'lucide-react';
import AIButton from './AIButton';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';

const AISuggestionsPanel = ({ 
  entityType, 
  entityId, 
  onActionClick,
  className = '',
  autoLoad = true 
}) => {
  const { user } = useAuth();
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isExpanded, setIsExpanded] = useState(true);
  const [personalized, setPersonalized] = useState(false);

  const generateMockSuggestions = (entityType, entityId) => {
    const suggestionsByType = {
      lead: [
        {
          title: "Send follow-up email",
          description: "Quick follow-up to check their interest",
          type: "email",
          priority: "medium",
          timeframe: "this_week"
        },
        {
          title: "Schedule call",
          description: "Discuss project details and requirements",
          type: "call",
          priority: "high",
          timeframe: "this_week"
        },
        {
          title: "Send portfolio examples",
          description: "Share relevant work samples",
          type: "email",
          priority: "medium",
          timeframe: "this_week"
        }
      ],
      client: [
        {
          title: "Send project update",
          description: "Quick status update on current work",
          type: "email",
          priority: "medium",
          timeframe: "this_week"
        },
        {
          title: "Ask for feedback",
          description: "Check if they're happy with progress",
          type: "email",
          priority: "medium",
          timeframe: "this_week"
        }
      ],
      project: [
        {
          title: "Check timeline",
          description: "Review if project is on track",
          type: "planning",
          priority: "high",
          timeframe: "this_week"
        },
        {
          title: "Test your work",
          description: "Quick quality check before delivery",
          type: "planning",
          priority: "high",
          timeframe: "this_week"
        }
      ],
      invoice: [
        {
          title: "Send payment reminder",
          description: "Invoice is overdue. Send a polite reminder about payment terms and due date.",
          type: "payment",
          priority: "high",
          timeframe: "immediate"
        },
        {
          title: "Follow up on pending payment",
          description: "Consider calling the client to discuss payment status and resolve any issues.",
          type: "call",
          priority: "medium",
          timeframe: "this_week"
        },
        {
          title: "Review payment terms",
          description: "For future projects, consider adjusting payment terms to improve cash flow.",
          type: "planning",
          priority: "low",
          timeframe: "this_month"
        }
      ],
      quote: [
        {
          title: "Follow up on quote status",
          description: "Quote was sent 5 days ago. Check if client needs clarification or has questions.",
          type: "follow-up",
          priority: "medium",
          timeframe: "this_week"
        },
        {
          title: "Offer consultation call",
          description: "Provide value by offering a free consultation to discuss the quoted services in detail.",
          type: "call",
          priority: "high",
          timeframe: "immediate"
        },
        {
          title: "Send portfolio examples",
          description: "Share relevant work samples that demonstrate your capability for the quoted project.",
          type: "portfolio",
          priority: "medium",
          timeframe: "this_week"
        }
      ]
    };

    // Get suggestions for the entity type, fallback to lead suggestions
    const baseSuggestions = suggestionsByType[entityType] || suggestionsByType.lead;
    
    // Randomly select 2-4 suggestions to simulate dynamic AI behavior
    const numSuggestions = Math.floor(Math.random() * 3) + 2;
    const shuffled = [...baseSuggestions].sort(() => 0.5 - Math.random());
    
    return shuffled.slice(0, numSuggestions);
  };

  const loadSuggestions = async () => {
    if (!entityType || !entityId) return;

    setLoading(true);
    setError(null);

    try {
      // Try to get personalized suggestions from API
      if (user) {
        try {
          const response = await apiClient.post('/social/generate-suggestions', {
            entityType,
            entityData: {
              entityId,
              entityType,
              // Add any additional entity-specific data here
            }
          });

          if (response.data.success) {
            setSuggestions(response.data.data);
            setPersonalized(response.data.personalized);
            return;
          }
        } catch (apiError) {
          console.warn('Personalized suggestions failed, falling back to mock data:', apiError);
        }
      }

      // Fallback to mock data if API fails or user not available
      await new Promise(resolve => setTimeout(resolve, 1000));
      const mockSuggestions = generateMockSuggestions(entityType, entityId);
      setSuggestions(mockSuggestions);
      setPersonalized(false);
    } catch (err) {
      setError(err.message);
      console.error('Error loading AI suggestions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (autoLoad) {
      loadSuggestions();
    }
  }, [entityType, entityId, autoLoad]);

  const getPriorityIcon = (priority) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      case 'medium':
        return <Target className="w-4 h-4 text-yellow-400" />;
      case 'low':
        return <Clock className="w-4 h-4 text-green-400" />;
      default:
        return <Target className="w-4 h-4 text-blue-400" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-500/5';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-500/5';
      case 'low':
        return 'border-l-green-500 bg-green-500/5';
      default:
        return 'border-l-blue-500 bg-blue-500/5';
    }
  };

  const getTimeframeText = (timeframe) => {
    switch (timeframe) {
      case 'immediate':
        return 'Do now';
      case 'this_week':
        return 'This week';
      case 'this_month':
        return 'This month';
      default:
        return 'When convenient';
    }
  };

  if (!entityType || !entityId) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center space-x-2">
          <Lightbulb className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-medium text-white">AI Suggestions</h3>
          <div className="flex items-center space-x-2">
            {suggestions.length > 0 && (
              <span className="px-2 py-1 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                {suggestions.length}
              </span>
            )}
            {personalized && (
              <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                Personalized
              </span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <AIButton
            onClick={loadSuggestions}
            loading={loading}
            variant="ghost"
            size="sm"
            icon={RefreshCw}
          >
            Refresh
          </AIButton>
          
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4 text-slate-400" />
            </motion.div>
          </button>
        </div>
      </div>

      {/* Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-3">
              {loading && (
                <div className="flex items-center justify-center py-4">
                  <div className="text-center">
                    <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                    <p className="text-xs text-slate-400">AI is analyzing...</p>
                  </div>
                </div>
              )}

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-3 h-3 text-red-400 flex-shrink-0" />
                    <p className="text-xs text-red-400">{error}</p>
                  </div>
                </div>
              )}

              {!loading && !error && suggestions.length === 0 && (
                <div className="text-center py-4">
                  <Lightbulb className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-slate-400 mb-1 text-sm">No suggestions available</p>
                  <p className="text-xs text-slate-500">Try refreshing or check back later</p>
                </div>
              )}

              {!loading && suggestions.length > 0 && (
                <div className="space-y-2">
                  {suggestions.map((suggestion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`border-l-4 p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-white/5 ${getPriorityColor(suggestion.priority)}`}
                      onClick={() => onActionClick && onActionClick(suggestion)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            {getPriorityIcon(suggestion.priority)}
                            <h4 className="font-medium text-white text-xs">
                              {suggestion.title}
                            </h4>
                            <span className="px-1.5 py-0.5 bg-white/10 text-slate-300 text-xs rounded-full">
                              {getTimeframeText(suggestion.timeframe)}
                            </span>
                          </div>
                          
                          <p className="text-xs text-slate-300 mb-1">
                            {suggestion.description}
                          </p>
                          
                          {suggestion.type && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-slate-400 uppercase tracking-wide">
                                {suggestion.type}
                              </span>
                            </div>
                          )}
                        </div>
                        
                        {onActionClick && (
                          <ChevronRight className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default AISuggestionsPanel; 