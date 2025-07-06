import express from 'express'
import * as StellarSDK from '@stellar/stellar-sdk'

const router = express.Router()

// Stellar Testnet configuration
const STELLAR_NETWORK = StellarSDK.Networks.TESTNET
const HORIZON_URL = 'https://horizon-testnet.stellar.org'
const server = new StellarSDK.Horizon.Server(HORIZON_URL)

// Treasury Account Configuration - Dynamic Detection
// The system will check multiple potential treasury accounts to find the one with funds

// Default treasury account for compatibility with frontend
const POOL_TREASURY_ACCOUNT = 'GB3TJ4HJZF2SXQDXRTB4GRKQPXUGRBZI3MQS43BTTBHG6MA64VE3BPVG'

const POTENTIAL_TREASURY_ACCOUNTS = [
  {
    name: 'User Wallet Treasury',
    publicKey: 'GDOJCL3TYPS3YJX53QIERHEKWALVSNKMUZH4K7XGT25APLFNHW6HNDNP',
    // Note: This account has the funds but no secret key for automated withdrawals
    // Will require user signing for withdrawals
  },
  {
    name: 'Legacy Pool Treasury', 
    publicKey: 'GAEYMY5KLHSRZQPC2RV7FSETCB27J2BU7OQ4U6O2LG6ZMXIZPUZCYAHD',
    // Original pool treasury account
  },
  {
    name: 'Unified Treasury',
    publicKey: 'GB3TJ4HJZF2SXQDXRTB4GRKQPXUGRBZI3MQS43BTTBHG6MA64VE3BPVG',
    secretKey: 'SDQEPK5SWE4SP4FIM2LOZEHQGVGJHKIEJDQKMDDSCXY7WSP2QMSOJQZ7'
  }
]

/**
 * Find the treasury account that has sufficient funds for withdrawal
 */
const findTreasuryWithFunds = async (requiredAmount) => {
  for (const treasury of POTENTIAL_TREASURY_ACCOUNTS) {
    try {
      // Skip accounts without secret keys (can't perform automated withdrawals)
      if (!treasury.secretKey) {
        console.log(`⏭️ Skipping ${treasury.name} - no secret key for automated withdrawals`)
        continue
      }
      
      const account = await server.loadAccount(treasury.publicKey)
      const xlmBalance = account.balances.find(b => b.asset_type === 'native')
      
      if (xlmBalance && parseFloat(xlmBalance.balance) >= parseFloat(requiredAmount) + 1) {
        console.log(`✅ Found treasury with sufficient funds: ${treasury.name} (${treasury.publicKey})`)
        console.log(`   Balance: ${xlmBalance.balance} XLM, Required: ${requiredAmount} XLM`)
        return treasury
      } else {
        console.log(`❌ ${treasury.name} has insufficient funds: ${xlmBalance?.balance || 0} XLM (needs ${requiredAmount} + 1 XLM)`)
      }
    } catch (error) {
      console.warn(`⚠️ Could not check treasury ${treasury.name}:`, error.message)
    }
  }
  
  console.error('❌ No treasury account found with both sufficient funds and secret key')
  return null
}

/**
 * Utility function to ensure memo is under 28 bytes limit
 */
const validateMemo = (memo) => {
  if (!memo) return ''
  
  const encoder = new TextEncoder()
  const bytes = encoder.encode(memo)
  
  if (bytes.length <= 28) {
    return memo
  }
  
  let truncated = memo
  while (encoder.encode(truncated).length > 28) {
    truncated = truncated.slice(0, -1)
  }
  
  return truncated
}

/**
 * POST /api/withdrawal/process
 * Process a withdrawal from treasury to user wallet
 */
router.post('/process', async (req, res) => {
  try {
    const { recipientPublicKey, asset, amount, userPoolBalance } = req.body

    // Validate inputs
    if (!recipientPublicKey || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid withdrawal parameters'
      })
    }

    // Validate that user isn't withdrawing more than they deposited
    if (userPoolBalance && parseFloat(amount) > userPoolBalance) {
      return res.status(400).json({
        success: false,
        error: `Insufficient pool balance. You have ${userPoolBalance} XLM deposited.`,
        reason: 'insufficient_user_balance'
      })
    }

    // Find a treasury account with sufficient funds
    const treasury = await findTreasuryWithFunds(amount)
    
    if (!treasury || !treasury.secretKey) {
      return res.status(400).json({
        success: false,
        error: 'No treasury account available with sufficient funds for withdrawal',
        reason: 'insufficient_treasury_funds'
      })
    }

    // Load treasury account
    const treasuryKeyPair = StellarSDK.Keypair.fromSecret(treasury.secretKey)
    const treasuryAccount = await server.loadAccount(treasuryKeyPair.publicKey())

    // Double-check treasury balance
    const xlmBalance = treasuryAccount.balances.find(b => b.asset_type === 'native')
    if (!xlmBalance || parseFloat(xlmBalance.balance) < parseFloat(amount) + 1) {
      return res.status(400).json({
        success: false,
        error: 'Treasury has insufficient funds for withdrawal',
        reason: 'insufficient_treasury_funds',
        treasuryBalance: parseFloat(xlmBalance?.balance || 0)
      })
    }

    // Verify recipient account exists
    try {
      await server.loadAccount(recipientPublicKey)
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.status(400).json({
          success: false,
          error: 'Your wallet account is not activated on Stellar. Please fund it with XLM first.',
          reason: 'account_not_found'
        })
      }
      throw error
    }

    // Create withdrawal memo
    const memo = validateMemo(`Pool withdrawal: ${amount} ${asset}`)

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
    const result = await server.submitTransaction(transaction)

    res.json({
      success: true,
      hash: result.hash,
      amount: parseFloat(amount),
      asset,
      recipient: recipientPublicKey,
      link: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      ledger: result.ledger,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('❌ [BACKEND] Withdrawal failed:', error)

    // Provide specific error messages
    if (error.response && error.response.data) {
      const stellarError = error.response.data
      if (stellarError.extras && stellarError.extras.result_codes) {
        const codes = stellarError.extras.result_codes
        return res.status(400).json({
          success: false,
          error: `Stellar error: ${codes.transaction || stellarError.title}`,
          stellarCode: codes.transaction,
          details: stellarError.extras
        })
      }
      return res.status(400).json({
        success: false,
        error: `Network error: ${stellarError.title || stellarError.detail}`,
        details: stellarError
      })
    } else {
      return res.status(500).json({
        success: false,
        error: `Withdrawal failed: ${error.message}`
      })
    }
  }
})

