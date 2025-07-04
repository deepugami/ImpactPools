#!/usr/bin/env node

// Fund all required testnet accounts for ImpactPools
const accounts = [
  { name: 'Pool Treasury', address: 'GCKFBEIYTKP5ROOZBFYWBHCFBOFBEFC3YSAYWTRN5DQPXQNYQGTOXJF4' },
  { name: 'Stellar Community Fund', address: 'GDOJCPYIB66RY4XNDLRRHQQXB27YLHBDL3CLFX7YIDK7JNCAS4G2TRP5' },
  { name: 'Red Cross', address: 'GC5RZKUGI3KRLQHZR5IKQJ7LGR2HBADMLJMRJUVHZPKXLH67QYB6QV4Q' },
  { name: 'Doctors Without Borders', address: 'GDH3PTHHAZTZH5RDW7GDVN2UYSF7L1LMZE5FHI7QS4MHQQKGQ3JZQVSY' }
];

const fundAccounts = async () => {
  console.log('🚀 Funding testnet accounts for ImpactPools...\n');
  
  let successCount = 0;
  
  for (let i = 0; i < accounts.length; i++) {
    const { name, address } = accounts[i];
    
    try {
      console.log(`📡 Funding ${name}...`);
      
      // Use dynamic import for fetch in Node.js
      const fetch = (await import('node-fetch')).default;
      
      const response = await fetch(`https://friendbot.stellar.org?addr=${address}`);
      
      if (response.ok) {
        console.log(`✅ ${name} funded successfully!`);
        successCount++;
      } else {
        const errorText = await response.text();
        console.log(`❌ Failed to fund ${name}: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Error funding ${name}: ${error.message}`);
    }
    
    // Wait between requests to avoid rate limiting
    if (i < accounts.length - 1) {
      console.log('⏳ Waiting to avoid rate limiting...\n');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  
  console.log(`\n🎯 Funding complete! ${successCount}/${accounts.length} accounts funded successfully.`);
  
  if (successCount === accounts.length) {
    console.log('🎉 All accounts funded! You can now test transactions.');
    console.log('\n📋 Next steps:');
    console.log('1. Start your development servers: npm run dev');
    console.log('2. Open http://localhost:5173 (or 5174)');
    console.log('3. Connect your wallet and start testing!');
  } else {
    console.log('\n⚠️  Some accounts failed to fund. You can:');
    console.log('1. Run this script again');
    console.log('2. Manually fund accounts using the URLs in FUND_TESTNET_ACCOUNTS.md');
  }
  
  console.log('\n🔗 Verify accounts on Stellar Expert:');
  accounts.forEach(({ name, address }) => {
    console.log(`${name}: https://stellar.expert/explorer/testnet/account/${address}`);
  });
};

// Handle both direct execution and module import
if (import.meta.url === `file://${process.argv[1]}`) {
  fundAccounts().catch(console.error);
}

export { fundAccounts }; 