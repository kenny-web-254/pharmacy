import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'

const app = express()
const PORT = process.env.PORT || 3001

// Security middleware
app.use(helmet())

// CORS configuration - configure allowed origins in environment
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'PharmacyOS Proxy Server',
    version: '1.0.0',
    status: 'running',
    endpoints: ['/health'],
  })
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
})

export default app
