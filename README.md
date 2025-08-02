# Vibe Code - Complete SaaS Platform

A complete, production-ready SaaS platform built with MongoDB backend and React frontend, featuring comprehensive authentication, user management, and business profile systems.

## 🌟 Features

### Backend (Node.js + MongoDB)
- **Complete Authentication System**
  - Email/password registration and login
  - OTP-based email verification
  - Password reset functionality
  - JWT access and refresh tokens
  - Account lockout protection
  - Comprehensive rate limiting

- **Security & Production Ready**
  - bcrypt password hashing (12 rounds)
  - JWT token management with blacklisting
  - Request validation and sanitization
  - CORS protection and security headers
  - XSS and injection protection
  - Comprehensive logging with Winston
  - Error handling and monitoring

- **User & Profile Management**
  - User profiles with business information
  - Settings and preferences management
  - Account management and session control
  - Onboarding flow tracking
  - Analytics and completion scoring

### Frontend (React + Vite + Tailwind)
- **Modern UI/UX** [[memory:4974191]]
  - Apple-inspired premium dark theme design system
  - Black backgrounds with subtle gradients
  - Glassmorphism effects with backdrop-blur
  - White buttons with black text
  - Light font weights (300) and navy blue accents
  - Smooth animations with framer-motion
  - Responsive design and professional typography

- **Complete Auth Flow**
  - Sign up with business information
  - Email verification with OTP
  - Sign in with error handling
  - Password reset functionality
  - Protected routes and session management

- **Business Profile System**
  - Comprehensive business information forms
  - Onboarding flow with progress tracking
  - Settings and preferences management
  - Analytics dashboard

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or cloud instance like MongoDB Atlas)
- Git

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and other settings
   ```

   **Required Environment Variables:**
   ```env
   MONGODB_URI=mongodb://localhost:27017/vibe-code-dev
   JWT_SECRET=your-super-secure-jwt-secret-key
   JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key
   EMAIL_HOST=smtp.gmail.com  # For production
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   ```

4. **Start MongoDB**
   ```bash
   # If using local MongoDB
   mongod
   
   # Or use MongoDB Atlas cloud connection
   ```

5. **Run the backend**
   ```bash
   npm run dev  # Development with auto-restart
   # or
   npm start    # Production
   ```

   Backend will be running on http://localhost:5000

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd forntend  # Note: directory name has typo, kept for compatibility
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure API URL (optional)**
   ```bash
   # Create .env file
   echo "VITE_API_URL=http://localhost:5000/api" > .env
   ```

4. **Run the frontend**
   ```bash
   npm run dev
   ```

   Frontend will be running on http://localhost:5173

## 📁 Project Structure

```
vibe-code/
├── backend/                 # Node.js/Express/MongoDB backend
│   ├── models/             # MongoDB models (User, Profile)
│   ├── routes/             # API route handlers
│   ├── middleware/         # Authentication & security middleware
│   ├── utils/              # Utilities (JWT, email, logging)
│   ├── server.js           # Main server file
│   └── package.json        # Backend dependencies
│
├── forntend/               # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth)
│   │   ├── lib/            # API client and utilities
│   │   └── hooks/          # Custom React hooks
│   ├── index.html
│   └── package.json        # Frontend dependencies
│
└── README.md               # This file
```

## 🔐 Authentication Flow

1. **Sign Up**: User registers with email, password, and business information
2. **Email Verification**: OTP sent to email for verification
3. **Sign In**: User logs in with email/password
4. **JWT Tokens**: Access token (15min) + Refresh token (7 days)
5. **Auto Refresh**: Automatic token refresh for seamless experience
6. **Security**: Rate limiting, account lockout, comprehensive logging

## 🎨 Design System [[memory:4974191]]

The frontend uses a premium Apple-inspired dark theme:

- **Colors**: Black backgrounds, white text, navy blue accents
- **Typography**: Light font weights (300), clean sans-serif
- **Effects**: Glassmorphism with backdrop-blur, subtle gradients
- **Animations**: Smooth transitions with framer-motion
- **Layout**: Generous spacing, clean layouts, professional appearance

## 📚 API Documentation

### Authentication Endpoints

```bash
POST /api/auth/signup          # Register new user
POST /api/auth/signin          # User login
POST /api/auth/verify-otp      # Verify email with OTP
POST /api/auth/resend-otp      # Resend verification code
POST /api/auth/forgot-password # Request password reset
POST /api/auth/reset-password  # Reset password with token
POST /api/auth/refresh-token   # Refresh access token
POST /api/auth/logout          # Logout user
```

### User & Profile Endpoints

```bash
GET  /api/user/me              # Get current user
PATCH /api/user/preferences    # Update user preferences
PATCH /api/user/change-password # Change password

