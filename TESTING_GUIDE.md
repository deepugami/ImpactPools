# Stellar ImpactPools - Testing Guide

This guide will help you verify that the ImpactPools application is fully functional on the Stellar testnet.

## Prerequisites

1. **Freighter Wallet Extension**: Install the [Freighter](https://www.freighter.app/) browser extension
2. **Testnet XLM**: Get testnet XLM from the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)

## Setup Instructions

### 1. Install Dependencies
```bash
npm run install:all
```

### 2. Install Missing Frontend Dependencies
```bash
cd frontend
npm install @stellar/freighter-api@^1.7.1
cd ..
```

### 3. Fund Testnet Accounts
**CRITICAL**: Fund required accounts before testing:

```bash
npm run fund-testnet
```

Or manually visit these URLs:
- https://friendbot.stellar.org?addr=GCKFBEIYTKP5ROOZBFYWBHCFBOFBEFC3YSAYWTRN5DQPXQNYQGTOXJF4
- https://friendbot.stellar.org?addr=GDOJCPYIB66RY4XNDLRRHQQXB27YLHBDL3CLFX7YIDK7JNCAS4G2TRP5
- https://friendbot.stellar.org?addr=GC5RZKUGI3KRLQHZR5IKQJ7LGR2HBADMLJMRJUVHZPKXLH67QYB6QV4Q
- https://friendbot.stellar.org?addr=GDH3PTHHAZTZH5RDW7GDVN2UYSF7L1LMZE5FHI7QS4MHQQKGQ3JZQVSY

### 4. Handle Port Conflicts
If you encounter port conflicts (EADDRINUSE errors):

**Option A: Kill existing processes (Windows)**
```bash
# In Command Prompt (not Git Bash)
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F
```

**Option B: Use different ports**
```bash
# Backend will automatically try port 3002 if 3001 is busy
# Frontend will automatically try port 5174 if 5173 is busy
```

### 5. Start Development Servers
```bash
npm run dev
```

This will start:
- Frontend: http://localhost:5173 (or 5174 if 5173 is in use)
- Backend: http://localhost:3001 (or 3002 if 3001 is in use)

### 6. Configure Freighter Wallet

