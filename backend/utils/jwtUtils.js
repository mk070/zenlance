import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { logger, securityLogger } from './logger.js';

class JWTUtils {
  constructor() {
    this.accessTokenSecret = process.env.JWT_SECRET;
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET;
    this.accessTokenExpiry = process.env.JWT_EXPIRE || '15m';
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRE || '7d';

    if (!this.accessTokenSecret || !this.refreshTokenSecret) {
      throw new Error('JWT secrets are not defined in environment variables');
    }
  }

  // Generate access token
  generateAccessToken(payload) {
    try {
      const tokenPayload = {
        id: payload.id,
        email: payload.email,
        role: payload.role || 'user',
        isEmailVerified: payload.isEmailVerified || false,
        type: 'access'
      };

      return jwt.sign(tokenPayload, this.accessTokenSecret, {
        expiresIn: this.accessTokenExpiry,
        issuer: 'vibe-code-backend',
        audience: 'vibe-code-frontend'
      });
    } catch (error) {
      logger.error('Error generating access token', { error: error.message });
      throw new Error('Failed to generate access token');
    }
  }

  // Generate refresh token
  generateRefreshToken(payload) {
    try {
      const tokenPayload = {
        id: payload.id,
        email: payload.email,
        tokenId: crypto.randomUUID(),
        type: 'refresh'
      };

      return jwt.sign(tokenPayload, this.refreshTokenSecret, {
        expiresIn: this.refreshTokenExpiry,
        issuer: 'vibe-code-backend',
        audience: 'vibe-code-frontend'
      });
    } catch (error) {
      logger.error('Error generating refresh token', { error: error.message });
      throw new Error('Failed to generate refresh token');
    }
  }

  // Verify access token
  verifyAccessToken(token) {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret, {
        issuer: 'vibe-code-backend',
        audience: 'vibe-code-frontend'
      });

      if (decoded.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          decoded: null,
          expired: true,
          error: 'Token expired'
        };
      }

      securityLogger.invalidToken(token, error.message);
      
      return {
        valid: false,
        decoded: null,
        expired: false,
        error: error.message
      };
    }
  }

  // Verify refresh token
  verifyRefreshToken(token) {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret, {
        issuer: 'vibe-code-backend',
        audience: 'vibe-code-frontend'
      });

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return {
        valid: true,
        decoded,
        expired: false
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return {
          valid: false,
          decoded: null,
          expired: true,
          error: 'Refresh token expired'
        };
      }

      securityLogger.invalidToken(token, error.message);
      
      return {
        valid: false,
        decoded: null,
        expired: false,
        error: error.message
      };
    }
  }

  // Generate token pair (access + refresh)
  generateTokenPair(payload) {
    return {
      accessToken: this.generateAccessToken(payload),
      refreshToken: this.generateRefreshToken(payload)
    };
  }

  // Extract token from Authorization header
  extractTokenFromHeader(authHeader) {
    if (!authHeader) {
      return null;
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return null;
    }

    return parts[1];
  }

  // Get token expiry time
  getTokenExpiry(token) {
    try {
      const decoded = jwt.decode(token);
      return decoded?.exp ? new Date(decoded.exp * 1000) : null;
    } catch (error) {
      return null;
    }
  }

  // Check if token is about to expire (within 5 minutes)
  isTokenAboutToExpire(token, thresholdMinutes = 5) {
    const expiry = this.getTokenExpiry(token);
    if (!expiry) return false;

    const now = new Date();
    const threshold = new Date(now.getTime() + (thresholdMinutes * 60 * 1000));

    return expiry <= threshold;
  }

  // Decode token without verification (for debugging)
  decodeToken(token) {
    try {
      return jwt.decode(token, { complete: true });
    } catch (error) {
      return null;
    }
  }

  // Generate secure random token for email verification, password reset, etc.
  generateSecureToken(length = 32) {
    return crypto.randomBytes(length).toString('hex');
  }

  // Hash token for storage
  hashToken(token) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  // Generate API key
  generateApiKey() {
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(16).toString('hex');
    return `vbc_${timestamp}_${randomPart}`;
  }

  // Validate JWT structure without verification
  isValidJWTStructure(token) {
    if (!token || typeof token !== 'string') {
      return false;
    }

    const parts = token.split('.');
    if (parts.length !== 3) {
      return false;
    }

    try {
      // Try to decode each part
      JSON.parse(Buffer.from(parts[0], 'base64').toString());
      JSON.parse(Buffer.from(parts[1], 'base64').toString());
      return true;
    } catch (error) {
      return false;
    }
  }

  // Get user info from token without verification (for logging)
  getUserInfoFromToken(token) {
    try {
      const decoded = jwt.decode(token);
      return {
        id: decoded?.id,
        email: decoded?.email,
        role: decoded?.role,
        type: decoded?.type
      };
    } catch (error) {
      return null;
    }
  }

  // Blacklist token (in a real app, you'd store this in Redis/database)
  static blacklistedTokens = new Set();

  blacklistToken(token) {
    JWTUtils.blacklistedTokens.add(token);
    
    // Clean up expired tokens periodically
    if (JWTUtils.blacklistedTokens.size > 10000) {
      this.cleanupBlacklist();
    }
  }

  isTokenBlacklisted(token) {
    return JWTUtils.blacklistedTokens.has(token);
  }

  cleanupBlacklist() {
    // In production, implement proper cleanup logic
    // For now, clear old tokens if set gets too large
    if (JWTUtils.blacklistedTokens.size > 50000) {
      JWTUtils.blacklistedTokens.clear();
      logger.info('Token blacklist cleared due to size limit');
    }
  }

  // Create signed cookie options
  getCookieOptions(isSecure = process.env.NODE_ENV === 'production') {
    return {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/'
    };
  }
}

export default new JWTUtils(); 