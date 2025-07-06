import axios from 'axios'

// Multiple API endpoints for robust price fetching
const PRICE_APIS = {
  coingecko: {
    url: 'https://api.coingecko.com/api/v3/simple/price',
    params: (coinId) => ({ ids: coinId, vs_currencies: 'usd' }),
    transform: (data, coinId) => data[coinId]?.usd
  },
  stellarExpert: {
    url: 'https://api.stellar.expert/explorer/public/asset/XLM-native',
    params: () => ({}),
    transform: (data) => data.price?.USD
  },
  coinCap: {
    url: 'https://api.coincap.io/v2/assets',
    params: (coinId) => ({ search: coinId === 'stellar' ? 'stellar' : coinId }),
    transform: (data, coinId) => {
      const asset = data.data?.find(a => 
        a.symbol?.toLowerCase() === (coinId === 'stellar' ? 'xlm' : coinId)
      )
      return asset ? parseFloat(asset.priceUsd) : null
    }
  },
  cryptoCompare: {
    url: 'https://min-api.cryptocompare.com/data/price',
    params: (coinId) => ({ 
      fsym: coinId === 'stellar' ? 'XLM' : coinId.toUpperCase(), 
      tsyms: 'USD' 
    }),
    transform: (data) => data.USD
  }
}

const PRICE_CACHE_DURATION = 3 * 60 * 1000 // 3 minutes cache
const FALLBACK_PRICES = {
  'stellar': 0.115, // XLM fallback price (updated)
  'usd-coin': 1.00, // USDC fallback price
  'ethereum': 2300.00, // ETH fallback price
  'bitcoin': 44000.00 // BTC fallback price
}

class PriceService {
  constructor() {
    this.priceCache = new Map()
    this.lastFetch = new Map()
    this.apiErrors = new Map()
    this.isLive = false
    
    // Initialize with fallback prices
    this.initializeFallbackPrices()
    
    console.log('💰 [PRICE-SERVICE] Initialized with multi-API fallback system')
  }

  initializeFallbackPrices() {
    const now = Date.now()
    Object.entries(FALLBACK_PRICES).forEach(([coinId, price]) => {
      this.priceCache.set(coinId, price)
      this.lastFetch.set(coinId, now - PRICE_CACHE_DURATION + 60000) // Set to expire in 1 minute
    })
  }

  /**
   * Get current price for a cryptocurrency with multi-API fallback
   * @param {string} coinId - Coin ID (e.g., 'stellar' for XLM)
   * @returns {Promise<number>} Price in USD
   */
  async getPrice(coinId) {
    try {
      // Check cache first
      const cachedPrice = this.getCachedPrice(coinId)
      if (cachedPrice !== null) {
        return cachedPrice
      }

      // Try multiple APIs in sequence
      const price = await this.fetchPriceWithFallback(coinId)
      
      // Cache the result
      this.priceCache.set(coinId, price)
      this.lastFetch.set(coinId, Date.now())
      this.isLive = true

      console.log(`💰 [PRICE-SERVICE] Fetched ${coinId}: $${price} (cached for ${PRICE_CACHE_DURATION/1000/60}min)`)
      return price
    } catch (error) {
      console.error(`💰 [PRICE-SERVICE] All APIs failed for ${coinId}:`, error.message)
      
      // Return fallback price
      const fallbackPrice = FALLBACK_PRICES[coinId] || 0
      console.warn(`💰 [PRICE-SERVICE] Using fallback price for ${coinId}: $${fallbackPrice}`)
      
      this.isLive = false
      return fallbackPrice
    }
  }

