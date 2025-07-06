import nftService from './nftService.js';

class MilestoneService {
  constructor() {
    // In-memory storage for milestone tracking (in production, use database)
    this.milestoneHistory = new Map(); // poolId -> milestone data
    this.userMilestones = new Map(); // userId -> milestone data
    this.mintedNFTs = new Set(); // Track minted NFTs to prevent duplicates
    this.claimableNFTs = new Map(); // Track claimable but unminted NFTs: userId -> eligible milestones
    
    // Milestone thresholds (TESTING VALUES - very low amounts)
    this.poolMilestones = [0.05, 1, 5, 10]; // Pool milestone amounts in USD - TESTING VALUES
    this.individualMilestones = [0.05, 0.5, 2, 5]; // Individual milestone amounts in USD - TESTING VALUES
  }

  /**
   * Check for claimable milestones without auto-minting
   * This tracks eligible milestones but lets users claim them manually
   */
  async checkClaimableMilestones(poolId, newTotalDonated, poolData = {}) {
    try {
      console.log(`🎯 [MILESTONE] Checking claimable milestones for pool ${poolId}, total: $${newTotalDonated}`);
      
      const claimableNFTs = [];
      
      // Check pool milestones
      const poolClaimable = await this.checkClaimablePoolMilestones(poolId, newTotalDonated, poolData);
      claimableNFTs.push(...poolClaimable);
      
      // Check individual milestones (if individual contributor data available)
      if (poolData.recentContributor) {
        const individualClaimable = await this.checkClaimableIndividualMilestones(
          poolData.recentContributor.publicKey, 
          poolData.recentContributor.totalContributed,
          poolData
        );
        claimableNFTs.push(...individualClaimable);
      }
      
      console.log(`✅ [MILESTONE] Claimable milestone check completed: ${claimableNFTs.length} milestones available for claim`);
      return claimableNFTs;
      
    } catch (error) {
      console.error(`❌ [MILESTONE] Claimable milestone checking failed:`, error);
      return [];
    }
  }

