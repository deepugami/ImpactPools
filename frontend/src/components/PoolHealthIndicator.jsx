import React, { useState, useEffect } from 'react'
import SargamIcon from './SargamIcon'
import { getPoolHealthMetrics } from '../services/stellarService'

/**
 * PoolHealthIndicator Component
 * Displays real-time pool health metrics and risk assessment
 * 
 * @param {Object} pool - Pool data object
 * @param {boolean} showDetails - Whether to show detailed metrics
 */
const PoolHealthIndicator = ({ pool, showDetails = false }) => {
  const [healthMetrics, setHealthMetrics] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  /**
   * Fetch real-time health metrics for the pool
   */
  const fetchHealthMetrics = async () => {
    try {
      setIsLoading(true)
      const metrics = await getPoolHealthMetrics(pool)
      setHealthMetrics(metrics)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Error fetching pool health metrics:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch metrics on component mount and set up periodic updates
  useEffect(() => {
    fetchHealthMetrics()
    
    // Update every 30 seconds for real-time data
    const interval = setInterval(fetchHealthMetrics, 30000)
    
    return () => clearInterval(interval)
  }, [pool.id])

  /**
   * Get risk level styling based on pool health
   */
  const getRiskStyling = (riskLevel) => {
    switch (riskLevel) {
      case 'LOW':
        return {
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
          iconName: 'check-circle',
          iconColor: '#16a34a'
        }
      case 'MEDIUM':
        return {
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
          iconName: 'alert-triangle',
          iconColor: '#ca8a04'
        }
      case 'HIGH':
        return {
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          iconName: 'alert-triangle',
          iconColor: '#dc2626'
        }
      default:
        return {
          bgColor: 'bg-gray-100',
          textColor: 'text-gray-800',
          iconName: 'activity',
          iconColor: '#6b7280'
        }
    }
  }

  /**
   * Format percentage values for display
   */
  const formatPercentage = (value) => {
    if (typeof value !== 'number') return '0.00%'
    return `${(value * 100).toFixed(2)}%`
  }

  /**
   * Format large numbers for display
   */
  const formatNumber = (num) => {
    if (typeof num !== 'number') return '0.00'
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num)
  }

  if (isLoading && !healthMetrics) {
    return (
      <div className="animate-pulse">
        <div className="flex items-center space-x-2 mb-2">
          <div className="w-4 h-4 bg-gray-300 rounded"></div>
          <div className="w-16 h-4 bg-gray-300 rounded"></div>
        </div>
        {showDetails && (
          <div className="space-y-2">
            <div className="w-full h-4 bg-gray-300 rounded"></div>
            <div className="w-3/4 h-4 bg-gray-300 rounded"></div>
          </div>
        )}
      </div>
    )
  }

  if (!healthMetrics) {
    return (
      <div className="text-gray-500 text-sm">
        Health metrics unavailable
      </div>
    )
  }

  const riskStyling = getRiskStyling(healthMetrics.riskLevel)

  return (
    <div className="space-y-3">
      {/* Risk Level Indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SargamIcon name={riskStyling.iconName} size={16} color={riskStyling.iconColor} />
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${riskStyling.bgColor} ${riskStyling.textColor}`}>
            {healthMetrics.riskLevel} RISK
          </span>
        </div>
        
        {/* Health Score */}
        <div className="flex items-center space-x-1">
          <SargamIcon name="activity" size={12} color="#6b7280" />
          <span className="text-xs text-gray-600">
            Health: {healthMetrics.healthScore?.toFixed(0) || 'N/A'}%
          </span>
        </div>
      </div>

      {/* APY and Utilization */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <SargamIcon name="trending-up" size={16} color="#10b981" />
          <span className="text-sm font-medium text-gray-900">
            {formatPercentage(healthMetrics.currentAPY)} APY
          </span>
        </div>
        
        <div className="flex items-center space-x-1">
          <SargamIcon name="bar-chart-3" size={12} color="#6b7280" />
          <span className="text-xs text-gray-600">
            {formatPercentage(healthMetrics.utilization?.utilizationRate)} Util
          </span>
        </div>
      </div>

      {/* Detailed Metrics (if requested) */}
      {showDetails && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          
          {/* Pool Balances */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-500 text-xs">Total Supplied</p>
              <p className="font-medium text-gray-900">
                ${formatNumber(healthMetrics.utilization?.totalDeposited || 0)}
              </p>
            </div>
            <div>
              <p className="text-gray-500 text-xs">Available Liquidity</p>
              <p className="font-medium text-gray-900">
                ${formatNumber(healthMetrics.utilization?.availableLiquidity || 0)}
              </p>
            </div>
          </div>

          {/* Utilization Bar */}
          <div>
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Pool Utilization</span>
              <span>{formatPercentage(healthMetrics.utilization?.utilizationRate)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all duration-300 ${
                  healthMetrics.utilization?.utilizationRate > 0.85 
                    ? 'bg-red-500' 
                    : healthMetrics.utilization?.utilizationRate > 0.75 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
                }`}
                style={{ 
                  width: `${Math.min((healthMetrics.utilization?.utilizationRate || 0) * 100, 100)}%` 
                }}
              ></div>
            </div>
          </div>

          {/* Additional Metrics */}
          {healthMetrics.borrowAPY && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Borrow APY:</span>
              <span className="font-medium text-gray-900">
                {formatPercentage(healthMetrics.borrowAPY / 100)}
              </span>
            </div>
          )}

          {healthMetrics.backstopCoverage !== undefined && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Backstop Coverage:</span>
              <span className="font-medium text-gray-900">
                {formatPercentage(healthMetrics.backstopCoverage)}
              </span>
            </div>
          )}

          {/* Last Updated */}
          {lastUpdated && (
            <div className="text-xs text-gray-400 text-center pt-2">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default PoolHealthIndicator 