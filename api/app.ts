/**
 * This is a API server
 */

import express, {
  type Request,
  type Response,
  type NextFunction,
} from 'express'
import cors from 'cors'
import session from 'express-session'
import MongoStore from 'connect-mongo'
import passport from 'passport'
import { Strategy as GoogleStrategy } from 'passport-google-oauth20'
import logger from './utils/logger.js'

import authRoutes from './routes/auth.js'
import vmRoutes from './routes/vms.js'
import environmentRoutes from './routes/environments.js'
import executionRoutes from './routes/execution.js'

// for esm mode
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = path.dirname(__filename)

const app: express.Application = express()

// Trust proxy (required for Nginx/Cloudflare and secure cookies)
app.set('trust proxy', true);

console.log('>>> App Initializing with FRONTEND_URL:', process.env.FRONTEND_URL);

app.use((req, res, next) => {
  // Debug headers for session troubleshooting
  if (req.url.includes('/auth/me')) {
    logger.info(`Session Debug [${req.method} ${req.url}]:`);
    logger.info(`- Proto: ${req.protocol}`);
    logger.info(`- Secure: ${req.secure}`);
    logger.info(`- Cookies: ${req.headers.cookie ? 'Present' : 'None'}`);
    logger.info(`- X-Forwarded-Proto: ${req.headers['x-forwarded-proto']}`);
  }
  next();
});

app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:7001',
    'http://localhost:5173' // Keep local dev
  ],
  credentials: true
}))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// Session config
app.use(session({
  proxy: true, // Required for secure cookies behind a proxy
  secret: process.env.SESSION_SECRET || 'keyboard cat',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.mongo || 'mongodb://localhost:27017/sshclient', // Fallback for safety
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60, // = 14 days. Default
    touchAfter: 24 * 3600 // time period in seconds: 24 hours
  }),
  cookie: { 
    secure: process.env.NODE_ENV === 'production' || !!process.env.FRONTEND_URL?.startsWith('https'),
    maxAge: 1000 * 60 * 60 * 24 * 14, // 14 days
    sameSite: 'lax' // Lax is much more stable than 'none' for same-domain setups
  }
}));

// Passport config
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: Express.User, done) => {
  done(null, user);
});

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    // Use the public-facing URL for the callback
    callbackURL: process.env.GOOGLE_CALLBACK_URL || "/api/auth/google/callback"
  },
  (accessToken, refreshToken, profile, done) => {
    // In a real app, you'd save user to DB here
    return done(null, profile);
  }));
} else {
  console.warn("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET not set. OAuth will not work.");
}

/**
 * API Routes
 */
app.use('/api/auth', authRoutes)
app.use('/api/vms', vmRoutes)
app.use('/api/environments', environmentRoutes)
app.use('/api/execute', executionRoutes)

/**
 * health
 */
app.use(
  '/api/health',
  (req: Request, res: Response): void => {
    res.status(200).json({
      success: true,
      message: 'ok',
    })
  },
)

/**
 * error handler middleware
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((error: Error, req: Request, res: Response, _next: NextFunction) => {
  res.status(500).json({
    success: false,
    error: 'Server internal error',
  })
})

/**
 * 404 handler
 */
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API not found',
  })
})

export default app
