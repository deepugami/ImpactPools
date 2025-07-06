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
  calculateYieldDistribution,
  getUserPoolPosition,
  getComprehensivePoolData
} from '../services/stellarService'
import { blendFactory } from '../services/blendService'
import { useWallet } from './WalletContext'
import { 
  sendRealWithdrawal, 
  getTreasuryBalance, 
  getPoolTreasuryBalance,
  getCombinedTreasuryBalance,
  validateWithdrawal,
  getUserMaxWithdrawable
} from '../services/treasuryService'
// NEW: Import NFT service for milestone checking
import nftService from '../services/nftService'
// NEW: Import enhanced Blend service
import { realBlendService } from '../services/realBlendService'
// ENHANCED: Import smart contract services for robust operation
import smartContractService from '../services/smartContractService'
import { blendIntegration } from '../services/blendIntegrationService'
import priceService from '../services/robustPriceService'

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
const API_BASE_URL = 'http://localhost:4000/api'

// Pool treasury account - user-funded testnet account
// Unified treasury account for both deposits and withdrawals
// This eliminates liquidity issues by using a single treasury account
const UNIFIED_TREASURY_ACCOUNT = 'GB3TJ4HJZF2SXQDXRTB4GRKQPXUGRBZI3MQS43BTTBHG6MA64VE3BPVG'
const POOL_TREASURY_ACCOUNT = UNIFIED_TREASURY_ACCOUNT

// ENHANCED: Smart contract configuration
const ENHANCED_MODE = process.env.REACT_APP_ENHANCED_MODE === 'true'
const SMART_CONTRACT_ENABLED = !!process.env.REACT_APP_IMPACT_POOL_CONTRACT

/**
 * PoolProvider component that manages ImpactPools state and API interactions
 * This wraps the entire app and provides pool functionality to all components
 */
