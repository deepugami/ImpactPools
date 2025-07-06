# Smart Contract Testing Guide

## 🎯 Overview
This guide covers testing the enhanced ImpactPools system with Soroban smart contracts, Blend protocol integration, and robust price feeds.

## 🔧 Prerequisites

### 1. Development Environment
```bash
# Install Rust and Soroban CLI
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
cargo install --locked soroban-cli

# Verify installation
soroban --version
```

### 2. Stellar Account Setup
```bash
# Generate admin account for contract deployment
soroban keys generate admin --network testnet

# Fund the account (get XLM from friendbot)
curl "https://friendbot.stellar.org?addr=YOUR_PUBLIC_KEY"
```

### 3. Environment Configuration
```bash
# Create .env files with contract addresses
cp .env.example .env.local

# Add your admin secret key
ADMIN_SECRET=YOUR_SECRET_KEY
NETWORK=testnet
```

## 🚀 Smart Contract Deployment

### 1. Build and Deploy Contracts
```bash
# Make the deployment script executable
chmod +x scripts/deploy-contracts.sh

# Run deployment
./scripts/deploy-contracts.sh

# Or manually:
cd contracts/impact_pool
soroban contract build
soroban contract deploy --wasm target/wasm32-unknown-unknown/release/impact_pool.wasm --source-account $ADMIN_SECRET --network testnet
```

### 2. Verify Deployment
```bash
# Check contract exists
soroban contract invoke --id YOUR_CONTRACT_ID --source-account $ADMIN_SECRET --network testnet -- --help

# Test basic contract functions
soroban contract invoke --id YOUR_CONTRACT_ID --source-account $ADMIN_SECRET --network testnet -- get_pool_info
```

## 🧪 Testing Scenarios

### 1. Contract Pool Creation
```javascript
// Frontend test
const poolData = {
  name: 'Test Smart Pool',
  charity: 'Ocean Cleanup',
  assets: ['XLM'],
  donationPercentage: 20
}

const result = await createEnhancedPool(poolData, userPublicKey, signTransaction)
console.log('Pool created:', result.contractId)
```

### 2. Smart Contract Deposits
```javascript
// Test deposit flow
const depositResult = await depositToEnhancedPool(
  poolId,
  'XLM',
  100, // 100 XLM
  userPublicKey,
  signTransaction
)

console.log('Deposit successful:', depositResult.isSmartContract)
```

### 3. Smart Contract Withdrawals
```javascript
// Test withdrawal flow
const withdrawResult = await withdrawFromEnhancedPool(
  poolId,
  50, // 50 XLM
  userPublicKey,
  signTransaction
)

console.log('Withdrawal successful:', withdrawResult.isSmartContract)
```

### 4. Price Service Reliability
```javascript
// Test multi-API fallback
const xlmPrice = await priceService.getXLMPrice()
console.log('XLM Price:', xlmPrice)

// Test all APIs
const prices = await priceService.getPrices(['stellar', 'usd-coin'])
console.log('All prices:', prices)

// Test fallback behavior (simulate API failures)
priceService.clearCache()
const fallbackPrice = await priceService.getPrice('stellar')
console.log('Fallback price:', fallbackPrice)
```

### 5. Blend Protocol Integration
```javascript
// Test yield generation
const yieldData = await blendIntegration.getBlendYield(poolContractId)
console.log('Current yield:', yieldData)

// Test supply to Blend
const supplyResult = await blendIntegration.supplyToBlend(poolContractId, 1000)
console.log('Blend supply result:', supplyResult)
```

## 📊 Test Cases

### 1. Pool Creation Tests
- ✅ Create traditional pool (fallback mode)
- ✅ Create smart contract pool
- ✅ Handle wallet not connected
- ✅ Handle insufficient funds for creation fee
- ✅ Verify pool appears in list immediately

### 2. Deposit Tests
- ✅ Deposit to smart contract pool
- ✅ Deposit to traditional pool
- ✅ Deposit with insufficient balance
- ✅ Deposit with invalid amount
- ✅ Verify balance updates immediately
- ✅ Verify transaction appears in history

### 3. Withdrawal Tests
- ✅ Withdraw from smart contract pool
- ✅ Withdraw amount exceeding balance
- ✅ Withdraw with insufficient contract funds
- ✅ Verify balance updates correctly
- ✅ Emergency withdrawal scenarios

### 4. Price Service Tests
- ✅ Primary API success (CoinGecko)
- ✅ Fallback to Stellar Expert
- ✅ Fallback to CoinCap
- ✅ Fallback to CryptoCompare
- ✅ All APIs fail → use hardcoded fallback
- ✅ Cache behavior and expiration
- ✅ Circuit breaker functionality

