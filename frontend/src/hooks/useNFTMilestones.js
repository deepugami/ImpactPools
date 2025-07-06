import { useState, useEffect, useCallback } from 'react';
import nftService from '../services/nftService.js';
import { useWallet } from '../contexts/WalletContext.jsx';

/**
 * Custom hook for NFT milestone tracking
 * Provides milestone progress, NFT collections, and milestone checking functionality
 * @param {string} userPublicKey - User's wallet public key
 * @param {string} poolId - Optional pool ID for pool-specific milestones
 * @param {Object} options - Configuration options
 * @returns {Object} NFT milestone data and functions
 */
export const useNFTMilestones = (userPublicKey = null, poolId = null, options = {}) => {
  const { publicKey: walletPublicKey } = useWallet();
  
  // Use provided publicKey or fall back to wallet publicKey
  const publicKey = userPublicKey || walletPublicKey;
  
  // Configuration options with defaults
  const {
    autoRefresh = true,
    refreshInterval = 30000, // 30 seconds
    enableLogging = true
  } = options;

  // State management
  const [state, setState] = useState({
    // NFT Collection
    userNFTs: [],
    nftCount: 0,
    
    // Pool milestones
    poolMilestones: null,
    poolProgress: null,
    
    // Individual milestones
    userMilestones: null,
    userProgress: null,
    
    // Loading states
    loading: false,
    nftsLoading: false,
    milestonesLoading: false,
    
    // Error states
    error: null,
    lastUpdated: null
  });

  /**
   * Log function for debugging
   */
  const log = useCallback((message, data = null) => {
    if (enableLogging) {
      console.log(`🎯 [useNFTMilestones] ${message}`, data || '');
    }
  }, [enableLogging]);

  /**
   * Update state safely
   */
  const updateState = useCallback((updates) => {
    setState(prev => ({
      ...prev,
      ...updates,
      lastUpdated: new Date().toISOString()
    }));
  }, []);

  /**
   * Fetch user's NFT collection
   */
  const fetchUserNFTs = useCallback(async () => {
    if (!publicKey) {
      log('No public key available for NFT fetch');
      return;
    }

    try {
      updateState({ nftsLoading: true, error: null });
      log(`Fetching NFTs for user: ${publicKey}`);
      
      const nfts = await nftService.getUserNFTs(publicKey);
      const formattedNFTs = nfts.map(nft => nftService.formatNFTForDisplay(nft));
      
      updateState({
        userNFTs: formattedNFTs,
        nftCount: formattedNFTs.length,
        nftsLoading: false
      });
      
      log(`Loaded ${formattedNFTs.length} NFTs`);
      
    } catch (error) {
      log('Error fetching user NFTs', error);
      updateState({
        error: `Failed to load NFTs: ${error.message}`,
        nftsLoading: false,
        userNFTs: [],
        nftCount: 0
      });
    }
  }, [publicKey, log, updateState]);

  /**
   * Fetch pool milestone progress
   */
  const fetchPoolMilestones = useCallback(async (currentDonated = 0) => {
    if (!poolId) return;

    try {
      updateState({ milestonesLoading: true, error: null });
      log(`Fetching pool milestones for: ${poolId}`);
      
      const progress = await nftService.getPoolMilestoneProgress(poolId, currentDonated);
      const formattedProgress = nftService.formatMilestoneProgress(progress);
      
      updateState({
        poolProgress: formattedProgress,
        poolMilestones: {
          thresholds: [100, 500, 1000],
          current: progress.currentAmount,
          completed: progress.completedMilestones || [],
          remaining: progress.remainingMilestones || []
        },
        milestonesLoading: false
      });
      
      log(`Pool milestone progress loaded`, formattedProgress);
      
    } catch (error) {
      log('Error fetching pool milestones', error);
      updateState({
        error: `Failed to load pool milestones: ${error.message}`,
        milestonesLoading: false
      });
    }
  }, [poolId, log, updateState]);

  /**
   * Fetch user milestone progress
   */
  const fetchUserMilestones = useCallback(async (currentContributed = 0) => {
    if (!publicKey) return;

    try {
      log(`Fetching user milestones for: ${publicKey}`);
      
      const progress = await nftService.getUserMilestoneProgress(publicKey, currentContributed);
      const formattedProgress = nftService.formatMilestoneProgress(progress);
      
      updateState({
        userProgress: formattedProgress,
        userMilestones: {
          thresholds: [10, 50, 100],
          current: progress.currentAmount,
          completed: progress.completedMilestones || [],
          remaining: progress.remainingMilestones || []
        }
      });
      
      log(`User milestone progress loaded`, formattedProgress);
      
    } catch (error) {
      log('Error fetching user milestones', error);
      updateState({
        error: `Failed to load user milestones: ${error.message}`
      });
    }
  }, [publicKey, log, updateState]);

  /**
   * Refresh all data
   */
  const refresh = useCallback(async (poolData = {}) => {
    updateState({ loading: true, error: null });
    log('Refreshing all NFT milestone data');
    
    try {
      // Fetch user NFTs
      await fetchUserNFTs();
      
      // Fetch pool milestones if pool ID provided
      if (poolId && poolData.totalDonated !== undefined) {
        await fetchPoolMilestones(poolData.totalDonated);
      }
      
      // Fetch user milestones if user contribution data available
      if (poolData.userContributed !== undefined) {
        await fetchUserMilestones(poolData.userContributed);
      }
      
      updateState({ loading: false });
      log('All NFT milestone data refreshed successfully');
      
    } catch (error) {
      log('Error during refresh', error);
      updateState({
        loading: false,
        error: `Refresh failed: ${error.message}`
      });
    }
  }, [fetchUserNFTs, fetchPoolMilestones, fetchUserMilestones, poolId, log, updateState]);

  /**
   * Check if user has achieved a specific milestone
   */
  const hasMilestone = useCallback((amount, type = 'pool') => {
    if (type === 'pool' && state.poolMilestones) {
      return state.poolMilestones.completed.includes(amount);
    } else if (type === 'user' && state.userMilestones) {
      return state.userMilestones.completed.includes(amount);
    }
    return false;
  }, [state.poolMilestones, state.userMilestones]);

  /**
   * Get NFTs of a specific tier
   */
  const getNFTsByTier = useCallback((tier) => {
    return state.userNFTs.filter(nft => nft.tier === tier);
  }, [state.userNFTs]);

  /**
   * Get milestone progress percentage
   */
  const getMilestoneProgress = useCallback((type = 'pool') => {
    if (type === 'pool' && state.poolProgress) {
      return state.poolProgress.progressPercentage;
    } else if (type === 'user' && state.userProgress) {
      return state.userProgress.progressPercentage;
    }
    return 0;
  }, [state.poolProgress, state.userProgress]);

  /**
   * Get next milestone amount
   */
  const getNextMilestone = useCallback((type = 'pool') => {
    if (type === 'pool' && state.poolProgress) {
      return state.poolProgress.next;
    } else if (type === 'user' && state.userProgress) {
      return state.userProgress.next;
    }
    return null;
  }, [state.poolProgress, state.userProgress]);

  /**
   * Check if milestones are complete
   */
  const isComplete = useCallback((type = 'pool') => {
    if (type === 'pool' && state.poolProgress) {
      return state.poolProgress.isComplete;
    } else if (type === 'user' && state.userProgress) {
      return state.userProgress.isComplete;
    }
    return false;
  }, [state.poolProgress, state.userProgress]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh || !publicKey) return;

    const interval = setInterval(() => {
      log('Auto-refreshing milestone data');
      refresh();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, publicKey, refresh, log]);

  // Initial load effect
  useEffect(() => {
    if (publicKey) {
      log('Initial NFT milestone data load');
      refresh();
    }
  }, [publicKey, poolId, refresh, log]);

  // Return hook interface
  return {
    // State - using expected property names
    userNFTs: state.userNFTs,
    nftCount: state.nftCount,
    isLoading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Combined milestones object for easier consumption
    milestones: {
      pool: state.poolMilestones,
      user: state.userMilestones
    },
    
    // Progress objects
    poolProgress: state.poolProgress,
    userProgress: state.userProgress,
    
    // Computed properties
    hasAnyNFTs: state.nftCount > 0,
    isConnected: !!publicKey,
    
    // Actions - using expected function names
    refreshData: refresh,
    refresh,
    fetchUserNFTs,
    fetchPoolMilestones,
    fetchUserMilestones,
    
    // Getters
    hasMilestone,
    getNFTsByTier,
    getMilestoneProgress,
    getNextMilestone,
    isComplete,
    
    // Milestone thresholds for reference
    milestoneThresholds: {
      pool: [100, 500, 1000],
      individual: [10, 50, 100]
    },
    
    // Tier information
    tiers: ['Bronze', 'Silver', 'Gold', 'Platinum'],
    
    // Helper for getting tier colors
    getTierColor: (tier) => {
      const tierColors = {
        'Bronze': 'amber',
        'Silver': 'gray', 
        'Gold': 'yellow',
        'Platinum': 'purple'
      };
      return tierColors[tier] || 'gray';
    }
  };
};

export default useNFTMilestones; 