import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import SargamIcon from './SargamIcon'
import { useWallet } from '../contexts/WalletContext'
import { XLMPriceIndicator } from './ui/badge'

/**
 * Navbar component - Displays navigation and wallet connection
 * This appears at the top of every page and provides main navigation
 */
const Navbar = () => {
  const location = useLocation()
  const { 
    isConnected, 
    publicKey, 
    isConnecting, 
    connectWallet, 
    disconnectWallet, 
    getShortPublicKey 
  } = useWallet()

  /**
   * Handle wallet connection button click
   * Either connects or disconnects based on current state
   */
  const handleWalletClick = () => {
    if (isConnected) {
      disconnectWallet()
    } else {
      connectWallet()
    }
  }

  /**
   * Check if a nav link is currently active
   * @param {string} path - The path to check
   * @returns {boolean} True if the current location matches the path
   */
  const isActivePath = (path) => location.pathname === path

  return (
    <nav className="bg-black/20 backdrop-blur-md border-b border-purple-500/20 fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo and Brand Name */}
          <div className="flex items-center space-x-3">
            <Link to="/" className="flex items-center space-x-3 hover:opacity-80 transition-opacity">
              {/* Impact/Heart icon for the logo */}
              <div className="bg-gradient-to-r from-purple-600 to-purple-500 p-2 rounded-lg">
                <SargamIcon name="heart" size={24} color="white" />
              </div>
              {/* Brand name with gradient text */}
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent">
                ImpactPools
              </span>
            </Link>
            
            {/* Tagline - hidden on mobile */}
            <span className="hidden md:block text-sm text-gray-300 ml-2">
              DeFi for Good
            </span>
          </div>

          {/* Navigation Links - Center */}
          <div className="hidden md:flex items-center space-x-8">
            {/* Home/Discover Link */}
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActivePath('/') 
                  ? 'bg-purple-500/20 text-purple-300' 
                  : 'text-gray-300 hover:text-purple-300 hover:bg-purple-500/10'
              }`}
            >
              <SargamIcon name="home" size={16} color="currentColor" />
              <span>Discover</span>
            </Link>

            {/* Create Pool Link */}
            <Link
              to="/create"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActivePath('/create') 
                  ? 'bg-purple-500/20 text-purple-300' 
                  : 'text-gray-300 hover:text-purple-300 hover:bg-purple-500/10'
              }`}
            >
              <SargamIcon name="plus" size={16} color="currentColor" />
              <span>Create Pool</span>
            </Link>

            {/* NFT Certificates Link - Only show when connected */}
            {isConnected && (
              <Link
                to="/certificates"
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                  isActivePath('/certificates') 
                    ? 'bg-yellow-500/20 text-yellow-300' 
                    : 'text-gray-300 hover:text-yellow-300 hover:bg-yellow-500/10'
                }`}
              >
                <SargamIcon name="award" size={16} color="currentColor" />
                <span>Certificates</span>
              </Link>
            )}

            {/* Real-time XLM Price */}
            <XLMPriceIndicator className="ml-4" />
          </div>

          {/* Wallet Connection Section */}
          <div className="flex items-center space-x-4">
            
            {/* Network Indicator - Shows we're on testnet */}
            <div className="hidden sm:flex items-center space-x-2 bg-orange-500/20 text-orange-300 px-3 py-1 rounded-full text-xs font-medium">
              <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
              <span>Testnet</span>
            </div>

            {/* Wallet Connection Button */}
            <button
              onClick={handleWalletClick}
              disabled={isConnecting}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                isConnected
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white'
                  : 'bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white'
              } ${isConnecting ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-lg'}`}
            >
              <SargamIcon name="wallet" size={16} color="currentColor" />
              <span>
                {isConnecting 
                  ? 'Connecting...' 
                  : isConnected 
                    ? getShortPublicKey() 
                    : 'Connect Wallet'
                }
              </span>
              
              {/* Loading spinner when connecting */}
              {isConnecting && (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin ml-1"></div>
              )}
            </button>

            {/* Disconnect option for connected wallet - dropdown would go here in full implementation */}
            {isConnected && (
              <div className="relative">
                {/* Could add a dropdown menu here for additional wallet options */}
              </div>
            )}
          </div>
        </div>

        {/* Mobile Navigation - appears below main nav on small screens */}
        <div className="md:hidden border-t border-purple-500/20">
          <div className={`flex ${isConnected ? 'justify-around' : 'justify-center space-x-8'} py-2`}>
            <Link
              to="/"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                isActivePath('/') 
                  ? 'text-purple-300' 
                  : 'text-gray-300 hover:text-purple-300'
              }`}
            >
              <SargamIcon name="home" size={20} color="currentColor" />
              <span className="text-xs">Discover</span>
            </Link>

            <Link
              to="/create"
              className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                isActivePath('/create') 
                  ? 'text-purple-300' 
                  : 'text-gray-300 hover:text-purple-300'
              }`}
            >
              <SargamIcon name="plus" size={20} color="currentColor" />
              <span className="text-xs">Create</span>
            </Link>

            {/* NFT Certificates Link - Mobile - Only show when connected */}
            {isConnected && (
              <Link
                to="/certificates"
                className={`flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  isActivePath('/certificates') 
                    ? 'text-yellow-300' 
                    : 'text-gray-300 hover:text-yellow-300'
                }`}
              >
                <SargamIcon name="award" size={20} color="currentColor" />
                <span className="text-xs">Certificates</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar 