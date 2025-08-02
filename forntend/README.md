# Vibe Code Frontend

A modern, production-ready React application with **enterprise-grade authentication** powered by custom Node.js/MongoDB backend. Features beautiful UI, comprehensive user management, and advanced security.

## ✨ Features

### 🔐 Authentication & Security
- **Email/Password Authentication** with OTP verification
- **Password Reset** functionality
- **Account Security** with login attempt tracking
- **JWT Token Management** with refresh tokens
- **Protected Routes** and role-based access
- **Input Validation** and sanitization

### 🎨 UI/UX Excellence
- **Apple-Inspired Design** with dark theme
- **Glassmorphism Effects** and smooth animations
- **Responsive Design** for all devices
- **Framer Motion** animations
- **Tailwind CSS** for styling
- **Toast Notifications** for user feedback

### 📱 Pages & Components
- **Authentication Pages**: Sign In, Sign Up, OTP Verification
- **Business Setup**: Onboarding wizard
- **Dashboard**: Main application interface
- **Protected Routes**: Secure navigation
- **Reusable Components**: Button, Input, Card, Background

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Running MongoDB backend (see backend README)

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables
Create `.env` file:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── ProtectedRoute.jsx      # Route protection
│   └── ui/                     # Reusable UI components
├── contexts/
│   └── AuthContext.jsx         # Authentication state
├── hooks/
│   └── useAuth.js             # Authentication hook
├── lib/
│   ├── api-client.js          # Backend API client
│   └── utils.js               # Utility functions
├── pages/
│   ├── SignIn.jsx             # Sign in page
│   ├── SignUp.jsx             # Sign up page
│   ├── VerifyOTP.jsx          # OTP verification
│   ├── BusinessSetup.jsx      # Onboarding
│   └── Dashboard.jsx          # Main dashboard
└── main.jsx                   # App entry point
```

## 🔧 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

## 🎯 Authentication Flow

1. **Sign Up**: Email/password → OTP verification → Business setup
2. **Sign In**: Email/password → Dashboard (if verified)
3. **OTP Verification**: 6-digit code sent to email
4. **Password Reset**: Email link with secure token
5. **Protected Routes**: JWT token validation

## 🎨 Design System

### Colors
- **Primary**: Black (#000000)
- **Secondary**: White (#FFFFFF)  
- **Accent**: Navy Blue (#1e40af)
- **Background**: Black with subtle gradients

### Typography
- **Font**: Inter (clean, modern)
- **Weights**: 300 (light), 400 (normal), 500 (medium), 600 (semibold)

### Components
- **Glassmorphism**: `backdrop-blur-xl` with subtle borders
- **Buttons**: White background, black text, hover effects
- **Cards**: Dark background with glass effects
- **Animations**: Smooth transitions with Framer Motion

## 🔐 Security Features

- **JWT Token Management**: Automatic refresh and storage
- **Protected Routes**: Authentication-based navigation
- **Input Validation**: Client-side and server-side validation
- **Error Handling**: Comprehensive error management
- **Rate Limiting**: API request throttling
- **Secure Storage**: Safe token handling

## 📦 Key Dependencies

- **React 18**: Modern React with hooks
- **React Router**: Client-side routing
- **Framer Motion**: Smooth animations
- **Tailwind CSS**: Utility-first styling
- **React Hot Toast**: Beautiful notifications
- **Lucide React**: Modern icons

## 🚀 Production Deployment

```bash
# Build for production
npm run build

# Preview build locally
npm run preview
```

## 📖 API Integration

The frontend communicates with a custom Node.js/Express/MongoDB backend:

- **Authentication**: `/api/auth/*`
- **User Management**: `/api/user/*`
- **Profile Management**: `/api/profile/*`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- **React Team** for the amazing framework
- **Tailwind CSS** for the utility-first approach
- **Framer Motion** for smooth animations
- **Vite** for blazing fast development 