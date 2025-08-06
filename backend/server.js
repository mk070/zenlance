import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss';
import hpp from 'hpp';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

console.log('🔍 Starting server initialization...');

// Load environment variables first
console.log('🔍 Loading environment variables...');
dotenv.config();

console.log('🔍 Environment variables loaded:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- PORT:', process.env.PORT);
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');

let authRoutes, userRoutes, profileRoutes, leadsRoutes, clientsRoutes, invoicesRoutes, quotesRoutes, projectsRoutes, proposalsRoutes, socialRoutes, publicRoutes, testOpenaiRoutes, errorHandler, notFound, logger, testAzureOpenAIConnection, displayStartupSuccess, displayStartupFailure;


try {
  console.log('🔍 Loading route modules...');
  
  // Import routes
  const authModule = await import('./routes/auth.js');
  authRoutes = authModule.default;
  console.log('✅ Auth routes loaded');
  
  const userModule = await import('./routes/user.js');
  userRoutes = userModule.default;
  console.log('✅ User routes loaded');
  
  const profileModule = await import('./routes/profile.js');
  profileRoutes = profileModule.default;
  console.log('✅ Profile routes loaded');
  
  const leadsModule = await import('./routes/leads.js');
  leadsRoutes = leadsModule.default;
  console.log('✅ Leads routes loaded');
  
  const clientsModule = await import('./routes/clients.js');
  clientsRoutes = clientsModule.default;
  console.log('✅ Clients routes loaded');
  
  const invoicesModule = await import('./routes/invoices.js');
  invoicesRoutes = invoicesModule.default;
  console.log('✅ Invoices routes loaded');
  
  const quotesModule = await import('./routes/quotes.js');
  quotesRoutes = quotesModule.default;
  console.log('✅ Quotes routes loaded');
  
  const projectsModule = await import('./routes/projects.js');
  projectsRoutes = projectsModule.default;
  console.log('✅ Projects routes loaded');
  
  const socialModule = await import('./routes/social.js');
  socialRoutes = socialModule.default;
  console.log('✅ Social routes loaded');

  const proposalsModule = await import('./routes/proposals.js');
  proposalsRoutes = proposalsModule.default;
  console.log('✅ Proposals routes loaded');
  
  const publicModule = await import('./routes/public.js');
  publicRoutes = publicModule.default;
  console.log('✅ Public routes loaded');
  
  // Skip test OpenAI routes (not needed in sample mode)
  console.log('⚡ Skipping test OpenAI routes - using sample data mode');

  // const aiModule = await import('./routes/ai.js');
  // aiRoutes = aiModule.default;
  // console.log('✅ AI routes loaded');

  
  // Import middleware
  console.log('🔍 Loading middleware...');
  const errorModule = await import('./middleware/errorMiddleware.js');
  errorHandler = errorModule.default.globalErrorHandler;
  notFound = errorModule.default.notFound;
  console.log('✅ Error middleware loaded');
  
  const loggerModule = await import('./utils/logger.js');
  logger = loggerModule.logger;
  console.log('✅ Logger loaded');
  
  // Skip Azure OpenAI test utility (using sample data)
  console.log('⚡ Skipping Azure OpenAI test utility - using sample data mode');
  
  // Import startup messages
  const startupModule = await import('./utils/startupMessage.js');
  displayStartupSuccess = startupModule.displayStartupSuccess;
  displayStartupFailure = startupModule.displayStartupFailure;
  console.log('✅ Startup message utility loaded');
  
} catch (error) {
  console.error('❌ Error loading modules:', error);
  console.error('Error details:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

console.log('🔍 Creating Express app...');
const app = express();
const PORT = process.env.PORT || 5000;

try {
  // Trust proxy (important for rate limiting behind reverse proxies)
  app.set('trust proxy', 1);

  // Security Middleware
  console.log('🔍 Setting up security middleware...');
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false
  }));

  // CORS Configuration
  console.log('🔍 Setting up CORS...');
  const corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'];
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
  };

  app.use(cors(corsOptions));

  // Rate Limiting
  console.log('🔍 Setting up rate limiting...');
  const limiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Increased from 100 to 1000
    message: {
      error: 'Too many requests from this IP, please try again later.',
      resetTime: new Date(Date.now() + (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000))
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  app.use('/api/', limiter);

  // Body parsing middleware
  console.log('🔍 Setting up body parsing...');
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Data sanitization against XSS
  app.use((req, res, next) => {
    if (req.body) {
      Object.keys(req.body).forEach(key => {
        if (typeof req.body[key] === 'string') {
          req.body[key] = xss(req.body[key]);
        }
      });
    }
    next();
  });

  // Prevent parameter pollution
  app.use(hpp());

  // Compression middleware
  app.use(compression());

  // Logging
  console.log('🔍 Setting up request logging...');
  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  } else {
    app.use(morgan('combined', {
      stream: {
        write: (message) => logger.info(message.trim())
      }
    }));
  }

} catch (error) {
  console.error('❌ Error setting up middleware:', error);
  console.error('Error details:', error.message);
  process.exit(1);
}

