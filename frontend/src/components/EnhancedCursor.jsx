import React, { useState, useEffect } from 'react'
import { useWallet } from '../contexts/WalletContext'
import { usePool } from '../contexts/PoolContext'

/**
 * EnhancedCursor Component
 * Creates a beautiful custom cursor with trailing effects
 * Works alongside CursorEffects for maximum visual impact
 */
const EnhancedCursor = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [cursorVariant, setCursorVariant] = useState('default')
  const [isClicking, setIsClicking] = useState(false)

  useEffect(() => {
    const mouseMove = (e) => {
      setMousePosition({
        x: e.clientX,
        y: e.clientY
      })
    }

    const mouseDown = () => setIsClicking(true)
    const mouseUp = () => setIsClicking(false)

    // Detect hoverable elements
    const handleMouseEnter = () => setCursorVariant('hover')
    const handleMouseLeave = () => setCursorVariant('default')

    // Add listeners to interactive elements
    const interactiveElements = document.querySelectorAll('a, button, [role="button"], input, textarea, select')
    
    interactiveElements.forEach(el => {
      el.addEventListener('mouseenter', handleMouseEnter)
      el.addEventListener('mouseleave', handleMouseLeave)
    })

    window.addEventListener('mousemove', mouseMove)
    window.addEventListener('mousedown', mouseDown)
    window.addEventListener('mouseup', mouseUp)

    return () => {
      window.removeEventListener('mousemove', mouseMove)
      window.removeEventListener('mousedown', mouseDown)
      window.removeEventListener('mouseup', mouseUp)
      
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', handleMouseEnter)
        el.removeEventListener('mouseleave', handleMouseLeave)
      })
    }
  }, [])

  const variants = {
    default: {
      x: mousePosition.x - 8,
      y: mousePosition.y - 8,
      scale: 1,
    },
    hover: {
      x: mousePosition.x - 16,
      y: mousePosition.y - 16,
      scale: 1.5,
    },
    click: {
      x: mousePosition.x - 12,
      y: mousePosition.y - 12,
      scale: 0.8,
    }
  }

  const currentVariant = isClicking ? 'click' : cursorVariant

  return (
    <>
      {/* Hide default cursor */}
      <style jsx global>{`
        * {
          cursor: none !important;
        }
      `}</style>

      {/* Main Cursor */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-50 mix-blend-difference"
        style={{
          transform: `translate(${variants[currentVariant].x}px, ${variants[currentVariant].y}px) scale(${variants[currentVariant].scale})`,
          transition: 'transform 0.1s ease-out',
          width: '16px',
          height: '16px',
          backgroundColor: '#ffffff',
          borderRadius: '50%',
          border: '2px solid rgba(168, 85, 247, 0.8)',
          boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)'
        }}
      />

      {/* Trailing Cursor */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-40"
        style={{
          transform: `translate(${mousePosition.x - 4}px, ${mousePosition.y - 4}px)`,
          transition: 'transform 0.15s ease-out',
          width: '8px',
          height: '8px',
          backgroundColor: 'rgba(168, 85, 247, 0.6)',
          borderRadius: '50%',
          filter: 'blur(2px)'
        }}
      />

      {/* Secondary Trail */}
      <div
        className="fixed top-0 left-0 pointer-events-none z-30"
        style={{
          transform: `translate(${mousePosition.x - 2}px, ${mousePosition.y - 2}px)`,
          transition: 'transform 0.2s ease-out',
          width: '4px',
          height: '4px',
          backgroundColor: 'rgba(168, 85, 247, 0.3)',
          borderRadius: '50%',
          filter: 'blur(4px)'
        }}
      />
    </>
  )
}

/**
 * OnChainBalanceDisplay Component
 * 
 * Displays user's cumulative pool balance fetched from on-chain data
 * with refresh functionality and Blend protocol integration
 */
