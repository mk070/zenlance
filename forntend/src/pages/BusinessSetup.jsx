import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Building2, MapPin, Users, Target, TrendingUp, 
  DollarSign, CheckCircle, ArrowRight, Briefcase,
  Globe, Star, Zap
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const BusinessSetup = () => {
  const [formData, setFormData] = useState({
    businessName: '',
    businessType: '',
    industry: '',
    location: '',
    teamSize: '',
    primaryGoal: '',
    experienceLevel: '',
    monthlyRevenue: '',
    currentTools: []
  })
  
  const [loading, setLoading] = useState(false)
  const { user, updateUserProfile } = useAuth()
  const navigate = useNavigate()

  const businessTypes = [
    { value: 'freelancer', label: 'Solo Freelancer', icon: '👤' },
    { value: 'agency', label: 'Agency', icon: '🏢' },
    { value: 'other', label: 'Consultant', icon: '💼' },
    { value: 'startup', label: 'Startup', icon: '🚀' },
    { value: 'enterprise', label: 'Enterprise', icon: '🏗️' }
  ]

  const industries = [
    'Web Development', 'Mobile Development', 'UI/UX Design', 'Graphic Design',
    'Content Writing', 'Digital Marketing', 'SEO/SEM', 'Social Media',
    'Video Production', 'Photography', 'Consulting', 'Business Strategy',
    'Data Analysis', 'Project Management', 'Translation', 'Virtual Assistant',
    'Accounting', 'Legal Services', 'Architecture', 'Engineering', 'Other'
  ]

  const teamSizes = [
    { value: '1', label: 'Just me' },
    { value: '2-5', label: '2-5 people' },
    { value: '6-10', label: '6-10 people' },  
    { value: '11-25', label: '11-25 people' },
    { value: '26-50', label: '26-50 people' },
    { value: '51-100', label: '51-100 people' },
    { value: '101-500', label: '101-500 people' },
    { value: '500+', label: '500+ people' }
  ]

  const goals = [
    { value: 'improve_efficiency', label: 'Organize my projects better', icon: '📋' },
    { value: 'reduce_costs', label: 'Track time more effectively', icon: '⏱️' },
    { value: 'enhance_customer_experience', label: 'Manage client relationships', icon: '🤝' },
    { value: 'increase_sales', label: 'Create professional invoices', icon: '📄' },
    { value: 'expand_market', label: 'Scale and grow my business', icon: '📈' },
    { value: 'digital_transformation', label: 'Get business insights', icon: '📊' },
    { value: 'other', label: 'Other goals', icon: '🎯' }
  ]

  const experienceLevels = [
    { value: 'beginner', label: 'Just starting out (0-1 years)', icon: '🌱' },
    { value: 'intermediate', label: 'Getting established (1-3 years)', icon: '🌿' },
    { value: 'experienced', label: 'Experienced professional (3-7 years)', icon: '🌳' },
    { value: 'expert', label: 'Industry expert (7+ years)', icon: '🏆' }
  ]

  const revenueRanges = [
    { value: 'starting', label: 'Just starting ($0-1K/month)' },
    { value: 'growing', label: 'Growing ($1K-5K/month)' },
    { value: 'established', label: 'Established ($5K-15K/month)' },
    { value: 'scaling', label: 'Scaling ($15K-50K/month)' },
    { value: 'enterprise', label: 'Enterprise ($50K+/month)' }
  ]

  const tools = [
    'Notion', 'Trello', 'Asana', 'Monday.com', 'Slack', 'Discord',
    'Google Workspace', 'Microsoft 365', 'Figma', 'Adobe Creative Suite',
    'QuickBooks', 'FreshBooks', 'Stripe', 'PayPal', 'Zoom', 'Other'
  ]

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleToolToggle = (tool) => {
    setFormData(prev => ({
      ...prev,
      currentTools: prev.currentTools.includes(tool)
        ? prev.currentTools.filter(t => t !== tool)
        : [...prev.currentTools, tool]
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Only business name is required, rest are optional
    if (!formData.businessName.trim()) {
      toast.error('Business name is required')
      return
    }
    
    setLoading(true)
    
    try {
      const profileData = {
        businessName: formData.businessName.trim(),
        onboardingCompleted: true
      }
      
      // Only add fields that have values to avoid validation errors
      if (formData.businessType) profileData.businessType = formData.businessType
      if (formData.industry) profileData.industry = formData.industry
      if (formData.location.trim()) {
        profileData.location = { country: formData.location.trim() }
      }
      if (formData.teamSize) profileData.teamSize = formData.teamSize
      if (formData.primaryGoal) profileData.primaryGoal = formData.primaryGoal
      if (formData.experienceLevel) profileData.experienceLevel = formData.experienceLevel
      if (formData.monthlyRevenue) profileData.monthlyRevenue = formData.monthlyRevenue
      if (formData.currentTools.length > 0) profileData.currentTools = formData.currentTools
      
      console.log('Sending profile data:', profileData)
      const result = await updateUserProfile(profileData)
      
      if (result.success) {
        toast.success('Welcome to FreelanceHub! 🎉')
        navigate('/dashboard')
      } else {
        // Handle specific errors from the API
        if (result.error) {
          toast.error(result.error)
        } else {
          toast.error('Failed to save business details. Please try again.')
        }
      }
    } catch (error) {
      console.error('Business setup error:', error)
      
      // Show specific error message if available
      if (error.message) {
        toast.error(error.message)
      } else {
        toast.error('Failed to save business details. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSkip = async () => {
    try {
      // Mark onboarding as completed and redirect
      await updateUserProfile({ onboardingCompleted: true })
      navigate('/dashboard')
    } catch (error) {
      console.error('Skip onboarding error:', error)
      navigate('/dashboard') // Still redirect even if update fails
    }
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        
        {/* Floating Orbs */}
        <motion.div
          className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.3, 0.6, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/3 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
      </div>

      <div className="relative z-10">
        <div className="max-w-4xl mx-auto px-6 py-12">
          {/* Header */}
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center justify-center mb-6">
              <motion.div
                className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-2xl flex items-center justify-center"
                whileHover={{ scale: 1.05, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <Briefcase className="h-8 w-8 text-white" />
              </motion.div>
            </div>
            <h1 className="text-4xl lg:text-5xl font-light mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Tell us about your business
            </h1>
            <p className="text-xl text-gray-400 font-light max-w-2xl mx-auto">
              Help us personalize your FreelanceHub experience. Most fields are optional - share what you're comfortable with.
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 lg:p-12"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <form onSubmit={handleSubmit} className="space-y-10">
              {/* Business Name - Required */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Building2 className="h-6 w-6 text-emerald-400" />
                  <label className="text-lg font-medium text-white">
                    Business Name <span className="text-red-400">*</span>
                  </label>
                </div>
                <input
                  type="text"
                  name="businessName"
                  value={formData.businessName}
                  onChange={handleInputChange}
                  className="w-full px-6 py-4 bg-black/50 border border-gray-600 text-white placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-transparent transition-all duration-300 text-lg"
                  placeholder="Your business or personal brand name"
                  required
                />
              </div>

              {/* Business Type - Optional */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Briefcase className="h-6 w-6 text-blue-400" />
                  <label className="text-lg font-medium text-white">Business Type</label>
                  <span className="text-sm text-gray-400 font-light">(Optional)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {businessTypes.map((type) => (
                    <motion.button
                      key={type.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, businessType: type.value }))}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                        formData.businessType === type.value
                          ? 'border-blue-500 bg-blue-500/10 text-white'
                          : 'border-gray-600 bg-black/30 text-gray-300 hover:border-gray-500'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{type.icon}</span>
                        <span className="font-medium">{type.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Industry and Location */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Star className="h-6 w-6 text-yellow-400" />
                    <label className="text-lg font-medium text-white">Industry</label>
                    <span className="text-sm text-gray-400 font-light">(Optional)</span>
                  </div>
                  <select
                    name="industry"
                    value={formData.industry}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-black/50 border border-gray-600 text-white rounded-2xl focus:outline-none focus:ring-2 focus:ring-yellow-500/50 focus:border-transparent transition-all duration-300 text-lg"
                  >
                    <option value="">Select your industry</option>
                    {industries.map((industry) => (
                      <option key={industry} value={industry} className="bg-black">
                        {industry}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-6 w-6 text-green-400" />
                    <label className="text-lg font-medium text-white">Location</label>
                    <span className="text-sm text-gray-400 font-light">(Optional)</span>
                  </div>
                  <input
                    type="text"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-black/50 border border-gray-600 text-white placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition-all duration-300 text-lg"
                    placeholder="City, Country"
                  />
                </div>
              </div>

              {/* Team Size - Optional */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Users className="h-6 w-6 text-purple-400" />
                  <label className="text-lg font-medium text-white">Team Size</label>
                  <span className="text-sm text-gray-400 font-light">(Optional)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {teamSizes.map((size) => (
                    <motion.button
                      key={size.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, teamSize: size.value }))}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 text-center ${
                        formData.teamSize === size.value
                          ? 'border-purple-500 bg-purple-500/10 text-white'
                          : 'border-gray-600 bg-black/30 text-gray-300 hover:border-gray-500'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="font-medium">{size.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Primary Goal - Optional */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Target className="h-6 w-6 text-orange-400" />
                  <label className="text-lg font-medium text-white">What's your primary goal?</label>
                  <span className="text-sm text-gray-400 font-light">(Optional)</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {goals.map((goal) => (
                    <motion.button
                      key={goal.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, primaryGoal: goal.value }))}
                      className={`p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                        formData.primaryGoal === goal.value
                          ? 'border-orange-500 bg-orange-500/10 text-white'
                          : 'border-gray-600 bg-black/30 text-gray-300 hover:border-gray-500'
                      }`}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{goal.icon}</span>
                        <span className="font-medium">{goal.label}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Experience Level and Revenue */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <TrendingUp className="h-6 w-6 text-cyan-400" />
                    <label className="text-lg font-medium text-white">Experience Level</label>
                    <span className="text-sm text-gray-400 font-light">(Optional)</span>
                  </div>
                  <div className="space-y-3">
                    {experienceLevels.map((level) => (
                      <motion.button
                        key={level.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, experienceLevel: level.value }))}
                        className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                          formData.experienceLevel === level.value
                            ? 'border-cyan-500 bg-cyan-500/10 text-white'
                            : 'border-gray-600 bg-black/30 text-gray-300 hover:border-gray-500'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex items-center space-x-3">
                          <span className="text-xl">{level.icon}</span>
                          <span className="font-medium">{level.label}</span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-6 w-6 text-green-400" />
                    <label className="text-lg font-medium text-white">Monthly Revenue</label>
                    <span className="text-sm text-gray-400 font-light">(Optional)</span>
                  </div>
                  <div className="space-y-3">
                    {revenueRanges.map((range) => (
                      <motion.button
                        key={range.value}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, monthlyRevenue: range.value }))}
                        className={`w-full p-4 rounded-2xl border-2 transition-all duration-300 text-left ${
                          formData.monthlyRevenue === range.value
                            ? 'border-green-500 bg-green-500/10 text-white'
                            : 'border-gray-600 bg-black/30 text-gray-300 hover:border-gray-500'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <span className="font-medium">{range.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Current Tools - Optional */}
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Zap className="h-6 w-6 text-yellow-400" />
                  <label className="text-lg font-medium text-white">Tools you currently use</label>
                  <span className="text-sm text-gray-400 font-light">(Optional - select all that apply)</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {tools.map((tool) => (
                    <motion.button
                      key={tool}
                      type="button"
                      onClick={() => handleToolToggle(tool)}
                      className={`p-3 rounded-xl border-2 transition-all duration-300 text-center text-sm ${
                        formData.currentTools.includes(tool)
                          ? 'border-yellow-500 bg-yellow-500/10 text-white'
                          : 'border-gray-600 bg-black/30 text-gray-300 hover:border-gray-500'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {tool}
                    </motion.button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-8">
                <motion.button
                  type="submit"
                  disabled={loading}
                  className="flex-1 relative overflow-hidden bg-gradient-to-r from-emerald-600 to-blue-600 text-white py-4 rounded-2xl font-medium transition-all duration-300 hover:from-emerald-500 hover:to-blue-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="relative z-10 flex items-center justify-center space-x-2 text-lg">
                    {loading ? (
                      <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Complete Setup</span>
                        <ArrowRight className="h-5 w-5" />
                      </>
                    )}
                  </span>
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleSkip}
                  className="px-8 py-4 border-2 border-gray-600 text-gray-300 rounded-2xl font-medium transition-all duration-300 hover:border-gray-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-gray-500/50"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Skip for now
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default BusinessSetup 