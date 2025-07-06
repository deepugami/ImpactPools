import StellarSDK from '@stellar/stellar-sdk';
import { generateCertificate } from '../utils/certificateGenerator.js';

// Stellar testnet configuration
const server = new StellarSDK.Horizon.Server('https://horizon-testnet.stellar.org');
const network = StellarSDK.Networks.TESTNET;

// NFT issuer for managing certificate accounts
const NFT_ISSUER_SECRET = process.env.NFT_ISSUER_SECRET || 'SAMPLEKEY'; // Will be configured

class NFTService {
  constructor() {
    this.server = server;
    this.network = network;
  }

  /**
   * Mint a non-transferable Impact Certificate NFT
   * @param {Object} metadata - Certificate metadata
   * @param {string} metadata.poolName - Name of the impact pool
   * @param {number} metadata.milestoneAmount - Milestone amount reached
   * @param {string} metadata.recipientPublicKey - Recipient's Stellar address
   * @param {string} metadata.milestoneType - Type of milestone (pool/individual)
   * @param {string} metadata.tier - Achievement tier (Bronze/Silver/Gold/Platinum)
   * @returns {Object} NFT details including asset code and transaction hash
   */
  async mintImpactCertificate(metadata) {
    try {
      console.log(`🎨 [NFT] Minting Impact Certificate for ${metadata.poolName}`);
      
      // 1. Create unique issuer account for this NFT
      const issuerKeypair = StellarSDK.Keypair.random();
      console.log(`🔑 [NFT] Created issuer account: ${issuerKeypair.publicKey()}`);

      // 2. Generate certificate image (or metadata if image generation unavailable)
      const certificateResult = await generateCertificate(metadata);
      let certificateImage = null;
      let hasImage = false;
      
      if (Buffer.isBuffer(certificateResult)) {
        certificateImage = certificateResult;
        hasImage = true;
        console.log(`🖼️ [NFT] Certificate image generated`);
      } else {
        console.log(`📄 [NFT] Certificate metadata generated (no image)`);
      }

      // 3. Create unique asset code for this certificate
      const assetCode = this.generateAssetCode(metadata);
      const asset = new StellarSDK.Asset(assetCode, issuerKeypair.publicKey());

      // 4. Fund issuer account (required for operations)
      await this.fundIssuerAccount(issuerKeypair.publicKey());

      // 5. Check if trustline exists on recipient account
      const trustlineExists = await this.createTrustline(metadata.recipientPublicKey, asset);

      // 6. Set metadata on issuer account
      await this.setNFTMetadata(issuerKeypair, metadata, certificateImage);

      let paymentTxHash = null;
      let transferSuccessful = false;

      if (trustlineExists) {
        try {
          // 7. Send NFT to recipient (1 stroop = 0.0000001 XLM)
          paymentTxHash = await this.sendNFTToRecipient(
            issuerKeypair, 
            metadata.recipientPublicKey, 
            asset
          );
          transferSuccessful = true;
          console.log(`✅ [NFT] NFT transfer successful`);
        } catch (error) {
          console.warn(`⚠️ [NFT] NFT transfer failed, but certificate metadata is preserved: ${error.message}`);
        }
      } else {
        console.log(`📋 [NFT] NFT created but not transferred - recipient must create trustline first`);
      }

      // 8. Freeze issuer account (makes NFT non-transferable)
      const freezeTxHash = await this.freezeIssuerAccount(issuerKeypair);

      const nftDetails = {
        assetCode,
        issuerPublicKey: issuerKeypair.publicKey(),
        recipientPublicKey: metadata.recipientPublicKey,
        paymentTxHash,
        freezeTxHash,
        metadata,
        certificateImage: hasImage ? certificateImage.toString('base64') : null,
        certificateData: hasImage ? null : certificateResult,
        hasImage,
        mintedAt: new Date().toISOString(),
        isNonTransferable: true,
        transferSuccessful,
        trustlineRequired: !trustlineExists,
        claimInstructions: !transferSuccessful ? 
          `To receive this NFT, create a trustline to asset ${assetCode} from issuer ${issuerKeypair.publicKey()}` : 
          null
      };

      if (transferSuccessful) {
        console.log(`✅ [NFT] Impact Certificate minted and transferred successfully: ${assetCode}`);
      } else {
        console.log(`📋 [NFT] Impact Certificate minted but requires manual claim: ${assetCode}`);
      }
      return nftDetails;

    } catch (error) {
      console.error(`❌ [NFT] Minting failed:`, error);
      throw new Error(`NFT minting failed: ${error.message}`);
    }
  }

