// Optional dependencies for certificate generation
let createCanvas, loadImage, registerFont, QRCode;
let imageGenerationAvailable = false;

// Function to check and load optional dependencies
async function initializeDependencies() {
  try {
    const canvasModule = await import('canvas');
    createCanvas = canvasModule.createCanvas;
    loadImage = canvasModule.loadImage;
    registerFont = canvasModule.registerFont;
    
    const qrModule = await import('qrcode');
    QRCode = qrModule.default;
    
    imageGenerationAvailable = true;
    console.log('✅ Certificate image generation available');
    return true;
  } catch (error) {
    console.warn('⚠️  Certificate image generation disabled - dependencies not available');
    console.log('🔧 NFT certificates will be created with metadata only (no images)');
    return false;
  }
}

class CertificateGenerator {
  constructor() {
    this.canvas = null;
    this.ctx = null;
    this.certificateWidth = 800;
    this.certificateHeight = 600;
    this.imageGenerationAvailable = imageGenerationAvailable;
  }

  /**
   * Generate Impact Certificate image with dynamic metadata
   * @param {Object} metadata - Certificate metadata
   * @returns {Buffer|Object} Certificate image as buffer or metadata object if image generation not available
   */
  async generateCertificate(metadata) {
    try {
      console.log(`🎨 [CERT] Generating certificate for ${metadata.poolName}`);
      
      // Initialize dependencies if not already done
      if (!imageGenerationAvailable) {
        imageGenerationAvailable = await initializeDependencies();
      }
      
      // If image generation is not available, return metadata only
      if (!imageGenerationAvailable) {
        console.log(`📄 [CERT] Image generation unavailable, returning metadata only`);
        return {
          type: 'metadata-only',
          metadata: {
            ...metadata,
            generatedAt: new Date().toISOString(),
            note: 'Certificate image generation requires additional dependencies'
          }
        };
      }
      
      // Create canvas
      this.canvas = createCanvas(this.certificateWidth, this.certificateHeight);
      this.ctx = this.canvas.getContext('2d');

      // Draw certificate background and design
      await this.drawBackground();
      await this.drawHeader();
      await this.drawCertificateContent(metadata);
      await this.drawFooter(metadata);
      await this.addQRCode(metadata);

      console.log(`✅ [CERT] Certificate generated successfully`);
      return this.canvas.toBuffer('image/png');

    } catch (error) {
      console.error(`❌ [CERT] Certificate generation failed:`, error);
      // Return metadata fallback instead of throwing
      console.log(`📄 [CERT] Falling back to metadata-only certificate`);
      return {
        type: 'metadata-only',
        metadata: {
          ...metadata,
          generatedAt: new Date().toISOString(),
          error: error.message,
          note: 'Certificate image generation failed, metadata preserved'
        }
      };
    }
  }

  /**
   * Draw certificate background with gradient and border
   */
  async drawBackground() {
    const ctx = this.ctx;
    
    // Background gradient (dark theme to match app)
    const gradient = ctx.createLinearGradient(0, 0, 0, this.certificateHeight);
    gradient.addColorStop(0, '#0f172a'); // Dark blue-gray
    gradient.addColorStop(0.5, '#1e293b'); // Medium dark
    gradient.addColorStop(1, '#334155'); // Lighter dark
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.certificateWidth, this.certificateHeight);

    // Border with golden accent
    ctx.strokeStyle = '#fbbf24'; // Golden yellow
    ctx.lineWidth = 6;
    ctx.strokeRect(15, 15, this.certificateWidth - 30, this.certificateHeight - 30);

    // Inner border
    ctx.strokeStyle = '#64748b'; // Light gray
    ctx.lineWidth = 2;
    ctx.strokeRect(25, 25, this.certificateWidth - 50, this.certificateHeight - 50);

