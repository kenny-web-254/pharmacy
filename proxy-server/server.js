import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'
import mpesaRoutes from './routes/mpesa.js'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())

// CORS configuration
const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',')
app.use(cors({
  origin: allowedOrigins,
  credentials: true,
}))

// Body parser middleware
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
})

app.use(limiter)

// Routes
app.use('/api/mpesa', mpesaRoutes)

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' })
})

app.listen(PORT, () => {
  console.log(`PharmacyOS Proxy Server running on http://localhost:${PORT}`)
  console.log(`Environment: ${process.env.MPESA_ENVIRONMENT || 'sandbox'}`)
})

export default app