1. Open Freighter extension
2. Switch to **Testnet** network
3. Import or create a testnet account
4. Fund your account with testnet XLM from the [Stellar Laboratory](https://laboratory.stellar.org/#account-creator?network=test)

## Known Issues & Solutions

### Transaction Memo Length Error
**Error**: "Expects string, array or buffer, max 28 bytes"
**Solution**: **FIXED** - Memos are now automatically truncated to 28 bytes

### Port Already in Use
**Error**: "EADDRINUSE: address already in use :::3001"
**Solution**: Kill existing Node processes or use alternative ports (the app will auto-select available ports)

### Freighter API Dependency
**Error**: "Failed to resolve dependency: @stellar/freighter-api"
**Solution**: **FIXED** - Added to package.json, run `npm install` in frontend directory

## Testing Checklist

### Basic Functionality

#### 1. Application Launch
- [ ] Frontend loads at http://localhost:5173 or http://localhost:5174
- [ ] Backend API responds at http://localhost:3001/health
- [ ] No console errors on page load (except expected warnings)

#### 2. Wallet Connection
- [ ] "Connect Wallet" button is visible
- [ ] Clicking opens Freighter wallet selection
- [ ] Wallet connects successfully
- [ ] Public key displays correctly (shortened format)
- [ ] Wallet status shows "Connected"

#### 3. Pool Discovery
- [ ] Demo pools are displayed on homepage
- [ ] Pool cards show correct information:
  - Pool name
  - Charity name  
  - APY percentage
  - Total deposited amount
  - Donation percentage
  - Supported assets

### Core Transaction Features

#### 4. Pool Creation
- [ ] Navigate to "Create Pool" page
- [ ] Form validation works correctly:
  - Pool name (minimum 3 characters)
  - Charity selection required
  - At least one asset required
  - Donation percentage (1-50%)
- [ ] Create pool with valid data
- [ ] Freighter opens for transaction signing
- [ ] Transaction submits successfully to Stellar testnet
- [ ] Pool appears in the pools list
- [ ] Transaction hash is displayed and links to Stellar Expert

**Test Data:**
```
Pool Name: "Clean Ocean Initiative" 
Charity: "Stellar Community Fund"
Assets: ["XLM"]
Donation Percentage: 15%
```

#### 5. Pool Deposits
- [ ] Navigate to a pool detail page
- [ ] Enter deposit amount (e.g., 10 XLM)
- [ ] Select asset (XLM)
- [ ] Click "Contribute"
- [ ] Freighter opens for transaction signing
- [ ] Transaction submits successfully
- [ ] Pool statistics update correctly
- [ ] Transaction appears in pool transaction history

#### 6. Pool Withdrawals
- [ ] Navigate to a pool where you have deposits
- [ ] Enter withdrawal amount (less than deposited)
- [ ] Click "Withdraw"
- [ ] Freighter opens for transaction signing
- [ ] Transaction submits successfully
- [ ] Pool statistics update correctly
- [ ] Withdrawal appears in transaction history

### Data Integrity

#### 7. Persistent State
- [ ] Refresh browser page
- [ ] Wallet remains connected
- [ ] Pool data persists
- [ ] User deposit balances are correct

#### 8. API Endpoints
Test these endpoints in your browser:

```bash
# Health check
http://localhost:3001/health

# Get all pools  
http://localhost:3001/api/pools

# Get specific pool
http://localhost:3001/api/pools/pool_demo_1
```

### Error Handling

#### 9. Wallet Error Scenarios
- [ ] Try to create pool without wallet connected → Should show error message
- [ ] Try to deposit without sufficient funds → Should show appropriate error
- [ ] Cancel transaction in Freighter → Should handle gracefully

#### 10. Network Error Scenarios
- [ ] Disconnect internet briefly → Should show connection errors
- [ ] Invalid transaction → Should display error message

### User Experience

#### 11. UI/UX Features
- [ ] Loading states display correctly
- [ ] Success/error toast notifications appear
- [ ] Transaction links open to Stellar Expert
- [ ] Mobile responsive design works
- [ ] All buttons and forms are functional

#### 12. Real Testnet Integration
- [ ] All transactions appear on [Stellar Expert (Testnet)](https://stellar.expert/explorer/testnet)
- [ ] Account balances update correctly in Freighter
- [ ] Transaction fees are deducted from account
- [ ] All addresses used are valid Stellar testnet addresses

## Expected Transaction Flow

1. **Pool Creation**: Creates a payment transaction (1 XLM) to pool treasury as creation fee
2. **Deposit**: Creates a payment transaction from user to pool treasury with pool-specific memo
3. **Withdrawal**: Creates a symbolic transaction (0.1 XLM) representing withdrawal request

## Testnet Addresses Used

- **Pool Treasury**: `GA2HGBJIJKI6O4XEM7CZWY5PS6GKSXL6D34ERAJYQSPYA6X6AI7HYW36`
- **Charity Addresses**: All configured with valid testnet addresses in `stellarService.js`

## Troubleshooting

### Common Issues

1. **"Account not found"**: Make sure your testnet account is funded with XLM
2. **"Transaction failed"**: Check your account has sufficient XLM for transaction fees
3. **Wallet not connecting**: Ensure Freighter is set to Testnet network
4. **Backend errors**: Check that backend server is running on correct port
5. **Memo length errors**: **FIXED** - All memos now auto-truncated to 28 bytes
6. **Port conflicts**: Use Command Prompt to kill processes or let app auto-select ports

### Debug Tools

1. **Browser Console**: Check for JavaScript errors
2. **Network Tab**: Monitor API calls and responses
3. **Freighter Extension**: View transaction history and account details
4. **Stellar Expert**: Verify transactions on the network

## Success Criteria

The application is considered fully functional when:

- All wallet operations work correctly
- Pool creation transactions are submitted to Stellar testnet
- Deposit transactions are processed successfully
- All transaction hashes link to valid Stellar Expert entries
- Error handling is robust and user-friendly
- Data persists correctly between sessions
- Memo length issues are resolved
- Port conflicts are handled gracefully

## Live Demo URLs

Once testing is complete, the application demonstrates:

- Real Stellar testnet integration with verified transactions
- Multi-wallet support across different browser environments
- Charitable pool creation and contribution mechanisms
- Transparent blockchain-based impact tracking 