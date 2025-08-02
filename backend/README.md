# Vibe Code Backend

Complete Node.js/Express backend with MongoDB for the Vibe Code SaaS platform.

## Features

- **Complete Authentication System**
  - Email/password registration and login
  - OTP-based email verification
  - Password reset functionality
  - JWT access and refresh tokens
  - Account lockout protection
  - Rate limiting

- **Security**
  - bcrypt password hashing
  - JWT token management
  - Request validation and sanitization
  - CORS protection
  - Security headers
  - XSS and injection protection
  - Comprehensive logging

- **User Management**
  - User profiles with business information
  - Settings and preferences
  - Account management
  - Session management

- **Production Ready**
  - Comprehensive error handling
  - Request/response logging
  - Environment-based configuration
  - Database optimization with indexes
  - Email service with templates

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MongoDB (local or cloud instance)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd vibe-code/backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or update MONGODB_URI in .env for cloud MongoDB
   ```

5. **Run the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

The server will start on http://localhost:5000

## Environment Variables

### Required Variables

```env
MONGODB_URI=mongodb://localhost:27017/vibe-code-dev
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
```

### Email Configuration

For production, configure a real email service:

```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

For development, the system will automatically use Ethereal (test email service).

### Optional Variables

See `.env.example` for all available configuration options.

## API Documentation

### Authentication Endpoints

#### POST /api/auth/signup
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "businessName": "Acme Corp",
  "businessType": "startup",
  "industry": "Technology"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Account created successfully. Please check your email for the verification code.",
  "userId": "user_id",
  "emailSent": true
}
```

#### POST /api/auth/signin
Sign in with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user_id",
    "email": "user@example.com",
    "role": "user",
    "isEmailVerified": true,
    "profile": { ... }
  },
  "tokens": {
    "accessToken": "jwt_access_token",
    "refreshToken": "jwt_refresh_token",
    "expiresIn": "15m"
  }
}
```

#### POST /api/auth/verify-otp
Verify email with OTP code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

#### POST /api/auth/refresh-token
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

#### POST /api/auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

#### POST /api/auth/reset-password
Reset password with token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "NewSecurePass123!"
}
```

### User Endpoints

All user endpoints require authentication (Bearer token in Authorization header).

#### GET /api/user/me
Get current user information.

#### PATCH /api/user/preferences
Update user preferences.

#### PATCH /api/user/change-password
Change user password.

### Profile Endpoints

#### GET /api/profile/me
Get user profile.

#### PATCH /api/profile/me
Update user profile.

#### GET /api/profile/onboarding
Get onboarding status.

## Authentication

Include the JWT access token in the Authorization header:

```
Authorization: Bearer <access_token>
```

## Error Handling

All endpoints return standardized error responses:

```json
{
  "success": false,
  "error": "Error message",
  "validationErrors": [
    {
      "field": "email",
      "message": "Please provide a valid email address",
      "value": "invalid-email"
    }
  ]
}
```

## Rate Limiting

- Authentication endpoints: 10 requests per 15 minutes per IP
- OTP requests: 3 requests per 5 minutes per IP+email
- Password reset: 3 requests per 10 minutes per IP+email
- General API: 100 requests per 15 minutes per IP

## Security Features

- Password hashing with bcrypt (12 rounds)
- JWT tokens with configurable expiration
- Account lockout after failed login attempts
- Rate limiting on sensitive endpoints
- Request validation and sanitization
- Security headers (CORS, XSS protection, etc.)
- Comprehensive logging of security events

## Database Schema

### User Model
- Email, password, verification status
- Login attempts and account lockout
- JWT refresh tokens
- User preferences and analytics

### Profile Model
- Personal and business information
- Onboarding status and settings
- Subscription and analytics data

## Logging

The application uses Winston for logging:

- **Development**: Console logging with colors
- **Production**: File logging with rotation
- **Security events**: Separate security log
- **Request/response**: HTTP request logging

Log files (production):
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

## Development

### Scripts

```bash
npm run dev      # Start with nodemon (auto-restart)
npm start        # Start production server
npm test         # Run tests
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

### Adding New Routes

1. Create route file in `routes/`
2. Add validation middleware
3. Implement route handlers with `catchAsync`
4. Add route to `server.js`
5. Update API documentation

### Database Queries

Use MongoDB indexes for performance:
- User: email, createdAt
- Profile: userId, businessName, industry
- Performance monitoring for slow queries

## Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set strong JWT secrets
4. Configure email service (SendGrid, Mailgun, etc.)
5. Set up proper logging directory permissions

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

### Health Check

The server provides a health check endpoint:

```
GET /api/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "production",
  "version": "1.0.0"
}
```

## Contributing

1. Follow the established code structure
2. Add comprehensive error handling
3. Include validation for all inputs
4. Add logging for important events
5. Write tests for new functionality
6. Update API documentation

## License

MIT License - see LICENSE file for details 