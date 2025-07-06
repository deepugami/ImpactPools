import axios from 'axios';

// Base API URL - adjust for your backend configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

class NFTService {
  constructor() {
    this.apiUrl = `${API_BASE_URL}/api/nft`;
    this.axios = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000, // 30 seconds for NFT operations (they can be slow)
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Add request interceptor for logging
    this.axios.interceptors.request.use(
      (config) => {
        console.log(`🚀 [NFT-CLIENT] ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('❌ [NFT-CLIENT] Request error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor for logging
    this.axios.interceptors.response.use(
      (response) => {
        console.log(`✅ [NFT-CLIENT] Response received: ${response.status}`);
        return response;
      },
      (error) => {
        console.error('❌ [NFT-CLIENT] Response error:', error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get all NFTs owned by a user
   * @param {string} publicKey - User's Stellar public key
   * @returns {Promise<Array>} Array of user's NFTs
   */
  async getUserNFTs(publicKey) {
    try {
      console.log(`📋 [NFT-CLIENT] Fetching NFTs for user: ${publicKey}`);
      
      const response = await this.axios.get(`/user/${publicKey}`);
      
      if (response.data.success) {
        console.log(`✅ [NFT-CLIENT] Found ${response.data.nftCount} NFTs for user`);
        return response.data.nfts || [];
      }
      
      throw new Error('Invalid response format');
      
    } catch (error) {
      console.error(`❌ [NFT-CLIENT] Failed to fetch user NFTs:`, error);
      
      // Improved error handling - check if it's a connection error
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_CONNECTION_RESET') {
        console.warn('⚠️ [NFT-CLIENT] Backend connection failed, using fallback mode');
        // Return empty array rather than throwing to prevent UI breaking
        return [];
      }
      
      // Return empty array on error rather than throwing
      // This prevents NFT errors from breaking the UI
      return [];
    }
  }

  /**
   * Get milestone progress for a pool
   * @param {string} poolId - Pool identifier
   * @param {number} currentDonated - Current donated amount
   * @returns {Promise<Object>} Milestone progress data
   */
  async getPoolMilestoneProgress(poolId, currentDonated = 0) {
    try {
      console.log(`🎯 [NFT-CLIENT] Fetching milestone progress for pool: ${poolId}`);
      
      const response = await this.axios.get(`/milestones/${poolId}`, {
        params: { currentDonated }
      });
      
      if (response.data.success) {
        console.log(`✅ [NFT-CLIENT] Milestone progress retrieved for pool ${poolId}`);
        return response.data.progress;
      }
      
      throw new Error('Invalid response format');
      
    } catch (error) {
      console.error(`❌ [NFT-CLIENT] Failed to fetch milestone progress:`, error);
      
      // Return default progress structure on error
      return {
        currentAmount: currentDonated,
        nextMilestone: 100,
        previousMilestone: 0,
        progress: 0,
        completedMilestones: [],
        remainingMilestones: [100, 500, 1000]
      };
    }
  }

  /**
   * Get individual user milestone progress
   * @param {string} publicKey - User's public key
   * @param {number} currentContributed - Current contributed amount
   * @returns {Promise<Object>} User milestone progress
   */
  async getUserMilestoneProgress(publicKey, currentContributed = 0) {
    try {
      console.log(`👤 [NFT-CLIENT] Fetching user milestone progress: ${publicKey}`);
      
      const response = await this.axios.get(`/user/${publicKey}/milestones`, {
        params: { currentContributed }
      });
      
      if (response.data.success) {
        console.log(`✅ [NFT-CLIENT] User milestone progress retrieved`);
        return response.data.progress;
      }
      
      throw new Error('Invalid response format');
      
    } catch (error) {
      console.error(`❌ [NFT-CLIENT] Failed to fetch user milestone progress:`, error);
      
      // Return default progress structure on error
      return {
        currentAmount: currentContributed,
        nextMilestone: 10,
        previousMilestone: 0,
        progress: 0,
        completedMilestones: [],
        remainingMilestones: [10, 50, 100]
      };
    }
  }

  /**
   * Manually mint an NFT (admin/testing function)
   * @param {Object} metadata - NFT metadata
   * @returns {Promise<Object>} Minted NFT details
   */
  async mintNFT(metadata) {
    try {
      console.log(`🎨 [NFT-CLIENT] Requesting NFT mint:`, metadata);
      
      const response = await this.axios.post('/mint', { metadata });
      
      if (response.data.success) {
        console.log(`✅ [NFT-CLIENT] NFT minted successfully`);
        return response.data.nft;
      }
      
      throw new Error(response.data.error || 'Minting failed');
      
    } catch (error) {
      console.error(`❌ [NFT-CLIENT] NFT minting failed:`, error);
      throw new Error(`NFT minting failed: ${error.response?.data?.details || error.message}`);
    }
  }

  /**
   * Validate NFT authenticity
   * @param {string} assetCode - NFT asset code
   * @param {string} issuer - Issuer public key
   * @param {string} recipient - Recipient public key
   * @returns {Promise<Object>} Validation result
   */
  async validateNFT(assetCode, issuer, recipient) {
    try {
      console.log(`🔍 [NFT-CLIENT] Validating NFT: ${assetCode}`);
      
      const response = await this.axios.get(`/validate/${assetCode}/${issuer}/${recipient}`);
      
      if (response.data.success) {
        console.log(`✅ [NFT-CLIENT] NFT validation completed`);
        return response.data.validation;
      }
      
      throw new Error('Invalid response format');
      
    } catch (error) {
      console.error(`❌ [NFT-CLIENT] NFT validation failed:`, error);
      return { isValid: false, isNonTransferable: false, isOwned: false };
    }
  }

  /**
   * Get NFT gallery data
   * @returns {Promise<Object>} Gallery statistics and featured NFTs
   */
  async getGalleryData() {
    try {
      console.log(`🖼️ [NFT-CLIENT] Fetching gallery data`);
      
      const response = await this.axios.get('/gallery');
      
      if (response.data.success) {
        console.log(`✅ [NFT-CLIENT] Gallery data retrieved`);
        return response.data.gallery;
      }
      
      throw new Error('Invalid response format');
      
    } catch (error) {
      console.error(`❌ [NFT-CLIENT] Failed to fetch gallery data:`, error);
      return {
        totalNFTsMinted: 0,
        totalPoolsWithMilestones: 0,
        milestoneThresholds: { pool: [100, 500, 1000], individual: [10, 50, 100] },
        recentlyMinted: []
      };
    }
  }

  /**
   * Get comprehensive NFT statistics
   * @returns {Promise<Object>} Platform NFT statistics
   */
  async getStatistics() {
    try {
      console.log(`📊 [NFT-CLIENT] Fetching NFT statistics`);
      
      const response = await this.axios.get('/statistics');
      
      if (response.data.success) {
        console.log(`✅ [NFT-CLIENT] Statistics retrieved`);
        return response.data.statistics;
      }
      
      throw new Error('Invalid response format');
      
    } catch (error) {
      console.error(`❌ [NFT-CLIENT] Failed to fetch statistics:`, error);
      return {
        totalPoolsWithMilestones: 0,
        totalNFTsMinted: 0,
        poolMilestoneThresholds: [100, 500, 1000],
        individualMilestoneThresholds: [10, 50, 100]
      };
    }
  }

  /**
   * Get platform-wide NFT statistics (alias for getStatistics)
   * @returns {Promise<Object>} Platform NFT statistics
   */
  async getPlatformStats() {
    try {
      console.log(`📊 [NFT-CLIENT] Fetching platform NFT statistics`);
      
      const response = await this.axios.get('/statistics');
      
      if (response.data.success) {
        console.log(`✅ [NFT-CLIENT] Platform statistics retrieved`);
        return {
          totalCertificatesIssued: response.data.statistics.totalNFTsMinted || 0,
          totalMilestonesAchieved: response.data.statistics.totalPoolsWithMilestones || 0,
          ...response.data.statistics
        };
      }
      
      throw new Error('Invalid response format');
      
    } catch (error) {
      console.error(`❌ [NFT-CLIENT] Failed to fetch platform statistics:`, error);
      return {
        totalCertificatesIssued: 0,
        totalMilestonesAchieved: 0,
        totalPoolsWithMilestones: 0,
        totalNFTsMinted: 0,
        poolMilestoneThresholds: [100, 500, 1000],
        individualMilestoneThresholds: [10, 50, 100]
      };
    }
  }

  /**
   * Manually trigger milestone check (admin/testing function)
   * @param {string} poolId - Pool identifier
   * @param {Object} poolData - Pool data
   * @returns {Promise<Array>} Minted NFTs
   */
  async triggerMilestoneCheck(poolId, poolData) {
    try {
      console.log(`🔧 [NFT-CLIENT] Triggering milestone check for pool: ${poolId}`);
      
      const response = await this.axios.post('/milestone-check', { poolId, poolData });
      
      if (response.data.success) {
        console.log(`✅ [NFT-CLIENT] Milestone check completed: ${response.data.nftCount} NFTs minted`);
        return response.data.mintedNFTs || [];
      }
      
      throw new Error(response.data.error || 'Milestone check failed');
      
    } catch (error) {
      console.error(`❌ [NFT-CLIENT] Milestone check failed:`, error);
      throw new Error(`Milestone check failed: ${error.response?.data?.details || error.message}`);
    }
  }

  /**
   * Check NFT service health
   * @returns {Promise<Object>} Service health status
   */
  async checkHealth() {
    try {
      console.log(`🏥 [NFT-CLIENT] Checking NFT service health`);
      
      const response = await this.axios.get('/health');
      
      if (response.data.success) {
        console.log(`✅ [NFT-CLIENT] NFT service is healthy`);
        return response.data;
      }
      
      throw new Error('Service unhealthy');
      
    } catch (error) {
      console.error(`❌ [NFT-CLIENT] NFT service health check failed:`, error);
      return { success: false, status: 'unhealthy', error: error.message };
    }
  }

  /**
   * Format milestone data for UI display
   * @param {Object} progress - Milestone progress data
   * @returns {Object} Formatted milestone data
   */
  formatMilestoneProgress(progress) {
    return {
      current: progress.currentAmount || 0,
      next: progress.nextMilestone,
      progressPercentage: Math.min(progress.progress || 0, 100),
      completed: progress.completedMilestones || [],
      remaining: progress.remainingMilestones || [],
      isComplete: !progress.nextMilestone,
      tier: this.determineTier(progress.currentAmount || 0, 'pool')
    };
  }

  /**
   * Determine achievement tier based on amount (updated for testing thresholds)
   * @param {number} amount - Achievement amount
   * @param {string} type - Milestone type ('pool' or 'individual')
   * @returns {string} Achievement tier
   */
  determineTier(amount, type = 'pool') {
    if (type === 'pool') {
      if (amount >= 10) return 'Platinum';
      if (amount >= 5) return 'Gold';
      if (amount >= 1) return 'Silver';
      return 'Bronze';
    } else {
      if (amount >= 5) return 'Platinum';
      if (amount >= 2) return 'Gold';
      if (amount >= 0.5) return 'Silver';
      return 'Bronze';
    }
  }

  /**
   * Get tier color for UI styling
   * @param {string} tier - Achievement tier
   * @returns {string} CSS color class or hex color
   */
  getTierColor(tier) {
    const colors = {
      'Bronze': '#cd7f32',
      'Silver': '#c0c0c0',
      'Gold': '#ffd700',
      'Platinum': '#e5e4e2'
    };
    return colors[tier] || '#64748b';
  }

  /**
   * Format NFT display data
   * @param {Object} nft - Raw NFT data
   * @returns {Object} Formatted NFT data for UI
   */
  formatNFTForDisplay(nft) {
    return {
      assetCode: nft.assetCode,
      issuer: nft.issuer,
      metadata: nft.metadata || {},
      tier: nft.metadata?.tier || 'Bronze',
      tierColor: this.getTierColor(nft.metadata?.tier),
      poolName: nft.metadata?.pool_name || 'Unknown Pool',
      milestoneAmount: nft.metadata?.milestone_amount || '0',
      milestoneType: nft.metadata?.milestone_type || 'pool',
      mintedAt: nft.metadata?.minted_at || new Date().toISOString(),
      isNonTransferable: true,
      certificateImage: nft.certificateImage
    };
  }

  /**
   * Get user's claimable NFTs
   */
  async getUserClaimableNFTs(publicKey) {
    try {
      console.log(`📋 [NFT] Fetching claimable NFTs for user: ${publicKey}`)
      
      const response = await fetch(`${API_BASE_URL}/nft/user/${publicKey}/claimable`)
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch claimable NFTs')
      }
      
      console.log(`📋 [NFT] Found ${data.count} claimable NFTs`)
      return data.claimableNFTs
      
    } catch (error) {
      console.error('❌ [NFT] Error fetching claimable NFTs:', error)
      throw new Error(`Failed to fetch claimable NFTs: ${error.message}`)
    }
  }

  /**
   * Claim an NFT
   * @param {string} userPublicKey - User's Stellar public key
   * @param {string} nftId - ID of the NFT to claim
   * @returns {Promise<Object>} Claim result
   */
  async claimNFT(userPublicKey, nftId) {
    try {
      console.log(`🎯 [NFT-CLIENT] Claiming NFT: ${nftId} for user: ${userPublicKey}`);
      
      const response = await this.axios.post('/claim', {
        userPublicKey,
        nftId
      });
      
      if (response.data.success) {
        console.log(`✅ [NFT-CLIENT] NFT claimed successfully: ${nftId}`);
        return {
          success: true,
          nft: response.data.nft,
          message: response.data.message
        };
      }
      
      throw new Error(response.data.error || 'Failed to claim NFT');
      
    } catch (error) {
      console.error(`❌ [NFT-CLIENT] Failed to claim NFT ${nftId}:`, error);
      throw new Error(`Failed to claim NFT: ${error.response?.data?.error || error.message}`);
    }
  }

  /**
   * Trigger milestone check (updated for claim system)
   */
  async triggerMilestoneCheckUpdated(poolId, poolData) {
    try {
      console.log(`🔧 [NFT] Triggering milestone check for pool: ${poolId}`)
      
      const response = await fetch(`${API_BASE_URL}/nft/milestone-check/${poolId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(poolData)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error || 'Milestone check failed')
      }
      
      console.log(`✅ [NFT] Milestone check completed: ${data.claimableNFTs.length} new claimable NFTs`)
      return data.claimableNFTs // Return claimable NFTs instead of minted ones
      
    } catch (error) {
      console.error('❌ [NFT] Error in milestone check:', error)
      throw new Error(`Milestone check failed: ${error.message}`)
    }
  }
}

// Create and export singleton instance
const nftService = new NFTService();
export default nftService; 