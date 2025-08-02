import { useState, useEffect, useRef } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, ArrowLeft, RefreshCw, CheckCircle, Shield } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'

const VerifyOTP = () => {
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const inputRefs = useRef([])
  const location = useLocation()
  const navigate = useNavigate()
  const { verifyOTP, signInWithOTP } = useAuth()

  const email = location.state?.email || ''
  const type = location.state?.type || 'signup'

  useEffect(() => {
    if (!email) {
      navigate('/signin')
      return
    }

    // Focus first input on mount
    inputRefs.current[0]?.focus()
  }, [email, navigate])

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleOtpChange = (index, value) => {
    // Only allow digits
    if (!/^\d*$/.test(value)) return

    const newOtp = [...otp]
    newOtp[index] = value.slice(-1) // Only take the last digit

    setOtp(newOtp)

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Focus previous input on backspace
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'Enter') {
      handleVerify()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6)
    
    if (pastedData.length === 6) {
      setOtp(pastedData.split(''))
      inputRefs.current[5]?.focus()
    }
  }

  const handleVerify = async () => {
    const otpString = otp.join('')
    
    if (otpString.length !== 6) {
      toast.error('Please enter the complete 6-digit code')
      return
    }

    setLoading(true)

    try {
      console.log('🔍 Verifying OTP:', { email, otp: otpString, type })
      
      const result = await verifyOTP(email, otpString, type)
      
      console.log('🔍 OTP Result:', result)
      
      if (result.success) {
        toast.success('Email verified successfully! 🎉')
        
        // Small delay to show success message
        setTimeout(() => {
          console.log('🔍 Redirecting to business setup...')
          navigate('/business-setup', { replace: true })
        }, 1000)
      } else {
        // Handle verification failure
        console.error('🔍 OTP verification failed:', result.error)
        toast.error(result.error || 'Invalid verification code. Please try again.')
        
        // Clear OTP on error
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error('🔍 Verification error:', error)
      toast.error('Something went wrong. Please try again.')
      
      // Clear OTP on error
      setOtp(['', '', '', '', '', ''])
      inputRefs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (countdown > 0) return

    setResending(true)
    
    try {
      const result = await signInWithOTP(email)
      
      if (result.success) {
        toast.success('New verification code sent!')
        setCountdown(60) // 60 second cooldown
        setOtp(['', '', '', '', '', ''])
        inputRefs.current[0]?.focus()
      }
    } catch (error) {
      console.error('Resend error:', error)
    } finally {
      setResending(false)
    }
  }

  const handleGoBack = () => {
    navigate(-1)
  }

  const isComplete = otp.every(digit => digit !== '')

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
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
          className="absolute bottom-1/4 right-1/4 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl"
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

      <div className="relative z-10 w-full max-w-md">
        <motion.div
          className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-2xl flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 300 }}
            >
              <Shield className="h-8 w-8 text-white" />
            </motion.div>
            
            <h1 className="text-3xl font-light text-white mb-2">Verify Your Email</h1>
            <p className="text-gray-400 font-light">
              We've sent a 6-digit code to
            </p>
            <p className="text-blue-400 font-medium mt-1">{email}</p>
          </div>

          {/* OTP Input */}
          <div className="mb-8">
            <div className="flex justify-center space-x-3 mb-6">
              {otp.map((digit, index) => (
                <motion.input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-12 h-14 bg-black/50 border border-gray-600 text-white text-center text-xl font-semibold rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all duration-300"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                />
              ))}
            </div>

            {/* Verify Button */}
            <motion.button
              onClick={handleVerify}
              disabled={!isComplete || loading}
              className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-emerald-600 text-white py-4 rounded-2xl font-medium transition-all duration-300 hover:from-blue-500 hover:to-emerald-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
              whileHover={isComplete && !loading ? { scale: 1.02 } : {}}
              whileTap={isComplete && !loading ? { scale: 0.98 } : {}}
            >
              <span className="relative z-10 flex items-center justify-center space-x-2">
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <CheckCircle className="h-5 w-5" />
                    <span>Verify Email</span>
                  </>
                )}
              </span>
            </motion.button>
          </div>

          {/* Resend Section */}
          <div className="text-center mb-6">
            <p className="text-gray-400 text-sm mb-3">Didn't receive the code?</p>
            
            <motion.button
              onClick={handleResend}
              disabled={countdown > 0 || resending}
              className="text-blue-400 hover:text-blue-300 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 mx-auto"
              whileHover={countdown === 0 && !resending ? { scale: 1.05 } : {}}
              whileTap={countdown === 0 && !resending ? { scale: 0.95 } : {}}
            >
              {resending ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              <span>
                {countdown > 0 
                  ? `Resend in ${countdown}s` 
                  : resending 
                    ? 'Sending...' 
                    : 'Resend Code'
                }
              </span>
            </motion.button>
          </div>

          {/* Back Button */}
          <motion.button
            onClick={handleGoBack}
            className="w-full flex items-center justify-center space-x-2 text-gray-400 hover:text-white py-3 font-medium transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}

export default VerifyOTP 