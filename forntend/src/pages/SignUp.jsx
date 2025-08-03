import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const SignUp = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [loadingMessage, setLoadingMessage] = useState('')
  const [googleLoading, setGoogleLoading] = useState(false)
  const [passwordValidation, setPasswordValidation] = useState(null)
  
  const { signUp, validateEmail, validatePassword, validatePasswordMatch } = useAuth()
  const navigate = useNavigate()

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))

    // Real-time password validation
    if (name === 'password') {
      const validation = validatePassword(value)
      setPasswordValidation(validation)
    }
  }

  const validateForm = () => {
    // Email validation
    const emailValidation = validateEmail(formData.email)
    if (!emailValidation.isValid) {
      toast.error(emailValidation.errors[0])
      return false
    }

    // Password validation
    const passwordValidation = validatePassword(formData.password)
    if (!passwordValidation.isValid) {
      toast.error(passwordValidation.errors[0])
      return false
    }

    // Password match validation
    const passwordMatch = validatePasswordMatch(formData.password, formData.confirmPassword)
    if (!passwordMatch.isValid) {
      toast.error(passwordMatch.error)
      return false
    }

    // Name validation
    if (!formData.firstName.trim()) {
      toast.error('First name is required')
      return false
    }

    if (!formData.lastName.trim()) {
      toast.error('Last name is required')
      return false
    }

    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    setLoadingMessage('Creating account...')
    
    try {
      console.log('🔍 Starting signup process...')
      
      const result = await signUp(
        formData.email,
        formData.password,
        formData.firstName.trim(),
        formData.lastName.trim()
      )
      
      console.log('🔍 Signup result:', result)
      
      if (result.success) {
        setLoadingMessage('Account created! Redirecting to verification...')
        setTimeout(() => {
          navigate('/verify-otp', { 
            state: { email: formData.email } 
          })
        }, 1500)
      } else {
        // Display validation errors to user
        if (result.validationErrors && result.validationErrors.length > 0) {
          result.validationErrors.forEach(error => {
            toast.error(`${error.field}: ${error.message}`)
          })
        } else if (result.error) {
          toast.error(result.error)
        } else {
          toast.error('Failed to create account. Please try again.')
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('Network error. Please check your connection and try again.')
    } finally {
      setLoading(false)
      setLoadingMessage('')
    }
  }

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    
    try {
      // Google OAuth not implemented in custom backend yet
      toast.error('Google sign up coming soon! Please use email signup for now.')
    } catch (error) {
      toast.error('Google sign up failed')
      console.error('Google sign up error:', error)
    } finally {
      setGoogleLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (!passwordValidation) return 'bg-gray-700'
    
    const colors = {
      red: 'bg-red-500',
      orange: 'bg-orange-500', 
      yellow: 'bg-yellow-500',
      blue: 'bg-blue-500',
      green: 'bg-green-500',
      emerald: 'bg-emerald-500'
    }
    
    return colors[passwordValidation.strengthColor] || 'bg-gray-700'
  }

  const features = [
    "Complete client management system",
    "Professional invoice generation", 
    "Advanced project tracking",
    "Automated time tracking",
    "Business analytics dashboard",
    "Secure payment processing"
  ]

  const stats = [
    { number: "50K+", label: "Active Freelancers" },
    { number: "$2.1B+", label: "Revenue Processed" },
    { number: "150+", label: "Countries Served" }
  ]

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black"></div>
        
        {/* Floating Orbs */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-navy-500/10 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.5, 0.3, 0.5],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />

        {/* Subtle Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:72px_72px]"></div>
      </div>

      <div className="relative z-10">
        <div className="grid md:grid-cols-2 min-h-screen">
          {/* Left Side - Branding */}
          <motion.div 
            className="hidden md:flex flex-col justify-center px-16 lg:px-24"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="max-w-lg">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-5xl lg:text-6xl font-light mb-6 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                  FreelanceHub
                </h1>
                <p className="text-xl text-gray-300 mb-12 font-light leading-relaxed">
                  The premium platform trusted by thousands of freelancers worldwide to manage their business with confidence.
                </p>
              </motion.div>

              {/* Features */}
              <motion.div
                className="space-y-4 mb-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + index * 0.1 }}
                  >
                    <CheckCircle className="h-5 w-5 text-emerald-400 flex-shrink-0" />
                    <span className="text-gray-300 font-light">{feature}</span>
                  </motion.div>
                ))}
              </motion.div>

              {/* Stats */}
              <motion.div
                className="flex space-x-12"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                {stats.map((stat, index) => (
                  <div key={index} className="text-center">
                    <div className="text-2xl font-semibold text-white mb-1">{stat.number}</div>
                    <div className="text-sm text-gray-400 font-light">{stat.label}</div>
                  </div>
                ))}
              </motion.div>
            </div>
          </motion.div>

          {/* Right Side - Form */}
          <motion.div 
            className="flex items-center justify-center p-8"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="w-full max-w-md">
              <motion.div
                className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-light text-white mb-2">Create Account</h2>
                  <p className="text-gray-400 font-light">Start your freelance journey today</p>
                </div>

                {/* Google Sign Up Button */}
                <motion.button
                  onClick={handleGoogleSignUp}
                  disabled={googleLoading}
                  className="w-full mb-6 flex items-center justify-center space-x-3 bg-white hover:bg-gray-50 text-gray-900 py-3 px-4 rounded-2xl font-medium transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {googleLoading ? (
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
                  ) : (
                    <>
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>Continue with Google</span>
                    </>
                  )}
                </motion.button>

                {/* Divider */}
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-600"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-black/50 text-gray-400 font-light">or</span>
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Name Fields */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">First Name</label>
                      <div className="relative">
                        <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleInputChange}
                          className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-600 text-white placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                          placeholder="John"
                          required
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-300">Last Name</label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-black/50 border border-gray-600 text-white placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                        placeholder="Doe"
                        required
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-4 py-3 bg-black/50 border border-gray-600 text-white placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                        placeholder="john@example.com"
                        required
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-3 bg-black/50 border border-gray-600 text-white placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                        placeholder="Create a strong password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                    
                    {/* Password Strength Indicator */}
                    {passwordValidation && formData.password && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">Password Strength</span>
                          <span className={`text-xs font-medium ${
                            passwordValidation.strengthColor === 'red' ? 'text-red-400' :
                            passwordValidation.strengthColor === 'orange' ? 'text-orange-400' :
                            passwordValidation.strengthColor === 'yellow' ? 'text-yellow-400' :
                            passwordValidation.strengthColor === 'blue' ? 'text-blue-400' :
                            passwordValidation.strengthColor === 'green' ? 'text-green-400' :
                            'text-emerald-400'
                          }`}>
                            {passwordValidation.strengthLabel}
                          </span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                            style={{ width: `${(passwordValidation.strength / 6) * 100}%` }}
                          ></div>
                        </div>
                        {passwordValidation && passwordValidation.errors.length > 0 && (
                          <div className="space-y-1">
                            {passwordValidation.errors.map((error, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs text-red-400">
                                <XCircle className="h-3 w-3" />
                                <span>{error}</span>
                              </div>
                            ))}
                          </div>
                        )}
                        {passwordValidation && passwordValidation.warnings.length > 0 && (
                          <div className="space-y-1">
                            {passwordValidation.warnings.map((warning, index) => (
                              <div key={index} className="flex items-center space-x-2 text-xs text-yellow-400">
                                <AlertCircle className="h-3 w-3" />
                                <span>{warning}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-300">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full pl-12 pr-12 py-3 bg-black/50 border border-gray-600 text-white placeholder-gray-400 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                        placeholder="Confirm your password"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <motion.button
                    type="submit"
                    disabled={loading}
                    className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-navy-600 text-white py-3 rounded-2xl font-medium transition-all duration-300 hover:from-blue-500 hover:to-navy-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <span className="relative z-10 flex items-center justify-center space-x-2">
                      {loading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>{loadingMessage || 'Creating account...'}</span>
                        </>
                      ) : (
                        <>
                          <span>Create Account</span>
                          <ArrowRight className="h-5 w-5" />
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-navy-500 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                  </motion.button>
                </form>

                <div className="mt-8 text-center">
                  <p className="text-gray-400 font-light">
                    Already have an account?{' '}
                    <Link to="/signin" className="text-blue-400 hover:text-blue-300 transition-colors font-medium">
                      Sign In
                    </Link>
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default SignUp 