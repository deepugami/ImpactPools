import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { 
  createPaymentTransaction, 
  submitTransaction, 
  calculateRealAPY, 
  getPoolHealthMetrics,
  getAccountBalances,
  getAccountTransactions,
  calculateYieldDistribution 
} from '../services/stellarService'
import { blendFactory } from '../services/blendService'
import { useWallet } from './WalletContext'
import { sendRealWithdrawal, validateWithdrawal, getTreasuryBalance } from '../services/treasuryService'

// Create the context that will hold pool state and functions
const PoolContext = createContext()

/**
 * Custom hook to use the pool context
 * This provides easy access to pool state and functions from any component
 * Usage: const { pools, createPool, depositToPool } = usePools()
 */
export const usePools = () => {
  const context = useContext(PoolContext)
  if (!context) {
    throw new Error('usePools must be used within a PoolProvider')
  }
  return context
}

// Backend API base URL - change this if your backend runs on a different port
const API_BASE_URL = 'http://localhost:3001/api'

// Pool treasury account - user-funded testnet account
const POOL_TREASURY_ACCOUNT = 'GAEYMY5KLHSRZQPC2RV7FSETCB27J2BU7OQ4U6O2LG6ZMXIZPUZCYAHD'

/**
 * PoolProvider component that manages ImpactPools state and API interactions
 * This wraps the entire app and provides pool functionality to all components
 */
