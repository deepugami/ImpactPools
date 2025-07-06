import React, { useState } from 'react';
import NFTCertificate, { NFTCertificateGrid, NFTCertificateModal } from './NFTCertificate';
import { Badge } from './ui/badge';

/**
 * NFTGallery Component
 * Displays a user's complete NFT collection with filtering and sorting options
 */
const NFTGallery = ({
  nfts = [],
  loading = false,
  error = null,
  onRefresh = null,
  className = ''
}) => {
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filterTier, setFilterTier] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date', 'tier', 'amount'
  const [viewMode, setViewMode] = useState('grid'); // 'grid', 'list'

  // Get tier color based on tier name
  const getTierColor = (tier) => {
    const tierColors = {
      'Bronze': 'amber',
      'Silver': 'gray',
      'Gold': 'yellow',
      'Platinum': 'purple'
    };
    return tierColors[tier] || 'gray';
  };

  // Filter and sort NFTs
  const processedNFTs = React.useMemo(() => {
    let filtered = [...nfts];

    // Apply tier filter
    if (filterTier !== 'all') {
      filtered = filtered.filter(nft => nft.tier === filterTier);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.mintedAt) - new Date(a.mintedAt);
        case 'tier':
          const tierOrder = { 'Platinum': 4, 'Gold': 3, 'Silver': 2, 'Bronze': 1 };
          return tierOrder[b.tier] - tierOrder[a.tier];
        case 'amount':
          return (b.milestoneAmount || 0) - (a.milestoneAmount || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [nfts, filterTier, sortBy]);

  // Get tier statistics
  const tierStats = React.useMemo(() => {
    const stats = { Bronze: 0, Silver: 0, Gold: 0, Platinum: 0 };
    nfts.forEach(nft => {
      if (stats.hasOwnProperty(nft.tier)) {
        stats[nft.tier]++;
      }
    });
    return stats;
  }, [nfts]);

  // Handle NFT selection
  const handleViewNFT = (nft) => {
    setSelectedNFT(nft);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedNFT(null);
  };

  // Loading state
  if (loading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 shadow-sm p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your Impact Certificates...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className={`bg-white rounded-lg border border-red-200 shadow-sm p-8 ${className}`}>
        <div className="text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold text-red-700 mb-2">
            Error Loading NFTs
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              Impact Certificate Gallery
            </h2>
            <p className="text-gray-600">
              Your collection of charitable milestone achievements
            </p>
          </div>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors disabled:opacity-50"
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          )}
        </div>

        {/* Collection Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-800">{nfts.length}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          
          {Object.entries(tierStats).map(([tier, count]) => {
            const colors = {
              Bronze: 'text-amber-600',
              Silver: 'text-gray-600',
              Gold: 'text-yellow-600',
              Platinum: 'text-purple-600'
            };
            
            return (
              <div key={tier} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className={`text-2xl font-bold ${colors[tier]}`}>{count}</div>
                <div className="text-sm text-gray-600">{tier}</div>
              </div>
            );
          })}
        </div>

        {/* Filters and Controls */}
        {nfts.length > 0 && (
          <div className="flex flex-wrap items-center gap-4">
            {/* Tier Filter */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Filter:</label>
              <select
                value={filterTier}
                onChange={(e) => setFilterTier(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="all">All Tiers</option>
                <option value="Platinum">Platinum</option>
                <option value="Gold">Gold</option>
                <option value="Silver">Silver</option>
                <option value="Bronze">Bronze</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Sort:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="date">Date Earned</option>
                <option value="tier">Tier Level</option>
                <option value="amount">Milestone Amount</option>
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">View:</label>
              <div className="flex rounded-md border border-gray-300 overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 text-sm ${
                    viewMode === 'grid' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 text-sm ${
                    viewMode === 'list' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  List
                </button>
              </div>
            </div>

            {/* Results Count */}
            <div className="text-sm text-gray-600 ml-auto">
              Showing {processedNFTs.length} of {nfts.length} certificates
            </div>
          </div>
        )}
      </div>

      {/* NFT Collection Display */}
      <div className="p-6">
        {processedNFTs.length === 0 ? (
          <div className="text-center py-12">
            {nfts.length === 0 ? (
              // No NFTs at all
              <>
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No Impact Certificates Yet
                </h3>
                <p className="text-gray-500 mb-4">
                  Start contributing to charitable pools to earn your first certificate!
                </p>
                <div className="flex justify-center gap-4 text-sm text-gray-600">
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-amber-500 rounded-full"></span>
                    <span>Bronze: $10+</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-gray-400 rounded-full"></span>
                    <span>Silver: $50+</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-yellow-500 rounded-full"></span>
                    <span>Gold: $100+</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="w-3 h-3 bg-purple-500 rounded-full"></span>
                    <span>Platinum: $500+</span>
                  </div>
                </div>
              </>
            ) : (
              // No NFTs matching filter
              <>
                <div className="text-4xl mb-4">🔍</div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No Certificates Match Your Filter
                </h3>
                <p className="text-gray-500 mb-4">
                  Try adjusting your filter settings to see more certificates.
                </p>
                <button
                  onClick={() => setFilterTier('all')}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Show All Certificates
                </button>
              </>
            )}
          </div>
        ) : (
          // Display NFTs based on view mode
          <>
            {viewMode === 'grid' ? (
              <NFTCertificateGrid
                nfts={processedNFTs}
                onViewCertificate={handleViewNFT}
                className="mb-6"
              />
            ) : (
              // List view
              <div className="space-y-4">
                {processedNFTs.map((nft, index) => (
                  <div
                    key={nft.assetCode || index}
                    className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <NFTCertificate
                      nft={nft}
                      size="small"
                      showDetails={false}
                      className="flex-shrink-0"
                    />
                    
                    <div className="flex-grow">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-gray-800">{nft.poolName}</h3>
                        <Badge className={`bg-${getTierColor(nft.tier)}-500 text-white`}>
                          {nft.tier}
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        ${nft.milestoneAmount} {nft.milestoneType} milestone • {new Date(nft.mintedAt).toLocaleDateString()}
                      </div>
                      
                      <div className="text-xs text-gray-500 font-mono">
                        {nft.assetCode} • Non-transferable ✓
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleViewNFT(nft)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* NFT Detail Modal */}
      <NFTCertificateModal
        nft={selectedNFT}
        isOpen={showModal}
        onClose={handleCloseModal}
      />
    </div>
  );
};

/**
 * Simple NFT Gallery Component
 * Minimal version for use in dashboards or smaller spaces
 */
export const SimpleNFTGallery = ({
  nfts = [],
  maxDisplay = 6,
  onViewAll = null,
  className = ''
}) => {
  const displayNFTs = nfts.slice(0, maxDisplay);
  const remainingCount = Math.max(0, nfts.length - maxDisplay);

  if (nfts.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-4xl mb-2">🏆</div>
        <p className="text-gray-600">No certificates yet</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {displayNFTs.map((nft, index) => (
          <NFTCertificate
            key={nft.assetCode || index}
            nft={nft}
            size="small"
            showDetails={false}
          />
        ))}
        
        {remainingCount > 0 && (
          <div 
            className="w-64 h-40 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors"
            onClick={onViewAll}
          >
            <div className="text-center">
              <div className="text-2xl text-gray-400 mb-1">+{remainingCount}</div>
              <div className="text-sm text-gray-600">More certificates</div>
            </div>
          </div>
        )}
      </div>

      {onViewAll && (
        <div className="text-center mt-4">
          <button
            onClick={onViewAll}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            View All {nfts.length} Certificates
          </button>
        </div>
      )}
    </div>
  );
};

export default NFTGallery; 