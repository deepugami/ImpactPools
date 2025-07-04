/**
 * Configuration utility for ImpactPools backend
 * Centralizes all environment variables and configuration settings
 */

import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

/**
 * Server configuration
 */
export const serverConfig = {
  port: process.env.PORT || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
}

/**
 * Stellar network configuration
 */
export const stellarConfig = {
  network: process.env.STELLAR_NETWORK || 'testnet',
  horizonUrl: process.env.HORIZON_URL || 'https://horizon-testnet.stellar.org',
  // Valid charity addresses - using user-funded testnet accounts
  charityAddresses: {
    'Stellar Community Fund': 'GDKTQSV73PCX62MVQJV3NNAKYUQMXUP6MNQMQYJ4XI7REPQKHFDAENCF',
    'Charity: Water': 'GDWAFO6SXQS7FCMPGPS74FWL4INPAMMXFAYX5JJWXE5KJI22YF3LJZM7',
    'Red Cross': 'GAEYMY5KLHSRZQPC2RV7FSETCB27J2BU7OQ4U6O2LG6ZMXIZPUZCYAHD',
    'Doctors Without Borders': 'GDKTQSV73PCX62MVQJV3NNAKYUQMXUP6MNQMQYJ4XI7REPQKHFDAENCF'
  }
}

/**
 * API configuration
 */
export const apiConfig = {
  version: process.env.API_VERSION || 'v1',
  rateLimit: parseInt(process.env.API_RATE_LIMIT) || 100,
  maxRequestSize: '10mb'
}

/**
 * Security configuration
 */
export const securityConfig = {
  jwtSecret: process.env.JWT_SECRET || 'your-super-secret-jwt-key-here',
  encryptionKey: process.env.ENCRYPTION_KEY || 'your-encryption-key-here',
  corsOrigins: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174', // Alternative frontend port when 5173 is busy
    'http://localhost:3000', // Alternative frontend port
    'https://impactpools.vercel.app' // Production domain (example)
  ]
}

/**
 * Logging configuration
 */
export const loggingConfig = {
  level: process.env.LOG_LEVEL || 'info',
  format: process.env.LOG_FORMAT || 'combined'
}

/**
 * Application constants
 */
export const appConstants = {
  supportedAssets: ['XLM', 'USDC'],
  minDonationPercentage: 1,
  maxDonationPercentage: 50,
  defaultPoolAPY: 8.5,
  yieldCalculationInterval: 30000, // 30 seconds for demo
  maxPoolNameLength: 100,
  maxPoolsPerUser: 10 // For future rate limiting
}

/**
 * Validation rules
 */
export const validationRules = {
  pool: {
    nameMinLength: 3,
    nameMaxLength: 100,
    assetsRequired: true,
    donationPercentageMin: 1,
    donationPercentageMax: 50
  },
  deposit: {
    minAmount: 0.000001,
    maxAmount: 1000000
  },
  withdrawal: {
    minAmount: 0.000001
  }
}

/**
 * Development utilities
 */
export const devConfig = {
  enableMockData: process.env.NODE_ENV === 'development',
  enableDetailedLogs: process.env.NODE_ENV === 'development',
  enableCORS: true,
  mockDelayMs: 1000 // Simulate network delay in development
}

/**
 * Export all configuration as default
 */
export default {
  server: serverConfig,
  stellar: stellarConfig,
  api: apiConfig,
  security: securityConfig,
  logging: loggingConfig,
  constants: appConstants,
  validation: validationRules,
  dev: devConfig
} 