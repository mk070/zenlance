// Social Media Management Service
// This file contains all social media related functions including localStorage operations,
// sample image generation, text generation, and utility functions

// ==================== CONSTANTS ====================

// Storage key for localStorage
const STORAGE_KEY = 'zenlance_social_posts'

// Sample images for "AI generation"
const SAMPLE_IMAGES = [
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1553028826-f4804a6dba3b?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1556155092-490a1ba16284?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1573164713714-d95e436ab8d6?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1551434678-e076c223a692?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1551836022-deb4988cc6c0?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=400&h=400&fit=crop',
  'https://images.unsplash.com/photo-1586227740560-8cf2732c1531?w=400&h=400&fit=crop'
]

// Content templates for rephrasing
const CONTENT_TEMPLATES = {
  professional: [
    "🚀 {content} - driving innovation forward.",
    "Excited to share: {content} 💼",
    "Professional insight: {content} #Business",
    "Industry update: {content} 📊",
    "{content} - our commitment to excellence continues."
  ],
  casual: [
    "Hey everyone! {content} 😊",
    "Just wanted to share - {content} ✨",
    "Quick update: {content} 👍",
    "Check this out! {content} 🎉",
    "{content} - thought you'd find this interesting!"
  ],
  engaging: [
    "What do you think about this? {content} 💭",
    "Let's discuss: {content} - drop your thoughts below! 👇",
    "This is exciting! {content} 🔥",
    "Your thoughts on {content}? Let me know! 💬",
    "Breaking: {content} - what's your take? 🤔"
  ],
  inspirational: [
    "Remember: {content} 🌟 Keep pushing forward!",
    "Motivation Monday: {content} 💪",
    "Believe in yourself! {content} ✨",
    "Success tip: {content} 🎯",
    "Stay focused: {content} - you've got this! 🚀"
  ]
}

// Platform configurations
const PLATFORM_CONFIGS = [
  { id: 'facebook', name: 'Facebook', color: 'from-blue-500 to-blue-600' },
  { id: 'instagram', name: 'Instagram', color: 'from-pink-500 to-purple-600' },
  { id: 'twitter', name: 'Twitter', color: 'from-blue-400 to-blue-500' },
  { id: 'linkedin', name: 'LinkedIn', color: 'from-blue-600 to-blue-700' }
]

// Mock connected accounts data
const MOCK_CONNECTED_ACCOUNTS = [
  { platform: 'facebook', name: 'Your Business', followers: '12.5K', status: 'connected' },
  { platform: 'instagram', name: '@yourbusiness', followers: '8.2K', status: 'connected' },
  { platform: 'twitter', name: '@yourbusiness', followers: '5.1K', status: 'connected' },
  { platform: 'linkedin', name: 'Your Business', followers: '3.7K', status: 'connected' }
]

// ==================== UTILITY FUNCTIONS ====================

// Helper function to convert File to base64 string
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result)
    reader.onerror = error => reject(error)
  })
}

// Helper function to convert base64 back to displayable image
export const base64ToImageUrl = (base64String) => {
  return base64String // base64 strings can be used directly as src
}

// Convert URL to File object for sample images
export const urlToFile = async (url, filename) => {
  try {
    const response = await fetch(url)
    const blob = await response.blob()
    return new File([blob], filename, { type: blob.type })
  } catch (error) {
    console.error('URL to File conversion error:', error)
    throw error
  }
}

// Validate URL format
export const isValidUrl = (string) => {
  try {
    new URL(string)
    return true
  } catch (_) {
    return false
  }
}

// Format date for display
export const formatDate = (dateString) => {
  if (!dateString) return 'Unknown'
  
  try {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  } catch (error) {
    return 'Invalid date'
  }
}

// Get platform color classes
export const getPlatformColor = (platform) => {
  const platformConfig = PLATFORM_CONFIGS.find(p => p.id === platform)
  return platformConfig ? platformConfig.color : 'from-gray-500 to-gray-600'
}

// Get status color classes
export const getStatusColor = (status) => {
  switch (status) {
    case 'published':
      return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20'
    case 'scheduled':
      return 'text-blue-400 bg-blue-400/10 border-blue-400/20'
    case 'draft':
      return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
    case 'failed':
      return 'text-red-400 bg-red-400/10 border-red-400/20'
    default:
      return 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  }
}

// ==================== LOCALSTORAGE OPERATIONS ====================

// Get all posts from localStorage
export const getAllPosts = () => {
  try {
    const posts = localStorage.getItem(STORAGE_KEY)
    return posts ? JSON.parse(posts) : []
  } catch (error) {
    console.error('Error getting posts from localStorage:', error)
    return []
  }
}