export const OnChainBalanceDisplay = ({ poolId, asset = 'XLM', className = '' }) => {
  const { publicKey } = useWallet()
  const { fetchOnChainPoolData, calculateUserPoolBalance } = usePool()
  
  const [balance, setBalance] = useState(0)
  const [onChainData, setOnChainData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [error, setError] = useState(null)
  
  // Format number for display
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(num)
  }
  
  // Fetch on-chain balance data
  const fetchBalance = async (forceRefresh = false) => {
    if (!publicKey || !poolId) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      console.log(`🔄 Fetching ${forceRefresh ? 'fresh' : 'cached'} balance for pool ${poolId}`)
      
      // Get comprehensive on-chain data
      const data = await fetchOnChainPoolData(poolId, forceRefresh)
      
      if (data && data.userPosition.isOnChainData) {
        // Use real on-chain cumulative balance
        setBalance(data.userPosition.netPosition)
        setOnChainData(data)
        setLastUpdated(new Date())
        console.log(`✅ On-chain balance loaded: ${data.userPosition.netPosition} ${asset}`)
      } else {
        // Fallback to local calculation
        const localBalance = await calculateUserPoolBalance(poolId, asset)
        setBalance(localBalance)
        setLastUpdated(new Date())
        console.log(`📊 Local balance calculated: ${localBalance} ${asset}`)
      }
      
    } catch (err) {
      console.error('Error fetching balance:', err)
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }
  
  // Load balance on component mount and when dependencies change
  useEffect(() => {
    fetchBalance()
  }, [publicKey, poolId, asset])
  
  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isLoading) {
        fetchBalance()
      }
    }, 30000)
    
    return () => clearInterval(interval)
  }, [isLoading])
  
  if (!publicKey) {
    return (
      <div className={`text-gray-400 ${className}`}>
        Connect wallet to view balance
      </div>
    )
  }
  
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Main Balance Display */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="font-medium text-gray-200">Your Pool Balance:</div>
          <div className="text-2xl font-bold text-white">
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-lg">Loading...</span>
              </div>
            ) : error ? (
              <div className="text-red-400 text-lg">Error loading balance</div>
            ) : (
              <span>
                {formatNumber(balance)} {asset}
              </span>
            )}
          </div>
          
          {/* Data Source Indicator */}
          {onChainData && (
            <div className="flex items-center space-x-2 text-sm">
              {onChainData.userPosition.isOnChainData ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-green-400">On-chain data</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-400">Local calculation</span>
                </>
              )}
              
              {/* Blend Protocol Indicator */}
              {onChainData.blendData && onChainData.blendData.isBlendData && (
                <>
                  <span className="text-gray-400">•</span>
                  <span className="text-blue-400">Blend verified</span>
                </>
              )}
            </div>
          )}
        </div>
        
        {/* Refresh Button */}
        <button
          onClick={() => fetchBalance(true)}
          disabled={isLoading}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
          title="Refresh balance from blockchain"
        >
          <svg 
            className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span className="text-sm">Refresh</span>
        </button>
      </div>
      
      {/* Balance Details */}
      {onChainData && !isLoading && (
        <div className="bg-gray-800 rounded-lg p-3 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Total Deposited:</span>
            <span className="text-white">{formatNumber(onChainData.userPosition.totalDeposited)} {asset}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Withdrawn:</span>
            <span className="text-white">{formatNumber(onChainData.userPosition.totalWithdrawn)} {asset}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Pool Share:</span>
            <span className="text-white">{onChainData.poolMetrics.userSharePercentage.toFixed(4)}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Transaction Count:</span>
            <span className="text-white">{onChainData.userPosition.depositCount}</span>
          </div>
          
          {lastUpdated && (
            <div className="flex justify-between text-xs text-gray-500 pt-2 border-t border-gray-700">
              <span>Last Updated:</span>
              <span>{lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      )}
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-3">
          <div className="text-red-400 text-sm">
            <div className="font-medium">Balance fetch failed:</div>
            <div className="mt-1">{error}</div>
            <button 
              onClick={() => fetchBalance(true)}
              className="mt-2 text-blue-400 hover:text-blue-300 underline"
            >
              Try again
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default EnhancedCursor 