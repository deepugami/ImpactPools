/**
 * On-Chain Balance Testing Script
 * 
 * This script demonstrates how to fetch real cumulative balance data
 * from Stellar blockchain and Blend protocol
 */

import { 
  getUserPoolPosition, 
  getComprehensivePoolData,
  getPoolTreasuryInfo 
} from './stellarService.js';

import { realBlendService } from './realBlendService.js';

// Example addresses for testing
const EXAMPLE_USER = 'GCKFBEIYTKP5ROOZBFYWBHCFBOFBEFC3YSAYWTRN5DQPXQNYQGTOXJF4'; // Example user
const POOL_TREASURY = 'GAEYMY5KLHSRZQPC2RV7FSETCB27J2BU7OQ4U6O2LG6ZMXIZPUZCYAHD'; // Pool treasury
const EXAMPLE_POOL_ID = 'pool_example_123';

/**
 * Test comprehensive on-chain balance fetching
 */
export const testOnChainBalanceFetching = async (userPublicKey, poolId) => {
  console.log('🧪 Testing On-Chain Balance Fetching...');
  console.log(`   User: ${userPublicKey.slice(0, 8)}...${userPublicKey.slice(-4)}`);
  console.log(`   Pool: ${poolId}`);
  console.log('');

  try {
    // Step 1: Test Stellar on-chain position fetching
    console.log('📊 Step 1: Fetching user pool position from Stellar blockchain...');
    const userPosition = await getUserPoolPosition(userPublicKey, POOL_TREASURY);
    
    console.log('✅ User Position Results:');
    console.log(`   Total Deposited: ${userPosition.totalDeposited} XLM`);
    console.log(`   Total Withdrawn: ${userPosition.totalWithdrawn} XLM`);
    console.log(`   Net Position: ${userPosition.netPosition} XLM`);
    console.log(`   Transaction Count: ${userPosition.depositCount}`);
    console.log(`   Data Source: ${userPosition.isOnChainData ? 'On-chain' : 'Local'}`);
    console.log('');

    // Step 2: Test pool treasury analysis
    console.log('🏦 Step 2: Analyzing pool treasury...');
    const treasuryInfo = await getPoolTreasuryInfo(POOL_TREASURY);
    
    console.log('✅ Treasury Analysis Results:');
    console.log(`   Current Balance: ${treasuryInfo.balance} XLM`);
    console.log(`   Total Inflow: ${treasuryInfo.totalInflow} XLM`);
    console.log(`   Total Outflow: ${treasuryInfo.totalOutflow} XLM`);
    console.log(`   Participants: ${treasuryInfo.participantCount}`);
    console.log(`   Explorer: ${treasuryInfo.accountLink}`);
    console.log('');

    // Step 3: Test comprehensive pool data
    console.log('🔍 Step 3: Fetching comprehensive pool data...');
    const comprehensiveData = await getComprehensivePoolData(poolId, userPublicKey, POOL_TREASURY);
    
    console.log('✅ Comprehensive Analysis Results:');
    console.log(`   Pool TVL: ${comprehensiveData.poolMetrics.totalValueLocked} XLM`);
    console.log(`   Available Liquidity: ${comprehensiveData.poolMetrics.availableLiquidity} XLM`);
    console.log(`   Utilization Rate: ${comprehensiveData.poolMetrics.utilizationRate.toFixed(2)}%`);
    console.log(`   User Share: ${comprehensiveData.poolMetrics.userSharePercentage.toFixed(4)}%`);
    console.log('');

    // Step 4: Test Blend protocol integration
    console.log('🌐 Step 4: Testing Blend protocol integration...');
    try {
      const blendData = await realBlendService.getComprehensiveBlendData(userPublicKey);
      
      console.log('✅ Blend Protocol Results:');
      console.log(`   Has Position: ${blendData.userPosition.hasPosition}`);
      console.log(`   Total Supplied: $${blendData.userPosition.totalSupplied.toFixed(2)}`);
      console.log(`   Total Borrowed: $${blendData.userPosition.totalBorrowed.toFixed(2)}`);
      console.log(`   Net Position: $${blendData.userPosition.netPosition.toFixed(2)}`);
      console.log(`   Health Factor: ${blendData.userPosition.healthFactor || 'N/A'}`);
      console.log(`   Pool TVL: $${blendData.poolData.totalTVL.toFixed(2)}`);
      console.log(`   Testnet URL: ${blendData.testnetUrl}`);
      
    } catch (blendError) {
      console.log('⚠️ Blend Protocol Results:');
      console.log(`   Status: Not available (${blendError.message})`);
      console.log(`   Fallback: Using Stellar-only data`);
    }
    console.log('');

    // Summary
    console.log('📋 SUMMARY - Balance Calculation Sources:');
    console.log('');
    console.log('✅ RECOMMENDED: On-chain cumulative balance calculation');
    console.log(`   Source: Stellar Horizon API`);
    console.log(`   Method: Analyze all user transactions with pool treasury`);
    console.log(`   Accuracy: 100% (real blockchain data)`);
    console.log(`   Balance: ${userPosition.netPosition} XLM`);
    console.log('');
    console.log('📊 ENHANCED: Blend protocol position data');
    console.log(`   Source: Blend SDK + Testnet (${realBlendService.blendTestnetUrl})`);
    console.log(`   Method: Query user positions from Blend smart contracts`);
    console.log(`   Features: Health factor, yield tracking, multi-asset support`);
    console.log('');

    return {
      userPosition,
      treasuryInfo,
      comprehensiveData,
      success: true,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Compare local vs on-chain balance calculation
 */
export const compareBalanceCalculations = async (userPublicKey, poolData) => {
  console.log('⚖️ Comparing Balance Calculation Methods...');
  console.log('');

  try {
    // Local calculation (current method)
    const localDeposits = poolData.deposits?.filter(d => d.user === userPublicKey) || [];
    const localBalance = localDeposits.reduce((sum, deposit) => sum + parseFloat(deposit.amount), 0);
    
    // On-chain calculation (new method)
    const onChainPosition = await getUserPoolPosition(userPublicKey, POOL_TREASURY);
    
    console.log('📊 COMPARISON RESULTS:');
    console.log('');
    console.log(`Local Calculation (Current):`);
    console.log(`   Balance: ${localBalance} XLM`);
    console.log(`   Source: Frontend pool data`);
    console.log(`   Deposits: ${localDeposits.length} transactions`);
    console.log('');
    console.log(`On-Chain Calculation (New):`);
    console.log(`   Balance: ${onChainPosition.netPosition} XLM`);
    console.log(`   Source: Stellar blockchain`);
    console.log(`   Deposits: ${onChainPosition.totalDeposited} XLM`);
    console.log(`   Withdrawals: ${onChainPosition.totalWithdrawn} XLM`);
    console.log(`   Transactions: ${onChainPosition.depositCount}`);
    console.log('');
    
    const difference = Math.abs(localBalance - onChainPosition.netPosition);
    if (difference > 0.000001) { // Account for floating point precision
      console.log(`⚠️ DISCREPANCY DETECTED:`);
      console.log(`   Difference: ${difference.toFixed(6)} XLM`);
      console.log(`   Recommendation: Use on-chain calculation for accuracy`);
    } else {
      console.log(`✅ CALCULATIONS MATCH:`);
      console.log(`   Both methods show ${localBalance} XLM`);
    }
    
    return {
      localBalance,
      onChainBalance: onChainPosition.netPosition,
      difference,
      recommendation: difference > 0.000001 ? 'use_onchain' : 'either_method'
    };

  } catch (error) {
    console.error('❌ Comparison failed:', error);
    return { error: error.message };
  }
};

/**
 * Quick balance check for debugging
 */
export const quickBalanceCheck = async (userPublicKey) => {
  console.log(`🔍 Quick balance check for ${userPublicKey.slice(0, 8)}...`);
  
  try {
    const position = await getUserPoolPosition(userPublicKey, POOL_TREASURY);
    
    console.log(`✅ Result: ${position.netPosition} XLM`);
    console.log(`   (${position.totalDeposited} deposited - ${position.totalWithdrawn} withdrawn)`);
    
    return position.netPosition;
    
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return 0;
  }
};

// Export for console usage
window.testOnChainBalance = testOnChainBalanceFetching;
window.compareBalances = compareBalanceCalculations;
window.quickBalanceCheck = quickBalanceCheck;

console.log('🧪 On-chain balance testing tools loaded!');
console.log('');
console.log('Usage in browser console:');
console.log('  testOnChainBalance(userPublicKey, poolId)');
console.log('  compareBalances(userPublicKey, poolData)');
console.log('  quickBalanceCheck(userPublicKey)');
console.log(''); 