  /**
   * Fetch price with multiple API fallbacks
   */
  async fetchPriceWithFallback(coinId) {
    const apiNames = Object.keys(PRICE_APIS)
    
    for (const apiName of apiNames) {
      try {
        // Skip API if it has recent errors (circuit breaker pattern)
        const lastError = this.apiErrors.get(apiName)
        if (lastError && Date.now() - lastError < 60000) { // 1 minute cooldown
          continue
        }

        const price = await this.fetchFromAPI(apiName, coinId)
        if (price && price > 0) {
          // Clear error state on success
          this.apiErrors.delete(apiName)
          console.log(`💰 [PRICE-SERVICE] Success with ${apiName} for ${coinId}: $${price}`)
          return price
        }
      } catch (error) {
        console.warn(`💰 [PRICE-SERVICE] ${apiName} failed for ${coinId}:`, error.message)
        this.apiErrors.set(apiName, Date.now())
        continue
      }
    }
    
    throw new Error(`All ${apiNames.length} price APIs failed for ${coinId}`)
  }

  /**
   * Fetch price from a specific API
   */
  async fetchFromAPI(apiName, coinId) {
    const api = PRICE_APIS[apiName]
    if (!api) throw new Error(`Unknown API: ${apiName}`)

    const params = api.params(coinId)
    const response = await axios.get(api.url, { 
      params,
      timeout: 5000, // 5 second timeout per API
      headers: {
        'User-Agent': 'ImpactPools/1.0 (Stellar DeFi App)'
      }
    })
    
    const price = api.transform(response.data, coinId)
    if (!price || price <= 0) {
      throw new Error(`Invalid price returned: ${price}`)
    }
    
    return price
  }

  /**
   * Get multiple prices at once with batch optimization
   */
  async getPrices(coinIds) {
    const results = {}
    
    // Process in parallel for better performance
    await Promise.allSettled(
      coinIds.map(async (coinId) => {
        try {
          results[coinId] = await this.getPrice(coinId)
        } catch (error) {
          console.error(`Failed to get price for ${coinId}:`, error.message)
          results[coinId] = FALLBACK_PRICES[coinId] || 0
        }
      })
    )
    
    return results
  }

  /**
   * Get XLM price specifically
   */
  async getXLMPrice() {
    return await this.getPrice('stellar')
  }

  /**
   * Get USDC price specifically
   */
  async getUSDCPrice() {
    return await this.getPrice('usd-coin')
  }

  /**
   * Check if price is cached and still valid
   */
  getCachedPrice(coinId) {
    const lastFetchTime = this.lastFetch.get(coinId)
    const cachedPrice = this.priceCache.get(coinId)
    
    if (lastFetchTime && cachedPrice && (Date.now() - lastFetchTime < PRICE_CACHE_DURATION)) {
      console.log(`💰 [PRICE-SERVICE] Using cached ${coinId}: $${cachedPrice}`)
      return cachedPrice
    }
    
    return null
  }

  /**
   * Legacy method - now uses multi-API fallback
   */
  async fetchPriceFromAPI(coinId) {
    return await this.fetchPriceWithFallback(coinId)
  }

  /**
   * Convert XLM amount to USD
   */
  async convertXLMToUSD(xlmAmount) {
    const xlmPrice = await this.getXLMPrice()
    return xlmAmount * xlmPrice
  }

  /**
   * Convert USD amount to XLM
   */
  async convertUSDToXLM(usdAmount) {
    const xlmPrice = await this.getXLMPrice()
    return usdAmount / xlmPrice
  }

  /**
   * Format price for display
   */
  formatPrice(price, currency = 'USD') {
    if (currency === 'USD') {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
        maximumFractionDigits: 6
      }).format(price)
    }
    
    return price.toFixed(6)
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isLive: this.isLive,
      cacheSize: this.priceCache.size,
      errors: Array.from(this.apiErrors.entries()),
      lastUpdate: Math.max(...Array.from(this.lastFetch.values()))
    }
  }

  /**
   * Clear all cached prices
   */
  clearCache() {
    this.priceCache.clear()
    this.lastFetch.clear()
    this.apiErrors.clear()
    this.initializeFallbackPrices()
    console.log('💰 [PRICE-SERVICE] Cache cleared')
  }
}

// Export singleton instance
const priceService = new PriceService()
export default priceService
