import React, { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'

// Import our custom pages and components
import Navbar from './components/Navbar'
import CursorEffects from './components/CursorEffects'
import CursorToggle from './components/CursorToggle'
import HomePage from './pages/HomePage'
import CreatePoolPage from './pages/CreatePoolPage'
import PoolDetailsPage from './pages/PoolDetailsPage'
import NFTGalleryPage from './pages/NFTGalleryPage'

// Import context providers for global state management
import { WalletProvider } from './contexts/WalletContext'
import { PoolProvider } from './contexts/PoolContext'

// NEW: Import on-chain balance testing for development
import './services/onChainBalanceTest.js'

/**
 * Main App component that sets up routing and global providers
 * This is the root component that wraps our entire application
 */
function App() {
  // State for controlling cursor effects
  const [cursorEffectsEnabled, setCursorEffectsEnabled] = useState(() => {
    const saved = localStorage.getItem('cursorEffectsEnabled')
    return saved !== null ? JSON.parse(saved) : true
  })

  useEffect(() => {
    localStorage.setItem('cursorEffectsEnabled', JSON.stringify(cursorEffectsEnabled))
  }, [cursorEffectsEnabled])

  return (
    // Wallet provider gives all components access to wallet state and functions
    <WalletProvider>
      {/* Pool provider manages the state of all ImpactPools */}
      <PoolProvider>
        {/* Router enables navigation between different pages */}
        <Router 
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <div className="min-h-screen relative">
            {/* Beautiful radial gradient background */}
            <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]"></div>
            
            {/* Interactive cursor effects and animations - conditional */}
            {cursorEffectsEnabled && <CursorEffects />}
            
            {/* Cursor effects toggle button */}
            <CursorToggle 
              enabled={cursorEffectsEnabled} 
              onToggle={setCursorEffectsEnabled} 
            />
            
            {/* Navigation bar appears on all pages */}
            <Navbar />
            
            {/* Main content area where pages are rendered */}
            <main className="pt-16 relative z-10"> {/* pt-16 adds padding to account for fixed navbar, z-10 ensures content is above background */}
              <Routes>
                {/* Home page - displays all pools and main interface */}
                <Route path="/" element={<HomePage />} />
                
                {/* Create new pool page - form to create ImpactPools */}
                <Route path="/create" element={<CreatePoolPage />} />
                
                {/* Individual pool details page - shows specific pool info */}
                <Route path="/pool/:poolId" element={<PoolDetailsPage />} />
                
                {/* NFT Gallery page - shows user's Impact Certificate collection */}
                <Route path="/certificates" element={<NFTGalleryPage />} />
                
                {/* Catch-all route for 404 pages */}
                <Route path="*" element={
                  <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">404 - Page Not Found</h1>
                      <p className="text-gray-600 mb-8">The page you're looking for doesn't exist.</p>
                      <a href="/" className="btn-primary">Go Back Home</a>
                    </div>
                  </div>
                } />
              </Routes>
            </main>
            
            {/* Toast notifications for user feedback (success, error messages) */}
            <Toaster 
              position="top-right" 
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#363636',
                  color: '#fff',
                },
                success: {
                  duration: 3000,
                  iconTheme: {
                    primary: '#22c55e',
                    secondary: '#fff',
                  },
                },
                error: {
                  duration: 5000,
                  iconTheme: {
                    primary: '#ef4444',
                    secondary: '#fff',
                  },
                },
              }}
            />
          </div>
        </Router>
      </PoolProvider>
    </WalletProvider>
  )
}

export default App 