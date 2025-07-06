# ImpactPools - DeFi for Good

Hey! I built this DeFi application on the Stellar network that combines yield farming with charitable giving. The idea came to me when I realized most DeFi users don't think about social impact - so I created a platform where users earn competitive yields while automatically donating to charity.

## What I Built

- **Impact Pool Creation**: I designed a system where users can set up DeFi lending pools with automatic charitable donations
- **Yield + Charity**: Users deposit assets, earn yields, and a percentage automatically goes to verified charities
- **Multi-Wallet Support**: I integrated 8+ different Stellar wallets so everyone can participate
- **NFT Achievement System**: This is where it gets interesting - users get NFT certificates for donation milestones which creates a flex factor and FOMO that encourages more donations
- **Social Impact Tracking**: Real-time dashboard showing your total impact and donation certificates
- **Blend Protocol Integration**: I used the real Blend SDK for authentic DeFi functionality on Stellar Testnet

## The NFT Social Factor

I noticed something cool - when people can show off their charitable impact, they donate more. So I built:

- **Donation Milestone NFTs**: Users get unique certificates at $100, $500, $1000+ donation levels
- **NFT Gallery**: Public showcase where users can flex their charitable achievements
- **Social Proof**: The FOMO factor kicks in when people see others earning rare donation NFTs
- **Achievement Tracking**: Milestone progress bars that gamify charitable giving
- **Shareable Certificates**: Users can share their impact NFTs on social media

This creates a positive feedback loop - people want the exclusive NFTs, so they donate more, which helps more charities!

## My Tech Stack

I chose these technologies after researching what would work best for a DeFi + social impact platform:

- **Frontend**: React.js with Vite (faster than Create React App), Tailwind CSS for styling
- **Backend**: Node.js with Express - kept it simple but effective
- **Blockchain**: Stellar Network (Testnet for now), integrated real Blend Protocol contracts
- **Wallet Integration**: Stellar Wallets Kit - supports Freighter, Albedo, Rabet, Lobstr, Hana, WalletConnect, Ledger, Trezor, HOT Wallet
- **Smart Contracts**: I wrote Soroban contracts in Rust for pool management
- **NFT System**: Custom certificate generation with milestone tracking

## Wallet Support

I spent time integrating multiple wallet options because I wanted maximum accessibility:

- **Freighter Wallet** (Browser Extension) - most popular
- **Albedo** (Web-based) - no download needed
- **Rabet** (Browser Extension) - great UI
- **Lobstr** (Mobile + Extension) - mobile-first users
- **Hana Wallet** (Browser Extension) - newer option
- **WalletConnect** (Mobile wallets) - connects any mobile wallet
- **Ledger** (Hardware wallet) - for security-conscious users
- **Trezor** (Hardware wallet) - another secure option
- **HOT Wallet** - additional option

## Troubleshooting I Fixed

### Wallet Detection Issues

I ran into problems with the original Freighter-only setup, especially on Microsoft Edge. So I upgraded the entire system:

**What I implemented**:
- Multi-wallet fallback system
- Better browser compatibility 
- Automatic retry mechanisms
- Comprehensive error handling

**Browser testing results**:
- **Best performance**: Chrome, Firefox, Brave
- **Good compatibility**: Safari, Opera
- **Improved**: Microsoft Edge (much better now)

### Debug Features I Added

I built a debugging system that helps during development:
- Wallet initialization status checker
- Available wallet modules display
- Connection status monitor  
- Browser compatibility information

Look for the blue debug button in the bottom-right corner when running in dev mode.

## Getting Started

### What You Need
- Node.js (v16 or higher) - I tested on v18
- Any Stellar wallet from the list above
- Stellar Testnet account with some XLM and USDC

### Installation Steps

1. **Clone my repo and install everything**:
```bash
git clone https://github.com/deepugami/ImpactPools.git
cd stellar_impactpools
npm run install:all
```

2. **Start the development environment**:
```bash
npm run dev
```

