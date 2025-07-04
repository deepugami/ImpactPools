import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import SargamIcon from '../components/SargamIcon'
import { usePools } from '../contexts/PoolContext'
import { useWallet } from '../contexts/WalletContext'
import toast from 'react-hot-toast'

/**
 * PoolDetailsPage component - Detailed view of an individual ImpactPool
 * Shows pool information and allows deposits/withdrawals
 */
const PoolDetailsPage = () => {
  const { poolId } = useParams()
  const navigate = useNavigate()
  const { pools, depositToPool, withdrawFromPool, getUserPoolBalance } = usePools()
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

  // Get user's balance in this pool
  const userBalance = isConnected ? getUserPoolBalance(poolId, publicKey) : {}

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
   * Handle withdrawal submission
   * @param {Object} e - Event object
   */
  const handleWithdraw = async (e) => {
    e.preventDefault()
    
    if (!isConnected) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!withdrawForm.amount || parseFloat(withdrawForm.amount) <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    const availableBalance = userBalance[withdrawForm.asset] || 0
    if (parseFloat(withdrawForm.amount) > availableBalance) {
      toast.error('Insufficient balance')
      return
    }

    setIsWithdrawing(true)
    
    try {
      const result = await withdrawFromPool(
        poolId,
        withdrawForm.asset,
        withdrawForm.amount,
        publicKey,
        signTransaction
      )
      
      if (result.success) {
        setWithdrawForm({ ...withdrawForm, amount: '' })
        toast.success(
          <div>
            <div>Withdrawal successful!</div>
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
      console.error('Withdrawal error:', error)
      toast.error('Withdrawal failed. Please try again.')
    } finally {
      setIsWithdrawing(false)
    }
  }

  // Loading state if pool not found yet
  if (!pool) {
    return (
      <div className="min-h-screen [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] flex items-center justify-center">
        <div className="text-center">
          <SargamIcon name="loader-2" size={32} color="#a855f7" className="mx-auto mb-4" />
          <p className="text-gray-300">Loading pool details...</p>
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
                  <p className="text-2xl font-bold text-white mb-1">
                    ${formatNumber(pool.totalDeposited)}
                  </p>
                  <p className="text-gray-300 text-sm">Total Value Locked</p>
                </div>
                
                <div className="text-center">
                  <div className="bg-pink-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
                    <SargamIcon name="heart" size={32} color="#ec4899" />
                  </div>
                  <p className="text-2xl font-bold text-pink-400 mb-1">
                    ${formatNumber(pool.totalDonated)}
                  </p>
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
                    ${formatNumber(pool.totalYieldGenerated)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-300">Pool Creator</span>
                  <span className="font-mono text-sm text-gray-400">
                    {pool.creator.slice(0, 4)}...{pool.creator.slice(-4)}
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
                    ${formatNumber(pool.totalDonated)} donated
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
          </div>

          {/* Sidebar - Deposit/Withdraw */}
          <div className="space-y-6">
            
            {/* User Balance (if connected) */}
            {isConnected && Object.keys(userBalance).length > 0 && (
              <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg p-6">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Your Position
                </h3>
                
                <div className="space-y-3">
                  {Object.entries(userBalance).map(([asset, balance]) => (
                    <div key={asset} className="flex justify-between items-center">
                      <span className="text-gray-300">{asset}</span>
                      <span className="font-semibold text-white">
                        {formatNumber(balance)}
                      </span>
                    </div>
                  ))}
                </div>
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
                      <form onSubmit={handleWithdraw} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">Asset</label>
                          <select
                            name="asset"
                            value={withdrawForm.asset}
                            onChange={handleWithdrawChange}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          >
                            {pool.assets.map((asset) => (
                              <option key={asset} value={asset} className="bg-gray-900 text-white">
                                {asset} (Balance: {formatNumber(userBalance[asset] || 0)})
                              </option>
                            ))}
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
                            max={userBalance[withdrawForm.asset] || 0}
                          />
                          {userBalance[withdrawForm.asset] && (
                            <button
                              type="button"
                              onClick={() => setWithdrawForm({
                                ...withdrawForm,
                                amount: userBalance[withdrawForm.asset].toString()
                              })}
                              className="text-sm text-purple-400 hover:text-purple-300 mt-1"
                            >
                              Max: {formatNumber(userBalance[withdrawForm.asset])}
                            </button>
                          )}
                        </div>
                        
                        <button
                          type="submit"
                          disabled={isWithdrawing || !withdrawForm.amount || !userBalance[withdrawForm.asset]}
                          className={`w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 ${
                            isWithdrawing || !withdrawForm.amount || !userBalance[withdrawForm.asset] ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          {isWithdrawing ? (
                            <div className="flex items-center justify-center space-x-2">
                              <SargamIcon name="loader-2" size={16} color="currentColor" />
                              <span>Withdrawing...</span>
                            </div>
                          ) : (
                            'Withdraw'
                          )}
                        </button>
                      </form>
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
                              {formatDate(tx.timestamp)} • {tx.user.slice(0, 8)}...{tx.user.slice(-4)}
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