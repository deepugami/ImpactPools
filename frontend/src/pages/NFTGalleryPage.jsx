import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SargamIcon from '../components/SargamIcon'
import { useWallet } from '../contexts/WalletContext'
import { useNFTMilestones } from '../hooks/useNFTMilestones'
import NFTGallery from '../components/NFTGallery'
import { MilestoneDashboard } from '../components/MilestoneTracker'
import nftService from '../services/nftService'
import { toast } from 'sonner'

/**
 * NFTGalleryPage component - Dedicated page for viewing user's Impact Certificate collection
 * Shows complete NFT gallery, milestone progress, and achievement statistics
 */
const NFTGalleryPage = () => {
  const { isConnected, publicKey } = useWallet()
  
  // Get all user's NFTs and milestone data
  const { 
    userNFTs, 
    milestones, 
    isLoading, 
    error,
    refreshData 
  } = useNFTMilestones(isConnected ? publicKey : null)

  const [activeTab, setActiveTab] = useState('gallery') // 'gallery', 'milestones', or 'claim'

  /**
   * Format number for display
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  /**
   * Get tier statistics from user's NFTs
   */
  const getTierStats = () => {
    if (!userNFTs || userNFTs.length === 0) return {}
    
    return userNFTs.reduce((stats, nft) => {
      const tier = nft.tier || 'Bronze'
      stats[tier] = (stats[tier] || 0) + 1
      return stats
    }, {})
  }

  const tierStats = getTierStats()

  // If not connected, show connection prompt
  if (!isConnected) {
    return (
      <div className="min-h-screen [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center px-4">
          <div className="bg-purple-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <SargamIcon name="wallet" size={48} color="#a855f7" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-4">
            Connect Your Wallet
          </h1>
          <p className="text-gray-300 mb-6">
            Connect your Freighter wallet to view your Impact Certificate collection and milestone progress.
          </p>
          <Link 
            to="/"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
          >
            Go Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/"
            className="flex items-center space-x-2 text-gray-300 hover:text-white mb-6 transition-colors"
          >
            <SargamIcon name="arrow-left" size={16} color="currentColor" />
            <span>Back to Home</span>
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Your Impact Certificates
              </h1>
              <p className="text-gray-300">
                Collection of charitable milestone achievements on Stellar blockchain
              </p>
            </div>
            
            {userNFTs && userNFTs.length > 0 && (
              <div className="mt-4 lg:mt-0 flex items-center space-x-4">
                <button
                  onClick={refreshData}
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors"
                  disabled={isLoading}
                >
                  <SargamIcon name="refresh-cw" size={16} color="currentColor" />
                  <span>Refresh</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <SargamIcon name="loader-2" size={32} color="#a855f7" className="mx-auto mb-4" />
              <p className="text-gray-300">Loading your certificates...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 mb-8">
            <div className="flex items-center space-x-3">
              <SargamIcon name="alert-circle" size={20} color="#ef4444" />
              <div>
                <h3 className="text-red-400 font-medium">Error Loading Certificates</h3>
                <p className="text-red-300 text-sm mt-1">
                  Unable to load your NFT collection. Please try refreshing the page.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Content */}
        {!isLoading && !error && (
          <>
            {/* Statistics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Total Certificates */}
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6 text-center">
                <div className="bg-purple-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <SargamIcon name="award" size={24} color="#a855f7" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">
                  {userNFTs ? userNFTs.length : 0}
                </div>
                <div className="text-sm text-gray-300">Total Certificates</div>
              </div>

              {/* Tier Breakdown */}
              {Object.entries(tierStats).map(([tier, count]) => (
                <div key={tier} className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6 text-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                    tier === 'Platinum' ? 'bg-gray-500/20' :
                    tier === 'Gold' ? 'bg-yellow-500/20' :
                    tier === 'Silver' ? 'bg-gray-400/20' :
                    'bg-orange-500/20'
                  }`}>
                    <SargamIcon name="star" size={24} color={
                      tier === 'Platinum' ? '#9ca3af' :
                      tier === 'Gold' ? '#fbbf24' :
                      tier === 'Silver' ? '#9ca3af' :
                      '#fb923c'
                    } />
                  </div>
                  <div className={`text-2xl font-bold mb-1 ${
                    tier === 'Platinum' ? 'text-gray-400' :
                    tier === 'Gold' ? 'text-yellow-400' :
                    tier === 'Silver' ? 'text-gray-400' :
                    'text-orange-400'
                  }`}>
                    {count}
                  </div>
                  <div className="text-sm text-gray-300">{tier}</div>
                </div>
              ))}
            </div>

            {/* Tab Navigation */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg mb-8 overflow-hidden">
              <div className="flex border-b border-white/20">
                <button
                  onClick={() => setActiveTab('gallery')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === 'gallery'
                      ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <SargamIcon name="grid" size={16} color="currentColor" className="inline-block mr-2" />
                  Certificate Gallery
                </button>
                
                <button
                  onClick={() => setActiveTab('milestones')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === 'milestones'
                      ? 'bg-yellow-500/20 text-yellow-300 border-b-2 border-yellow-500'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <SargamIcon name="trophy" size={16} color="currentColor" className="inline-block mr-2" />
                  Milestone Progress
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'gallery' && (
                  <div>
                    {userNFTs && userNFTs.length > 0 ? (
                      <NFTGallery
                        nfts={userNFTs}
                        isLoading={isLoading}
                        error={error}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <SargamIcon name="award" size={40} color="#6b7280" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          No Impact Certificates Yet
                        </h3>
                        <p className="text-gray-300 mb-6 max-w-md mx-auto">
                          Start contributing to charitable pools to earn your first Impact Certificate! 
                          Reach donation milestones and build your collection.
                        </p>
                        <Link
                          to="/"
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                        >
                          Explore Pools
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'milestones' && (
                  <div>
                    {milestones ? (
                      <MilestoneDashboard
                        poolMilestones={milestones.pool}
                        userMilestones={milestones.user}
                        isLoading={isLoading}
                      />
                    ) : (
                      <div className="text-center py-12">
                        <div className="bg-gray-500/20 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                          <SargamIcon name="target" size={40} color="#6b7280" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-2">
                          No Milestone Progress Yet
                        </h3>
                        <p className="text-gray-300 mb-6 max-w-md mx-auto">
                          Make your first contribution to a charitable pool to start tracking your milestone progress!
                        </p>
                        <Link
                          to="/"
                          className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
                        >
                          Start Contributing
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            {userNFTs && userNFTs.length > 0 && (
              <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 rounded-xl border border-purple-500/20 p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Share Your Impact
                </h3>
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: 'My Impact Certificates',
                          text: `I've earned ${userNFTs.length} Impact Certificates through charitable giving on Stellar!`,
                          url: window.location.href
                        })
                      }
                    }}
                    className="flex items-center justify-center space-x-2 bg-white/10 hover:bg-white/20 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    <SargamIcon name="share-2" size={16} color="currentColor" />
                    <span>Share Collection</span>
                  </button>
                  
                  <Link
                    to="/"
                    className="flex items-center justify-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    <SargamIcon name="plus" size={16} color="currentColor" />
                    <span>Earn More Certificates</span>
                  </Link>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default NFTGalleryPage 