# ImpactPools - DeFi for Good

A DeFi application built on the Stellar network that combines yield farming with charitable giving. Users can create and contribute to lending pools using the Blend protocol, where a percentage of the yield is automatically donated to charitable causes.

## Features

- **Create Impact Pools**: Set up DeFi lending pools with automatic charitable donations
- **Contribute to Pools**: Deposit assets and earn yield while supporting good causes
- **Multi-Wallet Integration**: Seamless Stellar wallet connectivity via Stellar Wallets Kit
- **Charitable Yield Sharing**: Configurable percentage of yield goes to verified charities
- **Real-time Pool Management**: Track your contributions, yield, and impact
- **Stellar Testnet**: Built for hackathon demo on Stellar Testnet

## Tech Stack

- **Frontend**: React.js (Vite), Tailwind CSS, Stellar SDK
- **Backend**: Node.js, Express.js
- **Blockchain**: Stellar Network (Testnet), Blend Protocol
- **Wallet Integration**: Stellar Wallets Kit (supports Freighter, Albedo, Rabet, Lobstr, Hana, WalletConnect, Ledger, Trezor)

## Supported Wallets

The application supports multiple Stellar wallets through the Stellar Wallets Kit:

- **Freighter Wallet** (Browser Extension)
- **Albedo** (Web-based)
- **Rabet** (Browser Extension)
- **Lobstr** (Mobile + Extension)
- **Hana Wallet** (Browser Extension)
- **WalletConnect** (Mobile wallets)
- **Ledger** (Hardware wallet)
- **Trezor** (Hardware wallet)
- **HOT Wallet**

## Wallet Troubleshooting

### Issue: Wallet Not Detected

**Previous Issue**: The old Freighter-only integration had browser compatibility issues, especially with Microsoft Edge.

**Solution**: We've upgraded to Stellar Wallets Kit which provides:
- Support for multiple wallet types
- Better browser compatibility
- Automatic fallback mechanisms
- More robust wallet detection

### Browser Recommendations

- **Best**: Chrome, Firefox, Brave
- **Good**: Safari, Opera
- **Limited**: Microsoft Edge (improved with new integration)

### Debug Mode

The app includes a Wallet Debug component that shows:
- Wallet system initialization status
- Available wallet modules
- Connection status
- Browser compatibility information

Look for the blue debug button in the bottom-right corner during development.

## Quick Start

### Prerequisites
- Node.js (v16 or higher)
- Any supported Stellar wallet (see list above)
- Stellar Testnet account with XLM and USDC

### Installation

1. **Clone and install dependencies**:
```bash
git clone <your-repo-url>
cd stellar_impactpools
npm run install:all
```

2. **Start the development environment**:
```bash
npm run dev
```

This will start both the frontend (http://localhost:5173) and backend (http://localhost:3001) simultaneously.

### Manual Setup (Alternative)

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

## Project Structure

```
stellar_impactpools/
├── frontend/              # React frontend application
│   ├── src/
│   │   ├── components/    # Reusable React components
│   │   │   ├── FreighterDebug.jsx  # Now WalletDebug - shows wallet status
│   │   ├── contexts/      # React contexts for state management
│   │   │   ├── WalletContext.jsx   # Stellar Wallets Kit integration
│   │   ├── pages/         # Main application pages
│   │   ├── services/      # Stellar/Blend integration
│   │   └── utils/         # Helper functions
│   ├── package.json
│   └── vite.config.js
├── backend/               # Node.js Express backend
│   ├── src/
│   │   ├── routes/        # API endpoints
│   │   └── middleware/    # Express middleware
│   ├── package.json
│   └── server.js
├── package.json           # Root package.json with scripts
└── README.md
```

## Usage

1. **Connect Your Wallet**: Click "Connect Wallet" and choose from multiple wallet options
2. **Explore Pools**: Browse existing ImpactPools on the homepage
3. **Create a Pool**: Set up your own charitable lending pool
4. **Contribute**: Deposit assets to earn yield and support causes
5. **Track Impact**: Monitor your contributions and charitable donations

## Hackathon Features

- **Stellar Testnet Integration**: All transactions on testnet for safe testing
- **Mock Charitable Organizations**: Pre-configured charity options for demo
- **Simulated Yield Distribution**: Demonstrates charitable donation mechanism
- **Responsive Design**: Mobile-friendly interface
- **Multi-Wallet Support**: Choose your preferred Stellar wallet

## Recent Updates

### Wallet Integration Upgrade

- **Replaced** direct Freighter API with Stellar Wallets Kit
- **Added** support for 8+ different wallet types
- **Fixed** browser compatibility issues (especially Microsoft Edge)
- **Improved** wallet detection and connection reliability
- **Enhanced** error handling and user feedback

### Migration Notes

If you're updating from a previous version:
1. The app now supports multiple wallets, not just Freighter
2. Better browser compatibility across all major browsers
3. More reliable wallet connection with automatic retries
4. Enhanced debug information for troubleshooting

## Contributing

This is a hackathon project built for the "Build on Blend" Stellar hackathon. Feel free to contribute improvements and extensions!

## License

MIT License - feel free to use this code for your own projects! 