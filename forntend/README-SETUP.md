# Frontend Setup Guide

## Quick Setup Steps

### 1. Database Setup (Backend)
1. **Make sure your MongoDB backend is running** (see backend README)
2. **The backend handles all authentication and user management**

### 2. Frontend Environment
Create `.env` file in the `forntend` directory:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

### 3. Install Dependencies
```bash
cd forntend
npm install
```

### 4. Start Development Server
```bash
npm run dev
```

Your app will be available at `http://localhost:5173`

## Testing Authentication

### Test User Registration
1. Go to `http://localhost:5173/signup`
2. Fill in email and password
3. Check your email for OTP
4. Verify OTP at `/verify-otp`
5. Complete business setup
6. Access dashboard

### Test User Login
1. Go to `http://localhost:5173/signin`
2. Use registered email/password
3. Access dashboard directly

## Common Issues & Solutions

### Frontend won't start
**Cause**: Missing dependencies or wrong Node.js version
**Solution**: 
```bash
rm -rf node_modules package-lock.json
npm install
```

### API calls failing
**Cause**: Backend not running or wrong API URL
**Solution**: 
1. Make sure backend is running on port 5000
2. Check `VITE_API_BASE_URL` in `.env`

### Authentication not working  
**Cause**: Backend authentication service issues
**Solution**: Check backend logs and ensure MongoDB is connected

## Environment Variables

```env
# Required
VITE_API_BASE_URL=http://localhost:5000/api

# Optional (for different environments)
VITE_APP_NAME=Vibe Code
VITE_APP_VERSION=1.0.0
```

## Development Tips

1. **Hot Reload**: Changes are automatically reflected
2. **Console Errors**: Check browser dev tools for detailed errors
3. **Network Tab**: Monitor API calls and responses
4. **Component Tree**: Use React DevTools for debugging

## Production Build

```bash
# Build for production
npm run build

# Preview production build
npm run preview

# Deploy the `dist` folder to your hosting service
```

## File Structure
```
forntend/
├── src/
│   ├── components/     # Reusable components
│   ├── contexts/       # React contexts
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utilities and API client
│   ├── pages/         # Page components
│   └── main.jsx       # App entry point
├── public/            # Static assets
└── package.json       # Dependencies
``` 