  /**
   * Generate unique asset code for certificate
   */
  generateAssetCode(metadata) {
    const timestamp = Date.now().toString().slice(-6); // Last 6 digits
    const poolPrefix = metadata.poolName.substring(0, 3).toUpperCase();
    return `${poolPrefix}${timestamp}`;
  }

  /**
   * Fund issuer account for operations
   */
  async fundIssuerAccount(issuerPublicKey) {
    try {
      // Use Friendbot for testnet funding
      const response = await fetch(
        `https://friendbot.stellar.org?addr=${encodeURIComponent(issuerPublicKey)}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fund issuer account');
      }
      
      console.log(`💰 [NFT] Issuer account funded: ${issuerPublicKey}`);
      
      // Wait for account to be available
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      throw new Error(`Account funding failed: ${error.message}`);
    }
  }

  /**
   * Create trustline on recipient account
   * Note: In a real implementation, this would require recipient's signature
   * For demo purposes, we'll use a more lenient approach
   */
  async createTrustline(recipientPublicKey, asset) {
    try {
      console.log(`🤝 [NFT] Trustline creation requested for ${recipientPublicKey}`);
      
      // Check if recipient account exists and load it
      const recipientAccount = await this.server.loadAccount(recipientPublicKey);
      
      // Check if trustline already exists
      const existingTrustline = recipientAccount.balances.find(
        balance => balance.asset_code === asset.getCode() && 
                  balance.asset_issuer === asset.getIssuer()
      );
      
      if (existingTrustline) {
        console.log(`✅ [NFT] Trustline already exists for ${asset.getCode()}`);
        return true;
      }
      
      // In a real implementation, the recipient would need to sign this transaction
      // For demo purposes, we'll skip automatic trustline creation and handle 
      // the transfer failure gracefully
      console.log(`⚠️ [NFT] Trustline does not exist - recipient must create it manually`);
      return false;
      
    } catch (error) {
      console.warn(`⚠️ [NFT] Trustline check failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Set NFT metadata on issuer account
   */
  async setNFTMetadata(issuerKeypair, metadata, certificateImage) {
    try {
      const account = await this.server.loadAccount(issuerKeypair.publicKey());
      
      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE * 10, // Higher fee for multiple operations
        networkPassphrase: this.network,
      })
        .addOperation(StellarSDK.Operation.manageData({
          name: 'nft_type',
          value: 'ImpactCertificate'
        }))
        .addOperation(StellarSDK.Operation.manageData({
          name: 'pool_name',
          value: metadata.poolName
        }))
        .addOperation(StellarSDK.Operation.manageData({
          name: 'milestone_amount',
          value: metadata.milestoneAmount.toString()
        }))
        .addOperation(StellarSDK.Operation.manageData({
          name: 'milestone_type',
          value: metadata.milestoneType
        }))
        .addOperation(StellarSDK.Operation.manageData({
          name: 'tier',
          value: metadata.tier
        }))
        .addOperation(StellarSDK.Operation.manageData({
          name: 'minted_at',
          value: new Date().toISOString()
        }))
        .setTimeout(300)
        .build();

      transaction.sign(issuerKeypair);
      const result = await this.server.submitTransaction(transaction);
      
      console.log(`📝 [NFT] Metadata set on issuer account: ${result.hash}`);
      return result.hash;
      
    } catch (error) {
      throw new Error(`Metadata setting failed: ${error.message}`);
    }
  }

  /**
   * Send NFT to recipient
   */
  async sendNFTToRecipient(issuerKeypair, recipientPublicKey, asset) {
    try {
      const account = await this.server.loadAccount(issuerKeypair.publicKey());
      
      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE * 2,
        networkPassphrase: this.network,
      })
        .addOperation(StellarSDK.Operation.payment({
          destination: recipientPublicKey,
          asset: asset,
          amount: '0.0000001' // 1 stroop - minimal amount for NFT
        }))
        .setTimeout(300)
        .build();

      transaction.sign(issuerKeypair);
      const result = await this.server.submitTransaction(transaction);
      
      console.log(`💸 [NFT] Certificate sent to recipient: ${result.hash}`);
      return result.hash;
      
    } catch (error) {
      throw new Error(`NFT transfer failed: ${error.message}`);
    }
  }

  /**
   * Freeze issuer account to make NFT non-transferable
   */
  async freezeIssuerAccount(issuerKeypair) {
    try {
      const account = await this.server.loadAccount(issuerKeypair.publicKey());
      
      const transaction = new StellarSDK.TransactionBuilder(account, {
        fee: StellarSDK.BASE_FEE * 2,
        networkPassphrase: this.network,
      })
        .addOperation(StellarSDK.Operation.setOptions({
          masterWeight: 0, // Remove master key weight
          signer: {
            ed25519PublicKey: issuerKeypair.publicKey(),
            weight: 0
          }
        }))
        .setTimeout(300)
        .build();

      transaction.sign(issuerKeypair);
      const result = await this.server.submitTransaction(transaction);
      
      console.log(`🔒 [NFT] Issuer account frozen (NFT now non-transferable): ${result.hash}`);
      return result.hash;
      
    } catch (error) {
      throw new Error(`Account freezing failed: ${error.message}`);
    }
  }

  /**
   * Get user's NFT collection
   */
  async getUserNFTs(publicKey) {
    try {
      const account = await this.server.loadAccount(publicKey);
      const nfts = [];

      // Check all assets on the account
      for (const balance of account.balances) {
        if (balance.asset_type !== 'native' && balance.balance === '0.0000001') {
          // This looks like an NFT (1 stroop balance)
          try {
            const issuerAccount = await this.server.loadAccount(balance.asset_issuer);
            const metadata = this.extractNFTMetadata(issuerAccount);
            
            if (metadata.nft_type === 'ImpactCertificate') {
              nfts.push({
                assetCode: balance.asset_code,
                issuer: balance.asset_issuer,
                metadata,
                balance: balance.balance
              });
            }
          } catch (error) {
            // Skip if can't load issuer account
            console.warn(`⚠️ [NFT] Could not load issuer for ${balance.asset_code}`);
          }
        }
      }

      return nfts;
      
    } catch (error) {
      console.error(`❌ [NFT] Error fetching user NFTs:`, error);
      return [];
    }
  }

  /**
   * Extract NFT metadata from issuer account
   */
  extractNFTMetadata(issuerAccount) {
    const metadata = {};
    
    for (const [key, value] of Object.entries(issuerAccount.data_attr || {})) {
      // Decode base64 values
      metadata[key] = Buffer.from(value, 'base64').toString('utf-8');
    }
    
    return metadata;
  }

  /**
   * Validate NFT authenticity
   */
  async validateNFT(assetCode, issuerPublicKey, recipientPublicKey) {
    try {
      // Check if issuer account is frozen (non-transferable)
      const issuerAccount = await this.server.loadAccount(issuerPublicKey);
      const isFrozen = issuerAccount.signers.every(signer => signer.weight === 0);
      
      // Check if recipient has the NFT
      const recipientAccount = await this.server.loadAccount(recipientPublicKey);
      const hasNFT = recipientAccount.balances.some(
        balance => balance.asset_code === assetCode && 
                  balance.asset_issuer === issuerPublicKey &&
                  balance.balance === '0.0000001'
      );

      return {
        isValid: isFrozen && hasNFT,
        isNonTransferable: isFrozen,
        isOwned: hasNFT
      };
      
    } catch (error) {
      console.error(`❌ [NFT] Validation failed:`, error);
      return { isValid: false, isNonTransferable: false, isOwned: false };
    }
  }
}

export default new NFTService(); 