// Database Connection
const connectDB = async () => {
  try {
    console.log('🔍 Connecting to MongoDB...');
    console.log('MongoDB URI:', process.env.MONGODB_URI);
    
    const mongoURI = process.env.NODE_ENV === 'production' 
      ? process.env.MONGODB_URI_PROD 
      : process.env.MONGODB_URI;

    if (!mongoURI) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }

    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferCommands: false,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('❌ Database connection error:', error);
    console.error('Error details:', error.message);
    logger.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

// Connect to database
console.log('🔍 Initializing database connection...');
await connectDB();

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'FreelanceHub API is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API Routes
console.log('🔍 Setting up API routes...');
try {
  app.use('/api/auth', authRoutes);
  console.log('✅ Auth routes mounted');
  
  app.use('/api/users', userRoutes);
  console.log('✅ User routes mounted');
  
  app.use('/api/profile', profileRoutes);
  console.log('✅ Profile routes mounted');
  
  app.use('/api/leads', leadsRoutes);
  console.log('✅ Leads routes mounted');
  
  app.use('/api/clients', clientsRoutes);
  console.log('✅ Clients routes mounted');
  
  app.use('/api/invoices', invoicesRoutes);
  console.log('✅ Invoices routes mounted');
  
  app.use('/api/quotes', quotesRoutes);
  console.log('✅ Quotes routes mounted');
  
  app.use('/api/projects', projectsRoutes);
  console.log('✅ Projects routes mounted');
  
  app.use('/api/proposals', proposalsRoutes);
  console.log('✅ Proposals routes mounted');
  
  app.use('/api/social', socialRoutes);
  console.log('✅ Social routes mounted');
  
  // Public routes (no authentication required)
  app.use('/api/public', publicRoutes);
  console.log('✅ Public routes mounted');

  // app.use('/api/ai', aiRoutes);
  // console.log('✅ AI routes mounted');

} catch (error) {
  console.error('❌ Error mounting routes:', error);
  console.error('Error details:', error.message);
  process.exit(1);
}

// Handle 404
app.use(notFound);

// Error handling middleware
app.use(errorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔍 SIGTERM received. Shutting down gracefully...');
  logger.info('SIGTERM received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Process terminated');
      mongoose.connection.close(false, () => {
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  console.log('🔍 SIGINT received. Shutting down gracefully...');
  logger.info('SIGINT received. Shutting down gracefully...');
  if (server) {
    server.close(() => {
      logger.info('Process terminated');
      mongoose.connection.close(false, () => {
        process.exit(0);
      });
    });
  } else {
    process.exit(0);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  console.error('Stack trace:', err.stack);
  logger.error('Uncaught Exception: ', err);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err);
  console.error('Stack trace:', err.stack);
  logger.error('Unhandled Rejection: ', err);
  process.exit(1);
});

// Start server function (no OpenAI testing)
async function startServer() {
  try {
    console.log('⚡ Starting server in sample data mode (no OpenAI API required)...');
    console.log('🔍 Starting server...');
    const server = app.listen(PORT, () => {
      console.log(`✅ Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log('⚡ Using sample proposal data - no OpenAI API connection needed');
      logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      
      // Display success message
      displayStartupSuccess();
    });

    return server;
  } catch (error) {
    displayStartupFailure(`Server failed to start: ${error.message}`);
    process.exit(1);
  }
}

// Start the server
let server;
try {
  server = await startServer();
} catch (error) {
  if (displayStartupFailure) {
    displayStartupFailure(`Server failed to start: ${error.message}`);
  } else {
    console.log('❌ CRITICAL: Server failed to start:', error.message);
  }
  process.exit(1);
}

export default app; 