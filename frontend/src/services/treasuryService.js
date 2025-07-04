import * as StellarSDK from '@stellar/stellar-sdk'

// Stellar Testnet configuration
const STELLAR_NETWORK = StellarSDK.Networks.TESTNET
const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const server = new StellarSDK.Horizon.Server(HORIZON_URL)

// REAL Treasury Account for Testnet Withdrawals (Funded via Friendbot)
// In production, this would be managed by backend with proper security
const TREASURY_ACCOUNT = {
  publicKey: 'GB3TJ4HJZF2SXQDXRTB4GRKQPXUGRBZI3MQS43BTTBHG6MA64VE3BPVG',
  // For hackathon demo - in production this would be in secure backend
  secretKey: 'SDQEPK5SWE4SP4FIM2LOZEHQGVGJHKIEJDQKMDDSCXY7WSP2QMSOJQZ7'
}

// Treasury Management Service
// Handles fund flows, withdrawals, and pool treasury operations

// Configuration for testnet operations  
// In production this would be in secure backend
const TREASURY_CONFIG = {
  // ... existing code ...
}

/**
 * Send real XLM from treasury to user wallet
 * This creates an actual Stellar testnet transaction
 */
export const sendRealWithdrawal = async (recipientPublicKey, asset, amount) => {
  try {
    console.log(`🏦 Processing withdrawal: ${amount} ${asset} to ${recipientPublicKey}`)
    
    // Validate inputs
    if (!recipientPublicKey || !amount || amount <= 0) {
      throw new Error('Invalid withdrawal parameters')
    }
    
    // Load treasury account
    const treasuryKeyPair = StellarSDK.Keypair.fromSecret(TREASURY_ACCOUNT.secretKey)
    const treasuryAccount = await server.loadAccount(treasuryKeyPair.publicKey())
    
    // Check treasury balance
    const xlmBalance = treasuryAccount.balances.find(b => b.asset_type === 'native')
    if (!xlmBalance || parseFloat(xlmBalance.balance) < parseFloat(amount) + 1) {
      throw new Error('Insufficient treasury funds for withdrawal')
    }
    
    // Verify recipient account exists
    try {
      await server.loadAccount(recipientPublicKey)
    } catch (error) {
      if (error.response && error.response.status === 404) {
        throw new Error('Recipient account does not exist on Stellar network')
      }
      throw error
    }
    
    // Create withdrawal memo
    const memo = `Pool withdrawal: ${amount} ${asset}`
    
    // Build the transaction
    const transaction = new StellarSDK.TransactionBuilder(treasuryAccount, {
      fee: StellarSDK.BASE_FEE,
      networkPassphrase: STELLAR_NETWORK,
    })
      .addOperation(
        StellarSDK.Operation.payment({
          destination: recipientPublicKey,
          asset: StellarSDK.Asset.native(), // XLM
          amount: amount.toString(),
        })
      )
      .addMemo(StellarSDK.Memo.text(memo))
      .setTimeout(300) // 5 minutes timeout
      .build()
    
    // Sign the transaction with treasury key
    transaction.sign(treasuryKeyPair)
    
    // Submit to Stellar network
    console.log('📤 Submitting withdrawal transaction to Stellar...')
    const result = await server.submitTransaction(transaction)
    
    console.log('✅ Withdrawal successful!', {
      hash: result.hash,
      amount: `${amount} XLM`,
      recipient: recipientPublicKey,
      ledger: result.ledger
    })
    
    return {
      success: true,
      hash: result.hash,
      amount: parseFloat(amount),
      asset,
      recipient: recipientPublicKey,
      link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      ledger: result.ledger,
      timestamp: new Date().toISOString()
    }
    
  } catch (error) {
    console.error('❌ Withdrawal failed:', error)
    
    // Provide specific error messages
    if (error.message.includes('Insufficient treasury funds')) {
      throw new Error('Treasury has insufficient funds. Please contact support.')
    } else if (error.message.includes('Recipient account does not exist')) {
      throw new Error('Your wallet account is not activated on Stellar. Please fund it with XLM first.')
    } else if (error.response && error.response.data) {
      const stellarError = error.response.data
      if (stellarError.extras && stellarError.extras.result_codes) {
        const codes = stellarError.extras.result_codes
        throw new Error(`Stellar error: ${codes.transaction || stellarError.title}`)
      }
      throw new Error(`Network error: ${stellarError.title || stellarError.detail}`)
    } else {
      throw new Error(`Withdrawal failed: ${error.message}`)
    }
  }
}

/**
 * Check treasury account balance
 */
export const getTreasuryBalance = async () => {
  try {
    const account = await server.loadAccount(TREASURY_ACCOUNT.publicKey)
    const xlmBalance = account.balances.find(b => b.asset_type === 'native')
    
    return {
      balance: parseFloat(xlmBalance?.balance || 0),
      publicKey: TREASURY_ACCOUNT.publicKey,
      link: `https://stellar.expert/explorer/testnet/account/${TREASURY_ACCOUNT.publicKey}`
    }
  } catch (error) {
    console.error('Error checking treasury balance:', error)
    return { balance: 0, publicKey: TREASURY_ACCOUNT.publicKey }
  }
}

/**
 * Validate withdrawal request
 */
export const validateWithdrawal = async (recipientPublicKey, amount) => {
  try {
    // Check if recipient account exists
    await server.loadAccount(recipientPublicKey)
    
    // Check treasury has sufficient funds
    const treasury = await getTreasuryBalance()
    if (treasury.balance < parseFloat(amount) + 1) {
      return {
        valid: false,
        error: `Insufficient treasury funds. Available: ${treasury.balance} XLM`
      }
    }
    
    return { valid: true }
  } catch (error) {
    if (error.response && error.response.status === 404) {
      return {
        valid: false,
        error: 'Recipient account not found. Please fund your wallet with XLM first.'
      }
    }
    return {
      valid: false,
      error: `Validation failed: ${error.message}`
    }
  }
} 