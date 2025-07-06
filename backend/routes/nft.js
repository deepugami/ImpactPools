import express from 'express';
import nftService from '../services/nftService.js';
import milestoneService from '../services/milestoneService.js';

const router = express.Router();

/**
 * GET /api/nft/user/:publicKey
 * Get all NFTs owned by a specific user
 */
router.get('/user/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    
    if (!publicKey) {
      return res.status(400).json({ 
        error: 'Public key is required' 
      });
    }

    const nfts = await nftService.getUserNFTs(publicKey);
    
    res.json({
      success: true,
      userPublicKey: publicKey,
      nftCount: nfts.length,
      nfts
    });

  } catch (error) {
    console.error(`❌ [NFT-API] Error fetching user NFTs:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch user NFTs',
      details: error.message 
    });
  }
});

/**
 * GET /api/nft/milestones/:poolId
 * Get milestone progress for a specific pool
 */
router.get('/milestones/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const { currentDonated } = req.query;
    
    if (!poolId) {
      return res.status(400).json({ 
        error: 'Pool ID is required' 
      });
    }

    console.log(`🎯 [NFT-API] Fetching milestone progress for pool: ${poolId}`);
    
    const donatedAmount = parseFloat(currentDonated) || 0;
    const progress = milestoneService.getPoolMilestoneProgress(poolId, donatedAmount);
    const milestones = milestoneService.getPoolMilestones(poolId);
    
    res.json({
      success: true,
      poolId,
      progress,
      milestones,
      milestoneThresholds: [1, 5, 10] // Pool milestone amounts - TESTING VALUES
    });

  } catch (error) {
    console.error(`❌ [NFT-API] Error fetching milestone progress:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch milestone progress',
      details: error.message 
    });
  }
});

/**
 * POST /api/nft/mint
 * Manually mint an NFT (admin function for testing)
 */
router.post('/mint', async (req, res) => {
  try {
    const { metadata } = req.body;
    
    if (!metadata || !metadata.poolName || !metadata.recipientPublicKey) {
      return res.status(400).json({ 
        error: 'Metadata with poolName and recipientPublicKey is required' 
      });
    }

    console.log(`🎨 [NFT-API] Manual NFT mint requested for: ${metadata.poolName}`);
    
    // Set default values if not provided
    const completeMetadata = {
      milestoneAmount: 1, // TESTING VALUE
      milestoneType: 'pool',
      tier: 'Silver',
      ...metadata
    };
    
    const nft = await nftService.mintImpactCertificate(completeMetadata);
    
    res.json({
      success: true,
      message: 'NFT minted successfully',
      nft
    });

  } catch (error) {
    console.error(`❌ [NFT-API] Manual NFT minting failed:`, error);
    res.status(500).json({ 
      error: 'Failed to mint NFT',
      details: error.message 
    });
  }
});

/**
 * GET /api/nft/gallery
 * Get public NFT gallery data
 */
router.get('/gallery', async (req, res) => {
  try {
    console.log(`🖼️ [NFT-API] Fetching NFT gallery data`);
    
    const statistics = milestoneService.getMilestoneStatistics();
    
    // For demo purposes, return milestone statistics
    // In production, this could return recent NFTs or featured certificates
    res.json({
      success: true,
      gallery: {
        totalNFTsMinted: statistics.totalNFTsMinted,
        totalPoolsWithMilestones: statistics.totalPoolsWithMilestones,
        milestoneThresholds: {
          pool: statistics.poolMilestoneThresholds,
          individual: statistics.individualMilestoneThresholds
        },
        recentlyMinted: [] // Could be populated with recent NFT data
      }
    });

  } catch (error) {
    console.error(`❌ [NFT-API] Error fetching gallery data:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch gallery data',
      details: error.message 
    });
  }
});

/**
 * GET /api/nft/validate/:assetCode/:issuer/:recipient
 * Validate NFT authenticity
 */
router.get('/validate/:assetCode/:issuer/:recipient', async (req, res) => {
  try {
    const { assetCode, issuer, recipient } = req.params;
    
    if (!assetCode || !issuer || !recipient) {
      return res.status(400).json({ 
        error: 'Asset code, issuer, and recipient are required' 
      });
    }

    console.log(`🔍 [NFT-API] Validating NFT: ${assetCode} from ${issuer} to ${recipient}`);
    
    const validation = await nftService.validateNFT(assetCode, issuer, recipient);
    
    res.json({
      success: true,
      assetCode,
      issuer,
      recipient,
      validation
    });

  } catch (error) {
    console.error(`❌ [NFT-API] NFT validation failed:`, error);
    res.status(500).json({ 
      error: 'Failed to validate NFT',
      details: error.message 
    });
  }
});

/**
 * POST /api/nft/milestone-check
 * Manually trigger milestone check for a pool (testing/admin function)
 */
router.post('/milestone-check', async (req, res) => {
  try {
    const { poolId, poolData } = req.body;
    
    if (!poolId || !poolData) {
      return res.status(400).json({ 
        error: 'Pool ID and pool data are required' 
      });
    }

    console.log(`🔧 [NFT-API] Manual milestone check for pool: ${poolId}`);
    
    const mintedNFTs = await milestoneService.manualMilestoneCheck(poolId, poolData);
    
    res.json({
      success: true,
      poolId,
      message: 'Milestone check completed',
      mintedNFTs,
      nftCount: mintedNFTs.length
    });

  } catch (error) {
    console.error(`❌ [NFT-API] Manual milestone check failed:`, error);
    res.status(500).json({ 
      error: 'Failed to perform milestone check',
      details: error.message 
    });
  }
});

/**
 * GET /api/nft/statistics
 * Get comprehensive NFT and milestone statistics
 */
router.get('/statistics', async (req, res) => {
  try {
    console.log(`📊 [NFT-API] Fetching NFT statistics`);
    
    const statistics = milestoneService.getMilestoneStatistics();
    
    res.json({
      success: true,
      statistics: {
        ...statistics,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error(`❌ [NFT-API] Error fetching statistics:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch statistics',
      details: error.message 
    });
  }
});

