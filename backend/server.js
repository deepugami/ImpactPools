import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

// Create Express application
const app = express()
const PORT = process.env.PORT || 3001

/**
 * In-memory storage for pools
 * Starts empty - pools are created through real transactions only
 * In production, this would be replaced with a proper database
 */
let pools = []

// Middleware setup
app.use(helmet()) // Security headers
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Allow all localhost ports for development
    if (origin.match(/^http:\/\/localhost:\d+$/)) {
      return callback(null, true);
    }
    
    // Allow specific production origins
    const allowedOrigins = [
      'http://localhost:3000',
      'https://your-production-domain.com' // Add your production domain here
    ];
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
})) // Enable CORS for all localhost ports
app.use(morgan('combined')) // Request logging
app.use(express.json({ limit: '10mb' })) // Parse JSON bodies
app.use(express.urlencoded({ extended: true })) // Parse URL-encoded bodies

/**
 * Health check endpoint
 * Useful for deployment monitoring and basic server status
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  })
})

/**
 * API Routes
 */

/**
 * GET /api/pools
 * Retrieve all available ImpactPools
 * 
 * Returns: Array of pool objects with all their details
 */
app.get('/api/pools', (req, res) => {
  try {
    // Return all pools sorted by creation date (newest first)
    const sortedPools = pools.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    )
    
    res.status(200).json(sortedPools)
  } catch (error) {
    console.error('Error fetching pools:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch pools'
    })
  }
})

/**
 * GET /api/pools/:id
 * Retrieve a specific pool by ID
 * 
 * Params:
 *   - id: Pool identifier
 * 
 * Returns: Pool object or 404 if not found
 */
app.get('/api/pools/:id', (req, res) => {
  try {
    const { id } = req.params
    const pool = pools.find(p => p.id === id)
    
    if (!pool) {
      return res.status(404).json({
        error: 'Pool not found',
        message: `No pool found with ID: ${id}`
      })
    }
    
    res.status(200).json(pool)
  } catch (error) {
    console.error('Error fetching pool:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to fetch pool'
    })
  }
})

/**
 * POST /api/pools
 * Create a new ImpactPool
 * 
 * Body: Pool object with all required fields
 * 
 * Returns: Created pool object with generated ID
 */
app.post('/api/pools', (req, res) => {
  try {
    const poolData = req.body
    
    // Basic validation
    if (!poolData.name || !poolData.charity || !poolData.assets || !poolData.creator) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'Pool must have name, charity, assets, and creator'
      })
    }
    
    // Validate donation percentage
    if (poolData.donationPercentage < 1 || poolData.donationPercentage > 50) {
      return res.status(400).json({
        error: 'Invalid donation percentage',
        message: 'Donation percentage must be between 1% and 50%'
      })
    }
    
    // Validate assets array
    if (!Array.isArray(poolData.assets) || poolData.assets.length === 0) {
      return res.status(400).json({
        error: 'Invalid assets',
        message: 'Assets must be a non-empty array'
      })
    }
    
    // Add the new pool to our storage
    pools.push(poolData)
    
    console.log(`New pool created: ${poolData.name} by ${poolData.creator}`)
    
    res.status(201).json(poolData)
  } catch (error) {
    console.error('Error creating pool:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to create pool'
    })
  }
})

/**
 * PUT /api/pools/:id
 * Update an existing pool (for deposits, withdrawals, etc.)
 * 
 * Params:
 *   - id: Pool identifier
 * Body: Updated pool object
 * 
 * Returns: Updated pool object
 */
app.put('/api/pools/:id', (req, res) => {
  try {
    const { id } = req.params
    const updatedPoolData = req.body
    
    // Find the pool index
    const poolIndex = pools.findIndex(p => p.id === id)
    
    if (poolIndex === -1) {
      return res.status(404).json({
        error: 'Pool not found',
        message: `No pool found with ID: ${id}`
      })
    }
    
    // Update the pool
    pools[poolIndex] = {
      ...pools[poolIndex],
      ...updatedPoolData,
      id: id // Ensure ID doesn't change
    }
    
    console.log(`Pool updated: ${id}`)
    
    res.status(200).json(pools[poolIndex])
  } catch (error) {
    console.error('Error updating pool:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to update pool'
    })
  }
})

/**
 * DELETE /api/pools/:id
 * Delete a pool (creator only in production)
 * 
 * Params:
 *   - id: Pool identifier
 * 
 * Returns: Success message
 */
app.delete('/api/pools/:id', (req, res) => {
  try {
    const { id } = req.params
    
    const poolIndex = pools.findIndex(p => p.id === id)
    
    if (poolIndex === -1) {
      return res.status(404).json({
        error: 'Pool not found',
        message: `No pool found with ID: ${id}`
      })
    }
    
    // Remove the pool
    const deletedPool = pools.splice(poolIndex, 1)[0]
    
    console.log(`Pool deleted: ${deletedPool.name}`)
    
    res.status(200).json({
      success: true,
      message: 'Pool deleted successfully',
      deletedPool: deletedPool
    })
  } catch (error) {
    console.error('Error deleting pool:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to delete pool'
    })
  }
})

/**
 * GET /api/stats
 * Get platform-wide statistics
 * 
 * Returns: Aggregated statistics across all pools
 */
app.get('/api/stats', (req, res) => {
  try {
    const stats = {
      totalPools: pools.length,
      totalValueLocked: pools.reduce((sum, pool) => sum + pool.totalDeposited, 0),
      totalDonated: pools.reduce((sum, pool) => sum + pool.totalDonated, 0),
      totalParticipants: pools.reduce((sum, pool) => sum + pool.participants, 0),
      averageAPY: pools.length > 0 
        ? pools.reduce((sum, pool) => sum + pool.currentAPY, 0) / pools.length 
        : 0,
      totalYieldGenerated: pools.reduce((sum, pool) => sum + pool.totalYieldGenerated, 0)
    }
    
    res.status(200).json(stats)
  } catch (error) {
    console.error('Error calculating stats:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to calculate platform statistics'
    })
  }
})

/**
 * Error handling middleware
 * Catches any unhandled errors and returns a proper response
 */
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)
  
  res.status(500).json({
    error: 'Internal server error',
    message: 'Something went wrong on the server'
  })
})

/**
 * 404 handler for undefined routes
 */
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `The requested route ${req.originalUrl} does not exist`
  })
})

/**
 * Start the server
 */
app.listen(PORT, () => {
  console.log(`🚀 ImpactPools API server running on port ${PORT}`)
  console.log(`📊 Currently managing ${pools.length} pools`)
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`💡 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`)
})

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully')
  process.exit(0)
})

export default app 