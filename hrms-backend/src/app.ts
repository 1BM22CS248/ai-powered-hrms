import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import rateLimit, { ipKeyGenerator } from 'express-rate-limit'
import authRoutes from './routes/auth.routes'
import employeeRoutes from './routes/employees.routes'
import attendanceRoutes from './routes/attendance.routes'
import leaveRoutes from './routes/leave.routes'
import payrollRoutes from './routes/payroll.routes'
import reportsRoutes from './routes/reports.routes'
import { aiRoutes } from './routes/ai.routes'
import onboardingRoutes from './routes/onboarding.routes'
import notificationsRoutes from './routes/notifications.routes'
import helpdeskRoutes from './routes/helpdesk.routes'
import recruitmentRoutes from './routes/recruitment.routes'
import performanceRoutes from './routes/performance.routes'
import auditLogRoutes from './routes/auditlog.routes'
import { errorHandler } from './utils/errors'

const app = express()

// ─── CORS ───────────────────────────────────────────────────────────────────
const allowedOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map(o => o.trim())

app.use(cors({
  origin: (origin, cb) => {
    // Allow same-origin requests (no Origin header) and whitelisted origins
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true)
    cb(new Error(`CORS: origin ${origin} not allowed`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}))

// ─── Body parsing ────────────────────────────────────────────────────────────
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

// ─── Rate Limiting (H-8) ─────────────────────────────────────────────────────
const loginLimiter = rateLimit({
  windowMs: 60 * 1000,   // 1 minute
  max: 5,
  message: { success: false, error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => (req.headers.authorization as string | undefined) ?? ipKeyGenerator(req.ip ?? ''),
  message: { success: false, error: 'AI rate limit exceeded, please wait.' },
  standardHeaders: true,
  legacyHeaders: false,
})

const generalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
})

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV })
})

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth/login',   loginLimiter)
app.use('/api/ai',           aiLimiter)
app.use('/api',              generalLimiter)

app.use('/api/auth',          authRoutes)
app.use('/api/employees',     employeeRoutes)
app.use('/api/attendance',    attendanceRoutes)
app.use('/api/leave',         leaveRoutes)
app.use('/api/payroll',       payrollRoutes)
app.use('/api/reports',       reportsRoutes)
app.use('/api/ai',            aiRoutes)
app.use('/api/onboarding',    onboardingRoutes)
app.use('/api/notifications', notificationsRoutes)
app.use('/api/helpdesk',      helpdeskRoutes)
app.use('/api/recruitment',   recruitmentRoutes)
app.use('/api/performance',   performanceRoutes)
app.use('/api/audit',         auditLogRoutes)

app.use(errorHandler)

if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT ?? 4000
  app.listen(PORT, () => console.log(`HRMS server running on port ${PORT}`))
}

export default app
