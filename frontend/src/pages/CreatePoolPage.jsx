import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import SargamIcon from '../components/SargamIcon'
import { usePools } from '../contexts/PoolContext'
import { useWallet } from '../contexts/WalletContext'
import toast from 'react-hot-toast'

/**
 * CreatePoolPage component - Step-by-step form for creating new ImpactPools
 * This guides users through the process of setting up a charitable lending pool
 */
const CreatePoolPage = () => {
  const navigate = useNavigate()
  const { createPool, isCreatingPool } = usePools()
  const { isConnected, publicKey, signTransaction } = useWallet()

  // Form state management
  const [formData, setFormData] = useState({
    name: '',
    charity: '',
    assets: [],
    donationPercentage: 10
  })

  // Available charity options
  const charityOptions = [
    'Stellar Community Fund',
    'Charity: Water', 
    'Red Cross',
    'Doctors Without Borders'
  ]

  // Available asset options
  const assetOptions = [
    { code: 'XLM', name: 'Stellar Lumens', description: 'Native Stellar asset' },
    { code: 'USDC', name: 'USD Coin', description: 'Stablecoin pegged to USD' },
    // Could add more assets here
  ]

  /**
   * Handle form input changes
   * @param {Object} e - Event object
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  /**
   * Handle asset selection (checkbox)
   * @param {string} assetCode - The asset code to toggle
   */
  const handleAssetToggle = (assetCode) => {
    setFormData(prev => ({
      ...prev,
      assets: prev.assets.includes(assetCode)
        ? prev.assets.filter(asset => asset !== assetCode)
        : [...prev.assets, assetCode]
    }))
  }

  /**
   * Handle donation percentage slider change
   * @param {Object} e - Event object
   */
  const handlePercentageChange = (e) => {
    setFormData(prev => ({
      ...prev,
      donationPercentage: parseInt(e.target.value)
    }))
  }

  /**
   * Validate the form data
   * @returns {Object} Validation result with isValid flag and error message
   */
  const validateForm = () => {
    if (!formData.name.trim()) {
      return { isValid: false, error: 'Pool name is required' }
    }
    
    if (formData.name.length < 3) {
      return { isValid: false, error: 'Pool name must be at least 3 characters' }
    }
    
    if (!formData.charity) {
      return { isValid: false, error: 'Please select a charity' }
    }
    
    if (formData.assets.length === 0) {
      return { isValid: false, error: 'Please select at least one asset' }
    }
    
    if (formData.donationPercentage < 1 || formData.donationPercentage > 50) {
      return { isValid: false, error: 'Donation percentage must be between 1% and 50%' }
    }
    
    return { isValid: true }
  }

  /**
   * Handle form submission
   * @param {Object} e - Event object
   */
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // Check wallet connection
    if (!isConnected || !publicKey) {
      toast.error('Please connect your wallet first')
      return
    }

    // Validate form
    const validation = validateForm()
    if (!validation.isValid) {
      toast.error(validation.error)
      return
    }

    try {
      // Create the pool
      const result = await createPool(formData, publicKey, signTransaction)
      
      if (result.success) {
        // Success! Navigate to the new pool's detail page
        toast.success(
          <div>
            <div>ImpactPool created successfully!</div>
            <a 
              href={result.transactionLink} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-400 underline text-sm"
            >
              View transaction
            </a>
          </div>
        )
        navigate(`/pool/${result.poolId}`)
      } else {
        toast.error(result.error || 'Failed to create pool')
      }
    } catch (error) {
      console.error('Error creating pool:', error)
      toast.error('Failed to create pool. Please try again.')
    }
  }

  // Redirect if wallet not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center">
          <div className="bg-white/10 backdrop-blur-md rounded-lg border border-white/20 shadow-lg p-8">
            <div className="bg-yellow-500/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <SargamIcon name="heart" size={32} color="#facc15" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-4">
              Wallet Required
            </h2>
            <p className="text-gray-300 mb-6">
              You need to connect your Freighter wallet to create an ImpactPool.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-all duration-200 w-full"
            >
              Go Back Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)] py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/')}
            className="flex items-center space-x-2 text-gray-300 hover:text-white mb-4 transition-colors"
          >
            <SargamIcon name="arrow-left" size={16} color="currentColor" />
            <span>Back to Discover</span>
          </button>
          
          <h1 className="text-3xl font-bold text-white">
            Create Your ImpactPool
          </h1>
          <p className="text-gray-300 mt-2">
            Set up a DeFi lending pool that automatically donates yield to charity
          </p>
        </div>

        {/* Main Form */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 shadow-lg overflow-hidden">
          <form onSubmit={handleSubmit}>
            
            {/* Pool Name Section */}
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <SargamIcon name="heart" size={20} color="#a855f7" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Pool Details
                </h2>
              </div>
              
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                  Pool Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., Water for All Fund"
                  required
                />
                <p className="text-sm text-gray-400 mt-1">
                  Choose a descriptive name that reflects your pool's mission
                </p>
              </div>
            </div>

            {/* Charity Selection */}
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-pink-500/20 p-2 rounded-lg">
                  <SargamIcon name="heart" size={20} color="#f472b6" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Select Charity
                </h2>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {charityOptions.map((charity) => (
                  <label
                    key={charity}
                    className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                      formData.charity === charity
                        ? 'border-pink-500 bg-pink-500/20'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <input
                      type="radio"
                      name="charity"
                      value={charity}
                      checked={formData.charity === charity}
                      onChange={handleInputChange}
                      className="sr-only"
                    />
                    <div className="flex items-center space-x-3">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        formData.charity === charity
                          ? 'border-pink-500 bg-pink-500'
                          : 'border-gray-400'
                      }`}>
                        {formData.charity === charity && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="font-medium text-white">
                        {charity}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Asset Selection */}
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-500/20 p-2 rounded-lg">
                  <SargamIcon name="coins" size={20} color="#60a5fa" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Pool Assets
                </h2>
              </div>
              
              <div className="space-y-3">
                {assetOptions.map((asset) => (
                  <label
                    key={asset.code}
                    className={`border rounded-lg p-4 cursor-pointer transition-all flex items-center space-x-4 ${
                      formData.assets.includes(asset.code)
                        ? 'border-blue-500 bg-blue-500/20'
                        : 'border-white/20 hover:border-white/40'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={formData.assets.includes(asset.code)}
                      onChange={() => handleAssetToggle(asset.code)}
                      className="w-4 h-4 text-blue-600 rounded bg-white/10 border-white/20 focus:ring-blue-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-white">
                        {asset.code} - {asset.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {asset.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
              
              <p className="text-sm text-gray-400 mt-4">
                Select the assets that can be deposited into your pool
              </p>
            </div>

            {/* Donation Percentage */}
            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-500/20 p-2 rounded-lg">
                  <SargamIcon name="percent" size={20} color="#a78bfa" />
                </div>
                <h2 className="text-xl font-semibold text-white">
                  Charity Allocation
                </h2>
              </div>
              
              <div>
                <label htmlFor="donationPercentage" className="block text-sm font-medium text-gray-300 mb-4">
                  Percentage of yield to donate: {formData.donationPercentage}%
                </label>
                
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-400">1%</span>
                  <input
                    type="range"
                    id="donationPercentage"
                    name="donationPercentage"
                    min="1"
                    max="50"
                    value={formData.donationPercentage}
                    onChange={handlePercentageChange}
                    className="flex-1 h-2 bg-white/20 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-sm text-gray-400">50%</span>
                </div>
                
                <div className="mt-4 bg-white/10 rounded-lg p-4 border border-white/20">
                  <p className="text-sm text-gray-300">
                    <strong>Impact Preview:</strong> For every $100 in yield generated, 
                    <span className="text-pink-400 font-semibold">
                      {' '}${formData.donationPercentage}
                    </span> will be donated to {formData.charity || 'your selected charity'}, 
                    and you'll keep ${100 - formData.donationPercentage}.
                  </p>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="p-6 bg-white/5 border-t border-white/20">
              <button
                type="submit"
                disabled={isCreatingPool}
                className={`w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 text-lg ${
                  isCreatingPool ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isCreatingPool ? (
                  <div className="flex items-center justify-center space-x-2">
                    <SargamIcon name="loader-2" size={20} color="currentColor" />
                    <span>Creating Pool...</span>
                  </div>
                ) : (
                  'Create ImpactPool'
                )}
              </button>
              
              <p className="text-sm text-gray-400 text-center mt-3">
                This will create a transaction on Stellar Testnet
              </p>
            </div>
          </form>
        </div>

        {/* Info Section */}
        <div className="mt-8 bg-blue-500/20 border border-blue-500/30 rounded-lg p-6">
          <h3 className="font-semibold text-blue-300 mb-2">
            🚀 What happens next?
          </h3>
          <ul className="space-y-2 text-sm text-blue-200">
            <li>• Your ImpactPool will be created on the Stellar Testnet</li>
            <li>• Users can deposit assets and start earning yield</li>
            <li>• A percentage of yield will automatically go to your chosen charity</li>
            <li>• You can track donations and pool performance in real-time</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default CreatePoolPage 