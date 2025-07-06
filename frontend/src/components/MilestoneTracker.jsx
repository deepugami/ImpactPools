import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { useWallet } from '../contexts/WalletContext';
import nftService from '../services/nftService';
import { toast } from 'sonner';

/**
 * MilestoneTracker Component
 * Displays milestone progress with visual indicators, achievement status, and claim functionality
 */
const MilestoneTracker = ({
  milestones = null,
  progress = null,
  type = 'pool', // 'pool' or 'individual'
  showDetails = true,
  className = '',
  poolData = null // Add pool data for milestone checking
}) => {
  const [showAllMilestones, setShowAllMilestones] = useState(false);
  const [claimableNFTs, setClaimableNFTs] = useState([]);
  const [claimingNFT, setClaimingNFT] = useState(null);
  const [loadingClaimable, setLoadingClaimable] = useState(false);
  
  const { publicKey, isConnected } = useWallet();

  // Load claimable NFTs when component mounts or user connects
  useEffect(() => {
    if (isConnected && publicKey) {
      loadClaimableNFTs();
    }
  }, [isConnected, publicKey]);

  // Load user's claimable NFTs
  const loadClaimableNFTs = async () => {
    if (!publicKey) return;
    
    setLoadingClaimable(true);
    try {
      const claimable = await nftService.getUserClaimableNFTs(publicKey);
      setClaimableNFTs(claimable);
      console.log(`📋 Loaded ${claimable.length} claimable NFTs`);
    } catch (error) {
      console.error('Failed to load claimable NFTs:', error);
    } finally {
      setLoadingClaimable(false);
    }
  };

  // Claim an NFT
  const claimNFT = async (nftId) => {
    if (!publicKey) {
      toast.error('Please connect your wallet to claim NFTs');
      return;
    }

    setClaimingNFT(nftId);
    try {
      console.log(`🎯 Claiming NFT: ${nftId}`);
      const result = await nftService.claimNFT(publicKey, nftId);
      
      if (result.success) {
        toast.success('🎉 NFT claimed successfully!');
        // Remove from claimable list
        setClaimableNFTs(prev => prev.filter(nft => nft.id !== nftId));
      } else {
        toast.error('Failed to claim NFT');
      }
    } catch (error) {
      console.error('NFT claiming error:', error);
      toast.error(`Failed to claim NFT: ${error.message}`);
    } finally {
      setClaimingNFT(null);
    }
  };

  // Check if a milestone has a claimable NFT
  const getClaimableNFT = (milestoneAmount) => {
    return claimableNFTs.find(nft => 
      nft.milestone === milestoneAmount && 
      nft.type === type &&
      !nft.claimed
    );
  };

  if (!milestones && !progress) {
    return null;
  }

  // Updated default milestone thresholds (matching backend TESTING values)
  const defaultThresholds = type === 'pool' ? [1, 5, 10] : [0.5, 2, 5];
  const thresholds = milestones?.thresholds || defaultThresholds;
  const currentAmount = progress?.current || milestones?.current || 0;
  const completedMilestones = milestones?.completed || progress?.completed || [];
  const nextMilestone = progress?.next || thresholds.find(t => t > currentAmount);
  const progressPercentage = progress?.progressPercentage || 0;

  // Updated tier information for new testing thresholds
  const getTierInfo = (amount) => {
    if (type === 'pool') {
      if (amount >= 10) return { tier: 'Platinum', color: 'purple' };
      if (amount >= 5) return { tier: 'Gold', color: 'yellow' };
      if (amount >= 1) return { tier: 'Silver', color: 'gray' };
      return { tier: 'Bronze', color: 'amber' };
    } else {
      if (amount >= 5) return { tier: 'Platinum', color: 'purple' };
      if (amount >= 2) return { tier: 'Gold', color: 'yellow' };
      if (amount >= 0.5) return { tier: 'Silver', color: 'gray' };
      return { tier: 'Bronze', color: 'amber' };
    }
  };

  const currentTier = getTierInfo(currentAmount);

  // Color classes based on tier
  const getColorClasses = (color) => {
    const colors = {
      amber: {
        bg: 'bg-amber-100',
        border: 'border-amber-300',
        text: 'text-amber-700',
        progress: 'bg-amber-500',
        badge: 'bg-amber-500'
      },
      gray: {
        bg: 'bg-gray-100',
        border: 'border-gray-300',
        text: 'text-gray-700',
        progress: 'bg-gray-500',
        badge: 'bg-gray-500'
      },
      yellow: {
        bg: 'bg-yellow-100',
        border: 'border-yellow-300',
        text: 'text-yellow-700',
        progress: 'bg-yellow-500',
        badge: 'bg-yellow-500'
      },
      purple: {
        bg: 'bg-purple-100',
        border: 'border-purple-300',
        text: 'text-purple-700',
        progress: 'bg-purple-500',
        badge: 'bg-purple-500'
      }
    };
    return colors[color] || colors.amber;
  };

  const tierColors = getColorClasses(currentTier.color);

  /**
   * Individual Milestone Item Component with Claim Functionality
   */
  const MilestoneItem = ({ amount, isCompleted, isNext, isCurrent }) => {
    const tierInfo = getTierInfo(amount);
    const colors = getColorClasses(tierInfo.color);
    const claimableNFT = getClaimableNFT(amount);
    const isClaimable = !!claimableNFT;
    const isClaiming = claimingNFT === claimableNFT?.id;

    return (
      <div className={`flex items-center justify-between p-3 rounded-lg border ${
        isCompleted ? `${colors.bg} ${colors.border}` : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="flex items-center gap-3">
          {/* Milestone Icon */}
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isCompleted ? colors.badge : 'bg-gray-300'
          }`}>
            {isCompleted ? (
              <span className="text-white text-sm">✓</span>
            ) : isCurrent ? (
              <span className="text-white text-sm">⚡</span>
            ) : (
              <span className="text-gray-600 text-sm">{amount >= 1000 ? '1K' : amount}</span>
            )}
          </div>

          {/* Milestone Info */}
          <div>
            <div className="font-semibold text-gray-800">
              ${amount} {type === 'pool' ? 'Pool' : 'Individual'} Milestone
            </div>
            <div className="text-sm text-gray-600">
              {tierInfo.tier} Tier Achievement
            </div>
            {/* Claimable NFT Info */}
            {isClaimable && (
              <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                🎁 Impact Certificate ready to claim!
              </div>
            )}
          </div>
        </div>

        {/* Status Badge and Claim Button */}
        <div className="flex items-center gap-2">
          {isClaimable ? (
            <button
              onClick={() => claimNFT(claimableNFT.id)}
              disabled={isClaiming || !isConnected}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                isClaiming 
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              {isClaiming ? (
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent rounded-full animate-spin"></div>
                  Claiming...
                </div>
              ) : (
                'Claim NFT'
              )}
            </button>
          ) : isCompleted ? (
            <Badge className={`${colors.badge} text-white`}>
              Achieved
            </Badge>
          ) : isNext ? (
            <Badge className="bg-blue-500 text-white">
              Next Goal
            </Badge>
          ) : (
            <Badge className="bg-gray-300 text-gray-600">
              Locked
            </Badge>
          )}
        </div>
      </div>
    );
  };

  /**
   * Progress Bar Component
   */
  const ProgressBar = () => {
    if (!nextMilestone) return null;

    const progressToNext = Math.min((currentAmount / nextMilestone) * 100, 100);

    return (
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            Progress to ${nextMilestone}
          </span>
          <span className="text-sm text-gray-600">
            ${currentAmount} / ${nextMilestone}
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`${tierColors.progress} h-3 rounded-full transition-all duration-500 ease-out`}
            style={{ width: `${progressToNext}%` }}
          />
        </div>
        
        <div className="text-xs text-gray-600 mt-1">
          ${nextMilestone - currentAmount} remaining to next milestone
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">
            {type === 'pool' ? 'Pool' : 'Individual'} Milestones
          </h3>
          <p className="text-sm text-gray-600">
            Track charitable impact achievements
          </p>
        </div>
        
        {/* Current Tier Badge */}
        <div className="text-center">
          <Badge className={`${tierColors.badge} text-white mb-1`}>
            {currentTier.tier} Tier
          </Badge>
          <div className="text-sm font-semibold ${tierColors.text}">
            ${currentAmount}
          </div>
        </div>
      </div>

      {/* Progress to Next Milestone */}
      {nextMilestone && <ProgressBar />}

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">
            {completedMilestones.length}
          </div>
          <div className="text-sm text-gray-600">Achieved</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">
            {thresholds.length - completedMilestones.length}
          </div>
          <div className="text-sm text-gray-600">Remaining</div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-2xl font-bold text-gray-800">
            {Math.round(progressPercentage)}%
          </div>
          <div className="text-sm text-gray-600">Progress</div>
        </div>
      </div>

      {/* Milestone List */}
      {showDetails && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800">All Milestones</h4>
            <button
              onClick={() => setShowAllMilestones(!showAllMilestones)}
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              {showAllMilestones ? 'Show Less' : 'Show All'}
            </button>
          </div>

          {/* Show next milestone and completed milestones by default */}
          <div className="space-y-2">
            {thresholds
              .slice(0, showAllMilestones ? undefined : 3)
              .map((threshold) => (
                <MilestoneItem
                  key={threshold}
                  amount={threshold}
                  isCompleted={completedMilestones.includes(threshold)}
                  isNext={threshold === nextMilestone}
                  isCurrent={threshold <= currentAmount && threshold > (completedMilestones[completedMilestones.length - 1] || 0)}
                />
              ))}
          </div>
        </div>
      )}

      {/* Achievement Message */}
      {completedMilestones.length > 0 && (
        <div className={`mt-6 p-4 ${tierColors.bg} border ${tierColors.border} rounded-lg`}>
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            <div>
              <div className="font-medium ${tierColors.text}">
                Congratulations on your achievements!
              </div>
              <div className="text-sm ${tierColors.text} opacity-80">
                You've reached {completedMilestones.length} milestone{completedMilestones.length > 1 ? 's' : ''} and earned Impact Certificates.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Progress Message */}
      {currentAmount === 0 && (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🎯</div>
          <h4 className="font-medium text-gray-700 mb-1">
            Start Your Impact Journey
          </h4>
          <p className="text-sm text-gray-600">
            Make your first contribution to begin earning milestones!
          </p>
        </div>
      )}
    </div>
  );
};

/**
 * Combined Milestone Dashboard Component
 * Shows both pool and individual milestones side by side
 */
export const MilestoneDashboard = ({
  poolMilestones,
  userMilestones,
  poolProgress,
  userProgress,
  className = ''
}) => {
  return (
    <div className={`grid grid-cols-1 lg:grid-cols-2 gap-6 ${className}`}>
      {/* Pool Milestones */}
      <MilestoneTracker
        milestones={poolMilestones}
        progress={poolProgress}
        type="pool"
        showDetails={true}
      />
      
      {/* Individual Milestones */}
      <MilestoneTracker
        milestones={userMilestones}
        progress={userProgress}
        type="individual"
        showDetails={true}
      />
    </div>
  );
};

/**
 * Compact Milestone Progress Component
 * Shows minimal milestone information for use in cards or smaller spaces
 */
export const CompactMilestoneProgress = ({
  currentAmount = 0,
  nextMilestone = null,
  type = 'pool',
  className = ''
}) => {
  if (!nextMilestone) {
    return (
      <div className={`text-center py-2 ${className}`}>
        <span className="text-green-600 font-medium">🏆 All milestones achieved!</span>
      </div>
    );
  }

  const progressPercentage = Math.min((currentAmount / nextMilestone) * 100, 100);
  const remaining = nextMilestone - currentAmount;

  return (
    <div className={`${className}`}>
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          Next: ${nextMilestone}
        </span>
        <span className="text-xs text-gray-600">
          ${remaining} to go
        </span>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div 
          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default MilestoneTracker; 