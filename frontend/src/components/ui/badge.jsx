import React, { useState, useEffect } from 'react'
import priceService from '../../services/priceService'

// Simple utility function to combine CSS classes
const cn = (...classes) => {
  return classes.filter(Boolean).join(' ')
}

const badgeVariants = {
  default: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-gray-100 text-gray-800 hover:bg-gray-200",
  secondary: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-gray-100 text-gray-800 hover:bg-gray-200",
  destructive: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-red-100 text-red-800 hover:bg-red-200",
  outline: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors border-gray-300 text-gray-700",
  price: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-green-100 text-green-800 hover:bg-green-200",
  primary: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-blue-100 text-blue-800 hover:bg-blue-200",
  success: "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors bg-green-100 text-green-800 hover:bg-green-200"
}

function Badge({ className, variant = "default", ...props }) {
  return (
    <div className={cn(badgeVariants[variant], className)} {...props} />
  )
}

/**
 * Price Badge Component - Shows real-time price with XLM conversion
 */
function PriceBadge({ 
  xlmAmount, 
  showBoth = false, 
  variant = "price", 
  className,
  ...props 
}) {
  const [usdValue, setUsdValue] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [xlmPrice, setXlmPrice] = useState(null)

  useEffect(() => {
    const fetchPrice = async () => {
      if (!xlmAmount || xlmAmount <= 0) {
        setIsLoading(false)
        return
      }

      try {
        const price = await priceService.getXLMPrice()
        setXlmPrice(price)
        setUsdValue(xlmAmount * price)
      } catch (error) {
        console.error('Error fetching XLM price:', error)
        setUsdValue(xlmAmount * 0.245) // Fallback to current market price
        setXlmPrice(0.245)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrice()
  }, [xlmAmount])

  if (isLoading) {
    return (
      <Badge variant={variant} className={cn("animate-pulse", className)} {...props}>
        Loading...
      </Badge>
    )
  }

  const formatUSD = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 6
    }).format(value)
  }

  const formatXLM = (value) => {
    return `${parseFloat(value).toFixed(4)} XLM`
  }

  return (
    <Badge 
      variant={variant} 
      className={cn("cursor-default", className)} 
      title={showBoth ? `${formatXLM(xlmAmount)} ≈ ${formatUSD(usdValue)} (XLM: ${formatUSD(xlmPrice)})` : undefined}
      {...props}
    >
      {showBoth ? (
        <span className="space-x-1">
          <span>{formatXLM(xlmAmount)}</span>
          <span className="text-xs opacity-75">≈ {formatUSD(usdValue)}</span>
        </span>
      ) : (
        formatUSD(usdValue)
      )}
    </Badge>
  )
}

/**
 * XLM Price Indicator - Shows current XLM price
 */
function XLMPriceIndicator({ className, ...props }) {
  const [xlmPrice, setXlmPrice] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [priceStatus, setPriceStatus] = useState('loading')

  useEffect(() => {
    const fetchPrice = async () => {
      try {
        const price = await priceService.getXLMPrice()
        setXlmPrice(price)
        setPriceStatus('live')
      } catch (error) {
        console.error('Error fetching XLM price:', error)
        setXlmPrice(0.245) // Fallback to current market price
        setPriceStatus('fallback')
      } finally {
        setIsLoading(false)
      }
    }

    fetchPrice()
    
    // Update price every 5 minutes
    const interval = setInterval(fetchPrice, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (isLoading) {
    return (
      <Badge variant="outline" className={cn("animate-pulse", className)} {...props}>
        XLM: Loading...
      </Badge>
    )
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4,
      maximumFractionDigits: 6
    }).format(price)
  }

  const getVariant = () => {
    if (priceStatus === 'live') return 'default'
    if (priceStatus === 'fallback') return 'secondary'
    return 'outline'
  }

  return (
    <Badge 
      variant={getVariant()} 
      className={cn("cursor-default", className)} 
      title={priceStatus === 'live' ? 'Live price from CoinGecko' : 'Fallback price - API unavailable'}
      {...props}
    >
      <span className="flex items-center space-x-1">
        <span>XLM: {formatPrice(xlmPrice)}</span>
        {priceStatus === 'live' && (
          <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        )}
      </span>
    </Badge>
  )
}

export default Badge
export { Badge, PriceBadge, XLMPriceIndicator, badgeVariants } 