This command I set up will start both frontend (http://localhost:5173) and backend (http://localhost:3001) at once.

### Alternative Setup

If you prefer to run things separately:

**Frontend**:
```bash
cd frontend
npm install
npm run dev
```

**Backend**:
```bash
cd backend
npm install
npm run dev
```

## How I Organized the Code

```
stellar_impactpools/
├── frontend/              # React app I built
│   ├── src/
│   │   ├── components/    # Reusable components I created
│   │   │   ├── NFTGallery.jsx      # NFT showcase system
│   │   │   ├── NFTCertificate.jsx  # Individual NFT display
│   │   │   ├── MilestoneTracker.jsx # Progress tracking
│   │   │   └── Navbar.jsx          # Main navigation
│   │   ├── contexts/      # State management contexts
│   │   │   ├── WalletContext.jsx   # Multi-wallet integration
│   │   │   └── PoolContext.jsx     # Pool state management
│   │   ├── pages/         # Main app pages
│   │   │   ├── HomePage.jsx        # Pool discovery
│   │   │   ├── CreatePoolPage.jsx  # Pool creation
│   │   │   ├── PoolDetailsPage.jsx # Pool management
│   │   │   └── NFTGalleryPage.jsx  # NFT showcase
│   │   ├── services/      # Blockchain integration services
│   │   │   ├── stellarService.js   # Stellar API calls
│   │   │   ├── blendService.js     # Blend protocol integration
│   │   │   ├── nftService.js       # NFT milestone system
│   │   │   └── treasuryService.js  # Fund management
│   │   └── hooks/         # Custom React hooks
│   ├── package.json
│   └── vite.config.js
├── backend/               # Express API I built
│   ├── routes/           # API endpoints
│   │   ├── nft.js        # NFT certificate generation
│   │   └── withdrawal.js # Treasury management
│   ├── services/         # Backend business logic
│   │   ├── nftService.js      # NFT generation logic
│   │   ├── milestoneService.js # Achievement tracking
│   │   └── yieldService.js    # Yield calculations
│   ├── utils/            # Helper functions
│   │   └── certificateGenerator.js # NFT certificate creation
│   ├── package.json
│   └── server.js
├── contracts/            # Soroban smart contracts (Rust)
│   ├── pool_contract.rs  # Main pool logic
│   └── impact_pool/      # Alternative implementation
├── scripts/              # Utility scripts I wrote
│   ├── deploy-contracts.sh      # Contract deployment
│   └── fund-testnet-accounts.js # Account funding
├── package.json          # Root package with my scripts
└── README.md
```

## How to Use ImpactPools

1. **Connect Your Wallet**: Click "Connect Wallet" and pick from the 8+ wallet options I integrated
2. **Browse Impact Pools**: Check out existing pools on the homepage - see their APY and charity focus
3. **Create Your Own Pool**: Set up a charitable lending pool with your preferred donation percentage
4. **Start Contributing**: Deposit XLM or USDC to earn yield while supporting causes you care about
5. **Track Your Impact**: Watch your donations accumulate and unlock achievement NFTs
6. **Flex Your NFTs**: Visit the NFT Gallery to showcase your charitable impact certificates
7. **Share & Inspire**: The social aspect encourages others to donate more when they see your achievements

## Cool Features I Implemented

### For the Hackathon
- **Real Stellar Testnet**: All transactions happen on actual blockchain - no simulation
- **Live Blend Integration**: I connected to real Blend protocol contracts for authentic DeFi
- **NFT Achievement System**: Users earn certificates for donation milestones ($100, $500, $1000+)
- **Social Impact Dashboard**: Real-time tracking of personal and platform-wide charitable impact
- **Multi-Asset Support**: XLM and USDC initially, built to scale to more assets
- **Mobile Responsive**: Works great on phones - important for accessibility

### The Psychology Behind NFTs
I realized people love showing off their achievements, especially for good causes. The NFT system creates:
- **FOMO Effect**: Users see others with rare milestone NFTs and want them too
- **Social Proof**: Public gallery showcases top donors
- **Gamification**: Progress bars make reaching the next milestone addictive
- **Bragging Rights**: Shareable certificates for social media
- **Competitive Giving**: Friendly competition to reach higher donation tiers

This psychology hack actually increases charitable donations - pretty cool!

## Updates I Made During Development

### Major Wallet Integration Overhaul

I ran into issues with the original single-wallet approach, so I completely rewrote the wallet system:

**What I changed**:
- **Replaced** basic Freighter API with comprehensive Stellar Wallets Kit
- **Added** support for 8+ different wallet types (massive improvement)
- **Fixed** Microsoft Edge compatibility issues that were frustrating users
- **Implemented** automatic retry and fallback mechanisms
- **Enhanced** error handling with user-friendly messages

### Migration Experience

If you're updating from an earlier version of my project:
1. The app now supports multiple wallets instead of just Freighter
2. Much better browser compatibility across all major browsers
3. More reliable wallet connections with smart retry logic
4. Better debug information when something goes wrong

## Technical Challenges I Solved

### Real Blend Protocol Integration
Instead of just simulating DeFi, I integrated the actual Blend SDK to connect with live testnet contracts. This was challenging but gives authentic yield calculations.

### NFT Certificate Generation
I built a custom system that generates unique NFT certificates for donation milestones. Each certificate includes:
- User's donation amount and date
- Charity beneficiary information
- Unique visual design based on milestone tier
- Blockchain verification data

### Social FOMO Mechanics
The psychology aspect was tricky - I needed to encourage donations without being pushy. The NFT gallery creates natural social pressure and friendly competition.

## Want to Contribute?

This started as my hackathon project for "Build on Blend" but I'm excited to keep developing it! If you want to add features or improvements, feel free to fork and submit PRs.

Some ideas I'm considering:
- More charity partnerships
- Advanced NFT rarity tiers
- Social sharing integrations
- Mobile app version
- Mainnet deployment

## License

MIT License - I'm keeping this open source so others can build on the idea of gamified charitable giving! 