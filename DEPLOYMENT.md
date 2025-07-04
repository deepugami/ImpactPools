# ImpactPools Deployment Guide

This guide covers how to deploy the ImpactPools application for both development and production environments.

## Prerequisites

Before deploying ImpactPools, ensure you have:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Freighter Wallet** browser extension for testing
- **Stellar Testnet Account** with XLM and USDC (for testing)

## Quick Start (Development)

### Option 1: Automated Setup
```bash
# Clone the repository
git clone <your-repo-url>
cd stellar_impactpools

# Install all dependencies and start development servers
npm run install:all
npm run dev
```

This will:
- Install dependencies for both frontend and backend
- Start the backend server on http://localhost:3001
- Start the frontend server on http://localhost:5173

### Option 2: Manual Setup
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies  
cd ../backend
npm install

# Start backend (in one terminal)
cd backend
npm run dev

# Start frontend (in another terminal)
cd frontend
npm run dev
```

## Production Deployment

### Frontend Deployment (Vercel/Netlify)

1. **Build the frontend:**
```bash
cd frontend
npm run build
```

2. **Deploy to Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

3. **Deploy to Netlify:**
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

### Backend Deployment (Railway/Heroku/DigitalOcean)

1. **Prepare for deployment:**
```bash
cd backend
npm run build  # If you have a build script
```

2. **Environment Variables:**
Set these environment variables on your hosting platform:
```
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
STELLAR_NETWORK=testnet
```

3. **Deploy to Railway:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Deploy
railway login
railway deploy
```

4. **Deploy to Heroku:**
```bash
# Install Heroku CLI
# Create Heroku app
heroku create impactpools-api

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set FRONTEND_URL=https://your-frontend-domain.com

# Deploy
git push heroku main
```

## Configuration

### Frontend Configuration

Update `frontend/src/contexts/PoolContext.jsx`:
```javascript
// Change this line for production
const API_BASE_URL = 'https://your-backend-domain.com/api'
```

### Backend Configuration

Create `backend/.env` file:
```env
NODE_ENV=production
PORT=3001
FRONTEND_URL=https://your-frontend-domain.com
STELLAR_NETWORK=testnet
HORIZON_URL=https://horizon-testnet.stellar.org
```

## Testing the Deployment

1. **Connect Freighter Wallet:**
   - Install Freighter browser extension
   - Create/import a Stellar testnet account
   - Get testnet XLM from [Stellar Laboratory](https://laboratory.stellar.org/#account-creator)

2. **Test Core Features:**
   - Wallet connection
   - Pool browsing
   - Pool creation
   - Deposits and withdrawals
   - Real-time updates

3. **Check API Endpoints:**
```bash
# Health check
curl https://your-backend-domain.com/health

# Get pools
curl https://your-backend-domain.com/api/pools

# Get stats
curl https://your-backend-domain.com/api/stats
```

## Troubleshooting

### Common Issues

**Frontend not connecting to backend:**
- Verify CORS settings in backend
- Check API_BASE_URL in frontend
- Ensure both services are running

**Freighter wallet not connecting:**
- Ensure Freighter extension is installed
- Check if using HTTPS in production
- Verify network settings (testnet)

**Stellar transactions failing:**
- Confirm account has sufficient XLM for fees
- Verify network settings (testnet vs mainnet)
- Check Horizon server connectivity

### Environment-Specific Issues

**Development:**
```bash
# Clear npm cache
npm cache clean --force

# Restart development servers
npm run dev
```

**Production:**
```bash
# Check application logs
# Verify environment variables are set
# Test API endpoints manually
```

### Port Conflicts
If you get port conflicts during development:

```bash
# Kill processes using ports
netstat -ano | findstr :3001
taskkill /PID [PID_NUMBER] /F

# Or let the app auto-select alternative ports
# Backend will try 3002 if 3001 is busy
# Frontend will try 5174 if 5173 is busy
```

## Monitoring and Maintenance

### Health Checks
The application includes built-in health monitoring:

- Backend health: `GET /health`
- Pool service health: `GET /api/stats`
- Integration tests run automatically in development

### Database Considerations
Current implementation uses in-memory storage for demo purposes. For production:

1. **Implement persistent storage** (PostgreSQL/MongoDB)
2. **Add connection pooling**
3. **Implement backup strategies**
4. **Add monitoring and alerting**

### Security Considerations
For production deployment:

1. **Implement rate limiting**
2. **Add input validation**
3. **Use HTTPS everywhere**
4. **Implement proper error handling**
5. **Add logging and monitoring**

## Scaling Considerations

### Frontend Scaling
- **CDN Distribution**: Use services like Cloudflare or AWS CloudFront
- **Caching Strategy**: Implement appropriate cache headers
- **Bundle Optimization**: Use code splitting and lazy loading

### Backend Scaling
- **Load Balancing**: Implement multiple backend instances
- **Database Scaling**: Use read replicas and connection pooling
- **Caching Layer**: Add Redis for session management
- **Monitoring**: Implement comprehensive logging and metrics

## Mainnet Migration

When ready to move to Stellar mainnet:

1. **Update network configuration:**
```javascript
const STELLAR_NETWORK = Networks.PUBLIC;
const HORIZON_URL = 'https://horizon.stellar.org';
```

2. **Update smart contract addresses** to mainnet versions
3. **Implement additional security measures**
4. **Add comprehensive testing on mainnet**
5. **Set up monitoring and alerting**

## Support and Documentation

- **Development Issues**: Check the TESTING_GUIDE.md
- **Architecture Questions**: See ARCHITECTURE.md
- **Integration Issues**: Review BLEND_INTEGRATION_STATUS.md
- **Account Funding**: Follow FUND_TESTNET_ACCOUNTS.md

For additional support, review the application logs and check the official Stellar and Blend documentation. 