    // Decorative corners
    this.drawCornerDecorations();
  }

  /**
   * Draw decorative corner elements
   */
  drawCornerDecorations() {
    const ctx = this.ctx;
    const cornerSize = 40;
    
    ctx.fillStyle = '#fbbf24'; // Golden
    ctx.fillRect(35, 35, cornerSize, 4);
    ctx.fillRect(35, 35, 4, cornerSize);
    
    ctx.fillRect(this.certificateWidth - 75, 35, cornerSize, 4);
    ctx.fillRect(this.certificateWidth - 39, 35, 4, cornerSize);
    
    ctx.fillRect(35, this.certificateHeight - 75, cornerSize, 4);
    ctx.fillRect(35, this.certificateHeight - 39, 4, cornerSize);
    
    ctx.fillRect(this.certificateWidth - 75, this.certificateHeight - 75, cornerSize, 4);
    ctx.fillRect(this.certificateWidth - 39, this.certificateHeight - 75, 4, cornerSize);
  }

  /**
   * Draw certificate header
   */
  async drawHeader() {
    const ctx = this.ctx;
    
    // Title
    ctx.fillStyle = '#fbbf24'; // Golden
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('IMPACT CERTIFICATE', this.certificateWidth / 2, 100);

    // Subtitle
    ctx.fillStyle = '#e2e8f0'; // Light gray
    ctx.font = '18px Arial';
    ctx.fillText('Proof of Philanthropy', this.certificateWidth / 2, 130);

    // Decorative line
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(this.certificateWidth / 2 - 150, 150);
    ctx.lineTo(this.certificateWidth / 2 + 150, 150);
    ctx.stroke();
  }

  /**
   * Draw main certificate content with metadata
   */
  async drawCertificateContent(metadata) {
    const ctx = this.ctx;
    const centerX = this.certificateWidth / 2;
    
    // Main text
    ctx.fillStyle = '#f1f5f9'; // Very light gray
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('This certificate recognizes', centerX, 200);

    // Pool name (recipient could be added if available)
    ctx.fillStyle = '#fbbf24'; // Golden
    ctx.font = 'bold 28px Arial';
    ctx.fillText(`${metadata.poolName}`, centerX, 240);

    // Achievement text
    ctx.fillStyle = '#f1f5f9';
    ctx.font = '18px Arial';
    ctx.fillText('for reaching a charitable milestone of', centerX, 280);

    // Milestone amount
    ctx.fillStyle = '#10b981'; // Green (success color)
    ctx.font = 'bold 32px Arial';
    ctx.fillText(`$${metadata.milestoneAmount}`, centerX, 320);

    // Milestone type and tier
    ctx.fillStyle = '#e2e8f0';
    ctx.font = '16px Arial';
    ctx.fillText(`${metadata.milestoneType} milestone • ${metadata.tier} tier`, centerX, 350);

    // Achievement badge based on tier
    this.drawTierBadge(metadata.tier, centerX, 380);

    // Impact message
    ctx.fillStyle = '#94a3b8'; // Medium gray
    ctx.font = 'italic 14px Arial';
    ctx.fillText('Making a difference through decentralized finance', centerX, 430);
  }

  /**
   * Draw achievement tier badge
   */
  drawTierBadge(tier, x, y) {
    const ctx = this.ctx;
    const badgeRadius = 30;
    
    // Badge colors based on tier
    const tierColors = {
      'Bronze': '#cd7f32',
      'Silver': '#c0c0c0', 
      'Gold': '#ffd700',
      'Platinum': '#e5e4e2'
    };

    const badgeColor = tierColors[tier] || '#64748b';
    
    // Draw badge circle
    ctx.fillStyle = badgeColor;
    ctx.beginPath();
    ctx.arc(x, y, badgeRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Badge border
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Badge text
    ctx.fillStyle = '#1e293b';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(tier.toUpperCase(), x, y + 4);
  }

  /**
   * Draw certificate footer with date and blockchain info
   */
  async drawFooter(metadata) {
    const ctx = this.ctx;
    
    // Date
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px Arial';
    ctx.textAlign = 'center';
    const date = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    ctx.fillText(`Issued on ${date}`, this.certificateWidth / 2, 500);

    // Blockchain verification text
    ctx.fillStyle = '#64748b';
    ctx.font = '12px Arial';
    ctx.fillText('Verified on Stellar Blockchain • Non-transferable Certificate', this.certificateWidth / 2, 520);

    // ImpactPools branding
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('ImpactPools', this.certificateWidth / 2, 550);
  }

  /**
   * Add QR code for certificate verification
   */
  async addQRCode(metadata) {
    try {
      // Create verification URL (would point to your app's verification page)
      const verificationData = {
        type: 'ImpactCertificate',
        pool: metadata.poolName,
        amount: metadata.milestoneAmount,
        tier: metadata.tier,
        timestamp: Date.now()
      };

      const qrDataString = JSON.stringify(verificationData);
      
      // Generate QR code
      const qrCodeDataURL = await QRCode.toDataURL(qrDataString, {
        width: 80,
        margin: 1,
        color: {
          dark: '#1e293b',
          light: '#f1f5f9'
        }
      });

      // Load QR code as image
      const qrImage = await loadImage(qrCodeDataURL);
      
      // Draw QR code in bottom right corner
      this.ctx.drawImage(qrImage, this.certificateWidth - 120, this.certificateHeight - 120, 80, 80);

      // QR code label
      this.ctx.fillStyle = '#64748b';
      this.ctx.font = '10px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('Verify', this.certificateWidth - 80, this.certificateHeight - 25);

    } catch (error) {
      console.warn(`⚠️ [CERT] QR code generation failed:`, error);
      // Continue without QR code
    }
  }

  /**
   * Generate certificate with specific template based on milestone type
   */
  async generateMilestoneCertificate(poolName, milestoneAmount, milestoneType, recipientPublicKey) {
    // Determine tier based on milestone amount
    const tier = this.determineTier(milestoneAmount, milestoneType);
    
    const metadata = {
      poolName,
      milestoneAmount,
      milestoneType,
      tier,
      recipientPublicKey
    };

    return await this.generateCertificate(metadata);
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
   * Create a batch of certificates (useful for multiple milestone achievements)
   */
  async generateBatchCertificates(certificateRequests) {
    const certificates = [];
    
    for (const request of certificateRequests) {
      try {
        const certificate = await this.generateCertificate(request.metadata);
        certificates.push({
          ...request,
          certificate,
          success: true
        });
      } catch (error) {
        console.error(`❌ [CERT] Batch generation failed for ${request.metadata.poolName}:`, error);
        certificates.push({
          ...request,
          certificate: null,
          success: false,
          error: error.message
        });
      }
    }

    console.log(`📋 [CERT] Batch generated: ${certificates.filter(c => c.success).length}/${certificates.length} successful`);
    return certificates;
  }
}

// Export both class and convenience function
const certificateGenerator = new CertificateGenerator();

export const generateCertificate = (metadata) => certificateGenerator.generateCertificate(metadata);
export const generateMilestoneCertificate = (poolName, milestoneAmount, milestoneType, recipientPublicKey) => 
  certificateGenerator.generateMilestoneCertificate(poolName, milestoneAmount, milestoneType, recipientPublicKey);
export const generateBatchCertificates = (certificateRequests) => 
  certificateGenerator.generateBatchCertificates(certificateRequests);

export default certificateGenerator; 