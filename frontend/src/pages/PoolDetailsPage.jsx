import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import SargamIcon from '../components/SargamIcon'
import { usePools } from '../contexts/PoolContext'
import { useWallet } from '../contexts/WalletContext'
import toast from 'react-hot-toast'
import MilestoneTracker, { CompactMilestoneProgress } from '../components/MilestoneTracker'
import { useNFTMilestones } from '../hooks/useNFTMilestones'
import { SimpleNFTGallery } from '../components/NFTGallery'
import { getCombinedTreasuryBalance, getUserMaxWithdrawable } from '../services/treasuryService'
import { PriceBadge } from '../components/ui/badge'
import priceService from '../services/priceService'

/**
 * PoolDetailsPage component - Detailed view of an individual ImpactPool
 * Shows pool information and allows deposits/withdrawals
 */
const PoolDetailsPage = () => {
  const { poolId } = useParams()
  const navigate = useNavigate()
  const { pools, depositToPool, withdrawFromPool, getUserPoolBalance, getUserAvailableWithdrawal, getPoolLiquidityInfo, fetchPools } = usePools()
  const { isConnected, publicKey, signTransaction } = useWallet()

  // Find the specific pool
  const pool = pools.find(p => p.id === poolId)

  // Form states for deposit/withdrawal
  const [depositForm, setDepositForm] = useState({
    asset: 'XLM',
    amount: ''
  })
  
  const [withdrawForm, setWithdrawForm] = useState({
    asset: 'XLM',
    amount: ''
  })

  // UI states
  const [activeTab, setActiveTab] = useState('deposit') // 'deposit' or 'withdraw'
  const [isDepositing, setIsDepositing] = useState(false)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [liquidityInfo, setLiquidityInfo] = useState(null)
  const [userBalance, setUserBalance] = useState({})
  const [loadingUserBalance, setLoadingUserBalance] = useState(false)
  const [xlmPrice, setXlmPrice] = useState(0.245) // Default price, will be updated

  // NFT milestone tracking for this pool
  const { 
    milestones, 
    userNFTs, 
    isLoading: milestonesLoading, 
    error: milestonesError 
  } = useNFTMilestones(isConnected ? publicKey : null, poolId)

  // Treasury balance information
  const [treasuryInfo, setTreasuryInfo] = useState(null)
  const [loadingTreasury, setLoadingTreasury] = useState(false)
  const [maxWithdrawInfo, setMaxWithdrawInfo] = useState(null)

  /**
   * Format number with proper decimals
   * @param {number} num - Number to format
   * @returns {string} Formatted number
   */
  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 6,
    }).format(num)
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  /**
   * Handle deposit form changes
   * @param {Object} e - Event object
   */
  const handleDepositChange = (e) => {
    const { name, value } = e.target
    setDepositForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  /**
   * Handle withdrawal form changes
   * @param {Object} e - Event object
   */
  const handleWithdrawChange = (e) => {
    const { name, value } = e.target
    setWithdrawForm(prev => ({
      ...prev,
      [name]: value
    }))
  }

  /**
   * Handle deposit submission
   * @param {Object} e - Event object
   */
  const handleDeposit = async (e) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!depositForm.amount || parseFloat(depositForm.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    setIsDepositing(true)
    
    try {
      const result = await depositToPool(
        poolId,
        depositForm.asset,
        depositForm.amount,
        publicKey,
        signTransaction
      )
      
      if (result.success) {
        setDepositForm({ ...depositForm, amount: '' })
        // Reload user balance after successful deposit
        await loadUserBalance()
        toast.success(
          <div>
            <div>Deposit successful!</div>
            <a 
              href={result.transactionLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 underline text-sm"
            >
              View transaction
            </a>
          </div>
        )
      }
    } catch (error) {
      console.error('Deposit error:', error)
      toast.error('Deposit failed. Please try again.')
    } finally {
      setIsDepositing(false)
    }
  }

  /**
   * Load user's balance in this pool
   */
  const loadUserBalance = async () => {
    if (!isConnected || !pool || !publicKey) {
      setUserBalance({})
      return
    }
    
    setLoadingUserBalance(true)
    try {
      const balance = await getUserPoolBalance(poolId, publicKey)
      setUserBalance(balance)
    } catch (error) {
      console.error('Failed to load user balance:', error)
      setUserBalance({})
    } finally {
      setLoadingUserBalance(false)
    }
  }

  /**
   * Load withdrawal validation information with enhanced accuracy
   */
  const loadTreasuryInfo = async () => {
    if (activeTab !== 'withdraw' || !isConnected || !pool) return
    
    setLoadingTreasury(true)
    try {
      // Get user's available withdrawal amount for the selected asset from userBalance state
      const availableBalance = userBalance[withdrawForm.asset] || 0
      
      // Get pool liquidity information for transparency
      const liquidity = await getPoolLiquidityInfo(poolId)
      
      // Set max withdrawal info based on user's actual balance
      setMaxWithdrawInfo({
        maxWithdrawable: availableBalance,
        userBalance: availableBalance,
        poolLiquidity: liquidity?.availableLiquidity || 0,
        isHealthy: liquidity?.isHealthy || true
      })
      
      // Update liquidity info state
      if (liquidity) {
        setLiquidityInfo(liquidity)
      }
    } catch (error) {
      console.error('Failed to load withdrawal validation info:', error)
      // Set safe defaults
      setMaxWithdrawInfo({
        maxWithdrawable: 0,
        userBalance: 0,
        poolLiquidity: 0,
        isHealthy: false
      })
    } finally {
      setLoadingTreasury(false)
    }
  }

  // Load user balance when component mounts or when user connects/disconnects
  useEffect(() => {
    loadUserBalance()
  }, [isConnected, publicKey, poolId, pools])

  // Fetch current XLM price
  useEffect(() => {
    const fetchXLMPrice = async () => {
      try {
        const price = await priceService.getXLMPrice()
        setXlmPrice(price)
      } catch (error) {
        console.warn('Failed to fetch XLM price, using fallback:', error)
        setXlmPrice(0.245) // Fallback to current market rate
      }
    }
    
    fetchXLMPrice()
    // Update price every 5 minutes
    const interval = setInterval(fetchXLMPrice, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  // Only load treasury info on manual request for withdrawal validation (removed continuous updates per user request)
  useEffect(() => {
    if (activeTab === 'withdraw' && isConnected && pool) {
      // Load treasury info once when switching to withdraw tab (without continuous updates)
      loadTreasuryInfo()
    }
  }, [activeTab, userBalance]) // Also trigger when user balance changes

  /**
   * Handle withdrawal submission
   * @param {Object} e - Event object
   */
  const handleWithdraw = async (asset, amount) => {
    try {
      setIsWithdrawing(true)
      
      // Ensure we have a valid pool and poolId
      if (!pool || !poolId) {
        throw new Error('Pool not found or poolId is missing')
      }
      
      // Use the simplified withdrawFromPool function
      const result = await withdrawFromPool(poolId, amount, publicKey, signTransaction)
      
      if (result.success) {
        toast.success(`Withdrawal successful! ${amount} ${asset} sent to your wallet.`, {
          duration: 8000
        })
        
        // Refresh pool data and user balance
        await fetchPools()
        await loadUserBalance()
      } else {
        throw new Error(result.error || 'Withdrawal failed')
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      toast.error(`Withdrawal failed: ${error.message}`, { duration: 6000 })
    } finally {
      setIsWithdrawing(false)
    }
  }

  /**
   * Handle withdrawal form submission with enhanced validation
   */
  const handleWithdrawSubmit = async (e) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    // Enhanced validation using new functions
    const availableBalance = userBalance[withdrawForm.asset] || 0
    const requestedAmount = parseFloat(withdrawForm.amount)
    
    if (requestedAmount > availableBalance) {
      toast.error(`Insufficient balance. You have ${formatNumber(availableBalance)} ${withdrawForm.asset} available.`)
      return
    }

    // Check if withdrawal amount is too small
    if (requestedAmount < 0.000001) {
      toast.error('Minimum withdrawal amount is 0.000001 XLM')
      return
    }

    // Call the existing handleWithdraw function
    try {
      await handleWithdraw(withdrawForm.asset, withdrawForm.amount)
      
      // Clear the form on success
      setWithdrawForm({ ...withdrawForm, amount: '' })
      
      // Refresh the max withdraw info
      await loadTreasuryInfo()
    } catch (error) {
      // Error is already handled in handleWithdraw
      console.error('Withdrawal submission error:', error)
    }
  }

  // Handle case where pool is not found after pools have loaded
  useEffect(() => {
    if (pools.length > 0 && !pool) {
      toast.error('Pool not found')
      navigate('/')
    }
  }, [pools, pool, navigate])

  // Load liquidity information when component mounts or pool changes
  useEffect(() => {
    const loadLiquidityInfo = async () => {
      if (pool && getPoolLiquidityInfo) {
        try {
          const info = await getPoolLiquidityInfo(poolId)
          setLiquidityInfo(info)
        } catch (error) {
          console.error('Failed to load liquidity info:', error)
        }
      }
    }
    
    loadLiquidityInfo()
  }, [pool, poolId, getPoolLiquidityInfo])

  // Show loading state while pool data is being fetched
  if (!pool) {
    return (
      <div className="min-h-screen [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <SargamIcon name="loader-2" size={32} color="#a855f7" className="animate-spin mx-auto mb-4" />
              <p className="text-white text-lg">Loading pool details...</p>
              <p className="text-gray-300 text-sm mt-2">
                {pools.length === 0 ? 'Fetching pool data...' : 'Pool not found. Redirecting...'}
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white mb-4 transition-colors"
          >
            <SargamIcon name="arrow-left" size={16} color="currentColor" />
            <span>Back to Discover</span>
          </button>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                {pool.name}
              </h1>
              <div className="flex items-center space-x-4 text-gray-300">
                <div className="flex items-center space-x-2">
                  <SargamIcon name="heart" size={16} color="#ef4444" />
                  <span>Supporting {pool.charity}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <SargamIcon name="calendar" size={16} color="currentColor" />
                  <span>Created {formatDate(pool.createdAt)}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-4 lg:mt-0">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-2 rounded-full text-lg font-semibold shadow-lg">
                {formatNumber(pool.currentAPY)}% APY
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content - Pool Stats */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Key Metrics */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Pool Performance
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <SargamIcon name="trending-up" size={32} color="#a855f7" />
                  </div>
                  <div className="text-2xl font-bold text-white mb-1">
                    <PriceBadge 
                      xlmAmount={pool.totalDeposited} 
                      className="bg-white/20 text-white text-xl px-3 py-1 hover:bg-white/30" 
                    />
                  </div>
                  <p className="text-gray-300 text-sm">Total Value Locked</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-pink-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <SargamIcon name="heart" size={32} color="#ec4899" />
                  </div>
                  <div className="text-2xl font-bold text-pink-400 mb-1">
                    <PriceBadge 
                      xlmAmount={pool.totalDonated} 
                      className="bg-pink-500/20 text-pink-400 text-xl px-3 py-1 hover:bg-pink-500/30" 
                    />
                  </div>
                  <p className="text-gray-300 text-sm">Donated to Charity</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-blue-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <SargamIcon name="users" size={32} color="#60a5fa" />
                  </div>
                  <p className="text-2xl font-bold text-white mb-1">
                    {pool.participants}
                  </p>
                  <p className="text-gray-300 text-sm">Contributors</p>
                </div>
              </div>
            </div>

            {/* Pool Configuration */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Pool Configuration
              </h2>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-white/20">
                  <span className="text-gray-300">Supported Assets</span>
                  <div className="flex space-x-2">
                    {pool.assets.map((asset, index) => (
                      <span 
                        key={index}
                        className="bg-purple-500/20 text-purple-300 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {asset}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-white/20">
                  <span className="text-gray-300">Charity Allocation</span>
                  <span className="font-semibold text-pink-400">
                    {pool.donationPercentage}% of yield
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3 border-b border-white/20">
                  <span className="text-gray-300">Total Yield Generated</span>
                  <span className="font-semibold text-white">
                    <PriceBadge 
                      xlmAmount={pool.totalYieldGenerated} 
                      className="bg-white/10 text-white text-sm px-2 py-1 hover:bg-white/20" 
                    />
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-300">Pool Creator</span>
                  <span className="font-mono text-sm text-gray-400">
                    {pool.creator ? `${pool.creator.slice(0, 4)}...${pool.creator.slice(-4)}` : 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Impact Visualization */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-6">
                Charitable Impact
              </h2>
              
              <div className="bg-gradient-to-r from-purple-900/30 to-pink-900/30 rounded-lg p-6 border border-purple-500/20">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-gray-200 font-medium">
                    Donation Progress
                  </span>
                  <span className="text-pink-400 font-semibold">
                    <PriceBadge 
                      xlmAmount={pool.totalDonated} 
                      className="bg-pink-500/20 text-pink-400 text-sm px-2 py-1 hover:bg-pink-500/30" 
                    /> donated
                  </span>
                </div>
                
                <div className="w-full bg-white/20 rounded-full h-3 mb-4">
                  <div 
                    className="bg-gradient-to-r from-pink-500 to-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ 
                      width: `${Math.min((pool.totalDonated / Math.max(pool.totalYieldGenerated, 1)) * 100, 100)}%` 
                    }}
                  ></div>
                </div>
                
                <p className="text-sm text-gray-300">
                  Every time this pool generates yield, {pool.donationPercentage}% automatically goes to{' '}
                  <span className="font-semibold text-pink-400">{pool.charity}</span>.
                  Thank you for making an impact!
                </p>
              </div>
            </div>

            {/* Milestone Achievements */}
            {isConnected && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6">
                <div className="flex items-center space-x-2 mb-6">
                  <SargamIcon name="trophy" size={20} color="#fbbf24" />
                  <h2 className="text-xl font-semibold text-white">
                    Impact Milestones
                  </h2>
                </div>
                
                {milestonesLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <SargamIcon name="loader-2" size={24} color="#a855f7" />
                    <span className="text-gray-300 ml-2">Loading milestones...</span>
                  </div>
                ) : milestonesError ? (
                  <div className="text-center py-8">
                    <div className="bg-red-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <SargamIcon name="alert-circle" size={24} color="#ef4444" />
                    </div>
                    <p className="text-red-400 text-sm">
                      Unable to load milestone data
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Pool Milestones */}
                    {milestones?.pool && (
                      <div>
                        <h3 className="text-lg font-medium text-white mb-3 flex items-center space-x-2">
                          <SargamIcon name="users" size={16} color="#60a5fa" />
                          <span>Pool Achievements</span>
                        </h3>
                        <MilestoneTracker
                          milestones={milestones.pool}
                          type="pool"
                          showCompact={true}
                          poolData={pool}
                        />
                      </div>
                    )}
                    
                    {/* User Personal Milestones */}
                    {milestones?.user && (
                      <div>
                        <h3 className="text-lg font-medium text-white mb-3 flex items-center space-x-2">
                          <SargamIcon name="user" size={16} color="#a855f7" />
                          <span>Your Achievements</span>
                        </h3>
                        <MilestoneTracker
                          milestones={milestones.user}
                          type="individual"
                          showCompact={true}
                          poolData={pool}
                        />
                      </div>
                    )}
                    
                    {/* Quick Stats */}
                    {(milestones?.pool || milestones?.user) && (
                      <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 rounded-lg p-4 border border-yellow-500/20">
                        <div className="grid grid-cols-2 gap-4 text-center">
                          <div>
                            <div className="text-xl font-bold text-yellow-400">
                              {milestones.pool?.completed?.length || 0}
                            </div>
                            <div className="text-sm text-gray-300">Pool Milestones</div>
                          </div>
                          <div>
                            <div className="text-xl font-bold text-purple-400">
                              {milestones.user?.completed?.length || 0}
                            </div>
                            <div className="text-sm text-gray-300">Personal Milestones</div>
                          </div>
                        </div>
                        
                        {(milestones.pool?.completed?.length > 0 || milestones.user?.completed?.length > 0) && (
                          <div className="mt-3 pt-3 border-t border-yellow-500/20">
                            <p className="text-sm text-yellow-200 text-center">
                              🎉 You've earned {((milestones.pool?.completed?.length || 0) + (milestones.user?.completed?.length || 0))} Impact Certificate{((milestones.pool?.completed?.length || 0) + (milestones.user?.completed?.length || 0)) !== 1 ? 's' : ''}!
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar - Deposit/Withdraw */}
          <div className="space-y-6">
            
            {/* User Position (if connected) - Enhanced with clarity */}
            {isConnected && Object.keys(userBalance).length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-2">
                  Your Pool Position
                </h3>
                <p className="text-sm text-gray-400 mb-4">
                  Amount you've deposited (available for withdrawal)
                </p>
                
                <div className="space-y-3">
                  {Object.entries(userBalance).map(([asset, balance]) => (
                    <div key={asset} className="flex justify-between items-center">
                      <span className="text-gray-300">{asset}</span>
                      <div className="text-right">
                        <div className="font-semibold text-white">
                          {formatNumber(balance)}
                        </div>
                        <div className="text-xs text-gray-400">
                          ≈ ${(balance * xlmPrice).toFixed(2)} USD
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {liquidityInfo && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="text-xs text-gray-400">
                      Pool Health: <span className={liquidityInfo.isHealthy ? 'text-green-400' : 'text-yellow-400'}>
                        {liquidityInfo.isHealthy ? 'Healthy' : 'Monitor'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Impact Certificates (if connected and has NFTs) */}
            {isConnected && userNFTs && userNFTs.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <SargamIcon name="award" size={20} color="#fbbf24" />
                    <h3 className="text-lg font-semibold text-white">
                      Your Certificates
                    </h3>
                  </div>
                  <div className="bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded-full text-sm font-medium">
                    {userNFTs.length}
                  </div>
                </div>
                
                <SimpleNFTGallery 
                  nfts={userNFTs.filter(nft => nft.poolId === poolId)} 
                  maxDisplay={3}
                  showEmptyState={false}
                />
                
                {userNFTs.filter(nft => nft.poolId === poolId).length === 0 && (
                  <div className="text-center py-4">
                    <div className="bg-gray-500/20 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                      <SargamIcon name="award" size={24} color="#6b7280" />
                    </div>
                    <p className="text-gray-400 text-sm">
                      No certificates earned for this pool yet
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      Reach donation milestones to earn certificates!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Deposit/Withdraw Interface */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden">
              
              {/* Tab Headers */}
              <div className="flex border-b border-white/20">
                <button
                  onClick={() => setActiveTab('deposit')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === 'deposit'
                      ? 'bg-purple-500/20 text-purple-300 border-b-2 border-purple-500'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <SargamIcon name="plus" size={16} color="currentColor" className="inline-block mr-2" />
                  Deposit
                </button>
                
                <button
                  onClick={() => setActiveTab('withdraw')}
                  className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                    activeTab === 'withdraw'
                      ? 'bg-red-500/20 text-red-300 border-b-2 border-red-500'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <SargamIcon name="minus" size={16} color="currentColor" className="inline-block mr-2" />
                  Withdraw
                </button>
              </div>

              {/* Tab Content */}
              <div className="p-6">
                {!isConnected ? (
                  <div className="text-center py-8">
                    <div className="bg-purple-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <SargamIcon name="coins" size={32} color="#a855f7" />
                    </div>
                    <p className="text-gray-300 mb-4">
                      Connect your wallet to deposit or withdraw
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Deposit Form */}
                    {activeTab === 'deposit' && (
                      <form onSubmit={handleDeposit} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Asset</label>
                          <select
                            name="asset"
                            value={depositForm.asset}
                            onChange={handleDepositChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            {pool.assets.map((asset) => (
                              <option key={asset} value={asset} className="bg-gray-900 text-white">
                                {asset}
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                          <input
                            type="number"
                            name="amount"
                            value={depositForm.amount}
                            onChange={handleDepositChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            placeholder="0.00"
                            step="0.000001"
                            min="0"
                          />
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isDepositing || !depositForm.amount}
                          className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 ${
                            isDepositing || !depositForm.amount ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isDepositing ? (
                            <div className="flex items-center justify-center space-x-2">
                              <SargamIcon name="loader-2" size={16} color="currentColor" />
                              <span>Depositing...</span>
                            </div>
                          ) : (
                            'Deposit'
                          )}
                        </button>
                      </form>
                    )}

                    {/* Withdraw Form */}
                    {activeTab === 'withdraw' && (
                      <>
                        {/* Hidden detailed pool balance information per user request */}
                        
                        <form onSubmit={handleWithdrawSubmit} className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Asset</label>
                            <select
                              name="asset"
                              value={withdrawForm.asset}
                              onChange={handleWithdrawChange}
                              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                            >
                              {pool.assets.map((asset) => {
                                const availableBalance = userBalance[asset] || 0
                                return (
                                  <option key={asset} value={asset} className="bg-gray-900 text-white">
                                    {asset} (Available: {formatNumber(availableBalance)})
                                  </option>
                                )
                              })}
                            </select>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Amount</label>
                            <input
                              type="number"
                              name="amount"
                              value={withdrawForm.amount}
                              onChange={handleWithdrawChange}
                              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                              placeholder="0.00"
                              step="0.000001"
                              min="0"
                              max={maxWithdrawInfo?.maxWithdrawable || 0}
                            />
                            {maxWithdrawInfo && (
                              <div className="flex items-center justify-between mt-2">
                                <button
                                  type="button"
                                  onClick={() => setWithdrawForm({
                                    ...withdrawForm,
                                    amount: maxWithdrawInfo.maxWithdrawable.toString()
                                  })}
                                  className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                                >
                                  Max: {formatNumber(maxWithdrawInfo.maxWithdrawable)} XLM
                                </button>
                              </div>
                            )}
                          </div>
                          
                          <button
                            type="submit"
                            disabled={
                              isWithdrawing || 
                              !withdrawForm.amount || 
                              !userBalance[withdrawForm.asset] ||
                              (maxWithdrawInfo && parseFloat(withdrawForm.amount) > maxWithdrawInfo.maxWithdrawable)
                            }
                            className={`w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 ${
                              isWithdrawing || 
                              !withdrawForm.amount || 
                              !userBalance[withdrawForm.asset] ||
                              (maxWithdrawInfo && parseFloat(withdrawForm.amount) > maxWithdrawInfo.maxWithdrawable)
                                ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          >
                            {isWithdrawing ? (
                              <div className="flex items-center justify-center space-x-2">
                                <SargamIcon name="loader-2" size={16} color="currentColor" className="animate-spin" />
                                <span>Withdrawing...</span>
                              </div>
                            ) : (
                              'Withdraw'
                            )}
                          </button>
                        </form>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Transaction History */}
            {pool.transactions && pool.transactions.length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden">
                <div className="p-6 border-b border-white/20">
                  <div className="flex items-center space-x-2">
                    <SargamIcon name="history" size={20} color="#a855f7" />
                    <h3 className="text-lg font-semibold text-white">
                      Transaction History
                    </h3>
                  </div>
                  <p className="text-sm text-gray-300 mt-1">
                    All blockchain transactions for this pool
                  </p>
                </div>
                
                <div className="divide-y divide-white/10">
                  {pool.transactions.slice(-10).reverse().map((tx) => (
                    <div key={tx.id} className="p-4 hover:bg-white/5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${
                            tx.type === 'pool_creation' ? 'bg-purple-500/20 text-purple-300' :
                            tx.type === 'deposit' ? 'bg-green-500/20 text-green-300' :
                            tx.type === 'withdrawal' ? 'bg-red-500/20 text-red-300' :
                            'bg-gray-500/20 text-gray-300'
                          }`}>
                            {tx.type === 'pool_creation' ? '🚀' :
                             tx.type === 'deposit' ? '+' :
                             tx.type === 'withdrawal' ? '−' :
                             '?'}
                          </div>
                          
                          <div>
                            <div className="font-medium text-white">
                              {tx.type === 'pool_creation' ? 'Pool Created' :
                               tx.type === 'deposit' ? `Deposit ${tx.amount} ${tx.asset}` :
                               tx.type === 'withdrawal' ? `Withdraw ${tx.amount} ${tx.asset}` :
                               'Unknown Transaction'}
                            </div>
                            <div className="text-sm text-gray-400">
                              {formatDate(tx.timestamp)} • {tx.user ? `${tx.user.slice(0, 8)}...${tx.user.slice(-4)}` : 'System'}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <a
                            href={tx.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 text-purple-400 hover:text-purple-300 text-sm"
                          >
                            <span>View</span>
                            <SargamIcon name="external-link" size={12} color="currentColor" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {pool.transactions.length > 10 && (
                  <div className="p-4 bg-white/5 text-center">
                    <p className="text-sm text-gray-400">
                      Showing latest 10 transactions
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <SargamIcon name="info" size={20} color="#60a5fa" className="mt-0.5" />
                <div className="text-sm text-blue-200">
                  <p className="font-semibold mb-1">How it works:</p>
                  <ul className="space-y-1 text-xs">
                    <li>• Deposit assets to earn yield from lending</li>
                    <li>• {pool.donationPercentage}% of yield automatically goes to charity</li>
                    <li>• You keep the remaining {100 - pool.donationPercentage}% of yield</li>
                    <li>• Withdraw your principal anytime</li>
                  </ul>
                </div>
              </div>
            </div>


          </div>
        </div>
      </div>
    </div>
  )
}

export default PoolDetailsPage