  /**
   * Check pool-level claimable milestones
   */
  async checkClaimablePoolMilestones(poolId, totalDonated, poolData) {
    const claimableNFTs = [];
    
    try {
      // Get previous highest milestone for this pool
      const previousMilestone = this.milestoneHistory.get(poolId)?.highestPoolMilestone || 0;
      
      // Find new milestones reached
      const newMilestones = this.poolMilestones.filter(
        milestone => milestone <= totalDonated && milestone > previousMilestone
      );

      for (const milestone of newMilestones) {
        console.log(`🏆 [MILESTONE] Pool milestone claimable: $${milestone} for pool ${poolId}`);
        
        // Create unique identifier for this milestone NFT
        const nftKey = `pool_${poolId}_${milestone}`;
        
        if (!this.mintedNFTs.has(nftKey)) {
          const recipientPublicKey = poolData.creator || poolData.creatorPublicKey;
          
          if (recipientPublicKey) {
            const claimableNFT = {
              id: nftKey,
              type: 'pool',
              poolId,
              milestone,
              poolData,
              recipientPublicKey,
              metadata: {
                poolName: poolData.name || `Pool ${poolId}`,
                milestoneAmount: milestone,
                milestoneType: 'pool',
                tier: this.determineTier(milestone, 'pool'),
                achievementType: 'Pool Milestone',
                description: `Pool reached $${milestone} in charitable donations`
              },
              claimableAt: new Date().toISOString(),
              claimed: false,
              minted: false
            };
            
            claimableNFTs.push(claimableNFT);
            
            // Store as claimable
            this.addClaimableNFT(recipientPublicKey, claimableNFT);
            
            // Update milestone history
            this.updateMilestoneHistory(poolId, { 
              highestPoolMilestone: milestone,
              lastPoolMilestoneDate: new Date().toISOString()
            });
            
          } else {
            console.warn(`⚠️ [MILESTONE] No recipient for pool milestone: ${poolId}`);
          }
        } else {
          console.log(`⏭️ [MILESTONE] Pool milestone NFT already processed: ${nftKey}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ [MILESTONE] Pool claimable milestone checking failed:`, error);
    }
    
    return claimableNFTs;
  }

  /**
   * Check individual contributor claimable milestones
   */
  async checkClaimableIndividualMilestones(userPublicKey, totalContributed, poolData) {
    const claimableNFTs = [];
    
    try {
      // Get previous highest milestone for this user
      const userHistory = this.userMilestones.get(userPublicKey) || {};
      const previousMilestone = userHistory.highestIndividualMilestone || 0;
      
      // Find new milestones reached
      const newMilestones = this.individualMilestones.filter(
        milestone => milestone <= totalContributed && milestone > previousMilestone
      );

      for (const milestone of newMilestones) {
        console.log(`🌟 [MILESTONE] Individual milestone claimable: $${milestone} for ${userPublicKey}`);
        
        // Create unique identifier for this milestone NFT
        const nftKey = `individual_${userPublicKey}_${milestone}`;
        
        if (!this.mintedNFTs.has(nftKey)) {
          const claimableNFT = {
            id: nftKey,
            type: 'individual',
            userPublicKey,
            milestone,
            poolData,
            totalContributed,
            recipientPublicKey: userPublicKey,
            metadata: {
              poolName: poolData.name || `Pool ${poolData.id || 'Unknown'}`,
              milestoneAmount: milestone,
              milestoneType: 'individual',
              tier: this.determineTier(milestone, 'individual'),
              achievementType: 'Individual Contribution',
              description: `Contributed $${milestone} to charitable impact`,
              totalContributed
            },
            claimableAt: new Date().toISOString(),
            claimed: false,
            minted: false
          };
          
          claimableNFTs.push(claimableNFT);
          
          // Store as claimable
          this.addClaimableNFT(userPublicKey, claimableNFT);
          
          // Update user milestone history
          this.updateUserMilestoneHistory(userPublicKey, {
            highestIndividualMilestone: milestone,
            lastIndividualMilestoneDate: new Date().toISOString(),
            totalContributed
          });
        } else {
          console.log(`⏭️ [MILESTONE] Individual milestone NFT already processed: ${nftKey}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ [MILESTONE] Individual claimable milestone checking failed:`, error);
    }
    
    return claimableNFTs;
  }

  /**
   * Add claimable NFT to user's claim list
   */
  addClaimableNFT(userPublicKey, claimableNFT) {
    if (!this.claimableNFTs.has(userPublicKey)) {
      this.claimableNFTs.set(userPublicKey, []);
    }
    
    const userClaimables = this.claimableNFTs.get(userPublicKey);
    
    // Check if already exists
    const exists = userClaimables.some(nft => nft.id === claimableNFT.id);
    if (!exists) {
      userClaimables.push(claimableNFT);
      console.log(`📋 [MILESTONE] Added claimable NFT for ${userPublicKey}: ${claimableNFT.metadata.achievementType} - $${claimableNFT.milestone}`);
    }
  }

  /**
   * Get user's claimable NFTs
   */
  getUserClaimableNFTs(userPublicKey) {
    const claimables = this.claimableNFTs.get(userPublicKey) || [];
    return claimables.filter(nft => !nft.claimed && !nft.minted);
  }

  /**
   * Claim and mint an NFT
   */
  async claimNFT(userPublicKey, nftId) {
    try {
      console.log(`🎯 [CLAIM] User ${userPublicKey} claiming NFT: ${nftId}`);
      
      const userClaimables = this.claimableNFTs.get(userPublicKey) || [];
      const claimableNFT = userClaimables.find(nft => nft.id === nftId);
      
      if (!claimableNFT) {
        throw new Error('NFT not found or not claimable');
      }
      
      if (claimableNFT.claimed || claimableNFT.minted) {
        throw new Error('NFT already claimed or minted');
      }
      
      // Mark as claimed
      claimableNFT.claimed = true;
      claimableNFT.claimedAt = new Date().toISOString();
      
      // Mint the NFT
      const nft = await nftService.mintImpactCertificate(claimableNFT.metadata);
      
      // Update claimable NFT with mint details
      claimableNFT.minted = true;
      claimableNFT.mintedAt = nft.mintedAt;
      claimableNFT.nftDetails = nft;
      
      // Add to minted set to prevent duplicates
      this.mintedNFTs.add(nftId);
      
      console.log(`✅ [CLAIM] NFT successfully claimed and minted: ${nftId}`);
      return nft;
      
    } catch (error) {
      console.error(`❌ [CLAIM] NFT claiming failed for ${nftId}:`, error);
      throw new Error(`NFT claiming failed: ${error.message}`);
    }
  }

  /**
   * Updated method to use claimable system instead of auto-minting
   */
  async checkAndMintNFTs(poolId, newTotalDonated, poolData = {}) {
    // For backward compatibility, check claimable milestones but don't auto-mint
    const claimableNFTs = await this.checkClaimableMilestones(poolId, newTotalDonated, poolData);
    
    // Return empty array for auto-minting (since we're using claim system now)
    // But log the claimable milestones for awareness
    if (claimableNFTs.length > 0) {
      console.log(`📋 [MILESTONE] ${claimableNFTs.length} NFTs are now claimable (not auto-minted)`);
    }
    
    return []; // No auto-minted NFTs
  }

  /**
   * Check pool-level milestones and mint certificates for pool achievements
   */
  async checkPoolMilestones(poolId, totalDonated, poolData) {
    const mintedNFTs = [];
    
    try {
      // Get previous highest milestone for this pool
      const previousMilestone = this.milestoneHistory.get(poolId)?.highestPoolMilestone || 0;
      
      // Find new milestones reached
      const newMilestones = this.poolMilestones.filter(
        milestone => milestone <= totalDonated && milestone > previousMilestone
      );

      for (const milestone of newMilestones) {
        console.log(`🏆 [MILESTONE] Pool milestone reached: $${milestone} for pool ${poolId}`);
        
        // Create unique identifier for this milestone NFT
        const nftKey = `pool_${poolId}_${milestone}`;
        
        if (!this.mintedNFTs.has(nftKey)) {
          try {
            // Mint NFT for pool creator (if available)
            const recipientPublicKey = poolData.creator || poolData.creatorPublicKey;
            
            if (recipientPublicKey) {
              const nft = await this.mintPoolMilestoneNFT(
                poolId,
                milestone,
                poolData,
                recipientPublicKey
              );
              
              mintedNFTs.push(nft);
              this.mintedNFTs.add(nftKey);
              
              // Update milestone history
              this.updateMilestoneHistory(poolId, { 
                highestPoolMilestone: milestone,
                lastPoolMilestoneDate: new Date().toISOString()
              });
              
            } else {
              console.warn(`⚠️ [MILESTONE] No recipient for pool milestone: ${poolId}`);
            }
            
          } catch (error) {
            console.error(`❌ [MILESTONE] Pool NFT minting failed for ${milestone}:`, error);
          }
        } else {
          console.log(`⏭️ [MILESTONE] Pool milestone NFT already minted: ${nftKey}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ [MILESTONE] Pool milestone checking failed:`, error);
    }
    
    return mintedNFTs;
  }

  /**
   * Check individual contributor milestones
   */
  async checkIndividualMilestones(userPublicKey, totalContributed, poolData) {
    const mintedNFTs = [];
    
    try {
      // Get previous highest milestone for this user
      const userHistory = this.userMilestones.get(userPublicKey) || {};
      const previousMilestone = userHistory.highestIndividualMilestone || 0;
      
      // Find new milestones reached
      const newMilestones = this.individualMilestones.filter(
        milestone => milestone <= totalContributed && milestone > previousMilestone
      );

      for (const milestone of newMilestones) {
        console.log(`🌟 [MILESTONE] Individual milestone reached: $${milestone} for ${userPublicKey}`);
        
        // Create unique identifier for this milestone NFT
        const nftKey = `individual_${userPublicKey}_${milestone}`;
        
        if (!this.mintedNFTs.has(nftKey)) {
          try {
            const nft = await this.mintIndividualMilestoneNFT(
              userPublicKey,
              milestone,
              poolData,
              totalContributed
            );
            
            mintedNFTs.push(nft);
            this.mintedNFTs.add(nftKey);
            
            // Update user milestone history
            this.updateUserMilestoneHistory(userPublicKey, {
              highestIndividualMilestone: milestone,
              lastIndividualMilestoneDate: new Date().toISOString(),
              totalContributed
            });
            
          } catch (error) {
            console.error(`❌ [MILESTONE] Individual NFT minting failed for ${milestone}:`, error);
          }
        } else {
          console.log(`⏭️ [MILESTONE] Individual milestone NFT already minted: ${nftKey}`);
        }
      }
      
    } catch (error) {
      console.error(`❌ [MILESTONE] Individual milestone checking failed:`, error);
    }
    
    return mintedNFTs;
  }

  /**
   * Mint NFT for pool milestone achievement
   */
  async mintPoolMilestoneNFT(poolId, milestone, poolData, recipientPublicKey) {
    const metadata = {
      poolName: poolData.name || `Pool ${poolId}`,
      milestoneAmount: milestone,
      milestoneType: 'pool',
      tier: this.determineTier(milestone, 'pool'),
      recipientPublicKey,
      poolId,
      achievementType: 'Pool Milestone',
      description: `Pool reached $${milestone} in charitable donations`
    };

    console.log(`🎨 [MILESTONE] Minting pool milestone NFT: ${milestone} for ${poolData.name}`);
    
    const nft = await nftService.mintImpactCertificate(metadata);
    
    // Add milestone-specific data
    nft.milestoneType = 'pool';
    nft.milestoneAmount = milestone;
    nft.poolId = poolId;
    
    return nft;
  }

  /**
   * Mint NFT for individual milestone achievement
   */
  async mintIndividualMilestoneNFT(userPublicKey, milestone, poolData, totalContributed) {
    const metadata = {
      poolName: poolData.name || 'Impact Pool Contribution',
      milestoneAmount: milestone,
      milestoneType: 'individual',
      tier: this.determineTier(milestone, 'individual'),
      recipientPublicKey: userPublicKey,
      totalContributed,
      achievementType: 'Individual Milestone',
      description: `Individual contributed $${milestone} to charitable causes`
    };

    console.log(`🎨 [MILESTONE] Minting individual milestone NFT: ${milestone} for ${userPublicKey}`);
    
    const nft = await nftService.mintImpactCertificate(metadata);
    
    // Add milestone-specific data
    nft.milestoneType = 'individual';
    nft.milestoneAmount = milestone;
    nft.userPublicKey = userPublicKey;
    
    return nft;
  }

  /**
   * Determine achievement tier based on milestone amount and type
   */
  determineTier(amount, type) {
    if (type === 'pool') {
      if (amount >= 1000) return 'Platinum';
      if (amount >= 500) return 'Gold';
      if (amount >= 100) return 'Silver';
      return 'Bronze';
    } else if (type === 'individual') {
      if (amount >= 100) return 'Platinum';
      if (amount >= 50) return 'Gold';
      if (amount >= 10) return 'Silver';
      return 'Bronze';
    }
    return 'Bronze';
  }

  /**
   * Get milestone progress for a pool
   */
  getPoolMilestoneProgress(poolId, currentDonated) {
    const nextMilestone = this.poolMilestones.find(m => m > currentDonated);
    const previousMilestone = this.milestoneHistory.get(poolId)?.highestPoolMilestone || 0;
    
    return {
      currentAmount: currentDonated,
      nextMilestone,
      previousMilestone,
      progress: nextMilestone ? (currentDonated / nextMilestone) * 100 : 100,
      completedMilestones: this.poolMilestones.filter(m => m <= currentDonated),
      remainingMilestones: this.poolMilestones.filter(m => m > currentDonated)
    };
  }

  /**
   * Get milestone progress for an individual user
   */
  getUserMilestoneProgress(userPublicKey, currentContributed) {
    const nextMilestone = this.individualMilestones.find(m => m > currentContributed);
    const userHistory = this.userMilestones.get(userPublicKey) || {};
    const previousMilestone = userHistory.highestIndividualMilestone || 0;
    
    return {
      currentAmount: currentContributed,
      nextMilestone,
      previousMilestone,
      progress: nextMilestone ? (currentContributed / nextMilestone) * 100 : 100,
      completedMilestones: this.individualMilestones.filter(m => m <= currentContributed),
      remainingMilestones: this.individualMilestones.filter(m => m > currentContributed)
    };
  }

  /**
   * Get all milestones for a specific pool
   */
  getPoolMilestones(poolId) {
    const history = this.milestoneHistory.get(poolId) || {};
    return {
      poolId,
      milestoneThresholds: this.poolMilestones,
      ...history
    };
  }

  /**
   * Get all milestones for a specific user
   */
  getUserMilestones(userPublicKey) {
    const history = this.userMilestones.get(userPublicKey) || {};
    return {
      userPublicKey,
      milestoneThresholds: this.individualMilestones,
      ...history
    };
  }

  /**
   * Update milestone history for a pool
   */
  updateMilestoneHistory(poolId, milestoneData) {
    const existing = this.milestoneHistory.get(poolId) || {};
    this.milestoneHistory.set(poolId, { ...existing, ...milestoneData });
  }

  /**
   * Update milestone history for a user
   */
  updateUserMilestoneHistory(userPublicKey, milestoneData) {
    const existing = this.userMilestones.get(userPublicKey) || {};
    this.userMilestones.set(userPublicKey, { ...existing, ...milestoneData });
  }

  /**
   * Check if specific milestone has been reached and NFT minted
   */
  isMilestoneComplete(type, identifier, milestone) {
    const nftKey = `${type}_${identifier}_${milestone}`;
    return this.mintedNFTs.has(nftKey);
  }

  /**
   * Manually trigger milestone check (useful for testing or admin functions)
   */
  async manualMilestoneCheck(poolId, poolData) {
    console.log(`🔧 [MILESTONE] Manual milestone check for pool ${poolId}`);
    
    try {
      const totalDonated = poolData.totalDonated || 0;
      return await this.checkAndMintNFTs(poolId, totalDonated, poolData);
    } catch (error) {
      console.error(`❌ [MILESTONE] Manual milestone check failed:`, error);
      throw error;
    }
  }

  /**
   * Get milestone statistics
   */
  getMilestoneStatistics() {
    const totalPoolsWithMilestones = this.milestoneHistory.size;
    const totalUsersWithMilestones = this.userMilestones.size;
    const totalNFTsMinted = this.mintedNFTs.size;
    
    // Count by tier
    const tierCounts = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
    
    // Count pool milestones by tier
    for (const history of this.milestoneHistory.values()) {
      const milestone = history.highestPoolMilestone;
      if (milestone) {
        const tier = this.determineTier(milestone, 'pool');
        tierCounts[tier]++;
      }
    }
    
    // Count individual milestones by tier
    for (const history of this.userMilestones.values()) {
      const milestone = history.highestIndividualMilestone;
      if (milestone) {
        const tier = this.determineTier(milestone, 'individual');
        tierCounts[tier]++;
      }
    }
    
    return {
      totalPoolsWithMilestones,
      totalUsersWithMilestones,
      totalNFTsMinted,
      tierCounts,
      poolMilestoneThresholds: this.poolMilestones,
      individualMilestoneThresholds: this.individualMilestones
    };
  }

  /**
   * Reset milestone data (useful for testing)
   */
  reset() {
    this.milestoneHistory.clear();
    this.userMilestones.clear();
    this.mintedNFTs.clear();
    this.claimableNFTs.clear();
    console.log('🔄 [MILESTONE] Service reset completed');
  }
}

export default new MilestoneService(); 