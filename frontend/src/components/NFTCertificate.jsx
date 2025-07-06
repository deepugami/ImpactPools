import React, { useState } from 'react';
import { Badge } from './ui/badge';

/**
 * NFTCertificate Component
 * Displays an individual Impact Certificate NFT with all its details
 */
const NFTCertificate = ({ 
  nft, 
  showDetails = true, 
  size = 'medium',
  onView = null,
  className = ''
}) => {
  const [imageError, setImageError] = useState(false);
  const [showFullDetails, setShowFullDetails] = useState(false);

  if (!nft) {
    return null;
  }

  // Size configurations
  const sizeConfig = {
    small: {
      container: 'w-64 h-40',
      image: 'h-24',
      title: 'text-sm',
      subtitle: 'text-xs'
    },
    medium: {
      container: 'w-80 h-48',
      image: 'h-32',
      title: 'text-base',
      subtitle: 'text-sm'
    },
    large: {
      container: 'w-96 h-64',
      image: 'h-40',
      title: 'text-lg',
      subtitle: 'text-base'
    }
  };

  const config = sizeConfig[size] || sizeConfig.medium;

  // Tier styling
  const getTierStyling = (tier) => {
    const styles = {
      'Bronze': {
        border: 'border-amber-600',
        bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
        badge: 'bg-amber-600 text-white',
        accent: 'text-amber-700'
      },
      'Silver': {
        border: 'border-gray-400',
        bg: 'bg-gradient-to-br from-gray-50 to-gray-100',
        badge: 'bg-gray-400 text-white',
        accent: 'text-gray-700'
      },
      'Gold': {
        border: 'border-yellow-500',
        bg: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
        badge: 'bg-yellow-500 text-white',
        accent: 'text-yellow-700'
      },
      'Platinum': {
        border: 'border-purple-500',
        bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
        badge: 'bg-purple-500 text-white',
        accent: 'text-purple-700'
      }
    };
    return styles[tier] || styles.Bronze;
  };

  const tierStyle = getTierStyling(nft.tier);

  // Format date
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Unknown Date';
    }
  };

  // Handle certificate image display
  const CertificateImage = () => {
    if (nft.certificateImage && !imageError) {
      return (
        <img
          src={`data:image/png;base64,${nft.certificateImage}`}
          alt={`Impact Certificate for ${nft.poolName}`}
          className={`w-full ${config.image} object-cover rounded-t-lg`}
          onError={() => setImageError(true)}
        />
      );
    }

    // Fallback certificate design
    return (
      <div className={`w-full ${config.image} ${tierStyle.bg} rounded-t-lg flex items-center justify-center border-b ${tierStyle.border}`}>
        <div className="text-center p-4">
          <div className={`${config.title} font-bold ${tierStyle.accent} mb-1`}>
            IMPACT CERTIFICATE
          </div>
          <div className={`${config.subtitle} text-gray-600`}>
            Proof of Philanthropy
          </div>
          <div className={`text-2xl font-bold ${tierStyle.accent} mt-2`}>
            ${nft.milestoneAmount}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`${config.container} ${tierStyle.bg} ${tierStyle.border} border-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden ${className}`}
    >
      {/* Certificate Image or Fallback */}
      <CertificateImage />
      
      {/* Certificate Details */}
      {showDetails && (
        <div className="p-4 space-y-2">
          {/* Pool Name and Tier Badge */}
          <div className="flex items-center justify-between">
            <h3 className={`${config.title} font-semibold text-gray-800 truncate`}>
              {nft.poolName}
            </h3>
            <Badge className={`${tierStyle.badge} text-xs`}>
              {nft.tier}
            </Badge>
          </div>

          {/* Milestone Info */}
          <div className="flex items-center justify-between">
            <span className={`${config.subtitle} text-gray-600`}>
              ${nft.milestoneAmount} {nft.milestoneType} milestone
            </span>
            <span className={`${config.subtitle} text-gray-500`}>
              {formatDate(nft.mintedAt)}
            </span>
          </div>

          {/* Asset Code (shortened) */}
          <div className={`${config.subtitle} text-gray-500 font-mono`}>
            Asset: {nft.assetCode}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 mt-3">
            {onView && (
              <button
                onClick={() => onView(nft)}
                className="flex-1 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
              >
                View Details
              </button>
            )}
            
            <button
              onClick={() => setShowFullDetails(!showFullDetails)}
              className="flex-1 px-3 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
            >
              {showFullDetails ? 'Hide Details' : 'More Info'}
            </button>
          </div>

          {/* Expanded Details */}
          {showFullDetails && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-1">
              <div className={`${config.subtitle} text-gray-600`}>
                <span className="font-medium">Issuer:</span> {nft.issuer?.substring(0, 20)}...
              </div>
              <div className={`${config.subtitle} text-gray-600`}>
                <span className="font-medium">Type:</span> {nft.milestoneType === 'pool' ? 'Pool Achievement' : 'Individual Achievement'}
              </div>
              <div className={`${config.subtitle} text-gray-600`}>
                <span className="font-medium">Status:</span> Non-transferable ✓
              </div>
              {nft.metadata?.description && (
                <div className={`${config.subtitle} text-gray-600`}>
                  <span className="font-medium">Description:</span> {nft.metadata.description}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Non-transferable indicator */}
      <div className="absolute top-2 right-2">
        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <span>🔒</span>
          <span>Verified</span>
        </div>
      </div>
    </div>
  );
};

/**
 * NFTCertificateGrid Component
 * Displays multiple NFT certificates in a grid layout
 */
export const NFTCertificateGrid = ({ 
  nfts = [], 
  onViewCertificate = null,
  emptyMessage = "No Impact Certificates earned yet",
  className = ""
}) => {
  if (!nfts || nfts.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="text-6xl mb-4">🏆</div>
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          {emptyMessage}
        </h3>
        <p className="text-gray-500">
          Earn certificates by reaching charitable milestones!
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 ${className}`}>
      {nfts.map((nft, index) => (
        <NFTCertificate
          key={nft.assetCode || index}
          nft={nft}
          onView={onViewCertificate}
          showDetails={true}
        />
      ))}
    </div>
  );
};

/**
 * NFTCertificateModal Component
 * Full-screen modal for viewing certificate details
 */
export const NFTCertificateModal = ({ 
  nft, 
  isOpen, 
  onClose 
}) => {
  if (!isOpen || !nft) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">
              Impact Certificate Details
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ×
            </button>
          </div>

          {/* Certificate Display */}
          <NFTCertificate
            nft={nft}
            size="large"
            showDetails={true}
            className="mx-auto mb-6"
          />

          {/* Technical Details */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-800 mb-3">Technical Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Asset Code:</span>
                <div className="font-mono text-gray-600 break-all">{nft.assetCode}</div>
              </div>
              <div>
                <span className="font-medium">Issuer:</span>
                <div className="font-mono text-gray-600 break-all">{nft.issuer}</div>
              </div>
              <div>
                <span className="font-medium">Blockchain:</span>
                <div className="text-gray-600">Stellar Testnet</div>
              </div>
              <div>
                <span className="font-medium">Status:</span>
                <div className="text-green-600">Non-transferable ✓</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => window.open(`https://stellar.expert/explorer/testnet/asset/${nft.assetCode}-${nft.issuer}`, '_blank')}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              View on Stellar Expert
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NFTCertificate; 