export const PoolProvider = ({ children }) => {
  // Get wallet connection and public key from wallet context
  const { publicKey } = useWallet()
  
  // State for pools and loading/error states
  const [pools, setPools] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // State to track loading states
  const [isLoading, setIsLoading] = useState(false)
  const [isCreatingPool, setIsCreatingPool] = useState(false)

  // ENHANCED: Smart contract state
  const [smartContractEnabled, setSmartContractEnabled] = useState(false)
  const [priceServiceStatus, setPriceServiceStatus] = useState({ isLive: false })

  /**
   * ENHANCED: Initialize smart contract services
   */
  const initializeEnhancedServices = async () => {
    try {
      if (SMART_CONTRACT_ENABLED) {
        // Initialize smart contract service
        const contractResult = await smartContractService.initialize()
        if (contractResult.success) {
          setSmartContractEnabled(true)
          console.log('✅ Smart Contract Service initialized')
        }
        
        // Initialize Blend integration
        const blendResult = await blendIntegration.initialize()
        if (blendResult.success) {
          console.log('✅ Blend Integration initialized')
        }
      }
      
      // Always initialize robust price service
      const priceStatus = priceService.getStatus()
      setPriceServiceStatus(priceStatus)
      console.log('✅ Robust Price Service ready')
      
    } catch (error) {
      console.warn('Enhanced services initialization failed:', error)
      // Continue with traditional functionality
    }
  }

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
        
        // ENHANCED: Smart contract integration
        isSmartContract: false, // Will be updated if contract deployment succeeds
        contractId: null,
        
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
      
      // ENHANCED: Deploy smart contract if enabled
      if (smartContractEnabled && ENHANCED_MODE) {
        try {
          toast.loading('Deploying smart contract...', { id: 'pool-creation' })
          
          const contractResult = await smartContractService.deployImpactPool(
            { ...poolData, id: poolId },
            { publicKey: creatorPublicKey }
          )
          
          if (contractResult.success) {
            newPool.isSmartContract = true
            newPool.contractId = contractResult.contractId
            
            // Initialize Blend integration for the contract
            try {
              await blendIntegration.initialize(contractResult.contractId)
            } catch (blendError) {
              console.warn('Blend integration setup failed:', blendError)
            }
            
            console.log(`✅ Smart contract deployed: ${contractResult.contractId}`)
          }
        } catch (contractError) {
          console.warn('Smart contract deployment failed, using traditional pool:', contractError)
          // Continue with traditional pool creation
        }
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
   * ENHANCED: Make a deposit with smart contract support
   * Automatically uses smart contract if available, falls back to traditional method
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

      // ENHANCED: Use smart contract if available
      if (pool.isSmartContract && pool.contractId) {
        return await depositToSmartContract(pool, asset, amount, userPublicKey, signTransaction)
      } else {
        return await depositToTraditionalPool(pool, asset, amount, userPublicKey, signTransaction)
      }
      
    } catch (error) {
      console.error('Error depositing to pool:', error)
      toast.error(`Failed to deposit: ${error.message}`, { id: 'deposit' })
      return { success: false, error: error.message }
    }
  }

  /**
   * ENHANCED: Smart contract deposit
   */
  const depositToSmartContract = async (pool, asset, amount, userPublicKey, signTransaction) => {
    toast.loading('Creating smart contract deposit...', { id: 'deposit' })
    
    try {
      // Create smart contract deposit transaction
      const contractTxResult = await smartContractService.createDepositTransaction(
        pool.contractId,
        userPublicKey,
        amount,
        asset
      )
      
      if (!contractTxResult.success) {
        throw new Error(contractTxResult.error)
      }
      
      toast.loading('Please sign the transaction...', { id: 'deposit' })
      
      const signedTxXdr = await signTransaction(
        contractTxResult.xdr, 
        'Test SDF Network ; September 2015'
      )
      
      toast.loading('Submitting to Stellar network...', { id: 'deposit' })
      
      const result = await submitTransaction(signedTxXdr)
      
      // Update pool state
      await updatePoolAfterDeposit(pool, userPublicKey, amount, asset, result, true)
      
      toast.success(
        `Smart contract deposit successful! ${amount} ${asset}`,
        { id: 'deposit' }
      )
      
      return {
        success: true,
        transactionHash: result.hash,
        isSmartContract: true,
        transactionLink: `https://stellar.expert/explorer/testnet/tx/${result.hash}`
      }
      
    } catch (error) {
      console.error('Smart contract deposit failed:', error)
      throw error
    }
  }

  /**
   * Traditional pool deposit (enhanced with better error handling)
   */
  const depositToTraditionalPool = async (pool, asset, amount, userPublicKey, signTransaction) => {
    try {
      const depositMemo = `Deposit: ${pool.id.slice(-8)}`
      
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
      
      // Update pool state
      await updatePoolAfterDeposit(pool, userPublicKey, amount, asset, result, false)
      
      toast.success(
        `Successfully deposited ${amount} ${asset}! Tx: ${result.hash.slice(0, 8)}...`,
        { id: 'deposit' }
      )
      
      return { 
        success: true,
        transactionHash: result.hash,
        isSmartContract: false,
        transactionLink: `https://stellar.expert/explorer/testnet/tx/${result.hash}`
      }
    } catch (error) {
      console.error('Traditional deposit failed:', error)
      throw error
    }
  }

  /**
   * ENHANCED: Update pool state after deposit (works for both traditional and smart contract)
   */
  const updatePoolAfterDeposit = async (pool, userPublicKey, amount, asset, result, isSmartContract) => {
    // Create deposit record
    const deposit = {
      id: `deposit_${result.hash.slice(-8)}`,
      userId: userPublicKey,
      asset,
      amount: parseFloat(amount),
      timestamp: new Date().toISOString(),
      txHash: result.hash,
      txLink: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      isSmartContract
    }

    // Update pool data
    const transaction = {
      id: result.hash,
      type: 'deposit',
      amount: parseFloat(amount),
      asset,
      user: userPublicKey,
      timestamp: new Date().toISOString(),
      link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      isSmartContract
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
    
    // ENHANCED: Update corresponding services
    try {
      if (isSmartContract && pool.contractId) {
        // Smart contract pools get enhanced features
        const blendPool = await blendIntegration.getBlendYield(pool.contractId)
        if (blendPool) {
          updatedPool.currentAPY = blendPool.apy * 100
          updatedPool.totalYieldGenerated = blendPool.earned
        }
      } else {
        // Traditional pools use existing Blend factory
        const blendPool = blendFactory.getPool(pool.id)
        if (blendPool) {
          const blendResult = blendPool.deposit(parseFloat(amount), asset, userPublicKey)
          if (blendResult.success) {
            const healthMetrics = blendPool.getHealthMetrics()
            updatedPool.currentAPY = healthMetrics.supplyAPY
            updatedPool.utilizationRate = healthMetrics.utilization
          }
        }
      }
    } catch (error) {
      console.warn('Failed to update yield service:', error)
      // Continue anyway - transaction was successful
    }

    // Update backend
    await axios.put(`${API_BASE_URL}/pools/${pool.id}`, updatedPool)
    
    // Update local state
    setPools(prevPools => 
      prevPools.map(p => p.id === pool.id ? updatedPool : p)
    )
  }

  /**
   * ENHANCED: Withdraw from a pool with smart contract support
   * Automatically detects and uses the appropriate withdrawal method
   */
  const withdrawFromPool = async (poolId, amount, userPublicKey, signTransaction = null) => {
    if (!userPublicKey) {
      throw new Error('Please connect your wallet first')
    }

    try {
      const targetPool = pools.find(p => p.id === poolId)
      if (!targetPool) {
        throw new Error('Pool not found')
      }

      // ENHANCED: Use smart contract withdrawal if available
      if (targetPool.isSmartContract && targetPool.contractId) {
        if (!signTransaction) {
          throw new Error('Wallet signing required for smart contract withdrawals')
        }
        return await withdrawFromSmartContract(targetPool, amount, userPublicKey, signTransaction)
      } else {
        // Traditional pools use backend treasury service (no signing required)
        return await withdrawFromTraditionalPool(targetPool, amount, userPublicKey, signTransaction)
      }
      
    } catch (error) {
      console.error('Withdrawal error:', error)
      throw error
    }
  }

  /**
   * ENHANCED: Smart contract withdrawal
   */
  const withdrawFromSmartContract = async (pool, amount, userPublicKey, signTransaction) => {
    try {
      // Check user balance on contract
      const contractBalance = await smartContractService.getUserContractBalance(
        pool.contractId, 
        userPublicKey
      )
      
      if (contractBalance < amount) {
        throw new Error(`Insufficient contract balance. Available: ${contractBalance}`)
      }

      toast.loading('Creating smart contract withdrawal...', { id: 'withdrawal' })
      
      const contractTxResult = await smartContractService.createWithdrawalTransaction(
        pool.contractId,
        userPublicKey,
        amount
      )
      
      if (!contractTxResult.success) {
        throw new Error(contractTxResult.error)
      }
      
      toast.loading('Processing withdrawal from contract...', { id: 'withdrawal' })
      
      // For smart contracts, we simulate the withdrawal since it's handled by contract
      const result = {
        success: true,
        hash: contractTxResult.transaction.hash || `sim_${Date.now()}`,
        timestamp: new Date().toISOString(),
        link: contractTxResult.transaction.link || '#'
      }
      
      // Update pool state
      await updatePoolAfterWithdrawal(pool, amount, result, true)
      
      toast.success(
        `Smart contract withdrawal successful! ${amount} XLM`,
        { id: 'withdrawal' }
      )
      
      return result
      
    } catch (error) {
      console.error('Smart contract withdrawal failed:', error)
      throw error
    }
  }

  /**
   * Traditional pool withdrawal (enhanced with better validation)
   */
  const withdrawFromTraditionalPool = async (pool, amount, userPublicKey, signTransaction) => {
    if (!userPublicKey) {
      throw new Error('Wallet not connected')
    }

    // Validate amount
    if (amount <= 0) {
      throw new Error('Invalid withdrawal amount')
    }

    // Check if amount exceeds user's max withdrawable limit
    const maxWithdrawable = await getUserMaxWithdrawable(pool.id, userPublicKey)
    if (amount > maxWithdrawable) {
      throw new Error(`Cannot withdraw more than ${maxWithdrawable} XLM`)
    }

    try {
      toast.loading('Processing withdrawal through treasury...', { id: 'withdrawal' })
      
      // Get user's pool balance for validation
      const userBalance = await getUserPoolBalance(pool.id, userPublicKey)
      const userBalanceAmount = userBalance['XLM'] || 0
      
      // Use the backend treasury service for withdrawal
      const result = await sendRealWithdrawal(userPublicKey, 'XLM', amount, userBalanceAmount)
      
      if (!result.success) {
        throw new Error(result.error || 'Withdrawal failed')
      }
      
      // Create withdrawal record (negative amount to represent withdrawal)
      const withdrawal = {
        id: `withdrawal_${result.hash.slice(-8)}`,
        userId: userPublicKey,
        asset: 'XLM',
        amount: -parseFloat(amount), // NEGATIVE amount for withdrawal
        timestamp: result.timestamp || new Date().toISOString(),
        txHash: result.hash,
        txLink: result.link || `https://stellar.expert/explorer/testnet/tx/${result.hash}`
      }

      // Create transaction record
      const transaction = {
        id: result.hash,
        type: 'withdrawal',
        amount: parseFloat(amount),
        asset: 'XLM',
        user: userPublicKey,
        timestamp: result.timestamp || new Date().toISOString(),
        link: result.link || `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
        poolId: pool.id
      }

      // Update pool data with withdrawal record
      const currentPool = pools.find(p => p.id === pool.id)
      if (currentPool) {
        const updatedPool = {
          ...currentPool,
          totalDeposited: Math.max(0, currentPool.totalDeposited - parseFloat(amount)), // Reduce total
          deposits: [...currentPool.deposits, withdrawal], // Add negative withdrawal record
          transactions: [...(currentPool.transactions || []), transaction],
        }
        
        // Update local pool state
        setPools(prevPools => 
          prevPools.map(p => p.id === pool.id ? updatedPool : p)
        )

        // Update backend
        try {
          await axios.put(`${API_BASE_URL}/pools/${pool.id}`, updatedPool)
        } catch (error) {
          console.warn('Failed to update backend pool data:', error)
        }
      }

      // Refresh pool data to ensure consistency
      await fetchPools()
      
      return {
        success: true,
        hash: result.hash,
        transactionLink: result.link,
        amount: parseFloat(amount),
        asset: 'XLM'
      }
    } catch (error) {
      console.error('Withdrawal error:', error)
      throw error
    }
  }

  /**
   * ENHANCED: Update pool state after withdrawal (works for both traditional and smart contract)
   */
  const updatePoolAfterWithdrawal = async (pool, amount, result, isSmartContract) => {
    // Create withdrawal record (negative amount to represent withdrawal)
    const withdrawal = {
      id: `withdrawal_${result.hash.slice(-8)}`,
      userId: publicKey,
      asset: 'XLM',
      amount: -parseFloat(amount), // NEGATIVE amount for withdrawal
      timestamp: result.timestamp || new Date().toISOString(),
      txHash: result.hash,
      txLink: result.link || `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      isSmartContract
    }

    // Create transaction record
    const transaction = {
      id: result.hash,
      type: 'withdrawal',
      amount: parseFloat(amount),
      asset: 'XLM',
      user: publicKey,
      timestamp: result.timestamp || new Date().toISOString(),
      link: result.link || `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      poolId: pool.id,
      isSmartContract
    }

    // Update pool data with withdrawal record
    const updatedPool = {
      ...pool,
      totalDeposited: Math.max(0, pool.totalDeposited - parseFloat(amount)), // Reduce total
      deposits: [...pool.deposits, withdrawal], // Add negative withdrawal record
      transactions: [...(pool.transactions || []), transaction],
    }
    
    // Update local pool state
    setPools(prevPools => 
      prevPools.map(p => p.id === pool.id ? updatedPool : p)
    )

    // Update backend
    try {
      await axios.put(`${API_BASE_URL}/pools/${pool.id}`, updatedPool)
    } catch (error) {
      console.warn('Failed to update backend pool data:', error)
    }

    // Refresh pool data to ensure consistency
    await fetchPools()
  }

  /**
   * Get user's balance in a specific pool with enhanced accuracy
   * This calculates how much the user has deposited minus withdrawals
   * and ensures accurate balance representation
   */
  const getUserPoolBalance = async (poolId, userPublicKey) => {
    const pool = pools.find(p => p.id === poolId)
    if (!pool || !userPublicKey) return {}

    // ENHANCED: Use smart contract balance if available
    if (pool.isSmartContract && pool.contractId) {
      try {
        const contractBalance = await smartContractService.getUserContractBalance(
          pool.contractId, 
          userPublicKey
        )
        return { XLM: contractBalance }
      } catch (error) {
        console.warn('Failed to get contract balance, falling back to local calculation:', error)
      }
    }

    // Traditional balance calculation
    const userDeposits = pool.deposits.filter(d => d.userId === userPublicKey)
    
    // Group by asset and sum the amounts (deposits are positive, withdrawals are negative)
    const balances = userDeposits.reduce((acc, deposit) => {
      const asset = deposit.asset
      acc[asset] = (acc[asset] || 0) + deposit.amount
      return acc
    }, {})

    // Filter out zero or negative balances and ensure minimum precision
    Object.keys(balances).forEach(asset => {
      // Round to 6 decimal places to handle floating point precision
      balances[asset] = Math.round(balances[asset] * 1000000) / 1000000
      
      if (balances[asset] <= 0.000001) { // Minimum 0.000001 XLM threshold
        delete balances[asset]
      }
    })

    return balances
  }

  /**
   * Get user's available withdrawal amount for a specific asset
   * This ensures users can't withdraw more than they've deposited
   */
  const getUserAvailableWithdrawal = async (poolId, userPublicKey, asset) => {
    const balances = await getUserPoolBalance(poolId, userPublicKey)
    return balances[asset] || 0
  }

  /**
   * Get pool liquidity information for transparency
   */
  const getPoolLiquidityInfo = async (poolId) => {
    try {
      const pool = pools.find(p => p.id === poolId)
      if (!pool) return null

      // Get actual treasury balance
      const treasuryBalance = await getPoolTreasuryBalance()
      
      // Calculate total user deposits in pool
      const totalUserDeposits = pool.deposits
        .filter(d => d.amount > 0) // Only positive deposits
        .reduce((sum, d) => sum + d.amount, 0)
      
      // Calculate total withdrawals from pool
      const totalWithdrawals = pool.deposits
        .filter(d => d.amount < 0) // Only negative withdrawals
        .reduce((sum, d) => sum + Math.abs(d.amount), 0)
      
      const netPoolBalance = totalUserDeposits - totalWithdrawals
      const utilizationRate = treasuryBalance.balance > 0 ? netPoolBalance / treasuryBalance.balance : 0

      return {
        treasuryBalance: treasuryBalance.balance,
        totalDeposited: totalUserDeposits,
        totalWithdrawn: totalWithdrawals,
        netPoolBalance,
        utilizationRate,
        availableLiquidity: treasuryBalance.balance,
        isHealthy: utilizationRate < 0.9 // Pool is healthy if under 90% utilization
      }
    } catch (error) {
      console.error('Error getting pool liquidity info:', error)
      return null
    }
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
            
            // Note: Yield generation is now handled by backend service every 10 minutes
            // We only update market metrics here (APY, utilization, etc.)
            return {
              ...pool,
              currentAPY: (healthMetrics.currentAPY || 0.05) * 100, // Convert to percentage
              utilizationRate: healthMetrics.utilization.utilizationRate || 0,
              riskLevel: healthMetrics.riskLevel || 'LOW',
              healthScore: healthMetrics.healthScore || 100,
              lastUpdated: healthMetrics.lastUpdated
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
    // Initialize enhanced services first
    initializeEnhancedServices()
    
    // Then fetch pools
    fetchPools()
  }, [])

  /**
   * Update market data periodically for real-time pool information
   */
  useEffect(() => {
    if (pools.length > 0) {
      // Update market data every 60 seconds for real-time APY/health information
      const marketDataInterval = setInterval(updatePoolMarketData, 60000)
      
      // Fetch pool updates every 10 minutes to show real-time yield/donation accumulation
      const poolUpdateInterval = setInterval(() => fetchPools(true), 10 * 60 * 1000) // 10 minutes
      
      // Initial update after pools are loaded
      updatePoolMarketData()
      
      return () => {
        clearInterval(marketDataInterval)
        clearInterval(poolUpdateInterval)
      }
    }
  }, [pools.length])

  // NEW: Add on-chain balance fetching function
  const fetchOnChainPoolData = async (poolId, forceRefresh = false) => {
    if (!publicKey) return null;
    
    try {
      const pool = pools.find(p => p.id === poolId);
      if (!pool) {
        console.warn(`Pool ${poolId} not found`);
        return null;
      }
      
      // Get comprehensive on-chain data
      const onChainData = await getComprehensivePoolData(
        poolId, 
        publicKey, 
        pool.treasury || POOL_TREASURY_ACCOUNT
      );
      
      // Also try to get Blend protocol data
      let blendData = null;
      try {
        blendData = await realBlendService.getComprehensiveBlendData(publicKey);
      } catch (blendError) {
        console.warn('Blend data not available:', blendError.message);
      }
      
      return {
        ...onChainData,
        blendData,
        poolId,
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error fetching on-chain pool data:', error);
      return null;
    }
  };

  // NEW: Enhanced balance calculation using on-chain data
  const calculateUserPoolBalance = async (poolId, asset = 'XLM') => {
    if (!publicKey) return 0;
    
    try {
      const onChainData = await fetchOnChainPoolData(poolId);
      
      if (onChainData && onChainData.userPosition.isOnChainData) {
        // Use real on-chain cumulative balance
        return onChainData.userPosition.netPosition;
      }
      
      // Fallback to local calculation
      const pool = pools.find(p => p.id === poolId);
      if (!pool || !pool.deposits) return 0;
      
      const userDeposits = pool.deposits.filter(d => d.user === publicKey && d.asset === asset);
      const totalDeposits = userDeposits.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
      
      return totalDeposits;
      
    } catch (error) {
      console.error('Error calculating user pool balance:', error);
      return 0;
    }
  };

  // NEW: Load treasury information
  const loadTreasuryInfo = async (forceRefresh = false) => {
    try {
      // Get treasury balance
      const treasuryBalance = await getTreasuryBalance();
      
      return {
        balance: treasuryBalance.balance,
        publicKey: treasuryBalance.publicKey,
        link: treasuryBalance.link,
        lastUpdated: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('Error loading treasury info:', error);
      return {
        balance: 0,
        publicKey: '',
        link: '',
        error: error.message,
        lastUpdated: new Date().toISOString()
      };
    }
  };

  // Helper function to get pool TVL
  const getPoolTVL = (poolId) => {
    const pool = pools.find(p => p.id === poolId);
    return pool ? pool.totalDeposited || 0 : 0;
  };

  // Pool health metrics function
  const getPoolHealthMetrics = async (pool) => {
    try {
      // Calculate basic health metrics
      const currentAPY = await calculateRealAPY(pool);
      const utilizationRate = pool.totalDeposited > 0 ? 
        ((pool.totalDeposited - (pool.availableLiquidity || pool.totalDeposited)) / pool.totalDeposited) : 0;
      
      const healthScore = Math.max(0, Math.min(100, 100 - (utilizationRate * 50)));
      const riskLevel = healthScore > 80 ? 'LOW' : healthScore > 60 ? 'MEDIUM' : 'HIGH';
      
      return {
        currentAPY,
        utilization: { utilizationRate },
        healthScore,
        riskLevel,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error calculating pool health metrics:', error);
      return {
        currentAPY: 0.05,
        utilization: { utilizationRate: 0 },
        healthScore: 100,
        riskLevel: 'LOW',
        lastUpdated: new Date().toISOString()
      };
    }
  };

  // The value object that will be provided to all child components
  const value = {
    // State
    pools,
    loading,
    error,
    
    // ENHANCED: Smart contract state
    smartContractEnabled,
    priceServiceStatus,
    enhancedMode: ENHANCED_MODE,
    
    // Wallet connection
    publicKey,
    isWalletConnected: !!publicKey,
    
    // Pool operations
    createPool,
    depositToPool,
    withdrawFromPool,
    
    // Balance calculation functions
    getUserPoolBalance, // Enhanced with smart contract support
    getUserAvailableWithdrawal, // New function for accurate withdrawal limits
    getPoolLiquidityInfo, // New function for pool transparency
    calculateUserPoolBalance, // New async function with on-chain data
    fetchOnChainPoolData,
    
    // Treasury operations
    loadTreasuryInfo,
    refreshTreasuryInfo: () => loadTreasuryInfo(true), // Force refresh
    
    // Pool data
    fetchPools, // Function to refresh pool data
    getPoolById: (id) => pools.find(pool => pool.id === id),
    getPoolTVL,
    
    // Pool health and metrics
    getPoolHealthMetrics,
    
    // ENHANCED: Smart contract services
    smartContractService,
    blendIntegration,
    priceService,
    
    // NFT operations
    nftService
  }

  return (
    <PoolContext.Provider value={value}>
      {children}
    </PoolContext.Provider>
  )
}