### 5. Error Handling Tests
- ✅ Network disconnection during transaction
- ✅ Wallet rejection of transaction
- ✅ Contract function failures
- ✅ Price API timeouts
- ✅ Blend protocol failures
- ✅ Backend synchronization issues

### 6. Performance Tests
- ✅ Concurrent user deposits
- ✅ Large transaction volumes
- ✅ Price fetching under load
- ✅ Contract response times
- ✅ Memory usage with many pools

## 🔍 Manual Testing Steps

### 1. Frontend UI Testing
1. Open application in browser
2. Connect wallet (Freighter/Albedo)
3. Create a new pool
4. Verify smart contract indicator appears
5. Make a deposit
6. Check balance updates in real-time
7. Attempt withdrawal
8. Verify transaction history
9. Check price displays update correctly

### 2. Backend API Testing
```bash
# Test pool creation endpoint
curl -X POST http://localhost:4000/api/pools \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Pool","charity":"Test Charity","assets":["XLM"],"donationPercentage":20}'

# Test enhanced pool analytics
curl http://localhost:4000/api/pools/pool_123/analytics

# Test contract pool status
curl http://localhost:4000/api/admin/contract-pools-status
```

### 3. Smart Contract Testing
```bash
# Test contract pool info
soroban contract invoke --id $CONTRACT_ID --network testnet -- get_pool_info

# Test user balance
soroban contract invoke --id $CONTRACT_ID --network testnet -- get_user_balance --user $USER_PUBLIC_KEY

# Test deposit simulation
soroban contract invoke --id $CONTRACT_ID --network testnet -- deposit --user $USER_PUBLIC_KEY --amount 1000000
```

## 🐛 Common Issues and Solutions

### Issue 1: Contract Deployment Fails
```bash
# Check admin account balance
soroban contract invoke --id $CONTRACT_ID --network testnet -- get_user_balance --user $ADMIN_PUBLIC_KEY

# Fund admin account if needed
curl "https://friendbot.stellar.org?addr=$ADMIN_PUBLIC_KEY"
```

### Issue 2: Price API Failures
```javascript
// Check price service status
const status = priceService.getStatus()
console.log('Price service status:', status)

// Clear cache if needed
priceService.clearCache()
```

### Issue 3: Transaction Failures
```javascript
// Check transaction validation
const validation = await smartContractService.validateTransaction(transactionXdr)
console.log('Transaction validation:', validation)
```

### Issue 4: Blend Integration Issues
```javascript
// Check Blend service status
const blendStatus = await blendIntegration.getStatus()
console.log('Blend status:', blendStatus)
```

## 📈 Performance Metrics

### Target Performance
- **Pool Creation**: < 5 seconds end-to-end
- **Deposits**: < 3 seconds with wallet confirmation
- **Withdrawals**: < 5 seconds including validation
- **Price Fetching**: < 2 seconds with fallback
- **Balance Updates**: < 1 second real-time
- **Contract Sync**: < 30 seconds backend sync

### Monitoring Points
- Transaction success rate
- Price API uptime
- Contract response times
- User experience metrics
- Error rates by function

## 🚨 Security Testing

### 1. Contract Security
- Test unauthorized access attempts
- Verify balance validation
- Check overflow/underflow protection
- Test emergency pause functionality

### 2. API Security
- Rate limiting tests
- Input validation
- SQL injection attempts
- XSS prevention

### 3. Price Manipulation
- Test with extreme price values
- Verify fallback behavior
- Check cache poisoning resistance

## ✅ Test Checklist

Before deployment, ensure all tests pass:

- [ ] Smart contract builds and deploys successfully
- [ ] All frontend components work with enhanced context
- [ ] Deposits work for both traditional and smart contract pools
- [ ] Withdrawals work with proper balance validation
- [ ] Price service provides reliable prices with fallbacks
- [ ] Blend integration generates real yield
- [ ] Error handling gracefully manages failures
- [ ] Performance meets target metrics
- [ ] Security tests pass
- [ ] Backend properly syncs with contract state

## 📝 Test Reports

Generate test reports:
```bash
# Frontend tests
npm test -- --coverage --watchAll=false

# Backend tests
npm run test:backend

# Contract tests
cd contracts/impact_pool && cargo test

# Integration tests
npm run test:integration
```

## 🎯 Success Criteria

The enhanced ImpactPools system is ready for production when:

1. ✅ All smart contracts deploy and function correctly
2. ✅ Price service maintains 99.9% uptime with fallbacks
3. ✅ User experience is seamless between traditional and smart contract pools
4. ✅ Real yield generation works through Blend integration
5. ✅ All security tests pass
6. ✅ Performance metrics meet targets
7. ✅ Error handling covers all edge cases
8. ✅ Documentation is complete and accurate

This comprehensive testing ensures the enhanced system is robust, reliable, and ready for production use.
