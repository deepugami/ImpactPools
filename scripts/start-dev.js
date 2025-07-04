#!/usr/bin/env node

/**
 * Simple development startup script for ImpactPools
 * This script helps start both frontend and backend for development
 */

import { spawn } from 'child_process'
import { existsSync } from 'fs'

console.log('🌟 ImpactPools Development Startup')
console.log('=================================\n')

const FRONTEND_DIR = 'frontend'
const BACKEND_DIR = 'backend'

// Check if directories exist
if (!existsSync(FRONTEND_DIR) || !existsSync(BACKEND_DIR)) {
  console.error('❌ Frontend or backend directory not found')
  process.exit(1)
}

console.log('🚀 Starting development servers...\n')

// Start backend
console.log('📡 Starting backend server...')
const backend = spawn('npm', ['run', 'dev'], {
  cwd: BACKEND_DIR,
  stdio: 'inherit',
  shell: true
})

// Start frontend with a delay
setTimeout(() => {
  console.log('🎨 Starting frontend server...')
  const frontend = spawn('npm', ['run', 'dev'], {
    cwd: FRONTEND_DIR,
    stdio: 'inherit', 
    shell: true
  })
  
  // Handle process termination
  process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down servers...')
    backend.kill('SIGTERM')
    frontend.kill('SIGTERM')
    process.exit(0)
  })
}, 3000)

console.log('\n🎉 Servers starting up!')
console.log('Frontend will be available at: http://localhost:5173')
console.log('Backend will be available at: http://localhost:3001')
console.log('\nPress Ctrl+C to stop\n') 