// Save a new post to localStorage
export const savePost = async (postData) => {
  try {
    const posts = getAllPosts()
    
    // Process media files to base64
    const processedMedia = []
    if (postData.mediaFiles && postData.mediaFiles.length > 0) {
      for (const file of postData.mediaFiles) {
        const base64 = await fileToBase64(file)
        processedMedia.push({
          name: file.name,
          type: file.type,
          size: file.size,
          data: base64,
          lastModified: file.lastModified
        })
      }
    }

    const newPost = {
      id: Date.now().toString(), // Simple ID generation
      content: postData.content,
      title: postData.title || '',
      platforms: postData.platforms,
      status: postData.status || 'draft',
      scheduledDate: postData.scheduledDate || null,
      publishedDate: postData.status === 'published' ? new Date().toISOString() : null,
      hashtags: postData.hashtags,
      link: postData.link || '',
      media: processedMedia,
      targetAudience: postData.targetAudience || '',
      category: postData.category || '',
      performance: {
        views: 0,
        likes: 0,
        shares: 0,
        comments: 0,
        clicks: 0,
        engagement: 0,
        reach: 0,
        impressions: 0
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    }

    posts.unshift(newPost) // Add to beginning of array
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
    
    return { success: true, data: newPost }
  } catch (error) {
    console.error('Error saving post to localStorage:', error)
    return { success: false, error: error.message }
  }
}

// Update an existing post
export const updatePost = async (postId, updateData) => {
  try {
    const posts = getAllPosts()
    const postIndex = posts.findIndex(post => post.id === postId)
    
    if (postIndex === -1) {
      return { success: false, error: 'Post not found' }
    }

    // Process media files if updated
    let processedMedia = posts[postIndex].media
    if (updateData.mediaFiles && updateData.mediaFiles.length > 0) {
      processedMedia = []
      for (const file of updateData.mediaFiles) {
        if (typeof file === 'string') {
          // Already processed base64
          processedMedia.push(file)
        } else {
          // New file to process
          const base64 = await fileToBase64(file)
          processedMedia.push({
            name: file.name,
            type: file.type,
            size: file.size,
            data: base64,
            lastModified: file.lastModified
          })
        }
      }
    }

    posts[postIndex] = {
      ...posts[postIndex],
      ...updateData,
      media: processedMedia,
      updatedAt: new Date().toISOString()
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
    return { success: true, data: posts[postIndex] }
  } catch (error) {
    console.error('Error updating post in localStorage:', error)
    return { success: false, error: error.message }
  }
}

// Delete a post (soft delete)
export const deletePost = (postId) => {
  try {
    const posts = getAllPosts()
    const postIndex = posts.findIndex(post => post.id === postId)
    
    if (postIndex === -1) {
      return { success: false, error: 'Post not found' }
    }

    posts[postIndex].isActive = false
    posts[postIndex].updatedAt = new Date().toISOString()
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
    return { success: true }
  } catch (error) {
    console.error('Error deleting post from localStorage:', error)
    return { success: false, error: error.message }
  }
}

// Get posts with filtering and pagination
export const getFilteredPosts = (options = {}) => {
  try {
    let posts = getAllPosts().filter(post => post.isActive)
    
    // Apply filters
    if (options.status && options.status !== 'all') {
      posts = posts.filter(post => post.status === options.status)
    }
    
    if (options.platform && options.platform !== 'all') {
      posts = posts.filter(post => post.platforms.includes(options.platform))
    }
    
    if (options.search) {
      const searchTerm = options.search.toLowerCase()
      posts = posts.filter(post => 
        post.content.toLowerCase().includes(searchTerm) ||
        post.title.toLowerCase().includes(searchTerm) ||
        (post.hashtags && post.hashtags.toLowerCase().includes(searchTerm))
      )
    }

    if (options.category) {
      posts = posts.filter(post => post.category === options.category)
    }

    if (options.dateFrom || options.dateTo) {
      posts = posts.filter(post => {
        const postDate = new Date(post.createdAt)
        if (options.dateFrom && postDate < new Date(options.dateFrom)) return false
        if (options.dateTo && postDate > new Date(options.dateTo)) return false
        return true
      })
    }

    // Sort posts
    const sortBy = options.sortBy || 'createdAt'
    const sortOrder = options.sortOrder || 'desc'
    
    posts.sort((a, b) => {
      let aValue = a[sortBy]
      let bValue = b[sortBy]
      
      if (sortBy.includes('.')) {
        // Handle nested properties like 'performance.engagement'
        const keys = sortBy.split('.')
        aValue = keys.reduce((obj, key) => obj && obj[key], a) || 0
        bValue = keys.reduce((obj, key) => obj && obj[key], b) || 0
      }
      
      if (sortOrder === 'desc') {
        return new Date(bValue) - new Date(aValue) || bValue - aValue
      } else {
        return new Date(aValue) - new Date(bValue) || aValue - bValue
      }
    })

    // Apply pagination
    const page = parseInt(options.page) || 1
    const limit = parseInt(options.limit) || 20
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    
    const paginatedPosts = posts.slice(startIndex, endIndex)
    
    return {
      success: true,
      data: {
        posts: paginatedPosts,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(posts.length / limit),
          totalItems: posts.length,
          itemsPerPage: limit,
          hasNextPage: endIndex < posts.length,
          hasPrevPage: page > 1
        }
      }
    }
  } catch (error) {
    console.error('Error getting filtered posts:', error)
    return { success: false, error: error.message }
  }
}

// Get analytics data from stored posts
export const getAnalytics = (dateRange = 30) => {
  try {
    const posts = getAllPosts().filter(post => post.isActive)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - dateRange)

    const totalPosts = posts.length
    const publishedPosts = posts.filter(post => post.status === 'published')
    const scheduledPosts = posts.filter(post => post.status === 'scheduled')
    const draftPosts = posts.filter(post => post.status === 'draft')
    
    // Calculate performance stats
    const performanceStats = publishedPosts.reduce((acc, post) => {
      if (post.publishedDate && new Date(post.publishedDate) >= startDate) {
        acc.totalPosts += 1
        acc.totalViews += post.performance.views || 0
        acc.totalLikes += post.performance.likes || 0
        acc.totalShares += post.performance.shares || 0
        acc.totalComments += post.performance.comments || 0
        acc.totalEngagement += post.performance.engagement || 0
        acc.totalReach += post.performance.reach || 0
        acc.totalImpressions += post.performance.impressions || 0
      }
      return acc
    }, {
      totalPosts: 0,
      totalViews: 0,
      totalLikes: 0,
      totalShares: 0,
      totalComments: 0,
      totalEngagement: 0,
      totalReach: 0,
      totalImpressions: 0
    })

    // Calculate average engagement
    performanceStats.avgEngagement = performanceStats.totalPosts > 0 
      ? performanceStats.totalEngagement / performanceStats.totalPosts 
      : 0

    // Get platform stats
    const platformStats = {}
    publishedPosts.forEach(post => {
      post.platforms.forEach(platform => {
        if (!platformStats[platform]) {
          platformStats[platform] = {
            _id: platform,
            postCount: 0,
            totalViews: 0,
            totalLikes: 0,
            avgEngagement: 0
          }
        }
        platformStats[platform].postCount += 1
        platformStats[platform].totalViews += post.performance.views || 0
        platformStats[platform].totalLikes += post.performance.likes || 0
      })
    })

    // Calculate average engagement for each platform
    Object.values(platformStats).forEach(stat => {
      stat.avgEngagement = stat.postCount > 0 ? stat.totalLikes / stat.postCount : 0
    })

    // Get top performing posts
    const topPosts = publishedPosts
      .sort((a, b) => (b.performance.engagement || 0) - (a.performance.engagement || 0))
      .slice(0, 5)

    return {
      success: true,
      data: {
        performanceStats: performanceStats.totalPosts > 0 ? performanceStats : {
          totalPosts: 0,
          totalViews: 0,
          totalLikes: 0,
          totalShares: 0,
          totalComments: 0,
          avgEngagement: 0
        },
        platformStats: Object.values(platformStats).sort((a, b) => b.postCount - a.postCount),
        topPosts,
        totalPosts,
        scheduledPosts: scheduledPosts.length,
        draftPosts: draftPosts.length
      }
    }
  } catch (error) {
    console.error('Error getting analytics:', error)
    return { success: false, error: error.message }
  }
}

