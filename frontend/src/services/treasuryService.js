import * as StellarSDK from '@stellar/stellar-sdk'
import axios from 'axios'

// Stellar Testnet configuration
const STELLAR_NETWORK = StellarSDK.Networks.TESTNET
const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const server = new StellarSDK.Horizon.Server(HORIZON_URL)

// Backend API URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

// Unified treasury account for both deposits and withdrawals (public info only)
// This eliminates liquidity issues by using a single treasury account
const UNIFIED_TREASURY_ACCOUNT = 'GB3TJ4HJZF2SXQDXRTB4GRKQPXUGRBZI3MQS43BTTBHG6MA64VE3BPVG'
const POOL_TREASURY_ACCOUNT = UNIFIED_TREASURY_ACCOUNT

// Treasury Management Service
// Now uses secure backend API instead of exposing secret keys

/**
 * Send real XLM from treasury to user wallet via backend API
 * This is now secure - secret keys are handled by backend only
 */
export const sendRealWithdrawal = async (recipientPublicKey, asset, amount, userPoolBalance = 0) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/withdrawal/process`, {
      recipientPublicKey,
      asset,
      amount: parseFloat(amount),
      userPoolBalance
    })
    
    if (response.data.success) {
      return response.data
    } else {
      throw new Error(response.data.error || 'Withdrawal failed')
    }
    
  } catch (error) {
    console.error('❌ Withdrawal failed:', error)
    
    if (error.response && error.response.data) {
      throw new Error(error.response.data.error || 'Withdrawal failed')
    } else {
      throw new Error(`Withdrawal failed: ${error.message}`)
    }
  }
}

/**
 * Check treasury account balance via backend API
 */
export const getTreasuryBalance = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/withdrawal/treasury-balance`)
    
    if (response.data.success) {
      return response.data
    } else {
      throw new Error(response.data.error || 'Failed to fetch treasury balance')
    }
  } catch (error) {
    console.error('Error checking treasury balance:', error)
    return { 
      success: false, 
      balance: 0, 
      error: error.message 
    }
  }
}

/**
 * Check pool treasury account balance via backend API
 */
export const getPoolTreasuryBalance = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/api/withdrawal/pool-treasury-balance`)
    
    if (response.data.success) {
      return response.data
    } else {
      throw new Error(response.data.error || 'Failed to fetch pool treasury balance')
    }
  } catch (error) {
    console.error('Error checking pool treasury balance:', error)
    return { 
      success: false, 
      balance: 0, 
      publicKey: POOL_TREASURY_ACCOUNT,
      error: error.message 
    }
  }
}

/**
 * Get combined treasury balance for withdrawals via backend API
 */
export const getCombinedTreasuryBalance = async () => {
  try {
    const [withdrawalTreasury, poolTreasury] = await Promise.all([
      getTreasuryBalance(),
      getPoolTreasuryBalance()
    ])
    
    return {
      available: withdrawalTreasury.balance || 0,
      poolDeposits: poolTreasury.balance || 0,
      total: (withdrawalTreasury.balance || 0) + (poolTreasury.balance || 0),
      withdrawalAccount: withdrawalTreasury.publicKey,
      poolAccount: poolTreasury.publicKey || POOL_TREASURY_ACCOUNT
    }
  } catch (error) {
    console.error('Error checking combined treasury balance:', error)
    return { 
      available: 0, 
      poolDeposits: 0, 
      total: 0,
      withdrawalAccount: null,
      poolAccount: POOL_TREASURY_ACCOUNT,
      error: error.message
    }
  }
}

/**
 * Validate withdrawal request via backend API
 */
export const validateWithdrawal = async (recipientPublicKey, amount, userPoolBalance = 0) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/api/withdrawal/validate`, {
      recipientPublicKey,
      amount: parseFloat(amount),
      userPoolBalance
    })
    
    return response.data
  } catch (error) {
    console.error('Error validating withdrawal:', error)
    return {
      valid: false,
      error: `Validation failed: ${error.message}`,
      reason: 'validation_error'
    }
  }
}

/**
 * Get user's maximum withdrawable amount
 */
export const getUserMaxWithdrawable = async (userPoolBalance) => {
  try {
    const validation = await validateWithdrawal('GDOJCL3TYPS3YJX53QIERHEKWALVSNKMUZH4K7XGT25APLFNHW6HNDNP', 0.1, userPoolBalance) // Use dummy values for balance check
    
    if (validation.valid) {
      return {
        maxWithdrawable: validation.maxWithdrawable || Math.max(0, Math.min(userPoolBalance, (validation.treasuryBalance || 0) - 1)),
        userPoolBalance,
        treasuryAvailable: validation.treasuryBalance || 0,
        limitedBy: validation.maxWithdrawable === userPoolBalance ? 'user_balance' : 'treasury_balance'
      }
    } else {
      return {
        maxWithdrawable: 0,
        userPoolBalance,
        treasuryAvailable: 0,
        limitedBy: 'error',
        error: validation.error
      }
    }
  } catch (error) {
    console.error('Error getting max withdrawable amount:', error)
    return {
      maxWithdrawable: 0,
      userPoolBalance,
      treasuryAvailable: 0,
      limitedBy: 'error',
      error: error.message
    }
  }
} 