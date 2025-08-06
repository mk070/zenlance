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

const AIAnalyticsDashboard = ({ className = '' }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState('month');
  const [error, setError] = useState(null);

  const timeRangeOptions = [
    { value: 'week', label: 'Last Week' },
    { value: 'month', label: 'Last Month' },
    { value: 'quarter', label: 'Last Quarter' },
    { value: 'year', label: 'Last Year' }
  ];

  const generateMockAnalytics = (timeRange) => {
    // Generate realistic mock data based on time range
    const baseRevenue = 50000;
    const timeMultiplier = {
      'week': 0.25,
      'month': 1,
      'quarter': 3,
      'year': 12
    };
    
    const multiplier = timeMultiplier[timeRange] || 1;
    const currentRevenue = Math.round(baseRevenue * multiplier * (0.8 + Math.random() * 0.4));
    const nextMonthRevenue = Math.round(currentRevenue * (1.05 + Math.random() * 0.1));
    const quarterRevenue = Math.round(currentRevenue * 3.2);

    return {
      predictions: {
        nextMonth: {
          revenue: nextMonthRevenue,
          confidence: 'high'
        },
        quarterForecast: {
          revenue: quarterRevenue,
          confidence: 'medium'
        }
      },
      insights: [
        "Your lead conversion rate has improved by 23% compared to last month, indicating stronger qualification processes.",
        "Client retention is at 94%, which is 12% above industry average for freelance services.",
        "Peak activity occurs between 10 AM - 2 PM, suggesting optimal times for client outreach.",
        "Project completion rate is 98%, demonstrating excellent delivery reliability.",
        "Average project value has increased by 18% over the selected period."
      ],
      trends: {
        positive: [
          "Consistent growth in high-value projects (+$15K average)",
          "Strong client satisfaction scores (4.8/5 average)",
          "Increasing referral rate (35% of new leads)",
          "Improved time-to-delivery metrics (-15% faster completion)"
        ],
        concerning: [
          "Slight increase in proposal rejection rate (8% vs 5% last period)",
          "Longer response times to initial inquiries (+2 hours average)",
          "Seasonal dip expected in the next 2 weeks based on historical data"
        ]
      },
      recommendations: [
        {
          category: "Revenue Optimization",
          action: "Consider raising rates by 10-15% for new projects based on improved delivery metrics and client satisfaction",
          timeframe: "Next 30 days",
          impact: "+$8,000 monthly revenue"
        },
        {
          category: "Lead Generation",
          action: "Focus marketing efforts during 10 AM - 2 PM window when engagement is highest",
          timeframe: "Immediate",
          impact: "+25% lead quality"
        },
        {
          category: "Client Retention",
          action: "Implement quarterly check-ins with top 20% of clients to strengthen relationships",
          timeframe: "Next quarter",
          impact: "+15% retention rate"
        },
        {
          category: "Efficiency",
          action: "Automate proposal follow-up emails to reduce response time and improve conversion",
          timeframe: "Next 2 weeks",
          impact: "-50% response time"
        }
      ]
    };
  };

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Simulate API delay for realistic feel
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockData = generateMockAnalytics(timeRange);
      setAnalytics(mockData);
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
            <h2 className="text-xl font-semibold text-white">AI Business Analytics</h2>
            <p className="text-sm text-slate-400">AI-powered insights and forecasting</p>
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
          {/* Key Metrics */}
          {analytics.predictions && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Revenue Forecast"
                value={`$${analytics.predictions.nextMonth?.revenue?.toLocaleString() || '0'}`}
                change={`${analytics.predictions.nextMonth?.confidence || 'medium'} confidence`}
                trend="up"
                icon={DollarSign}
                color="green"
                prediction={`Next month: $${analytics.predictions.nextMonth?.revenue?.toLocaleString() || '0'}`}
              />
              
              <MetricCard
                title="Quarterly Outlook"
                value={`$${analytics.predictions.quarterForecast?.revenue?.toLocaleString() || '0'}`}
                change={`${analytics.predictions.quarterForecast?.confidence || 'medium'} confidence`}
                trend="up"
                icon={TrendingUp}
                color="blue"
                prediction="Based on current trends"
              />
              
              <MetricCard
                title="Key Insights"
                value={analytics.insights?.length || 0}
                change="AI-generated"
                icon={Target}
                color="purple"
              />
              
              <MetricCard
                title="Recommendations"
                value={analytics.recommendations?.length || 0}
                change="Action items"
                icon={CheckCircle}
                color="orange"
              />
            </div>
          )}

          {/* Insights Section */}
          {analytics.insights && analytics.insights.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">AI Insights</h3>
              <div className="space-y-3">
                {analytics.insights.map((insight, index) => (
                  <InsightCard
                    key={index}
                    insight={insight}
                    type={index === 0 ? 'trend' : 'info'}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Trends */}
          {analytics.trends && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {analytics.trends.positive && analytics.trends.positive.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-green-400" />
                    <span>Positive Trends</span>
                  </h3>
                  <div className="space-y-3">
                    {analytics.trends.positive.map((trend, index) => (
                      <InsightCard key={index} insight={trend} type="success" />
                    ))}
                  </div>
                </div>
              )}

              {analytics.trends.concerning && analytics.trends.concerning.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-white mb-4 flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-yellow-400" />
                    <span>Areas of Concern</span>
                  </h3>
                  <div className="space-y-3">
                    {analytics.trends.concerning.map((trend, index) => (
                      <InsightCard key={index} insight={trend} type="warning" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Recommendations */}
          {analytics.recommendations && analytics.recommendations.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-white mb-4">AI Recommendations</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analytics.recommendations.map((recommendation, index) => (
                  <RecommendationCard key={index} recommendation={recommendation} />
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