GET  /api/profile/me           # Get user profile
PATCH /api/profile/me          # Update profile
GET  /api/profile/onboarding   # Get onboarding status
PATCH /api/profile/onboarding/:step # Complete onboarding step
```

### Request Format

All authenticated requests require Bearer token:

```bash
Authorization: Bearer <access_token>
```

### Response Format

```json
{
  "success": true,
  "message": "Operation successful",
  "data": { ... }
}
```

## 🛠️ Development

### Backend Development

```bash
cd backend
npm run dev      # Start with nodemon (auto-restart)
npm run lint     # Run ESLint
npm run format   # Format code with Prettier
```

### Frontend Development

```bash
cd forntend
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🔧 Configuration

### Email Service

**Development**: Automatically uses Ethereal test email service

**Production**: Configure with real email provider:
```env
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

### Database

**Local Development**:
```env
MONGODB_URI=mongodb://localhost:27017/vibe-code-dev
```

**Production** (MongoDB Atlas):
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/vibe-code-prod
```

### Security

- Generate strong JWT secrets for production
- Use environment variables for all sensitive data
- Enable HTTPS in production
- Configure proper CORS origins
- Set up monitoring and logging

## 🚀 Deployment

### Backend Deployment

1. Set `NODE_ENV=production`
2. Configure production MongoDB URI
3. Set strong JWT secrets
4. Configure email service
5. Set up SSL/HTTPS
6. Configure logging directory permissions

### Frontend Deployment

1. Build the frontend: `npm run build`
2. Deploy to static hosting (Vercel, Netlify, etc.)
3. Update `VITE_API_URL` to production backend URL

### Docker Support

Backend includes Docker support:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

## 🔍 Health Check

Check if the backend is running:

```bash
GET /api/health
```

Response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "environment": "development",
  "version": "1.0.0"
}
```

## 🔒 Security Features

- **Password Security**: bcrypt hashing with 12 rounds
- **JWT Management**: Access/refresh token system with blacklisting
- **Rate Limiting**: Per-endpoint rate limiting (auth: 10/15min, OTP: 3/5min)
- **Account Protection**: Lockout after failed login attempts
- **Input Validation**: Comprehensive request validation
- **Security Headers**: CORS, XSS protection, content type validation
- **Logging**: Complete audit trail of security events
- **Error Handling**: Sanitized error responses

## 📊 Monitoring & Logging

### Backend Logging

- **Development**: Console logging with colors
- **Production**: File logging with rotation
- **Security Events**: Separate security event logging
- **Error Tracking**: Comprehensive error logging with context

Log files (production):
- `logs/combined.log` - All application logs
- `logs/error.log` - Error logs only
- `logs/exceptions.log` - Uncaught exceptions
- `logs/rejections.log` - Unhandled promise rejections

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Follow the established code structure
4. Add comprehensive error handling
5. Include validation for all inputs
6. Add logging for important events
7. Write tests for new functionality
8. Update documentation

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For support, email support@vibecore.com or create an issue in the repository.

---

**Built with ❤️ using Node.js, MongoDB, React, and modern web technologies.** 