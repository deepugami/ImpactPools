# Fund Testnet Accounts

The ImpactPools application uses specific testnet accounts for the pool treasury and charity addresses. These accounts need to be funded with XLM before transactions can work.

## Quick Setup

**Option 1: Automatic Funding Script**
Run this in your browser console or Node.js:

```javascript
// Fund all required testnet accounts
const accounts = [
  'GCKFBEIYTKP5ROOZBFYWBHCFBOFBEFC3YSAYWTRN5DQPXQNYQGTOXJF4', // Pool Treasury
  'GDOJCPYIB66RY4XNDLRRHQQXB27YLHBDL3CLFX7YIDK7JNCAS4G2TRP5', // Stellar Community Fund
  'GC5RZKUGI3KRLQHZR5IKQJ7LGR2HBADMLJMRJUVHZPKXLH67QYB6QV4Q', // Red Cross
  'GDH3PTHHAZTZH5RDW7GDVN2UYSF7L1LMZE5FHI7QS4MHQQKGQ3JZQVSY'  // Doctors Without Borders
];

accounts.forEach(async (account, index) => {
  setTimeout(async () => {
    try {
      const response = await fetch(`https://friendbot.stellar.org?addr=${account}`);
      if (response.ok) {
        console.log(`Funded account ${index + 1}/4: ${account.slice(0, 4)}...`);
      } else {
        console.log(`Failed to fund ${account.slice(0, 4)}...`);
      }
    } catch (error) {
      console.log(`Error funding ${account.slice(0, 4)}...:`, error.message);
    }
  }, index * 1000); // Delay between requests
});
```

**Option 2: Manual Funding**
Visit these URLs in your browser to fund each account:

1. **Pool Treasury**: https://friendbot.stellar.org?addr=GCKFBEIYTKP5ROOZBFYWBHCFBOFBEFC3YSAYWTRN5DQPXQNYQGTOXJF4
2. **Stellar Community Fund**: https://friendbot.stellar.org?addr=GDOJCPYIB66RY4XNDLRRHQQXB27YLHBDL3CLFX7YIDK7JNCAS4G2TRP5
3. **Red Cross**: https://friendbot.stellar.org?addr=GC5RZKUGI3KRLQHZR5IKQJ7LGR2HBADMLJMRJUVHZPKXLH67QYB6QV4Q
4. **Doctors Without Borders**: https://friendbot.stellar.org?addr=GDH3PTHHAZTZH5RDW7GDVN2UYSF7L1LMZE5FHI7QS4MHQQKGQ3JZQVSY

## Verification

You can verify the accounts are funded by checking them on [Stellar Expert](https://stellar.expert/explorer/testnet):

- [Pool Treasury](https://stellar.expert/explorer/testnet/account/GCKFBEIYTKP5ROOZBFYWBHCFBOFBEFC3YSAYWTRN5DQPXQNYQGTOXJF4)
- [Stellar Community Fund](https://stellar.expert/explorer/testnet/account/GDOJCPYIB66RY4XNDLRRHQQXB27YLHBDL3CLFX7YIDK7JNCAS4G2TRP5)
- [Red Cross](https://stellar.expert/explorer/testnet/account/GC5RZKUGI3KRLQHZR5IKQJ7LGR2HBADMLJMRJUVHZPKXLH67QYB6QV4Q)
- [Doctors Without Borders](https://stellar.expert/explorer/testnet/account/GDH3PTHHAZTZH5RDW7GDVN2UYSF7L1LMZE5FHI7QS4MHQQKGQ3JZQVSY)

Each account should show a balance of 10,000 XLM after funding.

## After Funding

Once all accounts are funded:

1. Restart your development servers: `npm run dev`
2. Try creating a pool or making a deposit
3. Transactions should now work successfully!

**Note**: These are testnet-only accounts. Never use testnet accounts or keys on the public Stellar network. 