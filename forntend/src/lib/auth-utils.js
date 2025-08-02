// Token storage keys
const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'

// Get access token from localStorage
export const getAccessToken = () => {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

// Set access token in localStorage
export const setAccessToken = (token) => {
  if (token) {
    localStorage.setItem(ACCESS_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
  }
}

// Get refresh token from localStorage
export const getRefreshToken = () => {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

// Set refresh token in localStorage
export const setRefreshToken = (token) => {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token)
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  }
}

// Set both tokens
export const setTokens = (accessToken, refreshToken) => {
  setAccessToken(accessToken)
  setRefreshToken(refreshToken)
}

// Remove access token from localStorage
export const removeAccessToken = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

// Remove refresh token from localStorage
export const removeRefreshToken = () => {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

// Remove all tokens
export const removeTokens = () => {
  removeAccessToken()
  removeRefreshToken()
}

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAccessToken()
}

// Get user info from token (decode JWT payload)
export const getUserFromToken = () => {
  const token = getAccessToken()
  if (!token) return null

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload
  } catch (error) {
    console.error('Error decoding token:', error)
    return null
  }
}

// Check if token is expired
export const isTokenExpired = (token) => {
  if (!token) return true

  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const currentTime = Date.now() / 1000
    return payload.exp < currentTime
  } catch (error) {
    return true
  }
}

// Check if access token is expired
export const isAccessTokenExpired = () => {
  return isTokenExpired(getAccessToken())
} 