export const PoolProvider = ({ children }) => {
  // State to store all pools
  const [pools, setPools] = useState([])
  
  // State to track loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingPool, setIsCreatingPool] = useState(false)

  /**
   * Fetch all pools from the backend API
   * This function gets the list of all created ImpactPools
   */
  const fetchPools = async (silent = false) => {
    if (!silent) setIsLoading(true)
    try {
      const response = await axios.get(`${API_BASE_URL}/pools`)
      setPools(response.data)
    } catch (error) {
      console.error('Error fetching pools:', error)
      if (!silent) {
        toast.error('Failed to load pools. Please try again.')
      }
    } finally {
      if (!silent) setIsLoading(false)
    }
  }

  /**
   * Create a new ImpactPool with actual Stellar transaction
   * This creates a pool creation transaction and submits it to the network
   * 
   * @param {Object} poolData - The pool creation data
   * @param {string} poolData.name - Pool name
   * @param {string} poolData.charity - Selected charity
   * @param {Array} poolData.assets - Selected assets for the pool
   * @param {number} poolData.donationPercentage - Percentage of yield to donate
   * @param {string} creatorPublicKey - Creator's Stellar public key
   * @param {Function} signTransaction - Wallet signing function
   */
  const createPool = async (poolData, creatorPublicKey, signTransaction) => {
    setIsCreatingPool(true)
    
    try {
      if (!signTransaction) {
        throw new Error('Wallet not connected or signing not available')
      }

      // Create a symbolic transaction to represent pool creation
      // In a real DeFi protocol, this would create smart contract state
      const poolCreationAmount = 1 // 1 XLM as a creation fee
      const poolCreationMemo = `Pool: ${poolData.name.slice(0, 20)}`
      
      toast.loading('Creating pool transaction...', { id: 'pool-creation' })
      
      // Create the transaction
      const transactionXdr = await createPaymentTransaction(
        creatorPublicKey,
        POOL_TREASURY_ACCOUNT,
        'XLM',
        poolCreationAmount,
        poolCreationMemo
      )
      
      toast.loading('Please sign the transaction in your wallet...', { id: 'pool-creation' })
      
      // Sign the transaction
      const signedTxXdr = await signTransaction(transactionXdr, 'Test SDF Network ; September 2015')
      
      toast.loading('Submitting transaction to Stellar network...', { id: 'pool-creation' })
      
      // Submit to Stellar network
      const result = await submitTransaction(signedTxXdr)
      
      // Generate a unique pool ID based on the transaction
      const poolId = `pool_${result.hash.slice(-8)}`
      
      // Create the pool object with transaction data
      const newPool = {
        id: poolId,
        name: poolData.name,
        charity: poolData.charity,
        assets: poolData.assets,
        donationPercentage: poolData.donationPercentage,
        creator: creatorPublicKey,
        createdAt: new Date().toISOString(),
        treasury: POOL_TREASURY_ACCOUNT,
        
        // Blockchain transaction details
        creationTxHash: result.hash,
        creationTxLink: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
        
        // Initial pool statistics
        totalDeposited: 0,
        totalYieldGenerated: 0,
        totalDonated: 0,
        participants: 0,
        
        // Real APY calculation based on market conditions (will be updated async)
        currentAPY: 5.0, // Initial value, will be updated with real Blend data
        
        deposits: [], // Array to track individual deposits
        transactions: [{ // Track all pool transactions
          id: result.hash,
          type: 'pool_creation',
          amount: poolCreationAmount,
          asset: 'XLM',
          user: creatorPublicKey,
          timestamp: new Date().toISOString(),
          link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`
        }]
      }
      
      // Create corresponding Blend protocol pool for yield generation
      const blendPoolResult = blendFactory.createPool({
        id: poolId,
        name: poolData.name,
        charity: poolData.charity,
        assets: poolData.assets,
        donationPercentage: poolData.donationPercentage,
        creator: creatorPublicKey,
        treasury: POOL_TREASURY_ACCOUNT
      })
      
      if (!blendPoolResult.success) {
        console.warn('Failed to create Blend pool:', blendPoolResult.error)
        // Continue anyway - frontend pool can still work without Blend integration
      } else {
        console.log('Created Blend protocol pool for', poolData.name)
      }
      
      // Send the pool data to our backend API
      const response = await axios.post(`${API_BASE_URL}/pools`, newPool)
      
      // Update local state with the new pool
      setPools(prevPools => [response.data, ...prevPools])
      
      // Update the APY with real Blend data asynchronously
      setTimeout(async () => {
        try {
          const realAPY = await calculateRealAPY(poolData)
          const updatedPool = { ...response.data, currentAPY: realAPY * 100 }
          setPools(prevPools => 
            prevPools.map(p => p.id === poolId ? updatedPool : p)
          )
          console.log(`Updated pool ${poolId} with real APY: ${(realAPY * 100).toFixed(2)}%`)
        } catch (error) {
          console.warn('Failed to update pool with real APY:', error)
        }
      }, 100)
      
      toast.success(
        `ImpactPool created successfully! Transaction: ${result.hash.slice(0, 8)}...`,
        { id: 'pool-creation' }
      )
      
      return { 
        success: true, 
        poolId: poolId,
        transactionHash: result.hash,
        transactionLink: `https://stellar.expert/explorer/testnet/tx/${result.hash}`
      }
      
    } catch (error) {
      console.error('Error creating pool:', error)
      toast.error(
        `Failed to create pool: ${error.message}`,
        { id: 'pool-creation' }
      )
      return { success: false, error: error.message }
    } finally {
      setIsCreatingPool(false)
    }
  }

  /**
   * Make a deposit to a specific pool with actual Stellar transaction
   * This creates a real payment transaction to the pool treasury
   * 
   * @param {string} poolId - The pool to deposit to
   * @param {string} asset - The asset being deposited (XLM, USDC, etc.)
   * @param {number} amount - Amount to deposit
   * @param {string} userPublicKey - Depositor's public key
   * @param {Function} signTransaction - Wallet signing function
   */
  const depositToPool = async (poolId, asset, amount, userPublicKey, signTransaction) => {
    try {
      // Find the pool to update
      const pool = pools.find(p => p.id === poolId)
      if (!pool) {
        throw new Error('Pool not found')
      }

      if (!signTransaction) {
        throw new Error('Wallet not connected or signing not available')
      }

      const depositMemo = `Deposit: ${poolId.slice(-8)}`
      
      toast.loading('Creating deposit transaction...', { id: 'deposit' })
      
      // Create the transaction
      const transactionXdr = await createPaymentTransaction(
        userPublicKey,
        POOL_TREASURY_ACCOUNT,
        asset,
        amount,
        depositMemo
      )
      
      toast.loading('Please sign the transaction in your wallet...', { id: 'deposit' })
      
      // Sign the transaction
      const signedTxXdr = await signTransaction(transactionXdr, 'Test SDF Network ; September 2015')
      
      toast.loading('Submitting transaction to Stellar network...', { id: 'deposit' })
      
      // Submit to Stellar network
      const result = await submitTransaction(signedTxXdr)
      
      // Create deposit record
      const deposit = {
        id: `deposit_${result.hash.slice(-8)}`,
        userId: userPublicKey,
        asset,
        amount: parseFloat(amount),
        timestamp: new Date().toISOString(),
        txHash: result.hash,
        txLink: `https://stellar.expert/explorer/testnet/tx/${result.hash}`
      }

      // Update pool data
      const transaction = {
        id: result.hash,
        type: 'deposit',
        amount: parseFloat(amount),
        asset,
        user: userPublicKey,
        timestamp: new Date().toISOString(),
        link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`
      }

      const updatedPool = {
        ...pool,
        totalDeposited: pool.totalDeposited + parseFloat(amount),
        participants: pool.deposits.filter(d => d.userId === userPublicKey).length === 0 
          ? pool.participants + 1 
          : pool.participants,
        deposits: [...pool.deposits, deposit],
        transactions: [...(pool.transactions || []), transaction],
      }
      
      // Update corresponding Blend pool
      try {
        const blendPool = blendFactory.getPool(poolId)
        if (blendPool) {
          const blendResult = blendPool.deposit(parseFloat(amount), asset, userPublicKey)
          if (blendResult.success) {
            console.log(`Updated Blend pool with deposit: ${amount} ${asset}`)
            // Update pool APY based on new utilization
            const healthMetrics = blendPool.getHealthMetrics()
            updatedPool.currentAPY = healthMetrics.supplyAPY
            updatedPool.utilizationRate = healthMetrics.utilization
          }
        }
      } catch (error) {
        console.warn('Failed to update Blend pool:', error)
        // Continue anyway - transaction was successful on Stellar
      }

      // Update backend
      await axios.put(`${API_BASE_URL}/pools/${poolId}`, updatedPool)
      
      // Update local state
      setPools(prevPools => 
        prevPools.map(p => p.id === poolId ? updatedPool : p)
      )

      toast.success(
        `Successfully deposited ${amount} ${asset}! Tx: ${result.hash.slice(0, 8)}...`,
        { id: 'deposit' }
      )
      
      return { 
        success: true,
        transactionHash: result.hash,
        transactionLink: `https://stellar.expert/explorer/testnet/tx/${result.hash}`
      }

    } catch (error) {
      console.error('Error depositing to pool:', error)
      toast.error(`Failed to deposit: ${error.message}`, { id: 'deposit' })
      return { success: false, error: error.message }
    }
  }

  /**
   * Withdraw from a specific pool with REAL Stellar testnet transactions
   * This sends actual XLM from treasury to user's wallet
   * 
   * @param {string} poolId - The pool to withdraw from
   * @param {string} asset - The asset being withdrawn (currently only XLM supported)
   * @param {number} amount - Amount to withdraw
   * @param {string} userPublicKey - Withdrawer's public key
   * @param {Function} signTransaction - Wallet signing function (not used for treasury withdrawals)
   */
  const withdrawFromPool = async (poolId, asset, amount, userPublicKey, signTransaction) => {
    try {
      const pool = pools.find(p => p.id === poolId)
      if (!pool) {
        throw new Error('Pool not found')
      }

      // Only support XLM withdrawals for now
      if (asset !== 'XLM') {
        throw new Error('Only XLM withdrawals are currently supported')
      }

      // Check if user has enough deposited in the pool
      const userDeposits = pool.deposits.filter(d => d.userId === userPublicKey && d.asset === asset)
      const totalUserDeposited = userDeposits.reduce((sum, d) => sum + d.amount, 0)
      
      if (totalUserDeposited < parseFloat(amount)) {
        throw new Error(`Insufficient balance to withdraw. You have ${totalUserDeposited} ${asset} deposited.`)
      }

      toast.loading('Validating withdrawal request...', { id: 'withdraw' })

      // Validate withdrawal with treasury
      const validation = await validateWithdrawal(userPublicKey, amount)
      if (!validation.valid) {
        throw new Error(validation.error)
      }

      toast.loading('Processing withdrawal transaction...', { id: 'withdraw' })

      // Send REAL XLM from treasury to user wallet
      const withdrawalResult = await sendRealWithdrawal(userPublicKey, asset, amount)

      if (!withdrawalResult.success) {
        throw new Error('Withdrawal transaction failed')
      }

      toast.loading('Updating pool records...', { id: 'withdraw' })

      // Create withdrawal record (negative amount to show deduction from pool)
      const withdrawal = {
        id: `withdrawal_${withdrawalResult.hash.slice(-8)}`,
        userId: userPublicKey,
        asset,
        amount: -parseFloat(amount), // Negative to indicate withdrawal from pool
        timestamp: withdrawalResult.timestamp,
        txHash: withdrawalResult.hash,
        txLink: withdrawalResult.link,
        isReal: true // Mark as real transaction
      }

      // Update pool data
      const transaction = {
        id: withdrawalResult.hash,
        type: 'withdrawal',
        amount: parseFloat(amount),
        asset,
        user: userPublicKey,
        timestamp: withdrawalResult.timestamp,
        link: withdrawalResult.link,
        isReal: true
      }

      const updatedPool = {
        ...pool,
        totalDeposited: Math.max(0, pool.totalDeposited - parseFloat(amount)),
        deposits: [...pool.deposits, withdrawal],
        transactions: [...(pool.transactions || []), transaction],
      }

      // Update backend
      await axios.put(`${API_BASE_URL}/pools/${poolId}`, updatedPool)
      
      // Update local state
      setPools(prevPools => 
        prevPools.map(p => p.id === poolId ? updatedPool : p)
      )

      toast.success(
        `Withdrawal successful! ${amount} XLM sent to your wallet.`,
        { id: 'withdraw', duration: 8000 }
      )
      
      console.log('Stellar withdrawal completed:', {
        amount: `${amount} ${asset}`,
        to: userPublicKey,
        hash: withdrawalResult.hash,
        link: withdrawalResult.link,
        ledger: withdrawalResult.ledger
      })
      
      return { 
        success: true,
        isReal: true,
        transactionHash: withdrawalResult.hash,
        transactionLink: withdrawalResult.link,
        message: `Withdrawal of ${amount} ${asset} completed successfully`,
        ledger: withdrawalResult.ledger
      }

    } catch (error) {
      console.error('Withdrawal error:', error)
      toast.error(`Withdrawal failed: ${error.message}`, { id: 'withdraw', duration: 6000 })
      return { success: false, error: error.message }
    }
  }

  /**
   * Get user's balance in a specific pool
   * This calculates how much the user has deposited minus withdrawals
   */
  const getUserPoolBalance = (poolId, userPublicKey) => {
    const pool = pools.find(p => p.id === poolId)
    if (!pool) return {}

    const userDeposits = pool.deposits.filter(d => d.userId === userPublicKey)
    
    // Group by asset and sum the amounts
    const balances = userDeposits.reduce((acc, deposit) => {
      const asset = deposit.asset
      acc[asset] = (acc[asset] || 0) + deposit.amount
      return acc
    }, {})

    // Filter out zero or negative balances
    Object.keys(balances).forEach(asset => {
      if (balances[asset] <= 0) {
        delete balances[asset]
      }
    })

    return balances
  }

  /**
   * Update pool data with real market information
   * Fetches current APY, utilization, and pool health metrics
   */
  const updatePoolMarketData = async () => {
    try {
      const updatedPools = await Promise.all(
        pools.map(async (pool) => {
          try {
            // Get real pool health metrics
            const healthMetrics = await getPoolHealthMetrics(pool)
            
            // Calculate real yield distribution if pool has deposits
            let yieldUpdate = {}
            if (pool.totalDeposited > 0) {
              const annualYield = pool.totalDeposited * (healthMetrics.currentAPY || 0.05)
              const dailyYield = annualYield / 365
              const yieldDistribution = calculateYieldDistribution(pool, dailyYield)
              
              yieldUpdate = {
                totalYieldGenerated: (pool.totalYieldGenerated || 0) + yieldDistribution.totalYield,
                totalDonated: (pool.totalDonated || 0) + yieldDistribution.charityAmount,
              }
            }
            
            return {
              ...pool,
              currentAPY: (healthMetrics.currentAPY || 0.05) * 100, // Convert to percentage
              utilizationRate: healthMetrics.utilization.utilizationRate || 0,
              riskLevel: healthMetrics.riskLevel || 'LOW',
              healthScore: healthMetrics.healthScore || 100,
              lastUpdated: healthMetrics.lastUpdated,
              ...yieldUpdate
            }
          } catch (error) {
            console.error(`Error updating market data for pool ${pool.id}:`, error)
            return pool // Return unchanged pool if error
          }
        })
      )
      
      setPools(updatedPools)
    } catch (error) {
      console.error('Error updating pool market data:', error)
    }
  }

  /**
   * Load pools when the component mounts and set up real-time market data updates
   */
  useEffect(() => {
    fetchPools()
  }, [])

  /**
   * Update market data periodically for real-time pool information
   */
  useEffect(() => {
    if (pools.length > 0) {
      // Update market data every 60 seconds for real-time information
      const marketDataInterval = setInterval(updatePoolMarketData, 60000)
      
      // Check for pool deposit updates every 5 seconds for real-time balance updates
      const depositUpdateInterval = setInterval(() => fetchPools(true), 5000)
      
      // Initial update after pools are loaded
      updatePoolMarketData()
      
      return () => {
        clearInterval(marketDataInterval)
        clearInterval(depositUpdateInterval)
      }
    }
  }, [pools.length])

  // The value object that will be provided to all child components
  const value = {
    // State values
    pools,
    isLoading,
    isCreatingPool,
    
    // Action functions
    fetchPools,
    createPool,
    depositToPool,
    withdrawFromPool,
    getUserPoolBalance,
  }

  return (
    <PoolContext.Provider value={value}>
      {children}
    </PoolContext.Provider>
  )
} 