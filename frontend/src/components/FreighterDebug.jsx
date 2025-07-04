import React, { useState, useEffect } from 'react'
import SargamIcon from './SargamIcon'
import { useWallet } from '../contexts/WalletContext'

/**
 * WalletDebug component - Helps debug wallet detection and connectivity issues
 * This component shows detailed information about wallet availability and the Stellar Wallets Kit
 * Only shown in development or when debug mode is enabled
 */
const WalletDebug = () => {
  const { walletsKit, checkWalletAvailability, isConnected, walletType } = useWallet()
  
  const [debugInfo, setDebugInfo] = useState({
    stellarWalletsKit: false,
    freighterExtension: false,
    freighterApi: false,
    stellarObject: false,
    isChrome: false,
    isFirefox: false,
    walletKitModules: [],
    connectedWallet: null,
    userAgent: ''
  })

  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    checkWalletStatus()
  }, [walletsKit, isConnected, walletType])

  const checkWalletStatus = () => {
    // Get basic browser and wallet info
    const basicInfo = checkWalletAvailability()
    
    const info = {
      stellarWalletsKit: !!walletsKit,
      freighterExtension: basicInfo.freighterExtension,
      freighterApi: basicInfo.freighterApi,
      stellarObject: basicInfo.stellarObject,
      isChrome: basicInfo.isChrome,
      isFirefox: /Firefox/.test(navigator.userAgent),
      userAgent: basicInfo.userAgent,
      connectedWallet: walletType,
      walletConnectionStatus: isConnected,
      walletKitModules: [],
      availableWallets: []
    }

    // Get information about available wallet modules
    if (walletsKit) {
      try {
        // Try to get available modules information
        const modules = walletsKit.getSupportedWallets ? walletsKit.getSupportedWallets() : []
        info.walletKitModules = Array.isArray(modules) ? modules.map(m => m.name || m.id || 'Unknown') : []
        info.availableWallets = modules
      } catch (e) {
        info.walletKitModules = ['Error getting modules']
      }
    }

    setDebugInfo(info)
  }

  // Only show in development or when explicitly enabled
  if (process.env.NODE_ENV === 'production' && !isVisible) {
    return null
  }

  // Show browser recommendation for problematic browsers
  const showBrowserWarning = (!debugInfo.isChrome && !debugInfo.isFirefox) && 
                             !debugInfo.stellarWalletsKit && 
                             !debugInfo.freighterExtension

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Browser Recommendation Banner */}
      {showBrowserWarning && (
        <div className="mb-2 bg-orange-50 border border-orange-200 rounded-lg p-3 max-w-sm shadow-lg">
          <div className="flex items-start space-x-2">
            <SargamIcon name="alert-circle" size={20} color="#f97316" className="mt-0.5 flex-shrink-0" />
            <div>
              <div className="text-sm font-medium text-orange-800">Wallet Compatibility Notice</div>
              <div className="text-xs text-orange-700 mt-1">
                For best wallet support, consider using Chrome or Firefox browsers.
              </div>
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={() => window.open('https://www.google.com/chrome/', '_blank')}
                  className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 px-2 py-1 rounded"
                >
                  Get Chrome
                </button>
                <button
                  onClick={() => window.open('https://www.mozilla.org/firefox/', '_blank')}
                  className="text-xs bg-orange-100 hover:bg-orange-200 text-orange-800 px-2 py-1 rounded"
                >
                  Get Firefox
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {!isVisible ? (
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Show Wallet Debug Info"
        >
          <SargamIcon name="alert-circle" size={20} color="white" />
        </button>
      ) : (
        <div className="bg-white border border-gray-300 rounded-lg shadow-xl p-4 max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-900">Wallet Debug</h3>
            <div className="flex space-x-2">
              <button
                onClick={checkWalletStatus}
                className="text-blue-600 hover:text-blue-700"
                title="Refresh"
              >
                <SargamIcon name="refresh-cw" size={16} color="currentColor" />
              </button>
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            {/* Connection Status */}
            {debugInfo.connectedWallet && (
              <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                <div className="text-xs text-green-800 font-medium">Connected</div>
                <div className="text-xs text-green-700">{debugInfo.connectedWallet}</div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <span>Stellar Wallets Kit:</span>
              {debugInfo.stellarWalletsKit ? (
                <SargamIcon name="check-circle" size={16} color="#10b981" />
              ) : (
                <SargamIcon name="alert-circle" size={16} color="#ef4444" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Legacy Freighter:</span>
              {debugInfo.freighterExtension ? (
                <SargamIcon name="check-circle" size={16} color="#10b981" />
              ) : (
                <SargamIcon name="alert-circle" size={16} color="#9ca3af" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Chrome Browser:</span>
              {debugInfo.isChrome ? (
                <SargamIcon name="check-circle" size={16} color="#10b981" />
              ) : (
                <SargamIcon name="alert-circle" size={16} color="#f97316" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <span>Firefox Browser:</span>
              {debugInfo.isFirefox ? (
                <SargamIcon name="check-circle" size={16} color="#10b981" />
              ) : (
                <SargamIcon name="alert-circle" size={16} color="#9ca3af" />
              )}
            </div>

            {/* Wallet Kit Modules */}
            {debugInfo.stellarWalletsKit && debugInfo.walletKitModules.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="text-xs text-gray-600 mb-1">Available Wallet Modules:</div>
                <div className="text-xs text-gray-800 max-h-16 overflow-y-auto">
                  {debugInfo.walletKitModules.join(', ')}
                </div>
              </div>
            )}

            {/* Troubleshooting Section */}
            <div className="mt-3 pt-2 border-t border-gray-200">
              <div className="text-xs text-gray-600 mb-1">Status & Tips:</div>
              <div className="text-xs text-gray-800 space-y-1">
                {debugInfo.stellarWalletsKit ? (
                  <div className="text-green-600">• ✅ Wallet system initialized</div>
                ) : (
                  <div className="text-red-600">• ❌ Wallet system failed to initialize</div>
                )}
                
                {debugInfo.connectedWallet ? (
                  <div className="text-green-600">• ✅ Wallet connected: {debugInfo.connectedWallet}</div>
                ) : (
                  <div className="text-blue-600">• 💡 Click "Connect Wallet" to get started</div>
                )}

                {!debugInfo.stellarWalletsKit && (
                  <div className="text-red-600">• 🔄 Try refreshing the page</div>
                )}

                <div className="text-purple-600">• 🌟 New: Multi-wallet support via Stellar Wallets Kit</div>
              </div>
            </div>

            {/* Advanced Debug Info */}
            <div className="mt-2 pt-2 border-t border-gray-200">
              <details className="text-xs">
                <summary className="text-gray-600 cursor-pointer">Advanced Info</summary>
                <div className="mt-1 text-gray-500 font-mono text-xs break-all">
                  Browser: {debugInfo.userAgent.slice(0, 50)}...
                </div>
              </details>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WalletDebug 