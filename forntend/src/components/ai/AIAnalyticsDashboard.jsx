import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Target,
  DollarSign,
  Users,
  Calendar,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import AIButton from './AIButton';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../lib/api-client';

const AIAnalyticsDashboard = ({ className = '' }) => {
  const { user, userProfile } = useAuth();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('month');
  const [error, setError] = useState(null);
  const [personalized, setPersonalized] = useState(false);

  const timeRangeOptions = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' }
  ];

  const generateMockAnalytics = (timeRange) => {
    // Simple analytics for individual freelancers
    const baseRevenue = 8000;
    const timeMultiplier = {
      'week': 0.25,
      'month': 1,
      'quarter': 3,
      'year': 12
    };
    
    const multiplier = timeMultiplier[timeRange] || 1;
    const currentRevenue = Math.round(baseRevenue * multiplier * (0.8 + Math.random() * 0.4));
    const nextMonthRevenue = Math.round(currentRevenue * (1.05 + Math.random() * 0.1));

    return {
      predictions: {
        nextMonth: {
          revenue: nextMonthRevenue,
          confidence: 'medium'
        }
      },
      insights: [
        "Focus on completing current projects on time.",
        "Consider following up with past clients for repeat work."
      ],
      recommendations: [
        {
          category: "This Week",
          action: "Send follow-up emails to 2-3 recent leads",
          timeframe: "This week",
          impact: "Potential new projects"
        },
        {
          category: "Simple Tasks",
          action: "Update your portfolio with recent work",
          timeframe: "Next week",
          impact: "Better client impression"
        }
      ]
    };
  };

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Try to get personalized analytics from API
      if (user) {
        try {
          const response = await apiClient.post('/social/generate-analytics', {
            timeRange,
            businessData: {
              // Add any available business metrics here
              timeRange,
              userProfile: userProfile ? {
                businessName: userProfile.businessName,
                industry: userProfile.industry,
                businessType: userProfile.businessType
              } : null
            }
          });

          if (response.data.success) {
            setAnalytics(response.data.data);
            setPersonalized(response.data.personalized);
            return;
          }
        } catch (apiError) {
          console.warn('Personalized analytics failed, falling back to mock data:', apiError);
        }
      }

      // Fallback to mock data if API fails or user not available
      await new Promise(resolve => setTimeout(resolve, 1500));
      const mockData = generateMockAnalytics(timeRange);
      setAnalytics(mockData);
      setPersonalized(false);
    } catch (err) {
      setError(err.message);
      console.error('Error loading AI analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const MetricCard = ({ title, value, change, trend, icon: Icon, color = 'blue', prediction }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl bg-${color}-500/20`}>
          <Icon className={`w-6 h-6 text-${color}-400`} />
        </div>
        {trend && (
          <div className={`flex items-center space-x-1 text-sm ${
            trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-slate-400'
          }`}>
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-4 h-4" />
            ) : null}
            <span>{change}</span>
          </div>
        )}
      </div>
      
      <div>
        <h3 className="text-2xl font-semibold text-white mb-1">{value}</h3>
        <p className="text-sm text-slate-400">{title}</p>
        
        {prediction && (
          <div className="mt-3 p-2 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <p className="text-xs text-purple-400">
              <Sparkles className="w-3 h-3 inline mr-1" />
              AI Prediction: {prediction}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );

  const InsightCard = ({ insight, type = 'info' }) => {
    const getIcon = () => {
      switch (type) {
        case 'warning':
          return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
        case 'success':
          return <CheckCircle className="w-5 h-5 text-green-400" />;
        case 'trend':
          return <TrendingUp className="w-5 h-5 text-blue-400" />;
        default:
          return <Target className="w-5 h-5 text-purple-400" />;
      }
    };

    const getBgColor = () => {
      switch (type) {
        case 'warning':
          return 'bg-yellow-500/5 border-yellow-500/20';
        case 'success':
          return 'bg-green-500/5 border-green-500/20';
        case 'trend':
          return 'bg-blue-500/5 border-blue-500/20';
        default:
          return 'bg-purple-500/5 border-purple-500/20';
      }
    };

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`p-4 rounded-xl border ${getBgColor()}`}
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getIcon()}
          </div>
          <p className="text-sm text-slate-300 leading-relaxed">{insight}</p>
        </div>
      </motion.div>
    );
  };

  const RecommendationCard = ({ recommendation }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20 rounded-xl p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h4 className="font-medium text-white mb-2">{recommendation.category}</h4>
          <p className="text-sm text-slate-300 mb-3">{recommendation.action}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 uppercase tracking-wide">
              {recommendation.timeframe}
            </span>
            <span className="text-xs text-purple-400">
              Expected: {recommendation.impact}
            </span>
          </div>
        </div>
        <ArrowRight className="w-5 h-5 text-slate-400 flex-shrink-0 mt-2" />
      </div>
    </motion.div>
  );

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-purple-500/20 rounded-xl">
            <BarChart3 className="w-6 h-6 text-purple-400" />
          </div>
                  <div>
          <h2 className="text-xl font-semibold text-white">Simple Analytics</h2>
          <div className="flex items-center space-x-2">
            <p className="text-sm text-slate-400">Essential insights for freelancers</p>
            {personalized && (
              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs rounded-full">
                Personal
              </span>
            )}
          </div>
        </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-400/50"
          >
            {timeRangeOptions.map(option => (
              <option key={option.value} value={option.value} className="bg-gray-800">
                {option.label}
              </option>
            ))}
          </select>
          
          <AIButton
            onClick={loadAnalytics}
            loading={loading}
            variant="ghost"
            size="sm"
            icon={RefreshCw}
          >
            Refresh
          </AIButton>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="w-12 h-12 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-slate-400">AI is analyzing your business data...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-red-400 mb-1">Analysis Failed</h3>
              <p className="text-sm text-red-300">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Content */}
      {!loading && !error && analytics && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6"
        >
          {/* Simple Metrics */}
          {analytics.predictions && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <MetricCard
                title="Next Month Estimate"
                value={`$${analytics.predictions.nextMonth?.revenue?.toLocaleString() || '0'}`}
                change={`${analytics.predictions.nextMonth?.confidence || 'medium'} confidence`}
                trend="up"
                icon={DollarSign}
                color="green"
              />
              
              <MetricCard
                title="Quick Actions"
                value={analytics.recommendations?.length || 0}
                change="Simple tasks"
                icon={CheckCircle}
                color="cyan"
              />
            </div>
          )}

          {/* Simple Insights */}
          {analytics.insights && analytics.insights.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">Current Focus</h3>
              <div className="space-y-3">
                {analytics.insights.map((insight, index) => (
                  <InsightCard
                    key={index}
                    insight={insight}
                    type="info"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Simple Actions */}
          {analytics.recommendations && analytics.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">This Week's Tasks</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.recommendations.map((recommendation, index) => (
                  <div key={index} className="bg-white/5 border border-white/10 rounded-xl p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-white">{recommendation.category}</h4>
                      <span className="text-xs text-cyan-400">{recommendation.timeframe}</span>
                    </div>
                    <p className="text-sm text-slate-300 mb-2">{recommendation.action}</p>
                    <p className="text-xs text-green-400">{recommendation.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Empty State */}
      {!loading && !error && !analytics && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No Analytics Data</h3>
          <p className="text-slate-400 mb-4">Generate business insights with AI analytics</p>
          <AIButton onClick={loadAnalytics}>
            Generate AI Insights
          </AIButton>
        </div>
      )}
    </div>
  );
};

export default AIAnalyticsDashboard; 