// Get scheduled posts that need to be published
export const getScheduledPosts = () => {
  try {
    const posts = getAllPosts().filter(post => 
      post.isActive && 
      post.status === 'scheduled' && 
      post.scheduledDate && 
      new Date(post.scheduledDate) <= new Date()
    )
    
    return { success: true, data: posts }
  } catch (error) {
    console.error('Error getting scheduled posts:', error)
    return { success: false, error: error.message }
  }
}

// Update post performance
export const updatePostPerformance = (postId, performanceData) => {
  try {
    const posts = getAllPosts()
    const postIndex = posts.findIndex(post => post.id === postId)
    
    if (postIndex === -1) {
      return { success: false, error: 'Post not found' }
    }

    posts[postIndex].performance = {
      ...posts[postIndex].performance,
      ...performanceData
    }

    // Calculate engagement rate
    if (posts[postIndex].performance.impressions > 0) {
      const totalEngagement = (posts[postIndex].performance.likes || 0) + 
                             (posts[postIndex].performance.shares || 0) + 
                             (posts[postIndex].performance.comments || 0)
      posts[postIndex].performance.engagement = (totalEngagement / posts[postIndex].performance.impressions) * 100
    }

    posts[postIndex].updatedAt = new Date().toISOString()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
    
    return { success: true, data: posts[postIndex] }
  } catch (error) {
    console.error('Error updating post performance:', error)
    return { success: false, error: error.message }
  }
}

