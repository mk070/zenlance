import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, 
  Image, 
  Calendar,
  Hash,
  Send,
  Eye,
  Save,
  X,
  Upload,
  Link,
  Type
} from 'lucide-react'
import toast from 'react-hot-toast'
import apiClient from '../lib/api-client'

const CreateSocialPost = () => {
  const navigate = useNavigate()
  const [loading, setSaving] = useState(false)
  const [previewMode, setPreviewMode] = useState(false)
  
  const [formData, setFormData] = useState({
    content: '',
    platforms: [],
    scheduleDate: '',
    scheduleTime: '',
    mediaFiles: [],
    hashtags: '',
    link: ''
  })

  const platforms = [
    { id: 'facebook', name: 'Facebook', color: 'from-blue-500 to-blue-600' },
    { id: 'instagram', name: 'Instagram', color: 'from-pink-500 to-purple-600' },
    { id: 'twitter', name: 'Twitter', color: 'from-blue-400 to-blue-500' },
    { id: 'linkedin', name: 'LinkedIn', color: 'from-blue-600 to-blue-700' }
  ]

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handlePlatformToggle = (platformId) => {
    setFormData(prev => ({
      ...prev,
      platforms: prev.platforms.includes(platformId)
        ? prev.platforms.filter(id => id !== platformId)
        : [...prev.platforms, platformId]
    }))
  }

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files)
    setFormData(prev => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...files]
    }))
  }

  const removeFile = (index) => {
    setFormData(prev => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index)
    }))
  }

  const handleSave = async (isDraft = true) => {
    try {
      setSaving(true)
      
      // Validation
      if (!formData.content.trim()) {
        toast.error('Please enter post content')
        return
      }
      
      if (formData.platforms.length === 0) {
        toast.error('Please select at least one platform')
        return
      }

      const postData = {
        ...formData,
        status: isDraft ? 'draft' : 'scheduled',
        scheduledFor: formData.scheduleDate && formData.scheduleTime 
          ? new Date(`${formData.scheduleDate}T${formData.scheduleTime}`)
          : null
      }

      // Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast.success(isDraft ? 'Post saved as draft!' : 'Post scheduled successfully!')
      navigate('/social-media')
      
    } catch (error) {
      console.error('Error saving post:', error)
      toast.error(isDraft ? 'Failed to save post' : 'Failed to schedule post')
    } finally {
      setSaving(false)
    }
  }

  const handlePreview = () => {
    if (!formData.content.trim()) {
      toast.error('Please enter some content to preview')
      return
    }
    setPreviewMode(true)
  }

  return (
    <div className="flex-1 p-6 overflow-y-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/social-media')}
              className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-light text-white mb-2">Create Social Post</h1>
              <p className="text-slate-400 font-light">
                Create and schedule engaging content for your social media platforms
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button
              onClick={handlePreview}
              className="bg-white/10 hover:bg-white/15 text-white px-4 py-2 rounded-xl transition-colors font-medium flex items-center space-x-2"
            >
              <Eye className="w-4 h-4" />
              <span>Preview</span>
            </button>
            
            <button
              onClick={() => handleSave(true)}
              disabled={loading}
              className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-xl transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>Save Draft</span>
            </button>
            
            <button
              onClick={() => handleSave(false)}
              disabled={loading}
              className="bg-cyan-400 hover:bg-cyan-500 text-black px-6 py-2 rounded-xl transition-colors font-medium flex items-center space-x-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Scheduling...' : 'Schedule Post'}</span>
            </button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Post Content */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Type className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xl font-light text-white">Post Content</h3>
            </div>
            
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              placeholder="What's on your mind? Share your thoughts, insights, or updates with your audience..."
              className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all resize-none"
            />
            
            <div className="mt-3 text-right">
              <span className="text-slate-400 text-sm">
                {formData.content.length}/280 characters
              </span>
            </div>
          </motion.div>

          {/* Media Upload */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Image className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xl font-light text-white">Media</h3>
            </div>
            
            <div className="space-y-4">
              {/* Upload Area */}
              <div className="border-2 border-dashed border-white/20 rounded-xl p-6 text-center hover:border-cyan-400/50 transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="media-upload"
                />
                <label
                  htmlFor="media-upload"
                  className="cursor-pointer flex flex-col items-center space-y-2"
                >
                  <Upload className="w-8 h-8 text-slate-400" />
                  <p className="text-white font-medium">Upload Images or Videos</p>
                  <p className="text-slate-400 text-sm">Drag and drop or click to browse</p>
                </label>
              </div>

              {/* Uploaded Files */}
              {formData.mediaFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.mediaFiles.map((file, index) => (
                    <div key={index} className="relative bg-white/5 rounded-xl p-3 border border-white/10">
                      <div className="flex items-center space-x-2">
                        <Image className="w-4 h-4 text-cyan-400" />
                        <span className="text-white text-sm truncate">{file.name}</span>
                      </div>
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>

          {/* Additional Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-xl font-light text-white mb-4">Additional Options</h3>
            
            <div className="space-y-4">
              {/* Hashtags */}
              <div>
                <label className="flex items-center space-x-2 text-white font-medium mb-2">
                  <Hash className="w-4 h-4 text-cyan-400" />
                  <span>Hashtags</span>
                </label>
                <input
                  type="text"
                  value={formData.hashtags}
                  onChange={(e) => handleInputChange('hashtags', e.target.value)}
                  placeholder="#socialmedia #marketing #business"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                />
              </div>

              {/* Link */}
              <div>
                <label className="flex items-center space-x-2 text-white font-medium mb-2">
                  <Link className="w-4 h-4 text-cyan-400" />
                  <span>Link</span>
                </label>
                <input
                  type="url"
                  value={formData.link}
                  onChange={(e) => handleInputChange('link', e.target.value)}
                  placeholder="https://example.com"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Platform Selection */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-xl font-light text-white mb-4">Select Platforms</h3>
            
            <div className="space-y-3">
              {platforms.map((platform) => (
                <label
                  key={platform.id}
                  className="flex items-center space-x-3 cursor-pointer group"
                >
                  <input
                    type="checkbox"
                    checked={formData.platforms.includes(platform.id)}
                    onChange={() => handlePlatformToggle(platform.id)}
                    className="w-5 h-5 text-cyan-400 bg-transparent border border-white/20 rounded focus:ring-cyan-400 focus:ring-2"
                  />
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-r ${platform.color} flex items-center justify-center`}>
                    <span className="text-white text-xs font-bold">
                      {platform.name.substring(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-white group-hover:text-cyan-300 transition-colors">
                    {platform.name}
                  </span>
                </label>
              ))}
            </div>
          </motion.div>

          {/* Schedule */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="w-5 h-5 text-cyan-400" />
              <h3 className="text-xl font-light text-white">Schedule</h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-white font-medium mb-2 block">Date</label>
                <input
                  type="date"
                  value={formData.scheduleDate}
                  onChange={(e) => handleInputChange('scheduleDate', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                />
              </div>
              
              <div>
                <label className="text-white font-medium mb-2 block">Time</label>
                <input
                  type="time"
                  value={formData.scheduleTime}
                  onChange={(e) => handleInputChange('scheduleTime', e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-400/50 focus:bg-white/10 transition-all"
                />
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewMode && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-light text-white">Post Preview</h3>
              <button
                onClick={() => setPreviewMode(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <p className="text-white whitespace-pre-wrap">{formData.content}</p>
              {formData.hashtags && (
                <p className="text-cyan-400 mt-2">{formData.hashtags}</p>
              )}
              {formData.link && (
                <a href={formData.link} className="text-blue-400 mt-2 block underline">
                  {formData.link}
                </a>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default CreateSocialPost 