/**
 * GET /api/nft/user/:publicKey/milestones
 * Get individual user milestone progress
 */
router.get('/user/:publicKey/milestones', async (req, res) => {
  try {
    const { publicKey } = req.params;
    const { currentContributed } = req.query;
    
    if (!publicKey) {
      return res.status(400).json({ 
        error: 'Public key is required' 
      });
    }

    console.log(`👤 [NFT-API] Fetching user milestone progress: ${publicKey}`);
    
    const contributedAmount = parseFloat(currentContributed) || 0;
    const progress = milestoneService.getUserMilestoneProgress(publicKey, contributedAmount);
    const milestones = milestoneService.getUserMilestones(publicKey);
    
    res.json({
      success: true,
      userPublicKey: publicKey,
      progress,
      milestones,
      milestoneThresholds: [0.5, 2, 5] // Individual milestone amounts - TESTING VALUES
    });

  } catch (error) {
    console.error(`❌ [NFT-API] Error fetching user milestone progress:`, error);
    res.status(500).json({ 
      error: 'Failed to fetch user milestone progress',
      details: error.message 
    });
  }
});

/**
 * GET /api/nft/health
 * NFT service health check
 */
router.get('/health', async (req, res) => {
  try {
    const statistics = milestoneService.getMilestoneStatistics();
    
    res.json({
      success: true,
      status: 'healthy',
      service: 'NFT Impact Certificates',
      features: {
        nftMinting: true,
        milestoneTracking: true,
        certificateGeneration: true,
        stellarIntegration: true
      },
      statistics: {
        totalNFTsMinted: statistics.totalNFTsMinted,
        totalPoolsTracked: statistics.totalPoolsWithMilestones
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ [NFT-API] Health check failed:`, error);
    res.status(500).json({ 
      error: 'NFT service unhealthy',
      details: error.message 
    });
  }
});

// Get user's claimable NFTs
router.get('/user/:publicKey/claimable', async (req, res) => {
  try {
    const { publicKey } = req.params;
    
    // Get claimable NFTs from milestone service
    const claimableNFTs = milestoneService.getUserClaimableNFTs(publicKey);
    
    res.json({
      success: true,
      claimableNFTs,
      count: claimableNFTs.length
    });
    
  } catch (error) {
    console.error('❌ [NFT-API] Error fetching claimable NFTs:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Claim an NFT
router.post('/claim', async (req, res) => {
  try {
    const { userPublicKey, nftId } = req.body;
    
    if (!userPublicKey || !nftId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userPublicKey, nftId'
      });
    }
    
    console.log(`🎯 [NFT-API] User ${userPublicKey} claiming NFT: ${nftId}`);
    
    // Claim and mint the NFT
    const nft = await milestoneService.claimNFT(userPublicKey, nftId);
    
    console.log(`✅ [NFT-API] NFT successfully claimed and minted`);
    
    res.json({
      success: true,
      message: 'NFT claimed and minted successfully',
      nft
    });
    
  } catch (error) {
    console.error('❌ [NFT-API] Error claiming NFT:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Check milestone eligibility (updated to use claimable system)
router.post('/milestone-check/:poolId', async (req, res) => {
  try {
    const { poolId } = req.params;
    const poolData = req.body;

    console.log(`🔧 [NFT-API] Manual milestone check for pool: ${poolId}`);

    // Calculate total donated
    const totalDonated = poolData.totalDeposited * (poolData.donationPercentage / 100);

    // Check for claimable milestones (don't auto-mint)
    const claimableNFTs = await milestoneService.checkClaimableMilestones(poolId, totalDonated, poolData);

    console.log(`📋 [NFT-API] Found ${claimableNFTs.length} newly claimable milestones`);

    res.json({
      success: true,
      message: `Milestone check completed. ${claimableNFTs.length} new milestones available for claim.`,
      claimableNFTs,
      totalDonated,
      poolMilestones: milestoneService.poolMilestones,
      individualMilestones: milestoneService.individualMilestones
    });

  } catch (error) {
    console.error('❌ [NFT-API] Manual milestone check failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

export default router; 