/**
 * GET /api/withdrawal/treasury-balance
 * Get current treasury balance
 */
router.get('/treasury-balance', async (req, res) => {
  try {
    // Use the unified treasury account that has funds
    const unifiedTreasury = POTENTIAL_TREASURY_ACCOUNTS.find(t => t.secretKey)
    
    if (!unifiedTreasury) {
      return res.json({
        success: false,
        balance: 0,
        publicKey: null,
        error: 'No treasury account configured'
      })
    }
    
    const account = await server.loadAccount(unifiedTreasury.publicKey)
    const xlmBalance = account.balances.find(b => b.asset_type === 'native')

    res.json({
      success: true,
      balance: parseFloat(xlmBalance?.balance || 0),
      publicKey: unifiedTreasury.publicKey,
      link: `https://stellar.expert/explorer/testnet/account/${unifiedTreasury.publicKey}`
    })
  } catch (error) {
    console.error('Error checking treasury balance:', error)
    res.json({
      success: false,
      balance: 0,
      publicKey: null,
      error: error.message
    })
  }
})

/**
 * GET /api/withdrawal/pool-treasury-balance
 * Get pool treasury balance
 */
router.get('/pool-treasury-balance', async (req, res) => {
  try {
    const account = await server.loadAccount(POOL_TREASURY_ACCOUNT)
    const xlmBalance = account.balances.find(b => b.asset_type === 'native')

    res.json({
      success: true,
      balance: parseFloat(xlmBalance?.balance || 0),
      publicKey: POOL_TREASURY_ACCOUNT,
      link: `https://stellar.expert/explorer/testnet/account/${POOL_TREASURY_ACCOUNT}`
    })
  } catch (error) {
    console.error('Error checking pool treasury balance:', error)
    res.json({
      success: false,
      balance: 0,
      publicKey: POOL_TREASURY_ACCOUNT,
      error: error.message
    })
  }
})

/**
 * POST /api/withdrawal/validate
 * Validate withdrawal request (simplified with unified treasury)
 */
router.post('/validate', async (req, res) => {
  try {
    const { recipientPublicKey, amount, userPoolBalance = 0 } = req.body

    // Check if recipient account exists
    try {
      await server.loadAccount(recipientPublicKey)
    } catch (error) {
      if (error.response && error.response.status === 404) {
        return res.json({
          valid: false,
          error: 'Your wallet account is not activated on Stellar. Please fund it with XLM first.',
          reason: 'account_not_found'
        })
      }
      throw error
    }

    // Check user balance
    if (parseFloat(amount) > userPoolBalance) {
      return res.json({
        valid: false,
        error: `Insufficient pool balance. You have ${userPoolBalance} XLM deposited.`,
        reason: 'insufficient_user_balance'
      })
    }

    // Check unified treasury balance (no separate pool/withdrawal treasury confusion)
    const unifiedTreasury = POTENTIAL_TREASURY_ACCOUNTS.find(t => t.secretKey)
    
    if (!unifiedTreasury) {
      return res.json({
        valid: false,
        error: 'No treasury account configured',
        reason: 'treasury_not_configured'
      })
    }
    
    const account = await server.loadAccount(unifiedTreasury.publicKey)
    const xlmBalance = account.balances.find(b => b.asset_type === 'native')
    const treasuryBalance = parseFloat(xlmBalance?.balance || 0)

    if (treasuryBalance < parseFloat(amount) + 1) {
      return res.json({
        valid: false,
        error: `Insufficient treasury funds. Available: ${treasuryBalance} XLM.`,
        reason: 'insufficient_treasury_funds',
        treasuryBalance
      })
    }

    res.json({
      valid: true,
      treasuryBalance,
      userPoolBalance,
      maxWithdrawable: Math.min(userPoolBalance, treasuryBalance - 1)
    })

  } catch (error) {
    res.json({
      valid: false,
      error: `Validation failed: ${error.message}`,
      reason: 'validation_error'
    })
  }
})

export default router