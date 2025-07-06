import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import SargamIcon from '../components/SargamIcon'
import { usePools } from '../contexts/PoolContext'
import { useWallet } from '../contexts/WalletContext'
import nftService from '../services/nftService'
import { PriceBadge } from '../components/ui/badge'

import WithdrawalModal from '../components/WithdrawalDemo'

/**
 * HomePage component - Main landing page showing pool gallery
 * This is the primary interface where users discover and browse ImpactPools
 */
const HomePage = () => {
  const { pools, isLoading } = usePools()
  const { isConnected } = useWallet()
  const [withdrawalVisible, setWithdrawalVisible] = useState(false)
  const [nftStats, setNftStats] = useState({ totalCertificates: 0, totalMilestones: 0 })

  // Fetch platform-wide NFT statistics
  useEffect(() => {
    const fetchNFTStats = async () => {
      try {
        const stats = await nftService.getPlatformStats()
        setNftStats({
          totalCertificates: stats.totalCertificatesIssued || 0,
          totalMilestones: stats.totalMilestonesAchieved || 0
        })
      } catch (error) {
        console.warn('Failed to fetch NFT stats:', error)
        // Keep default values on error
      }
    }

    fetchNFTStats()
  }, [pools]) // Refetch when pools change

  /**
   * Format large numbers for display (e.g., 1,234.56)
   * @param {number} num - Number to format
   * @returns {string} Formatted number string
   */
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  /**
   * PoolCard component - Individual pool display card
   * Shows key information about each ImpactPool
   */
  const PoolCard = ({ pool }) => {
    return (
      <div className="card hover:scale-105 transition-transform duration-300">
        {/* Pool Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">
              {pool.name}
            </h3>
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <SargamIcon name="heart" size={16} color="#ef4444" />
              <span>Supporting {pool.charity}</span>
            </div>
          </div>
          
          {/* APY Badge */}
          <div className="bg-accent-100 text-accent-800 px-3 py-1 rounded-full text-sm font-medium">
            {formatNumber(pool.currentAPY)}% APY
          </div>
        </div>

        {/* Pool Stats with Real Prices */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Total Deposited</p>
            <div className="flex items-center space-x-2">
              <p className="text-lg font-semibold">{pool.totalDeposited?.toFixed(4) || '0.0000'} XLM</p>
              <PriceBadge xlmAmount={pool.totalDeposited || 0} />
            </div>
          </div>
          <div className="bg-gray-50 p-3 rounded">
            <p className="text-sm text-gray-600">Total Donated</p>
            <div className="flex items-center space-x-2">
              <p className="text-lg font-semibold">{pool.totalDonated?.toFixed(4) || '0.0000'} XLM</p>
              <PriceBadge xlmAmount={pool.totalDonated || 0} />
            </div>
          </div>
        </div>

        {/* Assets and Participants */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-500">Assets:</span>
            <div className="flex space-x-1">
              {pool.assets.map((asset, index) => (
                <span 
                  key={index}
                  className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs font-medium"
                >
                  {asset}
                </span>
              ))}
            </div>
          </div>
          
          <div className="flex items-center space-x-1 text-sm text-gray-600">
            <SargamIcon name="users" size={16} color="currentColor" />
            <span>{pool.participants}</span>
          </div>
        </div>

        {/* Donation Percentage */}
        <div className="mb-4">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-gray-500">Charity Allocation</span>
            <span className="font-medium text-accent-600">{pool.donationPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-accent-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${pool.donationPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
          <Link
            to={`/pool/${pool.id}`}
            className="flex-1 btn-primary text-center flex items-center justify-center space-x-2"
          >
            <span>View Details</span>
            <SargamIcon name="arrow-right" size={16} color="currentColor" />
          </Link>
          
          {isConnected && (
            <Link
              to={`/pool/${pool.id}`}
              className="btn-accent flex items-center space-x-2"
            >
              <SargamIcon name="plus" size={16} color="currentColor" />
              <span>Contribute</span>
            </Link>
          )}
        </div>
      </div>
    )
  }

  /**
   * Hero Section component - Top banner with call to action
   */
  const HeroSection = () => {
    return (
      <div className="py-16 px-4 sm:px-6 lg:px-8 mb-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Earn Yield While
            <span className="bg-gradient-to-r from-purple-400 to-purple-200 bg-clip-text text-transparent block">Making an Impact</span>
          </h1>
          
          <p className="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
            Join DeFi lending pools on Stellar that automatically donate a portion 
            of yield to verified charitable causes. It's DeFi for Good.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {isConnected ? (
              <>
                <Link to="/create" className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl text-lg">
                  Create Your Impact Pool
                </Link>
                <span className="text-gray-300">or browse existing pools below</span>
              </>
            ) : (
              <div className="text-center">
                <p className="text-gray-200 mb-4">
                  Connect your Freighter wallet to get started
                </p>
                <div className="bg-purple-900/20 border border-purple-500/30 rounded-lg p-4 max-w-md mx-auto backdrop-blur-sm">
                  <p className="text-sm text-purple-200">
                    💡 <strong>New to Stellar?</strong> Get testnet XLM from the 
                    <a 
                      href="https://laboratory.stellar.org/#account-creator" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-purple-300 hover:text-purple-100 underline ml-1"
                    >
                      Stellar Laboratory
                    </a>
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  /**
   * Stats Section - Show platform-wide statistics
   */
  const StatsSection = () => {
    const totalDeposited = pools.reduce((sum, pool) => sum + pool.totalDeposited, 0)
    const totalDonated = pools.reduce((sum, pool) => sum + pool.totalDonated, 0)
    const totalParticipants = pools.reduce((sum, pool) => sum + pool.participants, 0)

    return (
      <div className="bg-white/10 backdrop-blur-md py-12 mb-12 rounded-2xl mx-4 sm:mx-6 lg:mx-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-center text-white mb-8">
            Platform Impact
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <SargamIcon name="trending-up" size={32} color="#d8b4fe" />
              </div>
              <div className="text-3xl font-bold text-white mb-2">
                <PriceBadge 
                  xlmAmount={totalDeposited} 
                  className="bg-white/20 text-white text-2xl px-3 py-1 hover:bg-white/30" 
                />
              </div>
              <p className="text-gray-300">Total Value Locked</p>
            </div>
            
            <div className="text-center">
              <div className="bg-pink-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <SargamIcon name="heart" size={32} color="#ec4899" />
              </div>
              <div className="text-3xl font-bold text-pink-400 mb-2">
                <PriceBadge 
                  xlmAmount={totalDonated} 
                  className="bg-pink-500/20 text-pink-400 text-2xl px-3 py-1 hover:bg-pink-500/30" 
                />
              </div>
              <p className="text-gray-300">Donated to Charities</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <SargamIcon name="users" size={32} color="#60a5fa" />
              </div>
              <p className="text-3xl font-bold text-white mb-2">
                {totalParticipants}
              </p>
              <p className="text-gray-300">Active Contributors</p>
            </div>

            <div className="text-center">
              <div className="bg-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <SargamIcon name="award" size={32} color="#fbbf24" />
              </div>
              <p className="text-3xl font-bold text-yellow-400 mb-2">
                {nftStats.totalCertificates}
              </p>
              <p className="text-gray-300">Impact Certificates</p>
            </div>
          </div>

          {/* Additional NFT insights */}
          {nftStats.totalCertificates > 0 && (
            <div className="mt-8 pt-8 border-t border-white/20">
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8">
                <div className="flex items-center space-x-2 text-gray-300">
                  <SargamIcon name="trophy" size={16} color="#fbbf24" />
                  <span className="text-sm">
                    <span className="font-semibold text-yellow-400">{nftStats.totalMilestones}</span> milestones achieved
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <SargamIcon name="star" size={16} color="#a855f7" />
                  <span className="text-sm">
                    Proof of charitable impact on Stellar blockchain
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <HeroSection />

      {/* Platform Stats */}
      {pools.length > 0 && <StatsSection />}

      {/* Pool Gallery Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Discover ImpactPools
            </h2>
            <p className="text-gray-300 mt-1">
              Explore lending pools that generate yield for good causes
            </p>
          </div>
          
          {isConnected && (
            <Link to="/create" className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl flex items-center">
              <SargamIcon name="plus" size={16} color="currentColor" className="mr-2" />
              Create Pool
            </Link>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <SargamIcon name="loader-2" size={32} color="#a855f7" className="mx-auto mb-4" />
              <p className="text-gray-300">Loading pools...</p>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && pools.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-purple-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
              <SargamIcon name="heart" size={48} color="#d8b4fe" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No Impact Pools Yet
            </h3>
            <p className="text-gray-300 mb-6">
              Be the first to create a pool that generates yield for good causes!
            </p>
            {isConnected && (
              <Link to="/create" className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl">
                Create the First Pool
              </Link>
            )}
          </div>
        )}

        {/* Pool Grid */}
        {!isLoading && pools.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pools.map((pool) => (
              <PoolCard key={pool.id} pool={pool} />
            ))}
          </div>
        )}
      </div>

      <WithdrawalModal
        isVisible={withdrawalVisible}
        onClose={() => setWithdrawalVisible(false)}
      />
    </div>
  )
}

export default HomePage 