// ==================== SAMPLE IMAGE GENERATION ====================

// Generate sample images with simulated AI processing
export const generateSampleImages = async (content, style = 'realistic') => {
  try {
    // Simulate AI generation delay
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Select random sample images based on style
    const shuffledImages = [...SAMPLE_IMAGES].sort(() => 0.5 - Math.random())
    const selectedImages = shuffledImages.slice(0, 4)
    
    return {
      success: true,
      data: selectedImages
    }
  } catch (error) {
    console.error('Sample Generation Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ==================== TEXT GENERATION ====================

// Template-based rephrasing function
const rephraseContent = (content, tone = 'professional') => {
  const templates = CONTENT_TEMPLATES[tone] || CONTENT_TEMPLATES.professional
  const randomTemplate = templates[Math.floor(Math.random() * templates.length)]
  return randomTemplate.replace('{content}', content.trim())
}

// Generate multiple rephrase options
const generateRephraseOptions = (content, tone = 'professional') => {
  const options = []
  const templates = CONTENT_TEMPLATES[tone] || CONTENT_TEMPLATES.professional
  
  // Generate 3-4 different options
  const shuffledTemplates = [...templates].sort(() => 0.5 - Math.random())
  for (let i = 0; i < Math.min(4, templates.length); i++) {
    const rephrasedContent = shuffledTemplates[i].replace('{content}', content.trim())
    options.push(rephrasedContent)
  }
  
  return options
}

// Rephrase existing content with templates
export const rephraseTextContent = async (content, tone = 'professional') => {
  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const rephrasedTexts = generateRephraseOptions(content, tone)
    
    return {
      success: true,
      data: rephrasedTexts
    }
  } catch (error) {
    console.error('Text Rephrase Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// Generate new text content with templates
export const generateTextContent = async (baseContent, tone = 'professional') => {
  try {
    // Simulate processing delay
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    // Create a general prompt if no content exists
    const content = baseContent.trim() || 'exciting business update'
    const generatedTexts = generateRephraseOptions(content, tone)
    
    return {
      success: true,
      data: generatedTexts
    }
  } catch (error) {
    console.error('Text Generation Error:', error)
    return {
      success: false,
      error: error.message
    }
  }
}

// ==================== CONFIGURATION GETTERS ====================

// Get platform configurations
export const getPlatformConfigs = () => {
  return PLATFORM_CONFIGS
}

// Get mock connected accounts
export const getMockConnectedAccounts = () => {
  return MOCK_CONNECTED_ACCOUNTS
}

// Get content templates
export const getContentTemplates = () => {
  return CONTENT_TEMPLATES
}

// ==================== EXPORT/IMPORT FUNCTIONALITY ====================

// Clear all posts (for development/testing)
export const clearAllPosts = () => {
  try {
    localStorage.removeItem(STORAGE_KEY)
    return { success: true }
  } catch (error) {
    console.error('Error clearing posts:', error)
    return { success: false, error: error.message }
  }
}

// Export posts to JSON file
export const exportPosts = () => {
  try {
    const posts = getAllPosts()
    const dataStr = JSON.stringify(posts, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `social-posts-export-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    
    URL.revokeObjectURL(url)
    return { success: true }
  } catch (error) {
    console.error('Error exporting posts:', error)
    return { success: false, error: error.message }
  }
}

// Import posts from JSON data
export const importPosts = (jsonData) => {
  try {
    const posts = JSON.parse(jsonData)
    if (!Array.isArray(posts)) {
      throw new Error('Invalid data format')
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(posts))
    return { success: true, message: `Imported ${posts.length} posts` }
  } catch (error) {
    console.error('Error importing posts:', error)
    return { success: false, error: error.message }
  }
} 