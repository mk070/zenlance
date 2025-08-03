# 🚀 FreelanceHub - Production Setup Guide

## Quick Start

### Option 1: Using Batch File (Windows)
```bash
./start-dev.bat
```

### Option 2: Manual Start
```bash
# Install all dependencies
npm run install:all

# Start both servers
npm run dev
```

### Option 3: Individual Servers
```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend  
cd forntend
npm run dev
```

## 🌐 Server URLs
- **Backend API**: http://localhost:5000
- **Frontend App**: http://localhost:5173

## 🔧 Troubleshooting

### 1. Connection Refused Error
```
POST http://localhost:5000/api/clients net::ERR_CONNECTION_REFUSED
```

**Solution:**
- Ensure backend server is running on port 5000
- Check if another process is using port 5000
- Restart backend server: `cd backend && npm run dev`

### 2. Authentication Required Error
```
401 Unauthorized - Authentication required
```

**Solution:**
- Make sure you're signed in to the application
- Check if your session has expired
- Sign out and sign back in
- Clear browser localStorage if needed

### 3. Validation Errors
```
400 Bad Request - Validation failed
```

**Common fixes:**
- Phone numbers must be at least 3 characters
- Email must be valid format
- Required fields must not be empty

### 4. Port Already in Use
```
EADDRINUSE: address already in use :::5000
```

**Solution:**
```bash
# Kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID_NUMBER> /F

# Or use different ports in .env files
```

## 📦 Production Build

### Build Frontend
```bash
cd forntend
npm run build
```

### Start Production Servers
```bash
npm run start
```

## 🔐 Environment Variables

### Backend (.env)
```
NODE_ENV=production
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
JWT_REFRESH_SECRET=your_refresh_secret
EMAIL_SERVICE=your_email_service
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
```

## 📝 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both servers in development |
| `npm run dev:backend` | Start only backend server |
| `npm run dev:frontend` | Start only frontend server |
| `npm run build` | Build frontend for production |
| `npm run start` | Start production servers |
| `npm run install:all` | Install all dependencies |

## 🐛 Common Issues

### Phone Validation Fixed
- **Issue**: Phone numbers with less than 10 characters were rejected
- **Fix**: Now accepts phone numbers with 3+ characters
- **Applies to**: Both Leads and Clients

### Authentication Flow
1. User signs up → Email verification required
2. User signs in → JWT tokens stored in localStorage
3. API requests include Authorization header
4. Tokens auto-refresh when expired

### Database Connection
- Ensure MongoDB is running
- Check connection string in backend/.env
- Verify network connectivity

## 📊 Health Check
Test if backend is running:
```bash
curl http://localhost:5000/api/health
```

Expected response:
```json
{
  "success": true,
  "message": "FreelanceHub API is healthy",
  "timestamp": "2025-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## 🔒 Security Notes

### For Production:
- Use strong JWT secrets
- Enable HTTPS
- Set secure headers
- Use environment variables for sensitive data
- Enable CORS for specific domains only

### Development:
- Email verification is temporarily disabled
- CORS allows all origins
- Detailed error messages shown 